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
import { archiveRound, findRoundForRun, listRounds, syncVerdict } from './lib/archive.mjs'
import { freePort, killProcessesIn, killTree, npmCommand, spawnPreview } from './lib/capture.mjs'
import { pairHealth } from './lib/health.mjs'
import { readSmoke } from './lib/smoke.mjs'
import { recordVerdict } from './lib/vault.mjs'
import { clearRoundLog, roundLog, startRound, statusPage } from './lib/launcher.mjs'
import { readLaunch, runStatuses } from './lib/status.mjs'
import { answerGate, pendingGate } from './lib/gate.mjs'
import { armTitle, ROOT, RUNS, readScenario } from './lib/scaffold.mjs'

const PORT = Number(process.argv[process.argv.indexOf('--port') + 1]) || 4321
const VERDICT_DIR = path.join(RUNS, 'verdicts')
const ASSIGN_FILE = path.join(RUNS, '.review-assignments.json')
// Last seen run-state fingerprint, so /api/status can tell the page when something
// actually moved rather than making it reload on a timer.
let lastFingerprint = null
const CLEARED_FILE = path.join(RUNS, '.cleared-rounds.json')

const CRITERIA = [
  ['distinct', 'Distinctiveness', 'Could this be any other company? Swap the logo and copy for a competitor — does it still work perfectly? Then it is generic.'],
  ['fit', 'Fit to the product', 'Does the design say something true about this specific business, or is it generic polish?'],
  ['hierarchy', 'Hierarchy and pacing', 'Squint until it blurs. Do you still see structure, or an even grey texture?'],
  ['craft', 'Craft', 'Alignment, spacing consistency, type, contrast, edges. Count the defects — it is that mechanical.'],
  ['mobile', 'Mobile', 'Is 390px designed, or is it the desktop layout surviving? Check overflow, collisions, tiny tap targets.'],
  ['restraint', 'Restraint', 'For every visible effect, what is it for? Decoration doing no work counts against.'],
]

// Single-arm rounds get their own axes, because the six above are all written as
// with-versus-control questions and a solo round has nothing to compare against. Until
// 2026-09-05 that meant a one-arm round saved nothing at all — and since the control was
// retired on 2026-09-04, one arm is how most rounds are now run. Verdicts on those lived
// only in chat, which is how "tables and labels" accumulated six complaints and no
// movement: nothing was written anywhere you could sort or count.
//
// Scored 1-5 rather than pass/fail. These are not gates and nothing reads them back into
// a build; they exist so that a flat line across rounds becomes visible as a flat line.
const SOLO_AXES = [
  ['material', 'Material', 'Is the imagery sourced and real, of this subject, and treated into one set — or assembled from whatever was findable?'],
  ['subject', 'Subject', 'Is the thing being sold actually shown, in the state a buyer cares about?'],
  ['motion', 'Motion', 'Does anything move that carries meaning, or is it a page of stills with fades on them?'],
  ['craft', 'Craft', 'Alignment, spacing, type, contrast, edges, and 390px. Count the defects — it is that mechanical.'],
  ['structure', 'Structure and pacing', 'Squint until it blurs. Do you still see structure, or an even grey texture?'],
]

const readJson = (p, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}

const clearedRounds = () => readJson(CLEARED_FILE, [])

/**
 * Delete leftovers from rounds that were already archived and retired. Whatever held a
 * directory open during the reset has long since exited by the next time the server starts,
 * so the second attempt is the one that succeeds.
 */
function sweepCleared() {
  const cleared = clearedRounds()
  if (!cleared.length || !fs.existsSync(RUNS)) return 0
  let swept = 0
  for (const dir of fs.readdirSync(RUNS)) {
    const full = path.join(RUNS, dir)
    if (!fs.statSync(full).isDirectory()) continue
    const meta = readJson(path.join(full, 'run.json'), null)
    if (!meta || !cleared.includes(meta.seq)) continue
    killProcessesIn(full)
    try {
      fs.rmSync(full, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
      swept++
    } catch {
      /* still locked — it is retired either way, try again next start */
    }
  }
  return swept
}

function liveRuns() {
  if (!fs.existsSync(RUNS)) return []
  return fs
    .readdirSync(RUNS)
    .filter((d) => {
      const dir = path.join(RUNS, d)
      return fs.statSync(dir).isDirectory() && fs.existsSync(path.join(dir, 'run.json'))
    })
    .map((d) => ({ dir: d, meta: readJson(path.join(RUNS, d, 'run.json'), null) }))
    .filter((r) => r.meta)
    // A round that has been archived is done, whether or not Windows let go of its
    // directories. The marker is what retires it — leftover folders must never reappear
    // as something still waiting to be scored.
    .filter((r) => !clearedRounds().includes(r.meta.seq))
    // Marked, not hidden. See isUnbuilt.
    .map((r) => ({ ...r, unbuilt: isUnbuilt(r.dir, r.meta) }))
}

/**
 * Is this run a prototype rather than a built page — phase 1 of 2, with the round paused?
 *
 * On 2026-09-06 a prototype was scored 1/5 as a finished shop, because the review showed it
 * exactly like one. A prototype is worth opening and worth a verdict — stopping there to look
 * is the whole point of the gate — so it stays in the review. What it must never do is arrive
 * unlabelled: the score means something different, and the round is still waiting on an answer.
 *
 * `builtAt` is stamped by run-all when a run's sessions end, which is the direct answer. Runs
 * from before that stamp, and rounds killed before writing it, fall back to the gate and the
 * log: the run a gate is asking about, or one whose agent.log is still growing, is not built.
 */
function isUnbuilt(dir, meta) {
  if (meta.rejected || meta.builtAt) return false
  const gate = pendingGate()
  if (gate?.current === dir) return true
  return runStatuses().some((r) => r.run === dir && r.state === 'running')
}

const isCaptured = (r) => fs.existsSync(path.join(RUNS, r.dir, '.captures', 'desktop.png'))

function loadPairs() {
  const live = liveRuns()
  const byScenario = new Map()
  for (const r of live) {
    if (!byScenario.has(r.meta.scenario)) byScenario.set(r.meta.scenario, [])
    byScenario.get(r.meta.scenario).push(r)
  }

  const pairs = []
  for (const [scenario, list] of byScenario) {
    // Both sides must come from the same round. Taking the newest of each arm
    // independently silently pairs this round's "with" against a previous round's
    // "without" whenever one arm is missing — a comparison of two different experiments.
    //
    // And only ever the newest round for this scenario. Searching backwards for the newest
    // round that happens to be fully captured meant a cancelled run did not leave the
    // scenario empty: it quietly re-served a pair from weeks ago, under that older round's
    // number, as if it were what you had just run. A round you interrupted has nothing to
    // judge — say nothing rather than answer with the wrong round.
    const seq = [...new Set(list.map((r) => r.meta.seq))].sort().reverse()[0]
    if (!seq) continue
    // The pair is whichever two arms this round actually ran. It is usually with-vs-control,
    // but a round can also put two Dreative arms against each other (--arms with-a,with-b),
    // and then there is no "with" run to look for. Anything other than exactly two captured
    // arms is not a comparison and falls through to the solo view.
    const captured = isCaptured
    const inRound = list.filter((r) => r.meta.seq === seq && captured(r))
    const armNames = [...new Set(inRound.map((r) => r.meta.arm))].sort()
    if (armNames.length !== 2) continue
    const firstArm = inRound.find((r) => r.meta.arm === armNames[0])
    const secondArm = inRound.find((r) => r.meta.arm === armNames[1])
    if (!firstArm || !secondArm) continue

    const assignments = readJson(ASSIGN_FILE, {})
    const key = `${scenario}::${firstArm.dir}::${secondArm.dir}`
    if (!assignments[key]) {
      assignments[key] = Math.random() < 0.5 ? 'first-is-A' : 'second-is-A'
      fs.mkdirSync(RUNS, { recursive: true })
      fs.writeFileSync(ASSIGN_FILE, JSON.stringify(assignments, null, 2), 'utf8')
    }
    // Older assignment files spoke of the with arm; it is the same choice under both names.
    const firstIsA = assignments[key] === 'first-is-A' || assignments[key] === 'with-is-A'

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
      A: firstIsA ? firstArm : secondArm,
      B: firstIsA ? secondArm : firstArm,
      // A verdict counts only if it judged *these* two runs. Keying it on the scenario
      // alone carried last round's tick onto this round's untouched pair.
      scored: (() => {
        const prev = readJson(path.join(VERDICT_DIR, `${scenario}.json`), null)
        const judged = new Set(Object.values(prev?.runs ?? {}))
        return judged.size === 2 && judged.has(firstArm.dir) && judged.has(secondArm.dir)
      })(),
      health: pairHealth(firstArm.dir, secondArm.dir, firstArm.meta.arm, secondArm.meta.arm),
    })
  }
  return pairs.sort((a, b) => a.scenario.localeCompare(b.scenario))
}

