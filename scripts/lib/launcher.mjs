// Start a round, and see whether it is done, without leaving the browser.
//
// The round command is good and is not going away — it takes flags this page does not expose
// and it is what you want in a terminal you are watching. This exists because most rounds are
// now started from a phrase typed half-remembered from a week ago, and because once a round
// is running there was nowhere to look: closing the terminal lost the only progress display,
// and a run directory that is still working looks exactly like one that died.
//
// The launcher shells out to run-all.mjs rather than reimplementing any of it, so there is
// one code path for what a round is. Every flag the command takes for a normal round is on
// the form, including --gate: a round with no terminal publishes its keep/reject question to
// `.gate.json` and blocks until this page answers it (see gate.mjs).

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { LAUNCH_FILE, readLaunch, runStatuses } from './status.mjs'
import { pendingGate } from './gate.mjs'
import { ROOT, isSkillArm, listScenarios } from './scaffold.mjs'

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const DIRECTIONS = ['recommended', 'efficient', 'showcase']

const LOG_FILE = path.join(ROOT, 'runs', 'round.log')

/**
 * Turn the form into an argv for run-all.mjs. Everything is validated against a fixed set —
 * this endpoint spawns a process, so nothing from the request reaches a shell, and `shell`
 * is off in the spawn below.
 */
export function buildArgs(body) {
  const args = [path.join(ROOT, 'scripts', 'run-all.mjs')]

  const scenarios = String(body.scenarios ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const known = listScenarios()
  for (const s of scenarios) if (!known.includes(s)) throw new Error(`unknown scenario: ${s}`)
  if (!scenarios.length) throw new Error('pick at least one scenario')
  args.push('--scenarios', scenarios.join(','))

  const arms = String(body.arms ?? 'with-a')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
  for (const a of arms) {
    if (a !== 'without' && a !== 'with' && !/^with-[a-z0-9]+$/i.test(a)) throw new Error(`unknown arm: ${a}`)
  }
  args.push('--arms', arms.join(','))

  const direction = String(body.direction ?? 'recommended')
  if (!DIRECTIONS.includes(direction) && direction !== 'random' && direction !== 'none') {
    throw new Error(`unknown direction: ${direction}`)
  }
  args.push('--direction', direction)

  const timeout = Number(body.timeout ?? 40)
  if (!Number.isInteger(timeout) || timeout < 5 || timeout > 240) throw new Error('timeout must be 5-240 minutes')
  args.push('--timeout', String(timeout))

  const repeat = Number(body.repeat ?? 1)
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 5) throw new Error('sessions must be 1-5')
  if (repeat > 1) args.push('--repeat', String(repeat))

  // Which skill tree each arm runs. `git:<ref>` is the whole point of the field — it is how
  // an edit is tested against the tree that came before it.
  for (const arm of arms) {
    // The control has no skill by definition, and `'without'.slice(5)` is 'ut' — which would
    // look for a `skill_ut` field and quietly find nothing.
    if (!isSkillArm(arm)) continue
    const suffix = arm === 'with' ? '' : arm.slice(5)
    const key = suffix ? `skill_${suffix}` : 'skill'
    const raw = String(body[key] ?? '').trim()
    if (!raw) continue
    if (!/^(git:[\w./-]+|[A-Za-z]:[\\/][^"|<>]*|\.{0,2}[\\/][^"|<>]*)$/.test(raw)) {
      throw new Error(`skill for ${arm} must be git:<ref> or a directory path`)
    }
    args.push(suffix ? `--skill-${suffix}` : '--skill', raw)
  }

  if (body.prototype) args.push('--prototype')
  else if (body.gate) args.push('--gate')
  if (body.noYolo) args.push('--no-yolo')

  const model = String(body.model ?? '').trim()
  if (model) {
    if (!/^[\w.:-]{1,60}$/.test(model)) throw new Error('model name looks wrong')
    args.push('--model', model)
  }

  const concurrency = Number(body.concurrency ?? 3)
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) throw new Error('concurrency must be 1-8')
  args.push('--concurrency', String(concurrency))

  const label = String(body.label ?? '').trim()
  if (label) {
    if (label.length > 80) throw new Error('label is too long')
    args.push('--label', label)
  }

  return args
}

