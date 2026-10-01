const fs=require('fs'), D=require('./data.cjs')
const {G,SIZES,CHART}=D
const img=f=>`img/${f}`
const PHOTO={oxford:'g-hangers.jpg',tee:'g-knitfold.jpg',chore:'g-jacketflat.jpg',overshirt:'g-woolcoat.jpg',
 trouser:'g-trouserflat.jpg',jean:'g-denimdetail.jpg',knit:'g-knitform.jpg',cardigan:'g-knitpurple.jpg',shorts:'g-shorts.jpg'}
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--black:#0B0B0A;--bone:#F3EFE6;--signal:#D9531E;--dim:rgba(243,239,230,.55);--line:rgba(243,239,230,.16)}
body{background:#1c1b19;color:var(--bone);font-family:'Space Grotesk',sans-serif}
.anton{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.82;letter-spacing:-.01em}
.mono{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase}
.duo{position:relative;overflow:hidden;background:#1a0f08;isolation:isolate}
.duo img{width:100%;height:100%;object-fit:cover;display:block;filter:grayscale(1) contrast(1.55) brightness(.82);mix-blend-mode:screen}
.duo::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,var(--signal),#7A2A0B);mix-blend-mode:multiply;opacity:.8}
.px{position:relative;overflow:hidden;background:#1a0f08;isolation:isolate}
.px img{image-rendering:pixelated;transform-origin:top left;display:block;filter:grayscale(1) contrast(1.6) brightness(.85);mix-blend-mode:screen}
.px::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,var(--signal),#7A2A0B);mix-blend-mode:multiply;opacity:.8}
.frame{position:relative;width:1440px;height:720px;overflow:hidden;background:var(--black)}
.caption{padding:14px 18px;background:#1c1b19;display:flex;justify-content:space-between;align-items:baseline}
.caption b{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--signal)}
.caption span{font-size:12.5px;opacity:.7;max-width:980px;text-align:right}
`
const pxBox=(file,w,h,blocks)=>`<div class="px" data-blocks="${blocks}" style="width:${w}px;height:${h}px"><img src="${img(file)}" style="width:${blocks}px;height:${Math.round(blocks*h/w)}px;transform:scale(${w/blocks})"></div>`
const pxFill=(file,blocks,w=1440,h=720)=>`<div class="px" data-blocks="${blocks}" style="position:absolute;inset:0"><img src="${img(file)}" style="width:${blocks}px;height:${Math.round(blocks*h/w)}px;transform:scale(${w/blocks})"></div>`
const frame=(label,note,inner)=>`<div class="caption"><b>${label}</b><span>${note}</span></div><div class="frame">${inner}</div>`
const sizeRow=(g,chosen)=>`<div style="display:flex;gap:6px;margin-top:12px">`+SIZES.map(s=>{const sold=g.s.includes(s),on=s===chosen
 return `<span class="mono" style="padding:9px 0;width:42px;text-align:center;border:1px solid ${on?'var(--signal)':'var(--line)'};background:${on?'var(--signal)':'transparent'};color:${on?'#fff':sold?'rgba(243,239,230,.28)':'inherit'};${sold?'text-decoration:line-through;':''}">${s}</span>`}).join('')+`</div>`

const f1=`${pxFill('g-rail.jpg',58)}
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,10,.5),rgba(11,11,10,.15) 40%,rgba(11,11,10,.92))"></div>
<div style="position:absolute;left:36px;right:36px;top:40px;display:flex;justify-content:space-between"><span class="mono">Marlow &amp; Vale</span><span class="mono">Index &nbsp; Measure &nbsp; Care &nbsp; Bag (2)</span></div>
<h1 class="anton" style="position:absolute;left:30px;top:120px;font-size:200px">Thirty<br>styles<br>a year.</h1>
<div style="position:absolute;left:36px;right:36px;bottom:34px;display:flex;justify-content:space-between;align-items:flex-end">
 <p style="max-width:380px;font-size:14px;line-height:1.5">Clothes made in four factories we have been to, sold at one price all year.</p>
 <p class="mono" style="color:var(--signal)">Coarse blocks &mdash; scroll to resolve &rarr;</p></div>`

const f2=`<div class="duo" style="position:absolute;inset:0;opacity:.3"><img src="${img('g-hangers.jpg')}"></div>
<div style="position:absolute;left:0;right:0;top:78px;height:3px;background:var(--dim)"></div>
<div style="position:absolute;left:-150px;top:98px;display:flex;gap:30px;align-items:flex-start">
 ${['chore','overshirt','knit','cardigan','jean'].map((id,i)=>{const g=G.find(x=>x.id===id)
 return `<figure style="width:${i===2?400:310}px;transform:translateY(${[30,0,66,6,44][i]}px);opacity:${i===2?1:.55}">
 <div class="${i===2?'duo':'px'}" data-blocks="34" style="height:${i===2?400:330}px">${i===2?`<img src="${img(PHOTO[id])}">`:`<img src="${img(PHOTO[id])}" style="width:22px;height:${Math.round(22*330/310)}px;transform:scale(${310/22})">`}</div>
 <figcaption style="margin-top:12px"><p class="anton" style="font-size:${i===2?28:20}px">${g.n}</p><p class="mono" style="margin-top:6px;color:var(--dim)">${g.c} &mdash; &pound;${g.p}</p></figcaption></figure>`}).join('')}
</div>
<div style="position:absolute;left:36px;bottom:30px;right:36px;display:flex;justify-content:space-between;align-items:flex-end">
 <p class="anton" style="font-size:46px;background:var(--black);padding:6px 10px 10px">The rail travels</p>
 <p class="mono" style="color:var(--dim);max-width:320px;text-align:right;line-height:2">Vertical scroll drives horizontal travel.<br>The centred garment resolves out of its blocks.</p></div>`

const f3=`<div class="duo" style="position:absolute;inset:0"><img src="${img('g-knitform.jpg')}"></div>
<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,11,10,.93) 34%,rgba(11,11,10,.08))"></div>
<div style="position:absolute;left:36px;top:60px;width:520px">
 <p class="mono" style="color:var(--signal)">07 / 09 &mdash; Knitwear</p>
 <h2 class="anton" style="font-size:88px;margin-top:14px">Lambswool<br>Crew</h2>
 <p style="font-size:16px;line-height:1.5;margin-top:18px">Fully fashioned, so the panels are knitted to shape rather than cut out of a sheet of fabric.</p>
 <p class="mono" style="margin-top:16px;color:var(--dim)">100% lambswool, spun in Scotland</p>
 <p class="mono" style="margin-top:8px;color:var(--dim)">Navy / Grey melange / Rust</p>
 ${sizeRow(G.find(g=>g.id==='knit'),'M')}
 <p class="mono" style="margin-top:10px;color:var(--dim)">L is sold out</p>
 <div style="display:flex;gap:12px;align-items:center;margin-top:18px"><span class="anton" style="font-size:40px">&pound;135</span>
 <span class="mono" style="background:var(--signal);color:#fff;padding:14px 28px">Add to bag</span></div>
