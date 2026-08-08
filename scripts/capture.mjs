#!/usr/bin/env node
// Build runs and capture full-page desktop + mobile screenshots.
//
//   node scripts/capture.mjs --run coffee-roaster__with__01
//   node scripts/capture.mjs --all
//
// run-all.mjs does this automatically; use this to recapture after a manual fix.

import fs from 'node:fs'
import path from 'node:path'
import { captureMany } from './lib/capture.mjs'
import { RUNS } from './lib/scaffold.mjs'

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? (process.argv[i + 1] ?? true) : undefined
}

const targets = arg('all')
  ? fs
      .readdirSync(RUNS)
      .filter((d) => fs.statSync(path.join(RUNS, d)).isDirectory() && fs.existsSync(path.join(RUNS, d, 'run.json')))
  : [arg('run')].filter(Boolean)

if (!targets.length) {
  console.error('usage: node scripts/capture.mjs --run <run-name> | --all')
  process.exit(1)
}

await captureMany(targets)
console.log('\ndone. next: node scripts/review.mjs')
