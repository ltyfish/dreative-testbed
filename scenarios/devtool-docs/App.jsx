import { useState } from 'react'

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

export default function App() {
  const [installer, setInstaller] = useState('npm')
  const [copied, setCopied] = useState(false)

  function copy(text) {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="page">
      <nav className="nav" id="site-nav">
        <span className="nav-logo">Quill</span>
        <div className="nav-links">
          {NAV.map((n) => (
            <a href={`#${n.id}`} key={n.id}>
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
              <li key={n.id}>
                <a href={`#${n.id}`}>{n.label}</a>
              </li>
            ))}
          </ul>
        </aside>

        <main className="content">
          <header className="doc-header" id="top">
            <p className="version">v3.2.0 · MIT</p>
            <h1>Quill</h1>
            <p className="tagline">
              A markdown build tool that does one thing: turn a directory of files into a directory
              of files, predictably, and tell you exactly what broke when it cannot.
            </p>
          </header>

          <section className="doc-section" id="install">
            <h2>Installation</h2>
            <div className="tabs" role="tablist">
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
            <pre className="code" data-install={installer}>
              <code>{INSTALLERS[installer]}</code>
              <button type="button" className="copy" onClick={() => copy(INSTALLERS[installer])}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </pre>
            <p className="note">Requires Node 20 or newer. The curl installer places a static binary in /usr/local/bin.</p>
          </section>

          <section className="doc-section" id="quickstart">
            <h2>Quickstart</h2>
            <p>From an empty directory:</p>
            <pre className="code">
              <code>{`quill init
echo "# Hello" > index.md
quill build
# → dist/index.html`}</code>
            </pre>
            <p>
              Quill reads <code>quill.config.js</code>, expands <code>include</code>, subtracts{' '}
              <code>exclude</code>, and transforms what remains. There is no plugin resolution step
              and no implicit configuration merging: what is in the file is what runs.
            </p>
          </section>

          <section className="doc-section" id="config">
            <h2>Configuration</h2>
            <p>
              Every key is optional. Unknown keys are an error rather than a warning, so a typo
              fails the build instead of silently doing nothing.
            </p>
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
                      <code>{c.key}</code>
                    </th>
                    <td>
                      <code>{c.type}</code>
                    </td>
                    <td>
                      <code>{c.def}</code>
                    </td>
                    <td>{c.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="doc-section" id="commands">
            <h2>Command reference</h2>
            <ul className="commands">
              {COMMANDS.map((c) => (
                <li className="command" key={c.cmd} data-cmd={c.cmd}>
                  <h3>
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
            <h2>Common errors</h2>
            <dl className="errors">
              {ERRORS.map((e) => (
                <div className="error" key={e.code} data-error={e.code}>
                  <dt>
                    <code>{e.code}</code> — {e.msg}
                  </dt>
                  <dd>{e.fix}</dd>
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
