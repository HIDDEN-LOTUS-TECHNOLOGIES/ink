import { standardScores, rankByScore, TIER_CUT, tierFor as tierForSupply, tierTip as tierTipSupply } from './rarity.js';
import { createPreviewQueue } from './previewQueue.js';
(()=>{'use strict';
const O='https://ordinals.com',PAGE=60,VER='kit1',PREVIEW_CAP=2;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const j=u=>fetch(u).then(r=>{if(!r.ok)throw new Error(u);return r.json()});
const img=id=>`<img loading="lazy" width="640" height="640" src="${O}/content/${esc(id)}" alt="" data-id="${esc(id)}">`;
const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
// allow-same-origin needed so canvas ordies can run body onload / start()
const SB='allow-scripts allow-same-origin';
const mkFrame=id=>{const f=document.createElement('iframe');f.src=`${O}/preview/${id}`;f.loading='eager';f.sandbox=SB;f.title='Inscription preview';f.width='640';f.height='640';f.style.cssText='width:100%;height:100%;border:0;pointer-events:none';f.dataset.id=id;return f};
const livePv=pv=>pv.querySelector('iframe[src*="preview/"]');
const stopPv=pv=>{pv.querySelectorAll('iframe').forEach(f=>{f.src='about:blank';f.remove()})};
const replayPv=(pv,id)=>{
 if(reduce()){if(!livePv(pv))pv.appendChild(mkFrame(id));return}
 pv.classList.add('pv-wait');pv.classList.remove('pv-ready');
 stopPv(pv);
 const frame=mkFrame(id);
 frame.addEventListener('load',()=>{pv.classList.remove('pv-wait');pv.classList.add('pv-ready')});
 pv.appendChild(frame);
};
const previews=createPreviewQueue(PREVIEW_CAP);
let previewIO=null;
function mountPreview(pv,id,done){
 if(!pv.isConnected||livePv(pv)){done();return ()=>{}}
 const frame=mkFrame(id);
 let settled=false,timer=0;
 const finish=()=>{
  if(settled)return;
  settled=true;
  if(timer)clearInterval(timer);
  if(pv.isConnected){pv.classList.remove('pv-wait');pv.classList.add('pv-ready')}
  done();
 };
 frame.addEventListener('load',finish);
 frame.addEventListener('error',finish);
 pv.appendChild(frame);
 timer=setInterval(()=>{if(!frame.isConnected)finish()},400);
 return ()=>{if(timer)clearInterval(timer)};
}
function enqueuePreview(pv){
 const id=pv.dataset.preview;
 if(!id||livePv(pv))return;
 pv.classList.add('pv-wait');
 let cancel=()=>{};
 previews.enqueue({
  pv,
  cancel(){cancel()},
  start(done){cancel=mountPreview(pv,id,done)},
 });
}
function observePreviews(root){
 const slots=[...root.querySelectorAll('[data-preview]')];
 if(typeof IntersectionObserver!=='function'){slots.forEach(enqueuePreview);return}
 if(!previewIO){
  previewIO=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    previewIO.unobserve(entry.target);
    enqueuePreview(entry.target);
   }
  },{rootMargin:'240px 0px'});
 }
 slots.forEach(pv=>{
  if(livePv(pv))return;
  pv.classList.add('pv-wait');
  previewIO.observe(pv);
 });
}
// HTML/SVG-with-scripts inscriptions don't render in <img>; swap to a sandboxed preview on a dark pane
document.addEventListener('error',e=>{
 const t=e.target;
 if(t.tagName!=='IMG'||!t.dataset.id||t.dataset.f||t.dataset.keep||t.closest('[data-ordie]'))return;
 t.dataset.f=1;
 const f=mkFrame(t.dataset.id);
 const pane=t.closest('.art');
 if(pane){
  f.removeAttribute('style');
  pane.classList.add('pv-wait');
  f.addEventListener('load',()=>{pane.classList.remove('pv-wait');pane.classList.add('pv-ready')});
 }else f.loading='lazy';
 t.replaceWith(f);
},true);
const who=c=>String(c.creator).startsWith("{{")?"ITS CREATOR (CREDIT PENDING)":c.creator;
// Linked X credit; avoid duplicating @handle when creator already is the handle
const byline=c=>{
 const x=c.creatorX&&!String(c.creatorX).startsWith("{{")?c.creatorX:"";
 const cre=c.creator&&!String(c.creator).startsWith("{{")?String(c.creator):"";
 const link=x?`<a href="https://x.com/${esc(x)}">@${esc(x)}</a>`:"";
 if(x&&(!cre||cre===x||cre==="@"+x))return link;
 if(x&&cre)return `${esc(cre)} · ${link}`;
 return esc(who(c));
};

