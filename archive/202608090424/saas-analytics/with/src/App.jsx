import { useState } from 'react'

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

export default function App() {
  const [billing, setBilling] = useState('monthly')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
  }

  return (
    <div className="page">
      <nav className="nav" id="site-nav">
        <span className="nav-logo">Cadence</span>
        <div className="nav-links">
          <a href="#features">Product</a>
          <a href="#metrics">Performance</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <a href="#signup">Get started</a>
        </div>
      </nav>

      <header className="hero" id="hero">
        <h1>One definition of revenue. Every dashboard in the company.</h1>
        <p>
          Cadence is a warehouse-native analytics layer for operations teams. Define your metrics
          once, govern who can change them, and let every chart, alert, and export inherit the same
          truth.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#signup">Start free</a>
          <a className="btn btn-secondary" href="#pricing">See pricing</a>
        </div>
        <p className="hero-note">Free for teams up to five editors. No card required.</p>
      </header>

      <section className="section customers" id="customers">
        <p className="eyebrow">Trusted by operations teams at</p>
        <ul className="logos">
          {CUSTOMERS.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section className="section" id="metrics">
        <h2>Performance in production</h2>
        <div className="metric-grid">
          {METRICS.map((m) => (
            <div className="metric" key={m.label} data-metric={m.label}>
              <strong>{m.value}</strong>
              <span className="metric-label">{m.label}</span>
              <span className="metric-note">{m.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="features">
        <h2>What Cadence does</h2>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article className="feature" key={f.id} data-feature={f.id}>
              <h3>{f.name}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="pricing">
        <h2>Pricing</h2>
        <div className="billing-toggle" role="group" aria-label="Billing period">
          <button
            type="button"
            className={billing === 'monthly' ? 'active' : ''}
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </button>
          <button
            type="button"
            className={billing === 'annual' ? 'active' : ''}
            onClick={() => setBilling('annual')}
          >
            Annual (save 20%)
          </button>
        </div>
        <div className="plan-grid">
          {PLANS.map((p) => (
            <article className={`plan${p.featured ? ' plan-featured' : ''}`} key={p.id} data-plan={p.id}>
              <h3>{p.name}</h3>
              <p className="plan-price">
                <strong>
                  {p.price === 'Custom' || p.price === '$0'
                    ? p.price
                    : billing === 'annual'
                      ? `$${Math.round(parseInt(p.price.slice(1), 10) * 0.8)}`
                      : p.price}
                </strong>
                <span> {p.unit}</span>
              </p>
              <ul className="plan-features">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button type="button" className="btn btn-primary" onClick={() => alert(`${p.name}: ${p.cta}`)}>
                {p.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="faq">
        <h2>Frequently asked</h2>
        <ul className="faq">
          {FAQ.map((item, i) => (
            <li className="faq-item" key={item.q}>
              <button
                type="button"
                className="faq-q"
                aria-expanded={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {item.q}
              </button>
              {openFaq === i && <p className="faq-a">{item.a}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="section signup" id="signup">
        <h2>Start with your own warehouse</h2>
        <p>Connect a read-only role and build your first governed metric in about ten minutes.</p>
        {sent ? (
          <p className="form-success" role="status">Check your inbox — the workspace invite is on its way.</p>
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
            <button type="submit" className="btn btn-primary">Create workspace</button>
          </form>
        )}
      </section>

      <footer className="footer" id="site-footer">
        <p>© 2026 Cadence Analytics, Inc.</p>
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
