import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** Follow an npm-linked checkout for git:HEAD comparisons; never guess a machine-specific path. */
export function resolveDreativeRepo(fallback, { env = process.env, runtimeFile = resolveDreativeCliFile('index.js') } = {}) {
  if (env.DREATIVE_REPO) return path.resolve(env.DREATIVE_REPO)
  if (runtimeFile && fs.existsSync(runtimeFile)) {
    const root = path.resolve(path.dirname(fs.realpathSync(runtimeFile)), '..', '..')
    if (fs.existsSync(path.join(root, '.git')) && fs.existsSync(path.join(root, 'skill', 'dreative', 'SKILL.md'))) return root
  }
  return path.resolve(fallback)
}

/** Resolve an installed Dreative CLI module without baking one developer's checkout into the harness. */
export function resolveDreativeCliFile(file, override = null) {
  if (override) {
    const resolved = path.resolve(override)
    return path.extname(resolved) ? resolved : path.join(resolved, file)
  }
  const candidates = [
    process.env.APPDATA && path.join(process.env.APPDATA, 'npm', 'node_modules', 'dreative', 'dist', 'cli', file),
    path.join(os.homedir(), '.npm-global', 'lib', 'node_modules', 'dreative', 'dist', 'cli', file),
    path.join('/usr/local/lib/node_modules/dreative/dist/cli', file),
    path.join('/usr/lib/node_modules/dreative/dist/cli', file),
  ].filter(Boolean)
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0]
}
