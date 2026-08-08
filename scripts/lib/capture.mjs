// Build a run and capture full-page desktop + mobile screenshots.

import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { RUNS } from './scaffold.mjs'

/**
 * Reserve a port the OS says is actually free.
 *
 * Without this, a stale server on the requested port makes `vite preview` quietly pick a
 * different one while the browser still visits the original — so you screenshot whatever
 * else happened to be listening. That produced blank and wrong-project captures.
 */
export function freePort(preferred) {
  return new Promise((resolve) => {
    const probe = net.createServer()
    probe.once('error', () => resolve(freePort(0)))
    probe.listen(preferred, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => resolve(port))
    })
  })
}

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

  // strictPort makes a busy port fail loudly instead of drifting to another one.
  const chosen = await freePort(port)
  const server = spawn('npm', ['run', 'preview', '--', '--port', String(chosen), '--strictPort'], {
    cwd: runDir,
    shell: true,
    stdio: 'ignore',
  })

  const warnings = []
  try {
    const { chromium } = await import('playwright')
    const base = `http://127.0.0.1:${chosen}/`
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

      // A page that renders nothing visible is a finding, not a screenshot. Catch it here
      // rather than letting a white rectangle reach the review UI unexplained.
      const visible = await page.evaluate(() => {
        const text = document.body.innerText.trim().length
        const painted = [...document.body.querySelectorAll('*')].filter((el) => {
          const r = el.getBoundingClientRect()
          const s = getComputedStyle(el)
          return r.width > 4 && r.height > 4 && s.visibility !== 'hidden' && Number(s.opacity) > 0.05
        }).length
        return { text, painted }
      })
      if (visible.text < 40 || visible.painted < 5) {
        warnings.push(`${vp.name}: page rendered almost nothing (${visible.text} chars, ${visible.painted} painted elements)`)
      }

      await page.screenshot({ path: path.join(outDir, `${vp.name}.png`), fullPage: true })
      log(`[${runName}] captured ${vp.name}${visible.text < 40 ? ' — WARNING: looks blank' : ''}`)
      await page.close()
    }

    await browser.close()
    if (warnings.length) {
      fs.writeFileSync(path.join(runDir, '.captures', 'warnings.txt'), warnings.join('\n'), 'utf8')
    }
    return { runName, ok: true, warnings }
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
