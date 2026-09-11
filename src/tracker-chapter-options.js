/* SEM 10-XP — keep Chapter selectors populated even when sections are collapsed. */
(function(){
  if(typeof window==='undefined'||typeof document==='undefined'||window.__sem10ChapterOptionsInstalled)return;
  window.__sem10ChapterOptionsInstalled=true;
  function addOptions(select){
    if(!select)return;
    const isChapter=select.closest('.sem10-sf-field,.sem10-bulk-field')?.querySelector('label')?.textContent?.trim()==='Chapter';
    if(!isChapter)return;
    const current=select.value;
    const scopeNames=new Set();
    document.querySelectorAll('.xp-window .section-header .section-title').forEach(el=>{const n=el.textContent.trim();if(n)scopeNames.add(n)});
    if(!scopeNames.size)return;
    const existing=new Set(Array.from(select.options).map(o=>o.value));
    scopeNames.forEach(n=>{if(!existing.has(n)){const o=document.createElement('option');o.value=n;o.textContent=n;select.appendChild(o)}});
    if(current&&Array.from(select.options).some(o=>o.value===current))select.value=current;
  }
  function scan(){document.querySelectorAll('.sem10-sf-field select,.sem10-bulk-field select').forEach(addOptions)}
  const observer=new MutationObserver(()=>scan());
  observer.observe(document.body,{childList:true,subtree:true});
  scan();
})();
