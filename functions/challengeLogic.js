const MAX_CHALLENGE_QUESTIONS = 50;
const SUPPORTED_CHALLENGE_TYPES = new Set(["mcq", "multipleSelect", "numeric", "gridIn", "trueFalse", "shortAnswer", "constructedResponse", "matching"]);

function validateChallengeDefinition(challenge) {
  const errors = [];
  if (!challenge || typeof challenge !== "object") return ["Challenge definition must be an object."];
  if (typeof challenge.title !== "string" || !challenge.title.trim()) errors.push("title is required.");
  if (typeof challenge.exam !== "string" || !challenge.exam.trim()) errors.push("exam is required.");
  if (!Array.isArray(challenge.questions) || challenge.questions.length < 1 || challenge.questions.length > MAX_CHALLENGE_QUESTIONS) errors.push(`questions must contain 1–${MAX_CHALLENGE_QUESTIONS} records.`);
  if (!Number.isInteger(challenge.durationSeconds) || challenge.durationSeconds < 60 || challenge.durationSeconds > 3 * 60 * 60) errors.push("durationSeconds must be between 60 seconds and 3 hours.");
  if (!challenge.startsAt || !challenge.endsAt) errors.push("startsAt and endsAt are required.");
  const startMillis = challenge.startsAt?.toMillis?.();
  const endMillis = challenge.endsAt?.toMillis?.();
  if (!Number.isFinite(startMillis) || !Number.isFinite(endMillis)) errors.push("startsAt and endsAt must be Firestore timestamps.");
  else if (endMillis <= startMillis) errors.push("endsAt must be later than startsAt.");
  const ids = new Set();
  (Array.isArray(challenge.questions) ? challenge.questions : []).forEach((question) => {
    if (!question || typeof question.id !== "string" || !question.id.trim()) errors.push("Each question needs a stable string id.");
    else if (ids.has(question.id)) errors.push(`Duplicate challenge question id: ${question.id}.`);
    else ids.add(question.id);
    if (!question || typeof (question.question || question.stem) !== "string" || !(question.question || question.stem).trim()) errors.push(`Question ${question?.id || "(missing id)"} needs canonical question text.`);
    if (!question || !SUPPORTED_CHALLENGE_TYPES.has(question.questionType)) errors.push(`Question ${question?.id || "(missing id)"} has an unsupported question type.`);
    if (!question || question.answer === undefined || question.answer === null) errors.push(`Question ${question?.id || "(missing id)"} needs a server-side answer key.`);
    if (question?.questionType === "mcq" && (!Array.isArray(question.options) || question.options.length < 2)) errors.push(`MCQ ${question.id} needs answer options.`);
    if (question?.questionType === "mcq" && Array.isArray(question.options) && !(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length) && !question.options.includes(question.answer)) errors.push(`MCQ ${question.id} has an answer that does not match an option.`);
    if (question?.questionType === "multipleSelect" && (!Array.isArray(question.options) || question.options.length < 2 || !Array.isArray(question.answer) || !question.answer.length)) errors.push(`Multiple-select ${question.id} needs options and an answer array.`);
    if (!question || question.publicationStatus !== "published") errors.push(`Question ${question?.id || "(missing id)"} is not published.`);
    if (!question || question.rightsStatus !== "verified" || !["permitted", "licensed", "public-domain"].includes(question.contentRights)) errors.push(`Question ${question?.id || "(missing id)"} does not have publishable rights clearance.`);
    if (!question?.provenance?.sourceId || !question?.provenance?.kind || !question?.provenance?.createdBy) errors.push(`Question ${question?.id || "(missing id)"} is missing source provenance.`);
    if (question?.provenance?.sourceRightsStatus !== "verified") errors.push(`Question ${question?.id || "(missing id)"} has no verified source-rights record.`);
    if (!question?.humanReviewedAt || !question?.humanReviewer) errors.push(`Question ${question?.id || "(missing id)"} has not passed human content review.`);
  });
  return errors;
}

