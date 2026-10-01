// Direction A — scroll-transition frames + mobile study
const fs=require('fs'), F=require('./flats.cjs'), D=require('./data.cjs')
const {G,SIZES,CHART}=D
const img=f=>`img/${f}`
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--paper:#E9E4DA;--ink:#14120E;--thread:#9C3A26;--rule:rgba(20,18,14,.18)}
body{background:#d8d2c6;color:var(--ink);font-family:Archivo,sans-serif}
.mono{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase}
.disp{font-family:'Bodoni Moda',serif;font-weight:400;line-height:.86;letter-spacing:-.015em}
.cloth{filter:grayscale(1) sepia(.3) saturate(.75) contrast(1.06) brightness(1.03);object-fit:cover;width:100%;height:100%;display:block}
.clothwrap{position:relative;overflow:hidden;background:#cfc7b8}
.flat svg{width:100%;height:100%;display:block}
.frame{position:relative;width:1440px;height:720px;overflow:hidden;background:var(--paper)}
.caption{padding:14px 18px;background:#d8d2c6;display:flex;justify-content:space-between;align-items:baseline}
.caption b{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase}
.caption span{font-size:12.5px;opacity:.72;max-width:980px;text-align:right}
`
const frame=(label,note,inner)=>`<div class="caption"><b>${label}</b><span>${note}</span></div><div class="frame">${inner}</div>`

// ENTRY
const f1=`
<div class="clothwrap" style="position:absolute;inset:0"><img class="cloth" src="${img('cloth-linen-c.jpg')}" style="transform:scale(1.0)"></div>
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(233,228,218,.12),rgba(233,228,218,.55))"></div>
<div style="position:absolute;left:40px;top:90px;right:40px">
  <p class="mono" style="margin-bottom:24px">Marlow &amp; Vale &mdash; Leeds &mdash; Autumn index</p>
  <h1 class="disp" style="font-size:150px">Cloth first.<br><em>Then</em> the garment.</h1>
</div>
<div style="position:absolute;left:40px;bottom:34px;right:40px;display:flex;justify-content:space-between;align-items:flex-end">
  <p style="max-width:330px;font-size:14px;line-height:1.55">Clothes made in four factories we have been to, sold at one price all year.</p>
  <p class="mono">Scroll &mdash; the weave resolves &darr;</p>
</div>`

// DEVELOPMENT: weave dissolving to the flat
const grid=(n,cell,op)=>{let s='';for(let i=0;i<n;i++){s+=`<span style="display:block;width:${cell}px;height:${cell}px;background:rgba(20,18,14,${op});"></span>`}return s}
const f2=`
<div class="clothwrap" style="position:absolute;inset:0"><img class="cloth" src="${img('cloth-fine.jpg')}" style="transform:scale(1.6)"></div>
<div style="position:absolute;inset:0;background:radial-gradient(46% 62% at 50% 50%,rgba(233,228,218,.72),rgba(233,228,218,.02))"></div>
<div style="position:absolute;inset:0;display:grid;place-items:center">
  <div style="position:relative;width:300px;height:660px">
    <div class="flat" style="position:absolute;inset:0;color:rgba(156,58,38,.42)">${F.oxford}</div>
    <div class="flat" style="position:absolute;inset:0;color:var(--thread);clip-path:polygon(0 0,100% 0,100% 58%,0 58%)">${F.oxford}</div>
    <div style="position:absolute;left:0;right:0;top:54%;height:5px;background:linear-gradient(90deg,transparent,rgba(156,58,38,.85),transparent)"></div>
    <div style="position:absolute;left:-6px;right:-6px;top:58%;bottom:0;background-image:linear-gradient(rgba(20,18,14,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(20,18,14,.09) 1px,transparent 1px);background-size:9px 9px"></div>
  </div>
</div>
<div style="position:absolute;left:40px;top:70px">
  <p class="mono" style="opacity:.6">01 / 09</p>
  <h2 class="disp" style="font-size:56px;margin-top:10px">The Oxford<br>Shirt</h2>
  <p class="mono" style="margin-top:14px">&pound;78 &mdash; Shirts</p>
</div>
<div style="position:absolute;right:40px;top:96px;width:250px;text-align:right">
  <p class="mono" style="opacity:.55;margin-bottom:8px">Cloth</p>
  <p style="font-size:13px;line-height:1.55">100% long-staple cotton oxford, 140gsm, woven in Portugal</p>
  <p class="mono" style="opacity:.55;margin:16px 0 8px">Cut</p>
  <p style="font-size:13px;line-height:1.55">Cut straight through the body with a soft collar that stands without fusing.</p>
</div>
<div style="position:absolute;left:40px;bottom:30px;right:40px;display:flex;justify-content:space-between">
  <p class="mono">Weave grid dissolves &rarr; drawing. Drawing, not a photograph.</p>
  <p class="mono">Scrubbed by scroll, both directions</p>
</div>`

// EXIT: flat lands in the index tile, filter bar arrives
const tileMini=(g,i,live)=>`
<article style="border-top:1px solid var(--rule);padding-top:12px;${live?'':'opacity:.5'}">
  <div class="clothwrap" style="height:230px"><img class="cloth" src="${img(g.cloth)}">
    <div class="flat" style="position:absolute;inset:0;display:grid;place-items:center;padding:20px 0"><div style="width:52%;height:100%;color:${['chore','jean','cardigan'].includes(g.id)?'rgba(236,231,221,.95)':'rgba(20,18,14,.92)'}">${F[g.id]}</div></div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:10px"><h3 class="disp" style="font-size:21px">${g.n}</h3><span class="mono" style="font-size:11px">&pound;${g.p}</span></div>
  <p class="mono" style="margin-top:5px;opacity:.55">${g.c}</p>
</article>`
const f3=`
<div style="position:absolute;inset:0;background:var(--paper);padding:0 40px">
  <div style="display:flex;gap:8px;padding:14px 0;border-bottom:1px solid var(--rule);border-top:1px solid var(--ink);margin-top:14px">
    ${[['All',9,1],['Shirts',2],['Outerwear',2],['Trousers',3],['Knitwear',2]].map(c=>`<span class="mono" style="padding:8px 14px;border:1px solid ${c[2]?'var(--ink)':'var(--rule)'};background:${c[2]?'var(--ink)':'transparent'};color:${c[2]?'var(--paper)':'var(--ink)'}">${c[0]} <span style="opacity:.55">(${c[1]})</span></span>`).join('')}
    <span class="mono" style="margin-left:auto;align-self:center;opacity:.6">Showing 9 of 9 garments</span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:30px 28px;margin-top:26px">
    ${G.slice(0,3).map((g,i)=>tileMini(g,i,i===0)).join('')}
  </div>
</div>
<div style="position:absolute;left:186px;top:28px;width:210px;height:470px;z-index:5">
  <div style="position:absolute;inset:0;border:1px dashed rgba(156,58,38,.55)"></div>
  <div class="flat" style="position:absolute;inset:8px;color:rgba(156,58,38,.5)">${F.oxford}</div>
</div>
<div style="position:absolute;left:400px;top:60px;z-index:6"><p class="mono" style="color:var(--thread)">&darr; the drawing keeps its identity into the tile</p></div>`

fs.writeFileSync(__dirname+'/a2.html',`<html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
${frame('Entry &mdash; scroll 0%','Full-bleed cloth field. Headline sits in the weave; the cloth is the only image.',f1)}
${frame('Development &mdash; scroll ~35%','Cloth pushes in; a weave-aligned dissolve resolves it into the garment&rsquo;s technical drawing while the spec text arrives at the margins.',f2)}
${frame('Exit &mdash; scroll ~55%','The drawing contracts into its tile as the filter bar pins. Nothing fades out: the same drawing becomes the buy view.',f3)}
</body></html>`)
console.log('a2 written')
