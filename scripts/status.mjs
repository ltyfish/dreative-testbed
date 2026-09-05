#!/usr/bin/env node
// Is the round done?
//
//   node scripts/status.mjs            # one line per run
//   node scripts/status.mjs --watch    # …refreshed every 15s
//   node scripts/status.mjs --json
//
// Also shown live at the top of the review UI (node scripts/review.mjs).

import { formatStatus, readLaunch, runStatuses } from './lib/status.mjs'

const args = process.argv.slice(2)

if (args.includes('--json')) {
  console.log(JSON.stringify({ launch: readLaunch(), runs: runStatuses() }, null, 2))
} else if (args.includes('--watch')) {
  const draw = () => {
    process.stdout.write('\x1b[2J\x1b[H')
    console.log(new Date().toLocaleTimeString() + '\n')
    console.log(formatStatus())
    console.log('\nCtrl-C to stop.')
  }
  draw()
  setInterval(draw, 15_000)
} else {
  console.log(formatStatus())
}
