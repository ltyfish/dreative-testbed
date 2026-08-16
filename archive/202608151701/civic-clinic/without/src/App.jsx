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
  },
  {
    id: 'dental',
    name: 'Dental cleaning and extractions',
    eligibility: 'Adults 18+, appointment needed',
    cost: 'Free, limited slots each week',
  },
  {
    id: 'mental',
    name: 'Counselling and mental health',
    eligibility: 'Anyone 14+, walk-in or booked',
    cost: 'Free, first session same day when possible',
  },
  {
    id: 'pediatric',
    name: 'Children and infant care',
    eligibility: 'Under 18 with any adult',
    cost: 'Free, including vaccinations',
  },
  {
    id: 'prescriptions',
    name: 'Prescriptions and refills',
    eligibility: 'Existing and new patients',
    cost: 'Free to issue, medication costs vary',
  },
  {
    id: 'screening',
    name: 'Blood pressure, diabetes, and vision screening',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
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
    mode: 'Bus 14 and 27',
    detail: 'Stop directly outside the door on East Barrow.',
    icon: 'bus',
  },
  {
    mode: 'Green line',
    detail: 'To Barrow Street station, then a four-minute walk east.',
    icon: 'train',
  },
  {
    mode: 'Free parking',
    detail: 'Behind the building, entrance from Alder Lane.',
    icon: 'car',
  },
  {
    mode: 'Step-free access',
    detail: 'Step-free entrance and accessible restrooms on the ground floor.',
    icon: 'access',
  },
]

const PHONE = '(555) 014-2900'
const PHONE_HREF = 'tel:+15550142900'
const INTERPRETER = '(555) 014-2911'
const INTERPRETER_HREF = 'tel:+15550142911'

/* Walk-in registration stops this many minutes before the doors close. */
const LAST_INTAKE_BUFFER = 30

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function formatClock(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/* The single most important thing on this page is whether you can be seen
   right now, so it is derived from the clock rather than written by hand. */
function readStatus(now) {
  const index = (now.getDay() + 6) % 7 // Monday-first, to match HOURS
  const today = HOURS[index]
  const tMinutes = now.getHours() * 60 + now.getMinutes()

  const nextOpenDay = () => {
    for (let step = 1; step <= 7; step += 1) {
      const candidate = HOURS[(index + step) % 7]
      if (candidate.open) {
        return { day: step === 1 ? 'tomorrow' : candidate.day, open: candidate.open }
      }
    }
    return null
  }

  if (!today.open) {
    const next = nextOpenDay()
    return {
      open: false,
      today: today.day,
      badge: 'Closed today',
      headline: 'We are closed today.',
      detail: next
        ? `We open again ${next.day === 'tomorrow' ? 'tomorrow' : `on ${next.day}`} at ${next.open}.`
        : 'Please call for our next opening.',
    }
  }

  const opensAt = toMinutes(today.open)
  const closesAt = toMinutes(today.close)
  const lastIntake = closesAt - LAST_INTAKE_BUFFER

  if (tMinutes < opensAt) {
    return {
      open: false,
      today: today.day,
      badge: 'Not open yet',
      headline: `We open at ${today.open} today.`,
      detail: `Walk in any time from ${today.open}. The last patient is accepted at ${formatClock(lastIntake)}.`,
    }
  }

  if (tMinutes >= closesAt) {
    const next = nextOpenDay()
    return {
      open: false,
      today: today.day,
      badge: 'Closed for today',
      headline: 'We are closed for today.',
      detail: next
        ? `We open again ${next.day === 'tomorrow' ? 'tomorrow' : `on ${next.day}`} at ${next.open}.`
        : 'Please call for our next opening.',
    }
  }

  if (tMinutes >= lastIntake) {
    return {
      open: true,
      today: today.day,
      badge: 'Closing soon',
      headline: 'Walk-in registration has closed for today.',
      detail: `We close at ${today.close}. If it is urgent, come in anyway and speak to the front desk.`,
    }
  }

  return {
    open: true,
    today: today.day,
    badge: 'Open now',
    headline: 'Open now for walk-ins.',
    detail: `Last patient accepted at ${formatClock(lastIntake)} today. No appointment needed.`,
  }
}

function Icon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  }
  switch (name) {
    case 'check':
      return (
        <svg {...common} strokeWidth={3}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...common}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
        </svg>
      )
    case 'pin':
      return (
        <svg {...common}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )
    case 'person':
      return (
        <svg {...common}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    case 'bus':
      return (
        <svg {...common}>
          <path d="M4 17V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11" />
          <path d="M4 11h16M8 4v7M16 4v7" />
          <path d="M6 17v2M18 17v2" />
          <circle cx="7.5" cy="14.5" r=".8" fill="currentColor" />
          <circle cx="16.5" cy="14.5" r=".8" fill="currentColor" />
        </svg>
      )
    case 'train':
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="13" rx="3" />
          <path d="M5 10h14M9 20l-2 2M15 20l2 2M8 16h.01M16 16h.01" />
        </svg>
      )
    case 'car':
      return (
        <svg {...common}>
          <path d="M5 16h14M4 16v2M20 16v2" />
          <path d="M4.5 16 6 9.2A2 2 0 0 1 8 8h8a2 2 0 0 1 2 1.2L19.5 16" />
          <circle cx="7.5" cy="13.5" r=".8" fill="currentColor" />
          <circle cx="16.5" cy="13.5" r=".8" fill="currentColor" />
        </svg>
      )
    case 'access':
      return (
        <svg {...common}>
          <circle cx="12" cy="4.5" r="1.8" />
          <path d="M11 8v5h4M11 13a5 5 0 1 0 4.5 7" />
          <path d="M15 13l2.5 5H20" />
        </svg>
      )
    default:
      return null
  }
}

