import React, { useEffect, useState } from "react";
import { getExamConfig } from "../exams/registry.js";

function ChallengeAnswerInput({ question, value, onChange, index }) {
  if (question.questionType === "multipleSelect") return question.options.map((option, optionIndex) => <label key={optionIndex}><input type="checkbox" checked={Array.isArray(value) && value.includes(optionIndex)} onChange={() => { const current = Array.isArray(value) ? value : []; onChange(current.includes(optionIndex) ? current.filter((item) => item !== optionIndex) : [...current, optionIndex]); }}/><span>{option}</span></label>);
  if (question.questionType === "trueFalse" && !question.options?.length) return <select className="ab-select" aria-label={`Answer for question ${index + 1}`} value={value ?? ""} onChange={(event) => onChange(event.target.value)}><option value="">Choose true or false</option><option value="true">True</option><option value="false">False</option></select>;
  if (question.options?.length) return question.options.map((option, optionIndex) => <label key={optionIndex}><input type="radio" name={question.id} checked={String(value) === String(optionIndex)} onChange={() => onChange(optionIndex)}/><span>{option}</span></label>);
  return <input className="ab-input" aria-label={`Answer for question ${index + 1}`} type={["numeric", "gridIn"].includes(question.questionType) ? "number" : "text"} value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder="Enter your answer"/>;
}

