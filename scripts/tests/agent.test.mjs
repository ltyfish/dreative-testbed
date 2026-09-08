import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { extractSessionId, inferAgent, resolveAgentBinary } from '../lib/agent.mjs'

test('Codex session ids come from provider output instead of a Claude placeholder', () => {
  const actual = '01a080b6-975c-72a0-854a-83f4d9102dd3'
  const meta = { sessionId: 'ca2676f0-c68d-4b5a-8cc2-aba00467c7db' }
  assert.equal(extractSessionId('codex', { meta, logText: `session id: ${actual}` }), actual)
  assert.equal(inferAgent(meta, 'OpenAI Codex v0.153.4'), 'codex')
})

test('Claude keeps its caller-assigned resumable session id', () => {
  const sessionId = 'ca2676f0-c68d-4b5a-8cc2-aba00467c7db'
  assert.equal(extractSessionId('claude', { meta: { sessionId } }), sessionId)
})

test('the current Codex Desktop binary wins over an obsolete PATH copy', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dreative-agent-test-'))
  try {
    const app = path.join(root, 'local', 'OpenAI', 'Codex', 'bin', 'current')
    const stale = path.join(root, 'path')
    fs.mkdirSync(app, { recursive: true })
    fs.mkdirSync(stale, { recursive: true })
    fs.writeFileSync(path.join(app, 'codex.exe'), '')
    fs.writeFileSync(path.join(stale, 'codex.EXE'), '')
    const found = resolveAgentBinary('codex', {
      env: { LOCALAPPDATA: path.join(root, 'local'), PATH: stale, PATHEXT: '.EXE' },
      home: path.join(root, 'home'),
      platform: 'win32',
    })
    assert.equal(found, path.join(app, 'codex.exe'))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
