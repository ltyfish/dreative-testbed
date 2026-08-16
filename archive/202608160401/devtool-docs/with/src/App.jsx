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

/* The index line for each section states what is actually in it. */
const INDEX_COUNTS = {
  install: '4 methods',
  quickstart: '4 lines',
  config: '6 keys',
  commands: '4 commands · 9 flags',
  errors: '3 codes',
}

const num = (i) => String(i + 1).padStart(2, '0')

/* --- Copy button, shared grammar, one independent state per block --- */
function CopyButton({ text, label = 'Copy' }) {
  const [state, setState] = useState('idle')
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  function copy() {
    clearTimeout(timer.current)
    try {
      const done = navigator.clipboard?.writeText(text)
      if (done && typeof done.then === 'function') {
        done.then(
          () => setState('done'),
          () => setState('failed'),
        )
      } else {
        setState('done')
      }
    } catch {
      setState('failed')
    }
    timer.current = setTimeout(() => setState('idle'), 1600)
  }

  return (
    <button
      type="button"
      className="copy"
      data-state={state}
      onClick={copy}
      aria-live="polite"
      aria-label={`${label} to clipboard`}
    >
      {state === 'done' ? 'Copied' : state === 'failed' ? 'Press ⌘C' : label}
    </button>
  )
}

/* --- Regional entrance: fires against the top of the viewport, once --- */
function useReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      targets.forEach((t) => t.setAttribute('data-revealed', 'true'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute('data-revealed', 'true')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])
}

/* --- Scroll-spy: the one state that binds nav, sidebar and gutter --- */
function useActiveSection() {
  const [active, setActive] = useState(NAV[0].id)

  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(Boolean)
    if (!sections.length) return

    function pick() {
      const line = window.innerHeight * 0.28
      let current = null
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= line) current = s.id
      }
      // Nothing has crossed the line yet: still in the masthead.
      setActive(current ?? sections[0].id)
    }

    let frame = null
    function onScroll() {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        pick()
      })
    }

    pick()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return active
}

function SectionHead({ index, id, title, kicker }) {
  return (
    <div className="head">
      <span className="head-num" aria-hidden="true">
        {num(index)}
      </span>
      <div className="head-text">
        <h2 id={`${id}-title`}>{title}</h2>
        <p className="head-kicker">{kicker}</p>
      </div>
    </div>
  )
}

/* The two footer destinations that are not sections of this page. They are
   thin by design: they hand the reader on rather than restating the docs. */
const SIDE_ROUTES = {
  '/changelog': {
    title: 'Changelog',
    kicker: 'Every release, with its breaking changes called out.',
    body: 'Quill publishes its changelog as GitHub releases, one entry per tag, so it stays attached to the commits and the diff that produced it.',
    links: [
      { label: 'Releases on GitHub', href: 'https://github.com/quill-sh/quill/releases' },
      { label: 'Compare tags', href: 'https://github.com/quill-sh/quill/compare' },
    ],
  },
  '/discord': {
    title: 'Discord',
    kicker: 'Where the maintainers answer questions.',
    body: 'Bug reports belong in the issue tracker so they are not lost in scrollback. Everything else — configuration questions, build strategies, plugin ideas — is welcome in the server.',
    links: [
      { label: 'Open an issue', href: 'https://github.com/quill-sh/quill/issues' },
      { label: 'quill-sh/quill', href: 'https://github.com/quill-sh/quill' },
    ],
  },
}

