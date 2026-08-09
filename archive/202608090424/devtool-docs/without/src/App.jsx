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

const QUICKSTART = `quill init
echo "# Hello" > index.md
quill build
# → dist/index.html`

const INSTALL_NOTE = {
  npm: 'Installs the JavaScript package globally.',
  pnpm: 'Same package, resolved through the pnpm global store.',
  brew: 'macOS and Linuxbrew. Ships the static binary.',
  curl: 'No Node required — the script drops a static binary in place.',
}

function useCopy() {
  const [copiedId, setCopiedId] = useState(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback((id, text) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopiedId(null), 1600)
  }, [])

  return [copiedId, copy]
}

function CopyButton({ id, text, copiedId, onCopy }) {
  const done = copiedId === id
  return (
    <button
      type="button"
      className={done ? 'copy is-done' : 'copy'}
      onClick={() => onCopy(id, text)}
      aria-label={done ? 'Copied to clipboard' : 'Copy to clipboard'}
    >
      <span className="copy-face" aria-hidden="true">
        {done ? '✓' : '⧉'}
      </span>
      <span className="copy-label">{done ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

function SectionHead({ index, id, title, kicker }) {
  return (
    <div className="sec-head">
      <span className="sec-index" aria-hidden="true">
        {String(index).padStart(2, '0')}
      </span>
      <div>
        <h2 id={`${id}-title`}>{title}</h2>
        {kicker ? <p className="sec-kicker">{kicker}</p> : null}
      </div>
    </div>
  )
}

export default function App() {
  const [installer, setInstaller] = useState('npm')
  const [copiedId, copy] = useCopy()
  const [active, setActive] = useState(NAV[0].id)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(Boolean)
    if (!sections.length) return

    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      setProgress(max > 0 ? Math.min(1, doc.scrollTop / max) : 0)

      const line = doc.clientHeight * 0.3
      let current = sections[0].id
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= line) current = s.id
      }
      setActive(current)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="page">
      <div className="grain" aria-hidden="true" />

      <nav className="nav" id="site-nav">
        <div className="nav-inner">
          <a className="nav-logo" href="#top">
            <span className="mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20c6.5 0 15-4 16-16-8 1-13 5-14 11l-2 5Z" />
                <path d="M8.5 15.5 15 9" />
              </svg>
            </span>
            <span className="nav-word">Quill</span>
            <span className="nav-ver">v3.2.0</span>
          </a>
          <div className="nav-links">
            {NAV.map((n) => (
              <a href={`#${n.id}`} key={n.id} className={active === n.id ? 'is-active' : undefined}>
                {n.label}
              </a>
            ))}
          </div>
        </div>
        <div className="nav-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-inner">
          <div className="hero-copy">
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
            <div className="hero-actions">
              <a className="btn btn-primary" href="#quickstart">
                Read the quickstart
              </a>
              <a className="btn" href="https://github.com/quill-sh/quill">
                View source
              </a>
            </div>
          </div>

          <div className="terminal" aria-hidden="true">
            <div className="terminal-bar">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              <span className="terminal-name">~/docs — quill build</span>
            </div>
            <pre className="terminal-body">
              <span className="t-dim">$</span> quill build{'\n'}
              <span className="t-ok">✓</span> resolved <span className="t-num">128</span> files{'\n'}
              <span className="t-ok">✓</span> transformed <span className="t-num">128</span>{' '}
              <span className="t-dim">(8 workers)</span>
              {'\n'}
              <span className="t-warn">!</span> 1 warning{' '}
              <span className="t-dim">— run with --strict to fail</span>
              {'\n'}
              <span className="t-ok">✓</span> wrote <span className="t-accent">dist/</span>{' '}
              <span className="t-dim">in</span> <span className="t-num">412ms</span>
            </pre>
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar" id="sidebar">
          <p className="sidebar-title">On this page</p>
          <ul>
            {NAV.map((n, i) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className={active === n.id ? 'is-active' : undefined}>
                  <span className="side-num">{String(i + 1).padStart(2, '0')}</span>
                  <span>{n.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="sidebar-foot">
            Stuck? Jump to <a href="#errors">common errors</a>.
          </p>
        </aside>

        <main className="content">
          <section className="doc-section" id="install" aria-labelledby="install-title">
            <SectionHead index={1} id="install" title="Installation" kicker="Pick a package manager. The commands are equivalent." />

            <div className="install-card">
              <div className="tabs" role="tablist" aria-label="Install method">
                <div className="tabs-track">
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
                  <span
                    className="tabs-thumb"
                    aria-hidden="true"
                    style={{
                      width: 'calc((100% - 8px) / 4)',
                      left: `calc(${Object.keys(INSTALLERS).indexOf(installer)} * (100% - 8px) / 4 + 4px)`,
                    }}
                  />
                </div>
              </div>

              <pre className="code code-install" data-install={installer}>
                <span className="prompt" aria-hidden="true">
                  $
                </span>
                <code>{INSTALLERS[installer]}</code>
                <CopyButton id="install" text={INSTALLERS[installer]} copiedId={copiedId} onCopy={copy} />
              </pre>

              <p className="install-hint">{INSTALL_NOTE[installer]}</p>
            </div>

            <p className="note">
              Requires Node 20 or newer. The curl installer places a static binary in /usr/local/bin.
            </p>
          </section>

          <section className="doc-section" id="quickstart" aria-labelledby="quickstart-title">
            <SectionHead index={2} id="quickstart" title="Quickstart" kicker="Four lines from empty directory to built output." />
            <p>From an empty directory:</p>
            <pre className="code code-block">
              <code>{QUICKSTART}</code>
              <CopyButton id="quickstart" text={QUICKSTART} copiedId={copiedId} onCopy={copy} />
            </pre>
            <p className="prose">
              Quill reads <code>quill.config.js</code>, expands <code>include</code>, subtracts{' '}
              <code>exclude</code>, and transforms what remains. There is no plugin resolution step
              and no implicit configuration merging: what is in the file is what runs.
            </p>
          </section>

          <section className="doc-section" id="config" aria-labelledby="config-title">
            <SectionHead index={3} id="config" title="Configuration" kicker="Six keys. That is the whole surface." />
            <p className="prose">
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
                      <th scope="row">
                        <code className="key">{c.key}</code>
                      </th>
                      <td>
                        <code className="type">{c.type}</code>
                      </td>
                      <td>
                        <code className="def">{c.def}</code>
                      </td>
                      <td>{c.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="doc-section" id="commands" aria-labelledby="commands-title">
            <SectionHead index={4} id="commands" title="Command reference" kicker="Four commands, and their flags." />
            <ul className="commands">
              {COMMANDS.map((c) => (
                <li className="command" key={c.cmd} data-cmd={c.cmd}>
                  <h3>
                    <span className="prompt" aria-hidden="true">
                      $
                    </span>
                    <code>{c.cmd}</code>
                  </h3>
                  <p>{c.desc}</p>
                  <p className="flags">
                    {c.flags.map((f) => (
                      <code key={f}>{f}</code>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="doc-section" id="errors" aria-labelledby="errors-title">
            <SectionHead index={5} id="errors" title="Common errors" kicker="Every failure has a code, and every code has a fix." />
            <dl className="errors">
              {ERRORS.map((e) => (
                <div className="error" key={e.code} data-error={e.code}>
                  <dt>
                    <code>{e.code}</code>
                    <span className="error-msg">{e.msg}</span>
                  </dt>
                  <dd>
                    <span className="fix-label">Fix</span>
                    {e.fix}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </main>
      </div>

      <footer className="footer" id="site-footer">
        <div className="footer-inner">
          <p>© 2026 Quill contributors — MIT licensed</p>
          <div className="footer-links">
            <a href="#top">Top</a>
            <a href="/changelog">Changelog</a>
            <a href="https://github.com/quill-sh/quill">GitHub</a>
            <a href="/discord">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
