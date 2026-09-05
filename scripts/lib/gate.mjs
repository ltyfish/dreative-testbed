// The prototype gate: look at what a round built before deciding to spend anything else on it.
//
// A round used to go straight from "sessions finished" to "go and score it", so a truncated
// build, a page with a viewport-sized hole in it, and a finished design all arrived at the
// review looking identical. On 2026-09-05 that cost a real verdict — a build killed at the
// time cap, whose own smoke run had already returned ok:false, was opened cold and read as a
// design decision. The instruments knew. Nothing put them in front of anyone first.
//
// So: pause here, print what is already known about each run, serve it, and ask. `n` marks
// the run rejected in run.json — the review UI then shows it as rejected rather than offering
// it for scoring, and no verdict can be attached to a build you already threw out.
//
// This is a stop/continue decision, not a score. Rejecting costs nothing and is the right
// answer for anything truncated: a build that did not finish is not evidence about the skill.
//
// It asks in whichever place you are. From a terminal it prompts on stdin. From a round
// started in the review UI there is no terminal, so it publishes the question to `.gate.json`
// and waits for the browser to answer — the round genuinely blocks either way, which is the
// point. Earlier this skipped itself without a TTY, which quietly turned --gate into a no-op
// for exactly the people who asked for the gate to be on a screen.
//
// `gateRuns` gates finished builds. `gateOne` gates a single run mid-round, which is what a
// two-phase prototype round uses: the session stops after the signature mechanism, this asks,
// and the same session is resumed afterwards. An earlier version of this comment said a
// mid-build gate was impossible because `claude -p` is one-shot. That was wrong — the CLI
// takes `--session-id` and `--resume`, so a round can genuinely pause and carry on.

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { RUNS } from './scaffold.mjs'
import { freePort, killTree, spawnPreview } from './capture.mjs'
import { readSmoke } from './smoke.mjs'
import { bestLook } from './look.mjs'

export const GATE_FILE = path.join(RUNS, '.gate.json')

/** Nobody is coming back to answer after this long; keep the build rather than lose the round. */
const WAIT_LIMIT_MS = 6 * 60 * 60_000

const readJson = (p, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}

/** What is known about a run before anyone looks at it. Shared by the terminal and the UI. */
export function gateBriefing(runName) {
  const runDir = path.join(RUNS, runName)
  const meta = readJson(path.join(runDir, 'run.json'), {})
  const look = bestLook(runDir)
  const smoke = readSmoke(runDir)
  return {
    run: runName,
    product: meta.product ?? null,
    direction: meta.direction ?? null,
    skill: meta.skill ?? null,
    truncated: meta.truncated ?? null,
    looked: Boolean(look),
    lookedByBuilder: look ? look.byBuilder : null,
    broken: look ? look.broken : null,
    inert: look ? look.observed.filter((o) => /nothing changes across it/.test(o)) : null,
    smokeBlockers: smoke && smoke.ok === false ? smoke.blockers : null,
  }
}

function printBriefing(brief) {
  console.log('\n' + '='.repeat(78))
  console.log(brief.run)
  console.log('='.repeat(78))
  console.log(`  ${brief.product ?? '?'} · ${brief.direction ?? 'unstated'} · skill ${brief.skill ?? '—'}`)

  // Truncation first and on its own line. It is the single fact that most changes how
  // everything below should be read, and it is the one that kept getting missed.
  if (brief.truncated) {
    console.log('')
    console.log(`  x TRUNCATED — ${brief.truncated}. This build did not finish.`)
    console.log('    Missing stages, craft defects and absent decisions here are unattributable.')
    console.log('    The right answer is almost always n: re-run it rather than score it.')
  }

  if (brief.looked) {
    console.log('')
    if (brief.broken.length) {
      console.log(`  BROKEN (${brief.broken.length}) — the builder could see these too:`)
      for (const b of brief.broken.slice(0, 8)) console.log(`    x ${b}`)
      if (brief.broken.length > 8) console.log(`    … and ${brief.broken.length - 8} more`)
    } else {
      console.log('  BROKEN — nothing.')
    }
    if (brief.inert.length) console.log(`  ${brief.inert.length} section(s) with nothing happening across them`)
  } else {
    console.log('\n  no look report — nothing rendered this build before you did.')
  }

  if (brief.smokeBlockers) {
    console.log('')
    console.log(`  visual smoke BLOCKED: ${brief.smokeBlockers.slice(0, 3).join(' | ')}`)
  }
}

function reject(runName) {
  const runDir = path.join(RUNS, runName)
  const meta = readJson(path.join(runDir, 'run.json'), {})
  try {
    fs.writeFileSync(
      path.join(runDir, 'run.json'),
      JSON.stringify({ ...meta, rejected: new Date().toISOString() }, null, 2),
      'utf8',
    )
  } catch {
    /* the record is best-effort; the round must not die here */
  }
}

/** Is the round that asked this question still running? */
function askerAlive(state) {
  if (!state?.pid) return false
  try {
    process.kill(state.pid, 0)
    return true
  } catch {
    return false
  }
}

/**
 * The question currently on the table, for the review UI to render. Null when there is none.
 *
 * A question outlives the process that asked it whenever that process dies while waiting — a
 * provider limit, a Ctrl-C, a reboot. Nothing then consumes the answer and nothing deletes the
 * file, so the page kept showing "a round is waiting on you" for a round that had been dead for
 * hours, with Keep and Throw-it-out buttons that could not do anything. That is worse than no
 * gate: it asks for a decision that has no effect and gives no sign of it. So a question whose
 * asker is gone, or one that has already been answered, is not pending — it is litter, and it
 * gets cleared here.
 */
