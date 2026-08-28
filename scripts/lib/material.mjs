import fs from 'node:fs'
import path from 'node:path'

// What shipped, materially — recorded per run alongside reads.json.
//
// Written 2026-08-27 after `caliber-movement__with-a__202608262140`, which the user
// rejected on sight. That run is the reason this file exists and the reason it records
// what it records: it sourced 13 real photographs, built its own derivative pipeline
// (`tools/build-media.cjs`), emitted responsive webp at three sizes — and then drove all
// of it with two IntersectionObservers. No canvas, no drawImage, no video element, no
// model, no frame sequence. Visual smoke passed it with no blockers and reported
// "motion: 2 of 7 regions change state on approach", which is true and says nothing.
//
// So the distinction that matters is not "did it source material" — it did — but
// **whether the material can be driven and whether anything drives it**. Twelve views of
// one subject are motion material; one view is an illustration. That is a mechanical
// question about the shipped tree, which is why it belongs here and not in a rule aimed
// at the builder.
//
// This is an instrument, never a gate. It records; it blocks nothing and advises nothing.
// A run that legitimately ships stills should read as stills here, not as a failure.

const RASTER = /\.(avif|webp|png|jpe?g)$/i
const VIDEO = /\.(mp4|webm|mov|m4v)$/i
const MODEL = /\.(glb|gltf|fbx|obj|usdz)$/i
const SKIP_DIRS = new Set(['node_modules', '.git', '.captures', 'dist'])

/** Files a frame sequence leaves behind: `f-0007.webp`, `frame_012.jpg`, `turntable-03.png`. */
const SEQUENCE_FRAME = /^(.*?)[-_.]?(\d{2,5})\.(avif|webp|png|jpe?g)$/i

function walk(root, current = root, out = []) {
  let entries
  try {
    entries = fs.readdirSync(current, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      walk(root, path.join(current, entry.name), out)
    } else {
      out.push(path.relative(root, path.join(current, entry.name)).split(path.sep).join('/'))
    }
  }
  return out
}

/**
 * Group numbered rasters by their stem. A stem with >= 8 consecutive-ish numbered files is a
 * frame sequence; below that it is almost always responsive derivatives (`hero-900.webp`,
 * `hero-1700.webp`), which is why the threshold is not 2. Derivative sets are also numbered
 * by *width*, so they jump in hundreds — a real sequence increments by one.
 */
function findSequences(files) {
  const groups = new Map()
  for (const file of files) {
    const base = file.split('/').pop()
    const m = base.match(SEQUENCE_FRAME)
    if (!m) continue
    const stem = `${file.slice(0, file.length - base.length)}${m[1]}`
    if (!groups.has(stem)) groups.set(stem, [])
    groups.get(stem).push(Number(m[2]))
  }
  const sequences = []
  for (const [stem, numbers] of groups) {
    if (numbers.length < 8) continue
    const sorted = [...numbers].sort((a, b) => a - b)
    const steps = sorted.slice(1).map((n, i) => n - sorted[i])
    const singleSteps = steps.filter((s) => s === 1).length
    // A real sequence is mostly consecutive. Responsive widths never are.
    if (singleSteps < steps.length * 0.7) continue
    sequences.push({ stem, frames: numbers.length, first: sorted[0], last: sorted[sorted.length - 1] })
  }
  return sequences
}

/** Source text the build actually ships, so a driver in a tool script does not count. */
function readSource(runDir) {
  const roots = ['src', 'app', 'components', 'lib', 'public', 'index.html']
  let text = ''
  for (const root of roots) {
    const abs = path.join(runDir, root)
    if (!fs.existsSync(abs)) continue
    if (fs.statSync(abs).isFile()) {
      text += `\n${fs.readFileSync(abs, 'utf8')}`
      continue
    }
    for (const file of walk(abs)) {
      if (!/\.(m?[jt]sx?|html|svelte|vue|css)$/i.test(file)) continue
      try {
        text += `\n${fs.readFileSync(path.join(abs, file), 'utf8')}`
      } catch {}
    }
  }
  return text
}

/**
 * Drivers, split by what they can express. The point of the split is that the bottom group
 * can only move a box and the top group can index into material — `202608262140` had the
 * bottom group only, and that is the whole finding.
 */
