import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  { id: 'install', n: '01', title: 'Install', sub: 'four ways, one binary' },
  { id: 'quickstart', n: '02', title: 'Quickstart', sub: 'empty directory to output' },
  { id: 'config', n: '03', title: 'Configuration', sub: 'six keys, run them live' },
  { id: 'commands', n: '04', title: 'Commands', sub: 'four verbs and their flags' },
  { id: 'errors', n: '05', title: 'Errors', sub: 'what broke, and the fix' },
]

/* ------------------------------------------------------------------ *
 * The example tree the configuration ledger runs against.
 * ------------------------------------------------------------------ */

const TREE = [
  { path: 'index.md', bytes: 412 },
  { path: 'README.md', bytes: 1204 },
  { path: 'guide/intro.md', bytes: 2310 },
  { path: 'guide/config.md', bytes: 5108, warn: 'link ./missing.md does not resolve' },
  { path: 'guide/_partial.md', bytes: 180 },
  { path: 'notes/draft.md', bytes: 76 },
  { path: 'node_modules/marked/README.md', bytes: 9902 },
  { path: 'assets/logo.svg', bytes: 1440 },
]

const INCLUDE_PRESETS = ['**/*.md', 'guide/**/*.md', '*.md']
const EXCLUDE_PRESETS = ['node_modules/**', '**/_*.md', 'notes/**']

function globToRegExp(glob) {
  let re = '^'
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') {
          re += '(?:[^/]*\\/)*'
          i += 2
        } else {
          re += '.*'
          i += 1
        }
      } else {
        re += '[^/]*'
      }
    } else if (c === '?') {
      re += '[^/]'
    } else if ('.+^${}()|[]\\/'.includes(c)) {
      re += '\\' + c
    } else {
      re += c
    }
  }
  return new RegExp(re + '$')
}

function matchesAny(path, patterns) {
  return patterns.some((p) => {
    try {
      return globToRegExp(p).test(path)
    } catch {
      return false
    }
  })
}

/* ------------------------------------------------------------------ *
 * Interaction helpers
 * ------------------------------------------------------------------ */

function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.setAttribute('data-revealed', 'true'))
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
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
}

function useScrollSpy(ids) {
  const [active, setActive] = useState(null)
  useEffect(() => {
    const handler = () => {
      const line = window.innerHeight * 0.28
      let current = null
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
    }
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler)
      window.removeEventListener('resize', handler)
    }
  }, [ids])
  return active
}

function useCopy() {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  const copy = useCallback((text) => {
    try {
      navigator.clipboard?.writeText(text)?.catch(() => {})
    } catch {
      /* clipboard unavailable — the command stays selectable */
    }
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return [copied, copy]
}

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

function Masthead({ active }) {
  return (
    <header className="masthead" id="top">
      <div className="masthead__bar">
        <span className="wordmark">Quill</span>
        <span className="meta">v3.2.0</span>
        <span className="meta">MIT</span>
        <span className="meta meta--end">markdown build tool</span>
      </div>

      <h1 className="lede">
        A markdown build tool that does one thing: turn a directory of files into a directory of
        files, <em>predictably</em>, and tell you exactly what broke when it cannot.
      </h1>

      <nav className="index" aria-label="On this page">
        <p className="index__label">Contents</p>
        <ol className="index__list">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                className="index__item"
                href={`#${s.id}`}
                aria-current={active === s.id ? 'true' : undefined}
              >
                <span className="index__n">{s.n}</span>
                <span className="index__title">{s.title}</span>
                <span className="index__sub">{s.sub}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </header>
  )
}

function Rail({ active }) {
  return (
    <div className="rail" role="navigation" aria-label="Section navigation">
      <a className="rail__home" href="#top">
        Quill
      </a>
      <ul className="rail__list">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={active === s.id ? 'true' : undefined}>
              <span className="rail__n">{s.n}</span>
              <span className="rail__t">{s.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SectionHead({ n, title, id, note }) {
  return (
    <div className="head">
      <span className="head__n" aria-hidden="true">
        {n}
      </span>
      <h2 className="head__title" id={`${id}-title`}>
        {title}
      </h2>
      {note ? <p className="head__note">{note}</p> : null}
    </div>
  )
}

function Install() {
  const [installer, setInstaller] = useState('npm')
  const [copied, copy] = useCopy()
  const keys = Object.keys(INSTALLERS)

  return (
    <section className="section section--install" id="install" aria-labelledby="install-title">
      <SectionHead
        n="01"
        id="install"
        title="Install"
        note="Requires Node 20 or newer. The curl installer places a static binary in /usr/local/bin."
      />

      <div className="installer" data-reveal>
        <div className="installer__tabs" role="tablist" aria-label="Install method">
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
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault()
                  const next = keys[(i + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length]
                  setInstaller(next)
                  document.getElementById(`tab-${next}`)?.focus()
                }
              }}
            >
              {k}
            </button>
          ))}
        </div>

        <div
          className="installer__panel"
          id="install-panel"
          role="tabpanel"
          aria-labelledby={`tab-${installer}`}
        >
          <pre data-install={installer} key={installer}>
            <span className="prompt" aria-hidden="true">
              $
            </span>
            <code>{INSTALLERS[installer]}</code>
          </pre>
          <button
            type="button"
            className={`copy${copied ? ' is-copied' : ''}`}
            onClick={() => copy(INSTALLERS[installer])}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </section>
  )
}

