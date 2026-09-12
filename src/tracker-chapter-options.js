/* Keep Chapter selectors populated even when Tracker sections are collapsed. */
(function(){
 if(typeof window==='undefined'||typeof document==='undefined'||window.__sem10ChapterOptionsInstalled)return;window.__sem10ChapterOptionsInstalled=true;
 function add(select){if(!select)return;const label=select.closest('.sem10-sf-field,.sem10-bulk-field')?.querySelector('label')?.textContent?.trim();if(label!=='Chapter')return;const cur=select.value,n=new Set();document.querySelectorAll('.xp-window .section-header .section-title').forEach(e=>{const v=e.textContent.trim();if(v)n.add(v)});if(!n.size)return;const existing=new Set(Array.from(select.options).map(o=>o.value));n.forEach(v=>{if(!existing.has(v)){const o=document.createElement('option');o.value=v;o.textContent=v;select.appendChild(o)}});if(cur&&Array.from(select.options).some(o=>o.value===cur))select.value=cur}
 function scan(){document.querySelectorAll('.sem10-sf-field select,.sem10-bulk-field select').forEach(add)}new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
})();
