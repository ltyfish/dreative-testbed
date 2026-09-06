// Run the shipped `dreative look` against a finished run, from the harness.
//
// The agent has its own browser and the skill routes it to the inspection loop, so whether
// it looks at its own work is a finding worth measuring — and on 202609051134 the answer was
// that it looked hard (14 screenshots, 25 page evaluations) but never ran `dreative look`.
// That is a legitimate choice. It also meant the prototype gate had no report to show,
// because the gate reads what the run left behind.
//
// So this is measured here for the same reason visual smoke is: the harness needs the numbers
// whether or not the builder wanted them, and measuring from the built artefact afterwards
// cannot teach anything to the test. Nothing about it reaches the brief.
//
// The run's own report is never overwritten. If the builder ran `dreative look` itself, that
// is the more interesting artefact — it means the findings were in front of it while it could
// still act on them — so this writes to a separate directory and the gate prefers the run's.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const CLI = process.env.DREATIVE_CLI
  ? path.resolve(process.env.DREATIVE_CLI)
  : path.resolve('C:/Users/lty/Downloads/Dreative/dist/cli/index.js')

export function lookAvailable() {
  return fs.existsSync(CLI)
}

/** Where the builder's own report lands, if it ran the command itself. */
export function builderLook(runDir) {
  return readReport(path.join(runDir, '.dreative', 'look'))
}

/** Where the harness writes its own pass. */
export function harnessLook(runDir) {
  return readReport(path.join(runDir, '.harness-look'))
}

/** The report to show a reviewer: the builder's if it exists, otherwise ours. */
export function bestLook(runDir) {
  const own = builderLook(runDir)
  if (own) return { ...own, byBuilder: true }
  const ours = harnessLook(runDir)
  return ours ? { ...ours, byBuilder: false } : null
}

function readReport(dir) {
  const file = path.join(dir, 'report.json')
  if (!fs.existsSync(file)) return null
  try {
    return { ...JSON.parse(fs.readFileSync(file, 'utf8')), dir }
  } catch {
    return null
  }
}

/**
 * @param url     a preview server already serving the built run
 * @param runDir  the run to write the report beside
 */
export function measureLook(url, runDir) {
  const out = path.join(runDir, '.harness-look')
  const result = spawnSync(process.execPath, [CLI, 'look', '--url', url, '--out', out], {
    cwd: runDir,
    encoding: 'utf8',
    timeout: 10 * 60_000,
    windowsHide: true,
  })
  if (result.status !== 0 && !fs.existsSync(path.join(out, 'report.json'))) {
    throw new Error((result.stderr || result.stdout || 'dreative look failed').split('\n').slice(-6).join(' '))
  }
  return harnessLook(runDir)
}
