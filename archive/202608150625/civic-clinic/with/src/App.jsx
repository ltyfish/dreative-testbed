import { useEffect, useRef, useState } from 'react'
import {
  AXIS_END,
  AXIS_START,
  HOURS,
  LANGUAGES,
  SERVICES,
  axisPercent,
  clinicStatus,
  cutoffOf,
  formatTime,
} from './clinic.js'

const PHONE = '(555) 014-2900'
const PHONE_HREF = 'tel:+15550142900'
const INTERPRETER = '(555) 014-2911'
const INTERPRETER_HREF = 'tel:+15550142911'

/* The clock is the page's only source of state. Everything else reads it. */
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  return now
}

/* Shared regional entrance: 14px of travel, once, measured against the top of
   the viewport so a tall section finishes revealing while it is still on screen. */
function useReveal() {
  const ref = useRef(null)
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, revealed]
}

function Section({ id, label, title, lead, children }) {
  const [ref, revealed] = useReveal()
  return (
    <section className="section" id={id} ref={ref} data-revealed={String(revealed)}>
      <div className="section-head">
        <p className="eyebrow">{label}</p>
        <h2>{title}</h2>
        {lead ? <p className="lead">{lead}</p> : null}
      </div>
      <div className="section-body">{children}</div>
    </section>
  )
}

function StatusDot({ status }) {
  return <span className="dot" data-open={status.openNow ? 'true' : 'false'} aria-hidden="true" />
}

/**
 * The Today Bar — the signature component. It draws the visit you are trying to
 * make: today's open band, the moment walk-in registration stops, and where the
 * current minute sits between them.
 */
function TodayBar({ status, now }) {
  const { today } = status
  const cutoff = cutoffOf(today)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowVisible = nowMinutes >= AXIS_START && nowMinutes <= AXIS_END
  const ticks = [6 * 60, 9 * 60, 12 * 60, 15 * 60, 18 * 60, 21 * 60]

  return (
    <figure className="todaybar" id="today-bar" data-phase={status.phase}>
      <figcaption className="todaybar-caption">
        <span className="todaybar-day">{today.day}</span>
        <span className="todaybar-clock">{formatTime(nowMinutes)}</span>
      </figcaption>

      <div className="todaybar-track" role="img" aria-label={`${today.day}: ${status.detail}`}>
        {today.open !== null ? (
          <>
            <span
              className="todaybar-band"
              style={{
                left: `${axisPercent(today.open)}%`,
                width: `${axisPercent(today.close) - axisPercent(today.open)}%`,
              }}
            />
            <span
              className="todaybar-walkin"
              style={{
                left: `${axisPercent(today.open)}%`,
                width: `${axisPercent(cutoff) - axisPercent(today.open)}%`,
              }}
            />
            <span className="todaybar-cutoff" style={{ left: `${axisPercent(cutoff)}%` }} />
          </>
        ) : null}

        {nowVisible ? (
          <span className="todaybar-now" style={{ left: `${axisPercent(nowMinutes)}%` }}>
            <span className="todaybar-now-label">now</span>
          </span>
        ) : null}
      </div>

      <div className="todaybar-axis" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} style={{ left: `${axisPercent(t)}%` }}>
            {formatTime(t)}
          </span>
        ))}
      </div>

      {today.open !== null ? (
        <ul className="todaybar-key">
          <li>
            <span className="key-swatch key-walkin" aria-hidden="true" />
            Walk in {formatTime(today.open)}–{formatTime(cutoff)}
          </li>
          <li>
            <span className="key-swatch key-band" aria-hidden="true" />
            Doors open until {formatTime(today.close)}
          </li>
        </ul>
      ) : (
        <ul className="todaybar-key">
          <li>
            <span className="key-swatch key-shut" aria-hidden="true" />
            Closed all day — next open {status.nextLabel}.
          </li>
        </ul>
      )}
    </figure>
  )
}

