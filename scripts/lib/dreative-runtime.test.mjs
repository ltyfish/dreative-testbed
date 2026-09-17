import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { resolveDreativeCliFile } from './dreative-runtime.mjs'

test('an explicit Dreative runtime file remains authoritative', () => {
  const file = path.resolve('fixtures', 'visualSmoke.js')
  assert.equal(resolveDreativeCliFile('visualSmoke.js', file), file)
})

test('a Dreative runtime directory resolves the requested CLI module', () => {
  const dir = path.resolve('fixtures', 'cli')
  assert.equal(resolveDreativeCliFile('visualSmoke.js', dir), path.join(dir, 'visualSmoke.js'))
})
