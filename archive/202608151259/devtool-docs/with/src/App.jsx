import { useMemo, useState } from 'react'
import { useReveal, useScrollSpy, useRailFollow } from './hooks.js'
import {
  resolve,
  INCLUDE_CHOICES,
  EXCLUDE_CHOICES,
  ROOT_CHOICES,
  OUTPUT_CHOICES,
} from './workbench.js'

const NAV = [
  { id: 'install', label: 'Installation' },
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'config', label: 'Configuration' },
  { id: 'commands', label: 'Command reference' },
  { id: 'errors', label: 'Common errors' },
]

const INDEX_META = {
  install: '4 methods · Node 20+',
  quickstart: '4 lines, empty directory to dist/',
  config: '6 keys, all optional',
  commands: '4 commands · 9 flags',
  errors: '3 codes and their fixes',
}

const INSTALLERS = {
  npm: 'npm install -g quill-cli',
  pnpm: 'pnpm add -g quill-cli',
  brew: 'brew install quill',
  curl: 'curl -fsSL https://quill.sh/install | sh',
}

const INSTALL_NOTE = {
  npm: 'global bin, follows your node version',
  pnpm: 'global bin, hard-linked store',
  brew: 'macOS and Linuxbrew, static binary',
  curl: 'no package manager required',
}

const CONFIG_KEYS = [
  { key: 'root', type: 'string', def: '"."', desc: 'Directory Quill treats as the project root. All other paths resolve from here.' },
  { key: 'include', type: 'string[]', def: '["**/*.md"]', desc: 'Glob patterns to process. Later patterns override earlier ones.' },
  { key: 'exclude', type: 'string[]', def: '["node_modules/**"]', desc: 'Glob patterns to skip, applied after include.' },
  { key: 'output', type: 'string', def: '"./dist"', desc: 'Where built artefacts are written. Cleared on every build unless --no-clean is passed.' },
  { key: 'strict', type: 'boolean', def: 'false', desc: 'Treat warnings as errors. Recommended in CI.' },
  { key: 'concurrency', type: 'number', def: 'os.cpus().length', desc: 'Maximum parallel file transforms. Set to 1 to make output ordering deterministic.' },
]

const COMMANDS = [
  { cmd: 'quill build', desc: 'Transform every included file once and exit.', flags: ['--no-clean', '--strict', '--out <dir>'] },
  { cmd: 'quill watch', desc: 'Rebuild affected files when they change. Holds the process open.', flags: ['--port <n>', '--open'] },
  { cmd: 'quill check', desc: 'Validate links, front matter, and references without writing output.', flags: ['--strict', '--json'] },
  { cmd: 'quill init', desc: 'Write a starter quill.config.js into the current directory.', flags: ['--force', '--template <name>'] },
]

const ERRORS = [
  { code: 'E_NO_CONFIG', msg: 'No quill.config.js found', fix: 'Run quill init, or pass --config with an explicit path. Quill does not search parent directories above the git root.' },
  { code: 'E_CIRCULAR_REF', msg: 'Circular include detected', fix: 'A file includes itself through a chain of partials. Run quill check --json to print the full cycle.' },
  { code: 'E_STALE_LOCK', msg: 'Build lock held by dead process', fix: 'A previous build was killed. Delete .quill/lock and rerun. This is safe when no other build is active.' },
]

const SECTION_IDS = NAV.map((n) => n.id)

/* ---------- small controls, one grammar across the workbench ---------- */

function Segment({ options, value, onChange, name }) {
  return (
    <div className="segment" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          className="segment-opt"
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function ChipSet({ options, value, onToggle, name }) {
  return (
    <div className="chipset" role="group" aria-label={name}>
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            className="chip"
            onClick={() => onToggle(o)}
          >
            <span className="chip-mark" aria-hidden="true" />
            {o}
          </button>
        )
      })}
    </div>
  )
}

function Switch({ value, onChange, name }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={name}
      className="switch"
      onClick={() => onChange(!value)}
    >
      <span className="switch-track" aria-hidden="true">
        <span className="switch-knob" />
      </span>
      <span className="switch-label">{String(value)}</span>
    </button>
  )
}

function Stepper({ value, onChange }) {
  const isAuto = value === 'auto'
  const n = isAuto ? 4 : value
  return (
    <div className="stepper">
      <button
        type="button"
        className="step-btn"
        aria-label="Fewer parallel transforms"
        disabled={!isAuto && n <= 1}
        onClick={() => onChange(Math.max(1, n - 1))}
      >
        −
      </button>
      <span className="step-value">{isAuto ? 'os.cpus().length' : n}</span>
      <button
        type="button"
        className="step-btn"
        aria-label="More parallel transforms"
        disabled={!isAuto && n >= 8}
        onClick={() => onChange(Math.min(8, n + 1))}
      >
        +
      </button>
      <button
        type="button"
        className="step-auto"
        disabled={isAuto}
        onClick={() => onChange('auto')}
      >
        auto
      </button>
    </div>
  )
}

/* ---------- the signature component: the config workbench ---------- */

