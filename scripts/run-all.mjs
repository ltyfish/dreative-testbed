#!/usr/bin/env node
// Run a full A/B round end to end with no manual prompting.
//
//   node scripts/run-all.mjs                       # all 5 scenarios, both arms = 10 sessions
//   node scripts/run-all.mjs --scenarios civic-clinic,devtool-docs
//   node scripts/run-all.mjs --concurrency 2 --model opus
//   node scripts/run-all.mjs --agent codex
//
// For each scenario and each arm it scaffolds an isolated project, spawns a headless
// agent session with the brief already written, waits for all of them, then builds and
// screenshots every result. Nothing is pasted by hand, so the only variable between the
// two arms is whether the skill is installed.
//
// Permissions: sessions run with acceptEdits plus a scoped tool allowlist, which lets an
// agent edit files in its own run directory and run the project's own npm scripts without
// prompting. Full bypass is available with --yolo but is not the default; each run is a
// throwaway directory, but the agent is still a real agent on your machine.
//
// Afterwards: node scripts/review.mjs

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { captureMany } from './lib/capture.mjs'
import { ROOT, RUNS, listScenarios, scaffoldRun, skillInstalled } from './lib/scaffold.mjs'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return fallback
  const next = process.argv[i + 1]
  return next && !next.startsWith('--') ? next : true
}

const AGENT = String(arg('agent', 'claude'))
const MODEL = arg('model', null)
const CONCURRENCY = Number(arg('concurrency', 3))
const TIMEOUT_MIN = Number(arg('timeout', 25))
const ARMS = String(arg('arms', 'with,without')).split(',')
const SCENARIOS = arg('scenarios', null) ? String(arg('scenarios')).split(',') : listScenarios()
const SKIP_CAPTURE = arg('no-capture', false)
const YOLO = arg('yolo', false)

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
const ALLOWED_TOOLS = [
  'Edit',
  'Write',
  'Read',
  'Glob',
  'Grep',
  'Bash(npm run build)',
  'Bash(npm run dev)',
  'Bash(npm run preview)',
  'Bash(npx playwright:*)',
  'Bash(node:*)',
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
    const args = ['exec', YOLO ? '--dangerously-bypass-approvals-and-sandbox' : '--full-auto']
    if (MODEL && MODEL !== true) args.push('--model', String(MODEL))
    args.push(prompt)
    return { cmd: 'codex', args }
  }
  throw new Error(`unknown agent: ${AGENT} (expected claude or codex)`)
}

function runSession({ runName, runDir, prompt }) {
  return new Promise((resolve) => {
    const { cmd, args } = agentCommand(prompt)
    const started = Date.now()
    const logStream = fs.createWriteStream(path.join(runDir, 'agent.log'))
    logStream.write(`$ ${cmd} (${AGENT}${MODEL && MODEL !== true ? `, ${MODEL}` : ''})\n\n${prompt}\n\n---\n\n`)

    log(`[${runName}] session started`)
    const child = spawn(cmd, args, { cwd: runDir, shell: false })

    child.stdout.on('data', (d) => logStream.write(d))
    child.stderr.on('data', (d) => logStream.write(d))

    const killer = setTimeout(
      () => {
        log(`[${runName}] TIMEOUT after ${TIMEOUT_MIN}m — killing session`)
        child.kill('SIGKILL')
      },
      TIMEOUT_MIN * 60_000,
    )

    child.on('close', (code) => {
      clearTimeout(killer)
      logStream.end()
      const mins = ((Date.now() - started) / 60_000).toFixed(1)
      log(`[${runName}] session finished in ${mins}m (exit ${code})`)
      resolve({ runName, code, minutes: Number(mins) })
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
      jobs.push(scaffoldRun({ scenario, arm, seq: roundStamp }))
    } catch (err) {
      console.error(`could not scaffold ${scenario}/${arm}: ${err.message}`)
      process.exit(1)
    }
  }
}

console.log(`\nRound ${roundStamp}`)
console.log(`  agent        ${AGENT}${MODEL && MODEL !== true ? ` (${MODEL})` : ''}`)
console.log(`  permissions  ${YOLO ? 'FULL BYPASS (--yolo)' : 'acceptEdits + scoped tools'}`)
console.log(`  scenarios    ${SCENARIOS.join(', ')}`)
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
  for (const f of failed) console.log(`  ${f.runName} (exit ${f.code})`)
}

// ---------------------------------------------------------------- capture

if (SKIP_CAPTURE) {
  console.log('\n--no-capture set. Run: node scripts/capture.mjs --all')
} else {
  console.log('\nCapturing screenshots…')
  const shots = await captureMany(
    jobs.map((j) => j.runName),
    4173,
    log,
  )
  const broken = shots.filter((s) => !s.ok)
  if (broken.length) {
    console.log(`\n${broken.length} run(s) failed to build or capture:`)
    for (const b of broken) console.log(`  ${b.runName}: ${b.error}`)
    console.log('A build failure is a real result. Judge the pairs that captured.')
  }
}

fs.writeFileSync(
  path.join(RUNS, `round-${roundStamp}.json`),
  JSON.stringify(
    { round: roundStamp, agent: AGENT, model: MODEL ?? null, yolo: Boolean(YOLO), scenarios: SCENARIOS, arms: ARMS, sessions },
    null,
    2,
  ),
  'utf8',
)

console.log(`\nRound complete. Now judge it:\n\n  node scripts/review.mjs\n`)
