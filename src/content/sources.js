/**
 * Source authenticity and AceBoard's right to publish content are separate
 * facts. An official source can still have unknown or restricted rights.
 * Add reviewed source records here before referencing them from questions.
 *
 * @typedef {Object} ContentSource
 * @property {string} sourceId Stable registry identifier.
 * @property {string|null} organization
 * @property {string} [exam]
 * @property {string} sourceName
 * @property {SourceType} sourceType
 * @property {string|null} [sourceUrl]
 * @property {string|null} [jurisdiction]
 * @property {string|null} [examVersion]
 * @property {string|null} [curriculumVersion]
 * @property {AccessType} accessType
 * @property {RightsStatus} rightsStatus
 * @property {string|null} [permissionEvidence]
 * @property {string} notes
 * @property {boolean} providesPracticeMaterial
 * @property {string|null} [lastVerifiedAt]
 * @property {"active"|"inactive"} status
 *
 * @typedef {"official"|"licensed"|"authorized-provider"|"public-reference"|"aceboard-original"|"ai-generated"|"ai-assisted"|"imported-with-permission"|"unknown-unverified"} SourceType
 * @typedef {"public"|"subscription"|"licensed"|"permissioned"|"internal"|"unknown"} AccessType
 * @typedef {"verified"|"permission-required"|"permission-pending"|"restricted"|"unknown"|"prohibited-for-publication"} RightsStatus
 */

export const SOURCE_TYPES = Object.freeze([
  "official",
  "licensed",
  "authorized-provider",
  "public-reference",
  "aceboard-original",
  "ai-generated",
  "ai-assisted",
  "imported-with-permission",
  "unknown-unverified",
]);

export const ACCESS_TYPES = Object.freeze([
  "public",
  "subscription",
  "licensed",
  "permissioned",
  "internal",
  "unknown",
]);

export const RIGHTS_STATUSES = Object.freeze([
  "verified",
  "permission-required",
  "permission-pending",
  "restricted",
  "unknown",
  "prohibited-for-publication",
]);

/**
 * Existing questions carry source labels but no evidence of origin or rights.
 * Keep that distinction explicit rather than inferring official status.
 * @type {ContentSource[]}
 */
