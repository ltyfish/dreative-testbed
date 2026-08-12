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

/* Copy button that owns its own feedback state, so two buttons never light up together. */
function CopyButton({ text, label = 'Copy' }) {
  const [state, setState] = useState('idle')
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
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
      setState('done')
    } catch {
      setState('fail')
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1600)
  }

  return (
    <button
      type="button"
      className={`copy is-${state}`}
      onClick={copy}
      aria-label={`Copy ${text} to clipboard`}
    >
      <span aria-hidden="true" className="copy-glyph">
        {state === 'done' ? '✓' : state === 'fail' ? '!' : '⧉'}
      </span>
      <span className="copy-text">
        {state === 'done' ? 'Copied' : state === 'fail' ? 'Failed' : label}
      </span>
    </button>
  )
}

/* Highlighter for shell snippets: comments, flags, and the leading binary. */
function Shell({ code }) {
  return (
    <code>
      {code.split('\n').map((line, i) => {
        if (line.startsWith('#')) {
          return (
            <span className="ln" key={i}>
              <span className="tok-comment">{line}</span>
              {'\n'}
            </span>
          )
        }
        const parts = line.split(/(\s+)/)
        return (
          <span className="ln" key={i}>
            {parts.map((p, j) => {
              let cls = ''
              if (j === 0) cls = 'tok-bin'
              else if (p.startsWith('--') || p.startsWith('-')) cls = 'tok-flag'
              else if (/^["']/.test(p)) cls = 'tok-str'
              else if (p === '|' || p === '>' || p === '→') cls = 'tok-op'
              return cls ? (
                <span className={cls} key={j}>
                  {p}
                </span>
              ) : (
                p
              )
            })}
            {'\n'}
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
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e))
        const visible = [...seen.values()]
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: [0, 0.1, 0.5] },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [ids])

  return active
}

function useReadingProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const max = document.documentElement.scrollHeight - window.innerHeight
        setPct(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return pct
}

export default function App() {
  const [installer, setInstaller] = useState('npm')
  const active = useScrollSpy(NAV.map((n) => n.id))
  const progress = useReadingProgress()
  const tabsRef = useRef(null)

  const keys = Object.keys(INSTALLERS)

  const onTabKeys = useCallback(
    (e) => {
      const i = keys.indexOf(installer)
      let next = null
      if (e.key === 'ArrowRight') next = keys[(i + 1) % keys.length]
      if (e.key === 'ArrowLeft') next = keys[(i - 1 + keys.length) % keys.length]
      if (e.key === 'Home') next = keys[0]
      if (e.key === 'End') next = keys[keys.length - 1]
      if (!next) return
      e.preventDefault()
      setInstaller(next)
      tabsRef.current?.querySelector(`[data-tab="${next}"]`)?.focus()
    },
    [installer, keys],
  )

  return (
    <div className="page">
      <div className="progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <div className="rule-grid" aria-hidden="true" />

      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#top">
          <span className="mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path d="M20 4C11 6 6 11 5 20l3-3c5-1 9-5 12-13z" fill="currentColor" />
              <path d="M4 21c3-6 7-9 12-11" stroke="var(--paper)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <span className="wordmark">Quill</span>
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
      </nav>

      <div className="layout">
        <aside className="sidebar" id="sidebar">
          <p className="sidebar-title">On this page</p>
          <ul>
            {NAV.map((n) => (
              <li key={n.id} className={active === n.id ? 'is-active' : undefined}>
                <a href={`#${n.id}`} aria-current={active === n.id ? 'true' : undefined}>
                  <span className="sb-num">{n.num}</span>
                  <span className="sb-label">{n.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="sidebar-foot">
            Node 20+ · MIT
          </p>
        </aside>

        <main className="content">
          <header className="doc-header" id="top">
            <p className="version">
              <span className="chip">v3.2.0</span>
              <span className="chip chip-quiet">MIT</span>
              <span className="chip chip-quiet">zero plugins</span>
            </p>
            <h1>
              Quill<span className="cursor" aria-hidden="true" />
            </h1>
            <p className="tagline">
              A markdown build tool that does one thing: turn a directory of files into a directory
              of files, predictably, and tell you exactly what broke when it cannot.
            </p>
            <div className="hero-term" aria-hidden="true">
              <div className="term-bar">
                <span /> <span /> <span />
                <em>~/docs</em>
              </div>
              <pre className="term-body">
                <Shell code={'quill build\n# 42 files → dist in 0.31s'} />
              </pre>
            </div>
          </header>

          <section className="doc-section" id="install">
            <div className="sec-head">
              <span className="sec-num">01</span>
              <h2>Installation</h2>
            </div>
            <div
              className="tabs"
              role="tablist"
              aria-label="Install method"
              ref={tabsRef}
              onKeyDown={onTabKeys}
            >
              {keys.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  data-tab={k}
                  id={`tab-${k}`}
                  aria-selected={installer === k}
                  aria-controls="install-panel"
                  tabIndex={installer === k ? 0 : -1}
                  className={installer === k ? 'tab active' : 'tab'}
                  onClick={() => setInstaller(k)}
                >
                  {k}
                </button>
              ))}
            </div>
            <pre
              className="code"
              data-install={installer}
              id="install-panel"
              role="tabpanel"
              aria-labelledby={`tab-${installer}`}
            >
              <span className="prompt" aria-hidden="true">
                $
              </span>
              <Shell code={INSTALLERS[installer]} />
              <CopyButton text={INSTALLERS[installer]} />
            </pre>
            <p className="note">
              Requires Node 20 or newer. The curl installer places a static binary in
              <code> /usr/local/bin</code>.
            </p>
          </section>

          <section className="doc-section" id="quickstart">
            <div className="sec-head">
              <span className="sec-num">02</span>
              <h2>Quickstart</h2>
            </div>
            <p className="lede">From an empty directory:</p>
            <pre className="code code-block">
              <Shell code={QUICKSTART} />
              <CopyButton text={QUICKSTART} />
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
                        <code className="k-name">{c.key}</code>
                      </th>
                      <td data-label="Type">
                        <code className={`k-type t-${c.type.replace('[]', 's')}`}>{c.type}</code>
                      </td>
                      <td data-label="Default">
                        <code className="k-def">{c.def}</code>
                      </td>
                      <td data-label="Description" className="k-desc">
                        {c.desc}
                      </td>
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
                    <span className="fix-label" aria-hidden="true">
                      fix
                    </span>
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
