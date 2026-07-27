const fs = require('fs');
const path = 'src/App.jsx';
let content = fs.readFileSync(path, 'utf8');
let changes = 0;

// PATCH 1: Add WheelPicker + PickerModal components right before "STREAK DATA" section
const anchor1 = `// ── STREAK DATA ───────────────────────────────────────────────────────────`;
const wheelComponents = `// ── WHEEL PICKER (iOS-style scroll picker) ───────────────────────────────────
function WheelPicker({ options, value, onChange, itemHeight = 44, visibleCount = 5 }) {
  const ref = useRef(null);
  const containerHeight = itemHeight * visibleCount;
  const padding = (containerHeight - itemHeight) / 2;

  useEffect(() => {
    const idx = options.indexOf(value);
    if (ref.current && idx >= 0) ref.current.scrollTop = idx * itemHeight;
  }, []);

  const handleScroll = () => {
    clearTimeout(ref.current._t);
    ref.current._t = setTimeout(() => {
      const idx = Math.round(ref.current.scrollTop / itemHeight);
      const clamped = Math.max(0, Math.min(options.length - 1, idx));
      ref.current.scrollTo({ top: clamped * itemHeight, behavior: "smooth" });
      onChange(options[clamped]);
    }, 120);
  };

  return (
    <div style={{ position: "relative", height: containerHeight, overflow: "hidden", flex: 1 }}>
      <div style={{ position: "absolute", top: padding, left: 0, right: 0, height: itemHeight, backgroundColor: "#1E3A5F", borderRadius: 10, pointerEvents: "none", zIndex: 1 }} />
      <div ref={ref} onScroll={handleScroll} style={{ height: containerHeight, overflowY: "scroll", scrollSnapType: "y mandatory", position: "relative", zIndex: 2 }}>
        <div style={{ height: padding }} />
        {options.map((opt, i) => (
          <div key={i} style={{ height: itemHeight, display: "flex", alignItems: "center", justifyContent: "center", scrollSnapAlign: "center", fontSize: opt === value ? 18 : 15, fontWeight: opt === value ? 800 : 500, color: opt === value ? "#F0F2FF" : "#64748B", transition: "all 0.15s" }}>
            {opt}
          </div>
        ))}
        <div style={{ height: padding }} />
      </div>
    </div>
  );
}

function PickerModal({ title, children, onClose, onConfirm }) {
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "#0D1326", borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 480, boxShadow: "0 -10px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#F0F2FF" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
        </div>
        {children}
        <button onClick={onConfirm} style={{ ...S.btnPrimary, marginTop: 16 }}>Done</button>
      </div>
    </div>
  );
}

${anchor1}`;

if (content.includes(anchor1) && !content.includes('function WheelPicker')) {
  content = content.replace(anchor1, wheelComponents);
  changes++;
  console.log('Patch 1 (WheelPicker + PickerModal components) applied');
} else {
  console.log('Patch 1 (WheelPicker + PickerModal components) NOT found or already applied - skipped');
}

