# Content governance

AceBoard keeps question records structured and canonical in `src/content/`. The
source registry in `src/content/sources.js` records where a source can be
identified. `sourceType` describes authenticity/category; `rightsStatus`
separately records whether AceBoard may publish material from it. An official
exam organization can have `permission-required` or `unknown` rights status.
Public access to a page or practice material is not republication permission.

## Question provenance

Every question should identify a registered `provenance.sourceId`, a
`createdBy` value, an `acquisitionMethod`, and a rights status. Use explicit
`unknown/unverified` values where history cannot be established. Preserve a
source item identifier in `provenance.sourceItemId`, and record attribution,
permission evidence, AI model, human author/reviewer, and review date when they
apply. The existing JAMB records keep their original content and source strings;
they point to a `legacy-unverified` source and remain rights-unknown.
The legacy top-level `sourceId` field remains for compatibility; new source
registry links belong in `provenance.sourceId`.

## Rights and publication

Rights states are:

- `verified`: AceBoard has a recorded basis to publish the item.
- `permission-required`: permission must be obtained before publishing.
- `permission-pending`: a permission request is unresolved.
- `restricted`: use is limited by a license or other condition.
- `unknown`: the rights basis has not been established.
- `prohibited-for-publication`: the item must not be published.

`assessQuestionPublication` checks the record schema, registered source,
attribution, question and source rights, duplicate IDs in a batch, approved
lifecycle state, and human review for AI-created material. Only an approved
record with valid schema and verified rights can pass. Failed records remain in
local data for correction; validation never deletes them. The existing JAMB
bank is published in the current app for compatibility but is intentionally
blocked by the gate and reported with rights warnings until reviewed.

Content states are `draft`, `validation-failed`, `needs-review`, `approved`,
`published`, and `archived`. `canTransitionContentState` documents permitted
state movement; moving into `published` must also pass publication assessment.

## Acquisition and future imports

The next import or generation workflow should create an acquisition record
using `validateAcquisitionRecord`, referencing a source registry ID and noting
who acquired the material, when, and by what method. The intended pipeline is
`SOURCE → ACQUISITION RECORD → PARSE → NORMALIZE → VALIDATE → PROVENANCE
ASSIGNMENT → DUPLICATE CHECK → QUALITY REVIEW → RIGHTS CHECK → APPROVAL →
PUBLISH`; `INGESTION_STAGES` records that contract without implementing an
importer. Do not scrape sites or copy third-party question content. Obtain
documented permission or author original material before ingestion.

Future bulk ingestion should connect after parsing by producing canonical
question records, then use `validateQuestionRecords`, source/provenance
assignment, duplicate detection, human quality review, and the publication
gate before any publishing/storage layer is added. Search text remains derived
from question and source metadata; it is never a replacement for structured
records.

### Local bulk dry-run

`src/content/import.js` provides a reusable parse, normalize, validate, duplicate,
rights-check, and report flow. Import remains local and dry-run only. It never
updates the catalog, Firestore, or publication state. A record in `accepted`
means it passed schema and duplicate checks as a candidate; it does not mean it
was stored or approved. If any record is rejected, the manifest sets
`batchDecision` to `reject-entire-batch` to prevent accidental partial use.

Supported input formats:

- JSON: an array of canonical records or an object with a `questions` array.
- CSV: a header row using exact canonical property names. The CSV contract is
  exported as `CSV_QUESTION_FIELDS`; unsupported columns and malformed rows are
  reported. CSV `options`, `answer`, `acceptedAnswers`, `provenance`, and `tags`
  cells contain JSON values. For example, options use `["A","B"]`; an answer
  index uses `0`; provenance uses a JSON object quoted according to CSV rules.
  There is no fuzzy header mapping or implicit field guessing.

The parser retains each input row as `original`. Normalization creates a
separate copy and only trims surrounding whitespace, converts CRLF/CR line
endings to LF, removes explicitly empty optional values (`null`, `n/a`, `na`)
and changes those markers to empty strings for required fields so validation can
reject them, maps listed question-type aliases, and converts an unambiguous MCQ
option-index string or numeric/grid-in answer string to a number. Every such
change produces a warning. Question wording is not rewritten. Conflicting
question type fields are rejected.

Duplicate checks run on stable IDs and a deterministic fingerprint of exam,
exam version, subject, topic, question type, passage, stem, and normalized
options. Option order is ignored by sorting normalized options. Fingerprints
are derived data, not question identity or search tokens. Both in-batch and
existing-catalog collisions are reported; records are not deleted or silently
selected.

Run a local dry run with:

```sh
npm run content:import -- path/to/questions.json --dry-run
npm run content:import -- path/to/questions.csv --dry-run
```

The optional `--source-id` and `--acquisition-method` flags describe the
manifest; they do not fill missing per-question provenance. Each imported
record must carry registered `provenance.sourceId`, `createdBy`, and
`acquisitionMethod`, plus the question rights fields. The existing question
validator checks canonical schema and provenance. The publication gate also
requires acceptable question and source rights, source attribution where
applicable, approved state, and human review for AI-created material. Official
source metadata establishes source identity only; it does not grant AceBoard
permission to republish the material.

The dry-run report includes record outcomes and reasons, counts by exam,
subject, question type, provenance kind, and rights status, duplicate details,
publication blockers, and a metadata-only manifest (`importId`, source/method,
filename, count, timestamp, importer version, validation result, duplicate and
publication-blocked counts). A future content manager should resolve rejected
rows and duplicates, review warnings and provenance evidence, confirm rights
with documented permission, and obtain human approval before a separate
publishing workflow is designed. Do not treat this CLI as an importer or
publishing command.

Fixtures under `tests/fixtures/content-ingestion/` are synthetic local test data
and are not part of the question catalog. The focused checks run with
`npm run test:content-ingestion`.
