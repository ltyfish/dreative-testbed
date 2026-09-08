// Continue a two-phase run whose round died between the phases.
//
// A prototype round is phase one, your decision at the gate, then the SAME agent session
// resumed for the rest of the page. Everything about that is recoverable except the round
// process itself: on 2026-09-06 it crashed in the gate's cleanup the moment Continue was
// pressed, and a run with sixteen minutes of phase-one work in it had nowhere to go. Pressing
// Continue again did nothing, because there was no longer a process listening for the answer.
//
// This is the way back. It resumes the recorded session with the phase-two prompt, then builds
// and captures exactly as the round would have, so the run reaches the review as a finished
// build rather than a stranded prototype.
//
//   node scripts/continue-run.mjs <run-name>
//
// It needs `sessionId` in the run's run.json (written by run-all since 2026-09-06). For a run
// from before that, the id is recoverable from the first line of agent.jsonl.

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { RUNS } from './lib/scaffold.mjs'
import { captureMany } from './lib/capture.mjs'
import { CONTINUE_PHASE } from './lib/prototype.mjs'
import { addContinuitySignal, writeMaterialSummary } from './lib/material.mjs'
import { createTranscript } from './lib/transcript.mjs'

const runName = process.argv[2]
if (!runName) {
  console.error('usage: node scripts/continue-run.mjs <run-name>')
  process.exit(2)
}

const runDir = path.join(RUNS, runName)
const metaFile = path.join(runDir, 'run.json')
if (!fs.existsSync(metaFile)) {
  console.error(`no such run: ${runName}`)
  process.exit(2)
}
const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'))

/** The id run-all recorded, or the one the agent itself printed on its first event. */
function sessionIdFor() {
  if (meta.sessionId) return meta.sessionId
  const raw = path.join(runDir, 'agent.jsonl')
  if (!fs.existsSync(raw)) return null
  for (const line of fs.readFileSync(raw, 'utf8').split('\n')) {
    if (!line.trim()) continue
    try {
      const id = JSON.parse(line).session_id
      if (id) return id
    } catch {
      /* the stream is not all JSON lines */
    }
  }
  return null
}

const sessionId = sessionIdFor()
if (!sessionId) {
  console.error(`${runName} has no session id in run.json or agent.jsonl — it cannot be resumed.`)
  console.error('Re-run the scenario instead.')
  process.exit(1)
}
if (meta.builtAt) console.log(`note: ${runName} is already stamped built — continuing it anyway.`)

const timeoutMin = Number(process.env.DREATIVE_TIMEOUT ?? 60)
const args = [
  '-p',
  CONTINUE_PHASE,
  '--output-format',
  'stream-json',
  '--verbose',
  '--resume',
  sessionId,
  '--permission-mode',
  'bypassPermissions',
]
const mcpFile = path.join(runDir, '.mcp.json')
if (fs.existsSync(mcpFile)) args.push('--mcp-config', mcpFile, '--strict-mcp-config')

const logStream = fs.createWriteStream(path.join(runDir, 'agent.log'), { flags: 'a' })
const rawStream = fs.createWriteStream(path.join(runDir, 'agent.jsonl'), { flags: 'a' })
const transcript = createTranscript()
const PHASE_TWO_MARKER = '===== PHASE 2 — the full route (resumed by continue-run) ====='
logStream.write(`\n\n${PHASE_TWO_MARKER}\n\n`)

console.log(`resuming ${runName} (session ${sessionId}), ${timeoutMin}m cap…`)
const started = Date.now()
const child = spawn('claude', args, { cwd: runDir, shell: false, windowsHide: true })
let timedOut = false
const timer = setTimeout(() => {
  timedOut = true
  child.kill()
}, timeoutMin * 60_000)

child.stdout.on('data', (d) => {
  rawStream.write(d)
  logStream.write(transcript.write(d))
})
child.stderr.on('data', (d) => logStream.write(String(d)))

child.on('close', async (code) => {
  clearTimeout(timer)
  logStream.write(transcript.end())
  logStream.end()
  rawStream.end()
  console.log(`session ended (exit ${code}) after ${((Date.now() - started) / 60_000).toFixed(1)}m`)

  // The instruments run-all writes on close. Without them a continued run reaches the review
  // wearing phase-one measurements: reads.json counting only what the prototype opened, and a
  // truncation banner from the death this script just recovered from. Both get read as findings
  // about the skill, which is the one thing the record must never invent.

  // reads.json over BOTH phases. The whole session is on disk, so replay it rather than
  // summarise only what this process happened to see.
  try {
    const replay = createTranscript()
    replay.write(fs.readFileSync(path.join(runDir, 'agent.jsonl')))
    const reads = replay.summary()
    if (reads) {
      fs.writeFileSync(path.join(runDir, 'reads.json'), JSON.stringify(reads, null, 2))
      const opened = Object.keys(reads.skillFilesRead)
      console.log(`skill files opened: ${opened.length ? opened.join(', ') : 'NONE'}`)
    }
  } catch (err) {
    console.log(`reads summary failed: ${err.message}`)
  }

  // What shipped, materially. Phase two is where most of it ships.
  try {
    if (writeMaterialSummary(runDir)) {
      const continuity = await addContinuitySignal(runDir)
      if (continuity) console.log(`continuity: ${continuity.note}`)
    }
  } catch (err) {
    console.log(`material summary failed: ${err.message}`)
  }

  // Did THIS phase finish? Judge the resumed slice only. The phase-one limit message is still
  // in the log above the marker, and reading it again would re-truncate a build that ran clean.
  let truncated = null
  try {
    const full = fs.readFileSync(path.join(runDir, 'agent.log'), 'utf8')
    const phaseTwo = full.slice(full.lastIndexOf(PHASE_TWO_MARKER)).slice(-4000)
    if (/hit your (session|usage) limit|usage limit reached|rate limit/i.test(phaseTwo)) truncated = 'provider limit'
    else if (timedOut) truncated = 'killed at the time cap'
  } catch {}
  if (truncated) console.log(`TRUNCATED (${truncated}) - this continuation did not finish either.`)

  const current = JSON.parse(fs.readFileSync(metaFile, 'utf8'))
  const continued = { ...current, phase: 2, builtAt: new Date().toISOString() }
  if (truncated) continued.truncated = truncated
  else delete continued.truncated
  fs.writeFileSync(metaFile, JSON.stringify(continued, null, 2), 'utf8')

  console.log('capturing…')
  await captureMany([runName], 4173, console.log, meta.direction ?? 'recommended')
  console.log('done — the run is in the review at http://127.0.0.1:4321/')
})