export function pendingGate() {
  const state = readJson(GATE_FILE)
  if (!state?.current) return null
  if (state.answer || !askerAlive(state)) {
    fs.rmSync(GATE_FILE, { force: true })
    return null
  }
  return state
}

/** The browser's answer. Returns false when it is not the question actually being asked. */
export function answerGate(runName, decision) {
  const state = readJson(GATE_FILE)
  if (!state?.current || state.current !== runName) return false
  if (decision !== 'keep' && decision !== 'reject') return false
  // Answering a question nobody is listening to would report success and change nothing.
  if (!askerAlive(state)) {
    fs.rmSync(GATE_FILE, { force: true })
    return false
  }
  fs.writeFileSync(GATE_FILE, JSON.stringify({ ...state, answer: decision, answeredAt: new Date().toISOString() }, null, 2), 'utf8')
  return true
}

function publish(state) {
  fs.mkdirSync(RUNS, { recursive: true })
  // Stamp who is asking, so a question can be told from litter. See pendingGate.
  fs.writeFileSync(GATE_FILE, JSON.stringify({ ...state, pid: process.pid }, null, 2), 'utf8')
}

/** Wait for the browser to answer the question we just published. */
async function waitForBrowser(runName, log) {
  const started = Date.now()
  log(`[${runName}] waiting for a keep/reject decision in the review UI (/status)`)
  for (;;) {
    const state = readJson(GATE_FILE)
    if (state?.current === runName && state.answer) return state.answer === 'keep'
    if (Date.now() - started > WAIT_LIMIT_MS) {
      log(`[${runName}] no decision after 6h — keeping it rather than losing the round`)
      return true
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
}

/**
 * Ask about each run in turn. Returns the names that were kept.
 *
 * @param runNames  runs to gate, in the order they should be shown
 * @param sessions  what run-all already learned while running them (truncation, mostly)
 */
/**
 * Ask about one run, serve it while the question is open, and return true to keep going.
 *
 * @param question  what is actually being decided — a prototype gate and a finished-build
 *                  gate ask different things and conflating them cost a verdict already.
 */
export async function gateOne(runName, { question, keepWord = "y", log = console.log, port = 4500, remaining = [] } = {}) {
  const interactive = Boolean(stdin.isTTY)
  const rl = interactive ? readline.createInterface({ input: stdin, output: stdout }) : null
  const runDir = path.join(RUNS, runName)
  const brief = gateBriefing(runName)
  const chosen = await freePort(port)
  const server = spawnPreview(runDir, chosen)
  const url = `http://127.0.0.1:${chosen}/`

  try {
    if (interactive) {
      printBriefing(brief)
      console.log('')
      console.log(`  Live:  ${url}`)
      console.log('')
      let answer = ''
      while (!/^[yn]$/i.test(answer)) {
        answer = (await rl.question(`  ${question}  [y/n]  `)).trim()
        if (answer === '') answer = keepWord
      }
      return /^y$/i.test(answer)
    }
    publish({
      current: runName,
      url,
      question,
      remaining,
      askedAt: new Date().toISOString(),
      briefing: brief,
      answer: null,
    })
    return await waitForBrowser(runName, log)
  } finally {
    killTree(server.pid)
    rl?.close()
    fs.rmSync(GATE_FILE, { force: true })
  }
}

export async function gateRuns(runNames, sessions, log = console.log) {
  const interactive = Boolean(stdin.isTTY)
  const rl = interactive ? readline.createInterface({ input: stdin, output: stdout }) : null
  const kept = []
  let port = 4500

  if (!interactive) {
    log('\nNo terminal to ask in — publishing the gate to the review UI instead.')
    log('Open http://127.0.0.1:4321/status and answer there. The round is waiting.')
  }

  try {
    for (const runName of runNames) {
      const runDir = path.join(RUNS, runName)
      const brief = gateBriefing(runName)
      const chosen = await freePort(port++)
      const server = spawnPreview(runDir, chosen)
      const url = `http://127.0.0.1:${chosen}/`

      let keep
      try {
        if (interactive) {
          printBriefing(brief)
          console.log('')
          console.log(`  Live:  ${url}`)
          console.log('')
          let answer = ''
          while (!/^[yn]$/i.test(answer)) {
            answer = (await rl.question('  Keep this prototype and score it?  [y/n]  ')).trim()
            if (answer === '') answer = 'y'
          }
          keep = /^y$/i.test(answer)
        } else {
          publish({
            current: runName,
            url,
            remaining: runNames.slice(runNames.indexOf(runName) + 1),
            question: 'Keep this prototype and score it?',
            askedAt: new Date().toISOString(),
            briefing: brief,
            answer: null,
          })
          keep = await waitForBrowser(runName, log)
        }
      } finally {
        killTree(server.pid)
      }

      if (keep) {
        kept.push(runName)
        log(`[${runName}] kept`)
      } else {
        reject(runName)
        log(`[${runName}] REJECTED at the gate — it will not be offered for scoring`)
      }
    }
  } finally {
    rl?.close()
    fs.rmSync(GATE_FILE, { force: true })
  }

  return kept
}
