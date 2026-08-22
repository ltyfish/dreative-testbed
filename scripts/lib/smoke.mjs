// Run Dreative's visual-smoke measurement against a finished run.
//
// This is deliberately a HARNESS step, not a line in the agent's brief. The brief is
// identical across arms on purpose (see scaffold.mjs buildPrompt), so telling the agent
// to run the gate would either confound the A/B — the "with" arm gets an instruction the
// control does not — or hand the control the Dreative CLI it is defined as not having.
// Measuring both arms afterwards, from the built artefact, keeps the control intact and
// keeps the agent from teaching to the test.
//
// The measurement is Dreative's own: it blocks only the zero case (no region changes
// state on approach; no interactive element responds to hover or focus) and exempts
// Efficient from the motion floor. It does not score motion breadth or taste.

import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// The CLI lives in the code project, not here. The testbed has no Dreative dependency and
// should not grow one — it consumes the shipped build the same way an installed user would.
const CLI_DIST = process.env.DREATIVE_DIST
  ? path.resolve(process.env.DREATIVE_DIST)
  : path.resolve('C:/Users/lty/Downloads/Dreative/dist/cli/visualSmoke.js')

/** Missing or stale build is a harness fault, not a finding about the run. */
export function smokeAvailable() {
  return fs.existsSync(CLI_DIST)
}

export function smokeUnavailableReason() {
  return `no Dreative build at ${CLI_DIST} — run \`npm run build\` in the code project, or set DREATIVE_DIST`
}

/**
 * @param url   a preview server already serving the built run
 * @param profile  the direction the round was run at; only "efficient" is exempt from the
 *                 motion floor, so passing the wrong one silently changes the verdict
 */
export async function measureSmoke(url, profile = 'recommended') {
  const { runVisualSmoke } = await import(pathToFileURL(CLI_DIST).href)
  return runVisualSmoke(url, { profile })
}

/**
 * Record the measurement next to the run. Written even when it blocks — a blocked run is
 * the finding, and deleting the evidence would make it unreviewable.
 */
export function writeSmoke(runDir, result) {
  fs.writeFileSync(path.join(runDir, 'smoke.json'), JSON.stringify(result, null, 2), 'utf8')
}

export function readSmoke(runDir) {
  const file = path.join(runDir, 'smoke.json')
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}
