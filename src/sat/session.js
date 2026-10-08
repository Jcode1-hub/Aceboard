export const ACEBOARD_ROUTE_THRESHOLD = 0.65;
export const SAT_MODULES = Object.freeze([
  { key: "reading-writing-module-1", section: "reading-writing", module: 1, durationSeconds: 32 * 60 },
  { key: "reading-writing-module-2", section: "reading-writing", module: 2, durationSeconds: 32 * 60 },
  { key: "math-module-1", section: "math", module: 1, durationSeconds: 35 * 60 },
  { key: "math-module-2", section: "math", module: 2, durationSeconds: 35 * 60 },
]);

export function createSatSession({ testFormId, practiceTest, questionIds = [], now = Date.now() }) {
  return {
    schemaVersion: 1,
    testFormId: testFormId || `aceboard-sat-${practiceTest ?? "practice"}`,
    practiceTest: practiceTest ?? null,
    phase: "directions",
    currentModuleIndex: 0,
    currentQuestionIndex: 0,
    remainingSeconds: SAT_MODULES[0].durationSeconds,
    responses: {},
    markedQuestionIds: [],
    eliminatedChoices: {},
    notesByQuestion: {},
    highlightsByQuestion: {},
    moduleStartedAt: null,
    breakStartedAt: null,
    routeDecisions: {},
    submittedAt: null,
    questionIds,
    updatedAt: now,
  };
}

export function decideAceBoardRoute({ correct, total, threshold = ACEBOARD_ROUTE_THRESHOLD }) {
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) return { route: "standard", accuracy: null, basis: "insufficient-data" };
  const accuracy = Math.max(0, Math.min(1, correct / total));
  return { route: accuracy >= threshold ? "higher-challenge" : "standard", accuracy, basis: "AceBoard practice heuristic; not College Board's adaptive algorithm" };
}

export function restoreSatSession(snapshot, { now = Date.now() } = {}) {
  if (!snapshot || snapshot.schemaVersion !== 1 || !Number.isInteger(snapshot.currentModuleIndex) || snapshot.currentModuleIndex < 0 || snapshot.currentModuleIndex >= SAT_MODULES.length) return null;
  const module = SAT_MODULES[snapshot.currentModuleIndex];
  const elapsed = ["quiz", "break"].includes(snapshot.phase) && Number.isFinite(snapshot.updatedAt) ? Math.max(0, Math.floor((now - snapshot.updatedAt) / 1000)) : 0;
  return {
    ...createSatSession({ testFormId: snapshot.testFormId, practiceTest: snapshot.practiceTest, questionIds: snapshot.questionIds || [], now }),
    ...snapshot,
    remainingSeconds: Math.max(0, Math.min(module.durationSeconds, Number(snapshot.remainingSeconds) - elapsed || 0)),
    breakSecondsLeft: snapshot.phase === "break" ? Math.max(0, Math.min(10 * 60, Number(snapshot.breakSecondsLeft) - elapsed || 0)) : snapshot.breakSecondsLeft,
    responses: snapshot.responses && typeof snapshot.responses === "object" ? snapshot.responses : {},
    markedQuestionIds: Array.isArray(snapshot.markedQuestionIds) ? snapshot.markedQuestionIds : [],
    eliminatedChoices: snapshot.eliminatedChoices && typeof snapshot.eliminatedChoices === "object" ? snapshot.eliminatedChoices : {},
    notesByQuestion: snapshot.notesByQuestion && typeof snapshot.notesByQuestion === "object" ? snapshot.notesByQuestion : {},
    highlightsByQuestion: snapshot.highlightsByQuestion && typeof snapshot.highlightsByQuestion === "object" ? snapshot.highlightsByQuestion : {},
    updatedAt: now,
  };
}

export function serializeSatSession(session) {
  if (!session || session.schemaVersion !== 1) throw new TypeError("Cannot serialize an invalid SAT session.");
  return JSON.parse(JSON.stringify({ ...session, updatedAt: Date.now() }));
}
