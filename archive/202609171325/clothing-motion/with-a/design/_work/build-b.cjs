// Direction B — "The Rail": cinematic photographic, pixel-quantised duotone, horizontal travel
const fs=require('fs'), D=require('./data.cjs')
const {G,SIZES,CHART,CARE,SHIP,REVIEWS,ABOUT}=D
const img=f=>`img/${f}`

// photographic stand-ins (contextual clothing photography, graded to one treatment)
const PHOTO={oxford:'g-hangers.jpg',tee:'g-knitfold.jpg',chore:'g-jacketflat.jpg',overshirt:'g-woolcoat.jpg',
 trouser:'g-trouserflat.jpg',jean:'g-denimdetail.jpg',knit:'g-knitform.jpg',cardigan:'g-knitpurple.jpg',shorts:'g-shorts.jpg'}

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--black:#0B0B0A;--bone:#F3EFE6;--signal:#D9531E;--dim:rgba(243,239,230,.55);--line:rgba(243,239,230,.16)}
body{background:var(--black);color:var(--bone);font-family:'Space Grotesk',sans-serif;-webkit-font-smoothing:antialiased}
.anton{font-family:Anton,sans-serif;font-weight:400;text-transform:uppercase;line-height:.82;letter-spacing:-.01em}
.mono{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase}
.duo{position:relative;overflow:hidden;background:#1a0f08;isolation:isolate}
.duo img{width:100%;height:100%;object-fit:cover;display:block;filter:grayscale(1) contrast(1.55) brightness(.82);mix-blend-mode:screen}
.duo::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,var(--signal),#7A2A0B);mix-blend-mode:multiply;opacity:.8;pointer-events:none}
.duo.cool::after{background:#2B4C7E;opacity:.42}
.px{position:relative;overflow:hidden;background:#1a0f08;isolation:isolate}
.px img{image-rendering:pixelated;transform-origin:top left;display:block;filter:grayscale(1) contrast(1.6) brightness(.85);mix-blend-mode:screen}
.px::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,var(--signal),#7A2A0B);mix-blend-mode:multiply;opacity:.8}
section{position:relative}
.bone{background:var(--bone);color:var(--black)}
.bone .mono{color:rgba(11,11,10,.6)}
table{width:100%;border-collapse:collapse}
`
// pixelated photo: render tiny then upscale
const px=(file,w,h,blocks,cls='')=>{
  const iw=blocks, ih=Math.round(blocks*h/w), s=w/blocks
  return `<div class="px ${cls}" data-blocks="${blocks}" style="width:${w}px;height:${h}px"><img src="${img(file)}" style="width:${iw}px;height:${ih}px;transform:scale(${s})"></div>`
}
const pxFill=(file,blocks,cls='')=>`<div class="px ${cls}" data-blocks="${blocks}" style="position:absolute;inset:0"><img src="${img(file)}" style="width:${blocks}px;height:${Math.round(blocks*0.58)}px;transform:scale(${1440/blocks});"></div>`

const sizeRow=(g,chosen,dark=true)=>`<div style="display:flex;gap:6px;margin-top:12px">`+SIZES.map(s=>{
 const sold=g.s.includes(s),on=s===chosen
 return `<span class="mono" style="padding:9px 0;width:42px;text-align:center;border:1px solid ${on?'var(--signal)':dark?'var(--line)':'rgba(11,11,10,.2)'};background:${on?'var(--signal)':'transparent'};color:${on?'#fff':sold?(dark?'rgba(243,239,230,.28)':'rgba(11,11,10,.3)'):'inherit'};${sold?'text-decoration:line-through;':''}">${s}</span>`}).join('')+`</div>`

const HERO=`
<section style="height:880px;overflow:hidden">
 <div class="duo" style="position:absolute;inset:0"><img src="${img('g-rail.jpg')}"></div>
 <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,10,.55),rgba(11,11,10,.2) 40%,rgba(11,11,10,.92))"></div>
 <div style="position:absolute;left:36px;right:36px;top:54px;display:flex;justify-content:space-between;align-items:center">
  <span class="mono">Marlow &amp; Vale</span>
  <span class="mono">Index &nbsp;&nbsp; Measure &nbsp;&nbsp; Care &nbsp;&nbsp; Shipping &nbsp;&nbsp; Bag (2)</span>
 </div>
 <h1 class="anton" style="position:absolute;left:30px;right:30px;top:170px;font-size:236px">Thirty<br>styles<br>a year.</h1>
 <div style="position:absolute;left:36px;right:36px;bottom:46px;display:flex;justify-content:space-between;align-items:flex-end">
  <p style="max-width:390px;font-size:15px;line-height:1.5">Clothes made in four factories we have been to, sold at one price all year. Eleven people, one shop in Leeds.</p>
  <p class="mono" style="color:var(--signal)">Scroll &mdash; the rail moves &rarr;</p>
 </div>
</section>`

const RAIL=`
<section style="height:840px;overflow:hidden;border-top:1px solid var(--line)">
 <div style="position:absolute;inset:0;opacity:.3">${'<div class="duo cool" style="position:absolute;inset:0"><img src="'+img('g-hangers.jpg')+'"></div>'}</div>
 <div style="position:absolute;left:0;right:0;top:84px;height:3px;background:var(--dim)"></div>
 <div style="position:absolute;left:-64px;top:104px;display:flex;gap:34px;align-items:flex-start">
  ${['chore','overshirt','knit','cardigan','jean'].map((id,i)=>{
    const g=G.find(x=>x.id===id)
    return `<figure style="width:${i===2?420:330}px;transform:translateY(${[36,0,74,8,52][i]}px);opacity:${i===2?1:.62}">
      <div class="duo" style="height:${i===2?430:350}px"><img src="${img(PHOTO[id])}"></div>
      <figcaption style="margin-top:14px"><p class="anton" style="font-size:${i===2?30:22}px">${g.n}</p>
      <p class="mono" style="margin-top:8px;color:var(--dim)">${g.c} &mdash; &pound;${g.p}</p></figcaption>
    </figure>`}).join('')}
 </div>
 <div style="position:absolute;left:36px;bottom:40px;right:36px;display:flex;justify-content:space-between;align-items:flex-end">
  <p class="anton" style="font-size:52px;background:var(--black);padding:6px 10px 10px;display:inline-block">The rail<br>travels</p>
  <p class="mono" style="color:var(--dim);max-width:300px;text-align:right;line-height:2">Vertical scroll drives the rail sideways.<br>Three depth layers move at different rates.</p>
 </div>
</section>`

const PANEL=`
<section style="height:840px;overflow:hidden;border-top:1px solid var(--line)">
 <div class="duo" style="position:absolute;inset:0"><img src="${img('g-knitform.jpg')}"></div>
 <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,11,10,.92) 34%,rgba(11,11,10,.1))"></div>
 <div style="position:absolute;left:36px;top:80px;width:520px">
  <p class="mono" style="color:var(--signal)">07 / 09 &mdash; Knitwear</p>
  <h2 class="anton" style="font-size:96px;margin-top:16px">Lambswool<br>Crew</h2>
  <p style="font-size:17px;line-height:1.5;margin-top:22px">Fully fashioned, so the panels are knitted to shape rather than cut out of a sheet of fabric.</p>
  <p class="mono" style="margin-top:18px;color:var(--dim)">100% lambswool, spun in Scotland</p>
  <p class="mono" style="margin-top:8px;color:var(--dim)">Navy / Grey melange / Rust</p>
  ${sizeRow(G.find(g=>g.id==='knit'),'M')}
  <p class="mono" style="margin-top:10px;color:var(--dim)">L is sold out</p>
  <div style="display:flex;gap:12px;align-items:center;margin-top:20px">
   <span class="anton" style="font-size:44px">&pound;135</span>
   <span class="mono" style="background:var(--signal);color:#fff;padding:15px 30px">Add to bag</span>
  </div>
 </div>
 <p class="mono" style="position:absolute;right:36px;bottom:40px;color:var(--dim)">Representative imagery &mdash; not a photograph of this garment</p>
