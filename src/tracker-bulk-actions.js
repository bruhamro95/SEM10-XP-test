/* SEM 10-XP — Tracker bulk check actions
   Operates on the existing tracker checkboxes without changing the tracker data structure or layout.
*/
(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__sem10TrackerBulkInstalled) return;
  window.__sem10TrackerBulkInstalled = true;

  const SURGERY = new Set(["Plastic", "Vascular", "Anesthesia", "Emergency (General)", "Misc.", "Oncology", "Orthopedic"]);
  const MEDICINE = new Set(["Critical Care", "Rheumatology", "Rehabilitation", "Hematology", "Oncology (Heme)", "GIT & Hepatology", "Chest (Emergency)", "Neurology (Emergency)", "Nephrology (Emergency)", "Cardiology (Emergency)", "Endocrine (Emergency)", "Nuclear Medicine", "Toxicology"]);
  const STAGES = [["paper", "ورق"], ["explain", "شرح"], ["study", "مذاكرة"], ["solve", "حل"], ["review", "مراجعة"]];

  const css = `
    .sem10-bulk-panel { position:fixed; z-index:100001; width:min(380px,calc(100vw - 20px)); max-height:min(80vh,650px); overflow:auto; box-sizing:border-box; padding:10px; background:#ece9d8; border:2px solid #0a246a; box-shadow:3px 3px 0 rgba(0,0,0,.28); font:12px Tahoma,Arial,sans-serif; color:#111; }
    .sem10-bulk-title { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; font-weight:700; }
    .sem10-bulk-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
    .sem10-bulk-field.full { grid-column:1/-1; }
    .sem10-bulk-field label { display:block; margin-bottom:3px; font-weight:700; }
    .sem10-bulk-field select { width:100%; box-sizing:border-box; min-height:27px; padding:3px 5px; border:1px solid #7f9db9; background:#fff; color:#111; font:12px Tahoma,Arial,sans-serif; }
    .sem10-bulk-summary { margin-top:9px; padding:6px; background:#fff; border:1px solid #aaa; font-weight:700; line-height:1.4; }
    .sem10-bulk-actions { display:flex; gap:6px; justify-content:flex-end; margin-top:8px; }
    .sem10-bulk-actions button { min-height:26px; padding:3px 10px; border:1px solid #777; border-radius:2px; background:linear-gradient(#fff,#d8d8d8); font:12px Tahoma,Arial,sans-serif; cursor:pointer; }
    @media (max-width:560px) { .sem10-bulk-panel { left:8px !important; right:8px; width:auto; } .sem10-bulk-grid { grid-template-columns:1fr; } .sem10-bulk-field.full { grid-column:auto; } }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  let panel = null;
  let button = null;

  function rows() {
    return Array.from(document.querySelectorAll("table.lecture-table tbody tr")).filter(r => r.querySelector("td.lecture-name-cell"));
  }

  function info(row) {
    const cells = Array.from(row.cells || []);
    const name = row.querySelector(".lecture-name-cell")?.textContent?.replace(/\s+/g," ").trim() || "";
    const section = cells[2]?.textContent?.trim() || "";
    const exam = row.classList.contains("row-mid") ? "mid" : row.classList.contains("row-finals") ? "final" : "";
    const checks = Array.from(row.querySelectorAll("td.checkbox-cell .xp-checkbox"));
    const done = checks.map(el => el.classList.contains("xp-checkbox-checked"));
    const flagCell = cells[cells.length - 1];
    const svg = flagCell?.querySelector("svg");
    const flagged = !!svg && svg.getAttribute("fill") !== "none";
    return { name, section, exam, done, flagged };
  }

  function disciplineFor(row) {
    const section = info(row).section;
    if (SURGERY.has(section)) return "surgery";
    if (MEDICINE.has(section)) return "medicine";
    return "unknown";
  }

  function option(sel, value, label) { const o = document.createElement("option"); o.value = value; o.textContent = label; sel.appendChild(o); }

  function makeField(labelText, sel, full=false) {
    const wrap = document.createElement("div"); wrap.className = "sem10-bulk-field" + (full ? " full" : "");
    const label = document.createElement("label"); label.textContent = labelText; wrap.append(label, sel); return wrap;
  }

  function build() {
    panel = document.createElement("div"); panel.className = "sem10-bulk-panel"; panel.hidden = true;
    const title = document.createElement("div"); title.className = "sem10-bulk-title"; title.innerHTML = "<span>☑ Bulk check</span><span style=\"font-weight:400;color:#555\">Tracker only</span>"; panel.appendChild(title);
    const grid = document.createElement("div"); grid.className = "sem10-bulk-grid";

    const discipline = document.createElement("select"); option(discipline,"both","Medicine + Surgery"); option(discipline,"medicine","Medicine only"); option(discipline,"surgery","Surgery only");
    const selection = document.createElement("select"); option(selection,"all","All lectures"); option(selection,"mid","Midterm"); option(selection,"final","Final"); option(selection,"chapter","Chapter");
    const chapter = document.createElement("select");
    const stage = document.createElement("select"); STAGES.forEach(([k,l]) => option(stage,k,l));
    const action = document.createElement("select"); option(action,"check","Check / mark done"); option(action,"uncheck","Uncheck / mark not done");
    const flag = document.createElement("select"); option(flag,"all","All flags"); option(flag,"flagged","Flagged only"); option(flag,"unflagged","Not flagged");

    grid.append(makeField("Discipline",discipline),makeField("Select by",selection),makeField("Chapter",chapter),makeField("Stage",stage),makeField("Action",action),makeField("Flag",flag));
    panel.appendChild(grid);
    const summary = document.createElement("div"); summary.className = "sem10-bulk-summary"; panel.appendChild(summary);
    const actions = document.createElement("div"); actions.className = "sem10-bulk-actions";
    const apply = document.createElement("button"); apply.textContent = "Apply";
    const close = document.createElement("button"); close.textContent = "Close";
    actions.append(apply,close); panel.appendChild(actions); document.body.appendChild(panel);

    function refreshChapters() {
      const current = chapter.value;
      const names = [...new Set(rows().map(r => info(r).section).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      chapter.innerHTML = ""; option(chapter,"all","All chapters"); names.forEach(n=>option(chapter,n,n)); chapter.value = names.includes(current) ? current : "all";
      chapter.disabled = selection.value !== "chapter";
    }

    function matches(row) {
      const x = info(row);
      const d = disciplineFor(row);
      if (discipline.value !== "both" && d !== discipline.value) return false;
      if (selection.value === "mid" && x.exam !== "mid") return false;
      if (selection.value === "final" && x.exam !== "final") return false;
      if (selection.value === "chapter" && chapter.value !== "all" && x.section !== chapter.value) return false;
      if (flag.value === "flagged" && !x.flagged) return false;
      if (flag.value === "unflagged" && x.flagged) return false;
      return true;
    }

    function refreshSummary() {
      refreshChapters();
      const matching = rows().filter(matches);
      const stageIndex = STAGES.findIndex(([k]) => k === stage.value);
      const actionable = matching.filter(r => { const x=info(r); return stageIndex < 0 || !!x.done[stageIndex] !== (action.value === "check"); });
      summary.textContent = `${actionable.length} lecture${actionable.length === 1 ? "" : "s"} will be ${action.value === "check" ? "checked" : "unchecked"} for ${STAGES[stageIndex]?.[1] || "the selected stage"}.`;
    }

    [discipline,selection,chapter,stage,action,flag].forEach(s=>s.addEventListener("change",refreshSummary));
    apply.addEventListener("click",()=>{
      const stageIndex = STAGES.findIndex(([k])=>k===stage.value);
      const want = action.value === "check";
      let changed=0;
      rows().forEach(row=>{
        if(!matches(row)) return;
        const checks=Array.from(row.querySelectorAll("td.checkbox-cell .xp-checkbox"));
        const el=checks[stageIndex];
        if(!el) return;
        const isDone=el.classList.contains("xp-checkbox-checked");
        if(isDone!==want){ el.click(); changed+=1; }
      });
      summary.textContent = `${changed} lecture${changed===1?"":"s"} ${want?"checked":"unchecked"}.`;
    });
    close.addEventListener("click",()=>{panel.hidden=true;});
    panel.addEventListener("click",e=>e.stopPropagation());
    refreshSummary();
  }

  function install() {
    if (button || !document.body) return;
    const toolbar = document.querySelector(".toolbar");
    if (!toolbar) return;
    button = document.createElement("button"); button.type="button"; button.className="xp-btn xp-btn-sm"; button.textContent="☑ Bulk check"; button.title="Check or uncheck multiple tracker lectures at once";
    toolbar.appendChild(button); build();
    button.addEventListener("click",e=>{ e.stopPropagation(); panel.hidden=!panel.hidden; if(!panel.hidden){ const r=button.getBoundingClientRect(); panel.style.left=Math.max(8,Math.min(r.left,window.innerWidth-panel.offsetWidth-8))+"px"; panel.style.top=Math.min(window.innerHeight-panel.offsetHeight-8,r.bottom+4)+"px"; } });
  }

  document.addEventListener("click",()=>{ if(panel) panel.hidden=true; },true);
  const observer=new MutationObserver(()=>install()); observer.observe(document.body,{childList:true,subtree:true});
  install();
})();