/**
 * Captured runs the blind pair does not cover: a one-armed round (`--arms with`) and the
 * extra repeats of a variance round (`--repeat N`). There is nothing to compare them
 * against, so they are shown rather than scored — no criteria, no verdict, no reveal.
 * Without this a variance round is invisible here and the only way to see what it built
 * is to open the PNGs off disk.
 *
 * A scenario whose pair is still unscored is skipped: its repeats are the same designs
 * built twice, and putting an arm-labelled twin next to an unjudged blind pair would
 * give the answer away. Once the pair is scored the blind is spent and they appear.
 */
function loadSolos(pairs) {
  const used = new Set(pairs.flatMap((p) => [p.A.dir, p.B.dir]))
  const blinded = new Set(pairs.filter((p) => !p.scored && p.health.judgeable).map((p) => p.scenario))

  const byScenario = new Map()
  for (const r of liveRuns()) {
    if (!byScenario.has(r.meta.scenario)) byScenario.set(r.meta.scenario, [])
    byScenario.get(r.meta.scenario).push(r)
  }

  const solos = []
  for (const [scenario, list] of byScenario) {
    if (blinded.has(scenario)) continue
    // Not just the newest round. `--repeat 1` run twice makes two rounds of one run each
    // — the same experiment split in half — and taking only the newest silently hid the
    // first half. Everything still in runs/ is live work by definition: a finished round
    // is archived and cleared, so nothing stale can surface here. There is no verdict on
    // this page and every column names its own round, so there is nothing to confuse.
    // A run whose build broke has no screenshot, but it is still the most informative
    // thing in the round — hiding it is how a session that was killed mid-edit silently
    // disappears from the only page anyone opens.
    const runs = list.filter((r) => !used.has(r.dir) && (isCaptured(r) || buildFailure(r.dir)))
    if (!runs.length) continue
    const seq = [...new Set(runs.map((r) => r.meta.seq))].sort().reverse()[0]
    let info = {}
    try {
      info = readScenario(scenario)
    } catch {
      /* scenario folder may have been renamed */
    }
    solos.push({
      scenario,
      seq,
      runs: runs.sort((a, b) => a.dir.localeCompare(b.dir)),
      product: info.product ?? scenario,
      field: info.field ?? '',
      challenge: info.designChallenge ?? '',
    })
  }
  return solos.sort((a, b) => a.scenario.localeCompare(b.scenario))
}

/** r1 / r2 for a variance round, otherwise which arm it was. */
/**
 * r1/r2 inside one round; otherwise the round itself, because when a view spans rounds
 * that is what actually differs between the columns. Falls back to the arm.
 */
const runLabel = (run, spansRounds) => {
  if (spansRounds) return run.meta.label ? `${run.meta.seq} · ${String(run.meta.label).toUpperCase()}` : String(run.meta.seq)
  if (run.meta.label) return String(run.meta.label).toUpperCase()
  return armTitle(run.meta.arm).toUpperCase()
}

function buildFailure(runDir) {
  const p = path.join(RUNS, runDir, 'build-error.log')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null
}

