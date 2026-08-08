#!/usr/bin/env node
// Blind review server. Judge every captured pair in one place, write feedback per design.
//
//   node scripts/review.mjs [--port 4321]
//
// Left/right is randomised per scenario and the assignment is stored, so a refresh does
// not reshuffle and you cannot infer the arm by reloading. Arms are revealed only after
// you submit that scenario's verdict. Submissions append to VERDICTS.md and write a
// structured record to runs/verdicts/.

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { freePort, killTree } from './lib/capture.mjs'
import { ROOT, RUNS, readScenario } from './lib/scaffold.mjs'

const PORT = Number(process.argv[process.argv.indexOf('--port') + 1]) || 4321
const VERDICT_DIR = path.join(RUNS, 'verdicts')
const ASSIGN_FILE = path.join(RUNS, '.review-assignments.json')

const CRITERIA = [
  ['distinct', 'Distinctiveness', 'Could this be any other company? Swap the logo and copy for a competitor — does it still work perfectly? Then it is generic.'],
  ['fit', 'Fit to the product', 'Does the design say something true about this specific business, or is it generic polish?'],
  ['hierarchy', 'Hierarchy and pacing', 'Squint until it blurs. Do you still see structure, or an even grey texture?'],
  ['craft', 'Craft', 'Alignment, spacing consistency, type, contrast, edges. Count the defects — it is that mechanical.'],
  ['mobile', 'Mobile', 'Is 390px designed, or is it the desktop layout surviving? Check overflow, collisions, tiny tap targets.'],
  ['restraint', 'Restraint', 'For every visible effect, what is it for? Decoration doing no work counts against.'],
]

const readJson = (p, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}

function loadPairs() {
  if (!fs.existsSync(RUNS)) return []
  const runs = fs
    .readdirSync(RUNS)
    .filter((d) => {
      const dir = path.join(RUNS, d)
      return fs.statSync(dir).isDirectory() && fs.existsSync(path.join(dir, 'run.json'))
    })
    .map((d) => ({ dir: d, meta: readJson(path.join(RUNS, d, 'run.json'), null) }))
    .filter((r) => r.meta && fs.existsSync(path.join(RUNS, r.dir, '.captures', 'desktop.png')))

  const byScenario = new Map()
  for (const r of runs) {
    if (!byScenario.has(r.meta.scenario)) byScenario.set(r.meta.scenario, [])
    byScenario.get(r.meta.scenario).push(r)
  }

  const pairs = []
  for (const [scenario, list] of byScenario) {
    const withArm = list.filter((r) => r.meta.arm === 'with').at(-1)
    const withoutArm = list.filter((r) => r.meta.arm === 'without').at(-1)
    if (!withArm || !withoutArm) continue

    const assignments = readJson(ASSIGN_FILE, {})
    const key = `${scenario}::${withArm.dir}::${withoutArm.dir}`
    if (!assignments[key]) {
      assignments[key] = Math.random() < 0.5 ? 'with-is-A' : 'without-is-A'
      fs.mkdirSync(RUNS, { recursive: true })
      fs.writeFileSync(ASSIGN_FILE, JSON.stringify(assignments, null, 2), 'utf8')
    }
    const withIsA = assignments[key] === 'with-is-A'

    let info = {}
    try {
      info = readScenario(scenario)
    } catch {
      /* scenario folder may have been renamed */
    }

    pairs.push({
      scenario,
      key,
      product: info.product ?? scenario,
      field: info.field ?? '',
      challenge: info.designChallenge ?? '',
      A: withIsA ? withArm : withoutArm,
      B: withIsA ? withoutArm : withArm,
      scored: fs.existsSync(path.join(VERDICT_DIR, `${scenario}.json`)),
    })
  }
  return pairs.sort((a, b) => a.scenario.localeCompare(b.scenario))
}

function buildFailure(runDir) {
  const p = path.join(RUNS, runDir, 'build-error.log')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null
}

