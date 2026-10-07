import assert from "node:assert/strict";
import {
  CONTENT_SOURCES_BY_ID,
  assessQuestionPublication,
  canTransitionContentState,
  validateAcquisitionRecord,
  validateQuestionRecords,
} from "../src/content/index.js";

const originalSourceId = "aceboard-original-content";
const licensedSourceId = "fixture-licensed-source";
const aiSourceId = "fixture-ai-source";

const licensedSource = {
  sourceId: licensedSourceId,
  organization: "Example Licensor",
  exam: "JAMB",
  sourceName: "Example licensed question source",
  sourceType: "licensed",
  sourceUrl: "https://example.test/license",
  jurisdiction: "Nigeria",
  examVersion: null,
  curriculumVersion: null,
  accessType: "licensed",
  rightsStatus: "verified",
  permissionEvidence: "contract:example-license-1",
  providesPracticeMaterial: true,
  notes: "Fixture used by local governance tests only.",
  lastVerifiedAt: "2026-10-07",
  status: "active",
};
const aiSource = {
  sourceId: aiSourceId,
  organization: "AceBoard",
  exam: "JAMB",
  sourceName: "AceBoard AI generation fixture",
  sourceType: "ai-generated",
  sourceUrl: null,
  jurisdiction: "Nigeria",
  examVersion: null,
  curriculumVersion: null,
  accessType: "internal",
  rightsStatus: "verified",
  permissionEvidence: "reviewed-output-rights:fixture-1",
  providesPracticeMaterial: false,
  notes: "Fixture used by local governance tests only.",
  lastVerifiedAt: "2026-10-07",
  status: "active",
};
const testSources = new Map(CONTENT_SOURCES_BY_ID);
testSources.set(originalSourceId, {
  ...CONTENT_SOURCES_BY_ID.get(originalSourceId),
  rightsStatus: "verified",
  permissionEvidence: "creator-identity-and-originality:fixture-1",
});
testSources.set(licensedSourceId, licensedSource);
testSources.set(aiSourceId, aiSource);

function question(overrides = {}) {
  return {
    id: "governance-fixture-1",
    exam: "JAMB",
    year: 2026,
    subject: "Physics",
    topic: "Mechanics",
    difficulty: "Medium",
    questionType: "mcq",
    question: "Which quantity is measured in newtons?",
    options: ["Force", "Energy"],
    answer: 0,
    explanation: "A newton is the SI unit of force.",
    revision: 1,
    contentRights: "permitted",
    rightsStatus: "verified",
    publicationStatus: "approved",
    provenance: {
      kind: "aceboard-original",
      sourceId: originalSourceId,
      sourceItemId: "governance-fixture-1",
      sourceName: "AceBoard original authoring",
      createdBy: "content-governance-test",
      acquisitionMethod: "original-authorship",
      attribution: "AceBoard original",
      lastReviewedAt: "2026-10-07",
    },
    ...overrides,
  };
}

// 1. Valid AceBoard-original question can be published after approval.
assert.equal(assessQuestionPublication(question(), { sourcesById: testSources }).allowed, true);

// 2. An official organization is authentic, but unknown reuse rights block publishing.
const jambOfficial = question({
  contentRights: "unknown",
  rightsStatus: "unknown",
  provenance: {
    kind: "official",
    sourceId: "jamb-ibass-e-syllabus",
    sourceName: "JAMB IBASS",
    sourceItemId: "test-item",
    createdBy: "unknown/unverified",
    acquisitionMethod: "public-reference",
    attribution: "JAMB IBASS",
    lastReviewedAt: null,
  },
});
const officialAssessment = assessQuestionPublication(jambOfficial);
assert.equal(officialAssessment.allowed, false);
assert.ok(officialAssessment.reasons.some((reason) => reason.includes("rights are not verified")));
const unattributedOfficial = assessQuestionPublication({
  ...jambOfficial,
  rightsStatus: "verified",
  contentRights: "permitted",
  provenance: { ...jambOfficial.provenance, attribution: undefined },
});
assert.ok(unattributedOfficial.reasons.some((reason) => reason.includes("attribution")));

// 3. A licensed item with documented permission and verified rights is eligible.
const licensed = question({
  contentRights: "licensed",
  provenance: {
    kind: "licensed",
    sourceId: licensedSourceId,
    sourceName: licensedSource.sourceName,
    sourceItemId: "license-item-42",
    licenseId: "example-license-1",
    licenseName: "Example license",
    createdBy: "licensed-provider",
    acquisitionMethod: "licensed-delivery",
    attribution: "Example Licensor",
    lastReviewedAt: "2026-10-07",
  },
});
assert.equal(assessQuestionPublication(licensed, { sourcesById: testSources }).allowed, true);

// 4. AI-generated content without documented human review is blocked.
const aiQuestion = question({
  provenance: {
    kind: "ai-generated",
    sourceId: aiSourceId,
    sourceName: aiSource.sourceName,
    sourceItemId: "model-output-1",
    model: "test-model",
    createdBy: "content-governance-test",
    acquisitionMethod: "ai-generation",
    attribution: "AceBoard AI-generated; reviewed prior to release",
    lastReviewedAt: null,
  },
});
const unreviewedAiAssessment = assessQuestionPublication(aiQuestion, { sourcesById: testSources });
assert.equal(unreviewedAiAssessment.allowed, false);
assert.ok(unreviewedAiAssessment.reasons.some((reason) => reason.includes("human review date")));

// 5. AI-generated content with reviewer identity and review date is eligible.
const reviewedAi = question({
  humanReviewedAt: "2026-10-07",
  provenance: { ...aiQuestion.provenance, humanReviewer: "reviewer-1", lastReviewedAt: "2026-10-07" },
});
assert.equal(assessQuestionPublication(reviewedAi, { sourcesById: testSources }).allowed, true);

// 6. Missing provenance is a schema error and blocks publication.
const missingProvenance = question({ provenance: undefined });
const missingAssessment = assessQuestionPublication(missingProvenance, { sourcesById: testSources });
assert.equal(missingAssessment.allowed, false);
assert.ok(missingAssessment.reasons.some((reason) => reason.includes("provenance")));

// 7. A prohibited source blocks publication even if a question claims clearance.
const prohibitedSource = { ...licensedSource, sourceId: "fixture-prohibited-source", rightsStatus: "prohibited-for-publication" };
const prohibitedSources = new Map(testSources);
prohibitedSources.set(prohibitedSource.sourceId, prohibitedSource);
const prohibited = question({
  provenance: { ...licensed.provenance, sourceId: prohibitedSource.sourceId },
});
assert.equal(assessQuestionPublication(prohibited, { sourcesById: prohibitedSources }).allowed, false);

// 8. Duplicate stable IDs invalidate both records for publication.
const duplicateBatch = [question({ id: "duplicate-id" }), question({ id: "duplicate-id" })];
const duplicateResult = validateQuestionRecords(duplicateBatch, { sourcesById: testSources });
assert.equal(duplicateResult.valid, false);
assert.ok(duplicateResult.publicationChecks.every((check) => check.allowed === false));

assert.equal(canTransitionContentState("approved", "published"), false);
assert.equal(canTransitionContentState("approved", "published", { publicationAllowed: true }), true);
assert.equal(validateAcquisitionRecord({
  sourceId: originalSourceId,
  acquisitionMethod: "original-authorship",
  acquiredAt: "2026-10-07T00:00:00Z",
  acquiredBy: "content-governance-test",
}, { sourcesById: testSources }).valid, true);

console.log("Content governance checks passed (8 publication scenarios plus lifecycle/acquisition checks).");
