import { QUESTIONS, normalizeQuestionSearchText } from "./index.js";
import { CONTENT_SOURCES_BY_ID } from "./sources.js";
import { PROVENANCE_ACQUISITION_METHODS, getQuestionType } from "./schema.js";
import { assessQuestionPublication, validateQuestionRecords } from "./validation.js";

export const CONTENT_IMPORTER_VERSION = "1.0.0";

/** Explicit CSV contract: column names are canonical fields, except answerType. */
export const CSV_QUESTION_FIELDS = Object.freeze([
  "id", "exam", "examVersion", "year", "subject", "topic", "subtopic", "skill",
  "difficulty", "questionType", "answerType", "question", "stem", "passage", "options",
  "answer", "acceptedAnswers", "answerTolerance", "explanation", "module", "section",
  "source", "sourceId", "provenance", "contentRights", "rightsStatus", "publicationStatus",
  "tags", "learningObjective", "image", "practiceTest", "createdAt", "updatedAt",
  "humanReviewedAt", "revision",
]);

const CSV_FIELD_SET = new Set(CSV_QUESTION_FIELDS);
const CSV_JSON_FIELDS = new Set(["options", "answer", "acceptedAnswers", "provenance", "tags"]);
const CSV_NUMBER_FIELDS = new Set(["year", "answerTolerance", "practiceTest", "revision"]);
const STRING_FIELDS = [
  "exam", "examVersion", "subject", "topic", "subtopic", "skill", "difficulty",
  "questionType", "answerType", "question", "stem", "passage", "explanation", "module",
  "section", "source", "sourceId", "contentRights", "rightsStatus", "publicationStatus",
  "learningObjective", "image", "createdAt", "updatedAt", "humanReviewedAt",
];
const OPTIONAL_EMPTY_FIELDS = new Set([
  "examVersion", "subtopic", "skill", "passage", "module", "section", "source", "sourceId",
  "learningObjective", "image", "createdAt", "updatedAt", "humanReviewedAt",
]);
const PROVENANCE_STRING_FIELDS = [
  "sourceId", "sourceItemId", "sourceName", "createdBy", "acquisitionMethod", "lastReviewedAt",
  "licenseId", "licenseName", "permissionReference", "attribution", "model", "humanAuthor", "humanReviewer",
];
const OPTIONAL_PROVENANCE_FIELDS = new Set([
  "sourceItemId", "sourceName", "lastReviewedAt", "licenseId", "licenseName", "permissionReference",
  "attribution", "model", "humanAuthor", "humanReviewer",
]);

const QUESTION_TYPE_ALIASES = new Map([
  ["mcq", "mcq"], ["multiple-choice", "mcq"], ["multiple_choice", "mcq"], ["multiple choice", "mcq"], ["single-choice", "mcq"],
  ["multipleselect", "multipleSelect"], ["multiple-select", "multipleSelect"], ["multiple_select", "multipleSelect"], ["multiple select", "multipleSelect"],
  ["numeric", "numeric"], ["numeric-response", "numeric"], ["numeric_response", "numeric"],
  ["gridin", "gridIn"], ["grid-in", "gridIn"], ["grid_in", "gridIn"],
  ["shortanswer", "shortAnswer"], ["short-answer", "shortAnswer"], ["short_answer", "shortAnswer"],
  ["constructedresponse", "constructedResponse"], ["constructed-response", "constructedResponse"], ["constructed_response", "constructedResponse"],
  ["matching", "matching"], ["truefalse", "trueFalse"], ["true-false", "trueFalse"], ["true_false", "trueFalse"], ["essay", "essay"],
]);

