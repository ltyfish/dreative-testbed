import { useCallback, useEffect, useRef, useState } from 'react'

const NAV = [
  { id: 'install', label: 'Installation', num: '01' },
  { id: 'quickstart', label: 'Quickstart', num: '02' },
  { id: 'config', label: 'Configuration', num: '03' },
  { id: 'commands', label: 'Command reference', num: '04' },
  { id: 'errors', label: 'Common errors', num: '05' },
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

/* Highlights a shell transcript: comments, flags, and the leading binary name. */
function Shell({ source }) {
  return (
    <code>
      {source.split('\n').map((line, i) => {
        if (line.startsWith('#')) {
          return (
            <span className="ln" key={i}>
              <span className="tk-comment">{line}</span>
              {'\n'}
            </span>
          )
        }
        const parts = line.split(/(\s+)/)
        return (
          <span className="ln" key={i}>
            {parts.map((p, j) => {
              let cls = ''
              if (j === 0) cls = 'tk-bin'
              else if (p.startsWith('--') || p.startsWith('-') && p.length > 1 && /[a-z]/.test(p[1])) cls = 'tk-flag'
              else if (p.startsWith('"') || p.startsWith("'")) cls = 'tk-str'
              else if (p === '>' || p === '|') cls = 'tk-op'
              return (
                <span className={cls} key={j}>
                  {p}
                </span>
              )
            })}
            {'\n'}
          </span>
        )
      })}
    </code>
  )
}

function useCopy() {
  const [copiedId, setCopiedId] = useState(null)
  const timer = useRef(null)
  const copy = useCallback((text, id) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopiedId(null), 1600)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return [copiedId, copy]
}

function CopyButton({ text, id, copiedId, onCopy, label = 'Copy' }) {
  const done = copiedId === id
  return (
    <button
      type="button"
      className={done ? 'copy is-done' : 'copy'}
      onClick={() => onCopy(text, id)}
      aria-label={done ? 'Copied to clipboard' : `Copy ${label.toLowerCase()}`}
    >
      <span className="copy-face">{done ? 'Copied' : label}</span>
    </button>
  )
}

/* Tracks which section is currently under the reading line. */
function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!nodes.length) return
    const seen = new Map()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e))
        const visible = ids
          .map((id) => seen.get(id))
          .filter((e) => e && e.isIntersecting)
        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin: '-88px 0px -62% 0px', threshold: 0 }
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [ids.join('|')])
  return active
}

