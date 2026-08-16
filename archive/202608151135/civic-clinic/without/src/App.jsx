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
const REGISTRATION_BUFFER_MIN = 30

/* HOURS starts on Monday; Date#getDay starts on Sunday. */
function hoursForDay(dayIndex) {
  return HOURS[(dayIndex + 6) % 7]
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function formatMinutes(total) {
  const h = String(Math.floor(total / 60)).padStart(2, '0')
  const m = String(total % 60).padStart(2, '0')
  return `${h}:${m}`
}

function nextOpenDay(now) {
  const day = [1, 2, 3, 4, 5, 6, 7]
    .map((offset) => ({ offset, entry: hoursForDay((now.getDay() + offset) % 7) }))
    .find((d) => d.entry.open)
  return { ...day, label: day.offset === 1 ? 'tomorrow' : day.entry.day }
}

/*
 * Answers the one question most patients arrive with: can I be seen today?
 * Derived from the clock so the banner can never go stale.
 */
function getWalkInStatus(now) {
  const today = hoursForDay(now.getDay())
  const minutes = now.getHours() * 60 + now.getMinutes()

  if (!today.open) {
    const next = nextOpenDay(now)
    return {
      state: 'closed',
      headline: `Closed today (${today.day})`,
      detail: `We open again ${next.label} at ${next.entry.open}. If it cannot wait, call ${PHONE}.`,
    }
  }

  const open = toMinutes(today.open)
  const close = toMinutes(today.close)
  const lastAccepted = close - REGISTRATION_BUFFER_MIN

  if (minutes < open) {
    return {
      state: 'later',
      headline: `Closed right now — opening at ${today.open} today`,
      detail: `Once we open, walk in any time until ${formatMinutes(lastAccepted)}. No appointment needed.`,
    }
  }

  if (minutes >= close) {
    const next = nextOpenDay(now)
    return {
      state: 'closed',
      headline: 'Closed for today',
      detail: `We open again ${next.label} at ${next.entry.open}. If it cannot wait, call ${PHONE}.`,
    }
  }

  if (minutes >= lastAccepted) {
    return {
      state: 'closing',
      headline: 'Walk-in registration has closed for today',
      detail: `We are still here until ${today.close}. If it is urgent, come in anyway and speak to the front desk.`,
    }
  }

  return {
    state: 'open',
    headline: 'Open now for walk-ins',
    detail: `Last patient accepted at ${formatMinutes(lastAccepted)} today. Just come in — no appointment, no insurance, no cost.`,
  }
}

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function App() {
  const now = useNow()
  const status = getWalkInStatus(now)
  const todayName = hoursForDay(now.getDay()).day

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
      <p className="emergency" role="alert" id="emergency">
        <span className="emergency-mark" aria-hidden="true">
          !
        </span>
        <span>
          <strong>Chest pain, trouble breathing, or severe bleeding?</strong>{' '}
          <a href="tel:911">Call 911 now.</a> Do not wait for the clinic.
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
      </nav>

      <header className="hero" id="status">
        <div className={`status-card status-${status.state}`} id="walkin-status">
          <p className="status-eyebrow">
            <span className="status-dot" aria-hidden="true" />
            {todayName}, right now
          </p>
          <p className="status-headline">{status.headline}</p>
          <p className="status-detail">{status.detail}</p>
          <div className="status-actions">
            <a className="btn btn-primary" href={PHONE_HREF}>
              Call {PHONE}
            </a>
            <a className="btn btn-secondary" href="#visit">
              Get directions
            </a>
          </div>
        </div>

        <div className="hero-copy">
          <h1>Free healthcare for everyone in the Eastside, no questions asked.</h1>
          <p className="hero-lede">
            You do not need insurance. You do not need a permanent address. We do not ask about your
            immigration status, and we do not share patient records with any other agency.
          </p>
          <ul className="assurances">
            <li className="assurance">
              <span className="assurance-check" aria-hidden="true">
                ✓
              </span>
              No insurance required
            </li>
            <li className="assurance">
              <span className="assurance-check" aria-hidden="true">
                ✓
              </span>
              No immigration status questions
            </li>
            <li className="assurance">
              <span className="assurance-check" aria-hidden="true">
                ✓
              </span>
              No cost for any visit
            </li>
          </ul>
        </div>
      </header>

      <section className="section" id="hours">
        <h2>Opening hours</h2>
        <div className="hours-layout">
          <table className="hours-table">
            <caption className="sr-only">Opening hours by day. Today is highlighted.</caption>
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
                  <tr
                    key={h.day}
                    data-day={h.day.toLowerCase()}
                    className={isToday ? 'is-today' : undefined}
                  >
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
                      <td colSpan={2}>Closed</td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="note note-boxed">
            Walk-in registration closes 30 minutes before we do. If you arrive late and it is
            urgent, come in anyway and speak to the front desk.
          </p>
        </div>
      </section>

      <section className="section" id="services">
        <h2>What we can help with</h2>
        <p className="section-lede">Every service below is free. Cost lines say what that covers.</p>
        <ul className="services">
          {SERVICES.map((s) => (
            <li className="service" key={s.id} data-service={s.id}>
              <p className={`service-tag ${s.walkIn ? 'tag-walkin' : 'tag-booked'}`}>
                {s.walkIn ? 'Walk in' : 'Book ahead'}
              </p>
              <h3>{s.name}</h3>
              <p className="service-eligibility">{s.eligibility}</p>
              <p className="service-cost">{s.cost}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" id="visit">
        <h2>Getting here</h2>
        <div className="visit-layout">
          <div className="visit-card">
            <h3>Address</h3>
            <address className="address">
              1140 East Barrow Street
              <br />
              Eastside, Springfield 62704
            </address>
            <p className="visit-phone">
              <span className="visit-phone-label">Phone</span>
              <a href={PHONE_HREF}>{PHONE}</a>
            </p>
          </div>
          <div className="visit-card">
            <h3>Ways to get here</h3>
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
        <h2>We speak your language</h2>
        <p className="section-lede">
          Staff or on-site interpreters are available in these languages during all opening hours:
        </p>
        <ul className="languages">
          {LANGUAGES.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="note note-boxed">
          For any other language, call our free interpreter line at{' '}
          <a href="tel:+15550142911">(555) 014-2911</a> and we will connect a translator before your
          visit.
        </p>
      </section>

      <section className="section" id="book">
        <h2>Book an appointment</h2>
        <p className="section-lede">
          Walk-ins are always welcome. Booking is only needed for dental and some counselling slots.
        </p>
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

      <div className="callbar">
        <div className="callbar-status">
          <span className={`callbar-dot dot-${status.state}`} aria-hidden="true" />
          {status.headline}
        </div>
        <a className="callbar-btn" href={PHONE_HREF}>
          Call clinic
        </a>
      </div>
    </div>
  )
}
