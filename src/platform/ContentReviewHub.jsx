import React, { useEffect, useMemo, useState } from "react";
import { getReviewableReleaseQuestions, materializePublishedQuestions } from "../content/review.js";

const statusName = (review) => review?.publicationStatus === "published" ? "Published" : review?.reviewOutcome === "rejected" ? "Rejected" : review?.publicationStatus === "approved" ? "Approved · ready to publish" : "Needs review";

export default function ContentReviewHub({ questions, getReviewState, recordReview, createDailyChallenge, onRefreshPublishedContent }) {
  const [reviews, setReviews] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmations, setConfirmations] = useState({});
  const [notes, setNotes] = useState({});
  const [filter, setFilter] = useState("needs-review");
  const [busyId, setBusyId] = useState("");
  const [selectedChallengeIds, setSelectedChallengeIds] = useState([]);

  async function refresh() {
    setLoadState("loading");
    try {
      const payload = await getReviewState();
      setReviews(payload.reviews || []);
      setLoadState("ready");
      setError("");
    } catch (cause) {
      setLoadState("denied");
      setError(cause?.message || "This area requires the trusted content reviewer role.");
    }
  }
  useEffect(() => { refresh(); }, []);

  const candidates = useMemo(() => getReviewableReleaseQuestions(questions), [questions]);
  const byId = useMemo(() => new Map(reviews.map((review) => [review.questionId, review])), [reviews]);
  const publishedQuestions = useMemo(() => materializePublishedQuestions(questions, reviews.map((review) => ({ ...review, reviewId: review.questionId }))), [questions, reviews]);
  const selectedChallengeExam = publishedQuestions.find((question) => selectedChallengeIds.includes(question.id))?.exam;
  const challengeChoices = publishedQuestions.filter((question) => !selectedChallengeExam || question.exam === selectedChallengeExam);
  const visible = candidates.filter((question) => {
    const review = byId.get(question.id);
    if (filter === "all") return true;
    if (filter === "needs-review") return !review || review.publicationStatus === "needs-review";
    if (filter === "approved") return review?.publicationStatus === "approved";
    if (filter === "published") return review?.publicationStatus === "published";
    return review?.reviewOutcome === "rejected";
  });

  async function decide(question, action) {
    setBusyId(question.id); setError(""); setMessage("");
    try {
      const result = await recordReview({
        action,
        questionId: question.id,
        question,
        confirmOriginalRights: !!confirmations[question.id],
        notes: notes[question.id] || "",
      });
      setMessage(`${question.id}: ${statusName(result)}.`);
      await refresh();
      if (action === "publish") await onRefreshPublishedContent?.();
    } catch (cause) { setError(cause?.message || "The review action could not be saved."); }
    finally { setBusyId(""); }
  }

  async function launchDaily() {
    setBusyId("daily-challenge"); setError(""); setMessage("");
    try {
      const selected = publishedQuestions.filter((question) => selectedChallengeIds.includes(question.id));
      const result = await createDailyChallenge({ questionIds: selected.map((question) => question.id), questions: selected });
      setMessage(`Daily challenge ${result.challengeId} is live for its scheduled window.`);
      setSelectedChallengeIds([]);
    } catch (cause) { setError(cause?.message || "Could not publish a daily challenge."); }
    finally { setBusyId(""); }
  }

  return <main className="ab-page ab-learning-page"><section className="ab-subpage-hero"><div><span className="ab-eyebrow">INTERNAL · CONTENT REVIEW</span><h1>Review the release set <em>before it reaches learners.</em></h1><p>Only a trusted Firebase admin can record review decisions. Each published question is tied to the exact wording, options, answer and explanation that were reviewed.</p></div></section>
    {loadState === "loading" && <div className="ab-panel"><p className="ab-muted">Checking reviewer access…</p></div>}
    {loadState === "denied" && <div className="ab-empty-state" role="status"><h2>Reviewer access required</h2><p>{error || "Sign in with a trusted reviewer account to see the content queue."}</p><p>Student and admin data remain behind the existing Firebase authentication boundary.</p></div>}
    {loadState === "ready" && <>
      <section className="ab-review-summary"><article><strong>{candidates.length}</strong><span>proposed release questions</span></article><article><strong>{candidates.filter((q) => !byId.has(q.id) || byId.get(q.id).publicationStatus === "needs-review").length}</strong><span>awaiting review</span></article><article><strong>{publishedQuestions.length}</strong><span>published after review</span></article></section>
      {message && <p className="ab-review-success" role="status">{message}</p>}{error && <p className="ab-challenge-error" role="alert">{error}</p>}
      <div className="ab-review-toolbar"><label className="ab-sr-only" htmlFor="review-filter">Filter review queue</label><select id="review-filter" className="ab-select" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="needs-review">Needs review</option><option value="approved">Approved</option><option value="published">Published</option><option value="rejected">Rejected</option><option value="all">All release items</option></select><span>{visible.length} item{visible.length === 1 ? "" : "s"}</span></div>
      <section className="ab-review-list">{visible.map((question) => {
        const review = byId.get(question.id);
        const isPending = !review || review.publicationStatus === "needs-review";
        return <details className="ab-review-item ab-panel" key={question.id}><summary><span className="ab-review-badge">{statusName(review)}</span><strong>{question.exam} · {question.subject} · {question.topic}</strong><span>{question.id}</span></summary><div className="ab-review-body"><p className="ab-review-question">{question.question || question.stem}</p>{question.passage && <blockquote>{question.passage}</blockquote>}<ol type="A">{question.options.map((option, index) => <li className={index === question.answer ? "is-correct-answer" : ""} key={index}>{option}{index === question.answer && <b> · Key</b>}</li>)}</ol><div className="ab-review-explanation"><b>Explanation</b><p>{question.explanation}</p></div><dl className="ab-review-metadata"><div><dt>Provenance</dt><dd>{question.provenance.kind} · {question.provenance.createdBy} · {question.provenance.sourceId}</dd></div><div><dt>Rights</dt><dd>{review?.rightsStatus || question.rightsStatus} / {review?.contentRights || question.contentRights}</dd></div><div><dt>Review</dt><dd>{statusName(review)}{review?.reviewer ? ` · ${review.reviewer}` : ""}</dd></div></dl>{review?.notes && <p className="ab-review-notes">Reviewer note: {review.notes}</p>}
          {isPending && <><label className="ab-review-confirm"><input type="checkbox" checked={!!confirmations[question.id]} onChange={(event) => setConfirmations((previous) => ({ ...previous, [question.id]: event.target.checked }))}/><span>I have checked this item and confirm it is independently authored for AceBoard and may be published as AceBoard-owned original content.</span></label><label className="ab-review-note-label">Review notes<textarea className="ab-input" value={notes[question.id] || ""} maxLength={1000} onChange={(event) => setNotes((previous) => ({ ...previous, [question.id]: event.target.value }))} placeholder="Record corrections or the reason for your decision."/></label><div className="ab-review-actions"><button className="ab-button ab-button-dark" disabled={!confirmations[question.id] || busyId === question.id} onClick={() => decide(question, "approve")}>Approve and clear rights</button><button className="ab-button ab-button-light" disabled={busyId === question.id} onClick={() => decide(question, "reject")}>Reject</button></div></>}
          {review?.publicationStatus === "approved" && <button className="ab-button ab-button-dark" disabled={busyId === question.id} onClick={() => decide(question, "publish")}>Publish reviewed question</button>}
        </div></details>;
      })}{visible.length === 0 && <div className="ab-empty-state"><h3>No items in this view</h3><p>Choose another review state or continue with the pending release set.</p></div>}</section>
      <section className="ab-panel ab-daily-challenge-admin"><span className="ab-eyebrow">DAILY CHALLENGE · SERVER SCORED</span><h2>Publish one challenge from reviewed content</h2><p>Choose 5–10 published questions from a single exam. The callable verifies each snapshot against its approved fingerprint before creating the event.</p>{challengeChoices.map((question) => <label className="ab-challenge-pick" key={question.id}><input type="checkbox" checked={selectedChallengeIds.includes(question.id)} onChange={() => setSelectedChallengeIds((previous) => previous.includes(question.id) ? previous.filter((id) => id !== question.id) : previous.length < 10 ? [...previous, question.id] : previous)}/><span>{question.exam} · {question.subject} · {question.topic}</span></label>)}{publishedQuestions.length === 0 && <p className="ab-muted">Publish at least five reviewed questions before creating a challenge.</p>}<button className="ab-button ab-button-dark" disabled={selectedChallengeIds.length < 5 || busyId === "daily-challenge"} onClick={launchDaily}>{busyId === "daily-challenge" ? "Publishing…" : `Create daily challenge (${selectedChallengeIds.length}/5–10)`}</button></section>
    </>}
  </main>;
}
