#!/usr/bin/env node
// Scaffold ONE run manually and print its brief. For a full automated round use run-all.mjs.
//
//   node scripts/new-run.mjs --scenario coffee-roaster --arm with

import { listScenarios, scaffoldRun, skillInstalled } from './lib/scaffold.mjs'

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? process.argv[i + 1] : undefined
}

const scenario = arg('scenario')
const arm = arg('arm')
const label = arg('label')

if (!scenario || !listScenarios().includes(scenario)) {
  console.error('usage: node scripts/new-run.mjs --scenario <name> --arm with|without [--label note]')
  console.error(`scenarios: ${listScenarios().join(', ')}`)
  process.exit(1)
}
if (arm !== 'with' && arm !== 'without') {
  console.error('--arm must be "with" (Dreative) or "without" (control)')
  process.exit(1)
}
if (arm === 'with' && !skillInstalled()) {
  console.warn('WARNING: no .claude or .codex skill at the repo root, so this is not really a "with" run.')
  console.warn('Fix: npm i -g dreative@latest && dreative install-skill --codex\n')
}

const { runName, runDir, prompt } = scaffoldRun({ scenario, arm, label })

console.log(`\nrun ready:  runs/${runName}`)
console.log(`preview:    cd runs/${runName} && npm run dev`)
console.log(`\n--- paste this to the agent -------------------------------------\n`)
console.log(prompt)
console.log(`\n-----------------------------------------------------------------\n`)
