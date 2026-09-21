import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { resolveDreativeCliFile, resolveDreativeRepo } from './dreative-runtime.mjs'

test('an explicit Dreative runtime file remains authoritative', () => {
  const file = path.resolve('fixtures', 'visualSmoke.js')
  assert.equal(resolveDreativeCliFile('visualSmoke.js', file), file)
})

test('a Dreative runtime directory resolves the requested CLI module', () => {
  const dir = path.resolve('fixtures', 'cli')
  assert.equal(resolveDreativeCliFile('visualSmoke.js', dir), path.join(dir, 'visualSmoke.js'))
})

test('git comparisons locate the checkout behind the installed runtime and honor explicit overrides', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dreative-repo-'))
  try {
    const runtimeFile = path.join(root, 'dist', 'cli', 'index.js')
    fs.mkdirSync(path.dirname(runtimeFile), { recursive: true })
    fs.mkdirSync(path.join(root, 'skill', 'dreative'), { recursive: true })
    fs.writeFileSync(runtimeFile, '')
    fs.writeFileSync(path.join(root, 'skill', 'dreative', 'SKILL.md'), 'skill')
    assert.equal(resolveDreativeRepo('fallback', { env: {}, runtimeFile }), path.resolve('fallback'))
    // Worktrees have a .git file; regular checkouts have a directory. Both are valid.
    fs.writeFileSync(path.join(root, '.git'), 'gitdir: elsewhere')
    assert.equal(resolveDreativeRepo('fallback', { env: {}, runtimeFile }), root)
    assert.equal(resolveDreativeRepo('fallback', { env: { DREATIVE_REPO: 'explicit' }, runtimeFile }), path.resolve('explicit'))
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