</section>`

const INDEX=`
<section class="bone" style="padding:60px 36px 80px">
 <div style="display:flex;justify-content:space-between;align-items:flex-end">
  <h2 class="anton" style="font-size:112px">The index</h2>
  <p class="mono">Showing 9 of 9 garments</p>
 </div>
 <div style="display:flex;gap:8px;padding:16px 0;margin-top:20px;border-top:2px solid var(--black);border-bottom:1px solid rgba(11,11,10,.2);position:sticky;top:0;background:var(--bone);z-index:20">
  ${[['All',9,1],['Shirts',2],['Outerwear',2],['Trousers',3],['Knitwear',2]].map(c=>`<span class="mono" style="padding:9px 15px;border:1px solid ${c[2]?'var(--black)':'rgba(11,11,10,.2)'};background:${c[2]?'var(--black)':'transparent'};color:${c[2]?'var(--bone)':'var(--black)'}">${c[0]} (${c[1]})</span>`).join('')}
 </div>
 <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:44px 26px;margin-top:34px">
  ${G.map((g,i)=>`<article>
   <div class="duo" style="height:330px"><img src="${img(PHOTO[g.id])}"></div>
   <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:14px"><h3 class="anton" style="font-size:28px">${g.n}</h3><span class="mono">&pound;${g.p}</span></div>
   <p class="mono" style="margin-top:8px">${g.c} &mdash; ${g.col.join(' / ')}</p>
   <p style="font-size:13px;line-height:1.5;margin-top:8px">${g.f}</p>
   <p style="font-size:13px;line-height:1.5;margin-top:6px;opacity:.65">${g.d}</p>
   ${sizeRow(g,i===0?'M':null,false)}
   <div class="mono" style="margin-top:12px;padding:12px;text-align:center;${i===0?'background:var(--signal);color:#fff':'border:1px solid rgba(11,11,10,.25);opacity:.5'}">${i===0?'Add to bag':'Choose a size'}</div>
  </article>`).join('')}
 </div>
