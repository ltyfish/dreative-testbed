#!/usr/bin/env node
// Diff what the repeats of one round read.
//
//   node scripts/variance.mjs                 # the newest round
//   node scripts/variance.mjs 202608221530    # a specific round
//
// Pairs with `run-all.mjs --repeat N`. Every session in the round ran the SAME input, so
// anything that differs here is a property of the run and not of the skill. That matters
// because most of what this project has concluded from read counts rests on a single
// round: if the same input reads a different set of files each time, a single round's
// read count is not evidence.

import fs from 'node:fs'
import path from 'node:path'
import { RUNS } from './lib/scaffold.mjs'

const wanted = process.argv.slice(2).filter((a) => /^\d+$/.test(a))
const rounds = fs
  .readdirSync(RUNS)
  .filter((f) => /^round-\d+\.json$/.test(f))
  .sort()

const load = (id) => {
  const file = path.join(RUNS, `round-${id}.json`)
  if (!fs.existsSync(file)) {
    console.error(`no such round: ${id}`)
    process.exit(1)
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

const withSessions = (m) => (m.sessions ?? []).filter((s) => s.reads && s.runName.includes('__with__'))

// A round that has been archived and cleared is retired. Walking into one would compare
// this experiment against a superseded skill, which is exactly the mistake this script
// exists to catch. Name it explicitly on the command line if you really want it.
const clearedFile = path.join(RUNS, '.cleared-rounds.json')
const cleared = new Set(fs.existsSync(clearedFile) ? JSON.parse(fs.readFileSync(clearedFile, 'utf8')) : [])

// `--repeat 2` puts both runs in one round, but running `--repeat 1` twice makes two
// rounds of one run each -- the same experiment, split in half. Walk back through the
// live rounds until there are two comparable runs rather than reporting nothing.
let metas
if (wanted.length) {
  metas = wanted.map(load)
} else {
  metas = []
  for (const f of [...rounds].reverse()) {
    const m = JSON.parse(fs.readFileSync(path.join(RUNS, f), 'utf8'))
    if (cleared.has(String(m.round))) break
    metas.unshift(m)
    if (metas.reduce((n, x) => n + withSessions(x).length, 0) >= 2) break
  }
}
if (!metas.length) {
  console.error('no rounds in runs/ yet')
  process.exit(1)
}
const meta = metas[metas.length - 1]
const spansRounds = metas.length > 1

// Only the "with" arm is comparable: the control has no skill installed, so its read
// count is always zero and putting it in the table would fake a difference.
const sessions = metas.flatMap((m) => withSessions(m).map((s) => ({ ...s, round: m.round })))

if (sessions.length < 2) {
  console.error(`${metas.map((m) => m.round).join(', ')} — only ${sessions.length} "with" session(s), nothing to compare`)
  console.error('Run a variance round:  node scripts/run-all.mjs --scenarios <name> --arms with --repeat 2')
  process.exit(1)
}

// caliber-movement__with__<round>__r2 -> r2. When the comparison spans rounds the round
// is what differs between the columns, so that is what the column is named.
const short = (s) => {
  const tail = s.runName.split('__').filter((p) => p !== s.round).slice(2).join('__')
  if (spansRounds) return tail ? `${s.round}/${tail}` : String(s.round)
  return tail || s.runName.split('__')[1]
}
const files = [...new Set(sessions.flatMap((s) => Object.keys(s.reads.skillFilesRead)))].sort()
const col = Math.max(28, ...files.map((f) => f.length + 2))
const pad = (s, n) => String(s).padEnd(n)

const heading = spansRounds ? `Rounds ${metas.map((m) => m.round).join(' + ')}` : `Round ${meta.round}`
console.log(`\n${heading} · ${meta.direction ?? 'no direction'} · ${sessions.length} sessions`)
if (spansRounds) console.log('Separate rounds, same input — compared as one experiment.')
console.log()
console.log(pad('skill file', col) + sessions.map((s) => pad(short(s), 16)).join(''))
console.log('-'.repeat(col + sessions.length * 16))

for (const f of files) {
  const counts = sessions.map((s) => s.reads.skillFilesRead[f] ?? 0)
  const varies = new Set(counts).size > 1
  const zero = counts.some((c) => c === 0)
  const mark = zero && varies ? ' <- read by some runs, not others' : varies ? ' <- differs' : ''
  console.log(pad(f, col) + counts.map((c) => pad(c || '-', 16)).join('') + mark)
}

console.log('-'.repeat(col + sessions.length * 16))
console.log(pad('files opened', col) + sessions.map((s) => pad(Object.keys(s.reads.skillFilesRead).length, 16)).join(''))
console.log(pad('tool calls', col) + sessions.map((s) => pad(Object.values(s.reads.toolCalls).reduce((a, b) => a + b, 0), 16)).join(''))
console.log(pad('minutes', col) + sessions.map((s) => pad(s.minutes, 16)).join(''))

const opened = sessions.map((s) => Object.keys(s.reads.skillFilesRead))
const union = new Set(opened.flat())
const shared = [...union].filter((f) => opened.every((o) => o.includes(f)))
const unstable = union.size - shared.length

console.log(`\n${shared.length} of ${union.size} files were opened by every run; ${unstable} were not.`)
if (unstable === 0) console.log('Read selection looks stable — a single round’s read count is usable as evidence.')
else console.log('Read selection is NOT stable across identical inputs. Single-round read counts are noise;\nre-check any conclusion in DECISIONS.md that rests on one.')
console.log()
