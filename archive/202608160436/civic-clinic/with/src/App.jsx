import { useEffect, useMemo, useRef, useState } from 'react'

/* ---------------------------------------------------------------------------
   Data. Times are kept as strings for display and converted to minutes for the
   day rail, so the exact published hours are never re-derived or rounded.
--------------------------------------------------------------------------- */

const HOURS = [
  { day: 'Monday', open: '8:00', close: '20:00' },
  { day: 'Tuesday', open: '8:00', close: '20:00' },
  { day: 'Wednesday', open: '8:00', close: '20:00' },
  { day: 'Thursday', open: '8:00', close: '20:00' },
  { day: 'Friday', open: '8:00', close: '17:00' },
  { day: 'Saturday', open: '9:00', close: '14:00' },
  { day: 'Sunday', open: null, close: null },
]

const SERVICES = [
  {
    id: 'primary',
    name: 'General check-ups and illness',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    access: 'walkin',
  },
  {
    id: 'mental',
    name: 'Counselling and mental health',
    eligibility: 'Anyone 14+, walk-in or booked',
    cost: 'Free, first session same day when possible',
    access: 'walkin',
  },
  {
    id: 'pediatric',
    name: 'Children and infant care',
    eligibility: 'Under 18 with any adult',
    cost: 'Free, including vaccinations',
    access: 'walkin',
  },
  {
    id: 'prescriptions',
    name: 'Prescriptions and refills',
    eligibility: 'Existing and new patients',
    cost: 'Free to issue, medication costs vary',
    access: 'walkin',
  },
  {
    id: 'screening',
    name: 'Blood pressure, diabetes, and vision screening',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    access: 'walkin',
  },
  {
    id: 'dental',
    name: 'Dental cleaning and extractions',
    eligibility: 'Adults 18+, appointment needed',
    cost: 'Free, limited slots each week',
    access: 'booked',
  },
]

const LANGUAGES = [
  { name: 'English', native: 'English' },
  { name: 'Spanish', native: 'Español' },
  { name: 'Vietnamese', native: 'Tiếng Việt' },
  { name: 'Somali', native: 'Soomaali' },
  { name: 'Haitian Creole', native: 'Kreyòl Ayisyen' },
  { name: 'Mandarin', native: '普通话' },
  { name: 'Arabic', native: 'العربية' },
]

const ASSURANCES = [
  { head: 'No insurance required', sub: 'We never ask for a card, a policy, or a bill.' },
  { head: 'No immigration status questions', sub: 'We do not ask, and we do not share records.' },
  { head: 'No cost for any visit', sub: 'Every service on this page is free to you.' },
]

/* Day rail axis. One shared 7:00–21:00 scale carries today's status, the week
   table, and the mobile strip, so the same picture means the same thing
   everywhere on the page. */
const AXIS_START = 7 * 60
const AXIS_END = 21 * 60
const REGISTRATION_LEAD = 30 // walk-in registration closes 30 min before the door

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
const fromMin = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
const pct = (m) => ((m - AXIS_START) / (AXIS_END - AXIS_START)) * 100
const clampPct = (m) => Math.max(0, Math.min(100, pct(m)))

function humanGap(mins) {
  if (mins >= 120) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m ? `${h} hours ${m} minutes` : `${h} hours`
  }
  if (mins >= 60) {
    const m = mins - 60
    return m ? `1 hour ${m} minutes` : '1 hour'
  }
  return `${mins} minutes`
}

/* Today's answer to the only question most people arrive with. */
function readStatus(now) {
  const idx = (now.getDay() + 6) % 7 // Monday-first, matching the table
  const today = HOURS[idx]
  const minutes = now.getHours() * 60 + now.getMinutes()

  const nextOpenDay = () => {
    for (let i = 1; i <= 7; i += 1) {
      const d = HOURS[(idx + i) % 7]
      if (d.open) return { day: i === 1 ? 'tomorrow' : d.day, name: d.day, at: d.open, entry: d }
    }
    return null
  }

  if (!today.open) {
    const n = nextOpenDay()
    return {
      state: 'closed',
      day: today,
      verdict: 'Closed today',
      detail: `We are closed every ${today.day}. We open again ${n.day} at ${n.at}.`,
      railDay: n.entry,
      railLabel: `Next open — ${n.name}`,
      minutes,
    }
  }

  const open = toMin(today.open)
  const close = toMin(today.close)
  const lastReg = close - REGISTRATION_LEAD

  if (minutes < open) {
    return {
      state: 'closed',
      day: today,
      verdict: 'Not open yet',
      detail: `We open at ${today.open} today, in ${humanGap(open - minutes)}. Last patient accepted at ${fromMin(lastReg)}.`,
      railDay: today,
      railLabel: 'Today',
      minutes,
    }
  }
  if (minutes >= close) {
    const n = nextOpenDay()
    return {
      state: 'closed',
      day: today,
      verdict: 'Closed for today',
      detail: `We closed at ${today.close}. We open again ${n.day} at ${n.at}.`,
      railDay: n.entry,
      railLabel: `Next open — ${n.name}`,
      minutes,
    }
  }
  if (minutes >= lastReg) {
    return {
      state: 'late',
      day: today,
      verdict: 'Registration closed',
      detail: `Walk-in registration closed at ${fromMin(lastReg)}. The door is open until ${today.close} — if it is urgent, come in anyway and speak to the front desk.`,
      railDay: today,
      railLabel: 'Today',
      minutes,
    }
  }
  const left = lastReg - minutes
  return {
    state: left <= 60 ? 'soon' : 'open',
    day: today,
    verdict: left <= 60 ? 'Open, closing soon' : 'Open now for walk-ins',
    detail:
      left <= 60
        ? `Last patient accepted at ${fromMin(lastReg)} today — that is ${humanGap(left)} from now.`
        : `Last patient accepted at ${fromMin(lastReg)} today. You have ${humanGap(left)} to arrive.`,
    railDay: today,
    railLabel: 'Today',
    minutes,
  }
}

