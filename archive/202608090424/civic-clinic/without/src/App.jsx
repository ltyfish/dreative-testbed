import { useState } from 'react'

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
    access: 'walk-in',
  },
  {
    id: 'dental',
    name: 'Dental cleaning and extractions',
    eligibility: 'Adults 18+, appointment needed',
    cost: 'Free, limited slots each week',
    access: 'booked',
  },
  {
    id: 'mental',
    name: 'Counselling and mental health',
    eligibility: 'Anyone 14+, walk-in or booked',
    cost: 'Free, first session same day when possible',
    access: 'walk-in',
  },
  {
    id: 'pediatric',
    name: 'Children and infant care',
    eligibility: 'Under 18 with any adult',
    cost: 'Free, including vaccinations',
    access: 'walk-in',
  },
  {
    id: 'prescriptions',
    name: 'Prescriptions and refills',
    eligibility: 'Existing and new patients',
    cost: 'Free to issue, medication costs vary',
    access: 'walk-in',
  },
  {
    id: 'screening',
    name: 'Blood pressure, diabetes, and vision screening',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    access: 'walk-in',
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

const PHONE = '(555) 014-2900'
const PHONE_HREF = 'tel:+15550142900'
const INTERPRETER = '(555) 014-2911'
const INTERPRETER_HREF = 'tel:+15550142911'

/* Registration for walk-ins closes this many minutes before the door does. */
const CUTOFF_MINUTES = 30

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/*
 * The single most useful thing on this page is a truthful answer to
 * "can I walk in right now?", so it is derived from the clock rather
 * than written by hand.
 */
function getWalkInStatus(now = new Date()) {
  const todayIndex = (now.getDay() + 6) % 7 // Monday-first, matching HOURS
  const today = HOURS[todayIndex]
  const minutesNow = now.getHours() * 60 + now.getMinutes()

  const nextOpenDay = () => {
    for (let i = 1; i <= 7; i += 1) {
      const candidate = HOURS[(todayIndex + i) % 7]
      if (candidate.open) return { day: candidate.day, open: candidate.open, days: i }
    }
    return null
  }

  if (!today.open) {
    const next = nextOpenDay()
    return {
      state: 'closed',
      today,
      headline: 'Closed today',
      detail: next
        ? `We reopen ${next.days === 1 ? 'tomorrow' : next.day} at ${next.open}. For anything urgent tonight, call ${PHONE}.`
        : `For anything urgent tonight, call ${PHONE}.`,
    }
  }

  const openMin = toMinutes(today.open)
  const closeMin = toMinutes(today.close)
  const cutoff = closeMin - CUTOFF_MINUTES

  if (minutesNow < openMin) {
    return {
      state: 'later',
      today,
      headline: `Closed right now, open at ${today.open} today`,
      detail: `Doors open at ${today.open} and the last walk-in is accepted at ${formatTime(cutoff)}. No appointment needed.`,
    }
  }

  if (minutesNow < cutoff) {
    return {
      state: 'open',
      today,
      headline: 'Open now for walk-ins',
      detail: `Last patient accepted at ${formatTime(cutoff)} today. Come in — you do not need an appointment.`,
    }
  }

  if (minutesNow < closeMin) {
    return {
      state: 'closing',
      today,
      headline: 'Walk-in registration has closed for today',
      detail: `We are open until ${today.close}, but the registration desk stopped taking new walk-ins at ${formatTime(cutoff)}. If it is urgent, come in anyway and speak to the front desk.`,
    }
  }

  const next = nextOpenDay()
  return {
    state: 'closed',
    today,
    headline: 'Closed for today',
    detail: next
      ? `We reopen ${next.days === 1 ? 'tomorrow' : next.day} at ${next.open}. For anything urgent tonight, call ${PHONE}.`
      : `For anything urgent tonight, call ${PHONE}.`,
  }
}

function Icon({ name }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false,
  }
  switch (name) {
    case 'phone':
      return (
        <svg {...common}>
          <path d="M5 3h3.5l1.8 4.4-2.2 1.6a12.5 12.5 0 0 0 5.9 5.9l1.6-2.2 4.4 1.8V18a3 3 0 0 1-3.3 3A16.7 16.7 0 0 1 3 6.3 3 3 0 0 1 5 3Z" />
        </svg>
      )
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.6" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5.2l3.2 2" />
        </svg>
      )
    case 'bus':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="12" rx="2.5" />
          <path d="M4 11h16M7.5 20v-2M16.5 20v-2" />
          <circle cx="8" cy="16.5" r=".9" fill="currentColor" />
          <circle cx="16" cy="16.5" r=".9" fill="currentColor" />
        </svg>
      )
    case 'train':
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="14" rx="3" />
          <path d="M5 11h14M8 21l2-3M16 21l-2-3" />
          <circle cx="9" cy="14" r=".9" fill="currentColor" />
          <circle cx="15" cy="14" r=".9" fill="currentColor" />
        </svg>
      )
    case 'car':
      return (
        <svg {...common}>
          <path d="M4 16v-3.2l1.8-4.2A2 2 0 0 1 7.6 7.4h8.8a2 2 0 0 1 1.8 1.2L20 12.8V16" />
          <path d="M4 16h16M6.5 16v2.2M17.5 16v2.2M4.6 12.6h14.8" />
        </svg>
      )
    case 'access':
      return (
        <svg {...common}>
          <circle cx="12" cy="4.6" r="1.8" />
          <path d="M9 8.4h5l.6 4H11m0 0v3.2m0-3.2H8.4M11 15.6a3.6 3.6 0 1 0 3.4 4.8M14 15.6h2.6l1.4 4" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3l7 2.6v5.6c0 4.4-3 7.9-7 9.8-4-1.9-7-5.4-7-9.8V5.6L12 3Z" />
          <path d="m9 12 2.2 2.2L15.2 10" />
        </svg>
      )
    case 'speech':
      return (
        <svg {...common}>
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v6a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 13.5Z" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 3.8 21 19.5H3L12 3.8Z" />
          <path d="M12 10v4.2" />
          <circle cx="12" cy="17" r=".9" fill="currentColor" />
        </svg>
      )
    default:
      return null
  }
}

