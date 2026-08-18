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
  { id: 'primary', name: 'General check-ups and illness', eligibility: 'Anyone, no appointment needed', cost: 'Free' },
  { id: 'dental', name: 'Dental cleaning and extractions', eligibility: 'Adults 18+, appointment needed', cost: 'Free, limited slots each week' },
  { id: 'mental', name: 'Counselling and mental health', eligibility: 'Anyone 14+, walk-in or booked', cost: 'Free, first session same day when possible' },
  { id: 'pediatric', name: 'Children and infant care', eligibility: 'Under 18 with any adult', cost: 'Free, including vaccinations' },
  { id: 'prescriptions', name: 'Prescriptions and refills', eligibility: 'Existing and new patients', cost: 'Free to issue, medication costs vary' },
  { id: 'screening', name: 'Blood pressure, diabetes, and vision screening', eligibility: 'Anyone, no appointment needed', cost: 'Free' },
]

const LANGUAGES = ['English', 'Spanish', 'Vietnamese', 'Somali', 'Haitian Creole', 'Mandarin', 'Arabic']

const TRANSIT = [
  'Bus 14 and 27 stop directly outside the door on East Barrow.',
  'Green line to Barrow Street station, then a four-minute walk east.',
  'Free parking behind the building, entrance from Alder Lane.',
  'Step-free entrance and accessible restrooms on the ground floor.',
]

const ASSURANCES = [
  {
    title: 'No insurance required',
    body: 'You do not need insurance, and you do not need a permanent address.',
  },
  {
    title: 'No immigration status questions',
    body: 'We do not ask about your immigration status, and we do not share patient records with any other agency.',
  },
  {
    title: 'No cost for any visit',
    body: 'Every visit is free. Only some medications carry a cost.',
  },
]

const TODAY = new Date().toLocaleDateString('en-US', { weekday: 'long' })

export default function App() {
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
    <>
      <aside className="emergency" role="alert">
        <span className="emergency__mark" aria-hidden="true">!</span>
        <p>
          If you have <strong>chest pain, trouble breathing, or severe bleeding, call 911 now.</strong>{' '}
          Do not wait for the clinic.
        </p>
        <a className="emergency__call" href="tel:911">Call 911</a>
      </aside>

      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand__mark" aria-hidden="true" />
          <span className="brand__name">
            Eastside<span> Community Health</span>
          </span>
        </a>
        <nav className="topnav" aria-label="Sections">
          <a href="#hours">Hours</a>
          <a href="#services">Services</a>
          <a href="#visit">Getting here</a>
          <a href="#languages">Languages</a>
        </nav>
        <a className="topbar__phone" href="tel:+15550142900">
          <span>Clinic phone</span>
          <strong>(555) 014-2900</strong>
        </a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero__status">
            <p className="status">
              <span className="status__dot" aria-hidden="true" />
              Open now for walk-ins
            </p>
            <p className="status__detail">Last patient accepted at 19:30 today.</p>
          </div>

          <h1>Free healthcare for everyone in the Eastside, no questions asked.</h1>

          <p className="hero__lede">
            Walk in without an appointment, without insurance, and without paperwork about who you
            are. Today we are open until 20:00 at 1140 East Barrow Street.
          </p>

          <div className="hero__actions">
            <a className="btn btn--primary" href="#visit">How to get here</a>
            <a className="btn btn--ghost" href="tel:+15550142900">Call (555) 014-2900</a>
          </div>

          <ul className="pills">
            <li>No insurance required</li>
            <li>No immigration status questions</li>
            <li>No cost for any visit</li>
          </ul>
        </section>

        <section className="assure" aria-labelledby="assure-title">
          <h2 id="assure-title">What we never ask you for</h2>
          <ul className="assure__grid">
            {ASSURANCES.map((a) => (
              <li key={a.title}>
                <h3>{a.title}</h3>
                <p>{a.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="hours" id="hours" aria-labelledby="hours-title">
          <div className="hours__intro">
            <h2 id="hours-title">Opening hours</h2>
            <p className="note">
              Walk-in registration closes 30 minutes before we do. If you arrive late and it is
              urgent, come in anyway and speak to the front desk.
            </p>
          </div>
          <ul className="hours__list">
            {HOURS.map((h) => (
              <li
                key={h.day}
                data-day={h.day.toLowerCase()}
                className={h.day === TODAY ? 'is-today' : undefined}
              >
                <span className="hours__day">
                  {h.day}
                  {h.day === TODAY && <em>Today</em>}
                </span>
                <span className={h.open ? 'hours__time' : 'hours__time is-closed'}>
                  {h.open ? `${h.open} – ${h.close}` : 'Closed'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="services" id="services" aria-labelledby="services-title">
          <h2 id="services-title">What we can help with</h2>
          <ul className="services__grid">
            {SERVICES.map((s) => (
              <li key={s.id} data-service={s.id}>
                <h3>{s.name}</h3>
                <dl>
                  <div>
                    <dt>Who</dt>
                    <dd>{s.eligibility}</dd>
                  </div>
                  <div>
                    <dt>Cost</dt>
                    <dd className="cost">{s.cost}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </section>

        <section className="visit" id="visit" aria-labelledby="visit-title">
          <div className="visit__where">
            <h2 id="visit-title">Getting here</h2>
            <p className="address">1140 East Barrow Street, Eastside, Springfield 62704.</p>
            <p className="visit__phone">
              Questions before you come? Call <a href="tel:+15550142900">(555) 014-2900</a>.
            </p>
          </div>
          <ul className="visit__transit">
            {TRANSIT.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="langs" id="languages" aria-labelledby="langs-title">
          <div className="langs__text">
            <h2 id="langs-title">We speak your language</h2>
            <p>Staff or on-site interpreters are available in these languages during all opening hours:</p>
            <ul className="langs__list">
              {LANGUAGES.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
          <div className="langs__line">
            <h3>Any other language</h3>
            <p>
              Call our free interpreter line and we will connect a translator before your visit.
            </p>
            <a className="btn btn--primary" href="tel:+15550142911">(555) 014-2911</a>
          </div>
        </section>

        <section className="book" aria-labelledby="book-title">
          <div className="book__intro">
            <h2 id="book-title">Booking an appointment</h2>
            <p>
              Walk-ins are always welcome. Booking is only needed for dental and some counselling
              slots.
            </p>
          </div>

          {booked ? (
            <p className="book__done" role="status">
              Thank you, {name}. We will call {phone} within one working day to confirm your time.
            </p>
          ) : (
            <form className="book__form" onSubmit={handleSubmit}>
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
                    <option key={s.id} value={s.id}>{s.name}</option>
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
              <button type="submit">Request appointment</button>
            </form>
          )}
        </section>
      </main>

      <footer className="foot">
        <p className="foot__about">
          Eastside Community Health. A free walk-in clinic funded by Springfield County. © 2026.
        </p>
        <ul className="foot__links">
          <li><a href="#top">Patient privacy</a></li>
          <li><a href="#top">Your rights</a></li>
          <li><a href="#top">Volunteer</a></li>
        </ul>
        <p className="foot__911">
          Medical emergency? Call <a href="tel:911">911</a>.
        </p>
      </footer>
    </>
  )
}
