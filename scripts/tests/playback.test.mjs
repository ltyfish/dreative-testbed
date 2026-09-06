import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { freePort, killTree } from '../lib/capture.mjs'

test('blind review exposes playback without putting arm names in media URLs', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dreative-review-test-'))
  assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep))
  let child
  try {
    fs.cpSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), path.join(root, 'scripts'), { recursive: true })
    fs.mkdirSync(path.join(root, 'scenarios', 'demo'), { recursive: true })
    fs.writeFileSync(path.join(root, 'scenarios', 'demo', 'scenario.json'), JSON.stringify({ product: 'Demo', preserve: [] }))
    for (const arm of ['with-a', 'with-b']) {
      const run = path.join(root, 'runs', `demo__${arm}__test`)
      fs.mkdirSync(path.join(run, '.captures'), { recursive: true })
      fs.writeFileSync(path.join(run, 'run.json'), JSON.stringify({ scenario: 'demo', arm, seq: 'test', builtAt: '2026-09-06' }))
      fs.writeFileSync(path.join(run, '.captures', 'desktop.png'), 'image fixture')
      fs.writeFileSync(path.join(run, '.captures', 'desktop-motion.webm'), 'video fixture')
    }
    const port = await freePort(0)
    child = spawn(process.execPath, [path.join(root, 'scripts', 'review.mjs'), '--port', String(port)], {
      cwd: root, windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'],
    })
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('review did not start')), 15_000)
      child.once('error', reject)
      child.stdout.on('data', data => { if (String(data).includes('Blind review ready')) { clearTimeout(timer); resolve() } })
    })
    const base = `http://127.0.0.1:${port}`
    const html = await (await fetch(base + '/?s=demo')).text()
    assert.match(html, /<video controls/)
    assert.match(html, /\/blindshot\/demo\/A\/desktop-motion.webm/)
    assert.doesNotMatch(html, /src="\/shot\/demo__with-[ab]/)
    const media = await fetch(base + '/blindshot/demo/A/desktop-motion.webm')
    assert.equal(media.headers.get('content-type'), 'video/webm')
    assert.equal(await media.text(), 'video fixture')
    assert.equal((await fetch(base + '/shot/demo__with-a__test/secret.json')).status, 404)
  } finally {
    if (child) killTree(child.pid)
    fs.rmSync(root, { recursive: true, force: true })
  }
})
