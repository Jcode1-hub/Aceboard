import {
  CONTENT_RIGHTS_STATES,
  PROVENANCE_KINDS,
  PUBLICATION_STATES,
  QUESTION_TYPES,
  getQuestionType,
} from "./schema.js";

const DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const TYPES = new Set(QUESTION_TYPES);
const PROVENANCE = new Set(PROVENANCE_KINDS);
const RIGHTS = new Set(CONTENT_RIGHTS_STATES);
const PUBLICATION = new Set(PUBLICATION_STATES);
const AI_PROVENANCE = new Set(["ai-generated", "ai-assisted-human-authored"]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidDate(value) {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

function isScalarAnswer(value) {
  return (typeof value === "string" && value.trim() !== "") ||
    (typeof value === "number" && Number.isFinite(value));
}

function isOptionIndex(value, options) {
  return Number.isInteger(value) && value >= 0 && value < options.length;
}

function add(errors, index, id, field, message) {
  errors.push({ index, id: id ?? null, field, message });
}

/**
 * Validate a batch without mutating or repairing it.
 * Returns actionable field-level errors and non-blocking warnings.
 */
export function validateQuestionRecords(records, { requireTopic = true } = {}) {
  const errors = [];
  const warnings = [];
  const seenIds = new Map();

  if (!Array.isArray(records)) {
    return { valid: false, errors: [{ index: null, id: null, field: "questions", message: "Expected an array of question records." }], warnings };
  }

  records.forEach((question, index) => {
    if (!question || typeof question !== "object" || Array.isArray(question)) {
      add(errors, index, null, "question", "Expected a question object.");
      return;
    }

    const { id } = question;
    if (!((typeof id === "string" && id.trim()) || (typeof id === "number" && Number.isFinite(id)))) {
      add(errors, index, id, "id", "Question ID is required and must be a non-empty string or finite number.");
    } else if (seenIds.has(id)) {
      add(errors, index, id, "id", `Duplicate question ID; first used at record ${seenIds.get(id) + 1}.`);
    } else {
      seenIds.set(id, index);
    }

    if (!isNonEmptyString(question.exam)) add(errors, index, id, "exam", "Exam is required.");
    if (!isNonEmptyString(question.subject)) add(errors, index, id, "subject", "Subject is required.");
    if (requireTopic && !isNonEmptyString(question.topic)) add(errors, index, id, "topic", "Topic is required.");
    if (!isNonEmptyString(question.question) && !isNonEmptyString(question.stem)) {
      add(errors, index, id, "question", "Question text or stem is required.");
    }
    if (!isNonEmptyString(question.explanation)) add(errors, index, id, "explanation", "Explanation is required.");

    if (question.difficulty != null && !DIFFICULTIES.has(question.difficulty)) {
      add(errors, index, id, "difficulty", "Difficulty must be Easy, Medium, or Hard when supplied.");
    }

    const type = getQuestionType(question);
    if (!type || !TYPES.has(type)) {
      add(errors, index, id, "questionType", `Unsupported or missing question type: ${String(type ?? "<missing>")}.`);
    } else if (type === "mcq") {
      if (!Array.isArray(question.options) || question.options.length < 2 || question.options.some((option) => !isNonEmptyString(option))) {
        add(errors, index, id, "options", "MCQ questions need at least two non-empty options.");
      } else if (!(isOptionIndex(question.answer, question.options) ||
        (typeof question.answer === "string" && question.options.includes(question.answer)))) {
        add(errors, index, id, "answer", "MCQ answer must identify one of the available options.");
      }
    } else if (type === "multipleSelect") {
      if (!Array.isArray(question.options) || question.options.length < 2 || question.options.some((option) => !isNonEmptyString(option))) {
        add(errors, index, id, "options", "Multiple-select questions need at least two non-empty options.");
      } else if (!Array.isArray(question.answer) || question.answer.length < 1 ||
        question.answer.some((answer) => !isOptionIndex(answer, question.options)) ||
        new Set(question.answer).size !== question.answer.length) {
        add(errors, index, id, "answer", "Multiple-select answer must contain unique valid option indexes.");
      }
    } else if (type === "numeric" || type === "gridIn") {
      if (!isScalarAnswer(question.answer)) {
        add(errors, index, id, "answer", "Numeric/grid-in questions need a finite numeric or non-empty string answer.");
      }
      if (question.options != null && (!Array.isArray(question.options) || question.options.length !== 0)) {
        add(errors, index, id, "options", "Numeric/grid-in questions should not define MCQ options.");
      }
      if (question.answerTolerance != null &&
        (typeof question.answerTolerance !== "number" || !Number.isFinite(question.answerTolerance) || question.answerTolerance < 0)) {
        add(errors, index, id, "answerTolerance", "Answer tolerance must be a non-negative finite number.");
      }
      if (question.acceptedAnswers != null &&
        (!Array.isArray(question.acceptedAnswers) || question.acceptedAnswers.some((answer) => !isScalarAnswer(answer)))) {
        add(errors, index, id, "acceptedAnswers", "Accepted answers must be an array of non-empty strings or finite numbers.");
      }
    } else if (type === "trueFalse" && typeof question.answer !== "boolean") {
      add(errors, index, id, "answer", "True/false answers must be boolean.");
    } else if (["shortAnswer", "constructedResponse"].includes(type) && !isNonEmptyString(question.answer)) {
      add(errors, index, id, "answer", "Short-answer and constructed-response records need a non-empty reference answer.");
    } else if (["matching", "essay"].includes(type) && question.answer == null) {
      add(errors, index, id, "answer", `${type} questions need a reference answer or rubric.`);
    }

    for (const key of ["examVersion", "module", "section", "subtopic", "skill", "learningObjective", "source", "passage", "image"]) {
      if (question[key] != null && !isNonEmptyString(question[key])) {
        add(errors, index, id, key, `${key} must be a non-empty string when supplied.`);
      }
    }
    if (question.year != null && !(Number.isInteger(question.year) || (typeof question.year === "string" && /^\d{4}$/.test(question.year)))) {
      add(errors, index, id, "year", "Year must be an integer or a four-digit string.");
    }
    if (question.practiceTest != null && (!Number.isInteger(question.practiceTest) || question.practiceTest < 1)) {
      add(errors, index, id, "practiceTest", "Practice test number must be a positive integer.");
    }
    if (question.sourceId != null && !((typeof question.sourceId === "string" && question.sourceId.trim()) ||
      (typeof question.sourceId === "number" && Number.isFinite(question.sourceId)))) {
      add(errors, index, id, "sourceId", "Source ID must be a non-empty string or finite number.");
    }
    if (question.tags != null && (!Array.isArray(question.tags) || question.tags.some((tag) => !isNonEmptyString(tag)))) {
      add(errors, index, id, "tags", "Tags must be an array of non-empty strings.");
    }
    if (!Number.isInteger(question.revision) || question.revision < 1) {
      add(errors, index, id, "revision", "Revision must be a positive integer; keep the stable ID across revisions.");
    }

    const provenance = question.provenance;
    if (!provenance || typeof provenance !== "object" || Array.isArray(provenance)) {
      add(errors, index, id, "provenance", "Provenance object is required.");
    } else {
      if (!PROVENANCE.has(provenance.kind)) {
        add(errors, index, id, "provenance.kind", `Unsupported provenance kind: ${String(provenance.kind ?? "<missing>")}.`);
      }
      for (const key of ["sourceId", "sourceName", "licenseId", "licenseName", "permissionReference", "attribution", "model", "humanAuthor", "humanReviewer"]) {
        if (provenance[key] != null && !isNonEmptyString(provenance[key])) {
          add(errors, index, id, `provenance.${key}`, `${key} must be a non-empty string when supplied.`);
        }
      }
      if (provenance.kind === "official" && !provenance.sourceId && !provenance.sourceName) {
        add(errors, index, id, "provenance", "Official provenance requires a source ID or source name.");
      }
      if (provenance.kind === "licensed" && !provenance.licenseId && !provenance.licenseName) {
        add(errors, index, id, "provenance", "Licensed provenance requires a license ID or license name.");
      }
      if (provenance.kind === "imported-with-permission" && !provenance.permissionReference) {
        add(errors, index, id, "provenance", "Permission-based imports require a permission reference.");
      }
      if (provenance.kind === "ai-generated" && !provenance.model) {
        add(errors, index, id, "provenance.model", "AI-generated content requires the generating model to be recorded.");
      }
      if (provenance.kind === "ai-assisted-human-authored" && !provenance.humanAuthor) {
        add(errors, index, id, "provenance.humanAuthor", "AI-assisted human-authored content requires its human author to be recorded.");
      }
    }

    if (!RIGHTS.has(question.contentRights)) {
      add(errors, index, id, "contentRights", `Content rights must be one of: ${CONTENT_RIGHTS_STATES.join(", ")}.`);
    }
    if (!PUBLICATION.has(question.publicationStatus)) {
      add(errors, index, id, "publicationStatus", `Publication status must be one of: ${PUBLICATION_STATES.join(", ")}.`);
    }
    if (AI_PROVENANCE.has(provenance?.kind) && question.publicationStatus === "published" && !isValidDate(question.humanReviewedAt)) {
      add(errors, index, id, "humanReviewedAt", "AI-created content needs a recorded human review date before publication.");
    }
    if (question.createdAt != null && !isValidDate(question.createdAt)) add(errors, index, id, "createdAt", "createdAt must be a valid date string.");
    if (question.updatedAt != null && !isValidDate(question.updatedAt)) add(errors, index, id, "updatedAt", "updatedAt must be a valid date string.");
    if (isValidDate(question.createdAt) && isValidDate(question.updatedAt) && Date.parse(question.updatedAt) < Date.parse(question.createdAt)) {
      add(errors, index, id, "updatedAt", "updatedAt cannot be earlier than createdAt.");
    }

    if (question.contentRights === "review-required" && question.publicationStatus === "published") {
      warnings.push({ index, id, field: "contentRights", message: "Published legacy content still needs rights review." });
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}
