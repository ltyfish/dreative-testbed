#!/usr/bin/env node
// Browse every past round: screenshots, verdicts, transcripts, and the actual sites.
//
//   node scripts/archive.mjs [--port 4322]
//
// Everything it serves comes from the committed `archive/` directory, so this works on a
// fresh clone with nothing installed and nothing built. Arms are labelled here — the
// archive is the record after the reveal, not another blind test. Blind scoring lives in
// scripts/review.mjs.

import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { ARCHIVE, listRounds, readJson } from './lib/archive.mjs'

const PORT = Number(process.argv[process.argv.indexOf('--port') + 1]) || 4322
// The archive is usually opened from the review page, and a new tab with no link back is a
// dead end. review.mjs passes its own port; on its own the default is the right guess.
const REVIEW_PORT = Number(process.argv[process.argv.indexOf('--review-port') + 1]) || 4321

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.log': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.jsx': 'text/plain; charset=utf-8',
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

/** Resolve a path under the archive, refusing anything that escapes it. */
function safeJoin(...parts) {
  const p = path.resolve(ARCHIVE, ...parts)
  return p === ARCHIVE || p.startsWith(ARCHIVE + path.sep) ? p : null
}

function roundSummary(round) {
  const info = readJson(path.join(ARCHIVE, round, 'round.json'), {})
  const scenarios = (info.scenarios ?? []).map((scenario) => {
    const dir = path.join(ARCHIVE, round, scenario)
    // Whatever was archived, in a stable order: the two arms first, then any repeats.
    // Hard-coding ['with','without'] hid every extra run of a variance round.
    const order = (name) => (name === 'with' ? 0 : name === 'without' ? 1 : 2)
    const names = (fs.existsSync(dir) ? fs.readdirSync(dir) : [])
      .filter((f) => fs.statSync(path.join(dir, f)).isDirectory())
      .sort((a, b) => order(a) - order(b) || a.localeCompare(b))
    const arms = (names.length ? names : ['with', 'without']).map((arm) => {
      const armDir = path.join(dir, arm)
      return {
        arm,
        exists: fs.existsSync(armDir),
        meta: readJson(path.join(armDir, 'meta.json'), {}),
        shots: fs.existsSync(path.join(armDir, 'shots'))
          ? fs.readdirSync(path.join(armDir, 'shots')).filter((f) => f.endsWith('.png')).sort()
          : [],
        site: fs.existsSync(path.join(armDir, 'site', 'index.html')),
        log: fs.existsSync(path.join(armDir, 'agent.log')),
        buildFailed: fs.existsSync(path.join(armDir, 'build-error.log')),
      }
    })
    return {
      scenario,
      info: readJson(path.join(dir, 'scenario.json'), {}),
      verdict: readJson(path.join(dir, 'verdict.json'), null),
      arms,
    }
  })
  return { round, info, scenarios }
}

const STYLE = `
:root{color-scheme:light dark;--bg:#0f1115;--fg:#e8eaf0;--mut:#98a1b0;--line:#282d38;--card:#161a21;--acc:#6ea8ff;--good:#4ade80;--bad:#fb7185}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:var(--acc)}
header{padding:18px 24px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:20;display:flex;gap:16px;align-items:baseline;flex-wrap:wrap}
h1{margin:0;font-size:16px}
.sub{color:var(--mut);font-size:13px}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto}
.tab{padding:5px 11px;border:1px solid var(--line);border-radius:999px;font-size:13px;text-decoration:none;color:var(--fg);white-space:nowrap}
.tab.on{background:var(--acc);color:#06101f;border-color:var(--acc);font-weight:600}
.tab.back{border-color:var(--acc);color:var(--acc)}
main{padding:24px;max-width:1600px;margin:0 auto}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px 18px;margin-bottom:22px}
.card h2{margin:0 0 4px;font-size:15px}
.card p{margin:0;color:var(--mut);font-size:13.5px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-bottom:34px}
@media(max-width:1000px){.grid{grid-template-columns:1fr}}
.col{min-width:0}
.tagrow{display:flex;align-items:center;gap:9px;margin-bottom:10px;flex-wrap:wrap}
.tag{font:600 13px/1 ui-monospace,monospace;padding:8px 11px;border-radius:6px;border:1px solid var(--line);background:var(--card)}
.tag.with{border-color:var(--acc);color:var(--acc)}
.tag.without{border-color:var(--mut);color:var(--mut)}
.btn{font-size:12.5px;padding:6px 12px;border:1px solid var(--line);color:var(--fg);border-radius:999px;text-decoration:none}
.btn:hover{border-color:var(--acc);color:var(--acc)}
.lbl{color:var(--mut);font-size:11.5px;text-transform:uppercase;letter-spacing:.07em;margin:14px 0 6px}
img.shot{width:100%;border:1px solid var(--line);border-radius:8px;display:block;background:#fff}
img.shot.mob{width:min(300px,100%)}
.fail{border:1px solid var(--bad);border-radius:8px;padding:12px;color:var(--bad);font:12.5px/1.5 ui-monospace,monospace;white-space:pre-wrap;max-height:220px;overflow:auto}
table{width:100%;border-collapse:collapse;font-size:13.5px}
td,th{text-align:left;padding:8px;border-bottom:1px solid var(--line)}
th{color:var(--mut);font-size:11.5px;text-transform:uppercase;letter-spacing:.06em}
.win-with{color:var(--acc);font-weight:600}
.win-without{color:var(--good);font-weight:600}
.rounds{list-style:none;padding:0;margin:0}
.rounds li{border-bottom:1px solid var(--line);padding:14px 0;display:flex;gap:16px;align-items:baseline;flex-wrap:wrap}
.rounds b{font:600 15px ui-monospace,monospace}
.empty{color:var(--mut);padding:50px 0;text-align:center}
code{background:#0b0d12;padding:2px 6px;border-radius:4px;font-size:12.5px}
`

