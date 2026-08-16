import { useEffect, useRef, useState } from 'react'

/**
 * The six configuration keys. Type, default and description are the documented
 * contract; `options` are the alternative values the bench lets you try.
 */
export const CONFIG_KEYS = [
  {
    key: 'root',
    type: 'string',
    def: '"."',
    desc: 'Directory Quill treats as the project root. All other paths resolve from here.',
    options: ['"./docs"', '"src/pages"'],
  },
  {
    key: 'include',
    type: 'string[]',
    def: '["**/*.md"]',
    desc: 'Glob patterns to process. Later patterns override earlier ones.',
    options: ['["**/*.md", "**/*.mdx"]', '["docs/**/*.md"]'],
  },
  {
    key: 'exclude',
    type: 'string[]',
    def: '["node_modules/**"]',
    desc: 'Glob patterns to skip, applied after include.',
    options: ['["node_modules/**", "drafts/**"]', '[]'],
  },
  {
    key: 'output',
    type: 'string',
    def: '"./dist"',
    desc: 'Where built artefacts are written. Cleared on every build unless --no-clean is passed.',
    options: ['"./site"', '"../public"'],
  },
  {
    key: 'strict',
    type: 'boolean',
    def: 'false',
    desc: 'Treat warnings as errors. Recommended in CI.',
    options: ['true'],
  },
  {
    key: 'concurrency',
    type: 'number',
    def: 'os.cpus().length',
    desc: 'Maximum parallel file transforms. Set to 1 to make output ordering deterministic.',
    options: ['1', '4'],
  },
]

const UNKNOWN_KEY = 'strictMode'

function countPatterns(literal) {
  const inner = literal.trim().replace(/^\[|\]$/g, '').trim()
  if (!inner) return 0
  return inner.split(',').length
}

const unquote = (s) => s.replace(/^"|"$/g, '')

/** Reads the current values and says, in plain sentences, what a build does. */
function resolvePlan(values) {
  const v = (k) => values[k] ?? CONFIG_KEYS.find((c) => c.key === k).def
  const includeCount = countPatterns(v('include'))
  const excludeCount = countPatterns(v('exclude'))
  const conc = v('concurrency')

  return [
    {
      label: 'in',
      text: `${unquote(v('root'))} — ${includeCount} include ${includeCount === 1 ? 'pattern' : 'patterns'}, ${
        excludeCount === 0 ? 'nothing excluded' : `${excludeCount} excluded`
      }`,
    },
    {
      label: 'out',
      text: `${unquote(v('output'))} — cleared first, unless you pass --no-clean`,
    },
    {
      label: 'run',
      text: `${
        v('strict') === 'true' ? 'warnings fail the build' : 'warnings print, the build still succeeds'
      }; ${conc === '1' ? 'one file at a time, deterministic order' : conc === 'os.cpus().length' ? 'one transform per core' : `${conc} transforms in parallel`}`,
    },
  ]
}

export default function ConfigBench() {
  const [values, setValues] = useState({})
  const [typo, setTypo] = useState(false)
  const [flash, setFlash] = useState(null)
  const flashTimer = useRef(null)

  useEffect(() => () => clearTimeout(flashTimer.current), [])

  function set(key, value) {
    setValues((prev) => {
      const next = { ...prev }
      if (value === null) delete next[key]
      else next[key] = value
      return next
    })
    setFlash(key)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(null), 700)
  }

  const written = CONFIG_KEYS.filter((c) => values[c.key] !== undefined)
  const plan = resolvePlan(values)
  const dirty = written.length > 0 || typo

  return (
    <div className="bench">
      <div className="bench-keys">
        <div className="bench-head">
          <h3 id="config-keys-heading">The six keys</h3>
          <p>
            Every key is optional. Unknown keys are an error rather than a warning, so a typo fails
            the build instead of silently doing nothing. Change anything below and watch the file —
            and the build it describes — change with it.
          </p>
        </div>

        <div className="k-table" role="group" aria-labelledby="config-keys-heading">
          <div className="k-legend" aria-hidden="true">
            <span>Key · type</span>
            <span>What it does, and what else it can be</span>
          </div>

          {CONFIG_KEYS.map((c) => {
            const current = values[c.key] ?? c.def
            return (
              <div className="k-row" key={c.key} data-key={c.key} data-changed={values[c.key] !== undefined}>
                <div className="k-id">
                  <code className="k-name">{c.key}</code>
                  <span className="k-type">{c.type}</span>
                </div>
                <p className="k-desc">{c.desc}</p>
                <div className="k-ctl">
                  <div className="k-opts">
                    <button
                      type="button"
                      className="opt"
                      aria-pressed={values[c.key] === undefined}
                      onClick={() => set(c.key, null)}
                    >
                      <code>{c.def}</code>
                      <span className="opt-tag">default</span>
                    </button>
                    {c.options.map((o) => (
                      <button
                        type="button"
                        className="opt"
                        key={o}
                        aria-pressed={values[c.key] === o}
                        onClick={() => set(c.key, o)}
                      >
                        <code>{o}</code>
                      </button>
                    ))}
                  </div>
                  <p className="k-current">
                    resolves to <code>{current}</code>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bench-file">
        <div className="file">
          <div className="file-bar">
            <span className="file-name">quill.config.js</span>
            <button type="button" className="file-reset" onClick={() => { setValues({}); setTypo(false); setFlash(null) }} disabled={!dirty}>
              Reset
            </button>
          </div>

          <pre className="file-body" aria-live="polite">
            <code>
              <span className="ln">export default {'{'}</span>
              {written.length === 0 && !typo && (
                <span className="ln ln-empty">{'  '}// nothing set — every key is optional</span>
              )}
              {written.map((c) => (
                <span className={flash === c.key ? 'ln ln-flash' : 'ln'} key={c.key}>
                  {'  '}
                  <span className="tok-key">{c.key}</span>: <span className="tok-val">{values[c.key]}</span>,
                </span>
              ))}
              {typo && (
                <span className="ln ln-bad">
                  {'  '}
                  <span className="tok-key">{UNKNOWN_KEY}</span>: <span className="tok-val">true</span>,
                </span>
              )}
              <span className="ln">{'}'}</span>
            </code>
          </pre>

          <div className="file-plan" data-error={typo}>
            {typo ? (
              <>
                <p className="plan-error">
                  <span className="plan-mark">E_UNKNOWN_KEY</span>
                  Unknown key "{UNKNOWN_KEY}" — did you mean <code>strict</code>?
                </p>
                <p className="plan-note">Quill validates the whole config before it reads a single file. Nothing was written.</p>
              </>
            ) : (
              plan.map((p) => (
                <p className="plan-line" key={p.label}>
                  <span className="plan-label">{p.label}</span>
                  {p.text}
                </p>
              ))
            )}
          </div>

          <button
            type="button"
            className={typo ? 'typo-toggle typo-on' : 'typo-toggle'}
            aria-pressed={typo}
            onClick={() => { setTypo((t) => !t); setFlash(null) }}
          >
            {typo ? 'Remove the typo' : 'Introduce a typo'}
          </button>
        </div>
      </div>
    </div>
  )
}
