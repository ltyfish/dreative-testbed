import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

export function inferAgent(meta = {}, logText = '') {
  if (meta.agent === 'codex' || meta.agent === 'claude') return meta.agent
  return /OpenAI Codex|\bcodex(?:\.exe)?\s+\(codex/i.test(logText) ? 'codex' : 'claude'
}

export function extractSessionId(agent, { meta = {}, logText = '', rawText = '' } = {}) {
  const text = `${rawText}\n${logText}`
  if (agent === 'codex') {
    for (const pattern of [
      new RegExp(`session id:\\s*(${UUID})`, 'i'),
      new RegExp(`"thread_id"\\s*:\\s*"(${UUID})"`, 'i'),
      new RegExp(`"session_id"\\s*:\\s*"(${UUID})"`, 'i'),
    ]) {
      const match = text.match(pattern)
      if (match) return match[1]
    }
    return meta.providerSessionId ?? null
  }

  if (meta.sessionId) return meta.sessionId
  for (const line of rawText.split('\n')) {
    if (!line.trim()) continue
    try {
      const value = JSON.parse(line)
      if (value.session_id) return value.session_id
    } catch {
      // A provider stream may contain non-JSON diagnostics between events.
    }
  }
  return null
}

function desktopCodexBins(env) {
  const root = env.LOCALAPPDATA ? path.join(env.LOCALAPPDATA, 'OpenAI', 'Codex', 'bin') : null
  if (!root) return []
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(root, entry.name, 'codex.exe'))
      .filter((candidate) => fs.existsSync(candidate))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
  } catch {
    return []
  }
}

export function resolveAgentBinary(
  agent,
  { env = process.env, home = os.homedir(), platform = process.platform } = {},
) {
  const preferred =
    agent === 'codex'
      ? [
          env.DREATIVE_CODEX_BIN,
          ...desktopCodexBins(env),
          path.join(home, '.codex', 'bin', 'codex.exe'),
          path.join(home, '.codex', '.sandbox-bin', 'codex.exe'),
        ]
      : [env.DREATIVE_CLAUDE_BIN, path.join(home, '.local', 'bin', 'claude.exe')]
  for (const candidate of preferred.filter(Boolean)) if (fs.existsSync(candidate)) return candidate

  const exts = platform === 'win32' ? String(env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean) : ['']
  for (const dir of String(env.PATH || '').split(path.delimiter).filter(Boolean)) {
    for (const ext of exts) {
      const candidate = path.join(dir.replace(/^"|"$/g, ''), agent + ext)
      if (fs.existsSync(candidate)) return candidate
    }
  }
  return null
}
