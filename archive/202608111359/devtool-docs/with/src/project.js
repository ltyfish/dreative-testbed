/*
 * The sample project the bench operates on, and a small resolver that answers the
 * one question the config table cannot: given these six keys, which of my files
 * actually come out the other side?
 *
 * Everything on the page (masthead manifest, bench trees, command invocations,
 * diagnostic frames) reads from resolve(). There is one source of truth.
 */

export const SAMPLE_FILES = [
  { path: 'index.md', bytes: 412 },
  { path: 'guide/_nav.md', bytes: 190 },
  { path: 'guide/_footer.md', bytes: 96 },
  { path: 'guide/index.md', bytes: 1204 },
  { path: 'guide/install.md', bytes: 880 },
  { path: 'guide/theming.md', bytes: 2130 },
  { path: 'blog/2026-01-release.md', bytes: 3402 },
  { path: 'blog/draft.md', bytes: 720, warning: 'link to ./roadmap.md cannot be resolved' },
  { path: 'assets/diagram.svg', bytes: 5100 },
  { path: 'node_modules/marked/README.md', bytes: 18400 },
  { path: 'quill.config.js', bytes: 168 },
]

/* The six keys, each with the presets the bench can switch between. The first
   preset of every key is the documented default. */
export const CONFIG_KEYS = [
  {
    key: 'root',
    type: 'string',
    def: '"."',
    desc: 'Directory Quill treats as the project root. All other paths resolve from here.',
    options: [
      { value: '.', label: '"."' },
      { value: './guide', label: '"./guide"' },
    ],
  },
  {
    key: 'include',
    type: 'string[]',
    def: '["**/*.md"]',
    desc: 'Glob patterns to process. Later patterns override earlier ones.',
    options: [
      { value: ['**/*.md'], label: '["**/*.md"]' },
      { value: ['**/*.md', 'assets/**'], label: '["**/*.md", "assets/**"]' },
      { value: ['guide/**/*.md'], label: '["guide/**/*.md"]' },
    ],
  },
  {
    key: 'exclude',
    type: 'string[]',
    def: '["node_modules/**"]',
    desc: 'Glob patterns to skip, applied after include.',
    options: [
      { value: ['node_modules/**'], label: '["node_modules/**"]' },
      { value: ['node_modules/**', 'blog/**'], label: '["node_modules/**", "blog/**"]' },
      { value: [], label: '[]' },
    ],
  },
  {
    key: 'output',
    type: 'string',
    def: '"./dist"',
    desc: 'Where built artefacts are written. Cleared on every build unless --no-clean is passed.',
    options: [
      { value: './dist', label: '"./dist"' },
      { value: './build', label: '"./build"' },
      { value: './site', label: '"./site"' },
    ],
  },
  {
    key: 'strict',
    type: 'boolean',
    def: 'false',
    desc: 'Treat warnings as errors. Recommended in CI.',
    options: [
      { value: false, label: 'false' },
      { value: true, label: 'true' },
    ],
  },
  {
    key: 'concurrency',
    type: 'number',
    def: 'os.cpus().length',
    desc: 'Maximum parallel file transforms. Set to 1 to make output ordering deterministic.',
    options: [
      { value: 8, label: 'os.cpus().length' },
      { value: 4, label: '4' },
      { value: 1, label: '1' },
    ],
  },
]

export const DEFAULT_CONFIG = Object.fromEntries(
  CONFIG_KEYS.map((k) => [k.key, k.options[0].value]),
)

/* Glob → RegExp. Supports **, *, ? and character-safe escaping. Small on purpose:
   the sample project is fixed, so this only has to be correct for real glob shapes. */
function globToRegExp(glob) {
  let out = '^'
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') {
          out += '(?:.*/)?'
          i += 2
        } else {
          out += '.*'
          i += 1
        }
      } else {
        out += '[^/]*'
      }
    } else if (c === '?') {
      out += '[^/]'
    } else if ('.+^${}()|[]\\/'.includes(c)) {
      out += `\\${c}`
    } else {
      out += c
    }
  }
  return new RegExp(`${out}$`)
}

const globCache = new Map()
function matches(patterns, path) {
  return patterns.some((p) => {
    let re = globCache.get(p)
    if (!re) {
      re = globToRegExp(p)
      globCache.set(p, re)
    }
    return re.test(path)
  })
}

function isPartial(rel) {
  const name = rel.slice(rel.lastIndexOf('/') + 1)
  return name.startsWith('_') && name.endsWith('.md')
}

const normaliseRoot = (root) => (root === '.' ? '' : `${root.replace(/^\.\//, '')}/`)

