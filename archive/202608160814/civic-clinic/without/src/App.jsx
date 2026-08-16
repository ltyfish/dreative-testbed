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
  'No insurance required',
  'No immigration status questions',
  'No cost for any visit',
]

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
          If you have chest pain, trouble breathing, or severe bleeding,{' '}
          <a href="tel:911">call 911</a> now. Do not wait for the clinic.
        </p>
      </aside>

      <header className="masthead">
        <a className="masthead__brand" href="#top">
          <span className="masthead__name">Eastside Community Health</span>
          <span className="masthead__kicker">Free walk-in clinic</span>
        </a>
        <nav className="masthead__nav" aria-label="Sections">
          <a href="#hours">Hours</a>
          <a href="#services">Services</a>
          <a href="#visit">Getting here</a>
          <a href="#languages">Languages</a>
        </nav>
        <a className="masthead__call" href="tel:+15550142900">
          <span>Call the clinic</span>
          <strong>(555) 014-2900</strong>
        </a>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__copy">
            <p className="status">
              <span className="status__dot" aria-hidden="true" />
              Open now for walk-ins
            </p>
            <h1 id="hero-title">Free healthcare for everyone in the Eastside, no questions asked.</h1>
            <p className="hero__lede">Last patient accepted at 19:30 today.</p>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#visit">Get directions</a>
              <a className="btn btn--ghost" href="#services">See what we treat</a>
            </div>
          </div>

          <ul className="assurances" aria-label="What you do not need to bring">
            {ASSURANCES.map((a) => (
              <li key={a}>
                <span className="assurances__tick" aria-hidden="true">✓</span>
                {a}
              </li>
            ))}
          </ul>

          <p className="hero__promise">
            You do not need insurance. You do not need a permanent address. We do not ask about your
            immigration status, and we do not share patient records with any other agency.
          </p>
        </section>

        <section id="hours" className="section section--hours" aria-labelledby="hours-title">
          <div className="section__head">
            <h2 id="hours-title">Opening hours</h2>
            <p>Walk in any time we are open. No appointment, no referral.</p>
          </div>
          <div className="hours">
            <ul className="hours__list">
              {HOURS.map((h) => (
                <li key={h.day} data-day={h.day.toLowerCase()} className={h.open ? '' : 'is-closed'}>
                  <span className="hours__day">{h.day}</span>
                  <span className="hours__time">{h.open ? `${h.open} – ${h.close}` : 'Closed'}</span>
                </li>
              ))}
            </ul>
            <p className="hours__note">
              Walk-in registration closes 30 minutes before we do. If you arrive late and it is
              urgent, come in anyway and speak to the front desk.
            </p>
          </div>
        </section>

        <section id="services" className="section" aria-labelledby="services-title">
          <div className="section__head">
            <h2 id="services-title">What we can help with</h2>
            <p>Six services, all free at the point of care.</p>
          </div>
          <ul className="services">
            {SERVICES.map((s) => (
              <li key={s.id} data-service={s.id} className="service">
                <h3>{s.name}</h3>
                <dl>
                  <dt>Who</dt>
                  <dd>{s.eligibility}</dd>
                  <dt>Cost</dt>
                  <dd className="service__cost">{s.cost}</dd>
                </dl>
              </li>
            ))}
          </ul>
        </section>

        <section id="visit" className="section section--visit" aria-labelledby="visit-title">
          <div className="section__head">
            <h2 id="visit-title">Getting here</h2>
          </div>
          <div className="visit">
            <div className="visit__card">
              <h3>Address</h3>
              <p className="visit__address">1140 East Barrow Street, Eastside, Springfield 62704.</p>
              <p className="visit__phone">
                Phone <a href="tel:+15550142900">(555) 014-2900</a>
              </p>
            </div>
            <ul className="visit__transit">
              {TRANSIT.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </section>

        <section id="languages" className="section section--languages" aria-labelledby="lang-title">
          <div className="section__head">
            <h2 id="lang-title">We speak your language</h2>
            <p>Staff or on-site interpreters are available in these languages during all opening hours:</p>
          </div>
          <ul className="languages">
            {LANGUAGES.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="languages__note">
            For any other language, call our free interpreter line at{' '}
            <a href="tel:+15550142911">(555) 014-2911</a> and we will connect a translator before
            your visit.
          </p>
        </section>

        <section id="book" className="section section--book" aria-labelledby="book-title">
          <div className="section__head">
            <h2 id="book-title">Request an appointment</h2>
            <p>
              Walk-ins are always welcome. Booking is only needed for dental and some counselling
              slots.
            </p>
          </div>
          {booked ? (
            <p role="status" className="booked">
              Thank you, {name}. We will call {phone} within one working day to confirm your time.
            </p>
          ) : (
            <form className="form" onSubmit={handleSubmit}>
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
                <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone number</label>
                <input id="phone" name="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <button className="btn btn--primary" type="submit">Request appointment</button>
            </form>
          )}
        </section>
      </main>

      <footer className="footer">
        <p className="footer__about">
          Eastside Community Health. A free walk-in clinic funded by Springfield County. © 2026.
        </p>
        <ul className="footer__links">
          <li>Patient privacy</li>
          <li>Your rights</li>
          <li>Volunteer</li>
        </ul>
      </footer>
    </>
  )
}
