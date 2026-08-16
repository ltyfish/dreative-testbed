import { useEffect, useMemo, useRef, useState } from 'react'

const HOURS = [
  { day: 'Monday', open: '8:00', close: '20:00' },
  { day: 'Tuesday', open: '8:00', close: '20:00' },
  { day: 'Wednesday', open: '8:00', close: '20:00' },
  { day: 'Thursday', open: '8:00', close: '20:00' },
  { day: 'Friday', open: '8:00', close: '17:00' },
  { day: 'Saturday', open: '9:00', close: '14:00' },
  { day: 'Sunday', open: null, close: null },
]

// access drives the walk-in / booking filter; eligibility and cost text is
// preserved exactly as the clinic wrote it.
const SERVICES = [
  {
    id: 'primary',
    name: 'General check-ups and illness',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    access: 'walkin',
  },
  {
    id: 'dental',
    name: 'Dental cleaning and extractions',
    eligibility: 'Adults 18+, appointment needed',
    cost: 'Free, limited slots each week',
    access: 'booking',
  },
  {
    id: 'mental',
    name: 'Counselling and mental health',
    eligibility: 'Anyone 14+, walk-in or booked',
    cost: 'Free, first session same day when possible',
    access: 'both',
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
]

// The native name is shown next to the English one so a visitor who does not
// read English can still find their own language on the page.
const LANGUAGES = [
  { name: 'English', native: 'English', lang: 'en' },
  { name: 'Spanish', native: 'Español', lang: 'es' },
  { name: 'Vietnamese', native: 'Tiếng Việt', lang: 'vi' },
  { name: 'Somali', native: 'Soomaali', lang: 'so' },
  { name: 'Haitian Creole', native: 'Kreyòl Ayisyen', lang: 'ht' },
  { name: 'Mandarin', native: '中文', lang: 'zh' },
  { name: 'Arabic', native: 'العربية', lang: 'ar' },
]

const ARRIVAL = [
  {
    title: 'Walk to the front desk',
    body: 'Tell the person there what you need help with. You do not need to have called first.',
  },
  {
    title: 'We ask your name and a phone number',
    body: 'That is all. No ID, no insurance card, and no questions about your immigration status.',
  },
  {
    title: 'Say which language you speak',
    body: 'An interpreter joins you before you see anyone. Seven languages are on site; any other language comes through the free phone line.',
  },
  {
    title: 'You wait in the front room',
    body: 'Walk-in registration closes 30 minutes before we close. If you arrive after that and it is urgent, come in anyway.',
  },
  {
    title: 'You see a clinician',
    body: 'There is no bill afterwards, and nobody will ask you to pay. Your records are not shared with any other agency.',
  },
]

const TRANSIT = [
  { mode: 'Bus', body: 'Bus 14 and 27 stop directly outside the door on East Barrow.' },
  { mode: 'Train', body: 'Green line to Barrow Street station, then a four-minute walk east.' },
  { mode: 'Car', body: 'Free parking behind the building, entrance from Alder Lane.' },
  { mode: 'Step-free', body: 'Step-free entrance and accessible restrooms on the ground floor.' },
]

const FILTERS = [
  { id: 'all', label: 'All six services' },
  { id: 'walkin', label: 'Can walk in today' },
  { id: 'booking', label: 'Needs booking' },
]

const REGISTRATION_BUFFER_MIN = 30

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function fromMinutes(total) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/** The next day the door opens, starting `from` days ahead of today. */
function nextOpening(todayIndex, from) {
  for (let step = from; step <= 7; step += 1) {
    const idx = (todayIndex + step) % 7
    const day = HOURS[idx]
    if (!day.open) continue
    return {
      next: day,
      nextLabel: step === 0 ? 'later today' : step === 1 ? 'tomorrow' : `on ${day.day}`,
    }
  }
  return { next: null, nextLabel: '' }
}

/** Reads the real clock against the published hours table above. */
function readStatus(now) {
  const todayIndex = (now.getDay() + 6) % 7 // 0 = Monday, matching HOURS
  const today = HOURS[todayIndex]
  const minutesNow = now.getHours() * 60 + now.getMinutes()

  if (today.open) {
    const open = toMinutes(today.open)
    const close = toMinutes(today.close)
    const cutoff = close - REGISTRATION_BUFFER_MIN
    if (minutesNow >= open && minutesNow < cutoff) {
      return {
        state: 'open',
        today,
        todayIndex,
        open,
        close,
        cutoff,
        minutesNow,
        minutesLeft: cutoff - minutesNow,
      }
    }
    if (minutesNow >= cutoff && minutesNow < close) {
      return {
        state: 'closing',
        today,
        todayIndex,
        open,
        close,
        cutoff,
        minutesNow,
        minutesLeft: close - minutesNow,
        ...nextOpening(todayIndex, 1),
      }
    }
  }

  // Closed: find the next day that opens. Before opening time, that is today.
  const beforeOpeningToday = Boolean(today.open) && minutesNow < toMinutes(today.open)
  return {
    state: 'closed',
    today,
    todayIndex,
    minutesNow,
    ...nextOpening(todayIndex, beforeOpeningToday ? 0 : 1),
  }
}

function formatLeft(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h} hr ${m} min`
  if (h) return `${h} hr`
  return `${m} min`
}

/** Small, shared regional entrance. Content already on screen never animates. */
function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.setAttribute('data-revealed', 'true'))
      return undefined
    }
    const pending = []
    nodes.forEach((n) => {
      if (n.getBoundingClientRect().top < window.innerHeight) n.setAttribute('data-revealed', 'true')
      else pending.push(n)
    })
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.setAttribute('data-revealed', 'true')
          io.unobserve(e.target)
        })
      },
      { rootMargin: '0px 0px -15% 0px', threshold: 0 },
    )
    pending.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
}

function TodayPanel({ status }) {
  const dayLabel = HOURS[status.todayIndex].day
  const open = status.state === 'open' || status.state === 'closing'
  // The band is the walk-in window itself: open until the last patient is
  // accepted. The half hour after it belongs to the door, not to the queue.
  const band = open
    ? { start: status.open, end: status.cutoff, marker: status.minutesNow }
    : status.next
      ? {
          start: toMinutes(status.next.open),
          end: toMinutes(status.next.close) - REGISTRATION_BUFFER_MIN,
          marker: null,
        }
      : null

  const pct = (v) =>
    band ? Math.min(100, Math.max(0, ((v - band.start) / (band.end - band.start)) * 100)) : 0
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setDrawn(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  return (
    <aside className="today" id="today-panel" data-state={status.state} aria-labelledby="walkin-status">
      <p className="today-kicker">
        <span className="today-dot" aria-hidden="true" />
        {dayLabel}, {fromMinutes(status.minutesNow)}
      </p>

      <p className="today-answer" id="walkin-status" role="status">
        {status.state === 'open' ? (
          <>
            <strong>Open now for walk-ins.</strong>
            <span className="today-sub">
              Last patient accepted at {fromMinutes(status.cutoff)} today. No appointment needed.
            </span>
          </>
        ) : status.state === 'closing' ? (
          <>
            <strong>Walk-ins have closed for today.</strong>
            <span className="today-sub">
              The door stays open until {fromMinutes(status.close)}, but the last patient was
              accepted at {fromMinutes(status.cutoff)}.
            </span>
          </>
        ) : (
          <>
            <strong>Closed right now.</strong>
            <span className="today-sub">
              {status.next
                ? `Walk-ins open again ${status.nextLabel} at ${status.next.open}.`
                : 'See the opening hours below.'}
            </span>
          </>
        )}
      </p>

      {band && (
        <div className="band-wrap">
          <p className="band-title">
            {open ? 'The door, today' : `The door, ${status.nextLabel === 'later today' ? 'later today' : status.next.day}`}
          </p>
          <div
            className="band"
            data-drawn={drawn ? 'true' : 'false'}
            role="img"
            aria-label={
              open
                ? `Walk-ins are taken from ${fromMinutes(band.start)} until ${fromMinutes(band.end)} today. It is now ${fromMinutes(status.minutesNow)}.`
                : `Walk-ins are next taken from ${fromMinutes(band.start)} until ${fromMinutes(band.end)}.`
            }
          >
            {open && <span className="band-elapsed" style={{ width: drawn ? `${pct(band.marker)}%` : '0%' }} />}
            {open && (
              <span className="band-now" style={{ left: drawn ? `${pct(band.marker)}%` : '0%' }}>
                <span className="band-now-label">now</span>
              </span>
            )}
          </div>
          <div className="band-scale">
            <span>{fromMinutes(band.start)} first walk-in</span>
            <span>{fromMinutes(band.end)} last walk-in</span>
          </div>
        </div>
      )}

      {status.state === 'open' && (
        <p className="today-left">
          <strong>{formatLeft(status.minutesLeft)}</strong> left to walk in today.
        </p>
      )}
      {status.state === 'closing' && (
        <p className="today-left">
          If it is urgent, come in anyway and speak to the front desk.
          {status.next && (
            <>
              {' '}
              Otherwise walk-ins open again {status.nextLabel} at <strong>{status.next.open}</strong>.
            </>
          )}
        </p>
      )}
      {status.state === 'closed' && (
        <p className="today-left">
          If you cannot wait, call 911 or go to the nearest emergency room.
        </p>
      )}

      <div className="today-actions">
        <a className="btn btn-primary" href="tel:+15550142900">
          Call (555) 014-2900
        </a>
        <a className="btn btn-ghost" href="#visit">
          Get directions
        </a>
      </div>
      <p className="today-note">Free, every visit. You will never be sent a bill.</p>
    </aside>
  )
}

export default function App() {
  const [service, setService] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [booked, setBooked] = useState(false)
  const [filter, setFilter] = useState('all')
  const [now, setNow] = useState(() => new Date())
  const liveRef = useRef(null)

  useReveal()

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(id)
  }, [])

  const status = useMemo(() => readStatus(now), [now])
  const shown = SERVICES.filter((s) => filter === 'all' || s.access === filter || s.access === 'both')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !phone || !service) return
    setBooked(true)
  }

  return (
    <div className="page">
      <p className="emergency" role="alert" id="emergency">
        <span className="emergency-mark" aria-hidden="true">
          !
        </span>
        <span>
          <strong>Chest pain, trouble breathing, or severe bleeding? Call 911 now.</strong> Do not
          wait for the clinic.
        </span>
        <a className="emergency-call" href="tel:911">
          Call 911
        </a>
      </p>

      <nav className="nav" id="site-nav" aria-label="Main">
        <a className="nav-logo" href="#status">
          Eastside <span>Community Health</span>
        </a>
        <div className="nav-links">
          <a href="#hours">Hours</a>
          <a href="#services">Services</a>
          <a href="#arrival">What happens</a>
          <a href="#visit">Getting here</a>
          <a href="#languages">Languages</a>
          <a href="#book">Book</a>
        </div>
        <a className="nav-call" href="tel:+15550142900">
          <span className="nav-pill" data-state={status.state}>
            {status.state === 'open' ? 'Open now' : status.state === 'closing' ? 'Closing' : 'Closed'}
          </span>
          (555) 014-2900
        </a>
      </nav>

      <header className="hero" id="status">
        <div className="hero-say">
          <h1>
            {status.state === 'open' ? 'You can see a doctor today.' : 'You can see a doctor here.'}
            <em>It costs nothing, and we do not ask who you are.</em>
          </h1>
          <p className="hero-body">
            Eastside Community Health is a free walk-in clinic on East Barrow Street. You do not need
            insurance. You do not need a permanent address. We do not ask about your immigration
            status, and we do not share patient records with any other agency.
          </p>
          <ul className="assurances">
            <li className="assurance">
              <span className="assurance-no">No</span> insurance required
            </li>
            <li className="assurance">
              <span className="assurance-no">No</span> immigration status questions
            </li>
            <li className="assurance">
              <span className="assurance-no">No</span> cost for any visit
            </li>
          </ul>
        </div>
        <TodayPanel status={status} />
      </header>

      <main>
        <section className="section section-hours" id="hours" data-reveal>
          <div className="section-head">
            <h2>Opening hours</h2>
            <p className="section-lede">
              Walk-in registration closes {REGISTRATION_BUFFER_MIN} minutes before the door does.
            </p>
          </div>
          <div className="hours-layout">
            <table className="hours-table">
              <caption className="sr-only">Opening hours by day</caption>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Open</th>
                  <th scope="col">Close</th>
                  <th scope="col">
                    <span className="th-long">Last walk-in</span>
                    <span className="th-short">Last in</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {HOURS.map((h, i) => (
                  <tr
                    key={h.day}
                    data-day={h.day.toLowerCase()}
                    data-today={i === status.todayIndex ? 'true' : undefined}
                  >
                    <th scope="row">
                      {h.day}
                      {i === status.todayIndex && <span className="today-tag">today</span>}
                    </th>
                    {h.open ? (
                      <>
                        <td className="num">{h.open}</td>
                        <td className="num">{h.close}</td>
                        <td className="num">{fromMinutes(toMinutes(h.close) - REGISTRATION_BUFFER_MIN)}</td>
                      </>
                    ) : (
                      <td className="closed-cell" colSpan={3}>
                        Closed
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="note note-boxed">
              If you arrive after the last walk-in time and it is urgent, come in anyway and speak to
              the front desk. We would rather turn you away in person than online.
            </p>
          </div>
        </section>

        <section className="section section-services" id="services" data-reveal>
          <div className="section-head">
            <h2>What we can help with</h2>
            <p className="section-lede">Every service below is free. Two of them need a booking.</p>
          </div>

          <div className="filters" role="group" aria-label="Filter services by how you get seen">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className="chip"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
            <p className="filter-count" ref={liveRef} role="status">
              Showing {shown.length} of {SERVICES.length}
            </p>
          </div>

          <ul className="services">
            {SERVICES.map((s) => {
              const on = shown.includes(s)
              return (
                <li className="service" key={s.id} data-service={s.id} data-on={on ? 'true' : 'false'}>
                  <div className="service-main">
                    <h3>{s.name}</h3>
                    <p className="service-eligibility">{s.eligibility}</p>
                  </div>
                  <p className="service-cost">{s.cost}</p>
                  <p className="service-access" data-access={s.access}>
                    {s.access === 'booking' ? 'Book ahead' : s.access === 'both' ? 'Walk in or book' : 'Walk in'}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="section section-arrival" id="arrival" data-reveal>
          <div className="section-head">
            <h2>What happens when you arrive</h2>
            <p className="section-lede">The whole visit, start to finish. There is nothing else to it.</p>
          </div>
          <ol className="arrival">
            {ARRIVAL.map((step, i) => (
              <li key={step.title}>
                <span className="arrival-num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section section-visit" id="visit" data-reveal>
          <div className="section-head">
            <h2>Getting here</h2>
            <p className="section-lede">One door, on East Barrow between Alder and Third.</p>
          </div>
          <div className="visit-layout">
            <div className="visit-card">
              <address className="address">
                1140 East Barrow Street
                <br />
                Eastside, Springfield 62704
              </address>
              <a className="visit-phone" href="tel:+15550142900">
                (555) 014-2900
              </a>
              <p className="note">Front desk, during all opening hours.</p>
            </div>
            <ul className="transit">
              {TRANSIT.map((t) => (
                <li key={t.mode}>
                  <span className="transit-mode">{t.mode}</span>
                  <span className="transit-body">{t.body}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section section-languages" id="languages" data-reveal>
          <div className="section-head">
            <h2>We speak your language</h2>
            <p className="section-lede">
              Staff or on-site interpreters are available in these languages during all opening
              hours. Point at yours if it is easier.
            </p>
          </div>
          <ul className="languages">
            {LANGUAGES.map((l) => (
              <li key={l.name}>
                <span className="lang-native" lang={l.lang}>
                  {l.native}
                </span>
                <span className="lang-name">{l.name}</span>
              </li>
            ))}
          </ul>
          <p className="interpreter">
            Any other language:{' '}
            <a href="tel:+15550142911">
              call the free interpreter line on <strong>(555) 014-2911</strong>
            </a>{' '}
            and we will connect a translator before your visit.
          </p>
        </section>

        <section className="section section-book" id="book" data-reveal>
          <div className="section-head">
            <h2>Book an appointment</h2>
            <p className="section-lede">
              Walk-ins are always welcome. Booking is only needed for dental and some counselling
              slots.
            </p>
          </div>
          {booked ? (
            <p className="form-success" role="status">
              <strong>Thank you, {name}.</strong> We will call {phone} within one working day to
              confirm your time. If you need to be seen before then, walk in.
            </p>
          ) : (
            <form className="booking-form" onSubmit={handleSubmit}>
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
              <p className="note">
                We only use your number to confirm the time. It is not shared with anyone.
              </p>
            </form>
          )}
        </section>
      </main>

      <footer className="footer" id="site-footer">
        <div className="footer-rights" id="rights">
          <h2>Your rights here</h2>
          <ul>
            <li>You will be seen whether or not you have insurance.</li>
            <li>Nobody will ask about your immigration status.</li>
            <li>Your records are not shared with any other agency.</li>
            <li>You can ask for an interpreter at any point in your visit.</li>
            <li>You will never be sent a bill for a visit to this clinic.</li>
          </ul>
        </div>
        <div className="footer-end">
          <p className="footer-mark">Eastside Community Health</p>
          <p>© 2026 Eastside Community Health — a nonprofit clinic funded by Springfield County</p>
          <div className="footer-links">
            <a href="#status">Back to today's status</a>
            <a href="#rights">Your rights and privacy</a>
            <a href="#languages">Languages and interpreters</a>
            <a href="tel:+15550142900">Volunteer — call (555) 014-2900</a>
          </div>
        </div>
      </footer>

      <a className="callbar" href="tel:+15550142900">
        <span className="callbar-state" data-state={status.state}>
          {status.state === 'open' ? 'Open now' : status.state === 'closing' ? 'Closing' : 'Closed'}
        </span>
        Call the clinic — (555) 014-2900
      </a>
    </div>
  )
}
