import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { sourceEvidence, captureCorrespondence } from './source-evidence.mjs'

test('capture correspondence detects later source, media and build-input changes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dreative-evidence-'))
  try {
    fs.mkdirSync(path.join(root, 'src'))
    fs.mkdirSync(path.join(root, 'public'))
    fs.mkdirSync(path.join(root, '.captures'))
    fs.writeFileSync(path.join(root, 'src', 'App.jsx'), 'prototype')
    fs.writeFileSync(path.join(root, 'public', 'subject.png'), 'material')
    fs.writeFileSync(path.join(root, 'package.json'), '{"type":"module"}')
    const captured = sourceEvidence(root)
    assert.equal(captureCorrespondence(captured, sourceEvidence(root)), 'matching')
    // Evidence output, logs and secrets must not change the app-input hash.
    fs.writeFileSync(path.join(root, '.captures', 'frame.png'), 'screenshot')
    fs.writeFileSync(path.join(root, '.env'), 'private')
    fs.writeFileSync(path.join(root, 'agent.log'), 'log')
    assert.equal(sourceEvidence(root).inputHash, captured.inputHash)
    assert.ok(!Object.keys(captured.files).some((name) => name.includes('.env')))
    for (const file of ['src/App.jsx', 'public/subject.png', 'package.json']) {
      const before = sourceEvidence(root)
      fs.appendFileSync(path.join(root, file), 'changed')
      assert.equal(captureCorrespondence(before, sourceEvidence(root)), 'different-source')
    }
    const beforeRemove = sourceEvidence(root)
    fs.unlinkSync(path.join(root, 'public', 'subject.png'))
    assert.equal(captureCorrespondence(beforeRemove, sourceEvidence(root)), 'different-source')
    assert.equal(captureCorrespondence(null, captured), 'unknown')
    assert.equal(captureCorrespondence({ ...captured, sourceChangedDuringCapture: true }, captured), 'changed-during-capture')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