/**
 * @returns per-file verdicts, the emitted tree, counts, diagnostics and status.
 */
export function resolve(config) {
  const prefix = normaliseRoot(config.root)

  const scope = []
  const outOfScope = []
  for (const f of SAMPLE_FILES) {
    if (prefix === '' || f.path.startsWith(prefix)) scope.push({ ...f, rel: f.path.slice(prefix.length) })
    else outOfScope.push({ ...f, rel: f.path })
  }

  const files = scope.map((f) => {
    if (!matches(config.include, f.rel)) return { ...f, verdict: 'unmatched' }
    if (matches(config.exclude, f.rel)) return { ...f, verdict: 'excluded' }
    if (isPartial(f.rel)) return { ...f, verdict: 'partial' }
    if (f.rel.endsWith('.md')) return { ...f, verdict: 'transform', out: `${f.rel.slice(0, -3)}.html` }
    return { ...f, verdict: 'copy', out: f.rel }
  })

  const kept = files.filter((f) => f.verdict === 'transform' || f.verdict === 'copy')
  const partials = files.filter((f) => f.verdict === 'partial')
  const warnings = kept.filter((f) => f.warning)
  const failed = config.strict && warnings.length > 0

  const emitted = failed ? [] : kept
  const outDir = config.output.replace(/^\.\//, '')

  /* concurrency 1 is the only setting that guarantees a stable emit order — which
     is exactly what the key's documented description promises. */
  const ordered = [...emitted].sort((a, b) => a.rel.localeCompare(b.rel))
  const emitOrder =
    config.concurrency === 1
      ? ordered
      : ordered.filter((_, i) => i % 2 === 1).concat(ordered.filter((_, i) => i % 2 === 0))

  return {
    config,
    prefix,
    files,
    outOfScope,
    partials,
    warnings,
    failed,
    emitted,
    emitOrder,
    outDir,
    counts: {
      scanned: scope.length,
      matched: kept.length + partials.length,
      skipped: files.length - kept.length - partials.length,
      outOfScope: outOfScope.length,
      emitted: emitted.length,
      inlined: partials.length,
    },
    durationMs: 41 + emitted.length * 17 + (config.concurrency === 1 ? 34 : 0),
  }
}

/* Build a nested tree for rendering. Entries are {name, depth, kind, ...}. */
export function toTree(paths, rootLabel) {
  const rows = [{ name: rootLabel, depth: 0, kind: 'root' }]
  const seen = new Set()
  const sorted = [...paths].sort((a, b) => a.path.localeCompare(b.path))
  for (const item of sorted) {
    const parts = item.path.split('/')
    for (let d = 0; d < parts.length - 1; d += 1) {
      const dir = parts.slice(0, d + 1).join('/')
      if (!seen.has(dir)) {
        seen.add(dir)
        rows.push({ name: `${parts[d]}/`, depth: d + 1, kind: 'dir', path: dir })
      }
    }
    rows.push({ ...item, name: parts[parts.length - 1], depth: parts.length, kind: 'file' })
  }
  return rows
}

/* The build log the masthead terminal replays, derived from the same resolution. */
export function buildLog(r) {
  const lines = [
    { tone: 'cmd', text: '$ quill build' },
    { tone: 'dim', text: `quill 3.2.0   root ${r.config.root}   out ${r.config.output}` },
    { tone: 'meta', text: `scanned ${r.counts.scanned} files · matched ${r.counts.matched} · skipped ${r.counts.skipped}` },
  ]
  if (r.partials.length) {
    lines.push({ tone: 'dim', text: `· ${r.partials.length} partial${r.partials.length > 1 ? 's' : ''} inlined, not emitted` })
  }
  for (const f of r.emitOrder.slice(0, 4)) {
    lines.push({ tone: 'ok', text: `✓ ${f.rel} → ${r.outDir}/${f.out}` })
  }
  if (r.emitOrder.length > 4) {
    lines.push({ tone: 'dim', text: `  …${r.emitOrder.length - 4} more` })
  }
  for (const w of r.warnings) {
    lines.push({
      tone: r.config.strict ? 'err' : 'warn',
      text: `${r.config.strict ? 'error' : 'warn '} ${w.rel}  ${w.warning}`,
    })
  }
  if (r.failed) {
    lines.push({ tone: 'err', text: `build failed — strict is on, ${r.warnings.length} warning treated as error` })
  } else if (r.emitted.length === 0) {
    lines.push({ tone: 'warn', text: 'nothing to build — no file matched include' })
  } else {
    lines.push({ tone: 'meta', text: `built ${r.counts.emitted} files in ${r.durationMs}ms` })
  }
  return lines
}
