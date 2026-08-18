#!/usr/bin/env node
// Run a full A/B round end to end with no manual prompting.
//
//   node scripts/run-all.mjs                       # all 6 scenarios, both arms = 12 sessions
//   node scripts/run-all.mjs 3                     # 3 scenarios picked at random = 6 sessions
//   node scripts/run-all.mjs 2 showcase            # …in the Showcase direction
//   node scripts/run-all.mjs --scenarios civic-clinic,devtool-docs
//   node scripts/run-all.mjs --concurrency 2 --model opus
//   node scripts/run-all.mjs --agent codex
//
// For each scenario and each arm it scaffolds an isolated project, spawns a headless
// agent session with the brief already written, waits for all of them, then builds and
// screenshots every result. Nothing is pasted by hand, so the only variable between the
// two arms is whether the skill is installed.
//
// Permissions: sessions run with full bypass and network access, so an agent can fetch
// references and install what it needs without stalling on a prompt nobody is there to
// answer. Each run directory is disposable, but these are real agents on your machine —
// pass --no-yolo for acceptEdits plus a scoped tool allowlist instead.
//
// Afterwards: node scripts/review.mjs  ·  browse past rounds: node scripts/archive.mjs

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { archiveRound } from './lib/archive.mjs'
import { captureMany, killTree } from './lib/capture.mjs'
import { runHealth } from './lib/health.mjs'
import { ROOT, RUNS, listScenarios, scaffoldRun, skillInstalled } from './lib/scaffold.mjs'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return fallback
  const next = process.argv[i + 1]
  return next && !next.startsWith('--') ? next : true
}

const DIRECTIONS = ['recommended', 'efficient', 'showcase']
const ALL_SCENARIOS = listScenarios()

// Bare positional arguments, so a round is one short command: a number is how many
// scenarios to run (chosen at random), a word is the direction.
const VALUE_FLAGS = ['--agent', '--model', '--concurrency', '--timeout', '--arms', '--scenarios', '--direction', '--port']
const tokens = process.argv.slice(2)
const positional = tokens.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(tokens[i - 1]))
const COUNT = positional.map(Number).find((n) => Number.isInteger(n) && n > 0) ?? null
const POSITIONAL_DIRECTION = positional.find((a) => DIRECTIONS.includes(a.toLowerCase()) || a.toLowerCase() === 'random' || a.toLowerCase() === 'none')

if (COUNT !== null && COUNT > ALL_SCENARIOS.length) {
  console.error(`there are only ${ALL_SCENARIOS.length} scenarios: ${ALL_SCENARIOS.join(', ')}`)
  process.exit(1)
}

const AGENT = String(arg('agent', 'claude'))
const MODEL = arg('model', null)
const CONCURRENCY = Number(arg('concurrency', 3))
const TIMEOUT_MIN = Number(arg('timeout', 25))
const ARMS = String(arg('arms', 'with,without')).split(',')
const SKIP_CAPTURE = arg('no-capture', false)
const SKIP_ARCHIVE = arg('no-archive', false)
const YOLO = !arg('no-yolo', false)
const DIRECTION = arg('direction', POSITIONAL_DIRECTION ?? 'recommended')

/** Fisher-Yates, so "3 scenarios" is a fair sample rather than the first three. */
function sample(list, n) {
  const pool = [...list]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, n).sort()
}

const SCENARIOS = arg('scenarios', null)
  ? String(arg('scenarios')).split(',')
  : COUNT !== null
    ? sample(ALL_SCENARIOS, COUNT)
    : ALL_SCENARIOS

const requested = String(DIRECTION).toLowerCase()
if (DIRECTION !== false && !DIRECTIONS.includes(requested) && requested !== 'none' && requested !== 'random') {
  console.error(`--direction must be one of: ${DIRECTIONS.join(', ')} (or "random", or "none" to leave it unstated)`)
  process.exit(1)
}
const direction =
  requested === 'none' ? null : requested === 'random' ? DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)] : requested

const stamp = () => new Date().toISOString().slice(11, 19)
const log = (msg) => console.log(`${stamp()} ${msg}`)

if (!skillInstalled()) {
  console.error('\nNo .claude or .codex skill at the repo root, so the "with" arm would be')
  console.error('identical to the control. Install it first:\n')
  console.error('  npm i -g dreative@latest')
  console.error('  dreative install-skill --codex\n')
  process.exit(1)
}

for (const s of SCENARIOS) {
  if (!listScenarios().includes(s)) {
    console.error(`unknown scenario: ${s}\nknown: ${listScenarios().join(', ')}`)
    process.exit(1)
  }
}

