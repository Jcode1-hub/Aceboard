import { jambPhysicsQuestions } from "./exams/jamb/physics.js";
import { getQuestionType } from "./schema.js";
import { CONTENT_SOURCES_BY_ID } from "./sources.js";
export { CONTENT_RIGHTS_STATES, CONTENT_STATES, CONTENT_STATE_TRANSITIONS, PROVENANCE_ACQUISITION_METHODS, PROVENANCE_KINDS, PUBLICATION_STATES, QUESTION_TYPES, canTransitionContentState, getQuestionText, getQuestionType } from "./schema.js";
export { ACCESS_TYPES, CONTENT_SOURCES, CONTENT_SOURCES_BY_ID, RIGHTS_STATUSES, SOURCE_TYPES, validateContentSources } from "./sources.js";
export { assessQuestionPublication, validateQuestionRecords } from "./validation.js";
export { INGESTION_STAGES, validateAcquisitionRecord } from "./ingestion.js";

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
    sourceId: "legacy-jamb-physics-2019",
    sourceItemId: question.source,
    sourceName: "JAMB Physics 2019",
    createdBy: "unknown/unverified",
    acquisitionMethod: "legacy-unverified",
    lastReviewedAt: null,
    attribution: question.source,
  },
  contentRights: question.contentRights ?? "review-required",
  rightsStatus: question.rightsStatus ?? "unknown",
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
    question?.rightsStatus,
    question?.provenance?.sourceName,
    question?.provenance?.sourceItemId,
    question?.provenance?.sourceType,
    question?.provenance?.attribution,
    question?.provenance?.createdBy,
    ...(CONTENT_SOURCES_BY_ID.has(question?.provenance?.sourceId)
      ? [
          CONTENT_SOURCES_BY_ID.get(question.provenance.sourceId).organization,
          CONTENT_SOURCES_BY_ID.get(question.provenance.sourceId).sourceName,
          CONTENT_SOURCES_BY_ID.get(question.provenance.sourceId).sourceType,
          CONTENT_SOURCES_BY_ID.get(question.provenance.sourceId).rightsStatus,
        ]
      : []),
    ...(Array.isArray(question?.tags) ? question.tags : []),
    question?.learningObjective,
  ].filter(Boolean).join(" "));
}

// Precompute this small derived index once; it is not persisted and can later be
// replaced by an indexed search implementation without changing question data.
export const QUESTION_SEARCH_TEXT_BY_ID = new Map(
  QUESTIONS.map((question) => [question.id, buildQuestionSearchText(question)])
);
