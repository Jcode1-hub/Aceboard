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