// PATCH 2: Replace PracticeSetup entirely with the wheel-picker + checklist version
const oldPracticeSetup = `const MOCK_ELIGIBLE = ["WAEC", "JAMB", "NECO"];
const TIMER_PRESETS = [15, 30, 45, 60, 90, 120];

function PracticeSetup({ profile, defaultExam, onBegin, onBack }) {
  const myExams = profile?.exams?.length ? profile.exams : EXAMS;
  const [exam, setExam] = useState(defaultExam || myExams[0] || "WAEC");
  const [subject, setSubject] = useState("All Subjects");
  const [topic, setTopic] = useState("All Topics");
  const [year, setYear] = useState("All Years");
  const [count, setCount] = useState(10);
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [mode, setMode] = useState("practice");

  const subjectsForExam = ["All Subjects", ...new Set(QUESTIONS.filter(q => q.exam === exam).map(q => q.subject))];
  const topicsForSubject = subject === "All Subjects" ? ["All Topics"] :
    ["All Topics", ...new Set(QUESTIONS.filter(q => q.exam === exam && q.subject === subject).map(q => q.topic))];
  const yearsForTopic = ["All Years", ...new Set(QUESTIONS.filter(q =>
    q.exam === exam &&
    (subject === "All Subjects" || q.subject === subject) &&
    (topic === "All Topics" || q.topic === topic)
  ).map(q => q.year))].sort((a, b) => (a === "All Years" ? -1 : b === "All Years" ? 1 : b - a));

  const available = QUESTIONS.filter(q =>
    q.exam === exam &&
    (subject === "All Subjects" || q.subject === subject) &&
    (topic === "All Topics" || q.topic === topic) &&
    (year === "All Years" || q.year === year)
  );

  const showMock = MOCK_ELIGIBLE.includes(exam);
  const modeLabel = mode === "exam" ? "Exam Mode" : mode === "mock" ? "Mock Mode" : "Practice Mode";
  const ctaLabel = mode === "exam" ? "Start Timed Exam →" : mode === "mock" ? "Start Mock Test →" : "Start Practice →";

  return (
    <div style={{ ...S.screen, overflowY: "auto" }}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0, marginBottom: 16 }}>
          <div style={S.row(6)}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Back</span></div>
        </button>
        <span style={S.label}>Practice Questions</span>
        <h1 style={{ ...S.h1, marginTop: 6, fontSize: 22 }}>Configure your<br />session</h1>
      </div>

      <div style={{ ...S.px, ...S.gap(20) }}>
        {/* Exam - only shows student's selected exams */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Exam Body</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {myExams.map(e => (
              <button key={e} style={S.btnSmall(exam === e)} onClick={() => { setExam(e); setSubject("All Subjects"); setTopic("All Topics"); setYear("All Years"); if (!MOCK_ELIGIBLE.includes(e) && mode === "mock") setMode("practice"); }}>{e}</button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Subject</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {subjectsForExam.map(s => (
              <button key={s} style={S.btnSmall(subject === s)} onClick={() => { setSubject(s); setTopic("All Topics"); setYear("All Years"); }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Topic</p>
          {subject === "All Subjects" ? (
            <p style={{ ...S.small }}>Pick a subject to filter by topic.</p>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {topicsForSubject.map(t => (
                <button key={t} style={S.btnSmall(topic === t)} onClick={() => { setTopic(t); setYear("All Years"); }}>{t}</button>
              ))}
            </div>
          )}
        </div>

        {/* Year */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Year</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {yearsForTopic.map(y => (
              <button key={y} style={S.btnSmall(year === y)} onClick={() => setYear(y)}>{y}</button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>No. of Questions</p>
          <div style={S.row(8)}>
            {[5, 10, 15, 20].map(n => (
              <button key={n} style={S.btnSmall(count === n)} onClick={() => setCount(n)}>{n}</button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Time Limit</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TIMER_PRESETS.map(m => (
              <button key={m} style={S.btnSmall(timerMinutes === m)} onClick={() => setTimerMinutes(m)}>{m}m</button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Mode</p>
          <div style={S.row(8)}>
            <button style={S.btnSmall(mode === "practice")} onClick={() => setMode("practice")}>Practice</button>
            <button style={S.btnSmall(mode === "exam")} onClick={() => setMode("exam")}>Exam</button>
            {showMock && <button style={S.btnSmall(mode === "mock")} onClick={() => setMode("mock")}>Mock</button>}
          </div>
          {!showMock && (
            <p style={{ ...S.small, marginTop: 8 }}>Mock mode is only available for WAEC, JAMB, and NECO.</p>
          )}
        </div>

        <div style={S.card}>
          <div style={S.row(8)}>
            <Icon name="info" size={16} color="#3B82F6" />
            <span style={{ ...S.body, fontSize: 13 }}><b style={{ color: "#F0F2FF" }}>{available.length}</b> questions match your filters · {modeLabel} · {timerMinutes}m</span>
          </div>
        </div>

        <button
          style={{ ...S.btnPrimary, opacity: available.length === 0 ? 0.4 : 1 }}
          disabled={available.length === 0}
          onClick={() => onBegin({ exam, subject, topic, year, count: Math.min(count, available.length), mode, timerMinutes })}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}`;

