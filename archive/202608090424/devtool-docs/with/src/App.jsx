import { useCallback, useEffect, useRef, useState } from 'react'

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

const INDEX = Object.fromEntries(NAV.map((n, i) => [n.id, String(i + 1).padStart(2, '0')]))

function writeToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => legacyCopy(text))
  }
  return Promise.resolve(legacyCopy(text))
}

function legacyCopy(text) {
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  el.style.position = 'fixed'
  el.style.opacity = '0'
  document.body.appendChild(el)
  el.select()
  try {
    document.execCommand('copy')
  } catch {
    /* clipboard unavailable; button falls back to no-op */
  }
  document.body.removeChild(el)
}

/* Marks the section currently under the reading line so the rail always shows
   position in the manifest — the sidebar is a location readout, not decoration. */
function useActiveSection() {
  const [active, setActive] = useState(NAV[0].id)

  useEffect(() => {
    const nodes = NAV.map((n) => document.getElementById(n.id)).filter(Boolean)
    if (!nodes.length) return

    let frame = 0
    const measure = () => {
      frame = 0
      const line = 140 // the reading line, just below the sticky masthead
      let current = nodes[0]
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= line) current = node
      }
      // At the very bottom nothing further can scroll into place; hold the last.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        current = nodes[nodes.length - 1]
      }
      setActive(current.id)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return active
}

function Section({ id, title, lede, children }) {
  return (
    <section className="doc-section" id={id} aria-labelledby={`${id}-title`}>
      <div className="section-head">
        <span className="section-index" aria-hidden="true">{INDEX[id]}</span>
        <h2 id={`${id}-title`}>{title}</h2>
      </div>
      <div className="section-body">
        {lede ? <p className="lede">{lede}</p> : null}
        {children}
      </div>
    </section>
  )
}

export default function App() {
  const [installer, setInstaller] = useState('npm')
  const [copied, setCopied] = useState(null)
  const timer = useRef(null)
  const active = useActiveSection()

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback((text, slot) => {
    writeToClipboard(text)
    setCopied(slot)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 1600)
  }, [])

  return (
    <div className="page">
      <a className="skip" href="#top">Skip to content</a>

      <nav className="nav" id="site-nav" aria-label="Primary">
        <a className="nav-logo" href="#top">
          <span className="nav-mark" aria-hidden="true" />
          Quill
        </a>
        <div className="nav-links">
          {NAV.map((n) => (
            <a href={`#${n.id}`} key={n.id} aria-current={active === n.id ? 'true' : undefined}>
              {n.label}
            </a>
          ))}
        </div>
        <span className="nav-version">v3.2.0</span>
      </nav>

      <div className="layout">
        <aside className="sidebar" id="sidebar" aria-label="On this page">
          <p className="sidebar-title">On this page</p>
          <ul>
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} aria-current={active === n.id ? 'true' : undefined}>
                  <span className="sidebar-num" aria-hidden="true">{INDEX[n.id]}</span>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <main className="content">
          <header className="doc-header" id="top">
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

            <div className="transaction" aria-label="What Quill does: a directory of markdown in, a directory of html out">
              <div className="tx-side">
                <span className="tx-label">in</span>
                <code>docs/**/*.md</code>
              </div>
              <div className="tx-op">
                <span className="tx-rule" aria-hidden="true" />
                <code>quill build</code>
                <span className="tx-rule" aria-hidden="true" />
              </div>
              <div className="tx-side tx-out">
                <span className="tx-label">out</span>
                <code>dist/**/*.html</code>
              </div>
            </div>
          </header>

          <Section
            id="install"
            title="Installation"
            lede="Four routes to the same binary. Pick the one your machine already uses."
          >
            <div className="record record-install">
              <div className="record-key">
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
              </div>
              <div className="record-value">
                <pre className="code" data-install={installer}>
                  <code>{INSTALLERS[installer]}</code>
                  <button
                    type="button"
                    className="copy"
                    onClick={() => copy(INSTALLERS[installer], 'install')}
                  >
                    {copied === 'install' ? 'Copied' : 'Copy'}
                  </button>
                </pre>
                <p className="note">
                  Requires Node 20 or newer. The curl installer places a static binary in
                  {' '}<code>/usr/local/bin</code>.
                </p>
              </div>
            </div>
          </Section>

          <Section id="quickstart" title="Quickstart" lede="From an empty directory:">
            <div className="record">
              <div className="record-key">
                <span className="key-tag">shell</span>
              </div>
              <div className="record-value">
                <pre className="code code-block">
                  <code>{`quill init
echo "# Hello" > index.md
quill build
# → dist/index.html`}</code>
                </pre>
                <p>
                  Quill reads <code>quill.config.js</code>, expands <code>include</code>, subtracts{' '}
                  <code>exclude</code>, and transforms what remains. There is no plugin resolution
                  step and no implicit configuration merging: what is in the file is what runs.
                </p>
              </div>
            </div>
          </Section>

          <Section
            id="config"
            title="Configuration"
            lede="Every key is optional. Unknown keys are an error rather than a warning, so a typo fails the build instead of silently doing nothing."
          >
            <table className="api-table">
              <caption className="sr-only">Configuration keys, their types, defaults, and behaviour</caption>
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
                    <th scope="row">
                      <code>{c.key}</code>
                    </th>
                    <td data-label="Type">
                      <code className="type">{c.type}</code>
                    </td>
                    <td data-label="Default">
                      <code className="def">{c.def}</code>
                    </td>
                    <td className="desc">{c.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section
            id="commands"
            title="Command reference"
            lede="Four commands. Everything Quill can do is on this list."
          >
            <ul className="commands">
              {COMMANDS.map((c) => (
                <li className="command record" key={c.cmd} data-cmd={c.cmd}>
                  <h3 className="record-key">
                    <code>{c.cmd}</code>
                  </h3>
                  <div className="record-value">
                    <p>{c.desc}</p>
                    <p className="flags">
                      {c.flags.map((f) => (
                        <code key={f}>{f}</code>
                      ))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            id="errors"
            title="Common errors"
            lede="Printed verbatim by the CLI. Search this page for the code you were given."
          >
            <dl className="errors">
              {ERRORS.map((e) => (
                <div className="error record" key={e.code} data-error={e.code}>
                  <dt className="record-key">
                    <code>{e.code}</code>
                  </dt>
                  <dd className="record-value">
                    <p className="error-msg">{e.msg}</p>
                    <p className="error-fix">{e.fix}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

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
