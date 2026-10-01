// Direction A — mobile study, 390px
const fs=require('fs'), F=require('./flats.cjs'), D=require('./data.cjs')
const {G,SIZES,CHART}=D
const img=f=>`img/${f}`
const DARK={chore:1,jean:1,cardigan:1}
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--paper:#E9E4DA;--ink:#14120E;--thread:#9C3A26;--rule:rgba(20,18,14,.18)}
body{background:var(--paper);color:var(--ink);font-family:Archivo,sans-serif;width:390px}
.mono{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.13em;text-transform:uppercase}
.disp{font-family:'Bodoni Moda',serif;font-weight:400;line-height:.88;letter-spacing:-.015em}
.cloth{filter:grayscale(1) sepia(.3) saturate(.75) contrast(1.06) brightness(1.03);object-fit:cover;width:100%;height:100%;display:block}
.clothwrap{position:relative;overflow:hidden;background:#cfc7b8}
.flat svg{width:100%;height:100%;display:block}
`
const size=(g,chosen)=>`<div style="display:flex;gap:6px;margin-top:10px">`+SIZES.map(s=>{
 const sold=g.s.includes(s),on=s===chosen
 return `<span class="mono" style="flex:1;padding:12px 0;text-align:center;border:1px solid ${on?'var(--ink)':'var(--rule)'};background:${on?'var(--ink)':'transparent'};color:${on?'var(--paper)':sold?'rgba(20,18,14,.3)':'var(--ink)'};${sold?'text-decoration:line-through;':''}">${s}</span>`}).join('')+`</div>`

const tile=(g,i)=>`
<article style="border-top:1px solid var(--rule);padding-top:12px;margin-top:26px">
 <div class="clothwrap" style="height:330px"><img class="cloth" src="${img(g.cloth)}">
  <div class="flat" style="position:absolute;inset:0;display:grid;place-items:center;padding:26px 0"><div style="width:56%;height:100%;color:${DARK[g.id]?'rgba(236,231,221,.95)':'rgba(20,18,14,.92)'}">${F[g.id]}</div></div>
  <span class="mono" style="position:absolute;left:10px;top:10px;opacity:.65;color:${DARK[g.id]?'#ECE7DD':'inherit'}">${String(i+1).padStart(2,'0')}</span>
 </div>
 <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:12px"><h3 class="disp" style="font-size:26px">${g.n}</h3><span class="mono" style="font-size:12px">&pound;${g.p}</span></div>
 <p class="mono" style="margin-top:6px;opacity:.6">${g.c} &middot; ${g.col.join(' / ')}</p>
 <p style="font-size:13px;line-height:1.5;margin-top:8px;opacity:.78">${g.f}</p>
 <p style="font-size:13px;line-height:1.5;margin-top:6px;opacity:.6">${g.d}</p>
 ${size(g,i===0?'M':null)}
 <div class="mono" style="margin-top:10px;border:1px solid var(--ink);padding:14px;text-align:center;${i===0?'background:var(--ink);color:var(--paper)':'opacity:.45'}">${i===0?'Add to bag &mdash; &pound;'+g.p:'Choose a size'}</div>
</article>`

const html=`<html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div style="position:sticky;top:0;z-index:40;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px;border-bottom:1px solid var(--rule);background:rgba(233,228,218,.94)">
 <b class="disp" style="font-size:16px">Marlow &amp; Vale</b><span class="mono">Menu &nbsp; Bag (2)</span></div>

<section class="clothwrap" style="height:560px">
 <img class="cloth" src="${img('cloth-linen-c.jpg')}" style="position:absolute;inset:0">
 <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(233,228,218,.12),rgba(233,228,218,.6))"></div>
 <div style="position:absolute;left:16px;right:16px;top:60px"><p class="mono" style="margin-bottom:18px">Leeds &mdash; Autumn index</p>
 <h1 class="disp" style="font-size:66px">Cloth first.<br><em>Then</em> the garment.</h1></div>
 <div style="position:absolute;left:16px;right:16px;bottom:22px"><p style="font-size:13px;line-height:1.5">Clothes made in four factories we have been to, sold at one price all year.</p>
 <p class="mono" style="margin-top:12px">Scroll &mdash; the weave resolves &darr;</p></div>
</section>

