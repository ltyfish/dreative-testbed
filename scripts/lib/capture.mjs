// Build a run and capture full-page desktop + mobile screenshots.

import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { RUNS } from './scaffold.mjs'

/** Kill a process and everything it spawned. */
export function killTree(pid) {
  if (!pid) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(pid), '/t', '/f'], { stdio: 'ignore' })
    return
  }
  try {
    process.kill(-pid, 'SIGKILL')
  } catch {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      /* already gone */
    }
  }
}

export const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

export async function captureRun(runName, port, log = console.log) {
  const runDir = path.join(RUNS, runName)
  if (!fs.existsSync(runDir)) throw new Error(`no such run: ${runName}`)

  log(`[${runName}] building…`)
  const build = spawnSync('npm', ['run', 'build'], { cwd: runDir, shell: true, encoding: 'utf8' })
  if (build.status !== 0) {
    const tail = (build.stderr || build.stdout || '').split('\n').slice(-20).join('\n')
    fs.writeFileSync(path.join(runDir, 'build-error.log'), tail, 'utf8')
    log(`[${runName}] BUILD FAILED — recorded as a finding`)
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

      // Settle entrance animations, then scroll so lazy and scroll-triggered content
      // actually renders before the full-page shot.
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
      log(`[${runName}] captured ${vp.name}`)
      await page.close()
    }

    await browser.close()
    return { runName, ok: true }
  } catch (err) {
    log(`[${runName}] capture failed: ${err.message}`)
    return { runName, ok: false, error: err.message }
  } finally {
    // Kill the whole tree first. `npm run preview` spawns vite as a child, so killing the
    // wrapper on its own orphans vite, which then holds the port and the run directory
    // open — enough to leak one server per run across a full round.
    killTree(server.pid)
  }
}

export async function captureMany(runNames, startPort = 4173, log = console.log) {
  const results = []
  let port = startPort
  for (const name of runNames) results.push(await captureRun(name, port++, log))
  return results
}
