import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CONTENT_SOURCES_BY_ID, QUESTIONS } from "../src/content/index.js";
import {
  dryRunContentImport,
  fingerprintQuestionContent,
  normalizeQuestionRecord,
  parseCsvQuestionInput,
  parseJsonQuestionInput,
  parseQuestionInput,
  validateImportManifestMetadata,
} from "../src/content/import.js";

const fixtureDir = resolve("tests/fixtures/content-ingestion");
const readFixture = async (name) => readFile(resolve(fixtureDir, name), "utf8");
const questionFixtures = JSON.parse(await readFixture("question-fixtures.json"));
const mixedFixture = JSON.parse(await readFixture("mixed-batch.json"));
const catalogSnapshot = JSON.stringify(QUESTIONS);

const fixtureSource = (sourceId, sourceType, rightsStatus = "verified") => ({
  sourceId,
  organization: "AceBoard test fixtures",
  exam: "JAMB",
  sourceName: `${sourceId} test source`,
  sourceType,
  sourceUrl: null,
  jurisdiction: "Test only",
  examVersion: null,
  curriculumVersion: null,
  accessType: sourceType === "licensed" ? "licensed" : "internal",
  rightsStatus,
  permissionEvidence: rightsStatus === "verified" ? "fixture-only evidence" : null,
  notes: "Synthetic local test fixture; not a real content source.",
  providesPracticeMaterial: false,
  lastVerifiedAt: "2026-10-07",
  status: "active",
});
const sourcesById = new Map(CONTENT_SOURCES_BY_ID);
for (const sourceId of ["aceboard-original-content", "aceboard-ai-assisted-authoring"]) {
  sourcesById.set(sourceId, {
    ...sourcesById.get(sourceId),
    rightsStatus: "verified",
    permissionEvidence: "fixture-only evidence",
  });
}
sourcesById.set("fixture-licensed-source", fixtureSource("fixture-licensed-source", "licensed"));
sourcesById.set("fixture-ai-source", fixtureSource("fixture-ai-source", "ai-generated"));

const commonOptions = { sourcesById, importedAt: "2026-10-07T12:00:00.000Z" };

// JSON arrays and wrapper objects are both explicit supported structures.
assert.equal(parseJsonQuestionInput(JSON.stringify(questionFixtures)).rows.length, 11);
assert.equal(parseJsonQuestionInput(JSON.stringify({ questions: questionFixtures })).rows.length, 11);
assert.equal(parseQuestionInput("[]", { filename: "batch.json" }).format, "json");
assert.ok(parseQuestionInput("[]", { filename: "batch.unknown" }).fileErrors.length);

// CSV uses exact canonical headers and preserves typed values through JSON cells.
const csv = parseCsvQuestionInput(await readFixture("questions.csv"));
assert.equal(csv.rows.length, 1);
assert.deepEqual(csv.rows[0].record.options, ["Copper", "Rubber"]);
assert.equal(csv.rows[0].record.answer, 0);
assert.equal(csv.rows[0].record.provenance.sourceId, "aceboard-original-content");
assert.ok(parseCsvQuestionInput("id,exam\n1,JAMB\n").rows.length === 1);
assert.ok(parseCsvQuestionInput("id,unknownField\n1,x\n").rows[0].errors.length > 0);
assert.ok(parseCsvQuestionInput('id,question\n1,"unterminated').fileErrors.length > 0);

// Normalization is superficial, reported, non-mutating, and keeps the original.
const raw = { questionType: " multiple-choice ", question: "  Line one\r\nLine two  ", options: [" A ", "B"], answer: "0", topic: " n/a " };
const rawSnapshot = JSON.stringify(raw);
const normalized = normalizeQuestionRecord(raw);
assert.equal(JSON.stringify(raw), rawSnapshot);
assert.deepEqual(normalized.original, raw);
assert.equal(normalized.question.questionType, "mcq");
assert.equal(normalized.question.question, "Line one\nLine two");
assert.equal(normalized.question.options[0], "A");
assert.equal(normalized.question.answer, 0);
assert.equal(normalized.question.topic, "");
assert.ok(normalized.warnings.length >= 4);

// Content fingerprint ignores superficial whitespace and option order but includes structure.
const originalValid = questionFixtures[0];
const reorderedDuplicate = questionFixtures[5];
assert.equal(fingerprintQuestionContent(originalValid), fingerprintQuestionContent(reorderedDuplicate));
assert.notEqual(fingerprintQuestionContent(originalValid), fingerprintQuestionContent({ ...originalValid, exam: "SAT" }));