export const CONTENT_SOURCES = [
  {
    sourceId: "college-board-sat-practice",
    organization: "College Board",
    exam: "SAT",
    sourceName: "SAT Suite practice resources",
    sourceType: "official",
    sourceUrl: "https://satsuite.collegeboard.org/practice/practice-tests",
    jurisdiction: "United States",
    examVersion: "Digital SAT",
    curriculumVersion: null,
    accessType: "public",
    rightsStatus: "permission-required",
    permissionEvidence: null,
    providesPracticeMaterial: true,
    notes: "College Board provides official digital and paper practice tests. Official source status does not grant AceBoard republication rights.",
    lastVerifiedAt: "2026-10-07",
    status: "active",
  },
  {
    sourceId: "act-official-practice",
    organization: "ACT, Inc.",
    exam: "ACT",
    sourceName: "ACT official free practice and test preparation",
    sourceType: "official",
    sourceUrl: "https://www.act.org/content/act/en/products-and-services/the-act/test-preparation/free-act-test-prep.html",
    jurisdiction: "United States",
    examVersion: null,
    curriculumVersion: null,
    accessType: "public",
    rightsStatus: "permission-required",
    permissionEvidence: null,
    providesPracticeMaterial: true,
    notes: "ACT provides sample questions and full-length practice tests. Materials are references only; reuse requires separate rights clearance.",
    lastVerifiedAt: "2026-10-07",
    status: "active",
  },
  {
    sourceId: "cambridge-igcse-support",
    organization: "Cambridge International Education",
    exam: "IGCSE",
    sourceName: "Cambridge IGCSE classroom support and exam preparation materials",
    sourceType: "official",
    sourceUrl: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-upper-secondary/cambridge-igcse/classroom-support/",
    jurisdiction: "International",
    examVersion: null,
    curriculumVersion: null,
    accessType: "public",
    rightsStatus: "permission-required",
    permissionEvidence: null,
    providesPracticeMaterial: true,
    notes: "The public page describes past question papers and other exam preparation materials; some resources may require School Support Hub access. Neither availability nor official status grants republication rights.",
    lastVerifiedAt: "2026-10-07",
    status: "active",
  },
  {
    sourceId: "ielts-official-sample-tests",
    organization: "IELTS partners (British Council, IDP, and Cambridge English)",
    exam: "IELTS",
    sourceName: "IELTS sample test questions and practice papers",
    sourceType: "official",
    sourceUrl: "https://ielts.org/take-a-test/preparation-resources/sample-test-questions",
    jurisdiction: "International",
    examVersion: null,
    curriculumVersion: null,
    accessType: "public",
    rightsStatus: "permission-required",
    permissionEvidence: null,
    providesPracticeMaterial: true,
    notes: "IELTS partners provide official sample questions and practice materials. Materials are references only; reuse requires separate rights clearance.",
    lastVerifiedAt: "2026-10-07",
    status: "active",
  },
  {
    sourceId: "waec-official-e-learning",
    organization: "West African Examinations Council",
    exam: "WAEC",
    sourceName: "WAEC e-Learning",
    sourceType: "official",
    sourceUrl: "https://www.waeconline.org.ng/e-Learning/index.htm",
    jurisdiction: "West Africa",
    examVersion: null,
    curriculumVersion: null,
    accessType: "public",
    rightsStatus: "permission-required",
    permissionEvidence: null,
    providesPracticeMaterial: true,
    notes: "WAEC's e-Learning site provides exam-related question and performance resources. Official availability does not establish AceBoard republication rights.",
    lastVerifiedAt: "2026-10-07",
    status: "active",
  },
  {
    sourceId: "neco-official-exam-resources",
    organization: "National Examinations Council",
    exam: "NECO",
    sourceName: "NECO official examination information and downloads",
    sourceType: "official",
    sourceUrl: "https://neco.gov.ng/",
    jurisdiction: "Nigeria",
    examVersion: null,
    curriculumVersion: null,
    accessType: "public",
    rightsStatus: "unknown",
    permissionEvidence: null,
    providesPracticeMaterial: false,
    notes: "The official site provides exam information, guidelines, syllabuses, and documents; this record does not assert that public practice questions are available for reuse.",
    lastVerifiedAt: "2026-10-07",
    status: "active",
  },
  {
    sourceId: "jamb-ibass-e-syllabus",
    organization: "Joint Admissions and Matriculation Board",
    exam: "JAMB",
    sourceName: "JAMB Integrated Brochure and Syllabus System (IBASS)",
    sourceType: "official",
    sourceUrl: "https://ibass.jamb.gov.ng/e-syllabus",
    jurisdiction: "Nigeria",
    examVersion: "UTME",
    curriculumVersion: null,
    accessType: "public",
    rightsStatus: "unknown",
    permissionEvidence: null,
    providesPracticeMaterial: false,
    notes: "IBASS provides official subject syllabuses and exam information. This entry is a curriculum reference and does not grant rights to reuse exam questions.",
    lastVerifiedAt: "2026-10-07",
    status: "active",
  },
  {
    sourceId: "aceboard-original-content",
    organization: "AceBoard",
    exam: null,
    sourceName: "AceBoard original authored content",
    sourceType: "aceboard-original",
    sourceUrl: null,
    jurisdiction: null,
    examVersion: null,
    curriculumVersion: null,
    accessType: "internal",
    rightsStatus: "unknown",
    permissionEvidence: null,
    providesPracticeMaterial: false,
    notes: "Source category only. Verify authorship and publication rights for each item before approving it; do not use as a generic source for imported or third-party material.",
    lastVerifiedAt: null,
    status: "active",
  },
  {
    sourceId: "aceboard-ai-assisted-authoring",
    organization: "AceBoard",
    exam: null,
    sourceName: "AceBoard AI-assisted content authoring",
    sourceType: "ai-assisted",
    sourceUrl: null,
    jurisdiction: null,
    examVersion: null,
    curriculumVersion: null,
    accessType: "internal",
    rightsStatus: "unknown",
    permissionEvidence: null,
    providesPracticeMaterial: false,
    notes: "Record the specific model, author, reviewer, and rights decision on each question. AI assistance alone does not establish publication rights.",
    lastVerifiedAt: null,
    status: "active",
  },
  {
    sourceId: "legacy-jamb-physics-2019",
    organization: null,
    exam: "JAMB",
    sourceName: "JAMB Physics 2019 (legacy source label)",
    sourceType: "unknown-unverified",
    sourceUrl: null,
    jurisdiction: "Nigeria",
    examVersion: null,
    curriculumVersion: null,
    accessType: "unknown",
    rightsStatus: "unknown",
    permissionEvidence: null,
    notes: "The existing question records contain JAMB Physics 2019 source labels. The originating organization, source authenticity, and AceBoard publication rights have not been independently verified.",
    providesPracticeMaterial: true,
    lastVerifiedAt: null,
    status: "active",
  },
];

export const CONTENT_SOURCES_BY_ID = new Map(
  CONTENT_SOURCES.map((source) => [source.sourceId, source])
);