// Tools a redesign session legitimately needs: edit its own files, run the project's
// scripts, and look at the result. Scoped so a session cannot wander outside its run.
// WebSearch/WebFetch are included deliberately: the skill routes agents to real reference
// sites, and a control that cannot look anything up is handicapped in a way the comparison
// would wrongly credit to the skill. Both arms get the same access.
const ALLOWED_TOOLS = [
  'Edit',
  'Write',
  'Read',
  'Glob',
  'Grep',
  'WebSearch',
  'WebFetch',
  'Bash(npm run build)',
  'Bash(npm run dev)',
  'Bash(npm run preview)',
  'Bash(npm install:*)',
  'Bash(npx playwright:*)',
  'Bash(node:*)',
  'Bash(curl:*)',
]

function agentCommand(prompt) {
  if (AGENT === 'claude') {
    const args = ['-p', prompt]
    if (YOLO) args.push('--permission-mode', 'bypassPermissions')
    else args.push('--permission-mode', 'acceptEdits', '--allowedTools', ...ALLOWED_TOOLS)
    if (MODEL && MODEL !== true) args.push('--model', String(MODEL))
    return { cmd: 'claude', args }
  }
  if (AGENT === 'codex') {
    // --full-auto sandboxes the workspace with the network off, which silently blocks
    // both reference lookups and npm installs. Turn it back on explicitly.
    const args = YOLO
      ? ['exec', '--dangerously-bypass-approvals-and-sandbox']
      : ['exec', '--full-auto', '-c', 'sandbox_workspace_write.network_access=true']
    if (MODEL && MODEL !== true) args.push('--model', String(MODEL))
    args.push(prompt)
    return { cmd: 'codex', args }
  }
  throw new Error(`unknown agent: ${AGENT} (expected claude or codex)`)
}

// Once the account is out of budget every remaining session fails the same way — but each
// one still costs a scaffold, a build and a screenshot, and drops an untouched seed project
// into the blind review looking like a design. Stop the round instead.
const LIMIT_RE = /you'?ve hit your (session|usage) limit|(usage|rate) limit reached|credit balance is too low|quota exceeded/i
let limitHit = false

function runSession({ runName, runDir, prompt }) {
  if (limitHit) {
    log(`[${runName}] skipped — the account hit its usage limit earlier in this round`)
    return Promise.resolve({ runName, code: -2, skipped: true })
  }
  return new Promise((resolve) => {
    const { cmd, args } = agentCommand(prompt)
    const started = Date.now()
    const logStream = fs.createWriteStream(path.join(runDir, 'agent.log'))
    logStream.write(`$ ${cmd} (${AGENT}${MODEL && MODEL !== true ? `, ${MODEL}` : ''})\n\n${prompt}\n\n---\n\n`)

    log(`[${runName}] session started`)
    const child = spawn(cmd, args, { cwd: runDir, shell: false })

    const watch = (d) => {
      logStream.write(d)
      if (!limitHit && LIMIT_RE.test(String(d))) {
        limitHit = true
        log(`[${runName}] provider usage limit reached — no further sessions will be started`)
      }
    }
    child.stdout.on('data', watch)
    child.stderr.on('data', watch)

    let timedOut = false
    const killer = setTimeout(
      () => {
        timedOut = true
        log(`[${runName}] TIMEOUT after ${TIMEOUT_MIN}m — killing session`)
        killTree(child.pid)
      },
      TIMEOUT_MIN * 60_000,
    )

    child.on('close', (code) => {
      clearTimeout(killer)
      logStream.end()
      const mins = ((Date.now() - started) / 60_000).toFixed(1)
      log(
        `[${runName}] session finished in ${mins}m (exit ${code})${timedOut ? ' — KILLED AT CAP, duration is a floor not a measurement' : ''}`,
      )
      resolve({ runName, code, minutes: Number(mins), timedOut })
    })

    child.on('error', (err) => {
      clearTimeout(killer)
      logStream.end()
      log(`[${runName}] failed to launch ${cmd}: ${err.message}`)
      resolve({ runName, code: -1, error: err.message })
    })
  })
}

/** Run tasks with a bounded number in flight. */
async function pool(items, limit, worker) {
  const results = []
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index])
    }
  })
  await Promise.all(runners)
  return results
}

// ---------------------------------------------------------------- scaffold

const roundStamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
const jobs = []

for (const scenario of SCENARIOS) {
  for (const arm of ARMS) {
    try {
      jobs.push(scaffoldRun({ scenario, arm, seq: roundStamp, direction }))
    } catch (err) {
      console.error(`could not scaffold ${scenario}/${arm}: ${err.message}`)
      process.exit(1)
    }
  }
}