// Validate distinct sample cases with controlled local registry rights.
const uniqueFixtures = questionFixtures.filter((_, index) => ![4, 5].includes(index));
const fixtureRun = dryRunContentImport(uniqueFixtures, { ...commonOptions, existingQuestions: [], filename: "fixtures.json" });
const outcomeById = new Map(fixtureRun.outcomes.map((outcome) => [outcome.id, outcome]));
assert.equal(outcomeById.get("fixture-original-mcq").validationStatus, "VALID");
assert.equal(outcomeById.get("fixture-licensed-mcq").validationStatus, "VALID");
assert.equal(outcomeById.get("fixture-missing-provenance").validationStatus, "REJECTED");
assert.equal(outcomeById.get("fixture-invalid-answer").validationStatus, "REJECTED");
assert.equal(outcomeById.get("fixture-malformed-options").validationStatus, "REJECTED");
assert.equal(outcomeById.get("fixture-ai-unreviewed").publicationBlocked, true);
assert.equal(outcomeById.get("fixture-ai-assisted-reviewed").publicationBlocked, false);
assert.equal(outcomeById.get("fixture-numeric-grid-in").validationStatus, "VALID");
assert.equal(fixtureRun.dryRun, true);
assert.equal(fixtureRun.writesPerformed, false);
assert.equal(fixtureRun.publicationPerformed, false);
assert.equal(fixtureRun.breakdowns.exam.JAMB, 8);
assert.equal(fixtureRun.breakdowns.questionType.mcq, 8);
assert.equal(fixtureRun.breakdowns.questionType.gridIn, 1);
assert.ok(fixtureRun.publicationBlocked.some((item) => item.id === "fixture-unknown-rights"));
assert.ok(fixtureRun.publicationBlocked.some((item) => item.id === "fixture-ai-unreviewed"));

// Stable ID collisions against the catalog and exact content collisions in-batch are reported, not removed.
const duplicateRun = dryRunContentImport([questionFixtures[0], questionFixtures[5], questionFixtures[4]], {
  ...commonOptions,
  existingQuestions: [{ id: 2001, exam: "Other", subject: "Other", question: "Different" }],
  filename: "duplicates.json",
});
assert.equal(duplicateRun.duplicates.length, 3);
assert.equal(duplicateRun.rejected.length, 3);
assert.ok(duplicateRun.duplicates.some((duplicate) => duplicate.duplicateType === "stable-id" && duplicate.against.scope === "catalog"));
assert.ok(duplicateRun.duplicates.some((duplicate) => duplicate.duplicateType === "content" && duplicate.against.scope === "batch"));

// Mixed batch fails closed: one valid candidate plus nine rejected records means no partial acceptance.
const mixedRun = dryRunContentImport(mixedFixture, { ...commonOptions, existingQuestions: [{ id: 2001 }], filename: "mixed-batch.json" });
assert.equal(mixedRun.totalRecords, 10);
assert.equal(mixedRun.accepted.length, 1);
assert.equal(mixedRun.rejected.length, 9);
assert.equal(mixedRun.batchDecision, "reject-entire-batch");
assert.equal(mixedRun.manifest.validationResult, "partial");
assert.equal(mixedRun.manifest.recordCount, 10);
assert.equal(mixedRun.manifest.duplicateCount, 1);
assert.equal(mixedRun.manifest.writesPerformed, false);
assert.equal(mixedRun.manifest.publicationPerformed, false);

// Existing bank is still the exact same in-memory source; dry-run never writes it.
assert.equal(QUESTIONS.length, 40);
assert.equal(QUESTIONS.filter((question) => question.exam === "SAT").length, 0);
assert.equal(JSON.stringify(QUESTIONS), catalogSnapshot);

// Manifest metadata is checked explicitly and never silently filled.
assert.equal(validateImportManifestMetadata({ sourceId: "aceboard-original-content", acquisitionMethod: "original-authorship" }).valid, true);
assert.equal(validateImportManifestMetadata({ sourceId: "not-registered", acquisitionMethod: "invented" }).valid, false);
const singleRowManifest = dryRunContentImport([questionFixtures[0]], { ...commonOptions, existingQuestions: [], filename: "single.json" }).manifest;
assert.equal(singleRowManifest.sourceId, "aceboard-original-content");
assert.equal(singleRowManifest.acquisitionMethod, "original-authorship");

console.log("Content ingestion checks passed (JSON, CSV, normalization, validation, duplicates, rights, reporting, manifest, dry-run safety).");
