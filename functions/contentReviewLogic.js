function fingerprintReviewQuestion(question) {
  const fields = [question.id, question.exam, question.examVersion, question.year || "", question.subject, question.topic,
    question.subtopic || "", question.skill || "", question.difficulty, question.questionType,
    question.question || question.stem || "", question.passage || "", question.options || null,
    question.answer, question.explanation, question.section || question.module || "", question.source || "",
    question.sourceId || "", question.provenance?.kind, question.provenance?.sourceId,
    question.provenance?.sourceItemId || "", question.provenance?.createdBy,
    question.provenance?.acquisitionMethod || "", question.tags || [], question.learningObjective || "",
    question.revision || question.version || 1];
  const input = JSON.stringify(fields);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function validateReviewCandidate(question, questionId) {
  const errors = [];
  if (!question || typeof question !== "object" || question.id !== questionId) errors.push("The canonical question record is missing or has a different ID.");
  if (!/^ab-(jamb|waec|neco|igcse|sat|act|ielts)-[a-z0-9-]+-\d{2}$/.test(questionId)) errors.push("Only stable AceBoard starter release IDs can be reviewed here.");
  if (question?.provenance?.kind !== "aceboard-original" || question?.provenance?.sourceId !== "aceboard-original-content") errors.push("Only AceBoard-original content from the registered original source can enter this review flow.");
  if (question?.publicationStatus !== "needs-review" || question?.rightsStatus !== "unknown" || question?.contentRights !== "review-required") errors.push("The candidate is not in the expected unreviewed draft state.");
  if (!String(question?.question || question?.stem || "").trim() || !String(question?.explanation || "").trim()) errors.push("A question stem and explanation are required.");
  if (!Array.isArray(question?.options) || question.options.length < 2 || !Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length) errors.push("This release-review surface currently accepts only well-formed MCQs.");
  return errors;
}

function prepareQuestionReview({ action, question, questionId, current, reviewer, notes = "", confirmOriginalRights = false, now = new Date() }) {
  const errors = [];
  if (!questionId || !reviewer) errors.push("A question ID and authenticated reviewer are required.");
  if (typeof notes !== "string" || notes.length > 1000) errors.push("Review notes must be 1000 characters or fewer.");
  if (["approve", "reject"].includes(action)) errors.push(...validateReviewCandidate(question, questionId));
  const fingerprint = question ? fingerprintReviewQuestion(question) : null;
  const timestamp = now.toISOString();

  if (action === "approve") {
    if (!confirmOriginalRights) errors.push("The reviewer must explicitly confirm AceBoard-original authorship and publication rights.");
    if (errors.length) return { valid: false, errors };
    const rightsEvidence = `Reviewer ${reviewer} confirmed on ${timestamp} that this item is AceBoard-original and cleared for AceBoard publication.`;
    return { valid: true, record: { questionId, questionFingerprint: fingerprint, reviewOutcome: "approved", publicationStatus: "approved", rightsStatus: "verified", contentRights: "permitted", rightsEvidence, reviewer, reviewedAt: timestamp, notes, sourceId: question.provenance.sourceId } };
  }
  if (action === "reject") {
    if (errors.length) return { valid: false, errors };
    return { valid: true, record: { questionId, questionFingerprint: fingerprint, reviewOutcome: "rejected", publicationStatus: "archived", rightsStatus: "unknown", contentRights: "review-required", reviewer, reviewedAt: timestamp, notes, sourceId: question.provenance.sourceId } };
  }
  if (action === "publish") {
    if (!current || current.reviewOutcome !== "approved" || current.publicationStatus !== "approved") errors.push("Approve the content and rights review before publishing.");
    if (!question || current?.questionFingerprint !== fingerprint) errors.push("The question wording, answer, or explanation changed after review. Review it again before publishing.");
    if (errors.length) return { valid: false, errors };
    return { valid: true, record: { ...current, questionId, publicationStatus: "published", publishedBy: reviewer, publishedAt: timestamp, notes: notes || current.notes || "" } };
  }
  return { valid: false, errors: [...errors, "Action must be approve, reject, or publish."] };
}

module.exports = { fingerprintReviewQuestion, validateReviewCandidate, prepareQuestionReview };