function SideRoute({ route }) {
  useEffect(() => {
    document.title = `${route.title} — Quill CLI documentation`
  }, [route.title])

  return (
    <div className="page">
      <nav className="nav" aria-label="Site">
        <div className="nav-inner">
          <a className="nav-logo" href="/">
            <span className="mark" aria-hidden="true" />
            Quill
          </a>
          <div className="nav-links">
            <a href="/">Documentation</a>
          </div>
          <span className="nav-ver">v3.2.0</span>
        </div>
      </nav>

      <main className="aside-route">
        <p className="version">
          <span>v3.2.0</span>
          <span className="dot" aria-hidden="true">
            ·
          </span>
          <span>MIT</span>
        </p>
        <h1 className="aside-title">{route.title}</h1>
        <p className="aside-kicker">{route.kicker}</p>
        <p className="aside-body">{route.body}</p>
        <ul className="aside-links">
          {route.links.map((l) => (
            <li key={l.href}>
              <a href={l.href}>
                <span className="i-label">{l.label}</span>
                <span className="i-rule" aria-hidden="true" />
                <span className="i-count">↗</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="aside-back">
          <a href="/">← Back to the documentation</a>
        </p>
      </main>
    </div>
  )
}

export default function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') : ''
  const side = SIDE_ROUTES[path]
  if (side) return <SideRoute route={side} />
  return <DocsHome />
}

function DocsHome() {
  const [installer, setInstaller] = useState('npm')
  const [activeKey, setActiveKey] = useState('root')
  const [pinnedKey, setPinnedKey] = useState(null)
  const active = useActiveSection()
  useReveal()

  // On mobile the sidebar is a horizontal rail; keep the current entry in view.
  useEffect(() => {
    const rail = document.querySelector('.sidebar ul')
    if (!rail || rail.scrollWidth <= rail.clientWidth + 1) return
    const item = rail.querySelector('a[data-active]')?.parentElement
    if (!item) return
    const target = item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2
    rail.scrollTo({
      left: Math.max(0, target),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }, [active])

  const show = useCallback((k) => setActiveKey(k), [])
  const shownKey = pinnedKey ?? activeKey

  return (
    <div className="page">
      <a className="skip" href="#install">
        Skip to documentation
      </a>

      <nav className="nav" id="site-nav" aria-label="Sections">
        <div className="nav-inner">
          <a className="nav-logo" href="#top">
            <span className="mark" aria-hidden="true" />
            Quill
          </a>
          <div className="nav-links">
            {NAV.map((n) => (
              <a href={`#${n.id}`} key={n.id} data-active={active === n.id ? 'true' : undefined}>
                {n.label}
              </a>
            ))}
          </div>
          <span className="nav-ver">v3.2.0</span>
        </div>
      </nav>

      <div className="layout">
        <aside className="sidebar" id="sidebar" aria-label="On this page">
          <p className="sidebar-title">On this page</p>
          <ul>
            {NAV.map((n, i) => (
              <li key={n.id}>
                <a href={`#${n.id}`} data-active={active === n.id ? 'true' : undefined}>
                  <span className="s-num" aria-hidden="true">
                    {num(i)}
                  </span>
                  <span className="s-label">{n.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="sidebar-foot">
            MIT · Node 20+
            <br />
            <a href="https://github.com/quill-sh/quill">quill-sh/quill</a>
          </p>
        </aside>

        <main className="content">
          <header className="masthead" id="top">
            <p className="version">
              <span>v3.2.0</span>
              <span className="dot" aria-hidden="true">
                ·
              </span>
              <span>MIT</span>
            </p>
            <h1 className="wordmark">Quill</h1>
            <p className="tagline">
              A markdown build tool that does one thing: turn a directory of files into a directory
              of files, predictably, and tell you exactly what broke when it cannot.
            </p>

            <ol className="index" aria-label="Contents">
              {NAV.map((n, i) => (
                <li key={n.id}>
                  <a href={`#${n.id}`} data-active={active === n.id ? 'true' : undefined}>
                    <span className="i-num" aria-hidden="true">
                      {num(i)}
                    </span>
                    <span className="i-label">{n.label}</span>
                    <span className="i-rule" aria-hidden="true" />
                    <span className="i-count">{INDEX_COUNTS[n.id]}</span>
                  </a>
                </li>
              ))}
            </ol>
          </header>

          {/* 01 ------------------------------------------------------------ */}
          <section className="doc-section" id="install" aria-labelledby="install-title" data-reveal>
            <SectionHead index={0} id="install" title="Installation" kicker="Pick a package manager. The binary is the same." />

            <div className="install">
              <div className="tabs" role="tablist" aria-label="Install method">
                {Object.keys(INSTALLERS).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    id={`tab-${k}`}
                    aria-selected={installer === k}
                    aria-controls="install-panel"
                    tabIndex={installer === k ? 0 : -1}
                    className={installer === k ? 'tab active' : 'tab'}
                    onClick={() => setInstaller(k)}
                    onKeyDown={(e) => {
                      const keys = Object.keys(INSTALLERS)
                      const at = keys.indexOf(installer)
                      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                        e.preventDefault()
                        const next = keys[(at + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length]
                        setInstaller(next)
                        document.getElementById(`tab-${next}`)?.focus()
                      }
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <pre
                className="code shell"
                id="install-panel"
                role="tabpanel"
                aria-labelledby={`tab-${installer}`}
                data-install={installer}
              >
                <code>
                  <span className="prompt" aria-hidden="true">
                    $
                  </span>
                  {INSTALLERS[installer]}
                </code>
                <CopyButton text={INSTALLERS[installer]} />
              </pre>
            </div>

            <p className="note">
              Requires Node 20 or newer. The curl installer places a static binary in
              /usr/local/bin.
            </p>
          </section>

          {/* 02 ------------------------------------------------------------ */}
          <section className="doc-section" id="quickstart" aria-labelledby="quickstart-title" data-reveal>
            <SectionHead index={1} id="quickstart" title="Quickstart" kicker="From an empty directory to built HTML, in four lines." />

            <div className="quickstart">
              <div className="qs-code">
                <p className="lede">From an empty directory:</p>
                <pre className="code block">
                  <code>{QUICKSTART}</code>
                  <CopyButton text={QUICKSTART} />
                </pre>
              </div>
              <div className="qs-prose">
                <p>
                  Quill reads <code>quill.config.js</code>, expands <code>include</code>, subtracts{' '}
                  <code>exclude</code>, and transforms what remains. There is no plugin resolution
                  step and no implicit configuration merging: what is in the file is what runs.
                </p>
              </div>
            </div>
          </section>

          {/* 03 — signature: the config workbench --------------------------- */}
          <section className="doc-section" id="config" aria-labelledby="config-title" data-reveal>
            <SectionHead
              index={2}
              id="config"
              title="Configuration"
              kicker="Select a key to trace it to its line in the file."
            />

            <p className="section-lede">
              Every key is optional. Unknown keys are an error rather than a warning, so a typo
              fails the build instead of silently doing nothing.
            </p>

            <div className="workbench">
              <div className="wb-file">
                <div className="wb-file-inner">
                  <p className="filename">
                    <span>quill.config.js</span>
                    <span className="filename-hint">defaults shown</span>
                  </p>
                  <pre className="code file">
                    <code>
                      <span className="ln c">import os from "node:os"</span>
                      <span className="ln" />
                      <span className="ln k">export default {'{'}</span>
                      {CONFIG_KEYS.map((c) => (
                        <span
                          key={c.key}
                          className="ln row"
                          role="button"
                          tabIndex={0}
                          data-on={shownKey === c.key ? 'true' : undefined}
                          onMouseEnter={() => !pinnedKey && show(c.key)}
                          onClick={() => setPinnedKey(pinnedKey === c.key ? null : c.key)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setPinnedKey(pinnedKey === c.key ? null : c.key)
                            }
                          }}
                        >
                          {'  '}
                          <span className="tk-key">{c.key}</span>
                          {': '}
                          <span className="tk-val">{c.def}</span>
                          {','}
                        </span>
                      ))}
                      <span className="ln k">{'}'}</span>
                    </code>
                  </pre>
                  <p className="wb-hint">
                    {pinnedKey ? (
                      <>
                        <span className="pin-dot" aria-hidden="true" />
                        <code>{pinnedKey}</code> pinned — click again to release
                      </>
                    ) : (
                      <>
                        <span className="hint-fine">Hover a key to trace it. Click to pin.</span>
                        <span className="hint-coarse">Tap a key to trace it to its line.</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="wb-keys">
                <dl className="keys">
                  {CONFIG_KEYS.map((c) => (
                    <div
                      className="keyrow"
                      key={c.key}
                      data-key={c.key}
                      data-on={shownKey === c.key ? 'true' : undefined}
                      onMouseEnter={() => !pinnedKey && show(c.key)}
                      onFocus={() => !pinnedKey && show(c.key)}
                    >
                      <dt>
                        <button
                          type="button"
                          className="keyname"
                          aria-pressed={pinnedKey === c.key}
                          onClick={() => setPinnedKey(pinnedKey === c.key ? null : c.key)}
                        >
                          <code>{c.key}</code>
                        </button>
                        <span className="keymeta">
                          <span className="type">{c.type}</span>
                          <code className="def">{c.def}</code>
                        </span>
                      </dt>
                      <dd>{c.desc}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>

          {/* 04 ------------------------------------------------------------ */}
          <section className="doc-section" id="commands" aria-labelledby="commands-title" data-reveal>
            <SectionHead index={3} id="commands" title="Command reference" kicker="Four verbs. Nine flags. Nothing hidden." />

            <ul className="commands">
              {COMMANDS.map((c) => (
                <li className="command" key={c.cmd} data-cmd={c.cmd}>
                  <h3>
                    <code>
                      <span className="ns">{c.cmd.split(' ')[0]} </span>
                      <span className="verb">{c.cmd.split(' ').slice(1).join(' ')}</span>
                    </code>
                  </h3>
                  <div className="command-body">
                    <p className="command-desc">{c.desc}</p>
                    <p className="flags">
                      {c.flags.map((f) => (
                        <code key={f}>{f}</code>
                      ))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 05 ------------------------------------------------------------ */}
          <section className="doc-section" id="errors" aria-labelledby="errors-title" data-reveal>
            <SectionHead index={4} id="errors" title="Common errors" kicker="What Quill prints, and what to do about it." />

            <dl className="errors">
              {ERRORS.map((e, i) => (
                <div className="error" key={e.code} data-error={e.code}>
                  <dt>
                    <span className="err-code">{e.code}</span>
                    <span className="err-msg">{e.msg}</span>
                  </dt>
                  <dd>
                    <span className="err-label" aria-hidden="true">
                      Fix
                    </span>
                    <span>{e.fix}</span>
                  </dd>
                  <span className="err-n" aria-hidden="true">
                    {num(i)}
                  </span>
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
