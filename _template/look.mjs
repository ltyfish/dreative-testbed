#!/usr/bin/env node
// Look at the page you just built.
//
// Builds the project, serves it, photographs it at desktop and mobile, and reports what a
// browser can see that source code cannot. Run it before you call the work done:
//
//   npm run look
//
// It writes screenshots to .look/ and prints a report. READ THE SCREENSHOTS — the report
// only catches things that can be measured, and most of what is wrong with a page cannot be.
//
// ---------------------------------------------------------------------------------------
//
// Why this exists. Until 2026-09-05 a run in this harness had no way to see its own output:
// sessions get no browser, so every page was written from source and shipped unseen. The
// last round went looking for chrome.exe on the filesystem, did not find a way in, and
// shipped blind. Web design is an output-space task — you cannot know from CSS whether the
// composition works — so the builder was being asked to do the one job it had no instrument
// for.
//
// What this is NOT. It is not a gate and it does not score anything. Nothing here fails a
// build, and there are no thresholds to satisfy. Two tiers are printed and the difference
// matters: BROKEN is output that is invalid however you feel about it (nothing painted,
// text nobody can read, a page that scrolls sideways, an image that 404'd). OBSERVED is
// neutral fact about the rendered page — what changed across scroll, what did not — offered
// because you could not otherwise know it. An observation is not a defect and the report
// does not tell you what to do about one. Deciding that is the design work.
//
// This file ships in _template/, so every run has it and both arms of an A/B get it. An
// instrument given to one side would be credited to the skill; see scaffold.mjs.

import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import url from 'node:url'

const RUN_DIR = path.dirname(url.fileURLToPath(import.meta.url))
const OUT = path.join(RUN_DIR, '.look')

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

// A page taller than this many viewports gets its tiles sampled evenly rather than every
// band photographed. Twelve images is already a lot to look at carefully.
const MAX_TILES = 12

const args = process.argv.slice(2)
const has = (f) => args.includes(`--${f}`)
const SKIP_BUILD = has('no-build')
const ONLY = args.find((a) => !a.startsWith('--'))

function freePort(preferred = 4390) {
  return new Promise((resolve) => {
    const probe = net.createServer()
    probe.once('error', () => resolve(freePort(0)))
    probe.listen(preferred, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => resolve(port))
    })
  })
}

function killTree(pid) {
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
    } catch {}
  }
}

// ------------------------------------------------------------------ in-page probes
//
// Everything below runs inside the page. Kept as source strings passed to page.evaluate so
// the whole instrument stays one file with no bundling step.