function compareResponse(question, response) {
  if (response === undefined || response === null || response === "") return false;
  const type = question.questionType || "mcq";
  if (["numeric", "gridIn"].includes(type)) {
    const actual = Number(response);
    const tolerance = Number.isFinite(question.answerTolerance) ? question.answerTolerance : 0;
    const expectedAnswers = [question.answer, ...(Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [])];
    return expectedAnswers.some((candidate) => {
      const expected = Number(candidate);
      if (!Number.isFinite(actual) || !Number.isFinite(expected)) return String(response).trim() === String(candidate).trim();
      return Math.abs(actual - expected) <= tolerance;
    });
  }
  if (type === "multipleSelect") {
    if (!Array.isArray(response) || !Array.isArray(question.answer)) return false;
    const asOptions = (values) => values.map((value) => Number.isInteger(value) && Array.isArray(question.options) ? question.options[value] : String(value).trim().toLowerCase()).sort();
    return JSON.stringify(asOptions(response)) === JSON.stringify(asOptions(question.answer));
  }
  if (type === "mcq" && Array.isArray(question.options)) {
    const actual = Number.isInteger(Number(response)) && String(response).trim() !== "" ? question.options[Number(response)] : response;
    const expected = Number.isInteger(question.answer) ? question.options[question.answer] : question.answer;
    return String(actual).trim().toLowerCase() === String(expected).trim().toLowerCase();
  }
  if (["shortAnswer", "constructedResponse"].includes(type)) return String(response).trim().toLowerCase() === String(question.answer).trim().toLowerCase();
  if (type === "matching") return stableStringify(response) === stableStringify(question.answer);
  return response === question.answer || (String(response) === String(question.answer));
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function scoreChallenge(challenge, responses) {
  const safeResponses = responses && typeof responses === "object" && !Array.isArray(responses) ? responses : {};
  const ids = new Set(challenge.questions.map((question) => question.id));
  const invalidIds = Object.keys(safeResponses).filter((id) => !ids.has(id));
  if (invalidIds.length) return { valid: false, errors: [`Unknown question response IDs: ${invalidIds.join(", ")}.`] };
  const correct = challenge.questions.reduce((sum, question) => sum + (compareResponse(question, safeResponses[question.id]) ? 1 : 0), 0);
  const answered = challenge.questions.reduce((sum, question) => sum + (safeResponses[question.id] === undefined || safeResponses[question.id] === null || safeResponses[question.id] === "" ? 0 : 1), 0);
  return { valid: true, correct, total: challenge.questions.length, answered, unanswered: challenge.questions.length - answered, score: Math.round(correct / challenge.questions.length * 100) };
}

function publicChallenge(challenge, id) {
  const fields = ["title", "description", "exam", "subject", "challengeType", "startsAt", "endsAt", "durationSeconds", "scoringMode", "status"];
  const metadata = Object.fromEntries(fields.filter((key) => challenge[key] !== undefined).map((key) => [key, challenge[key]]));
  return { id, ...metadata, questions: (challenge.questions || []).map((question) => Object.fromEntries(["id", "questionType", "question", "stem", "passage", "options", "image", "topic"].filter((key) => question[key] !== undefined).map((key) => [key, question[key]]))) };
}

function rankAttempts(entries) {
  return [...entries].sort((a, b) => b.points - a.points || (a.bestDurationSeconds || Infinity) - (b.bestDurationSeconds || Infinity) || String(a.displayName).localeCompare(String(b.displayName))).slice(0, 100);
}

function getLeaderboardScopeKeys(challenge, now = new Date()) {
  const dateKey = now.toISOString().slice(0, 10);
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const week = Math.ceil((((date - new Date(Date.UTC(date.getUTCFullYear(), 0, 1))) / 86400000) + 1) / 7);
  const isoWeek = `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  return ["global", `exam:${challenge.exam}`, ...(challenge.subject ? [`subject:${challenge.exam}:${challenge.subject}`] : []), `daily:${dateKey}`, `weekly:${isoWeek}`];
}

module.exports = { MAX_CHALLENGE_QUESTIONS, validateChallengeDefinition, compareResponse, scoreChallenge, publicChallenge, rankAttempts, getLeaderboardScopeKeys };
