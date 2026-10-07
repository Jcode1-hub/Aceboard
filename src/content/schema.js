/**
 * Stable identity is `id`; revision changes should increment `revision` while
 * retaining the ID so saved attempts, bookmarks, and reports still resolve.
 *
 * @typedef {"mcq"|"multipleSelect"|"numeric"|"gridIn"|"shortAnswer"|"constructedResponse"|"matching"|"trueFalse"|"essay"} QuestionType
 * @typedef {"official"|"licensed"|"aceboard-original"|"ai-generated"|"ai-assisted-human-authored"|"imported-with-permission"|"legacy-unverified"} ProvenanceKind
 * @typedef {Object} QuestionProvenance
 * @property {ProvenanceKind} kind
 * @property {string} [sourceId]
 * @property {string} [sourceItemId]
 * @property {string} [sourceName]
 * @property {string} createdBy Person or process identifier; use an explicit unknown value when unavailable.
 * @property {ProvenanceAcquisitionMethod} acquisitionMethod
 * @property {string|null} lastReviewedAt
 * @property {string} [licenseId]
 * @property {string} [licenseName]
 * @property {string} [permissionReference]
 * @property {string} [attribution]
 * @property {string} [model]
 * @property {string} [humanAuthor]
 * @property {string} [humanReviewer]
 *
 * @typedef {Object} CanonicalQuestion
 * @property {string|number} id Stable across revisions.
 * @property {string} exam
 * @property {string} subject
 * @property {string} topic
 * @property {string} [examVersion]
 * @property {number|string} [year]
 * @property {string} [subtopic]
 * @property {string} [skill]
 * @property {"Easy"|"Medium"|"Hard"} [difficulty]
 * @property {QuestionType} questionType
 * @property {string} [question] Existing stem field, retained for compatibility.
 * @property {string} [stem]
 * @property {string|null} [passage]
 * @property {string[]|null} [options]
 * @property {*} answer Depends on questionType (option index, scalar, or structure).
 * @property {(number|string)[]} [acceptedAnswers]
 * @property {number} [answerTolerance]
 * @property {string} explanation
 * @property {string} [module]
 * @property {string} [section]
 * @property {string} [source]
 * @property {string|number} [sourceId]
 * @property {"verified"|"permission-required"|"permission-pending"|"restricted"|"unknown"|"prohibited-for-publication"} rightsStatus
 * @property {string} [image]
 * @property {QuestionProvenance} provenance
 * @property {"permitted"|"licensed"|"public-domain"|"review-required"|"restricted"|"unknown"} contentRights
 * @property {"draft"|"validation-failed"|"needs-review"|"approved"|"published"|"archived"} publicationStatus
 * @property {string[]} [tags]
 * @property {string} [learningObjective]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 * @property {string} [humanReviewedAt]
 * @property {number} revision
 * @typedef {"original-authorship"|"licensed-delivery"|"authorized-provider"|"permissioned-import"|"public-reference"|"manual-entry"|"ai-generation"|"ai-assistance"|"legacy-unverified"} ProvenanceAcquisitionMethod
 */

export const QUESTION_TYPES = Object.freeze([
  "mcq",
  "multipleSelect",
  "numeric",
  "gridIn",
  "shortAnswer",
  "constructedResponse",
  "matching",
  "trueFalse",
  "essay",
]);

export const PROVENANCE_KINDS = Object.freeze([
  "official",
  "licensed",
  "aceboard-original",
  "ai-generated",
  "ai-assisted-human-authored",
  "imported-with-permission",
  "legacy-unverified",
]);

export const CONTENT_RIGHTS_STATES = Object.freeze([
  "permitted",
  "licensed",
  "public-domain",
  "review-required",
  "restricted",
  "unknown",
]);

export const PUBLICATION_STATES = Object.freeze([
  "draft",
  "validation-failed",
  "needs-review",
  "approved",
  "published",
  "archived",
]);
export const CONTENT_STATES = PUBLICATION_STATES;

export const PROVENANCE_ACQUISITION_METHODS = Object.freeze([
  "original-authorship",
  "licensed-delivery",
  "authorized-provider",
  "permissioned-import",
  "public-reference",
  "manual-entry",
  "ai-generation",
  "ai-assistance",
  "legacy-unverified",
]);

export const CONTENT_STATE_TRANSITIONS = Object.freeze({
  draft: ["validation-failed", "needs-review", "archived"],
  "validation-failed": ["draft", "needs-review", "archived"],
  "needs-review": ["draft", "approved", "archived"],
  approved: ["needs-review", "published", "archived"],
  published: ["archived"],
  archived: [],
});

export function canTransitionContentState(from, to, { publicationAllowed = false } = {}) {
  if (to === "published" && !publicationAllowed) return false;
  return CONTENT_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Resolve canonical records and the legacy `answerType` alias. */
export function getQuestionType(question) {
  if (question?.questionType) return question.questionType;
  if (question?.answerType) return question.answerType;
  return Array.isArray(question?.options) ? "mcq" : undefined;
}

export function getQuestionText(question) {
  return question?.question ?? question?.stem ?? "";
}
