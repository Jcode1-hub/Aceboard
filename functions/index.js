const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const Anthropic = require("@anthropic-ai/sdk");
const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { validateChallengeDefinition, scoreChallenge, publicChallenge, rankAttempts, getLeaderboardScopeKeys } = require("./challengeLogic");
const { prepareQuestionReview, fingerprintReviewQuestion } = require("./contentReviewLogic");

if (!admin.apps.length) admin.initializeApp();
const firestore = admin.firestore();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

exports.aiStudyCoach = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Use POST" });
    }

    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' in request body" });
    }

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system:
          "You are the AceBoard AI Study Coach — a friendly, encouraging tutor for Nigerian secondary school students preparing for WAEC, NECO, JAMB, GCE, IGCSE, SAT, ACT, and IELTS. Give specific, practical, exam-relevant advice. Keep responses concise and actionable.",
        messages: [{ role: "user", content: message }],
      });

      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      return res.status(200).json({ text });
    } catch (err) {
      console.error("aiStudyCoach error:", err);
      return res.status(500).json({ error: "AI request failed" });
    }
  });
});

function requireStudent(request) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Sign in to use challenges.");
  return request.auth.uid;
}

function safeName(value) {
  const name = String(value || "Learner").replace(/[\r\n<>]/g, " ").trim().slice(0, 48);
  return name || "Learner";
}

function isScheduledNow(challenge, now) {
  return challenge.publicationStatus === "published" && challenge.status === "active" &&
    challenge.startsAt?.toMillis?.() <= now && challenge.endsAt?.toMillis?.() > now;
}

exports.getActiveChallenges = onCall(async (request) => {
  requireStudent(request);
  const snapshot = await firestore.collection("challenges").where("publicationStatus", "==", "published").limit(50).get();
  const now = Date.now();
  return { challenges: snapshot.docs.filter((doc) => isScheduledNow(doc.data(), now) && validateChallengeDefinition(doc.data()).length === 0).map((doc) => publicChallenge(doc.data(), doc.id)) };
});

exports.publishChallenge = onCall(async (request) => {
  const uid = requireStudent(request);
  if (request.auth.token.admin !== true) throw new HttpsError("permission-denied", "Only a trusted content administrator can publish challenges.");
  const challengeId = String(request.data?.challengeId || "");
  const challenge = request.data?.challenge;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(challengeId)) throw new HttpsError("invalid-argument", "A valid challenge ID is required.");
  const record = { ...challenge, status: "active", publicationStatus: "published", publishedBy: uid, publishedAt: admin.firestore.FieldValue.serverTimestamp() };
  const errors = validateChallengeDefinition(record);
  if (errors.length) throw new HttpsError("invalid-argument", errors.join(" "));
  const ref = firestore.collection("challenges").doc(challengeId);
  await firestore.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists) throw new HttpsError("already-exists", "Challenge IDs are immutable. Use a new ID for a revised event.");
    transaction.create(ref, { ...record, questionIds: record.questions.map((question) => question.id) });
  });
  return { challengeId, status: "published" };
});

exports.startChallenge = onCall(async (request) => {
  const uid = requireStudent(request);
  const challengeId = String(request.data?.challengeId || "");
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(challengeId)) throw new HttpsError("invalid-argument", "A valid challenge ID is required.");
  const challengeRef = firestore.collection("challenges").doc(challengeId);
  const sessionRef = firestore.collection("challengeSessions").doc(`${challengeId}_${uid}`);
  const attemptRef = firestore.collection("challengeAttempts").doc(`${challengeId}_${uid}`);
  const now = Date.now();
  const session = await firestore.runTransaction(async (transaction) => {
    const [challengeSnap, sessionSnap, attemptSnap] = await Promise.all([transaction.get(challengeRef), transaction.get(sessionRef), transaction.get(attemptRef)]);
    if (!challengeSnap.exists) throw new HttpsError("not-found", "This challenge is unavailable.");
    const challenge = challengeSnap.data();
    if (validateChallengeDefinition(challenge).length || !isScheduledNow(challenge, now)) throw new HttpsError("failed-precondition", "This challenge is not open for attempts.");
    if (attemptSnap.exists) throw new HttpsError("already-exists", "This challenge has already been submitted.");
    if (sessionSnap.exists) {
      const existing = sessionSnap.data();
      if (existing.status !== "active" || now > existing.expiresAt.toMillis() + 30000) throw new HttpsError("deadline-exceeded", "The challenge session has expired.");
      return existing;
    }
    const startedAt = admin.firestore.Timestamp.fromMillis(now);
    const value = { uid, challengeId, status: "active", startedAt, expiresAt: admin.firestore.Timestamp.fromMillis(now + challenge.durationSeconds * 1000), durationSeconds: challenge.durationSeconds };
    transaction.create(sessionRef, value);
    return value;
  });
  const challenge = (await challengeRef.get()).data();
  return { session: { challengeId, startedAt: session.startedAt.toMillis(), expiresAt: session.expiresAt.toMillis() }, challenge: publicChallenge(challenge, challengeId) };
});