function copyInput(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function csvError(message, line = null) {
  return { line, message };
}

/** Parse RFC-4180-style CSV, including escaped quotes and quoted newlines. */
function readCsvGrid(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  let closedQuote = false;
  let line = 1;
  let rowLine = 1;
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const pushCell = () => { row.push(cell); cell = ""; closedQuote = false; };
  const pushRow = () => {
    pushCell();
    if (row.some((value) => value.trim() !== "")) rows.push({ cells: row, line: rowLine });
    row = [];
    rowLine = line + 1;
  };

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') { cell += '"'; i += 1; }
        else { quoted = false; closedQuote = true; }
      } else {
        cell += char;
        if (char === "\n") line += 1;
        else if (char === "\r" && input[i + 1] !== "\n") line += 1;
      }
      continue;
    }

    if (closedQuote && char !== "," && char !== "\r" && char !== "\n" && char !== " " && char !== "\t") {
      return { rows: [], error: csvError("Unexpected character after a closing CSV quote.", line) };
    }
    if (char === '"') {
      if (cell.trim() !== "" || closedQuote) return { rows: [], error: csvError("A CSV quote may only begin an empty cell.", line) };
      cell = "";
      quoted = true;
    } else if (char === ",") {
      pushCell();
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      pushRow();
      line += 1;
      rowLine = line;
    } else if (!closedQuote) {
      cell += char;
    } else if (char === " " || char === "\t") {
      // Whitespace after a closing quote is ignored as CSV formatting.
    }
  }

  if (quoted) return { rows: [], error: csvError("CSV ended inside a quoted cell.", line) };
  if (cell !== "" || row.length > 0) pushRow();
  return { rows, error: null };
}

function parseCsvCell(field, rawValue) {
  const value = rawValue.trim();
  if (value === "") return { empty: true };
  if (CSV_JSON_FIELDS.has(field)) {
    try { return { value: JSON.parse(value) }; }
    catch { return { error: `Column ${field} must contain a JSON value (for example, [\"A\",\"B\"] for options).` }; }
  }
  if (CSV_NUMBER_FIELDS.has(field)) {
    const number = Number(value);
    if (Number.isFinite(number) && /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(value)) return { value: number };
  }
  return { value: rawValue };
}

/** Parse JSON arrays or `{ "questions": [...] }` without guessing a single record. */
export function parseJsonQuestionInput(text) {
  let parsed;
  try { parsed = JSON.parse(text); }
  catch (error) {
    return { format: "json", rows: [], fileErrors: [csvError(`Invalid JSON: ${error.message}`)], unparsedRecordCount: 0 };
  }
  const records = Array.isArray(parsed) ? parsed : parsed?.questions;
  if (!Array.isArray(records)) {
    return { format: "json", rows: [], fileErrors: [csvError("JSON input must be an array or an object with a questions array.")], unparsedRecordCount: 0 };
  }
  return {
    format: "json",
    rows: records.map((record, index) => ({ record, errors: [], rowNumber: index + 1 })),
    fileErrors: [],
    unparsedRecordCount: 0,
  };
}

/** Parse CSV using exact canonical column names; unknown headers reject each row. */
export function parseCsvQuestionInput(text) {
  const grid = readCsvGrid(String(text ?? ""));
  if (grid.error) return { format: "csv", rows: [], fileErrors: [grid.error], unparsedRecordCount: 0 };
  if (grid.rows.length === 0) return { format: "csv", rows: [], fileErrors: [csvError("CSV input has no header row.")], unparsedRecordCount: 0 };

  const headerRow = grid.rows[0];
  const headers = headerRow.cells.map((header) => header.trim());
  const fileErrors = [];
  const headerCounts = new Map();
  headers.forEach((header) => headerCounts.set(header, (headerCounts.get(header) ?? 0) + 1));
  const duplicateHeaders = [...headerCounts].filter(([, count]) => count > 1).map(([header]) => header);
  if (duplicateHeaders.length) fileErrors.push(csvError(`Duplicate CSV header(s): ${duplicateHeaders.join(", ")}.`, headerRow.line));
  const blankHeader = headers.some((header) => !header);
  if (blankHeader) fileErrors.push(csvError("CSV headers cannot be blank.", headerRow.line));
  const unknownHeaders = headers.filter((header) => header && !CSV_FIELD_SET.has(header));

  const rows = grid.rows.slice(1).map(({ cells, line }, rowIndex) => {
    const record = {};
    const errors = [];
    if (unknownHeaders.length) errors.push(`Unsupported CSV column(s): ${unknownHeaders.join(", ")}.`);
    if (cells.length !== headers.length) errors.push(`Expected ${headers.length} cell(s), found ${cells.length}.`);

    headers.forEach((field, columnIndex) => {
      if (!field || !CSV_FIELD_SET.has(field)) return;
      const raw = cells[columnIndex] ?? "";
      const parsed = parseCsvCell(field, raw);
      if (parsed.error) errors.push(`CSV row ${line}, ${parsed.error}`);
      else if (!parsed.empty) record[field] = parsed.value;
    });

    return { record, errors, rowNumber: line ?? rowIndex + 2 };
  });

  return { format: "csv", rows, fileErrors, unparsedRecordCount: 0 };
}

