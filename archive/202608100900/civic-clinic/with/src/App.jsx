import { useEffect, useMemo, useState } from 'react'
import {
  ACCESS_LABEL,
  ASSURANCES,
  CLINIC,
  LANGUAGES,
  SERVICES,
  TRANSIT,
} from './data.js'
import { formatTime, statusFor, stickySummary, todayIndex } from './clock.js'
import WeekTimeline from './WeekTimeline.jsx'
import BlockDiagram from './BlockDiagram.jsx'

const SECTIONS = [
  { id: 'status', num: '01', label: 'Today' },
  { id: 'services', num: '02', label: 'Services' },
  { id: 'visit', num: '03', label: 'Getting here' },
  { id: 'languages', num: '04', label: 'Languages' },
  { id: 'book', num: '05', label: 'Book' },
]

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function App() {
  const now = useNow()
  const today = todayIndex(now)
  const [selected, setSelected] = useState(today)

  // Follow the calendar if the page is left open past midnight.
  useEffect(() => {
    setSelected(today)
  }, [today])

  const status = useMemo(() => statusFor(selected, now), [selected, now])
  const sticky = useMemo(() => stickySummary(now), [now])

  return (
    <div className="page" data-status={status.state}>
      <EmergencyBar />
      <SiteHeader sticky={sticky} />

      <main>
        <AnswerPanel status={status} selected={selected} today={today} onSelect={setSelected} now={now} />
        <Services status={status} />
        <Visit status={status} />
        <Languages />
        <Booking />
      </main>

      <SiteFooter />
    </div>
  )
}

function EmergencyBar() {
  return (
    <div className="emergency" role="alert" id="emergency">
      <span className="emergency-num" aria-hidden="true">
        911
      </span>
      <p>
        <strong>Chest pain, trouble breathing, or severe bleeding?</strong> Call{' '}
        <a href="tel:911">911</a> now. Do not wait for the clinic.
      </p>
    </div>
  )
}

function SiteHeader({ sticky }) {
  return (
    <header className="nav" id="site-nav">
      <div className="nav-inner">
        <a className="nav-logo" href="#status">
          <span className="nav-mark" aria-hidden="true" />
          <span>
            Eastside
            <br />
            Community Health
          </span>
        </a>

        <p className={`nav-status nav-status--${sticky.tone}`}>
          <span className="dot" aria-hidden="true" />
          {sticky.text}
        </p>

        <nav className="nav-links" aria-label="Sections">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.label}
            </a>
          ))}
        </nav>

        <a className="btn btn-call nav-call" href={CLINIC.phoneHref}>
          Call {CLINIC.phone}
        </a>
      </div>
    </header>
  )
}

function Section({ id, num, label, title, children, className = '' }) {
  return (
    <section className={`section ${className}`} id={id} aria-labelledby={`${id}-title`}>
      <div className="section-index" aria-hidden="true">
        <span className="section-num">{num}</span>
        <span className="section-rule" />
        <span className="section-kicker">{label}</span>
      </div>
      <div className="section-body">
        <h2 id={`${id}-title`}>{title}</h2>
        {children}
      </div>
    </section>
  )
}

