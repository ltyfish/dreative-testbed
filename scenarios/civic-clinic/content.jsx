// Content-only baseline. Every fact and every piece of behaviour the designed
// baseline had, with none of its architecture: no sections, no ids, no nav, no
// hero, no cards, no table, no ordering that means anything. A builder handed
// this cannot reorder an existing page, because there is no existing page.
//
// See BASELINES.md for why this exists.
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
    <div>
      <p>Eastside Community Health. A free walk-in clinic funded by Springfield County. © 2026.</p>

      <p>
        If you have chest pain, trouble breathing, or severe bleeding, call 911 now. Do not wait for
        the clinic.
      </p>

      <p>Open now for walk-ins. Last patient accepted at 19:30 today.</p>

      <p>Free healthcare for everyone in the Eastside, no questions asked.</p>

      <p>
        You do not need insurance. You do not need a permanent address. We do not ask about your
        immigration status, and we do not share patient records with any other agency.
      </p>

      <p>No insurance required.</p>
      <p>No immigration status questions.</p>
      <p>No cost for any visit.</p>

      <p>Phone: <a href="tel:+15550142900">(555) 014-2900</a></p>

      <p>Opening hours:</p>
      <ul>
        {HOURS.map((h) => (
          <li key={h.day} data-day={h.day.toLowerCase()}>
            {h.day}: {h.open ? `${h.open} to ${h.close}` : 'Closed'}
          </li>
        ))}
      </ul>
      <p>
        Walk-in registration closes 30 minutes before we do. If you arrive late and it is urgent,
        come in anyway and speak to the front desk.
      </p>

      <p>What we can help with:</p>
      <ul>
        {SERVICES.map((s) => (
          <li key={s.id} data-service={s.id}>
            {s.name}. {s.eligibility}. {s.cost}.
          </li>
        ))}
      </ul>

      <p>1140 East Barrow Street, Eastside, Springfield 62704.</p>
      <ul>
        {TRANSIT.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <p>
        Staff or on-site interpreters are available in these languages during all opening hours:
      </p>
      <ul>
        {LANGUAGES.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <p>
        For any other language, call our free interpreter line at{' '}
        <a href="tel:+15550142911">(555) 014-2911</a> and we will connect a translator before your
        visit.
      </p>

      <p>
        Walk-ins are always welcome. Booking is only needed for dental and some counselling slots.
      </p>
      {booked ? (
        <p role="status">
          Thank you, {name}. We will call {phone} within one working day to confirm your time.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="svc">Which service?</label>
          <select id="svc" name="service" required value={service} onChange={(e) => setService(e.target.value)}>
            <option value="">Choose a service</option>
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <label htmlFor="name">Your name</label>
          <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
          <label htmlFor="phone">Phone number</label>
          <input id="phone" name="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button type="submit">Request appointment</button>
        </form>
      )}

      <p>Patient privacy. Your rights. Volunteer.</p>
    </div>
  )
}