function shell(title, tabsHtml, body) {
  return `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><style>${STYLE}</style>
<header>
  <div><h1><a href="/" style="text-decoration:none;color:inherit">Testbed archive</a></h1>
  <div class="sub">Every past round, with its verdict. Arms are labelled — this is the record after the reveal.</div></div>
  <nav class="tabs">${tabsHtml}<a class="tab back" href="http://127.0.0.1:${REVIEW_PORT}">← Blind review</a></nav>
</header>
<main>${body}</main>`
}

function indexPage() {
  const rounds = listRounds()
  if (!rounds.length) {
    return shell('Archive', '', `<p class="empty">Nothing archived yet.<br><br>Run a round:<br><code>node scripts/run-all.mjs 2</code></p>`)
  }
  const items = rounds
    .map((round) => {
      const { info, scenarios } = roundSummary(round)
      const scored = scenarios.filter((s) => s.verdict).length
      return `<li>
        <b><a href="/r/${encodeURIComponent(round)}">${esc(round)}</a></b>
        <span class="sub">${esc(info.agent ?? '?')}${info.model ? ` · ${esc(info.model)}` : ''} · ${esc(info.direction ?? 'direction unstated')}</span>
        <span class="sub">${scenarios.length} scenario(s) · ${scored} scored</span>
        <span class="sub">${esc(scenarios.map((s) => s.scenario).join(', '))}</span>
      </li>`
    })
    .join('')
  return shell('Archive', '', `<ul class="rounds">${items}</ul>`)
}

