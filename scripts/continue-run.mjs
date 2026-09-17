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
import { extractSessionId, inferAgent, resolveAgentBinary } from './lib/agent.mjs'
import { RUNS } from './lib/scaffold.mjs'
import { captureMany, killTree } from './lib/capture.mjs'
import { continuationPrompt } from './lib/prototype.mjs'
import { DESIGN_PROTOCOL, selectedDesign } from './lib/design-directions.mjs'
import { gateOne } from './lib/gate.mjs'
import { codexToolArgs } from './lib/tool-config.mjs'
import { addContinuitySignal, writeMaterialSummary } from './lib/material.mjs'
import { createTranscript } from './lib/transcript.mjs'

// UI-launched continuations have a hidden console. Mirror lifecycle messages to the file the
// status page records so a launch failure or a long capture does not look like a dead button.
const progressFile = process.env.DREATIVE_ROUND_LOG
if (progressFile) {
  fs.mkdirSync(path.dirname(progressFile), { recursive: true })
  fs.writeFileSync(progressFile, '', 'utf8')
  const mirror = (base) => (...values) => {
    const line = values.map((value) => typeof value === 'string' ? value : JSON.stringify(value)).join(' ')
    fs.appendFileSync(progressFile, `${line}\n`, 'utf8')
    base(...values)
  }
  console.log = mirror(console.log.bind(console))
  console.error = mirror(console.error.bind(console))
}

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

if (meta.phaseProtocol === DESIGN_PROTOCOL) {
  let selected = false
  try { selectedDesign(runDir); selected = true } catch {}
  if (!selected) {
    const keep = await gateOne(runName, {
      stage: 'design', heading: 'Design prototype · choose before implementation',
      question: 'Which visual direction should become the website?',
      labels: { keep: 'Build selected direction', reject: 'Stop this run' },
    })
    if (!keep) process.exit(1)
    Object.assign(meta, JSON.parse(fs.readFileSync(metaFile, 'utf8')))
  }
}
const phasePrompt = continuationPrompt(runDir)

const logFile = path.join(runDir, 'agent.log')
const rawFile = path.join(runDir, 'agent.jsonl')
const priorLog = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : ''
const priorRaw = fs.existsSync(rawFile) ? fs.readFileSync(rawFile, 'utf8') : ''
const agent = inferAgent(meta, priorLog)
const sessionId = extractSessionId(agent, { meta, logText: priorLog, rawText: priorRaw })
if (!sessionId) {
  console.error(`${runName} has no ${agent} session id in run.json or provider output — it cannot be resumed.`)
  console.error('Re-run the scenario instead.')
  process.exit(1)
}
if (meta.builtAt) console.log(`note: ${runName} is already stamped built — continuing it anyway.`)

const timeoutMin = Number(process.env.DREATIVE_TIMEOUT ?? 60)
const mcpFile = path.join(runDir, '.mcp.json')
let args
if (agent === 'codex') {
  args = ['exec', '--dangerously-bypass-approvals-and-sandbox']
  if (fs.existsSync(mcpFile)) {
    const servers = JSON.parse(fs.readFileSync(mcpFile, 'utf8')).mcpServers ?? {}
    args.push(...codexToolArgs(servers))
  }
  if (meta.model) args.push('--model', String(meta.model))
  args.push('resume', sessionId, phasePrompt)
} else {
  args = [
    '-p',
    phasePrompt,
    '--output-format',
    'stream-json',
    '--verbose',
    '--resume',
    sessionId,
    '--permission-mode',
    'bypassPermissions',
  ]
  if (fs.existsSync(mcpFile)) args.push('--mcp-config', mcpFile, '--strict-mcp-config')
  if (meta.model) args.push('--model', String(meta.model))
}

const agentBin = resolveAgentBinary(agent)
if (!agentBin) {
  console.error(`could not find a native ${agent} executable`)
  process.exit(1)
}

fs.writeFileSync(
  metaFile,
  JSON.stringify({ ...meta, phase: meta.phaseProtocol === DESIGN_PROTOCOL ? 2 : meta.phase, agent, providerSessionId: agent === 'codex' ? sessionId : meta.providerSessionId }, null, 2),
  'utf8',
)

const logStream = fs.createWriteStream(path.join(runDir, 'agent.log'), { flags: 'a' })
const rawStream = fs.createWriteStream(path.join(runDir, 'agent.jsonl'), { flags: 'a' })
const transcript = createTranscript()
const PHASE_TWO_MARKER = '===== PHASE 2 — the full route (resumed by continue-run) ====='
logStream.write(`\n\n${PHASE_TWO_MARKER}\n\n`)

console.log(`resuming ${runName} with ${agent} (session ${sessionId}), ${timeoutMin}m cap…`)
const started = Date.now()
const child = spawn(agentBin, args, {
  cwd: runDir,
  shell: false,
  windowsHide: true,
  stdio: ['ignore', 'pipe', 'pipe'],
})
let timedOut = false
const timer = setTimeout(() => {
  timedOut = true
  killTree(child.pid)
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
  let continued
  if (code === 0 && !truncated) {
    continued = { ...current, phase: 2, builtAt: new Date().toISOString() }
    delete continued.truncated
    delete continued.continuationError
  } else {
    const { builtAt: _builtAt, ...notBuilt } = current
    continued = {
      ...notBuilt,
      phase: current.phaseProtocol === DESIGN_PROTOCOL ? 2 : 1,
      truncated: truncated ?? current.truncated ?? 'provider error',
      continuationError: `exit ${code}`,
    }
  }
  fs.writeFileSync(metaFile, JSON.stringify(continued, null, 2), 'utf8')

  if (code !== 0 || truncated) {
    console.log('continuation did not finish — preserving design/capture artifacts and leaving the run resumable.')
    process.exitCode = code || 1
    return
  }

  console.log('capturing…')
  await captureMany([runName], 4173, console.log, meta.direction ?? 'recommended')
  console.log('done — the run is in the review at http://127.0.0.1:4321/')
})