/** What a browser can see that the source cannot: empty bands, unreadable text, dead images. */
const PROBE_STATIC = async () => {
  const out = { blankBands: [], tinyText: [], brokenImages: [], overflowX: null, unrevealed: [], counts: {} }
  const vh = window.innerHeight
  const docH = document.documentElement.scrollHeight

  // A band of the page taller than the viewport with almost nothing painted in it. This is
  // the thing that reads to a person as "big empty spaces everywhere" and it is almost
  // always an unclosed section or a sticky element shorter than its own scroll track,
  // rather than a spacing decision anyone made.
  const boxes = []
  for (const el of document.body.querySelectorAll('*')) {
    const s = getComputedStyle(el)
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.05) continue
    const r = el.getBoundingClientRect()
    if (r.width < 8 || r.height < 8) continue
    const paints =
      el.childNodes.length &&
      [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
    const isMedia = /^(IMG|VIDEO|CANVAS|SVG|PICTURE)$/.test(el.tagName)
    const hasBg = s.backgroundImage !== 'none'
    if (!paints && !isMedia && !hasBg) continue
    boxes.push({ top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, area: r.width * r.height })
  }
  const step = Math.round(vh * 0.5)
  for (let y = 0; y < docH - vh * 0.5; y += step) {
    const band = boxes.filter((b) => b.bottom > y && b.top < y + vh)
    const covered = band.reduce((sum, b) => sum + b.area, 0)
    if (band.length <= 1 && covered < window.innerWidth * vh * 0.08) {
      const last = out.blankBands[out.blankBands.length - 1]
      if (last && y - last.to <= step) last.to = y + vh
      else out.blankBands.push({ from: y, to: y + vh })
    }
  }

  // Text nobody can read. Only text a reader is meant to read — an element with its own
  // text node, not a container that inherited a size, and not the screen-reader-only labels
  // that are *supposed* to be 1px and clipped. Flagging those made the report 26 lines long
  // and taught the reader to skim it, which costs more than the few real hits are worth.
  const srOnly = (el, s, r) => {
    if (r.width <= 4 || r.height <= 4) return true
    if (/inset\(\s*50%/.test(s.clipPath) || s.clip === 'rect(0px, 0px, 0px, 0px)') return true
    if (s.position === 'absolute' && (r.width <= 2 || r.height <= 2)) return true
    return false
  }
  const tiny = new Map()
  for (const el of document.body.querySelectorAll('*')) {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim()
    if (own.length < 2) continue
    const s = getComputedStyle(el)
    if (s.visibility === 'hidden' || s.display === 'none') continue
    const size = parseFloat(s.fontSize)
    if (size >= 12) continue
    if (srOnly(el, s, el.getBoundingClientRect())) continue
    const key = `${el.tagName.toLowerCase()}@${size}px`
    if (!tiny.has(key)) tiny.set(key, { tag: el.tagName.toLowerCase(), px: size, sample: own.slice(0, 46), count: 0 })
    tiny.get(key).count++
  }
  out.tinyText = [...tiny.values()].sort((a, b) => a.px - b.px)

  // An image that never loaded photographs as a hole and reads as a missing section.
  for (const img of document.images) {
    if (!img.complete || img.naturalWidth === 0) out.brokenImages.push(img.getAttribute('src') || '(no src)')
  }

  if (document.documentElement.scrollWidth > window.innerWidth + 2) {
    const wide = [...document.body.querySelectorAll('*')]
      .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 2)
      .slice(0, 4)
      .map((el) => el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(/\s+/)[0] : ''))
    out.overflowX = { docWidth: document.documentElement.scrollWidth, viewport: window.innerWidth, widest: wide }
  }

  // Never visible at any point in a full scroll: a reveal that was wired up and never
  // fired. It is invisible to a reader and invisible in a screenshot, so nothing else
  // would tell you.
  //
  // Measured against the high-water mark recorded during the scroll pass, not against the
  // opacity right now. A scroll-driven layer that fades in at 40% down the page is
  // legitimately transparent when the probe has returned to the top, and reporting those
  // meant the harness accused a working effect of being broken — the exact kind of false
  // finding that makes an instrument get ignored.
  const seen = window.__lookMaxOpacity || new Map()
  const suspect = []
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect()
    if (r.width < 100 || r.height < 60) continue
    const s = getComputedStyle(el)
    if (s.visibility === 'hidden' || s.display === 'none') continue
    if (Math.max(Number(s.opacity), seen.get(el) ?? 0) > 0.05) continue
    suspect.push(el)
  }
  // Then confirm each one, individually, with the element parked in view and given time.
  // A reveal driven by IntersectionObserver with a 700ms transition is still near zero
  // 180ms after the scroll pass swept past it, so the sweep alone accuses working effects
  // of being broken. An instrument that cries wolf gets ignored, which costs more than the
  // second it takes to check properly.
  const stuck = []
  for (const el of suspect.slice(0, 24)) {
    el.scrollIntoView({ block: 'center', behavior: 'instant' })
    await new Promise((r) => setTimeout(r, 900))
    if (Number(getComputedStyle(el).opacity) > 0.05) continue
    stuck.push(el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(/\s+/)[0] : ''))
  }
  window.scrollTo(0, 0)
  out.unrevealed = [...new Set(stuck)].slice(0, 8)

  out.counts = {
    height: docH,
    viewports: Math.round((docH / vh) * 10) / 10,
    images: document.images.length,
    videos: document.querySelectorAll('video').length,
    canvases: document.querySelectorAll('canvas').length,
    text: document.body.innerText.trim().length,
  }
  return out
}

