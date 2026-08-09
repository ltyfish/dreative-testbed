import { useEffect, useMemo, useRef, useState } from 'react'
import { CUSTOMERS, FAQ, FEATURES, METRICS, MONTHS, PLANS, REVISIONS, SCATTERED } from './data.js'
import { FIGURES, FeatureMark } from './figures.jsx'

const SECTIONS = [
  { id: 'hero', stamp: '01', role: 'the problem' },
  { id: 'customers', stamp: '02', role: 'in use' },
  { id: 'metrics', stamp: '03', role: 'measured' },
  { id: 'definition', stamp: '04', role: 'governed' },
  { id: 'features', stamp: '05', role: 'capability' },
  { id: 'pricing', stamp: '06', role: 'terms' },
  { id: 'faq', stamp: '07', role: 'questions' },
  { id: 'signup', stamp: '08', role: 'open an account' },
]

function useActiveSection() {
  const [active, setActive] = useState('hero')
  useEffect(() => {
    const seen = new Map()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.intersectionRatio))
        let best = null
        seen.forEach((ratio, id) => {
          if (ratio > 0 && (!best || ratio > best.ratio)) best = { id, ratio }
        })
        if (best) setActive(best.id)
      },
      { threshold: [0, 0.15, 0.35, 0.6, 0.9], rootMargin: '-80px 0px -35% 0px' },
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])
  return active
}

function Stamp({ id }) {
  const s = SECTIONS.find((x) => x.id === id)
  return (
    <p className="stamp" aria-hidden="true">
      <span className="stamp-num">§{s.stamp}</span>
      <span className="stamp-rule" />
      <span className="stamp-role">{s.role}</span>
    </p>
  )
}

/* ── §01 ────────────────────────────────────────────────────────────────────
   Nine conflicting figures, collapsing into the one governed row. This is the
   sentence in the FAQ ("nine definitions of revenue") shown rather than told. */
function ScatterArtifact() {
  const [resolved, setResolved] = useState(false)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => setResolved(true), reduce ? 0 : 1100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`artifact${resolved ? ' is-resolved' : ''}`}>
      <p className="artifact-head">
        <span>Q4 revenue, as answered today</span>
        <span className="artifact-count">{resolved ? '1 definition' : `${SCATTERED.length} definitions`}</span>
      </p>
      <div className="artifact-stage">
        <ul className="scatter">
          {SCATTERED.map((row, i) => (
            <li key={row.tool + row.owner} style={{ '--i': i }}>
              <span className="scatter-tool">{row.tool}</span>
              <span className="scatter-owner">{row.owner}</span>
              <span className="scatter-figure">{row.figure}</span>
            </li>
          ))}
        </ul>
        <div className="governed-row">
          <span className="governed-key">metric.revenue</span>
          <span className="governed-meta">governed · v3 · owner finance</span>
          <span className="governed-figure">$7.63M</span>
        </div>
      </div>
      <p className="artifact-note">
        Eight of the nine disagreed about refunds, test orders, or the date revenue is recognised.
      </p>
      <button type="button" className="artifact-replay" onClick={() => { setResolved(false); setTimeout(() => setResolved(true), 900) }}>
        Replay the disagreement
      </button>
    </div>
  )
}

/* ── §04 ────────────────────────────────────────────────────────────────────
   The peak. One shared piece of state — the selected revision — changes the
   SQL, the three downstream consumers, the monthly shape, and the revision
   stamp carried in the page header. */
