// The permanent record of a round.
//
// `runs/` is disposable and gitignored: it holds node_modules junctions, absolute paths
// and half-built state, none of which survives a push/pull to another machine. The archive
// is the opposite — committed, self-contained, and dependency-free. Every archived design
// is a plain static site built with a relative base, so `scripts/archive.mjs` can serve it
// on any laptop that has nothing installed but Node.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, RUNS, readScenario } from './scaffold.mjs'

export const ARCHIVE = path.join(ROOT, 'archive')

const AGENT_LOG_TAIL = 3000 // lines; full transcripts run to megabytes and add nothing after the tail

export const readJson = (p, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}

const writeJson = (p, value) => {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(value, null, 2), 'utf8')
}

/**
 * Build the run one more time with a relative base so the output opens from any directory
 * and any URL prefix. The normal `dist/` is built with base `/`, which 404s the moment it
 * is served from a subpath — which is exactly how the archive viewer serves it.
 */
function buildPortableSite(runDir, destDir) {
  const staging = path.join(runDir, '.archive-dist')
  fs.rmSync(staging, { recursive: true, force: true })
  const build = spawnSync(
    'npx',
    ['vite', 'build', '--base', './', '--outDir', '.archive-dist', '--emptyOutDir'],
    { cwd: runDir, shell: true, encoding: 'utf8' },
  )
  if (build.status !== 0 || !fs.existsSync(path.join(staging, 'index.html'))) {
    return { ok: false, error: (build.stderr || build.stdout || 'build failed').split('\n').slice(-20).join('\n') }
  }
  fs.rmSync(destDir, { recursive: true, force: true })
  fs.cpSync(staging, destDir, { recursive: true })
  fs.rmSync(staging, { recursive: true, force: true })
  return { ok: true }
}

/** Copy one run — sources, screenshots, transcript, and a portable build — into the archive. */
export function archiveRun(runName, roundDir, log = console.log) {
  const runDir = path.join(RUNS, runName)
  const meta = readJson(path.join(runDir, 'run.json'))
  if (!meta) return { runName, ok: false, error: 'no run.json' }

  const dest = path.join(roundDir, meta.scenario, meta.arm)
  fs.mkdirSync(dest, { recursive: true })

  // Sources: what the agent actually produced, readable without building anything.
  const src = path.join(runDir, 'src')
  if (fs.existsSync(src)) fs.cpSync(src, path.join(dest, 'src'), { recursive: true })
  for (const file of ['index.html', 'BRIEF.md', 'run.json', 'build-error.log']) {
    const from = path.join(runDir, file)
    if (fs.existsSync(from)) fs.cpSync(from, path.join(dest, file))
  }
  if (fs.existsSync(path.join(runDir, 'public'))) {
    fs.cpSync(path.join(runDir, 'public'), path.join(dest, 'public'), { recursive: true })
  }

  const shots = path.join(runDir, '.captures')
  if (fs.existsSync(shots)) fs.cpSync(shots, path.join(dest, 'shots'), { recursive: true })

  const agentLog = path.join(runDir, 'agent.log')
  if (fs.existsSync(agentLog)) {
    const lines = fs.readFileSync(agentLog, 'utf8').split('\n')
    const tail = lines.length > AGENT_LOG_TAIL ? [`… ${lines.length - AGENT_LOG_TAIL} earlier lines trimmed …`, ...lines.slice(-AGENT_LOG_TAIL)] : lines
    fs.writeFileSync(path.join(dest, 'agent.log'), tail.join('\n'), 'utf8')
  }

  let site = { ok: false, error: 'not built' }
  if (fs.existsSync(path.join(runDir, 'node_modules'))) {
    log(`[archive] ${runName}: building portable site…`)
    site = buildPortableSite(runDir, path.join(dest, 'site'))
    if (!site.ok) fs.writeFileSync(path.join(dest, 'site-build-error.log'), site.error, 'utf8')
  }

  writeJson(path.join(dest, 'meta.json'), { ...meta, runName, site: site.ok, archivedAt: new Date().toISOString() })
  return { runName, ok: true, site: site.ok }
}

/**
 * Archive a whole round. Safe to call twice: it overwrites the same round directory.
 * `runNames` may include runs that failed to build — a failure is a result worth keeping.
 */
export function archiveRound({ round, runNames, meta = {}, log = console.log }) {
  const roundDir = path.join(ARCHIVE, round)
  fs.mkdirSync(roundDir, { recursive: true })

  const archived = runNames.map((name) => archiveRun(name, roundDir, log))

  const scenarios = [...new Set(archived.filter((a) => a.ok).map((a) => readJson(path.join(RUNS, a.runName, 'run.json'))?.scenario).filter(Boolean))]
  for (const scenario of scenarios) {
    try {
      const info = readScenario(scenario)
      writeJson(path.join(roundDir, scenario, 'scenario.json'), info)
    } catch {
      /* scenario may have been renamed since */
    }
    syncVerdict(scenario, roundDir)
  }

  writeJson(path.join(roundDir, 'round.json'), {
    round,
    archivedAt: new Date().toISOString(),
    scenarios,
    ...meta,
    runs: archived,
  })

  return { roundDir, archived }
}

/** Copy the current verdict for a scenario into a round, if one has been given. */
export function syncVerdict(scenario, roundDir) {
  const from = path.join(RUNS, 'verdicts', `${scenario}.json`)
  if (!fs.existsSync(from)) return false
  const dest = path.join(roundDir, scenario)
  if (!fs.existsSync(dest)) return false
  fs.cpSync(from, path.join(dest, 'verdict.json'))
  return true
}

/** The round a given run directory belongs to, by matching the archived runName. */
export function findRoundForRun(runName) {
  for (const round of listRounds()) {
    const info = readJson(path.join(ARCHIVE, round, 'round.json'))
    if (info?.runs?.some((r) => r.runName === runName)) return path.join(ARCHIVE, round)
  }
  return null
}

export function listRounds() {
  if (!fs.existsSync(ARCHIVE)) return []
  return fs
    .readdirSync(ARCHIVE)
    .filter((d) => fs.existsSync(path.join(ARCHIVE, d, 'round.json')))
    .sort()
    .reverse()
}