const newPracticeSetup = `const MOCK_ELIGIBLE = ["WAEC", "JAMB", "NECO"];

function PracticeSetup({ profile, defaultExam, onBegin, onBack }) {
  const myExams = profile?.exams?.length ? profile.exams : EXAMS;
  const [exam, setExam] = useState(defaultExam || myExams[0] || "WAEC");
  const [subjects, setSubjects] = useState([]); // empty = all subjects
  const [topic, setTopic] = useState("All Topics");
  const [year, setYear] = useState("All Years");
  const [count, setCount] = useState(10);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [seconds, setSeconds] = useState(0);
  const [mode, setMode] = useState("practice");
  const [openPicker, setOpenPicker] = useState(null); // "topic" | "year" | "count" | "time" | null
  const [tempTime, setTempTime] = useState({ h: 0, m: 30, s: 0 });

  const subjectsForExam = [...new Set(QUESTIONS.filter(q => q.exam === exam).map(q => q.subject))];
  const singleSubject = subjects.length === 1 ? subjects[0] : null;
  const topicsForSubject = singleSubject ? ["All Topics", ...new Set(QUESTIONS.filter(q => q.exam === exam && q.subject === singleSubject).map(q => q.topic))] : ["All Topics"];
  const yearsAvailable = ["All Years", ...new Set(QUESTIONS.filter(q =>
    q.exam === exam &&
    (subjects.length === 0 || subjects.includes(q.subject)) &&
    (!singleSubject || topic === "All Topics" || q.topic === topic)
  ).map(q => q.year))].sort((a, b) => (a === "All Years" ? -1 : b === "All Years" ? 1 : b - a));

  const available = QUESTIONS.filter(q =>
    q.exam === exam &&
    (subjects.length === 0 || subjects.includes(q.subject)) &&
    (!singleSubject || topic === "All Topics" || q.topic === topic) &&
    (year === "All Years" || q.year === year)
  );

  const countOptions = [5, 10, 15, 20, 25, 30, 40, 50].filter(n => n <= Math.max(available.length, 5));
  if (countOptions.length === 0) countOptions.push(Math.max(available.length, 1));

  const showMock = MOCK_ELIGIBLE.includes(exam);
  const modeLabel = mode === "exam" ? "Exam Mode" : mode === "mock" ? "Mock Mode" : "Practice Mode";
  const ctaLabel = mode === "exam" ? "Start Timed Exam →" : mode === "mock" ? "Start Mock Test →" : "Start Practice →";
  const timerSeconds = hours * 3600 + minutes * 60 + seconds;
  const timeLabel = \`\${String(hours).padStart(2, "0")}:\${String(minutes).padStart(2, "0")}:\${String(seconds).padStart(2, "0")}\`;

  const toggleSubject = (s) => {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    setTopic("All Topics"); setYear("All Years");
  };

  return (
    <div style={{ ...S.screen, overflowY: "auto" }}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 0, marginBottom: 16 }}>
          <div style={S.row(6)}><Icon name="arrow_left" size={18} color="#3B82F6" /><span style={{ fontSize: 14, fontWeight: 600 }}>Back</span></div>
        </button>
        <span style={S.label}>Practice Questions</span>
        <h1 style={{ ...S.h1, marginTop: 6, fontSize: 22 }}>Configure your<br />session</h1>
      </div>

      <div style={{ ...S.px, ...S.gap(20) }}>
        {/* Exam - only shows student's selected exams */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Exam Body</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {myExams.map(e => (
              <button key={e} style={S.btnSmall(exam === e)} onClick={() => { setExam(e); setSubjects([]); setTopic("All Topics"); setYear("All Years"); if (!MOCK_ELIGIBLE.includes(e) && mode === "mock") setMode("practice"); }}>{e}</button>
            ))}
          </div>
        </div>

        {/* Subject - multi-select checklist */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Subjects <span style={{ color: "#64748B", fontWeight: 500 }}>(none checked = all)</span></p>
          <div style={S.gap(8)}>
            {subjectsForExam.map(s => (
              <button key={s} onClick={() => toggleSubject(s)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", backgroundColor: subjects.includes(s) ? "#1E3A5F" : "#111827", border: \`1px solid \${subjects.includes(s) ? "#3B82F6" : "#1E2A4A"}\`, borderRadius: 10, cursor: "pointer", width: "100%", textAlign: "left" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: \`1.5px solid \${subjects.includes(s) ? "#3B82F6" : "#4A5568"}\`, backgroundColor: subjects.includes(s) ? "#3B82F6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {subjects.includes(s) && <Icon name="check" size={12} color="#fff" />}
                </div>
                <span style={{ fontSize: 14, color: "#F0F2FF", fontWeight: 600 }}>{s}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Topic - wheel picker */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Topic</p>
          {!singleSubject ? (
            <p style={{ ...S.small }}>Check exactly one subject to filter by topic.</p>
          ) : (
            <button onClick={() => setOpenPicker("topic")} style={{ ...S.cardAlt, width: "100%", textAlign: "left", cursor: "pointer", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "#F0F2FF", fontWeight: 600 }}>{topic}</span>
              <Icon name="chevron_right" size={16} color="#3B82F6" />
            </button>
          )}
        </div>

        {/* Year - wheel picker */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Year</p>
          <button onClick={() => setOpenPicker("year")} style={{ ...S.cardAlt, width: "100%", textAlign: "left", cursor: "pointer", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#F0F2FF", fontWeight: 600 }}>{year}</span>
            <Icon name="chevron_right" size={16} color="#3B82F6" />
          </button>
        </div>

        {/* Count - wheel picker */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>No. of Questions</p>
          <button onClick={() => setOpenPicker("count")} style={{ ...S.cardAlt, width: "100%", textAlign: "left", cursor: "pointer", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#F0F2FF", fontWeight: 600 }}>{count} questions</span>
            <Icon name="chevron_right" size={16} color="#3B82F6" />
          </button>
        </div>

        {/* Time - HH:MM:SS wheel picker */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Time Limit</p>
          <button onClick={() => { setTempTime({ h: hours, m: minutes, s: seconds }); setOpenPicker("time"); }} style={{ ...S.cardAlt, width: "100%", textAlign: "left", cursor: "pointer", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#F0F2FF", fontWeight: 600 }}>{timeLabel}</span>
            <Icon name="chevron_right" size={16} color="#3B82F6" />
          </button>
        </div>

        {/* Mode */}
        <div>
          <p style={{ ...S.label, marginBottom: 10 }}>Mode</p>
          <div style={S.row(8)}>
            <button style={S.btnSmall(mode === "practice")} onClick={() => setMode("practice")}>Practice</button>
            <button style={S.btnSmall(mode === "exam")} onClick={() => setMode("exam")}>Exam</button>
            {showMock && <button style={S.btnSmall(mode === "mock")} onClick={() => setMode("mock")}>Mock</button>}
          </div>
          {!showMock && (
            <p style={{ ...S.small, marginTop: 8 }}>Mock mode is only available for WAEC, JAMB, and NECO.</p>
          )}
        </div>

        <div style={S.card}>
          <div style={S.row(8)}>
            <Icon name="info" size={16} color="#3B82F6" />
            <span style={{ ...S.body, fontSize: 13 }}><b style={{ color: "#F0F2FF" }}>{available.length}</b> questions match your filters · {modeLabel} · {timeLabel}</span>
          </div>
        </div>

        <button
          style={{ ...S.btnPrimary, opacity: available.length === 0 ? 0.4 : 1 }}
          disabled={available.length === 0}
          onClick={() => onBegin({ exam, subjects, topic, year, count: Math.min(count, available.length), mode, timerSeconds })}
        >
          {ctaLabel}
        </button>
      </div>

      {openPicker === "topic" && (
        <PickerModal title="Select Topic" onClose={() => setOpenPicker(null)} onConfirm={() => setOpenPicker(null)}>
          <WheelPicker options={topicsForSubject} value={topic} onChange={setTopic} />
        </PickerModal>
      )}

      {openPicker === "year" && (
        <PickerModal title="Select Year" onClose={() => setOpenPicker(null)} onConfirm={() => setOpenPicker(null)}>
          <WheelPicker options={yearsAvailable} value={year} onChange={setYear} />
        </PickerModal>
      )}

      {openPicker === "count" && (
        <PickerModal title="No. of Questions" onClose={() => setOpenPicker(null)} onConfirm={() => setOpenPicker(null)}>
          <WheelPicker options={countOptions} value={count} onChange={setCount} />
        </PickerModal>
      )}

      {openPicker === "time" && (
        <PickerModal title="Time Limit" onClose={() => setOpenPicker(null)} onConfirm={() => { setHours(tempTime.h); setMinutes(tempTime.m); setSeconds(tempTime.s); setOpenPicker(null); }}>
          <div style={{ display: "flex", gap: 4 }}>
            <WheelPicker options={[0, 1, 2, 3]} value={tempTime.h} onChange={(v) => setTempTime(t => ({ ...t, h: v }))} />
            <WheelPicker options={Array.from({ length: 60 }, (_, i) => i)} value={tempTime.m} onChange={(v) => setTempTime(t => ({ ...t, m: v }))} />
            <WheelPicker options={Array.from({ length: 60 }, (_, i) => i)} value={tempTime.s} onChange={(v) => setTempTime(t => ({ ...t, s: v }))} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 6 }}>
            <span style={{ ...S.small }}>hrs</span><span style={{ ...S.small }}>min</span><span style={{ ...S.small }}>sec</span>
          </div>
        </PickerModal>
      )}
    </div>
  );
}`;

