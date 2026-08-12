import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CONFIG_KEYS,
  DEFAULT_CONFIG,
  buildLog,
  resolve,
  toTree,
} from './project.js'
import { COMMAND_MARKS } from './marks.js'

const NAV = [
  { id: 'install', label: 'Installation' },
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'config', label: 'Configuration' },
  { id: 'commands', label: 'Command reference' },
  { id: 'errors', label: 'Common errors' },
]

const INSTALLERS = {
  npm: 'npm install -g quill-cli',
  pnpm: 'pnpm add -g quill-cli',
  brew: 'brew install quill',
  curl: 'curl -fsSL https://quill.sh/install | sh',
}

const COMMANDS = [
  {
    cmd: 'quill build',
    desc: 'Transform every included file once and exit.',
    flags: ['--no-clean', '--strict', '--out <dir>'],
    initial: ['--out <dir>'],
  },
  {
    cmd: 'quill watch',
    desc: 'Rebuild affected files when they change. Holds the process open.',
    flags: ['--port <n>', '--open'],
    initial: [],
  },
  {
    cmd: 'quill check',
    desc: 'Validate links, front matter, and references without writing output.',
    flags: ['--strict', '--json'],
    initial: [],
  },
  {
    cmd: 'quill init',
    desc: 'Write a starter quill.config.js into the current directory.',
    flags: ['--force', '--template <name>'],
    initial: [],
  },
]

const ERRORS = [
  {
    code: 'E_NO_CONFIG',
    msg: 'No quill.config.js found',
    fix: 'Run quill init, or pass --config with an explicit path. Quill does not search parent directories above the git root.',
    frame: (r) => [
      { tone: 'path', text: `${r.config.root}/` },
      { tone: 'body', text: '  index.md' },
      { tone: 'body', text: '  guide/' },
      { tone: 'body', text: '  blog/' },
      { tone: 'caret', text: '  quill.config.js   ← searched here, and no higher' },
    ],
  },
  {
    code: 'E_CIRCULAR_REF',
    msg: 'Circular include detected',
    fix: 'A file includes itself through a chain of partials. Run quill check --json to print the full cycle.',
    frame: () => [
      { tone: 'path', text: 'guide/index.md:4' },
      { tone: 'body', text: '  {% include "_nav.md" %}' },
      { tone: 'caret', text: '             ~~~~~~~~~  →  guide/_nav.md' },
      { tone: 'path', text: 'guide/_nav.md:2' },
      { tone: 'body', text: '  {% include "index.md" %}' },
      { tone: 'caret', text: '             ~~~~~~~~~~ →  guide/index.md   cycle closes' },
    ],
  },
  {
    code: 'E_STALE_LOCK',
    msg: 'Build lock held by dead process',
    fix: 'A previous build was killed. Delete .quill/lock and rerun. This is safe when no other build is active.',
    frame: (r) => [
      { tone: 'path', text: `${r.config.root}/.quill/lock` },
      { tone: 'body', text: '  { "pid": 48213, "held": "12m", "out": "' + r.outDir + '" }' },
      { tone: 'caret', text: '            ~~~~~  process 48213 is not running' },
    ],
  },
]

/* ---------- small hooks ---------- */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-72px 0px -55% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ids])
  return active
}

function useReveal() {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, shown]
}

/* ---------- shared pieces ---------- */

function SectionHead({ title, lede, aside }) {
  return (
    <header className="sec-head">
      <div className="sec-head-row">
        <h2>
          <span className="md-hash" aria-hidden="true">##</span>
          {title}
        </h2>
        {aside}
      </div>
      {lede ? <p className="lede">{lede}</p> : null}
    </header>
  )
}

function CopyButton({ text, label = 'Copy' }) {
  const [state, setState] = useState('idle')
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <button
      type="button"
      className="copy"
      data-state={state}
      onClick={async () => {
        try {
          if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text)
          else {
            const ta = document.createElement('textarea')
            ta.value = text
            ta.setAttribute('readonly', '')
            ta.style.position = 'fixed'
            ta.style.opacity = '0'
            document.body.appendChild(ta)
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
          }
          setState('copied')
        } catch {
          setState('failed')
        }
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setState('idle'), 1600)
      }}
    >
      {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}
    </button>
  )
}

