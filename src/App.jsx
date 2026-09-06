import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipForward, X, Minus, Square, Copy, Check, Search, Volume2, VolumeX, Star, Clock3, Bell, Plus } from "lucide-react";

/* ============================================================================
   DATA
   ============================================================================ */
const RAW = {
  Surgery: {
    Plastic: [["Types Of Burns & Its Complications",1],["Skin Graft & Flaps",1],["Hypertrophic Scars & Keloids",1],["Pressure Sore Management",1],["Wound Healing",1]],
    Vascular: [["Varicose Vein",1],["DVT & Chronic Venous Insufficiency",1],["Lymphedema & Swollen Limb",1],["Acute Limb Ischemia",1],["Chronic Limb Ischemia",1],["Vascular Trauma",1],["Arterial Aneurysms",1],["Thoracic Outlet Syndrome (TOS)",1],["Vascular Malformation & Hemangioma",1]],
    Anesthesia: [["Preoperative Assessment & Premedication",0],["General Anesthesia",0],["Complications Of General Anesthesia",0],["ICU 1 — Admission Indications & Monitoring",0],["ICU 2 — Acid-Base Balance",0],["Regional Anesthesia",0],["Pain Control",0]],
    "Emergency (General)": [["Acute Appendicitis",1],["Peritonitis & MVO",1],["Intestinal Obstruction 1",1],["Intestinal Obstruction 2",0],["Neonatal Intestinal Obstruction",0],["Acute Abdominal Pain",0],["Abdominal Trauma",0],["Acute Injured Patient",0],["Hemorrhage & Blood Transfusion",0],["Shock (Septic & Hemorrhagic)",0],["Hemostasis & Surgical Bleeding",0]],
    "Misc.": [["Professional Behavior",0],["Medical Ethics",0],["Quality of Health Care System",0]],
    Oncology: [["Seminar: Cancer Epidemiology & Causation",1],["Seminar: Cancer Prevention & Screening",0],["Anatomy of The Peritoneum & Retroperitoneum",1],["Retroperitoneal Sarcoma",0],["Common Cancer Family Syndrome",1],["Approach To Abdominal Mass",1],["Risk Factors of Upper Aerodigestive Cancer",1],["Presentation & Workup of Upper Aerodig. Cancer",0],["Precancerous Skin Lesions",1],["Basal Cell Carcinoma (BCC)",1],["Squamous Cell Carcinoma",0],["Melanoma",0],["Squamous Cell Carcinoma of the Oral Cavity",0],["Jaw Masses",0],["Cervical Lymphadenopathy Management",0],["Seminar: Principles Of Cancer Management",0],["Principles of Psycho-Oncology",0]],
    Orthopedic: [["Introduction To Orthopedic Trauma",1],["General Principles & Complications Of Fractures",1],["Fracture Femur & Both Bones Leg (LL)",1],["Knee Injuries",1],["Ankle And Foot Injuries",1],["Injuries Around Hip (incl. Neck Of Femur Fx)",1],["Shoulder Pain",0],["Forearm Fractures",0],["Injuries Around The Elbow",0],["Fractures Around The Wrist",0],["Fracture Spine",0],["Pediatric Fractures",0],["Bone And Joint Infection",0],["Surgical Treatment Of 1ry & 2nd Osteoarthritis",0],["Paget's Disease & Other Metabolic Bone Disease",0],["Deformities",0],["Congenital Talipes Equinovarus (CTEV)",0],["Developmental Dysplasia Of The Hip (DDH)",0],["Leg Length Discrepancy",0],["Limping Child",0],["Introduction To Bone Tumors",0],["Benign Bone Tumors",0],["Malignant Bone Tumors",0],["Metastatic Bone Disease & Multiple Myeloma",0],["ALTS Protocol For Open Fractures",0]],
  },
  Medicine: {
    "Critical Care": [["Hypertensive Emergencies",1],["Basic & Advanced Tools of Hemodynamic Monitoring",1],["Shock",1],["Guidelines For Management of Sepsis",1],["Antibiotics In ICU",1],["Basics Of Nutrition In ICU",1],["Coma",1],["Anaphylaxis Diagnosis and Management",1],["Seminar: ALS & Peri-Arrest Arrhythmia",1],["Cardiac Arrest in Special Circumstances",1],["Seminar: Post Cardiac Arrest Care",0],["Seminar: Safe Transfer of Critically Ill Pts",1],["Pulmonary Edema",1],["Basic And Advanced Airway Management",0],["Safe Prescription in Organ Failure (Pharm.)",0],["Safe Prescription in Geriatrics",0]],
    Rheumatology: [["Systemic Lupus Erythematosus (SLE)",1],["Antiphospholipid Syndrome (APL)",1],["Investigation of Rheumatic Diseases",1],["Vasculitis",1],["Familial Mediterranean Fever (FMF)",1],["Behcet's Disease",1],["Inflammatory Myopathy",1],["Metabolic Bone Diseases",1],["Rheumatologic Emergencies",1],["Systemic Sclerosis",0]],
    Rehabilitation: [["Mechanical Low Back Pain",0],["Inflammatory Low Back Pain",0],["Rheumatoid Arthritis",0],["Hyperuricemia & Gout",0],["Osteoarthritis",0],["Differential Diagnosis of Arthritis",0],["Antirheumatic Drugs",0],["Physiotherapy",0],["Approach to Joint Pain",0]],
    Hematology: [["Anemia I",1],["Anemia II",1],["Bleeding Disorders 1 — Part 1",1],["Bleeding Disorders 1 — Part 2",1],["Bleeding Disorders 2",1],["Hematological Aspect of Systemic Disease",1],["Patient Safety in Blood Transfusion",0]],
    "Oncology (Heme)": [["Multiple Myeloma (MM)",1],["Acute Leukemia",1],["Chronic Leukemia",0],["Lymphoma",0],["Metastasis of Unknown Origin",0],["Cytotoxic Drugs",0],["Oncologic Emergencies",0],["Para Neoplastic Syndrome",0],["Patient Safety in Chemotherapy Application",0],["Palliative Care",0]],
    "GIT & Hepatology": [["Acute Upper GIT Bleeding",0],["Seminar: Approach — Upper GIT Bleeding Mgmt",0],["Seminar: Treatment Plan of Hematemesis & Melena",0],["AKI in Cirrhotic Patients",0],["Fulminant Hepatic Failure — Evaluation & Mgmt",0],["Hepatic Encephalopathy",0]],
    "Chest (Emergency)": [["Acute Dyspnea",1],["Pulmonary Embolism (PE)",1],["ARDS",1],["Acute Severe Asthma",1]],
    "Neurology (Emergency)": [["Neuromuscular Emergencies",1],["Spinal Cord Injury",0],["Status Epilepticus",0],["Intracranial HTN & Danger of Brain Herniation",0],["Acute Hemorrhagic Stroke",0],["Acute Ischemic Stroke",0],["Red Flags of Neck Pain",0]],
    "Nephrology (Emergency)": [["Acid-Base Disorders",0],["Blood Gas Interpretation",0],["Renal Replacement Therapy in AKI",0],["Sodium Disorders and Management",0],["Potassium Disorders and Management",0]],
    "Cardiology (Emergency)": [["Acute Coronary Syndrome",0],["Treatment Plan of Patients with ACS",0],["Approach To Patients with Acute Chest Pain",0],["Acute Heart Failure",0],["Bradyarrhythmia",0],["Tachyarrhythmia",0],["Cardiogenic Shock",0]],
    "Endocrine (Emergency)": [["Diabetic Emergency — Identification & Management",0],["Treatment Plan for DKA Patient",0],["Thyroid Emergency",0],["Management of Myxedema Coma",0],["Adrenal Crisis",0]],
    "Nuclear Medicine": [["Seminar: Basic Principle & Complications of RT",1],["Seminar: Basic Principles of Brachytherapy",0],["Seminar: Patient Safety in Application of RT",0]],
    Toxicology: [["Approach To Patients with Acute Toxic Exposure 1",0],["Approach To Patients with Acute Toxic Exposure 2",0],["Toxic Case Discussion",0]],
  },
};
const SECTION_COLORS = {
  Plastic: "#E8D0D8", Vascular: "#C8DDF0", Anesthesia: "#C8E8E8", "Emergency (General)": "#F0D0C8",
  "Misc.": "#E0E0E0", Oncology: "#DDD0EC", Orthopedic: "#F0E0C8", "Critical Care": "#F5CCCC",
  Rheumatology: "#D0CCF5", Rehabilitation: "#E8D8F8", Hematology: "#F5E0CC", "Oncology (Heme)": "#F5D8C8",
  "GIT & Hepatology": "#CCF0CC", "Chest (Emergency)": "#CCE4F5", "Neurology (Emergency)": "#CCF0EE",
  "Nephrology (Emergency)": "#CCDCF5", "Cardiology (Emergency)": "#F5CCCC", "Endocrine (Emergency)": "#E0F5CC",
  "Nuclear Medicine": "#D0D8F5", Toxicology: "#E8E8D8",
};
const LECTURES = [];
{
  let gid = 0;
  for (const discipline of Object.keys(RAW)) {
    let num = 0;
    for (const section of Object.keys(RAW[discipline])) {
      for (const [name, mid] of RAW[discipline][section]) {
        gid += 1; num += 1;
        LECTURES.push({ id: "L" + gid, num, name, discipline, section, mid: !!mid, type: "Lecture" });
      }
    }
  }
}
const SECTION_DESC = {
  Plastic: "Burns, grafts, scars & wound care", Vascular: "Ischemia, DVT & vascular malformations", Anesthesia: "Perioperative care & ICU basics",
  "Emergency (General)": "Acute abdomen & GI surgical emergencies", "Misc.": "Ethics & quality of care", Oncology: "Tumor biology & surgical oncology",
  Orthopedic: "Fractures, joints & bone pathology", "Critical Care": "ICU, resuscitation & safe prescribing",
  Rheumatology: "Autoimmune & connective tissue disease", Rehabilitation: "Arthritis, back pain & physiotherapy",
  Hematology: "Anemia & bleeding disorders", "Oncology (Heme)": "Blood cancers & malignancy", "GIT & Hepatology": "Liver failure & GI bleeding",
  "Chest (Emergency)": "Acute respiratory emergencies", "Neurology (Emergency)": "Acute neuro presentations",
  "Nephrology (Emergency)": "Electrolytes & renal emergencies", "Cardiology (Emergency)": "Acute cardiac presentations",
  "Endocrine (Emergency)": "Diabetic & thyroid emergencies", "Nuclear Medicine": "Radiotherapy principles & safety", Toxicology: "Acute poisoning approach",
};
function sectionsOf(discipline) {
  const out = []; const seen = new Set();
  for (const l of LECTURES) { if (l.discipline !== discipline) continue; if (!seen.has(l.section)) { seen.add(l.section); out.push(l.section); } }
  return out;
}
const STAGES = [{ key: "paper", label: "ورق" }, { key: "explain", label: "شرح" }, { key: "study", label: "مذاكرة" }, { key: "solve", label: "حل" }, { key: "review", label: "مراجعة" }];
const STALE_DAYS = 14;

/* ============================================================================
   EXAM SCHEDULE — as supplied and confirmed by the user directly
   ============================================================================ */
const DEFAULT_EXAMS = [
  { id: "surg-cont", date: "2026-04-29", time: "10:00 AM", endTime: "11:05 AM", subject: "SURG IV", type: "Continuous Assessment", shortType: "CONT", target: "2026-04-29T10:00:00" },
  { id: "med-cont", date: "2026-05-06", time: "10:00 AM", endTime: "11:05 AM", subject: "MED IV", type: "Continuous Assessment", shortType: "CONT", target: "2026-05-06T10:00:00" },
  { id: "elective", date: "2026-07-26", time: "10:00 AM", endTime: "", subject: "Elective", type: "Elective Computer", shortType: "ELECTIVE", target: "2026-07-26T10:00:00" },
  { id: "med-final", date: "2026-10-31", time: "10:00 AM", endTime: "1:00 PM", subject: "MED IV", type: "Final", shortType: "FINAL", target: "2026-10-31T10:00:00" },
  { id: "med-osce", date: "2026-11-04", endDate: "2026-11-09", time: "8:30 AM", endTime: "", subject: "MED IV", type: "OSCE", shortType: "OSCE", target: "2026-11-04T08:30:00" },
  { id: "surg-final", date: "2026-11-30", time: "10:00 AM", endTime: "1:00 PM", subject: "SURG IV", type: "Final", shortType: "FINAL", target: "2026-11-30T10:00:00" },
  { id: "surg-osce", date: "2026-12-06", endDate: "2026-12-10", time: "8:30 AM", endTime: "", subject: "SURG IV", type: "OSCE", shortType: "OSCE", target: "2026-12-06T08:30:00" },
];
function examCountdown(target) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { status: "past", days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(diff / 1000);
  return { status: "upcoming", days: Math.floor(totalSeconds / 86400), hours: Math.floor((totalSeconds % 86400) / 3600), minutes: Math.floor((totalSeconds % 3600) / 60), seconds: totalSeconds % 60 };
}
function formatExamDate(exam) {
  const d = new Date(exam.date + "T12:00:00");
  const start = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  if (!exam.endDate) return start;
  const e = new Date(exam.endDate + "T12:00:00");
  return start + " – " + e.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
function examDaysLabel(target) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return "Passed";
  const days = Math.ceil(diff / 86400000);
  return days === 1 ? "1 day" : days + " days";
}


/* ============================================================================
   PERSISTENT STORAGE (window.storage — artifacts can't use localStorage)
   ============================================================================ */
const HAS_ARTIFACT_STORAGE = typeof window !== "undefined" && window.storage && typeof window.storage.get === "function" && typeof window.storage.set === "function";
const LOCAL_PREFIX = "sem10xp:";
function useStoredState(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (HAS_ARTIFACT_STORAGE) {
          const res = await window.storage.get(key, false);
          if (!cancelled && res && res.value) setValue(JSON.parse(res.value));
        } else if (typeof localStorage !== "undefined") {
          const raw = localStorage.getItem(LOCAL_PREFIX + key);
          if (!cancelled && raw != null) setValue(JSON.parse(raw));
        }
      } catch (e) { /* not saved yet, or storage unavailable */ }
      finally { if (!cancelled) setLoaded(true); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!loaded) return;
    (async () => {
      try {
        if (HAS_ARTIFACT_STORAGE) await window.storage.set(key, JSON.stringify(value), false);
        else if (typeof localStorage !== "undefined") localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(value));
      } catch (e) { console.error("save failed", key, e); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, loaded]);
  return [value, setValue, loaded];
}

