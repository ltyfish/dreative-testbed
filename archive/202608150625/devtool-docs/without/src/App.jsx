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

function Nib({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 32" aria-hidden="true" focusable="false">
      <path
        d="M12 0.8 C 4.4 9.6 1.2 17.2 1.2 22.2 C 1.2 26.6 6 31.2 12 31.2 C 18 31.2 22.8 26.6 22.8 22.2 C 22.8 17.2 19.6 9.6 12 0.8 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M12 6.5 L12 31" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="20.4" r="2.6" fill="currentColor" />
    </svg>
  )
}

/* Highlights a shell snippet: leading command word, flags, comments, strings. */
function Shell({ code }) {
  return (
    <code>
      {code.split('\n').map((line, li) => {
        const isComment = line.trimStart().startsWith('#')
        const tokens = isComment ? [line] : line.split(/(\s+)/)
        let seenCmd = false
        return (
          <span className="sh-line" key={li}>
            {tokens.map((t, ti) => {
              let cls = ''
              if (isComment) cls = 'sh-comment'
              else if (/^\s+$/.test(t) || t === '') cls = ''
              else if (!seenCmd) {
                seenCmd = true
                cls = 'sh-cmd'
              } else if (t.startsWith('-')) cls = 'sh-flag'
              else if (t.startsWith('"') || t.startsWith("'")) cls = 'sh-str'
              else if (t === '|' || t === '>' || t === '&&') cls = 'sh-op'
              return cls ? (
                <span className={cls} key={ti}>
                  {t}
                </span>
              ) : (
                t
              )
            })}
            {li < code.split('\n').length - 1 ? '\n' : ''}
          </span>
        )
      })}
    </code>
  )
}

function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const seen = new Map()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e))
        let best = null
        seen.forEach((e) => {
          if (!e.isIntersecting) return
          if (!best || e.boundingClientRect.top < best.boundingClientRect.top) best = e
        })
        if (best) setActive(best.target.id)
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: [0, 0.25, 1] }
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [ids])
  return active
}

export default function App() {
  const [installer, setInstaller] = useState('npm')
  const [copied, setCopied] = useState(null)
  const active = useScrollSpy(NAV.map((n) => n.id))
  const timer = useRef(null)

  function copy(text, id) {
    navigator.clipboard?.writeText(text)
    setCopied(id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 1500)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  const installKeys = Object.keys(INSTALLERS)
  const installIndex = installKeys.indexOf(installer)

  return (
    <div className="page">
      <a className="skip" href="#install">
        Skip to documentation
      </a>

      <nav className="nav" id="site-nav">
        <div className="nav-inner">
          <a className="nav-logo" href="#top">
            <Nib className="nib" />
            <span>Quill</span>
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
        </div>
      </nav>

      <div className="layout">
        <aside className="sidebar" id="sidebar">
          <p className="sidebar-title">On this page</p>
          <ul>
            {NAV.map((n, i) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className={active === n.id ? 'is-active' : undefined}>
                  <span className="sidebar-num">{String(i + 1).padStart(2, '0')}</span>
                  <span>{n.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="sidebar-foot">
            v3.2.0 — built <span>{'<'}400ms</span> on this page
          </p>
        </aside>

        <main className="content">
          <header className="doc-header" id="top">
            <div className="hero-mark" aria-hidden="true">
              <Nib className="nib-big" />
            </div>
            <p className="version">
              <span className="pill">v3.2.0</span>
              <span className="pill pill-quiet">MIT</span>
              <span className="pill pill-quiet">Node 20+</span>
            </p>
            <h1>
              Quill<span className="h1-dot">.</span>
            </h1>
            <p className="tagline">
              A markdown build tool that does one thing: turn a directory of files into a directory
              of files, <em>predictably</em>, and tell you exactly what broke when it cannot.
            </p>
            <div className="hero-strip">
              <div>
                <b>0</b>
                <span>plugins to resolve</span>
              </div>
              <div>
                <b>1</b>
                <span>config file, no merging</span>
              </div>
              <div>
                <b>3</b>
                <span>errors worth memorising</span>
              </div>
            </div>
          </header>

          <section className="doc-section" id="install">
            <h2>
              <span className="sec-num">01</span>Installation
            </h2>
            <div className="tabs" role="tablist" aria-label="Install method">
              <span
                className="tab-ink"
                style={{
                  '--i': installIndex,
                  '--n': installKeys.length,
                }}
                aria-hidden="true"
              />
              {installKeys.map((k) => (
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
            <pre className="code code-lead" data-install={installer}>
              <span className="code-prompt" aria-hidden="true">
                $
              </span>
              <Shell code={INSTALLERS[installer]} />
              <button
                type="button"
                className={copied === 'install' ? 'copy is-copied' : 'copy'}
                onClick={() => copy(INSTALLERS[installer], 'install')}
                aria-label={`Copy ${installer} install command`}
              >
                {copied === 'install' ? 'Copied' : 'Copy'}
              </button>
            </pre>
            <p className="note">
              Requires Node 20 or newer. The curl installer places a static binary in{' '}
              <code>/usr/local/bin</code>.
            </p>
          </section>

          <section className="doc-section" id="quickstart">
            <h2>
              <span className="sec-num">02</span>Quickstart
            </h2>
            <p className="lede">From an empty directory:</p>
            <pre className="code code-block">
              <code>{QUICKSTART}</code>
              <button
                type="button"
                className={copied === 'quickstart' ? 'copy is-copied' : 'copy'}
                onClick={() => copy(QUICKSTART, 'quickstart')}
                aria-label="Copy quickstart commands"
              >
                {copied === 'quickstart' ? 'Copied' : 'Copy'}
              </button>
            </pre>
            <p className="flow">
              Quill reads <code>quill.config.js</code>, expands <code>include</code>, subtracts{' '}
              <code>exclude</code>, and transforms what remains. There is no plugin resolution step
              and no implicit configuration merging: what is in the file is what runs.
            </p>
          </section>

          <section className="doc-section" id="config">
            <h2>
              <span className="sec-num">03</span>Configuration
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
                      <th scope="row">
                        <code className="key">{c.key}</code>
                      </th>
                      <td data-label="Type">
                        <code className="type">{c.type}</code>
                      </td>
                      <td data-label="Default">
                        <code className="def">{c.def}</code>
                      </td>
                      <td data-label="Description" className="desc">
                        {c.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="doc-section" id="commands">
            <h2>
              <span className="sec-num">04</span>Command reference
            </h2>
            <ul className="commands">
              {COMMANDS.map((c) => (
                <li className="command" key={c.cmd} data-cmd={c.cmd}>
                  <h3>
                    <code>
                      <span className="cmd-bin">quill</span> {c.cmd.replace('quill ', '')}
                    </code>
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

          <section className="doc-section" id="errors">
            <h2>
              <span className="sec-num">05</span>Common errors
            </h2>
            <dl className="errors">
              {ERRORS.map((e) => (
                <div className="error" key={e.code} data-error={e.code}>
                  <dt>
                    <code>{e.code}</code>
                    <span className="err-msg">{e.msg}</span>
                  </dt>
                  <dd>{e.fix}</dd>
                </div>
              ))}
            </dl>
          </section>

          <footer className="footer" id="site-footer">
            <div className="footer-mark" aria-hidden="true">
              <Nib className="nib" />
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
