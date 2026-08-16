import { useEffect, useState } from 'react'

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
    icon: 'stethoscope',
  },
  {
    id: 'dental',
    name: 'Dental cleaning and extractions',
    eligibility: 'Adults 18+, appointment needed',
    cost: 'Free, limited slots each week',
    icon: 'tooth',
  },
  {
    id: 'mental',
    name: 'Counselling and mental health',
    eligibility: 'Anyone 14+, walk-in or booked',
    cost: 'Free, first session same day when possible',
    icon: 'heart',
  },
  {
    id: 'pediatric',
    name: 'Children and infant care',
    eligibility: 'Under 18 with any adult',
    cost: 'Free, including vaccinations',
    icon: 'child',
  },
  {
    id: 'prescriptions',
    name: 'Prescriptions and refills',
    eligibility: 'Existing and new patients',
    cost: 'Free to issue, medication costs vary',
    icon: 'pill',
  },
  {
    id: 'screening',
    name: 'Blood pressure, diabetes, and vision screening',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    icon: 'pulse',
  },
]

const LANGUAGES = [
  'English',
  'Spanish',
  'Vietnamese',
  'Somali',
  'Haitian Creole',
  'Mandarin',
  'Arabic',
]

const TRANSIT = [
  {
    icon: 'bus',
    lead: 'Bus 14 and 27',
    text: 'stop directly outside the door on East Barrow.',
  },
  {
    icon: 'train',
    lead: 'Green line',
    text: 'to Barrow Street station, then a four-minute walk east.',
  },
  {
    icon: 'car',
    lead: 'Free parking',
    text: 'behind the building, entrance from Alder Lane.',
  },
  {
    icon: 'access',
    lead: 'Step-free entrance',
    text: 'and accessible restrooms on the ground floor.',
  },
]

/* Registration stops this many minutes before the doors close. */
const REGISTRATION_BUFFER = 30

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function fromMinutes(total) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/* HOURS is Monday-first; JS getDay() is Sunday-first. */
function rowForDate(date) {
  return HOURS[(date.getDay() + 6) % 7]
}

function nextOpenDay(date) {
  for (let i = 1; i <= 7; i += 1) {
    const next = new Date(date)
    next.setDate(date.getDate() + i)
    const row = rowForDate(next)
    if (row.open) return { row, isTomorrow: i === 1 }
  }
  return null
}

/* Everything a patient needs to decide whether to set out right now. */
function getWalkInStatus(now) {
  const today = rowForDate(now)
  const minutes = now.getHours() * 60 + now.getMinutes()

  const upcoming = nextOpenDay(now)
  const nextLabel = upcoming
    ? `${upcoming.isTomorrow ? 'tomorrow' : upcoming.row.day} at ${upcoming.row.open}`
    : 'our next opening day'

  if (!today.open) {
    return {
      state: 'closed',
      kicker: `Closed ${today.day}`,
      headline: 'Closed today',
      detail: (
        <>
          We open again <strong>{nextLabel}</strong>. If you cannot wait, call 911 or go to the
          nearest emergency room.
        </>
      ),
      todayLabel: 'Closed all day',
    }
  }

  const opensAt = toMinutes(today.open)
  const closesAt = toMinutes(today.close)
  const lastAccepted = closesAt - REGISTRATION_BUFFER
  const todayLabel = `${today.open} – ${today.close}`

  if (minutes < opensAt) {
    return {
      state: 'closed',
      kicker: `Closed right now · ${today.day}`,
      headline: `Opens at ${today.open} today`,
      detail: (
        <>
          Walk in any time between <strong>{today.open}</strong> and{' '}
          <strong>{fromMinutes(lastAccepted)}</strong>. No appointment, no insurance.
        </>
      ),
      todayLabel,
    }
  }

  if (minutes >= closesAt) {
    return {
      state: 'closed',
      kicker: `Closed for the day · ${today.day}`,
      headline: 'Closed for today',
      detail: (
        <>
          We open again <strong>{nextLabel}</strong>. If you cannot wait, call 911 or go to the
          nearest emergency room.
        </>
      ),
      todayLabel,
    }
  }

  if (minutes >= lastAccepted) {
    return {
      state: 'soon',
      kicker: `Registration closed · ${today.day}`,
      headline: 'Walk-in registration has closed',
      detail: (
        <>
          The doors are open until <strong>{today.close}</strong>. If it is urgent, come in anyway
          and speak to the front desk.
        </>
      ),
      todayLabel,
    }
  }

  const isLastHour = lastAccepted - minutes <= 60

  return {
    state: isLastHour ? 'soon' : 'open',
    kicker: isLastHour ? `Closing soon · ${today.day}` : `Open now · ${today.day}`,
    headline: isLastHour ? 'Open, but not for much longer' : 'Open now for walk-ins',
    detail: (
      <>
        Last patient accepted at <strong>{fromMinutes(lastAccepted)}</strong> today. You do not need
        an appointment.
      </>
    ),
    todayLabel,
  }
}

