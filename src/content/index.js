import { jambPhysicsQuestions } from "./exams/jamb/physics.js";
import { getQuestionType } from "./schema.js";
export { CONTENT_RIGHTS_STATES, PROVENANCE_KINDS, PUBLICATION_STATES, QUESTION_TYPES, getQuestionText, getQuestionType } from "./schema.js";
export { validateQuestionRecords } from "./validation.js";

// The old JAMB records predate structured provenance and revision metadata.
// Preserve their source fields and content while explicitly flagging unknown
// rights; do not imply the questions are official or licensed.
export const QUESTIONS = jambPhysicsQuestions.map((question) => ({
  ...question,
  questionType: getQuestionType(question),
  sourceId: question.sourceId ?? question.source,
  revision: question.revision ?? 1,
  provenance: question.provenance ?? {
    kind: "legacy-unverified",
    sourceId: question.source,
    sourceName: "JAMB Physics 2019",
  },
  contentRights: question.contentRights ?? "review-required",
  publicationStatus: question.publicationStatus ?? "published",
}));

/** Normalize searchable fields without changing the canonical question. */
export function normalizeQuestionSearchText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Derived plain-text representation; canonical question records remain intact. */
export function buildQuestionSearchText(question) {
  return normalizeQuestionSearchText([
    question?.exam,
    question?.examVersion,
    question?.year,
    question?.subject,
    question?.topic,
    question?.subtopic,
    question?.skill,
    question?.question,
    question?.stem,
    question?.passage,
    ...(Array.isArray(question?.options) ? question.options : []),
    question?.source,
    question?.sourceId,
    ...(Array.isArray(question?.tags) ? question.tags : []),
    question?.learningObjective,
  ].filter(Boolean).join(" "));
}

// Precompute this small derived index once; it is not persisted and can later be
// replaced by an indexed search implementation without changing question data.
export const QUESTION_SEARCH_TEXT_BY_ID = new Map(
  QUESTIONS.map((question) => [question.id, buildQuestionSearchText(question)])
);