function DefinitionLedger({ revision, setRevision }) {
  const idx = REVISIONS.findIndex((r) => r.id === revision)
  const rev = REVISIONS[idx]
  const prev = idx > 0 ? REVISIONS[idx - 1] : null
  const changed = useMemo(() => {
    const before = new Set(prev ? prev.sql : [])
    return rev.sql.map((line) => (prev ? !before.has(line) : false))
  }, [rev, prev])
  const peak = Math.max(...REVISIONS.flatMap((r) => r.shape))

  return (
    <div className="ledger">
      <ol className="revisions">
        {REVISIONS.map((r, i) => (
          <li key={r.id}>
            <button
              type="button"
              className={`revision${r.id === revision ? ' is-current' : ''}`}
              aria-pressed={r.id === revision}
              onClick={() => setRevision(r.id)}
            >
              <span className="revision-stamp">{r.stamp}</span>
              <span className="revision-body">
                <span className="revision-reason">{r.reason}</span>
                <span className="revision-meta">{r.date} · {r.author}{i === REVISIONS.length - 1 ? ' · current' : ''}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="definition">
        <p className="definition-head">
          <span className="definition-key">metric.revenue</span>
          <span className="definition-grain">grain: {rev.grain}</span>
        </p>
        <pre className="sql" aria-live="polite">
          {rev.sql.map((line, i) => (
            <code key={line + i} className={changed[i] ? 'sql-line sql-line-new' : 'sql-line'}>
              <span className="sql-gutter">{String(i + 1).padStart(2, '0')}</span>
              {line}
            </code>
          ))}
        </pre>
        <p className="definition-caveat">{rev.caveat}</p>
      </div>

      <div className="downstream">
        <p className="downstream-head">Everything downstream, at this revision</p>

        <div className="consumer">
          <p className="consumer-label">Exec dashboard · Q4</p>
          <p className="consumer-value">{rev.quarter}</p>
          <div className="shape" aria-hidden="true">
            {rev.shape.map((v, i) => (
              <span key={i} className="shape-bar" style={{ height: `${(v / peak) * 100}%` }}>
                <i>{MONTHS[i]}</i>
              </span>
            ))}
          </div>
        </div>

        <div className="consumer">
          <p className="consumer-label">Slack alert · revenue drop</p>
          <p className="consumer-value consumer-value-sm">{rev.alert}</p>
        </div>

        <div className="consumer">
          <p className="consumer-label">Export · finance_revenue_daily</p>
          <p className="consumer-value consumer-value-sm">{rev.exportRows} rows</p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [billing, setBilling] = useState('monthly')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [revision, setRevision] = useState('v3')
  const active = useActiveSection()
  const successRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
  }

  useEffect(() => {
    if (sent && successRef.current) successRef.current.focus()
  }, [sent])

  const activeSection = SECTIONS.find((s) => s.id === active) || SECTIONS[0]
  const annual = billing === 'annual'

  return (
    <div className="page">
      <a className="skip" href="#hero">Skip to content</a>

      <nav className="nav" id="site-nav">
        <div className="nav-inner">
          <a className="nav-logo" href="#hero">
            Cadence
            <span className="nav-logo-sub">analytics</span>
          </a>
          <p className="nav-state" aria-hidden="true">
            <span className="nav-state-sec">§{activeSection.stamp} {activeSection.role}</span>
            <span className="nav-state-rev">metric.revenue @ {revision}</span>
          </p>
          <div className="nav-links">
            <a href="#features">Product</a>
            <a href="#metrics">Performance</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a className="nav-cta" href="#signup">Get started</a>
          </div>
        </div>
      </nav>

      <header className="hero" id="hero">
        <div className="hero-copy">
          <Stamp id="hero" />
          <h1>
            One definition of revenue.
            <em> Every dashboard in the company.</em>
          </h1>
          <p className="hero-lede">
            Cadence is a warehouse-native analytics layer for operations teams. Define your metrics
            once, govern who can change them, and let every chart, alert, and export inherit the same
            truth.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#signup">Start free</a>
            <a className="btn btn-secondary" href="#pricing">See pricing</a>
          </div>
          <p className="hero-note">Free for teams up to five editors. No card required.</p>
        </div>
        <ScatterArtifact />
      </header>

      <section className="band customers" id="customers">
        <div className="band-inner">
          <p className="eyebrow">Trusted by operations teams at</p>
          <ul className="logos">
            {CUSTOMERS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-ink" id="metrics">
        <div className="section-inner">
          <Stamp id="metrics" />
          <div className="section-head">
            <h2>Performance in production</h2>
            <p className="section-lede">
              Measured on customer warehouses, not a demo dataset. Each number is drawn as the thing
              it measures.
            </p>
          </div>
          <div className="metric-grid">
            {METRICS.map((m) => {
              const Figure = FIGURES[m.label]
              return (
                <figure className="metric" key={m.label} data-metric={m.label}>
                  <strong>{m.value}</strong>
                  <figcaption>
                    <span className="metric-label">{m.label}</span>
                    <span className="metric-note">{m.note}</span>
                  </figcaption>
                  {Figure ? <Figure /> : null}
                </figure>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section section-peak" id="definition">
        <div className="section-inner">
          <Stamp id="definition" />
          <div className="section-head section-head-wide">
            <h2>Change the definition. Watch everything downstream move with it.</h2>
            <p className="section-lede">
              This is the real revision history of one governed metric. Pick a revision: the SQL,
              the exec dashboard, the alert threshold, and the nightly export all follow the same
              object — because there is only one.
            </p>
          </div>
          <DefinitionLedger revision={revision} setRevision={setRevision} />
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-inner">
          <Stamp id="features" />
          <div className="section-head">
            <h2>What Cadence does</h2>
            <p className="section-lede">Six capabilities, in the order you meet them.</p>
          </div>
          <ol className="feature-list">
            {FEATURES.map((f, i) => (
              <li className="feature" key={f.id} data-feature={f.id}>
                <span className="feature-index">{String(i + 1).padStart(2, '0')}</span>
                <span className="feature-mark"><FeatureMark id={f.id} /></span>
                <h3>{f.name}</h3>
                <p>{f.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section-pricing" id="pricing">
        <div className="section-inner">
          <Stamp id="pricing" />
          <div className="pricing-head">
            <div className="section-head">
              <h2>Pricing</h2>
              <p className="section-lede">Priced per workspace, not per seat-of-the-pants query.</p>
            </div>
            <div className="billing-toggle" role="group" aria-label="Billing period">
              <button
                type="button"
                className={billing === 'monthly' ? 'active' : ''}
                aria-pressed={billing === 'monthly'}
                onClick={() => setBilling('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                className={annual ? 'active' : ''}
                aria-pressed={annual}
                onClick={() => setBilling('annual')}
              >
                Annual (save 20%)
              </button>
            </div>
          </div>
          <div className="plan-grid">
            {PLANS.map((p) => {
              const numeric = p.price !== 'Custom' && p.price !== '$0'
              const shown = numeric && annual
                ? `$${Math.round(parseInt(p.price.slice(1), 10) * 0.8)}`
                : p.price
              return (
                <article className={`plan${p.featured ? ' plan-featured' : ''}`} key={p.id} data-plan={p.id}>
                  <h3>{p.name}</h3>
                  <p className="plan-price">
                    <strong>{shown}</strong>
                    <span> {p.unit}</span>
                  </p>
                  <p className="plan-billing">
                    {numeric && annual
                      ? `billed annually · was ${p.price}`
                      : numeric
                        ? 'billed monthly'
                        : annual
                          ? 'annual billing'
                          : 'no card required'}
                  </p>
                  <ul className="plan-features">
                    {p.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`btn ${p.featured ? 'btn-invert' : 'btn-primary'}`}
                    onClick={() => alert(`${p.name}: ${p.cta}`)}
                  >
                    {p.cta}
                  </button>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="section-inner">
          <Stamp id="faq" />
          <div className="section-head">
            <h2>Frequently asked</h2>
          </div>
          <ul className="faq">
            {FAQ.map((item, i) => {
              const open = openFaq === i
              return (
                <li className={`faq-item${open ? ' is-open' : ''}`} key={item.q}>
                  <button
                    type="button"
                    className="faq-q"
                    aria-expanded={open}
                    aria-controls={`faq-a-${i}`}
                    id={`faq-q-${i}`}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <span className="faq-index">{String(i + 1).padStart(2, '0')}</span>
                    <span className="faq-text">{item.q}</span>
                    <span className="faq-sign" aria-hidden="true" />
                  </button>
                  <div className="faq-panel" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={!open}>
                    <p className="faq-a">{item.a}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="section section-signup" id="signup">
        <div className="section-inner signup">
          <Stamp id="signup" />
          <div className="signup-copy">
            <h2>Start with your own warehouse</h2>
            <p className="section-lede">
              Connect a read-only role and build your first governed metric in about ten minutes.
            </p>
          </div>
          <div className="signup-panel">
            {sent ? (
              <div className="form-success" role="status" tabIndex={-1} ref={successRef}>
                <p className="success-stamp">entry appended · workspace.invite</p>
                <p>Check your inbox — the workspace invite is on its way.</p>
              </div>
            ) : (
              <form className="signup-form" onSubmit={handleSubmit}>
                <label htmlFor="email">Work email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className="btn btn-invert">Create workspace</button>
                <p className="signup-fine">Read-only role. Nothing is written back to your warehouse.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="footer" id="site-footer">
        <div className="footer-inner">
          <p className="footer-mark">Cadence<span>© 2026 Cadence Analytics, Inc.</span></p>
          <div className="footer-links">
            <a href="#hero">Top</a>
            <a href="/docs">Docs</a>
            <a href="/security">Security</a>
            <a href="/status">Status</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
