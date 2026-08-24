// Is a run actually judgeable?
//
// A session can end without producing a design — it hits the provider's usage limit, gets
// killed by the timeout, or crashes — and the pipeline will still build the untouched seed
// project, screenshot it, and hand it to the blind review as if it were a real attempt.
// That is worse than no data: it looks like a verdict. Every run is checked here and an
// unusable one is labelled instead of judged.

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, RUNS } from './scaffold.mjs'

const LIMIT_PATTERNS = [
  /you'?ve hit your (session|usage) limit/i,
  /(usage|rate) limit reached/i,
  /credit balance is too low/i,
  /quota exceeded/i,
  /overloaded_error/i,
]

const hash = (p) => (fs.existsSync(p) ? crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex') : null)

/**
 * The seed App.jsx is what every run starts from. If the run's copy still hashes to it,
 * the agent never wrote a line — whatever the exit code said.
 */
function untouchedSeed(runDir, scenario) {
  const seed = path.join(ROOT, 'scenarios', scenario, 'App.jsx')
  const mine = path.join(runDir, 'src', 'App.jsx')
  const a = hash(seed)
  return Boolean(a && a === hash(mine))
}

/** Last N KB of the transcript — enough to catch how the session ended. */
function logTail(runDir, bytes = 8000) {
  const p = path.join(runDir, 'agent.log')
  if (!fs.existsSync(p)) return ''
  const text = fs.readFileSync(p, 'utf8')
  return text.slice(-bytes)
}

export function runHealth(runName) {
  const runDir = path.join(RUNS, runName)
  const meta = (() => {
    try {
      return JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'))
    } catch {
      return null
    }
  })()
  if (!meta) return { ok: false, fatal: true, reasons: ['no run.json'] }

  const tail = logTail(runDir)
  const reasons = []
  const limitHit = LIMIT_PATTERNS.some((re) => re.test(tail))
  const untouched = untouchedSeed(runDir, meta.scenario)
  const buildFailed = fs.existsSync(path.join(runDir, 'build-error.log'))
  const warnings = (() => {
    const p = path.join(runDir, '.captures', 'warnings.txt')
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim() : ''
  })()

  if (untouched) reasons.push('the design is byte-identical to the seed — the agent never edited it')
  if (limitHit) reasons.push('the session ended on a provider usage limit, so the work may be cut off')
  if (buildFailed) reasons.push('the project failed to build')
  if (warnings) reasons.push(`capture warning: ${warnings.replace(/\n/g, '; ')}`)

  return {
    ok: !untouched && !limitHit && !buildFailed,
    fatal: untouched || buildFailed, // nothing to look at at all
    untouched,
    limitHit,
    buildFailed,
    warnings,
    reasons,
  }
}

/**
 * A pair is only judgeable when both sides are. One broken arm invalidates the comparison.
 * Keyed by arm name rather than by "with"/"without", because a Dreative-vs-Dreative round
 * has neither.
 */
export function pairHealth(runA, runB, armA = 'with', armB = 'without') {
  const a = runHealth(runA)
  const b = runHealth(runB)
  return {
    ok: a.ok && b.ok,
    judgeable: !a.fatal && !b.fatal,
    [armA]: a,
    [armB]: b,
  }
}