<section class="clothwrap" style="height:620px">
 <img class="cloth" src="${img('cloth-fine.jpg')}" style="position:absolute;inset:0;transform:scale(1.5)">
 <div style="position:absolute;inset:0;background:radial-gradient(60% 46% at 50% 54%,rgba(233,228,218,.62),rgba(233,228,218,.04))"></div>
 <div style="position:absolute;left:16px;top:26px"><p class="mono" style="opacity:.6">01 / 09</p><h2 class="disp" style="font-size:36px;margin-top:8px">The Oxford Shirt</h2><p class="mono" style="margin-top:10px">&pound;78 &mdash; Shirts</p></div>
 <div style="position:absolute;inset:0;display:grid;place-items:center;padding-top:60px"><div style="width:190px;height:430px;color:var(--thread)" class="flat">${F.oxford}</div></div>
 <p class="mono" style="position:absolute;left:16px;bottom:18px">Drawing, not a photograph</p>
</section>

<section style="padding:30px 16px 20px">
 <h2 class="disp" style="font-size:44px">The index</h2>
 <div style="display:flex;gap:6px;overflow:hidden;padding:14px 0;margin-top:14px;border-top:1px solid var(--ink);border-bottom:1px solid var(--rule);position:sticky;top:48px;background:var(--paper);z-index:30">
  ${[['All',9,1],['Shirts',2],['Outerwear',2],['Trousers',3]].map(c=>`<span class="mono" style="padding:9px 12px;white-space:nowrap;border:1px solid ${c[2]?'var(--ink)':'var(--rule)'};background:${c[2]?'var(--ink)':'transparent'};color:${c[2]?'var(--paper)':'var(--ink)'}">${c[0]} (${c[1]})</span>`).join('')}
  <span class="mono" style="padding:9px 12px;white-space:nowrap;border:1px solid var(--rule);opacity:.5">Knitw&hellip;</span>
 </div>
 <p class="mono" style="margin-top:12px;opacity:.6">Showing 9 of 9 garments</p>
 ${G.slice(0,3).map(tile).join('')}
</section>

<section style="border-top:1px solid var(--ink);padding:26px 16px;background:var(--paper)">
 <div style="display:flex;justify-content:space-between;align-items:baseline"><h2 class="disp" style="font-size:36px">Your bag</h2><span class="mono">Close</span></div>
 ${[['The Oxford Shirt','M',78,'cloth-fine.jpg'],['Lambswool Crew','M',135,'cloth-alpaca.jpg']].map(a=>`
 <div style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--rule)">
  <div class="clothwrap" style="width:46px;height:58px;flex:none"><img class="cloth" src="${img(a[3])}"></div>
  <div style="flex:1"><p style="font-size:14px">${a[0]}</p><p class="mono" style="opacity:.6;margin-top:4px">Size ${a[1]}</p></div>
  <span class="mono" style="font-size:11px">&pound;${a[2]}</span><span class="mono" style="opacity:.5;text-decoration:underline">Remove</span></div>`).join('')}
 <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:16px"><span class="mono">Subtotal</span><span class="disp" style="font-size:28px">&pound;213.00</span></div>
 <div style="margin-top:12px;height:3px;background:var(--rule)"><div style="width:100%;height:3px;background:var(--thread)"></div></div>
 <p class="mono" style="margin-top:8px">Delivery free &mdash; over &pound;100</p>
 <div class="mono" style="margin-top:16px;background:var(--ink);color:var(--paper);padding:15px;text-align:center">Checkout &mdash; &pound;213.00</div>
</section>

<section style="border-top:1px solid var(--rule);padding:30px 16px">
 <h2 class="disp" style="font-size:36px">Measure, don&rsquo;t guess.</h2>
 <p class="mono" style="opacity:.6;margin-top:8px">On the body, in centimetres</p>
 <table style="width:100%;border-collapse:collapse;margin-top:16px">
  <tr class="mono" style="opacity:.6"><td style="padding:8px 0;border-bottom:1px solid var(--ink)">Size</td><td style="border-bottom:1px solid var(--ink)">Chest</td><td style="border-bottom:1px solid var(--ink)">Waist</td><td style="border-bottom:1px solid var(--ink)">Sleeve</td></tr>
  ${CHART.map(r=>`<tr><td class="mono" style="padding:11px 0;border-bottom:1px solid var(--rule);font-size:11px">${r[0]}</td><td style="border-bottom:1px solid var(--rule);font-size:14px">${r[1]}</td><td style="border-bottom:1px solid var(--rule);font-size:14px">${r[2]}</td><td style="border-bottom:1px solid var(--rule);font-size:14px">${r[3]}</td></tr>`).join('')}
 </table>
 <p style="font-size:13.5px;line-height:1.55;margin-top:14px">Between two sizes? Everything except the knitwear is cut with room, so take the smaller one.</p>
</section>
</body></html>`
fs.writeFileSync(__dirname+'/a3.html',html); console.log('a3 written')