function captureWarnings(runDir) {
  const p = path.join(RUNS, runDir, '.captures', 'warnings.txt')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null
}

// ------------------------------------------------------- live previews
//
// Screenshots cannot show motion, hover, or scroll behaviour, so each side can be opened
// live. Servers are started on demand and addressed only by port, so the URL never names
// the run and the arm stays hidden.

const live = new Map() // runDir -> { port, proc }

async function startLive(runDir) {
  if (live.has(runDir)) return live.get(runDir).port
  const dir = path.join(RUNS, runDir)
  if (!fs.existsSync(path.join(dir, 'dist'))) {
    const build = spawn('npm', ['run', 'build'], { cwd: dir, shell: true, stdio: 'ignore' })
    await new Promise((r) => build.on('close', r))
  }
  const port = await freePort(0)
  const proc = spawn('npm', ['run', 'preview', '--', '--port', String(port), '--strictPort'], {
    cwd: dir,
    shell: true,
    stdio: 'ignore',
  })
  live.set(runDir, { port, proc })

  // Wait for it to answer before handing over the link.
  for (let i = 0; i < 40; i++) {
    try {
      await fetch(`http://127.0.0.1:${port}/`)
      break
    } catch {
      await new Promise((r) => setTimeout(r, 250))
    }
  }
  return port
}

function stopAllLive() {
  for (const { proc } of live.values()) killTree(proc.pid)
  live.clear()
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    stopAllLive()
    process.exit(0)
  })
}
process.on('exit', stopAllLive)

// ------------------------------------------------------------------ writing

function saveVerdict(body) {
  fs.mkdirSync(VERDICT_DIR, { recursive: true })
  const pairs = loadPairs()
  const pair = pairs.find((p) => p.scenario === body.scenario)
  if (!pair) throw new Error('unknown scenario')

  const armOf = (side) => pair[side].meta.arm
  const resolve = (choice) => (choice === 'Tie' || !choice ? choice || '—' : armOf(choice))

  const record = {
    scenario: body.scenario,
    judgedAt: new Date().toISOString(),
    runs: { with: pair.A.meta.arm === 'with' ? pair.A.dir : pair.B.dir, without: pair.A.meta.arm === 'without' ? pair.A.dir : pair.B.dir },
    criteria: Object.fromEntries(CRITERIA.map(([k]) => [k, resolve(body.picks?.[k])])),
    overall: resolve(body.picks?.overall),
    feedback: {
      [armOf('A')]: body.notesA ?? '',
      [armOf('B')]: body.notesB ?? '',
    },
    summary: body.summary ?? '',
  }

  fs.writeFileSync(path.join(VERDICT_DIR, `${body.scenario}.json`), JSON.stringify(record, null, 2), 'utf8')

  const label = (v) => (v === 'with' ? 'WITH Dreative' : v === 'without' ? 'control' : v)
  const rows = [...CRITERIA.map(([k, name]) => [name, record.criteria[k]]), ['**Overall**', record.overall]]
    .map(([name, v]) => `| ${name} | ${label(v)} |`)
    .join('\n')

  const block = `
## ${body.scenario} — ${record.judgedAt.slice(0, 10)}

- with:    \`${record.runs.with}\`
- without: \`${record.runs.without}\`

| Criterion | Winner |
|---|---|
${rows}

**Feedback on the Dreative build:** ${record.feedback.with || '—'}

**Feedback on the control:** ${record.feedback.without || '—'}

**Summary:** ${record.summary || '—'}
`
  fs.appendFileSync(path.join(ROOT, 'VERDICTS.md'), block, 'utf8')
  return record
}