console.log(`\nRound ${roundStamp}`)
console.log(`  agent        ${AGENT}${MODEL && MODEL !== true ? ` (${MODEL})` : ''}`)
console.log(`  permissions  ${YOLO ? 'FULL BYPASS + network (default; --no-yolo to scope)' : 'acceptEdits + scoped tools + network'}`)
console.log(`  direction    ${direction ?? 'unstated (the skill will fall back to Recommended)'}${requested === 'random' ? ' (picked at random)' : ''}`)
console.log(`  scenarios    ${SCENARIOS.join(', ')}${COUNT !== null ? ` (${COUNT} picked at random)` : ''}`)
console.log(`  arms         ${ARMS.join(', ')}`)
console.log(`  sessions     ${jobs.length}, ${CONCURRENCY} at a time, ${TIMEOUT_MIN}m cap each`)
console.log(`  runs         ${path.relative(ROOT, RUNS)}/\n`)
console.log("Nothing to paste. Progress goes to each run's agent.log.\n")

// ---------------------------------------------------------------- sessions

const sessionStart = Date.now()
const sessions = await pool(jobs, CONCURRENCY, runSession)
const failed = sessions.filter((s) => s.code !== 0)

console.log(`\nAll sessions done in ${((Date.now() - sessionStart) / 60_000).toFixed(1)}m.`)
if (failed.length) {
  console.log(`${failed.length} exited non-zero — their output is still captured and judged:`)
  for (const f of failed) console.log(`  ${f.runName} (exit ${f.code}${f.skipped ? ', skipped' : ''})`)
}

// A killed session's `minutes` is the cap, not its real cost. Judging it as if it
// finished reads a truncated build as a finished one and understates what it spent.
const capped = sessions.filter((s) => s.timedOut)
if (capped.length) {
  console.log(`\n${capped.length} session(s) hit the ${TIMEOUT_MIN}m cap and were killed mid-work:`)
  for (const c of capped) console.log(`  ${c.runName}`)
  console.log('Their builds are truncated and their durations are floors, not measurements.')
}

// A session that ended without touching the seed is not a design. Say so here, loudly,
// rather than letting it reach the blind review looking like one.
const empty = jobs.map((j) => j.runName).filter((name) => runHealth(name).untouched)
if (empty.length) {
  console.log(`\n${empty.length} session(s) produced NO design (the seed is untouched):`)
  for (const name of empty) console.log(`  ${name}`)
  const scenarios = [...new Set(empty.map((n) => n.split('__')[0]))]
  console.log(`These pairs cannot be judged. Re-run them once you have budget:`)
  console.log(`  node scripts/run-all.mjs --scenarios ${scenarios.join(',')}`)
}
if (limitHit) {
  console.log('\nThe round stopped early on a provider usage limit. Cheaper next time:')
  console.log('  node scripts/run-all.mjs --scenarios <one,two>   # 2 scenarios = 4 sessions, not 10')
  console.log('  node scripts/run-all.mjs 2 --timeout 15          # shorter cap per session')
}

// ---------------------------------------------------------------- capture

if (SKIP_CAPTURE) {
  console.log('\n--no-capture set. Run: node scripts/capture.mjs --all')
} else {
  console.log('\nCapturing screenshots…')
  // Building and photographing an untouched seed produces five identical screenshots of
  // the starting point. Skip them — the health check already recorded why.
  const toCapture = jobs.map((j) => j.runName).filter((name) => !runHealth(name).untouched)
  const shots = await captureMany(toCapture, 4173, log)
  const broken = shots.filter((s) => !s.ok)
  if (broken.length) {
    console.log(`\n${broken.length} run(s) failed to build or capture:`)
    for (const b of broken) console.log(`  ${b.runName}: ${b.error}`)
    console.log('A build failure is a real result. Judge the pairs that captured.')
  }
}

const roundMeta = {
  round: roundStamp,
  agent: AGENT,
  model: MODEL && MODEL !== true ? String(MODEL) : null,
  yolo: Boolean(YOLO),
  direction,
  scenarios: SCENARIOS,
  arms: ARMS,
  sessions,
}

fs.writeFileSync(path.join(RUNS, `round-${roundStamp}.json`), JSON.stringify(roundMeta, null, 2), 'utf8')

// ---------------------------------------------------------------- archive
//
// runs/ is disposable and gitignored. The archive is the copy that gets committed and
// survives a pull on another machine, so it happens now, while node_modules is still
// linked and the sites can still be built.

if (!SKIP_ARCHIVE) {
  console.log('\nArchiving round…')
  const { roundDir } = archiveRound({ round: roundStamp, runNames: jobs.map((j) => j.runName), meta: roundMeta, log })
  console.log(`Archived to ${path.relative(ROOT, roundDir)}/ — commit it to keep this round.`)
}

console.log(`\nRound complete. Now judge it:\n\n  node scripts/review.mjs\n`)