function Tree({ rows, id, className = '' }) {
  return (
    <ul className={`tree ${className}`} id={id}>
      {rows.map((row, i) => (
        <li
          key={`${row.path || row.name}-${i}`}
          className={`tree-row tree-${row.kind}`}
          data-verdict={row.verdict || undefined}
          style={{ '--depth': row.depth }}
        >
          <span className="tree-name">{row.name}</span>
          {row.verdict ? <span className="tree-verdict">{VERDICT[row.verdict].short}</span> : null}
          {row.note ? <span className="tree-note">{row.note}</span> : null}
        </li>
      ))}
    </ul>
  )
}

const VERDICT = {
  transform: { short: 'md → html', long: 'transformed and emitted' },
  copy: { short: 'copied', long: 'copied verbatim' },
  partial: { short: 'inlined', long: 'inlined as a partial, never emitted' },
  excluded: { short: 'excluded', long: 'matched include, then removed by exclude' },
  unmatched: { short: 'no match', long: 'no include pattern matched it' },
  outside: { short: 'outside root', long: 'above the configured root, never scanned' },
}

/* ---------- masthead ---------- */

function Replay({ lines, reduced }) {
  const [n, setN] = useState(lines.length)
  useEffect(() => {
    if (reduced) {
      setN(lines.length)
      return undefined
    }
    let i = 0
    setN(0)
    let id = 0
    const step = () => {
      i += 1
      setN(i)
      if (i < lines.length) id = window.setTimeout(step, i <= 2 ? 210 : 95)
    }
    id = window.setTimeout(step, 160)
    return () => window.clearTimeout(id)
  }, [lines, reduced])

  const done = n >= lines.length
  return (
    <div className="replay-out" id="replay-out" role="img" aria-label="Example output of quill build for the current configuration">
      {lines.slice(0, n).map((l, i) => (
        <span className={`replay-line tone-${l.tone}`} key={`${l.text}-${i}`}>
          {l.text}
        </span>
      ))}
      <span className={`replay-caret${done ? ' idle' : ''}`} aria-hidden="true" />
    </div>
  )
}

function Masthead({ r, reduced, lines }) {
  return (
    <header className="masthead" id="masthead">
      <div className="masthead-paper">
        <p className="version">
          <span>v3.2.0</span>
          <span className="dot" aria-hidden="true">·</span>
          <span>MIT</span>
        </p>
        <h1>Quill</h1>
        <p className="tagline">
          A markdown build tool that does one thing: turn a directory of files into a directory
          of files, predictably, and tell you exactly what broke when it cannot.
        </p>
        <p className="manifest" id="manifest">
          <span className="manifest-io">
            <code>{r.config.root}</code>
            <span className="arrow-inline" aria-hidden="true">→</span>
            <code>{r.config.output}</code>
          </span>
          <span className="manifest-counts">
            {r.counts.scanned} scanned<span className="dot" aria-hidden="true">·</span>
            {r.counts.emitted} emitted<span className="dot" aria-hidden="true">·</span>
            {r.counts.skipped + r.counts.outOfScope} skipped
          </span>
        </p>
        <p className="masthead-hint">
          Every number on this page comes from the bench in{' '}
          <a href="#config">Configuration</a>. Change a key there and the whole page re-resolves.
        </p>
      </div>

      <div className="masthead-terminal" id="masthead-terminal">
        <div className="term-bar">
          <span className="term-title">~/docs</span>
          <span className={`term-status status-${r.failed ? 'fail' : 'ok'}`}>
            {r.failed ? 'exit 1' : 'exit 0'}
          </span>
        </div>
        <Replay lines={lines} reduced={reduced} />
      </div>
    </header>
  )
}

/* ---------- install ---------- */

