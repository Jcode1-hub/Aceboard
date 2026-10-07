import { CONTENT_SOURCES_BY_ID } from "./sources.js";
import { PROVENANCE_ACQUISITION_METHODS } from "./schema.js";

/** Ordered contract for future import/generation workflows; no pipeline runs here. */
export const INGESTION_STAGES = Object.freeze([
  "source",
  "acquisition-record",
  "parse",
  "normalize",
  "validate",
  "provenance-assignment",
  "duplicate-check",
  "quality-review",
  "rights-check",
  "approval",
  "publish",
]);

/**
 * @typedef {Object} AcquisitionRecord
 * @property {string} sourceId Registry ID for the source.
 * @property {string} acquisitionMethod
 * @property {string} acquiredAt ISO date/time.
 * @property {string} acquiredBy Person or process identifier.
 * @property {string} [sourceLocator] URL, document identifier, or internal location.
 * @property {string} [permissionEvidence] Reference to permission/licence evidence.
 * @property {string} [batchId] Stable ID for a later import batch.
 * @property {string} [inputChecksum] Optional integrity/deduplication aid.
 * @property {string} [notes]
 */

/** Validate a source acquisition envelope without parsing or importing content. */
export function validateAcquisitionRecord(record, { sourcesById = CONTENT_SOURCES_BY_ID } = {}) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return { valid: false, errors: [{ field: "record", message: "Expected an acquisition record object." }] };
  }
  if (typeof record.sourceId !== "string" || !sourcesById.has(record.sourceId)) {
    add("sourceId", "Acquisition must reference a registered content source.");
  }
  if (!PROVENANCE_ACQUISITION_METHODS.includes(record.acquisitionMethod)) {
    add("acquisitionMethod", `Acquisition method must be one of: ${PROVENANCE_ACQUISITION_METHODS.join(", ")}.`);
  }
  if (typeof record.acquiredBy !== "string" || !record.acquiredBy.trim()) add("acquiredBy", "Acquired-by identifier is required.");
  if (typeof record.acquiredAt !== "string" || Number.isNaN(Date.parse(record.acquiredAt))) add("acquiredAt", "Acquisition date must be valid.");
  for (const key of ["sourceLocator", "permissionEvidence", "batchId", "inputChecksum", "notes"]) {
    if (record[key] != null && (typeof record[key] !== "string" || !record[key].trim())) add(key, `${key} must be a non-empty string when supplied.`);
  }
  const source = typeof record.sourceId === "string" ? sourcesById.get(record.sourceId) : null;
  if (["licensed-delivery", "authorized-provider", "permissioned-import"].includes(record.acquisitionMethod) &&
    !record.permissionEvidence && !source?.permissionEvidence) {
    add("permissionEvidence", "Licensed or permission-based acquisitions need a permission evidence reference.");
  }
  const expectedSourceTypes = {
    "original-authorship": ["aceboard-original"],
    "licensed-delivery": ["licensed"],
    "authorized-provider": ["authorized-provider"],
    "permissioned-import": ["imported-with-permission"],
    "public-reference": ["official", "public-reference"],
    "ai-generation": ["ai-generated"],
    "ai-assistance": ["ai-assisted"],
    "legacy-unverified": ["unknown-unverified"],
  };
  const allowedSourceTypes = expectedSourceTypes[record.acquisitionMethod];
  if (source && allowedSourceTypes && !allowedSourceTypes.includes(source.sourceType)) {
    add("sourceId", `Acquisition method ${record.acquisitionMethod} does not match source type ${source.sourceType}.`);
  }
  return { valid: errors.length === 0, errors };
}