function Quickstart() {
  return (
    <section className="section section--quick" id="quickstart" aria-labelledby="quickstart-title">
      <SectionHead n="02" id="quickstart" title="Quickstart" note="From an empty directory:" />

      <div className="quick" data-reveal>
        <pre className="quick__code">
          <code>{QUICKSTART}</code>
        </pre>
        <p className="quick__prose">
          Quill reads <code>quill.config.js</code>, expands <code>include</code>, subtracts{' '}
          <code>exclude</code>, and transforms what remains. There is no plugin resolution step and
          no implicit configuration merging: what is in the file is what runs.
        </p>
      </div>
    </section>
  )
}

/* The configuration ledger: the six keys, editable, resolving against a
   fixed example tree so each key shows what it actually does to a build. */
function Config() {
  const [root, setRoot] = useState('.')
  const [include, setInclude] = useState(['**/*.md'])
  const [exclude, setExclude] = useState(['node_modules/**'])
  const [output, setOutput] = useState('./dist')
  const [strict, setStrict] = useState(false)
  const [concurrency, setConcurrency] = useState(4)
  const [openKey, setOpenKey] = useState('include')

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  const resolved = useMemo(
    () =>
      TREE.map((f) => {
        const included = matchesAny(f.path, include)
        const excluded = included && matchesAny(f.path, exclude)
        return { ...f, state: !included ? 'unmatched' : excluded ? 'excluded' : 'kept' }
      }),
    [include, exclude],
  )

  const kept = resolved.filter((f) => f.state === 'kept')
  const warnings = kept.filter((f) => f.warn)
  const failed = strict && warnings.length > 0
  const outDir = `${root.replace(/\/+$/, '') || '.'}/${output.replace(/^\.\//, '').replace(/\/+$/, '')}`

  const cli = [
    'quill build',
    strict ? '--strict' : null,
    output !== './dist' ? `--out ${output}` : null,
  ]
    .filter(Boolean)
    .join(' ')

  const values = {
    root: `"${root}"`,
    include: `[${include.map((p) => `"${p}"`).join(', ')}]`,
    exclude: `[${exclude.map((p) => `"${p}"`).join(', ')}]`,
    output: `"${output}"`,
    strict: String(strict),
    concurrency: String(concurrency),
  }

  return (
    <section className="section section--config" id="config" aria-labelledby="config-title">
      <SectionHead
        n="03"
        id="config"
        title="Configuration"
        note="Every key is optional. Unknown keys are an error rather than a warning, so a typo fails the build instead of silently doing nothing."
      />

      <div className="ledger" data-reveal>
        <div className="ledger__keys">
          <p className="ledger__caption">
            <span className="filename">quill.config.js</span> — edit a key, watch the run change.
          </p>

          <ul className="keys">
            {CONFIG_KEYS.map((c) => {
              const open = openKey === c.key
              return (
                <li key={c.key} data-config={c.key} className={`key${open ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    className="key__row"
                    aria-expanded={open}
                    onClick={() => setOpenKey(open ? null : c.key)}
                  >
                    <span className="key__name">{c.key}</span>
                    <span className="key__type">{c.type}</span>
                    <span className="key__value">{values[c.key]}</span>
                  </button>

                  <div className="key__body" hidden={!open}>
                    <p className="key__desc">{c.desc}</p>
                    <p className="key__default">
                      default <code>{c.def}</code>
                    </p>

                    <div className="control">
                      {c.key === 'root' && (
                        <label className="control__field">
                          <span>root</span>
                          <input value={root} onChange={(e) => setRoot(e.target.value)} spellCheck="false" />
                        </label>
                      )}
                      {c.key === 'output' && (
                        <label className="control__field">
                          <span>output</span>
                          <input value={output} onChange={(e) => setOutput(e.target.value)} spellCheck="false" />
                        </label>
                      )}
                      {c.key === 'include' &&
                        INCLUDE_PRESETS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className="chip"
                            aria-pressed={include.includes(p)}
                            onClick={() => toggle(include, setInclude, p)}
                          >
                            {p}
                          </button>
                        ))}
                      {c.key === 'exclude' &&
                        EXCLUDE_PRESETS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className="chip"
                            aria-pressed={exclude.includes(p)}
                            onClick={() => toggle(exclude, setExclude, p)}
                          >
                            {p}
                          </button>
                        ))}
                      {c.key === 'strict' && (
                        <button
                          type="button"
                          className="chip chip--switch"
                          aria-pressed={strict}
                          onClick={() => setStrict((s) => !s)}
                        >
                          strict: {String(strict)}
                        </button>
                      )}
                      {c.key === 'concurrency' && (
                        <label className="control__field control__field--range">
                          <span>{concurrency}</span>
                          <input
                            type="range"
                            min="1"
                            max="8"
                            value={concurrency}
                            onChange={(e) => setConcurrency(Number(e.target.value))}
                            aria-label="concurrency"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="ledger__run" aria-live="polite">
          <p className="ledger__caption">
            <span className="filename">{cli}</span>
          </p>

          <ol className="tree">
            {resolved.map((f) => (
              <li
                key={f.path}
                className="tree__row"
                data-state={f.state}
                data-level={
                  f.state === 'kept' && f.warn ? (strict ? 'error' : 'warning') : undefined
                }
              >
                <span className="tree__mark" aria-hidden="true">
                  {f.state === 'kept' ? '›' : '·'}
                </span>
                <span className="tree__path">{f.path}</span>
                <span className="tree__note">
                  {f.state === 'unmatched'
                    ? 'no include match'
                    : f.state === 'excluded'
                      ? 'excluded'
                      : f.warn
                        ? strict
                          ? 'error'
                          : 'warning'
                        : `${f.bytes} B`}
                </span>
              </li>
            ))}
          </ol>

          <div className={`outcome${failed ? ' is-failed' : ''}${kept.length === 0 ? ' is-empty' : ''}`}>
            {kept.length === 0 ? (
              <p className="outcome__line">Nothing matched. Quill exits 0 and writes no files.</p>
            ) : failed ? (
              <p className="outcome__line">
                Build failed — <code>strict</code> turned {warnings.length} warning
                {warnings.length === 1 ? '' : 's'} into {warnings.length === 1 ? 'an error' : 'errors'}
              </p>
            ) : (
              <>
                <p className="outcome__line">
                  {kept.length} file{kept.length === 1 ? '' : 's'} → <code>{outDir}</code>
                  {warnings.length ? (
                    <span className="outcome__warn">
                      {warnings.length} warning{warnings.length === 1 ? '' : 's'}
                    </span>
                  ) : null}
                </p>
                <ul className="outcome__files">
                  {kept.map((f) => (
                    <li key={f.path}>{f.path.replace(/\.md$/, '.html')}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="outcome__order">
              {concurrency === 1
                ? 'concurrency 1 — output order is deterministic.'
                : `up to ${concurrency} transforms in parallel — output order is not guaranteed.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Commands() {
  return (
    <section className="section section--commands" id="commands" aria-labelledby="commands-title">
      <SectionHead n="04" id="commands" title="Commands" note="Four verbs. Nothing hidden behind them." />

      <dl className="commands" data-reveal>
        {COMMANDS.map((c) => (
          <div className="command" key={c.cmd} data-cmd={c.cmd}>
            <dt className="command__name">
              <span className="prompt" aria-hidden="true">
                $
              </span>
              {c.cmd}
            </dt>
            <dd className="command__body">
              <p className="command__desc">{c.desc}</p>
              <ul className="flags">
                {c.flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Errors() {
  return (
    <section className="section section--errors" id="errors" aria-labelledby="errors-title">
      <SectionHead
        n="05"
        id="errors"
        title="Errors"
        note="Every failure prints a code. Here is what the three you are most likely to meet mean."
      />

      <div className="errors" data-reveal>
        {ERRORS.map((e) => (
          <article className="err" key={e.code} data-error={e.code}>
            <p className="err__code">{e.code}</p>
            <p className="err__msg">{e.msg}</p>
            <p className="err__fix">{e.fix}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <p className="footer__mark">Quill</p>
      <nav className="footer__links" aria-label="Site links">
        <a href="#top">Top</a>
        <a href="/changelog">Changelog</a>
        <a href="https://github.com/quill-sh/quill">GitHub</a>
        <a href="/discord">Discord</a>
      </nav>
      <p className="footer__legal">© 2026 Quill contributors — MIT licensed</p>
    </footer>
  )
}

export default function App() {
  const ids = useMemo(() => SECTIONS.map((s) => s.id), [])
  const active = useScrollSpy(ids)
  useReveal()

  return (
    <div className="page">
      <Rail active={active} />
      <main className="column">
        <Masthead active={active} />
        <Install />
        <Quickstart />
        <Config />
        <Commands />
        <Errors />
        <Footer />
      </main>
    </div>
  )
}
