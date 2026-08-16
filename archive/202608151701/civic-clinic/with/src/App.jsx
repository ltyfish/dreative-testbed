import { useEffect, useRef, useState } from 'react'
import {
  CLINIC,
  LANGUAGES,
  SCHEDULE,
  SERVICES,
  TRANSIT,
  WEEK,
  formatTime,
} from './clinic-data.js'
import { resolveStatus, useNow } from './useClinicStatus.js'

const ARRIVALS = [
  { offset: 0, label: 'Right now' },
  { offset: 30, label: 'In 30 min' },
  { offset: 60, label: 'In 1 hour' },
  { offset: 120, label: 'In 2 hours' },
]

/* Regional entrance. Fires against the top of the viewport so a tall section
   has finished revealing well before the reader has scrolled past it. */
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-in')
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
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

/* The clinic's day as a length of time, with the moment you would arrive
   marked on it. This is the door being open, not a chart about the door. */
function DayRail({ span, dayLabel, marker }) {
  const width = span.close - span.open
  const cut = span.close - CLINIC.registrationCutMinutes
  const pct = (m) => `${((m - span.open) / width) * 100}%`
  const inRange = marker !== null && marker >= span.open && marker <= span.close

  return (
    <figure className="rail" aria-hidden="true">
      <figcaption className="rail-day">{dayLabel}</figcaption>
      <div className="rail-track">
        <span className="rail-open" style={{ width: pct(cut) }} />
        <span className="rail-cut" style={{ left: pct(cut) }} />
        {inRange && <span className="rail-now" style={{ left: pct(marker) }} />}
      </div>
      <div className="rail-marks">
        <span className="rail-mark">{formatTime(span.open)} open</span>
        <span className="rail-mark">{formatTime(span.close)} close</span>
      </div>
      <p className="rail-key">
        <span className="rail-key-item">
          <span className="swatch swatch-open" />
          Walk in {formatTime(span.open)}–{formatTime(cut)}
        </span>
        <span className="rail-key-item">
          <span className="swatch swatch-shut" />
          No new registrations after {formatTime(cut)}
        </span>
      </p>
    </figure>
  )
}

