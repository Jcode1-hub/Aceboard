const fs = require('fs');
const path = 'src/App.jsx';
let code = fs.readFileSync(path, 'utf8');
let changes = 0;

code = code.replace(/(\[\s*["']WAEC["']\s*,\s*["']JAMB["']\s*,\s*["']NECO["']\s*,\s*["']IGCSE["']\s*,\s*["']ACT["']\s*,\s*["']SAT["']\s*\])/g,
  (match) => {
    changes++;
    return match.replace(/,\s*["']SAT["']/, '');
  }
);

code = code.replace(
  /(const\s+handleStart\s*=\s*\(exam\)\s*=>\s*\{)/,
  (match) => {
    changes++;
    return match + `\n  const targetExam = exam || profile.exams.find(e => e !== "SAT") || profile.exams[0];\n  if (targetExam === "SAT") { setScreen("selectSatTest"); return; }`;
  }
);

fs.writeFileSync(path, code);
console.log(`Patched ${changes} location(s) in App.jsx`);
if (changes === 0) console.log("No matches found — paste your PracticeSetup exam list + handleStart code so I can write an exact patch.");
