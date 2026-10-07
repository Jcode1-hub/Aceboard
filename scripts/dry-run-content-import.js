import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { dryRunContentImport, parseQuestionInput } from "../src/content/import.js";

function parseArgs(args) {
  let filename = null;
  const options = { dryRun: false };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--dry-run") options.dryRun = true;
    else if (value === "--source-id") options.sourceId = args[++index];
    else if (value === "--acquisition-method") options.acquisitionMethod = args[++index];
    else if (value.startsWith("--")) throw new Error(`Unsupported option: ${value}`);
    else if (filename == null) filename = value;
    else throw new Error("Only one input file may be supplied.");
  }
  return { filename, options };
}

const { filename, options } = parseArgs(process.argv.slice(2));
if (!filename || !options.dryRun) {
  console.error("Usage: npm run content:import -- <file.json|file.csv> --dry-run [--source-id ID] [--acquisition-method METHOD]");
  console.error("This command is dry-run only; it never writes or publishes content.");
  process.exitCode = 2;
} else {
  try {
    const text = await readFile(resolve(filename), "utf8");
    const parsed = parseQuestionInput(text, { filename });
    const report = dryRunContentImport(parsed, { ...options, filename });
    const compact = {
      dryRun: report.dryRun,
      totalRecords: report.totalRecords,
      validRecords: report.validRecords,
      accepted: report.accepted.length,
      rejected: report.rejected.length,
      warnings: report.warnings.length,
      duplicates: report.duplicates.length,
      publicationBlocked: report.publicationBlocked.length,
      batchDecision: report.batchDecision,
      breakdowns: report.breakdowns,
      manifest: report.manifest,
      fileErrors: report.fileErrors,
      records: report.outcomes.map((outcome) => ({
        rowNumber: outcome.rowNumber,
        id: outcome.id,
        validationStatus: outcome.validationStatus,
        accepted: outcome.accepted,
        publicationBlocked: outcome.publicationBlocked,
        warnings: outcome.warnings,
        rejectedReasons: outcome.rejectedReasons,
        publicationReasons: outcome.publicationReasons,
      })),
    };
    console.log(JSON.stringify(compact, null, 2));
    if (report.fileErrors.length || report.rejected.length) process.exitCode = 1;
  } catch (error) {
    console.error(`Dry-run import failed: ${error.message}`);
    process.exitCode = 1;
  }
}