/* ============================================================================
   HELPERS
   ============================================================================ */
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function fmtClock(t) { return pad(Math.floor(t / 60)) + ":" + pad(t % 60); }
function startOfWeek(date, weekStartDay) { const d = new Date(date); d.setHours(0, 0, 0, 0); const diff = (d.getDay() - weekStartDay + 7) % 7; d.setDate(d.getDate() - diff); return d; }
function startOfDay(date) { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; }
function localDateKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function cls(...xs) { return xs.filter(Boolean).join(" "); }
function download(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================================
   SOUND ENGINE — uses the XP sound collection supplied with this project.
   Audio elements are created per event so repeated timer notifications do not
   cut each other off. If the browser declines playback, the app still works.
   ============================================================================ */
const SOUND_FILES = {
  boot: "/sounds/Windows XP Startup.wav",
  login: "/sounds/Windows XP Logon Sound.wav",
  start: "/sounds/Windows XP Ding.wav",
  pause: "/sounds/Windows XP Menu Command.wav",
  reset: "/sounds/Windows XP Restore.wav",
  notify: "/sounds/Windows XP Notify.wav",
  error: "/sounds/Windows XP Exclamation.wav",
  exam: "/sounds/Windows XP Information Bar.wav",
};
function playTone(ctx, freq, t0, dur, type, peakGain) {
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.type = type || "sine"; osc.frequency.value = freq;
  osc.connect(gain); gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peakGain || 0.18, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}
const CHIME_PATTERNS = {
  boot: [[261.6, 0, 0.5, "sine"], [329.6, 0.15, 0.5, "sine"], [392.0, 0.3, 0.7, "sine"]],
  login: [[523.25, 0, 0.35, "sine"], [783.99, 0.1, 0.55, "sine"]],
  start: [[523.25, 0, 0.3, "sine"], [659.25, 0.14, 0.3, "sine"]],
  notify: [[880, 0, 0.3, "sine"], [1108.7, 0.14, 0.3, "sine"], [1318.5, 0.28, 0.55, "sine"]],
  error: [[220, 0, 0.22, "square"], [196, 0.16, 0.35, "square"]],
  exam: [[698.46, 0, 0.25, "sine"], [880, 0.13, 0.25, "sine"], [698.46, 0.26, 0.4, "sine"]],
};
function playChime(kind, enabled = true) {
  if (!enabled) return;
  try {
    const file = SOUND_FILES[kind] || SOUND_FILES.notify;
    const audio = new Audio(encodeURI(file));
    audio.volume = 0.55;
    audio.play().catch(() => {});
    return;
  } catch (e) { /* fall through to the compact synthesized fallback */ }
  try {
    const pattern = CHIME_PATTERNS[kind] || CHIME_PATTERNS.notify;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    pattern.forEach(([freq, delay, dur, type]) => playTone(ctx, freq, ctx.currentTime + delay, dur, type, 0.16));
  } catch (e) { /* audio unavailable in this context */ }
}
function notify(title, body) {
  try {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, tag: "sem10-timer" });
    }
  } catch (e) { /* notifications blocked in this context */ }
}

/* ============================================================================
   DRAGGABLE HOOK
   ============================================================================ */
function getUsableDesktop() {
  const vw = typeof window !== "undefined" && window.innerWidth ? window.innerWidth : 1400;
  const vh = typeof window !== "undefined" && window.innerHeight ? window.innerHeight : 900;
  const taskbarEl = typeof document !== "undefined" ? document.querySelector(".taskbar") : null;
  const taskbarH = (taskbarEl && taskbarEl.offsetHeight) || 34;
  return { w: vw, h: vh - taskbarH };
}

function useWindowRect(initial, onInteract) {
  const [rect, setRect] = useState(initial);
  const [maximized, setMaximized] = useState(false);
  const preMaxRect = useRef(null);
  const dragRef = useRef(null);
  const MIN_W = 260, MIN_H = 200;
  const TITLEBAR_H = 28, MIN_VISIBLE = 48;

  const begin = useCallback((mode, x, y) => {
    if (maximized) return; // locked while maximized - restore first
    if (onInteract) onInteract();
    dragRef.current = { mode, startX: x, startY: y, orig: rect };
  }, [rect, onInteract, maximized]);

  const update = useCallback((x, y) => {
    const ds = dragRef.current;
    if (!ds) return;
    const dx = x - ds.startX, dy = y - ds.startY;
    const o = ds.orig;
    const { w: viewW, h: usableH } = getUsableDesktop();
    if (ds.mode === "move") {
      // Keep at least a grabbable sliver of the titlebar on-screen and above the
      // taskbar at all times, instead of only clamping the top-left corner.
      setRect((r) => ({
        ...r,
        x: Math.max(-(o.w - MIN_VISIBLE), Math.min(o.x + dx, viewW - MIN_VISIBLE)),
        y: Math.max(0, Math.min(o.y + dy, usableH - TITLEBAR_H)),
      }));
      return;
    }
    let { x: rx, y: ry, w, h } = o;
    // Bounds now account for the window's own position, not just a flat viewport
    // size, and for the real taskbar height, so a window can no longer be resized
    // past the taskbar or off the right/bottom edge.
    const maxW = Math.max(MIN_W, viewW - o.x - 4);
    const maxH = Math.max(MIN_H, usableH - o.y - 4);
    if (ds.mode.indexOf("e") !== -1) w = Math.min(maxW, Math.max(MIN_W, o.w + dx));
    if (ds.mode.indexOf("s") !== -1) h = Math.min(maxH, Math.max(MIN_H, o.h + dy));
    if (ds.mode.indexOf("w") !== -1) { const nw = Math.max(MIN_W, Math.min(o.w - dx, o.x + o.w)); rx = o.x + (o.w - nw); w = nw; }
    if (ds.mode.indexOf("n") !== -1) { const nh = Math.max(MIN_H, Math.min(o.h - dy, o.y + o.h)); ry = o.y + (o.h - nh); h = nh; }
    setRect({ x: Math.max(0, rx), y: Math.max(0, ry), w, h });
  }, []);

  const end = useCallback(() => { dragRef.current = null; }, []);

  useEffect(() => {
    const mm = (e) => update(e.clientX, e.clientY);
    const mu = () => end();
    const tm = (e) => { if (e.touches && e.touches[0]) update(e.touches[0].clientX, e.touches[0].clientY); };
    const tu = () => end();
    window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu);
    window.addEventListener("touchmove", tm, { passive: true }); window.addEventListener("touchend", tu);
    return () => { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); window.removeEventListener("touchmove", tm); window.removeEventListener("touchend", tu); };
  }, [update, end]);

  const moveHandlers = {
    onMouseDown: (e) => { e.preventDefault(); begin("move", e.clientX, e.clientY); },
    onTouchStart: (e) => { if (e.touches && e.touches[0]) begin("move", e.touches[0].clientX, e.touches[0].clientY); },
  };
  const resizeHandlers = (dir) => ({
    onMouseDown: (e) => { e.preventDefault(); e.stopPropagation(); begin(dir, e.clientX, e.clientY); },
    onTouchStart: (e) => { e.stopPropagation(); if (e.touches && e.touches[0]) begin(dir, e.touches[0].clientX, e.touches[0].clientY); },
  });
  const toggleMaximize = useCallback(() => {
    if (onInteract) onInteract();
    if (!maximized) {
      preMaxRect.current = rect;
      const { w, h } = getUsableDesktop();
      setRect({ x: 0, y: 0, w, h });
      setMaximized(true);
    } else {
      setRect(preMaxRect.current || rect);
      setMaximized(false);
    }
  }, [rect, maximized, onInteract]);
  return [rect, moveHandlers, resizeHandlers, { maximized, toggleMaximize }];
}

/* ============================================================================
   XP UI PRIMITIVES
   ============================================================================ */
function XPButton({ children, onClick, active, small, style, disabled, title }) {
  return <button className={cls("xp-btn", small && "xp-btn-sm", active && "xp-btn-active")} onClick={onClick} disabled={disabled} style={style} title={title}>{children}</button>;
}
function XPCheckbox({ checked, onChange }) {
  return <span className={cls("xp-checkbox", checked && "xp-checkbox-checked")} onClick={onChange}>{checked && <Check size={11} strokeWidth={4} color="#000" />}</span>;
}
function XPProgress({ pct, height }) {
  const w = Math.max(0, Math.min(100, pct)); const segs = 14; const filled = Math.round((w / 100) * segs);
  return <div className="xp-progress" style={{ height: height || 15 }}><div className="xp-progress-segs">{Array.from({ length: segs }).map((_, i) => <span key={i} className={cls("xp-progress-seg", i < filled && "xp-progress-seg-on")} />)}</div></div>;
}
function XPGroupBox({ title, children, style }) { return <fieldset className="xp-groupbox" style={style}><legend>{title}</legend>{children}</fieldset>; }
function StatCard({ n, label, color }) { return <div className="stat-card" style={{ borderLeftColor: color }}><div className="stat-card-n">{n}</div><div className="stat-card-label">{label}</div></div>; }

const RESIZE_DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
function XPWindow({ id, title, icon, x, y, w, h, zIndex, minimized, focused, onFocus, onClose, onMinimize, children }) {
  const [rect, moveHandlers, resizeHandlers, maximize] = useWindowRect({ x, y, w, h }, () => onFocus(id));
  return (
    <div className="xp-window" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, zIndex, display: minimized ? "none" : "flex" }} onMouseDown={() => onFocus(id)}>
      <div className={cls("xp-titlebar", focused ? "xp-titlebar-active" : "xp-titlebar-inactive")} onMouseDown={moveHandlers.onMouseDown} onTouchStart={moveHandlers.onTouchStart} onDoubleClick={maximize.toggleMaximize}>
        <div className="xp-titlebar-left"><span className="xp-titlebar-icon">{icon}</span><span className="xp-titlebar-text">{title}</span></div>
        <div className="xp-titlebar-controls">
          <button className="xp-capbtn xp-capbtn-min" onClick={() => onMinimize(id)} aria-label="Minimize"><Minus size={11} strokeWidth={3.5} color="#0a2a6b" /></button>
          <button className="xp-capbtn xp-capbtn-max" onClick={maximize.toggleMaximize} aria-label={maximize.maximized ? "Restore" : "Maximize"}>{maximize.maximized ? <Copy size={9} strokeWidth={3} color="#0a2a6b" /> : <Square size={9} strokeWidth={3} color="#0a2a6b" />}</button>
          <button className="xp-capbtn xp-capbtn-close" onClick={() => onClose(id)} aria-label="Close"><X size={12} strokeWidth={3.5} color="#fff" /></button>
        </div>
      </div>
      <div className="xp-window-body">{children}</div>
      {!maximize.maximized && RESIZE_DIRS.map((d) => <div key={d} className={"resize-handle rh-" + d} {...resizeHandlers(d)} />)}
    </div>
  );
}

/* ============================================================================
   TRACKER APP
   ============================================================================ */
