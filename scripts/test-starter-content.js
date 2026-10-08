import assert from "node:assert/strict";
import { ACEBOARD_STARTER_QUESTIONS, LEGACY_QUESTIONS, QUESTIONS, validateQuestionRecords } from "../src/content/index.js";
import { getPracticeEligibleQuestions } from "../src/platform/workspace.js";

const expected = {
  JAMB: ["Use of English", "Mathematics", "Physics", "Chemistry", "Biology"],
  WAEC: ["English Language", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Government"],
  NECO: ["English Language", "Mathematics", "Physics", "Chemistry", "Biology"],
  IGCSE: ["Mathematics", "English", "Physics", "Chemistry", "Biology"],
  SAT: ["Reading and Writing", "Math"],
  ACT: ["English", "Math", "Reading", "Science"],
  IELTS: ["Reading", "Listening", "Writing", "Speaking"],
};
assert.equal(LEGACY_QUESTIONS.length, 40);
assert.equal(ACEBOARD_STARTER_QUESTIONS.length, 96);
assert.equal(QUESTIONS.length, 136);
assert.equal(new Set(QUESTIONS.map((question) => String(question.id))).size, QUESTIONS.length, "Question IDs are unique");
assert.deepEqual(validateQuestionRecords(ACEBOARD_STARTER_QUESTIONS).errors, []);
for (const [exam, subjects] of Object.entries(expected)) {
  for (const subject of subjects) {
    const rows = ACEBOARD_STARTER_QUESTIONS.filter((question) => question.exam === exam && question.subject === subject);
    assert.equal(rows.length, 3, `${exam} ${subject} has three distinct topic records`);
    assert.equal(new Set(rows.map((question) => question.topic)).size, rows.length, `${exam} ${subject} topics are distinct`);
  }
}
assert.ok(ACEBOARD_STARTER_QUESTIONS.every((question) => question.provenance.kind === "aceboard-original"));
assert.ok(ACEBOARD_STARTER_QUESTIONS.every((question) => question.publicationStatus === "needs-review" && question.rightsStatus === "unknown" && question.contentRights === "review-required"));
assert.ok(ACEBOARD_STARTER_QUESTIONS.every((question) => question.questionType === "mcq" && question.options.length === 4 && Number.isInteger(question.answer) && question.explanation.trim()));
assert.equal(ACEBOARD_STARTER_QUESTIONS.find((question) => question.id === "ab-jamb-mathematics-03").answer, 1);
assert.equal(getPracticeEligibleQuestions(QUESTIONS).length, 0, "Draft and unverified legacy items cannot enter student practice");
console.log("Starter content checks passed: 96 original drafts, all requested exam-subjects covered, IDs/options validated, practice gate remains closed.");
