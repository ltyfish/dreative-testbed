import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  Copy,
  CornerDownRight,
  Minus,
  Plus,
  X,
} from 'lucide-react'

/* ------------------------------------------------------------------ *
 * Required content. Commands, config keys, errors and install lines
 * are verbatim from the content baseline.
 * ------------------------------------------------------------------ */

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

/* The one sample project used by the whole page: the hero figure, the
 * config studio, and the error terminal all resolve against it. */
const PROJECT = [
  { path: 'index.md', note: null },
  { path: 'guide/install.md', note: null },
  { path: 'guide/config.md', note: null },
  { path: 'guide/_draft.md', note: 'link to ./roadmap.md does not resolve' },
  { path: 'notes/scratch.md', note: null },
  { path: 'assets/diagram.svg', note: null },
  { path: 'node_modules/marked/README.md', note: null },
]

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'install', label: 'Install' },
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'config', label: 'Config' },
  { id: 'commands', label: 'Commands' },
  { id: 'errors', label: 'Errors' },
]

/* ------------------------------------------------------------------ *
 * The resolver. Small, real, and the reason the config section works.
 * ------------------------------------------------------------------ */

function globToRegExp(glob) {
  let out = ''
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') {
          out += '(?:.*/)?'
          i += 2
        } else {
          out += '.*'
          i += 1
        }
      } else {
        out += '[^/]*'
      }
    } else if (c === '?') {
      out += '[^/]'
    } else {
      out += c.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    }
  }
  try {
    return new RegExp(`^${out}$`)
  } catch {
    return null
  }
}

function matchAny(patterns, path) {
  for (const p of patterns) {
    if (!p.trim()) continue
    const re = globToRegExp(p.trim())
    if (re && re.test(path)) return p.trim()
  }
  return null
}

function resolveBuild({ include, exclude, output }) {
  return PROJECT.map((file) => {
    const hit = matchAny(include, file.path)
    if (!hit) return { ...file, state: 'unmatched', by: null, out: null }
    const skipped = matchAny(exclude, file.path)
    if (skipped) return { ...file, state: 'excluded', by: skipped, out: null }
    const out = `${output.replace(/\/+$/, '')}/${file.path.replace(/\.md$/, '.html')}`
    return { ...file, state: 'included', by: hit, out }
  })
}

/* ------------------------------------------------------------------ *
 * Hooks: scroll-spy for the nav, one shared entrance for regions.
 * ------------------------------------------------------------------ */