const TRANSIT = [
  { icon: 'bus', text: 'Bus 14 and 27 stop directly outside the door on East Barrow.' },
  { icon: 'train', text: 'Green line to Barrow Street station, then a four-minute walk east.' },
  { icon: 'car', text: 'Free parking behind the building, entrance from Alder Lane.' },
  { icon: 'access', text: 'Step-free entrance and accessible restrooms on the ground floor.' },
]

export default function App() {
  const [service, setService] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [booked, setBooked] = useState(false)
  const [status] = useState(() => getWalkInStatus())

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !phone || !service) return
    setBooked(true)
  }

  return (
    <div className="page">
      <p className="emergency" role="alert" id="emergency">
        <span className="emergency-icon">
          <Icon name="alert" />
        </span>
        <span>
          <strong>Chest pain, trouble breathing, or severe bleeding?</strong> Call 911 now. Do not
          wait for the clinic.
        </span>
        <a className="emergency-call" href="tel:911">
          Call 911
        </a>
      </p>

      <nav className="nav" id="site-nav" aria-label="Main">
        <a className="nav-logo" href="#status">
          <span className="nav-mark" aria-hidden="true">
            +
          </span>
          <span>
            Eastside
            <span className="nav-logo-sub">Community Health</span>
          </span>
        </a>
        <div className="nav-links">
          <a href="#hours">Hours</a>
          <a href="#services">Services</a>
          <a href="#visit">Getting here</a>
          <a href="#languages">Languages</a>
          <a href="#book">Book</a>
        </div>
        <a className="nav-call" href={PHONE_HREF}>
          <Icon name="phone" />
          <span>{PHONE}</span>
        </a>
      </nav>

      <header className="hero" id="status">
        <div className="hero-main">
          <p className="hero-eyebrow">Free walk-in clinic · Eastside, Springfield</p>
          <h1>
            Free healthcare for everyone in the Eastside,
            <em> no questions asked.</em>
          </h1>
          <p className="hero-lede">
            You do not need insurance. You do not need a permanent address. We do not ask about your
            immigration status, and we do not share patient records with any other agency.
          </p>

          <ul className="assurances">
            <li className="assurance">
              <Icon name="shield" />
              No insurance required
            </li>
            <li className="assurance">
              <Icon name="shield" />
              No immigration status questions
            </li>
            <li className="assurance">
              <Icon name="shield" />
              No cost for any visit
            </li>
          </ul>

          <div className="hero-actions">
            <a className="btn btn-primary" href={PHONE_HREF}>
              <Icon name="phone" />
              Call {PHONE}
            </a>
            <a className="btn btn-secondary" href="#visit">
              <Icon name="pin" />
              Get directions
            </a>
          </div>
        </div>

        <aside className={`status-card status-${status.state}`} aria-labelledby="walkin-status">
          <p className="status-question">Can I be seen today?</p>
          <p className="status-line" id="walkin-status">
            <span className="status-dot" aria-hidden="true" />
            <strong>{status.headline}.</strong>
          </p>
          <p className="status-detail">{status.detail}</p>
          <dl className="status-today">
            <div>
              <dt>Today, {status.today.day}</dt>
              <dd>{status.today.open ? `${status.today.open} – ${status.today.close}` : 'Closed'}</dd>
            </div>
            <div>
              <dt>Cost of a visit</dt>
              <dd>Free</dd>
            </div>
          </dl>
          <a className="status-link" href="#hours">
            <Icon name="clock" />
            See all opening hours
          </a>
        </aside>
      </header>

      <main>
        <section className="section" id="hours">
          <div className="section-head">
            <h2>Opening hours</h2>
            <p className="section-intro">
              Walk-in registration closes {CUTOFF_MINUTES} minutes before we do.
            </p>
          </div>
          <div className="hours-layout">
            <table className="hours-table">
              <caption className="visually-hidden">Opening hours by day</caption>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Open</th>
                  <th scope="col">Close</th>
                </tr>
              </thead>
              <tbody>
                {HOURS.map((h) => (
                  <tr
                    key={h.day}
                    data-day={h.day.toLowerCase()}
                    className={h.day === status.today.day ? 'is-today' : undefined}
                    aria-current={h.day === status.today.day ? 'date' : undefined}
                  >
                    <th scope="row">
                      {h.day}
                      {h.day === status.today.day && <span className="today-tag">Today</span>}
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
                ))}
              </tbody>
            </table>
            <p className="note callout-note">
              Walk-in registration closes 30 minutes before we do. If you arrive late and it is
              urgent, come in anyway and speak to the front desk.
            </p>
          </div>
        </section>

        <section className="section" id="services">
          <div className="section-head">
            <h2>What we can help with</h2>
            <p className="section-intro">
              Every service below is free. The label tells you whether you can simply walk in.
            </p>
          </div>
          <ul className="services">
            {SERVICES.map((s) => (
              <li className="service" key={s.id} data-service={s.id}>
                <span className={`service-access access-${s.access}`}>
                  {s.access === 'walk-in' ? 'Walk in today' : 'Appointment needed'}
                </span>
                <h3>{s.name}</h3>
                <p className="service-eligibility">
                  <span className="service-label">Who</span>
                  {s.eligibility}
                </p>
                <p className="service-cost">
                  <span className="service-label">Cost</span>
                  {s.cost}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="section" id="visit">
          <div className="section-head">
            <h2>Getting here</h2>
          </div>
          <div className="visit-layout">
            <div className="visit-card">
              <p className="visit-label">
                <Icon name="pin" />
                Address
              </p>
              <address className="address">
                1140 East Barrow Street
                <br />
                Eastside, Springfield 62704
              </address>
              <p className="visit-label">
                <Icon name="phone" />
                Phone
              </p>
              <p className="visit-phone">
                <a href={PHONE_HREF}>{PHONE}</a>
              </p>
            </div>
            <ul className="transit">
              {TRANSIT.map((t) => (
                <li key={t.text}>
                  <span className="transit-icon">
                    <Icon name={t.icon} />
                  </span>
                  {t.text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" id="languages">
          <div className="section-head">
            <h2>We speak your language</h2>
            <p className="section-intro">
              Staff or on-site interpreters are available in these languages during all opening
              hours:
            </p>
          </div>
          <ul className="languages">
            {LANGUAGES.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="interpreter note">
            <span className="interpreter-icon">
              <Icon name="speech" />
            </span>
            <span>
              For any other language, call our free interpreter line at{' '}
              <a href={INTERPRETER_HREF}>{INTERPRETER}</a> and we will connect a translator before
              your visit.
            </span>
          </p>
        </section>

        <section className="section" id="book">
          <div className="section-head">
            <h2>Book an appointment</h2>
            <p className="section-intro">
              Walk-ins are always welcome. Booking is only needed for dental and some counselling
              slots.
            </p>
          </div>
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
              <p className="form-note">
                We only use your number to confirm the appointment. Nothing is shared outside the
                clinic.
              </p>
            </form>
          )}
        </section>
      </main>

      <footer className="footer" id="site-footer">
        <div className="footer-inner">
          <p>© 2026 Eastside Community Health — a nonprofit clinic funded by Springfield County</p>
          <div className="footer-links">
            <a href="#status">Top</a>
            <a href="/privacy">Patient privacy</a>
            <a href="/rights">Your rights</a>
            <a href="/volunteer">Volunteer</a>
          </div>
        </div>
      </footer>

      <div className="mobile-bar" aria-hidden="false">
        <a className="btn btn-primary" href={PHONE_HREF}>
          <Icon name="phone" />
          Call the clinic
        </a>
        <a className="btn btn-secondary" href="#visit">
          <Icon name="pin" />
          Directions
        </a>
      </div>
    </div>
  )
}
