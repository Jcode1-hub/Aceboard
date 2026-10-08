import React, { useState, useEffect, useRef, useCallback } from "react";
import { getQuestionType } from "./content/index.js";
import { decideAceBoardRoute, restoreSatSession, serializeSatSession } from "./sat/session.js";

/* =========================================================================
   BLUEBOOK-STYLE SAT QUIZ ENGINE FOR ACEBOARD
   =========================================================================
   Two files' worth of logic live here, exported separately:

   1. <BluebookQuizScreen />  — the in-module UI: two-pane RW layout,
      single-pane Math layout, real countdown timer, mark-for-review,
      question navigator grid, Desmos calculator (Math only).

   2. <SatTestRunner />       — orchestrates the real Bluebook module
      sequence (RW Module 1 -> RW Module 2 -> break -> Math Module 1 ->
      Math Module 2), directions interstitials, and hands a final
      results object to onFinish. This is the component you actually
      drop into App.jsx in place of the old QuizScreen when
      config.exam === "SAT".

   Design tokens are pulled directly from the real digital SAT app
   (Bluebook) rather than invented: navy header text, blue selection
   states, the red "THIS IS A PRACTICE TEST" banner, light gray chrome.
   ========================================================================= */

const TOKENS = {
  navy: "#0C2957",
    gold: "#FFC72C",
  blue: "#0C5FF1",
  blueLight: "#EAF1FE",
  red: "#C4122F",
  border: "#D8DCE1",
  borderLight: "#E9ECEF",
  bg: "#FFFFFF",
  chrome: "#F7F8FA",
  textMuted: "#5B6470",
  warn: "#B54708",
  warnBg: "#FEF3E6",
  font: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
    serif: `Georgia, "Times New Roman", Times, serif`,
};

// Real digital SAT module durations, in minutes.
const MODULE_DURATIONS = {
  "Reading and Writing": { "Module 1": 32, "Module 2": 32 },
  Math: { "Module 1": 35, "Module 2": 35 },
};

function formatTime(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/* ---------------------------- Timer pill ---------------------------- */

function TimerPill({ secondsLeft, hidden, onToggleHidden }) {
  const low = secondsLeft <= 5 * 60;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          fontVariantNumeric: "tabular-nums",
          fontSize: 15,
          fontWeight: 700,
          color: low ? TOKENS.warn : TOKENS.navy,
          minWidth: 56,
          textAlign: "center",
          visibility: hidden ? "hidden" : "visible",
        }}
      >
        {formatTime(secondsLeft)}
      </div>
      <button
        onClick={onToggleHidden}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: TOKENS.blue,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 6px",
        }}
      >
        {hidden ? "Show" : "Hide"}
      </button>
    </div>
  );
}

/* ------------------------- Question nav grid ------------------------- */

function QuestionNavGrid({
  questions,
  currentIndex,
  answers,
  marked,
  onJump,
  onClose,
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12,41,87,0.35)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: TOKENS.bg,
          width: "100%",
          maxWidth: 640,
          borderRadius: "16px 16px 0 0",
          padding: "20px 24px 28px",
          boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
          fontFamily: TOKENS.font,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 700, color: TOKENS.navy, fontSize: 16 }}>
            Question Navigator
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: 20,
              color: TOKENS.textMuted,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 12, color: TOKENS.textMuted }}>
          <LegendDot type="current" /> Current
          <LegendDot type="answered" /> Answered
          <LegendDot type="marked" /> Marked for Review
          <LegendDot type="unanswered" /> Unanswered
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 10,
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {questions.map((q, i) => {
            const isAnswered = answers[q.id] !== undefined && answers[q.id] !== "";
            const isMarked = marked.has(q.id);
            const isCurrent = i === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => {
                  onJump(i);
                  onClose();
                }}
                style={{
                  position: "relative",
                  height: 40,
                  borderRadius: 8,
                  border: isCurrent
                    ? `2px solid ${TOKENS.blue}`
                    : `1px solid ${TOKENS.border}`,
                  background: isCurrent
                    ? TOKENS.blueLight
                    : isAnswered
                    ? "#F0F5FF"
                    : TOKENS.bg,
                  color: TOKENS.navy,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {i + 1}
                {isMarked && (
                  <span
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      fontSize: 12,
                    }}
                  >
                    🚩
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ type }) {
  const styles = {
    current: { border: `2px solid ${TOKENS.blue}`, background: TOKENS.blueLight },
    answered: { border: `1px solid ${TOKENS.border}`, background: "#F0F5FF" },
    marked: { border: `1px solid ${TOKENS.border}`, background: TOKENS.bg },
    unanswered: { border: `1px solid ${TOKENS.border}`, background: TOKENS.bg },
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        borderRadius: 4,
        marginRight: 4,
        verticalAlign: "middle",
        ...styles[type],
      }}
    />
  );
}

/* ---------------------- Five-minute warning modal ---------------------- */

