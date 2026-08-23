#!/usr/bin/env node
// What the rounds recorded, across all of them at once.
//
//   node scripts/stats.mjs                      # every archived round, newest first
//   node scripts/stats.mjs --scenario caliber-movement
//   node scripts/stats.mjs --file references/ASSET_PIPELINES.md
//   node scripts/stats.mjs --json
//
// The instruments write per run: reads.json (which skill files were opened), smoke.json
// (blockers plus the recorded measurements), run.json / round.json (duration, timeouts).
// Nothing read any of it across rounds, so every question — did trimming that file get it
// opened, is motion trending, is the skill arm still 5x the control — meant opening a
// dozen JSON files by hand. This is that, done once.
//
// It reports and never judges. A motion count here is a record of what a build did, not a
// score it should have beaten: the number rises with a uniform fade and falls for one
// authored sequence, which is exactly why it stopped being a gate.

import fs from 'node:fs'
import path from 'node:path'
import { ARCHIVE, listRounds } from './lib/archive.mjs'

const argv = process.argv.slice(2)
const arg = (name) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : null }
const SCENARIO = arg('scenario')
const FILE = arg('file')
const JSON_OUT = argv.includes('--json')

const readJson = (file, fallback = null) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return fallback }
}

/** Every archived run, flattened: one row per arm per scenario per round. */
function collect() {
  const rows = []
  for (const round of listRounds()) {
    const roundDir = path.join(ARCHIVE, round)
    const info = readJson(path.join(roundDir, 'round.json'), {})
    const sessions = new Map((info.sessions ?? []).map((s) => [s.runName, s]))
    for (const scenario of fs.readdirSync(roundDir, { withFileTypes: true })) {
      if (!scenario.isDirectory()) continue
      if (SCENARIO && scenario.name !== SCENARIO) continue
      const scenarioDir = path.join(roundDir, scenario.name)
      for (const arm of fs.readdirSync(scenarioDir, { withFileTypes: true })) {
        if (!arm.isDirectory()) continue
        const dir = path.join(scenarioDir, arm.name)
        const meta = readJson(path.join(dir, 'meta.json'))
        if (!meta) continue
        const smoke = readJson(path.join(dir, 'smoke.json'))
        const reads = readJson(path.join(dir, 'reads.json'), {})
        const session = sessions.get(meta.runName) ?? {}
        const motion = /motion: (\d+) of (\d+)/.exec((smoke?.checks ?? []).join('\n'))
        const skillFiles = reads.skillFilesRead ?? {}
        rows.push({
          round,
          scenario: scenario.name,
          arm: arm.name,
          direction: meta.direction ?? info.direction ?? null,
          minutes: session.minutes ?? null,
          timedOut: session.timedOut ?? null,
          built: meta.site === true,
          smokeOk: smoke ? smoke.ok : null,
          blockers: smoke ? smoke.blockers.length : null,
          motionMoving: motion ? Number(motion[1]) : null,
          motionTotal: motion ? Number(motion[2]) : null,
          distinctReads: Object.keys(skillFiles).length,
          totalReads: Object.values(skillFiles).reduce((sum, n) => sum + n, 0),
          skillFiles,
          verdict: readJson(path.join(scenarioDir, 'verdict.json'))?.picks?.overall ?? null,
        })
      }
    }
  }
  return rows.sort((a, b) => b.round.localeCompare(a.round))
}

const rows = collect()
if (JSON_OUT) { console.log(JSON.stringify(rows, null, 2)); process.exit(0) }
if (!rows.length) { console.log('no archived runs match'); process.exit(0) }

const dash = (value) => (value === null || value === undefined ? '—' : String(value))
const pad = (value, width, right = false) => {
  const text = dash(value)
  return right ? text.padStart(width) : text.padEnd(width)
}

// ---------------------------------------------------------------- one file's read history
//
// The question this exists for: a routed file was edited, did builds start opening it?
if (FILE) {
  console.log(`\nreads of ${FILE}, newest round first\n`)
  console.log(`${pad('round', 14)}${pad('scenario', 20)}${pad('arm', 9)}${pad('opened', 8, true)}`)
  for (const row of rows.filter((r) => r.arm === 'with')) {
    const count = row.skillFiles[FILE] ?? 0
    console.log(`${pad(row.round, 14)}${pad(row.scenario, 20)}${pad(row.arm, 9)}${pad(count || 'no', 8, true)}`)
  }
  const withArms = rows.filter((r) => r.arm === 'with')
  const opened = withArms.filter((r) => (r.skillFiles[FILE] ?? 0) > 0).length
  console.log(`\nopened in ${opened} of ${withArms.length} skill-arm runs`)
  process.exit(0)
}

// ------------------------------------------------------------------------- the wide table

console.log(`\n${rows.length} archived run(s)\n`)
const header = `${pad('round', 14)}${pad('scenario', 20)}${pad('arm', 9)}${pad('min', 6, true)}  ${pad('built', 6)}${pad('blk', 4, true)}  ${pad('motion', 8, true)}  ${pad('files', 6, true)}${pad('reads', 6, true)}  ${pad('verdict', 8)}`
console.log(header)
console.log('-'.repeat(header.length))
for (const row of rows) {
  const motion = row.motionTotal === null ? '—' : `${row.motionMoving}/${row.motionTotal}`
  console.log(
    `${pad(row.round, 14)}${pad(row.scenario, 20)}${pad(row.arm, 9)}` +
    `${pad(row.minutes === null ? null : row.minutes.toFixed(0), 6, true)}  ` +
    `${pad(row.built ? 'yes' : 'NO', 6)}${pad(row.blockers, 4, true)}  ` +
    `${pad(motion, 8, true)}  ${pad(row.distinctReads || null, 6, true)}${pad(row.totalReads || null, 6, true)}  ` +
    `${pad(row.verdict, 8)}`,
  )
}

// ------------------------------------------------------------------------------- rollups

const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)
const arm = (name) => rows.filter((r) => r.arm === name)
const minutesOf = (name) => arm(name).map((r) => r.minutes).filter((n) => typeof n === 'number')

console.log('\nby arm')
for (const name of ['with', 'without']) {
  const runs = arm(name)
  if (!runs.length) continue
  const avg = mean(minutesOf(name))
  const failed = runs.filter((r) => !r.built).length
  const timedOut = runs.filter((r) => r.timedOut).length
  console.log(
    `  ${pad(name, 9)}${runs.length} run(s)   mean ${avg === null ? '—' : `${avg.toFixed(1)}m`}` +
    `   ${failed} produced no site   ${timedOut} hit the cap`,
  )
}
const withMean = mean(minutesOf('with'))
const withoutMean = mean(minutesOf('without'))
if (withMean && withoutMean) console.log(`  skill arm costs ${(withMean / withoutMean).toFixed(1)}x the control in wall time`)

// Which routed files actually get opened, over every skill-arm run there is. A file near
// the bottom is either never reaching its moment or being priced out by its length.
const opens = new Map()
for (const row of arm('with')) for (const file of Object.keys(row.skillFiles)) opens.set(file, (opens.get(file) ?? 0) + 1)
const withRuns = arm('with').length
if (opens.size) {
  console.log(`\nskill files opened, across ${withRuns} skill-arm run(s)`)
  for (const [file, count] of [...opens].sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.round((count / withRuns) * 24)).padEnd(24, '·')
    console.log(`  ${bar} ${pad(count, 3, true)}/${withRuns}  ${file}`)
  }
}