export default function App() {
  const [service, setService] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [booked, setBooked] = useState(false)
  const [status, setStatus] = useState(() => readStatus(new Date()))

  /* Someone may leave this page open in a waiting room. Keep it honest. */
  useEffect(() => {
    const id = setInterval(() => setStatus(readStatus(new Date())), 60000)
    return () => clearInterval(id)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !phone || !service) return
    setBooked(true)
  }

  return (
    <div className="page">
      <div className="emergency" role="alert" id="emergency">
        <div className="wrap emergency-inner">
          <span className="emergency-mark" aria-hidden="true">
            !
          </span>
          <p>
            <strong>If you have chest pain, trouble breathing, or severe bleeding,</strong>{' '}
            <a href="tel:911">call 911 now</a>. Do not wait for the clinic.
          </p>
        </div>
      </div>

      <nav className="nav" id="site-nav" aria-label="Main">
        <div className="wrap nav-inner">
          <span className="nav-logo">
            <span className="cross" aria-hidden="true" />
            Eastside Community Health
          </span>
          <div className="nav-links">
            <a href="#hours">Hours</a>
            <a href="#services">Services</a>
            <a href="#visit">Getting here</a>
            <a href="#languages">Languages</a>
            <a href="#book">Book</a>
          </div>
        </div>
      </nav>

      <header className="hero wrap" id="status">
        <div className="status" id="walkin-status" data-open={String(status.open)}>
          <span className="status-badge">
            <span className="status-dot" aria-hidden="true" />
            {status.badge}
          </span>
          <p className="status-headline">{status.headline}</p>
          <p className="status-detail">{status.detail}</p>
        </div>

        <h1>Free healthcare for everyone in the Eastside.</h1>
        <p className="hero-lede">
          You do not need insurance. You do not need a permanent address. We do not ask about your
          immigration status, and we do not share patient records with any other agency.
        </p>

        <ul className="assurances">
          <li className="assurance">
            <span className="tick" aria-hidden="true">
              <Icon name="check" />
            </span>
            <span className="assurance-text">
              No insurance required
              <span>Bring nothing. We will never ask for a card.</span>
            </span>
          </li>
          <li className="assurance">
            <span className="tick" aria-hidden="true">
              <Icon name="check" />
            </span>
            <span className="assurance-text">
              No immigration status questions
              <span>We never ask, and never share your records.</span>
            </span>
          </li>
          <li className="assurance">
            <span className="tick" aria-hidden="true">
              <Icon name="check" />
            </span>
            <span className="assurance-text">
              No cost for any visit
              <span>Every service below is free to you.</span>
            </span>
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
      </header>

      <section className="section wrap" id="hours">
        <div className="section-head">
          <h2>Opening hours</h2>
          <p className="section-sub">
            Walk in during any open hour. Today is highlighted below.
          </p>
        </div>

        <div className="hours-grid">
          <table className="hours-table">
            <caption>Eastside Community Health — weekly hours</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Open</th>
                <th scope="col">Close</th>
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h) => {
                const isToday = h.day === status.today
                return (
                  <tr key={h.day} data-day={h.day.toLowerCase()} data-today={String(isToday)}>
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
                      <td colSpan={2} className="closed">
                        Closed
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="hours-aside">
            <h3>Arriving late?</h3>
            <p className="note">
              Walk-in registration closes 30 minutes before we do. If you arrive late and it is
              urgent, come in anyway and speak to the front desk.
            </p>
            <a className="btn btn-secondary btn-block" href={PHONE_HREF}>
              <Icon name="phone" />
              Call {PHONE}
            </a>
          </div>
        </div>
      </section>

      <section className="section wrap" id="services">
        <div className="section-head">
          <h2>What we can help with</h2>
          <p className="section-sub">
            Six services, all free. Each card shows who it is for and what it costs.
          </p>
        </div>
        <ul className="services">
          {SERVICES.map((s) => (
            <li className="service" key={s.id} data-service={s.id}>
              <h3>{s.name}</h3>
              <p className="service-cost">{s.cost}</p>
              <p className="service-eligibility">
                <Icon name="person" />
                <span>{s.eligibility}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section wrap" id="visit">
        <div className="section-head">
          <h2>Getting here</h2>
        </div>

        <div className="visit-grid">
          <div className="visit-card">
            <div>
              <p className="label">Address</p>
              <address className="address">
                1140 East Barrow Street
                <br />
                Eastside, Springfield 62704
              </address>
            </div>
            <div>
              <p className="label">Phone</p>
              <a className="phone-big" href={PHONE_HREF}>
                {PHONE}
              </a>
            </div>
          </div>

          <ul className="transit">
            {TRANSIT.map((t) => (
              <li key={t.mode}>
                <span className="icon" aria-hidden="true">
                  <Icon name={t.icon} />
                </span>
                <span>
                  <span className="t-mode">{t.mode}</span>
                  <span className="t-detail">{t.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section wrap" id="languages">
        <div className="section-head">
          <h2>We speak your language</h2>
          <p className="section-sub">
            Staff or on-site interpreters are available in these languages during all opening hours:
          </p>
        </div>

        <ul className="languages">
          {LANGUAGES.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>

        <div className="interpreter">
          <p>
            For any other language, call our free interpreter line and we will connect a translator
            before your visit.
          </p>
          <a className="btn btn-primary" href={INTERPRETER_HREF}>
            <Icon name="phone" />
            {INTERPRETER}
          </a>
        </div>
      </section>

      <section className="section wrap" id="book">
        <div className="section-head">
          <h2>Book an appointment</h2>
        </div>

        <div className="booking-grid">
          <div className="walkin-note">
            <h3>You probably do not need this.</h3>
            <p>
              Walk-ins are always welcome. Booking is only needed for dental and some counselling
              slots.
            </p>
            <p className="note">
              Everything else on this page is available today with no appointment and no cost.
            </p>
          </div>

          {booked ? (
            <p className="form-success" role="status">
              Thank you, {name}. We will call {phone} within one working day to confirm your time.
            </p>
          ) : (
            <form className="booking-form" onSubmit={handleSubmit}>
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

              <button type="submit" className="btn btn-primary">
                Request appointment
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="footer" id="site-footer">
        <div className="wrap">
          <p>© 2026 Eastside Community Health — a nonprofit clinic funded by Springfield County</p>
          <div className="footer-links">
            <a href="#status">Top</a>
            <a href="/privacy">Patient privacy</a>
            <a href="/rights">Your rights</a>
            <a href="/volunteer">Volunteer</a>
          </div>
        </div>
      </footer>

      <div className="callbar">
        <a className="btn btn-primary" href={PHONE_HREF}>
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