// Dreative's own visual-smoke measurement, run by the harness against both arms after the
// build. Shown because "nothing on this route moves" is the finding the eye keeps missing
// in a still, and a screenshot cannot show it by construction. It is identical in kind for
// both arms and names neither, so the review stays blind.
function smokeNote(runDir) {
  const smoke = readSmoke(path.join(RUNS, runDir))
  if (!smoke) return null
  if (smoke.ok === null) return { kind: 'warn', text: `Visual smoke could not run — ${smoke.error}` }
  if (smoke.ok) return { kind: 'ok', text: `Visual smoke passed · ${smoke.checks.length} checks at ${smoke.profile}` }
  return { kind: 'fail', text: `Visual smoke blocked · ${smoke.blockers.join(' · ')}` }
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

// Finished rounds live in the archive viewer, which is a separate script on its own port.
// Nobody remembers that, so it is started alongside the review server and linked from the
// header — otherwise every past round is invisible from the only page you actually open.
let ARCHIVE_PORT = null
let archiveProc = null

async function startArchiveViewer() {
  if (process.argv.includes('--no-archive') || !listRounds().length) return

  // Never hard-code 4322. A review server left running from an earlier session already owns
  // it, and the second viewer then dies of EADDRINUSE with its stdio thrown away — leaving a
  // header link to a port that answers for somebody else, or for nobody. Take a port the OS
  // says is free, then prove the viewer answers on it before advertising it at all.
  const port = await freePort(4322)
  const args = [path.join(ROOT, 'scripts', 'archive.mjs'), '--port', String(port), '--review-port', String(PORT)]
  const proc = spawn(process.execPath, args, { cwd: ROOT, stdio: 'ignore', windowsHide: true })
  let dead = false
  proc.on('error', () => {
    dead = true
  })
  proc.on('exit', () => {
    dead = true
    ARCHIVE_PORT = null
  })

  for (let i = 0; i < 40 && !dead; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`)
      if (res.ok) {
        archiveProc = proc
        ARCHIVE_PORT = port
        return
      }
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  killTree(proc.pid)
}

const live = new Map() // runDir -> { port, proc }

async function startLive(runDir) {
  if (live.has(runDir)) return live.get(runDir).port
  const dir = path.join(RUNS, runDir)
  if (!fs.existsSync(path.join(dir, 'dist'))) {
    const npm = npmCommand(['run', 'build'])
    const build = spawn(npm.command, npm.args, { cwd: dir, shell: npm.shell, stdio: 'ignore', windowsHide: true })
    await new Promise((r) => build.on('close', r))
  }
  const port = await freePort(0)
  const proc = spawnPreview(dir, port)
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
  if (archiveProc) killTree(archiveProc.pid)
  archiveProc = null
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    stopAllLive()
    process.exit(0)
  })
}
process.on('exit', stopAllLive)

// ------------------------------------------------------------------ writing

// The scoreboard used to be hand-maintained, so it drifted: it read 1 verdict
// while eight were recorded below it. It is now derived from the verdict blocks
// themselves on every submission. A round retracted after the fact is excluded
// by putting `<!-- void: <run-directory> -->` on its own line anywhere in the
// file. It matches the run, not the scenario or the date, because one scenario
// is often scored more than once on the same day and only one of those rounds
// is bad. Voiding is a deliberate edit, never inferred from prose.
export function rebuildScoreboard() {
  const file = path.join(ROOT, 'VERDICTS.md')
  if (!fs.existsSync(file)) return
  const text = fs.readFileSync(file, 'utf8')
  const voided = new Set([...text.matchAll(/<!--\s*void:\s*(\S+)\s*-->/g)].map((m) => m[1]))

  const tally = new Map()
  const blocks = text.split(/^## (?=\S)/m).slice(1)
  for (const block of blocks) {
    const heading = block.match(/^(\S+) — (\d{4}-\d{2}-\d{2})/)
    const overall = block.match(/^\|\s*\*\*Overall\*\*\s*\|\s*([^|]+?)\s*\|/m)
    if (!heading || !overall) continue
    const [, scenario] = heading
    const runs = [...block.matchAll(/^- (?:with|without):\s+`([^`]+)`/gm)].map((m) => m[1])
    if (runs.some((run) => voided.has(run))) continue
    const row = tally.get(scenario) ?? { with: 0, without: 0, tie: 0 }
    const winner = overall[1].trim()
    if (winner === 'WITH Dreative') row.with += 1
    else if (winner === 'control') row.without += 1
    else if (/^tie$/i.test(winner)) row.tie += 1
    else continue
    tally.set(scenario, row)
  }

  const scenarios = [...tally.keys()].sort()
  const rows = scenarios.map((name) => {
    const row = tally.get(name)
    return `| ${name} | ${row.with} | ${row.without} | ${row.tie} |`
  })
  const totals = scenarios.reduce((sum, name) => {
    const row = tally.get(name)
    return { with: sum.with + row.with, without: sum.without + row.without, tie: sum.tie + row.tie }
  }, { with: 0, without: 0, tie: 0 })
  const table = [
    '| Scenario | With Dreative | Without | Tie |',
    '|---|---|---|---|',
    ...rows,
    `| **Total** | **${totals.with}** | **${totals.without}** | **${totals.tie}** |`,
  ].join('\n')

  // Anchored on the table's own header row rather than the surrounding prose,
  // so editing the note above it cannot silently stop the rebuild.
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const updated = text.replace(
    /^\| Scenario \| With Dreative \| Without \| Tie \|\r?\n(?:\|[^\r\n]*\r?\n)+/m,
    `${table.split('\n').join(eol)}${eol}`,
  )
  if (updated !== text) fs.writeFileSync(file, updated, 'utf8')
}

/**
 * A verdict on a round with nothing to compare against.
 *
 * Written to the same places a paired verdict goes — runs/verdicts/, VERDICTS.md, and the
 * vault — so one place holds every judgement rather than the paired ones being recorded and
 * the solo ones being typed into a chat window and lost. The block it appends deliberately
 * does not match the with-versus-control shapes that rebuildScoreboard() reads, so a solo
 * round cannot silently land in a tally it is not part of.
 */
function saveSoloVerdict(body) {
  fs.mkdirSync(VERDICT_DIR, { recursive: true })
  const solos = loadSolos(loadPairs())
  const solo = solos.find((v) => v.scenario === body.scenario)
  if (!solo) throw new Error('unknown scenario')

  const runDir = body.run && solo.runs.some((r) => r.dir === body.run) ? body.run : solo.runs[0].dir
  const run = solo.runs.find((r) => r.dir === runDir)
  const score = (key) => {
    const n = Number(body.scores?.[key] ?? (key === 'overall' ? body.overall : undefined))
    return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null
  }

  const record = {
    kind: 'solo',
    scenario: body.scenario,
    judgedAt: new Date().toISOString(),
    run: runDir,
    arm: run?.meta?.arm ?? null,
    direction: run?.meta?.direction ?? null,
    skill: run?.meta?.skill ?? null,
    round: run?.meta?.seq ?? solo.seq,
    truncated: run?.meta?.truncated ?? null,
    // A prototype scores on the same axes but does not mean the same thing, and in three
    // months only this field will remember which it was.
    phase: run?.unbuilt ? 'prototype' : 'built',
    scores: Object.fromEntries(SOLO_AXES.map(([k]) => [k, score(k)])),
    overall: score('overall'),
    notes: body.notes ?? '',
    keep: body.keep ?? '',
  }

  // Same filename a paired verdict uses, because archive.mjs and syncVerdict already key off
  // `<scenario>.json` and a second naming scheme would quietly fall out of both. The round
  // is inside the record, and VERDICTS.md keeps the history.
  fs.writeFileSync(path.join(VERDICT_DIR, `${body.scenario}.json`), JSON.stringify(record, null, 2), 'utf8')

  const show = (v) => (v === null ? '—' : `${v} / 5`)
  const rows = [...SOLO_AXES.map(([k, name]) => [name, record.scores[k]]), ['**Overall**', record.overall]]
    .map(([name, v]) => `| ${name} | ${show(v)} |`)
    .join('\n')

  const block = `
## ${body.scenario} — ${record.judgedAt.slice(0, 10)} — single arm${record.phase === 'prototype' ? ' — PROTOTYPE (phase 1 of 2)' : ''}

- run:   \`${record.run}\`
- arm:   ${record.arm ?? '—'} · direction ${record.direction ?? '—'} · skill ${record.skill ?? '—'}
${record.truncated ? `- NOTE:  this build was TRUNCATED (${record.truncated}) and is not evidence about the skill\n` : ''}${record.phase === 'prototype' ? '- NOTE:  scored at the prototype gate — only the signature moment existed, the page around it was never built\n' : ''}
| Axis | Score |
|---|---|
${rows}

**What is wrong with it:** ${record.notes || '—'}

**What to keep:** ${record.keep || '—'}
`
  fs.appendFileSync(path.join(ROOT, 'VERDICTS.md'), block, 'utf8')

  const roundDir = findRoundForRun(record.run)
  if (roundDir) {
    try {
      syncVerdict(body.scenario, roundDir)
    } catch {
      /* the round may not be archived yet; runs/verdicts is still the record */
    }
  }

  try {
    const written = recordVerdict(record)
    if (written) console.log(`recorded verdict in ${written}`)
  } catch (error) {
    console.warn(`could not record verdict in the vault: ${error.message}`)
  }

  return record
}

function saveVerdict(body) {
  fs.mkdirSync(VERDICT_DIR, { recursive: true })
  const pairs = loadPairs()
  const pair = pairs.find((p) => p.scenario === body.scenario)
  if (!pair) throw new Error('unknown scenario')
  if (!pair.health.judgeable) throw new Error('this pair has no design on one side — nothing to judge')

  const armOf = (side) => pair[side].meta.arm
  const resolve = (choice) => (choice === 'Tie' || !choice ? choice || '—' : armOf(choice))

  const record = {
    scenario: body.scenario,
    judgedAt: new Date().toISOString(),
    // Keyed by arm name, so a Dreative-vs-Dreative verdict records which two arms it judged
    // rather than pretending one of them was a control.
    runs: { [armOf('A')]: pair.A.dir, [armOf('B')]: pair.B.dir },
    criteria: Object.fromEntries(CRITERIA.map(([k]) => [k, resolve(body.picks?.[k])])),
    overall: resolve(body.picks?.overall),
    feedback: {
      [armOf('A')]: body.notesA ?? '',
      [armOf('B')]: body.notesB ?? '',
    },
    summary: body.summary ?? '',
  }

  fs.writeFileSync(path.join(VERDICT_DIR, `${body.scenario}.json`), JSON.stringify(record, null, 2), 'utf8')

  const label = (v) => (v === 'with' ? 'WITH Dreative' : v === 'without' ? 'control' : v === 'Tie' || v === '—' ? v : armTitle(v))
  const rows = [...CRITERIA.map(([k, name]) => [name, record.criteria[k]]), ['**Overall**', record.overall]]
    .map(([name, v]) => `| ${name} | ${label(v)} |`)
    .join('\n')

  // The scoreboard is a with-versus-control tally and reads these lines to build itself, so
  // a Dreative-vs-Dreative round must not name its arms "with" and "without": its arm lines
  // do not match, its winner is not a scoreboard value, and it is left out of the count. It
  // is still a full verdict record — it just answers a different question.
  const armWidth = Math.max(...Object.keys(record.runs).map((a) => a.length)) + 1
  const armLines = Object.entries(record.runs)
    .map(([arm, dir]) => `- ${`${arm}:`.padEnd(armWidth + 1)} \`${dir}\``)
    .join('\n')
  const feedback = Object.entries(record.feedback)
    .map(([arm, text]) => `**Feedback on ${arm === 'with' ? 'the Dreative build' : arm === 'without' ? 'the control' : armTitle(arm)}:** ${text || '—'}`)
    .join('\n\n')

  const block = `
## ${body.scenario} — ${record.judgedAt.slice(0, 10)}

${armLines}

| Criterion | Winner |
|---|---|
${rows}

${feedback}

**Summary:** ${record.summary || '—'}
`
  fs.appendFileSync(path.join(ROOT, 'VERDICTS.md'), block, 'utf8')
  rebuildScoreboard()

  // Put the verdict next to the designs it judges, so the archived round carries its own
  // result instead of relying on gitignored runs/ or on VERDICTS.md being read in order.
  const roundDir = Object.values(record.runs).map(findRoundForRun).find(Boolean)
  if (roundDir) syncVerdict(body.scenario, roundDir)

  // Project memory lives outside this repo and used to be updated by hand, which is how a
  // scored round could be reset and forgotten. No-ops when the vault is not on this machine.
  try {
    const written = recordVerdict(record)
    if (written) console.log(`recorded verdict in ${written}`)
  } catch (error) {
    console.warn(`could not record verdict in the vault: ${error.message}`)
  }

  return record
}

// ------------------------------------------------------------------ reset
//
// A round is finished when every judgeable pair has been scored. Clearing it by hand means
// knowing that runs/ is disposable but runs/verdicts is not — so it is one button instead.
// Nothing is deleted until the archive copy is on disk and verified.

function resetRound() {
  // Retiring a round that is still running loses it. The round keeps building into
  // directories the review has already marked cleared, so whatever it produces after this
  // can never appear for scoring — which is exactly what happened to clothing-shop
  // 202609060421: reset while it was paused at its gate, so continuing it would have built a
  // page into a round nothing would ever show.
  const gate = pendingGate()
  if (gate) {
    throw new Error(
      `A round is paused at a gate on ${gate.current} and is still running. Answer it on /status first — ` +
        'continue it or throw it out — and reset once the round has ended. Resetting now would retire a round that is still working.',
    )
  }
  const launch = readLaunch()
  if (launch?.alive) {
    throw new Error(
      `The round launched at ${launch.startedAt.slice(11, 19)} is still running (pid ${launch.pid}). ` +
        'Let it finish, or stop it, before archiving — anything it builds after a reset can never be scored.',
    )
  }

  const pairs = loadPairs()
  // View-only runs are part of the round and cost the same to produce. Archiving the pairs
  // and deleting runs/ around them threw a variance round away unarchived.
  const solos = loadSolos(pairs)

  // Live previews hold the run directories open on Windows; a delete under them fails.
  stopAllLive()

  const byRound = new Map()
  for (const p of pairs) {
    const round = p.A.meta.seq
    if (!byRound.has(round)) byRound.set(round, [])
    byRound.get(round).push(p.A.dir, p.B.dir)
  }
  for (const s of solos) {
    if (!byRound.has(s.seq)) byRound.set(s.seq, [])
    byRound.get(s.seq).push(...s.runs.map((r) => r.dir))
  }

  // A session that died before writing anything leaves a directory with no capture and no
  // build failure, so it lands in no pair and no solo — and Reset, which owns retiring a
  // round, could never reach it. Both `202608230320` runs sat in runs/ that way and
  // survived a reset of the round after them: invisible to review, immortal to the only
  // thing that clears runs/. Everything carrying a run.json belongs to some round, so
  // sweep by directory rather than by what made it onto the review page. `archiveRun`
  // records a dead run as ok:false instead of throwing, so an empty one is archived as the
  // evidence it is and then removed.
  const claimed = new Set([...byRound.values()].flat())
  for (const dir of fs.readdirSync(RUNS)) {
    if (claimed.has(dir) || !fs.statSync(path.join(RUNS, dir)).isDirectory()) continue
    const meta = readJson(path.join(RUNS, dir, 'run.json'), null)
    if (!meta?.seq || clearedRounds().includes(meta.seq)) continue
    if (!byRound.has(meta.seq)) byRound.set(meta.seq, [])
    byRound.get(meta.seq).push(dir)
  }

  // Checked after the sweep, not before it: runs/ holding nothing but dead sessions is the
  // case that most needs clearing, and testing pairs and solos first refused it.
  if (!byRound.size) {
    // Everything left is already archived and retired, and only survives on disk because
    // something held its directory open. Refusing here is what left `202609060421` showing
    // in the UI with an uncleanable log for a day: the round was safely in `archive/`, the
    // marker said so, and Reset still answered "there is nothing to archive" every time.
    // Retire it properly instead — sweep again, then clear the log that describes it.
    const swept = sweepCleared()
    let cleanedLog = false
    try {
      clearRoundLog()
      cleanedLog = true
    } catch {
      /* a round is running and owns the log — leave it alone */
    }
    if (!swept && !cleanedLog) throw new Error('there is nothing in runs/ to archive')
    return { archived: [], removed: swept, stuck: [], alreadyArchived: true }
  }

  const archived = []
  for (const [round, runNames] of byRound) {
    const meta = readJson(path.join(RUNS, `round-${round}.json`), {})
    const { roundDir } = archiveRound({ round, runNames, meta })
    if (!fs.existsSync(path.join(roundDir, 'round.json'))) throw new Error(`archiving round ${round} failed — nothing was deleted`)
    archived.push(round)
  }

  // The round is retired here, by marker, before anything is deleted. Windows keeps
  // handles on a directory for a while after the process that used it exits — vite's
  // preview and the archive build both leave one — so a delete can fail for a few seconds
  // through no fault of ours. Reporting that as "reset failed" while the round is already
  // safely archived is the wrong answer: the marker is the source of truth, and the
  // directories are just disk space.
  const cleared = [...new Set([...clearedRounds(), ...archived])]
  fs.writeFileSync(CLEARED_FILE, JSON.stringify(cleared, null, 2), 'utf8')

  let removed = 0
  const stuck = []
  for (const dirs of byRound.values()) {
    for (const dir of dirs) {
      const target = path.join(RUNS, dir)
      killProcessesIn(target) // anything still serving out of here would block the delete
      // Unlink the node_modules junction first — deleting a link's *target* would take the
      // shared install with it, and leaving it behind is what usually blocks the parent.
      const modules = path.join(target, 'node_modules')
      try {
        if (fs.lstatSync(modules).isSymbolicLink()) fs.unlinkSync(modules)
      } catch {
        /* not a link, or already gone */
      }
      try {
        // The archive rebuilt every one of these seconds ago; the last few still have a
        // vite handle open. Node retries EPERM/EBUSY, so give it long enough to matter.
        fs.rmSync(target, { recursive: true, force: true, maxRetries: 20, retryDelay: 500 })
        removed++
      } catch (err) {
        stuck.push(`${dir} (${err.code ?? err.message})`)
      }
    }
  }
  fs.rmSync(VERDICT_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
  fs.rmSync(ASSIGN_FILE, { force: true })
  // The round is archived and runs/ is empty, so its log describes nothing that still
  // exists. Leaving it made the next round's status page open on the last round's output.
  try {
    clearRoundLog()
  } catch {
    /* a round is running and owns the log — leave it alone */
  }

  return { archived, removed, stuck }
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
.tab.dead{border-color:var(--bad);color:var(--bad);opacity:.75}
.invalid{border:1px solid var(--bad);border-radius:10px;padding:14px 18px;margin-bottom:20px;background:#1b1013}
.invalid h3{margin:0 0 6px;font-size:14px;color:var(--bad)}
.invalid ul{margin:6px 0 0 18px;padding:0;color:var(--mut);font-size:13.5px}
.finished{border:1px solid var(--good);border-radius:10px;padding:16px 18px;margin-bottom:22px;background:#0e1a13}
.finished h3{margin:0;font-size:14px;color:var(--good)}
.tab.reset{border-color:var(--mut);color:var(--mut);cursor:pointer;background:none;font:inherit;font-size:13px;padding:5px 11px}
.tab.reset:hover{border-color:var(--bad);color:var(--bad)}
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
.grid.multi{grid-template-columns:repeat(auto-fit,minmax(430px,1fr))}
.tab.view{border-style:dashed}
.note{border:1px solid var(--line);border-radius:10px;padding:14px 18px;margin-bottom:22px;background:var(--card)}
.note h3{margin:0 0 6px;font-size:14px}
.note p{margin:0;color:var(--mut);font-size:13.5px}
`

function tabStrip(pairs, solos, current) {
  const pairTabs = pairs.map(
    (p) =>
      `<a class="tab${current === `s:${p.scenario}` ? ' on' : ''}${p.scored ? ' done' : ''}${p.health.judgeable ? '' : ' dead'}" href="/?s=${encodeURIComponent(p.scenario)}">${esc(p.scenario)}${!p.health.judgeable ? ' ✕' : p.scored ? ' ✓' : ''}</a>`,
  )
  const soloTabs = solos.map(
    (v) =>
      `<a class="tab view${current === `v:${v.scenario}` ? ' on' : ''}" href="/?v=${encodeURIComponent(v.scenario)}" title="view only — nothing to compare against">${esc(v.scenario)} · ${v.runs.length} run${v.runs.length > 1 ? 's' : ''}</a>`,
  )
  return [...pairTabs, ...soloTabs].join('')
}

/**
 * A round with nothing to compare: shown side by side, with no scoring UI at all. The
 * criteria are written as with-vs-control questions and do not mean anything here.
 */
function viewPage(pairs, solos, view) {
  const spansRounds = new Set(view.runs.map((r) => r.meta.seq)).size > 1
  const cols = view.runs
    .map(
      (run) => `<div class="col">
      <div class="tagrow">
        <span class="tag">${esc(runLabel(run, spansRounds))}</span>
        ${buildFailure(run.dir) ? '' : `<a class="livebtn" href="/liverun/${encodeURIComponent(run.dir)}" target="_blank" rel="noopener">Open live ↗</a>`}
      </div>
      ${run.meta.rejected ? '<div class="fail">Rejected at the prototype gate — kept on disk as a record, not for scoring</div>' : ''}
      ${
        run.unbuilt
          ? `<div class="warn"><strong>PROTOTYPE — phase 1 of 2.</strong> Only the signature moment was built; the page around it has not been.
             Worth opening and worth a verdict, but score it as a prototype: what is missing here is not yet a finding about the finished page.
             The round is paused and <a href="/status">waiting for you to continue or throw it out</a>.</div>`
          : ''
      }
      ${run.meta.truncated ? `<div class="fail">TRUNCATED (${esc(run.meta.truncated)}) — this build did not finish. Missing stages and craft defects here are unattributable.</div>` : ''}
      ${buildFailure(run.dir) ? `<div class="lbl">Build failed — this is itself a finding</div><div class="fail">${esc(buildFailure(run.dir))}</div>` : ''}
      ${captureWarnings(run.dir) ? `<div class="warn">Capture warning — ${esc(captureWarnings(run.dir))}</div>` : ''}
      ${smokeNote(run.dir) ? `<div class="${smokeNote(run.dir).kind === 'fail' ? 'fail' : 'warn'}">${esc(smokeNote(run.dir).text)}</div>` : ''}
      ${!isCaptured(run) ? '' : `
      <div class="lbl">Desktop · 1440 · reduced-motion still</div>
      <img class="shot" src="/shot/${encodeURIComponent(run.dir)}/desktop.png" alt="${esc(run.dir)} desktop">
      ${
        fs.existsSync(path.join(RUNS, run.dir, '.captures', 'desktop-dark.png'))
          ? `<div class="lbl">Desktop · 1440 · dark scheme</div>
             <img class="shot" src="/shot/${encodeURIComponent(run.dir)}/desktop-dark.png" alt="${esc(run.dir)} desktop dark">`
          : ''
      }
      <div class="lbl">Mobile · 390</div>
      <img class="shot mob" src="/shot/${encodeURIComponent(run.dir)}/mobile.png" alt="${esc(run.dir)} mobile">
      ${['desktop', 'mobile', 'reduced'].filter(p => fs.existsSync(path.join(RUNS, run.dir, '.captures', `${p}-motion.webm`))).map(p => `<div class="lbl">${p} · playback</div><video controls preload="metadata" style="width:100%;max-height:700px" src="/shot/${encodeURIComponent(run.dir)}/${p}-motion.webm"></video>`).join('')}`}
      <div class="lbl" style="text-transform:none;letter-spacing:0"><code>${esc(run.dir)}</code></div>
    </div>`,
    )
    .join('')

  // Repeats of one input, whether they came from one `--repeat 2` round or from
  // `--repeat 1` run twice. Both are the same experiment and read the same way.
  const repeats = view.runs.length > 1 && (spansRounds || view.runs.every((r) => r.meta.label))
  const rounds = [...new Set(view.runs.map((r) => r.meta.seq))].sort()

  return `<!doctype html><meta charset="utf-8"><title>View — ${esc(view.scenario)}</title><style>${STYLE}</style>
<header>
  <div><h1>View only <span class="sub">· ${rounds.length > 1 ? `rounds ${esc(rounds.join(' + '))}` : `round ${esc(view.seq)}`}</span></h1>
    <div class="sub">Not a blind comparison — there is nothing here to score against. ${
      ARCHIVE_PORT ? `Past rounds: <a href="http://127.0.0.1:${ARCHIVE_PORT}" target="_blank" rel="noopener">archive ↗</a>` : ''
    }</div></div>
  <nav class="tabs"><a class="tab" href="/status">Status &amp; new round</a>${tabStrip(pairs, solos, `v:${view.scenario}`)}<button class="tab reset" id="resetTop" title="Archive this round and clear runs/">Reset round</button></nav>
</header>
<main>${waitingBanner()}
  <div class="brief">
    <h2>${esc(view.product)}</h2>
    <p><strong>${esc(view.field)}</strong>${view.challenge ? ' — ' + esc(view.challenge) : ''}</p>
  </div>
  <div class="note">
    <h3>${repeats ? `${view.runs.length} repeats of the same input` : `${view.runs.length} run(s), no control to compare against`}</h3>
    <p>${
      repeats
        ? `Same scenario, same direction, same skill — the only variable is the run itself. What differs between these is variance, not a design decision.${
            spansRounds ? ' They came from separate rounds, which is the same experiment split in half.' : ''
          } Compare what each one read: <code>node scripts/variance.mjs${spansRounds ? ` ${rounds.join(' ')}` : ''}</code>`
        : 'This round was run with one arm, so the six blind criteria — all of them written as with-versus-control questions — do not apply. Score it on its own terms below; the verdict is saved.'
    }</p>
  </div>
  <div class="grid${view.runs.length > 2 ? ' multi' : ''}">${cols}</div>

  <div class="panel">
    <div class="lbl">Scoring ${view.runs.length > 1 ? '— pick which run this verdict is about' : ''}</div>
    ${
      view.runs.length > 1
        ? `<p><select id="whichrun">${view.runs
            .map((r) => `<option value="${esc(r.dir)}">${esc(r.dir)}</option>`)
            .join('')}</select></p>`
        : `<input type="hidden" id="whichrun" value="${esc(view.runs[0].dir)}">`
    }
    <table>
      <tr><th style="width:44%">Axis</th><th>1 = absent · 5 = would ship it</th></tr>
      ${SOLO_AXES.map(
        ([key, name, why]) => `<tr>
        <td><strong>${name}</strong><span class="why">${why}</span></td>
        <td><div class="choices">${['1', '2', '3', '4', '5']
          .map((v) => `<label class="pick"><input type="radio" name="${key}" value="${v}">${v}</label>`)
          .join('')}</div></td></tr>`,
      ).join('')}
      <tr><td><strong>Overall</strong><span class="why">Would you put this in front of the client whose product it is?</span></td>
      <td><div class="choices">${['1', '2', '3', '4', '5']
        .map((v) => `<label class="pick"><input type="radio" name="overall" value="${v}">${v}</label>`)
        .join('')}</div></td></tr>
    </table>

    <div class="lbl">What is wrong with it</div>
    <textarea id="notes" placeholder="Concrete. &quot;Nine product photos from nine different shoots&quot; beats &quot;the images feel inconsistent&quot; — the first can be checked next round, the second cannot."></textarea>

    <div class="lbl">What to keep</div>
    <textarea id="keep" placeholder="Naming this is what stops the next round throwing it away to fix something else."></textarea>

    <p style="margin-top:16px"><button id="soloSubmit">Save verdict</button></p>
    <p class="sub" id="soloSaved" style="display:none"></p>
  </div>
</main>
<script>
const SCENARIO = ${JSON.stringify(view.scenario)};
const AXES = ${JSON.stringify([...SOLO_AXES.map(([k]) => k), 'overall'])};
document.getElementById('soloSubmit').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const scores = {};
  for (const k of AXES) {
    const hit = document.querySelector('input[name="' + k + '"]:checked');
    if (hit) scores[k] = Number(hit.value);
  }
  const missing = AXES.filter((k) => !(k in scores));
  if (missing.length && !confirm('Not scored: ' + missing.join(', ') + '.\\n\\nSave anyway?')) return;
  btn.disabled = true; btn.textContent = 'Saving…';
  const res = await fetch('/api/solo-verdict', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      scenario: SCENARIO,
      run: document.getElementById('whichrun').value,
      scores,
      overall: scores.overall,
      notes: document.getElementById('notes').value,
      keep: document.getElementById('keep').value,
    }),
  });
  if (!res.ok) { alert('Not saved:\\n\\n' + await res.text()); btn.disabled = false; btn.textContent = 'Save verdict'; return; }
  const out = await res.json();
  btn.textContent = 'Saved';
  const saved = document.getElementById('soloSaved');
  saved.style.display = 'block';
  saved.textContent = 'Saved to VERDICTS.md, runs/verdicts/' + out.scenario + '.json, and the vault changelog. Overall ' + (out.overall ?? '—') + '/5.';
});
const UNSCORED = ${JSON.stringify(pairs.filter((p) => p.health.judgeable && !p.scored).map((p) => p.scenario))};
// Every escape below is doubled on purpose. This block sits inside a template literal, so a
// single-backslash escape becomes a REAL newline in the served HTML — landing mid-string-
// literal and throwing SyntaxError, which kills the whole inline script, not just this
// function. (Spelled out the long way on purpose: the first draft of this very comment
// wrote the escape literally and broke the page it was explaining.)
// That is exactly what had happened: Reset on this page did nothing from the day it was
// written, silently, because a dead script has no visible symptom. It survived because the
// paired review page escapes correctly and was the page anyone used — until the control arm
// was retired on 2026-09-04 and this became the only page a round is reviewed on.
async function resetRound(btn) {
  const warn = UNSCORED.length
    ? 'These are still unscored:\\n\\n  ' + UNSCORED.join('\\n  ') + '\\n\\nArchive anyway and clear runs/?'
    : 'Archive this round and clear runs/?\\n\\nEvery design, screenshot, transcript and verdict is copied into archive/ first.';
  if (!confirm(warn)) return;
  btn.disabled = true; btn.textContent = 'Archiving…';
  const res = await fetch('/api/reset', { method: 'POST' });
  if (!res.ok) { alert('Reset failed — nothing was deleted:\\n\\n' + await res.text()); btn.disabled = false; btn.textContent = 'Reset round'; return; }
  const out = await res.json();
  alert((out.alreadyArchived ? 'This round was already archived — cleared ' + out.removed + ' leftover folder(s) and its log.' : 'Archived round ' + out.archived.join(', ') + ' and cleared ' + out.removed + ' run(s).')
    + (out.stuck?.length ? '\\n\\nWindows would not release ' + out.stuck.length + ' folder(s) yet:\\n  ' + out.stuck.join('\\n  ')
        + '\\n\\nThey are archived and retired — the review page ignores them.' : ''));
  location.href = '/';
}
document.getElementById('resetTop').addEventListener('click', (e) => resetRound(e.currentTarget));
</script>`
}

/**
 * A round paused at a gate is the reason the review page has less on it than you expect, so
 * say so where you are rather than on a page you have to know to visit. Without this, hiding
 * an unfinished run just makes the page look empty for no stated reason.
 */
function waitingBanner() {
  const gate = pendingGate()
  if (!gate) return ''
  const proto = gate.stage !== 'finished'
  return `<div class="invalid" style="border-color:var(--acc)">
    <h3 style="color:var(--acc)">${esc(gate.heading || (proto ? 'A round is paused at its prototype gate' : 'A round is paused at its finished-build gate'))}</h3>
    <p class="sub" style="margin:8px 0 0">It built <code>${esc(gate.current)}</code> and stopped. ${
      proto
        ? 'Only the signature moment exists — the page has not been built, so it is not offered for scoring here.'
        : 'The page is built and is waiting on your keep or throw-out before it can be scored.'
    } Nothing else in the round runs until you answer.</p>
    <p style="margin:12px 0 0"><a class="livebtn" href="/status">Answer it on the status page →</a></p>
  </div>`
}

function page(pairs, solos, active, viewName) {
  const view = solos.find((v) => v.scenario === viewName)
  if (view) return viewPage(pairs, solos, view)
  const pair = pairs.find((p) => p.scenario === active) ?? pairs[0]
  if (!pair && solos.length) return viewPage(pairs, solos, solos[0])
  const tabs = tabStrip(pairs, solos, `s:${pair?.scenario}`)

  if (!pair) {
    // An empty runs/ is where a round starts, so the page that says "nothing here" has to
    // offer the one action that follows. Printing a command to retype into a terminal is why
    // the launcher already sitting on /status went unfound.
    return `<!doctype html><meta charset="utf-8"><title>Review</title><style>${STYLE}</style>
    <header><h1>Blind review</h1><div class="sub">Nothing waiting to be scored.</div></header>
    <main>${waitingBanner()}<p class="empty">Nothing captured in <code>runs/</code>.<br><br>
      <a class="livebtn" href="/status">Start a round →</a><br><br>
      <span class="sub">Scenarios, versions, direction and the time cap are all on that page. From a terminal it is
      <code>node scripts/run-all.mjs --scenarios civic-clinic,coffee-roaster</code>.</span>${
        ARCHIVE_PORT ? `<br><br>Everything already judged is in the <a href="http://127.0.0.1:${ARCHIVE_PORT}">archive ↗</a>` : ''
      }</p></main>`
  }

  // The round is over when every pair that can be judged has been. Say so, and offer the
  // one action that follows — otherwise the page looks the same as it did at scenario one.
  const done = (all) => {
    const judgeable = all.filter((p) => p.health.judgeable)
    const left = judgeable.filter((p) => !p.scored)
    if (!judgeable.length || left.length) return ''
    const skipped = all.length - judgeable.length
    return `<div class="finished">
      <h3>Round complete — all ${judgeable.length} judgeable scenario(s) scored${skipped ? `, ${skipped} skipped as unjudgeable` : ''}</h3>
      <p class="sub" style="margin:6px 0 12px">Archiving copies every design, screenshot, transcript and verdict into <code>archive/</code>,
      then clears <code>runs/</code> so the next round starts with no ticks carried over. The archive is what gets committed.</p>
      <button id="reset">Archive this round and reset</button>
    </div>`
  }

  // Problems are reported by side letter, never by arm — naming the arm would unblind the
  // comparison before you have scored it.
  const banner = (p) => {
    const rows = ['A', 'B'].flatMap((letter) => {
      const h = p.health[p[letter].meta.arm]
      return h.reasons.map((r) => `<li><strong>Design ${letter}</strong> — ${esc(r)}</li>`)
    })
    if (!rows.length) return ''
    const dead = !p.health.judgeable
    return `<div class="invalid">
      <h3>${dead ? 'This pair is not judgeable' : 'Judge this one with care'}</h3>
      <ul>${rows.join('')}</ul>
      <p class="sub" style="margin:10px 0 0">${
        dead
          ? 'Scoring is disabled. A verdict here would compare the seed project, or a build that never ran, against a real attempt. Re-run this scenario: <code>node scripts/run-all.mjs --scenarios ' +
            esc(p.scenario) +
            '</code>'
          : 'The session did not end cleanly, so the work may be cut off. That is a legitimate finding, but do not read a cut-off run as a design decision.'
      }</p>
    </div>`
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
      <img class="shot" src="/blindshot/${encodeURIComponent(pair.scenario)}/${letter}/desktop.png" alt="Design ${letter} desktop">
      ${
        fs.existsSync(path.join(RUNS, run.dir, '.captures', 'desktop-dark.png'))
          ? `<div class="lbl">Desktop · 1440 · dark scheme <span style="text-transform:none;letter-spacing:0">(this design declares a dark mode)</span></div>
             <img class="shot" src="/blindshot/${encodeURIComponent(pair.scenario)}/${letter}/desktop-dark.png" alt="Design ${letter} desktop dark">`
          : ''
      }
      <div class="lbl">Mobile · 390</div>
      <img class="shot mob" src="/blindshot/${encodeURIComponent(pair.scenario)}/${letter}/mobile.png" alt="Design ${letter} mobile">
      ${['desktop', 'mobile', 'reduced'].filter(p => fs.existsSync(path.join(RUNS, run.dir, '.captures', `${p}-motion.webm`))).map(p => `<div class="lbl">${p} · playback</div><video controls preload="metadata" style="width:100%;max-height:700px" src="/blindshot/${encodeURIComponent(pair.scenario)}/${letter}/${p}-motion.webm"></video>`).join('')}
      <div class="lbl">Your feedback on Design ${letter}</div>
      <textarea id="notes${letter}" placeholder="What works, what is wrong, what you would send back. This gets filed against whichever arm it turns out to be."></textarea>
    </div>`
  }

  return `<!doctype html><meta charset="utf-8"><title>Blind review — ${esc(pair.scenario)}</title><style>${STYLE}</style>
<header>
  <div><h1>Blind review <span class="sub">· round ${esc(pair.A.meta.seq ?? '')}</span></h1>
    <div class="sub">One of these used Dreative. You are not told which until you submit. ${
      ARCHIVE_PORT ? `Past rounds: <a href="http://127.0.0.1:${ARCHIVE_PORT}" target="_blank" rel="noopener">archive ↗</a>` : ''
    }</div></div>
  <nav class="tabs">${tabs}<button class="tab reset" id="resetTop" title="Archive this round and clear runs/">Reset round</button></nav>
</header>
<main>${waitingBanner()}
  <div class="brief">
    <h2>${esc(pair.product)}</h2>
    <p><strong>${esc(pair.field)}</strong>${pair.challenge ? ' — ' + esc(pair.challenge) : ''}</p>
  </div>

  ${banner(pair)}
  ${done(pairs)}

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

    <p style="margin-top:16px"><button id="submit"${pair.health.judgeable ? '' : ' disabled title="one side of this pair has no design to judge"'}>Submit verdict and reveal</button></p>

    <div id="reveal">
      <p><strong>Design A</strong> was <code id="ra"></code> &nbsp;·&nbsp; <strong>Design B</strong> was <code id="rb"></code></p>
      <p id="conclusion" style="font-size:15px"></p>
      <p class="sub">Saved to <code>VERDICTS.md</code> and <code>runs/verdicts/${esc(pair.scenario)}.json</code>. Pick the next scenario above.</p>
    </div>
  </div>
</main>
<script>
const SCENARIO = ${JSON.stringify(pair.scenario)};
const UNSCORED = ${JSON.stringify(pairs.filter((p) => p.health.judgeable && !p.scored).map((p) => p.scenario))};

async function resetRound(btn) {
  const warn = UNSCORED.length
    ? 'These are still unscored:\\n\\n  ' + UNSCORED.join('\\n  ') + '\\n\\nArchive anyway and clear runs/? Their designs are kept in the archive, but you cannot score them after this.'
    : 'Archive this round and clear runs/?\\n\\nEvery design, screenshot, transcript and verdict is copied into archive/ first. The next round starts clean.';
  if (!confirm(warn)) return;
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Archiving… (this rebuilds each site, give it a minute)';
  const res = await fetch('/api/reset', { method: 'POST' });
  if (!res.ok) { alert('Reset failed — nothing was deleted:\\n\\n' + await res.text()); btn.disabled = false; btn.textContent = label; return; }
  const out = await res.json();
  alert((out.alreadyArchived ? 'This round was already archived — cleared ' + out.removed + ' leftover folder(s) and its log.' : 'Archived round ' + out.archived.join(', ') + ' and cleared ' + out.removed + ' run(s).')
    + (out.stuck?.length ? '\\n\\nWindows would not release ' + out.stuck.length + ' folder(s) yet:\\n  ' + out.stuck.join('\\n  ')
        + '\\n\\nThey are archived and retired — the review page ignores them. Delete runs/ later if you want the disk space.' : ''));
  location.href = '/';
}
document.getElementById('resetTop').addEventListener('click', (e) => resetRound(e.currentTarget));
document.getElementById('reset')?.addEventListener('click', (e) => resetRound(e.currentTarget));
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

  const pretty = (a) => a === 'with' ? 'WITH Dreative' : a === 'without' ? 'WITHOUT Dreative (control)' : 'Dreative — arm ' + a.slice(5).toUpperCase();
  document.getElementById('ra').textContent = pretty(rec.armA);
  document.getElementById('rb').textContent = pretty(rec.armB);
  document.getElementById('conclusion').textContent =
    rec.overall === 'Tie' ? 'Tie. On this scenario the two arms produced no visible difference.'
    : rec.overall === 'with' ? 'The Dreative build won. One real data point in its favour.'
    : rec.overall === 'without' ? 'The control won. The skill made this worse — the most useful result you can get.'
    : pretty(rec.overall) + ' won. Both arms had the skill, so this says nothing about whether the skill helps — only which variant is better.';
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
    if (!dir || !file || !/^[\w.-]+$/.test(dir) || !/^[\w.-]+\.(png|webm)$/.test(file)) {
      res.writeHead(404).end('not found')
      return
    }
    const p = path.join(RUNS, dir, '.captures', file)
    if (!p.startsWith(RUNS + path.sep) || !fs.existsSync(p)) {
      res.writeHead(404).end('not found')
      return
    }
    res.writeHead(200, { 'content-type': file.endsWith('.webm') ? 'video/webm' : 'image/png', 'cache-control': 'no-store' })
    fs.createReadStream(p).pipe(res)
    return
  }

  // Screenshots for a blind pair, addressed by side letter. `/shot/<run-dir>/…` names the
  // arm in the URL, and a reviewer who opens devtools or hovers an image then knows which
  // build is which before scoring — which matters more now that a round can be two skill
  // versions the reviewer chose themselves, rather than skill versus control.
  if (req.method === 'GET' && url.pathname.startsWith('/blindshot/')) {
    const [, , scenarioName, letter, file] = url.pathname.split('/').map(decodeURIComponent)
    const pair = loadPairs().find((x) => x.scenario === scenarioName)
    if (!pair || (letter !== 'A' && letter !== 'B') || !/^[\w.-]+\.(png|webm)$/.test(file)) {
      res.writeHead(404).end('not found')
      return
    }
    const shot = path.join(RUNS, pair[letter].dir, '.captures', file)
    if (!shot.startsWith(RUNS) || !fs.existsSync(shot)) {
      res.writeHead(404).end('not found')
      return
    }
    res.writeHead(200, { 'content-type': file.endsWith('.webm') ? 'video/webm' : 'image/png', 'cache-control': 'no-store' })
    fs.createReadStream(shot).pipe(res)
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

  // A view-only run is addressed by directory rather than by side letter: there is no
  // pair, so there is no A/B to hide behind, and nothing to unblind.
  if (req.method === 'GET' && url.pathname.startsWith('/liverun/')) {
    const [, , dir] = url.pathname.split('/').map(decodeURIComponent)
    const known = loadSolos(loadPairs()).some((v) => v.runs.some((r) => r.dir === dir))
    if (!known) {
      res.writeHead(404).end('not found')
      return
    }
    try {
      const port = await startLive(dir)
      res.writeHead(302, { location: `http://127.0.0.1:${port}/` }).end()
    } catch (err) {
      res.writeHead(500).end(`could not start live preview: ${err.message}`)
    }
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/reset') {
    try {
      const out = resetRound()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(out))
    } catch (err) {
      res.writeHead(500).end(err.message)
    }
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/clear-log') {
    try {
      clearRoundLog()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    } catch (err) {
      res.writeHead(409).end(err.message)
    }
    return
  }

  if (req.method === 'GET' && url.pathname === '/status') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
    res.end(statusPage({ style: STYLE }))
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/status') {
    const rows = runStatuses()
    // The page reloads itself when the shape of the round changes — a session finishing, a
    // capture landing — but not on every poll, so a log you are reading does not jump.
    const fingerprint = rows.map((r) => r.run + ':' + r.state).join('|')
    const changed = lastFingerprint !== null && fingerprint !== lastFingerprint
    lastFingerprint = fingerprint
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' })
    res.end(JSON.stringify({ runs: rows, log: roundLog(), changed }))
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/gate') {
    let raw = ''
    for await (const chunk of req) raw += chunk
    try {
      const body = JSON.parse(raw)
      if (!answerGate(body.run, body.decision)) {
        res.writeHead(409).end('Nothing is waiting on that answer any more — the round either moved on or exited. Reload the page.')
        return
      }
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
      console.log(`gate: ${body.decision} ${body.run}`)
    } catch (err) {
      res.writeHead(400).end(err.message)
    }
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/run') {
    let raw = ''
    for await (const chunk of req) raw += chunk
    try {
      const record = startRound(JSON.parse(raw))
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(record))
      console.log(`started round: ${record.command}`)
    } catch (err) {
      res.writeHead(400).end(err.message)
    }
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/solo-verdict') {
    let raw = ''
    for await (const chunk of req) raw += chunk
    try {
      const record = saveSoloVerdict(JSON.parse(raw))
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(record))
      console.log(`saved solo verdict for ${record.scenario} (${record.run}): overall → ${record.overall ?? '—'}`)
    } catch (err) {
      res.writeHead(400).end(err.message)
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
    const livePairs = loadPairs()
    res.end(page(livePairs, loadSolos(livePairs), url.searchParams.get('s'), url.searchParams.get('v')))
    return
  }

  res.writeHead(404).end('not found')
})