</section>`

const BAG=`
<section style="padding:64px 36px;display:grid;grid-template-columns:1fr 1fr;gap:60px;border-top:1px solid var(--line)">
 <div>
  <h2 class="anton" style="font-size:72px">Your bag</h2>
  <div style="margin-top:24px;border-top:1px solid var(--bone)">
  ${[['The Oxford Shirt','M',78,'oxford'],['Lambswool Crew','M',135,'knit']].map(a=>`
   <div style="display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid var(--line)">
    <div class="duo" style="width:52px;height:64px;flex:none"><img src="${img(PHOTO[a[3]])}"></div>
    <div style="flex:1"><p style="font-size:15px">${a[0]}</p><p class="mono" style="margin-top:5px;color:var(--dim)">Size ${a[1]}</p></div>
    <span class="mono">&pound;${a[2]}</span><span class="mono" style="color:var(--signal)">Remove</span></div>`).join('')}
  </div>
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:18px"><span class="mono">Subtotal</span><span class="anton" style="font-size:40px">&pound;213.00</span></div>
  <div style="margin-top:14px;height:3px;background:var(--line)"><div style="width:100%;height:3px;background:var(--signal)"></div></div>
  <p class="mono" style="margin-top:10px">Delivery free &mdash; over &pound;100</p>
  <div class="mono" style="margin-top:20px;background:var(--signal);color:#fff;padding:15px;text-align:center">Checkout &mdash; &pound;213.00</div>
 </div>
 <div>
  <h2 class="anton" style="font-size:72px">Measure</h2>
  <p class="mono" style="margin-top:10px;color:var(--dim)">On the body, in centimetres</p>
  <table style="margin-top:20px">
   <tr class="mono" style="color:var(--dim)"><td style="padding:9px 0;border-bottom:1px solid var(--bone)">Size</td><td style="border-bottom:1px solid var(--bone)">Chest</td><td style="border-bottom:1px solid var(--bone)">Waist</td><td style="border-bottom:1px solid var(--bone)">Sleeve</td></tr>
   ${CHART.map(r=>`<tr><td class="mono" style="padding:12px 0;border-bottom:1px solid var(--line)">${r[0]}</td><td style="border-bottom:1px solid var(--line);font-size:15px">${r[1]}</td><td style="border-bottom:1px solid var(--line);font-size:15px">${r[2]}</td><td style="border-bottom:1px solid var(--line);font-size:15px">${r[3]}</td></tr>`).join('')}
  </table>
  <p style="font-size:14px;line-height:1.55;margin-top:16px">Between two sizes? Everything except the knitwear is cut with room, so take the smaller one.</p>
 </div>
</section>`

const CARESEC=`
<section style="padding:64px 36px;border-top:1px solid var(--line)">
 <h2 class="anton" style="font-size:72px">Keeping it</h2>
 <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:30px">
  ${CARE.map((c,i)=>`<div style="border-top:1px solid var(--signal);padding-top:12px"><p class="mono" style="color:var(--signal);margin-bottom:10px">${String(i+1).padStart(2,'0')}</p><p style="font-size:14px;line-height:1.55">${c}</p></div>`).join('')}
 </div>
</section>`

const SHIPSEC=`
<section class="bone" style="padding:64px 36px;display:grid;grid-template-columns:1fr 1fr;gap:56px">
 <div><h2 class="anton" style="font-size:60px">Getting it,<br>sending it back</h2>
 <div style="margin-top:22px">${SHIP.map(s=>`<p style="font-size:14.5px;line-height:1.6;padding:12px 0;border-bottom:1px solid rgba(11,11,10,.18)">${s}</p>`).join('')}</div></div>
 <div><h2 class="anton" style="font-size:60px">What people<br>said</h2>
 <div style="margin-top:22px">${REVIEWS.map(r=>`<div style="padding:16px 0;border-bottom:1px solid rgba(11,11,10,.18)"><p style="font-size:15px;line-height:1.55">${r.text}</p><p class="mono" style="margin-top:10px">${r.name} &mdash; bought the ${r.bought}</p></div>`).join('')}</div></div>
</section>`

const ABOUTSEC=`
<section style="padding:70px 36px 60px;border-top:1px solid var(--line)">
 <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:30px">
  ${ABOUT.map((a,i)=>`<div><p class="anton" style="font-size:72px;color:var(--signal)">${String(i+1).padStart(2,'0')}</p><p style="font-size:16px;line-height:1.5;margin-top:12px">${a}</p></div>`).join('')}
 </div>
 <div style="margin-top:70px;border-top:1px solid var(--bone);padding-top:20px;display:flex;justify-content:space-between;align-items:flex-end">
  <p class="anton" style="font-size:150px">Marlow<br>&amp; Vale</p>
  <p class="mono" style="text-align:right;line-height:2.2;color:var(--dim)">One shop, Leeds<br>Never any sales<br>Imagery is representative, not inventory photography</p>
 </div>
</section>`

fs.writeFileSync(__dirname+'/b1.html',`<html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${HERO}${RAIL}${PANEL}${INDEX}${BAG}${CARESEC}${SHIPSEC}${ABOUTSEC}<script src="pixel.js"></script><script src="pixel.js"></script></body></html>`)
console.log('b1 written')
