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

// HOURS is Monday-first; JS getDay() is Sunday-first.
const DAY_INDEX = [6, 0, 1, 2, 3, 4, 5]

const SERVICES = [
  {
    id: 'primary',
    name: 'General check-ups and illness',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    walkIn: true,
  },
  {
    id: 'dental',
    name: 'Dental cleaning and extractions',
    eligibility: 'Adults 18+, appointment needed',
    cost: 'Free, limited slots each week',
    walkIn: false,
  },
  {
    id: 'mental',
    name: 'Counselling and mental health',
    eligibility: 'Anyone 14+, walk-in or booked',
    cost: 'Free, first session same day when possible',
    walkIn: true,
  },
  {
    id: 'pediatric',
    name: 'Children and infant care',
    eligibility: 'Under 18 with any adult',
    cost: 'Free, including vaccinations',
    walkIn: true,
  },
  {
    id: 'prescriptions',
    name: 'Prescriptions and refills',
    eligibility: 'Existing and new patients',
    cost: 'Free to issue, medication costs vary',
    walkIn: true,
  },
  {
    id: 'screening',
    name: 'Blood pressure, diabetes, and vision screening',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    walkIn: true,
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

const PHONE = '(555) 014-2900'
const PHONE_HREF = 'tel:+15550142900'
const INTERPRETER = '(555) 014-2911'
const INTERPRETER_HREF = 'tel:+15550142911'

/** "8:00" -> minutes since midnight */
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** minutes since midnight -> "8:00" */
function fromMinutes(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

const LAST_REGISTRATION_OFFSET = 30

/**
 * Answers the one question every patient arrives with: can I be seen today?
 * Derived from the same HOURS table shown below, so the two can never disagree.
 */
function getStatus(now) {
  const todayIndex = DAY_INDEX[now.getDay()]
  const today = HOURS[todayIndex]
  const minutes = now.getHours() * 60 + now.getMinutes()

  const nextOpen = () => {
    for (let step = 1; step <= 7; step += 1) {
      const candidate = HOURS[(todayIndex + step) % 7]
      if (candidate.open) {
        return { day: step === 1 ? 'tomorrow' : candidate.day, time: candidate.open }
      }
    }
    return null
  }

  if (!today.open) {
    const next = nextOpen()
    return {
      state: 'closed',
      headline: 'Closed today',
      detail: next
        ? `We open again ${next.day === 'tomorrow' ? 'tomorrow' : `on ${next.day}`} at ${next.time}.`
        : '',
      todayIndex,
    }
  }

  const open = toMinutes(today.open)
  const close = toMinutes(today.close)
  const lastRegistration = close - LAST_REGISTRATION_OFFSET

  if (minutes < open) {
    return {
      state: 'soon',
      headline: `Opens at ${today.open} today`,
      detail: `We take walk-ins from ${today.open} until ${fromMinutes(lastRegistration)}.`,
      todayIndex,
    }
  }

  if (minutes >= close) {
    const next = nextOpen()
    return {
      state: 'closed',
      headline: 'Closed for today',
      detail: next
        ? `We open again ${next.day === 'tomorrow' ? 'tomorrow' : `on ${next.day}`} at ${next.time}.`
        : '',
      todayIndex,
    }
  }

  if (minutes >= lastRegistration) {
    return {
      state: 'last-call',
      headline: 'Walk-in registration has closed',
      detail: `We are still open until ${today.close}. If it is urgent, come in anyway and speak to the front desk.`,
      todayIndex,
    }
  }

  return {
    state: 'open',
    headline: 'Open now for walk-ins',
    detail: `Last patient accepted at ${fromMinutes(lastRegistration)} today. No appointment needed.`,
    todayIndex,
  }
}

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  return now
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="icon">
      <path
        fill="currentColor"
        d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C11.4 21 3 12.6 3 2a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.3.2 2.5.57 3.6a1 1 0 0 1-.25 1z"
      />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="icon">
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7m0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5"
      />
    </svg>
  )
}

export default function App() {
  const now = useNow()
  const status = useMemo(() => getStatus(now), [now])

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
    <div className="page">
      <a className="skip-link" href="#status">
        Skip to today&rsquo;s status
      </a>

      <div className="emergency" role="alert" id="emergency">
        <div className="emergency-inner">
          <span className="emergency-mark" aria-hidden="true">
            !
          </span>
          <p>
            <strong>Chest pain, trouble breathing, or severe bleeding?</strong>{' '}
            <a href="tel:911">Call 911 now</a> &mdash; do not wait for the clinic.
          </p>
        </div>
      </div>

      <nav className="nav" id="site-nav" aria-label="Main">
        <a className="nav-logo" href="#status">
          <span className="nav-mark" aria-hidden="true">
            +
          </span>
          <span>
            Eastside
            <small>Community Health</small>
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
          <PhoneIcon />
          <span>{PHONE}</span>
        </a>
      </nav>

      <header className="hero" id="status">
        <div className="hero-copy">
          <div className={`status-card status-${status.state}`} id="walkin-status">
            <span className="status-dot" aria-hidden="true" />
            <div>
              <p className="status-headline">{status.headline}</p>
              <p className="status-detail">{status.detail}</p>
            </div>
          </div>

          <h1>
            Free healthcare for everyone in the Eastside.
            <em> No questions asked.</em>
          </h1>

          <p className="hero-lede">
            You do not need insurance. You do not need a permanent address. We do not ask about your
            immigration status, and we do not share patient records with any other agency.
          </p>

          <div className="hero-actions">
            <a className="btn btn-primary" href={PHONE_HREF}>
              <PhoneIcon />
              Call {PHONE}
            </a>
            <a className="btn btn-secondary" href="#visit">
              <PinIcon />
              Get directions
            </a>
          </div>
        </div>

        <ul className="assurances" aria-label="What you do not need to bring">
          <li className="assurance">
            <span className="assurance-no" aria-hidden="true">
              No
            </span>
            <span className="assurance-text">insurance required</span>
          </li>
          <li className="assurance">
            <span className="assurance-no" aria-hidden="true">
              No
            </span>
            <span className="assurance-text">immigration status questions</span>
          </li>
          <li className="assurance">
            <span className="assurance-no" aria-hidden="true">
              No
            </span>
            <span className="assurance-text">cost for any visit</span>
          </li>
        </ul>
      </header>

      <main>
        <section className="section" id="hours">
          <div className="section-head">
            <h2>Opening hours</h2>
            <p className="section-kicker">Today is highlighted.</p>
          </div>

          <div className="hours-panel">
            <table className="hours-table">
              <caption className="visually-hidden">
                Opening hours for each day of the week
              </caption>
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
                    className={i === status.todayIndex ? 'is-today' : undefined}
                  >
                    <th scope="row">
                      {h.day}
                      {i === status.todayIndex && <span className="today-tag">Today</span>}
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

            <p className="note">
              <strong>Walk-in registration closes 30 minutes before we do.</strong> If you arrive
              late and it is urgent, come in anyway and speak to the front desk.
            </p>
          </div>
        </section>

        <section className="section" id="services">
          <div className="section-head">
            <h2>What we can help with</h2>
            <p className="section-kicker">Every service below is free to you.</p>
          </div>

          <ul className="services">
            {SERVICES.map((s) => (
              <li className="service" key={s.id} data-service={s.id}>
                <span className={`service-tag ${s.walkIn ? 'tag-walkin' : 'tag-booked'}`}>
                  {s.walkIn ? 'Walk in' : 'Book first'}
                </span>
                <h3>{s.name}</h3>
                <dl className="service-facts">
                  <dt>Who</dt>
                  <dd className="service-eligibility">{s.eligibility}</dd>
                  <dt>Cost</dt>
                  <dd className="service-cost">{s.cost}</dd>
                </dl>
              </li>
            ))}
          </ul>
        </section>

        <section className="section" id="visit">
          <div className="section-head">
            <h2>Getting here</h2>
            <p className="section-kicker">1140 East Barrow Street, on the bus 14 and 27 line.</p>
          </div>

          <div className="visit-grid">
            <div className="visit-card visit-card-primary">
              <h3>
                <PinIcon />
                Address
              </h3>
              <address className="address">
                1140 East Barrow Street
                <br />
                Eastside, Springfield 62704
              </address>
              <p className="visit-phone">
                <strong>Phone:</strong>{' '}
                <a href={PHONE_HREF}>{PHONE}</a>
              </p>
              <a className="btn btn-primary btn-block" href={PHONE_HREF}>
                <PhoneIcon />
                Call the clinic
              </a>
            </div>

            <div className="visit-card">
              <h3>How to reach us</h3>
              <ul className="transit">
                <li>Bus 14 and 27 stop directly outside the door on East Barrow.</li>
                <li>Green line to Barrow Street station, then a four-minute walk east.</li>
                <li>Free parking behind the building, entrance from Alder Lane.</li>
                <li>Step-free entrance and accessible restrooms on the ground floor.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section" id="languages">
          <div className="section-head">
            <h2>We speak your language</h2>
            <p className="section-kicker">
              Staff or on-site interpreters are available in these languages during all opening
              hours.
            </p>
          </div>

          <ul className="languages">
            {LANGUAGES.map((l) => (
              <li key={l.name}>
                <span className="language-native">{l.native}</span>
                <span className="language-name">{l.name}</span>
              </li>
            ))}
          </ul>

          <div className="interpreter">
            <p>
              Speak another language? Call our <strong>free interpreter line</strong> and we will
              connect a translator before your visit.
            </p>
            <a className="btn btn-secondary" href={INTERPRETER_HREF}>
              <PhoneIcon />
              {INTERPRETER}
            </a>
          </div>
        </section>

        <section className="section" id="book">
          <div className="section-head">
            <h2>Book an appointment</h2>
            <p className="section-kicker">
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
                We only use your number to confirm the time. We never share it.
              </p>
            </form>
          )}
        </section>
      </main>

      <footer className="footer" id="site-footer">
        <div className="footer-top">
          <a className="footer-call" href={PHONE_HREF}>
            <PhoneIcon />
            <span>
              <small>Call the clinic</small>
              {PHONE}
            </span>
          </a>
          <div className="footer-links">
            <a href="#status">Top</a>
            <a href="/privacy">Patient privacy</a>
            <a href="/rights">Your rights</a>
            <a href="/volunteer">Volunteer</a>
          </div>
        </div>
        <p>© 2026 Eastside Community Health — a nonprofit clinic funded by Springfield County</p>
      </footer>

      <a className="call-bar" href={PHONE_HREF}>
        <PhoneIcon />
        Call {PHONE}
      </a>
    </div>
  )
}