function Workbench() {
  const [config, setConfig] = useState({
    root: '.',
    include: ['**/*.md'],
    exclude: ['node_modules/**'],
    output: './dist',
    strict: false,
    concurrency: 'auto',
  })

  const set = (k, v) => setConfig((c) => ({ ...c, [k]: v }))
  const toggle = (k, v) =>
    setConfig((c) => ({
      ...c,
      [k]: c[k].includes(v) ? c[k].filter((x) => x !== v) : [...c[k], v],
    }))

  const workers = config.concurrency === 'auto' ? 4 : config.concurrency
  const { rows, built, failed, warnings } = useMemo(() => resolve(config), [config])
  const skipped = rows.length - built - failed

  const controls = {
    root: <Segment name="root" options={ROOT_CHOICES} value={config.root} onChange={(v) => set('root', v)} />,
    include: <ChipSet name="include" options={INCLUDE_CHOICES} value={config.include} onToggle={(v) => toggle('include', v)} />,
    exclude: <ChipSet name="exclude" options={EXCLUDE_CHOICES} value={config.exclude} onToggle={(v) => toggle('exclude', v)} />,
    output: <Segment name="output" options={OUTPUT_CHOICES} value={config.output} onChange={(v) => set('output', v)} />,
    strict: <Switch name="strict" value={config.strict} onChange={(v) => set('strict', v)} />,
    concurrency: <Stepper value={config.concurrency} onChange={(v) => set('concurrency', v)} />,
  }

  const source = [
    'export default {',
    `  root: ${JSON.stringify(config.root)},`,
    `  include: [${config.include.map((s) => JSON.stringify(s)).join(', ')}],`,
    `  exclude: [${config.exclude.map((s) => JSON.stringify(s)).join(', ')}],`,
    `  output: ${JSON.stringify(config.output)},`,
    `  strict: ${config.strict},`,
    `  concurrency: ${config.concurrency === 'auto' ? 'os.cpus().length' : config.concurrency},`,
    '}',
  ].join('\n')

  let verdict
  if (failed > 0) {
    verdict = `build failed — ${failed} warning promoted to error by strict`
  } else if (built === 0) {
    verdict = 'nothing to do — 0 files matched include'
  } else if (warnings > 0) {
    verdict = `built ${built} file${built === 1 ? '' : 's'} with ${warnings} warning`
  } else {
    verdict = `built ${built} file${built === 1 ? '' : 's'}`
  }

  return (
    <div className="workbench" id="workbench">
      <div className="wb-keys">
        <p className="wb-cap">
          <span className="wb-cap-n">A</span> quill.config.js — every key is optional
        </p>
        <dl className="wb-list">
          {CONFIG_KEYS.map((c) => (
            <div className="wb-key" key={c.key} data-key={c.key}>
              <dt>
                <code className="wb-name">{c.key}</code>
                <code className="wb-type">{c.type}</code>
                <span className="wb-def">
                  default <code>{c.def}</code>
                </span>
              </dt>
              <dd>
                <p className="wb-desc">{c.desc}</p>
                <div className="wb-ctl">{controls[c.key]}</div>
              </dd>
            </div>
          ))}
        </dl>
        <pre className="wb-source" aria-label="Resulting quill.config.js">
          <code>{source}</code>
        </pre>
      </div>

      <div className="wb-out">
        <div className="wb-out-inner">
          <p className="wb-cap wb-cap-dark">
            <span className="wb-cap-n">B</span> what quill build does with it
          </p>
          <div className="term term-out">
            <p className="term-line term-prompt">
              <span className="term-sigil">$</span> quill build
            </p>
            <ul className="wb-files">
              {rows.map((r) => (
                <li key={r.path} className="wb-file" data-state={r.state}>
                  <span className="wb-glyph" aria-hidden="true" />
                  <span className="wb-path">{r.path}</span>
                  <span className="wb-detail">{r.detail}</span>
                </li>
              ))}
            </ul>
            <p className="wb-verdict" data-failed={failed > 0} data-empty={built === 0}>
              {verdict}
            </p>
            <p className="wb-meta">
              {built + failed} in scope · {skipped} skipped ·{' '}
              {workers === 1
                ? '1 transform — deterministic order'
                : `${workers} parallel transforms`}
              {config.strict ? ' · strict' : ''}
            </p>
          </div>
          <p className="wb-hint">
            Sample project. Change a key on the left and the file list is re-resolved with the
            same four steps the CLI uses.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ---------- page ---------- */

export default function App() {
  const [installer, setInstaller] = useState('npm')
  const [copied, setCopied] = useState(false)
  const active = useScrollSpy(SECTION_IDS)
  const railRef = useRailFollow(active)
  useReveal()

  function copy(text) {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="page">
      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#top">
          <span className="nav-mark" aria-hidden="true" />
          Quill
        </a>
        <div className="nav-links">
          {NAV.map((n) => (
            <a href={`#${n.id}`} key={n.id} data-active={active === n.id}>
              {n.label}
            </a>
          ))}
        </div>
        <span className="nav-ver">v3.2.0</span>
      </nav>

      <header className="masthead" id="top">
        <div className="mast-type">
          <p className="mast-meta">v3.2.0 · MIT · Node 20+</p>
          <h1>Quill</h1>
          <p className="tagline">
            A markdown build tool that does one thing: turn a directory of files into a directory
            of files, predictably, and tell you exactly what broke when it cannot.
          </p>
        </div>
        <ol className="mast-index" aria-label="Contents">
          {NAV.map((n, i) => (
            <li key={n.id}>
              <a href={`#${n.id}`} data-active={active === n.id}>
                <span className="mi-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="mi-label">{n.label}</span>
                <span className="mi-meta">{INDEX_META[n.id]}</span>
              </a>
            </li>
          ))}
        </ol>
      </header>

      <div className="layout">
        <aside className="sidebar" id="sidebar">
          <p className="sidebar-title">On this page</p>
          <ul ref={railRef} className="rail">
            {NAV.map((n, i) => (
              <li key={n.id} data-rail={n.id}>
                <a href={`#${n.id}`} data-active={active === n.id}>
                  <span className="rail-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="rail-label">{n.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <main className="content">
          <section className="doc-section" id="install" data-reveal="out">
            <div className="sec-head">
              <span className="sec-n">01</span>
              <h2>Installation</h2>
              <p className="sec-lede">Pick a package manager. The binary is the same.</p>
            </div>

            <div className="install">
              <div className="tabs" role="tablist" aria-label="Install method">
                {Object.keys(INSTALLERS).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={installer === k}
                    className={installer === k ? 'tab active' : 'tab'}
                    onClick={() => setInstaller(k)}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <pre className="code term" data-install={installer}>
                <span className="term-sigil" aria-hidden="true">
                  $
                </span>
                <code key={installer}>{INSTALLERS[installer]}</code>
                <button
                  type="button"
                  className="copy"
                  onClick={() => copy(INSTALLERS[installer])}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </pre>
              <p className="install-note">
                <span className="in-tag">{installer}</span>
                {INSTALL_NOTE[installer]}
              </p>
            </div>

            <p className="note">
              Requires Node 20 or newer. The curl installer places a static binary in
              /usr/local/bin.
            </p>
          </section>

          <section className="doc-section" id="quickstart" data-reveal="out">
            <div className="sec-head">
              <span className="sec-n">02</span>
              <h2>Quickstart</h2>
              <p className="sec-lede">From an empty directory:</p>
            </div>

            <div className="quick">
              <pre className="code term term-block">
                <code>{`quill init
echo "# Hello" > index.md
quill build
# → dist/index.html`}</code>
              </pre>
              <p className="quick-prose">
                Quill reads <code>quill.config.js</code>, expands <code>include</code>, subtracts{' '}
                <code>exclude</code>, and transforms what remains. There is no plugin resolution
                step and no implicit configuration merging: what is in the file is what runs.
              </p>
            </div>
          </section>

          <section className="doc-section section-peak" id="config" data-reveal="out">
            <div className="sec-head">
              <span className="sec-n">03</span>
              <h2>Configuration</h2>
              <p className="sec-lede">
                Every key is optional. Unknown keys are an error rather than a warning, so a typo
                fails the build instead of silently doing nothing.
              </p>
            </div>
            <Workbench />
          </section>

          <section className="doc-section" id="commands" data-reveal="out">
            <div className="sec-head">
              <span className="sec-n">04</span>
              <h2>Command reference</h2>
              <p className="sec-lede">Four commands. Flags are listed in full.</p>
            </div>
            <ul className="commands">
              {COMMANDS.map((c, i) => (
                <li
                  className={i === 0 ? 'command command-primary' : 'command'}
                  key={c.cmd}
                  data-cmd={c.cmd}
                >
                  <div className="cmd-main">
                    <h3>
                      <code>{c.cmd}</code>
                    </h3>
                    <p>{c.desc}</p>
                  </div>
                  <p className="flags">
                    {c.flags.map((f) => (
                      <code key={f}>{f}</code>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="doc-section" id="errors" data-reveal="out">
            <div className="sec-head">
              <span className="sec-n">05</span>
              <h2>Common errors</h2>
              <p className="sec-lede">What Quill prints, and what to do about it.</p>
            </div>
            <dl className="errors">
              {ERRORS.map((e) => (
                <div className="error" key={e.code} data-error={e.code}>
                  <dt>
                    <code className="err-code">{e.code}</code>
                    <span className="err-msg">{e.msg}</span>
                  </dt>
                  <dd>{e.fix}</dd>
                </div>
              ))}
            </dl>
          </section>
        </main>
      </div>

      <footer className="footer" id="site-footer">
        <p>© 2026 Quill contributors — MIT licensed</p>
        <div className="footer-links">
          <a href="#top">Top</a>
          <a href="/changelog">Changelog</a>
          <a href="https://github.com/quill-sh/quill">GitHub</a>
          <a href="/discord">Discord</a>
        </div>
      </footer>
    </div>
  )
}
