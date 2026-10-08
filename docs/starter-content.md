# AceBoard original starter content

`src/content/exams/aceboard-original-starter.js` holds 96 independently authored draft questions: three distinct topics for each requested exam/subject pair. Every record has a stable ID, curriculum mapping, answer and explanation, and records its authoring tool.

All 96 records are deliberately `needs-review`, `rightsStatus: unknown`, and `contentRights: review-required`. They are not past questions and do not claim to reproduce exam-board material. Their source registry entry is a source category, not evidence that any particular question has been approved.

Student question search, practice setup, and the SAT full-form selector only expose items that are both published and pass `assessQuestionPublication`. The existing 40 JAMB Physics records remain intact and remain rights-blocked. A human editor must review correctness and originality, record a reviewer, document rights clearance, update the registered source's rights evidence where appropriate, approve the question, and then publish it. Do not flip statuses solely to make preview content appear.

Challenge publication independently requires published, rights-cleared, human-reviewed question snapshots. No challenge seed should be created until eligible questions exist. The current Firebase configuration has no Hosting target; it only configures Functions.