export default function App() {
  const now = useNow()
  const status = clinicStatus(now)

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
    <div className="page" data-open={status.openNow ? 'true' : 'false'}>
      <p className="emergency" role="alert" id="emergency">
        <strong>Chest pain, trouble breathing, or severe bleeding?</strong>{' '}
        <a href="tel:911">Call 911 now</a>. Do not wait for the clinic.
      </p>

      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#status">
          <span className="nav-mark" aria-hidden="true" />
          Eastside Community Health
        </a>
        <p className="nav-status" id="nav-status">
          <StatusDot status={status} />
          {status.openNow ? 'Open now' : 'Closed now'}
        </p>
        <div className="nav-links">
          <a href="#hours">Hours</a>
          <a href="#services">Services</a>
          <a href="#visit">Getting here</a>
          <a href="#languages">Languages</a>
          <a href="#book">Book</a>
        </div>
        <a className="btn btn-primary nav-call" href={PHONE_HREF}>
          Call {PHONE}
        </a>
      </nav>

      <main id="main">
      <header className="hero" id="status">
        <div className="hero-answer">
          <p className="eyebrow">Can I be seen today?</p>
          <p className="answer" id="walkin-status">
            <StatusDot status={status} />
            {status.answer}
          </p>
          <p className="answer-detail">{status.detail}</p>

        </div>

        <div className="hero-claim">
          <h1>Free healthcare for everyone in the Eastside, no questions asked.</h1>

          <ul className="assurances">
            <li className="assurance">
              <strong>No insurance required</strong>
              <span>You do not need coverage, an ID, or a permanent address.</span>
            </li>
            <li className="assurance">
              <strong>No immigration status questions</strong>
              <span>We never ask, and we share patient records with no other agency.</span>
            </li>
            <li className="assurance">
              <strong>No cost for any visit</strong>
              <span>Every appointment and walk-in below is free.</span>
            </li>
          </ul>
        </div>

        <div className="hero-panel">
          <TodayBar status={status} now={now} />
          <div className="hero-actions">
            <a className="btn btn-primary" href={PHONE_HREF}>
              Call {PHONE}
            </a>
            <a className="btn btn-secondary" href="#visit">
              Get directions
            </a>
          </div>
          <p className="hero-address">
            1140 East Barrow Street, Eastside, Springfield 62704 — bus 14 and 27 stop at the door.
          </p>
        </div>
      </header>

      <Section
        id="hours"
        label="Every day"
        title="Opening hours"
        lead="Walk-in registration closes 30 minutes before the doors do. Today's row is marked."
      >
        <div className="table-wrap">
          <table className="hours-table">
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Open</th>
                <th scope="col">Close</th>
                <th scope="col">Last walk-in</th>
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h, i) => (
                <tr
                  key={h.day}
                  data-day={h.day.toLowerCase()}
                  data-today={i === status.todayIndex ? 'true' : 'false'}
                >
                  <th scope="row">
                    {h.day}
                    {i === status.todayIndex ? <span className="today-tag">today</span> : null}
                  </th>
                  {h.open !== null ? (
                    <>
                      <td className="num">{formatTime(h.open)}</td>
                      <td className="num">{formatTime(h.close)}</td>
                      <td className="num">{formatTime(cutoffOf(h))}</td>
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
        </div>
        <p className="note">
          If you arrive late and it is urgent, come in anyway and speak to the front desk.
        </p>
      </Section>

      <Section
        id="services"
        label="Six services"
        title="What we can help with"
        lead="Everything here is free. Five services take walk-ins; dental needs an appointment first."
      >
        <ul className="services">
          {SERVICES.map((s) => (
            <li className="service" key={s.id} data-service={s.id} data-walkin={String(s.walkIn)}>
              <p className="service-channel">
                {s.walkIn ? (status.acceptingWalkIns ? 'Walk in now' : 'Walk-in') : 'Book first'}
              </p>
              <h3>{s.name}</h3>
              <p className="service-eligibility">{s.eligibility}</p>
              <p className="service-cost">{s.cost}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="visit" label="The clinic" title="Getting here">
        <div className="visit">
          <div className="visit-contact">
            <address className="address">
              1140 East Barrow Street
              <br />
              Eastside, Springfield 62704
            </address>
            <p className="visit-phone">
              <span>Phone</span>
              <a href={PHONE_HREF}>{PHONE}</a>
            </p>
            <a className="btn btn-secondary" href="#book">
              Book an appointment
            </a>
          </div>
          <ul className="transit">
            <li>
              <span className="transit-mode">Bus</span>
              Bus 14 and 27 stop directly outside the door on East Barrow.
            </li>
            <li>
              <span className="transit-mode">Train</span>
              Green line to Barrow Street station, then a four-minute walk east.
            </li>
            <li>
              <span className="transit-mode">Car</span>
              Free parking behind the building, entrance from Alder Lane.
            </li>
            <li>
              <span className="transit-mode">Access</span>
              Step-free entrance and accessible restrooms on the ground floor.
            </li>
          </ul>
        </div>
      </Section>

      <Section
        id="languages"
        label="Interpreters"
        title="We speak your language"
        lead="Staff or on-site interpreters are available in these languages during all opening hours."
      >
        <ul className="languages">
          {LANGUAGES.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="interpreter">
          For any other language, call our free interpreter line at{' '}
          <a href={INTERPRETER_HREF}>{INTERPRETER}</a> and we will connect a translator before your
          visit.
        </p>
      </Section>

      <Section
        id="book"
        label="Only if you need it"
        title="Book an appointment"
        lead="Walk-ins are always welcome. Booking is only needed for dental and some counselling slots."
      >
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
      </Section>

      <footer className="footer" id="site-footer">
        <p className="footer-note">
          © 2026 Eastside Community Health — a nonprofit clinic funded by Springfield County
        </p>
        <div className="footer-links">
          <a href="#status">Top</a>
          <a href="/privacy">Patient privacy</a>
          <a href="/rights">Your rights</a>
          <a href="/volunteer">Volunteer</a>
        </div>
      </footer>

      <div className="dock" id="dock">
        <p className="dock-status">
          <StatusDot status={status} />
          {status.openNow ? 'Open now' : 'Closed now'}
        </p>
        <a className="btn btn-primary dock-call" href={PHONE_HREF}>
          Call {PHONE}
        </a>
      </div>
    </div>
  )
}
