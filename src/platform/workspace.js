import { LESSONS } from "../learning/catalog.js";
import { getExamConfig } from "../exams/registry.js";
import { assessQuestionPublication } from "../content/validation.js";

const practiceEligibilityCache = new WeakMap();
export function getPracticeEligibleQuestions(questions) {
  return questions.filter((question) => {
    if (!question || typeof question !== "object") return false;
    if (!practiceEligibilityCache.has(question)) practiceEligibilityCache.set(question,
      question.publicationStatus === "published" && assessQuestionPublication(question).allowed);
    return practiceEligibilityCache.get(question);
  });
}

export function buildSyllabusProgress(lessons, progress = {}) {
  return lessons.map((item) => ({
    topicId: item.topicId,
    exam: item.exam,
    subject: item.subject,
    topic: item.topic,
    lessonId: item.id,
    state: progress[item.id]?.mastery === "mastered" ? "mastered" : (progress[item.id]?.startedAt || progress[item.id]?.completedAt) ? "in-progress" : "not-started",
  }));
}

export function lessonsFor(exam, subject = null) {
  return LESSONS.filter((item) => item.exam === exam && (!subject || item.subject === subject));
}

export function validateOfficialSatResult(input) {
  const errors = [];
  if (!String(input.testName || "").trim()) errors.push("Enter the official practice test name or number.");
  if (!input.dateTaken || Number.isNaN(Date.parse(input.dateTaken))) errors.push("Choose the date you took the test.");
  const total = Number(input.totalScore);
  const rw = Number(input.readingWritingScore);
  const math = Number(input.mathScore);
  if (!Number.isInteger(total) || total < 400 || total > 1600) errors.push("Total SAT score must be between 400 and 1600.");
  if (!Number.isInteger(rw) || rw < 200 || rw > 800) errors.push("Reading and Writing score must be between 200 and 800.");
  if (!Number.isInteger(math) || math < 200 || math > 800) errors.push("Math score must be between 200 and 800.");
  if ([total, rw, math].some((score) => Number.isInteger(score) && score % 10 !== 0)) errors.push("SAT scores must use 10-point increments.");
  if (Number.isInteger(total) && Number.isInteger(rw) && Number.isInteger(math) && total !== rw + math) errors.push("Total score must equal Reading and Writing plus Math.");
  if (String(input.notes || "").length > 1000) errors.push("Notes must be 1000 characters or fewer.");
  return { valid: errors.length === 0, errors };
}

export function getExamPracticeAvailability(exam, questions) {
  const config = getExamConfig(exam);
  const eligible = getPracticeEligibleQuestions(questions);
  const bySubject = Object.fromEntries(config.subjects.map(({ name }) => [name, eligible.filter((q) => q.exam === exam && q.subject === name).length]));
  return { total: Object.values(bySubject).reduce((sum, count) => sum + count, 0), bySubject };
}
