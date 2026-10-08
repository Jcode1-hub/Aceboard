# AceBoard maker portfolio evidence

## Problem and purpose

AceBoard is an academic preparation and learning product for Nigerian and international exam systems. The project is intended to connect syllabus navigation, original instruction, focused practice, results, and next-step recommendations while keeping exam-board content and AceBoard material clearly distinguished.

## Current architecture

- React 18 and Vite provide the web client.
- Firebase Authentication retains the existing Google sign-in flow. Firestore stores learner profiles, bookmarks, learning progress, practice history, and challenge records.
- Firebase callable functions validate challenge sessions and score submissions on the server. Leaderboard entries are derived from completed server-scored attempts; the client does not choose its score.
- `src/exams/registry.js` keeps exam identity and exam-specific metadata in a shared registry.
- `src/content/` contains canonical question records, schema validation, provenance/source metadata, publication checks, and JSON/CSV dry-run ingestion.
- `src/learning/catalog.js` and `src/platform/workspace.js` provide data-driven lesson and syllabus progress structures.

## Question governance and release review

Question records have stable IDs and structured exam, subject, topic, answer, explanation, provenance, source, rights, and lifecycle fields. Existing JAMB Physics records remain identified as legacy/unverified and are not eligible for student practice. New AceBoard-authored starter questions are drafts until a trusted reviewer explicitly confirms original authorship/publication rights, approves the content, and publishes it.

The review workflow stores a content fingerprint with each decision. Student practice receives only questions whose publication manifest matches that fingerprint. Review records are held in Firestore; source question data remains in the code catalog. No external question bank was imported for this milestone.

## Syllabus and lessons

Lessons are catalog data rather than one-off JSX pages. The student workspace groups lessons by exam, subject, and topic; records started/completed state against the learner profile; links to official reference material; and labels draft educational notes as AceBoard material. Lesson completion is not presented as measured topic mastery.

## Practice and results

Practice is assembled from canonical question records that pass publication checks. Filters use exam, subject, topic, year, and available question metadata. Completed answers update the existing learner statistics, daily activity, subject history, and missed-question state. Results and review screens can use the underlying question explanations and topic labels.

## SAT session architecture

The SAT runner stores a structured session with section, module, question, answer, timer, review, and tool state. Its route decision is a documented AceBoard practice heuristic; it is not College Board's adaptive algorithm or an official score. The separate SAT resource hub links to Bluebook and allows learners to record external scores as self-reported results.

## Challenges and scoring

Challenges use callable functions for event access, session start, and submission. The server calculates results from answer keys and records one attempt per learner/event. A trusted admin-only release path can create a Daily Challenge from five to ten questions whose review and rights fingerprints are current. No participants or scores are fabricated.

## Engineering decisions and work in progress

- Preserve the deployed React/Firebase architecture and existing learner data instead of introducing another backend.
- Keep question data structured and canonical; derive search text and fingerprints from it.
- Separate source authenticity from AceBoard publication permission.
- Keep imports dry-run-only and keep publication behind human content and rights review.
- Support seven exam families with shared catalogs and flows, while acknowledging that the starter curricula and reviewed question release set are not comprehensive.
- Keep the current monolithic `src/App.jsx` integration in place where extracting it would be an unrelated high-risk rewrite.

The release queue contains 77 selected starter questions, but code does not record human decisions on behalf of a reviewer. Until an authorized Firebase admin reviews and publishes material, the student practice bank remains empty for those drafts. A Daily Challenge can be created only after at least five released questions are available. Firebase Hosting is not configured in this repository, so this milestone does not create or deploy a hosting target. Android packaging has not started.
