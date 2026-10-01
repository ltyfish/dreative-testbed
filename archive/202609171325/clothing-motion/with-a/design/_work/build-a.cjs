const fs=require('fs'), F=require('./flats.cjs'), D=require('./data.cjs')
const {G,SIZES,CHART,CARE,SHIP,REVIEWS,ABOUT}=D
const img=f=>`img/${f}`
const count=c=>G.filter(g=>g.c===c).length

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--paper:#E9E4DA;--ink:#14120E;--indigo:#22304E;--thread:#9C3A26;--rule:rgba(20,18,14,.18)}
body{background:var(--paper);color:var(--ink);font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased}
.mono{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase}
.disp{font-family:'Bodoni Moda',serif;font-weight:400;line-height:.86;letter-spacing:-.015em}
.cloth{filter:grayscale(1) sepia(.3) saturate(.75) contrast(1.06) brightness(1.03);object-fit:cover;width:100%;height:100%;display:block}
.clothwrap{position:relative;overflow:hidden;background:#cfc7b8}
.bar{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:54px;border-bottom:1px solid var(--rule);background:rgba(233,228,218,.9)}
.bar b{font-family:'Bodoni Moda',serif;font-weight:500;font-size:17px;letter-spacing:.02em}
.navl{display:flex;gap:26px}
section{position:relative}
.rule{border-top:1px solid var(--rule)}
.flat svg{width:100%;height:100%;display:block}
table{width:100%;border-collapse:collapse}
`

const sizeRow=(g,chosen)=>`<div style="display:flex;gap:6px;margin-top:10px">`+SIZES.map(s=>{
  const sold=g.s.includes(s); const on=s===chosen
  return `<span class="mono" style="padding:6px 0;width:38px;text-align:center;border:1px solid ${on?'var(--ink)':'var(--rule)'};background:${on?'var(--ink)':'transparent'};color:${on?'var(--paper)':sold?'rgba(20,18,14,.3)':'var(--ink)'};${sold?'text-decoration:line-through;':''}">${s}</span>`
}).join('')+`</div>`

const DARK={chore:1,jean:1,cardigan:1,trouser:0,knit:0};
const tile=(g,i)=>`
<article style="border-top:1px solid var(--rule);padding-top:14px">
  <div class="clothwrap" style="height:300px">
    <img class="cloth" src="${img(g.cloth)}">
    <div class="flat" style="position:absolute;inset:0;display:grid;place-items:center;padding:24px 0">
      <div style="width:54%;height:100%;color:${DARK[g.id]?'rgba(236,231,221,.95)':'rgba(20,18,14,.92)'}">${F[g.id]}</div>
    </div>
    <span class="mono" style="position:absolute;left:10px;top:10px;opacity:.65;color:${DARK[g.id]?'#ECE7DD':'inherit'}">${String(i+1).padStart(2,'0')}</span>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:12px">
    <h3 class="disp" style="font-size:24px">${g.n}</h3>
    <span class="mono" style="font-size:12px">&pound;${g.p}</span>
  </div>
  <p class="mono" style="margin-top:6px;opacity:.6">${g.c} &middot; ${g.col.join(' / ')}</p>
  <p style="font-size:12.5px;line-height:1.5;margin-top:8px;opacity:.78">${g.f}</p>
  <p style="font-size:12.5px;line-height:1.5;margin-top:6px;opacity:.6">${g.d}</p>
  ${sizeRow(g, i===0?'M':null)}
  <div class="mono" style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--ink);padding:9px 12px;${i===0?'background:var(--ink);color:var(--paper)':'opacity:.45'}">
    <span>${i===0?'Add to bag':'Choose a size'}</span><span>${i===0?'&rarr;':''}</span>
  </div>
</article>`

const chip=(l,n,on)=>`<span class="mono" style="padding:8px 14px;border:1px solid ${on?'var(--ink)':'var(--rule)'};background:${on?'var(--ink)':'transparent'};color:${on?'var(--paper)':'var(--ink)'}">${l} <span style="opacity:.55">(${n})</span></span>`

const HERO=`
<section style="height:860px" class="clothwrap">
  <img class="cloth" src="${img('cloth-linen-c.jpg')}" style="position:absolute;inset:0">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(233,228,218,.15),rgba(233,228,218,.6))"></div>
  <div style="position:absolute;right:40px;top:120px;width:200px;opacity:.15" class="flat">${F.oxford}</div>
  <div style="position:absolute;left:40px;right:40px;top:110px;z-index:3">
    <p class="mono" style="margin-bottom:28px">Marlow &amp; Vale &mdash; Leeds &mdash; Autumn index</p>
    <h1 class="disp" style="font-size:168px">Cloth first.<br><em>Then</em> the garment.</h1>
  </div>
  <div style="position:absolute;left:40px;bottom:44px;right:40px;display:flex;justify-content:space-between;align-items:flex-end;z-index:3">
    <p style="max-width:340px;font-size:14px;line-height:1.55">Clothes made in four factories we have been to, sold at one price all year.</p>
    <p class="mono">Scroll &mdash; the weave resolves &darr;</p>
  </div>