const STATE_WORD = { open: 'Open', soon: 'Closing soon', late: 'Door open', closed: 'Closed' }

/* ---------------------------------------------------------------------------
   Reveal: 12–20px of travel, once, measured against the top of the viewport.
   Anything already on screen at load is marked in without animating.
--------------------------------------------------------------------------- */
function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      nodes.forEach((n) => n.setAttribute('data-reveal', 'in'))
      return undefined
    }
    const pending = []
    nodes.forEach((n) => {
      if (n.getBoundingClientRect().top < window.innerHeight * 0.92) {
        n.setAttribute('data-reveal', 'in')
      } else {
        pending.push(n)
      }
    })
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute('data-reveal', 'in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    )
    pending.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
}

/* ---------------------------------------------------------------------------
   The day rail — the signature component. It draws the clinic's actual open
   span on a 7:00–21:00 axis, marks where walk-in registration stops, and puts
   a marker at the current time. It is the page answering "can I go now?" as a
   picture rather than as a sentence you have to compute.
--------------------------------------------------------------------------- */
function DayRail({ entry, nowMinutes, live, state, label }) {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (!entry || !entry.open) return null
  const open = toMin(entry.open)
  const close = toMin(entry.close)
  const lastReg = close - REGISTRATION_LEAD
  const left = clampPct(open)
  const right = clampPct(close)
  const regRight = clampPct(lastReg)
  const nowInside = live && nowMinutes >= AXIS_START && nowMinutes <= AXIS_END

  return (
    <div className={`rail rail--${state}`} data-drawn={drawn ? 'yes' : 'no'}>
      <div className="rail-head">
        <span className="rail-label">{label}</span>
        <span className="rail-range">
          {label === 'Today' ? `${entry.day} · ` : ''}
          {entry.open}–{entry.close}
        </span>
      </div>

      <div className="rail-track" role="img" aria-label={`${entry.day}: open ${entry.open} to ${entry.close}, walk-in registration until ${fromMin(lastReg)}`}>
        <span className="rail-open" style={{ left: `${left}%`, width: `${regRight - left}%` }} />
        <span className="rail-grace" style={{ left: `${regRight}%`, width: `${right - regRight}%` }} />
        <span className="rail-cut" style={{ left: `${regRight}%` }} />
        {nowInside && (
          <span className="rail-now" style={{ left: `${clampPct(nowMinutes)}%` }}>
            <span className="rail-now-flag">now {fromMin(nowMinutes)}</span>
          </span>
        )}
      </div>

      <div className="rail-scale" aria-hidden="true">
        {[7, 10, 13, 16, 19, 21].map((h) => (
          <span key={h} className="rail-tick" style={{ left: `${pct(h * 60)}%` }}>
            {h}:00
          </span>
        ))}
      </div>

      <ul className="rail-key">
        <li>
          <i className="key key--open" /> Walk in until {fromMin(lastReg)}
        </li>
        <li>
          <i className="key key--grace" /> Door open, urgent only, until {entry.close}
        </li>
      </ul>
    </div>
  )
}

/* A compact static version of the same picture, one row per day. */
function WeekBar({ entry, isToday }) {
  if (!entry.open) return <span className="week-bar week-bar--closed" aria-hidden="true" />
  const open = toMin(entry.open)
  const close = toMin(entry.close)
  const regRight = clampPct(close - REGISTRATION_LEAD)
  const left = clampPct(open)
  return (
    <span className="week-bar" data-today={isToday ? 'yes' : 'no'}>
      <span className="week-fill" style={{ left: `${left}%`, width: `${regRight - left}%` }} />
      <span className="week-grace" style={{ left: `${regRight}%`, width: `${clampPct(close) - regRight}%` }} />
    </span>
  )
}