/**
 * What actually changes as the page is scrolled, section by section.
 *
 * Reported, never scored. The useful distinction it can draw is between a section whose
 * subject changes and a section that only fades in — those look identical in source and
 * completely different to a reader, and no amount of reading your own CSS will tell you
 * which one you built. What you do with that is your call: an opacity-only reveal is
 * correct in plenty of places and wrong in the one place the page is asking a section to
 * carry a transition.
 */
const PROBE_MOTION = async () => {
  const WATCHED = [
    'transform',
    'opacity',
    'clipPath',
    'filter',
    'backgroundPosition',
    'backgroundSize',
    'objectPosition',
    'borderRadius',
    'backgroundColor',
    'color',
    'maskImage',
    'translate',
    'rotate',
    'scale',
  ]
  const sections = [...document.querySelectorAll('section, main > div, [data-section]')].filter((el) => {
    const r = el.getBoundingClientRect()
    return r.height > window.innerHeight * 0.4
  })

  const sample = (el) => {
    const nodes = [el, ...el.querySelectorAll('*')].slice(0, 60)
    return nodes.map((n) => {
      const s = getComputedStyle(n)
      const r = n.getBoundingClientRect()
      const props = {}
      for (const p of WATCHED) props[p] = s[p]
      // Media that plays is motion the style probe cannot see.
      if (n.tagName === 'VIDEO') props.__t = String(Math.round(n.currentTime * 4))
      if (n.tagName === 'IMG') props.__src = n.currentSrc || n.src
      if (n.tagName === 'CANVAS') {
        try {
          props.__px = n.getContext('2d')?.getImageData(0, 0, Math.min(24, n.width), 1)?.data?.join(',') ?? 'gl'
        } catch {
          props.__px = 'gl'
        }
      }
      props.__rect = `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.left)}`
      return props
    })
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const results = []

  for (const el of sections) {
    const top = el.getBoundingClientRect().top + window.scrollY
    const track = Math.max(el.getBoundingClientRect().height - window.innerHeight, 1)
    const stops = [0, 0.25, 0.5, 0.75, 1]
    const frames = []
    for (const t of stops) {
      window.scrollTo(0, Math.round(top + track * t))
      await wait(420)
      frames.push(sample(el))
    }
    const changed = new Set()
    const width = Math.min(...frames.map((f) => f.length))
    for (let i = 0; i < width; i++) {
      for (const p of [...WATCHED, '__t', '__px', '__src', '__rect']) {
        const values = new Set(frames.map((f) => f[i]?.[p]))
        if (values.size > 1) changed.add(p)
      }
    }
    results.push({
      id: el.id || null,
      cls: String(el.className || '').split(/\s+/)[0] || null,
      tag: el.tagName.toLowerCase(),
      heightVh: Math.round((el.getBoundingClientRect().height / window.innerHeight) * 10) / 10,
      changed: [...changed],
    })
  }
  window.scrollTo(0, 0)
  await wait(200)
  return results
}

/** Does anything respond to a pointer? Reported as fact; hover is not required of anything. */
const PROBE_HOVER = async (selectors) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  let responded = 0
  let tested = 0
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (!el) continue
    const before = getComputedStyle(el).cssText
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    await wait(260)
    tested++
    if (getComputedStyle(el).cssText !== before) responded++
    el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
    el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
  }
  return { tested, responded }
}

// ------------------------------------------------------------------ report

const B = []
const O = []
const broke = (s) => B.push(s)
const note = (s) => O.push(s)

function describe(section) {
  const name = section.id ? `#${section.id}` : section.cls ? `.${section.cls}` : `<${section.tag}>`
  return `${name} (${section.heightVh}vh)`
}

