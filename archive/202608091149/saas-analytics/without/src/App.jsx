import { useCallback, useEffect, useRef, useState } from 'react'

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

const NAV = [
  { href: '#features', label: 'Product', id: 'features' },
  { href: '#metrics', label: 'Performance', id: 'metrics' },
  { href: '#pricing', label: 'Pricing', id: 'pricing' },
  { href: '#faq', label: 'FAQ', id: 'faq' },
  { href: '#signup', label: 'Get started', id: 'signup' },
]

const pad = (n) => String(n).padStart(2, '0')

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/* Reveal elements once as they enter the viewport. */
function useReveal() {
  const root = useRef(null)
  useEffect(() => {
    const scope = root.current
    if (!scope) return
    const targets = scope.querySelectorAll('[data-reveal]')
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return root
}

/* Highlight the nav link for the section currently under the header. */
function useScrollSpy(ids) {
  const [active, setActive] = useState(null)
  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!sections.length) return
    const onScroll = () => {
      const line = window.innerHeight * 0.34
      let current = null
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= line) current = s.id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids])
  return active
}

/*
 * The hero instrument: a governed metric drawn against its expected band,
 * with one excursion that trips an alert. Same idea the product sells.
 */
function SignalPanel() {
  const canvasRef = useRef(null)
  const [tripped, setTripped] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const SPAN = 220
    const still = prefersReducedMotion()
    let width = 0
    let height = 0
    let raf = 0
    let t = 0

    // Deterministic pseudo-noise so the trace looks like data, not a sine wave.
    const wobble = (x) => {
      const a = Math.sin(x * 0.11) * 0.5
      const b = Math.sin(x * 0.29 + 1.3) * 0.28
      const c = Math.sin(x * 0.73 + 2.7) * 0.14
      const d = Math.sin(x * 1.97 + 0.4) * 0.06
      return a + b + c + d
    }
    // A single dip that sweeps through the window every cycle.
    const excursion = (x, head) => {
      const centre = head - 62
      const dx = (x - centre) / 9
      return -1.55 * Math.exp(-dx * dx)
    }
    const sample = (x, head) => wobble(x) + excursion(x, head)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      const head = still ? 96 : t
      const padX = 18
      const padY = 22
      const w = width - padX * 2
      const h = height - padY * 2
      const mid = padY + h / 2
      const amp = h / 2.55

      ctx.clearRect(0, 0, width, height)

      // ruled scale
      ctx.strokeStyle = 'rgba(232,230,225,0.07)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i += 1) {
        const y = Math.round(padY + (h / 4) * i) + 0.5
        ctx.beginPath()
        ctx.moveTo(padX, y)
        ctx.lineTo(padX + w, y)
        ctx.stroke()
      }
      for (let i = 0; i <= 10; i += 1) {
        const x = Math.round(padX + (w / 10) * i) + 0.5
        ctx.beginPath()
        ctx.moveTo(x, padY + h)
        ctx.lineTo(x, padY + h - (i % 5 === 0 ? 10 : 5))
        ctx.stroke()
      }

      const px = (i) => padX + (w / SPAN) * i
      const py = (v) => mid - v * amp

      // expected band
      ctx.beginPath()
      for (let i = 0; i <= SPAN; i += 1) ctx.lineTo(px(i), py(wobble(head - SPAN + i) * 0.62 + 0.5))
      for (let i = SPAN; i >= 0; i -= 1) ctx.lineTo(px(i), py(wobble(head - SPAN + i) * 0.62 - 0.5))
      ctx.closePath()
      ctx.fillStyle = 'rgba(203,242,94,0.07)'
      ctx.fill()

      // trace
      let breached = false
      ctx.beginPath()
      for (let i = 0; i <= SPAN; i += 1) {
        const x = head - SPAN + i
        const v = sample(x, head)
        const band = wobble(x) * 0.62
        if (v < band - 0.5 || v > band + 0.5) breached = true
        ctx.lineTo(px(i), py(v))
      }
      ctx.strokeStyle = 'rgba(203,242,94,0.92)'
      ctx.lineWidth = 1.6
      ctx.lineJoin = 'round'
      ctx.stroke()

      // head marker
      const hv = sample(head, head)
      const hx = px(SPAN)
      const hy = py(hv)
      ctx.beginPath()
      ctx.moveTo(hx, padY)
      ctx.lineTo(hx, padY + h)
      ctx.strokeStyle = 'rgba(232,230,225,0.16)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(hx, hy, 3.2, 0, Math.PI * 2)
      ctx.fillStyle = '#CBF25E'
      ctx.fill()

      // the excursion, marked where it happens
      const ex = head - 62
      if (ex > head - SPAN && ex < head) {
        const mx = px(SPAN - (head - ex))
        const my = py(sample(ex, head))
        ctx.beginPath()
        ctx.arc(mx, my, 5.5, 0, Math.PI * 2)
        ctx.strokeStyle = '#FF6B4A'
        ctx.lineWidth = 1.4
        ctx.stroke()
      }

      setTripped(breached)
    }

    const loop = () => {
      t += 0.42
      draw()
      raf = requestAnimationFrame(loop)
    }

    resize()
    draw()
    if (!still) raf = requestAnimationFrame(loop)

    const ro = new ResizeObserver(() => {
      resize()
      draw()
    })
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <figure className="panel" aria-hidden="true">
      <figcaption className="panel-head">
        <span className="panel-dot" />
        <span className="panel-name">revenue.net</span>
        <span className="panel-tag">governed · v14</span>
      </figcaption>
      <canvas className="panel-canvas" ref={canvasRef} />
      <div className="panel-foot">
        <span className={`panel-state${tripped ? ' is-alert' : ''}`}>
          {tripped ? 'anomaly · paging #rev-ops' : 'within expected band'}
        </span>
        <span className="panel-meta">340ms · 2.1B rows</span>
      </div>
    </figure>
  )
}