/** Validate registry records without mutating them. */
export function validateContentSources(sources = CONTENT_SOURCES) {
  const errors = [];
  const warnings = [];
  const seen = new Set();

  if (!Array.isArray(sources)) {
    return { valid: false, errors: [{ index: null, sourceId: null, field: "sources", message: "Expected an array of content sources." }], warnings };
  }

  sources.forEach((source, index) => {
    const addError = (field, message) => errors.push({ index, sourceId: source?.sourceId ?? null, field, message });
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      addError("source", "Expected a source object.");
      return;
    }
    if (typeof source.sourceId !== "string" || !source.sourceId.trim()) addError("sourceId", "Source ID is required.");
    else if (seen.has(source.sourceId)) addError("sourceId", "Duplicate source ID.");
    else seen.add(source.sourceId);

    for (const key of ["sourceName", "notes"]) {
      if (typeof source[key] !== "string" || !source[key].trim()) addError(key, `${key} is required.`);
    }
    if (source.organization != null && (typeof source.organization !== "string" || !source.organization.trim())) addError("organization", "Organization must be a non-empty string when supplied.");
    if (!SOURCE_TYPES.includes(source.sourceType)) addError("sourceType", `Source type must be one of: ${SOURCE_TYPES.join(", ")}.`);
    if (!ACCESS_TYPES.includes(source.accessType)) addError("accessType", `Access type must be one of: ${ACCESS_TYPES.join(", ")}.`);
    if (!RIGHTS_STATUSES.includes(source.rightsStatus)) addError("rightsStatus", `Rights status must be one of: ${RIGHTS_STATUSES.join(", ")}.`);
    if (!(source.status === "active" || source.status === "inactive")) addError("status", "Status must be active or inactive.");

    for (const key of ["exam", "sourceUrl", "jurisdiction", "examVersion", "curriculumVersion", "permissionEvidence"]) {
      if (source[key] != null && (typeof source[key] !== "string" || !source[key].trim())) addError(key, `${key} must be a non-empty string when supplied.`);
    }
    if (source.sourceUrl != null) {
      try {
        const url = new URL(source.sourceUrl);
        if (!new Set(["http:", "https:"]).has(url.protocol)) addError("sourceUrl", "Source URL must use HTTP or HTTPS.");
      } catch {
        addError("sourceUrl", "Source URL must be a valid absolute URL.");
      }
    }
    if (source.lastVerifiedAt != null && (typeof source.lastVerifiedAt !== "string" || Number.isNaN(Date.parse(source.lastVerifiedAt)))) {
      addError("lastVerifiedAt", "Last verified date must be a valid date string.");
    }
    if (source.rightsStatus === "verified" && !source.permissionEvidence) {
      addError("permissionEvidence", "Verified publication rights require a permission or rights evidence reference.");
    }
    if (source.sourceType === "official" && source.organization == null) {
      addError("organization", "An official source must identify its source organization; this does not establish publication rights.");
    }
    if (typeof source.providesPracticeMaterial !== "boolean") addError("providesPracticeMaterial", "providesPracticeMaterial must be true or false.");
    if (source.rightsStatus !== "verified" && source.status === "active") {
      warnings.push({ index, sourceId: source.sourceId, field: "rightsStatus", message: "Source is active for reference but its content is not cleared for publication." });
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Rights/provenance portion of the publication gate. Full publication checks
 * (including schema and lifecycle state) are exposed through
 * `assessQuestionPublication` in validation.js. `sourceType` alone (including
 * `official`) never grants publication permission.
 */
export function canPublishQuestion(question, sourcesById = CONTENT_SOURCES_BY_ID) {
  const reasons = [];
  const provenance = question?.provenance;
  const sourceId = provenance?.sourceId;
  const source = sourceId ? sourcesById.get(sourceId) : null;
  const registryValidation = validateContentSources([...new Set(sourcesById.values())]);
  if (!registryValidation.valid) reasons.push("Content source registry contains validation errors.");

  if (!provenance || typeof provenance !== "object" || Array.isArray(provenance)) reasons.push("Question provenance is required.");
  if (typeof provenance?.createdBy !== "string" || !provenance.createdBy.trim()) reasons.push("Creator attribution or an explicit unknown value is required.");
  if (typeof provenance?.acquisitionMethod !== "string" || !provenance.acquisitionMethod.trim()) reasons.push("Acquisition method is required.");
  if (!source) reasons.push("Question must reference a registered content source.");
  else {
    if (source.status !== "active") reasons.push("Content source is inactive.");
    if (source.rightsStatus !== "verified") reasons.push("Source publication rights are not verified.");
    if (source.sourceType !== "aceboard-original" && !provenance?.attribution) reasons.push("Source attribution is required.");
  }
  if (question?.rightsStatus !== "verified") reasons.push("Question publication rights are not verified.");
  if (!["permitted", "licensed", "public-domain"].includes(question?.contentRights)) {
    reasons.push("Question content-rights status is missing or not cleared for publication.");
  }
  if (["ai-generated", "ai-assisted-human-authored"].includes(provenance?.kind)) {
    if (typeof question?.humanReviewedAt !== "string" || Number.isNaN(Date.parse(question.humanReviewedAt))) {
      reasons.push("AI-created content needs a recorded human review date before publication.");
    }
    if (!provenance?.humanReviewer) reasons.push("AI-created content needs a recorded human reviewer before publication.");
  }

  return { allowed: reasons.length === 0, reasons, source: source ?? null };
}
