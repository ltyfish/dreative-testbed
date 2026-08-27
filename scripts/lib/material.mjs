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