export default function App() {
  const [billing, setBilling] = useState('monthly')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  const pageRef = useReveal()
  const active = useScrollSpy(['features', 'metrics', 'pricing', 'faq', 'signup'])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      if (!email.includes('@')) return
      setSent(true)
      setEmail('')
    },
    [email],
  )

  const priceFor = (p) => {
    if (p.price === 'Custom' || p.price === '$0') return p.price
    if (billing === 'annual') return `$${Math.round(parseInt(p.price.slice(1), 10) * 0.8)}`
    return p.price
  }

  return (
    <div className="page" ref={pageRef}>
      <div className="grain" aria-hidden="true" />

      <nav className={`nav${scrolled ? ' is-stuck' : ''}`} id="site-nav">
        <a className="nav-logo" href="#hero" aria-label="Cadence, back to top">
          <span className="mark" aria-hidden="true">
            <i /> <i /> <i />
          </span>
          Cadence
        </a>
        <div className="nav-links">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`${active === l.id ? 'is-active' : ''}${l.id === 'signup' ? ' nav-cta' : ''}`}
            >
              {l.label}
            </a>
          ))}
        </div>
      </nav>

      <header className="hero" id="hero">
        <div className="hero-rule" aria-hidden="true">
          {Array.from({ length: 40 }).map((_, i) => (
            <i key={i} className={i % 5 === 0 ? 'major' : ''} />
          ))}
        </div>
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow" data-reveal>
              <span className="pulse" aria-hidden="true" />
              Warehouse-native analytics layer
            </p>
            <h1 data-reveal>
              One definition of revenue.
              <span className="h1-sub"> Every dashboard in the company.</span>
            </h1>
            <p className="lede" data-reveal>
              Cadence is a warehouse-native analytics layer for operations teams. Define your metrics
              once, govern who can change them, and let every chart, alert, and export inherit the same
              truth.
            </p>
            <div className="hero-actions" data-reveal>
              <a className="btn btn-primary" href="#signup">
                Start free
              </a>
              <a className="btn btn-secondary" href="#pricing">
                See pricing
              </a>
            </div>
            <p className="hero-note" data-reveal>
              Free for teams up to five editors. No card required.
            </p>
          </div>
          <div className="hero-panel" data-reveal>
            <SignalPanel />
          </div>
        </div>
      </header>

      <section className="strip" id="customers" aria-label="Customers">
        <p className="eyebrow strip-label">Trusted by operations teams at</p>
        <div className="ticker">
          <ul className="logos">
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

      <section className="section section-metrics" id="metrics">
        <div className="section-head">
          <span className="section-index">01</span>
          <h2>Performance in production</h2>
          <p className="section-note">Measured on live customer workspaces, not a benchmark rig.</p>
        </div>
        <div className="metric-grid">
          {METRICS.map((m, i) => (
            <div className="metric" key={m.label} data-metric={m.label} data-reveal style={{ '--d': `${i * 70}ms` }}>
              <span className="metric-ticks" aria-hidden="true">
                {Array.from({ length: 7 }).map((_, k) => (
                  <i key={k} />
                ))}
              </span>
              <strong>{m.value}</strong>
              <span className="metric-label">{m.label}</span>
              <span className="metric-note">{m.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-features" id="features">
        <div className="section-head">
          <span className="section-index">02</span>
          <h2>What Cadence does</h2>
          <p className="section-note">Six parts, one contract: the definition is the object of record.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <article className="feature" key={f.id} data-feature={f.id} data-reveal style={{ '--d': `${(i % 2) * 60}ms` }}>
              <span className="feature-index" aria-hidden="true">
                {pad(i + 1)}
              </span>
              <div className="feature-body">
                <h3>{f.name}</h3>
                <p>{f.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-pricing" id="pricing">
        <div className="section-head">
          <span className="section-index">03</span>
          <h2>Pricing</h2>
          <p className="section-note">Editors pay. Viewers never do.</p>
        </div>

        <div className="billing-toggle" role="group" aria-label="Billing period">
          <span className="toggle-thumb" data-pos={billing} aria-hidden="true" />
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
          {PLANS.map((p, i) => (
            <article
              className={`plan${p.featured ? ' plan-featured' : ''}`}
              key={p.id}
              data-plan={p.id}
              data-reveal
              style={{ '--d': `${i * 80}ms` }}
            >
              {p.featured && <span className="plan-flag">Most teams start here</span>}
              <h3>{p.name}</h3>
              <p className="plan-price">
                <strong>{priceFor(p)}</strong>
                <span> {p.unit}</span>
              </p>
              <p className="plan-billing-note">
                {p.price === 'Custom'
                  ? 'Scoped with your team'
                  : p.price === '$0'
                    ? 'Free forever'
                    : billing === 'annual'
                      ? 'Billed annually · 20% off'
                      : 'Billed monthly'}
              </p>
              <ul className="plan-features">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                type="button"
                className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => alert(`${p.name}: ${p.cta}`)}
              >
                {p.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-faq" id="faq">
        <div className="section-head">
          <span className="section-index">04</span>
          <h2>Frequently asked</h2>
          <p className="section-note">The four questions every data team asks in the first call.</p>
        </div>
        <ul className="faq">
          {FAQ.map((item, i) => (
            <li className={`faq-item${openFaq === i ? ' is-open' : ''}`} key={item.q} data-reveal>
              <button
                type="button"
                className="faq-q"
                aria-expanded={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="faq-num" aria-hidden="true">
                  {pad(i + 1)}
                </span>
                <span className="faq-text">{item.q}</span>
                <span className="faq-sign" aria-hidden="true" />
              </button>
              {openFaq === i && <p className="faq-a">{item.a}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="section signup" id="signup">
        <div className="signup-inner">
          <h2 data-reveal>Start with your own warehouse</h2>
          <p className="signup-lede" data-reveal>
            Connect a read-only role and build your first governed metric in about ten minutes.
          </p>
          {sent ? (
            <p className="form-success" role="status">
              <span className="tick" aria-hidden="true" />
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
                <button type="submit" className="btn btn-primary">
                  Create workspace
                </button>
              </div>
            </form>
          )}
          <ul className="signup-facts" aria-label="What you get">
            <li>Read-only role</li>
            <li>No pipeline to build</li>
            <li>SOC 2 Type II</li>
          </ul>
        </div>
      </section>

      <footer className="footer" id="site-footer">
        <div className="footer-mark" aria-hidden="true">
          Cadence
        </div>
        <div className="footer-row">
          <p>© 2026 Cadence Analytics, Inc.</p>
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