function Install() {
  const [installer, setInstaller] = useState('npm')
  const methods = Object.keys(INSTALLERS)
  return (
    <section className="doc-section" id="install">
      <SectionHead
        title="Installation"
        lede="Four ways in. They install the same v3.2.0 binary; pick the one your machine already manages."
      />
      <div className="split split-install">
        <div className="col-src">
          <div className="tabs" role="tablist" aria-label="Install method">
            {methods.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                id={`tab-${k}`}
                aria-selected={installer === k}
                aria-controls="install-command"
                className={installer === k ? 'tab active' : 'tab'}
                onClick={() => setInstaller(k)}
              >
                <span className="tab-name">{k}</span>
                <span className="tab-meta">{METHOD_META[k]}</span>
              </button>
            ))}
          </div>
        </div>
        <span className="split-arrow" aria-hidden="true">→</span>
        <div className="col-out">
          <pre className="code code-ink" data-install={installer} id="install-command" role="tabpanel" aria-labelledby={`tab-${installer}`}>
            <code>{INSTALLERS[installer]}</code>
            <CopyButton text={INSTALLERS[installer]} />
          </pre>
          <p className="note">
            Requires Node 20 or newer. The curl installer places a static binary in /usr/local/bin.
          </p>
        </div>
      </div>
    </section>
  )
}

const METHOD_META = {
  npm: 'global, needs Node 20+',
  pnpm: 'global, needs Node 20+',
  brew: 'macOS / Linuxbrew',
  curl: 'static binary, no Node',
}

/* ---------- quickstart ---------- */

const QUICKSTART = `quill init
echo "# Hello" > index.md
quill build
# → dist/index.html`

function Quickstart() {
  const [ref, shown] = useReveal()
  return (
    <section className="doc-section" id="quickstart">
      <SectionHead title="Quickstart" lede="From an empty directory:" />
      <div className={`split split-quickstart${shown ? ' shown' : ''}`} ref={ref}>
        <div className="col-src">
          <pre className="code code-ink">
            <code>{QUICKSTART}</code>
            <CopyButton text={QUICKSTART} />
          </pre>
        </div>
        <span className="split-arrow" aria-hidden="true">→</span>
        <div className="col-out">
          <p className="col-label">after the third line</p>
          <Tree
            className="tree-result"
            rows={[
              { name: 'dist/', depth: 0, kind: 'root' },
              { name: 'index.html', depth: 1, kind: 'file', note: 'from index.md' },
            ]}
          />
          <p className="col-label">still on disk</p>
          <Tree
            className="tree-result tree-quiet"
            rows={[
              { name: './', depth: 0, kind: 'root' },
              { name: 'quill.config.js', depth: 1, kind: 'file', note: 'written by quill init' },
              { name: 'index.md', depth: 1, kind: 'file' },
            ]}
          />
        </div>
      </div>
      <p className="prose">
        Quill reads <code>quill.config.js</code>, expands <code>include</code>, subtracts{' '}
        <code>exclude</code>, and transforms what remains. There is no plugin resolution step
        and no implicit configuration merging: what is in the file is what runs.
      </p>
    </section>
  )
}

/* ---------- the bench (peak) ---------- */

