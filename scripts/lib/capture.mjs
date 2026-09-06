// Build a run and capture full-page desktop + mobile screenshots.

import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { RUNS } from './scaffold.mjs'
import { measureSmoke, smokeAvailable, smokeUnavailableReason, writeSmoke } from './smoke.mjs'
import { builderLook, lookAvailable, measureLook } from './look.mjs'
import { capturePlayback } from './motion.mjs'

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
    spawnSync('taskkill', ['/pid', String(pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true })
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

/**
 * How to run an npm script without a shell.
 *
 * `spawn('npm', …, { shell: true })` goes through cmd.exe on Windows, which flashes a console
 * window on every build and preview — a round of three runs is a stream of them across the
 * screen — and puts a wrapper between us and the process we later need to kill. Calling npm's
 * own entry script under this node keeps it to one process, no console, and a real pid.
 */
const NPM_CLI = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
export function npmCommand(args) {
  return fs.existsSync(NPM_CLI)
    ? { command: process.execPath, args: [NPM_CLI, ...args], shell: false }
    : { command: 'npm', args, shell: true }
}

/**
 * Start a preview server for a run and return a process we can actually kill.
 *
 * `npm run preview` puts two wrappers between us and vite, and on Windows the npm shim
 * frequently exits as soon as it has spawned its child — so the pid we hold is already dead
 * by the time we kill the tree, and vite survives with its cwd inside the run directory.
 * That is a permanently undeletable folder and a held port per run. Spawning vite's entry
 * script directly means the pid we hold is the process we mean.
 */
export function spawnPreview(runDir, port) {
  const vite = path.join(runDir, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!fs.existsSync(vite)) {
    // No local install to point at — fall back, and accept the wrapper.
    const npm = npmCommand(['run', 'preview', '--', '--port', String(port), '--strictPort'])
    return spawn(npm.command, npm.args, { cwd: runDir, shell: npm.shell, stdio: 'ignore', windowsHide: true })
  }
  return spawn(process.execPath, [vite, 'preview', '--port', String(port), '--strictPort'], { cwd: runDir, stdio: 'ignore', windowsHide: true })
}

/**
 * Kill any process still running out of a run directory. Rounds from before previews were
 * spawned directly leaked vite servers that hold their folder open forever; without this
 * they survive every reset and every restart until the machine reboots.
 */
export function killProcessesIn(runDir) {
  if (process.platform !== 'win32') return 0
  // `wmic` was the original probe and is REMOVED from Windows 11 24H2 and later, where it
  // does not error usefully — it just exits non-zero with no output, so this returned 0 and
  // every leaked vite server survived every reset. That is how one run directory became
  // undeletable and its round could never be retired. PowerShell's CIM query is the
  // supported replacement; wmic stays as the fallback for machines that still ship it.
  // cmd.exe is scanned too: the npm-wrapper fallback in spawnPreview leaves one holding the
  // directory even after its node child is gone.
  const scan = [
    [
      'powershell',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'Get-CimInstance Win32_Process -Filter "Name=\'node.exe\' or Name=\'cmd.exe\'" | ForEach-Object { "$($_.ProcessId)|$($_.CommandLine)" }',
      ],
    ],
    ['wmic', ['process', 'where', "name='node.exe'", 'get', 'ProcessId,CommandLine', '/format:csv']],
  ]
  const needle = path.resolve(runDir).toLowerCase()
  let killed = 0
  for (const [command, args] of scan) {
    const probe = spawnSync(command, args, { encoding: 'utf8', windowsHide: true })
    if (probe.status !== 0 || !probe.stdout) continue
    for (const line of probe.stdout.split('\n')) {
      if (!line.toLowerCase().includes(needle)) continue
      // powershell: `<pid>|<command line>`. wmic csv: `<node>,<command line>,<pid>`.
      const pid = command === 'powershell' ? line.trim().split('|')[0] : line.trim().split(',').pop()
      if (!/^\d+$/.test(pid)) continue
      killTree(pid)
      killed++
    }
    break
  }
  return killed
}

export const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