</div>
<p class="mono" style="position:absolute;right:36px;bottom:30px;color:var(--dim)">Representative imagery &mdash; not a photograph of this garment</p>`

fs.writeFileSync(__dirname+'/b2.html',`<html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
${frame('Entry &mdash; scroll 0%','Hero footage/still held at coarse block size; the rail is legible as mass and colour, not detail.',f1)}
${frame('Development &mdash; scroll ~40%','Vertical scroll drives the rail sideways across three depth layers; the centred garment de-pixelates as it reaches the middle.',f2)}
${frame('Exit &mdash; scroll ~65%','The resolved garment fills the buy panel with its real size row, sold-out state and price. The block grid stays behind it.',f3)}
<script src="pixel.js"></script></body></html>`)

// mobile
const MCSS=CSS.replace('.frame{position:relative;width:1440px','.frame{position:relative;width:390px')
const mtile=(g,i)=>`<article style="margin-top:28px">
 <div class="duo" style="height:330px"><img src="${img(PHOTO[g.id])}"></div>
 <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:12px"><h3 class="anton" style="font-size:26px">${g.n}</h3><span class="mono">&pound;${g.p}</span></div>
 <p class="mono" style="margin-top:8px;color:rgba(11,11,10,.6)">${g.c} &mdash; ${g.col.join(' / ')}</p>
 <p style="font-size:13px;line-height:1.5;margin-top:8px">${g.f}</p>
 <p style="font-size:13px;line-height:1.5;margin-top:6px;opacity:.65">${g.d}</p>
 <div style="display:flex;gap:6px;margin-top:12px">${SIZES.map(s=>{const sold=g.s.includes(s),on=(i===0&&s==='M')
  return `<span class="mono" style="flex:1;padding:13px 0;text-align:center;border:1px solid ${on?'var(--signal)':'rgba(11,11,10,.2)'};background:${on?'var(--signal)':'transparent'};color:${on?'#fff':sold?'rgba(11,11,10,.3)':'inherit'};${sold?'text-decoration:line-through;':''}">${s}</span>`}).join('')}</div>
 <div class="mono" style="margin-top:12px;padding:15px;text-align:center;${i===0?'background:var(--signal);color:#fff':'border:1px solid rgba(11,11,10,.25);opacity:.5'}">${i===0?'Add to bag &mdash; &pound;'+g.p:'Choose a size'}</div>
</article>`

fs.writeFileSync(__dirname+'/b3.html',`<html><head><meta charset="utf-8"><style>${MCSS}body{width:390px;background:var(--black)}</style></head><body>
<div style="position:sticky;top:0;z-index:40;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px;background:rgba(11,11,10,.92);border-bottom:1px solid var(--line)"><span class="mono">Marlow &amp; Vale</span><span class="mono">Menu &nbsp; Bag (2)</span></div>
<section style="height:560px;position:relative;overflow:hidden">${pxFill('g-rail.jpg',34,390,560)}
 <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,10,.45),rgba(11,11,10,.9))"></div>
 <h1 class="anton" style="position:absolute;left:16px;top:90px;font-size:78px">Thirty<br>styles<br>a year.</h1>
 <div style="position:absolute;left:16px;right:16px;bottom:24px"><p style="font-size:13px;line-height:1.5">Clothes made in four factories we have been to, sold at one price all year.</p>
 <p class="mono" style="margin-top:10px;color:var(--signal)">Swipe the rail &rarr;</p></div>
