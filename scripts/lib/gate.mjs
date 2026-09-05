// The prototype gate: look at what a round built before deciding to spend anything else on it.
//
// A round used to go straight from "sessions finished" to "go and score it", so a truncated
// build, a page with a viewport-sized hole in it and a finished design all arrived at the
// review looking identical. On 2026-09-05 that cost a real verdict — a build killed at the
// time cap, whose own smoke run had already returned ok:false, was opened cold and read as a
// design decision. The instruments knew. Nothing put them in front of anyone first.
//
// So: pause here, print what is already known about each run, serve it, and ask. `n` marks
// the run rejected in run.json — the review UI then shows it as rejected rather than
// offering it for scoring, and no verdict can be attached to a build you already threw out.
//
// This is a stop/continue decision, not a score. Rejecting costs nothing and is the right
// answer for anything truncated: a build that did not finish is not evidence about the skill.
//
// Note on what is possible: `claude -p` is one shot with no way back in, so the gate cannot
// pause a session mid-build and let it carry on afterwards. It gates the finished artefact.

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { RUNS } from './scaffold.mjs'
import { freePort, killTree, spawnPreview } from './capture.mjs'
import { readSmoke } from './smoke.mjs'

function lookReport(runDir) {
  const file = path.join(runDir, '.look', 'report.json')
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function meta(runDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'))
  } catch {
    return {}
  }
}

/**
 * Ask about each run in turn. Returns the names that were kept.
 *
 * @param runNames  runs to gate, in the order they should be shown
 * @param sessions  what run-all already learned while running them (truncation, mostly)
 */
export async function gateRuns(runNames, sessions, log = console.log) {
  if (!stdin.isTTY) {
    log('\n--gate needs a terminal to ask in; skipping the gate and keeping every run.')
    return runNames
  }

  const rl = readline.createInterface({ input: stdin, output: stdout })
  const kept = []
  let port = 4500

  try {
    for (const runName of runNames) {
      const runDir = path.join(RUNS, runName)
      const info = meta(runDir)
      const session = sessions.find((s) => s.runName === runName)
      const smoke = readSmoke(runDir)
      const look = lookReport(runDir)

      console.log('\n' + '='.repeat(78))
      console.log(runName)
      console.log('='.repeat(78))
      console.log(`  ${info.product ?? '?'} · ${info.direction ?? 'unstated'} · skill ${info.skill ?? '—'}`)

      // Truncation first and on its own line. It is the single fact that most changes how
      // everything below should be read, and it is the one that kept getting missed.
      if (info.truncated) {
        console.log('')
        console.log(`  ✕ TRUNCATED — ${info.truncated}. This build did not finish.`)
        console.log('    Missing stages, craft defects and absent decisions here are unattributable.')
        console.log('    The right answer is almost always n: re-run it rather than score it.')
      } else if (session?.minutes) {
        console.log(`  finished in ${session.minutes}m`)
      }

      if (look) {
        console.log('')
        if (look.broken.length) {
          console.log(`  BROKEN (${look.broken.length}) — the builder saw these too:`)
          for (const b of look.broken.slice(0, 8)) console.log(`    ✕ ${b}`)
          if (look.broken.length > 8) console.log(`    … and ${look.broken.length - 8} more in .look/report.txt`)
        } else {
          console.log('  BROKEN — nothing.')
        }
        const inert = look.observed.filter((o) => /nothing changes across it/.test(o))
        if (inert.length) console.log(`  ${inert.length} section(s) with nothing happening across them (see .look/report.txt)`)
      } else {
        console.log('\n  no .look report — the builder never ran `npm run look` on this one.')
      }

      if (smoke && smoke.ok === false) {
        console.log('')
        console.log(`  visual smoke BLOCKED: ${smoke.blockers.slice(0, 3).join(' | ')}`)
      }

      const chosen = await freePort(port++)
      const server = spawnPreview(runDir, chosen)
      console.log('')
      console.log(`  Live:  http://127.0.0.1:${chosen}/`)
      console.log(`  Tiles: ${path.join(path.relative(process.cwd(), runDir), '.look')}`)
      console.log('')

      let answer = ''
      try {
        while (!/^[yn]$/i.test(answer)) {
          answer = (await rl.question('  Keep this prototype and score it?  [y/n]  ')).trim()
          if (answer === '') answer = 'y'
        }
      } finally {
        killTree(server.pid)
      }

      const keep = /^y$/i.test(answer)
      if (keep) {
        kept.push(runName)
        log(`[${runName}] kept`)
      } else {
        try {
          fs.writeFileSync(
            path.join(runDir, 'run.json'),
            JSON.stringify({ ...info, rejected: new Date().toISOString() }, null, 2),
            'utf8',
          )
        } catch {}
        log(`[${runName}] REJECTED at the gate — it will not be offered for scoring`)
      }
    }
  } finally {
    rl.close()
  }

  return kept
}