function AnswerPanel({ status, selected, today, onSelect, now }) {
  return (
    <section className="answer" id="status" aria-labelledby="answer-title">
      <div className="answer-lede">
        <p className="eyebrow">Free walk-in clinic · Eastside, Springfield</p>
        <h1 id="answer-title" className={`answer-headline tone-${status.state}`}>
          {status.headline}
        </h1>
        <p className="status-line" id="walkin-status" role="status">
          {status.detail}
        </p>

        <dl className="facts">
          {status.facts.map((f) => (
            <div className="fact" key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="hero-actions">
          <a className="btn btn-primary" href={CLINIC.phoneHref}>
            Call {CLINIC.phone}
          </a>
          <a className="btn btn-secondary" href="#visit">
            Get directions
          </a>
        </div>
      </div>

      <div className="answer-hours" id="hours">
        <div className="hours-head">
          <h2 className="hours-title">Opening hours</h2>
          <p className="hours-hint">
            {selected === today
              ? 'Today is highlighted. Pick another day to plan ahead.'
              : `Showing ${status.info.day}.`}
            {selected !== today && (
              <>
                {' '}
                <button type="button" className="linkish" onClick={() => onSelect(today)}>
                  Back to today
                </button>
              </>
            )}
          </p>
        </div>

        <WeekTimeline selected={selected} onSelect={onSelect} now={now} />

        <p className="note">
          Walk-in registration closes 30 minutes before we do. If you arrive late and it is urgent,
          come in anyway and speak to the front desk.
        </p>
      </div>

      <ul className="assurances">
        {ASSURANCES.map((a) => (
          <li className="assurance" key={a.title}>
            <span className="assurance-no" aria-hidden="true">
              No
            </span>
            <span className="assurance-text">
              <strong>{a.title.replace(/^No /, '')}</strong>
              <span>{a.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="assurance-full vh">
        No insurance required. No immigration status questions. No cost for any visit. You do not
        need a permanent address, and we do not share patient records with any other agency.
      </p>
      <p className="assurance-foot">
        You do not need a permanent address. We do not share patient records with any other agency.
      </p>
    </section>
  )
}

function Services({ status }) {
  const openDay = !status.info.closed
  return (
    <Section id="services" num="02" label="Services" title="What we can help with">
      <p className="section-lede">
        Six services, all free.{' '}
        {openDay
          ? `On ${status.isToday ? 'today' : status.info.day}, walk-in registration runs ${formatTime(
              status.info.open,
            )}—${formatTime(status.info.cutoff)}.`
          : `We are closed on ${status.info.day} — pick another day on the timeline above.`}
      </p>

      <table className="services" id="services-table">
        <caption className="vh">
          Services, who can be seen, what it costs, and whether an appointment is needed
        </caption>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Who can come</th>
            <th scope="col">What it costs</th>
            <th scope="col">How to be seen</th>
          </tr>
        </thead>
        <tbody>
          {SERVICES.map((s) => (
            <tr className="service" key={s.id} data-service={s.id} data-access={s.access}>
              <th scope="row">
                <span className="service-name">{s.name}</span>
              </th>
              <td className="service-eligibility" data-label="Who can come">
                {s.eligibility}
              </td>
              <td className="service-cost" data-label="What it costs">
                {s.cost}
              </td>
              <td className="service-access" data-label="How to be seen">
                <span className={`tag tag--${s.access}`}>{ACCESS_LABEL[s.access]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="note">
        Five of the six are walk-in. Only dental always needs an appointment, and counselling can be
        either.
      </p>
    </Section>
  )
}

function Visit({ status }) {
  return (
    <Section id="visit" num="03" label="Getting here" title="Getting here" className="section--visit">
      <div className="visit-grid">
        <div className="visit-facts">
          <address className="address">
            <span className="address-street">{CLINIC.street}</span>
            <span className="address-city">{CLINIC.city}</span>
          </address>

          <a className="phone-block" href={CLINIC.phoneHref}>
            <span className="phone-label">Phone</span>
            <span className="phone-number">{CLINIC.phone}</span>
          </a>

          <p className="visit-plan">
            {status.info.closed
              ? `Closed on ${status.info.day}.`
              : `${status.isToday ? 'Today' : status.info.day}: arrive before ${formatTime(
                  status.info.cutoff,
                )} to register as a walk-in.`}
          </p>

          <ul className="transit">
            {TRANSIT.map((t) => (
              <li key={t.mode}>
                <span className="transit-mode">{t.mode}</span>
                <span className="transit-text">{t.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="visit-figure">
          <BlockDiagram />
          <figcaption>Schematic of the block, not to scale. East is to the right.</figcaption>
        </figure>
      </div>
    </Section>
  )
}

function Languages() {
  return (
    <Section id="languages" num="04" label="Languages" title="We speak your language">
      <p className="section-lede">
        Staff or on-site interpreters are available in these languages during all opening hours:
      </p>

      <ul className="languages">
        {LANGUAGES.map((l) => (
          <li key={l.en}>
            <span className="lang-native" lang={l.en === 'English' ? 'en' : undefined} dir={l.dir}>
              {l.native}
            </span>
            <span className="lang-en">{l.en}</span>
          </li>
        ))}
      </ul>

      <p className="interpreter">
        <span className="interpreter-text">
          Speak another language? Call the free interpreter line and we will connect a translator
          before your visit.
        </span>
        <a className="btn btn-secondary" href={CLINIC.interpreterHref}>
          {CLINIC.interpreterPhone}
        </a>
      </p>
    </Section>
  )
}

function Booking() {
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
    <Section id="book" num="05" label="Book" title="Book an appointment" className="section--book">
      <p className="section-lede">
        Walk-ins are always welcome. Booking is only needed for dental and some counselling slots.
      </p>

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
            We ask for a name and a number so we can confirm the time. We do not ask for insurance,
            an address, or your immigration status.
          </p>
        </form>
      )}
    </Section>
  )
}

function SiteFooter() {
  return (
    <footer className="footer" id="site-footer">
      <div className="footer-inner">
        <p className="footer-org">
          © 2026 Eastside Community Health — a nonprofit clinic funded by Springfield County
        </p>
        <div className="footer-links">
          <a href="#status">Top</a>
          <a href="/privacy">Patient privacy</a>
          <a href="/rights">Your rights</a>
          <a href="/volunteer">Volunteer</a>
        </div>
      </div>
    </footer>
  )
}
