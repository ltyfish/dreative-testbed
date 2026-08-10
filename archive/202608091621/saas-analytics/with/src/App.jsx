import { useEffect, useRef, useState } from 'react'
import MetricSpine from './MetricSpine.jsx'
import { GLYPHS } from './glyphs.jsx'

const FEATURES = [
  { id: 'ingest', name: 'Warehouse-native ingest', body: 'Point Cadence at Snowflake, BigQuery, or Postgres. No pipeline to maintain, no data leaves your warehouse.' },
  { id: 'metrics', name: 'Governed metric layer', body: 'Define revenue once. Every chart, alert, and export uses the same definition, with a visible change history.' },
  { id: 'alerts', name: 'Anomaly alerts', body: 'Cadence learns each metric’s normal shape and pages the owning team when it breaks, not when it merely moves.' },
  { id: 'embed', name: 'Embedded dashboards', body: 'Ship customer-facing analytics inside your own product with row-level permissions inherited from your app.' },
  { id: 'sql', name: 'SQL escape hatch', body: 'Every visual is a query you can open, edit, and version. Nothing is locked behind the interface.' },
  { id: 'audit', name: 'Audit and compliance', body: 'SOC 2 Type II, full query audit log, and per-column access policies enforced at the warehouse.' },
]

const METRICS = [
  { label: 'Median query time', value: '340ms', note: 'across 2.1B row tables' },
  { label: 'Time to first dashboard', value: '11 min', note: 'median for new workspaces' },
  { label: 'Metric definitions governed', value: '18,400', note: 'across all customers' },
  { label: 'Uptime, trailing 12 months', value: '99.98%', note: 'measured externally' },
]

const PLANS = [
  { id: 'team', name: 'Team', price: '$0', unit: 'up to 5 editors', cta: 'Start free', features: ['3 warehouse connections', '20 governed metrics', 'Email alerts', 'Community support'] },
  { id: 'growth', name: 'Growth', price: '$490', unit: 'per month', cta: 'Start 14-day trial', features: ['Unlimited connections', 'Unlimited metrics', 'Slack and PagerDuty alerts', 'Embedded dashboards', 'SSO and SCIM'], featured: true },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', unit: 'annual contract', cta: 'Talk to sales', features: ['Everything in Growth', 'Private deployment', 'Custom SLA and audit exports', 'Named support engineer'] },
]

const CUSTOMERS = ['Northwind', 'Halcyon', 'Perigee', 'Tessellate', 'Brightmoor', 'Ostrom Labs']

const FAQ = [
  { q: 'Does our data leave the warehouse?', a: 'No. Cadence pushes queries down to your warehouse and only caches aggregate results you explicitly mark cacheable.' },
  { q: 'How is this different from a BI tool?', a: 'BI tools let anyone define a metric anywhere, which is how a company ends up with nine definitions of revenue. Cadence makes the definition the governed object and the chart the disposable one.' },
  { q: 'Can we migrate our existing dashboards?', a: 'Growth and Enterprise include an importer for Looker and Metabase. It converts saved queries; hand-tuned visualisations need review.' },
  { q: 'What happens when the trial ends?', a: 'The workspace drops to the free Team plan. Nothing is deleted, and dashboards over the limit become read-only until you upgrade.' },
]

// The hero panel shows the object the whole product is about: a definition,
// under version control, with an owner and a review trail.
const DEFINITION = [
  { t: 'kw', s: 'metric' }, { t: 'nm', s: ' revenue' }, { t: 'p', s: ' {' }, { t: 'br' },
  { t: 'k', s: '  source' }, { t: 'p', s: '  ' }, { t: 'v', s: 'warehouse.finance.orders' }, { t: 'br' },
  { t: 'k', s: '  measure' }, { t: 'p', s: ' ' }, { t: 'fn', s: 'sum' }, { t: 'p', s: '(' }, { t: 'v', s: 'net_amount' }, { t: 'p', s: ')' }, { t: 'br' },
  { t: 'k', s: '  filter' }, { t: 'p', s: '  ' }, { t: 'v', s: "status != 'refunded'" }, { t: 'br' },
  { t: 'k', s: '  grain' }, { t: 'p', s: '   ' }, { t: 'v', s: 'day' }, { t: 'br' },
  { t: 'k', s: '  owner' }, { t: 'p', s: '   ' }, { t: 'v', s: '@finance-ops' }, { t: 'br' },
  { t: 'p', s: '}' },
]

