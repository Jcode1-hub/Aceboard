import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { EXAM_LIST, EXAM_REGISTRY, getExamConfig } from "../src/exams/registry.js";
import { LESSONS } from "../src/learning/catalog.js";
import { buildSyllabusProgress, getExamPracticeAvailability, getPracticeEligibleQuestions, lessonsFor, validateOfficialSatResult } from "../src/platform/workspace.js";
import { ACEBOARD_STARTER_QUESTIONS, LEGACY_QUESTIONS, QUESTIONS, validateQuestionRecords } from "../src/content/index.js";
import { createSatSession, decideAceBoardRoute, restoreSatSession, serializeSatSession, SAT_MODULES } from "../src/sat/session.js";
const require = createRequire(import.meta.url);
const { validateChallengeDefinition, scoreChallenge, publicChallenge, rankAttempts, getLeaderboardScopeKeys } = require("../functions/challengeLogic.js");

for (const id of ["JAMB", "WAEC", "NECO", "IGCSE", "SAT", "ACT", "IELTS"]) {
  assert.ok(getExamConfig(id), `${id} registry entry exists`);
}
assert.equal(EXAM_LIST.filter((exam) => exam.id !== "GCE").length, 7);
assert.equal(EXAM_REGISTRY.SAT.adaptive, true);
assert.match(EXAM_REGISTRY.SAT.timingModel, /32-minute/);
assert.equal(LESSONS.length, 32);
assert.deepEqual(new Set(LESSONS.map((item) => item.exam)), new Set(["JAMB", "WAEC", "NECO", "IGCSE", "SAT", "ACT", "IELTS"]));
assert.ok(LESSONS.every((item) => item.publicationStatus === "needs-review" && item.provenance.kind === "ai-generated"));
for (const [exam, subjects] of Object.entries({ JAMB: ["Use of English", "Mathematics", "Physics", "Chemistry", "Biology"], WAEC: ["English Language", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Government"], NECO: ["English Language", "Mathematics", "Physics", "Chemistry", "Biology"], IGCSE: ["Mathematics", "English", "Biology", "Chemistry", "Physics"], SAT: ["Reading and Writing", "Math"], ACT: ["English", "Math", "Reading", "Science"], IELTS: ["Listening", "Reading", "Writing", "Speaking"] })) {
  for (const subject of subjects) assert.ok(LESSONS.some((item) => item.exam === exam && item.subject === subject), `Starter learning covers ${exam} ${subject}`);
}
assert.equal(LEGACY_QUESTIONS.length, 40);
assert.equal(ACEBOARD_STARTER_QUESTIONS.length, 96);
assert.equal(QUESTIONS.length, 136);
assert.equal(ACEBOARD_STARTER_QUESTIONS.filter((question) => question.exam === "SAT").length, 6);
assert.ok(ACEBOARD_STARTER_QUESTIONS.every((question) => question.provenance.kind === "aceboard-original" && question.publicationStatus === "needs-review"));
assert.equal(validateQuestionRecords(ACEBOARD_STARTER_QUESTIONS).valid, true);
assert.equal(getPracticeEligibleQuestions(QUESTIONS).length, 0, "No content is practice-eligible until rights and publication gates pass");
assert.equal(getExamPracticeAvailability("JAMB", QUESTIONS).total, 0);
assert.equal(getExamPracticeAvailability("SAT", QUESTIONS).total, 0);
assert.equal(lessonsFor("IELTS").length, 4);
assert.equal(buildSyllabusProgress(LESSONS, {})[0].state, "not-started");
assert.equal(buildSyllabusProgress(LESSONS, { [LESSONS[0].id]: { startedAt: 1 } })[0].state, "in-progress");
assert.equal(buildSyllabusProgress(LESSONS, { [LESSONS[0].id]: { completedAt: 2 } })[0].state, "in-progress");
assert.equal(buildSyllabusProgress(LESSONS, { [LESSONS[0].id]: { mastery: "mastered" } })[0].state, "mastered");

const official = validateOfficialSatResult({ testName: "Practice 1", dateTaken: "2026-10-01", totalScore: 1300, readingWritingScore: 650, mathScore: 650, notes: "" });
assert.equal(official.valid, true);
assert.equal(validateOfficialSatResult({ testName: "Practice 1", dateTaken: "2026-10-01", totalScore: 1400, readingWritingScore: 650, mathScore: 650 }).valid, false);
assert.equal(validateOfficialSatResult({ testName: "", dateTaken: "bad", totalScore: 1900, readingWritingScore: 1900, mathScore: 0 }).valid, false);

assert.equal(SAT_MODULES.length, 4);
assert.equal(SAT_MODULES[0].durationSeconds, 1920);
assert.equal(SAT_MODULES[2].durationSeconds, 2100);
assert.equal(decideAceBoardRoute({ correct: 7, total: 10 }).route, "higher-challenge");
assert.equal(decideAceBoardRoute({ correct: 6, total: 10 }).route, "standard");
assert.equal(decideAceBoardRoute({ correct: 0, total: 0 }).basis, "insufficient-data");
const session = createSatSession({ testFormId: "local-form", practiceTest: 1, questionIds: ["q1"], now: 1000 });
session.phase = "quiz";
session.remainingSeconds = 100;
session.responses.q1 = 2;
session.markedQuestionIds.push("q1");
session.routeDecisions["reading-writing"] = { route: "standard" };
const serialized = serializeSatSession(session);
const restored = restoreSatSession({ ...serialized, updatedAt: 5000 }, { now: 8000 });
assert.equal(restored.remainingSeconds, 97);
assert.deepEqual(restored.responses, { q1: 2 });
assert.deepEqual(restored.markedQuestionIds, ["q1"]);
assert.deepEqual(restored.routeDecisions, { "reading-writing": { route: "standard" } });
assert.equal(restoreSatSession({ currentModuleIndex: 9, schemaVersion: 1 }), null);

const challenge = {
  title: "Original Algebra Check", exam: "JAMB", subject: "Mathematics", status: "active", publicationStatus: "published",
  startsAt: { toMillis: () => 1 }, endsAt: { toMillis: () => 9999999999999 }, durationSeconds: 600,
  questions: [{ id: "ace-original-q1", questionType: "mcq", question: "Choose the correct value.", options: ["2", "3"], answer: 1, rightsStatus: "verified", contentRights: "permitted", publicationStatus: "published", provenance: { kind: "aceboard-original", sourceId: "aceboard-original-content", sourceRightsStatus: "verified", createdBy: "AceBoard" }, humanReviewedAt: "2026-10-01", humanReviewer: "reviewer" }],
};
assert.deepEqual(validateChallengeDefinition(challenge), []);
assert.deepEqual(scoreChallenge(challenge, { "ace-original-q1": 1 }), { valid: true, correct: 1, total: 1, answered: 1, unanswered: 0, score: 100 });
assert.equal(scoreChallenge(challenge, { "unknown-id": 1 }).valid, false);
assert.ok(validateChallengeDefinition({ ...challenge, questions: [{ ...challenge.questions[0], rightsStatus: "unknown" }] }).length > 0);
assert.ok(validateChallengeDefinition({ ...challenge, questions: [ACEBOARD_STARTER_QUESTIONS[0]] }).length > 0, "Unreviewed starter content cannot seed a challenge");
assert.equal(Object.hasOwn(publicChallenge(challenge, "sample").questions[0], "answer"), false);
assert.equal(rankAttempts([{ displayName: "A", points: 2 }, { displayName: "B", points: 3 }])[0].displayName, "B");
assert.ok(getLeaderboardScopeKeys(challenge).includes("global"));

console.log("Platform foundation checks passed: exam registry, syllabus progress, content availability, official SAT result validation and SAT session restoration.");
