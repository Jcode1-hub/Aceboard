# Challenge publishing and scoring contract

The challenge client calls authenticated Firebase Functions. It never calculates a rank or writes an authoritative score.

## Firestore document

A trusted Firebase user with the `admin` custom claim may call `publishChallenge` to create an immutable `challenges/{challengeId}` event with:

- `title`, `description`, `exam`, optional `subject`, `challengeType` (`daily`, `weekly`, `exam`, or `subject`)
- `status: "active"`, `publicationStatus: "published"`
- Firestore `startsAt` and `endsAt`, plus `durationSeconds`
- `scoringMode: "correct-count"`
- `questions`: immutable question snapshots for the event

Each question snapshot must contain a stable `id`, `question`/`stem`, `questionType`, and server-only `answer`; MCQs also need `options`. It must be published, have `rightsStatus: "verified"`, `contentRights` of `permitted`, `licensed`, or `public-domain`, provenance with a registered source ID and `sourceRightsStatus: "verified"`, plus human review metadata. The challenge validator blocks records that fail these checks. The server strips answer keys, tolerance, and accepted answers from every question it returns to clients.

The snapshot freezes the exact content used for scoring in that event. The canonical question catalog remains the source for future publishing; an event snapshot must not be used as a second editable question bank.

## Attempt flow

1. `getActiveChallenges` returns only published events within their schedule.
2. `startChallenge` requires Firebase Auth, validates the event, and creates one server-timed session per user and event.
3. The student reviews answers in the client and submits response values.
4. `submitChallengeAttempt` checks the session, calculates correct and unanswered counts against the server answer key, and uses a transaction to prevent repeat submissions.
5. The same transaction updates aggregate `leaderboards/{scope}/entries/{uid}` records for global, exam, subject, daily, and weekly scopes.
6. `getChallengeLeaderboard` returns display names and aggregate scores only; it never returns email or UID.

Challenge definitions, answer keys, session records, and ranking writes are server-managed. The callable rejects publication without the Firebase Admin custom claim and does not overwrite an existing event. Do not grant client write access to these collections. The current repository does not contain Firestore rules, so review the existing project rules before deployment; no rules or production data were changed in this milestone.

No challenge events have been seeded. The UI reports that honestly until content has cleared the question publication gate and an operator has published a scheduled event. The functions have not been deployed, so the challenge service is not live in production yet.