</section>`

const RESOLVE=`
<section style="height:860px" class="clothwrap">
  <img class="cloth" src="${img('cloth-fine.jpg')}" style="position:absolute;inset:0;transform:scale(1.2)">
  <div style="position:absolute;inset:0;background:radial-gradient(58% 58% at 50% 50%,rgba(233,228,218,.5),rgba(233,228,218,.06))"></div>
  <div style="position:absolute;inset:0;display:grid;place-items:center">
    <div style="width:340px;height:760px;color:var(--thread)" class="flat">${F.oxford}</div>
  </div>
  <div style="position:absolute;left:40px;top:96px;z-index:4">
    <p class="mono" style="opacity:.6">01 / 09</p>
    <h2 class="disp" style="font-size:62px;margin-top:12px">The Oxford<br>Shirt</h2>
    <p class="mono" style="margin-top:16px">&pound;78 &mdash; Shirts</p>
  </div>
  <div style="position:absolute;right:40px;top:130px;width:250px;text-align:right;z-index:4">
    <p class="mono" style="opacity:.55;margin-bottom:8px">Cloth</p>
    <p style="font-size:13px;line-height:1.55">100% long-staple cotton oxford, 140gsm, woven in Portugal</p>
    <p class="mono" style="opacity:.55;margin:18px 0 8px">Cut</p>
    <p style="font-size:13px;line-height:1.55">Cut straight through the body with a soft collar that stands without fusing.</p>
    <p class="mono" style="opacity:.55;margin:18px 0 8px">Colours</p>
    <p style="font-size:13px">White / Pale blue / Faded navy</p>
  </div>
  <div style="position:absolute;left:40px;bottom:44px;right:40px;display:flex;justify-content:space-between;align-items:flex-end;z-index:4">
    <p class="mono">Drawing, not a photograph</p>
    <p class="mono">Nine of these, then the index &darr;</p>
  </div>
</section>`

const SHOP=`
<section style="padding:64px 40px 90px">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:26px">
    <h2 class="disp" style="font-size:78px">The index</h2>
    <p class="mono" style="text-align:right;line-height:1.8">Showing 9 of 9 garments</p>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;padding:16px 0;border-top:1px solid var(--ink);border-bottom:1px solid var(--rule);position:sticky;top:54px;background:var(--paper);z-index:30">
    ${chip('All',9,true)}${chip('Shirts',count('Shirts'))}${chip('Outerwear',count('Outerwear'))}${chip('Trousers',count('Trousers'))}${chip('Knitwear',count('Knitwear'))}
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:40px 28px;margin-top:34px">
    ${G.map(tile).join('')}
  </div>