/** Select format from an explicit argument or filename extension; no content sniffing. */
export function parseQuestionInput(text, { format, filename } = {}) {
  const selectedFormat = format?.toLowerCase() ?? filename?.split(".").at(-1)?.toLowerCase();
  if (selectedFormat === "json") return parseJsonQuestionInput(text);
  if (selectedFormat === "csv") return parseCsvQuestionInput(text);
  return { format: selectedFormat ?? null, rows: [], fileErrors: [csvError("Import format must be explicitly JSON or CSV.")], unparsedRecordCount: 0 };
}

function normaliseString(value, field, warnings, { optional = false } = {}) {
  const lineNormalised = value.replace(/\r\n?/g, "\n");
  const trimmed = lineNormalised.trim();
  if (lineNormalised !== value) warnings.push({ field, message: "Normalized line endings to LF." });
  if (trimmed !== lineNormalised) warnings.push({ field, message: "Trimmed surrounding whitespace." });
  if (["", "null", "n/a", "na"].includes(trimmed.toLowerCase())) {
    if (value !== "") warnings.push({ field, message: "Removed an explicit empty-value marker." });
    return optional ? { remove: true } : { value: "" };
  }
  return { value: trimmed };
}

function canonicalQuestionType(value) {
  if (typeof value !== "string") return value;
  return QUESTION_TYPE_ALIASES.get(value.trim().toLowerCase()) ?? value.trim();
}

/**
 * Normalize only presentation-level differences. Returns the untouched input
 * separately so every dry-run decision can be audited against its source row.
 */
export function normalizeQuestionRecord(input) {
  const original = copyInput(input);
  const warnings = [];
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { original, question: null, warnings, errors: ["Question record must be an object."] };
  }

  const question = copyInput(input);
  for (const field of STRING_FIELDS) {
    if (typeof question[field] !== "string") continue;
    const normalized = normaliseString(question[field], field, warnings, { optional: OPTIONAL_EMPTY_FIELDS.has(field) });
    if (normalized.remove) delete question[field];
    else question[field] = normalized.value;
  }
  for (const field of ["options", "tags", "acceptedAnswers"]) {
    if (!Array.isArray(question[field])) continue;
    question[field] = question[field].map((value, index) => {
      if (typeof value !== "string") return value;
      return normaliseString(value, `${field}[${index}]`, warnings).value;
    });
  }
  if (typeof question.answer === "string") {
    question.answer = normaliseString(question.answer, "answer", warnings).value;
  }

  if (question.provenance && typeof question.provenance === "object" && !Array.isArray(question.provenance)) {
    question.provenance = { ...question.provenance };
    for (const field of PROVENANCE_STRING_FIELDS) {
      if (typeof question.provenance[field] !== "string") continue;
      const normalized = normaliseString(question.provenance[field], `provenance.${field}`, warnings, {
        optional: OPTIONAL_PROVENANCE_FIELDS.has(field),
      });
      if (normalized.remove) delete question.provenance[field];
      else question.provenance[field] = normalized.value;
    }
  }

  const rawType = question.questionType ?? question.answerType;
  if (question.questionType != null && question.answerType != null &&
      canonicalQuestionType(question.questionType) !== canonicalQuestionType(question.answerType)) {
    errors.push("questionType conflicts with legacy answerType; provide one unambiguous value.");
  } else if (rawType != null) {
    const type = canonicalQuestionType(rawType);
    if (type !== rawType || question.questionType == null) warnings.push({ field: "questionType", message: `Mapped explicit question type alias to ${type}.` });
    question.questionType = type;
    delete question.answerType;
  }

  if (question.questionType === "mcq" && typeof question.answer === "string" && Array.isArray(question.options)) {
    const indexText = question.answer.trim();
    if (/^(0|[1-9]\d*)$/.test(indexText) && !question.options.includes(question.answer)) {
      const index = Number(indexText);
      if (index < question.options.length) {
        question.answer = index;
        warnings.push({ field: "answer", message: `Converted unambiguous option index string ${JSON.stringify(indexText)} to a number.` });
      }
    }
  }
  if (["numeric", "gridIn"].includes(question.questionType) && typeof question.answer === "string" &&
      /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(question.answer)) {
    const value = Number(question.answer);
    if (Number.isFinite(value)) {
      question.answer = value;
      warnings.push({ field: "answer", message: "Converted an unambiguous numeric answer string to a number." });
    }
  }

  return { original, question, warnings, errors };
}

