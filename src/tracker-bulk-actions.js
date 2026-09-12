/* SEM 10-XP — Tracker bulk check actions
 * Safe DOM enhancement: operates on the existing tracker checkboxes without
 * changing Tracker data structure or layout.
 */
(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__sem10TrackerBulkInstalled) return;
  window.__sem10TrackerBulkInstalled = true;

  const STAGES=[["paper","ورق"],["explain","شرح"],["study","مذاكرة"],["solve","حل"],["review","مراجعة"]];
  const instances=new WeakMap();
  let openPanel=null,openButton=null;

  const css=`
    .sem10-bulk-panel{position:fixed;z-index:100001;width:min(380px,calc(100vw - 20px));max-height:min(80vh,650px);overflow:auto;box-sizing:border-box;padding:10px;background:#ece9d8;border:2px solid #0a246a;box-shadow:3px 3px 0 rgba(0,0,0,.28);font:12px Tahoma,Arial,sans-serif;color:#111;pointer-events:auto;touch-action:manipulation;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
    .sem10-bulk-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-weight:700}.sem10-bulk-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.sem10-bulk-field{min-width:0}.sem10-bulk-field.full{grid-column:1/-1}.sem10-bulk-field label{display:block;margin-bottom:3px;font-weight:700}.sem10-bulk-field select{width:100%;box-sizing:border-box;min-height:34px;padding:5px 7px;border:1px solid #7f9db9;background:#fff;color:#111;font:13px Tahoma,Arial,sans-serif;touch-action:manipulation}.sem10-bulk-summary{margin-top:9px;padding:6px;background:#fff;border:1px solid #aaa;font-weight:700;line-height:1.4}.sem10-bulk-actions{display:flex;gap:6px;justify-content:flex-end;margin-top:8px}.sem10-bulk-actions button{min-height:32px;padding:5px 11px;border:1px solid #777;border-radius:2px;background:linear-gradient(#fff,#d8d8d8);font:13px Tahoma,Arial,sans-serif;cursor:pointer;touch-action:manipulation}
    @media(max-width:560px){.sem10-bulk-panel{left:8px!important;right:8px;width:auto;max-height:calc(100vh - 24px)}.sem10-bulk-grid{grid-template-columns:1fr}.sem10-bulk-field.full{grid-column:auto}}
  `;
  const style=document.createElement("style");style.setAttribute("data-sem10-tracker-bulk","true");style.textContent=css;document.head.appendChild(style);

  function trackerWindow(toolbar){return toolbar?.closest(".xp-window")||null;}
  function scopeFor(toolbar){let n=toolbar;for(let i=0;i<8&&n;i++,n=n.parentElement)if(n.querySelector?.("table.lecture-table"))return n;return null;}
  function rows(scope){return Array.from(scope.querySelectorAll("table.lecture-table tbody tr")).filter(r=>r.querySelector("td.lecture-name-cell"));}
  function info(row){const cells=Array.from(row.cells||[]);const section=cells[2]?.textContent?.trim()||"";const exam=row.classList.contains("row-mid")?"mid":row.classList.contains("row-finals")?"final":"";const checks=Array.from(row.querySelectorAll("td.checkbox-cell .xp-checkbox"));const done=checks.map(el=>el.classList.contains("xp-checkbox-checked"));const flagCell=cells[cells.length-1];const svg=flagCell?.querySelector("svg");const flagged=!!svg&&svg.getAttribute("fill")!=="none";return{section,exam,done,flagged};}
  function option(sel,value,label){const o=document.createElement("option");o.value=value;o.textContent=label;sel.appendChild(o);}
  function field(labelText,sel){const w=document.createElement("div");w.className="sem10-bulk-field";const l=document.createElement("label");l.textContent=labelText;w.append(l,sel);return w;}

  function build(scope,button){
    const panel=document.createElement("div");panel.className="sem10-bulk-panel";panel.hidden=true;
    const title=document.createElement("div");title.className="sem10-bulk-title";title.innerHTML='<span>☑ Bulk check</span><span style="font-weight:400;color:#555">Tracker only</span>';panel.appendChild(title);
    const grid=document.createElement("div");grid.className="sem10-bulk-grid";
    const discipline=document.createElement("select");option(discipline,"both","Medicine + Surgery");option(discipline,"medicine","Medicine only");option(discipline,"surgery","Surgery only");
    const selection=document.createElement("select");option(selection,"all","All lectures");option(selection,"mid","Midterm");option(selection,"final","Final");option(selection,"chapter","Chapter");
    const chapter=document.createElement("select");const stage=document.createElement("select");STAGES.forEach(([k,l])=>option(stage,k,l));
    const action=document.createElement("select");option(action,"check","Check / mark done");option(action,"uncheck","Uncheck / mark not done");
    const flag=document.createElement("select");option(flag,"all","All flags");option(flag,"flagged","Flagged only");option(flag,"unflagged","Not flagged");
    grid.append(field("Discipline",discipline),field("Select by",selection),field("Chapter",chapter),field("Stage",stage),field("Action",action),field("Flag",flag));panel.appendChild(grid);
    const summary=document.createElement("div");summary.className="sem10-bulk-summary";panel.appendChild(summary);
    const actions=document.createElement("div");actions.className="sem10-bulk-actions";const apply=document.createElement("button");apply.textContent="Apply";const close=document.createElement("button");close.textContent="Close";actions.append(apply,close);panel.appendChild(actions);document.body.appendChild(panel);

    const win=trackerWindow(button);
    function currentRows(){return rows(scope);}
    function disciplineFor(){const titleText=win?.querySelector(".xp-titlebar")?.textContent?.replace(/\s+/g," ").trim()||"";if(/\bmedicine\b/i.test(titleText))return "medicine";if(/\bsurgery\b/i.test(titleText))return "surgery";return "unknown";}
    function refreshChapters(){const current=chapter.value;const wanted=discipline.value;const names=[...new Set(currentRows().filter(r=>wanted==="both"||disciplineFor()==="unknown"||disciplineFor()===wanted).map(r=>info(r).section).filter(Boolean))].sort((a,b)=>a.localeCompare(b));chapter.innerHTML="";option(chapter,"all","All chapters");names.forEach(n=>option(chapter,n,n));chapter.value=names.includes(current)?current:"all";chapter.disabled=selection.value!=="chapter";}
    function matches(row){const x=info(row);const d=disciplineFor();if(discipline.value!=="both"&&d!==discipline.value)return false;if(selection.value==="mid"&&x.exam!=="mid")return false;if(selection.value==="final"&&x.exam!=="final")return false;if(selection.value==="chapter"&&chapter.value!=="all"&&x.section!==chapter.value)return false;if(flag.value==="flagged"&&!x.flagged)return false;if(flag.value==="unflagged"&&x.flagged)return false;return true;}
    function refreshSummary(){refreshChapters();const matching=currentRows().filter(matches);const idx=STAGES.findIndex(([k])=>k===stage.value);const want=action.value==="check";const actionable=matching.filter(r=>{const x=info(r);return idx<0||!!x.done[idx]!==want;});summary.textContent=`${actionable.length} lecture${actionable.length===1?"":"s"} will be ${want?"checked":"unchecked"} for ${STAGES[idx]?.[1]||"the selected stage"}.`;}
    [discipline,selection,chapter,stage,action,flag].forEach(s=>s.addEventListener("change",refreshSummary));
    apply.addEventListener("click",()=>{const idx=STAGES.findIndex(([k])=>k===stage.value);const want=action.value==="check";let changed=0;currentRows().forEach(row=>{if(!matches(row))return;const el=Array.from(row.querySelectorAll("td.checkbox-cell .xp-checkbox"))[idx];if(!el)return;const isDone=el.classList.contains("xp-checkbox-checked");if(isDone!==want){el.click();changed+=1;}});summary.textContent=`${changed} lecture${changed===1?"":"s"} ${want?"checked":"unchecked"}.`;});
    close.addEventListener("click",()=>closePanel());panel.addEventListener("click",e=>e.stopPropagation());panel.addEventListener("touchstart",e=>e.stopPropagation(),{passive:true});refreshSummary();
    return{panel,button,refreshSummary};
  }
  function position(inst){const r=inst.button.getBoundingClientRect();const width=inst.panel.offsetWidth;const maxLeft=Math.max(8,window.innerWidth-width-8);inst.panel.style.left=Math.max(8,Math.min(r.left,maxLeft))+"px";inst.panel.style.top=Math.max(8,Math.min(r.bottom+4,window.innerHeight-inst.panel.offsetHeight-8))+"px";}
  function closePanel(){if(!openPanel)return;openPanel.hidden=true;openPanel=null;openButton=null;}
  function installToolbar(toolbar){if(!toolbar||toolbar.dataset.sem10BulkReady==="1")return;const scope=scopeFor(toolbar);if(!scope)return;const win=trackerWindow(toolbar);if(!win)return;const title=win.querySelector(".xp-titlebar")?.textContent||"";if(!/\b(medicine|surgery)\b/i.test(title))return;toolbar.dataset.sem10BulkReady="1";const button=document.createElement("button");button.type="button";button.className="xp-btn xp-btn-sm";button.textContent="☑ Bulk check";button.title="Check or uncheck multiple tracker lectures at once";toolbar.appendChild(button);const inst=build(scope,button);instances.set(win,inst);button.addEventListener("click",e=>{e.stopPropagation();if(openPanel&&openPanel!==inst.panel)closePanel();const opening=inst.panel.hidden;inst.panel.hidden=!opening;if(opening){openPanel=inst.panel;openButton=button;inst.refreshSummary();requestAnimationFrame(()=>position(inst));}});}
  function scan(){document.querySelectorAll(".toolbar").forEach(installToolbar);}
  document.addEventListener("click",e=>{if(!openPanel)return;if(e.target===openButton||openPanel.contains(e.target))return;closePanel();});
  window.addEventListener("resize",()=>{if(openPanel&&!openPanel.hidden){const inst=[...document.querySelectorAll(".sem10-bulk-panel")].find(p=>p===openPanel);if(inst){const btn=openButton;const r=btn?.getBoundingClientRect();if(r){openPanel.style.top=Math.max(8,Math.min(r.bottom+4,window.innerHeight-openPanel.offsetHeight-8))+"px";}}}});
  const observer=new MutationObserver(scan);observer.observe(document.body,{childList:true,subtree:true});scan();
})();
