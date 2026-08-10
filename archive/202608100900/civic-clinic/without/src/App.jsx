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
    <div className="page">
      <p className="emergency" role="alert" id="emergency">
        If you have chest pain, trouble breathing, or severe bleeding, call 911 now. Do not wait for
        the clinic.
      </p>

      <nav className="nav" id="site-nav">
        <span className="nav-logo">Eastside Community Health</span>
        <div className="nav-links">
          <a href="#status">Hours</a>
          <a href="#services">Services</a>
          <a href="#visit">Getting here</a>
          <a href="#languages">Languages</a>
          <a href="#book">Book</a>
        </div>
      </nav>

      <header className="hero" id="status">
        <p className="status-line" id="walkin-status">
          <strong>Open now for walk-ins.</strong> Last patient accepted at 19:30 today.
        </p>
        <h1>Free healthcare for everyone in the Eastside, no questions asked.</h1>
        <p>
          You do not need insurance. You do not need a permanent address. We do not ask about your
          immigration status, and we do not share patient records with any other agency.
        </p>
        <div className="assurances">
          <span className="assurance">No insurance required</span>
          <span className="assurance">No immigration status questions</span>
          <span className="assurance">No cost for any visit</span>
        </div>
        <div className="hero-actions">
          <a className="btn btn-primary" href="tel:+15550142900">
            Call (555) 014-2900
          </a>
          <a className="btn btn-secondary" href="#visit">
            Get directions
          </a>
        </div>
      </header>

      <section className="section" id="hours">
        <h2>Opening hours</h2>
        <table className="hours-table">
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Open</th>
              <th scope="col">Close</th>
            </tr>
          </thead>
          <tbody>
            {HOURS.map((h) => (
              <tr key={h.day} data-day={h.day.toLowerCase()}>
                <th scope="row">{h.day}</th>
                {h.open ? (
                  <>
                    <td>{h.open}</td>
                    <td>{h.close}</td>
                  </>
                ) : (
                  <td colSpan={2}>Closed</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">
          Walk-in registration closes 30 minutes before we do. If you arrive late and it is urgent,
          come in anyway and speak to the front desk.
        </p>
      </section>

      <section className="section" id="services">
        <h2>What we can help with</h2>
        <ul className="services">
          {SERVICES.map((s) => (
            <li className="service" key={s.id} data-service={s.id}>
              <h3>{s.name}</h3>
              <p className="service-eligibility">{s.eligibility}</p>
              <p className="service-cost">{s.cost}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" id="visit">
        <h2>Getting here</h2>
        <address className="address">
          1140 East Barrow Street
          <br />
          Eastside, Springfield 62704
        </address>
        <p>
          <strong>Phone:</strong> <a href="tel:+15550142900">(555) 014-2900</a>
        </p>
        <ul className="transit">
          <li>Bus 14 and 27 stop directly outside the door on East Barrow.</li>
          <li>Green line to Barrow Street station, then a four-minute walk east.</li>
          <li>Free parking behind the building, entrance from Alder Lane.</li>
          <li>Step-free entrance and accessible restrooms on the ground floor.</li>
        </ul>
      </section>

      <section className="section" id="languages">
        <h2>We speak your language</h2>
        <p>
          Staff or on-site interpreters are available in these languages during all opening hours:
        </p>
        <ul className="languages">
          {LANGUAGES.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="note">
          For any other language, call our free interpreter line at{' '}
          <a href="tel:+15550142911">(555) 014-2911</a> and we will connect a translator before your
          visit.
        </p>
      </section>

      <section className="section" id="book">
        <h2>Book an appointment</h2>
        <p>
          Walk-ins are always welcome. Booking is only needed for dental and some counselling slots.
        </p>
        {booked ? (
          <p className="form-success" role="status">
            Thank you, {name}. We will call {phone} within one working day to confirm your time.
          </p>
        ) : (
          <form className="booking-form" onSubmit={handleSubmit}>
            <label htmlFor="svc">Which service?</label>
            <select id="svc" name="service" required value={service} onChange={(e) => setService(e.target.value)}>
              <option value="">Choose a service</option>
              {SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <label htmlFor="name">Your name</label>
            <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />

            <label htmlFor="phone">Phone number</label>
            <input id="phone" name="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />

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
    </div>
  )
}
