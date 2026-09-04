#!/usr/bin/env node
// Run a full A/B round end to end with no manual prompting.
//
//   node scripts/run-all.mjs                       # all 7 scenarios, one skill arm each
//   node scripts/run-all.mjs 3                     # 3 scenarios picked at random = 6 sessions
//   node scripts/run-all.mjs 2 showcase            # …in the Showcase direction
//   node scripts/run-all.mjs --scenarios civic-clinic,devtool-docs
//   node scripts/run-all.mjs --concurrency 2 --model opus
//   node scripts/run-all.mjs --agent codex
//   node scripts/run-all.mjs --scenarios caliber-movement --arms with --repeat 2
//
// Dreative against Dreative, instead of against a control — both arms get the skill and the
// variable is whatever you change between them:
//
//   node scripts/run-all.mjs --scenarios caliber-movement --arms with-a,with-b --direction-a showcase --direction-b recommended
//
// One arm at a time, when a session limit means you cannot afford both at once. The second
// command joins the first round instead of opening its own, which is what lets the blind
// review pair them:
//
//   node scripts/run-all.mjs --scenarios caliber-movement --arms with-a --direction-a showcase
//   node scripts/run-all.mjs --round <that round number> --scenarios caliber-movement --arms with-b
//
// Do not reset the round in review.mjs until every arm has run: reset archives and clears
// runs/, and a cleared arm cannot be paired with anything.
//
// To test a skill edit rather than a setting, give one arm an older tree. --skill-<name>
// takes a directory, or git:<ref> to extract skill/dreative from the code repository at
// that commit (DREATIVE_REPO overrides the default ../Dreative):
//
//   node scripts/run-all.mjs --scenarios caliber-movement --arms with-a,with-b \
//     --skill-a git:HEAD --skill-b git:a59ee84
//
// Both arms then get the same direction and the same brief, so the only difference is the
// skill itself — which is the comparison a direction A/B cannot make.
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

import { execFileSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { archiveRound } from './lib/archive.mjs'
import { captureMany, killTree } from './lib/capture.mjs'
import { runHealth } from './lib/health.mjs'
import { writeMaterialSummary, addContinuitySignal } from './lib/material.mjs'
import { createTranscript } from './lib/transcript.mjs'
import { ROOT, RUNS, isSkillArm, listScenarios, scaffoldRun, skillInstalled } from './lib/scaffold.mjs'

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
const VALUE_FLAGS = ['--agent', '--model', '--concurrency', '--timeout', '--arms', '--scenarios', '--direction', '--port', '--repeat', '--round']
const tokens = process.argv.slice(2)
const isValueFlag = (t) => VALUE_FLAGS.includes(t) || String(t).startsWith('--direction-')
// Per-arm direction flags take a value too, so their value must not be mistaken for the
// bare positional direction — that is how --direction-a showcase silently set both arms.
const positional = tokens.filter((a, i) => !a.startsWith('--') && !isValueFlag(tokens[i - 1]))
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
// The control arm is retired (2026-09-04): 19-8 with the last six rounds unanimous, and the
// user's call that comparing against plain Claude is settled. A round now defaults to one skill
// arm; pass --arms with,without explicitly to bring the control back, or --arms with-a,with-b for
// Dreative against Dreative. See VERDICTS.md, notes across rounds.
const ARMS = String(arg('arms', 'with')).split(',').map((a) => a.trim()).filter(Boolean)
for (const armName of ARMS) {
  if (armName !== 'without' && !isSkillArm(armName)) {
    console.error(`unknown arm: ${armName}`)
    console.error('arms are "without" (control), "with" (the skill), or "with-<name>" for a')
    console.error('Dreative-vs-Dreative round, e.g. --arms with-a,with-b')
    process.exit(1)
  }
}
if (new Set(ARMS).size !== ARMS.length) {
  console.error('the same arm twice is not two arms — use --repeat for a variance round, or --arms with-a,with-b')
  process.exit(1)
}
// A variance check runs the SAME input more than once, so any difference between the
// repeats is a property of the run rather than of the skill. Repeats are extra sessions
// inside one round, tagged r1/r2/…, which is what lets variance.mjs diff them.
const REPEAT = Number(arg('repeat', 1))
if (!Number.isInteger(REPEAT) || REPEAT < 1) {
  console.error('--repeat must be a positive integer')
  process.exit(1)
}
const SKIP_CAPTURE = arg('no-capture', false)
// Archiving belongs to Reset, not to the end of a round: a round archived here but never
// reset stayed in runs/ looking like live work, and review has no way to tell the two apart.
// One command puts a round away. `--archive` is the escape hatch for a round you know you
// will not score, since runs/ is gitignored and would otherwise be the only copy.
const ARCHIVE_NOW = arg('archive', false)
const YOLO = !arg('no-yolo', false)
const DIRECTION = arg('direction', POSITIONAL_DIRECTION ?? 'recommended')
// Joining an existing round instead of opening a new one, so a second arm run hours later
// still pairs with the first. See the header.
const RESUME_ROUND = arg('round', null)

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

// A Dreative-vs-Dreative round usually varies the direction, so each arm can name its own:
// --direction-a applies to arm with-a (--direction-with-a does too). Unset falls back to
// --direction, which is what makes an A/B of one direction a pure head-to-head.
function directionFor(armName) {
  if (!isSkillArm(armName)) return null
  const suffix = armName === 'with' ? null : armName.slice(5)
  const raw = suffix ? (arg(`direction-${suffix}`, null) ?? arg(`direction-${armName}`, null)) : null
  if (raw === null || raw === true) return direction
  const value = String(raw).toLowerCase()
  if (value === 'none') return null
  if (value === 'random') return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
  if (!DIRECTIONS.includes(value)) {
    console.error(`--direction-${suffix} must be one of: ${DIRECTIONS.join(', ')} (or "random", or "none")`)
    process.exit(1)
  }
  return value
}
const ARM_DIRECTION = Object.fromEntries(ARMS.map((a) => [a, directionFor(a)]))

// A skill tree per arm. `git:<ref>` is extracted from the code repository into scratch/,
// which is why an old skill can be run without checking anything out or disturbing the
// working tree. A plain path is used as it is.
const CODE_REPO = process.env.DREATIVE_REPO || path.resolve(ROOT, '..', 'Dreative')
function skillTreeFor(armName) {
  if (!isSkillArm(armName)) return null
  const suffix = armName === 'with' ? null : armName.slice(5)
  const raw = suffix ? (arg(`skill-${suffix}`, null) ?? arg(`skill-${armName}`, null)) : arg('skill', null)
  if (raw === null || raw === true) return null
  const spec = String(raw)
  if (!spec.startsWith('git:')) {
    const dir = path.resolve(spec)
    if (!fs.existsSync(dir)) {
      console.error(`--skill-${suffix ?? ''}: no such directory: ${dir}`)
      process.exit(1)
    }
    return { dir, label: spec }
  }
  const ref = spec.slice(4)
  if (!fs.existsSync(path.join(CODE_REPO, '.git'))) {
    console.error(`--skill-${suffix ?? ''} ${spec}: no git repository at ${CODE_REPO}`)
    console.error('Set DREATIVE_REPO to the code project, or pass a directory instead.')
    process.exit(1)
  }
  let sha
  try {
    sha = execFileSync('git', ['-C', CODE_REPO, 'rev-parse', '--short', ref], { encoding: 'utf8' }).trim()
  } catch {
    console.error(`--skill-${suffix ?? ''} ${spec}: ${ref} is not a commit in ${CODE_REPO}`)
    process.exit(1)
  }
  const dir = path.join(ROOT, 'scratch', `skill-${sha}`)
  if (!fs.existsSync(path.join(dir, 'SKILL.md'))) {
    fs.rmSync(dir, { recursive: true, force: true })
    fs.mkdirSync(dir, { recursive: true })
    // Pure git: list the tree at that commit and write each blob out. tar on Windows reads
    // a C: path as a remote host, and this needs no external archiver at all.
    const files = execFileSync('git', ['-C', CODE_REPO, 'ls-tree', '-r', '--name-only', sha, '--', 'skill/dreative'], { encoding: 'utf8' })
      .split(String.fromCharCode(10))
      .map((line) => line.trim())
      .filter(Boolean)
    for (const file of files) {
      const rel = file.slice('skill/dreative/'.length)
      const dest = path.join(dir, rel)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, execFileSync('git', ['-C', CODE_REPO, 'show', sha + ':' + file], { maxBuffer: 1 << 28 }))
    }
  }
  return { dir, label: `git:${sha}` }
}
const ARM_SKILL = Object.fromEntries(ARMS.map((a) => [a, skillTreeFor(a)]))

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
    // stream-json is what makes the transcript answer "which skill files did it open?".
    // Without it `claude -p` prints only the final assistant message, so every archived
    // agent.log has zero tool calls in it — see lib/transcript.mjs.
    const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose']
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
    const rawStream = fs.createWriteStream(path.join(runDir, 'agent.jsonl'))
    const transcript = createTranscript()
    logStream.write(`$ ${cmd} (${AGENT}${MODEL && MODEL !== true ? `, ${MODEL}` : ''})\n\n${prompt}\n\n---\n\n`)

    log(`[${runName}] session started`)
    const child = spawn(cmd, args, { cwd: runDir, shell: false })

    const watch = (d) => {
      rawStream.write(d)
      logStream.write(transcript.write(d))
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

    child.on('close', async (code) => {
      clearTimeout(killer)
      logStream.write(transcript.end())
      logStream.end()
      rawStream.end()
      const reads = transcript.summary()
      if (reads) {
        fs.writeFileSync(path.join(runDir, 'reads.json'), JSON.stringify(reads, null, 2))
        const opened = Object.keys(reads.skillFilesRead)
        log(`[${runName}] skill files opened: ${opened.length ? opened.join(', ') : 'NONE'}`)
      }
      // What shipped, materially. An instrument, not a gate — it blocks nothing and advises
      // nothing. Recorded because visual smoke passed `202608262140` with no blockers while
      // the page had nothing on it that could be driven, and no existing record held that.
      let material = null
      try {
        material = writeMaterialSummary(runDir)
        if (material) log(`[${runName}] material: ${material.verdict}`)
        // Whether the set is one thing, and whether it was treated into one. Needs a browser
        // to decode webp, so it runs after the synchronous record is already on disk.
        if (material) {
          const continuity = await addContinuitySignal(runDir)
          if (continuity) log(`[${runName}] continuity: ${continuity.note}`)
          const sections = JSON.parse(fs.readFileSync(path.join(runDir, 'material.json'), 'utf8')).sectionCoverage
          if (sections) log(`[${runName}] sections: ${sections.note}`)
        }
      } catch (err) {
        log(`[${runName}] material summary failed: ${err.message}`)
      }
      const mins = ((Date.now() - started) / 60_000).toFixed(1)
      // A session the provider cut off is not a build that chose to stop. Three rounds in a row
      // were killed mid-work by a usage limit and every one of them was read afterwards as if the
      // agent had finished and made its choices — the missing refinement pass gets scored as bad
      // craft, and an absent stage gets scored as an absent decision. Detect it here and say so
      // everywhere the run is looked at.
      let truncated = null
      try {
        const tail = fs.readFileSync(path.join(runDir, 'agent.log'), 'utf8').slice(-4000)
        if (/hit your (session|usage) limit|usage limit reached|rate limit/i.test(tail)) truncated = 'provider limit'
        else if (timedOut) truncated = 'killed at the time cap'
      } catch {}
      if (truncated) {
        try {
          const rj = path.join(runDir, 'run.json')
          const meta = JSON.parse(fs.readFileSync(rj, 'utf8'))
          fs.writeFileSync(rj, JSON.stringify({ ...meta, truncated }, null, 2))
        } catch {}
      }
      log(
        `[${runName}] session finished in ${mins}m (exit ${code})${timedOut ? ' — KILLED AT CAP, duration is a floor not a measurement' : ''}`,
      )
      if (truncated) {
        log(
          `[${runName}] TRUNCATED (${truncated}) — this build did not finish. Defects of craft, missing
    stages and absent decisions are all unattributable here; do not score it against the skill.`,
        )
      }
      resolve({ runName, code, minutes: Number(mins), timedOut, truncated, reads, material })
    })

    child.on('error', (err) => {
      clearTimeout(killer)
      logStream.end()
      rawStream.end()
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

// Resuming writes into an existing round number rather than opening a new one, so the
// second arm lands beside the first. Pairing, archiving and the verdict all key off this.
const roundStamp =
  RESUME_ROUND && RESUME_ROUND !== true ? String(RESUME_ROUND) : new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
if (RESUME_ROUND && RESUME_ROUND !== true) {
  const existing = fs.existsSync(RUNS) ? fs.readdirSync(RUNS).filter((d) => d.includes(`__${roundStamp}`)) : []
  if (!existing.length) {
    console.error(`\nNo run of round ${roundStamp} is left in runs/, so this arm would have nothing to be`)
    console.error('paired against. A round that has been reset is archived and cleared, and its arms')
    console.error('cannot be added to. Run both arms as a fresh round instead.\n')
    process.exit(1)
  }
  console.log(`\nResuming round ${roundStamp} — ${existing.length} run(s) already in runs/`)
}
const jobs = []

for (const scenario of SCENARIOS) {
  for (const arm of ARMS) {
    for (let rep = 1; rep <= REPEAT; rep++) {
      try {
        jobs.push(
          scaffoldRun({
            scenario,
            arm,
            seq: roundStamp,
            direction: ARM_DIRECTION[arm],
            skillTree: ARM_SKILL[arm]?.dir ?? null,
            skillLabel: ARM_SKILL[arm]?.label ?? null,
            label: REPEAT > 1 ? `r${rep}` : undefined,
          }),
        )
      } catch (err) {
        console.error(`could not scaffold ${scenario}/${arm}: ${err.message}`)
        if (/already exists/.test(err.message)) {
          console.error('That arm of this round has already been run. Name the other arm in --arms, or')
          console.error('drop --round to start a new round.')
        }
        process.exit(1)
      }
    }
  }
}

console.log(`\nRound ${roundStamp}`)
console.log(`  agent        ${AGENT}${MODEL && MODEL !== true ? ` (${MODEL})` : ''}`)
console.log(`  permissions  ${YOLO ? 'FULL BYPASS + network (default; --no-yolo to scope)' : 'acceptEdits + scoped tools + network'}`)
const skillArms = ARMS.filter(isSkillArm)
const directionLine =
  skillArms.length > 1 && new Set(skillArms.map((a) => ARM_DIRECTION[a])).size > 1
    ? skillArms.map((a) => `${a}=${ARM_DIRECTION[a] ?? 'unstated'}`).join(', ')
    : `${direction ?? 'unstated (the skill will fall back to Recommended)'}${requested === 'random' ? ' (picked at random)' : ''}`
console.log(`  direction    ${directionLine}`)
console.log(`  scenarios    ${SCENARIOS.join(', ')}${COUNT !== null ? ` (${COUNT} picked at random)` : ''}`)
console.log(`  arms         ${ARMS.join(', ')}${skillArms.length > 1 ? '  (Dreative vs Dreative — no control in this round)' : ''}${REPEAT > 1 ? `  ×${REPEAT} repeats of the same input` : ''}`)
if (Object.values(ARM_SKILL).some(Boolean)) {
  const shown = ARMS.filter(isSkillArm).map((a) => `${a}=${ARM_SKILL[a]?.label ?? 'installed'}`)
  console.log(`  skill        ${shown.join(', ')}`)
}
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

// A provider limit is the other way a build stops without deciding to, and it is the one that has
// actually been costing rounds. Say it at the end too, where the verdict is about to be formed.
const cut = sessions.filter((s) => s.truncated === 'provider limit')
if (cut.length) {
  console.log(`\n${cut.length} session(s) were CUT OFF BY THE PROVIDER mid-work:`)
  for (const c of cut) console.log(`  ${c.runName}`)
  console.log('These builds did not finish. Craft defects, missing stages and absent decisions in')
  console.log('them are unattributable — they are not evidence about the skill. Re-run before scoring.')
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
  const shots = await captureMany(toCapture, 4173, log, direction ?? 'recommended')
  const broken = shots.filter((s) => !s.ok)
  if (broken.length) {
    console.log(`\n${broken.length} run(s) failed to build or capture:`)
    for (const b of broken) console.log(`  ${b.runName}: ${b.error}`)
    console.log('A build failure is a real result. Judge the pairs that captured.')
  }
}

const previousMeta = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(RUNS, `round-${roundStamp}.json`), 'utf8'))
  } catch {
    return null
  }
})()

