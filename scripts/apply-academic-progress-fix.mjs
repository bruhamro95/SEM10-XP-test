import fs from "node:fs";

const path = "src/App.jsx";
let s = fs.readFileSync(path, "utf8");
const before = s;

// Claude's requested source-level rule: ورق remains visible/checkable but is
// excluded from every academic progress calculation.
if (!s.includes('const PROGRESS_STAGES = STAGES.filter((s) => s.key !== "paper");')) {
  s = s.replace(
    'const STAGES = [{ key: "paper", label: "ورق" }, { key: "explain", label: "شرح" }, { key: "study", label: "مذاكرة" }, { key: "solve", label: "حل" }, { key: "review", label: "مراجعة" }];',
    'const STAGES = [{ key: "paper", label: "ورق" }, { key: "explain", label: "شرح" }, { key: "study", label: "مذاكرة" }, { key: "solve", label: "حل" }, { key: "review", label: "مراجعة" }];\nconst PROGRESS_STAGES = STAGES.filter((s) => s.key !== "paper");'
  );
}

s = s.replaceAll('STAGES.filter((s) => isDone(id, s.key)).length', 'PROGRESS_STAGES.filter((s) => isDone(id, s.key)).length');
s = s.replaceAll('STAGES.filter((s) => cell(id)[s.key]).length', 'PROGRESS_STAGES.filter((s) => cell(id)[s.key]).length');
s = s.replaceAll('doneCount(l.id) === STAGES.length', 'doneCount(l.id) === PROGRESS_STAGES.length');
s = s.replaceAll('dc === STAGES.length', 'dc === PROGRESS_STAGES.length');
s = s.replaceAll('disciplineLectures.length * STAGES.length', 'disciplineLectures.length * PROGRESS_STAGES.length');
s = s.replaceAll('allInSection.length * STAGES.length', 'allInSection.length * PROGRESS_STAGES.length');
s = s.replaceAll('totalLectures * STAGES.length', 'totalLectures * PROGRESS_STAGES.length');
s = s.replaceAll('lecs.length * STAGES.length', 'lecs.length * PROGRESS_STAGES.length');

if (s !== before) fs.writeFileSync(path, s);
console.log("Academic progress fix applied: ورق excluded; all five stages remain visible/checkable.");
