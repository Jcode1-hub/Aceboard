const resources = {
  JAMB: [{ label: "JAMB iBASS e-Syllabus", url: "https://ibass.jamb.gov.ng/e-syllabus", kind: "official-reference" }, { label: "JAMB official website", url: "https://www.jamb.gov.ng/", kind: "official-resource" }],
  WAEC: [{ label: "WAEC Nigeria", url: "https://www.waecnigeria.org/", kind: "official-resource" }],
  NECO: [{ label: "NECO", url: "https://neco.gov.ng/", kind: "official-resource" }],
  IGCSE: [{ label: "Cambridge International qualifications", url: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse/", kind: "official-reference" }],
  SAT: [{ label: "Official SAT practice", url: "https://satsuite.collegeboard.org/practice/practice-tests", kind: "official-practice" }, { label: "Bluebook", url: "https://bluebook.collegeboard.org/students", kind: "official-practice" }, { label: "SAT resources", url: "https://satsuite.collegeboard.org/sat", kind: "official-resource" }],
  ACT: [{ label: "ACT free practice", url: "https://www.act.org/content/act/en/products-and-services/the-act/test-preparation/free-act-test-prep.html", kind: "official-practice" }],
  IELTS: [{ label: "IELTS preparation", url: "https://ielts.org/take-a-test/preparation-resources", kind: "official-practice" }],
};

const exam = (id, provider, jurisdiction, subjects, config = {}) => ({
  id, displayName: config.displayName || id, provider, jurisdiction,
  examVersion: config.examVersion || "Current framework; confirm the official source before each sitting",
  subjects: subjects.map((name) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name })),
  syllabusVersioned: ["IGCSE", "JAMB", "WAEC", "NECO"].includes(id),
  questionTypes: config.questionTypes || ["mcq", "numeric", "constructedResponse"],
  timingModel: config.timingModel || "Set by the selected practice activity",
  scoringModel: config.scoringModel || "Question-set score; not an official examination score",
  adaptive: !!config.adaptive,
  practiceModes: ["subject", "topic", "weak-topics", "bookmarked", "missed-questions", "timed", "untimed"],
  challengeSupport: true, lessonSupport: true, resultRecording: "AceBoard practice results",
  officialResources: resources[id] || [],
  officialPracticeFlow: config.officialPracticeFlow || "Open the exam provider's resource in its own environment; record external results as self-reported.",
  ...config,
});

export const EXAM_REGISTRY = Object.freeze({
  JAMB: exam("JAMB", "Joint Admissions and Matriculation Board", "Nigeria", ["Use of English", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Government", "Literature in English"], { examVersion: "UTME; syllabus follows the selected JAMB IBASS edition", timingModel: "UTME practice is configured per activity", scoringModel: "AceBoard practice score; JAMB score is not inferred" }),
  WAEC: exam("WAEC", "West African Examinations Council", "West Africa", ["English Language", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Government"], { examVersion: "SSCE syllabus edition selected by the learner" }),
  NECO: exam("NECO", "National Examinations Council", "Nigeria", ["English Language", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Government"], { examVersion: "SSCE syllabus edition selected by the learner" }),
  IGCSE: exam("IGCSE", "Cambridge International Education", "International", ["Mathematics", "English", "Biology", "Chemistry", "Physics"], { examVersion: "Choose the subject syllabus code and examination year", syllabusVersioned: true }),
  SAT: exam("SAT", "College Board", "United States / international", ["Reading and Writing", "Math"], { examVersion: "Digital SAT", adaptive: true, timingModel: "Reading and Writing: 2 × 32-minute modules; Math: 2 × 35-minute modules; 10-minute break", scoringModel: "AceBoard simulated practice estimate is not an official SAT score", officialPracticeFlow: "Full-length official digital practice runs in Bluebook; scores and review are in College Board My Practice." }),
  ACT: exam("ACT", "ACT, Inc.", "United States / international", ["English", "Math", "Reading", "Science", "Writing"], { examVersion: "Select current ACT delivery and jurisdiction; section availability can differ", timingModel: "Varies by current ACT form and delivery", scoringModel: "AceBoard practice score; Science/Writing treatment depends on the ACT format" }),
  IELTS: exam("IELTS", "IELTS partners", "International", ["Listening", "Reading", "Writing", "Speaking"], { examVersion: "Academic or General Training; select the applicable test type", questionTypes: ["listening", "reading", "writing", "speaking"], scoringModel: "Band 0–9 framework; AceBoard activities are practice, not official band results" }),
  GCE: exam("GCE", "Multiple examination providers", "Multiple jurisdictions", ["English Language", "Mathematics", "Physics", "Chemistry", "Biology"], { displayName: "GCE", examVersion: "Choose awarding body and examination year", officialResources: [] }),
});

export const EXAM_LIST = Object.values(EXAM_REGISTRY);
export const getExamConfig = (id) => EXAM_REGISTRY[String(id || "").toUpperCase()] || null;