function FiveMinuteWarning({ onDismiss }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12,41,87,0.45)",
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: TOKENS.font,
      }}
    >
      <div
        style={{
          background: TOKENS.bg,
          borderRadius: 12,
          padding: "28px 28px 20px",
          width: 360,
          textAlign: "center",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 700, color: TOKENS.navy, marginBottom: 8 }}>
          5 Minutes Remaining
        </div>
        <div style={{ fontSize: 14, color: TOKENS.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
          You have 5 minutes remaining in this module. The module will
          submit automatically when time runs out.
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: TOKENS.blue,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 28px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- Desmos panel ---------------------------- */

function DesmosCalculator({ onClose }) {
  const containerRef = useRef(null);
  const calcInstanceRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.Desmos) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
    return () => {
      // leave script cached across mounts; don't remove
    };
  }, []);

  useEffect(() => {
    if (loaded && containerRef.current && !calcInstanceRef.current) {
      calcInstanceRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
        keypad: true,
        expressions: true,
        settingsMenu: false,
        zoomButtons: true,
        border: false,
      });
    }
    return () => {
      if (calcInstanceRef.current) {
        calcInstanceRef.current.destroy();
        calcInstanceRef.current = null;
      }
    };
  }, [loaded]);

  return (
    <div
      style={{
        position: "fixed",
        top: 100,
        right: 24,
        width: 360,
        height: 460,
        background: TOKENS.bg,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 10,
        boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
        zIndex: 55,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: TOKENS.font,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          borderBottom: `1px solid ${TOKENS.borderLight}`,
          background: TOKENS.chrome,
          cursor: "default",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: TOKENS.navy }}>
          Calculator
        </span>
        <button
          onClick={onClose}
          style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", color: TOKENS.textMuted }}
        >
          ✕
        </button>
      </div>
      <div ref={containerRef} style={{ flex: 1 }}>
        {!loaded && (
          <div style={{ padding: 20, fontSize: 13, color: TOKENS.textMuted }}>
            Loading calculator…
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ Main in-module UI ============================ */

export function BluebookQuizScreen({
  questions,           // array of question objects for THIS module only
  sectionLabel,        // e.g. "Section 1, Module 1: Reading and Writing"
  subject,             // "Reading and Writing" | "Math"
  durationMinutes,     // real Bluebook duration for this module
  initialSecondsLeft,
  initialQuestionIndex = 0,
  initialEliminated = {},
  initialHighlights = {},
  notesByQuestion = {},
  setNotesByQuestion,
  onSessionChange,
  isPracticeTest = true,
  userName,
  answers,             // { [questionId]: answerValue }
  setAnswers,
  marked,              // Set of marked question ids
  onToggleMark,
  onModuleComplete,    // (answers, timeSpentSeconds) => void
  onExit,              // () => void  (back to setup / abandon)
}) {
  const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex);
  const [secondsLeft, setSecondsLeft] = useState(initialSecondsLeft ?? durationMinutes * 60);
  const [timerHidden, setTimerHidden] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [showFiveMinWarning, setShowFiveMinWarning] = useState(false);
  const [fiveMinWarningShown, setFiveMinWarningShown] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [questionZoom, setQuestionZoom] = useState(100);
  const [highlights, setHighlights] = useState(initialHighlights);
  const [draftHighlight, setDraftHighlight] = useState("");
  const [gridInValue, setGridInValue] = useState("");
  const [eliminatorMode, setEliminatorMode] = useState(false);
  const [paneWidth, setPaneWidth] = useState(50); // percentage
const isDraggingRef = useRef(false);
const [eliminated, setEliminated] = useState(() => Object.fromEntries(Object.entries(initialEliminated).map(([id, values]) => [id, new Set(values)])));
function toggleEliminated(optionIndex) {
  setEliminated((prev) => {
    const cur = new Set(prev[q.id] || []);
    cur.has(optionIndex) ? cur.delete(optionIndex) : cur.add(optionIndex);
    return { ...prev, [q.id]: cur };
  });
}
  const startedAtRef = useRef(Date.now());

  const q = questions[currentIndex];
  const questionType = getQuestionType(q);
  const isMcq = questionType === "mcq";
  const fontSize = (base) => `${base * questionZoom / 100}px`;
function startDrag() {
  isDraggingRef.current = true;
  document.body.style.userSelect = "none";
}
function captureHighlight() {
  const selected = window.getSelection?.()?.toString().trim();
  if (selected) setDraftHighlight(selected.slice(0, 500));
}
function saveHighlight() {
  if (!draftHighlight || !q) return;
  setHighlights((previous) => ({ ...previous, [q.id]: [...(previous[q.id] || []), draftHighlight].slice(-10) }));
  setDraftHighlight("");
  window.getSelection?.()?.removeAllRanges?.();
}

useEffect(() => {
  function handleMove(e) {
    if (!isDraggingRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const containerWidth = window.innerWidth;
    const pct = (clientX / containerWidth) * 100;
    setPaneWidth(Math.min(75, Math.max(25, pct)));
  }
  function handleUp() {
    isDraggingRef.current = false;
    document.body.style.userSelect = "";
  }
  window.addEventListener("mousemove", handleMove);
  window.addEventListener("mouseup", handleUp);
  window.addEventListener("touchmove", handleMove);
  window.addEventListener("touchend", handleUp);
  return () => {
    window.removeEventListener("mousemove", handleMove);
    window.removeEventListener("mouseup", handleUp);
    window.removeEventListener("touchmove", handleMove);
    window.removeEventListener("touchend", handleUp);
  };
}, []);

  // countdown
  useEffect(() => {
    if (secondsLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 5 * 60 && !fiveMinWarningShown) {
      setShowFiveMinWarning(true);
      setFiveMinWarningShown(true);
    }
  }, [secondsLeft, fiveMinWarningShown]);

  useEffect(() => {
    onSessionChange?.({ currentQuestionIndex: currentIndex, secondsLeft, eliminated: Object.fromEntries(Object.entries(eliminated).map(([id, values]) => [id, [...values]])), highlights });
  }, [currentIndex, answers, marked, eliminated, notesByQuestion, highlights]);

  useEffect(() => {
    if (secondsLeft > 0 && secondsLeft % 30 === 0) onSessionChange?.({ currentQuestionIndex: currentIndex, secondsLeft, eliminated: Object.fromEntries(Object.entries(eliminated).map(([id, values]) => [id, [...values]])), highlights });
  }, [secondsLeft]);

  useEffect(() => {
    // sync grid-in text field with stored answer when navigating
    if (q && ["gridIn", "numeric"].includes(getQuestionType(q))) {
      setGridInValue(answers[q.id] ?? "");
    }
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAutoSubmit = useCallback(() => {
    const spent = Math.round((Date.now() - startedAtRef.current) / 1000);
    onModuleComplete(answers, spent);
  }, [answers, onModuleComplete]);

  function selectMcq(optionIndex) {
    setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }));
  }

  function commitGridIn(val) {
    setGridInValue(val);
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      const spent = Math.round((Date.now() - startedAtRef.current) / 1000);
      onModuleComplete(answers, spent);
    }
  }

  function goBack() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }

  if (!q) return null;

  const isRW = subject === "Reading and Writing";

    return (
    <div style={{ fontFamily: TOKENS.font, minHeight: "100vh", display: "flex", flexDirection: "column", background: TOKENS.bg }}>
  
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          borderBottom: `1px solid ${TOKENS.borderLight}`,
        }}
      >
              <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TOKENS.navy }}>
            {sectionLabel}
          </div>
          <button
            onClick={() => setDirectionsOpen(true)}
            style={{
              border: "none",
              background: "none",
              color: TOKENS.blue,
              fontSize: 13,
              fontWeight: 600,
              padding: 0,
              marginTop: 2,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Directions <span style={{ fontSize: 10 }}>{directionsOpen ? "︿" : "⌄"}</span>
          </button>
        </div>
        <TimerPill
          secondsLeft={secondsLeft}
          hidden={timerHidden}
          onToggleHidden={() => setTimerHidden((h) => !h)}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {subject === "Math" && (
            <button
              onClick={() => setCalcOpen((v) => !v)}
              style={{
                border: `1px solid ${TOKENS.border}`,
                background: calcOpen ? TOKENS.blueLight : "#fff",
                color: TOKENS.navy,
                borderRadius: 6,
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🖩 Calculator
            </button>
          )}
          {subject === "Math" && <button onClick={() => setReferenceOpen(true)} style={{ border: `1px solid ${TOKENS.border}`, background: referenceOpen ? TOKENS.blueLight : "#fff", color: TOKENS.navy, borderRadius: 6, padding: "6px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Reference sheet</button>}
          <div aria-label="Question text size" style={{ display: "flex", alignItems: "center", gap: 4, color: TOKENS.textMuted, fontSize: 10 }}><button aria-label="Decrease question text size" onClick={() => setQuestionZoom((value) => Math.max(80, value - 10))} style={{ border: `1px solid ${TOKENS.border}`, background: "#fff", borderRadius: 5, padding: "5px 7px", cursor: "pointer" }}>A−</button><span>{questionZoom}%</span><button aria-label="Increase question text size" onClick={() => setQuestionZoom((value) => Math.min(150, value + 10))} style={{ border: `1px solid ${TOKENS.border}`, background: "#fff", borderRadius: 5, padding: "5px 7px", cursor: "pointer" }}>A+</button></div>
          <button
            style={{
              border: "none",
              background: "none",
              fontSize: 12,
              color: TOKENS.navy,
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => setNotesOpen((open) => !open)}
            title="Open notes for this question"
          >
            ✎ Notes
          </button>
          <button
  onClick={() => setEliminatorMode((v) => !v)}
  style={{
    border: `1px solid ${eliminatorMode ? TOKENS.blue : TOKENS.border}`,
    background: eliminatorMode ? TOKENS.blueLight : "none",
    borderRadius: 4,
    padding: "4px 8px",
    fontSize: 12,
    fontWeight: 700,
    color: TOKENS.navy,
    cursor: "pointer",
  }}
  title="Answer Eliminator"
>
  A̶B̶C̶
</button>
          <div style={{ position: "relative" }}>
  <button
    onClick={() => setMoreMenuOpen(o => !o)}
    style={{
      border: "none",
      background: "none",
      fontSize: 18,
      color: TOKENS.textMuted,
      cursor: "pointer",
    }}
    title="More options"
  >
    ⋮
  </button>
  {moreMenuOpen && (
    <div style={{
      position: "absolute",
      right: 0,
      top: "100%",
      marginTop: 4,
      background: "#fff",
      border: `1px solid ${TOKENS.border}`,
      borderRadius: 8,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      minWidth: 180,
      zIndex: 100,
    }}>
      {["Help", "Shortcuts", "Assistive Technology", "Line Reader"].map(label => (
        <div key={label} style={{ padding: "10px 14px", fontSize: 14, color: TOKENS.textMuted, cursor: "not-allowed" }}>
          {label}
        </div>
      ))}
      <div
        onClick={() => { setMoreMenuOpen(false); onExit(secondsLeft); }}
        style={{ padding: "10px 14px", fontSize: 14, color: TOKENS.blue, fontWeight: 600, cursor: "pointer", borderTop: `1px solid ${TOKENS.border}` }}
      >
        Save & Exit
      </div>
    </div>
  )}
</div>
        </div>
      </div>
  
      {isPracticeTest && (
        <div
          style={{
            background: TOKENS.navy,
            color: "#fff",
            textAlign: "center",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            padding: "4px 0",
          }}
        >
          THIS IS A PRACTICE TEST
        </div>
      )}

       {directionsOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 80,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 60,
          }}
          onClick={() => setDirectionsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              width: "90%",
              maxWidth: 900,
              minHeight: 280,
              borderRadius: 4,
              padding: "32px 40px",
              fontFamily: TOKENS.font,
              boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
            }}
          >
                        <div style={{ fontSize: 16, lineHeight: 1.7, color: "#1A1A1A" }}>
              {subject === "Math" ? (
                <>
                  <p>The questions in this section address a number of important math skills.</p>
                  <p>Unless otherwise indicated: All variables and expressions represent real numbers. All figures are drawn to scale. All angle measures are positive. All numbers are real numbers.</p>
                  <p>For each question, determine the best answer using the information provided. You may use the calculator throughout this section.</p>
                </>
              ) : (
                <>
                  <p>The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).</p>
                  <p>All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.</p>
                </>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32 }}>
              <button
                onClick={() => setDirectionsOpen(false)}
                style={{
                  background: TOKENS.gold,
                  color: "#1A1A1A",
                  border: "none",
                  borderRadius: 24,
                  padding: "10px 32px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

        
          </div>
        </div>
      )}
            {/* Body */}
        {referenceOpen && <div role="dialog" aria-modal="true" aria-label="AceBoard Math reference sheet" style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(17,25,43,.42)", display: "grid", placeItems: "center", padding: 18 }} onClick={() => setReferenceOpen(false)}><section onClick={(event) => event.stopPropagation()} style={{ width: "min(540px, 100%)", maxHeight: "80vh", overflow: "auto", background: "#fff", borderRadius: 12, padding: 22, boxShadow: "0 18px 48px rgba(10,20,40,.25)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ color: TOKENS.textMuted, fontSize: 10, letterSpacing: 1 }}>ACEBOARD TOOL</div><h2 style={{ color: TOKENS.navy, fontSize: 19, margin: "6px 0 2px" }}>Math reference sheet</h2></div><button aria-label="Close reference sheet" onClick={() => setReferenceOpen(false)} style={{ border: 0, background: "none", fontSize: 22, cursor: "pointer", color: TOKENS.textMuted }}>×</button></div><div style={{ color: TOKENS.textMuted, fontSize: 11, margin: "5px 0 14px" }}>AceBoard study aid. Check official test instructions for the tools available in any specific exam.</div>{[["Algebra", "(a + b)² = a² + 2ab + b²", "(a − b)² = a² − 2ab + b²", "a² − b² = (a − b)(a + b)"], ["Geometry", "Rectangle area: A = lw", "Triangle area: A = ½bh", "Circle area: A = πr²", "Circle circumference: C = 2πr"], ["Right triangles", "a² + b² = c²"], ["Solids", "Rectangular prism: V = lwh", "Cylinder: V = πr²h"]].map(([heading, ...items]) => <div key={heading} style={{ borderTop: `1px solid ${TOKENS.border}`, padding: "12px 0" }}><strong style={{ color: TOKENS.navy, fontSize: 12 }}>{heading}</strong>{items.map((item) => <div key={item} style={{ color: TOKENS.text, fontSize: 13, paddingTop: 6 }}>{item}</div>)}</div>)}</section></div>}
        {notesOpen && <aside style={{ position: "fixed", zIndex: 70, right: 18, top: 94, width: "min(340px, calc(100vw - 36px))", background: "#fff", border: `1px solid ${TOKENS.border}`, borderRadius: 10, padding: 14, boxShadow: "0 12px 32px rgba(20,30,50,.2)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><strong style={{ color: TOKENS.navy, fontSize: 13 }}>Question notes</strong><button aria-label="Close notes" onClick={() => setNotesOpen(false)} style={{ border: 0, background: "none", cursor: "pointer", color: TOKENS.textMuted }}>×</button></div><textarea aria-label={`Notes for question ${currentIndex + 1}`} value={notesByQuestion[q.id] || ""} onChange={(event) => setNotesByQuestion?.((prev) => ({ ...prev, [q.id]: event.target.value }))} maxLength={1000} placeholder="Jot down a thought to revisit…" style={{ width: "100%", minHeight: 130, resize: "vertical", border: `1px solid ${TOKENS.border}`, borderRadius: 7, padding: 10, font: `13px ${TOKENS.font}`, color: TOKENS.navy }} /><span style={{ fontSize: 10, color: TOKENS.textMuted }}>Saved with this practice session</span></aside>}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {isRW && q.passage && (
          <>
            <div
              style={{
                width: `${paneWidth}%`,
                fontFamily: TOKENS.serif,
                padding: "28px 32px",
                overflowY: "auto",
                fontSize: fontSize(16),
                lineHeight: 1.7,
                color: "#1A1A1A",
              }}
            >
              <div onMouseUp={captureHighlight}>{q.passage}</div>
              {draftHighlight && <button onClick={saveHighlight} style={{ border: `1px solid ${TOKENS.border}`, borderRadius: 5, background: TOKENS.blueLight, color: TOKENS.navy, padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>Save selected text</button>}
              {(highlights[q.id] || []).map((item, index) => <div key={`${q.id}-${index}`} style={{ marginTop: 8, borderLeft: `3px solid ${TOKENS.gold}`, padding: "4px 8px", background: "#fff8e8", fontSize: 12 }}>{item}</div>)}
            </div>
            <div
              onMouseDown={startDrag}
              onTouchStart={startDrag}
              style={{
                width: 6,
                cursor: "col-resize",
                background: TOKENS.borderLight,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 2, height: 32, background: TOKENS.border, borderRadius: 2 }} />
            </div>
          </>
        )}

        <div
          style={{
                        width: isRW && q.passage ? `${100 - paneWidth}%` : "100%",
            maxWidth: isRW && q.passage ? "none" : 640,
            margin: isRW && q.passage ? 0 : "0 auto",
            padding: "28px 32px",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div
              style={{
                background: TOKENS.navy,
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                width: 28,
                height: 28,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {currentIndex + 1}
            </div>
            <button
              onClick={() => onToggleMark(q.id)}
              style={{
                            
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: marked.has(q.id) ? TOKENS.red : TOKENS.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={marked.has(q.id) ? TOKENS.red : "none"} stroke={marked.has(q.id) ? TOKENS.red : TOKENS.textMuted} strokeWidth="2">
  <path d="M5 3v18l7-5 7 5V3a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1z" />
</svg>
Mark for Review
            </button>
          </div>

          {!isRW && q.passage && (
            <div style={{ fontSize: fontSize(15), lineHeight: 1.6, marginBottom: 16, color: "#1A1A1A" }}>
              {q.passage}
            </div>
          )}

          {q.image && <img src={q.image} alt={q.imageAlt || `Question graphic for ${q.topic || "this item"}`} style={{ display: "block", maxWidth: "100%", maxHeight: 420, objectFit: "contain", margin: "12px 0 20px" }} />}

                    <div style={{ fontSize: fontSize(16), lineHeight: 1.6, color: "#1A1A1A", marginBottom: 24, fontWeight: 500, fontFamily: TOKENS.serif }}>
            {q.question ?? q.stem}
          </div>

          {isMcq ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const selected = answers[q.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => eliminatorMode ? toggleEliminated(i) : selectMcq(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "left",
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: selected ? `2px solid ${TOKENS.blue}` : `1px solid ${TOKENS.border}`,
                      background: selected ? TOKENS.blueLight : "#fff",
                      cursor: "pointer",
                      fontSize: fontSize(15),
                      color: "#1A1A1A",
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        border: `1.5px solid ${selected ? TOKENS.blue : TOKENS.border}`,
                        background: selected ? TOKENS.blue : "#fff",
                        color: selected ? "#fff" : TOKENS.navy,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {letter}
                    </span>
                    <span style={{ textDecoration: (eliminated[q.id]?.has(i)) ? "line-through" : "none", opacity: (eliminated[q.id]?.has(i)) ? 0.5 : 1 }}>
  {opt}
</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <label style={{ fontSize: 12, color: TOKENS.textMuted, display: "block", marginBottom: 6 }}>
                Enter your answer:
              </label>
              <input
                value={gridInValue}
                onChange={(e) => commitGridIn(e.target.value)}
                style={{
                  border: `1.5px solid ${TOKENS.border}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 16,
                  width: 200,
                }}
                placeholder="Answer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav bar */}
      <div
        style={{
          borderTop: `1px solid ${TOKENS.borderLight}`,
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 13, color: TOKENS.textMuted, fontWeight: 600 }}>
          {userName}
        </div>

        <button
          onClick={() => setNavOpen(true)}
          style={{
            border: `1px solid ${TOKENS.border}`,
            background: "#fff",
            borderRadius: 20,
            padding: "6px 18px",
            fontSize: 13,
            fontWeight: 700,
            color: TOKENS.navy,
            cursor: "pointer",
          }}
        >
          Question {currentIndex + 1} of {questions.length} ⌃
        </button>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={goBack}
            disabled={currentIndex === 0}
            style={{
              border: `1px solid ${TOKENS.border}`,
              background: "#fff",
              color: currentIndex === 0 ? TOKENS.border : TOKENS.navy,
              borderRadius: 8,
              padding: "8px 20px",
              fontWeight: 700,
              fontSize: 14,
              cursor: currentIndex === 0 ? "default" : "pointer",
            }}
          >
            Back
          </button>
          <button
            onClick={goNext}
            style={{
              border: "none",
              background: TOKENS.blue,
              color: "#fff",
              borderRadius: 8,
              padding: "8px 24px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {currentIndex === questions.length - 1 ? "Next Module" : "Next"}
          </button>
        </div>
      </div>

      {navOpen && (
        <QuestionNavGrid
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          marked={marked}
          onJump={setCurrentIndex}
          onClose={() => setNavOpen(false)}
        />
      )}

      {showFiveMinWarning && (
        <FiveMinuteWarning onDismiss={() => setShowFiveMinWarning(false)} />
      )}

      {calcOpen && <DesmosCalculator onClose={() => setCalcOpen(false)} />}
    </div>
  );
}

/* ============================ Directions interstitial ============================ */

function DirectionsScreen({ sectionLabel, subject, durationMinutes, onStart }) {
  return (
    <div
      style={{
        fontFamily: TOKENS.font,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: TOKENS.bg,
      }}
    >
      <div style={{ maxWidth: 520, textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.blue, marginBottom: 10 }}>
          {sectionLabel}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: TOKENS.navy, marginBottom: 16 }}>
          {subject === "Reading and Writing" ? "Reading and Writing" : "Math"}
        </div>
        <div style={{ fontSize: 15, color: TOKENS.textMuted, lineHeight: 1.6, marginBottom: 28 }}>
          {subject === "Reading and Writing"
            ? "This module has questions with one or more passages. Read each passage and question, then choose the best answer."
            : "This module has multiple-choice and student-produced response (grid-in) questions. A calculator is available for every question in this module."}
          <br />
          <br />
          You will have <strong>{durationMinutes} minutes</strong> to complete this module.
          Once you start, the timer will run continuously, and the module
          will submit automatically when time expires.
        </div>
        <button
          onClick={onStart}
          style={{
            background: TOKENS.blue,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 36px",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Start Module
        </button>
      </div>
    </div>
  );
}

function BreakScreen({ onContinue, onTick, initialSecondsLeft = 10 * 60 }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSecondsLeft);
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);
  useEffect(() => {
    if (secondsLeft % 30 === 0) onTick?.(secondsLeft);
  }, [secondsLeft]);

  return (
    <div
      style={{
        fontFamily: TOKENS.font,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: TOKENS.chrome,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: TOKENS.navy, marginBottom: 10 }}>
          Break
        </div>
        <div style={{ fontSize: 15, color: TOKENS.textMuted, marginBottom: 24 }}>
          Take a short break before continuing to Math.
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: TOKENS.navy, marginBottom: 24, fontVariantNumeric: "tabular-nums" }}>
          {formatTime(secondsLeft)}
        </div>
        <button
          onClick={onContinue}
          disabled={secondsLeft > 0}
          style={{
            background: secondsLeft > 0 ? TOKENS.border : TOKENS.blue,
            color: secondsLeft > 0 ? TOKENS.textMuted : "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 28px",
            fontWeight: 700,
            fontSize: 14,
            cursor: secondsLeft > 0 ? "not-allowed" : "pointer",
          }}
        >
          {secondsLeft > 0 ? "Break in progress" : "Continue to Math"}
        </button>
      </div>
    </div>
  );
}

/* ============================ Practice test selector ============================ */

/**
 * Reads whatever practiceTest numbers exist in allQuestions and lists them
 * as selectable cards — mirrors Bluebook's real "choose your practice test"
 * screen. Adding Practice Test 5, 6, etc. to QUESTIONS later requires no
 * changes here; the list is fully derived from the data.
 */
export function PracticeTestSelect({ allQuestions, onSelect, onBack, activeTest, completedTests = [], onResume, onViewResults }) {
  const [tab, setTab] = useState(activeTest ? "active" : "past");

  const satQuestions = allQuestions.filter((q) => q.exam === "SAT" && q.practiceTest != null);

  const testNumbers = Array.from(new Set(satQuestions.map((q) => q.practiceTest))).sort(
    (a, b) => a - b
  );

  function countFor(testNum) {
    return satQuestions.filter((q) => q.practiceTest === testNum).length;
  }

  return (
    <div style={{ fontFamily: TOKENS.font, minHeight: "100vh", background: TOKENS.chrome, padding: "40px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <button
          onClick={onBack}
          style={{ border: "none", background: "none", color: TOKENS.blue, fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 20, padding: 0 }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 22, fontWeight: 800, color: TOKENS.navy, marginBottom: 6 }}>
          Full-Length Practice Tests
        </div>
        <div style={{ fontSize: 14, color: TOKENS.textMuted, marginBottom: 28 }}>
          Choose an official-format practice test to take under real,
          timed conditions — just like Bluebook.
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setTab("active")}
            style={{
              background: tab === "active" ? TOKENS.navy : "#fff",
              color: tab === "active" ? "#fff" : TOKENS.navy,
              border: `1px solid ${TOKENS.border}`,
              borderRadius: 20,
              padding: "6px 16px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {activeTest ? "✓ " : ""}Active
          </button>
          <button
            onClick={() => setTab("past")}
            style={{
              background: tab === "past" ? TOKENS.navy : "#fff",
              color: tab === "past" ? "#fff" : TOKENS.navy,
              border: `1px solid ${TOKENS.border}`,
              borderRadius: 20,
              padding: "6px 16px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Past
          </button>
        </div>

        {tab === "active" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {activeTest && (
              <div style={{ background: "#EEF2FF", border: `1px solid ${TOKENS.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: TOKENS.navy, marginBottom: 4 }}>
                  SAT Practice {activeTest.practiceTest}
                </div>
                <div style={{ fontSize: 13, color: TOKENS.textMuted, marginBottom: 16 }}>
                  ⏱ In Progress
                </div>
                <button
                  onClick={() => onResume(activeTest)}
                  style={{ background: TOKENS.blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%" }}
                >
                  Resume
                </button>
              </div>
            )}
            {testNumbers.length === 0 ? (
              <div style={{ color: TOKENS.textMuted, fontSize: 14 }}>
                No full-length practice tests are available yet.
              </div>
            ) : (
              testNumbers
                .filter((n) => n !== activeTest?.practiceTest)
                .map((num) => {
                  const count = countFor(num);
                  const complete = count >= 98;
                  return (
                    <div key={num} style={{ background: "#fff", border: `1px solid ${TOKENS.border}`, borderRadius: 12, padding: 20 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: TOKENS.navy, marginBottom: 4 }}>
                        Practice Test {num}
                      </div>
                      <div style={{ fontSize: 13, color: TOKENS.textMuted, marginBottom: 16 }}>
                        {count} questions {!complete && "(partial)"}
                      </div>
                      <button
                        onClick={() => onSelect(num)}
                        style={{ background: TOKENS.blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%" }}
                      >
                        Start Test
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {tab === "past" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {completedTests.length === 0 ? (
              <div style={{ color: TOKENS.textMuted, fontSize: 14 }}>No completed tests yet.</div>
            ) : (
              completedTests.slice().reverse().map((t, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${TOKENS.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TOKENS.navy, marginBottom: 4 }}>
                    SAT Practice {t.practiceTest}
                  </div>
                  <div style={{ fontSize: 13, color: TOKENS.textMuted, marginBottom: 4 }}>✓ Completed</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: TOKENS.navy, marginBottom: 16 }}>{t.totalScore}</div>
                  <button
                    onClick={() => onViewResults(t)}
                    style={{ background: "none", color: TOKENS.blue, border: `1px solid ${TOKENS.blue}`, borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%" }}
                  >
                    View My Responses
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
/* ============================ Test Runner ============================ */

/**
 * Sequences all 4 SAT modules using your existing QUESTIONS array.
 * Drop this in wherever you currently render <QuizScreen ... /> when
 * config.exam === "SAT". Requires a `practiceTest` number (from
 * PracticeTestSelect) so it pu
 * never a merged pool across multiple practice tests.
 *
 * Expects `allQuestions` = your full QUESTIONS array (already imported
 * in App.jsx).
 */
export function SatTestRunner({ allQuestions, practiceTest, isPracticeTest = true, userName, onFinish, onExit, onSaveExit, onSessionChange, resumeState }) {
  const MODULE_SEQUENCE = [
    { subject: "Reading and Writing", module: "Module 1", label: "Section 1, Module 1: Reading and Writing" },
    { subject: "Reading and Writing", module: "Module 2", label: "Section 1, Module 2: Reading and Writing" },
    { subject: "Math", module: "Module 1", label: "Section 2, Module 1: Math" },
    { subject: "Math", module: "Module 2", label: "Section 2, Module 2: Math" },
  ];

  const restored = restoreSatSession(resumeState) || resumeState || {};
  const [stepIndex, setStepIndex] = useState(restored.currentModuleIndex ?? restored.stepIndex ?? 0);
  const [phase, setPhase] = useState(restored.phase ?? "directions");
  const [allAnswers, setAllAnswers] = useState(restored.responses ?? restored.allAnswers ?? {});
  const [allMarked, setAllMarked] = useState(() => {
    const saved = Object.fromEntries(Object.entries(restored.allMarked || {}).map(([k, v]) => [k, new Set(v)]));
    if (restored.markedQuestionIds) {
      const currentStep = MODULE_SEQUENCE[restored.currentModuleIndex ?? restored.stepIndex ?? 0];
      if (currentStep) saved[`${currentStep.subject}-${currentStep.module}`] = new Set(restored.markedQuestionIds);
    }
    return saved;
  });
  const [allNotes, setAllNotes] = useState(restored.notesByQuestion || {});
  const [moduleSession, setModuleSession] = useState(restored.moduleSession || {});
  const [routeDecisions, setRouteDecisions] = useState(restored.routeDecisions || {});
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(restored.breakSecondsLeft ?? 10 * 60);
  const [results, setResults] = useState([]);

  const step = MODULE_SEQUENCE[stepIndex];
  const moduleKey = `${step.subject}-${step.module}`;
  const durationMinutes = MODULE_DURATIONS[step.subject][step.module];

  const baseModuleQuestions = allQuestions.filter(
    (q) =>
      q.exam === "SAT" &&
      q.practiceTest === practiceTest &&
      q.subject === step.subject &&
      q.module === step.module
  );

  const routeForSection = routeDecisions[step.subject];
  const routeQuestions = step.module === "Module 2" && routeForSection
    ? baseModuleQuestions.filter((question) => question.adaptivePath === routeForSection.route || question.adaptivePath === "shared")
    : [];
  const moduleQuestions = routeQuestions.length ? routeQuestions : baseModuleQuestions;

  const answers = allAnswers[moduleKey] || {};
  const marked = allMarked[moduleKey] || new Set();

  function setAnswersForModule(updater) {
    setAllAnswers((prev) => ({
      ...prev,
      [moduleKey]: typeof updater === "function" ? updater(prev[moduleKey] || {}) : updater,
    }));
  }

  function toggleMark(qId) {
    setAllMarked((prev) => {
      const cur = new Set(prev[moduleKey] || []);
      cur.has(qId) ? cur.delete(qId) : cur.add(qId);
      return { ...prev, [moduleKey]: cur };
    });
  }

  function handleModuleComplete(finalAnswers, timeSpentSeconds) {
    const correctCount = moduleQuestions.reduce((acc, q) => {
      const given = finalAnswers[q.id];
      if (given === undefined || given === "") return acc;
      const isCorrect =
        ["gridIn", "numeric"].includes(getQuestionType(q))
          ? String(given).trim() === String(q.answer).trim()
          : given === q.answer;
      return acc + (isCorrect ? 1 : 0);
    }, 0);

    setResults((prev) => [
      ...prev,
      {
        subject: step.subject,
        module: step.module,
        total: moduleQuestions.length,
        correct: correctCount,
        timeSpentSeconds,
      },
    ]);

    const isLastModule = stepIndex === MODULE_SEQUENCE.length - 1;
    if (step.module === "Module 1") {
      const route = decideAceBoardRoute({ correct: correctCount, total: moduleQuestions.length });
      setRouteDecisions((previous) => ({ ...previous, [step.subject]: route }));
    }
    if (isLastModule) {
      onFinish({
        results: [...results, {
          subject: step.subject,
          module: step.module,
          total: moduleQuestions.length,
          correct: correctCount,
          timeSpentSeconds,
        }],
        answers: allAnswers,
        routeDecisions,
        scoringLabel: "AceBoard simulated practice estimate; not an official SAT score",
      });
      return;
    }

    const nextStep = MODULE_SEQUENCE[stepIndex + 1];
    setModuleSession({ currentQuestionIndex: 0, secondsLeft: MODULE_DURATIONS[nextStep.subject][nextStep.module] * 60, eliminated: {} });
    const goingToMath = MODULE_SEQUENCE[stepIndex + 1].subject === "Math" && step.subject === "Reading and Writing";
    setStepIndex((i) => i + 1);
    setPhase(goingToMath ? "break" : "directions");
  }
  function handleSaveAndExit(secondsLeft) {
    const snapshot = serializeSatSession({
      schemaVersion: 1,
      testFormId: `aceboard-sat-${practiceTest}`,
      practiceTest,
      currentModuleIndex: stepIndex,
      stepIndex,
      phase,
      currentQuestionIndex: moduleSession.currentQuestionIndex ?? 0,
      remainingSeconds: secondsLeft ?? moduleSession.secondsLeft ?? durationMinutes * 60,
      responses: allAnswers,
      allAnswers,
      markedQuestionIds: [...marked],
      allMarked: Object.fromEntries(Object.entries(allMarked).map(([k, v]) => [k, [...v]])),
      eliminatedChoices: moduleSession.eliminated || {},
      notesByQuestion: allNotes,
      highlightsByQuestion: moduleSession.highlights || {},
      routeDecisions,
      breakSecondsLeft,
      moduleSession,
      questionIds: allQuestions.filter((q) => q.exam === "SAT" && q.practiceTest === practiceTest).map((q) => q.id),
    });
    onSaveExit(snapshot);
    onExit();
  }
  const handleModuleSessionChange = useCallback((session) => {
    setModuleSession(session);
    const snapshot = serializeSatSession({
      schemaVersion: 1,
      testFormId: `aceboard-sat-${practiceTest}`,
      practiceTest,
      currentModuleIndex: stepIndex,
      stepIndex,
      phase,
      currentQuestionIndex: session.currentQuestionIndex,
      remainingSeconds: session.secondsLeft,
      responses: allAnswers,
      allAnswers,
      markedQuestionIds: [...marked],
      allMarked: Object.fromEntries(Object.entries(allMarked).map(([k, v]) => [k, [...v]])),
      eliminatedChoices: session.eliminated || {},
      notesByQuestion: allNotes,
      highlightsByQuestion: session.highlights || {},
      routeDecisions,
      breakSecondsLeft,
      moduleSession: session,
      questionIds: allQuestions.filter((q) => q.exam === "SAT" && q.practiceTest === practiceTest).map((q) => q.id),
    });
    onSessionChange?.(snapshot);
  }, [practiceTest, stepIndex, phase, allAnswers, marked, allMarked, allNotes, routeDecisions, breakSecondsLeft, allQuestions, onSessionChange]);
  useEffect(() => {
    if (!onSessionChange) return;
    onSessionChange(serializeSatSession({
      schemaVersion: 1, testFormId: `aceboard-sat-${practiceTest}`, practiceTest,
      currentModuleIndex: stepIndex, stepIndex, phase,
      currentQuestionIndex: moduleSession.currentQuestionIndex ?? 0,
      remainingSeconds: moduleSession.secondsLeft ?? restored.remainingSeconds ?? restored.secondsLeft ?? durationMinutes * 60,
      responses: allAnswers, allAnswers,
      markedQuestionIds: [...marked],
      allMarked: Object.fromEntries(Object.entries(allMarked).map(([k, v]) => [k, [...v]])),
      eliminatedChoices: moduleSession.eliminated || {}, notesByQuestion: allNotes, highlightsByQuestion: moduleSession.highlights || {},
      routeDecisions, breakSecondsLeft, moduleSession,
      questionIds: allQuestions.filter((q) => q.exam === "SAT" && q.practiceTest === practiceTest).map((q) => q.id),
    }));
  }, [stepIndex, phase, allAnswers, allMarked, allNotes, routeDecisions, breakSecondsLeft]);
  if (moduleQuestions.length === 0) {
    return (
      <div style={{ fontFamily: TOKENS.font, padding: 40, textAlign: "center", color: TOKENS.textMuted }}>
        No questions found for {step.label} in Practice Test {practiceTest}.
        Check that your QUESTIONS array has entries with practiceTest{" "}
        {practiceTest}, subject "{step.subject}", and module "{step.module}".
        <div style={{ marginTop: 16 }}>
          <button onClick={onExit} style={{ color: TOKENS.blue, background: "none", border: "none", cursor: "pointer" }}>
            Back to setup
          </button>
        </div>
      </div>
    );
  }

  if (phase === "break") {
    return <BreakScreen initialSecondsLeft={breakSecondsLeft} onTick={setBreakSecondsLeft} onContinue={() => { setBreakSecondsLeft(10 * 60); setPhase("directions"); }} />;
  }

  if (phase === "directions") {
    return (
      <DirectionsScreen
        sectionLabel={step.label}
        subject={step.subject}
        durationMinutes={durationMinutes}
        onStart={() => setPhase("quiz")}
      />
    );
  }

  return (
    <BluebookQuizScreen
          userName={userName}
      questions={moduleQuestions}
      sectionLabel={step.label}
      subject={step.subject}
      durationMinutes={durationMinutes}
      initialSecondsLeft={stepIndex === (restored.currentModuleIndex ?? restored.stepIndex) ? restored.remainingSeconds ?? restored.secondsLeft : undefined}
      initialQuestionIndex={stepIndex === (restored.currentModuleIndex ?? restored.stepIndex) ? restored.currentQuestionIndex ?? 0 : 0}
      initialEliminated={stepIndex === (restored.currentModuleIndex ?? restored.stepIndex) ? restored.eliminatedChoices || {} : {}}
      initialHighlights={moduleSession.highlights || restored.highlightsByQuestion || {}}
      notesByQuestion={allNotes}
      setNotesByQuestion={setAllNotes}
      onSessionChange={handleModuleSessionChange}
      isPracticeTest={isPracticeTest}
      answers={answers}
      setAnswers={setAnswersForModule}
      marked={marked}
      onToggleMark={toggleMark}
      onModuleComplete={handleModuleComplete}
            onExit={handleSaveAndExit}
    />
  );
}
