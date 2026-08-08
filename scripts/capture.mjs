#!/usr/bin/env node
// Build a run and capture full-page desktop + mobile screenshots.
//
//   node scripts/capture.mjs --run coffee-roaster__with__01
//   node scripts/capture.mjs --all
//
// Screenshots land in <run>/.captures/ and are what compare.mjs shows you.

import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const RUNS = path.join(ROOT, 'runs')

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? (process.argv[i + 1] ?? true) : undefined
}

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

async function captureRun(runName, port) {
  const runDir = path.join(RUNS, runName)
  if (!fs.existsSync(runDir)) throw new Error(`no such run: ${runName}`)

  console.log(`\n[${runName}] building…`)
  const build = spawnSync('npm', ['run', 'build'], { cwd: runDir, shell: true, encoding: 'utf8' })
  if (build.status !== 0) {
    console.error(`[${runName}] BUILD FAILED — this is itself a finding`)
    console.error((build.stderr || build.stdout || '').split('\n').slice(-20).join('\n'))
    return { runName, ok: false, error: 'build failed' }
  }

  const server = spawn('npm', ['run', 'preview', '--', '--port', String(port)], {
    cwd: runDir,
    shell: true,
    stdio: 'ignore',
  })

  try {
    const { chromium } = await import('playwright')
    const base = `http://127.0.0.1:${port}/`

    const browser = await chromium.launch()
    const outDir = path.join(runDir, '.captures')
    fs.rmSync(outDir, { recursive: true, force: true })
    fs.mkdirSync(outDir, { recursive: true })

    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
      let loaded = false
      for (let attempt = 0; attempt < 30 && !loaded; attempt++) {
        try {
          await page.goto(base, { waitUntil: 'load', timeout: 2000 })
          loaded = true
        } catch {
          await page.waitForTimeout(500)
        }
      }
      if (!loaded) throw new Error('preview server never came up')

      // Let entrance animations settle, and scroll the page so lazy/scroll-triggered
      // content actually renders before the full-page shot.
      await page.waitForTimeout(1200)
      await page.evaluate(async () => {
        const step = window.innerHeight
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 150))
        }
        window.scrollTo(0, 0)
      })
      await page.waitForTimeout(800)

      await page.screenshot({ path: path.join(outDir, `${vp.name}.png`), fullPage: true })
      console.log(`[${runName}] captured ${vp.name}`)
      await page.close()
    }

    await browser.close()
    return { runName, ok: true }
  } catch (err) {
    console.error(`[${runName}] capture failed: ${err.message}`)
    return { runName, ok: false, error: err.message }
  } finally {
    server.kill()
    // vite preview spawns a child; make sure the port is actually released.
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(server.pid), '/t', '/f'], { stdio: 'ignore' })
    }
  }
}

const targets = arg('all')
  ? fs.readdirSync(RUNS).filter((d) => fs.statSync(path.join(RUNS, d)).isDirectory())
  : [arg('run')].filter(Boolean)

if (!targets.length) {
  console.error('usage: node scripts/capture.mjs --run <run-name> | --all')
  process.exit(1)
}

let port = 4173
for (const t of targets) {
  await captureRun(t, port++)
}
console.log('\ndone. next: node scripts/compare.mjs --scenario <name>')
