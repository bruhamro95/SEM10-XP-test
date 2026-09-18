/* SEM 10-XP — Tracker bulk check/uncheck enhancement. */
(function installTrackerBulkActions() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__sem10TrackerBulkInstalled) return;
  window.__sem10TrackerBulkInstalled = true;

  const STAGES = [["paper","ورق"],["explain","شرح"],["study","مذاكرة"],["solve","حل"],["review","مراجعة"]];
  const rows = () => Array.from(document.querySelectorAll("table.lecture-table tbody tr")).filter(r => r.querySelector("td.lecture-name-cell"));
  const info = row => {
    const cells = Array.from(row.cells || []);
    const name = row.querySelector("td.lecture-name-cell")?.textContent?.replace(/\s+/g," ").trim() || "";
    const chapter = cells[2]?.textContent?.trim() || "";
    const exam = row.classList.contains("row-mid") ? "mid" : row.classList.contains("row-finals") ? "final" : "";
    const checks = Array.from(row.querySelectorAll("td.checkbox-cell .xp-checkbox"));
    const done = checks.map(x => x.classList.contains("xp-checkbox-checked"));
    const flagCell = cells[cells.length - 1];
    const svg = flagCell?.querySelector("svg");
    const flagged = !!svg && svg.getAttribute("fill") !== "none";
    return { name, chapter, exam, done, flagged };
  };
  const add = (s,v,t) => { const o=document.createElement("option"); o.value=v; o.textContent=t; s.appendChild(o); };

  const style=document.createElement("style");
  style.textContent=`
    .sem10-bulk-panel{position:fixed;z-index:100001;width:min(350px,calc(100vw - 20px));max-height:min(78vh,620px);overflow:auto;box-sizing:border-box;padding:10px;background:#ece9d8;border:2px solid #0a246a;box-shadow:3px 3px 0 rgba(0,0,0,.28);font:12px Tahoma,Arial,sans-serif;color:#111}
    .sem10-bulk-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.sem10-bulk-field{min-width:0}.sem10-bulk-field.full{grid-column:1/-1}.sem10-bulk-field label{display:block;margin-bottom:3px;font-weight:700}.sem10-bulk-field select{width:100%;box-sizing:border-box;min-height:26px;padding:3px 5px;border:1px solid #7f9db9;background:#fff;font:12px Tahoma,Arial,sans-serif}.sem10-bulk-summary{margin:9px 0 7px;padding:6px;background:#fff;border:1px solid #aaa;font-weight:700}.sem10-bulk-actions{display:flex;gap:6px;justify-content:flex-end;margin-top:8px}.sem10-bulk-actions button{min-height:25px;padding:3px 9px;border:1px solid #777;background:linear-gradient(#fff,#d8d8d8);font:12px Tahoma,Arial,sans-serif;cursor:pointer}
    @media(max-width:560px){.sem10-bulk-panel{width:calc(100vw - 16px);left:8px!important}.sem10-bulk-grid{grid-template-columns:1fr}.sem10-bulk-field.full{grid-column:auto}}
  `;
  document.head.appendChild(style);
  let panel=null;

  function setup(toolbar){
    if(!toolbar || toolbar.dataset.sem10BulkReady==="1") return;
    const scope=toolbar.closest(".xp-window") || toolbar.parentElement;
    if(!scope?.querySelector("table.lecture-table")) return;
    toolbar.dataset.sem10BulkReady="1";
    const button=document.createElement("button"); button.type="button"; button.className="xp-btn xp-btn-sm"; button.textContent="☑ Bulk check"; toolbar.appendChild(button);
    panel=document.createElement("div"); panel.className="sem10-bulk-panel"; panel.hidden=true;
    const title=document.createElement("div"); title.textContent="☑ Bulk check / uncheck"; title.style.fontWeight="700"; title.style.marginBottom="8px"; panel.appendChild(title);
    const grid=document.createElement("div"); grid.className="sem10-bulk-grid";
    const exam=document.createElement("select"), chapter=document.createElement("select"), stage=document.createElement("select"), condition=document.createElement("select"), action=document.createElement("select");
    add(exam,"all","All exams"); add(exam,"mid","Midterm"); add(exam,"final","Final");
    add(chapter,"all","All chapters");
    add(stage,"paper","ورق"); add(stage,"explain","شرح"); add(stage,"study","مذاكرة"); add(stage,"solve","حل"); add(stage,"review","مراجعة");
    add(condition,"all","All matching"); add(condition,"todo","Only unchecked"); add(condition,"done","Only checked"); add(condition,"flagged","Flagged only"); add(condition,"unflagged","Not flagged");
    add(action,"check","Check"); add(action,"uncheck","Uncheck");
    const discipline=document.createElement("select"); add(discipline,"both","Medicine + Surgery"); add(discipline,"medicine","Medicine"); add(discipline,"surgery","Surgery");
    const field=(label,s,full=false)=>{const d=document.createElement("div");d.className="sem10-bulk-field"+(full?" full":"");const l=document.createElement("label");l.textContent=label;d.append(l,s);return d;};
    grid.append(field("Discipline",discipline),field("Exam",exam),field("Chapter",chapter),field("Stage",stage),field("Condition",condition),field("Action",action)); panel.appendChild(grid);
    const summary=document.createElement("div");summary.className="sem10-bulk-summary";panel.appendChild(summary);
    const actions=document.createElement("div");actions.className="sem10-bulk-actions";const apply=document.createElement("button");apply.textContent="Apply";const close=document.createElement("button");close.textContent="Close";actions.append(apply,close);panel.appendChild(actions);document.body.appendChild(panel);

    function refresh(){
      const current=chapter.value; const names=[...new Set(rows().map(r=>info(r).chapter).filter(Boolean))].sort((a,b)=>a.localeCompare(b)); chapter.innerHTML="";add(chapter,"all","All chapters");names.forEach(n=>add(chapter,n,n));chapter.value=names.includes(current)?current:"all";
      const selectedStage=stage.value, idx=STAGES.findIndex(x=>x[0]===selectedStage);
      const matched=rows().filter(r=>{const x=info(r); if(discipline.value!=="both" && !x.chapter.toLowerCase().includes(discipline.value)) return false; if(exam.value!=="all"&&x.exam!==exam.value)return false; if(chapter.value!=="all"&&x.chapter!==chapter.value)return false; if(condition.value==="flagged"&&!x.flagged)return false; if(condition.value==="unflagged"&&x.flagged)return false; if(condition.value==="todo"&&idx>=0&&x.done[idx])return false; if(condition.value==="done"&&idx>=0&&!x.done[idx])return false; return true;});
      summary.textContent=`${matched.length} lecture${matched.length===1?"":"s"} will be ${action.value==="check"?"checked":"unchecked"} for ${STAGES.find(x=>x[0]===stage.value)?.[1]||""}`;
      return matched;
    }
    [discipline,exam,chapter,stage,condition,action].forEach(s=>s.addEventListener("change",refresh));
    button.addEventListener("click",e=>{e.stopPropagation(); if(panel.hidden){panel.hidden=false;refresh();const r=button.getBoundingClientRect();panel.style.left=Math.max(8,Math.min(r.left,innerWidth-panel.offsetWidth-8))+"px";panel.style.top=Math.min(innerHeight-panel.offsetHeight-8,r.bottom+4)+"px";}else{panel.hidden=true;}});
    close.addEventListener("click",()=>panel.hidden=true);
    apply.addEventListener("click",()=>{
      const matched=refresh(); const idx=STAGES.findIndex(x=>x[0]===stage.value); if(idx<0)return;
      matched.forEach(row=>{const check=row.querySelectorAll("td.checkbox-cell .xp-checkbox")[idx];if(!check)return;const checked=check.classList.contains("xp-checkbox-checked");const want=action.value==="check";if(checked!==want)check.click();});
      refresh();
    });
    panel.addEventListener("click",e=>e.stopPropagation());
    document.addEventListener("click",e=>{if(!panel||panel.hidden)return;if(!panel.contains(e.target)&&e.target!==button)panel.hidden=true;},true);
    refresh();
  }
  const scan=()=>document.querySelectorAll(".toolbar").forEach(setup);
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true}); scan();
})();