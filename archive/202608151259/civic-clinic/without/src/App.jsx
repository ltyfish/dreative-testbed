import { useEffect, useMemo, useState } from 'react'

const HOURS = [
  { day: 'Monday', open: '8:00', close: '20:00' },
  { day: 'Tuesday', open: '8:00', close: '20:00' },
  { day: 'Wednesday', open: '8:00', close: '20:00' },
  { day: 'Thursday', open: '8:00', close: '20:00' },
  { day: 'Friday', open: '8:00', close: '17:00' },
  { day: 'Saturday', open: '9:00', close: '14:00' },
  { day: 'Sunday', open: null, close: null },
]

// HOURS is authored Monday-first; JS getDay() is Sunday-first.
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5]

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
    access: 'book',
  },
  {
    id: 'mental',
    name: 'Counselling and mental health',
    eligibility: 'Anyone 14+, walk-in or booked',
    cost: 'Free, first session same day when possible',
    access: 'either',
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

const ACCESS_LABEL = {
  'walk-in': 'Just walk in',
  book: 'Book ahead',
  either: 'Walk in or book',
}

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
const LAST_REGISTRATION_MINUTES = 30

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function formatClock(minutes) {
  const total = ((minutes % 1440) + 1440) % 1440
  const h24 = Math.floor(total / 60)
  const m = total % 60
  const suffix = h24 < 12 ? 'am' : 'pm'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

/**
 * Works out, from the opening hours themselves, whether a patient who leaves
 * now can still be seen today. Registration closes 30 minutes before the door.
 */
function getWalkInStatus(now) {
  const todayIndex = WEEK_ORDER[now.getDay()]
  const today = HOURS[todayIndex]
  const minutesNow = now.getHours() * 60 + now.getMinutes()

  const nextOpen = () => {
    for (let step = 1; step <= 7; step += 1) {
      const entry = HOURS[(todayIndex + step) % 7]
      if (entry.open) {
        return { day: step === 1 ? 'tomorrow' : entry.day, time: formatClock(toMinutes(entry.open)) }
      }
    }
    return null
  }

  if (!today.open) {
    const next = nextOpen()
    return {
      state: 'closed',
      headline: 'Closed today',
      detail: next ? `We open again ${next.day} at ${next.time}.` : 'Please call for opening times.',
    }
  }

  const openAt = toMinutes(today.open)
  const closeAt = toMinutes(today.close)
  const lastRegistration = closeAt - LAST_REGISTRATION_MINUTES

  if (minutesNow < openAt) {
    return {
      state: 'later',
      headline: 'Closed right now',
      detail: `We open today at ${formatClock(openAt)} and take walk-ins until ${formatClock(
        lastRegistration,
      )}.`,
    }
  }

  if (minutesNow >= closeAt) {
    const next = nextOpen()
    return {
      state: 'closed',
      headline: 'Closed for today',
      detail: next ? `We open again ${next.day} at ${next.time}.` : 'Please call for opening times.',
    }
  }

  if (minutesNow >= lastRegistration) {
    return {
      state: 'ending',
      headline: 'Walk-in registration has closed',
      detail: `We are open until ${formatClock(
        closeAt,
      )}. If it is urgent, come in anyway and speak to the front desk.`,
    }
  }

  return {
    state: 'open',
    headline: 'Open now for walk-ins',
    detail: `Last patient accepted at ${formatClock(lastRegistration)} today. No appointment needed.`,
  }
}

function Icon({ name }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false,
  }
  switch (name) {
    case 'phone':
      return (
        <svg {...common}>
          <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2.5 2.5 0 0 1-2.7 2.5A16.5 16.5 0 0 1 3 5.7 2.5 2.5 0 0 1 5.5 3Z" />
        </svg>
      )
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      )
    case 'bus':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="12" rx="2" />
          <path d="M4 10h16M8 20v-2M16 20v-2" />
          <circle cx="8.5" cy="13.5" r=".6" fill="currentColor" />
          <circle cx="15.5" cy="13.5" r=".6" fill="currentColor" />
        </svg>
      )
    case 'train':
      return (
        <svg {...common}>
          <rect x="6" y="3" width="12" height="13" rx="3" />
          <path d="M6 10h12M9 21l2-3M15 21l-2-3" />
        </svg>
      )
    case 'car':
      return (
        <svg {...common}>
          <path d="M4 15h16v-3l-2-4H6l-2 4v3Z" />
          <path d="M6 15v2M18 15v2" />
          <circle cx="8" cy="15" r="1" fill="currentColor" />
          <circle cx="16" cy="15" r="1" fill="currentColor" />
        </svg>
      )
    case 'access':
      return (
        <svg {...common}>
          <circle cx="12" cy="4.5" r="1.6" />
          <path d="M9 8h5M11.5 8v6h4l2.5 5M11.5 14a4.5 4.5 0 1 0 3.2 7.7" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="m4.5 12.5 5 5 10-11" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
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
  const [now, setNow] = useState(() => new Date())
  const [service, setService] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [booked, setBooked] = useState(false)

  // Keep the "can I be seen today" answer honest while the page sits open.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const status = useMemo(() => getWalkInStatus(now), [now])
  const todayIndex = WEEK_ORDER[now.getDay()]

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
          If you have <strong>chest pain, trouble breathing, or severe bleeding</strong>, call{' '}
          <a href="tel:911">911</a> now. Do not wait for the clinic.
        </span>
      </p>

      <nav className="nav" id="site-nav" aria-label="Main">
        <a className="nav-logo" href="#status">
          <span className="nav-mark" aria-hidden="true">
            +
          </span>
          Eastside Community Health
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
        <div className="hero-copy">
          <h1>
            Free healthcare for everyone in the Eastside.
            <span className="hero-sub">No questions asked.</span>
          </h1>
          <p className="hero-lede">
            You do not need insurance. You do not need a permanent address. We do not ask about your
            immigration status, and we do not share patient records with any other agency.
          </p>
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

        <div className={`status-card status-${status.state}`} id="walkin-status" role="status">
          <span className="status-eyebrow">
            <span className="status-dot" aria-hidden="true" />
            Today, {HOURS[todayIndex].day}
          </span>
          <strong className="status-headline">{status.headline}</strong>
          <p className="status-detail">{status.detail}</p>
          <a className="status-link" href="#hours">
            See all opening hours
          </a>
        </div>
      </header>

      <section className="assurances" aria-label="What we never ask for">
        <p className="assurance">
          <Icon name="check" />
          <span>
            <strong>No insurance required</strong>
            Bring nothing but yourself.
          </span>
        </p>
        <p className="assurance">
          <Icon name="check" />
          <span>
            <strong>No immigration status questions</strong>
            We never ask, and never report.
          </span>
        </p>
        <p className="assurance">
          <Icon name="check" />
          <span>
            <strong>No cost for any visit</strong>
            Every service below is free.
          </span>
        </p>
      </section>

      <section className="section" id="hours">
        <h2>Opening hours</h2>
        <p className="section-lede">
          Walk-in registration closes 30 minutes before we do. If you arrive late and it is urgent,
          come in anyway and speak to the front desk.
        </p>
        <table className="hours-table">
          <caption className="sr-only">Opening hours by day. Today&apos;s row is highlighted.</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Open</th>
              <th scope="col">Close</th>
            </tr>
          </thead>
          <tbody>
            {HOURS.map((h, i) => (
              <tr
                key={h.day}
                data-day={h.day.toLowerCase()}
                className={i === todayIndex ? 'is-today' : undefined}
                aria-current={i === todayIndex ? 'date' : undefined}
              >
                <th scope="row">
                  {h.day}
                  {i === todayIndex && <span className="today-tag">Today</span>}
                </th>
                {h.open ? (
                  <>
                    <td>{formatClock(toMinutes(h.open))}</td>
                    <td>{formatClock(toMinutes(h.close))}</td>
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
      </section>

      <section className="section" id="services">
        <h2>What we can help with</h2>
        <p className="section-lede">
          Six services, all free. The tag on each card tells you whether you can simply walk in.
        </p>
        <ul className="services">
          {SERVICES.map((s) => (
            <li className="service" key={s.id} data-service={s.id}>
              <span className={`service-access access-${s.access}`}>{ACCESS_LABEL[s.access]}</span>
              <h3>{s.name}</h3>
              <p className="service-eligibility">{s.eligibility}</p>
              <p className="service-cost">
                <Icon name="check" />
                {s.cost}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" id="visit">
        <h2>Getting here</h2>
        <div className="visit-grid">
          <div className="visit-card">
            <span className="visit-label">
              <Icon name="pin" />
              Address
            </span>
            <address className="address">
              1140 East Barrow Street
              <br />
              Eastside, Springfield 62704
            </address>
            <span className="visit-label">
              <Icon name="phone" />
              Phone
            </span>
            <p className="visit-phone">
              <a href={PHONE_HREF}>{PHONE}</a>
            </p>
          </div>
          <ul className="transit">
            {TRANSIT.map((t) => (
              <li key={t.text}>
                <Icon name={t.icon} />
                <span>{t.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="languages">
        <h2>We speak your language</h2>
        <p className="section-lede">
          Staff or on-site interpreters are available in these languages during all opening hours:
        </p>
        <ul className="languages">
          {LANGUAGES.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <div className="interpreter">
          <Icon name="globe" />
          <p>
            Speak another language? Call our <strong>free interpreter line</strong> at{' '}
            <a href={INTERPRETER_HREF}>{INTERPRETER}</a> and we will connect a translator before your
            visit.
          </p>
        </div>
      </section>

      <section className="section" id="book">
        <h2>Book an appointment</h2>
        <p className="section-lede">
          Walk-ins are always welcome. Booking is only needed for dental and some counselling slots.
        </p>
        {booked ? (
          <p className="form-success" role="status">
            <Icon name="check" />
            <span>
              Thank you, {name}. We will call {phone} within one working day to confirm your time.
            </span>
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
              We only use your number to confirm this appointment. Nothing is shared.
            </p>
          </form>
        )}
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

      <a className="call-bar" href={PHONE_HREF}>
        <Icon name="phone" />
        Call the clinic — {PHONE}
      </a>
    </div>
  )
}
