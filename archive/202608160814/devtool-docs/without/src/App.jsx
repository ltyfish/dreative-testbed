import { useState, useEffect, useRef } from 'react'

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
  { id: 'overview', num: '00', label: 'Overview' },
  { id: 'install', num: '01', label: 'Install' },
  { id: 'quickstart', num: '02', label: 'Quickstart' },
  { id: 'config', num: '03', label: 'Configuration' },
  { id: 'commands', num: '04', label: 'Commands' },
  { id: 'errors', num: '05', label: 'Errors' },
]

/* Tracks which section owns the top third of the viewport. */
function useActiveSection() {
  const [active, setActive] = useState(SECTIONS[0].id)

  useEffect(() => {
    const seen = new Map()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e))
        const visible = SECTIONS.map((s) => seen.get(s.id)).filter((e) => e && e.isIntersecting)
        if (visible.length) {
          setActive(visible[0].target.id)
        }
      },
      { rootMargin: '-12% 0px -70% 0px', threshold: 0 },
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return active
}

function useCopy() {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  function copy(text) {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }

  return [copied, copy]
}

function SectionHead({ num, label, note }) {
  return (
    <header className="sec-head">
      <div className="sec-head-line">
        <span className="sec-num">§{num}</span>
        <h2>{label}</h2>
        <span className="rule" aria-hidden="true" />
      </div>
      {note ? <p className="sec-note">{note}</p> : null}
    </header>
  )
}

function Rail({ active }) {
  return (
    <nav className="rail" aria-label="On this page">
      <span className="rail-title">Contents</span>
      <ol>
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={active === s.id ? 'true' : undefined}>
              <span className="rail-num">{s.num}</span>
              <span className="rail-label">{s.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function Install() {
  const [installer, setInstaller] = useState('npm')
  const [copied, copy] = useCopy()
  const keys = Object.keys(INSTALLERS)

  return (
    <div className="install">
      <div className="tabs" role="tablist" aria-label="Install method">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`tab-${k}`}
            aria-selected={installer === k}
            aria-controls="install-panel"
            tabIndex={installer === k ? 0 : -1}
            className="tab"
            onClick={() => setInstaller(k)}
            onKeyDown={(e) => {
              const i = keys.indexOf(installer)
              if (e.key === 'ArrowRight') setInstaller(keys[(i + 1) % keys.length])
              if (e.key === 'ArrowLeft') setInstaller(keys[(i - 1 + keys.length) % keys.length])
            }}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="term" role="tabpanel" id="install-panel" aria-labelledby={`tab-${installer}`}>
        <pre data-install={installer}>
          <span className="prompt" aria-hidden="true">$</span>
          <code>{INSTALLERS[installer]}</code>
        </pre>
        <button
          type="button"
          className="copy"
          data-copied={copied || undefined}
          onClick={() => copy(INSTALLERS[installer])}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const active = useActiveSection()

  return (
    <div className="page" id="top">
      <div className="grain" aria-hidden="true" />

      <header className="masthead">
        <div className="brand">
          <span className="mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M3 21c4-1 7-3.5 11-9.5C16 8 18.5 5 21 3c-.5 4-2 8.5-5 12s-7 5.5-9.5 5.5" />
              <path d="M6.5 17.5c2.5-.5 5-2 7-4.5" />
            </svg>
          </span>
          <span className="wordmark">Quill</span>
        </div>
        <div className="meta">
          <span className="chip">v3.2.0</span>
          <span className="chip">MIT</span>
          <a className="chip chip-link" href="https://github.com/quill-sh/quill">GitHub ↗</a>
        </div>
      </header>

      <div className="shell">
        <Rail active={active} />

        <main>
          <section id="overview" className="hero">
            <p className="eyebrow">§00 — Overview</p>
            <h1>
              A markdown build tool that does <em>one thing</em>.
            </h1>
            <p className="lede">
              Turn a directory of files into a directory of files, predictably, and tell you exactly
              what broke when it cannot.
            </p>
            <dl className="facts">
              <div>
                <dt>Version</dt>
                <dd>3.2.0</dd>
              </div>
              <div>
                <dt>Licence</dt>
                <dd>MIT</dd>
              </div>
              <div>
                <dt>Requires</dt>
                <dd>Node 20+</dd>
              </div>
              <div>
                <dt>Plugin resolution</dt>
                <dd>None</dd>
              </div>
            </dl>
          </section>

          <section id="install">
            <SectionHead
              num="01"
              label="Install"
              note="Requires Node 20 or newer. The curl installer places a static binary in /usr/local/bin."
            />
            <Install />
          </section>

          <section id="quickstart">
            <SectionHead num="02" label="Quickstart" note="From an empty directory:" />
            <div className="term term-block">
              <pre>
                <code>{QUICKSTART}</code>
              </pre>
            </div>
            <p className="prose">
              Quill reads quill.config.js, expands <code>include</code>, subtracts{' '}
              <code>exclude</code>, and transforms what remains. There is no plugin resolution step
              and no implicit configuration merging: what is in the file is what runs.
            </p>
          </section>

          <section id="config">
            <SectionHead
              num="03"
              label="Configuration"
              note="Every key is optional. Unknown keys are an error rather than a warning, so a typo fails the build instead of silently doing nothing."
            />
            <div className="table-wrap">
              <table className="config">
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
                      <th scope="row">
                        <code>{c.key}</code>
                      </th>
                      <td>
                        <span className="type">{c.type}</span>
                      </td>
                      <td>
                        <code className="def">{c.def}</code>
                      </td>
                      <td className="desc">{c.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="commands">
            <SectionHead num="04" label="Commands" note="Command reference." />
            <ul className="cmds">
              {COMMANDS.map((c) => (
                <li key={c.cmd} data-cmd={c.cmd}>
                  <div className="cmd-head">
                    <code className="cmd-name">{c.cmd}</code>
                  </div>
                  <p className="cmd-desc">{c.desc}</p>
                  <ul className="flags">
                    {c.flags.map((f) => (
                      <li key={f}>
                        <code>{f}</code>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section id="errors">
            <SectionHead num="05" label="Errors" note="Common errors, and what to do about them." />
            <ul className="errors">
              {ERRORS.map((e) => (
                <li key={e.code} data-error={e.code}>
                  <div className="err-head">
                    <code className="err-code">{e.code}</code>
                    <span className="err-msg">{e.msg}</span>
                  </div>
                  <p className="err-fix">{e.fix}</p>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>

      <footer className="foot">
        <p className="copyright">© 2026 Quill contributors — MIT licensed</p>
        <nav aria-label="Footer">
          <a href="#top">Top</a>
          <a href="/changelog">Changelog</a>
          <a href="https://github.com/quill-sh/quill">GitHub</a>
          <a href="/discord">Discord</a>
        </nav>
      </footer>
    </div>
  )
}