// ------------------------------------------------------------------ markup

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const STYLE = `
:root{color-scheme:light dark;--bg:#0f1115;--fg:#e8eaf0;--mut:#98a1b0;--line:#282d38;--card:#161a21;--acc:#6ea8ff;--good:#4ade80;--bad:#fb7185}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:var(--acc)}
header{padding:18px 24px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:20;display:flex;gap:18px;align-items:baseline;flex-wrap:wrap}
h1{margin:0;font-size:16px;letter-spacing:-.01em}
.sub{color:var(--mut);font-size:13px}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto}
.tab{padding:5px 11px;border:1px solid var(--line);border-radius:999px;font-size:13px;text-decoration:none;color:var(--fg);white-space:nowrap}
.tab.on{background:var(--acc);color:#06101f;border-color:var(--acc);font-weight:600}
.tab.done{border-color:var(--good);color:var(--good)}
main{padding:24px;max-width:1600px;margin:0 auto}
.brief{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px 18px;margin-bottom:22px}
.brief h2{margin:0 0 6px;font-size:15px}
.brief p{margin:0;color:var(--mut);font-size:13.5px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}
@media(max-width:1000px){.grid{grid-template-columns:1fr}}
.col{min-width:0}
.tagrow{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}
.tag{font:600 13px/1 ui-monospace,monospace;padding:8px 11px;background:var(--card);border:1px solid var(--line);border-radius:6px;display:inline-block}
.livebtn{font-size:13px;padding:7px 13px;border:1px solid var(--acc);color:var(--acc);border-radius:999px;text-decoration:none;font-weight:600}
.livebtn:hover{background:var(--acc);color:#06101f}
.warn{border:1px solid #d97706;color:#fbbf24;border-radius:7px;padding:9px 12px;font-size:13px;margin-bottom:10px}
.lbl{color:var(--mut);font-size:11.5px;text-transform:uppercase;letter-spacing:.07em;margin:14px 0 6px}
img.shot{width:100%;border:1px solid var(--line);border-radius:8px;display:block;background:#fff}
img.shot.mob{width:min(300px,100%)}
.fail{border:1px solid var(--bad);border-radius:8px;padding:14px;color:var(--bad);font:12.5px/1.5 ui-monospace,monospace;white-space:pre-wrap;overflow:auto;max-height:260px}
textarea{width:100%;min-height:90px;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:7px;padding:10px;font:inherit;font-size:14px;resize:vertical;margin-top:8px}
.panel{margin-top:26px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:20px}
table{width:100%;border-collapse:collapse}
td,th{text-align:left;padding:10px 8px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--mut);font-size:11.5px;text-transform:uppercase;letter-spacing:.06em}
.why{color:var(--mut);font-size:12.5px;font-weight:400;display:block;margin-top:3px}
.choices{display:flex;gap:6px}
label.pick{cursor:pointer;padding:5px 13px;border:1px solid var(--line);border-radius:999px;font-size:13px;user-select:none}
label.pick:has(input:checked){background:var(--acc);color:#06101f;border-color:var(--acc);font-weight:600}
label.pick input{display:none}
button{background:var(--acc);color:#06101f;border:0;border-radius:7px;padding:11px 20px;font:600 14px ui-sans-serif,system-ui,sans-serif;cursor:pointer}
button:disabled{opacity:.4;cursor:not-allowed}
#reveal{margin-top:18px;padding:16px;border:1px dashed var(--line);border-radius:8px;display:none}
#reveal.show{display:block}
code{background:#0b0d12;padding:2px 6px;border-radius:4px;font-size:12.5px}
.empty{color:var(--mut);padding:40px 0;text-align:center}
`