function StatusPanel({ now, status, offset, setOffset, pulse, panelRef }) {
  const railSpan = status.span || (status.next ? SCHEDULE[status.next.dayIndex] : null)

  // Degenerate case: on a Sunday, or after closing, every arrival option gives
  // the same answer. An inert control is worse than no control, so it goes.
  const kinds = ARRIVALS.map((a) => resolveStatus(now, a.offset).kind)
  const showArrival =
    new Set(kinds).size > 1 || kinds[0] === 'open' || kinds[0] === 'early'
  const railLabel = status.span
    ? offset === 0
      ? 'Today'
      : status.arrivalDayName
    : status.next
      ? `Next open — ${status.next.dayName === 'tomorrow' ? 'tomorrow' : status.next.dayName}`
      : ''

  return (
    <section className="panel" id="status" aria-label="Can I be seen today" ref={panelRef}>
      <div className="panel-inner">
        <div className="panel-verdict">
          <p className="eyebrow">Can I be seen today?</p>
          <p className={`verdict verdict-${status.tone}`} id="walkin-status" aria-live="polite">
            <span className="verdict-dot" aria-hidden="true" />
            {/* Keyed on the arrival choice so the answer visibly re-lands when
                the reader changes it — the motion shows the cause. */}
            <strong key={`v${pulse}`} className={pulse ? 'swap' : undefined}>
              {status.verdict}
            </strong>
            <span key={`d${pulse}`} className={`verdict-detail${pulse ? ' swap' : ''}`}>
              {status.detail}
            </span>
          </p>

          {railSpan && railSpan.open !== null && (
            <DayRail
              span={railSpan}
              dayLabel={railLabel}
              marker={status.span ? status.arrivalMinutes : null}
            />
          )}

          {showArrival && (
            <fieldset className="arrival">
              <legend className="arrival-legend">Check for when you would get here</legend>
              <div className="arrival-options">
                {ARRIVALS.map((a) => (
                  <button
                    key={a.offset}
                    type="button"
                    className="chip"
                    aria-pressed={offset === a.offset}
                    onClick={() => setOffset(a.offset)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        <div className="panel-aside" id="rights">
          <h1 className="lede">
            Free healthcare for everyone in the Eastside, no questions asked.
          </h1>
          <ul className="assurances">
            <li className="assurance">No insurance required</li>
            <li className="assurance">No immigration status questions</li>
            <li className="assurance">No cost for any visit</li>
          </ul>
          <p className="assurance-note" id="privacy">
            You do not need insurance. You do not need a permanent address. We do not ask about your
            immigration status, and we do not share patient records with any other agency.
          </p>
          <div className="panel-actions">
            <a className="btn btn-primary" href={CLINIC.phoneHref}>
              Call {CLINIC.phone}
            </a>
            <a className="btn btn-secondary" href="#visit">
              Get directions
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Services() {
  const ref = useReveal()
  const walkIn = SERVICES.filter((s) => s.walkIn)
  const booked = SERVICES.filter((s) => !s.walkIn)

  const group = (title, note, items) => (
    <div className="service-group">
      <h3 className="service-group-title">
        {title} <span className="service-group-count">{items.length}</span>
      </h3>
      <p className="service-group-note">{note}</p>
      <ul className="services">
        {items.map((s) => (
          <li className="service" key={s.id} data-service={s.id}>
            <h4 className="service-name">{s.name}</h4>
            <p className="service-eligibility">{s.eligibility}</p>
            <p className="service-cost">{s.cost}</p>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <section className="section reveal" id="services" ref={ref}>
      <div className="section-head">
        <h2>What we can help with</h2>
        <p className="section-note">
          Only one of these six needs a phone call first. Everything else, you can walk in.
        </p>
      </div>
      {group('Walk in — no appointment', 'Turn up any time before last registration.', walkIn)}
      {group('Call to book first', 'Ring us or use the form at the bottom of this page.', booked)}
    </section>
  )
}

function Hours({ todayIndex }) {
  const ref = useReveal()
  return (
    <section className="section reveal" id="hours" ref={ref}>
      <div className="section-head">
        <h2>Opening hours</h2>
        <p className="section-note">
          Walk-in registration closes 30 minutes before we do. If you arrive late and it is urgent,
          come in anyway and speak to the front desk.
        </p>
      </div>
      <table className="hours-table">
        <caption className="visually-hidden">Opening hours for each day of the week</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Open</th>
            <th scope="col">Close</th>
            <th scope="col">Last walk-in</th>
          </tr>
        </thead>
        <tbody>
          {WEEK.map((index) => {
            const span = SCHEDULE[index]
            const isToday = index === todayIndex
            return (
              <tr
                key={span.day}
                data-day={span.day.toLowerCase()}
                className={isToday ? 'is-today' : undefined}
              >
                <th scope="row">
                  {span.day}
                  {isToday && <span className="today-tag">Today</span>}
                </th>
                {span.open !== null ? (
                  <>
                    <td className="num">{formatTime(span.open)}</td>
                    <td className="num">{formatTime(span.close)}</td>
                    <td className="num num-cut">
                      {formatTime(span.close - CLINIC.registrationCutMinutes)}
                    </td>
                  </>
                ) : (
                  <td colSpan={3} className="closed-cell">
                    Closed
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      {SCHEDULE[todayIndex].open !== null && (
        <p className="hours-echo">
          Today is {SCHEDULE[todayIndex].day}. Walk-in registration runs{' '}
          {formatTime(SCHEDULE[todayIndex].open)} to{' '}
          {formatTime(SCHEDULE[todayIndex].close - CLINIC.registrationCutMinutes)}.
        </p>
      )}
    </section>
  )
}

function Visit() {
  const ref = useReveal()
  return (
    <section className="section reveal" id="visit" ref={ref}>
      <div className="section-head">
        <h2>Getting here</h2>
      </div>
      <div className="visit-grid">
        <div className="visit-where">
          <address className="address">
            {CLINIC.street}
            <br />
            {CLINIC.city}
          </address>
          <p className="visit-phone">
            <span className="label">Phone</span>
            <a href={CLINIC.phoneHref}>{CLINIC.phone}</a>
          </p>
        </div>
        <ul className="transit">
          {TRANSIT.map((t) => (
            <li key={t.mode}>
              <span className="transit-mode">{t.mode}</span>
              <span className="transit-text">{t.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Languages() {
  const ref = useReveal()
  return (
    <section className="section reveal" id="languages" ref={ref}>
      <div className="section-head">
        <h2>We speak your language</h2>
        <p className="section-note">
          Staff or on-site interpreters are available in these languages during all opening hours:
        </p>
      </div>
      <ul className="languages">
        {LANGUAGES.map((l) => (
          <li key={l.english}>
            <span className="lang-native" dir={l.rtl ? 'rtl' : 'ltr'}>
              {l.native}
            </span>
            <span className="lang-english">{l.english}</span>
          </li>
        ))}
      </ul>
      <p className="interpreter">
        For any other language, call our free interpreter line at{' '}
        <a href={CLINIC.interpreterHref}>{CLINIC.interpreterPhone}</a> and we will connect a
        translator before your visit.
      </p>
    </section>
  )
}

function Booking({ status }) {
  const ref = useReveal()
  const [service, setService] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [booked, setBooked] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !phone || !service) return
    setBooked(true)
  }

  return (
    <section className="section reveal" id="book" ref={ref}>
      <div className="section-head">
        <h2>Book an appointment</h2>
        <p className="section-note">
          Walk-ins are always welcome. Booking is only needed for dental and some counselling slots.
        </p>
      </div>
      <div className="book-grid">
        <div className="book-form-col">
      {booked ? (
        <p className="form-success" role="status">
          Thank you, {name}. We will call {phone} within one working day to confirm your time.
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
        </form>
      )}
        </div>
        <aside className="book-note">
          <p className="book-note-title">You probably do not need this form.</p>
          <p>
            {status.kind === 'open'
              ? `Five of our six services take walk-ins. Registration is open until ${formatTime(status.cut)} today — just come in.`
              : status.next
                ? `Five of our six services take walk-ins. Come in any time from ${status.next.time} ${status.next.dayName}, no form and no appointment.`
                : 'Five of our six services take walk-ins. Come in during opening hours, no form and no appointment.'}
          </p>
          <a className="btn btn-secondary" href={CLINIC.phoneHref}>
            Call {CLINIC.phone}
          </a>
        </aside>
      </div>
    </section>
  )
}

export default function App() {
  const now = useNow()
  const [offset, setOffset] = useState(0)
  const [pulse, setPulse] = useState(0)
  const chooseArrival = (o) => {
    setOffset(o)
    setPulse((n) => n + 1)
  }
  const status = resolveStatus(now, offset)

  // The status travels with the reader: once the panel leaves the screen the
  // same verdict condenses into the bar at the top of the page.
  const panelRef = useRef(null)
  const [condensed, setCondensed] = useState(false)
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setCondensed(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="page">
      <p className="emergency" role="alert" id="emergency">
        <span className="emergency-mark" aria-hidden="true">
          !
        </span>
        <span>
          If you have chest pain, trouble breathing, or severe bleeding,{' '}
          <a href="tel:911">call 911</a> now. Do not wait for the clinic.
        </span>
      </p>

      <nav className={`nav${condensed ? ' is-condensed' : ''}`} id="site-nav">
        <div className="nav-inner">
          <span className="nav-logo">{CLINIC.name}</span>
          <span className={`nav-status status-${status.tone}`} aria-hidden={!condensed}>
            <span className="verdict-dot" />
            {status.verdict}
          </span>
          <div className="nav-links">
            <a href="#services">Services</a>
            <a href="#hours">Hours</a>
            <a href="#visit">Getting here</a>
            <a href="#languages">Languages</a>
            <a href="#book">Book</a>
          </div>
          <a className="nav-call" href={CLINIC.phoneHref}>
            Call
          </a>
        </div>
      </nav>

      <main className="body">
        <StatusPanel
          now={now}
          status={status}
          offset={offset}
          setOffset={chooseArrival}
          pulse={pulse}
          panelRef={panelRef}
        />
        <Services />
        <Hours todayIndex={now.getDay()} />
        <Visit />
        <Languages />
        <Booking status={status} />
      </main>

      <footer className="footer" id="site-footer">
        <div className="footer-inner">
          <div>
            <p>
              © 2026 Eastside Community Health — a nonprofit clinic funded by Springfield County
            </p>
            <p className="footer-volunteer">
              Want to volunteer with us? Call <a href={CLINIC.phoneHref}>{CLINIC.phone}</a> and ask
              for the volunteer coordinator.
            </p>
          </div>
          {/* These pointed at routes that did not exist and rendered this same
              page. The privacy and rights statements are on this page, so the
              links now go to them. */}
          <div className="footer-links">
            <a href="#status">Top</a>
            <a href="#privacy">Patient privacy</a>
            <a href="#rights">Your rights</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
