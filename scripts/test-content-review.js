import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { QUESTIONS, RELEASE_QUESTIONS, RELEASE_QUESTION_IDS, LEGACY_QUESTIONS } from "../src/content/index.js";
import { fingerprintReviewQuestion, getReviewableReleaseQuestions, materializePublishedQuestion } from "../src/content/review.js";
import { getPracticeEligibleQuestions } from "../src/platform/workspace.js";

const require = createRequire(import.meta.url);
const { prepareQuestionReview, fingerprintReviewQuestion: serverFingerprint } = require("../functions/contentReviewLogic.js");
const candidate = RELEASE_QUESTIONS[0];
assert.equal(RELEASE_QUESTIONS.length, 77);
assert.equal(new Set(RELEASE_QUESTION_IDS).size, 77);
assert.equal(getReviewableReleaseQuestions(QUESTIONS).length, 77);
assert.equal(LEGACY_QUESTIONS.length, 40);
assert.equal(LEGACY_QUESTIONS.every((question) => question.rightsStatus !== "verified"), true);
assert.equal(fingerprintReviewQuestion(candidate), serverFingerprint(candidate), "client and server must fingerprint the same review content");
assert.equal(getPracticeEligibleQuestions(QUESTIONS).length, 0, "draft and legacy records stay out of practice without explicit review");

const deniedApproval = prepareQuestionReview({ action: "approve", question: candidate, questionId: candidate.id, reviewer: "reviewer-1", now: new Date("2026-10-08T10:00:00.000Z") });
assert.equal(deniedApproval.valid, false, "rights approval requires an explicit reviewer attestation");
assert.match(deniedApproval.errors.join(" "), /explicitly confirm/);

const approved = prepareQuestionReview({ action: "approve", question: candidate, questionId: candidate.id, reviewer: "reviewer-1", confirmOriginalRights: true, notes: "Content and original-work status checked.", now: new Date("2026-10-08T10:00:00.000Z") });
assert.equal(approved.valid, true);
assert.equal(approved.record.rightsStatus, "verified");
assert.equal(approved.record.contentRights, "permitted");
assert.equal(approved.record.publicationStatus, "approved");

const notYetPublished = materializePublishedQuestion(candidate, { ...approved.record, reviewId: candidate.id });
assert.equal(notYetPublished, null, "approved but unpublished content cannot enter student practice");
const published = prepareQuestionReview({ action: "publish", question: candidate, questionId: candidate.id, current: approved.record, reviewer: "reviewer-1", now: new Date("2026-10-08T10:05:00.000Z") });
assert.equal(published.valid, true);
const decision = { ...published.record, reviewId: candidate.id };
const materialized = materializePublishedQuestion(candidate, decision);
assert.ok(materialized);
assert.equal(materialized.id, candidate.id);
assert.equal(materialized.provenance.humanReviewer, "reviewer-1");
assert.equal(materialized.provenance.permissionReference, candidate.id);
assert.equal(getPracticeEligibleQuestions(QUESTIONS, [decision]).some((question) => question.id === candidate.id), true);

const changedAfterReview = { ...candidate, explanation: `${candidate.explanation} changed` };
assert.equal(materializePublishedQuestion(changedAfterReview, decision), null, "review cannot be reused after content changes");
assert.equal(materializePublishedQuestion({ ...candidate, difficulty: "Hard" }, decision), null, "review includes difficulty and study metadata");

const rejected = prepareQuestionReview({ action: "reject", question: candidate, questionId: candidate.id, reviewer: "reviewer-1", now: new Date("2026-10-08T10:10:00.000Z") });
assert.equal(rejected.valid, true);
assert.equal(rejected.record.publicationStatus, "archived");
assert.equal(materializePublishedQuestion(candidate, rejected.record), null);

console.log("Content review tests passed: explicit approval, separate publication, rights attestation, fingerprint integrity, and legacy isolation.");
