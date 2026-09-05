// What is happening right now, derived from disk rather than remembered.
//
// Before this, "is the round finished?" was answered by watching a terminal. If you closed
// it, or started the round from the review UI, or came back the next morning, there was no
// way to tell a session still working from one that died twenty minutes in — and a run
// directory looks identical in both cases. Everything below is read from files the round
// writes as it goes, so it is correct after a reboot and correct for a round somebody else
// started.
//
// Deliberately no daemon and no state file to drift: the ground truth is agent.log's size
// and mtime, run.json, and what capture left behind.

import fs from 'node:fs'
import path from 'node:path'
import { RUNS } from './scaffold.mjs'

// A session that has not written a byte to its log in this long is not thinking, it is gone.
// Sessions do go quiet during a long tool call, so this is generous.
const STALL_MS = 6 * 60_000

const readJson = (p, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}

/**
 * @returns one row per run directory currently in runs/, newest round first.
 *
 * state is one of:
 *   running    — the log is still growing
 *   stalled    — a log that stopped growing without the session closing it out
 *   truncated  — the provider or the time cap ended it mid-work
 *   rejected   — thrown out at the prototype gate
 *   built      — finished and captured, ready to look at
 *   finished   — the session ended but nothing was captured (usually a build failure)
 *   empty      — the session never touched the seed
 */
export function runStatuses() {
  if (!fs.existsSync(RUNS)) return []
  const rows = []

  for (const dir of fs.readdirSync(RUNS)) {
    const runDir = path.join(RUNS, dir)
    if (!fs.statSync(runDir).isDirectory() || dir === 'verdicts') continue
    const meta = readJson(path.join(runDir, 'run.json'))
    if (!meta) continue

    const logFile = path.join(runDir, 'agent.log')
    const log = fs.existsSync(logFile) ? fs.statSync(logFile) : null
    const idleMs = log ? Date.now() - log.mtimeMs : null

    const captured = fs.existsSync(path.join(runDir, '.captures', 'desktop.png'))
    const buildFailed = fs.existsSync(path.join(runDir, 'build-error.log'))
    // Written by `dreative look` — the shipped CLI command, not a harness script. A run with no
    // report is one where nothing rendered the build before the reviewer did.
    const look = readJson(path.join(runDir, '.dreative', 'look', 'report.json'))
    const smoke = readJson(path.join(runDir, 'smoke.json'))
    const verdict = readJson(path.join(RUNS, 'verdicts', `${meta.scenario}.json`))
    const styles = path.join(runDir, 'src', 'styles.css')
    const touched = fs.existsSync(styles) ? fs.statSync(styles).size > 0 : false

    // The round writes `truncated` into run.json when it kills a session, so that survives
    // everything. A log still growing means the session is alive whatever else is true.
    let state
    if (meta.rejected) state = 'rejected'
    else if (log && idleMs < 90_000 && !captured) state = 'running'
    else if (meta.truncated) state = 'truncated'
    else if (!touched) state = 'empty'
    else if (captured) state = 'built'
    else if (log && idleMs > STALL_MS) state = 'stalled'
    else state = 'finished'

    rows.push({
      run: dir,
      scenario: meta.scenario,
      arm: meta.arm,
      round: meta.seq,
      direction: meta.direction,
      skill: meta.skill,
      state,
      truncated: meta.truncated ?? null,
      buildFailed,
      idleMinutes: idleMs === null ? null : Math.round(idleMs / 60_000),
      logKb: log ? Math.round(log.size / 1024) : 0,
      broken: look ? look.broken.length : null,
      inertSections: look ? look.observed.filter((o) => /nothing changes across it/.test(o)).length : null,
      looked: Boolean(look),
      smokeOk: smoke ? smoke.ok : null,
      scored: Boolean(verdict && (verdict.run === dir || Object.values(verdict.runs ?? {}).includes(dir))),
    })
  }

  return rows.sort((a, b) => String(b.round).localeCompare(String(a.round)) || a.run.localeCompare(b.run))
}

/** A round launched from the review UI records itself here so status can say it is ours. */
export const LAUNCH_FILE = path.join(RUNS, '.launch.json')

export function readLaunch() {
  const launch = readJson(LAUNCH_FILE)
  if (!launch) return null
  let alive = false
  try {
    process.kill(launch.pid, 0)
    alive = true
  } catch {
    alive = false
  }
  return { ...launch, alive }
}

const ICON = {
  running: '●',
  stalled: '◌',
  truncated: '✕',
  rejected: '✕',
  built: '✓',
  finished: '·',
  empty: '✕',
}

/** One line per run, for a terminal. */
export function formatStatus(rows = runStatuses(), launch = readLaunch()) {
  if (!rows.length) return 'runs/ is empty — nothing has been run, or the last round was reset.'
  const out = []
  if (launch) {
    out.push(
      launch.alive
        ? `Round launched from the review UI is STILL RUNNING (pid ${launch.pid}, started ${launch.startedAt.slice(11, 19)})`
        : `Last round launched from the review UI has exited (pid ${launch.pid}, started ${launch.startedAt.slice(11, 19)})`,
    )
    out.push(`  ${launch.command}`)
    out.push('')
  }
  const w = Math.max(...rows.map((r) => r.run.length))
  for (const r of rows) {
    const bits = []
    if (r.state === 'running') bits.push(`${r.logKb}kb of log, last wrote ${r.idleMinutes}m ago`)
    if (r.truncated) bits.push(r.truncated)
    if (r.buildFailed) bits.push('BUILD FAILED')
    if (r.looked) bits.push(`${r.broken} broken, ${r.inertSections} inert section(s)`)
    else if (r.state === 'built') bits.push('never rendered its own build')
    if (r.smokeOk === false) bits.push('smoke blocked')
    if (r.scored) bits.push('scored')
    out.push(`${ICON[r.state] ?? '·'} ${r.run.padEnd(w)}  ${r.state.padEnd(9)} ${bits.join(' · ')}`)
  }
  return out.join('\n')
}