</section>
<section style="padding:26px 0 30px;overflow:hidden">
 <p class="mono" style="padding:0 16px;color:var(--dim)">The rail &mdash; drag or scroll</p>
 <div style="display:flex;gap:14px;padding:16px 16px 0">
  ${['knit','cardigan','jean'].map((id,i)=>{const g=G.find(x=>x.id===id)
  return `<figure style="width:230px;flex:none;opacity:${i===0?1:.55}"><div class="duo" style="height:290px"><img src="${img(PHOTO[id])}"></div>
  <figcaption style="margin-top:10px"><p class="anton" style="font-size:20px">${g.n}</p><p class="mono" style="margin-top:6px;color:var(--dim)">&pound;${g.p}</p></figcaption></figure>`}).join('')}
 </div>
</section>
<section style="background:var(--bone);color:var(--black);padding:30px 16px 40px">
 <h2 class="anton" style="font-size:54px">The index</h2>
 <div style="display:flex;gap:6px;overflow:hidden;padding:14px 0;margin-top:14px;border-top:2px solid var(--black);border-bottom:1px solid rgba(11,11,10,.2)">
  ${[['All',9,1],['Shirts',2],['Outerwear',2],['Trousers',3]].map(c=>`<span class="mono" style="padding:10px 12px;white-space:nowrap;border:1px solid ${c[2]?'var(--black)':'rgba(11,11,10,.2)'};background:${c[2]?'var(--black)':'transparent'};color:${c[2]?'var(--bone)':'var(--black)'}">${c[0]} (${c[1]})</span>`).join('')}
  <span class="mono" style="padding:10px 12px;white-space:nowrap;border:1px solid rgba(11,11,10,.2);opacity:.5">Knitw&hellip;</span></div>
 <p class="mono" style="margin-top:12px;color:rgba(11,11,10,.6)">Showing 9 of 9 garments</p>
 ${G.slice(0,2).map(mtile).join('')}
</section>
<section style="padding:26px 16px 36px">
 <div style="display:flex;justify-content:space-between;align-items:baseline"><h2 class="anton" style="font-size:40px">Your bag</h2><span class="mono">Close</span></div>
 ${[['The Oxford Shirt','M',78,'oxford'],['Lambswool Crew','M',135,'knit']].map(a=>`
 <div style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--line)">
  <div class="duo" style="width:46px;height:58px;flex:none"><img src="${img(PHOTO[a[3]])}"></div>
  <div style="flex:1"><p style="font-size:14px">${a[0]}</p><p class="mono" style="margin-top:5px;color:var(--dim)">Size ${a[1]}</p></div>
  <span class="mono">&pound;${a[2]}</span><span class="mono" style="color:var(--signal)">Remove</span></div>`).join('')}
 <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:16px"><span class="mono">Subtotal</span><span class="anton" style="font-size:32px">&pound;213.00</span></div>
 <div style="margin-top:12px;height:3px;background:var(--line)"><div style="width:100%;height:3px;background:var(--signal)"></div></div>
 <p class="mono" style="margin-top:8px">Delivery free &mdash; over &pound;100</p>
 <div class="mono" style="margin-top:16px;background:var(--signal);color:#fff;padding:16px;text-align:center">Checkout &mdash; &pound;213.00</div>
</section>
<section style="padding:26px 16px 40px;border-top:1px solid var(--line)">
 <h2 class="anton" style="font-size:40px">Measure</h2>
 <table style="width:100%;border-collapse:collapse;margin-top:16px">
  <tr class="mono" style="color:var(--dim)"><td style="padding:9px 0;border-bottom:1px solid var(--bone)">Size</td><td style="border-bottom:1px solid var(--bone)">Chest</td><td style="border-bottom:1px solid var(--bone)">Waist</td><td style="border-bottom:1px solid var(--bone)">Sleeve</td></tr>
  ${CHART.map(r=>`<tr><td class="mono" style="padding:12px 0;border-bottom:1px solid var(--line)">${r[0]}</td><td style="border-bottom:1px solid var(--line);font-size:15px">${r[1]}</td><td style="border-bottom:1px solid var(--line);font-size:15px">${r[2]}</td><td style="border-bottom:1px solid var(--line);font-size:15px">${r[3]}</td></tr>`).join('')}</table>
 <p style="font-size:13.5px;line-height:1.55;margin-top:14px">Between two sizes? Everything except the knitwear is cut with room, so take the smaller one.</p>
</section>
<script src="pixel.js"></script><script src="pixel.js"></script></body></html>`)
console.log('b2 b3 written')
