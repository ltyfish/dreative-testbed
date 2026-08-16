import { useEffect, useRef, useState } from 'react'

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

const QUICKSTART = `quill init
echo "# Hello" > index.md
quill build
# → dist/index.html`

function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    const seen = new Map()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => seen.set(entry.target.id, entry))
        const visible = [...seen.values()]
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [ids])

  return active
}

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  function copy() {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      className={copied ? 'copy is-copied' : 'copy'}
      onClick={copy}
      aria-label={`${label}: ${text}`}
    >
      <span aria-hidden="true" className="copy-glyph">
        {copied ? '✓' : '⧉'}
      </span>
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function App() {
  const [installer, setInstaller] = useState('npm')
  const active = useScrollSpy(NAV.map((n) => n.id))
  const keys = Object.keys(INSTALLERS)

  function onTabKey(e) {
    const i = keys.indexOf(installer)
    if (e.key === 'ArrowRight') setInstaller(keys[(i + 1) % keys.length])
    if (e.key === 'ArrowLeft') setInstaller(keys[(i - 1 + keys.length) % keys.length])
  }

  return (
    <div className="page">
      <a className="skip" href="#top">Skip to content</a>

      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#top">
          <span className="nav-mark" aria-hidden="true">✒</span>
          <span className="nav-word">Quill</span>
        </a>
        <div className="nav-links">
          {NAV.map((n) => (
            <a href={`#${n.id}`} key={n.id} className={active === n.id ? 'is-active' : undefined}>
              {n.label}
            </a>
          ))}
        </div>
        <a className="nav-cta" href="https://github.com/quill-sh/quill">
          GitHub <span aria-hidden="true">↗</span>
        </a>
      </nav>

      <div className="layout">
        <aside className="sidebar" id="sidebar">
          <p className="sidebar-title">On this page</p>
          <ul>
            {NAV.map((n, i) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className={active === n.id ? 'is-active' : undefined}>
                  <span className="sidebar-num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <main className="content">
          <header className="doc-header" id="top">
            <p className="version">
              <span className="pill">v3.2.0</span>
              <span className="pill pill-quiet">MIT</span>
              <span className="pill pill-quiet">Node 20+</span>
            </p>
            <h1>
              Quill<span className="cursor" aria-hidden="true" />
            </h1>
            <p className="tagline">
              A markdown build tool that does one thing: turn a directory of files into a directory
              of files, predictably, and tell you exactly what broke when it cannot.
            </p>
            <dl className="facts">
              <div>
                <dt>Input</dt>
                <dd>a directory</dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>a directory</dd>
              </div>
              <div>
                <dt>Plugin resolution</dt>
                <dd>none</dd>
              </div>
              <div>
                <dt>Config merging</dt>
                <dd>none</dd>
              </div>
            </dl>
          </header>

          <section className="doc-section" id="install">
            <h2>
              <span className="sec-num" aria-hidden="true">01</span>
              Installation
            </h2>
            <div className="terminal">
              <div className="tabs" role="tablist" aria-label="Install method" onKeyDown={onTabKey}>
                {keys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    tabIndex={installer === k ? 0 : -1}
                    aria-selected={installer === k}
                    className={installer === k ? 'tab active' : 'tab'}
                    onClick={() => setInstaller(k)}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <pre className="code" data-install={installer}>
                <code>
                  <span className="prompt" aria-hidden="true">$ </span>
                  {INSTALLERS[installer]}
                </code>
                <CopyButton text={INSTALLERS[installer]} label="Copy install command" />
              </pre>
            </div>
            <p className="note">
              Requires Node 20 or newer. The curl installer places a static binary in{' '}
              <code>/usr/local/bin</code>.
            </p>
          </section>

          <section className="doc-section" id="quickstart">
            <h2>
              <span className="sec-num" aria-hidden="true">02</span>
              Quickstart
            </h2>
            <p className="lede">From an empty directory:</p>
            <div className="terminal">
              <div className="terminal-bar">
                <span className="dots" aria-hidden="true">
                  <i /><i /><i />
                </span>
                <span className="terminal-name">~/project</span>
              </div>
              <pre className="code">
                <code>{QUICKSTART}</code>
                <CopyButton text={QUICKSTART} label="Copy quickstart" />
              </pre>
            </div>
            <p>
              Quill reads <code>quill.config.js</code>, expands <code>include</code>, subtracts{' '}
              <code>exclude</code>, and transforms what remains. There is no plugin resolution step
              and no implicit configuration merging: what is in the file is what runs.
            </p>
          </section>

          <section className="doc-section" id="config">
            <h2>
              <span className="sec-num" aria-hidden="true">03</span>
              Configuration
            </h2>
            <p className="lede">
              Every key is optional. Unknown keys are an error rather than a warning, so a typo
              fails the build instead of silently doing nothing.
            </p>
            <div className="table-wrap">
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
                    <tr key={c.key} data-key={c.key}>
                      <th scope="row" data-label="Key">
                        <code className="key">{c.key}</code>
                      </th>
                      <td data-label="Type">
                        <code className={`type type-${c.type.replace('[]', 's')}`}>{c.type}</code>
                      </td>
                      <td data-label="Default">
                        <code className="def">{c.def}</code>
                      </td>
                      <td data-label="Description" className="desc">{c.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="doc-section" id="commands">
            <h2>
              <span className="sec-num" aria-hidden="true">04</span>
              Command reference
            </h2>
            <ul className="commands">
              {COMMANDS.map((c) => (
                <li className="command" key={c.cmd} data-cmd={c.cmd}>
                  <h3>
                    <span className="prompt" aria-hidden="true">$ </span>
                    <code>{c.cmd}</code>
                  </h3>
                  <p>{c.desc}</p>
                  <p className="flags">
                    <span className="flags-label" aria-hidden="true">flags</span>
                    {c.flags.map((f) => (
                      <code key={f}>{f}</code>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="doc-section" id="errors">
            <h2>
              <span className="sec-num" aria-hidden="true">05</span>
              Common errors
            </h2>
            <dl className="errors">
              {ERRORS.map((e) => (
                <div className="error" key={e.code} data-error={e.code}>
                  <dt>
                    <code>{e.code}</code>
                    <span className="error-msg">{e.msg}</span>
                  </dt>
                  <dd>
                    <span className="fix-label" aria-hidden="true">fix</span>
                    {e.fix}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <footer className="footer" id="site-footer">
            <p>© 2026 Quill contributors — MIT licensed</p>
            <div className="footer-links">
              <a href="#top">Top</a>
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
