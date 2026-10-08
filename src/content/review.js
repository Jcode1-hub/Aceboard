import { CONTENT_SOURCES_BY_ID } from "./sources.js";
import { assessQuestionPublication } from "./validation.js";
import { RELEASE_QUESTION_IDS } from "./exams/aceboard-original-starter.js";

function reviewFields(question) {
  return [question.id, question.exam, question.examVersion, question.year || "", question.subject, question.topic,
    question.subtopic || "", question.skill || "", question.difficulty, question.questionType,
    question.question || question.stem || "", question.passage || "", question.options || null,
    question.answer, question.explanation, question.section || question.module || "", question.source || "",
    question.sourceId || "", question.provenance?.kind, question.provenance?.sourceId,
    question.provenance?.sourceItemId || "", question.provenance?.createdBy,
    question.provenance?.acquisitionMethod || "", question.tags || [], question.learningObjective || "",
    question.revision || question.version || 1];
}

export function fingerprintReviewQuestion(question) {
  const input = JSON.stringify(reviewFields(question));
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function getReviewableReleaseQuestions(questions) {
  const releaseIds = new Set(RELEASE_QUESTION_IDS);
  return questions.filter((question) => releaseIds.has(question.id) &&
    question.provenance?.kind === "aceboard-original" && question.publicationStatus === "needs-review");
}

export function materializePublishedQuestion(question, decision) {
  if (!question || !decision || decision.publicationStatus !== "published" ||
      decision.reviewOutcome !== "approved" || decision.rightsStatus !== "verified" ||
      decision.contentRights !== "permitted" || !decision.reviewedAt || !decision.reviewer ||
      !decision.rightsEvidence || fingerprintReviewQuestion(question) !== decision.questionFingerprint) return null;

  const source = CONTENT_SOURCES_BY_ID.get(question.provenance?.sourceId);
  if (!source || source.sourceType !== "aceboard-original") return null;
  const reviewedSource = { ...source, rightsStatus: "verified", permissionEvidence: decision.rightsEvidence };
  const sourcesById = new Map(CONTENT_SOURCES_BY_ID);
  sourcesById.set(reviewedSource.sourceId, reviewedSource);
  const reviewed = {
    ...question,
    rightsStatus: "verified",
    contentRights: "permitted",
    publicationStatus: "published",
    humanReviewedAt: decision.reviewedAt,
    provenance: {
      ...question.provenance,
      humanReviewer: decision.reviewer,
      sourceRightsStatus: "verified",
      permissionReference: decision.reviewId,
    },
  };
  return assessQuestionPublication(reviewed, { sourcesById }).allowed ? reviewed : null;
}

export function materializePublishedQuestions(questions, decisions = []) {
  const byId = new Map(decisions.map((decision) => [decision.questionId, decision]));
  return getReviewableReleaseQuestions(questions)
    .map((question) => materializePublishedQuestion(question, byId.get(question.id)))
    .filter(Boolean);
}
