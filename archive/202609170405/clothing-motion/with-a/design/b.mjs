import fs from 'node:fs'
import { flat, PALETTES } from './flats.mjs'
const dataUrl = (f) => 'data:image/jpeg;base64,' + fs.readFileSync('design/' + f).toString('base64')
import { GARMENTS, SIZES, CATEGORIES, SIZE_CHART, CARE, SHIPPING, REVIEWS, ABOUT } from './content.mjs'

const F = (id, w = 200) => flat(id, PALETTES.paper, `width="${w}" height="${w * 1.5}"`)
const count = (c) => GARMENTS.filter((g) => g.category === c).length
const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

const boxes = (g, chosen) =>
  SIZES.map((s) => `<span class="sz${g.sold.includes(s) ? ' out' : ''}${s === chosen ? ' on' : ''}">${s}</span>`).join('')

const plate = (g, i) => `
<article class="pl">
  <div class="img">${F(g.id, 168)}<span class="no">PLATE ${roman[i]}</span></div>
  <div class="meta">
    <h3>${g.name}</h3>
    <p class="cat">${g.category} · £${g.price}</p>
    <p class="det">${g.detail}</p>
    <p class="fab">${g.fabric}</p>
    <p class="fab">${g.colours.join(', ')}</p>
    <div class="szrow">${boxes(g, g.id === 'jean' ? 'L' : null)}</div>
    <button class="${g.id === 'jean' ? 'go' : ''}">${g.id === 'jean' ? 'Add size L — £98' : 'Select a size'}</button>
  </div>
</article>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Roboto+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,300;6..72,400&display=swap">
<style>
:root{--paper:#efe9dd;--paper2:#e6dfd0;--ink:#16150f;--red:#b3301c;--rule:#c3bba9;--mut:#6c675b}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:Newsreader,Georgia,serif;font-size:16px;line-height:1.5}
.wrap{max-width:1340px;margin:0 auto;padding:0 50px}
.m{font-family:'Roboto Mono',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
.m.r{color:var(--red)}
h1,h2,h3{font-family:'Instrument Serif',Georgia,serif;font-weight:400;margin:0;line-height:1.02;letter-spacing:-.01em}
hr{border:0;border-top:1px solid var(--rule);margin:0}
.rule2{border-top:3px double var(--rule)}

/* masthead */
.head{display:flex;align-items:flex-end;justify-content:space-between;padding:26px 0 12px}
.head h1{font-size:54px}
.head .bag{border:1px solid var(--ink);padding:6px 14px}

/* frontispiece */
.front{display:grid;grid-template-columns:1fr 610px;gap:56px;padding:46px 0 0}
.front h2{font-size:62px;max-width:560px}
.front h2 em{font-style:italic;color:var(--red)}
.index{margin-top:40px;width:100%;border-collapse:collapse}
.index td{padding:7px 0;border-bottom:1px dotted var(--rule);font-size:15px;vertical-align:baseline}
.index td.n{width:54px;font-family:'Roboto Mono',monospace;font-size:10.5px;letter-spacing:.14em;color:var(--mut)}
.index td.p{text-align:right;font-family:'Roboto Mono',monospace;font-size:12px}
figure{margin:0}
figure canvas{width:100%;display:block;background:var(--paper2);image-rendering:pixelated}
figcaption{margin-top:10px;display:flex;justify-content:space-between;gap:20px}

/* resolve band */
.resolve{margin-top:80px;padding-top:26px}
.resolve .three{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;margin-top:26px}
.resolve h2{font-size:40px;max-width:700px;margin-top:10px}
.resolve canvas{width:100%;display:block;background:var(--paper2);image-rendering:pixelated}

/* the sheet */
.sheet{margin-top:90px;padding-top:24px}
.reg{display:flex;align-items:center;gap:22px;padding:14px 0;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);position:sticky;top:0;background:var(--paper);z-index:5}
.reg span.f{font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding-bottom:2px}
.reg span.f.on{color:var(--red);border-bottom:2px solid var(--red)}
.reg .right{margin-left:auto}
.sheetgrid{display:grid;grid-template-columns:repeat(3,1fr)}
.pl{border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:26px 26px 30px}
.pl:nth-child(3n){border-right:0}
.img{position:relative;background:var(--paper2);height:270px;display:grid;place-items:center;margin-bottom:18px}
.img .no{position:absolute;top:10px;left:12px;font-family:'Roboto Mono',monospace;font-size:10px;letter-spacing:.16em;color:var(--mut)}
.pl h3{font-size:29px}
.cat{margin:4px 0 12px;font-family:'Roboto Mono',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--red)}
.det{margin:0 0 8px;font-size:15px}
.fab{margin:0 0 3px;font-size:13px;color:var(--mut)}
.szrow{display:flex;gap:0;margin:16px 0 12px;border:1px solid var(--ink);width:max-content}
.sz{width:40px;height:32px;display:grid;place-items:center;border-right:1px solid var(--ink);font-family:'Roboto Mono',monospace;font-size:11px}
.sz:last-child{border-right:0}
.sz.on{background:var(--ink);color:var(--paper)}
.sz.out{color:#b3ac9c;background:repeating-linear-gradient(135deg,transparent 0 3px,var(--rule) 3px 4px)}
.pl button{width:100%;padding:11px;background:none;border:1px solid var(--ink);font-family:'Roboto Mono',monospace;
  font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink)}
.pl button.go{background:var(--red);border-color:var(--red);color:#fff}

/* opened plate + bag */
.open{display:grid;grid-template-columns:1fr 420px;gap:0;border-bottom:1px solid var(--rule)}
.openimg{background:var(--paper2);position:relative;display:grid;place-items:center;padding:36px;border-right:1px solid var(--rule)}
.openimg .cap{position:absolute;left:20px;bottom:18px}
.bagp{padding:30px 0 34px 34px}
.bagline{display:flex;justify-content:space-between;align-items:baseline;padding:11px 0;border-bottom:1px dotted var(--rule);font-size:15px}
.bagline s{text-decoration:none}
.tot{display:flex;justify-content:space-between;padding:14px 0;font-family:'Instrument Serif',serif;font-size:26px}
.prog{height:2px;background:var(--rule);position:relative}
.prog i{position:absolute;height:2px;background:var(--red);width:64%}
.co{margin-top:16px;width:100%;padding:14px;background:var(--ink);color:var(--paper);border:0;
  font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase}

/* ending */
.spec{margin-top:88px;padding-top:24px;display:grid;grid-template-columns:300px 1fr;gap:60px}
.specimg{background:var(--paper2);position:relative;display:grid;place-items:center}
.ann{position:absolute;font-family:'Roboto Mono',monospace;font-size:9.5px;letter-spacing:.14em;color:var(--red);text-transform:uppercase}
table.chart{width:100%;border-collapse:collapse;margin-top:16px}
table.chart th,table.chart td{text-align:left;padding:12px 8px;border-bottom:1px solid var(--rule)}
table.chart th{font-family:'Roboto Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--mut);font-weight:500}
table.chart td{font-size:16px}
table.chart td:first-child{font-family:'Instrument Serif',serif;font-size:22px;width:80px}
.advice{margin-top:20px;font-size:21px;font-family:'Instrument Serif',serif;max-width:560px}

.margin{margin-top:88px;padding-top:24px;display:grid;grid-template-columns:230px 1fr;gap:60px}
.margin .notes p{margin:0 0 18px;font-size:12.5px;color:var(--mut);font-family:'Roboto Mono',monospace;line-height:1.7;letter-spacing:.02em;text-transform:none}
.margin .big p{font-size:24px;font-family:'Instrument Serif',serif;margin:0 0 22px;padding-bottom:22px;border-bottom:1px solid var(--rule);max-width:820px}

.shiprow{margin-top:88px;padding-top:24px;display:grid;grid-template-columns:230px 1fr;gap:60px}
.shiprow ul{margin:0;padding:0;list-style:none}
.shiprow li{padding:13px 0;border-bottom:1px solid var(--rule);font-size:16px}
.quotes{margin-top:88px;padding-top:24px;display:grid;grid-template-columns:repeat(3,1fr);gap:44px}
.quotes q{font-family:'Instrument Serif',serif;font-size:23px;display:block;line-height:1.24}
.quotes cite{display:block;margin-top:16px;font-style:normal}
.colophon{margin-top:88px;padding:24px 0 70px;display:grid;grid-template-columns:repeat(3,1fr);gap:44px}
.colophon p{margin:12px 0 0;font-size:15.5px}

@media (max-width:520px){
  .wrap{padding:0 18px}
  .head{flex-direction:column;align-items:flex-start;gap:12px}
  .head h1{font-size:40px}
  .front{grid-template-columns:1fr;gap:30px;padding-top:26px}
  .front h2{font-size:38px}
  .index td{font-size:14px}
  .index td.n{width:38px}
  .resolve{margin-top:56px}
  .resolve h2,.spec h2,.shiprow h2{font-size:28px!important}
  .resolve .three{grid-template-columns:1fr;gap:18px}
  .sheet{margin-top:56px}
  .reg{gap:16px;overflow-x:auto;flex-wrap:nowrap}
  .reg span.f{flex:0 0 auto}
  .reg .right{flex:0 0 auto}
  .sheetgrid{grid-template-columns:1fr}
  .pl{border-right:0;padding:22px 0 26px}
  .img{height:250px}
  .szrow{width:100%}
  .sz{flex:1;width:auto}
  .open{grid-template-columns:1fr}
  .openimg{border-right:0;border-bottom:1px solid var(--rule);padding:24px}
  .bagp{padding:24px 0 30px}
  .spec,.margin,.shiprow{grid-template-columns:1fr;gap:26px;margin-top:56px}
  .specimg{height:320px}
  .quotes,.colophon{grid-template-columns:1fr;gap:30px;margin-top:56px}
  table.chart td{font-size:14px}
}
.foot{padding-bottom:60px;font-size:12px;color:var(--mut);max-width:760px}
</style></head><body>
<div class="wrap">

  <div class="head">
    <div><p class="m">Catalogue eleven — Leeds — no sales, ever</p><h1>Marlow &amp; Vale</h1></div>
    <span class="m bag">Bag (3) — £297.00</span>
  </div>
  <hr class="rule2">

  <section class="front">
    <div>
      <h2>Nine styles,<br>printed as <em>nine plates</em>,<br>photographed once.</h2>
      <p class="m" style="margin-top:26px">Index of plates</p>
      <table class="index">
        ${GARMENTS.map((g, i) => `<tr><td class="n">${roman[i]}</td><td>${g.name}</td><td class="m" style="text-transform:none;letter-spacing:.06em">${g.category}</td><td class="p">£${g.price}</td></tr>`).join('')}
      </table>
    </div>
    <figure>
      <canvas class="ht" data-src="${dataUrl('src/img/13915356.jpg')}" data-cell="9" width="610" height="700"></canvas>
      <figcaption><span class="m">Frontispiece — cotton, hung</span><span class="m r">Representative image · not stock</span></figcaption>
    </figure>
  </section>

  <section class="resolve">
    <hr>
    <p class="m" style="margin-top:22px">The device — every image prints as you reach it</p>
    <h2>Coarse dots first, then the photograph, in the time it takes the plate to cross the fold.</h2>
    <div class="three">
      <figure><canvas class="ht" data-src="${dataUrl('src/img/4440571.jpg')}" data-cell="22" width="400" height="300"></canvas><figcaption><span class="m">0% — entry</span></figcaption></figure>
      <figure><canvas class="ht" data-src="${dataUrl('src/img/4440571.jpg')}" data-cell="9" width="400" height="300"></canvas><figcaption><span class="m">55% — settling</span></figcaption></figure>
      <figure><canvas class="ht" data-src="${dataUrl('src/img/4440571.jpg')}" data-cell="3" width="400" height="300"></canvas><figcaption><span class="m">100% — held</span></figcaption></figure>
    </div>
  </section>

  <section class="sheet">
    <p class="m">The sheet — nine plates, filtered in place</p>
    <div class="reg">
      <span class="f on">All (9)</span>
      ${CATEGORIES.map((c) => `<span class="f">${c} (${count(c)})</span>`).join('')}
      <span class="m right">Showing 9 of 9 garments.</span>
    </div>
    <div class="sheetgrid">${GARMENTS.map(plate).join('')}</div>

    <div class="open">
      <div class="openimg">${F('jean', 300)}
        <span class="m cap">Plate VI enlarged — the same plate, lifted off the sheet</span>
      </div>
      <div class="bagp">
        <p class="m">Bag — three lines</p>
        <div class="bagline"><span>Straight Jean — size L</span><span>£98 &nbsp;<s class="m">Remove</s></span></div>
        <div class="bagline"><span>Lambswool Crew — size M</span><span>£135 &nbsp;<s class="m">Remove</s></span></div>
        <div class="bagline"><span>Heavy Cotton Tee — size S</span><span>£34 &nbsp;<s class="m">Remove</s></span></div>
        <div class="tot"><span>Subtotal</span><span>£267.00</span></div>
        <div class="prog"><i></i></div>
        <p class="m r" style="margin-top:10px">Delivery free — subtotal is over £100</p>
        <div class="bagline" style="border:0"><span class="m">Total</span><span class="m">£267.00</span></div>
        <button class="co">Checkout</button>
      </div>
    </div>
  </section>

  <section class="spec">
    <div class="specimg">${F('oxford', 210)}
      <span class="ann" style="top:96px;left:14px">chest 104</span>
      <span class="ann" style="top:196px;left:14px">waist 90</span>
      <span class="ann" style="top:150px;right:14px">sleeve 65</span>
      <span class="m" style="position:absolute;bottom:14px;left:14px">Measured on the body</span>
    </div>
    <div>
      <p class="m">Sizing — centimetres</p>
      <h2 style="font-size:46px;margin-top:8px">The size chart</h2>
      <table class="chart"><tr><th>Size</th><th>Chest</th><th>Waist</th><th>Sleeve</th></tr>
        ${SIZE_CHART.map((r) => `<tr><td>${r.size}</td><td>${r.chest} cm</td><td>${r.waist} cm</td><td>${r.sleeve} cm</td></tr>`).join('')}
      </table>
      <p class="advice">Between two sizes? Everything except the knitwear is cut with room, so take the smaller one.</p>
    </div>
  </section>

  <section class="margin">
    <div class="notes"><p class="m">Care &amp; repair</p>${CARE.map((c, i) => `<p>[${i + 1}]</p>`).join('')}</div>
    <div class="big">${CARE.map((c) => `<p>${c}</p>`).join('')}</div>
  </section>

  <section class="shiprow">
    <div><p class="m">Shipping &amp; returns</p><h2 style="font-size:40px;margin-top:8px">Three regions.<br>Sixty days.</h2></div>
    <ul>${SHIPPING.map((s) => `<li>${s}</li>`).join('')}</ul>
  </section>

  <section class="quotes">
    ${REVIEWS.map((r) => `<div><q>${r.text}</q><cite class="m">${r.name} — bought ${r.bought}</cite></div>`).join('')}
  </section>

  <section class="colophon">
    ${ABOUT.map((a, i) => `<div><p class="m">Colophon ${i + 1}</p><p>${a}</p></div>`).join('')}
  </section>
  <p class="foot">Plates are drawn technical illustrations of each style. Photographic images are representative of cloth and making, not photographs of this inventory.</p>
</div>

<script>
// Real halftone: sample the photograph, print it back as ink dots on paper.
// Cell size is what the scroll position animates in the built page.
const INK = [22,21,15], PAPER = [239,233,221]
document.querySelectorAll('canvas.ht').forEach(cv => {
  const img = new Image()
  img.onload = () => {
    const w = cv.width, h = cv.height, cell = +cv.dataset.cell
    const off = document.createElement('canvas')
    const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell)
    off.width = cols; off.height = rows
    const oc = off.getContext('2d')
    const s = Math.max(cols / img.width, rows / img.height)
    oc.drawImage(img, (cols - img.width * s) / 2, (rows - img.height * s) / 2, img.width * s, img.height * s)
    const d = oc.getImageData(0, 0, cols, rows).data
    const L = new Float32Array(cols * rows)
    let lo = 1, hi = 0
    for (let k = 0; k < cols * rows; k++) {
      const i = k * 4
      const v = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
      L[k] = v; if (v < lo) lo = v; if (v > hi) hi = v
    }
    const span = Math.max(.001, hi - lo)
    const ctx = cv.getContext('2d')
    ctx.fillStyle = 'rgb(' + PAPER.join(',') + ')'; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgb(' + INK.join(',') + ')'
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      // auto-level, then lift the midtones so ink never floods a whole area
      const lum = Math.pow((L[y * cols + x] - lo) / span, 0.62)
      const r = Math.sqrt(1 - Math.min(1, lum)) * cell * 0.60
      if (r < .25) continue
      ctx.beginPath(); ctx.arc(x * cell + cell / 2, y * cell + cell / 2, r, 0, 6.2832); ctx.fill()
    }
    cv.dataset.done = '1'
  }
  img.src = cv.dataset.src
})
</script>
</body></html>`

fs.writeFileSync('design/b.html', html)