export async function captureRun(runName, port, log = console.log, profile = 'recommended') {
  const runDir = path.join(RUNS, runName)
  if (!fs.existsSync(runDir)) throw new Error(`no such run: ${runName}`)

  log(`[${runName}] building…`)
  const buildCmd = npmCommand(['run', 'build'])
  const build = spawnSync(buildCmd.command, buildCmd.args, { cwd: runDir, shell: buildCmd.shell, encoding: 'utf8', windowsHide: true })
  if (build.status !== 0) {
    const tail = (build.stderr || build.stdout || '').split('\n').slice(-20).join('\n')
    fs.writeFileSync(path.join(runDir, 'build-error.log'), tail, 'utf8')
    log(`[${runName}] BUILD FAILED — recorded as a finding`)
    return { runName, ok: false, error: 'build failed' }
  }

  // strictPort makes a busy port fail loudly instead of drifting to another one.
  const chosen = await freePort(port)
  const server = spawnPreview(runDir, chosen)

  const warnings = []
  let browser
  try {
    const { chromium } = await import('playwright')
    const base = `http://127.0.0.1:${chosen}/`
    browser = await chromium.launch()
    const outDir = path.join(runDir, '.captures')
    fs.rmSync(outDir, { recursive: true, force: true })
    fs.mkdirSync(outDir, { recursive: true })

    for (const vp of VIEWPORTS) {
      // reducedMotion is not a preference here, it is a photography setting: a still of a
      // page mid-entrance-animation is a picture of a state no visitor ever sees, and most
      // reveal implementations honour the query by rendering their final state immediately.
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce' })
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
      await page.evaluate(() => document.fonts?.ready).catch(() => {})
      await page.evaluate(async () => {
        const step = Math.round(window.innerHeight * 0.6) // overlap, so nothing sits between two stops
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 200))
        }
        window.scrollTo(0, document.body.scrollHeight)
        await new Promise((r) => setTimeout(r, 400))
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

      // Anything still fully transparent after a full scroll pass is a reveal that never
      // fired. It photographs as a blank band and reads as a hole in the design, so flag it
      // instead of letting the reviewer score a gap the live page does not have.
      const hidden = await page.evaluate(() => {
        let count = 0
        let area = 0
        for (const el of document.body.querySelectorAll('*')) {
          const r = el.getBoundingClientRect()
          if (r.width < 80 || r.height < 40) continue
          const s = getComputedStyle(el)
          if (Number(s.opacity) <= 0.05 && s.visibility !== 'hidden' && s.display !== 'none') {
            count++
            area += r.width * r.height
          }
        }
        return { count, area, viewport: window.innerWidth * window.innerHeight }
      })
      if (hidden.count && hidden.area > hidden.viewport * 0.15) {
        warnings.push(
          `${vp.name}: ${hidden.count} block(s) were still invisible when photographed — a scroll reveal that never fired. Judge this one from the live preview, not the still.`,
        )
      }

      await page.screenshot({ path: path.join(outDir, `${vp.name}.png`), fullPage: true })
      log(`[${runName}] captured ${vp.name}${visible.text < 40 ? ' — WARNING: looks blank' : ''}`)

      // Playwright defaults to a light color scheme. A design with a dark mode therefore
      // gets photographed in a state the reviewer's own browser may never show them, so
      // the still and the live preview disagree. Capture the other scheme too.
      if (vp.name === 'desktop') {
        const hasDark = await page.evaluate(() =>
          [...document.styleSheets].some((sheet) => {
            try {
              return [...sheet.cssRules].some(
                (rule) => rule.media && /prefers-color-scheme:\s*dark/i.test(rule.conditionText ?? rule.media.mediaText),
              )
            } catch {
              return false
            }
          }),
        )
        if (hasDark) {
          await page.emulateMedia({ colorScheme: 'dark' })
          await page.waitForTimeout(600)
          await page.screenshot({ path: path.join(outDir, 'desktop-dark.png'), fullPage: true })
          await page.emulateMedia({ colorScheme: 'light' })
          log(`[${runName}] captured desktop-dark (design declares a dark mode)`)
        }
      }

      await page.close()
    }

    await browser.close()
    browser = null

    // Stills above are explicitly reduced-motion composition views. Review
    // actual time behavior separately under normal motion and native inputs.
    try {
      const motion = await capturePlayback(base, outDir)
      for (const result of motion) {
        if (!result.reachedEnd) warnings.push(`${result.profile}: playback capture reached its input limit before the page end; inspect the rest live`)
        if (result.errors.length) warnings.push(`${result.profile} playback: ${result.errors.join(' | ')}`)
      }
      log(`[${runName}] recorded desktop wheel/keyboard, mobile touch, and reduced-motion playback`)
    } catch (err) {
      warnings.push(`Motion playback unavailable: ${err.message}. Do not judge motion from stills.`)
      log(`[${runName}] motion capture failed: ${err.message}`)
    }

    // Measured here because the preview server is already up; a second build-and-serve
    // cycle per run is pure cost. A blocked result is a finding about the run, so it is
    // recorded rather than thrown — only a broken harness is reported as an error.
    if (!smokeAvailable()) {
      log(`[${runName}] visual smoke SKIPPED — ${smokeUnavailableReason()}`)
    } else {
      try {
        const smoke = await measureSmoke(base, profile)
        writeSmoke(runDir, { profile, ...smoke })
        log(
          smoke.ok
            ? `[${runName}] visual smoke passed (${smoke.checks.length} checks)`
            : `[${runName}] visual smoke BLOCKED: ${smoke.blockers.join(' | ')}`,
        )
      } catch (err) {
        log(`[${runName}] visual smoke errored: ${err.message}`)
        writeSmoke(runDir, { profile, ok: null, error: err.message, blockers: [], advisories: [], checks: [] })
      }
    }

    // The builder may or may not have looked. Measure it here either way, so the prototype
    // gate and the review always have the numbers — see lib/look.mjs.
    const own = builderLook(runDir)
    if (own) {
      log(`[${runName}] the builder ran dreative look itself: ${own.broken.length} broken`)
    } else if (!lookAvailable()) {
      log(`[${runName}] dreative look SKIPPED — no CLI build found`)
    } else {
      try {
        const report = measureLook(base, runDir)
        const inert = report.observed.filter((o) => /nothing changes across it/.test(o)).length
        log(`[${runName}] look (harness pass): ${report.broken.length} broken, ${inert} inert section(s) — the builder did not run it`)
      } catch (err) {
        log(`[${runName}] dreative look errored: ${err.message}`)
      }
    }

    if (warnings.length) {
      fs.writeFileSync(path.join(runDir, '.captures', 'warnings.txt'), warnings.join('\n'), 'utf8')
    }
    return { runName, ok: true, warnings }
  } catch (err) {
    log(`[${runName}] capture failed: ${err.message}`)
    return { runName, ok: false, error: err.message }
  } finally {
    if (browser) await browser.close().catch(() => {})
    // Kill the whole tree first. `npm run preview` spawns vite as a child, so killing the
    // wrapper on its own orphans vite, which then holds the port and the run directory
    // open — enough to leak one server per run across a full round.
    killTree(server.pid)
  }
}

export async function captureMany(runNames, startPort = 4173, log = console.log, profile = 'recommended') {
  const results = []
  let port = startPort
  for (const name of runNames) results.push(await captureRun(name, port++, log, profile))
  return results
}