exports.submitChallengeAttempt = onCall(async (request) => {
  const uid = requireStudent(request);
  const challengeId = String(request.data?.challengeId || "");
  const responses = request.data?.responses;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(challengeId) || !responses || typeof responses !== "object" || Array.isArray(responses) || Object.keys(responses).length > 50) throw new HttpsError("invalid-argument", "Challenge responses are malformed.");
  const challengeRef = firestore.collection("challenges").doc(challengeId);
  const sessionRef = firestore.collection("challengeSessions").doc(`${challengeId}_${uid}`);
  const attemptRef = firestore.collection("challengeAttempts").doc(`${challengeId}_${uid}`);
  const userRef = firestore.collection("users").doc(uid);
  const now = Date.now();
  return firestore.runTransaction(async (transaction) => {
    const [challengeSnap, sessionSnap, attemptSnap, userSnap] = await Promise.all([transaction.get(challengeRef), transaction.get(sessionRef), transaction.get(attemptRef), transaction.get(userRef)]);
    if (!challengeSnap.exists || !sessionSnap.exists) throw new HttpsError("failed-precondition", "Start this challenge before submitting it.");
    if (attemptSnap.exists) {
      const prior = attemptSnap.data();
      return { alreadySubmitted: true, result: { score: prior.score, correct: prior.correct, total: prior.total, durationSeconds: prior.durationSeconds, completedAt: prior.completedAt.toMillis() } };
    }
    const challenge = challengeSnap.data();
    const session = sessionSnap.data();
    if (session.status !== "active" || now > session.expiresAt.toMillis() + 30000) throw new HttpsError("deadline-exceeded", "The challenge session has expired.");
    const scoring = scoreChallenge(challenge, responses);
    if (!scoring.valid) throw new HttpsError("invalid-argument", scoring.errors.join(" "));
    const durationSeconds = Math.max(0, Math.min(session.durationSeconds, Math.floor((now - session.startedAt.toMillis()) / 1000)));
    const profile = userSnap.exists ? userSnap.data() : {};
    const displayName = safeName(profile.displayName || profile.name || request.auth.token.name);
    const completedAt = admin.firestore.Timestamp.fromMillis(now);
    const result = { challengeId, uid, displayName, exam: challenge.exam, subject: challenge.subject || null, score: scoring.score, correct: scoring.correct, total: scoring.total, answered: scoring.answered, unanswered: scoring.unanswered, durationSeconds, completedAt };
    const rankRefs = getLeaderboardScopeKeys(challenge, new Date(now)).map((key) => firestore.collection("leaderboards").doc(encodeURIComponent(key)).collection("entries").doc(uid));
    const rankSnaps = await Promise.all(rankRefs.map((ref) => transaction.get(ref)));
    transaction.create(attemptRef, result);
    transaction.update(sessionRef, { status: "submitted", submittedAt: completedAt });
    rankRefs.forEach((ref, index) => {
      const prior = rankSnaps[index].exists ? rankSnaps[index].data() : { points: 0, completedCount: 0, bestScore: 0, bestDurationSeconds: null };
      const better = scoring.score > prior.bestScore || (scoring.score === prior.bestScore && (prior.bestDurationSeconds == null || durationSeconds < prior.bestDurationSeconds));
      transaction.set(ref, {
        uid, displayName, exam: challenge.exam, subject: challenge.subject || null,
        points: (prior.points || 0) + scoring.score,
        completedCount: (prior.completedCount || 0) + 1,
        bestScore: Math.max(prior.bestScore || 0, scoring.score),
        bestDurationSeconds: better ? durationSeconds : prior.bestDurationSeconds,
        updatedAt: completedAt,
      }, { merge: true });
    });
    return { alreadySubmitted: false, result: { score: result.score, correct: result.correct, total: result.total, answered: result.answered, unanswered: result.unanswered, durationSeconds, completedAt: now } };
  });
});

exports.getChallengeLeaderboard = onCall(async (request) => {
  requireStudent(request);
  const scope = String(request.data?.scope || "global");
  if (!/^(global|exam:[A-Z0-9_-]+|subject:[A-Z0-9_-]+:[A-Za-z0-9 _-]+|daily:\d{4}-\d{2}-\d{2}|weekly:\d{4}-W\d{2})$/.test(scope)) throw new HttpsError("invalid-argument", "Leaderboard scope is invalid.");
  const snapshot = await firestore.collection("leaderboards").doc(encodeURIComponent(scope)).collection("entries").orderBy("points", "desc").limit(100).get();
  const entries = rankAttempts(snapshot.docs.map((doc) => doc.data()).map(({ uid, ...entry }) => entry));
  return { scope, entries: entries.map(({ displayName, points, completedCount, bestScore }) => ({ displayName: safeName(displayName), points, completedCount, bestScore })) };
});

function requireContentAdmin(request) {
  const uid = requireStudent(request);
  if (request.auth.token.admin !== true) throw new HttpsError("permission-denied", "A trusted content administrator role is required.");
  return uid;
}