</section>`

const BAG=`
<section class="rule" style="padding:64px 40px;display:grid;grid-template-columns:1.05fr 1fr;gap:64px">
  <div>
    <h2 class="disp" style="font-size:64px">Your bag</h2>
    <div style="margin-top:26px;border-top:1px solid var(--ink)">
      ${[['The Oxford Shirt','M',78,'cloth-fine.jpg'],['Lambswool Crew','M',135,'cloth-alpaca.jpg']].map(a=>`
      <div style="display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid var(--rule)">
        <div class="clothwrap" style="width:54px;height:66px;flex:none"><img class="cloth" src="${img(a[3])}"></div>
        <div style="flex:1"><p style="font-size:15px">${a[0]}</p><p class="mono" style="opacity:.6;margin-top:4px">Size ${a[1]}</p></div>
        <span class="mono" style="font-size:12px">&pound;${a[2]}</span>
        <span class="mono" style="opacity:.5;text-decoration:underline">Remove</span>
      </div>`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:18px"><span class="mono">Subtotal</span><span class="disp" style="font-size:32px">&pound;213.00</span></div>
    <div style="margin-top:16px;height:3px;background:var(--rule)"><div style="width:100%;height:3px;background:var(--thread)"></div></div>
    <p class="mono" style="margin-top:10px">Delivery free &mdash; over &pound;100</p>
    <div class="mono" style="margin-top:22px;background:var(--ink);color:var(--paper);padding:14px;text-align:center">Checkout &mdash; &pound;213.00</div>
  </div>
  <div>
    <h3 class="disp" style="font-size:44px">Measure, don&rsquo;t guess.</h3>
    <p class="mono" style="opacity:.6;margin-top:10px">Measured on the body, in centimetres</p>
    <table style="margin-top:22px">
      <tr class="mono" style="opacity:.6"><td style="padding:8px 0;border-bottom:1px solid var(--ink)">Size</td><td style="border-bottom:1px solid var(--ink)">Chest</td><td style="border-bottom:1px solid var(--ink)">Waist</td><td style="border-bottom:1px solid var(--ink)">Sleeve</td></tr>
      ${CHART.map(r=>`<tr><td class="mono" style="padding:11px 0;border-bottom:1px solid var(--rule);font-size:12px">${r[0]}</td><td style="border-bottom:1px solid var(--rule);font-size:14px">${r[1]}</td><td style="border-bottom:1px solid var(--rule);font-size:14px">${r[2]}</td><td style="border-bottom:1px solid var(--rule);font-size:14px">${r[3]}</td></tr>`).join('')}
    </table>
    <p style="font-size:14px;line-height:1.55;margin-top:18px;max-width:420px">Between two sizes? Everything except the knitwear is cut with room, so take the smaller one.</p>
  </div>
</section>`

const CARESEC=`
<section class="clothwrap rule" style="padding:70px 40px;min-height:400px">
  <img class="cloth" src="${img('cloth-linen-b.jpg')}" style="position:absolute;inset:0;opacity:.28">
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(233,228,218,.92),rgba(233,228,218,.7))"></div>
  <div style="position:relative">
    <h2 class="disp" style="font-size:64px;margin-bottom:34px">Keeping it</h2>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:26px">
      ${CARE.map((c,i)=>`<div style="border-top:1px solid var(--ink);padding-top:12px"><p class="mono" style="opacity:.55;margin-bottom:10px">${String(i+1).padStart(2,'0')}</p><p style="font-size:14px;line-height:1.55">${c}</p></div>`).join('')}
    </div>
  </div>
</section>`

const SHIPSEC=`
<section class="rule" style="padding:70px 40px;display:grid;grid-template-columns:1fr 1fr;gap:64px">
  <div>
    <h2 class="disp" style="font-size:54px">Getting it,<br>and sending it back</h2>
    <div style="margin-top:24px">${SHIP.map(s=>`<p style="font-size:14.5px;line-height:1.6;padding:12px 0;border-bottom:1px solid var(--rule)">${s}</p>`).join('')}</div>
  </div>
  <div>
    <h2 class="disp" style="font-size:54px">What people<br>said</h2>
    <div style="margin-top:24px">${REVIEWS.map(r=>`<div style="padding:16px 0;border-bottom:1px solid var(--rule)"><p style="font-size:15px;line-height:1.55">${r.text}</p><p class="mono" style="margin-top:10px;opacity:.6">${r.name} &mdash; bought the ${r.bought}</p></div>`).join('')}</div>
  </div>
</section>`

const ABOUTSEC=`
<section class="rule" style="padding:70px 40px 70px">
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:34px">
    ${ABOUT.map((a,i)=>`<div><p class="disp" style="font-size:64px;opacity:.22">${String(i+1).padStart(2,'0')}</p><p style="font-size:16px;line-height:1.5;margin-top:10px">${a}</p></div>`).join('')}
  </div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:72px;border-top:1px solid var(--ink);padding-top:18px">
    <p class="disp" style="font-size:96px">Marlow &amp; Vale</p>
    <p class="mono" style="text-align:right;line-height:2">One shop, Leeds<br>Never any sales</p>
  </div>
</section>`

const BARHTML=`<div class="bar"><b>Marlow &amp; Vale</b><div class="navl mono"><span>Index</span><span>Measure</span><span>Care</span><span>Shipping</span><span>About</span></div><span class="mono">Bag (2)</span></div>`

fs.writeFileSync(__dirname+'/a1.html',`<html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${BARHTML}${HERO}${RESOLVE}${SHOP}${BAG}${CARESEC}${SHIPSEC}${ABOUTSEC}</body></html>`)
console.log('a1 written')
