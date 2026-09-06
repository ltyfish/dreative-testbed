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
logStream.write(`\n\n===== PHASE 2 — the full route (resumed by continue-run) =====\n\n`)

console.log(`resuming ${runName} (session ${sessionId}), ${timeoutMin}m cap…`)
const started = Date.now()
const child = spawn('claude', args, { cwd: runDir, shell: false, windowsHide: true })
const timer = setTimeout(() => child.kill(), timeoutMin * 60_000)

child.stdout.on('data', (d) => {
  rawStream.write(d)
  logStream.write(transcript.write(d))
})
child.stderr.on('data', (d) => logStream.write(String(d)))

child.on('close', async (code) => {
  clearTimeout(timer)
  logStream.end()
  rawStream.end()
  console.log(`session ended (exit ${code}) after ${((Date.now() - started) / 60_000).toFixed(1)}m`)

  const current = JSON.parse(fs.readFileSync(metaFile, 'utf8'))
  fs.writeFileSync(metaFile, JSON.stringify({ ...current, phase: 2, builtAt: new Date().toISOString() }, null, 2), 'utf8')

  console.log('capturing…')
  await captureMany([runName], 4173, console.log, meta.direction ?? 'recommended')
  console.log('done — the run is in the review at http://127.0.0.1:4321/')
})
