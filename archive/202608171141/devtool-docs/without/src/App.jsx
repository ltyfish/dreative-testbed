import { useCallback, useEffect, useRef, useState } from 'react'

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

const SECTIONS = [
  { id: 'install', num: '01', label: 'Install' },
  { id: 'quickstart', num: '02', label: 'Quickstart' },
  { id: 'config', num: '03', label: 'Configuration' },
  { id: 'commands', num: '04', label: 'Commands' },
  { id: 'errors', num: '05', label: 'Errors' },
]

const SECTION_IDS = SECTIONS.map((s) => s.id)

/** Marks whichever section heading last crossed the top third of the viewport. */
function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!nodes.length) return

    const onScroll = () => {
      const line = window.innerHeight * 0.35
      let current = ids[0]
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= line) current = node.id
      }
      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4
      setActive(atBottom ? ids[ids.length - 1] : current)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids])

  return active
}

function SectionHead({ id, num, title, lede }) {
  return (
    <header className="sec-head">
      <span className="sec-num" aria-hidden="true">{num}</span>
      <h2 id={id} className="sec-title" tabIndex={-1}>{title}</h2>
      {lede ? <p className="sec-lede">{lede}</p> : null}
    </header>
  )
}

export default function App() {
  const [installer, setInstaller] = useState('npm')
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  const active = useScrollSpy(SECTION_IDS)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback((text) => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }, [])

  const keys = Object.keys(INSTALLERS)

  function onTabKey(e) {
    const i = keys.indexOf(installer)
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = keys[(i + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length]
      setInstaller(next)
      document.getElementById(`tab-${next}`)?.focus()
    }
  }

  return (
    <div className="page" id="top">
      <div className="grain" aria-hidden="true" />

      <header className="masthead">
        <div className="masthead-inner">
          <div className="wordmark">
            <span className="wordmark-glyph" aria-hidden="true">❖</span>
            <span className="wordmark-text">Quill</span>
          </div>
          <p className="meta">
            <span className="tag">v3.2.0</span>
            <span className="dot" aria-hidden="true">·</span>
            <span className="tag">MIT</span>
          </p>
        </div>

        <h1 className="lede">
          A markdown build tool that does one thing: turn a directory of files into a
          directory of files, <em>predictably</em>, and tell you exactly what broke when it cannot.
        </h1>

        <div className="masthead-cta">
          <a className="btn btn-primary" href="#install">Install Quill</a>
          <a className="btn" href="https://github.com/quill-sh/quill">Source on GitHub</a>
        </div>
      </header>

      <div className="shell">
        <nav className="rail" aria-label="On this page">
          <p className="rail-title">On this page</p>
          <ol className="rail-list">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={active === s.id ? 'rail-link is-active' : 'rail-link'}
                  aria-current={active === s.id ? 'true' : undefined}
                >
                  <span className="rail-num">{s.num}</span>
                  <span className="rail-label">{s.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="main">
          <section className="sec" aria-labelledby="install">
            <SectionHead
              id="install"
              num="01"
              title="Install"
              lede="Requires Node 20 or newer. The curl installer places a static binary in /usr/local/bin."
            />

            <div className="terminal">
              <div className="terminal-bar" role="tablist" aria-label="Install method" onKeyDown={onTabKey}>
                {keys.map((k) => (
                  <button
                    key={k}
                    id={`tab-${k}`}
                    type="button"
                    role="tab"
                    className="tab"
                    aria-selected={installer === k}
                    tabIndex={installer === k ? 0 : -1}
                    onClick={() => setInstaller(k)}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div className="terminal-body">
                <pre data-install={installer}>
                  <span className="prompt" aria-hidden="true">$</span>
                  <code>{INSTALLERS[installer]}</code>
                </pre>
                <button
                  type="button"
                  className={copied ? 'copy is-copied' : 'copy'}
                  onClick={() => copy(INSTALLERS[installer])}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </section>

          <section className="sec" aria-labelledby="quickstart">
            <SectionHead id="quickstart" num="02" title="Quickstart" lede="From an empty directory:" />

            <div className="terminal terminal-plain">
              <div className="terminal-body">
                <pre><code>{QUICKSTART}</code></pre>
              </div>
            </div>

            <p className="prose">
              Quill reads <code>quill.config.js</code>, expands <code>include</code>, subtracts{' '}
              <code>exclude</code>, and transforms what remains. There is no plugin resolution step
              and no implicit configuration merging: what is in the file is what runs.
            </p>
          </section>

          <section className="sec" aria-labelledby="config">
            <SectionHead
              id="config"
              num="03"
              title="Configuration"
              lede="Every key is optional. Unknown keys are an error rather than a warning, so a typo fails the build instead of silently doing nothing."
            />

            <div className="table-wrap">
              <table className="table">
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
                    <tr key={c.key} data-config={c.key}>
                      <th scope="row"><code className="key">{c.key}</code></th>
                      <td><span className="type">{c.type}</span></td>
                      <td><code className="def">{c.def}</code></td>
                      <td className="desc">{c.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="sec" aria-labelledby="commands">
            <SectionHead id="commands" num="04" title="Commands" lede="Four verbs. Nothing hidden behind them." />

            <ul className="cmd-list">
              {COMMANDS.map((c) => (
                <li key={c.cmd} className="cmd" data-cmd={c.cmd}>
                  <p className="cmd-name">
                    <span className="prompt" aria-hidden="true">$</span>
                    <code>{c.cmd}</code>
                  </p>
                  <p className="cmd-desc">{c.desc}</p>
                  <ul className="flags" aria-label={`Flags for ${c.cmd}`}>
                    {c.flags.map((f) => (
                      <li key={f}><code className="flag">{f}</code></li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section className="sec" aria-labelledby="errors">
            <SectionHead
              id="errors"
              num="05"
              title="Errors"
              lede="Every failure exits with a code you can grep for. Here are the three you are most likely to meet."
            />

            <ul className="err-list">
              {ERRORS.map((e) => (
                <li key={e.code} className="err" data-error={e.code}>
                  <div className="err-head">
                    <code className="err-code">{e.code}</code>
                    <p className="err-msg">{e.msg}</p>
                  </div>
                  <p className="err-fix"><span className="err-fix-label">Fix</span>{e.fix}</p>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>

      <footer className="footer">
        <p className="footer-mark">© 2026 Quill contributors — MIT licensed</p>
        <nav className="footer-links" aria-label="Footer">
          <a href="#top">Top</a>
          <a href="/changelog">Changelog</a>
          <a href="https://github.com/quill-sh/quill">GitHub</a>
          <a href="/discord">Discord</a>
        </nav>
      </footer>
    </div>
  )
}