export default function App() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  useReveal()

  const status = useMemo(() => readStatus(now), [now])
  const todayIdx = (now.getDay() + 6) % 7

  const [service, setService] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [booked, setBooked] = useState(false)
  const formRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !phone || !service) return
    setBooked(true)
  }

  const dateLine = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="page" data-state={status.state}>
      <a className="skip" href="#status">
        Skip to today’s status
      </a>

      <div className="emergency" role="alert" id="emergency">
        <div className="emergency-in">
          <span className="emergency-mark" aria-hidden="true">
            911
          </span>
          <p>
            Chest pain, trouble breathing, or severe bleeding?{' '}
            <a href="tel:911">Call 911 now</a> — do not wait for the clinic.
          </p>
        </div>
      </div>

      <nav className="nav" id="site-nav" aria-label="Main">
        <a className="nav-logo" href="#status">
          <span className="nav-mark" aria-hidden="true" />
          Eastside Community Health
        </a>
        <span className={`nav-status nav-status--${status.state}`}>
          <i aria-hidden="true" />
          {STATE_WORD[status.state]}
        </span>
        <div className="nav-links">
          <a href="#hours">Hours</a>
          <a href="#services">Services</a>
          <a href="#visit">Getting here</a>
          <a href="#languages">Languages</a>
          <a href="#book">Book</a>
        </div>
        <a className="nav-call" href="tel:+15550142900">
          (555) 014-2900
        </a>
      </nav>

      <header className="hero" id="status">
        <div className="hero-verdict">
          <p className="eyebrow">{dateLine}</p>
          <p className="status-line" id="walkin-status">
            <span className={`verdict verdict--${status.state}`}>{status.verdict}</span>
            <span className="verdict-detail">{status.detail}</span>
          </p>

          <DayRail
            entry={status.railDay}
            nowMinutes={status.minutes}
            live={status.railLabel === 'Today'}
            state={status.state}
            label={status.railLabel}
          />

          <div className="hero-actions">
            <a className="btn btn-primary" href="tel:+15550142900">
              Call (555) 014-2900
            </a>
            <a className="btn btn-secondary" href="#visit">
              Get directions
            </a>
          </div>
        </div>

        <aside className="hero-where" aria-label="Where to find us">
          <h2 className="where-title">Walk in at</h2>
          <address className="address">
            1140 East Barrow Street
            <br />
            Eastside, Springfield 62704
          </address>
          <ul className="where-quick">
            <li>
              <span className="wq-label">Bus</span>
              <span>14 and 27 stop outside the door</span>
            </li>
            <li>
              <span className="wq-label">Train</span>
              <span>Green line, Barrow Street, 4 min walk</span>
            </li>
            <li>
              <span className="wq-label">Car</span>
              <span>Free parking, entrance on Alder Lane</span>
            </li>
          </ul>
          <a className="where-more" href="#visit">
            Full directions and access
          </a>
        </aside>

        <h1 className="hero-claim">
          <span>
            Free healthcare for everyone in the Eastside, <em>no questions asked.</em>
          </span>
        </h1>
      </header>

      <section className="assure" aria-labelledby="assure-h">
        <h2 className="sr-only" id="assure-h">
          What we never ask you for
        </h2>
        <ul className="assurances">
          {ASSURANCES.map((a, i) => (
            <li className="assurance" key={a.head} data-reveal="out" style={{ transitionDelay: `${i * 70}ms` }}>
              <span className="assurance-no" aria-hidden="true">
                No
              </span>
              <strong>{a.head.replace(/^No /, '')}</strong>
              <span className="assurance-sub">{a.sub}</span>
            </li>
          ))}
        </ul>
        <div className="assure-foot">
          <p>
            You do not need insurance. You do not need a permanent address. We do not ask about your
            immigration status, and we do not share patient records with any other agency.
          </p>
        </div>
      </section>

      <main>
        <section className="section section--hours" id="hours" data-reveal="out">
          <div className="section-head">
            <h2>Opening hours</h2>
            <p className="section-sub">
              Bars show the walk-in window on a 7:00–21:00 scale. The pale tail is the last half hour,
              when the door is open but registration has closed.
            </p>
          </div>

          <table className="hours-table">
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col" className="col-bar">
                  Walk-in window
                </th>
                <th scope="col" className="num">
                  Open
                </th>
                <th scope="col" className="num">
                  Close
                </th>
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h, i) => (
                <tr
                  key={h.day}
                  data-day={h.day.toLowerCase()}
                  data-today={i === todayIdx ? 'yes' : 'no'}
                  data-closed={h.open ? 'no' : 'yes'}
                >
                  <th scope="row">
                    {h.day}
                    {i === todayIdx && <span className="today-tag">today</span>}
                  </th>
                  <td className="col-bar">
                    <WeekBar entry={h} isToday={i === todayIdx} />
                  </td>
                  {h.open ? (
                    <>
                      <td className="num">{h.open}</td>
                      <td className="num">{h.close}</td>
                    </>
                  ) : (
                    <td className="num closed-cell" colSpan={2}>
                      Closed
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="note">
            Walk-in registration closes 30 minutes before we do. If you arrive late and it is urgent,
            come in anyway and speak to the front desk.
          </p>
        </section>

        <section className="section section--services" id="services" data-reveal="out">
          <div className="section-head">
            <h2>What we can help with</h2>
            <p className="section-sub">Six services. Five of them you can walk into today.</p>
          </div>

          {[
            { key: 'walkin', title: 'Walk in — no appointment', note: 'Just come to the front desk during the hours above.' },
            { key: 'booked', title: 'Book ahead', note: 'Only this one needs a slot. Use the form below or call.' },
          ].map((group) => (
            <div className="svc-group" key={group.key} data-access={group.key}>
              <div className="svc-group-head">
                <h3>{group.title}</h3>
                <p>{group.note}</p>
              </div>
              <ul className="services">
                <li className="service service--head" aria-hidden="true">
                  <span className="svc-name">Service</span>
                  <span className="svc-who">Who can come</span>
                  <span className="svc-cost">Cost</span>
                </li>
                {SERVICES.filter((s) => s.access === group.key).map((s) => (
                  <li className="service" key={s.id} data-service={s.id}>
                    <span className="svc-name">{s.name}</span>
                    <span className="svc-who">
                      <span className="m-label">Who can come</span>
                      {s.eligibility}
                    </span>
                    <span className="svc-cost">
                      <span className="m-label">Cost</span>
                      {s.cost}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="section section--visit" id="visit" data-reveal="out">
          <div className="section-head">
            <h2>Getting here</h2>
          </div>
          <div className="visit-grid">
            <div className="visit-card">
              <h3>Address</h3>
              <address className="address address--big">
                1140 East Barrow Street
                <br />
                Eastside, Springfield 62704
              </address>
              <p className="visit-phone">
                <span className="wq-label">Phone</span>
                <a href="tel:+15550142900">(555) 014-2900</a>
              </p>
            </div>
            <div className="visit-card">
              <h3>Ways to arrive</h3>
              <ul className="transit">
                <li>Bus 14 and 27 stop directly outside the door on East Barrow.</li>
                <li>Green line to Barrow Street station, then a four-minute walk east.</li>
                <li>Free parking behind the building, entrance from Alder Lane.</li>
                <li>Step-free entrance and accessible restrooms on the ground floor.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section section--lang" id="languages" data-reveal="out">
          <div className="section-head">
            <h2>We speak your language</h2>
            <p className="section-sub">
              Staff or on-site interpreters are available in these languages during all opening hours:
            </p>
          </div>
          <ul className="languages">
            {LANGUAGES.map((l) => (
              <li key={l.name}>
                <span className="lang-native" lang={l.name === 'Arabic' ? 'ar' : undefined}>
                  {l.native}
                </span>
                <span className="lang-en">{l.name}</span>
              </li>
            ))}
          </ul>
          <p className="interpreter">
            <span>For any other language, call our free interpreter line —</span>
            <a className="interpreter-tel" href="tel:+15550142911">
              (555) 014-2911
            </a>
            <span className="interpreter-note">
              We will connect a translator before your visit.
            </span>
          </p>
        </section>

        <section className="section section--book" id="book" data-reveal="out">
          <div className="section-head">
            <h2>Book an appointment</h2>
            <p className="section-sub">
              Walk-ins are always welcome. Booking is only needed for dental and some counselling
              slots.
            </p>
          </div>
          {booked ? (
            <p className="form-success" role="status">
              Thank you, {name}. We will call {phone} within one working day to confirm your time.
            </p>
          ) : (
            <form className="booking-form" onSubmit={handleSubmit} ref={formRef}>
              <div className="field">
                <label htmlFor="svc">Which service?</label>
                <select
                  id="svc"
                  name="service"
                  required
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option value="">Choose a service</option>
                  {SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="name">Your name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Request appointment
              </button>
              <p className="form-note">
                We only use your number to confirm the time. Nothing is shared with any other agency.
              </p>
            </form>
          )}
        </section>
      </main>

      <footer className="footer" id="site-footer">
        <div className="footer-in">
          <p className="footer-mark">Eastside Community Health</p>
          <p>© 2026 Eastside Community Health — a nonprofit clinic funded by Springfield County</p>
          <div className="footer-links">
            <a href="#status">Top</a>
            <a href="/privacy">Patient privacy</a>
            <a href="/rights">Your rights</a>
            <a href="/volunteer">Volunteer</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
