import { useEffect, useRef, useState } from 'react'
import {
  Accessibility,
  Activity,
  ArrowRight,
  Baby,
  Bus,
  Car,
  Check,
  MessageCircleHeart,
  MapPin,
  Phone,
  Pill,
  Smile,
  Stethoscope,
  TrainFront,
  TriangleAlert,
} from 'lucide-react'

import WalkInClock from './WalkInClock.jsx'
import { REGISTRATION_LEAD, clockDate, formatClock, formatDuration, readClock } from './clock.js'

const SERVICES = [
  {
    id: 'primary',
    name: 'General check-ups and illness',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    walkIn: true,
    Icon: Stethoscope,
  },
  {
    id: 'dental',
    name: 'Dental cleaning and extractions',
    eligibility: 'Adults 18+, appointment needed',
    cost: 'Free, limited slots each week',
    walkIn: false,
    Icon: Smile,
  },
  {
    id: 'mental',
    name: 'Counselling and mental health',
    eligibility: 'Anyone 14+, walk-in or booked',
    cost: 'Free, first session same day when possible',
    walkIn: true,
    booking: true,
    Icon: MessageCircleHeart,
  },
  {
    id: 'pediatric',
    name: 'Children and infant care',
    eligibility: 'Under 18 with any adult',
    cost: 'Free, including vaccinations',
    walkIn: true,
    Icon: Baby,
  },
  {
    id: 'prescriptions',
    name: 'Prescriptions and refills',
    eligibility: 'Existing and new patients',
    cost: 'Free to issue, medication costs vary',
    walkIn: true,
    Icon: Pill,
  },
  {
    id: 'screening',
    name: 'Blood pressure, diabetes, and vision screening',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    walkIn: true,
    Icon: Activity,
  },
]

// The required list, each with the name a speaker of it would recognise.
const LANGUAGES = [
  { name: 'English', native: 'English' },
  { name: 'Spanish', native: 'Español' },
  { name: 'Vietnamese', native: 'Tiếng Việt' },
  { name: 'Somali', native: 'Soomaali' },
  { name: 'Haitian Creole', native: 'Kreyòl Ayisyen' },
  { name: 'Mandarin', native: '普通话', lang: 'zh' },
  { name: 'Arabic', native: 'العربية', lang: 'ar' },
]

const TRANSIT = [
  { Icon: Bus, text: 'Bus 14 and 27 stop directly outside the door on East Barrow.' },
  { Icon: TrainFront, text: 'Green line to Barrow Street station, then a four-minute walk east.' },
  { Icon: Car, text: 'Free parking behind the building, entrance from Alder Lane.' },
  { Icon: Accessibility, text: 'Step-free entrance and accessible restrooms on the ground floor.' },
]

const ASSURANCES = [
  { head: 'No insurance required.', note: 'Not for any service, on any day.' },
  { head: 'No immigration status questions.', note: 'We never ask, and we never record it.' },
  { head: 'No cost for any visit.', note: 'Nothing to pay at the desk or afterwards.' },
]

