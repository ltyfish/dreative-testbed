import fs from 'node:fs'
import { flat, PALETTES } from './flats.mjs'
import { GARMENTS, SIZES, CATEGORIES, SIZE_CHART, CARE, SHIPPING, REVIEWS, ABOUT } from './content.mjs'

const F = (id, w = 260) => flat(id, PALETTES.ink, `width="${w}" height="${w * 1.5}"`)
const count = (c) => GARMENTS.filter((g) => g.category === c).length

const chips = (g) =>
  SIZES.map((s) => `<span class="chip${g.sold.includes(s) ? ' out' : ''}${s === 'M' && g.id === 'chore' ? ' on' : ''}">${s}</span>`).join('')

const card = (g) => `
<article class="card">
  <div class="plate">${F(g.id, 210)}<span class="plateno">${String(GARMENTS.indexOf(g) + 1).padStart(2, '0')}</span></div>
  <header><h3>${g.name}</h3><span class="price">£${g.price}</span></header>
  <p class="cat">${g.category}</p>
  <p class="detail">${g.detail}</p>
  <p class="fabric">${g.fabric}</p>
  <p class="colours">${g.colours.join(' · ')}</p>
  <div class="chips">${chips(g)}</div>
  <button class="add${g.id === 'chore' ? ' ready' : ''}">${g.id === 'chore' ? 'Add size M — £165' : 'Choose a size'}</button>
</article>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,400..800&display=swap">
<style>
:root{--bg:#0f1216;--panel:#171c22;--cloth:#ded6c6;--ink:#12151a;--mut:#878d97;--acc:#c5462c;--line:#262c34}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--cloth);font-family:Archivo,system-ui,sans-serif;font-size:15px;line-height:1.55}
h1,h2,h3{margin:0;font-weight:700;font-stretch:112%;letter-spacing:-.02em;line-height:.92;text-transform:uppercase}
.k{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--mut);font-weight:600;font-stretch:100%}
.wrap{max-width:1280px;margin:0 auto;padding:0 40px}

/* ---- top bar ---- */
.bar{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;
  padding:16px 40px;border-bottom:1px solid var(--line);background:rgba(15,18,22,.9);z-index:9}
.bar nav{display:flex;gap:28px}
.brand{font-weight:800;font-stretch:118%;letter-spacing:.06em;text-transform:uppercase;font-size:17px}
.bagbtn{border:1px solid var(--cloth);border-radius:999px;padding:5px 14px;font-size:11px;letter-spacing:.18em;text-transform:uppercase}

/* ---- hero ---- */
.hero{position:relative;height:880px;display:grid;grid-template-columns:1fr 640px;align-items:end;
  gap:40px;padding:0 40px 56px;max-width:1360px;margin:0 auto;overflow:hidden}
.hero h1{font-size:132px;font-stretch:125%;letter-spacing:-.045em}
.hero h1 em{font-style:normal;color:var(--acc)}
.hero .lede{max-width:430px;color:var(--mut);margin:26px 0 0;font-size:17px}
.hero .cue{margin-top:44px;display:flex;align-items:center;gap:14px}
.hero .cue .rail{height:1px;width:170px;background:var(--line);position:relative}
.hero .cue .rail i{position:absolute;left:0;top:-1px;height:3px;width:38px;background:var(--acc)}
/* the cloth column: the object that persists all the way down the page */
.column{position:relative;height:820px;background:linear-gradient(180deg,#232932,#1a1f26);
  border-left:1px solid var(--line);border-right:1px solid var(--line);display:flex;align-items:center;justify-content:center}
.column:before{content:'';position:absolute;inset:0;background:
  repeating-linear-gradient(90deg,rgba(222,214,198,.05) 0 1px,transparent 1px 7px)}
.column svg{position:relative;filter:drop-shadow(0 40px 60px rgba(0,0,0,.6))}
.tag{position:absolute;left:0;bottom:34px;background:var(--cloth);color:var(--ink);
  padding:7px 14px;font-size:10px;letter-spacing:.2em;text-transform:uppercase;font-weight:700}

/* ---- unroll stage ---- */
.stage{border-top:1px solid var(--line);padding:70px 0 20px}
.frames{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:34px}
.fr{position:relative;background:var(--panel);height:430px;overflow:hidden;display:flex;align-items:center;justify-content:center}
.fr svg{transition:none}
.fr.f1 svg{transform:scale(1)}
.fr.f2 svg{transform:scale(2.5) translate(6%,14%)}
.fr.f3 svg{transform:scale(1.5) translate(-12%,-8%)}
.fr b{position:absolute;top:14px;left:16px;font-size:11px;letter-spacing:.2em;color:var(--mut)}
.fr p{position:absolute;left:16px;right:16px;bottom:14px;margin:0;font-size:12.5px;color:var(--mut);line-height:1.4}
.scrub{margin-top:18px;display:flex;align-items:center;gap:16px}
.scrub .track{flex:1;height:2px;background:var(--line);position:relative}
.scrub .track i{position:absolute;height:2px;background:var(--acc);left:0;width:58%}
.scrub .track s{position:absolute;top:-4px;width:10px;height:10px;background:var(--acc);left:58%;transform:rotate(45deg)}

/* ---- handoff ---- */
.handoff{margin-top:72px;border-top:1px solid var(--line);padding-top:56px}
.split{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px;margin-top:30px;height:300px}
.split div{background:linear-gradient(180deg,#232932,#1a1f26);position:relative;display:flex;align-items:flex-end;justify-content:center;padding-bottom:16px}
.split div:nth-child(1){transform:translateY(-14px)}
.split div:nth-child(3){transform:translateY(14px)}
.split span{font-size:10px;letter-spacing:.2em;color:var(--mut);text-transform:uppercase}

/* ---- shop ---- */
.shop{margin-top:96px;border-top:1px solid var(--line)}
.filters{position:sticky;top:57px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  padding:18px 0;border-bottom:1px solid var(--line);background:rgba(15,18,22,.95);z-index:8}
.f{border:1px solid var(--line);border-radius:999px;padding:7px 16px;font-size:12px;letter-spacing:.06em;color:var(--mut)}
.f.on{background:var(--cloth);color:var(--ink);border-color:var(--cloth);font-weight:700}
.showing{margin-left:auto;font-size:12px;color:var(--mut);letter-spacing:.06em}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:2px}
.card{background:var(--panel);padding:0 0 24px}
.plate{position:relative;background:linear-gradient(180deg,#232932,#1a1f26);height:360px;display:flex;align-items:center;justify-content:center;margin-bottom:20px}
.plate:before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(222,214,198,.045) 0 1px,transparent 1px 7px)}
.plateno{position:absolute;top:12px;left:14px;font-size:10px;letter-spacing:.2em;color:var(--mut)}
.card header{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:0 20px}
.card h3{font-size:22px;font-stretch:108%}
.price{font-size:15px;font-weight:700}
.card .cat{margin:4px 20px 12px;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--acc)}
.card .detail{margin:0 20px 10px;font-size:13.5px;color:#b9b3a6}
.card .fabric,.card .colours{margin:0 20px 4px;font-size:11.5px;color:var(--mut)}
.chips{display:flex;gap:6px;margin:16px 20px 12px}
.chip{width:42px;height:34px;display:grid;place-items:center;border:1px solid var(--line);font-size:12px;color:var(--cloth)}
.chip.on{background:var(--cloth);color:var(--ink);border-color:var(--cloth);font-weight:700}
.chip.out{color:#4d535c;border-style:dashed;position:relative}
.chip.out:after{content:'';position:absolute;left:6px;right:6px;top:50%;height:1px;background:#4d535c}
.add{display:block;width:calc(100% - 40px);margin:0 20px;padding:12px;background:none;border:1px solid var(--line);
  color:var(--mut);font:inherit;font-size:12px;letter-spacing:.14em;text-transform:uppercase}
.add.ready{background:var(--acc);border-color:var(--acc);color:#fff;font-weight:700}

/* ---- bag ---- */
.bag{margin-top:2px;background:var(--panel);display:grid;grid-template-columns:1fr 380px;gap:40px;padding:36px 40px}
.line{display:flex;justify-content:space-between;align-items:baseline;padding:14px 0;border-bottom:1px solid var(--line);font-size:14px}
.line .rm{font-size:11px;letter-spacing:.16em;color:var(--mut);text-transform:uppercase}
.sub{display:flex;justify-content:space-between;padding:16px 0;font-size:20px;font-weight:700}
.prog{height:3px;background:var(--line);position:relative;margin:6px 0 10px}
.prog i{position:absolute;height:3px;background:var(--acc);width:78%}
.checkout{margin-top:14px;width:100%;padding:15px;background:var(--cloth);color:var(--ink);border:0;font:inherit;font-weight:700;font-size:13px;letter-spacing:.18em;text-transform:uppercase}

/* ---- ending ---- */
.sizing{margin-top:96px;border-top:1px solid var(--line);padding-top:56px;display:grid;grid-template-columns:400px 1fr;gap:56px}
.diagram{background:linear-gradient(180deg,#232932,#1a1f26);position:relative;display:grid;place-items:center;padding:24px}
.ann{position:absolute;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--acc)}
table{width:100%;border-collapse:collapse;margin-top:18px}
th,td{text-align:left;padding:14px 6px;border-bottom:1px solid var(--line);font-size:14px}
th{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--mut);font-weight:600}
td:first-child{font-weight:700;font-size:17px}
.advice{margin-top:22px;font-size:17px;max-width:520px}
.care{margin-top:96px;border-top:1px solid var(--line);padding-top:56px;display:grid;grid-template-columns:repeat(2,1fr);gap:2px}
.care .f2{background:var(--panel);padding:30px;font-size:19px;line-height:1.4}
.care .f2 b{display:block;color:var(--acc);font-size:11px;letter-spacing:.2em;margin-bottom:14px}
.ship{margin-top:96px;border-top:1px solid var(--line);padding-top:56px;display:grid;grid-template-columns:1fr 1fr;gap:56px}
.ship ul{margin:0;padding:0;list-style:none}
.ship li{padding:16px 0;border-bottom:1px solid var(--line);font-size:15px;color:#b9b3a6}
.revs{margin-top:96px;border-top:1px solid var(--line);padding-top:56px;display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
.rev p{font-size:18px;line-height:1.45;margin:0 0 18px}
.rev cite{font-style:normal;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--mut)}
.colo{margin-top:96px;border-top:1px solid var(--line);padding:56px 0 80px;display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
.colo p{margin:14px 0 0;font-size:14.5px;color:#b9b3a6}

@media (max-width:520px){
  body{font-size:15px}
  .wrap{padding:0 18px}
  .bar{padding:12px 18px}
  .bar nav{display:none}
  .hero{grid-template-columns:1fr;height:auto;padding:28px 18px 40px;gap:26px;align-items:start}
  .hero h1{font-size:62px}
  .hero .lede{font-size:16px}
  .column{height:440px;order:2;margin:0 -18px}
  .column svg{width:230px;height:345px}
  .tag{left:18px;bottom:18px}
  .stage{padding-top:44px}
  .stage h2,.handoff h2,.sizing h2,.ship h2{font-size:30px!important}
  .frames{grid-template-columns:1fr;gap:1px}
  .fr{height:300px}
  .split{grid-template-columns:1fr;height:auto}
  .split div{height:180px;transform:none!important}
  .shop{margin-top:56px}
  .filters{top:49px;gap:7px;overflow-x:auto;flex-wrap:nowrap;padding:12px 0}
  .f{flex:0 0 auto}
  .showing{margin-left:0;flex:0 0 auto}
  .grid{grid-template-columns:1fr;gap:1px}
  .plate{height:300px}
  .chips{gap:5px}
  .chip{flex:1;width:auto}
  .bag{grid-template-columns:1fr;gap:20px;padding:24px 18px}
  .sizing,.ship{grid-template-columns:1fr;gap:26px;margin-top:56px}
  .diagram{height:300px}
  .care{grid-template-columns:1fr;margin-top:56px}
  .revs{grid-template-columns:1fr;gap:28px;margin-top:56px}
  .colo{grid-template-columns:1fr;gap:24px;margin-top:56px}
  th,td{padding:11px 4px;font-size:13px}
}
.note{padding:0 0 60px;font-size:11.5px;color:var(--mut);max-width:720px}
</style></head><body>

<div class="bar">
  <span class="brand">Marlow &amp; Vale</span>
  <nav class="k"><span>Lookbook</span><span>Shop</span><span>Sizing</span><span>Care</span><span>Shipping</span></nav>
  <span class="bagbtn">Bag (2) — £243</span>
</div>

<section class="hero">
  <div>
    <p class="k">Leeds · Autumn</p>
    <h1>One<br>price<br><em>all year</em></h1>
    <p class="lede">Clothes made in four factories we have been to, sold at one price all year.</p>
    <div class="cue"><span class="k">Scroll to unroll</span><span class="rail"><i></i></span></div>
  </div>
  <div class="column">${F('chore', 400)}<span class="tag">01 — Chore Jacket · 12oz canvas · £165</span></div>
</section>

<div class="wrap">
  <section class="stage">
    <p class="k">The unroll — one continuous length of cloth</p>
    <h2 style="font-size:46px;margin-top:14px;max-width:820px">The camera never cuts. It pushes in, holds on the construction, and pulls back out.</h2>
    <div class="frames">
      <div class="fr f1"><b>01 / ENTRY</b>${F('overshirt', 240)}<p>Wool Overshirt — 80% wool, 20% nylon, brushed. £210</p></div>
      <div class="fr f2"><b>02 / HOLD</b>${F('overshirt', 240)}<p>Warm enough to be the only layer down to about 8°C.</p></div>
      <div class="fr f3"><b>03 / RELEASE</b>${F('knit', 240)}<p>Lambswool Crew — fully fashioned, spun in Scotland. £135</p></div>
    </div>
    <div class="scrub"><span class="k">04 / 09</span><span class="track"><i></i><s></s></span><span class="k">Lambswool Crew</span></div>
  </section>

  <section class="handoff">
    <p class="k">The handoff — the same column becomes the shop</p>
    <h2 style="font-size:46px;margin-top:14px;max-width:760px">The last frame splits into three and keeps its cloth.</h2>
    <div class="split">
      <div>${F('knit', 150)}<span style="position:absolute;top:14px;left:16px">Card 07</span></div>
      <div>${F('cardigan', 150)}<span style="position:absolute;top:14px;left:16px">Card 08</span></div>
      <div>${F('shorts', 150)}<span style="position:absolute;top:14px;left:16px">Card 09</span></div>
    </div>
  </section>

  <section class="shop">
    <div class="filters">
      <span class="f on">All (9)</span>
      ${CATEGORIES.map((c) => `<span class="f">${c} (${count(c)})</span>`).join('')}
      <span class="showing">Showing 9 of 9 garments.</span>
    </div>
    <div class="grid">${GARMENTS.map(card).join('')}</div>

    <div class="bag">
      <div>
        <p class="k">Your bag — 2 items</p>
        <div class="line"><span>Chore Jacket — size M</span><span>£165 &nbsp; <span class="rm">Remove</span></span></div>
        <div class="line"><span>Heavy Cotton Tee — size L</span><span>£34 &nbsp; <span class="rm">Remove</span></span></div>
        <div class="line"><span>Camp Short — size S</span><span>£64 &nbsp; <span class="rm">Remove</span></span></div>
      </div>
      <div>
        <div class="sub"><span>Subtotal</span><span>£263.00</span></div>
        <div class="prog"><i></i></div>
        <p class="k" style="color:var(--acc)">Delivery free — over £100</p>
        <div class="sub" style="font-size:15px;font-weight:400;color:var(--mut)"><span>Total</span><span>£263.00</span></div>
        <button class="checkout">Checkout</button>
      </div>
    </div>
  </section>

  <section class="sizing">
    <div class="diagram">${F('oxford', 260)}
      <span class="ann" style="top:120px;left:20px">chest 104</span>
      <span class="ann" style="top:230px;left:20px">waist 90</span>
      <span class="ann" style="top:180px;right:20px">sleeve 65</span>
    </div>
    <div>
      <p class="k">Sizing — measured on the body, in centimetres</p>
      <h2 style="font-size:46px;margin-top:14px">The size chart</h2>
      <table><tr><th>Size</th><th>Chest</th><th>Waist</th><th>Sleeve</th></tr>
        ${SIZE_CHART.map((r) => `<tr><td>${r.size}</td><td>${r.chest} cm</td><td>${r.waist} cm</td><td>${r.sleeve} cm</td></tr>`).join('')}
      </table>
      <p class="advice">Between two sizes? Everything except the knitwear is cut with room, so take the smaller one.</p>
    </div>
  </section>

  <section class="care">
    ${CARE.map((c, i) => `<div class="f2"><b>Care / 0${i + 1}</b>${c}</div>`).join('')}
  </section>

  <section class="ship">
    <div><p class="k">Shipping &amp; returns</p><h2 style="font-size:46px;margin-top:14px">Three regions,<br>sixty days.</h2></div>
    <ul>${SHIPPING.map((s) => `<li>${s}</li>`).join('')}</ul>
  </section>

  <section class="revs">
    ${REVIEWS.map((r) => `<div class="rev"><p>“${r.text}”</p><cite>${r.name} — bought ${r.bought}</cite></div>`).join('')}
  </section>

  <section class="colo">
    ${ABOUT.map((a, i) => `<div><p class="k">0${i + 1}</p><p>${a}</p></div>`).join('')}
  </section>
  <p class="note">Garment images on this site are drawn technical illustrations of each style, not photographs of stock.</p>
</div>
</body></html>`

fs.writeFileSync('design/a.html', html)