const CHANGELOG = [
  { v: 'v1.4', who: '@finance-ops', what: 'exclude refunded orders' },
  { v: 'v1.3', who: '@data-platform', what: 'grain day → day (UTC)' },
  { v: 'v1.2', who: '@finance-ops', what: 'source moved to finance.orders' },
]

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return reduced
}

// The alert act owns the page while it is on screen: the series has left its
// band, so the site goes to the colour an on-call surface actually is.
function useInkAct(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => document.body.classList.toggle('is-ink', entry.intersectionRatio > 0.42),
      { threshold: [0, 0.42, 0.8] },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      document.body.classList.remove('is-ink')
    }
  }, [ref])
}

function priceFor(plan, billing) {
  if (plan.price === 'Custom' || plan.price === '$0') return plan.price
  if (billing === 'annual') return `$${Math.round(parseInt(plan.price.slice(1), 10) * 0.8)}`
  return plan.price
}

export default function App() {
  const [billing, setBilling] = useState('monthly')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [openFeature, setOpenFeature] = useState('alerts')
  const alertRef = useRef(null)
  const reducedMotion = useReducedMotion()
  useInkAct(alertRef)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
  }

  return (
    <div className="page">
      <MetricSpine reducedMotion={reducedMotion} />

      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#hero">
          <span className="nav-mark" aria-hidden="true">
            <svg viewBox="0 0 24 16" fill="none"><path d="M1 12 L6 12 L9 4 L13 14 L17 8 L23 8" /></svg>
          </span>
          Cadence
        </a>
        <div className="nav-links">
          <a href="#features">Product</a>
          <a href="#metrics">Performance</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <a className="nav-cta" href="#signup">Get started</a>
        </div>
      </nav>

      <header className="hero" id="hero">
        <div className="hero-copy">
          <p className="eyebrow">Warehouse-native analytics layer</p>
          <h1>
            One definition of revenue.
            <span className="hero-line-2">Every dashboard in the company.</span>
          </h1>
          <p className="lede">
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

        <aside className="definition" aria-label="Example governed metric definition">
          <div className="definition-head">
            <span className="definition-file">metrics/revenue.cadence</span>
            <span className="definition-ver">v1.4 · governed</span>
          </div>
          <pre className="definition-body">
            <code>
              {DEFINITION.map((tok, i) => (tok.t === 'br' ? '\n' : <span key={i} className={`tok tok-${tok.t}`}>{tok.s}</span>))}
            </code>
          </pre>
          <ol className="changelog">
            {CHANGELOG.map((c) => (
              <li key={c.v}>
                <span className="cl-v">{c.v}</span>
                <span className="cl-what">{c.what}</span>
                <span className="cl-who">{c.who}</span>
              </li>
            ))}
          </ol>
          <p className="definition-foot">The definition is the object under version control. The chart is disposable.</p>
        </aside>
      </header>

      <section className="section customers" id="customers">
        <p className="eyebrow">Trusted by operations teams at</p>
        <ul className="logos">
          {CUSTOMERS.map((c, i) => (
            <li key={c}>
              <span className="logo-idx">{String(i + 1).padStart(2, '0')}</span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      <section className="section metrics" id="metrics">
        <div className="section-head">
          <h2>Performance in production</h2>
          <p className="section-note">Instrument readings, not adjectives.</p>
        </div>
        <div className="metric-grid">
          {METRICS.map((m, i) => (
            <div className={`metric${i === 0 ? ' metric-lead' : ''}`} key={m.label} data-metric={m.label}>
              <span className="metric-idx" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <strong>{m.value}</strong>
              <span className="metric-label">{m.label}</span>
              <span className="metric-note">{m.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section features" id="features">
        <div className="section-head">
          <h2>What Cadence does</h2>
          <p className="section-note">Six parts, read top to bottom. Open a row to see its shape.</p>
        </div>
        <ul className="ledger">
          {FEATURES.map((f, i) => {
            const open = openFeature === f.id
            return (
              <li
                className={`ledger-row${open ? ' is-open' : ''}`}
                key={f.id}
                data-feature={f.id}
              >
                <button
                  type="button"
                  className="ledger-hit"
                  aria-expanded={open}
                  onClick={() => setOpenFeature(open ? null : f.id)}
                >
                  <span className="ledger-idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="ledger-text">
                    <span className="ledger-name">{f.name}</span>
                    <span className="ledger-body">{f.body}</span>
                  </span>
                  <span className="ledger-glyph">{GLYPHS[f.id]}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="section act" id="alert" ref={alertRef}>
        <div className="act-inner">
          <p className="act-time">03:14 · Tuesday</p>
          <h2 className="act-head">
            The line leaves
            <span className="act-breach">the band.</span>
          </h2>
          <p className="act-copy">
            Every metric on this page has a shape it normally keeps. Cadence learns that shape and
            watches the edges. When the series crosses out — not when it merely wobbles — the page
            goes to whoever owns the definition, with the query already attached.
          </p>
          <a className="btn btn-ghost" href="#features">Read how alerting works</a>
        </div>
        {/* The phone's spine is a thin margin thread, so the breach is re-staged
            here as a wide chart — same event, framed for a short landscape gap
            instead of a tall column. Desktop hides this; the canvas does it. */}
        <figure className="act-chart" aria-hidden="true">
          <svg viewBox="0 0 320 128" fill="none" preserveAspectRatio="none">
            <path className="ac-rail" d="M0 34 H320" />
            <path className="ac-rail" d="M0 100 H320" />
            <path className="ac-series" d="M0 78 L26 70 L52 84 L78 66 L104 80 L130 68 L156 82 L182 71 L208 14 L234 76 L260 69 L286 80 L320 72" />
            <circle className="ac-breach" cx="208" cy="14" r="6" />
          </svg>
          <figcaption>band · 7-day shape</figcaption>
        </figure>

        <figure className="alert-card" aria-label="Illustrative alert payload">
          <figcaption className="alert-cap">Example payload</figcaption>
          <dl>
            <div><dt>metric</dt><dd>revenue · v1.4</dd></div>
            <div><dt>expected</dt><dd>within band, 7-day shape</dd></div>
            <div><dt>observed</dt><dd className="is-breach">outside band</dd></div>
            <div><dt>owner</dt><dd>@finance-ops</dd></div>
            <div><dt>query</dt><dd>attached, editable</dd></div>
          </dl>
        </figure>
      </section>

      <section className="section pricing" id="pricing">
        <div className="section-head">
          <h2>Pricing</h2>
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
              className={billing === 'annual' ? 'active' : ''}
              aria-pressed={billing === 'annual'}
              onClick={() => setBilling('annual')}
            >
              Annual (save 20%)
            </button>
          </div>
        </div>
        <div className="plan-grid">
          {PLANS.map((p) => {
            const shown = priceFor(p, billing)
            const discounted = billing === 'annual' && shown !== p.price
            return (
              <article className={`plan${p.featured ? ' plan-featured' : ''}`} key={p.id} data-plan={p.id}>
                <header className="plan-head">
                  <h3>{p.name}</h3>
                  {p.featured && <span className="plan-tag">Most teams</span>}
                </header>
                <p className="plan-price">
                  <strong key={`${p.id}-${shown}`}>{shown}</strong>
                  <span> {p.unit}</span>
                </p>
                <p className="plan-delta" aria-live="polite">
                  {discounted ? `−20% annual · was ${p.price}` : ' '}
                </p>
                <ul className="plan-features">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`btn ${p.featured ? 'btn-primary' : 'btn-secondary'} plan-cta`}
                  onClick={() => alert(`${p.name}: ${p.cta}`)}
                >
                  {p.cta}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="section faq" id="faq">
        <div className="section-head">
          <h2>Frequently asked</h2>
        </div>
        <ul className="faq-list">
          {FAQ.map((item, i) => (
            <li className={`faq-item${openFaq === i ? ' is-open' : ''}`} key={item.q}>
              <button
                type="button"
                className="faq-q"
                aria-expanded={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="faq-idx" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="faq-qt">{item.q}</span>
                <span className="faq-sign" aria-hidden="true" />
              </button>
              {openFaq === i && <p className="faq-a">{item.a}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="section signup" id="signup">
        <div className="signup-copy">
          <p className="eyebrow">v1.0 · your workspace</p>
          <h2>Start with your own warehouse</h2>
          <p className="lede">Connect a read-only role and build your first governed metric in about ten minutes.</p>
        </div>
        {sent ? (
          <p className="form-success" role="status">Check your inbox — the workspace invite is on its way.</p>
        ) : (
          <form className="signup-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Work email</label>
            <div className="field">
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Create workspace</button>
            </div>
            <p className="form-note">Read-only role. Nothing is written back to your warehouse.</p>
          </form>
        )}
      </section>

      <footer className="footer" id="site-footer">
        <p className="footer-mark">© 2026 Cadence Analytics, Inc.</p>
        <div className="footer-links">
          <a href="#hero">Top</a>
          <a href="/docs">Docs</a>
          <a href="/security">Security</a>
          <a href="/status">Status</a>
        </div>
      </footer>
    </div>
  )
}