function roundPage(round) {
  const { info, scenarios } = roundSummary(round)
  const tabs = listRounds()
    .map((r) => `<a class="tab${r === round ? ' on' : ''}" href="/r/${encodeURIComponent(r)}">${esc(r)}</a>`)
    .join('')

  const armCol = (scenario, a) => {
    const base = `/f/${encodeURIComponent(round)}/${encodeURIComponent(scenario)}/${a.arm}`
    if (!a.exists) return `<div class="col"><span class="tag">${a.arm} — not archived</span></div>`
    const base_label = a.meta?.arm === 'without' || a.arm === 'without' ? 'CONTROL — no skill' : 'WITH Dreative'
    const label = a.meta?.label ? `${base_label} · ${String(a.meta.label).toUpperCase()}` : base_label
    const links = [
      a.site ? `<a class="btn" href="/site/${encodeURIComponent(round)}/${encodeURIComponent(scenario)}/${a.arm}/" target="_blank" rel="noopener">Open site ↗</a>` : '',
      a.log ? `<a class="btn" href="${base}/agent.log" target="_blank" rel="noopener">Transcript</a>` : '',
      `<a class="btn" href="${base}/src/App.jsx" target="_blank" rel="noopener">App.jsx</a>`,
      `<a class="btn" href="${base}/BRIEF.md" target="_blank" rel="noopener">Brief</a>`,
    ].join('')
    const fail = a.buildFailed
      ? `<div class="lbl">Build failed — itself a finding</div><div class="fail">${esc(fs.readFileSync(path.join(ARCHIVE, round, scenario, a.arm, 'build-error.log'), 'utf8'))}</div>`
      : ''
    const shots = a.shots
      .map((f) => `<div class="lbl">${esc(f.replace('.png', ''))}</div><img class="shot${f.startsWith('mobile') ? ' mob' : ''}" loading="lazy" src="${base}/shots/${encodeURIComponent(f)}" alt="${esc(a.arm)} ${esc(f)}">`)
      .join('')
    return `<div class="col">
      <div class="tagrow"><span class="tag ${a.arm}">${label}</span>${a.meta.direction ? `<span class="sub">${esc(a.meta.direction)}</span>` : ''}${links}</div>
      ${fail}${shots}
    </div>`
  }

  const body = scenarios
    .map((s) => {
      const v = s.verdict
      const cell = (val) => (val === 'with' ? '<span class="win-with">WITH Dreative</span>' : val === 'without' ? '<span class="win-without">control</span>' : esc(val ?? '—'))
      const verdictHtml = v
        ? `<table>
            <tr><th>Criterion</th><th>Winner</th></tr>
            ${Object.entries(v.criteria ?? {}).map(([k, val]) => `<tr><td>${esc(k)}</td><td>${cell(val)}</td></tr>`).join('')}
            <tr><td><strong>Overall</strong></td><td>${cell(v.overall)}</td></tr>
          </table>
          <p class="sub" style="margin-top:10px"><strong>On the Dreative build:</strong> ${esc(v.feedback?.with || '—')}</p>
          <p class="sub"><strong>On the control:</strong> ${esc(v.feedback?.without || '—')}</p>
          <p class="sub"><strong>Summary:</strong> ${esc(v.summary || '—')}</p>`
        : `<p class="sub">Not scored. Run <code>node scripts/review.mjs</code> while this round is still in <code>runs/</code>.</p>`
      return `<div class="card">
        <h2>${esc(s.info.product ?? s.scenario)} <span class="sub">— ${esc(s.scenario)}</span></h2>
        <p>${esc(s.info.field ?? '')}${s.info.designChallenge ? ' — ' + esc(s.info.designChallenge) : ''}</p>
      </div>
      <div class="card">${verdictHtml}</div>
      <div class="grid">${s.arms.map((a) => armCol(s.scenario, a)).join('')}</div>`
    })
    .join('')

  const head = `<div class="card"><h2>Round ${esc(round)}</h2><p>${esc(info.agent ?? '?')}${info.model ? ` · ${esc(info.model)}` : ''} · direction ${esc(info.direction ?? 'unstated')} · archived ${esc(String(info.archivedAt ?? '').slice(0, 10))}</p></div>`
  return shell(`Round ${round}`, tabs, head + (body || '<p class="empty">No scenarios in this round.</p>'))
}

// ------------------------------------------------------------------ server

function sendFile(res, p, { download = false } = {}) {
  if (!p || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404).end('not found')
    return
  }
  const type = MIME[path.extname(p).toLowerCase()] ?? 'application/octet-stream'
  res.writeHead(200, { 'content-type': download ? 'text/plain; charset=utf-8' : type, 'cache-control': 'no-store' })
  fs.createReadStream(p).pipe(res)
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)

  if (parts[0] === 'f') {
    // Archived files: screenshots, sources, transcripts. Text is forced to text/plain so
    // App.jsx and agent.log open in the browser instead of downloading.
    sendFile(res, safeJoin(...parts.slice(1)), { download: /\.(jsx|js|css|md|log|txt|json|html)$/i.test(url.pathname) })
    return
  }

  if (parts[0] === 'site') {
    // The archived build, served exactly as it is. Built with a relative base, so it works
    // under this prefix with no rewriting and no dependencies.
    const rest = parts.slice(4)
    if (!rest.length && !url.pathname.endsWith('/')) {
      res.writeHead(302, { location: url.pathname + '/' }).end()
      return
    }
    const target = safeJoin(parts[1], parts[2], parts[3], 'site', ...(rest.length ? rest : ['index.html']))
    sendFile(res, target)
    return
  }

  if (parts[0] === 'r' && parts[1]) {
    if (!listRounds().includes(parts[1])) {
      res.writeHead(404).end('no such round')
      return
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
    res.end(roundPage(parts[1]))
    return
  }

  if (!parts.length) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
    res.end(indexPage())
    return
  }

  res.writeHead(404).end('not found')
})

const rounds = listRounds()
server.listen(PORT, '127.0.0.1', () => {
  console.log(`\nArchive:  http://127.0.0.1:${PORT}`)
  console.log(`${rounds.length} round(s) archived${rounds.length ? `: ${rounds.join(', ')}` : ' — run one with: node scripts/run-all.mjs 2'}`)
  console.log('\nCtrl+C to stop.\n')
})