const DRIVERS = {
  canvasFrame: /\bdrawImage\s*\(/,
  videoTime: /\.currentTime\s*=/,
  webgl: /\b(?:THREE|OGL|WebGLRenderer|useFrame|getContext\(\s*['"]webgl)/,
  scrollProgress: /\b(?:ScrollTrigger|scrollYProgress|useScroll|scrub\s*:)/,
  timeline: /\b(?:gsap\.timeline|gsap\.to|gsap\.fromTo|animate\s*\()/,
  observer: /\bIntersectionObserver\b/,
  rafLoop: /\brequestAnimationFrame\b/,
  cssTransition: /transition\s*:/,
}

const INDEXING = ['canvasFrame', 'videoTime', 'webgl', 'scrollProgress']

/**
 * Record what a finished run shipped. Returns null when there is nothing to look at, so a
 * launch failure does not write a misleading all-zero record.
 */
export function materialSummary(runDir) {
  if (!fs.existsSync(runDir)) return null
  const files = walk(runDir)
  if (!files.length) return null

  // Anything under a dot-directory is working material: `.media-src/` originals kept out of
  // the bundle, `.scratch/` intermediates, `.captures/` screenshots. Counting those as
  // shipped reads a build as having a frame sequence when the frames only ever sat in a
  // scratch folder — which is exactly what `202608260911` did.
  const working = files.filter((f) => f.startsWith('.'))
  const shipped = files.filter((f) => !f.startsWith('.'))
  const sequences = findSequences(shipped)
  const source = readSource(runDir)

  const drivers = Object.entries(DRIVERS)
    .filter(([, re]) => re.test(source))
    .map(([name]) => name)

  return {
    // Sourcing. Working originals are counted apart from shipped files, because that is what
    // tells "sourced it and used it" apart from "sourced it and left it in scratch".
    workingOriginals: working.filter((f) => RASTER.test(f) || VIDEO.test(f) || MODEL.test(f)).length,
    workingSequences: findSequences(working),
    shippedRasters: shipped.filter((f) => RASTER.test(f)).length,
    shippedVideo: shipped.filter((f) => VIDEO.test(f)),
    shippedModels: shipped.filter((f) => MODEL.test(f)),
    frameSequences: sequences,
    // Driving.
    drivers,
    indexesIntoMaterial: drivers.some((d) => INDEXING.includes(d)),
    // The one line worth reading first.
    verdict: describe(sequences, shipped, drivers),
  }
}

function describe(sequences, shipped, drivers) {
  const hasSequence = sequences.length > 0
  const hasVideo = shipped.some((f) => VIDEO.test(f))
  const hasModel = shipped.some((f) => MODEL.test(f))
  const drivable = hasSequence || hasVideo || hasModel
  const driven = drivers.some((d) => INDEXING.includes(d))
  if (drivable && driven) return 'drivable material shipped and something indexes into it'
  if (drivable && !driven) return 'drivable material shipped but nothing indexes into it'
  if (!drivable && driven) return 'an indexing driver with no drivable material to index'
  if (shipped.some((f) => RASTER.test(f))) return 'stills only, moved by reveal or transition'
  return 'no external visual material shipped'
}

export function writeMaterialSummary(runDir) {
  const summary = materialSummary(runDir)
  if (summary) fs.writeFileSync(path.join(runDir, 'material.json'), JSON.stringify(summary, null, 2))
  return summary
}

// ---------------------------------------------------------------------------
// Continuity. Added 2026-08-29 after `caliber-movement__with-a__202608271135`,
// which passed everything above: 19 sourced, credited photographs, no drawn props,
// `indexesIntoMaterial: true` — and six *different* watches indexed as six stages of one
// movement, three different objects sold as three finishes of one caliber, all of it
// shipped at whatever colour temperature its archive happened to use.
//
// So the count was satisfied and the set was not one thing. Neither half of that is
// visible above, because both questions are about the *relationship between* the shipped
// images rather than about any one of them. These two measurements are cheap proxies:
//
//   - one credit per image means one source per image, which for a set meant to read as
//     one subject is the whole failure showing up in the attribution line;
//   - a wide colour-temperature spread across the shipped rasters means separately
//     sourced material shipped untreated, whatever else was done to it.
//
// Proxies, not findings. A legitimately mixed set — an archive piece, a reportage strip, a
// page whose subject genuinely is many objects — reads "wide" here and is right to. This
// stays an instrument: it records, it blocks nothing, it advises nothing.

const CREDIT_LINE =
  /(?:^|\n)[^\n]*?\b(?:CC[ -]?(?:BY|0)|public domain|courtesy of|photo(?:graph)?(?: by)?|©|unsplash|pexels|wikimedia|commons\.wikimedia|flickr|nasa|noaa|usgs|esa|rijksmuseum|smithsonian|auckland museum|internet archive)\b[^\n]*/gi

const CREDIT_NOISE = /^[\s#*\->|`]+|[\s*|`]+$/g

const NON_SOURCE_HOST =
  /fonts\.|googleapis|gstatic|jsdelivr|unpkg|cdnjs|localhost|127\.0\.0\.1|schema\.org|w3\.org|npmjs|react|vitejs/

/**
 * Distinct attributions across everything the run ships or records. Reads the shipped
 * source and any markdown beside it (`CREDITS.md`, the asset commitment), because a credit
 * lives in whichever of those the build chose.
 */
function creditSpread(runDir, shipped) {
  let text = readSource(runDir)
  for (const file of shipped) {
    if (!/\.(md|txt)$/i.test(file)) continue
    try {
      text += `\n${fs.readFileSync(path.join(runDir, file), 'utf8')}`
    } catch {}
  }
  const lines = new Set()
  const domains = new Set()
  for (const match of text.match(CREDIT_LINE) || []) {
    const line = match.replace(/\s+/g, ' ').replace(CREDIT_NOISE, '').trim()
    if (line.length > 6 && line.length < 300) lines.add(line.toLowerCase())
  }
  for (const m of text.matchAll(/https?:\/\/([^/\s")'\]]+)/g)) {
    const host = m[1].toLowerCase().replace(/^www\./, '')
    if (NON_SOURCE_HOST.test(host)) continue
    domains.add(host)
  }
  return { distinctCredits: lines.size, distinctSourceDomains: domains.size }
}

const MAX_MEASURED = 28
const MAX_BYTES = 6_000_000

/**
 * Mean colour temperature and luminance per shipped raster, measured by decoding each file
 * in Chromium — the testbed already has it for capture, and nothing else here can read a
 * webp. Returns null rather than throwing when the browser is unavailable: this is an
 * instrument, and a missing measurement is a missing measurement, not a failed run.
 */
export async function imageSetSpread(runDir) {
  const shipped = walk(runDir).filter((f) => !f.startsWith('.') && RASTER.test(f))
  const files = shipped
    .filter((f) => {
      try {
        return fs.statSync(path.join(runDir, f)).size <= MAX_BYTES
      } catch {
        return false
      }
    })
    .slice(0, MAX_MEASURED)
  if (files.length < 2) return null

  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    return null
  }
  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage()
    await page.goto('about:blank')
    const measured = []
    for (const file of files) {
      const ext = path.extname(file).slice(1).toLowerCase()
      const mime = ext === 'jpg' ? 'jpeg' : ext
      const data = `data:image/${mime};base64,${fs.readFileSync(path.join(runDir, file)).toString('base64')}`
      const stat = await page.evaluate(async (src) => {
        const img = new Image()
        img.src = src
        try {
          await img.decode()
        } catch {
          return null
        }
        const n = 32
        const c = document.createElement('canvas')
        c.width = n
        c.height = n
        const ctx = c.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0, n, n)
        const { data: px } = ctx.getImageData(0, 0, n, n)
        let r = 0
        let g = 0
        let b = 0
        for (let i = 0; i < px.length; i += 4) {
          r += px[i]
          g += px[i + 1]
          b += px[i + 2]
        }
        const count = px.length / 4
        return { r: r / count, g: g / count, b: b / count }
      }, data).catch(() => null)
      if (!stat) continue
      // Warm-cool proxy in [-1, 1]. Not a colour temperature in kelvin and not trying to be;
      // it only has to separate brass from steel.
      const warmth = (stat.r - stat.b) / Math.max(1, stat.r + stat.b)
      const luma = (0.2126 * stat.r + 0.7152 * stat.g + 0.0722 * stat.b) / 255
      measured.push({ file, warmth: round(warmth), luma: round(luma) })
    }
    if (measured.length < 2) return null
    const warmths = measured.map((m) => m.warmth)
    const lumas = measured.map((m) => m.luma)
    return {
      measured: measured.length,
      ofShipped: shipped.length,
      warmthSpread: round(Math.max(...warmths) - Math.min(...warmths)),
      warmthStdDev: round(stdDev(warmths)),
      lumaSpread: round(Math.max(...lumas) - Math.min(...lumas)),
      coldest: measured.reduce((a, b) => (b.warmth < a.warmth ? b : a)).file,
      warmest: measured.reduce((a, b) => (b.warmth > a.warmth ? b : a)).file,
    }
  } catch {
    return null
  } finally {
    await browser?.close().catch(() => {})
  }
}

function round(n) {
  return Math.round(n * 1000) / 1000
}

function stdDev(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length)
}

/**
 * Merge the continuity signal into an already-written `material.json`. Separate from
 * `writeMaterialSummary` because it needs a browser, and that one stays synchronous and
 * dependency-free so a launch failure still gets a record.
 */
export async function addContinuitySignal(runDir) {
  const file = path.join(runDir, 'material.json')
  if (!fs.existsSync(file)) return null
  const summary = JSON.parse(fs.readFileSync(file, 'utf8'))
  const shipped = walk(runDir).filter((f) => !f.startsWith('.'))
  const credits = creditSpread(runDir, shipped)
  const colour = await imageSetSpread(runDir)
  const perImage =
    summary.shippedRasters > 0 ? round(credits.distinctCredits / summary.shippedRasters) : 0
  summary.continuity = {
    ...credits,
    creditsPerShippedRaster: perImage,
    colour,
    note: continuityNote(credits, perImage, colour),
  }
  fs.writeFileSync(file, JSON.stringify(summary, null, 2))
  return summary.continuity
}

function continuityNote(credits, perImage, colour) {
  const parts = []
  if (credits.distinctCredits === 0) parts.push('no attributions found')
  else if (perImage >= 0.6)
    parts.push(`about one credit per shipped image (${credits.distinctCredits})`)
  else parts.push(`${credits.distinctCredits} attributions across the shipped set`)
  if (!colour) parts.push('colour not measured')
  else if (colour.warmthSpread >= 0.25) parts.push(`wide warmth spread (${colour.warmthSpread})`)
  else parts.push(`warmth spread ${colour.warmthSpread}`)
  return `${parts.join('; ')} — proxies for one-source-per-slot and untreated mixed material, not findings`
}