export default function ChallengeHub({ area, examId, examPicker, getActiveChallenges, startChallenge, submitChallenge, getLeaderboard, onOpenLeaderboard }) {
  const [challenges, setChallenges] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [scope, setScope] = useState("global");
  const [entries, setEntries] = useState([]);
  const [rankLoading, setRankLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const subjectScopes = getExamConfig(examId)?.subjects || [];

  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session]);

  useEffect(() => {
    if (area !== "challenges") return;
    setLoading(true);
    setLoadError("");
    getActiveChallenges().then((payload) => setChallenges(payload.challenges || [])).catch(() => setLoadError("The verified challenge service is not available. Personal practice and study progress remain available.")).finally(() => setLoading(false));
  }, [area]);

  useEffect(() => {
    if (area !== "leaderboard") return;
    setRankLoading(true);
    getLeaderboard(scope).then((payload) => setEntries(payload.entries || [])).catch(() => { setEntries([]); setLoadError("Verified rankings are temporarily unavailable."); }).finally(() => setRankLoading(false));
  }, [area, scope]);

  async function start(id) {
    setBusy(true); setLoadError("");
    try { const payload = await startChallenge(id); setSession(payload); setAnswers({}); setReviewMode(false); setResult(null); }
    catch (error) { setLoadError(error?.message || "Could not start this challenge."); }
    finally { setBusy(false); }
  }

  async function submit(event) {
    event.preventDefault();
    if (!session || busy) return;
    if (!reviewMode) { setReviewMode(true); return; }
    setBusy(true); setLoadError("");
    try { const payload = await submitChallenge(session.session.challengeId, answers); setResult(payload.result); setSession(null); }
    catch (error) { setLoadError(error?.message || "Could not submit this challenge."); }
    finally { setBusy(false); }
  }

  if (area === "leaderboard") return <main className="ab-page ab-learning-page"><section className="ab-subpage-hero"><div><span className="ab-eyebrow">LEADERBOARD · VERIFIED ATTEMPTS</span><h1>Progress, earned <em>and validated.</em></h1><p>Rankings use scores calculated by AceBoard's authenticated challenge service. Public display names only; no student email addresses.</p></div></section><div className="ab-leaderboard-filters">{["global", "weekly", `exam:${examId}`, ...subjectScopes.map(({ name }) => `subject:${examId}:${name}`)].map((item) => <button className={`ab-filter-pill ${scope === item ? "is-active" : ""}`} onClick={() => { setScope(item); setLoadError(""); }} key={item}>{item === "global" ? "Global" : item === "weekly" ? "Weekly" : item.replaceAll(":", " · ")}</button>)}</div>{loadError && <p className="ab-challenge-error" role="status">{loadError}</p>}<section className="ab-panel ab-leaderboard-table"><div className="ab-leaderboard-head"><span>RANK</span><span>STUDENT</span><span>POINTS</span><span>CHALLENGES</span></div>{rankLoading ? <p className="ab-muted">Loading verified rankings…</p> : entries.length ? entries.map((entry, index) => <div className="ab-leaderboard-row" key={`${entry.displayName}-${index}`}><strong>{index + 1}</strong><span>{entry.displayName}</span><strong>{entry.points}</strong><span>{entry.completedCount}</span></div>) : <div className="ab-empty-state"><h3>No verified rankings yet</h3><p>Ranked entries appear after a scheduled challenge is completed through the server-verified attempt flow.</p></div>}</section></main>;

  const remainingSeconds = session ? Math.max(0, Math.ceil((session.session.expiresAt - now) / 1000)) : 0;
  return <main className="ab-page ab-learning-page"><section className="ab-subpage-hero"><div><span className="ab-eyebrow">CHALLENGES · SERVER-VERIFIED</span><h1>Practice together. <em>Earn your place.</em></h1><p>Scheduled challenges are scored on AceBoard's server. Each learner gets one attempt, and the browser cannot submit its own score.</p></div>{examPicker}</section>{loadError && <p className="ab-challenge-error" role="status">{loadError}</p>}{result && <section className="ab-challenge-result ab-panel"><span className="ab-eyebrow">SERVER-VALIDATED RESULT</span><h2>{result.score}%</h2><p>{result.correct} correct · {result.answered} answered · {result.unanswered} unanswered</p><button className="ab-text-button" onClick={() => { setResult(null); setLoadError(""); }}>Back to challenges →</button></section>}{session ? <form className="ab-challenge-runner ab-panel" onSubmit={submit}><div className="ab-challenge-run-head"><span className="ab-eyebrow">{session.challenge.exam} · {session.challenge.title}</span><strong>{Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}</strong></div><p className="ab-challenge-runner-note">This attempt is timed and submitted to the server for scoring.</p>{!reviewMode ? session.challenge.questions.map((question, index) => <fieldset className="ab-challenge-question" key={question.id}><legend><b>{index + 1}.</b> {question.question || question.stem}</legend>{question.passage && <p>{question.passage}</p>}{<ChallengeAnswerInput question={question} value={answers[question.id]} index={index} onChange={(value) => setAnswers((previous) => ({ ...previous, [question.id]: value }))}/>}</fieldset>) : <section className="ab-challenge-review"><h2>Review your responses</h2>{session.challenge.questions.map((question, index) => <p key={question.id}>Question {index + 1} <strong>{answers[question.id] === undefined || answers[question.id] === "" ? "Unanswered" : "Answered"}</strong></p>)}<button type="button" className="ab-button ab-button-light" onClick={() => setReviewMode(false)}>Return to questions</button></section>}<button className="ab-button ab-button-dark" disabled={busy}>{busy ? "Submitting…" : reviewMode ? "Submit final answers" : "Review answers"}</button></form> : !result && <section className="ab-challenge-list">{loading ? <div className="ab-panel"><p className="ab-muted">Finding scheduled challenges…</p></div> : challenges.filter((item) => item.exam === examId).length ? challenges.filter((item) => item.exam === examId).map((item) => <article className="ab-challenge-event ab-panel" key={item.id}><div><span className="ab-eyebrow">{item.challengeType || "EXAM"} · {item.exam}{item.subject ? ` · ${item.subject}` : ""}</span><h2>{item.title}</h2><p>{item.description}</p><small>{item.questions.length} questions · {Math.round(item.durationSeconds / 60)} minutes</small></div><button className="ab-button ab-button-dark" onClick={() => start(item.id)} disabled={busy}>{busy ? "Starting…" : "Start challenge →"}</button></article>) : <div className="ab-empty-state"><h3>No scheduled {examId} challenges right now</h3><p>Challenge events are published after question rights, editorial review and server-side answer keys are checked. There are no placeholder competitions or client-scored rankings.</p></div>}</section>}<div className="ab-challenge-footer"><button className="ab-button ab-button-light" onClick={() => { setLoading(true); getActiveChallenges().then((payload) => { setChallenges(payload.challenges || []); setLoadError(""); }).catch(() => setLoadError("Could not refresh scheduled challenges.")).finally(() => setLoading(false)); }}>Refresh challenge list</button><button className="ab-text-button" onClick={onOpenLeaderboard}>View verified leaderboard →</button></div></main>;
}