async function main() {
  if (!SKIP_BUILD) {
    console.log('building…')
    const build = spawnSync('npm', ['run', 'build'], { cwd: RUN_DIR, shell: true, encoding: 'utf8' })
    if (build.status !== 0) {
      console.error('\nBUILD FAILED — nothing to look at.\n')
      console.error((build.stderr || build.stdout || '').split('\n').slice(-25).join('\n'))
      process.exit(1)
    }
  }

  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    console.error('playwright is not available in this project, so the page cannot be rendered.')
    process.exit(1)
  }

  const port = await freePort()
  const vite = path.join(RUN_DIR, 'node_modules', 'vite', 'bin', 'vite.js')
  const server = fs.existsSync(vite)
    ? spawn(process.execPath, [vite, 'preview', '--port', String(port), '--strictPort'], { cwd: RUN_DIR, stdio: 'ignore' })
    : spawn('npm', ['run', 'preview', '--', '--port', String(port), '--strictPort'], { cwd: RUN_DIR, shell: true, stdio: 'ignore' })

  const base = `http://127.0.0.1:${port}/`
  fs.rmSync(OUT, { recursive: true, force: true })
  fs.mkdirSync(OUT, { recursive: true })

  const browser = await chromium.launch()
  const written = []

  try {
    for (const vp of VIEWPORTS) {
      if (ONLY && ONLY !== vp.name) continue
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
      page.on('pageerror', (e) => broke(`${vp.name}: uncaught page error — ${String(e.message).slice(0, 160)}`))
      page.on('console', (m) => {
        if (m.type() === 'error') broke(`${vp.name}: console error — ${m.text().slice(0, 160)}`)
      })

      let loaded = false
      for (let attempt = 0; attempt < 40 && !loaded; attempt++) {
        try {
          await page.goto(base, { waitUntil: 'load', timeout: 2000 })
          loaded = true
        } catch {
          await page.waitForTimeout(500)
        }
      }
      if (!loaded) throw new Error('the preview server never came up')

      await page.waitForTimeout(1000)
      await page.evaluate(() => document.fonts?.ready).catch(() => {})

      // Scroll the whole page once before measuring, so lazy content and scroll-triggered
      // reveals have fired. Anything still invisible after this really is stuck.
      await page.evaluate(async () => {
        // Remember the highest opacity every large block reached anywhere in the pass, so a
        // scroll-driven layer is not later mistaken for a reveal that never fired.
        const peak = new Map()
        const record = () => {
          for (const el of document.body.querySelectorAll('*')) {
            const r = el.getBoundingClientRect()
            if (r.width < 100 || r.height < 60) continue
            const o = Number(getComputedStyle(el).opacity)
            if (o > (peak.get(el) ?? 0)) peak.set(el, o)
          }
        }
        const step = Math.round(window.innerHeight * 0.6)
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 180))
          record()
        }
        window.scrollTo(0, 0)
        await new Promise((r) => setTimeout(r, 500))
        record()
        window.__lookMaxOpacity = peak
      })

      const stat = await page.evaluate(PROBE_STATIC)

      if (stat.counts.text < 40) broke(`${vp.name}: the page renders almost no text (${stat.counts.text} characters)`)
      for (const band of stat.blankBands) {
        broke(`${vp.name}: nothing is painted between y=${band.from} and y=${band.to} — a viewport-sized hole in the page`)
      }
      // One finding, not twenty-three. A page that sets everything small produces a line
      // per element and buries every other blocker under it; the smallest few plus a total
      // says the same thing and stays readable.
      if (stat.tinyText.length) {
        const total = stat.tinyText.reduce((n, t) => n + t.count, 0)
        const worst = stat.tinyText.slice(0, 4)
        broke(
          `${vp.name}: ${total} run(s) of text below 12px across ${stat.tinyText.length} kind(s) — too small to read. Smallest: ` +
            worst.map((t) => `${t.px}px <${t.tag}> "${t.sample}"`).join(' · '),
        )
      }
      for (const src of stat.brokenImages.slice(0, 6)) broke(`${vp.name}: image failed to load — ${src}`)
      if (stat.overflowX) {
        broke(
          `${vp.name}: the page scrolls sideways (${stat.overflowX.docWidth}px of content in a ${stat.overflowX.viewport}px viewport) — widest: ${stat.overflowX.widest.join(', ')}`,
        )
      }
      for (const el of stat.unrevealed) broke(`${vp.name}: ${el} is still fully transparent after a full scroll — a reveal that never fired`)

      note(
        `${vp.name}: ${stat.counts.viewports} viewports tall · ${stat.counts.images} images, ${stat.counts.videos} video, ${stat.counts.canvases} canvas · ${stat.counts.text} characters`,
      )

      if (vp.name === 'desktop') {
        const motion = await page.evaluate(PROBE_MOTION)
        for (const s of motion) {
          if (!s.changed.length) note(`scroll · ${describe(s)} — nothing changes across it`)
          else if (s.changed.length === 1 && s.changed[0] === 'opacity') note(`scroll · ${describe(s)} — only opacity changes (a fade-in, not a transition)`)
          else note(`scroll · ${describe(s)} — changes: ${s.changed.filter((p) => !p.startsWith('__')).join(', ')}${s.changed.some((p) => p.startsWith('__')) ? ', and the media itself' : ''}`)
        }
        const hover = await page.evaluate(PROBE_HOVER, ['button', 'a', '[role="button"]', 'input', 'article', '.card'])
        note(`hover · ${hover.responded} of ${hover.tested} probed controls change under the pointer`)
      }

      // Tiles, not one enormous full-page image: a 14000px screenshot scaled to fit is
      // unreadable, and the point of this is to actually see the page.
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      const bands = Math.max(1, Math.ceil(height / vp.height))
      const pick = bands <= MAX_TILES ? [...Array(bands).keys()] : [...Array(MAX_TILES).keys()].map((i) => Math.round((i * (bands - 1)) / (MAX_TILES - 1)))
      let n = 0
      for (const b of pick) {
        await page.evaluate((y) => window.scrollTo(0, y), b * vp.height)
        await page.waitForTimeout(420)
        const file = path.join(OUT, `${vp.name}-${String(++n).padStart(2, '0')}.png`)
        await page.screenshot({ path: file })
        written.push(path.relative(RUN_DIR, file).replace(/\\/g, '/'))
      }
      await page.close()
    }
  } catch (err) {
    broke(`could not finish looking at the page — ${err.message}`)
  } finally {
    await browser.close().catch(() => {})
    killTree(server.pid)
  }

  const report = []
  report.push('')
  report.push('='.repeat(78))
  if (B.length) {
    report.push(`BROKEN — ${B.length} thing(s) a reader would hit. These are not opinions.`)
    report.push('')
    for (const b of B) report.push(`  ✕ ${b}`)
  } else {
    report.push('BROKEN — nothing. No holes, no unreadable text, no sideways scroll, no dead images.')
  }
  report.push('')
  report.push('-'.repeat(78))
  report.push('OBSERVED — neutral fact about the rendered page. Not defects, not a checklist.')
  report.push('')
  for (const o of O) report.push(`  · ${o}`)
  report.push('')
  report.push('-'.repeat(78))
  report.push(`SCREENSHOTS — ${written.length} tiles in .look/. Open them:`)
  report.push('')
  for (const f of written) report.push(`  ${f}`)
  report.push('')
  report.push('Read the screenshots. Most of what is wrong with a page is not in the list above:')
  report.push('composition, whether the images belong to one another, whether a section earns its')
  report.push('height, whether the thing being sold is actually shown. Only your own eye gets those.')
  report.push('='.repeat(78))
  report.push('')

  const text = report.join('\n')
  console.log(text)
  fs.writeFileSync(path.join(OUT, 'report.txt'), text, 'utf8')
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ broken: B, observed: O, screenshots: written }, null, 2), 'utf8')
}

main()