/** Spawn the round detached, and record enough for status to recognise it later. */
export function startRound(body) {
  const running = readLaunch()
  if (running?.alive) throw new Error(`a round launched from here is still running (pid ${running.pid})`)

  const args = buildArgs(body)
  const logFile = LOG_FILE
  fs.mkdirSync(path.dirname(logFile), { recursive: true })
  // A new round owns the log. Appending meant the panel opened on the tail of the *last*
  // round — output that looked like this round's progress and never moved.
  const out = fs.openSync(logFile, 'w')

  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    detached: true,
    shell: false,
    // Without this every child the round spawns (npm, wmic, taskkill, the agent CLI) opens
    // its own console window, because a detached process has no console to inherit.
    windowsHide: true,
    stdio: ['ignore', out, out],
  })
  child.unref()

  const record = {
    pid: child.pid,
    startedAt: new Date().toISOString(),
    command: `node scripts/run-all.mjs ${args.slice(1).join(' ')}`,
    log: path.relative(ROOT, logFile),
  }
  fs.writeFileSync(LAUNCH_FILE, JSON.stringify(record, null, 2), 'utf8')
  return record
}

/** The last N lines of the launched round's log, so the page can show progress. */
export function roundLog(lines = 40) {
  if (!fs.existsSync(LOG_FILE)) return ''
  const text = fs.readFileSync(LOG_FILE, 'utf8')
  return text.split('\n').slice(-lines).join('\n')
}

/**
 * Throw away the log and the record of the last launch. Called by Reset — a round that has
 * been archived should not leave its output on the page describing runs/ that no longer
 * exist — and available on its own, for a log left behind by a round that died.
 */
export function clearRoundLog() {
  const running = readLaunch()
  if (running?.alive) throw new Error(`the round from ${running.startedAt.slice(11, 19)} is still running (pid ${running.pid}) — it is writing this log`)
  fs.rmSync(LOG_FILE, { force: true })
  fs.rmSync(LAUNCH_FILE, { force: true })
}

// ------------------------------------------------------------------ the page

const DOT = {
  running: '#3b82f6',
  stalled: '#a16207',
  truncated: '#b91c1c',
  rejected: '#b91c1c',
  empty: '#b91c1c',
  built: '#15803d',
  finished: '#6b7280',
}

function statusTable(rows) {
  if (!rows.length) return '<p class="sub">runs/ is empty — nothing has been run, or the last round was reset.</p>'
  const body = rows
    .map((r) => {
      const bits = []
      if (r.state === 'running') bits.push(`${r.logKb}kb of log · last wrote ${r.idleMinutes}m ago`)
      if (r.truncated) bits.push(esc(r.truncated))
      if (r.buildFailed) bits.push('<strong>build failed</strong>')
      if (r.looked) bits.push(`${r.broken} broken · ${r.inertSections} inert section(s)`)
      else if (r.state === 'built') bits.push('never rendered its own build')
      if (r.smokeOk === false) bits.push('smoke blocked')
      if (r.scored) bits.push('<strong>scored</strong>')
      return (
        '<tr>' +
        `<td><span style="color:${DOT[r.state] ?? '#6b7280'}">●</span> ${esc(r.state)}</td>` +
        `<td><code>${esc(r.run)}</code></td>` +
        `<td class="sub">${bits.join(' · ') || '—'}</td>` +
        '</tr>'
      )
    })
    .join('')
  return `<table class="status"><tr><th>State</th><th>Run</th><th>What is known about it</th></tr>${body}</table>`
}

