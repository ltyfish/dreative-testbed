// Content-only baseline. Every fact and every piece of behaviour the designed
// baseline had, with none of its architecture: no nav, no sidebar, no sections,
// no tabs, no table, no ordering that means anything. A builder handed this
// cannot reorder an existing page, because there is no existing page.
//
// See BASELINES.md for why this exists.
import { useState } from 'react'

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

export default function App() {
  const [installer, setInstaller] = useState('npm')
  const [copied, setCopied] = useState(false)

  function copy(text) {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <p>Quill. v3.2.0 · MIT.</p>
      <p>
        A markdown build tool that does one thing: turn a directory of files into a directory of
        files, predictably, and tell you exactly what broke when it cannot.
      </p>

      <p>Installation. Requires Node 20 or newer. The curl installer places a static binary in /usr/local/bin.</p>
      <div>
        {Object.keys(INSTALLERS).map((k) => (
          <button key={k} type="button" aria-selected={installer === k} onClick={() => setInstaller(k)}>
            {k}
          </button>
        ))}
      </div>
      <pre data-install={installer}>
        <code>{INSTALLERS[installer]}</code>
      </pre>
      <button type="button" onClick={() => copy(INSTALLERS[installer])}>{copied ? 'Copied' : 'Copy'}</button>

      <p>Quickstart. From an empty directory:</p>
      <pre><code>{QUICKSTART}</code></pre>
      <p>
        Quill reads quill.config.js, expands include, subtracts exclude, and transforms what
        remains. There is no plugin resolution step and no implicit configuration merging: what is
        in the file is what runs.
      </p>

      <p>
        Configuration. Every key is optional. Unknown keys are an error rather than a warning, so a
        typo fails the build instead of silently doing nothing.
      </p>
      <ul>
        {CONFIG_KEYS.map((c) => (
          <li key={c.key} data-config={c.key}>
            {c.key} — {c.type} — default {c.def} — {c.desc}
          </li>
        ))}
      </ul>

      <p>Command reference.</p>
      <ul>
        {COMMANDS.map((c) => (
          <li key={c.cmd} data-cmd={c.cmd}>
            {c.cmd} — {c.desc} — flags: {c.flags.join(', ')}
          </li>
        ))}
      </ul>

      <p>Common errors.</p>
      <ul>
        {ERRORS.map((e) => (
          <li key={e.code} data-error={e.code}>
            {e.code} — {e.msg} — {e.fix}
          </li>
        ))}
      </ul>

      <p>© 2026 Quill contributors — MIT licensed</p>
      <p>
        <a href="#top">Top</a> <a href="/changelog">Changelog</a>{' '}
        <a href="https://github.com/quill-sh/quill">GitHub</a> <a href="/discord">Discord</a>
      </p>
    </div>
  )
}