function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const seen = new Map()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e))
        const visible = ids
          .map((id) => seen.get(id))
          .filter((e) => e && e.isIntersecting)
        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin: '-72px 0px -55% 0px', threshold: 0 },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [ids])
  return active
}

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.setAttribute('data-shown', 'true'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute('data-shown', 'true')
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

function useCopy() {
  const [copied, setCopied] = useState(null)
  const timer = useRef(null)
  const copy = useCallback((text, id) => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text)
    setCopied(id ?? text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 1500)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return [copied, copy]
}

/* ------------------------------------------------------------------ */

function FileRow({ file, compact }) {
  const dir = file.path.includes('/')
    ? file.path.slice(0, file.path.lastIndexOf('/') + 1)
    : ''
  const base = file.path.slice(dir.length)
  return (
    <li className="fileRow" data-state={file.state} data-compact={compact ? 'true' : undefined}>
      <span className="fileRow__mark" aria-hidden="true" />
      <span className="fileRow__path">
        <span className="fileRow__dir">{dir}</span>
        <span className="fileRow__base">{base}</span>
      </span>
      {file.state === 'excluded' && (
        <span className="fileRow__why">
          <Minus size={11} strokeWidth={2.5} aria-hidden="true" />
          {file.by}
        </span>
      )}
      {file.state === 'unmatched' && <span className="fileRow__why">no include match</span>}
    </li>
  )
}

function Hero() {
  const resolved = useMemo(
    () => resolveBuild({ include: ['**/*.md'], exclude: ['node_modules/**'], output: './dist' }),
    [],
  )
  const built = resolved.filter((f) => f.state === 'included')

  return (
    <section id="overview" className="hero">
      <div className="hero__head">
        <p className="eyebrow">
          <span className="eyebrow__dot" aria-hidden="true" />
          v3.2.0
          <span className="eyebrow__sep">·</span>
          MIT
          <span className="eyebrow__sep">·</span>
          Node 20+
        </p>
        <h1 className="hero__title">
          <span>A directory of files in.</span>
          <span>
            A directory of files <em>out.</em>
          </span>
        </h1>
      </div>

      <div className="hero__lead">
        <p className="hero__deck">
          A markdown build tool that does one thing: turn a directory of files into a directory of
          files, predictably, and tell you exactly what broke when it cannot.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="#install">
            Install quill
            <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
          </a>
          <a className="btn" href="https://github.com/quill-sh/quill">
            Read the source
          </a>
        </div>
      </div>

      <figure className="hero__figure">
        <figcaption className="figure__cap">
          One project, resolved with the default config. It reappears in every section below.
        </figcaption>
        <div className="transform">
          <div className="transform__side">
            <p className="transform__label">
              <span className="transform__path">./</span>
              <span className="transform__count">{PROJECT.length} files</span>
            </p>
            <ul className="fileList">
              {resolved.map((f) => (
                <FileRow key={f.path} file={f} compact />
              ))}
            </ul>
          </div>
          <div className="transform__arrow" aria-hidden="true">
            <span className="transform__rule" />
            <span className="transform__glyph">
              <CornerDownRight size={15} strokeWidth={2} />
            </span>
            <span className="transform__rule" />
          </div>
          <div className="transform__side">
            <p className="transform__label">
              <span className="transform__path">dist/</span>
              <span className="transform__count">{built.length} files</span>
            </p>
            <ul className="fileList">
              {built.map((f) => (
                <FileRow
                  key={f.out}
                  file={{ path: f.out.replace(/^\.\/dist\//, ''), state: 'output' }}
                  compact
                />
              ))}
            </ul>
          </div>
        </div>
      </figure>
    </section>
  )
}

function Install({ copied, copy }) {
  const [installer, setInstaller] = useState('npm')
  const keys = Object.keys(INSTALLERS)
  const command = INSTALLERS[installer]
  const isCopied = copied === 'install'

  return (
    <section id="install" className="section section--install" data-reveal>
      <header className="sectionHead">
        <h2 className="sectionHead__title">
          <span className="sectionHead__num">01</span> Install
        </h2>
        <p className="sectionHead__note">
          Requires Node 20 or newer. The curl installer places a static binary in{' '}
          <code>/usr/local/bin</code>.
        </p>
      </header>

      <div className="installer">
        <div className="installer__tabs" role="tablist" aria-label="Install method">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              id={`tab-${k}`}
              aria-selected={installer === k}
              aria-controls="install-panel"
              className="tab"
              onClick={() => setInstaller(k)}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="installer__body">
          <pre
            id="install-panel"
            role="tabpanel"
            aria-labelledby={`tab-${installer}`}
            data-install={installer}
            className="code code--inline"
          >
            <span className="code__prompt" aria-hidden="true">
              $
            </span>
            <code key={installer}>{command}</code>
          </pre>
          <button
            type="button"
            className="copy"
            data-copied={isCopied ? 'true' : undefined}
            onClick={() => copy(command, 'install')}
          >
            {isCopied ? (
              <Check size={14} strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <Copy size={14} strokeWidth={2} aria-hidden="true" />
            )}
            {isCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </section>
  )
}

function Quickstart({ copied, copy }) {
  const isCopied = copied === 'quickstart'
  const steps = [
    { n: '1', t: 'Read quill.config.js', d: 'No plugin resolution step. No implicit merging.' },
    { n: '2', t: 'Expand include, subtract exclude', d: 'Globs resolve from root, in that order.' },
    { n: '3', t: 'Transform what remains', d: 'What is in the file is what runs.' },
  ]

  return (
    <section id="quickstart" className="section section--quickstart" data-reveal>
      <header className="sectionHead">
        <h2 className="sectionHead__title">
          <span className="sectionHead__num">02</span> Quickstart
        </h2>
        <p className="sectionHead__note">From an empty directory:</p>
      </header>

      <div className="quickstart">
        <div className="quickstart__code">
          <div className="code__bar">
            <span className="code__file">bash</span>
            <button
              type="button"
              className="copy copy--ghost"
              data-copied={isCopied ? 'true' : undefined}
              onClick={() => copy(QUICKSTART, 'quickstart')}
            >
              {isCopied ? (
                <Check size={14} strokeWidth={2.4} aria-hidden="true" />
              ) : (
                <Copy size={14} strokeWidth={2} aria-hidden="true" />
              )}
              {isCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="code code--block">
            <code>{QUICKSTART}</code>
          </pre>
        </div>

        <ol className="pipeline">
          {steps.map((s) => (
            <li key={s.n} className="pipeline__step">
              <span className="pipeline__n">{s.n}</span>
              <div>
                <h3 className="pipeline__t">{s.t}</h3>
                <p className="pipeline__d">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function PatternField({ label, patterns, onChange }) {
  return (
    <div className="patterns">
      <div className="patterns__list">
        {patterns.map((p, i) => (
          <span className="chip" key={i}>
            <input
              className="chip__input"
              value={p}
              aria-label={`${label} pattern ${i + 1}`}
              size={Math.max(p.length, 4)}
              onChange={(e) => {
                const next = patterns.slice()
                next[i] = e.target.value
                onChange(next)
              }}
            />
            <button
              type="button"
              className="chip__x"
              aria-label={`Remove ${label} pattern ${p || i + 1}`}
              onClick={() => onChange(patterns.filter((_, j) => j !== i))}
            >
              <X size={11} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </span>
        ))}
        <button
          type="button"
          className="chip chip--add"
          onClick={() => onChange([...patterns, '**/*'])}
        >
          <Plus size={11} strokeWidth={2.6} aria-hidden="true" />
          pattern
        </button>
      </div>
    </div>
  )
}

function ConfigStudio() {
  const [root, setRoot] = useState('.')
  const [include, setInclude] = useState(['**/*.md'])
  const [exclude, setExclude] = useState(['node_modules/**'])
  const [output, setOutput] = useState('./dist')
  const [strict, setStrict] = useState(false)
  const [concurrency, setConcurrency] = useState(8)

  const resolved = useMemo(
    () => resolveBuild({ include, exclude, output: output || './dist' }),
    [include, exclude, output],
  )
  const built = resolved.filter((f) => f.state === 'included')
  const warnings = built.filter((f) => f.note)
  const failed = strict && warnings.length > 0

  const meta = Object.fromEntries(CONFIG_KEYS.map((c) => [c.key, c]))

  const dirty =
    root !== '.' ||
    output !== './dist' ||
    strict !== false ||
    concurrency !== 8 ||
    include.join() !== '**/*.md' ||
    exclude.join() !== 'node_modules/**'

  function reset() {
    setRoot('.')
    setInclude(['**/*.md'])
    setExclude(['node_modules/**'])
    setOutput('./dist')
    setStrict(false)
    setConcurrency(8)
  }

  return (
    <section id="config" className="section section--config" data-reveal>
      <header className="sectionHead">
        <h2 className="sectionHead__title">
          <span className="sectionHead__num">03</span> Configuration
        </h2>
        <p className="sectionHead__note">
          Every key is optional. Unknown keys are an error rather than a warning, so a typo fails
          the build instead of silently doing nothing. Edit the config — the resolved build is
          recomputed for real against the sample project from the top of this page.
        </p>
      </header>

      <div className="studio">
        <div className="studio__editor">
          <div className="code__bar">
            <span className="code__file">quill.config.js</span>
            <button type="button" className="copy copy--ghost" onClick={reset} disabled={!dirty}>
              Reset
            </button>
          </div>

          <div className="cfg">
            <p className="cfg__syntax">export default {'{'}</p>

            <div className="cfgRow" data-config="root">
              <div className="cfgRow__head">
                <span className="cfgRow__key">root</span>
                <input
                  className="field field--text"
                  value={root}
                  aria-label="root"
                  onChange={(e) => setRoot(e.target.value)}
                />
                <span className="cfgRow__meta">
                  {meta.root.type} · default {meta.root.def}
                </span>
              </div>
              <p className="cfgRow__desc">{meta.root.desc}</p>
            </div>

            <div className="cfgRow" data-config="include">
              <div className="cfgRow__head">
                <span className="cfgRow__key">include</span>
                <PatternField label="include" patterns={include} onChange={setInclude} />
                <span className="cfgRow__meta">
                  {meta.include.type} · default {meta.include.def}
                </span>
              </div>
              <p className="cfgRow__desc">{meta.include.desc}</p>
            </div>

            <div className="cfgRow" data-config="exclude">
              <div className="cfgRow__head">
                <span className="cfgRow__key">exclude</span>
                <PatternField label="exclude" patterns={exclude} onChange={setExclude} />
                <span className="cfgRow__meta">
                  {meta.exclude.type} · default {meta.exclude.def}
                </span>
              </div>
              <p className="cfgRow__desc">{meta.exclude.desc}</p>
            </div>

            <div className="cfgRow" data-config="output">
              <div className="cfgRow__head">
                <span className="cfgRow__key">output</span>
                <input
                  className="field field--text"
                  value={output}
                  aria-label="output"
                  onChange={(e) => setOutput(e.target.value)}
                />
                <span className="cfgRow__meta">
                  {meta.output.type} · default {meta.output.def}
                </span>
              </div>
              <p className="cfgRow__desc">{meta.output.desc}</p>
            </div>

            <div className="cfgRow" data-config="strict">
              <div className="cfgRow__head">
                <span className="cfgRow__key">strict</span>
                <button
                  type="button"
                  className="toggle"
                  role="switch"
                  aria-checked={strict}
                  aria-label="strict"
                  onClick={() => setStrict((s) => !s)}
                >
                  <span className="toggle__track" aria-hidden="true">
                    <span className="toggle__knob" />
                  </span>
                  <span className="toggle__val">{String(strict)}</span>
                </button>
                <span className="cfgRow__meta">
                  {meta.strict.type} · default {meta.strict.def}
                </span>
              </div>
              <p className="cfgRow__desc">{meta.strict.desc}</p>
            </div>

            <div className="cfgRow" data-config="concurrency">
              <div className="cfgRow__head">
                <span className="cfgRow__key">concurrency</span>
                <span className="stepper">
                  <button
                    type="button"
                    aria-label="Decrease concurrency"
                    onClick={() => setConcurrency((c) => Math.max(1, c - 1))}
                  >
                    <Minus size={12} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                  <span className="stepper__val">{concurrency}</span>
                  <button
                    type="button"
                    aria-label="Increase concurrency"
                    onClick={() => setConcurrency((c) => Math.min(16, c + 1))}
                  >
                    <Plus size={12} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                </span>
                <span className="cfgRow__meta">
                  {meta.concurrency.type} · default {meta.concurrency.def}
                </span>
              </div>
              <p className="cfgRow__desc">{meta.concurrency.desc}</p>
            </div>

            <p className="cfgRow__desc cfgRow__desc--wide">
              {concurrency === 1
                ? 'One transform at a time — output ordering is deterministic.'
                : `${concurrency} transforms in flight — ordering is not guaranteed.`}
            </p>

            <p className="cfg__syntax">{'}'}</p>
          </div>
        </div>

        <div className="studio__result">
          <div className="code__bar code__bar--result">
            <span className="code__file">
              {root === '.' ? './' : `${root.replace(/\/+$/, '')}/`} → resolved
            </span>
            <span className="result__tally">
              {built.length} in · {built.length} out
            </span>
          </div>

          <ul className="fileList fileList--studio">
            {resolved.map((f) => (
              <FileRow key={f.path} file={f} />
            ))}
          </ul>

          <div className="result__out" data-failed={failed ? 'true' : undefined}>
            <p className="result__outHead">
              {(output || './dist').replace(/\/+$/, '')}/
            </p>
            {built.length === 0 ? (
              <p className="result__empty">
                Nothing matched. <code>quill build</code> exits 0 and writes no files.
              </p>
            ) : (
              <ul className="fileList fileList--out">
                {built.map((f) => (
                  <FileRow
                    key={f.out}
                    file={{
                      path: f.out.slice((output || './dist').replace(/\/+$/, '').length + 1),
                      state: 'output',
                    }}
                  />
                ))}
              </ul>
            )}
          </div>

          <p className="result__status" data-tone={failed ? 'bad' : warnings.length ? 'warn' : 'ok'}>
            {failed ? (
              <>
                <strong>build failed</strong> — {warnings.length} warning treated as an error, no
                files written
              </>
            ) : warnings.length ? (
              <>
                <strong>built {built.length} files</strong> — {warnings.length} warning:{' '}
                {warnings[0].path}, {warnings[0].note}
              </>
            ) : (
              <>
                <strong>built {built.length} files</strong> — no warnings
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  )
}

function Commands() {
  return (
    <section id="commands" className="section section--commands" data-reveal>
      <header className="sectionHead">
        <h2 className="sectionHead__title">
          <span className="sectionHead__num">04</span> Commands
        </h2>
        <p className="sectionHead__note">Four of them. That is the whole surface area.</p>
      </header>

      <dl className="cmdList">
        {COMMANDS.map((c, i) => (
          <div className="cmd" key={c.cmd} data-cmd={c.cmd} data-primary={i === 0 ? 'true' : undefined}>
            <dt className="cmd__name">
              <span className="cmd__prompt" aria-hidden="true">
                $
              </span>
              {c.cmd}
            </dt>
            <dd className="cmd__body">
              <p className="cmd__desc">{c.desc}</p>
              <ul className="cmd__flags">
                {c.flags.map((f) => (
                  <li key={f} className="flag">
                    {f}
                  </li>
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
  const [open, setOpen] = useState(() => new Set(ERRORS.map((e) => e.code)))
  const toggle = (code) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  return (
    <section id="errors" className="section section--errors" data-reveal>
      <div className="errors__inner">
        <header className="sectionHead sectionHead--dark">
          <h2 className="sectionHead__title">
            <span className="sectionHead__num">05</span> When it fails
          </h2>
          <p className="sectionHead__note">
            Every failure has a code, a one-line message, and a fix. This is what the terminal
            actually prints.
          </p>
        </header>

        <ul className="errList">
          {ERRORS.map((e) => {
            const isOpen = open.has(e.code)
            return (
              <li key={e.code} className="err" data-error={e.code} data-open={isOpen ? 'true' : undefined}>
                <button
                  type="button"
                  className="err__line"
                  aria-expanded={isOpen}
                  onClick={() => toggle(e.code)}
                >
                  <span className="err__badge">error</span>
                  <span className="err__code">{e.code}</span>
                  <span className="err__msg">{e.msg}</span>
                  <span className="err__chev" aria-hidden="true">
                    <ArrowRight size={14} strokeWidth={2.2} />
                  </span>
                </button>
                <div className="err__fixWrap" hidden={!isOpen}>
                  <p className="err__fix">
                    <span className="err__fixLabel">fix</span>
                    {e.fix}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function Nav() {
  const ids = useMemo(() => SECTIONS.map((s) => s.id), [])
  const active = useScrollSpy(ids)
  return (
    <header className="topbar">
      <a className="brand" href="#overview">
        <span className="brand__mark" aria-hidden="true">
          ❦
        </span>
        quill
        <span className="brand__ver">3.2.0</span>
      </a>
      <nav className="nav" aria-label="On this page">
        <ul className="nav__list">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                className="nav__link"
                href={`#${s.id}`}
                aria-current={active === s.id ? 'true' : undefined}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <a className="topbar__cta" href="https://github.com/quill-sh/quill">
        GitHub
      </a>
    </header>
  )
}

export default function App() {
  const [copied, copy] = useCopy()
  useReveal()

  return (
    <div className="page" id="top">
      <span className="grain" aria-hidden="true" />
      <Nav />
      <main className="wrap">
        <Hero />
        <Install copied={copied} copy={copy} />
        <Quickstart copied={copied} copy={copy} />
        <ConfigStudio />
        <Commands />
      </main>
      <Errors />
      <footer className="footer">
        <div className="footer__inner">
          <p className="footer__copy">© 2026 Quill contributors — MIT licensed</p>
          <ul className="footer__links">
            <li>
              <a href="#top">Top</a>
            </li>
            <li>
              <a href="/changelog">Changelog</a>
            </li>
            <li>
              <a href="https://github.com/quill-sh/quill">GitHub</a>
            </li>
            <li>
              <a href="/discord">Discord</a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}