if (content.includes(oldPracticeSetup)) {
  content = content.replace(oldPracticeSetup, newPracticeSetup);
  changes++;
  console.log('Patch 2 (PracticeSetup wheel-picker overhaul) applied');
} else {
  console.log('Patch 2 (PracticeSetup wheel-picker overhaul) NOT found - skipped');
}

// PATCH 3: QuizScreen - support subjects array + timerSeconds for compatibility
const oldQuizFilter = `  const pool = QUESTIONS.filter(q =>
    q.exam === config.exam && (config.subject === "All Subjects" || q.subject === config.subject)
  ).slice(0, config.count);`;

const newQuizFilter = `  const pool = QUESTIONS.filter(q =>
    q.exam === config.exam &&
    (!config.subjects || config.subjects.length === 0 || config.subjects.includes(q.subject)) &&
    (!config.topic || config.topic === "All Topics" || q.topic === config.topic) &&
    (!config.year || config.year === "All Years" || q.year === config.year)
  ).slice(0, config.count);`;

if (content.includes(oldQuizFilter)) {
  content = content.replace(oldQuizFilter, newQuizFilter);
  changes++;
  console.log('Patch 3 (QuizScreen pool filter) applied');
} else {
  console.log('Patch 3 (QuizScreen pool filter) NOT found - skipped');
}

