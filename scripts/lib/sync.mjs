// Keep archive/ and VERDICTS.md the same on every machine that runs the testbed.
//
// runs/ is gitignored, so a round used to exist only on the machine that built it until
// someone pressed Reset there and committed by hand. On 2026-10-01 a finished build never
// left the PC that made it: the other machine pulled, saw an older round, and had no way to
// reach the new one. So every point that changes the record — a finished round, a verdict,
// a reset — commits exactly what it wrote and pushes, and every entry point pulls first.
//
// Nothing here may break a round or a review: git failing is a warning, never a throw.
// `--no-sync` (or DREATIVE_NO_SYNC=1) turns all of it off for a machine that should not push.

import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { ROOT } from './scaffold.mjs'

export const SYNC_OFF = process.argv.includes('--no-sync') || process.env.DREATIVE_NO_SYNC === '1'

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function errText(err) {
  return (err.stderr?.toString() || err.message || String(err)).trim().split('\n').slice(-3).join(' ')
}

/**
 * Fast-forward to the remote before showing or adding anything. Never merges or rebases:
 * if this machine has diverged, it says so loudly and leaves the tree alone.
 */
export function pullRecord(log = console.log) {
  if (SYNC_OFF) return false
  try {
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
    git(['fetch', '--quiet', 'origin', branch])
    const [behind, ahead] = git(['rev-list', '--left-right', '--count', `origin/${branch}...HEAD`]).split(/\s+/).map(Number)
    if (behind && !ahead) {
      git(['merge', '--ff-only', '--quiet', `origin/${branch}`])
      log(`[sync] pulled ${behind} commit(s) from origin/${branch}`)
    } else if (behind && ahead) {
      log(`[sync] WARNING: this machine and origin/${branch} have diverged (${ahead} local, ${behind} remote). Rounds from the other machine are NOT shown until you reconcile: git pull --rebase`)
    } else if (ahead) {
      pushRecord(log)
    }
    return true
  } catch (err) {
    log(`[sync] WARNING: could not pull (${errText(err)}). What you see may be behind other machines.`)
    return false
  }
}

/** Push whatever is committed and not on the remote yet. */
export function pushRecord(log = console.log) {
  if (SYNC_OFF) return false
  try {
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
    git(['push', '--quiet', 'origin', branch])
    log(`[sync] pushed to origin/${branch}`)
    return true
  } catch (err) {
    log(`[sync] WARNING: push failed (${errText(err)}). This round is committed locally only — run: git pull --rebase && git push`)
    return false
  }
}

/**
 * Commit only the given paths (relative to the repo or absolute) and push. Other changes in
 * the working tree are left untouched, so a half-edited script never rides along.
 */
export function commitRecord(paths, message, log = console.log) {
  if (SYNC_OFF) {
    log(`[sync] off — commit ${paths.map((p) => path.relative(ROOT, path.resolve(ROOT, p))).join(', ')} yourself to keep it`)
    return false
  }
  const rel = [...new Set(paths.map((p) => path.relative(ROOT, path.resolve(ROOT, p)).replaceAll('\\', '/')))]
  try {
    git(['add', '--', ...rel])
    const staged = git(['diff', '--cached', '--name-only', '--', ...rel])
    if (staged) git(['commit', '--quiet', '-m', message, '--', ...rel])
  } catch (err) {
    log(`[sync] WARNING: could not commit ${rel.join(', ')} (${errText(err)})`)
    return false
  }
  // Pull before push so a round from the other machine does not make this one bounce.
  try {
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
    git(['pull', '--rebase', '--autostash', '--quiet', 'origin', branch])
  } catch (err) {
    try { git(['rebase', '--abort']) } catch {}
    log(`[sync] WARNING: could not rebase onto the remote (${errText(err)})`)
  }
  return pushRecord(log)
}