const swept = sweepCleared()
const pairs = loadPairs()
const solos = loadSolos(pairs)
await startArchiveViewer()
server.listen(PORT, '127.0.0.1', () => {
  console.log(`\nBlind review ready:  http://127.0.0.1:${PORT}`)
  if (ARCHIVE_PORT) console.log(`Past rounds:         http://127.0.0.1:${ARCHIVE_PORT}`)
  else if (listRounds().length) console.log('Archive viewer would not start — run it yourself: node scripts/archive.mjs')
  if (swept) console.log(`Cleaned up ${swept} leftover run folder(s) from an archived round.`)
  console.log(`${pairs.length} scenario pair(s) captured: ${pairs.map((p) => p.scenario).join(', ') || 'none yet'}`)
  const bad = pairs.filter((p) => !p.health.judgeable)
  if (bad.length) console.log(`${bad.length} pair(s) NOT judgeable (a side never got built): ${bad.map((p) => p.scenario).join(', ')}`)
  if (solos.length) {
    const runs = solos.reduce((n, v) => n + v.runs.length, 0)
    console.log(`${runs} run(s) with nothing to compare against, shown view-only: ${solos.map((v) => v.scenario).join(', ')}`)
  }
  if (!pairs.length && !solos.length) console.log('Run a round first:  node scripts/run-all.mjs')
  console.log('\nCtrl+C to stop.\n')
})
