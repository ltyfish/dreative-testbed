import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DESIGN_PROTOCOL, readDirections, saveDesignSelection, selectedDesign, directionCards } from '../lib/design-directions.mjs'
import { continuationPrompt, CONTINUE_PHASE, prototypePhase, PROTOTYPE_PHASE } from '../lib/prototype.mjs'
import crypto from 'node:crypto'
import { scaffoldRun, RUNS } from '../lib/scaffold.mjs'
import { codexToolArgs, validateToolServers } from '../lib/tool-config.mjs'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dreative-directions-'))
  t.after(() => {
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep))
    fs.rmSync(root, { recursive: true, force: true })
  })
  fs.mkdirSync(path.join(root, 'design'))
  for (const id of ['a', 'b']) fs.writeFileSync(path.join(root, 'design', `${id}.png`), png)
  const data = { version: 1, directions: ['a','b'].map(id => ({ id, title: `Design ${id}`, images: [`design/${id}.png`], plan: `Plan ${id}` })) }
  fs.writeFileSync(path.join(root, 'design-directions.json'), JSON.stringify(data))
  fs.writeFileSync(path.join(root, 'run.json'), JSON.stringify({ phaseProtocol: DESIGN_PROTOCOL, phase: 1, sessionId: 'retained' }))
  return { root, data, write: () => fs.writeFileSync(path.join(root, 'design-directions.json'), JSON.stringify(data)) }
}

test('only explicit selection supplies the chosen images and user changes to continuation', t => {
  const {root} = fixture(t)
  assert.throws(() => continuationPrompt(root), /must be selected/)
  const study = readDirections(root)
  assert.throws(() => saveDesignSelection(root, {evidenceHash: study.evidenceHash}), /Select a displayed/)
  saveDesignSelection(root, {directionId:'b',feedback:'Keep the large image, use warmer type.',evidenceHash:study.evidenceHash})
  const prompt = continuationPrompt(root)
  assert.ok(prompt.includes('design/b.png'))
  assert.ok(!prompt.includes('design/a.png'))
  assert.ok(prompt.includes('Plan b'))
  assert.ok(prompt.includes('use warmer type'))
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'run.json'))).sessionId, 'retained')
  fs.appendFileSync(path.join(root, 'design', 'b.png'), Buffer.from([1]))
  assert.throws(() => selectedDesign(root), /changed/)
  assert.throws(() => saveDesignSelection(root, {directionId:'b',evidenceHash:study.evidenceHash}), /changed/)
})

test('missing images, fake image text, invalid ids and escaped paths cannot form a selectable study', t => {
  const {root,data,write} = fixture(t)
  data.directions[0].id = null; write()
  assert.throws(() => readDirections(root), /unique lowercase/)
  data.directions[0].id = 'a'; write()
  fs.writeFileSync(path.join(root, 'design', 'a.png'), 'generate an image of a page')
  assert.throws(() => readDirections(root), /recognizable image/)
  fs.writeFileSync(path.join(root, 'outside.png'), png)
  data.directions[0].images = ['design/../outside.png']; write()
  assert.throws(() => readDirections(root), /escapes/)
  data.directions[0].images = ['design/missing.png']; write()
  assert.throws(() => readDirections(root), /ENOENT/)
})

test('legacy sessions keep the original continuation path; UI escapes generated titles and plans', t => {
  const {root,data,write} = fixture(t)
  fs.writeFileSync(path.join(root, 'run.json'), '{}')
  assert.equal(continuationPrompt(root), CONTINUE_PHASE)
  data.directions[0].title = '<script>alert(1)</script>'
  data.directions[0].plan = '<img src=x onerror=alert(1)>'; write()
  const html = directionCards('run',readDirections(root))
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(!html.includes(' checked'))
})

test('both providers can receive the same stdio tool configuration without dropping its environment', () => {
  const servers = { images: {command:'image-server',args:['--mode','edit'],env:{TEST_KEY:'not-a-secret'}} }
  assert.equal(validateToolServers(servers), servers)
  const args = codexToolArgs(servers)
  assert.ok(args.includes('mcp_servers.images.command="image-server"'))
  assert.ok(args.includes('mcp_servers.images.env."TEST_KEY"="not-a-secret"'))
  assert.throws(() => validateToolServers({ images: {url:'https://example.invalid'} }), /stdio/)
})

test('supplied-assets arms receive identical imagery and browser-study instructions', t => {
  const runs = []
  t.after(() => {
    for (const run of runs) {
      assert.ok(path.resolve(run.runDir).startsWith(path.resolve(RUNS) + path.sep))
      fs.rmSync(run.runDir, { recursive: true, force: true })
    }
  })
  const seq = `test-supplied-${process.pid}-${Date.now()}`
  for (const arm of ['with-a', 'without']) runs.push(scaffoldRun({ scenario: 'clothing-motion-supplied', arm, seq }))
  const hashes = runs.map(run => {
    const meta = JSON.parse(fs.readFileSync(path.join(run.runDir, 'run.json'), 'utf8'))
    const manifestBytes = fs.readFileSync(path.join(run.runDir, 'public/assets/pack.json'))
    const pack = JSON.parse(manifestBytes)
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(run.runDir, 'public/assets/garments.png'))).digest('hex')
    assert.equal(pack.sha256, hash)
    assert.equal(meta.assetPack.manifestSha256, crypto.createHash('sha256').update(manifestBytes).digest('hex'))
    assert.equal(meta.designProduction, 'browser-supplied-v1')
    assert.equal(new Set(pack.cells.map(cell => cell.garmentId)).size, 9)
    assert.ok(run.prompt.includes('Use only this pack'))
    return hash
  })
  assert.equal(hashes[0], hashes[1])
  assert.equal(prototypePhase(runs[0].meta), prototypePhase(runs[1].meta))
  assert.ok(prototypePhase(runs[0].meta).includes('actual browser'))
  assert.equal(prototypePhase({}), PROTOTYPE_PHASE)
})

test('supplied-assets continuation preserves the constraint after selection', t => {
  const { root } = fixture(t)
  const metadataFile = path.join(root, 'run.json')
  const meta = JSON.parse(fs.readFileSync(metadataFile, 'utf8'))
  fs.writeFileSync(metadataFile, JSON.stringify({ ...meta, designProduction: 'browser-supplied-v1' }))
  saveDesignSelection(root, { directionId: 'a', feedback: '', evidenceHash: readDirections(root).evidenceHash })
  const prompt = continuationPrompt(root)
  assert.ok(prompt.includes('Keep using the supplied image pack only'))
  assert.ok(!prompt.includes('Source/generate usable separate assets'))
})