const STATUS_TEXT = {
  open: 'Open now for walk-ins',
  'last-call': 'Open now for walk-ins',
  'registration-closed': 'Walk-in registration has closed',
  closed: 'Closed right now',
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** Small regional entrance, resolved against the top of the viewport. */
function useReveal(reduced) {
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]')
    if (reduced) {
      nodes.forEach((n) => n.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -22% 0px', threshold: 0 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [reduced])
}

export default function App() {
  const reduced = usePrefersReducedMotion()
  const [, setTick] = useState(0)
  const [service, setService] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [booked, setBooked] = useState(false)
  const [pinned, setPinned] = useState(false)
  const heroRef = useRef(null)
  const serviceRef = useRef(null)

  // The single authored value. Everything on the page reads from it.
  const clock = readClock(clockDate())
  const { status, minutesLeft, registrationCloseMin, closeMin, nextDay, nextOpenMin } = clock
  const openForWalkIns = status === 'open' || status === 'last-call'

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 20000)
    return () => clearInterval(id)
  }, [])

  // The status accent is a document-level variable: one value, so the hero, the
  // week strip, the service tags and the call rail cannot disagree.
  useEffect(() => {
    document.documentElement.dataset.status = status
  }, [status])

  useReveal(reduced)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setPinned(!e.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !phone || !service) return
    setBooked(true)
  }

  function requestFor(id) {
    setService(id)
    document.getElementById('book')?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
    window.setTimeout(() => serviceRef.current?.focus(), reduced ? 0 : 550)
  }

  let statusDetail
  if (openForWalkIns) {
    statusDetail = `Last patient accepted at ${formatClock(registrationCloseMin)} today.`
  } else if (status === 'registration-closed') {
    statusDetail = `Doors stay open until ${formatClock(closeMin)}, but no new walk-ins are being registered.`
  } else {
    statusDetail = nextOpenMin
      ? `We open again ${nextDay} at ${formatClock(nextOpenMin)}.`
      : 'Closed all day.'
  }

  return (
    <>
      <a className="skip" href="#today">Skip to today&rsquo;s status</a>

      {/* Placed at the very top of the page, sized so it cannot be missed, and
          deliberately not a saturated red panic band. */}
      <aside className="emergency" role="note" aria-label="Emergency">
        <div className="wrap emergency__inner">
          <TriangleAlert className="emergency__icon" aria-hidden="true" strokeWidth={2.25} />
          <p className="emergency__text">
            If you have <strong>chest pain, trouble breathing, or severe bleeding</strong>, call 911
            now. Do not wait for the clinic.
          </p>
          <a className="emergency__call" href="tel:911">
            Call 911
          </a>
        </div>
      </aside>

      <header className="masthead">
        <div className="wrap masthead__inner">
          <div className="masthead__id">
            <p className="masthead__name">Eastside Community&nbsp;Health</p>
            <p className="masthead__sub">Free walk-in clinic &middot; Springfield County</p>
          </div>
          <a className="phone phone--lg" href="tel:+15550142900">
            <Phone aria-hidden="true" strokeWidth={2.25} />
            <span>
              <em>Front desk</em>
              (555) 014-2900
            </span>
          </a>
        </div>
      </header>

      <main id="main">
        {/* 1 — The question everyone arrives with, answered before anything else. */}
        <section className={`today today--${status}`} id="today" ref={heroRef}>
          <div className="wrap">
            <p className="today__kicker">
              Free healthcare for everyone in the Eastside, no questions asked.
            </p>

            <div className="today__head">
              <h1 className="today__status">
                <span className={`dot dot--${status}`} aria-hidden="true" />
                {STATUS_TEXT[status]}
              </h1>
              <p className="today__detail">{statusDetail}</p>
            </div>

            <div className="today__meter">
              {openForWalkIns ? (
                <p className="countdown">
                  <span className="countdown__num">{formatDuration(minutesLeft)}</span>
                  <span className="countdown__unit">left to register today</span>
                </p>
              ) : (
                <p className="countdown countdown--shut">
                  <span className="countdown__num">
                    {status === 'registration-closed' ? 'Desk closed' : 'Come back'}
                  </span>
                  <span className="countdown__unit">
                    {status === 'registration-closed'
                      ? 'for new walk-in registrations'
                      : `${nextDay ?? 'soon'}${nextOpenMin ? ` from ${formatClock(nextOpenMin)}` : ''}`}
                  </span>
                </p>
              )}
              <a className="btn btn--primary" href="tel:+15550142900">
                <Phone aria-hidden="true" strokeWidth={2.25} />
                Call the front desk
              </a>
              <a className="btn btn--ghost" href="#visit">
                <MapPin aria-hidden="true" strokeWidth={2.25} />
                1140 East Barrow Street
              </a>
            </div>

            <ul className="assure assure--inline">
              {ASSURANCES.map((a) => (
                <li key={a.head}>
                  <Check aria-hidden="true" strokeWidth={3} />
                  {a.head}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 2 — The peak: the whole week on one axis, with now swept across it. */}
        <section className="week" aria-labelledby="week-h" data-reveal>
          <div className="wrap">
            <div className="section-head">
              <h2 id="week-h" className="section-head__title">
                When you can walk in
              </h2>
              <p className="section-head__note">
                Registration closes {REGISTRATION_LEAD} minutes before we do — the hatched tail on
                every bar. If you arrive late and it is urgent, come in anyway and speak to the
                front desk.
              </p>
            </div>

            <WalkInClock clock={clock} reducedMotion={reduced} />

            <ul className="visually-hidden">
              <li>Monday: 8:00 to 20:00</li>
              <li>Tuesday: 8:00 to 20:00</li>
              <li>Wednesday: 8:00 to 20:00</li>
              <li>Thursday: 8:00 to 20:00</li>
              <li>Friday: 8:00 to 17:00</li>
              <li>Saturday: 9:00 to 14:00</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </section>

        {/* 3 — What it costs and what we will never ask. */}
        <section className="promise" aria-labelledby="promise-h" data-reveal>
          <div className="wrap">
            <h2 id="promise-h" className="promise__h">
              You will not be asked to pay, and you will not be asked who you are.
            </h2>
            <ul className="assure assure--block">
              {ASSURANCES.map((a) => (
                <li key={a.head}>
                  <ShieldMark />
                  <b>{a.head}</b>
                  <span>{a.note}</span>
                </li>
              ))}
            </ul>
            <p className="promise__body">
              You do not need insurance. You do not need a permanent address. We do not ask about
              your immigration status, and we do not share patient records with any other agency.
            </p>
          </div>
        </section>

        {/* 4 — The six services, each carrying its live walk-in state. */}
        <section className="services" aria-labelledby="services-h" data-reveal>
          <div className="wrap">
            <div className="section-head">
              <h2 id="services-h" className="section-head__title">
                What we can help with
              </h2>
              <p className="section-head__note">
                Six services, every one of them free. The tag on each row is live: it changes as the
                clinic opens and closes.
              </p>
            </div>

            <ol className="services__list">
              {SERVICES.map((s, i) => {
                const live = s.walkIn && openForWalkIns
                return (
                  <li className="svc" key={s.id} data-service={s.id}>
                    <span className="svc__n" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <s.Icon className="svc__icon" aria-hidden="true" strokeWidth={1.6} />
                    <div className="svc__body">
                      <h3 className="svc__name">{s.name}</h3>
                      <p className="svc__elig">{s.eligibility}</p>
                    </div>
                    <p className="svc__cost">{s.cost}</p>
                    <div className="svc__state">
                      {s.walkIn ? (
                        <span className={`tag ${live ? 'tag--live' : 'tag--rest'}`}>
                          <span className={`dot dot--${live ? 'open' : 'closed'}`} aria-hidden="true" />
                          {live ? 'Walk in now' : 'Walk in when open'}
                        </span>
                      ) : (
                        <span className="tag tag--book">Appointment</span>
                      )}
                      {(s.booking || !s.walkIn) && (
                        <button
                          type="button"
                          className="linkish"
                          onClick={() => requestFor(s.id)}
                        >
                          Request a slot
                          <ArrowRight aria-hidden="true" strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        {/* 5 — Getting to the door. */}
        <section className="visit" aria-labelledby="visit-h" id="visit" data-reveal>
          <div className="wrap visit__inner">
            <div className="visit__where">
              <h2 id="visit-h" className="section-head__title">
                Getting here
              </h2>
              <p className="visit__address">
                1140 East Barrow Street
                <span>Eastside, Springfield 62704</span>
              </p>
              <a className="phone" href="tel:+15550142900">
                <Phone aria-hidden="true" strokeWidth={2.25} />
                <span>
                  <em>Front desk</em>
                  (555) 014-2900
                </span>
              </a>
            </div>
            <ul className="visit__list">
              {TRANSIT.map((t) => (
                <li key={t.text}>
                  <t.Icon aria-hidden="true" strokeWidth={1.6} />
                  <span>{t.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6 — Being understood. */}
        <section className="langs" aria-labelledby="langs-h" data-reveal>
          <div className="wrap">
            <div className="section-head">
              <h2 id="langs-h" className="section-head__title">
                Staff or on-site interpreters, all opening hours
              </h2>
            </div>
            <ul className="langs__list">
              {LANGUAGES.map((l) => (
                <li key={l.name}>
                  <b lang={l.lang} dir={l.dir}>
                    {l.native}
                  </b>
                  <span>{l.name}</span>
                </li>
              ))}
            </ul>
            <p className="langs__more">
              For any other language, call our free interpreter line at{' '}
              <a href="tel:+15550142911">(555) 014-2911</a> and we will connect a translator before
              your visit.
            </p>
          </div>
        </section>

        {/* 7 — The one thing to fill in, only for what needs it. */}
        <section className="book" aria-labelledby="book-h" id="book" data-reveal>
          <div className="wrap book__inner">
            <div className="book__intro">
              <h2 id="book-h" className="section-head__title">
                Only if you need a slot
              </h2>
              <p>
                Walk-ins are always welcome. Booking is only needed for dental and some counselling
                slots.
              </p>
            </div>

            {booked ? (
              <p className="book__done" role="status">
                <Check aria-hidden="true" strokeWidth={3} />
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
                    ref={serviceRef}
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
                    autoComplete="name"
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
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn--primary btn--wide">
                  Request appointment
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot__inner">
          <p className="foot__org">
            Eastside Community Health. A free walk-in clinic funded by Springfield County.
            <span>&copy; 2026.</span>
          </p>
          <ul className="foot__links">
            <li><a href="#today">Patient privacy</a></li>
            <li><a href="#today">Your rights</a></li>
            <li><a href="#today">Volunteer</a></li>
          </ul>
        </div>
      </footer>

      {/* The clock follows the reader down the page. */}
      <div className={`rail${pinned ? ' is-pinned' : ''}`}>
        <div className="wrap rail__inner">
        <p className={`rail__status rail__status--${status}`}>
          <span className={`dot dot--${status}`} aria-hidden="true" />
          <b>{openForWalkIns ? 'Open for walk-ins' : STATUS_TEXT[status]}</b>
          <em>
            {openForWalkIns
              ? `${formatDuration(minutesLeft)} left to register`
              : statusDetail}
          </em>
        </p>
        <a className="btn btn--primary btn--rail" href="tel:+15550142900">
          <Phone aria-hidden="true" strokeWidth={2.25} />
          <span>Call (555) 014-2900</span>
        </a>
        </div>
      </div>
    </>
  )
}

function ShieldMark() {
  return (
    <svg className="assure__mark" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.6 20 6v6.1c0 4.9-3.3 8.4-8 9.3-4.7-.9-8-4.4-8-9.3V6l8-3.4Z" />
      <path className="assure__tick" d="m8.2 12.1 2.7 2.7 5-5.4" />
    </svg>
  )
}