function page(pairs, active) {
  const pair = pairs.find((p) => p.scenario === active) ?? pairs[0]
  const tabs = pairs
    .map(
      (p) =>
        `<a class="tab${p.scenario === pair?.scenario ? ' on' : ''}${p.scored ? ' done' : ''}" href="/?s=${encodeURIComponent(p.scenario)}">${esc(p.scenario)}${p.scored ? ' ✓' : ''}</a>`,
    )
    .join('')

  if (!pair) {
    return `<!doctype html><meta charset="utf-8"><title>Review</title><style>${STYLE}</style>
    <header><h1>Blind review</h1></header>
    <main><p class="empty">No captured pairs yet.<br><br>Run a round first:<br><code>node scripts/run-all.mjs</code></p></main>`
  }

  const side = (letter) => {
    const run = pair[letter]
    const fail = buildFailure(run.dir)
    if (fail) {
      return `<div class="col"><div class="tag">DESIGN ${letter}</div>
        <div class="lbl">Build failed — this is itself a finding</div>
        <div class="fail">${esc(fail)}</div></div>`
    }
    const warn = captureWarnings(run.dir)
    return `<div class="col">
      <div class="tagrow">
        <span class="tag">DESIGN ${letter}</span>
        <a class="livebtn" href="/live/${encodeURIComponent(pair.scenario)}/${letter}" target="_blank" rel="noopener">Open live ↗</a>
      </div>
      ${warn ? `<div class="warn">Capture warning — ${esc(warn)}</div>` : ''}
      <div class="lbl">Desktop · 1440</div>
      <img class="shot" src="/shot/${encodeURIComponent(run.dir)}/desktop.png" alt="Design ${letter} desktop">
      <div class="lbl">Mobile · 390</div>
      <img class="shot mob" src="/shot/${encodeURIComponent(run.dir)}/mobile.png" alt="Design ${letter} mobile">
      <div class="lbl">Your feedback on Design ${letter}</div>
      <textarea id="notes${letter}" placeholder="What works, what is wrong, what you would send back. This gets filed against whichever arm it turns out to be."></textarea>
    </div>`
  }

  return `<!doctype html><meta charset="utf-8"><title>Blind review — ${esc(pair.scenario)}</title><style>${STYLE}</style>
<header>
  <div><h1>Blind review</h1><div class="sub">One of these used Dreative. You are not told which until you submit.</div></div>
  <nav class="tabs">${tabs}</nav>
</header>
<main>
  <div class="brief">
    <h2>${esc(pair.product)}</h2>
    <p><strong>${esc(pair.field)}</strong>${pair.challenge ? ' — ' + esc(pair.challenge) : ''}</p>
  </div>

  <div class="grid">${side('A')}${side('B')}</div>

  <div class="panel">
    <table>
      <tr><th style="width:44%">Criterion</th><th>Which is better?</th></tr>
      ${CRITERIA.map(
        ([key, name, why]) => `<tr>
        <td><strong>${name}</strong><span class="why">${why}</span></td>
        <td><div class="choices">${['A', 'Tie', 'B']
          .map((v) => `<label class="pick"><input type="radio" name="${key}" value="${v}">${v}</label>`)
          .join('')}</div></td></tr>`,
      ).join('')}
      <tr><td><strong>Overall</strong><span class="why">Which would you actually ship for this client? Not which is more impressive.</span></td>
      <td><div class="choices">${['A', 'Tie', 'B']
        .map((v) => `<label class="pick"><input type="radio" name="overall" value="${v}">${v}</label>`)
        .join('')}</div></td></tr>
    </table>

    <div class="lbl">Summary — the worst thing about the winner, the best thing about the loser</div>
    <textarea id="summary" placeholder="Forcing both stops this collapsing into a verdict you already held."></textarea>

    <p style="margin-top:16px"><button id="submit">Submit verdict and reveal</button></p>

    <div id="reveal">
      <p><strong>Design A</strong> was <code id="ra"></code> &nbsp;·&nbsp; <strong>Design B</strong> was <code id="rb"></code></p>
      <p id="conclusion" style="font-size:15px"></p>
      <p class="sub">Saved to <code>VERDICTS.md</code> and <code>runs/verdicts/${esc(pair.scenario)}.json</code>. Pick the next scenario above.</p>
    </div>
  </div>
</main>
<script>
const SCENARIO = ${JSON.stringify(pair.scenario)};
const KEYS = ${JSON.stringify(CRITERIA.map(([k]) => k))};
document.getElementById('submit').addEventListener('click', async () => {
  const picks = {};
  for (const k of [...KEYS, 'overall']) {
    const el = document.querySelector('input[name="' + k + '"]:checked');
    if (el) picks[k] = el.value;
  }
  if (!picks.overall) { alert('Score "Overall" at least.'); return; }

  const res = await fetch('/api/verdict', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      scenario: SCENARIO, picks,
      notesA: document.getElementById('notesA')?.value ?? '',
      notesB: document.getElementById('notesB')?.value ?? '',
      summary: document.getElementById('summary').value,
    }),
  });
  if (!res.ok) { alert('Save failed: ' + await res.text()); return; }
  const rec = await res.json();

  const pretty = (a) => a === 'with' ? 'WITH Dreative' : 'WITHOUT Dreative (control)';
  document.getElementById('ra').textContent = pretty(rec.armA);
  document.getElementById('rb').textContent = pretty(rec.armB);
  document.getElementById('conclusion').textContent =
    rec.overall === 'Tie' ? 'Tie. On this scenario the skill produced no visible advantage.'
    : rec.overall === 'with' ? 'The Dreative build won. One real data point in its favour.'
    : 'The control won. The skill made this worse — the most useful result you can get.';
  document.getElementById('reveal').classList.add('show');
  document.getElementById('submit').disabled = true;
  document.getElementById('reveal').scrollIntoView({ behavior: 'smooth' });
});
</script>`
}

