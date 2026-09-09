import assert from 'node:assert/strict'
import test from 'node:test'
import { usesTerminalGate } from '../lib/gate.mjs'

test('a normal terminal round asks at the terminal', () => {
  assert.equal(usesTerminalGate({ isTTY: true, uiLaunched: false }), true)
})

test('a UI-launched round publishes its gate even when Windows supplies a hidden TTY', () => {
  assert.equal(usesTerminalGate({ isTTY: true, uiLaunched: true }), false)
})

test('a headless round publishes its gate', () => {
  assert.equal(usesTerminalGate({ isTTY: false, uiLaunched: false }), false)
})