/** Stable normalized key from structured question content, never IDs/tokens. */
export function fingerprintQuestionContent(question) {
  if (!question || typeof question !== "object") return null;
  const stem = question.question ?? question.stem;
  if (![question.exam, question.subject, stem].every((value) => typeof value === "string" && value.trim())) return null;
  const normalize = (value) => normalizeQuestionSearchText(value);
  const options = Array.isArray(question.options) ? question.options.map(normalize).sort() : [];
  const material = {
    version: 1,
    exam: normalize(question.exam),
    examVersion: normalize(question.examVersion ?? ""),
    subject: normalize(question.subject),
    topic: normalize(question.topic ?? ""),
    questionType: normalize(getQuestionType(question) ?? ""),
    passage: normalize(question.passage ?? ""),
    stem: normalize(stem),
    options,
  };
  return JSON.stringify(material);
}

function idKey(id) {
  if ((typeof id === "number" && Number.isFinite(id)) || (typeof id === "string" && id.trim())) return String(id).trim();
  return null;
}

function addDuplicate(duplicates, duplicateIndex, duplicateId, duplicateType, against, fingerprint = null) {
  duplicates.push({ index: duplicateIndex, id: duplicateId ?? null, duplicateType, against, fingerprint });
}

function buildDuplicateMap(rows, existingQuestions) {
  const existingIds = new Map();
  const existingFingerprints = new Map();
  existingQuestions.forEach((question, index) => {
    const key = idKey(question?.id);
    if (key != null && !existingIds.has(key)) existingIds.set(key, { id: question.id, catalogIndex: index });
    const fingerprint = fingerprintQuestionContent(question);
    if (fingerprint && !existingFingerprints.has(fingerprint)) existingFingerprints.set(fingerprint, { id: question?.id ?? null, catalogIndex: index });
  });

  const batchIds = new Map();
  const batchFingerprints = new Map();
  rows.forEach(({ question }, index) => {
    const key = idKey(question?.id);
    if (key != null) batchIds.set(key, [...(batchIds.get(key) ?? []), index]);
    const fingerprint = fingerprintQuestionContent(question);
    if (fingerprint) batchFingerprints.set(fingerprint, [...(batchFingerprints.get(fingerprint) ?? []), index]);
  });

  const duplicatesByIndex = new Map();
  const push = (index, item) => duplicatesByIndex.set(index, [...(duplicatesByIndex.get(index) ?? []), item]);
  rows.forEach(({ question }, index) => {
    const key = idKey(question?.id);
    if (key != null && existingIds.has(key)) {
      const against = existingIds.get(key);
      push(index, { duplicateType: "stable-id", against: { scope: "catalog", ...against }, fingerprint: null });
    }
    const duplicateIdRows = key == null ? [] : batchIds.get(key);
    if (duplicateIdRows?.length > 1) {
      const other = duplicateIdRows.find((otherIndex) => otherIndex !== index);
      push(index, { duplicateType: "stable-id", against: { scope: "batch", index: other, id: rows[other]?.question?.id ?? null }, fingerprint: null });
    }

    const fingerprint = fingerprintQuestionContent(question);
    if (fingerprint && existingFingerprints.has(fingerprint)) {
      push(index, { duplicateType: "content", against: { scope: "catalog", ...existingFingerprints.get(fingerprint) }, fingerprint });
    }
    const duplicateContentRows = fingerprint ? batchFingerprints.get(fingerprint) : [];
    if (duplicateContentRows?.length > 1) {
      const other = duplicateContentRows.find((otherIndex) => otherIndex !== index);
      push(index, { duplicateType: "content", against: { scope: "batch", index: other, id: rows[other]?.question?.id ?? null }, fingerprint });
    }
  });
  return duplicatesByIndex;
}