function Icon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  }
  const paths = {
    cross: <path d="M12 5v14M5 12h14" />,
    phone: (
      <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" />
    ),
    pin: (
      <>
        <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.6" />
      </>
    ),
    check: <path d="M4.5 12.5 9.5 17.5 19.5 7" strokeWidth="2.6" />,
    stethoscope: (
      <>
        <path d="M5 3v5a4.5 4.5 0 0 0 9 0V3" />
        <path d="M9.5 12.5v2a5 5 0 0 0 9 3" />
        <circle cx="19" cy="16" r="2.4" />
      </>
    ),
    tooth: (
      <path d="M12 4.5c-2-1.4-5.5-1.4-6.6 1.2-1 2.5.3 4.6.6 7.3.2 2 .3 6 2 6s1.4-4.3 4-4.3 2.3 4.3 4 4.3 1.8-4 2-6c.3-2.7 1.6-4.8.6-7.3C17.5 3.1 14 3.1 12 4.5Z" />
    ),
    heart: (
      <path d="M12 20s-7-4.4-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7 2.7c0 4.9-7 9.3-7 9.3Z" />
    ),
    child: (
      <>
        <circle cx="12" cy="7" r="3.2" />
        <path d="M6 20v-1.5a6 6 0 0 1 12 0V20" />
      </>
    ),
    pill: (
      <>
        <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" />
        <path d="M12 8.5v7" />
      </>
    ),
    pulse: <path d="M3 12.5h4l2.5-6 4 12 2.5-6h5" />,
    bus: (
      <>
        <rect x="4" y="4" width="16" height="12" rx="2.5" />
        <path d="M4 10.5h16M7.5 20v-2M16.5 20v-2" />
        <circle cx="8" cy="13.5" r="0.9" fill="currentColor" />
        <circle cx="16" cy="13.5" r="0.9" fill="currentColor" />
      </>
    ),
    train: (
      <>
        <rect x="5" y="3.5" width="14" height="12" rx="3" />
        <path d="M5 10h14M8 20l2-4.5M16 20l-2-4.5" />
        <circle cx="9" cy="12.8" r="0.9" fill="currentColor" />
        <circle cx="15" cy="12.8" r="0.9" fill="currentColor" />
      </>
    ),
    car: (
      <>
        <path d="M4 16v-3l2-5h12l2 5v3" />
        <path d="M3.5 16h17M6.5 16v2M17.5 16v2" />
        <circle cx="8" cy="13" r="0.9" fill="currentColor" />
        <circle cx="16" cy="13" r="0.9" fill="currentColor" />
      </>
    ),
    access: (
      <>
        <circle cx="12" cy="4.6" r="1.8" />
        <path d="M9 9h6M12 9v6h4l2 4M12 15a4 4 0 1 0 3 4" />
      </>
    ),
  }
  return <svg {...common}>{paths[name]}</svg>
}

