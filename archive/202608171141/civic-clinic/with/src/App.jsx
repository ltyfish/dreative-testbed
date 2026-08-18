// Eastside Community Health — free walk-in clinic.
//
// The page is ordered the way a person asks at the door: can I be seen today,
// will you turn me away, what can you treat, how do I get there, will anyone
// speak my language, and only then, do I need to book.
//
// See BASELINES.md for where this content came from.
import { useState, useEffect, useRef } from 'react'
import {
  TriangleAlert,
  Phone,
  Stethoscope,
  Smile,
  HeartHandshake,
  Baby,
  Pill,
  Activity,
  Bus,
  TrainFront,
  Car,
  Accessibility,
  Languages as LanguagesIcon,
  ShieldCheck,
  Check,
  MapPin,
  ArrowRight,
  Clock,
} from 'lucide-react'

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

// Presentation metadata only. Nothing here changes a fact above: it decides
// which mark a row carries and which of the two queues a service sits in.
const SERVICE_META = {
  primary: { icon: Stethoscope, queue: 'walk' },
  dental: { icon: Smile, queue: 'book' },
  mental: { icon: HeartHandshake, queue: 'walk', alsoBookable: true },
  pediatric: { icon: Baby, queue: 'walk' },
  prescriptions: { icon: Pill, queue: 'walk' },
  screening: { icon: Activity, queue: 'walk' },
}

const TRANSIT_ICONS = [Bus, TrainFront, Car, Accessibility]