// ------------------------------------------------------------------ server

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)

  if (req.method === 'GET' && url.pathname.startsWith('/shot/')) {
    const [, , dir, file] = url.pathname.split('/').map(decodeURIComponent)
    const p = path.join(RUNS, dir, '.captures', file)
    if (!p.startsWith(RUNS) || !fs.existsSync(p)) {
      res.writeHead(404).end('not found')
      return
    }
    res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' })
    fs.createReadStream(p).pipe(res)
    return
  }

  if (req.method === 'GET' && url.pathname.startsWith('/live/')) {
    const [, , scenarioName, letter] = url.pathname.split('/').map(decodeURIComponent)
    const pair = loadPairs().find((p) => p.scenario === scenarioName)
    if (!pair || (letter !== 'A' && letter !== 'B')) {
      res.writeHead(404).end('not found')
      return
    }
    try {
      const port = await startLive(pair[letter].dir)
      // Redirect to a bare port so the URL never names the run or the arm.
      res.writeHead(302, { location: `http://127.0.0.1:${port}/` }).end()
    } catch (err) {
      res.writeHead(500).end(`could not start live preview: ${err.message}`)
    }
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/verdict') {
    let raw = ''
    for await (const chunk of req) raw += chunk
    try {
      const body = JSON.parse(raw)
      const pair = loadPairs().find((p) => p.scenario === body.scenario)
      const record = saveVerdict(body)
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          ...record,
          armA: pair.A.meta.arm,
          armB: pair.B.meta.arm,
          overall: record.overall,
        }),
      )
      console.log(`saved verdict for ${body.scenario}: overall → ${record.overall}`)
    } catch (err) {
      res.writeHead(400).end(err.message)
    }
    return
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
    res.end(page(loadPairs(), url.searchParams.get('s')))
    return
  }

  res.writeHead(404).end('not found')
})

const pairs = loadPairs()
server.listen(PORT, '127.0.0.1', () => {
  console.log(`\nBlind review ready:  http://127.0.0.1:${PORT}`)
  console.log(`${pairs.length} scenario pair(s) captured: ${pairs.map((p) => p.scenario).join(', ') || 'none yet'}`)
  if (!pairs.length) console.log('Run a round first:  node scripts/run-all.mjs')
  console.log('\nCtrl+C to stop.\n')
})