export function statusPage({ style = '', reviewPath = '/' } = {}) {
  const rows = runStatuses()
  const launch = readLaunch()
  const scenarios = listScenarios()

  const gate = pendingGate()
  const gatePanel = gate
    ? `<div class="panel" style="border-color:#3b82f6">
        <h2 style="margin:0 0 6px;font-size:16px">${esc(gate.question || 'A round is waiting on you')}</h2>
        <p class="sub" style="margin:0 0 14px">It has built <code>${esc(gate.current)}</code> and stopped. Nothing else runs until you answer.</p>
        ${gate.briefing.truncated ? `<div class="fail">TRUNCATED — ${esc(gate.briefing.truncated)}. This build did not finish, so its defects and missing stages are unattributable. Reject it and re-run.</div>` : ''}
        ${
          gate.briefing.looked
            ? gate.briefing.broken.length
              ? `<div class="lbl">Broken (${gate.briefing.broken.length})</div><ul class="sub">${gate.briefing.broken
                  .slice(0, 8)
                  .map((b) => `<li>${esc(b)}</li>`)
                  .join('')}</ul>`
              : '<p class="sub">Nothing broken.</p>'
            : '<p class="sub">Nothing rendered this build before you did.</p>'
        }
        ${gate.briefing.inert && gate.briefing.inert.length ? `<p class="sub">${gate.briefing.inert.length} section(s) with nothing happening across them.</p>` : ''}
        ${gate.briefing.smokeBlockers ? `<div class="warn">visual smoke blocked: ${esc(gate.briefing.smokeBlockers.slice(0, 3).join(' | '))}</div>` : ''}
        <p style="margin-top:14px"><a class="livebtn" href="${esc(gate.url)}" target="_blank" rel="noopener">Open the build ↗</a></p>
        <p style="margin-top:14px">
          <button id="gateKeep">Keep it</button>
          <button id="gateReject" style="margin-left:8px">Throw it out</button>
          <span class="sub" id="gateMsg" style="margin-left:10px"></span>
        </p>
        ${gate.remaining.length ? `<p class="sub">${gate.remaining.length} more run(s) after this one.</p>` : ''}
      </div>`
    : ''

  const launchNote = launch
    ? `<div class="note"><h3>${launch.alive ? 'A round is running now' : 'Last round started from here has exited'}</h3>
       <p><code>${esc(launch.command)}</code><br>pid ${launch.pid}, started ${esc(launch.startedAt.slice(0, 19).replace('T', ' '))}</p></div>`
    : ''

  return `<!doctype html><meta charset="utf-8"><title>Status — Dreative testbed</title>
<style>${style}
.status{width:100%;border-collapse:collapse;margin:8px 0 24px}
.status th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--mut,#6b7280);padding:6px 10px;border-bottom:1px solid var(--line,#ddd)}
.status td{padding:7px 10px;border-bottom:1px solid var(--line,#eee);font-size:13px;vertical-align:top}
.form{display:grid;grid-template-columns:150px 1fr;gap:10px 14px;align-items:center;max-width:760px}
.form label{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut,#6b7280)}
.form input,.form select{padding:7px 9px;font:inherit;font-size:13px;border:1px solid var(--line,#ccc);border-radius:6px;background:var(--card,#fff);color:inherit;width:100%}
pre.log{background:#111;color:#ddd;padding:12px;border-radius:8px;font-size:12px;overflow:auto;max-height:320px;white-space:pre-wrap}
</style>
<header>
  <div><h1>Status <span class="sub">· ${rows.length} run(s) in runs/</span></h1>
  <div class="sub">Refreshes every 15 seconds. <a href="${reviewPath}">Review and score →</a></div></div>
</header>
<main>
  ${gatePanel}
  ${launchNote}
  ${statusTable(rows)}

  <div class="panel">
    <h2 style="margin:0 0 14px;font-size:16px">Start a round</h2>
    <div class="form">
      <label for="f-scen">Scenarios</label>
      <select id="f-scen" multiple size="${Math.min(scenarios.length, 8)}">
        ${scenarios.map((s) => `<option value="${esc(s)}"${s === 'storefront-ceramics' ? ' selected' : ''}>${esc(s)}</option>`).join('')}
      </select>

      <label for="f-compare">Compare</label>
      <select id="f-compare">
        <option value="solo" selected>Dreative on its own — one build, scored on its own axes</option>
        <option value="control">Dreative vs plain Claude — same brief, one arm without the skill</option>
        <option value="versions">Dreative vs Dreative — two skill versions, blind</option>
      </select>

      <label for="f-skill-a">Dreative version</label>
      <input id="f-skill-a" value="git:HEAD" placeholder="git:HEAD, git:&lt;sha&gt;, a branch, or a directory — blank uses what is installed">

      <label for="f-skill-b" id="l-skill-b">Compared against</label>
      <input id="f-skill-b" value="" placeholder="the other version, e.g. git:e9638f5 — only for Dreative vs Dreative">

      <label for="f-dir">Direction</label>
      <select id="f-dir">${['recommended', 'efficient', 'showcase', 'random', 'none']
        .map((d) => `<option${d === 'recommended' ? ' selected' : ''}>${d}</option>`)
        .join('')}</select>

      <label for="f-sessions">Sessions each</label>
      <input id="f-sessions" type="number" min="1" max="5" value="1">

      <label for="f-timeout">Time cap (min)</label>
      <input id="f-timeout" type="number" min="5" max="240" value="40">

      <label for="f-model">Model</label>
      <input id="f-model" placeholder="blank uses your CLI default — e.g. opus">

      <label for="f-conc">Concurrency</label>
      <input id="f-conc" type="number" min="1" max="8" value="3">

      <label for="f-label">Label</label>
      <input id="f-label" placeholder="what this round is testing — you will read this in three months">

      <label for="f-proto">Prototype first</label>
      <label class="sub" style="text-transform:none;letter-spacing:0">
        <input type="checkbox" id="f-proto" checked style="width:auto"> build the signature moment first and stop — I decide before the page is built</label>

      <label for="f-gate">Gate the finished build</label>
      <label class="sub" style="text-transform:none;letter-spacing:0">
        <input type="checkbox" id="f-gate" checked style="width:auto"> stop after each build and ask me here before it can be scored</label>

      <label for="f-yolo">Permissions</label>
      <label class="sub" style="text-transform:none;letter-spacing:0">
        <input type="checkbox" id="f-yolo" style="width:auto"> scope tools instead of full bypass (slower, closer to a cautious user)</label>
    </div>
    <p style="margin-top:16px"><button id="go"${launch?.alive ? ' disabled' : ''}>${launch?.alive ? 'Round running' : 'Start round'}</button>
      <span class="sub" id="msg" style="margin-left:10px">${launch?.alive ? `pid ${launch.pid}, started ${esc(launch.startedAt.slice(11, 19))} — only one round at a time` : ''}</span></p>
    <p class="sub"><strong>An arm is one side of the comparison</strong> — one agent session, on the
      same scenario and the same brief, differing in exactly one thing. Two arms on one scenario is
      a pair, and the review shows them side by side as A and B without telling you which is which
      until you submit. One arm is not a comparison, so it is scored on its own axes instead.</p>
    <p class="sub">Every run is scaffolded with its own headless browser (Playwright MCP) and the
      installed Dreative CLI, on every arm — the same tools a normal user's agent has. Nothing in
      the brief mentions either; whether the agent uses them is the finding.</p>
  </div>

  <div class="panel">
    <div class="lbl">Round log
      <button id="clearLog" style="margin-left:10px;font-size:11px;padding:3px 8px"${launch?.alive ? ' disabled title="the running round is writing this"' : ''}>Clear</button>
      <span class="sub" id="clearMsg" style="margin-left:8px"></span></div>
    <pre class="log" id="log">${esc(roundLog()) || 'Nothing yet — this fills in once a round is started from here.'}</pre>
  </div>
</main>
<script>
const GATE_RUN = ${JSON.stringify(gate?.current ?? null)};
const sel = (id) => document.getElementById(id);
// The second version only means anything in a version comparison; showing it the rest of the
// time invited filling it in and quietly getting an arm nobody asked for.
function syncCompare() {
  const versions = sel('f-compare').value === 'versions';
  for (const id of ['l-skill-b', 'f-skill-b']) sel(id).style.display = versions ? '' : 'none';
}
sel('f-compare').addEventListener('change', syncCompare);
syncCompare();
sel('go').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const scen = [...sel('f-scen').selectedOptions].map((o) => o.value);
  if (!scen.length) { sel('msg').textContent = 'pick at least one scenario'; return; }
  const mode = sel('f-compare').value;
  const arms = mode === 'control' ? 'with-a,without' : mode === 'versions' ? 'with-a,with-b' : 'with-a';
  if (mode === 'versions' && !sel('f-skill-b').value.trim()) {
    sel('msg').textContent = 'a version comparison needs both versions';
    return;
  }
  // Starting takes a few seconds (a scaffold and an npm install per arm) and there is no
  // output until then. Say so on the button itself: a button that only greys out reads as a
  // page that did not register the click, and the second click was the bug.
  btn.disabled = true;
  btn.dataset.label = btn.textContent;
  btn.textContent = 'Starting…';
  sel('msg').textContent = 'scaffolding the run — this takes a few seconds, do not press again';
  const res = await fetch('/api/run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      scenarios: scen.join(','),
      arms,
      skill_a: sel('f-skill-a').value,
      skill_b: sel('f-skill-b').value,
      direction: sel('f-dir').value,
      repeat: Number(sel('f-sessions').value),
      timeout: Number(sel('f-timeout').value),
      label: sel('f-label').value,
      model: sel('f-model').value,
      concurrency: Number(sel('f-conc').value),
      gate: sel('f-gate').checked,
      prototype: sel('f-proto').checked,
      noYolo: sel('f-yolo').checked,
    }),
  });
  if (!res.ok) {
    sel('msg').textContent = await res.text();
    btn.disabled = false; btn.textContent = btn.dataset.label;
    return;
  }
  const out = await res.json();
  btn.textContent = 'Round running';
  sel('msg').textContent = 'started — pid ' + out.pid + '. Progress appears in the round log below.';
  setTimeout(() => location.reload(), 2500);
});
const clear = sel('clearLog');
clear?.addEventListener('click', async () => {
  clear.disabled = true; sel('clearMsg').textContent = 'clearing…';
  const res = await fetch('/api/clear-log', { method: 'POST' });
  if (!res.ok) { sel('clearMsg').textContent = await res.text(); clear.disabled = false; return; }
  sel('log').textContent = 'Nothing yet — this fills in once a round is started from here.';
  sel('clearMsg').textContent = 'cleared';
  setTimeout(() => location.reload(), 800);
});
for (const [id, decision] of [['gateKeep', 'keep'], ['gateReject', 'reject']]) {
  const btn = document.getElementById(id);
  if (!btn) continue;
  btn.addEventListener('click', async () => {
    document.getElementById('gateKeep').disabled = true;
    document.getElementById('gateReject').disabled = true;
    document.getElementById('gateMsg').textContent = 'sending…';
    const res = await fetch('/api/gate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ run: GATE_RUN, decision }),
    });
    document.getElementById('gateMsg').textContent = res.ok ? 'sent — the round is moving on' : await res.text();
    setTimeout(() => location.reload(), 2000);
  });
}
setInterval(async () => {
  const res = await fetch('/api/status');
  if (!res.ok) return;
  const out = await res.json();
  sel('log').textContent = out.log;
  if (out.changed) location.reload();
}, 15000);
</script>`
}
