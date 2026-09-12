/* SEM 10-XP — Tracker Sort / Filter enhancement
 * Safe DOM enhancement: preserves the existing Tracker layout.
 */
(function installTrackerSortFilter() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__sem10TrackerSortFilterInstalled) return;

  const STAGES = [["paper", "ورق"], ["explain", "شرح"], ["study", "مذاكرة"], ["solve", "حل"], ["review", "مراجعة"]];
  const instances = new WeakMap();
  let openPanel = null;
  let openButton = null;
  window.__sem10TrackerSortFilterInstalled = true;

  const css = `
    .sem10-sf-panel{position:fixed;z-index:100000;width:min(350px,calc(100vw - 20px));max-height:min(78vh,620px);overflow:auto;box-sizing:border-box;padding:10px;background:#ece9d8;border:2px solid #0a246a;box-shadow:3px 3px 0 rgba(0,0,0,.28);font:12px Tahoma,Arial,sans-serif;color:#111;pointer-events:auto;touch-action:manipulation;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
    .sem10-sf-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-weight:700}.sem10-sf-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.sem10-sf-field{min-width:0}.sem10-sf-field.full{grid-column:1/-1}.sem10-sf-field label{display:block;margin-bottom:3px;font-weight:700}.sem10-sf-field select{width:100%;box-sizing:border-box;min-height:34px;padding:5px 7px;border:1px solid #7f9db9;background:#fff;color:#111;font:13px Tahoma,Arial,sans-serif;touch-action:manipulation}.sem10-sf-summary{margin:9px 0 7px;padding:5px 6px;background:#fff;border:1px solid #aaa;font-weight:700}.sem10-sf-actions{display:flex;gap:6px;justify-content:flex-end;margin-top:8px}.sem10-sf-actions button{min-height:32px;padding:5px 11px;border:1px solid #777;border-radius:2px;background:linear-gradient(#fff,#d8d8d8);font:13px Tahoma,Arial,sans-serif;cursor:pointer;touch-action:manipulation}
    @media(max-width:560px){.sem10-sf-panel{width:calc(100vw - 16px);left:8px!important;right:8px;max-height:calc(100vh - 24px)}.sem10-sf-grid{grid-template-columns:1fr}.sem10-sf-field.full{grid-column:auto}}
  `;
  const style=document.createElement("style");style.setAttribute("data-sem10-tracker-sort-filter","true");style.textContent=css;document.head.appendChild(style);

  function findScope(toolbar){let node=toolbar;for(let i=0;i<8&&node;i++,node=node.parentElement)if(node.querySelector?.("table.lecture-table"))return node;return null;}
  function lectureRows(scope){return Array.from(scope.querySelectorAll("table.lecture-table tbody tr")).filter(r=>r.querySelector("td.lecture-name-cell"));}
  function rowInfo(row){const cells=Array.from(row.cells||[]);const name=row.querySelector(".lecture-name-cell")?.textContent?.replace(/\s+/g," ").trim()||"";const section=cells[2]?.textContent?.trim()||"";const exam=row.classList.contains("row-mid")?"mid":row.classList.contains("row-finals")?"final":"";const checks=Array.from(row.querySelectorAll("td.checkbox-cell .xp-checkbox"));const done=checks.map(el=>el.classList.contains("xp-checkbox-checked"));const flagCell=cells[cells.length-1];const svg=flagCell?.querySelector("svg");const flagged=!!svg&&svg.getAttribute("fill")!=="none";return{name,section,exam,done,flagged};}
  function option(select,value,label){const el=document.createElement("option");el.value=value;el.textContent=label;select.appendChild(el);}
  function makeField(labelText,select,full){const wrap=document.createElement("div");wrap.className="sem10-sf-field"+(full?" full":"");const label=document.createElement("label");label.textContent=labelText;wrap.append(label,select);return wrap;}
  function buildPanel(scope,button){
    const panel=document.createElement("div");panel.className="sem10-sf-panel";panel.hidden=true;
    const title=document.createElement("div");title.className="sem10-sf-title";title.innerHTML='<span>⇅ Sort / Filter</span><span style="font-weight:400;color:#555">Tracker only</span>';panel.appendChild(title);
    const grid=document.createElement("div");grid.className="sem10-sf-grid";
    const chapter=document.createElement("select"),exam=document.createElement("select"),stage=document.createElement("select"),stageState=document.createElement("select"),flagged=document.createElement("select"),sort=document.createElement("select");
    option(chapter,"all","All chapters");option(exam,"all","All exams");option(exam,"mid","Midterm");option(exam,"final","Final");option(stage,"all","Any stage");STAGES.forEach(([k,l])=>option(stage,k,l));option(stageState,"all","Any status");option(stageState,"todo","Yet to do");option(stageState,"done","Done");option(flagged,"all","All flags");option(flagged,"flagged","Flagged only");option(flagged,"unflagged","Not flagged");option(sort,"original","Original order");option(sort,"name-asc","Lecture A → Z");option(sort,"name-desc","Lecture Z → A");option(sort,"least","Least complete first");option(sort,"most","Most complete first");option(sort,"flagged","Flagged first");option(sort,"mid","Midterm first");option(sort,"final","Final first");
    grid.append(makeField("Chapter",chapter),makeField("Exam",exam),makeField("Stage",stage),makeField("Stage status",stageState),makeField("Flag",flagged),makeField("Sort",sort));panel.appendChild(grid);
    const summary=document.createElement("div");summary.className="sem10-sf-summary";panel.appendChild(summary);
    const actions=document.createElement("div");actions.className="sem10-sf-actions";const reset=document.createElement("button");reset.textContent="Reset";const close=document.createElement("button");close.textContent="Close";actions.append(reset,close);panel.appendChild(actions);
    const state={chapter,exam,stage,stageState,flagged,sort,summary,panel,button};instances.set(scope,state);
    function refreshChapterOptions(){const current=chapter.value;const names=[...new Set(lectureRows(scope).map(r=>rowInfo(r).section).filter(Boolean))].sort((a,b)=>a.localeCompare(b));chapter.innerHTML="";option(chapter,"all","All chapters");names.forEach(n=>option(chapter,n,n));chapter.value=names.includes(current)?current:"all";}
    function apply(){refreshChapterOptions();const rs=lectureRows(scope),selectedChapter=chapter.value,selectedExam=exam.value,selectedStage=stage.value,selectedState=stageState.value,selectedFlag=flagged.value,selectedSort=sort.value;let visibleCount=0;rs.forEach(row=>{const info=rowInfo(row);let show=true;if(selectedChapter!=="all"&&info.section!==selectedChapter)show=false;if(selectedExam!=="all"&&info.exam!==selectedExam)show=false;if(selectedStage!=="all"){const idx=STAGES.findIndex(([k])=>k===selectedStage),checked=idx>=0?!!info.done[idx]:false;if(selectedState==="todo"&&checked)show=false;if(selectedState==="done"&&!checked)show=false;}if(selectedFlag==="flagged"&&!info.flagged)show=false;if(selectedFlag==="unflagged"&&info.flagged)show=false;row.style.display=show?"":"none";if(show)visibleCount++;});const cmp=(a,b)=>{const A=rowInfo(a),B=rowInfo(b);if(selectedSort==="name-asc")return A.name.localeCompare(B.name);if(selectedSort==="name-desc")return B.name.localeCompare(A.name);if(selectedSort==="least"||selectedSort==="most"){const av=A.done.filter(Boolean).length,bv=B.done.filter(Boolean).length;return selectedSort==="least"?av-bv||A.name.localeCompare(B.name):bv-av||A.name.localeCompare(B.name);}if(selectedSort==="flagged")return Number(B.flagged)-Number(A.flagged)||A.name.localeCompare(B.name);if(selectedSort==="mid")return Number(B.exam==="mid")-Number(A.exam==="mid")||A.name.localeCompare(B.name);if(selectedSort==="final")return Number(B.exam==="final")-Number(A.exam==="final")||A.name.localeCompare(B.name);return 0;};if(selectedSort!=="original")scope.querySelectorAll("table.lecture-table tbody").forEach(tbody=>{Array.from(tbody.querySelectorAll(":scope > tr")).filter(r=>r.querySelector("td.lecture-name-cell")).sort(cmp).forEach(row=>tbody.appendChild(row));});summary.textContent=`${visibleCount} lecture${visibleCount===1?"":"s"} shown`;}
    [chapter,exam,stage,stageState,flagged,sort].forEach(select=>select.addEventListener("change",apply));reset.addEventListener("click",()=>{chapter.value="all";exam.value="all";stage.value="all";stageState.value="all";flagged.value="all";sort.value="original";apply();});close.addEventListener("click",()=>closePanel());panel.addEventListener("click",e=>e.stopPropagation());panel.addEventListener("touchstart",e=>e.stopPropagation(),{passive:true});return{panel,apply,refreshChapterOptions};
  }
  function positionPanel(panel,button){const r=button.getBoundingClientRect(),width=panel.offsetWidth,maxLeft=Math.max(8,window.innerWidth-width-8);panel.style.left=Math.max(8,Math.min(r.left,maxLeft))+"px";panel.style.top=Math.max(8,Math.min(r.bottom+4,window.innerHeight-panel.offsetHeight-8))+"px";}
  function closePanel(){if(!openPanel)return;openPanel.hidden=true;openPanel=null;openButton=null;}
  function setupToolbar(toolbar){
    if(!toolbar||toolbar.dataset.sem10SortFilterReady==="1")return;
    const scope=findScope(toolbar);if(!scope)return;
    const win=toolbar.closest(".xp-window");
    if(win){const first=Array.from(win.querySelectorAll(".toolbar")).find(t=>findScope(t));if(first&&first!==toolbar)return;}
    toolbar.dataset.sem10SortFilterReady="1";
    const button=document.createElement("button");button.type="button";button.className="xp-btn xp-btn-sm";button.textContent="⇅ Sort / Filter";button.title="Filter and sort the existing tracker rows without changing the tracker layout";toolbar.appendChild(button);
    const built=buildPanel(scope,button);document.body.appendChild(built.panel);
    button.addEventListener("click",e=>{e.stopPropagation();if(openPanel&&openPanel!==built.panel)closePanel();const opening=built.panel.hidden;built.panel.hidden=!opening;if(opening){openPanel=built.panel;openButton=button;built.refreshChapterOptions();built.apply();requestAnimationFrame(()=>positionPanel(built.panel,button));}});
    built.apply();
  }
  function scan(){document.querySelectorAll(".toolbar").forEach(setupToolbar);document.querySelectorAll("table.lecture-table").forEach(table=>{let node=table.parentElement;for(let i=0;i<8&&node;i++,node=node.parentElement){const instance=instances.get(node);if(instance){instance.apply();break;}}});}
  document.addEventListener("click",e=>{if(!openPanel)return;if(e.target===openButton||openPanel.contains(e.target))return;closePanel();});
  window.addEventListener("resize",()=>{if(openPanel&&!openPanel.hidden&&openButton)positionPanel(openPanel,openButton);});
  const observer=new MutationObserver(()=>scan());observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});scan();
})();