const roundMeta = {
  round: roundStamp,
  agent: AGENT,
  model: MODEL && MODEL !== true ? String(MODEL) : null,
  yolo: Boolean(YOLO),
  direction,
  skills: { ...(previousMeta?.skills ?? {}), ...Object.fromEntries(ARMS.filter(isSkillArm).map((a) => [a, ARM_SKILL[a]?.label ?? 'installed'])) },
  scenarios: [...new Set([...(previousMeta?.scenarios ?? []), ...SCENARIOS])],
  // A resumed round is still one round: its arms and sessions are the union of every
  // command that wrote into it, or the record describes only the arm you ran last.
  arms: [...new Set([...(previousMeta?.arms ?? []), ...ARMS])],
  repeat: REPEAT,
  sessions: [...(previousMeta?.sessions ?? []), ...sessions],
}

fs.writeFileSync(path.join(RUNS, `round-${roundStamp}.json`), JSON.stringify(roundMeta, null, 2), 'utf8')

// ---------------------------------------------------------------- archive
//
// runs/ is disposable and gitignored. The archive is the copy that gets committed and
// survives a pull on another machine — but it is written by Reset, once the round has been
// scored, so that "archived" and "finished with" mean the same thing. Reset archives before
// it deletes anything, and node_modules is still linked at that point, so the portable
// sites still build.

if (REPEAT > 1) {
  console.log(`
This was a ×${REPEAT} variance round. Compare what the repeats read:
  node scripts/variance.mjs`)
}

if (ARCHIVE_NOW) {
  console.log('\nArchiving round…')
  const { roundDir } = archiveRound({ round: roundStamp, runNames: jobs.map((j) => j.runName), meta: roundMeta, log })
  console.log(`Archived to ${path.relative(ROOT, roundDir)}/ — commit it to keep this round.`)
} else {
  console.log(`\nThis round is in runs/ only, which is gitignored. Reset in review.mjs archives it.`)
  if (ARMS.length < 2) {
    console.log(`\nOne arm only. Run the other into this same round — do not reset first:\n\n  node scripts/run-all.mjs --round ${roundStamp} --scenarios ${SCENARIOS.join(',')} --arms <other-arm>\n`)
  }
}

console.log(`\nRound complete. Now judge it:\n\n  node scripts/review.mjs\n`)
