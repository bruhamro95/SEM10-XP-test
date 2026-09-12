/* SEM 10-XP — Academic progress
   ورق stays visible/checkable, but is excluded from academic progress.
*/
(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__sem10ProgressExclusionInstalled) return;
  window.__sem10ProgressExclusionInstalled = true;
  const ACADEMIC_KEYS=["explain","study","solve","review"], progressKey="sem10xp:lecture-progress-v2";
  const RANGES={Surgery:[1,77],Medicine:[78,168]};
  let timer=null;const schedule=(fn,d=40)=>{clearTimeout(timer);timer=setTimeout(fn,d)};
  function read(){try{const raw=localStorage.getItem(progressKey);return raw?JSON.parse(raw):{}}catch(_){return {}}}
  function wins(){return Array.from(document.querySelectorAll('.xp-window')).filter(w=>w.querySelector('.tracker-hero-sub'))}
  function sections(w){return Array.from(w.querySelectorAll('.section-header')).map(h=>({name:h.querySelector('.section-title')?.textContent.trim()||'',count:parseInt(h.querySelector('.section-count')?.textContent||'',10)||0})).filter(x=>x.name)}
  function infos(){return wins().map(w=>{const t=w.querySelector('.xp-titlebar-text')?.textContent||'';const d=/medicine/i.test(t)?'Medicine':/surgery/i.test(t)?'Surgery':'';return{w,d,total:sections(w).reduce((s,x)=>s+x.count,0)}}).filter(x=>x.d)}
  function disc(id){const n=parseInt(String(id).replace(/^L/,''),10);for(const [d,[a,b]] of Object.entries(RANGES))if(n>=a&&n<=b)return d;return ''}
  function done(d){const p=read();return Object.entries(p).reduce((n,[id,c])=>n+(c&&typeof c==='object'&&disc(id)===d?ACADEMIC_KEYS.filter(k=>!!c[k]).length:0),0)}
  function paint(el,p){const a=Array.from(el.querySelectorAll('.xp-progress-seg')),f=Math.round(Math.max(0,Math.min(100,p))/100*a.length);a.forEach((x,i)=>x.classList.toggle('xp-progress-seg-on',i<f))}
  function refresh(){const ii=infos();ii.forEach(x=>{if(!x.total)return;const p=Math.round(done(x.d)/(x.total*4)*100),txt=Array.from(x.w.querySelectorAll('.xp-small-text')).find(e=>/%\s*complete$/i.test(e.textContent.trim()));if(txt)txt.textContent=p+'% complete';const bar=x.w.querySelector('.tracker-hero .xp-progress');if(bar)paint(bar,p)});const total=168,p=read(),n=Object.entries(p).reduce((s,[id,c])=>s+(c&&typeof c==='object'&&disc(id)?ACADEMIC_KEYS.filter(k=>!!c[k]).length:0),0),pct=Math.round(n/(total*4)*100);document.querySelectorAll('.xp-window').forEach(w=>{if(w.querySelector('.tracker-hero-sub'))return;const ring=w.querySelector('.overview-ring'),inner=w.querySelector('.overview-ring-inner');if(ring)ring.style.background=`conic-gradient(#4E9A1F ${pct}%, #d8d5c4 0)`;if(inner)inner.innerHTML=pct+'%<span>complete</span>';const t=Array.from(w.querySelectorAll('.xp-small-text')).find(e=>/cells checked/i.test(e.textContent));if(t)t.textContent=`${n} / ${total*4} cells checked · saved on this device`})}
  new MutationObserver(()=>schedule(refresh)).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});addEventListener('storage',e=>{if(e.key===progressKey)schedule(refresh,0)});refresh();
})();