function Bench({ config, setConfig, r }) {
  const srcRows = useMemo(() => {
    const rows = toTree(
      r.files.map((f) => ({ ...f, path: f.rel })),
      r.config.root === '.' ? './' : `${r.config.root}/`,
    )
    if (r.outOfScope.length) {
      rows.push({
        name: `${r.outOfScope.length} files above root`,
        depth: 1,
        kind: 'file',
        verdict: 'outside',
      })
    }
    return rows
  }, [r])

  const outRows = useMemo(
    () =>
      r.emitted.length
        ? toTree(
            r.emitted.map((f) => ({ path: f.out, from: f.rel })),
            `${r.outDir}/`,
          ).map((row) => (row.from ? { ...row, note: `from ${row.from}` } : row))
        : [{ name: `${r.outDir}/`, depth: 0, kind: 'root' }],
    [r],
  )

  const dirty = CONFIG_KEYS.filter((k) => !same(config[k.key], DEFAULT_CONFIG[k.key]))

  return (
    <div className="bench" id="bench">
      <div className="bench-head">
        <p className={`bench-status status-${r.failed ? 'fail' : r.emitted.length ? 'ok' : 'idle'}`}>
          {r.failed
            ? 'build failed'
            : r.emitted.length
              ? `built ${r.counts.emitted} files in ${r.durationMs}ms`
              : 'nothing to build'}
        </p>
        <p className="bench-counts">
          <span className="bench-count" data-count="scanned">{r.counts.scanned} scanned</span>
          <span className="bench-count" data-count="matched">{r.counts.matched} matched</span>
          <span className="bench-count" data-count="emitted">{r.counts.emitted} emitted</span>
          <span className="bench-count" data-count="inlined">{r.counts.inlined} inlined</span>
        </p>
        <button
          type="button"
          className="bench-reset"
          onClick={() => setConfig(DEFAULT_CONFIG)}
          disabled={dirty.length === 0}
        >
          {dirty.length ? `Reset ${dirty.length} changed` : 'Defaults'}
        </button>
      </div>

      <div className="bench-body">
        <div className="bench-pane">
          <p className="pane-label">
            your files<span className="pane-sub">source</span>
          </p>
          <Tree rows={srcRows} id="bench-src" className="tree-source" />
        </div>

        <div className="bench-controls" id="bench-controls">
          <p className="pane-label pane-label-mid">
            quill.config.js<span className="pane-sub">the transform</span>
          </p>
          {CONFIG_KEYS.map((k) => {
            const isDefault = same(config[k.key], DEFAULT_CONFIG[k.key])
            return (
              <div className="ctl" key={k.key} data-key={k.key} data-default={isDefault}>
                <p className="ctl-key">
                  <code>{k.key}</code>
                  <span className="ctl-type">{k.type}</span>
                </p>
                <div className="ctl-opts" role="group" aria-label={`${k.key} value`}>
                  {k.options.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      className="ctl-opt"
                      aria-pressed={same(config[k.key], o.value)}
                      onClick={() => setConfig((c) => ({ ...c, [k.key]: o.value }))}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="bench-pane">
          <p className="pane-label">
            {r.outDir}/<span className="pane-sub">result</span>
          </p>
          <div className={`out-wrap${r.failed ? ' failed' : ''}`}>
            <Tree rows={outRows} id="bench-out" className="tree-result" />
            {r.failed ? (
              <p className="out-fail">
                strict is on — {r.warnings.length} warning became an error, so nothing was written
              </p>
            ) : null}
            {!r.failed && r.emitted.length === 0 ? (
              <p className="out-fail out-empty">no file matched include under this root</p>
            ) : null}
          </div>
        </div>
      </div>

      <ul className="legend" aria-label="File verdicts">
        {['transform', 'copy', 'partial', 'excluded', 'unmatched'].map((v) => (
          <li key={v} data-verdict={v}>
            <span className="legend-swatch" aria-hidden="true" />
            {VERDICT[v].long}
          </li>
        ))}
      </ul>
      {r.config.concurrency !== 1 ? (
        <p className="bench-foot">
          concurrency is {r.config.concurrency}, so emit order is not stable between runs — the
          log above interleaves. Set it to 1 to make it deterministic.
        </p>
      ) : (
        <p className="bench-foot">concurrency is 1: files are emitted in a stable, sorted order.</p>
      )}
    </div>
  )
}

function same(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => v === b[i])
  return a === b
}

function Config({ config, setConfig, r }) {
  return (
    <section className="doc-section" id="config">
      <SectionHead
        title="Configuration"
        lede="Every key is optional. Unknown keys are an error rather than a warning, so a typo fails the build instead of silently doing nothing. Change any of the six below and watch the same eleven files land differently."
      />
      <Bench config={config} setConfig={setConfig} r={r} />

      <h3 className="sub-head">Reference</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th scope="col">Key</th>
            <th scope="col">Type</th>
            <th scope="col">Default</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {CONFIG_KEYS.map((c) => (
            <tr key={c.key} data-key={c.key} data-changed={!same(config[c.key], DEFAULT_CONFIG[c.key])}>
              <th scope="row">
                <code>{c.key}</code>
              </th>
              <td>
                <code>{c.type}</code>
              </td>
              <td>
                <code>{c.def}</code>
              </td>
              <td>{c.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

/* ---------- commands ---------- */

function resolveFlag(flag, r) {
  if (flag === '--out <dir>') return `--out ${r.config.output}`
  if (flag === '--port <n>') return '--port 4173'
  if (flag === '--template <name>') return '--template minimal'
  return flag
}

function effectOf(cmd, active, r) {
  const strict = active.has('--strict') || r.config.strict
  const out = r.config.output
  switch (cmd) {
    case 'quill build':
      return r.failed && strict
        ? `exits 1 — ${r.warnings.length} warning is fatal under strict`
        : `writes ${r.counts.emitted} files to ${out}/${active.has('--no-clean') ? ', keeping what is already there' : ', clearing it first'}`
    case 'quill watch':
      return `holds open, rebuilds the ${r.counts.emitted} emitted files on change${active.has('--port <n>') ? ', serving on :4173' : ''}${active.has('--open') ? ', opening a browser' : ''}`
    case 'quill check':
      return `reads ${r.counts.matched} matched files, writes nothing${active.has('--json') ? ', prints machine-readable findings' : ''}${strict ? '; exits 1 on any warning' : ''}`
    case 'quill init':
      return `writes quill.config.js into ${r.config.root}/${active.has('--force') ? ', overwriting an existing one' : ' unless one exists'}`
    default:
      return ''
  }
}

function CommandRow({ spec, r }) {
  const [active, setActive] = useState(() => new Set(spec.initial))
  const invocation = [spec.cmd, ...spec.flags.filter((f) => active.has(f)).map((f) => resolveFlag(f, r))].join(' ')
  return (
    <li className="command" data-cmd={spec.cmd}>
      <div className="split split-command">
        <div className="col-src">
          <h3>
            <span
              className="command-mark"
              aria-hidden="true"
              style={{ backgroundImage: COMMAND_MARKS[spec.cmd] }}
            />
            <code>{spec.cmd}</code>
          </h3>
          <p className="command-desc">{spec.desc}</p>
          <div className="flags" role="group" aria-label={`${spec.cmd} flags`}>
            {spec.flags.map((f) => (
              <button
                key={f}
                type="button"
                className="flag"
                aria-pressed={active.has(f)}
                onClick={() =>
                  setActive((prev) => {
                    const next = new Set(prev)
                    if (next.has(f)) next.delete(f)
                    else next.add(f)
                    return next
                  })
                }
              >
                <code>{f}</code>
              </button>
            ))}
          </div>
        </div>
        <span className="split-arrow" aria-hidden="true">→</span>
        <div className="col-out">
          <p className="col-label">as it would run</p>
          <pre className="code code-ink code-invocation">
            <code data-invocation={spec.cmd}>
              <span className="prompt" aria-hidden="true">$ </span>
              {invocation}
            </code>
            <CopyButton text={invocation} />
          </pre>
          <p className="command-effect">{effectOf(spec.cmd, active, r)}</p>
        </div>
      </div>
    </li>
  )
}

function Commands({ r }) {
  return (
    <section className="doc-section" id="commands">
      <SectionHead
        title="Command reference"
        lede="Four commands. Toggle a flag to see the invocation it produces; --out and --strict already carry the config you set above."
      />
      <ul className="commands">
        {COMMANDS.map((c) => (
          <CommandRow spec={c} r={r} key={c.cmd} />
        ))}
      </ul>
    </section>
  )
}

/* ---------- errors ---------- */

function Errors({ r }) {
  const [open, setOpen] = useState('E_NO_CONFIG')
  return (
    <section className="doc-section" id="errors">
      <SectionHead
        title="Common errors"
        lede="Quill prints the code, the message, and the place it stopped. All three are recoverable without reading source."
        aside={
          <p className={`errors-status status-${r.failed ? 'fail' : 'ok'}`}>
            bench build: {r.failed ? 'failing' : 'clean'}
            <span className="dot" aria-hidden="true">·</span>
            root <code>{r.config.root}</code>
            <span className="dot" aria-hidden="true">·</span>
            out <code>{r.config.output}</code>
          </p>
        }
      />
      <dl className="errors">
        {ERRORS.map((e) => {
          const isOpen = open === e.code
          return (
            <div className="error" key={e.code} data-error={e.code} data-open={isOpen}>
              <dt>
                <button
                  type="button"
                  className="error-toggle"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? '' : e.code)}
                >
                  <code className="error-code">{e.code}</code>
                  <span className="error-msg">{e.msg}</span>
                  <span className="error-chev" aria-hidden="true">↓</span>
                </button>
              </dt>
              <dd>
                <div className="error-inner">
                  <pre className="frame" aria-label={`Where ${e.code} stops the build`}>
                    {e.frame(r).map((l, i) => (
                      <span className={`frame-line fl-${l.tone}`} key={i}>
                        {l.text}
                      </span>
                    ))}
                  </pre>
                  <p className="error-fix">
                    <span className="fix-label">Fix</span>
                    {e.fix}
                  </p>
                </div>
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

/* ---------- shell ---------- */

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const r = useMemo(() => resolve(config), [config])
  const lines = useMemo(() => buildLog(r), [r])
  const reduced = useReducedMotion()
  const ids = useMemo(() => NAV.map((n) => n.id), [])
  const active = useActiveSection(ids)

  const scrollTo = useCallback((e, id) => {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: 'auto', block: 'start' })
    history.replaceState(null, '', `#${id}`)
  }, [])

  return (
    <div className="page">
      <nav className="nav" id="site-nav" aria-label="Main">
        <a className="nav-logo" href="#top" onClick={(e) => scrollTo(e, 'top')}>
          Quill
          <span className="nav-ver">3.2.0</span>
        </a>
        <div className="nav-links">
          {NAV.map((n) => (
            <a href={`#${n.id}`} key={n.id} aria-current={active === n.id ? 'true' : undefined} onClick={(e) => scrollTo(e, n.id)}>
              {n.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="layout" id="top">
        <aside className="sidebar" id="sidebar" aria-label="On this page">
          <p className="sidebar-title">On this page</p>
          <ul>
            {NAV.map((n) => (
              <li key={n.id} data-active={active === n.id}>
                <a href={`#${n.id}`} aria-current={active === n.id ? 'true' : undefined} onClick={(e) => scrollTo(e, n.id)}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="sidebar-state" aria-live="polite">
            <p className="sidebar-state-title">bench config</p>
            <p>
              <code>{r.config.root}</code>
              <span className="arrow-inline" aria-hidden="true">→</span>
              <code>{r.config.output}</code>
            </p>
            <p className={`sidebar-state-line status-${r.failed ? 'fail' : 'ok'}`}>
              {r.counts.emitted} emitted{r.config.strict ? ' · strict' : ''}
            </p>
          </div>
        </aside>

        <main className="content">
          <Masthead r={r} reduced={reduced} lines={lines} />
          <Install />
          <Quickstart />
          <Config config={config} setConfig={setConfig} r={r} />
          <Commands r={r} />
          <Errors r={r} />

          <footer className="footer" id="site-footer">
            <p>© 2026 Quill contributors — MIT licensed</p>
            <div className="footer-links">
              <a href="#top" onClick={(e) => scrollTo(e, 'top')}>Top</a>
              <a href="/changelog">Changelog</a>
              <a href="https://github.com/quill-sh/quill">GitHub</a>
              <a href="/discord">Discord</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
