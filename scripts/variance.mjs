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

const wanted = process.argv[2]
const rounds = fs
  .readdirSync(RUNS)
  .filter((f) => /^round-\d+\.json$/.test(f))
  .sort()
const file = wanted ? `round-${wanted}.json` : rounds.at(-1)

if (!file || !fs.existsSync(path.join(RUNS, file))) {
  console.error(wanted ? `no such round: ${wanted}` : 'no rounds in runs/ yet')
  process.exit(1)
}

const meta = JSON.parse(fs.readFileSync(path.join(RUNS, file), 'utf8'))
// Only the "with" arm is comparable: the control has no skill installed, so its read
// count is always zero and putting it in the table would fake a difference.
const sessions = meta.sessions.filter((s) => s.reads && s.runName.includes('__with__'))

if (sessions.length < 2) {
  console.error(`round ${meta.round} has ${sessions.length} "with" session(s) to compare — nothing to compare`)
  console.error('Run a variance round:  node scripts/run-all.mjs --scenarios <name> --arms with --repeat 2')
  process.exit(1)
}

// caliber-movement__with__202608221530__r2  ->  r2
const short = (name) => name.split('__').filter((p) => p !== meta.round).slice(2).join('__') || name.split('__')[1]
const files = [...new Set(sessions.flatMap((s) => Object.keys(s.reads.skillFilesRead)))].sort()
const col = Math.max(28, ...files.map((f) => f.length + 2))
const pad = (s, n) => String(s).padEnd(n)

console.log(`\nRound ${meta.round} · ${meta.direction ?? 'no direction'} · ${sessions.length} sessions\n`)
console.log(pad('skill file', col) + sessions.map((s) => pad(short(s.runName), 16)).join(''))
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
