import { useRef, useState } from 'react'
import ConfigBench from './ConfigBench.jsx'
import { useActiveSection, useCopy, useNavHeight, useReveal } from './hooks.js'

const NAV = [
  { id: 'install', label: 'Installation', num: '01', blurb: 'Four ways in. One command each, copied.' },
  { id: 'quickstart', label: 'Quickstart', num: '02', blurb: 'Four lines from empty directory to dist/index.html.' },
  { id: 'config', label: 'Configuration', num: '03', blurb: 'Six keys. Change them here and read the build back.' },
  { id: 'commands', label: 'Command reference', num: '04', blurb: 'build, watch, check, init — and every flag.' },
  { id: 'errors', label: 'Common errors', num: '05', blurb: 'The three you will actually hit, and what fixes them.' },
]

const NAV_IDS = NAV.map((n) => n.id)

const INSTALLERS = {
  npm: 'npm install -g quill-cli',
  pnpm: 'pnpm add -g quill-cli',
  brew: 'brew install quill',
  curl: 'curl -fsSL https://quill.sh/install | sh',
}

const INSTALL_NOTES = {
  npm: 'Global install. Also works per-project without -g.',
  pnpm: 'Same package, same binary.',
  brew: 'macOS and Linuxbrew. Tracks the release tag.',
  curl: 'No Node required — the static binary ships its own runtime.',
}

const QUICKSTART = `quill init
echo "# Hello" > index.md
quill build
# → dist/index.html`

const QUICKSTART_NOTES = [
  'Writes a starter quill.config.js into the current directory. Nothing else.',
  'Any markdown file will do. Quill does not care how it got there.',
  'One pass: read the config, expand include, subtract exclude, transform what remains.',
  'A directory of files became a directory of files. That is the whole product.',
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

function Section({ id, num, title, children, kicker }) {
  const ref = useReveal()
  return (
    <section className="doc-section reveal" id={id} ref={ref}>
      <header className="section-head">
        <span className="section-num">{num}</span>
        <h2>{title}</h2>
        {kicker && <p className="section-kicker">{kicker}</p>}
      </header>
      {children}
    </section>
  )
}

export default function App() {
  const [installer, setInstaller] = useState('npm')
  const { copiedKey, copy } = useCopy()
  const active = useActiveSection(NAV_IDS)
  const activeIndex = NAV_IDS.indexOf(active)
  const navRef = useRef(null)
  useNavHeight(navRef)

  return (
    <div className="page">
      <a className="skip" href="#install">Skip to documentation</a>

      <nav className="nav" id="site-nav" aria-label="Main" ref={navRef}>
        <a className="nav-logo" href="#top">
          Quill<span className="nav-mark" aria-hidden="true">¶</span>
        </a>
        <div className="nav-links">
          {NAV.map((n) => (
            <a href={`#${n.id}`} key={n.id} aria-current={active === n.id ? 'true' : undefined}>
              {n.label}
            </a>
          ))}
        </div>
        <span className="nav-meta">v3.2.0 · MIT</span>
      </nav>

      <header className="masthead" id="top">
        <div className="masthead-type">
          <p className="eyebrow">Markdown build tool · v3.2.0 · MIT</p>
          <h1>
            Quill<span className="h1-mark" aria-hidden="true">¶</span>
          </h1>
        </div>
        <p className="tagline">
          A markdown build tool that does one thing: turn a directory of files into a directory
          of files, predictably, and tell you exactly what broke when it cannot.
        </p>
      </header>

      <div className="layout">
        <aside className="sidebar" id="sidebar" aria-label="On this page">
          <p className="sidebar-title">On this page</p>
          <ol className="rail">
            <li className="rail-progress" aria-hidden="true">
              <span
                className="rail-fill"
                style={{ transform: `scaleY(${(activeIndex + 1) / NAV.length})` }}
              />
            </li>
            {NAV.map((n) => (
              <li key={n.id} data-active={active === n.id}>
                <a href={`#${n.id}`} aria-current={active === n.id ? 'true' : undefined}>
                  <span className="rail-num">{n.num}</span>
                  <span className="rail-label">{n.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <main className="content">
          <ol className="index" aria-label="Contents">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`}>
                  <span className="index-num">{n.num}</span>
                  <span className="index-label">{n.label}</span>
                  <span className="index-blurb">{n.blurb}</span>
                  <span className="index-arrow" aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ol>

          <Section id="install" num="01" title="Installation" kicker="Pick a package manager. The command is the same shape everywhere.">
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
                <span
                  className="tab-marker"
                  aria-hidden="true"
                  style={{ '--i': Object.keys(INSTALLERS).indexOf(installer) }}
                />
              </div>

              <pre className="code code-install" data-install={installer}>
                <span className="prompt" aria-hidden="true">$</span>
                <code key={installer}>{INSTALLERS[installer]}</code>
                <button
                  type="button"
                  className={copiedKey === 'install' ? 'copy copied' : 'copy'}
                  onClick={() => copy(INSTALLERS[installer], 'install')}
                >
                  {copiedKey === 'install' ? 'Copied' : 'Copy'}
                </button>
              </pre>

              <p className="install-note" key={installer}>{INSTALL_NOTES[installer]}</p>
              <p className="note">
                Requires Node 20 or newer. The curl installer places a static binary in
                /usr/local/bin.
              </p>
            </div>
          </Section>

          <Section id="quickstart" num="02" title="Quickstart" kicker="From an empty directory, four lines and you are done.">
            <div className="quickstart">
              <pre className="code code-block">
                <span className="gutter" aria-hidden="true">
                  {QUICKSTART.split('\n').map((_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </span>
                <code>{QUICKSTART}</code>
                <button
                  type="button"
                  className={copiedKey === 'quickstart' ? 'copy copied' : 'copy'}
                  onClick={() => copy(QUICKSTART, 'quickstart')}
                >
                  {copiedKey === 'quickstart' ? 'Copied' : 'Copy'}
                </button>
              </pre>

              <ol className="marginalia">
                {QUICKSTART_NOTES.map((n, i) => (
                  <li key={i}>
                    <span className="margin-num">{i + 1}</span>
                    {n}
                  </li>
                ))}
              </ol>
            </div>

            <p className="prose">
              Quill reads <code>quill.config.js</code>, expands <code>include</code>, subtracts{' '}
              <code>exclude</code>, and transforms what remains. There is no plugin resolution step
              and no implicit configuration merging: what is in the file is what runs.
            </p>
          </Section>

          <Section id="config" num="03" title="Configuration" kicker="What is in the file is what runs. So here is the file.">
            <ConfigBench />
          </Section>

          <Section id="commands" num="04" title="Command reference" kicker="Four commands. No subcommands, no aliases.">
            <ul className="commands">
              {COMMANDS.map((c) => (
                <li className="command" key={c.cmd} data-cmd={c.cmd}>
                  <h3>
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
          </Section>

          <Section id="errors" num="05" title="Common errors" kicker="Every failure prints a code. Here is what each one means.">
            <dl className="errors">
              {ERRORS.map((e) => (
                <div className="error" key={e.code} data-error={e.code}>
                  <dt>
                    <code>{e.code}</code>
                    <span className="error-msg">{e.msg}</span>
                  </dt>
                  <dd>{e.fix}</dd>
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