exports.getQuestionReviewState = onCall(async (request) => {
  requireContentAdmin(request);
  const snapshot = await firestore.collection("contentReviews").limit(200).get();
  return { reviews: snapshot.docs.map((doc) => ({ questionId: doc.id, ...doc.data() })) };
});

exports.getPublishedQuestionManifest = onCall(async (request) => {
  requireStudent(request);
  const snapshot = await firestore.collection("contentReviews").where("publicationStatus", "==", "published").limit(200).get();
  return { questions: snapshot.docs.filter((doc) => doc.data().reviewOutcome === "approved" && doc.data().rightsStatus === "verified" && doc.data().contentRights === "permitted").map((doc) => {
    const { questionFingerprint, questionId, reviewOutcome, publicationStatus, rightsStatus, contentRights, rightsEvidence, reviewer, reviewedAt, sourceId } = doc.data();
    return { questionId: questionId || doc.id, questionFingerprint, reviewOutcome, publicationStatus, rightsStatus, contentRights, rightsEvidence, reviewer, reviewedAt, sourceId, reviewId: doc.id };
  }) };
});

exports.recordQuestionReview = onCall(async (request) => {
  const uid = requireContentAdmin(request);
  const { action, question, questionId, notes, confirmOriginalRights } = request.data || {};
  const id = String(questionId || "");
  if (!/^ab-(jamb|waec|neco|igcse|sat|act|ielts)-[a-z0-9-]+-\d{2}$/.test(id)) throw new HttpsError("invalid-argument", "Only a stable AceBoard starter question ID can be reviewed.");
  const ref = firestore.collection("contentReviews").doc(id);
  const reviewer = safeName(request.auth.token.name || uid);
  return firestore.runTransaction(async (transaction) => {
    const currentSnapshot = await transaction.get(ref);
    const current = currentSnapshot.exists ? currentSnapshot.data() : null;
    const prepared = prepareQuestionReview({ action, question, questionId: id, current, reviewer, notes, confirmOriginalRights });
    if (!prepared.valid) throw new HttpsError("failed-precondition", prepared.errors.join(" "));
    transaction.set(ref, { ...prepared.record, updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedBy: uid });
    return { questionId: id, reviewOutcome: prepared.record.reviewOutcome, publicationStatus: prepared.record.publicationStatus };
  });
});

exports.createDailyChallenge = onCall(async (request) => {
  const uid = requireContentAdmin(request);
  const questionIds = request.data?.questionIds;
  const questions = request.data?.questions;
  if (!Array.isArray(questionIds) || questionIds.length < 5 || questionIds.length > 10 || !Array.isArray(questions) || questions.length !== questionIds.length || new Set(questionIds).size !== questionIds.length) {
    throw new HttpsError("invalid-argument", "Select 5–10 distinct published questions for the daily challenge.");
  }
  const id = `daily-${new Date().toISOString().slice(0, 10)}`;
  const start = Date.now();
  const startsAt = admin.firestore.Timestamp.fromMillis(start);
  const endsAt = admin.firestore.Timestamp.fromMillis(start + 24 * 60 * 60 * 1000);
  const docs = await Promise.all(questionIds.map((questionId) => firestore.collection("contentReviews").doc(String(questionId)).get()));
  if (docs.some((doc) => !doc.exists || doc.data().publicationStatus !== "published" || doc.data().reviewOutcome !== "approved" || doc.data().rightsStatus !== "verified" || doc.data().contentRights !== "permitted")) {
    throw new HttpsError("failed-precondition", "Every selected question must have a published content and rights review.");
  }
  const publishedQuestions = questions.map((question, index) => {
    const review = docs[index].data();
    if (question.id !== questionIds[index] || fingerprintReviewQuestion(question) !== review.questionFingerprint) {
      throw new HttpsError("failed-precondition", `Question ${questionIds[index]} changed after review.`);
    }
    return question;
  });
  const exams = new Set(publishedQuestions.map((question) => question.exam));
  const subjects = new Set(publishedQuestions.map((question) => question.subject));
  if (exams.size !== 1) throw new HttpsError("invalid-argument", "A daily challenge must use questions from one exam.");
  const challenge = { title: "AceBoard Daily Challenge", description: "A short daily set using reviewed AceBoard-original questions.", exam: publishedQuestions[0].exam, ...(subjects.size === 1 ? { subject: publishedQuestions[0].subject } : {}), challengeType: "daily", startsAt, endsAt, durationSeconds: 15 * 60, scoringMode: "correct-count", questions: publishedQuestions, status: "active", publicationStatus: "published" };
  const errors = validateChallengeDefinition(challenge);
  if (errors.length) throw new HttpsError("failed-precondition", errors.join(" "));
  const ref = firestore.collection("challenges").doc(id);
  await firestore.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists) throw new HttpsError("already-exists", "Today's Daily Challenge has already been created.");
    transaction.create(ref, { ...challenge, questionIds, publishedBy: uid, publishedAt: admin.firestore.FieldValue.serverTimestamp() });
  });
  return { challengeId: id, status: "published" };
});