const oldTimerInit = `  const [timeLeft, setTimeLeft] = useState(config.mode === "exam" ? config.count * 90 : null);`;
const newTimerInit = `  const [timeLeft, setTimeLeft] = useState(config.mode === "exam" || config.mode === "mock" ? (config.timerSeconds || config.count * 90) : null);`;

if (content.includes(oldTimerInit)) {
  content = content.replace(oldTimerInit, newTimerInit);
  changes++;
  console.log('Patch 4 (QuizScreen timer init) applied');
} else {
  console.log('Patch 4 (QuizScreen timer init) NOT found - skipped');
}

const oldTimerCondition = `    if (config.mode === "exam" && timeLeft > 0) {`;
const newTimerCondition = `    if ((config.mode === "exam" || config.mode === "mock") && timeLeft > 0) {`;

if (content.includes(oldTimerCondition)) {
  content = content.replace(oldTimerCondition, newTimerCondition);
  changes++;
  console.log('Patch 5 (QuizScreen timer condition) applied');
} else {
  console.log('Patch 5 (QuizScreen timer condition) NOT found - skipped');
}

// PATCH 6: Responsive app shell - add viewport tracking + apply to all S.app usages
const oldStateBlock = `  const [stats, setStats] = useState({ total: 0, correct: 0 });`;
const newStateBlock = `  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const [viewportWidth, setViewportWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 430);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("orientationchange", onResize); };
  }, []);

  const shellMaxWidth = viewportWidth >= 700 ? Math.min(viewportWidth - 40, 900) : 430;
  const shellStyle = { ...S.app, maxWidth: shellMaxWidth };`;

if (content.includes(oldStateBlock) && !content.includes('shellMaxWidth')) {
  content = content.replace(oldStateBlock, newStateBlock);
  changes++;
  console.log('Patch 6 (Responsive viewport state) applied');
} else {
  console.log('Patch 6 (Responsive viewport state) NOT found or already applied - skipped');
}

// PATCH 7: Replace all style={S.app} with style={shellStyle} (multiple occurrences)
const appOccurrences = (content.match(/style=\{S\.app\}/g) || []).length;
if (appOccurrences > 0) {
  content = content.split('style={S.app}').join('style={shellStyle}');
  changes++;
  console.log('Patch 7 (S.app -> shellStyle, ' + appOccurrences + ' occurrences) applied');
} else {
  console.log('Patch 7 (S.app -> shellStyle) NOT found - skipped');
}

// PATCH 8: Nav bar should match the shell width too
const oldNav = `      <nav style={S.nav}>`;
const newNav = `      <nav style={{ ...S.nav, maxWidth: shellMaxWidth }}>`;

if (content.includes(oldNav)) {
  content = content.replace(oldNav, newNav);
  changes++;
  console.log('Patch 8 (Nav responsive width) applied');
} else {
  console.log('Patch 8 (Nav responsive width) NOT found - skipped');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done. ' + changes + ' of 8 patches applied.');