export default function App() {
  const [now, setNow] = useState(() => new Date())
  const [service, setService] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [booked, setBooked] = useState(false)

  /* Keep the walk-in answer honest for someone who leaves the page open. */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const status = getWalkInStatus(now)
  const todayName = rowForDate(now).day

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !phone || !service) return
    setBooked(true)
  }

  return (
    <div className="page">
      <a className="skip-link" href="#status">
        Skip to today’s walk-in status
      </a>

      <p className="emergency" role="alert" id="emergency">
        <span className="emergency-mark" aria-hidden="true">
          !
        </span>
        <span>
          <strong>Do not wait for the clinic.</strong> If you have chest pain, trouble breathing, or
          severe bleeding, <a href="tel:911">call 911 now</a>.
        </span>
      </p>

      <nav className="nav" id="site-nav" aria-label="Main">
        <span className="nav-logo">
          <span className="mark" aria-hidden="true">
            <Icon name="cross" />
          </span>
          Eastside Community Health
        </span>
        <div className="nav-links">
          <a href="#hours">Hours</a>
          <a href="#services">Services</a>
          <a href="#visit">Getting here</a>
          <a href="#languages">Languages</a>
          <a href="#book">Book</a>
        </div>
      </nav>

      <header className="hero" id="status">
        <div>
          <h1>Free healthcare for everyone in the Eastside, no questions asked.</h1>
          <p className="hero-lede">
            You do not need insurance. You do not need a permanent address. We do not ask about your
            immigration status, and we do not share patient records with any other agency.
          </p>
          <ul className="assurances">
            <li className="assurance">
              <span className="check" aria-hidden="true">
                <Icon name="check" />
              </span>
              No insurance required
            </li>
            <li className="assurance">
              <span className="check" aria-hidden="true">
                <Icon name="check" />
              </span>
              No immigration status questions
            </li>
            <li className="assurance">
              <span className="check" aria-hidden="true">
                <Icon name="check" />
              </span>
              No cost for any visit
            </li>
          </ul>
        </div>

        <div className="status-card" data-state={status.state}>
          <div className="status-head">
            <p className="status-kicker">
              <span className="dot" aria-hidden="true" />
              {status.kicker}
            </p>
            <div id="walkin-status" role="status">
              <p className="status-headline">{status.headline}</p>
              <p className="status-detail">{status.detail}</p>
            </div>
          </div>
          <div className="status-body">
            <dl className="status-today">
              <dt>Today’s hours ({todayName})</dt>
              <dd>{status.todayLabel}</dd>
            </dl>
            <div className="status-actions">
              <a className="btn btn-primary" href="tel:+15550142900">
                <Icon name="phone" />
                Call (555) 014-2900
              </a>
              <a className="btn btn-secondary" href="#visit">
                <Icon name="pin" />
                Get directions
              </a>
            </div>
          </div>
        </div>
      </header>

      <section className="section" id="hours">
        <div className="section-head">
          <h2>Opening hours</h2>
          <p>Walk in any time we are open — today’s row is highlighted.</p>
        </div>
        <div className="hours-layout">
          <div className="panel">
            <table className="hours-table">
              <caption>Every day of the week</caption>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Open</th>
                  <th scope="col">Close</th>
                </tr>
              </thead>
              <tbody>
                {HOURS.map((h) => {
                  const isToday = h.day === todayName
                  return (
                    <tr key={h.day} data-day={h.day.toLowerCase()} data-today={isToday}>
                      <th scope="row">
                        {h.day}
                        {isToday && <span className="today-tag">Today</span>}
                      </th>
                      {h.open ? (
                        <>
                          <td>{h.open}</td>
                          <td>{h.close}</td>
                        </>
                      ) : (
                        <td colSpan={2} className="closed-cell">
                          Closed
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="note-card">
            <h3>Arriving near closing time?</h3>
            <p className="note">
              Walk-in registration closes 30 minutes before we do. If you arrive late and it is
              urgent, come in anyway and speak to the front desk.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="section-head">
          <h2>What we can help with</h2>
          <p>Six services, all free at the point of care. Each card says who can come and what it costs.</p>
        </div>
        <ul className="services">
          {SERVICES.map((s) => {
            const [pill, ...rest] = s.cost.split(', ')
            return (
              <li className="service" key={s.id} data-service={s.id}>
                <span className="service-icon" aria-hidden="true">
                  <Icon name={s.icon} />
                </span>
                <h3>{s.name}</h3>
                <p className="service-eligibility">{s.eligibility}</p>
                <p className="service-cost">
                  <span className="cost-pill">{pill}</span>
                  {rest.length > 0 && <span>{rest.join(', ')}</span>}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="section" id="visit">
        <div className="section-head">
          <h2>Getting here</h2>
          <p>One entrance on East Barrow Street, step-free, with buses stopping at the door.</p>
        </div>
        <div className="visit-layout">
          <div className="panel">
            <address className="address">
              1140 East Barrow Street
              <br />
              Eastside, Springfield 62704
            </address>
            <div className="contact-row">
              <a className="phone-block" href="tel:+15550142900">
                <span className="label">Phone</span>
                <span className="number">(555) 014-2900</span>
              </a>
            </div>
            <p className="note">
              Ask for the front desk in any language — we will find someone who speaks yours.
            </p>
          </div>
          <div className="panel">
            <ul className="transit">
              {TRANSIT.map((t) => (
                <li key={t.lead}>
                  <span className="t-icon" aria-hidden="true">
                    <Icon name={t.icon} />
                  </span>
                  <span>
                    <strong>{t.lead}</strong>
                    {t.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="languages">
        <div className="section-head">
          <h2>We speak your language</h2>
          <p>
            Staff or on-site interpreters are available in these languages during all opening hours:
          </p>
        </div>
        <div className="panel">
          <ul className="languages">
            {LANGUAGES.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <div className="interpreter">
            <p>
              <strong>Speak another language?</strong> Call our free interpreter line and we will
              connect a translator before your visit.
            </p>
            <a className="btn btn-secondary" href="tel:+15550142911">
              <Icon name="phone" />
              (555) 014-2911
            </a>
          </div>
        </div>
      </section>

      <section className="section" id="book">
        <div className="section-head">
          <h2>Book an appointment</h2>
          <p>
            Walk-ins are always welcome. Booking is only needed for dental and some counselling
            slots.
          </p>
        </div>
        <div className="book-layout">
          <div className="walkin-callout">
            <h3>Most people do not need this form</h3>
            <p>
              For everything else, just come to 1140 East Barrow Street while we are open. Nothing to
              fill in beforehand.
            </p>
            <ul>
              <li>No insurance, ID, or address needed</li>
              <li>No questions about immigration status</li>
              <li>Interpreters available during all opening hours</li>
            </ul>
          </div>

          {booked ? (
            <p className="form-success" role="status">
              <strong>Thank you, {name}.</strong>
              We will call {phone} within one working day to confirm your time.
            </p>
          ) : (
            <form className="booking-form panel" onSubmit={handleSubmit}>
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

              <label htmlFor="name">Your name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="field-hint">
                We only use this to confirm your appointment. Records are never shared with any
                other agency.
              </p>

              <button type="submit" className="btn btn-primary">
                Request appointment
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="footer" id="site-footer">
        <p>© 2026 Eastside Community Health — a nonprofit clinic funded by Springfield County</p>
        <div className="footer-links">
          <a href="#status">Top</a>
          <a href="/privacy">Patient privacy</a>
          <a href="/rights">Your rights</a>
          <a href="/volunteer">Volunteer</a>
        </div>
      </footer>

      <div className="call-bar">
        <a className="btn btn-primary" href="tel:+15550142900">
          <Icon name="phone" />
          Call clinic
        </a>
        <a className="btn btn-secondary" href="#visit">
          <Icon name="pin" />
          Directions
        </a>
      </div>
    </div>
  )
}