function breakdown(records, getValue) {
  const counts = {};
  for (const record of records) {
    const value = getValue(record) ?? "(missing)";
    const label = String(value).trim() || "(missing)";
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function deriveUniform(values) {
  const defined = [...new Set(values.filter((value) => typeof value === "string" && value.trim()))];
  return defined.length === 1 ? defined[0] : null;
}

function makeManifest({
  filename, sourceId, acquisitionMethod, importedAt, totalRecords, acceptedCount,
  rejectedCount, duplicateCount, publicationBlockedCount, warningCount,
}) {
  const safeName = String(filename ?? "manual-batch").split(/[\\/]/).at(-1).replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = importedAt.replace(/[^0-9TZ]/g, "");
  let validationResult = "validated";
  if (rejectedCount > 0 && acceptedCount > 0) validationResult = "partial";
  else if (rejectedCount > 0) validationResult = "failed";
  else if (publicationBlockedCount > 0) validationResult = "validated-publication-blocked";
  else if (warningCount > 0) validationResult = "validated-with-warnings";

  return {
    importId: `import-${safeName}-${timestamp}`,
    sourceId: sourceId ?? null,
    acquisitionMethod: acquisitionMethod ?? null,
    inputFilename: filename ?? null,
    recordCount: totalRecords,
    importedAt,
    importerVersion: CONTENT_IMPORTER_VERSION,
    validationResult,
    duplicateCount,
    publicationBlockedCount,
    warningCount,
    batchDecision: rejectedCount > 0 ? "reject-entire-batch" : "manual-review-required",
    policy: "dry-run-only",
    writesPerformed: false,
    publicationPerformed: false,
  };
}

/**
 * Validate and report a complete input batch. This function never persists,
 * mutates the catalog, or publishes. `accepted` means individually valid and
 * non-duplicate candidates, not records written to storage.
 */
export function dryRunContentImport(input, {
  existingQuestions = QUESTIONS,
  sourcesById = CONTENT_SOURCES_BY_ID,
  filename = null,
  sourceId = null,
  acquisitionMethod = null,
  importedAt = new Date().toISOString(),
} = {}) {
  const parsed = Array.isArray(input)
    ? { rows: input.map((record, index) => ({ record, errors: [], rowNumber: index + 1 })), fileErrors: [], unparsedRecordCount: 0 }
    : input;
  const sourceRows = Array.isArray(parsed?.rows) ? parsed.rows : [];
  const normalizedRows = sourceRows.map((row, index) => {
    const normalized = normalizeQuestionRecord(row.record);
    return {
      original: normalized.original,
      question: normalized.question,
      rowNumber: row.rowNumber ?? index + 1,
      parseErrors: [...(row.errors ?? [])],
      normalizationErrors: normalized.errors,
      normalizationWarnings: normalized.warnings,
    };
  });

  const duplicatesByIndex = buildDuplicateMap(normalizedRows, existingQuestions);
  const accepted = [];
  const rejected = [];
  const warnings = [];
  const duplicates = [];
  const publicationBlocked = [];
  const outcomes = [];

  normalizedRows.forEach((row, index) => {
    const duplicateItems = duplicatesByIndex.get(index) ?? [];
    for (const duplicate of duplicateItems) {
      addDuplicate(duplicates, index, row.question?.id, duplicate.duplicateType, duplicate.against, duplicate.fingerprint);
    }

    const validation = validateQuestionRecords([row.question], { sourcesById });
    const validationErrors = validation.errors
      .filter((error) => error.index === 0 || error.index === null)
      .map((error) => ({ field: error.field, message: error.message }));
    const rowWarnings = [
      ...row.normalizationWarnings,
      ...validation.warnings.filter((warning) => warning.index === 0).map(({ field, message }) => ({ field, message })),
    ];
    const reasons = [
      ...row.parseErrors.map((message) => ({ field: "csv", message })),
      ...row.normalizationErrors.map((message) => ({ field: "normalization", message })),
      ...validationErrors,
      ...duplicateItems.map((duplicate) => ({
        field: "duplicate",
        message: `${duplicate.duplicateType === "stable-id" ? "Stable ID" : "Question content"} duplicates ${duplicate.against.scope === "catalog" ? "existing catalog record" : `batch row ${duplicate.against.index + 1}`} (ID ${duplicate.against.id ?? "unknown"}).`,
      })),
    ];
    const isRejected = reasons.length > 0;
    const publication = assessQuestionPublication(row.question, { sourcesById });
    const publicationReasons = [...publication.reasons];
    if (duplicateItems.length) publicationReasons.push("Duplicate records must be resolved before publication.");
    const contentFingerprint = fingerprintQuestionContent(row.question);
    const outcome = {
      index,
      rowNumber: row.rowNumber,
      id: row.question?.id ?? null,
      validationStatus: isRejected ? "REJECTED" : rowWarnings.length ? "WARNING" : "VALID",
      accepted: !isRejected,
      publicationBlocked: publicationReasons.length > 0,
      warnings: rowWarnings,
      rejectedReasons: reasons,
      publicationReasons,
      contentFingerprint,
    };
    outcomes.push(outcome);

    for (const warning of rowWarnings) warnings.push({ index, rowNumber: row.rowNumber, id: row.question?.id ?? null, ...warning });
    if (isRejected) rejected.push({ ...outcome, original: row.original, reasons });
    else accepted.push({ ...outcome, question: row.question, original: row.original });
    if (publicationReasons.length) {
      publicationBlocked.push({ index, rowNumber: row.rowNumber, id: row.question?.id ?? null, reasons: publicationReasons });
    }
  });

  const fileErrors = [...(parsed?.fileErrors ?? [])];
  const manifestMetadata = validateImportManifestMetadata({ sourceId, acquisitionMethod }, sourcesById);
  for (const error of manifestMetadata.errors) {
    fileErrors.push({ line: null, message: `Invalid import manifest ${error.field}: ${error.message}` });
  }
  for (const error of fileErrors) {
    rejected.push({ index: null, rowNumber: error.line, id: null, validationStatus: "REJECTED", accepted: false, reasons: [{ field: "input", message: error.message }], original: null });
  }
  const totalRecords = normalizedRows.length + (parsed?.unparsedRecordCount ?? 0);
  const candidateRecords = normalizedRows.map((row) => row.question).filter((question) => question && typeof question === "object");
  const uniformSourceId = deriveUniform(candidateRecords.map((question) => question.provenance?.sourceId));
  const uniformMethod = deriveUniform(candidateRecords.map((question) => question.provenance?.acquisitionMethod));
  const manifest = makeManifest({
    filename,
    sourceId: sourceId ?? uniformSourceId,
    acquisitionMethod: acquisitionMethod ?? uniformMethod,
    importedAt,
    totalRecords,
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    duplicateCount: duplicates.length,
    publicationBlockedCount: publicationBlocked.length,
    warningCount: warnings.length,
  });

  return {
    dryRun: true,
    writesPerformed: false,
    publicationPerformed: false,
    totalRecords,
    validRecords: outcomes.filter((outcome) => outcome.validationStatus !== "REJECTED").length,
    accepted,
    rejected,
    warnings,
    duplicates,
    publicationBlocked,
    fileErrors,
    outcomes,
    manifest,
    breakdowns: {
      exam: breakdown(candidateRecords, (question) => question.exam),
      subject: breakdown(candidateRecords, (question) => question.subject),
      questionType: breakdown(candidateRecords, (question) => getQuestionType(question)),
      provenance: breakdown(candidateRecords, (question) => question.provenance?.kind),
      rightsStatus: breakdown(candidateRecords, (question) => question.rightsStatus),
    },
    batchDecision: manifest.batchDecision,
  };
}

/** Convenience for callers that already have text and know its format. */
export function dryRunQuestionText(text, options = {}) {
  const parsed = parseQuestionInput(text, options);
  return dryRunContentImport(parsed, options);
}

/** Validate an optional manifest source/method without filling missing data. */
export function validateImportManifestMetadata({ sourceId, acquisitionMethod }, sourcesById = CONTENT_SOURCES_BY_ID) {
  const errors = [];
  if (sourceId != null && !sourcesById.has(sourceId)) errors.push({ field: "sourceId", message: `Unknown source ID: ${sourceId}.` });
  if (acquisitionMethod != null && !PROVENANCE_ACQUISITION_METHODS.includes(acquisitionMethod)) {
    errors.push({ field: "acquisitionMethod", message: `Unsupported acquisition method: ${acquisitionMethod}.` });
  }
  return { valid: errors.length === 0, errors };
}