async function home(){
 const cols=await j(`data/collections.json?v=${VER}`),el=$('#home');
 const firsts=await Promise.all(cols.map(c=>j(`data/${c.slug}.json?v=${VER}`).then(a=>c.thumb||a[0].id)));
 const grp=g=>cols.map((c,i)=>[c,i]).filter(([c])=>c.group===g).map(([c,i])=>{
  const live=c.slug==='ordies';
  const pvClass=live?'pv pv-wait':'pv';
  const pvData=live?` data-ordie="1" data-preview="${esc(firsts[i])}"`:'';
  // Plain-text credit only — nested <a> inside the card link breaks browser layout
  return`<a class="card${c.slug==='orphanz'?' orph':''}${live?' ordie-card':''}" href="c.html?c=${c.slug}"><div class="${pvClass}"${pvData}>${live?'':img(firsts[i])}</div><div class="tx"><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p><div class="meta">${c.supply} · ${esc(who(c))}</div></div></a>`;
 }).join('');
 el.innerHTML=`<h2>Featured</h2><div class="cards feature">${grp('Featured')}</div><h2>Hidden Lotus Tech</h2><div class="cards">${grp('HLT')}</div>`;
 observePreviews(el);
}

async function col(){
 const slug=new URLSearchParams(location.search).get('c');const cols=await j(`data/collections.json?v=${VER}`);const c=cols.find(x=>x.slug===slug);
 const m=$('#content');if(!c){m.innerHTML='<p class="hero">Collection not found. <a href="./">Back</a></p>';return}
 document.title=`${c.name} · INK by HLT`;
 const items=await j(`data/${slug}.json?v=${VER}`);
 standardScores(items);
 const cats={};items.forEach(it=>Object.entries(it.t||{}).forEach(([k,v])=>{(cats[k]??={})[v]=(cats[k][v]||0)+1}));
 const catKeys=Object.keys(cats).filter(k=>Object.keys(cats[k]).length>1&&Object.keys(cats[k]).length<items.length);
 const sel={};let q='',sort='n',shown=PAGE,parked=null;
 const rankOf=rankByScore(items);
 const tierFor=rank=>tierForSupply(rank,c.supply);
 const tierTip=(rank,score)=>tierTipSupply(rank,score,c.supply);
 const legend=rankOf.size?`<span class="tiers">${TIER_CUT.map(t=>`<span title="${esc(t[2]+' · '+t[3])}"><i class="${t[0]}"></i>${esc(t[2])}${t[4]?' '+t[4]:''}</span>`).join('')}</span>`:'';
 const rareNote=items.some(i=>i.score!=null)?`<p class="help">Rarity: each trait scores ${c.supply} ÷ the number of pieces that share it; a piece's score is the sum across its traits. Higher = rarer.</p>`:'';
 const orph=slug==='orphanz',ordie=slug==='ordies';
 const noTraits=catKeys.length?'':'<span class="meta">No trait metadata for this collection.</span>';
 m.innerHTML=`<section class="hero"><p class="crumb"><a href="./">Home</a> / ${esc(c.group==='HLT'?'Hidden Lotus Tech':'Featured')}</p><h1 class="page-title">${esc(c.name)}</h1>${c.full?`<p class="meta">${esc(c.full)}</p>`:''}<p class="lede">${esc(c.blurb)}</p><p class="meta">${c.supply} items · by ${byline(c)}${c.satflow?` · <a href="https://www.satflow.com/ordinals/${esc(c.satflow)}" target="_blank" rel="noopener">Satflow ↗</a>`:''}${c.arkaid?` · <a href="https://arkaid.io/collections/${esc(c.arkaid)}" target="_blank" rel="noopener">Arkaid ↗</a>`:''}</p></section>
 <div class="bar"><label class="ctrl" for="q">Search</label><input id="q" type="search" placeholder="Search name or #"><label class="ctrl" for="s">Sort</label><select id="s"><option value="n">Sort: #</option>${items.some(i=>i.num!=null)?'<option value="num">Inscription number</option>':''}${items.some(i=>i.score!=null||i.rank!=null)?'<option value="rare">Rarity</option>':''}</select><span class="meta" id="cnt" aria-live="polite"></span>${noTraits}${legend}${orph?'<label class="ctrl"><input type="checkbox" id="glitch"> Glitch</label><label class="ctrl">Hue <input class="hue" id="hue" type="range" min="0" max="360" value="0" aria-label="Tile hue"></label><label class="ctrl">Lit <input class="lit" id="lit" type="range" min="0" max="100" value="72" aria-label="Tile lightness"></label><button type="button" class="btn reset" id="bgreset">Reset</button>':''}</div>
 ${rareNote}
 <div class="layout${catKeys.length?'':' solo'}">${catKeys.length?'<aside class="filters"></aside>':''}<div><div class="grid" id="g"></div><button class="btn more" id="more">Load more</button></div></div>`;
 const az=(a,b)=>String(a[0]).localeCompare(String(b[0]),undefined,{numeric:true,sensitivity:'base'});
 function traitEntries(k){const rows=Object.entries(cats[k]);if(sort==='rare')rows.sort((a,b)=>a[1]-b[1]||az(a,b));else rows.sort(az);return rows}
 function renderFilters(){const box=m.querySelector('.filters');if(!box)return;
  const open=new Set([...box.querySelectorAll('details[open]')].map(d=>d.dataset.k));
  box.innerHTML=catKeys.map(k=>`<details data-k="${esc(k)}"${open.has(k)?' open':''}><summary>${esc(k)}</summary>${traitEntries(k).map(([v,n])=>`<label><input type="checkbox" data-k="${esc(k)}" value="${esc(v)}"${sel[k]?.has(v)?' checked':''}> ${esc(v)} <span>${n}</span></label>`).join('')}</details>`).join('')}
 function list(){let r=items.filter(i=>(!q||i.name.toLowerCase().includes(q)||String(i.n)===q||String(i.num)===q)&&Object.entries(sel).every(([k,s])=>!s.size||s.has((i.t||{})[k])));
  r.sort(sort==='num'?(a,b)=>a.num-b.num:sort==='rare'?(a,b)=>(rankOf.get(a.id)??1e9)-(rankOf.get(b.id)??1e9)||a.n-b.n:(a,b)=>a.n-b.n);return r}
 function bindOrdieHover(g){
  g.querySelectorAll('.item').forEach(item=>{
   item.addEventListener('mouseenter',()=>{
    const pv=item.querySelector('.pv');
    if(!pv||pv.classList.contains('pv-wait')||!livePv(pv))return;
    replayPv(pv,item.dataset.id);
   });
  });
 }
 function restoreParked(){
  if(!parked)return;
  const {node,mark,alt}=parked;parked=null;
  delete node.dataset.keep;
  if(alt!=null)node.alt=alt;
  if(mark.isConnected)mark.replaceWith(node);
 }
 function takeLoadedArt(tile,name){
  const node=tile.querySelector('.pv img');
  if(!node||!node.complete||node.naturalWidth<=0||node.dataset.f)return null;
  const mark=document.createElement('span');
  mark.className='pv-hold';
  const alt=node.alt;
  node.replaceWith(mark);
  node.alt=name;
  node.dataset.keep='1';
  parked={node,mark,alt};
  return node;
 }
 function draw(){
  const r=list();$('#cnt').textContent=`${r.length} / ${items.length}`;
  const g=$('#g');g.classList.toggle('orphanz',orph);
  if(ordie){previews.reset();if(previewIO)previewIO.disconnect()}
  g.innerHTML=r.slice(0,shown).map(i=>{const rk=rankOf.get(i.id);const tg=rk==null?null:tierTip(rk,i.score);return `<button class="item" data-id="${esc(i.id)}"><div class="pv${ordie?' pv-wait':''}"${ordie?` data-ordie="1" data-preview="${esc(i.id)}"`:''}>${ordie?'':img(i.id)}</div><div class="tx"><span class="nm">${esc(i.name)}</span>${tg?`<span class="badge" data-tier="${tg.id}" title="${esc(tg.tip)}">#${rk}</span>`:''}${i.num!=null?`<small class="${i.num<0?'cur':''}">#${i.num.toLocaleString()}</small>`:''}</div></button>`}).join('');
  $('#more').hidden=r.length<=shown;
  if(ordie){bindOrdieHover(g);observePreviews(g)}
 }
 $('#q').oninput=e=>{q=e.target.value.trim().toLowerCase().replace(/^#/,'');shown=PAGE;draw()};
 $('#s').onchange=e=>{sort=e.target.value;renderFilters();draw()};
 $('#more').onclick=()=>{shown+=PAGE;draw()};
 const filterBox=m.querySelector('.filters');
 if(filterBox)filterBox.onchange=e=>{const t=e.target;(sel[t.dataset.k]??=new Set())[t.checked?'add':'delete'](t.value);shown=PAGE;draw()};
 $('#g').onclick=e=>{const b=e.target.closest('.item');if(!b)return;const i=items.find(x=>x.id===b.dataset.id);const d=$('#dlg');
  if(d.open)d.close();
  restoreParked();
  const rows=Object.entries(i.t||{}).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}${cats[k]&&catKeys.includes(k)?` <span class="meta">${(cats[k][v]/items.length*100).toFixed(1)}%</span>`:''}</td></tr>`).join('');
  const rk=rankOf.get(i.id);const tg=rk==null?null:tierTip(rk,i.score);
  d.innerHTML=`<div class="dlg"><div class="art" id="artslot"></div><div class="info"><h2 style="margin:0">${esc(i.name)}</h2>${i.num!=null?`<p class="meta">Inscription #${i.num.toLocaleString()}</p>`:''}${tg?`<p class="chip" data-tier="${tg.id}" title="${esc(tg.tip)}">#${rk} / ${c.supply} · ${esc(tg.id)}</p>`:''}<table>${rows||'<tr><td>traits</td><td>—</td></tr>'}</table><a class="btn" href="${O}/inscription/${esc(i.id)}" target="_blank" rel="noopener">ordinals.com ↗</a>${c.satflow?`<a class="btn" href="https://www.satflow.com/ordinal/${esc(i.id)}" target="_blank" rel="noopener">Satflow ↗</a>`:''}<button class="btn" id="x">Close</button></div></div>`;
  const slot=$('#artslot',d);
  const loaded=!ordie&&takeLoadedArt(b,i.name);
  if(loaded)slot.append(loaded);
  else if(ordie){
   const f=mkFrame(i.id);f.removeAttribute('style');f.title=i.name;
   slot.classList.add('pv-wait');
   f.addEventListener('load',()=>{slot.classList.remove('pv-wait');slot.classList.add('pv-ready')});
   slot.append(f);
  }else{
   const im=document.createElement('img');
   im.src=`${O}/content/${i.id}`;im.alt=i.name;im.width=640;im.height=640;im.dataset.id=i.id;
   slot.classList.add('pv-wait');
   im.addEventListener('load',()=>{slot.classList.remove('pv-wait');slot.classList.add('pv-ready')});
   slot.append(im);
  }
  d.onclose=()=>restoreParked();
  d.showModal();$('#x').onclick=()=>d.close()};
 $('#dlg').onclick=e=>{if(e.target.id==='dlg')e.target.close()};
 if(orph){
  // Opposite fosterz (light ground, black ink). Lit mid-high so hue is visible (sat forced 0 at lit≤8 or ≥92).
  const g=$('#g'),H0=0,L0=72;
  const applyBg=()=>{const h=+$('#hue').value,l=+$('#lit').value,s=l<=8||l>=92?0:100;const col=`hsl(${h} ${s}% ${l}%)`;g.style.setProperty('--tile-bg',col);g.style.setProperty('--hue',String(h));$('#hue').style.setProperty('--thumb',`hsl(${h} 100% 50%)`);$('#lit').style.setProperty('--mid',`hsl(${h} 100% 50%)`);g.classList.toggle('dark-tiles',l<55)};
  const setGlitch=on=>{ $('#glitch').checked=on;g.classList.toggle('glitch-on',on) };
  $('#hue').oninput=applyBg;$('#lit').oninput=applyBg;
  $('#glitch').onchange=e=>g.classList.toggle('glitch-on',e.target.checked);
  $('#bgreset').onclick=()=>{ $('#hue').value=H0;$('#lit').value=L0;applyBg() };
  $('#hue').value=H0;$('#lit').value=L0;
  setGlitch(!reduce());
  applyBg();
 }
 renderFilters();
 draw();
}
($('#home')?home:col)().catch(e=>{console.error(e);document.querySelector('main').insertAdjacentHTML('beforeend','<p class="meta">Could not load data.</p>')});
})();
