import { useEffect, useRef, useState } from 'react'

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

const PLAN_META = {
  team: 'no card required',
  growth: 'most teams land here',
  enterprise: 'scoped with you',
}

/* ---------- signal drawing ---------------------------------------------- */

// Deterministic noise so the site renders identically on every load.
function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function seriesFor(seed, count, spikeAt) {
  const rand = seeded(seed)
  const out = []
  let level = 0.5
  for (let i = 0; i < count; i += 1) {
    level += (rand() - 0.5) * 0.22
    level += (0.5 - level) * 0.12
    let v = level + Math.sin(i / 3.1) * 0.07
    if (spikeAt != null && i === spikeAt) v += 0.42
    if (spikeAt != null && i === spikeAt + 1) v += 0.2
    out.push(Math.min(0.98, Math.max(0.04, v)))
  }
  return out
}

function toPath(values, w, h, pad = 2) {
  const step = w / (values.length - 1)
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(2)} ${(h - pad - v * (h - pad * 2)).toFixed(2)}`)
    .join(' ')
}

function Spark({ seed, w = 132, h = 34, spikeAt = null }) {
  const values = seriesFor(seed, 40, spikeAt)
  const line = toPath(values, w, h)
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true" preserveAspectRatio="none">
      <path d={`${line} L${w} ${h} L0 ${h} Z`} className="spark-fill" />
      <path d={line} className="spark-line" />
    </svg>
  )
}

/* The hero instrument: a live-looking metric trace with a flagged anomaly. */
function Instrument() {
  const W = 560
  const H = 180
  const spikeAt = 27
  const values = seriesFor(20260810, 40, spikeAt)
  const line = toPath(values, W, H, 14)
  const step = W / (values.length - 1)
  const spikeX = spikeAt * step
  const spikeY = H - 14 - values[spikeAt] * (H - 28)

  return (
    <svg className="instrument" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Trace of the governed revenue metric with one flagged anomaly">
      <defs>
        <linearGradient id="traceFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} className="instrument-rule" x1="0" x2={W} y1={H * t} y2={H * t} />
      ))}
      <path className="instrument-band" d={`${line} L${W} ${H} L0 ${H} Z`} fill="url(#traceFill)" />
      <path className="instrument-trace" d={line} />
      <line className="instrument-drop" x1={spikeX} x2={spikeX} y1={spikeY} y2={H} />
      <circle className="instrument-dot" cx={spikeX} cy={spikeY} r="4.5" />
      <circle className="instrument-halo" cx={spikeX} cy={spikeY} r="4.5" />
    </svg>
  )
}

/* ---------- behaviour ---------------------------------------------------- */

function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-in'))
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
}

function SectionHead({ index, kicker, title, lede, id }) {
  return (
    <div className="head" data-reveal>
      <p className="index">
        <span>{index}</span>
        {kicker}
      </p>
      <h2 id={id}>{title}</h2>
      {lede && <p className="lede">{lede}</p>}
    </div>
  )
}

function FaqRow({ item, open, onToggle }) {
  return (
    <li className={`faq-item${open ? ' is-open' : ''}`}>
      <h3>
        <button type="button" className="faq-q" aria-expanded={open} onClick={onToggle}>
          <span className="faq-mark" aria-hidden="true">
            <i />
            <i />
          </span>
          <span>{item.q}</span>
        </button>
      </h3>
      <div className="faq-wrap">
        <div className="faq-inner">
          <p className="faq-a">{item.a}</p>
        </div>
      </div>
    </li>
  )
}

export default function App() {
  const [billing, setBilling] = useState('monthly')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [toast, setToast] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const toggleRef = useRef(null)
  const [thumb, setThumb] = useState(null)

  useReveal()

  // Slide the toggle highlight onto whichever label is active, measured so it
  // survives font loading and text-length changes.
  useEffect(() => {
    const measure = () => {
      const el = toggleRef.current
      if (!el) return
      const active = el.querySelector('button.active')
      if (!active) return
      setThumb({ left: active.offsetLeft, width: active.offsetWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure).catch(() => {})
    return () => window.removeEventListener('resize', measure)
  }, [billing])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
  }

  function priceFor(plan) {
    if (plan.price === 'Custom' || plan.price === '$0') return plan.price
    const monthly = parseInt(plan.price.slice(1), 10)
    return billing === 'annual' ? `$${Math.round(monthly * 0.8)}` : plan.price
  }

  return (
    <div className="page">
      <div className="grain" aria-hidden="true" />

      <a className="skip" href="#hero">Skip to content</a>

      <nav className={`nav${scrolled ? ' is-stuck' : ''}`} id="site-nav">
        <div className="nav-inner">
          <a className="nav-logo" href="#hero">
            <span className="nav-mark" aria-hidden="true">
              <i />
              <i />
              <i />
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
        </div>
      </nav>

      <header className="hero" id="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="index hero-index">
              <span>00</span>
              Warehouse-native analytics
            </p>
            <h1>
              One definition of revenue.
              <em> Every dashboard</em> in the company.
            </h1>
            <p className="hero-lede">
              Cadence is a warehouse-native analytics layer for operations teams. Define your metrics
              once, govern who can change them, and let every chart, alert, and export inherit the same
              truth.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#signup">Start free</a>
              <a className="btn btn-ghost" href="#pricing">See pricing</a>
            </div>
            <p className="hero-note">Free for teams up to five editors. No card required.</p>
          </div>

          <aside className="panel" aria-label="Example governed metric">
            <div className="panel-bar">
              <span className="panel-title">metrics/revenue.net.yml</span>
              <span className="panel-state">
                <i className="pulse" aria-hidden="true" />
                governed
              </span>
            </div>
            <pre className="panel-code">
              <code>
                <span className="k">metric</span>: net_revenue{'\n'}
                <span className="k">owner</span>: finance-ops{'\n'}
                <span className="k">source</span>: warehouse.orders{'\n'}
                <span className="k">expr</span>: sum(amount) - sum(refunds){'\n'}
                <span className="k">grain</span>: [day, region, plan]{'\n'}
                <span className="c"># 41 dashboards inherit this</span>
              </code>
            </pre>
            <Instrument />
            <div className="panel-foot">
              <span className="flagged">anomaly flagged 04:12 UTC</span>
              <span>paged finance-ops · resolved</span>
            </div>
          </aside>
        </div>
      </header>

      <section className="customers" id="customers" aria-label="Customers">
        <p className="eyebrow">Trusted by operations teams at</p>
        <div className="marquee">
          <ul className="logos" aria-hidden="false">
            {CUSTOMERS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <ul className="logos" aria-hidden="true">
            {CUSTOMERS.map((c) => (
              <li key={`${c}-dup`}>{c}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section metrics" id="metrics" aria-labelledby="metrics-title">
        <SectionHead
          index="01"
          kicker="Performance"
          id="metrics-title"
          title="Performance in production"
          lede="Numbers from the fleet, not from a benchmark rig."
        />
        <div className="metric-grid">
          {METRICS.map((m, i) => (
            <div className="metric" key={m.label} data-metric={m.label} data-reveal style={{ '--d': `${i * 70}ms` }}>
              <Spark seed={91 + i * 37} spikeAt={i === 2 ? 22 : null} />
              <strong>{m.value}</strong>
              <span className="metric-label">{m.label}</span>
              <span className="metric-note">{m.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section features" id="features" aria-labelledby="features-title">
        <SectionHead
          index="02"
          kicker="Capabilities"
          id="features-title"
          title="What Cadence does"
          lede="Six things, each of which exists because a definition drifted somewhere and nobody noticed."
        />
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <article className="feature" key={f.id} data-feature={f.id} data-reveal style={{ '--d': `${(i % 2) * 60 + Math.floor(i / 2) * 40}ms` }}>
              <span className="feature-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <div className="feature-body">
                <h3>{f.name}</h3>
                <p>{f.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section pricing" id="pricing" aria-labelledby="pricing-title">
        <SectionHead
          index="03"
          kicker="Pricing"
          id="pricing-title"
          title="Pricing"
          lede="Per workspace, not per seat you forgot to deprovision."
        />

        <div className="billing-toggle" role="group" aria-label="Billing period" ref={toggleRef}>
          <span className="billing-thumb" style={thumb} aria-hidden="true" />
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

        <div className="plan-grid">
          {PLANS.map((p) => (
            <article
              className={`plan${p.featured ? ' plan-featured' : ''}`}
              key={p.id}
              data-plan={p.id}
              data-reveal
            >
              {p.featured && <span className="plan-tag">Recommended</span>}
              <h3>{p.name}</h3>
              <p className="plan-price">
                <strong key={`${p.id}-${billing}`}>{priceFor(p)}</strong>
                <span> {p.unit}</span>
              </p>
              <p className="plan-meta">{PLAN_META[p.id]}</p>
              <ul className="plan-features">
                {p.features.map((f) => (
                  <li key={f}>
                    <span className="tick" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'} plan-cta`}
                onClick={() => setToast(`${p.name}: ${p.cta}`)}
              >
                {p.cta}
              </button>
            </article>
          ))}
        </div>
        <p className="pricing-foot">
          Annual billing applies a 20% discount to the monthly rate. Prices exclude tax.
        </p>
      </section>

      <section className="section faq" id="faq" aria-labelledby="faq-title">
        <SectionHead
          index="04"
          kicker="Questions"
          id="faq-title"
          title="Frequently asked"
          lede="The four that come up on every call."
        />
        <ul className="faq-list" data-reveal>
          {FAQ.map((item, i) => (
            <FaqRow
              key={item.q}
              item={item}
              open={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </ul>
      </section>

      <section className="signup" id="signup" aria-labelledby="signup-title">
        <div className="signup-inner" data-reveal>
          <div className="signup-copy">
            <p className="index">
              <span>05</span>
              Get started
            </p>
            <h2 id="signup-title">Start with your own warehouse</h2>
            <p className="lede">
              Connect a read-only role and build your first governed metric in about ten minutes.
            </p>
          </div>

          <div className="signup-form-wrap">
            {sent ? (
              <p className="form-success" role="status">
                <span className="tick tick-lg" aria-hidden="true" />
                Check your inbox — the workspace invite is on its way.
              </p>
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
                <p className="field-note">Read-only credentials. Revoke any time.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="footer" id="site-footer">
        <div className="footer-inner">
          <p className="footer-mark">
            <span className="nav-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            © 2026 Cadence Analytics, Inc.
          </p>
          <div className="footer-links">
            <a href="#hero">Top</a>
            <a href="/docs">Docs</a>
            <a href="/security">Security</a>
            <a href="/status">Status</a>
          </div>
        </div>
      </footer>

      <div className="toast-layer" aria-live="polite">
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  )
}
