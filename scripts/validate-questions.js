import { CONTENT_SOURCES, QUESTIONS } from "../src/content/index.js";
import { validateQuestionRecords } from "../src/content/validation.js";

const result = validateQuestionRecords(QUESTIONS);
if (!result.valid) {
  console.error(`Question validation failed with ${result.errors.length} error(s):`);
  for (const error of result.errors) {
    console.error(`- record ${error.index + 1} (ID ${error.id ?? "missing"}), ${error.field}: ${error.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Validated ${QUESTIONS.length} question(s) and ${CONTENT_SOURCES.length} registered source(s); no schema or source-registry errors.`);
}

const publishableCount = result.publicationChecks.filter((check) => check.allowed).length;
console.log(`Publication eligibility: ${publishableCount}/${result.publicationChecks.length} question(s) currently pass the publication gate.`);
const blocked = result.publicationChecks.filter((check) => !check.allowed);
if (blocked.length) {
  const first = blocked[0];
  console.warn(`Publication blocked for ${blocked.length} question(s); example ID ${first.id}. Reasons by occurrence:`);
  const reasonCounts = new Map();
  for (const check of blocked) {
    for (const reason of check.reasons) reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
  }
  for (const [reason, count] of reasonCounts) console.warn(`- ${count} record(s): ${reason}`);
}

if (result.warnings.length) {
  console.warn(`Question validation reported ${result.warnings.length} warning(s):`);
  const warningGroups = new Map();
  for (const warning of result.warnings) {
    const key = `${warning.field}: ${warning.message}`;
    const group = warningGroups.get(key) || { count: 0, exampleId: warning.id };
    group.count += 1;
    warningGroups.set(key, group);
  }
  for (const [description, group] of warningGroups) {
    console.warn(`- ${group.count} record(s), e.g. ID ${group.exampleId}: ${description}`);
  }
}