function TrackerApp({ discipline, progress, setProgress }) {
  const [query, setQuery] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [grouped, setGrouped] = useState(true);
  const sections = sectionsOf(discipline);
  const [openSections, setOpenSections] = useState(() => { const o = {}; sections.forEach((s) => (o[s] = true)); return o; });
  const disciplineLectures = LECTURES.filter((l) => l.discipline === discipline);
  const cell = (id) => (progress[id] || {});
  const isDone = (id, stageKey) => !!cell(id)[stageKey];
  const doneCount = (id) => STAGES.filter((s) => isDone(id, s.key)).length;
  const isFlagged = (id) => !!cell(id).flag;
  const lastActivity = (id) => { const c = cell(id); let max = 0; STAGES.forEach((s) => { if (c[s.key]) max = Math.max(max, new Date(c[s.key]).getTime()); }); return max ? new Date(max) : null; };
  const isStale = (id) => { const dc = doneCount(id); if (dc === 0 || dc === STAGES.length) return false; const la = lastActivity(id); if (!la) return false; return (Date.now() - la.getTime()) / 86400000 > STALE_DAYS; };
  const toggleStage = (id, stageKey) => setProgress((prev) => { const cur = prev[id] || {}; return { ...prev, [id]: { ...cur, [stageKey]: cur[stageKey] ? false : new Date().toISOString() } }; });
  const toggleFlag = (id) => setProgress((prev) => { const cur = prev[id] || {}; return { ...prev, [id]: { ...cur, flag: !cur.flag } }; });

  const fullyDone = disciplineLectures.filter((l) => doneCount(l.id) === STAGES.length).length;
  const notStarted = disciplineLectures.filter((l) => doneCount(l.id) === 0).length;
  const inProgress = disciplineLectures.length - fullyDone - notStarted;
  const flaggedCount = disciplineLectures.filter((l) => isFlagged(l.id)).length;
  const staleCount = disciplineLectures.filter((l) => isStale(l.id)).length;
  const totalCells = disciplineLectures.length * STAGES.length;
  const doneCells = disciplineLectures.reduce((a, l) => a + doneCount(l.id), 0);
  const overallPct = totalCells ? Math.round((doneCells / totalCells) * 100) : 0;
  const visible = disciplineLectures.filter((l) => {
    if (examFilter === "mid" && !l.mid) return false;
    if (examFilter === "finals" && l.mid) return false;
    if (query && !l.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
  const expandAll = (state) => { const o = {}; sections.forEach((s) => (o[s] = state)); setOpenSections(o); };
  const doBackup = () => download(discipline.toLowerCase() + "-tracker-backup.json", JSON.stringify({ discipline, progress, exportedAt: new Date().toISOString() }, null, 2));
  const fileInputRef = useRef(null);
  const doRestore = (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { const data = JSON.parse(reader.result); if (data && data.progress) setProgress((prev) => ({ ...prev, ...data.progress })); } catch (err) { alert("That file doesn't look like a valid backup."); } };
    reader.readAsText(file); e.target.value = "";
  };
  const doReset = () => {
    if (!window.confirm("Reset ALL " + discipline + " progress? This can't be undone (unless you have a backup).")) return;
    setProgress((prev) => { const next = { ...prev }; disciplineLectures.forEach((l) => delete next[l.id]); return next; });
  };

  return (
    <div className="app-col">
      <div className="tracker-hero">
        <div className="tracker-hero-title">{discipline} — Lecture Tracker</div>
        <div className="tracker-hero-sub">{disciplineLectures.length} lectures · {sections.length} departments · progress saved on this device</div>
        <div className="row-between" style={{ marginTop: 8 }}><span className="xp-small-text" style={{ color: "#fff" }}>{overallPct}% complete</span></div>
        <XPProgress pct={overallPct} />
      </div>
      <div className="stat-row">
        <StatCard n={fullyDone} label="Fully done" color="#4E9A1F" />
        <StatCard n={inProgress} label="In progress" color="#D6A61A" />
        <StatCard n={notStarted} label="Not started" color="#B0342B" />
        <StatCard n={flaggedCount} label="Flagged" color="#B0342B" />
        <StatCard n={staleCount} label={"Stale (>" + STALE_DAYS + "d)"} color="#8A5A1E" />
      </div>
      <div className="toolbar">
        <div className="xp-search"><Search size={13} color="#555" /><input className="xp-search-input" placeholder="Search lectures..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="row-gap">
          <XPButton small active={examFilter === "all"} onClick={() => setExamFilter("all")}>All</XPButton>
          <XPButton small active={examFilter === "mid"} onClick={() => setExamFilter("mid")}>Midterm</XPButton>
          <XPButton small active={examFilter === "finals"} onClick={() => setExamFilter("finals")}>Finals-only</XPButton>
        </div>
      </div>
      <div className="toolbar">
        <div className="row-gap"><XPButton small onClick={() => expandAll(true)}>Expand all</XPButton><XPButton small onClick={() => expandAll(false)}>Collapse all</XPButton><XPButton small active={grouped} onClick={() => setGrouped((g) => !g)}>{grouped ? "Grouped by dept." : "Flat list"}</XPButton></div>
        <div className="row-gap">
          <XPButton small onClick={doBackup} title="Download your progress as a JSON file">Backup</XPButton>
          <XPButton small onClick={() => fileInputRef.current && fileInputRef.current.click()} title="Load a backup JSON file">Restore</XPButton>
          <input ref={fileInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={doRestore} />
          <XPButton small onClick={() => window.print()}>Print</XPButton>
          <XPButton small onClick={doReset}>Reset</XPButton>
        </div>
      </div>
      <div className="tracker-scroll">
        {!grouped && (
          <table className="lecture-table">
            <thead><tr><th className="num-col">#</th><th style={{ textAlign: "left" }}>Lecture</th><th>Dept.</th><th>Exam</th>{STAGES.map((s) => <th key={s.key}>{s.label}</th>)}<th>⚑</th></tr></thead>
            <tbody>
              {visible.map((l) => {
                const stale = isStale(l.id);
                return (
                  <tr key={l.id} className={cls(l.mid ? "row-mid" : "row-finals", stale && "row-stale")}>
                    <td className="num-col xp-small-text">{l.num}</td>
                    <td className="lecture-name-cell">{l.name} {stale && <span className="stale-badge" title={"No activity in " + STALE_DAYS + "+ days"}><Clock3 size={10} /></span>}</td>
                    <td className="xp-small-text" style={{ whiteSpace: "nowrap" }}>{l.section}</td>
                    <td className="center-cell"><span className={cls("exam-pill", l.mid ? "exam-pill-mid" : "exam-pill-finals")}>{l.mid ? "MID" : "FINAL"}</span></td>
                    {STAGES.map((s) => <td key={s.key} className="checkbox-cell"><XPCheckbox checked={isDone(l.id, s.key)} onChange={() => toggleStage(l.id, s.key)} /></td>)}
                    <td className="center-cell"><Star size={14} color={isFlagged(l.id) ? "#D6A61A" : "#bbb"} fill={isFlagged(l.id) ? "#D6A61A" : "none"} style={{ cursor: "pointer" }} onClick={() => toggleFlag(l.id)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {grouped && sections.map((section) => {
          const rows = visible.filter((l) => l.section === section);
          if (rows.length === 0) return null;
          const allInSection = disciplineLectures.filter((l) => l.section === section);
          const secDone = allInSection.reduce((a, l) => a + doneCount(l.id), 0);
          const secTotal = allInSection.length * STAGES.length;
          const secPct = secTotal ? Math.round((secDone / secTotal) * 100) : 0;
          return (
            <div key={section} className="section-block" style={{ borderLeft: "4px solid " + (SECTION_COLORS[section] || "#ccc") }}>
              <div className="section-header" style={{ background: (SECTION_COLORS[section] || "#eee") + "80" }} onClick={() => setOpenSections((o) => ({ ...o, [section]: !o[section] }))}>
                <span className="section-caret">{openSections[section] ? "▾" : "▸"}</span>
                <span className="section-title-wrap">
                  <span className="section-title">{section}</span>
                  <span className="section-desc">{SECTION_DESC[section] || ""}</span>
                </span>
                <span className="xp-small-text section-count">{allInSection.length} items</span>
                <div className="section-mini-progress"><XPProgress pct={secPct} height={9} /></div>
                <span className="xp-small-text section-count">{secDone}/{secTotal}</span>
              </div>
              {openSections[section] && (
                <table className="lecture-table">
                  <thead><tr><th className="num-col">#</th><th style={{ textAlign: "left" }}>Lecture</th><th>Type</th><th>Exam</th>{STAGES.map((s) => <th key={s.key}>{s.label}</th>)}<th>⚑</th></tr></thead>
                  <tbody>
                    {rows.map((l) => {
                      const stale = isStale(l.id);
                      return (
                        <tr key={l.id} className={cls(l.mid ? "row-mid" : "row-finals", stale && "row-stale")}>
                          <td className="num-col xp-small-text">{l.num}</td>
                          <td className="lecture-name-cell">{l.name} {stale && <span className="stale-badge" title={"No activity in " + STALE_DAYS + "+ days"}><Clock3 size={10} /></span>}</td>
                          <td className="center-cell"><span className="type-pill">{l.type}</span></td>
                          <td className="center-cell"><span className={cls("exam-pill", l.mid ? "exam-pill-mid" : "exam-pill-finals")}>{l.mid ? "MID" : "FINAL"}</span></td>
                          {STAGES.map((s) => <td key={s.key} className="checkbox-cell"><XPCheckbox checked={isDone(l.id, s.key)} onChange={() => toggleStage(l.id, s.key)} /></td>)}
                          <td className="center-cell"><Star size={14} color={isFlagged(l.id) ? "#D6A61A" : "#bbb"} fill={isFlagged(l.id) ? "#D6A61A" : "none"} style={{ cursor: "pointer" }} onClick={() => toggleFlag(l.id)} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   TIMER APP — engine lives in App (via props) so it survives minimize/switch.
   Uses a wall-clock end-timestamp, not a naive tick counter, so it stays
   correct even if the tab is throttled in the background.
   ============================================================================ */
const MODES = { pomodoro: { label: "Pomodoro", color: "#c0392b" }, short: { label: "Short Break", color: "#1f7a3d" }, long: { label: "Long Break", color: "#0a56d6" } };

function TimerApp({ timer, timerActions, settings, setSettings, tasks, addTask, plan }) {
  const [newTaskProject, setNewTaskProject] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");

  const { mode, running, secondsLeft, linkedLabel } = timer;
  const durMin = mode === "pomodoro" ? settings.pomodoroMin : mode === "short" ? settings.shortMin : settings.longMin;
  const pct = durMin > 0 ? ((durMin * 60 - secondsLeft) / (durMin * 60)) * 100 : 0;

  const askNotifPermission = () => {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then((p) => setNotifPermission(p));
  };

  const projects = Array.from(new Set(tasks.map((t) => t.project))).filter(Boolean);

  return (
    <div className="app-col timer-app">
      <div className="row-gap" style={{ marginBottom: 10, justifyContent: "center" }}>
        {Object.keys(MODES).map((m) => <XPButton key={m} active={mode === m} onClick={() => timerActions.setMode(m)}>{MODES[m].label}</XPButton>)}
      </div>
      <div className="timer-face" style={{ borderColor: MODES[mode].color }}>
        <div className="timer-clock">{fmtClock(secondsLeft)}</div>
        <XPProgress pct={pct} />
        {linkedLabel && <div className="xp-small-text timer-linked-label">on: {linkedLabel}</div>}
      </div>
      <div className="row-gap" style={{ justifyContent: "center", marginTop: 10 }}>
        {!running ? (
          <XPButton onClick={timerActions.start}><Play size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Start</XPButton>
        ) : (
          <XPButton onClick={timerActions.pause}><Pause size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Pause</XPButton>
        )}
        <XPButton onClick={timerActions.skip} disabled={!running && !timer.paused} title="Count this round as completed and move to the next break"><SkipForward size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Skip</XPButton>
        <XPButton onClick={timerActions.reset}><RotateCcw size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Reset</XPButton>
        <XPButton onClick={timerActions.toggleSound} title={timer.soundEnabled === false ? "Enable timer sounds" : "Mute timer sounds"}>{timer.soundEnabled === false ? <VolumeX size={13} /> : <Volume2 size={13} />}</XPButton>
      </div>
      {notifPermission !== "granted" && notifPermission !== "unsupported" && (
        <div className="notif-hint" onClick={askNotifPermission}><Bell size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Enable notifications so a pomodoro finishing pops up even on another window/tab</div>
      )}

      <XPGroupBox title="What are you working on?" style={{ marginTop: 12 }}>
        <select className="xp-select" value={timer.linkedId || ""} disabled={timer.running || timer.paused} onChange={(e) => timerActions.link(e.target.value)}>
          <option value="">— Freeform (not linked) —</option>
          {plan && plan.filter((p) => !p.done).length > 0 && (
            <optgroup label="This Week's Plan">
              {plan.filter((p) => !p.done).map((p) => {
                const lec = LECTURES.find((l) => l.id === p.lectureId);
                const stageLabel = p.stage ? (STAGES.find((s) => s.key === p.stage) || {}).label : "";
                return <option key={p.id} value={"plan:" + p.id}>{p.dateKey} — {lec ? lec.name : "custom"}{p.part ? " (" + p.part + ")" : ""}{stageLabel ? " [" + stageLabel + "]" : ""}</option>;
              })}
            </optgroup>
          )}
          {projects.length > 0 && (
            <optgroup label="My Tasks">
              {tasks.map((t) => <option key={t.id} value={"task:" + t.id}>{t.project} — {t.name}</option>)}
            </optgroup>
          )}
          <optgroup label="Surgery">{LECTURES.filter((l) => l.discipline === "Surgery").map((l) => <option key={l.id} value={"lec:" + l.id}>{l.section} — {l.name}</option>)}</optgroup>
          <optgroup label="Medicine">{LECTURES.filter((l) => l.discipline === "Medicine").map((l) => <option key={l.id} value={"lec:" + l.id}>{l.section} — {l.name}</option>)}</optgroup>
        </select>
        <div className="row-gap" style={{ marginTop: 8 }}>
          <input className="xp-text-input" placeholder="Project (e.g. Gym, Thesis)" value={newTaskProject} onChange={(e) => setNewTaskProject(e.target.value)} style={{ flex: 1 }} />
          <input className="xp-text-input" placeholder="Task name" value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} style={{ flex: 1 }} />
          <XPButton small disabled={timer.running || timer.paused} onClick={() => {
            if (!newTaskName.trim()) return;
            const t = { id: "T" + Date.now(), project: newTaskProject.trim() || "General", name: newTaskName.trim(), createdAt: new Date().toISOString() };
            addTask(t); timerActions.link("task:" + t.id); setNewTaskName("");
          }}><Plus size={12} /></XPButton>
        </div>
        <div className="xp-small-text" style={{ marginTop: 4, opacity: 0.7 }}>{timer.running || timer.paused ? "Locked while this round is active — reset to change it." : "Not tied to Sem 10 — use this for anything: gym, other courses, side projects."}</div>
      </XPGroupBox>

      <XPGroupBox title="Settings" style={{ marginTop: 10 }}>
        <div className="settings-grid">
          <label className="xp-small-text">Pomodoro (min)<input type="number" className="xp-number" value={settings.pomodoroMin} min={1} max={90} onChange={(e) => setSettings((s) => ({ ...s, pomodoroMin: +e.target.value || 1 }))} /></label>
          <label className="xp-small-text">Short break (min)<input type="number" className="xp-number" value={settings.shortMin} min={1} max={60} onChange={(e) => setSettings((s) => ({ ...s, shortMin: +e.target.value || 1 }))} /></label>
          <label className="xp-small-text">Long break (min)<input type="number" className="xp-number" value={settings.longMin} min={1} max={60} onChange={(e) => setSettings((s) => ({ ...s, longMin: +e.target.value || 1 }))} /></label>
          <label className="xp-small-text">Long break every<input type="number" className="xp-number" value={settings.longBreakEvery} min={2} max={12} onChange={(e) => setSettings((s) => ({ ...s, longBreakEvery: +e.target.value || 2 }))} /></label>
          <label className="xp-checkbox-row" style={{ marginTop: 4 }}><XPCheckbox checked={settings.autoStartBreaks} onChange={() => setSettings((s) => ({ ...s, autoStartBreaks: !s.autoStartBreaks }))} /><span className="xp-checkbox-label" style={{ marginLeft: 6 }}>Auto-start breaks</span></label>
          <label className="xp-checkbox-row" style={{ marginTop: 4 }}><XPCheckbox checked={settings.autoStartPomodoros} onChange={() => setSettings((s) => ({ ...s, autoStartPomodoros: !s.autoStartPomodoros }))} /><span className="xp-checkbox-label" style={{ marginLeft: 6 }}>Auto-start pomodoros</span></label>
        </div>
      </XPGroupBox>
      <div className="xp-small-text" style={{ marginTop: 8, opacity: 0.65, textAlign: "center" }}>Keeps running if you switch to another window or minimize this one.</div>
    </div>
  );
}

/* ============================================================================
   GOALS APP
   ============================================================================ */
function GoalsApp({ sessions, settings, setSettings }) {
  const weekStart = startOfWeek(new Date(), settings.weekStartDay);
  const dayStart = startOfDay(new Date());
  const weekSessions = sessions.filter((s) => new Date(s.ts) >= weekStart);
  const daySessions = sessions.filter((s) => new Date(s.ts) >= dayStart);
  const weekCount = weekSessions.length, dayCount = daySessions.length;
  const weekMinutes = weekSessions.reduce((a, s) => a + s.durationMin, 0);
  const weekPct = settings.weeklyGoal > 0 ? Math.min(100, Math.round((weekCount / settings.weeklyGoal) * 100)) : 0;
  const dailyTarget = settings.weeklyGoal > 0 ? Math.round(settings.weeklyGoal / 7) : 0;
  const dayPct = dailyTarget > 0 ? Math.min(100, Math.round((dayCount / dailyTarget) * 100)) : 0;
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const ws = new Date(weekStart); ws.setDate(ws.getDate() - i * 7);
    const we = new Date(ws); we.setDate(we.getDate() + 7);
    const count = sessions.filter((s) => { const t = new Date(s.ts); return t >= ws && t < we; }).length;
    weeks.push({ label: (ws.getMonth() + 1) + "/" + ws.getDate(), count });
  }
  const maxWeekCount = Math.max(1, ...weeks.map((w) => w.count));
  const byGroup = {};
  sessions.forEach((s) => { const g = s.groupLabel || "Freeform"; byGroup[g] = (byGroup[g] || 0) + 1; });
  const groupRows = Object.entries(byGroup).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const exportCsv = () => {
    const header = "timestamp,duration_min,label,group\n";
    const rows = sessions.map((s) => [s.ts, s.durationMin, '"' + (s.label || "") + '"', s.groupLabel || ""].join(",")).join("\n");
    download("pomodoro-sessions.csv", header + rows);
  };
  return (
    <div className="app-col">
      <XPGroupBox title="Weekly goal">
        <div className="settings-grid" style={{ marginBottom: 8 }}>
          <label className="xp-small-text">Target poms / week<input type="number" className="xp-number" value={settings.weeklyGoal} min={0} onChange={(e) => setSettings((s) => ({ ...s, weeklyGoal: +e.target.value || 0 }))} /></label>
          <label className="xp-small-text">Week starts on
            <select className="xp-select" style={{ marginTop: 2 }} value={settings.weekStartDay} onChange={(e) => setSettings((s) => ({ ...s, weekStartDay: +e.target.value }))}>
              <option value={6}>Saturday</option><option value={0}>Sunday</option><option value={1}>Monday</option>
            </select>
          </label>
        </div>
        <div className="row-between"><span className="xp-small-text">{weekCount} / {settings.weeklyGoal || "—"} poms this week ({weekMinutes} min)</span><span className="xp-small-text" style={{ fontWeight: "bold" }}>{weekPct}%</span></div>
        <XPProgress pct={weekPct} />
        <div className="xp-small-text" style={{ marginTop: 8 }}>Today: {dayCount} / {dailyTarget || "—"} poms</div>
        <XPProgress pct={dayPct} height={10} />
        <div className="xp-small-text" style={{ marginTop: 6, opacity: 0.75 }}>Resets automatically each week/day — counted live from your session log.</div>
      </XPGroupBox>
      <XPGroupBox title="Last 8 weeks" style={{ marginTop: 10 }}>
        <div className="week-chart">{weeks.map((w, i) => <div key={i} className="week-bar-col"><div className="week-bar" style={{ height: Math.max(3, (w.count / maxWeekCount) * 60) }} title={w.count + " poms"} /><span className="xp-small-text week-bar-label">{w.label}</span></div>)}</div>
      </XPGroupBox>
      <XPGroupBox title="Poms by specialty / project" style={{ marginTop: 10 }}>
        {groupRows.length === 0 && <div className="xp-small-text">No linked sessions yet.</div>}
        {groupRows.map(([g, count]) => <div key={g} className="row-between" style={{ marginBottom: 4 }}><span className="xp-small-text">{g}</span><span className="xp-small-text" style={{ fontWeight: "bold" }}>{count}</span></div>)}
      </XPGroupBox>
      <div style={{ marginTop: 10, textAlign: "right" }}><XPButton onClick={exportCsv}>Export CSV</XPButton></div>
    </div>
  );
}

/* ============================================================================
   OVERVIEW APP ("My Computer") — the combined homepage the original site
   opens to (154 lectures / 19 departments / 2 disciplines), which the desktop
   shell was missing entirely.
   ============================================================================ */
function OverviewApp({ progress, openApp, allData, setAllData }) {
  const cell = (id) => progress[id] || {};
  const doneCount = (id) => STAGES.filter((s) => cell(id)[s.key]).length;
  const disciplines = ["Surgery", "Medicine"];
  const totalLectures = LECTURES.length;
  const totalSections = disciplines.reduce((a, d) => a + sectionsOf(d).length, 0);
  const totalCells = totalLectures * STAGES.length;
  const doneCells = LECTURES.reduce((a, l) => a + doneCount(l.id), 0);
  const overallPct = totalCells ? Math.round((doneCells / totalCells) * 100) : 0;
  const midCount = LECTURES.filter((l) => l.mid).length;
  const nextExam = [...(allData.exams || [])].sort((a, b) => new Date(a.target) - new Date(b.target)).find((e) => new Date(e.target).getTime() > Date.now());
  const fileInputRef = useRef(null);

  const backupAll = () => download("sem10-xp-full-backup.json", JSON.stringify({ ...allData, exportedAt: new Date().toISOString(), version: 1 }, null, 2));
  const restoreAll = (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object") throw new Error("bad file");
        if (data.progress) setAllData.setProgress(data.progress);
        if (data.sessions) setAllData.setSessions(data.sessions);
        if (data.tasks) setAllData.setTasks(data.tasks);
        if (data.plan) setAllData.setPlan(data.plan);
        if (data.exams) setAllData.setExams(data.exams);
        if (data.settings) setAllData.setSettings(data.settings);
        alert("Restored successfully.");
      } catch (err) { alert("That doesn't look like a valid Sem 10 XP backup file."); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  return (
    <div className="app-col overview-app">
      <div className="overview-hero">
        <div className="overview-hero-title">SEM 10-XP</div>
        <div className="overview-hero-sub">Faculty of Medicine — Internal Medicine & Surgery trackers · by Amro Adel</div>
        <div className="overview-ring-wrap">
          <div className="overview-ring" style={{ background: "conic-gradient(#4E9A1F " + overallPct + "%, #d8d5c4 0)" }}>
            <div className="overview-ring-inner">{overallPct}%<span>complete</span></div>
          </div>
        </div>
        <div className="xp-small-text" style={{ color: "#dbe6fb", textAlign: "center" }}>{doneCells} / {totalCells} cells checked · saved on this device</div>
      </div>
      <div className="stat-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <StatCard n={totalLectures} label="Lectures" color="#0A46C6" />
        <StatCard n={totalSections} label="Departments" color="#4E9A1F" />
        <StatCard n={midCount + " / " + (totalLectures - midCount)} label="Midterm / Finals" color="#D6A61A" />
      </div>
      {disciplines.map((d) => {
        const lecs = LECTURES.filter((l) => l.discipline === d);
        const dTotal = lecs.length * STAGES.length;
        const dDone = lecs.reduce((a, l) => a + doneCount(l.id), 0);
        const dPct = dTotal ? Math.round((dDone / dTotal) * 100) : 0;
        return (
          <div key={d} className="overview-disc-card" onClick={() => openApp(d.toLowerCase())}>
            <div className="overview-disc-icon">{d === "Surgery" ? "🔪" : "💊"}</div>
            <div style={{ flex: 1 }}>
              <div className="overview-disc-title">{d} <span className="xp-small-text">({lecs.length} lectures · {sectionsOf(d).length} departments)</span></div>
              <XPProgress pct={dPct} height={10} />
            </div>
            <div className="overview-disc-pct">{dPct}%</div>
          </div>
        );
      })}
      <div className="overview-disc-card" onClick={() => openApp("planner")}>
        <div className="overview-disc-icon">🗓️</div>
        <div style={{ flex: 1 }}><div className="overview-disc-title">Study Planner <span className="xp-small-text">(schedule lectures by day)</span></div></div>
      </div>
      <div className="overview-disc-card" onClick={() => openApp("exams")}>
        <div className="overview-disc-icon">📝</div>
        <div style={{ flex: 1 }}>
          <div className="overview-disc-title">Exam Schedule</div>
          {nextExam && <div className="xp-small-text">Next: {nextExam.subject} {nextExam.type} in {examDaysLabel(nextExam.target)}</div>}
        </div>
      </div>
      <div className="xp-small-text overview-note">
        Sourced from Alpha Team papers + official pre/post-midterm lists, cross-referenced across 5 sources. Tracks lectures only — clinical rounds and skill labs aren't in this dataset yet.
      </div>
      <div className="row-gap" style={{ marginTop: 10, justifyContent: "center" }}>
        <XPButton small onClick={backupAll}>Backup everything</XPButton>
        <XPButton small onClick={() => fileInputRef.current && fileInputRef.current.click()}>Restore everything</XPButton>
        <input ref={fileInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={restoreAll} />
      </div>
    </div>
  );
}

/* ============================================================================
   EXAM SCHEDULE APP — live countdowns, editable, seeded with confirmed dates
   ============================================================================ */
function ExamApp({ exams, setExams, openApp }) {
  const [, setTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ subject: "", type: "", shortType: "CONT", date: "", time: "10:00 AM", endTime: "" });
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(t); }, []);

  const sorted = [...exams].sort((a, b) => new Date(a.target) - new Date(b.target));
  const nextExam = sorted.find((e) => new Date(e.target).getTime() > Date.now());
  const nextCountdown = nextExam ? examCountdown(nextExam.target) : null;

  const addExam = () => {
    if (!form.date || !form.subject.trim()) return;
    const target = form.date + "T" + to24h(form.time) + ":00";
    setExams((prev) => [...prev, { id: "E" + Date.now(), subject: form.subject.trim(), type: form.type.trim() || "Exam", shortType: form.shortType, date: form.date, time: form.time, endTime: form.endTime, target }]);
    setForm({ subject: "", type: "", shortType: "CONT", date: "", time: "10:00 AM", endTime: "" });
    setEditing(false);
  };
  const removeExam = (id) => { if (window.confirm("Remove this exam entry?")) setExams((prev) => prev.filter((e) => e.id !== id)); };

  return (
    <div className="app-col exams-app">
      <div className="exam-hero">
        <div className="exam-hero-title">Semester 10 — Exam Schedule</div>
        <div className="exam-hero-sub">Your confirmed timetable, with live countdowns</div>
        {nextExam && (
          <div className="exam-next-card">
            <div>
              <div className="exam-next-kicker">NEXT EXAM</div>
              <div className="exam-next-name">{nextExam.subject} — {nextExam.type}</div>
              <div className="exam-next-date">{formatExamDate(nextExam)} · {nextExam.time}</div>
            </div>
            <div className="exam-next-countdown">
              <strong>{nextCountdown.days}</strong><span>days</span>
              <small>{pad(nextCountdown.hours)}:{pad(nextCountdown.minutes)}:{pad(nextCountdown.seconds)}</small>
            </div>
          </div>
        )}
      </div>
      <div className="exam-notice"><b>Reminder:</b> arrive at least 30 minutes before the scheduled start time.</div>
      <div className="exam-list">
        <div className="exam-list-head"><span>Date</span><span>Subject</span><span>Exam</span><span>Time</span><span>Countdown</span><span></span></div>
        {sorted.map((exam) => {
          const c = examCountdown(exam.target);
          const passed = c.status === "past";
          return (
            <div key={exam.id} className={cls("exam-row", passed && "exam-row-past", !passed && nextExam && exam.id === nextExam.id && "exam-row-next")}>
              <div className="exam-date-cell"><strong>{formatExamDate(exam)}</strong></div>
              <div className="exam-subject-cell"><strong>{exam.subject}</strong></div>
              <div>
                <span className={cls("exam-type-pill", exam.shortType === "FINAL" ? "exam-type-final" : exam.shortType === "OSCE" ? "exam-type-osce" : "exam-type-cont")}>{exam.shortType}</span>
                <div className="exam-type-text">{exam.type}</div>
              </div>
              <div className="exam-time-cell">{exam.time}{exam.endTime ? " – " + exam.endTime : ""}</div>
              <div className="exam-countdown-cell">
                {passed ? <span className="exam-passed">Completed</span> : (<><strong>{examDaysLabel(exam.target)}</strong><small>{pad(c.hours)}:{pad(c.minutes)}:{pad(c.seconds)}</small></>)}
              </div>
              <button className="exam-row-remove" onClick={() => removeExam(exam.id)} title="Remove">×</button>
            </div>
          );
        })}
      </div>
      {editing ? (
        <XPGroupBox title="Add exam" style={{ marginTop: 10 }}>
          <div className="settings-grid">
            <label className="xp-small-text">Subject<input className="xp-text-input" style={{ width: "100%" }} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="e.g. MED IV" /></label>
            <label className="xp-small-text">Type<input className="xp-text-input" style={{ width: "100%" }} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} placeholder="e.g. Final" /></label>
            <label className="xp-small-text">Date<input type="date" className="xp-text-input" style={{ width: "100%" }} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></label>
            <label className="xp-small-text">Time<input className="xp-text-input" style={{ width: "100%" }} value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} placeholder="10:00 AM" /></label>
          </div>
          <div className="row-gap" style={{ justifyContent: "flex-end", marginTop: 8 }}><XPButton small onClick={() => setEditing(false)}>Cancel</XPButton><XPButton small active onClick={addExam}>Add</XPButton></div>
        </XPGroupBox>
      ) : (
        <div style={{ marginTop: 10, textAlign: "right" }}><XPButton small onClick={() => setEditing(true)}>+ Add exam</XPButton> <XPButton small onClick={() => openApp("planner")}>Open Study Planner</XPButton></div>
      )}
    </div>
  );
}
function to24h(t) {
  const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(t);
  if (!m) return "10:00";
  let h = parseInt(m[1], 10); const min = m[2]; const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return pad(h) + ":" + min;
}

/* ============================================================================
   PLANNER APP — weekly Medicine/Surgery grid, real dates, duplicates and
   split/part sessions allowed, stage-aware, linked to Tracker + Pomodoro.
   ============================================================================ */
const PLANNER_DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
function PlannerApp({ plan, setPlan, progress, setProgress, startPomForEntry }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [addFor, setAddFor] = useState(null); // { dk, discipline }
  const [pickLecture, setPickLecture] = useState("");
  const [pickStage, setPickStage] = useState("");
  const [partText, setPartText] = useState("");

  const weekStart = startOfWeek(new Date(), 6);
  const days = [];
  for (let i = 0; i < 7; i++) { const d = new Date(weekStart); d.setDate(d.getDate() + i + weekOffset * 7); days.push(d); }
  const todayKey = localDateKey(new Date());

  const entriesFor = (dk, disc) => plan.filter((p) => p.dateKey === dk && p.discipline === disc).sort((a, b) => (a.order || 0) - (b.order || 0));
  const trackerStageDone = (entry) => !!(entry.lectureId && entry.stage && progress[entry.lectureId] && progress[entry.lectureId][entry.stage]);

  const openAdd = (dk, disc) => { setAddFor({ dk, discipline: disc }); setPickLecture(""); setPickStage(""); setPartText(""); };
  const addEntry = () => {
    if (!addFor) return;
    const lec = LECTURES.find((l) => l.id === pickLecture);
    if (!lec && !partText.trim()) return;
    const entry = {
      id: "PL" + Date.now() + Math.random().toString(36).slice(2, 6),
      dateKey: addFor.dk, discipline: addFor.discipline,
      lectureId: pickLecture || null, stage: pickStage || null,
      part: partText.trim(), done: false, completedPoms: 0,
      order: entriesFor(addFor.dk, addFor.discipline).length,
    };
    setPlan((prev) => [...prev, entry]);
    setAddFor(null);
  };
  const duplicateEntry = (entry) => {
    const copy = { ...entry, id: "PL" + Date.now() + Math.random().toString(36).slice(2, 6), done: false, completedPoms: 0, order: entriesFor(entry.dateKey, entry.discipline).length };
    setPlan((prev) => [...prev, copy]);
  };
  const removeEntry = (id) => setPlan((prev) => prev.filter((p) => p.id !== id));
  // Planner "done" and Tracker stage completion are intentionally separate states,
  // with one explicit exception: checking a planner entry done also marks its linked
  // tracker stage complete. This is one-way only - unchecking Planner-done does NOT
  // un-check the Tracker, and a completed Pomodoro never touches the Tracker at all.
  const toggleDone = (entry) => {
    setPlan((prev) => prev.map((p) => (p.id === entry.id ? { ...p, done: !p.done } : p)));
    if (!entry.done && entry.lectureId && entry.stage) {
      setProgress((prev) => {
        const cur = prev[entry.lectureId] || {};
        if (cur[entry.stage]) return prev; // already marked - leave its existing timestamp alone
        return { ...prev, [entry.lectureId]: { ...cur, [entry.stage]: new Date().toISOString() } };
      });
    }
  };
  // A Pomodoro records focused time only. This explicit action is the point at
  // which a study session is declared complete, and therefore syncs its stage
  // to the matching Medicine/Surgery tracker.
  const completeEntry = (entry) => {
    if (entry.done) return;
    toggleDone(entry);
  };

  const weekEntries = plan.filter((p) => days.some((d) => localDateKey(d) === p.dateKey));
  const weekPlannedCount = weekEntries.length;
  const weekDoneCount = weekEntries.filter((e) => e.done).length;
  const weekPoms = weekEntries.reduce((a, e) => a + (e.completedPoms || 0), 0);

  return (
    <div className="app-col planner-app">
      <div className="row-between planner-nav">
        <XPButton small onClick={() => setWeekOffset((o) => o - 1)}>◀ Prev</XPButton>
        <span className="xp-small-text" style={{ fontWeight: "bold" }}>{days[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – {days[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        <XPButton small onClick={() => setWeekOffset((o) => o + 1)}>Next ▶</XPButton>
      </div>
      <div className="row-between" style={{ marginBottom: 8 }}>
        {weekOffset !== 0 && <XPButton small onClick={() => setWeekOffset(0)}>This week</XPButton>}
        <span className="xp-small-text" style={{ marginLeft: "auto" }}>{weekDoneCount}/{weekPlannedCount} done this week · {weekPoms} poms logged</span>
      </div>
      <div className="planner-grid-head"><span /><span>Medicine</span><span>Surgery</span></div>
      <div className="planner-scroll">
        {days.map((d) => {
          const dk = localDateKey(d);
          const isToday = dk === todayKey;
          return (
            <div key={dk} className={cls("planner-row", isToday && "planner-row-today")}>
              <div className="planner-day-label"><span className="planner-day-name">{PLANNER_DAY_NAMES[d.getDay()]}</span><span className="planner-day-date">{d.getDate()}/{d.getMonth() + 1}</span></div>
              {["Medicine", "Surgery"].map((disc) => (
                <div key={disc} className="planner-cell">
                  {entriesFor(dk, disc).length === 0 && addFor && addFor.dk === dk && addFor.discipline === disc ? null : entriesFor(dk, disc).length === 0 && <div className="xp-small-text planner-empty">----</div>}
                  {entriesFor(dk, disc).map((e) => {
                    const lec = LECTURES.find((l) => l.id === e.lectureId);
                    const stageLabel = e.stage ? (STAGES.find((s) => s.key === e.stage) || {}).label : "";
                    return (
                      <div key={e.id} className={cls("planner-chip", e.done && "planner-chip-done")}>
                        <span className="planner-chip-check" onClick={() => toggleDone(e)}>{e.done ? <Check size={10} /> : null}</span>
                        <span className="planner-chip-text">
                          {lec ? lec.name : "(custom)"}{e.part ? <em> — {e.part}</em> : null}
                          {stageLabel && <span className="planner-chip-stage">{stageLabel}</span>}
                          {e.completedPoms > 0 && <span className="planner-chip-poms">🍅{e.completedPoms}</span>}
                          {trackerStageDone(e) && <span className="planner-chip-tracker-done" title="This stage is already checked off in the Tracker">✓ tracker</span>}
                        </span>
                        <XPButton small active={!e.done} disabled={e.done} title={e.done ? "Study session completed" : "Mark session complete and update the linked tracker stage"} onClick={() => completeEntry(e)}>{e.done ? "Done" : "Complete"}</XPButton>
                        <span className="planner-chip-btn" title="Start Pomodoro" onClick={() => startPomForEntry(e)}>▶</span>
                        <span className="planner-chip-btn" title="Duplicate" onClick={() => duplicateEntry(e)}>⧉</span>
                        <span className="planner-chip-remove" onClick={() => removeEntry(e.id)}>×</span>
                      </div>
                    );
                  })}
                  {addFor && addFor.dk === dk && addFor.discipline === disc ? (
                    <div className="planner-add-form">
                      <select className="xp-select" value={pickLecture} onChange={(e) => { setPickLecture(e.target.value); const l = LECTURES.find((x) => x.id === e.target.value); if (l && !partText) setPartText(""); }}>
                        <option value="">— pick a lecture (optional) —</option>
                        {sectionsOf(disc).map((sec) => (
                          <optgroup key={sec} label={sec}>{LECTURES.filter((l) => l.discipline === disc && l.section === sec).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</optgroup>
                        ))}
                      </select>
                      <select className="xp-select" style={{ marginTop: 4 }} value={pickStage} onChange={(e) => setPickStage(e.target.value)}>
                        <option value="">— stage (optional) —</option>
                        {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                      <input className="xp-text-input" style={{ width: "100%", marginTop: 4 }} placeholder="Part / note (e.g. Part 2, up to slide 20)" value={partText} onChange={(e) => setPartText(e.target.value)} />
                      <div className="row-gap" style={{ marginTop: 5, justifyContent: "flex-end" }}>
                        <XPButton small onClick={() => setAddFor(null)}>Cancel</XPButton>
                        <XPButton small active onClick={addEntry}>Add</XPButton>
                      </div>
                    </div>
                  ) : (
                    <XPButton small onClick={() => openAdd(dk, disc)}>+ Add</XPButton>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="xp-small-text" style={{ marginTop: 8, opacity: 0.7, textAlign: "center" }}>Duplicate any entry to split a lecture across days — each copy is independent, so parts and stages can differ.</div>
    </div>
  );
}

/* ============================================================================
   DESKTOP SHELL
   ============================================================================ */
const APPS = {
  computer: { title: "My Computer", icon: "💻", w: 480, h: 560 },
  surgery: { title: "Surgery Tracker.exe", icon: "🔪", w: 680, h: 560 },
  medicine: { title: "Medicine Tracker.exe", icon: "💊", w: 680, h: 560 },
  planner: { title: "StudyPlanner.exe", icon: "🗓️", w: 700, h: 600 },
  timer: { title: "FocusTimer.exe", icon: "⏱️", w: 380, h: 610 },
  goals: { title: "WeeklyGoals.exe", icon: "📊", w: 420, h: 560 },
  exams: { title: "ExamSchedule.exe", icon: "📝", w: 640, h: 580 },
};
function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(t); }, []);
  let h = now.getHours(); const ampm = h >= 12 ? "PM" : "AM"; h = h % 12; if (h === 0) h = 12;
  return <div className="xp-clock">{h}:{pad(now.getMinutes())} {ampm}</div>;
}
const THEMES = {
  Blue: { t1: "#3E97FF", t2: "#0B4FDB", t3: "#0A46C6", tb1: "#2E6FE0", tb2: "#1A4FC4", tb3: "#0F3DAA" },
  Olive: { t1: "#C7D79E", t2: "#8AA34F", t3: "#6E8A3C", tb1: "#A9BE72", tb2: "#7C9645", tb3: "#5E7A32" },
  Silver: { t1: "#D3D7E0", t2: "#9099AC", t3: "#767F94", tb1: "#B7BECC", tb2: "#8891A5", tb3: "#6B7488" },
};
const WALLPAPER_DATA_URI = "data:image/jpeg;base64,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";

function LoginScreen({ onLogin }) {
  return (
    <div className="login-screen">
      <div className="login-topbar" />
      <div className="login-body">
        <div className="login-glow" />
        <div className="login-left">
          <div className="login-logo">
            <span className="login-logo-sq" style={{ background: "#e8412c" }} />
            <span className="login-logo-sq" style={{ background: "#7cb928" }} />
            <span className="login-logo-sq" style={{ background: "#2b8ee8" }} />
            <span className="login-logo-sq" style={{ background: "#f0b429" }} />
          </div>
          <div className="login-brand">SEM 10-XP <span>by Amro Adel</span></div>
          <div className="login-hint">To begin, click your user name</div>
        </div>
        <div className="login-divider" />
        <div className="login-right">
          <div className="login-tile" onClick={() => { playChime("login"); onLogin(); }}>
            <div className="login-tile-avatar">🎓</div>
            <div className="login-tile-name">Administrator</div>
          </div>
        </div>
      </div>
      <div className="login-bottombar">
        <div className="login-poweroff" onClick={onLogin}><span className="login-poweroff-icon">⏻</span> Turn off computer</div>
        <div className="login-bottomtext">Click your user name, or the button above, to continue.</div>
      </div>
    </div>
  );
}

function BootScreen({ text }) {
  return (
    <div className="xp-boot">
      <div className="xp-boot-brand" aria-label="SEM 10-XP Study Planner">
        <div className="xp-boot-mark" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="xp-boot-product"><span className="xp-boot-product-small">SEM 10</span><span className="xp-boot-product-main">Study Planner</span><b>XP</b></div>
      </div>
      <div className="xp-boot-subtitle">by Amro Adel</div>
      <div className="xp-boot-barwrap" aria-label="Loading"><div className="xp-boot-bar"><i /><i /><i /></div></div>
      <div className="xp-boot-text">{text}</div>
    </div>
  );
}

class SemXPErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("SEM10-XP crashed:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ position: "fixed", inset: 0, background: "#0a1a4a", color: "#fff", fontFamily: "Tahoma, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 6 }}>SEM 10-XP hit an error</div>
          <div style={{ fontSize: 12, opacity: 0.85, maxWidth: 420, marginBottom: 14 }}>Your saved progress is untouched — it lives in storage, not in this crashed screen. Reloading the artifact should recover it.</div>
          <button onClick={() => this.setState({ error: null })} style={{ background: "#3E85F5", border: "1px solid #fff", color: "#fff", padding: "6px 16px", borderRadius: 4, cursor: "pointer", fontFamily: "Tahoma, sans-serif" }}>Try to continue</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Sem10XPApp() {
  const [progress, setProgress, progressLoaded] = useStoredState("lecture-progress-v2", {});
  const [sessions, setSessions, sessionsLoaded] = useStoredState("pomodoro-sessions", []);
  const [tasks, setTasks, tasksLoaded] = useStoredState("custom-tasks", []);
  const [plan, setPlan, plannerLoaded] = useStoredState("study-plan-v1", []);
  const [exams, setExams, examLoaded] = useStoredState("exam-schedule-v1", DEFAULT_EXAMS);
  const [settings, setSettings, settingsLoaded] = useStoredState("app-settings", { pomodoroMin: 25, shortMin: 5, longMin: 15, longBreakEvery: 4, autoStartBreaks: false, autoStartPomodoros: false, weeklyGoal: 30, weekStartDay: 6 });
  const [theme, setTheme] = useState("Blue");
  const addSession = (s) => setSessions((prev) => [...prev, s]);
  const addTask = (t) => setTasks((prev) => [...prev, t]);

  /* ---- Timer engine, lives here so it survives minimizing/switching windows ---- */
  const [timer, setTimer] = useState({ mode: "pomodoro", running: false, paused: false, endsAt: null, remaining: 25 * 60, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "", soundEnabled: true });
  const [tick, setTick] = useState(0);
  // Keyed to the specific endsAt already completed (not a boolean+timeout), so a
  // tick and a visibilitychange firing for the same expiry can never double-complete it.
  const completingRef = useRef(null);
  // The link-context frozen at the moment the CURRENT round genuinely started (fresh
  // start or auto-continue), so changing the picker mid-round can't retroactively change
  // what the running/paused round gets attributed to when it finishes.
  const activeSessionRef = useRef(null);
  const pomosThisSet = useRef(0);

  const durFor = useCallback((mode) => (mode === "pomodoro" ? settings.pomodoroMin : mode === "short" ? settings.shortMin : settings.longMin) * 60, [settings]);

  // If the timer is idle (not running, not mid-pause), keep its displayed
  // duration live-synced whenever the user edits the length settings -
  // otherwise a duration change silently wouldn't apply until Start.
  useEffect(() => {
    if (!timer.running && !timer.paused) setTimer((t) => ({ ...t, remaining: durFor(t.mode) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.pomodoroMin, settings.shortMin, settings.longMin]);

  const secondsLeft = timer.running && timer.endsAt ? Math.max(0, Math.round((timer.endsAt - Date.now()) / 1000)) : timer.remaining;

  const runCompletion = useCallback(() => {
    const finished = activeSessionRef.current || { mode: timer.mode, linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "" };
    playChime("notify", timer.soundEnabled);
    if (finished.mode === "pomodoro") {
      addSession({
        id: "S" + Date.now(), ts: new Date().toISOString(), durationMin: settings.pomodoroMin,
        label: finished.linkedLabel || "Freeform", groupLabel: finished.linkedGroup || "Freeform",
        lectureId: finished.linkedLectureId || null,
        stage: finished.linkedStage || null, planId: finished.linkedPlanId || null,
      });
      if (finished.linkedPlanId) setPlan((prev) => prev.map((p) => (p.id === finished.linkedPlanId ? { ...p, completedPoms: (p.completedPoms || 0) + 1 } : p)));
      notify("Pomodoro complete", finished.linkedLabel ? "Nice work on: " + finished.linkedLabel : "Time for a break.");
      pomosThisSet.current += 1;
    } else {
      notify("Break's over", "Back to it when you're ready.");
    }

    const nextMode = timer.mode === "pomodoro" ? (pomosThisSet.current % settings.longBreakEvery === 0 ? "long" : "short") : "pomodoro";
    const willAuto = nextMode === "pomodoro" ? settings.autoStartPomodoros : settings.autoStartBreaks;
    activeSessionRef.current = willAuto
      ? { mode: nextMode, linkedId: timer.linkedId, linkedLabel: timer.linkedLabel, linkedGroup: timer.linkedGroup, linkedStage: timer.linkedStage, linkedPlanId: timer.linkedPlanId, linkedLectureId: timer.linkedLectureId }
      : null;

    setTimer((t) => ({
      // NOTE: durFor() returns seconds; the previous version added it to Date.now()
      // (milliseconds) with no *1000, so an auto-continued round re-expired ~durFor()
      // milliseconds later instead of durFor() *seconds* later - i.e. instantly - which
      // is what produced the reported 0:00 pomodoro/break oscillation.
      ...t, mode: nextMode, running: willAuto, paused: false,
      endsAt: willAuto ? Date.now() + durFor(nextMode) * 1000 : null,
      remaining: durFor(nextMode),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, settings, durFor, plan]);

  const completeSession = useCallback((forEndsAt) => {
    // Single-fire guard keyed to the exact countdown round (its endsAt) that's
    // completing, not a boolean+timeout: a tick and a visibilitychange event that both
    // observe the same expiry can never both get past this, and a stale call left over
    // from a round that's since been reset/changed is dropped by the endsAt mismatch.
    if (forEndsAt == null || completingRef.current === forEndsAt || timer.endsAt !== forEndsAt) return;
    completingRef.current = forEndsAt;
    runCompletion();
  }, [timer, runCompletion]);

  useEffect(() => {
    const iv = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    if (timer.running && timer.endsAt && Date.now() >= timer.endsAt) completeSession(timer.endsAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible" && timer.running && timer.endsAt && Date.now() >= timer.endsAt) completeSession(timer.endsAt); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);

  const timerActions = {
    // Fresh start (never paused) always uses the CURRENT settings duration, not a
    // possibly-stale captured value, and freezes the link-context for this round so a
    // later dropdown change can't retroactively change what a running/paused round is
    // attributed to. Resuming from an explicit pause keeps the paused snapshot (both the
    // remaining time and the already-frozen context) so you don't lose progress mid-countdown.
    start: () => {
      playChime("start", timer.soundEnabled);
      if (!timer.paused) {
        activeSessionRef.current = {
          mode: timer.mode, linkedId: timer.linkedId, linkedLabel: timer.linkedLabel,
          linkedGroup: timer.linkedGroup, linkedStage: timer.linkedStage,
          linkedPlanId: timer.linkedPlanId, linkedLectureId: timer.linkedLectureId,
        };
      }
      setTimer((t) => ({ ...t, running: true, endsAt: Date.now() + (t.paused ? t.remaining : durFor(t.mode)) * 1000 }));
    },
    pause: () => {
      playChime("pause", timer.soundEnabled);
      setTimer((t) => ({ ...t, running: false, paused: true, remaining: t.endsAt ? Math.max(0, Math.round((t.endsAt - Date.now()) / 1000)) : t.remaining, endsAt: null }));
    },
    // Skips straight to completion using the exact same logic a natural 0:00 uses
    // (session logged, poms counted, mode advances) - it isn't a shortcut/discard.
    skip: () => {
      if (!timer.running && !timer.paused) return;
      completingRef.current = timer.endsAt;
      runCompletion();
    },
    reset: () => { playChime("reset", timer.soundEnabled); completingRef.current = null; activeSessionRef.current = null; setTimer((t) => ({ ...t, running: false, paused: false, endsAt: null, remaining: durFor(t.mode) })); },
    toggleSound: () => setTimer((t) => ({ ...t, soundEnabled: t.soundEnabled === false })),
    setMode: (m) => { activeSessionRef.current = null; setTimer((t) => ({ ...t, mode: m, running: false, paused: false, endsAt: null, remaining: durFor(m) })); },
    link: (val) => setTimer((t) => {
      if (t.running || t.paused) return t; // locked while a round is active; the picker is disabled too, this is defense in depth
      if (!val) return { ...t, linkedId: "", linkedLabel: "", linkedGroup: "", linkedStage: "", linkedPlanId: "", linkedLectureId: "" };
      if (val.startsWith("lec:")) { const l = LECTURES.find((x) => x.id === val.slice(4)); return { ...t, linkedId: val, linkedLabel: l ? l.name : "", linkedGroup: l ? l.section : "", linkedStage: "", linkedPlanId: "", linkedLectureId: l ? l.id : "" }; }
      if (val.startsWith("task:")) { const tk = tasks.find((x) => x.id === val.slice(5)); return { ...t, linkedId: val, linkedLabel: tk ? tk.name : "", linkedGroup: tk ? tk.project : "", linkedStage: "", linkedPlanId: "", linkedLectureId: "" }; }
      if (val.startsWith("plan:")) {
        const entry = plan.find((p) => p.id === val.slice(5));
        if (!entry) return t;
        const lec = LECTURES.find((l) => l.id === entry.lectureId);
        const stageLabel = entry.stage ? (STAGES.find((s) => s.key === entry.stage) || {}).label : "";
        const label = (lec ? lec.name : "Planner item") + (entry.part ? " — " + entry.part : "") + (stageLabel ? " (" + stageLabel + ")" : "");
        return { ...t, linkedId: val, linkedLabel: label, linkedGroup: lec ? lec.section : entry.discipline, linkedStage: entry.stage || "", linkedPlanId: entry.id, linkedLectureId: entry.lectureId || "" };
      }
      return t;
    }),
  };

  const [windows, setWindows] = useState([]);
  const [focusedId, setFocusedId] = useState(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [preBoot, setPreBoot] = useState(false); // initial black boot sequence, before the Administrator screen
  const [loggedIn, setLoggedIn] = useState(false);
  const [booted, setBooted] = useState(false);
  const zTop = useRef(10);
  useEffect(() => {
    playChime("boot");
    const t = setTimeout(() => setPreBoot(true), 4000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!loggedIn) return;
    const t = setTimeout(() => setBooted(true), 700);
    return () => clearTimeout(t);
  }, [loggedIn]);
  const ready = preBoot && loggedIn && booted && progressLoaded && sessionsLoaded && settingsLoaded && tasksLoaded && plannerLoaded && examLoaded;

  const openApp = (key) => {
    setStartMenuOpen(false);
    zTop.current += 1;
    const z = zTop.current;
    setWindows((ws) => {
      const existing = ws.find((w) => w.id === key);
      if (existing) return ws.map((w) => (w.id === key ? { ...w, minimized: false, z } : w));
      const base = APPS[key]; const offset = (ws.length % 6) * 22;
      return [...ws, { id: key, ...base, x: 30 + offset, y: 18 + offset, minimized: false, z }];
    });
    setFocusedId(key);
  };
  const closeApp = (id) => { setWindows((ws) => ws.filter((w) => w.id !== id)); setFocusedId((f) => (f === id ? null : f)); };
  const minimizeApp = (id) => { setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, minimized: true } : w))); setFocusedId((f) => (f === id ? null : f)); };
  const focusApp = (id) => {
    zTop.current += 1;
    const z = zTop.current;
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, z } : w)));
    setFocusedId(id);
  };
  const startPomForEntry = (entry) => { timerActions.link("plan:" + entry.id); timerActions.setMode("pomodoro"); openApp("timer"); };

  const renderAppBody = (id) => {
    if (id === "computer") return <OverviewApp progress={progress} openApp={openApp} allData={{ progress, sessions, tasks, plan, exams, settings }} setAllData={{ setProgress, setSessions, setTasks, setPlan, setExams, setSettings }} />;
    if (id === "surgery") return <TrackerApp discipline="Surgery" progress={progress} setProgress={setProgress} />;
    if (id === "medicine") return <TrackerApp discipline="Medicine" progress={progress} setProgress={setProgress} />;
    if (id === "planner") return <PlannerApp plan={plan} setPlan={setPlan} progress={progress} setProgress={setProgress} startPomForEntry={startPomForEntry} />;
    if (id === "timer") return <TimerApp timer={{ ...timer, secondsLeft }} timerActions={timerActions} settings={settings} setSettings={setSettings} tasks={tasks} addTask={addTask} plan={plan} />;
    if (id === "goals") return <GoalsApp sessions={sessions} settings={settings} setSettings={setSettings} />;
    if (id === "exams") return <ExamApp exams={exams} setExams={setExams} openApp={openApp} />;
    return null;
  };

  const th = THEMES[theme];
  const rootStyle = { "--t1": th.t1, "--t2": th.t2, "--t3": th.t3, "--tb1": th.tb1, "--tb2": th.tb2, "--tb3": th.tb3, "--wallpaper": "url(" + WALLPAPER_DATA_URI + ")" };

  return (
    <div className="xp-desktop" style={rootStyle}>
      <style>{CSS}</style>

      {!preBoot && <BootScreen text="Starting Windows…" />}

      {preBoot && !loggedIn && <LoginScreen onLogin={() => setLoggedIn(true)} />}

      {preBoot && loggedIn && !ready && <BootScreen text="Loading your progress…" />}

      {ready && (
        <>
          <div className="desktop-icons">
            {Object.keys(APPS).map((key) => (
              <div key={key} className="desktop-icon" onClick={() => openApp(key)}>
                <div className="desktop-icon-glyph">{APPS[key].icon}</div>
                <div className="desktop-icon-label">{APPS[key].title.replace(".exe", "")}</div>
              </div>
            ))}
          </div>
          {timer.running && (
            <div className="mini-timer-badge" onClick={() => openApp("timer")}>⏱ {fmtClock(secondsLeft)}</div>
          )}
          {windows.map((w) => (
            <XPWindow key={w.id} id={w.id} title={w.title} icon={w.icon} x={w.x} y={w.y} w={w.w} h={w.h} zIndex={w.z} minimized={w.minimized} focused={focusedId === w.id} onFocus={focusApp} onClose={closeApp} onMinimize={minimizeApp}>
              {renderAppBody(w.id)}
            </XPWindow>
          ))}
          {startMenuOpen && (
            <div className="start-menu" onMouseLeave={() => setStartMenuOpen(false)}>
              <div className="start-menu-header"><div className="start-menu-avatar">🎓</div><span>Sem 10 Student</span></div>
              <div className="start-menu-body">
                <div className="start-menu-col">
                  {Object.keys(APPS).map((key) => <div key={key} className="start-menu-item" onClick={() => openApp(key)}><span style={{ fontSize: 18, marginRight: 8 }}>{APPS[key].icon}</span>{APPS[key].title.replace(".exe", "")}<span className="start-menu-arrow">▸</span></div>)}
                </div>
                <div className="start-menu-col start-menu-col-right">
                  <div className="start-menu-item" onClick={() => { setTheme("Blue"); setStartMenuOpen(false); }}>🔵 Blue theme</div>
                  <div className="start-menu-item" onClick={() => { setTheme("Olive"); setStartMenuOpen(false); }}>🫒 Olive theme</div>
                  <div className="start-menu-item" onClick={() => { setTheme("Silver"); setStartMenuOpen(false); }}>⚪ Silver theme</div>
                </div>
              </div>
              <div className="start-menu-footer" onClick={() => setStartMenuOpen(false)}>Close Start Menu</div>
            </div>
          )}
          <div className="taskbar">
            <button className={cls("start-btn", startMenuOpen && "start-btn-active")} onClick={() => setStartMenuOpen((s) => !s)}><span className="start-btn-logo">⊞</span> start</button>
            <div className="taskbar-windows">
              {windows.map((w) => <button key={w.id} className={cls("taskbar-item", focusedId === w.id && !w.minimized && "taskbar-item-active")} onClick={() => { setWindows((ws) => ws.map((x) => (x.id === w.id ? { ...x, minimized: false } : x))); focusApp(w.id); }}><span style={{ marginRight: 5 }}>{w.icon}</span>{w.title.replace(".exe", "")}</button>)}
            </div>
            <ClockWidget />
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SemXPErrorBoundary>
      <Sem10XPApp />
    </SemXPErrorBoundary>
  );
}

/* ============================================================================
   CSS
   ============================================================================ */
const CSS = `
  * { box-sizing: border-box; }
  .xp-desktop {
    position: fixed; inset: 0; overflow: hidden;
    font-family: Tahoma, "Segoe UI", Verdana, Geneva, sans-serif;
    background-image: var(--wallpaper); background-size: cover; background-position: center;
    user-select: none;
  }
  .xp-boot { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#000; color:#fff; gap:15px; overflow:hidden; }
  .xp-boot-brand { display:flex; align-items:flex-end; gap:13px; margin-top:-20px; filter:drop-shadow(0 2px 5px rgba(255,255,255,0.08)); }
  .xp-boot-mark { width:92px; height:76px; display:grid; grid-template-columns:1fr 1fr; gap:4px; transform:skewY(-7deg) rotate(-4deg); }
  .xp-boot-mark i { display:block; border-radius:4px 12px 4px 12px; box-shadow:inset 2px 2px 4px rgba(255,255,255,.36), inset -3px -3px 5px rgba(0,0,0,.22); animation:xp-mark-glow 2s ease-in-out infinite; }
  .xp-boot-mark i:nth-child(1){ background:linear-gradient(135deg,#ff9d4a,#bc3c08); } .xp-boot-mark i:nth-child(2){ background:linear-gradient(135deg,#b5ed55,#51a509); animation-delay:.18s; }
  .xp-boot-mark i:nth-child(3){ background:linear-gradient(135deg,#6a83ff,#183eb9); animation-delay:.36s; } .xp-boot-mark i:nth-child(4){ background:linear-gradient(135deg,#ffe46d,#d69a00); animation-delay:.54s; }
  @keyframes xp-mark-glow { 0%,100%{ filter:brightness(.92); } 50%{ filter:brightness(1.12); } }
  .xp-boot-product { position:relative; padding-bottom:2px; min-width:238px; line-height:.9; letter-spacing:-1px; }
  .xp-boot-product-small { display:block; font-size:17px; font-weight:bold; letter-spacing:.1px; margin-bottom:4px; }
  .xp-boot-product-main { display:block; font-size:34px; font-weight:bold; letter-spacing:-1.7px; white-space:nowrap; }
  .xp-boot-product b { position:absolute; right:-2px; bottom:0; color:#ed6b18; font-size:31px; letter-spacing:-2px; font-weight:normal; transform:translateX(100%); }
  .xp-boot-subtitle { color:#aab8cf; font-size:11px; margin-top:-7px; letter-spacing:.4px; }
  .xp-boot-barwrap { width:204px; height:18px; padding:2px; border:2px solid #a6a6a6; border-radius:7px; overflow:hidden; background:#070707; box-shadow:inset 0 0 0 1px #333; margin-top:13px; }
  .xp-boot-bar { width:66px; height:100%; display:flex; gap:2px; animation:xp-slide 1.35s linear infinite; }
  .xp-boot-bar i { flex:1; border-radius:1px; background:linear-gradient(180deg,#728cff,#263ed6); box-shadow:0 0 4px #466cff; }
  @keyframes xp-slide { 0%{ transform:translateX(-70px); } 100%{ transform:translateX(205px); } }
  .xp-boot-text { color:#9ba8bb; font-size:11px; min-height:13px; }

  .desktop-icons { position: absolute; top: 14px; left: 10px; display: flex; flex-direction: column; flex-wrap: wrap; gap: 14px; max-height: calc(100vh - 34px - 28px); z-index: 1; }
  .desktop-icon { width: 84px; display:flex; flex-direction:column; align-items:center; padding:6px 2px; border-radius:3px; cursor:pointer; }
  .desktop-icon:hover, .desktop-icon:active { background: rgba(50,100,200,0.35); outline: 1px dotted rgba(255,255,255,0.7); }
  .desktop-icon-glyph { font-size: 30px; filter: drop-shadow(1px 2px 1px rgba(0,0,0,0.4)); }
  .desktop-icon-label { color:#fff; font-size:11px; text-align:center; text-shadow: 1px 1px 2px rgba(0,0,0,0.85); margin-top:2px; line-height:1.2; }

  .mini-timer-badge { position:absolute; top:14px; right:14px; background:rgba(10,20,40,0.75); color:#fff; padding:6px 12px; border-radius:14px; font-size:12px; font-weight:bold; z-index:5; cursor:pointer; border:1px solid rgba(255,255,255,0.3); }

  .xp-window { position: absolute; flex-direction:column; background: #ECE9D8; border: 1px solid var(--t3, #0A56D6); border-radius: 8px 8px 3px 3px; box-shadow: 3px 3px 10px rgba(0,0,0,0.45); overflow: hidden; min-width: 280px; min-height: 220px; }
  .resize-handle { position:absolute; z-index:6; }
  .rh-n { top:0; left:10px; right:10px; height:5px; cursor:ns-resize; }
  .rh-s { bottom:0; left:10px; right:10px; height:5px; cursor:ns-resize; }
  .rh-e { right:0; top:10px; bottom:10px; width:5px; cursor:ew-resize; }
  .rh-w { left:0; top:10px; bottom:10px; width:5px; cursor:ew-resize; }
  .rh-ne { top:0; right:0; width:14px; height:14px; cursor:nesw-resize; }
  .rh-nw { top:0; left:0; width:14px; height:14px; cursor:nwse-resize; }
  .rh-se { bottom:0; right:0; width:14px; height:14px; cursor:nwse-resize; }
  .rh-sw { bottom:0; left:0; width:14px; height:14px; cursor:nesw-resize; }
  .xp-titlebar { height: 28px; flex: 0 0 auto; display:flex; align-items:center; justify-content:space-between; padding: 2px 3px 2px 6px; cursor: default; }
  .xp-titlebar-active { background: linear-gradient(180deg, var(--t1,#3E97FF) 0%, var(--t2,#1657D6) 20%, var(--t3,#0A46C6) 55%, var(--t2,#1657D6) 88%, var(--t1,#3E97FF) 100%); }
  .xp-titlebar-inactive { background: linear-gradient(180deg, #9DB3D6 0%, #8098C4 50%, #96AAD2 100%); }
  .xp-titlebar-left { display:flex; align-items:center; gap:6px; overflow:hidden; }
  .xp-titlebar-icon { font-size: 14px; }
  .xp-titlebar-text { color:#fff; font-size:12.5px; font-weight:bold; text-shadow: 1px 1px 1px rgba(0,0,0,0.4); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .xp-titlebar-controls { display:flex; gap:2px; }
  .xp-capbtn { width: 21px; height: 20px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.5); display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .xp-capbtn-min, .xp-capbtn-max { background: linear-gradient(180deg, #6FB3FF 0%, #2E7CE8 50%, #1A5FCC 100%); }
  .xp-capbtn-min:hover, .xp-capbtn-max:hover { background: linear-gradient(180deg, #8FC6FF 0%, #4E93F5 50%, #2E70DD 100%); }
  .xp-capbtn-close { background: linear-gradient(180deg, #F3897C 0%, #E1503D 45%, #C31B0F 100%); }
  .xp-capbtn-close:hover { background: linear-gradient(180deg, #FFA398 0%, #F16D58 45%, #DB3018 100%); }
  .xp-window-body { flex: 1 1 auto; overflow: auto; padding: 10px; background:#ECE9D8; height: calc(100% - 28px); }
  .app-col { display:flex; flex-direction:column; height:100%; }

  .tracker-hero { background: linear-gradient(135deg, var(--t3,#0A46C6), var(--t2,#0B4FDB)); border-radius:4px; padding:10px 12px; margin-bottom:8px; }
  .tracker-hero-title { color:#fff; font-size:14px; font-weight:bold; }
  .tracker-hero-sub { color:#dbe6fb; font-size:10.5px; margin-top:2px; }

  .overview-hero { background: linear-gradient(135deg, var(--t3,#0A46C6), var(--t2,#0B4FDB)); border-radius:4px; padding:14px 12px; margin-bottom:10px; display:flex; flex-direction:column; align-items:center; }
  .overview-hero-title { color:#fff; font-size:15px; font-weight:bold; }
  .overview-hero-sub { color:#dbe6fb; font-size:10.5px; margin-top:2px; margin-bottom:10px; text-align:center; }
  .overview-ring-wrap { margin: 4px 0 8px; }
  .overview-ring { width:92px; height:92px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
  .overview-ring-inner { width:72px; height:72px; border-radius:50%; background:#0A46C6; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:18px; font-weight:bold; }
  .overview-ring-inner span { font-size:8px; font-weight:normal; text-transform:uppercase; letter-spacing:0.3px; margin-top:1px; }
  .overview-disc-card { display:flex; align-items:center; gap:10px; background:#fff; border:1px solid #ACA899; border-radius:3px; padding:10px; margin-top:8px; cursor:pointer; }
  .overview-disc-card:hover { background:#EAF3FF; border-color: var(--t1,#3E97FF); }
  .overview-disc-icon { font-size:26px; }
  .overview-disc-title { font-size:12px; font-weight:bold; margin-bottom:4px; }
  .overview-disc-pct { font-size:14px; font-weight:bold; color: var(--t3,#0A46C6); width:42px; text-align:right; }
  .overview-note { margin-top:12px; opacity:0.7; text-align:center; line-height:1.4; }

  .planner-nav { margin-bottom:4px; }
  .planner-grid-head { display:grid; grid-template-columns: 56px 1fr 1fr; gap:6px; padding: 2px 4px; font-size:10.5px; font-weight:bold; color:#0A46C6; }
  .planner-scroll { flex:1; overflow:auto; border:1px solid #ACA899; background:#fff; border-radius:2px; padding:4px; }
  .planner-row { display:grid; grid-template-columns: 56px 1fr 1fr; gap:6px; padding:6px 4px; border-bottom:1px solid #EFEDE2; }
  .planner-row-today { background:#FFF9E0; }
  .planner-day-label { display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .planner-day-name { font-size:10.5px; font-weight:bold; color:#0A46C6; }
  .planner-day-date { font-size:9.5px; color:#666; }
  .planner-cell { display:flex; flex-direction:column; gap:4px; min-width:0; }
  .planner-empty { text-align:center; padding:4px 0; opacity:0.5; }
  .planner-chip { display:flex; align-items:center; gap:5px; background:#F0F6FF; border:1px solid #C9DCF5; border-radius:3px; padding:3px 5px; font-size:10.5px; }
  .planner-chip-done { background:#EAF7DE; border-color:#B9DE9C; opacity:0.75; text-decoration: line-through; }
  .planner-chip-check { width:13px; height:13px; flex:0 0 auto; background:#fff; border:1px solid #7A7A63; border-radius:2px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .planner-chip-text { flex:1; min-width:0; overflow-wrap: break-word; }
  .planner-chip-text em { font-style:normal; color:#7a5300; }
  .planner-chip-stage { display:inline-block; margin-left:4px; background:#0A46C6; color:#fff; font-size:8.5px; padding:0 4px; border-radius:6px; }
  .planner-chip-poms { margin-left:4px; font-size:9px; }
  .planner-chip-tracker-done { margin-left:4px; font-size:8.5px; color:#3a7a1a; font-weight:bold; }
  .planner-chip-btn { cursor:pointer; opacity:0.6; font-size:11px; }
  .planner-chip-btn:hover { opacity:1; }
  .planner-chip-remove { cursor:pointer; color:#b0342b; font-weight:bold; padding: 0 2px; }
  .planner-add-form { background:#FBFAF3; border:1px dashed #ACA899; border-radius:3px; padding:5px; }

  .exam-hero { background: linear-gradient(135deg, var(--t3,#0A46C6), var(--t2,#0B4FDB)); border-radius:4px; padding:12px; margin-bottom:8px; }
  .exam-hero-title { color:#fff; font-size:14px; font-weight:bold; }
  .exam-hero-sub { color:#dbe6fb; font-size:10.5px; margin-top:2px; margin-bottom:10px; }
  .exam-next-card { background: rgba(255,255,255,0.14); border:1px solid rgba(255,255,255,0.35); border-radius:4px; padding:10px 12px; display:flex; align-items:center; justify-content:space-between; }
  .exam-next-kicker { color:#ffd76a; font-size:9.5px; font-weight:bold; letter-spacing:0.5px; }
  .exam-next-name { color:#fff; font-size:13px; font-weight:bold; margin-top:2px; }
  .exam-next-date { color:#dbe6fb; font-size:10.5px; margin-top:2px; }
  .exam-next-countdown { text-align:center; color:#fff; }
  .exam-next-countdown strong { font-size:26px; display:block; line-height:1; }
  .exam-next-countdown span { font-size:9px; text-transform:uppercase; opacity:0.8; }
  .exam-next-countdown small { display:block; font-size:11px; margin-top:2px; font-family: "Courier New", monospace; }
  .exam-notice { font-size:10.5px; background:#FFF3CE; border:1px solid #E0C060; border-radius:3px; padding:6px 9px; margin-bottom:8px; }
  .exam-list { border:1px solid #ACA899; background:#fff; border-radius:2px; overflow:auto; flex:1; }
  .exam-list-head { display:grid; grid-template-columns: 110px 100px 110px 110px 90px 20px; gap:4px; padding:5px 8px; background:#F0EEE2; font-size:9.5px; font-weight:bold; color:#555; position:sticky; top:0; }
  .exam-row { display:grid; grid-template-columns: 110px 100px 110px 110px 90px 20px; gap:4px; align-items:center; padding:6px 8px; border-bottom:1px solid #EFEDE2; font-size:11px; }
  .exam-row-next { background:#FFF6D9; }
  .exam-row-past { opacity:0.5; }
  .exam-type-pill { font-size:8.5px; font-weight:bold; padding:1px 5px; border-radius:8px; }
  .exam-type-cont { background:#DCEBFC; color:#0A46C6; } .exam-type-final { background:#FCE0DC; color:#B0342B; } .exam-type-osce { background:#E6DCFC; color:#5A3A9E; }
  .exam-type-text { font-size:9px; color:#666; margin-top:1px; }
  .exam-countdown-cell strong { display:block; font-size:12px; } .exam-countdown-cell small { font-family:"Courier New",monospace; font-size:9.5px; color:#666; }
  .exam-passed { font-size:10px; color:#888; font-style:italic; }
  .exam-row-remove { border:none; background:none; color:#b0342b; font-weight:bold; cursor:pointer; font-size:13px; }

  .stat-row { display:grid; grid-template-columns: repeat(5, 1fr); gap:6px; margin-bottom:8px; }
  .stat-card { background:#fff; border:1px solid #ACA899; border-left-width:4px; border-radius:2px; padding:5px 7px; }
  .stat-card-n { font-size:16px; font-weight:bold; line-height:1.1; }
  .stat-card-label { font-size:9px; color:#555; text-transform:uppercase; letter-spacing:0.3px; }

  .xp-groupbox { border: 1px solid #ACA899; border-radius: 3px; padding: 10px 10px 8px; margin: 0; background:#F5F4EA; }
  .xp-groupbox legend { padding: 0 4px; font-size: 11.5px; font-weight: bold; color:var(--t3,#0A3FA0); }
  .xp-btn { font-family: Tahoma, sans-serif; font-size: 11.5px; color:#000; background: linear-gradient(180deg, #FFFFFF 0%, #ECE9D8 100%); border: 1px solid #8E8E71; border-radius: 3px; padding: 4px 12px; cursor: pointer; }
  .xp-btn:hover { border-color: var(--t1,#3E97FF); background: linear-gradient(180deg, #FFFFFF 0%, #DCEBFC 100%); }
  .xp-btn:active { background: linear-gradient(180deg, #DCEBFC 0%, #B7D9F7 100%); box-shadow: inset 1px 1px 2px rgba(0,0,0,0.25); }
  .xp-btn-sm { padding: 3px 9px; font-size: 11px; }
  .xp-btn-active { border-color: var(--t3,#0A56D6); background: linear-gradient(180deg, #CFE4FC 0%, #A9CCF2 100%); box-shadow: inset 1px 1px 2px rgba(0,0,0,0.2); }
  .xp-btn:disabled { opacity: 0.5; cursor: default; }
  .xp-checkbox-row { display:flex; align-items:center; gap:6px; cursor:pointer; }
  .xp-checkbox { width: 15px; height: 15px; flex: 0 0 auto; background: #fff; border: 1px solid #7A7A63; border-radius: 2px; display:flex; align-items:center; justify-content:center; box-shadow: inset 1px 1px 2px rgba(0,0,0,0.25); cursor:pointer; }
  .xp-checkbox-checked { background: #E4F1CE; }
  .xp-checkbox-label { font-size: 11.5px; }
  .xp-progress { width:100%; background:#fff; border:1px solid #7A7A7A; border-radius:2px; padding:2px; box-shadow: inset 1px 1px 2px rgba(0,0,0,0.2); }
  .xp-progress-segs { display:flex; gap:1.5px; height:100%; }
  .xp-progress-seg { flex:1; background:#E4E4E4; border-radius:1px; }
  .xp-progress-seg-on { background: linear-gradient(180deg, #A8E063 0%, #4E9A1F 100%); }
  .xp-small-text { font-size: 11.5px; color:#111; }
  .row-between { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .row-gap { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
  .toolbar { display:flex; align-items:center; justify-content:space-between; gap:8px; margin: 6px 0; flex-wrap:wrap; }
  .xp-search { display:flex; align-items:center; gap:5px; background:#fff; border:1px solid #7A7A7A; border-radius:3px; padding:3px 6px; box-shadow: inset 1px 1px 2px rgba(0,0,0,0.15); flex:1; min-width:140px; }
  .xp-search-input { border:none; outline:none; font-size:11.5px; width:100%; font-family: Tahoma, sans-serif; }
  .xp-text-input { font-family: Tahoma, sans-serif; font-size:11.5px; padding:4px 6px; border:1px solid #7A7A7A; border-radius:2px; }
  .tracker-scroll { flex:1; overflow:auto; border:1px solid #ACA899; background:#fff; border-radius:2px; }
  .section-block { border-bottom: 1px solid #D8D5C4; }
  .section-header { display:flex; align-items:center; gap:8px; padding:6px 8px; cursor:pointer; }
  .section-header:hover { filter: brightness(0.96); }
  .section-caret { width: 10px; font-size: 10px; color:#0A3FA0; }
  .section-title { font-size:12px; font-weight:bold; color:#111; }
  .section-title-wrap { display:flex; flex-direction:column; flex:1; min-width:0; }
  .section-desc { font-size:9.5px; color:#555; font-weight:normal; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .type-pill { font-size:8.5px; font-weight:bold; padding:1px 5px; border-radius:8px; white-space:nowrap; background:#DCEBFC; color:#0A46C6; text-transform:uppercase; }
  .section-count { color:#555; white-space:nowrap; }
  .section-mini-progress { width:90px; }
  .lecture-table { width:100%; border-collapse:collapse; }
  .lecture-table th { font-size:10px; color:#444; padding:4px 3px; background:#F0EEE2; border-bottom:1px solid #D8D5C4; position:sticky; top:0; }
  .lecture-table td { padding: 3px 6px; border-bottom:1px solid #EFEDE2; font-size:11.5px; }
  .num-col { width:28px; text-align:center; color:#888; }
  .lecture-name-cell { white-space: normal; }
  .checkbox-cell, .center-cell { text-align:center; width:38px; }
  .row-mid { background: #FFF6D9; } .row-finals { background: #FFFFFF; }
  .row-mid:hover, .row-finals:hover { background: #EAF3FF; }
  .row-stale { outline: 1px dashed #C97A2B; outline-offset: -1px; }
  .stale-badge { color:#B0601A; display:inline-flex; vertical-align:middle; margin-left:4px; }
  .exam-pill { font-size:8.5px; font-weight:bold; padding:1px 5px; border-radius:8px; white-space:nowrap; }
  .exam-pill-mid { background:#F0C94A; color:#5A4400; } .exam-pill-finals { background:#D8D8D8; color:#444; }
  .xp-select { width:100%; font-family:Tahoma,sans-serif; font-size:11.5px; padding:4px; border:1px solid #7A7A7A; border-radius:2px; background:#fff; }
  .xp-number { width: 100%; margin-top:2px; font-family:Tahoma,sans-serif; font-size:11.5px; padding:3px 5px; border:1px solid #7A7A7A; border-radius:2px; }
  .settings-grid { display:grid; grid-template-columns: 1fr 1fr; gap:8px 12px; }
  .timer-app { align-items:center; }
  .timer-face { border: 3px solid; border-radius: 8px; background:#fff; padding: 18px 22px; width: 100%; text-align:center; box-shadow: inset 1px 1px 3px rgba(0,0,0,0.15); }
  .timer-clock { font-size: 44px; font-weight:bold; letter-spacing:2px; color:#222; font-family: "Courier New", monospace; margin-bottom:10px; }
  .timer-linked-label { margin-top:8px; opacity:0.75; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .notif-hint { margin-top:8px; font-size:10.5px; background:#FFF3CE; border:1px solid #E0C060; border-radius:3px; padding:5px 8px; cursor:pointer; text-align:center; }
  .week-chart { display:flex; align-items:flex-end; gap:6px; height:80px; padding-top:6px; }
  .week-bar-col { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; }
  .week-bar { width:100%; background: linear-gradient(180deg,#5FA8FF,#0A56D6); border-radius:2px 2px 0 0; }
  .week-bar-label { margin-top:3px; font-size:9px; color:#555; }
  .start-menu { position:absolute; bottom:38px; left:2px; width: 300px; background:#ECE9D8; border:2px solid var(--t3,#0A56D6); border-radius: 0 10px 10px 0; box-shadow: 3px 3px 10px rgba(0,0,0,0.5); overflow:hidden; z-index: 999; }
  .start-menu-header { background: linear-gradient(90deg, var(--t3,#1A56D6), var(--t1,#3E85F5)); color:#fff; font-weight:bold; font-size:13.5px; padding:10px 12px; display:flex; align-items:center; gap:10px; }
  .start-menu-avatar { width:34px; height:34px; border-radius:5px; background:rgba(255,255,255,0.25); border:1px solid rgba(255,255,255,0.6); display:flex; align-items:center; justify-content:center; font-size:18px; }
  .start-menu-body { display:flex; min-height:180px; }
  .start-menu-col { flex:1; padding:6px 0; }
  .start-menu-col-right { background:#DCE9FA; }
  .start-menu-item { display:flex; align-items:center; padding:7px 12px; font-size:11.5px; cursor:pointer; }
  .start-menu-item:hover { background: linear-gradient(90deg, var(--t2,#2E70DD), var(--t1,#5A9BFF)); color:#fff; }
  .start-menu-arrow { margin-left:auto; color:#4E9A1F; font-size:10px; }
  .start-menu-footer { border-top:1px solid #C8C4AE; padding:7px 12px; font-size:11px; text-align:center; cursor:pointer; background:#F5F4EA; }
  .start-menu-footer:hover { background:#e8e4cf; }
  .taskbar { position:absolute; left:0; right:0; bottom:0; height:34px; z-index:1000; background: linear-gradient(180deg, var(--tb1,#2E6FE0) 0%, var(--tb2,#1A4FC4) 15%, var(--tb3,#0F3DAA) 88%, var(--tb2,#1A4FC4) 100%); border-top: 1px solid #6FA8FF; display:flex; align-items:center; padding: 0 4px; gap:6px; }
  .start-btn { height: 27px; padding: 0 14px 0 8px; border-radius: 6px; border: 1px solid #1E5A16; background: linear-gradient(180deg, #7FDB4F 0%, #4FA828 45%, #2E7A0C 100%); color:#fff; font-weight:bold; font-style:italic; font-size:13.5px; display:flex; align-items:center; gap:5px; cursor:pointer; text-shadow: 1px 1px 1px rgba(0,0,0,0.4); }
  .start-btn-logo { font-size:15px; font-style:normal; }
  .start-btn:hover { background: linear-gradient(180deg, #96EB66 0%, #63BB3B 45%, #3E8E16 100%); }
  .start-btn-active { box-shadow: inset 1px 1px 4px rgba(0,0,0,0.4); }
  .taskbar-windows { flex:1; display:flex; gap:4px; overflow:hidden; }
  .taskbar-item { height: 25px; max-width:170px; padding: 0 10px; border-radius:3px; border:1px solid rgba(255,255,255,0.25); background: linear-gradient(180deg,#3A78E5,#1F52B8); color:#fff; font-size:11.5px; cursor:pointer; display:flex; align-items:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .taskbar-item-active { background: linear-gradient(180deg,#173E90,#0B2D75); box-shadow: inset 1px 1px 3px rgba(0,0,0,0.5); }
  .xp-clock { color:#fff; font-size:11.5px; padding: 0 12px; border-left: 1px solid rgba(255,255,255,0.3); height:100%; display:flex; align-items:center; }
  @media print { .desktop-icons, .taskbar, .start-menu, .xp-titlebar, .mini-timer-badge { display:none !important; } .xp-window { position:static !important; box-shadow:none !important; border:none !important; width:100% !important; height:auto !important; display:block !important; } .xp-desktop { position:static !important; background:#fff !important; } .tracker-scroll { overflow:visible !important; } }
  @media (max-width: 720px) {
    .xp-window { min-width: 100vw !important; width: 100vw !important; left: 0 !important; top: 0 !important; height: calc(100vh - 42px) !important; border-radius: 0 !important; }
    .resize-handle { display: none !important; }
    .settings-grid { grid-template-columns: 1fr; }
    .stat-row { grid-template-columns: repeat(3, 1fr); }
    .xp-checkbox { width: 20px; height: 20px; }
    .checkbox-cell, .center-cell { width: 34px; }
    .lecture-table td { padding: 6px 5px; }
    .xp-capbtn { width: 26px; height: 25px; }
    .taskbar { height: 42px; }
    .desktop-icons { max-height: calc(100vh - 42px - 28px); }
    .start-btn, .taskbar-item { height: 33px; font-size: 12.5px; }
    .desktop-icon { width: 74px; }
    .xp-btn { padding: 7px 12px; }
    .xp-btn-sm { padding: 6px 10px; }
  }
  .xp-desktop, .xp-desktop * { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
  .tracker-scroll, .xp-window-body { -webkit-overflow-scrolling: touch; }

  .login-screen { position:absolute; inset:0; z-index:2000; display:flex; flex-direction:column; background: radial-gradient(circle at 18% 22%, #6fa3ff 0%, #3f7ee8 32%, #2e63d6 60%, #1f4bc4 100%); font-family: Tahoma, Verdana, sans-serif; }
  .login-topbar { height: 34px; background: linear-gradient(180deg,#1a3fb0,#122f8a); flex:0 0 auto; }
  .login-bottombar { flex:0 0 auto; background: linear-gradient(180deg,#173aa8,#0f2c86); border-top: 1px solid #4a72d8; padding: 12px 22px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
  .login-poweroff { color:#fff; font-size:13px; display:flex; align-items:center; gap:8px; cursor:pointer; background: rgba(255,255,255,0.08); padding:6px 12px; border-radius:4px; }
  .login-poweroff:hover { background: rgba(255,255,255,0.18); }
  .login-poweroff-icon { background:#e8542a; border-radius:3px; width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; font-size:12px; }
  .login-bottomtext { color:#cfe0ff; font-size:10.5px; text-align:right; max-width:260px; }
  .login-body { flex:1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; padding: 20px; }
  .login-glow { position:absolute; top:-10%; left:-10%; width:60%; height:70%; background: radial-gradient(circle, rgba(255,255,255,0.35), transparent 70%); }
  .login-left { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; z-index:1; padding: 0 20px; }
  .login-logo { display:flex; gap:4px; }
  .login-logo-sq { width:26px; height:26px; border-radius:4px; transform: skewY(-6deg); }
  .login-brand { color:#fff; font-size:22px; font-weight:bold; margin-top:6px; text-shadow: 1px 2px 3px rgba(0,0,0,0.3); }
  .login-brand span { display:block; font-size:12px; font-weight:normal; opacity:0.85; }
  .login-hint { color:#eaf1ff; font-size:12.5px; margin-top:10px; }
  .login-divider { width:1px; align-self:stretch; margin: 30px 0; background: rgba(255,255,255,0.35); }
  .login-right { flex:1; display:flex; align-items:center; justify-content:center; z-index:1; }
  .login-tile { display:flex; align-items:center; gap:14px; background: linear-gradient(90deg, rgba(20,50,140,0.55), rgba(40,80,180,0.35)); border: 1px solid rgba(255,255,255,0.4); border-radius:8px; padding:14px 22px; cursor:pointer; transition: background 0.15s; }
  .login-tile:hover { background: linear-gradient(90deg, rgba(255,255,255,0.28), rgba(255,255,255,0.12)); }
  .login-tile-avatar { width:44px; height:44px; border-radius:6px; background:#fff; display:flex; align-items:center; justify-content:center; font-size:24px; border: 2px solid rgba(255,255,255,0.8); }
  .login-tile-name { color:#fff; font-size:15px; font-weight:bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
  @media (max-width: 720px) {
    .login-body { flex-direction:column; padding: 30px 16px; }
    .login-divider { display:none; }
    .login-left { padding-bottom: 10px; }
    .login-bottombar { flex-direction:column; align-items:flex-start; gap:8px; }
    .login-bottomtext { text-align:left; max-width:none; }
  }
`;
