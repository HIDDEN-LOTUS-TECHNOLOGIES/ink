(()=>{'use strict';
const O='https://ordinals.com',PAGE=60;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const j=u=>fetch(u).then(r=>{if(!r.ok)throw new Error(u);return r.json()});
const img=id=>`<img loading="lazy" src="${O}/content/${esc(id)}" alt="" data-id="${esc(id)}">`;
// HTML/SVG-with-scripts inscriptions don't render in <img>; swap to sandboxed preview iframe
document.addEventListener('error',e=>{const t=e.target;if(t.tagName==='IMG'&&t.dataset.id&&!t.dataset.f){t.dataset.f=1;const f=document.createElement('iframe');f.src=`${O}/preview/${t.dataset.id}`;f.loading='lazy';f.sandbox='allow-scripts';f.style.cssText='width:100%;height:100%;border:0;pointer-events:none';t.replaceWith(f)}},true);
const creditX=c=>c.creatorX&&!c.creatorX.startsWith("{{")?` · <a href="https://x.com/${esc(c.creatorX)}">@${esc(c.creatorX)}</a>`:"";
const who=c=>String(c.creator).startsWith("{{")?"ITS CREATOR (CREDIT PENDING)":c.creator;
async function home(){
 const cols=await j('data/collections.json'),el=$('#home');
 const firsts=await Promise.all(cols.map(c=>j(`data/${c.slug}.json`).then(a=>c.thumb||a[0].id)));
 const grp=g=>cols.map((c,i)=>[c,i]).filter(([c])=>c.group===g).map(([c,i])=>`<a class="card${c.slug==='orphanz'?' light':''}" href="c.html?c=${c.slug}"><div class="pv">${img(firsts[i])}</div><div class="tx"><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p><div class="meta">${c.supply} · ${esc(who(c))}</div></div></a>`).join('');
 el.innerHTML=`<h2>Featured</h2><div class="cards">${grp('Featured')}</div><h2>Hidden Lotus Tech</h2><div class="cards">${grp('HLT')}</div>`;
}
async function col(){
 const slug=new URLSearchParams(location.search).get('c');const cols=await j('data/collections.json');const c=cols.find(x=>x.slug===slug);
 const m=$('#col');if(!c){m.innerHTML='<p class="hero">Collection not found. <a href="./">Back</a></p>';return}
 document.title=`${c.name} · INK by HLT`;
 const items=await j(`data/${slug}.json`);
 const cats={};items.forEach(it=>Object.entries(it.t||{}).forEach(([k,v])=>{(cats[k]??={})[v]=(cats[k][v]||0)+1}));
 const catKeys=Object.keys(cats).filter(k=>Object.keys(cats[k]).length>1&&Object.keys(cats[k]).length<items.length);
 const sel={};let q='',sort='n',shown=PAGE;
 m.innerHTML=`<section class="hero" style="padding:6vh 0 2vh"><p class="sys"><a href="./">INK</a> / ${esc(c.group==='HLT'?'Hidden Lotus Tech':'Featured')}</p><h1>${esc(c.name)}</h1>${c.full?`<p class="meta">${esc(c.full)}</p>`:''}<p class="lede">${esc(c.blurb)}</p><p class="meta">${c.supply} items · by ${esc(who(c))}${creditX(c)}</p></section>
 <div class="bar"><input id="q" type="search" placeholder="Search name or #" aria-label="Search"><select id="s" aria-label="Sort"><option value="n">Sort: #</option>${items.some(i=>i.num!=null)?'<option value="num">Inscription number</option>':''}${items.some(i=>i.score!=null||i.rank!=null)?'<option value="rare">Rarity</option>':''}</select><span class="meta" id="cnt"></span></div>
 <div class="layout"><aside class="filters">${catKeys.map(k=>`<details><summary>${esc(k)}</summary>${Object.entries(cats[k]).sort((a,b)=>b[1]-a[1]).map(([v,n])=>`<label><input type="checkbox" data-k="${esc(k)}" value="${esc(v)}"> ${esc(v)} <span>${n}</span></label>`).join('')}</details>`).join('')||'<p class="meta">No trait metadata for this collection.</p>'}</aside><div><div class="grid" id="g"></div><button class="btn more" id="more">Load more</button></div></div>`;
 const rare=i=>i.rank!=null?i.rank:-(i.score||0);
 function list(){let r=items.filter(i=>(!q||i.name.toLowerCase().includes(q)||String(i.n)===q||String(i.num)===q)&&Object.entries(sel).every(([k,s])=>!s.size||s.has((i.t||{})[k])));
  r.sort(sort==='num'?(a,b)=>a.num-b.num:sort==='rare'?(a,b)=>rare(a)-rare(b):(a,b)=>a.n-b.n);return r}
 function draw(){const r=list();$('#cnt').textContent=`${r.length} / ${items.length}`;
  $('#g').classList.toggle('light',slug==='orphanz');$('#g').innerHTML=r.slice(0,shown).map(i=>`<button class="item" data-id="${esc(i.id)}"><div class="pv">${img(i.id)}</div><div class="tx">${esc(i.name)}${i.num!=null?`<small class="${i.num<0?'cur':''}">#${i.num.toLocaleString()}</small>`:''}</div></button>`).join('');
  $('#more').hidden=r.length<=shown}
 $('#q').oninput=e=>{q=e.target.value.trim().toLowerCase().replace(/^#/,'');shown=PAGE;draw()};
 $('#s').onchange=e=>{sort=e.target.value;draw()};
 $('#more').onclick=()=>{shown+=PAGE;draw()};
 m.querySelector('.filters').onchange=e=>{const t=e.target;(sel[t.dataset.k]??=new Set())[t.checked?'add':'delete'](t.value);shown=PAGE;draw()};
 $('#g').onclick=e=>{const b=e.target.closest('.item');if(!b)return;const i=items.find(x=>x.id===b.dataset.id);const d=$('#dlg');
  const rows=Object.entries(i.t||{}).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}${cats[k]&&catKeys.includes(k)?` <span class="meta">${(cats[k][v]/items.length*100).toFixed(1)}%</span>`:''}</td></tr>`).join('');
  d.innerHTML=`<div class="dlg"><iframe src="${O}/preview/${esc(i.id)}" sandbox="allow-scripts" title="${esc(i.name)}"></iframe><div class="info"><h3 style="margin:0">${esc(i.name)}</h3>${i.num!=null?`<p class="meta">Inscription #${i.num.toLocaleString()}</p>`:''}<table>${rows||'<tr><td>traits</td><td>—</td></tr>'}</table><a class="btn" href="${O}/inscription/${esc(i.id)}" target="_blank" rel="noopener">ordinals.com ↗</a><button class="btn" id="x">Close</button></div></div>`;
  d.showModal();$('#x').onclick=()=>d.close()};
 $('#dlg').onclick=e=>{if(e.target.id==='dlg')e.target.close()};
 draw();
}
($('#home')?home:col)().catch(e=>{console.error(e);document.querySelector('main').insertAdjacentHTML('beforeend','<p class="meta">Could not load data.</p>')});
})();
