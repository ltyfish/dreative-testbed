import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { freePort, killTree } from '../lib/capture.mjs'

test('the browser gate requires a viewable choice, preserves feedback, and pauses without approval', { timeout: 90000 }, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dreative-design-gate-'))
  let child, browser
  let gatePending
  try {
    fs.cpSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), path.join(root, 'scripts'), {recursive:true})
    fs.mkdirSync(path.join(root,'scenarios','demo'),{recursive:true})
    fs.writeFileSync(path.join(root,'scenarios','demo','scenario.json'),JSON.stringify({product:'Gate test',preserve:[]}))
    const name = 'demo__with-a__design-test'
    const run = path.join(root,'runs',name)
    fs.mkdirSync(path.join(run,'design'),{recursive:true})
    fs.writeFileSync(path.join(run,'run.json'),JSON.stringify({scenario:'demo',arm:'with-a',seq:'test',phase:1,phaseProtocol:'visual-directions-v1',designPhaseEndedAt:new Date().toISOString(),sessionId:'test-session'}))
    browser = await chromium.launch({headless:true})
    const page = await browser.newPage({viewport:{width:1440,height:900}})
    const data = {version:1,directions:[]}
    for (const [id,title,bg,accent] of [['a','Editorial study','#ede8de','#a84b2d'],['b','Graphic study','#152f31','#d4fa80']]) {
      await page.setViewportSize({width:600,height:820})
      // Deliberate UI test artwork, not AI output or evidence of creative quality.
      await page.setContent(`<body style="margin:0;background:${bg};color:${accent};font:18px Georgia;padding:36px"><p>UI TEST ARTWORK · ${id.toUpperCase()}</p><h1 style="font-size:76px;line-height:.95">${title}</h1><div style="height:210px;border:2px solid currentColor;display:grid;place-items:center">Subject area</div><h2>A useful working middle</h2><p>Content and interaction remain part of the design.</p><hr><p>A considered ending</p></body>`)
      await page.screenshot({path:path.join(run,'design',`${id}.png`)})
      data.directions.push({id,title,images:[`design/${id}.png`],plan:`${title}\nStructure: opening, working middle, ending.\nAssets: preserve supplied subject.\nMobile: deliberate reflow.\nMotion: only where useful.\nRisk: verify actual content fit.`})
    }
    fs.writeFileSync(path.join(run,'design-directions.json'),JSON.stringify(data))
    const gate = await import(pathToFileURL(path.join(root,'scripts/lib/gate.mjs')))
    const protocol = await import(pathToFileURL(path.join(root,'scripts/lib/prototype.mjs')))
    const begin = () => gate.gateOne(name,{stage:'design',heading:'Design prototype · choose before implementation',question:'Which visual direction should become the website?',labels:{keep:'Build selected direction',reject:'Stop this run'},log:()=>{},waitLimitMs:60000})
    gatePending = begin()
    const port = await freePort(0)
    child = spawn(process.execPath,[path.join(root,'scripts/review.mjs'),'--port',String(port),'--no-archive'],{cwd:root,windowsHide:true,stdio:'ignore'})
    const base = `http://127.0.0.1:${port}`
    for (let i=0;i<100;i++) { try { if((await fetch(base+'/status')).ok) break } catch {} await new Promise(r=>setTimeout(r,50)) }
    const errors=[];page.on('pageerror',e=>errors.push(e.message))
    await page.setViewportSize({width:1440,height:900})
    await page.goto(base+'/status')
    await page.locator('[data-design-image]').first().waitFor()
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-design-image]')].every(i=>i.complete&&i.naturalWidth>0))
    assert.equal(await page.locator('[data-design-image]').count(),2)
    assert.equal(await page.locator('#gateKeep').isDisabled(),true)
    const unanswered = await fetch(base+'/api/gate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({run:name,decision:'keep',evidenceHash:gate.pendingGate().study.evidenceHash})})
    assert.equal(unanswered.status,400)
    assert.equal(JSON.parse(fs.readFileSync(path.join(run,'run.json'))).designSelection,undefined)
    const output = process.env.DREATIVE_GATE_ARTIFACTS
    if(output) { fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'desktop.png'),fullPage:true}) }
    await page.setViewportSize({width:390,height:844})
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'gate must fit mobile')
    if(output) await page.screenshot({path:path.join(output,'mobile.png'),fullPage:true})
    await page.locator('input[value="b"][name="designDirection"]').check()
    assert.equal(await page.locator('#gateKeep').isEnabled(),true)
    await page.locator('#designFeedback').fill('Keep B, use the image scale from A.')
    await page.locator('#gateKeep').click()
    assert.equal(await gatePending,true);gatePending=null
    const prompt=protocol.continuationPrompt(run)
    assert.ok(prompt.includes('design/b.png'))
    assert.ok(prompt.includes('Keep B, use the image scale from A.'))
    gatePending=begin();await page.goto(base+'/status')
    await page.locator('#gatePause').click()
    assert.equal(await gatePending,null);gatePending=null
    assert.equal(protocol.continuationPrompt(run),prompt,'pause must preserve the prior choice')
    const timed=await gate.gateOne(name,{stage:'design',waitLimitMs:10,log:()=>{}})
    assert.equal(timed,null,'timeout is not approval')
    assert.deepEqual(errors,[])
    if(output) fs.writeFileSync(path.join(output,'fixture.json'),JSON.stringify({root,runName:name}))
  } finally {
    if (gatePending) {
      const file=path.join(root,'runs','.gate.json')
      if(fs.existsSync(file)) {const state=JSON.parse(fs.readFileSync(file));fs.writeFileSync(file,JSON.stringify({...state,answer:'pause'}))}
      await gatePending
    }
    await browser?.close()
    if(child) killTree(child.pid)
    if(!process.env.DREATIVE_GATE_ARTIFACTS) {
      assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep))
      fs.rmSync(root,{recursive:true,force:true,maxRetries:10,retryDelay:100})
    }
  }
})