// The week bar is drawn against a fixed 7:00–21:00 day so the columns are
// comparable to each other. Every time is also printed as text underneath.
const AXIS_START = 7 * 60
const AXIS_END = 21 * 60
const AXIS_TICKS = [8, 12, 16, 20]

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function fromMinutes(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

function durationLabel(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h} hr ${m} min`
  if (h) return `${h} hr`
  return `${m} min`
}

// Walk-in registration closes 30 minutes before the doors do.
const REGISTRATION_LEAD = 30

function readStatus(now) {
  const todayIndex = (now.getDay() + 6) % 7 // Monday-first, matching HOURS
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const today = HOURS[todayIndex]

  // Stated in every state, so today's hours and the registration cut-off are
  // on the page whatever time the reader arrives.
  const facts = today.open
    ? {
        day: today.day,
        hours: `${today.open}–${today.close}`,
        registration: `registration until ${fromMinutes(
          toMinutes(today.close) - REGISTRATION_LEAD,
        )}`,
      }
    : { day: today.day, hours: 'Closed all day', registration: null }

  const nextOpen = () => {
    for (let step = 1; step <= 7; step += 1) {
      const entry = HOURS[(todayIndex + step) % 7]
      if (entry.open) return { entry, label: step === 1 ? 'tomorrow' : entry.day }
    }
    return null
  }

  if (today.open) {
    const open = toMinutes(today.open)
    const close = toMinutes(today.close)
    const lastAccepted = close - REGISTRATION_LEAD

    if (nowMins < open) {
      return {
        todayIndex,
        nowMins,
        facts,
        tone: 'soon',
        state: 'Closed right now',
        headline: `We open at ${today.open} today`,
        detail: `Walk in any time between ${today.open} and ${fromMinutes(lastAccepted)} and you will be seen today.`,
        pillLabel: `Opens ${today.open}`,
      }
    }
    if (nowMins < lastAccepted) {
      return {
        todayIndex,
        nowMins,
        facts,
        tone: 'open',
        state: 'Open now for walk-ins',
        headline: `Last patient accepted at ${fromMinutes(lastAccepted)} today`,
        detail: `That is ${durationLabel(lastAccepted - nowMins)} from now. No appointment, no insurance, no cost.`,
        pillLabel: 'Open now',
        window: { start: open, end: lastAccepted, now: nowMins },
      }
    }
    if (nowMins < close) {
      return {
        todayIndex,
        nowMins,
        facts,
        tone: 'closing',
        state: 'Walk-in registration has closed',
        headline: `The doors stay open until ${today.close} today`,
        detail: 'If you arrive late and it is urgent, come in anyway and speak to the front desk.',
        pillLabel: 'Registration closed',
      }
    }
  }

  const next = nextOpen()
  return {
    todayIndex,
    nowMins,
    facts,
    tone: 'closed',
    state: 'Closed right now',
    headline: next ? `We open ${next.label} at ${next.entry.open}` : 'We are closed',
    detail:
      'If you have an emergency, call 911. For anything else, call us and we will tell you what to do next.',
    pillLabel: 'Closed',
  }
}

/* Regional entrance. One rule for the whole route: 14px of travel, once,
   measured against the top of the viewport so a reveal never fires behind
   a reader who has already scrolled past. */
function useReveal() {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return undefined
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, shown]
}

function Section({ id, children, className = '' }) {
  const [ref, shown] = useReveal()
  return (
    <section id={id} ref={ref} className={`section ${className} ${shown ? 'is-in' : ''}`}>
      {children}
    </section>
  )
}

function WeekBar({ status, grown }) {
  const span = AXIS_END - AXIS_START
  const pct = (mins) => ((mins - AXIS_START) / span) * 100

  return (
    <figure className={`week ${grown ? 'is-grown' : ''}`}>
      <figcaption className="week__title">
        Opening hours, every day of the week
      </figcaption>
      <div className="week__plot" aria-hidden="true">
        <div className="week__axis">
          {AXIS_TICKS.map((tick) => (
            <span key={tick} className="week__tick" style={{ top: `${pct(tick * 60)}%` }}>
              {tick}:00
            </span>
          ))}
        </div>
        <ol className="week__cols">
          {HOURS.map((entry, index) => {
            const isToday = index === status.todayIndex
            const nowInAxis =
              isToday && status.nowMins >= AXIS_START && status.nowMins <= AXIS_END
            return (
              <li
                key={entry.day}
                data-day={entry.day.toLowerCase()}
                className={`week__col ${isToday ? 'is-today' : ''} ${entry.open ? '' : 'is-shut'}`}
              >
                <div className="week__track">
                  {entry.open ? (
                    <span
                      className="week__bar"
                      style={{
                        top: `${pct(toMinutes(entry.open))}%`,
                        height: `${pct(toMinutes(entry.close)) - pct(toMinutes(entry.open))}%`,
                        transitionDelay: `${120 + index * 45}ms`,
                      }}
                    />
                  ) : (
                    <span className="week__void" />
                  )}
                  {nowInAxis && (
                    <span
                      className={`week__now ${pct(status.nowMins) > 78 ? 'is-low' : ''}`}
                      style={{ top: `${pct(status.nowMins)}%` }}
                    >
                      <i />
                      <em>now</em>
                    </span>
                  )}
                </div>
                <span className="week__day">{entry.day.slice(0, 3)}</span>
              </li>
            )
          })}
        </ol>
      </div>

      {/* The literal read of the same data, and the only form of it on mobile. */}
      <ol className="week__list">
        {HOURS.map((entry, index) => (
          <li
            key={entry.day}
            data-day={entry.day.toLowerCase()}
            className={`week__row ${index === status.todayIndex ? 'is-today' : ''} ${
              entry.open ? '' : 'is-shut'
            }`}
          >
            <span className="week__rowday">
              {entry.day}
              {index === status.todayIndex && <b>Today</b>}
            </span>
            <span className="week__rowtime">
              {entry.open ? `${entry.open} – ${entry.close}` : 'Closed'}
            </span>
          </li>
        ))}
      </ol>
      <p className="week__note">
        Walk-in registration closes 30 minutes before we do. If you arrive late and it is urgent,
        come in anyway and speak to the front desk.
      </p>
    </figure>
  )
}

function ServiceRow({ service }) {
  const meta = SERVICE_META[service.id]
  const Icon = meta.icon
  return (
    <li className="svc" data-service={service.id}>
      <span className="svc__mark" aria-hidden="true">
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <span className="svc__body">
        <span className="svc__name">
          {service.name}
          {meta.alsoBookable && <b className="svc__tag">or book ahead</b>}
        </span>
        <span className="svc__elig">{service.eligibility}</span>
      </span>
      <span className="svc__cost">{service.cost}</span>
    </li>
  )
}

export default function App() {
  const [service, setService] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [booked, setBooked] = useState(false)

  const [status, setStatus] = useState(() => readStatus(new Date()))
  const [grown, setGrown] = useState(false)

  useEffect(() => {
    setStatus(readStatus(new Date()))
    const tick = setInterval(() => setStatus(readStatus(new Date())), 60_000)
    const raf = requestAnimationFrame(() => setGrown(true))
    return () => {
      clearInterval(tick)
      cancelAnimationFrame(raf)
    }
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !phone || !service) return
    setBooked(true)
  }

  const walkIn = SERVICES.filter((s) => SERVICE_META[s.id].queue === 'walk')
  const bookAhead = SERVICES.filter((s) => SERVICE_META[s.id].queue === 'book')

  const windowPct = status.window
    ? Math.max(
        2,
        Math.min(
          100,
          ((status.window.now - status.window.start) /
            (status.window.end - status.window.start)) *
            100,
        ),
      )
    : 0

  return (
    <div className={`page tone-${status.tone}`}>
      <p className="alert" role="note">
        <TriangleAlert size={20} strokeWidth={2} aria-hidden="true" />
        <span>
          If you have <b>chest pain, trouble breathing, or severe bleeding, call 911 now.</b> Do not
          wait for the clinic.
        </span>
      </p>

      <header className="mast">
        <a className="mast__id" href="#top">
          <span className="mast__cross" aria-hidden="true" />
          <span>
            <b>Eastside Community Health</b>
            <i>Free healthcare for everyone in the Eastside, no questions asked.</i>
          </span>
        </a>
        <nav className="mast__nav" aria-label="Sections">
          <a href="#today">Today</a>
          <a href="#services">Services</a>
          <a href="#visit">Getting here</a>
          <a href="#languages">Languages</a>
        </nav>
        <a className="mast__call" href="tel:+15550142900">
          <Phone size={17} strokeWidth={2.25} aria-hidden="true" />
          <span className="mast__callnum">(555) 014-2900</span>
          <span className="mast__calltxt">Call</span>
        </a>
      </header>

      <main id="top">
        {/* 1. The one question almost everyone arrives with. */}
        <section className="status" id="today">
          <div className="status__now">
            <p className="status__pill">
              <span className="status__dot" aria-hidden="true" />
              {status.pillLabel}
            </p>
            <h1 className="status__state">{status.state}</h1>
            <p className="status__head">{status.headline}</p>

            {status.window && (
              <div className="status__window" aria-hidden="true">
                <span
                  className="status__windowfill"
                  style={{ width: grown ? `${windowPct}%` : '0%' }}
                />
                <b style={{ left: `${windowPct}%` }} />
              </div>
            )}
            {status.window && (
              <p className="status__windowkey" aria-hidden="true">
                <span>{fromMinutes(status.window.start)}</span>
                <span>registration closes {fromMinutes(status.window.end)}</span>
              </p>
            )}

            <p className="status__facts">
              <Clock size={17} strokeWidth={2} aria-hidden="true" />
              <b>Today, {status.facts.day}</b>
              <span>{status.facts.hours}</span>
              {status.facts.registration && <span>{status.facts.registration}</span>}
            </p>

            <p className="status__detail">{status.detail}</p>

            <div className="status__acts">
              <a className="btn btn--solid" href="#visit">
                <MapPin size={18} strokeWidth={2} aria-hidden="true" />
                1140 East Barrow Street
              </a>
              <a className="btn btn--ghost" href="tel:+15550142900">
                <Phone size={18} strokeWidth={2} aria-hidden="true" />
                (555) 014-2900
              </a>
            </div>
          </div>

          <WeekBar status={status} grown={grown} />
        </section>

        {/* 2. The reason people who need us most stay away. Answer it early. */}
        <Section id="assurances" className="assure">
          <div className="assure__inner">
            <ul className="assure__list">
              {['No insurance required.', 'No immigration status questions.', 'No cost for any visit.'].map(
                (line) => (
                  <li key={line}>
                    <ShieldCheck size={26} strokeWidth={1.75} aria-hidden="true" />
                    {line}
                  </li>
                ),
              )}
            </ul>
            <p className="assure__body">
              You do not need insurance. You do not need a permanent address. We do not ask about
              your immigration status, and we do not share patient records with any other agency.
            </p>
          </div>
        </Section>

        {/* 3. What we can actually treat, split by the only axis that changes
            what you do next: walk in, or call first. */}
        <Section id="services" className="services">
          <header className="head">
            <h2>What we can help with</h2>
            <p>Six services. Every one of them free.</p>
          </header>

          <div className="queue">
            <h3 className="queue__title">
              <span className="queue__n">{walkIn.length}</span>
              Walk in — no appointment needed
            </h3>
            <ul className="svcs">
              {walkIn.map((s) => (
                <ServiceRow key={s.id} service={s} />
              ))}
            </ul>
          </div>

          <div className="queue queue--book">
            <h3 className="queue__title">
              <span className="queue__n">{bookAhead.length}</span>
              Call or book ahead
            </h3>
            <ul className="svcs">
              {bookAhead.map((s) => (
                <ServiceRow key={s.id} service={s} />
              ))}
            </ul>
            <p className="queue__note">
              Walk-ins are always welcome. Booking is only needed for dental and some counselling
              slots. <a href="#book">Request an appointment</a>
              <ArrowRight size={15} strokeWidth={2.25} aria-hidden="true" />
            </p>
          </div>
        </Section>

        {/* 4. How to get to the door. */}
        <Section id="visit" className="visit">
          <div className="visit__addr">
            <h2 className="eyebrow">Getting here</h2>
            <p className="visit__street">
              1140 East Barrow Street
              <span>Eastside, Springfield 62704</span>
            </p>
            <a className="btn btn--solid" href="tel:+15550142900">
              <Phone size={18} strokeWidth={2} aria-hidden="true" />
              (555) 014-2900
            </a>
          </div>
          <ul className="visit__ways">
            {TRANSIT.map((t, i) => {
              const Icon = TRANSIT_ICONS[i]
              return (
                <li key={t}>
                  <Icon size={26} strokeWidth={1.6} aria-hidden="true" />
                  <span>{t}</span>
                </li>
              )
            })}
          </ul>
        </Section>

        {/* 5. Whether anyone here will understand you. */}
        <Section id="languages" className="langs">
          <div className="langs__inner">
            <header className="head">
              <h2>We speak your language</h2>
              <p>
                Staff or on-site interpreters are available in these languages during all opening
                hours:
              </p>
            </header>
            <ul className="langs__chips">
              {LANGUAGES.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <p className="langs__line">
              <LanguagesIcon size={24} strokeWidth={1.6} aria-hidden="true" />
              <span>
                For any other language, call our free interpreter line at{' '}
                <a href="tel:+15550142911">(555) 014-2911</a> and we will connect a translator
                before your visit.
              </span>
            </p>
          </div>
        </Section>

        {/* 6. Last, because most people never need it. */}
        <Section id="book" className="book">
          <div className="book__inner">
            <header className="head">
              <h2>Request an appointment</h2>
              <p>
                Walk-ins are always welcome. Booking is only needed for dental and some counselling
                slots.
              </p>
            </header>

            {booked ? (
              <p className="book__done" role="status">
                <Check size={28} strokeWidth={2.5} aria-hidden="true" />
                Thank you, {name}. We will call {phone} within one working day to confirm your time.
              </p>
            ) : (
              <form className="form" onSubmit={handleSubmit}>
                <p className="field field--wide">
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
                </p>
                <p className="field">
                  <label htmlFor="name">Your name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </p>
                <p className="field">
                  <label htmlFor="phone">Phone number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </p>
                <button className="btn btn--solid btn--submit" type="submit">
                  Request appointment
                </button>
              </form>
            )}
          </div>
        </Section>
      </main>

      <footer className="foot">
        <p className="foot__id">
          <span className="mast__cross" aria-hidden="true" />
          Eastside Community Health
        </p>
        <ul className="foot__links">
          <li>
            <a href="#top">Patient privacy</a>
          </li>
          <li>
            <a href="#top">Your rights</a>
          </li>
          <li>
            <a href="#top">Volunteer</a>
          </li>
        </ul>
        <p className="foot__meta">
          A free walk-in clinic funded by Springfield County. © 2026.
          <br />
          1140 East Barrow Street, Eastside, Springfield 62704 ·{' '}
          <a href="tel:+15550142900">(555) 014-2900</a>
        </p>
      </footer>
    </div>
  )
}