export default function App() {
  const [installer, setInstaller] = useState('npm')
  const [copiedId, copy] = useCopy()
  const active = useActiveSection(NAV.map((n) => n.id))
  const activeIndex = Math.max(0, NAV.findIndex((n) => n.id === active))

  return (
    <div className="page">
      <div className="grain" aria-hidden="true" />

      <nav className="nav" id="site-nav">
        <div className="nav-inner">
          <a className="nav-logo" href="#top">
            <span className="mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  d="M20 4C11 6 6.5 10.5 5 20M5 20l3.2-.4c5-.7 8.4-4 9.6-9.1M5 20l-1 1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Quill
          </a>
          <div className="nav-links">
            {NAV.map((n) => (
              <a
                href={`#${n.id}`}
                key={n.id}
                className={active === n.id ? 'is-active' : undefined}
                aria-current={active === n.id ? 'true' : undefined}
              >
                {n.label}
              </a>
            ))}
          </div>
          <a className="nav-cta" href="https://github.com/quill-sh/quill">
            v3.2.0
          </a>
        </div>
      </nav>

      <div className="layout">
        <aside className="sidebar" id="sidebar">
          <p className="sidebar-title">On this page</p>
          <ul style={{ '--i': activeIndex }}>
            <span className="rail" aria-hidden="true" />
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className={active === n.id ? 'is-active' : undefined}>
                  <span className="s-num">{n.num}</span>
                  <span className="s-label">{n.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <main className="content">
          <header className="doc-header" id="top">
            <p className="version">
              <span className="pip" aria-hidden="true" />
              v3.2.0 <span className="sep">·</span> MIT
            </p>
            <h1>
              Quill<span className="dot">.</span>
            </h1>
            <p className="tagline">
              A markdown build tool that does <em>one</em> thing: turn a directory of files into a
              directory of files, predictably, and tell you exactly what broke when it cannot.
            </p>

            <div className="pipeline" aria-label="Build pipeline: markdown source in, static files out">
              <span className="stage">
                <span className="stage-k">in</span>
                <code>src/**/*.md</code>
              </span>
              <span className="arrow" aria-hidden="true" />
              <span className="stage stage-mid">
                <span className="stage-k">transform</span>
                <code>quill build</code>
              </span>
              <span className="arrow" aria-hidden="true" />
              <span className="stage">
                <span className="stage-k">out</span>
                <code>dist/**/*.html</code>
              </span>
            </div>
          </header>

          <section className="doc-section" id="install">
            <div className="sec-head">
              <span className="sec-num">01</span>
              <h2>Installation</h2>
            </div>

            <div className="install">
              <div className="tabs" role="tablist" aria-label="Install method">
                <span
                  className="tab-glide"
                  aria-hidden="true"
                  style={{ '--n': Object.keys(INSTALLERS).indexOf(installer) }}
                />
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
              <pre className="code code-inline" data-install={installer}>
                <span className="prompt" aria-hidden="true">
                  $
                </span>
                <code key={installer} className="cmd-swap">
                  {INSTALLERS[installer]}
                </code>
                <CopyButton
                  text={INSTALLERS[installer]}
                  id="install"
                  copiedId={copiedId}
                  onCopy={copy}
                  label="Copy"
                />
              </pre>
            </div>

            <p className="note">
              Requires Node 20 or newer. The curl installer places a static binary in{' '}
              <code>/usr/local/bin</code>.
            </p>
          </section>

          <section className="doc-section" id="quickstart">
            <div className="sec-head">
              <span className="sec-num">02</span>
              <h2>Quickstart</h2>
            </div>
            <p className="lead">From an empty directory:</p>
            <pre className="code code-block">
              <span className="code-chrome" aria-hidden="true">
                <i />
                <i />
                <i />
                <em>terminal</em>
              </span>
              <Shell source={QUICKSTART} />
            </pre>
            <p>
              Quill reads <code>quill.config.js</code>, expands <code>include</code>, subtracts{' '}
              <code>exclude</code>, and transforms what remains. There is no plugin resolution step
              and no implicit configuration merging: what is in the file is what runs.
            </p>
          </section>

          <section className="doc-section" id="config">
            <div className="sec-head">
              <span className="sec-num">03</span>
              <h2>Configuration</h2>
            </div>
            <p className="lead">
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
                        <code className="k">{c.key}</code>
                      </th>
                      <td>
                        <code className={`type type-${c.type.replace('[]', 's')}`}>{c.type}</code>
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

          <section className="doc-section" id="commands">
            <div className="sec-head">
              <span className="sec-num">04</span>
              <h2>Command reference</h2>
            </div>
            <ul className="commands">
              {COMMANDS.map((c) => (
                <li className="command" key={c.cmd} data-cmd={c.cmd}>
                  <div className="command-top">
                    <h3>
                      <span className="prompt" aria-hidden="true">
                        $
                      </span>
                      <code>{c.cmd}</code>
                    </h3>
                    <CopyButton
                      text={c.cmd}
                      id={c.cmd}
                      copiedId={copiedId}
                      onCopy={copy}
                      label="Copy"
                    />
                  </div>
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

          <section className="doc-section" id="errors">
            <div className="sec-head">
              <span className="sec-num">05</span>
              <h2>Common errors</h2>
            </div>
            <dl className="errors">
              {ERRORS.map((e) => (
                <div className="error" key={e.code} data-error={e.code}>
                  <dt>
                    <code className="err-code">{e.code}</code>
                    <span className="err-msg">{e.msg}</span>
                  </dt>
                  <dd>
                    <span className="fix-k">fix</span>
                    {e.fix}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <footer className="footer" id="site-footer">
            <div className="footer-mark" aria-hidden="true">
              Quill
            </div>
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
