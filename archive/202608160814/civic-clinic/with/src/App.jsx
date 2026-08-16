import { useEffect, useMemo, useRef, useState } from 'react'
import waitingRoom from './assets/waiting-room.jpg'

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

// The name each language calls itself, so a patient can find their own line
// without reading English first. Keys are the required English labels.
const ENDONYMS = {
  English: { native: 'English', dir: 'ltr' },
  Spanish: { native: 'Español', dir: 'ltr' },
  Vietnamese: { native: 'Tiếng Việt', dir: 'ltr' },
  Somali: { native: 'Soomaali', dir: 'ltr' },
  'Haitian Creole': { native: 'Kreyòl Ayisyen', dir: 'ltr' },
  Mandarin: { native: '中文', dir: 'ltr' },
  Arabic: { native: 'العربية', dir: 'rtl' },
}

const TRANSIT = [
  'Bus 14 and 27 stop directly outside the door on East Barrow.',
  'Green line to Barrow Street station, then a four-minute walk east.',
  'Free parking behind the building, entrance from Alder Lane.',
  'Step-free entrance and accessible restrooms on the ground floor.',
]

const TRANSIT_MARKS = ['bus', 'rail', 'car', 'access']

/* ---------------------------------------------------------------- time --- */

// The whole page is drawn against one 06:00–22:00 axis so today's bar and the
// seven weekday bars can be read against each other without a legend.
const AXIS_START = 6 * 60
const AXIS_END = 22 * 60
const AXIS_SPAN = AXIS_END - AXIS_START
const REGISTRATION_LEAD = 30

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const toClock = (mins) => `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`
const axisPct = (mins) => ((Math.min(Math.max(mins, AXIS_START), AXIS_END) - AXIS_START) / AXIS_SPAN) * 100

// Monday-first index, matching HOURS.
const rowForDate = (d) => (d.getDay() + 6) % 7

function readClock() {
  // ?now=2026-08-17T10:30 renders the page at that moment. Used to inspect the
  // open and closed states during design review; absent, the page is live.
  if (typeof window !== 'undefined') {
    const override = new URLSearchParams(window.location.search).get('now')
    if (override) {
      const parsed = new Date(override)
      if (!Number.isNaN(parsed.getTime())) return parsed
    }
  }
  return new Date()
}

function describeDay(index) {
  const row = HOURS[index]
  if (!row.open) return { ...row, index, openMin: null, closeMin: null, lastMin: null }
  const openMin = toMinutes(row.open)
  const closeMin = toMinutes(row.close)
  return { ...row, index, openMin, closeMin, lastMin: closeMin - REGISTRATION_LEAD }
}

function spell(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

function readStatus(now) {
  const todayIndex = rowForDate(now)
  const today = describeDay(todayIndex)
  const minutes = now.getHours() * 60 + now.getMinutes()

  let nextIndex = null
  for (let step = 0; step <= 7; step += 1) {
    const i = (todayIndex + step) % 7
    const candidate = describeDay(i)
    if (!candidate.openMin) continue
    if (step === 0 && minutes >= candidate.lastMin) continue
    nextIndex = i
    break
  }
  const next = nextIndex === null ? null : describeDay(nextIndex)
  const nextIsToday = nextIndex === todayIndex
  const dayDelta = nextIndex === null ? 0 : (nextIndex - todayIndex + 7) % 7
  const untilOpen = next ? dayDelta * 1440 + next.openMin - minutes : null

  if (today.openMin && minutes >= today.openMin && minutes < today.lastMin) {
    return {
      state: 'open',
      today,
      minutes,
      headline: 'Open now.',
      headlineTail: 'Walk in.',
      // Required status line, with the cut-off derived from today's closing time.
      line: `Open now for walk-ins. Last patient accepted at ${toClock(today.lastMin)} today.`,
      pill: 'Open for walk-ins',
      remainingLabel: 'Left to register today',
      remaining: spell(today.lastMin - minutes),
      next,
      nextIsToday,
    }
  }

  if (today.openMin && minutes >= today.lastMin && minutes < today.closeMin) {
    return {
      state: 'closing',
      today,
      minutes,
      headline: 'Registration closed.',
      headlineTail: 'Still open until ' + today.close + '.',
      line: `Walk-in registration closed at ${toClock(today.lastMin)} today. If it is urgent, come in anyway and speak to the front desk.`,
      pill: 'Registration closed',
      remainingLabel: 'Doors close in',
      remaining: spell(today.closeMin - minutes),
      next,
      nextIsToday,
    }
  }

  return {
    state: 'closed',
    today,
    minutes,
    headline: 'Closed right now.',
    headlineTail: next ? `Open ${nextIsToday ? 'again today' : next.day} at ${next.open}.` : '',
    line: next
      ? `We are closed at the moment. The next walk-in session is ${nextIsToday ? 'later today' : next.day}, ${next.open} to ${next.close}, with the last patient accepted at ${toClock(next.lastMin)}.`
      : 'We are closed at the moment.',
    pill: 'Closed',
    remainingLabel: 'Doors open in',
    remaining: untilOpen === null ? null : spell(untilOpen),
    next,
    nextIsToday,
  }
}

/* ------------------------------------------------------------- reveals --- */

function useReveal() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll('[data-reveal]'))
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-in'))
      return undefined
    }
    // Measured against the top of the viewport so a region finishes arriving
    // while the reader is still looking at it.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-in')
          io.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    )
    targets.forEach((el) => {
      // Anything already on screen at load must not animate in.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) el.classList.add('is-in')
      else io.observe(el)
    })
    // Nothing on this page may ever be stuck invisible waiting for a scroll
    // that does not come: this is a clinic, not a slideshow.
    const failsafe = window.setTimeout(() => targets.forEach((el) => el.classList.add('is-in')), 4000)
    return () => {
      window.clearTimeout(failsafe)
      io.disconnect()
    }
  }, [])
}

/* ------------------------------------------------------------- marks ---- */

function TransitMark({ kind }) {
  const common = { width: 26, height: 26, viewBox: '0 0 26 26', fill: 'none', 'aria-hidden': true, focusable: false }
  if (kind === 'bus') {
    return (
      <svg {...common} className="mark">
        <rect x="4.5" y="4.5" width="17" height="13" rx="2.5" />
        <path d="M4.5 10.5h17M9 17.5v3M17 17.5v3" />
        <circle cx="9" cy="14" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="17" cy="14" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (kind === 'rail') {
    return (
      <svg {...common} className="mark">
        <rect x="6.5" y="3.5" width="13" height="14" rx="4" />
        <path d="M6.5 11h13M4 22l3.5-4.5M22 22l-3.5-4.5" />
        <circle cx="10" cy="14.3" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="16" cy="14.3" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (kind === 'car') {
    return (
      <svg {...common} className="mark">
        <path d="M4.5 15.5v-2l2.2-5a2 2 0 0 1 1.9-1.3h8.8a2 2 0 0 1 1.9 1.3l2.2 5v2" />
        <rect x="4.5" y="15.5" width="17" height="4" rx="1.4" />
        <path d="M7 19.5v1.8M19 19.5v1.8M6.8 8.6h12.4" />
      </svg>
    )
  }
  return (
    <svg {...common} className="mark">
      <circle cx="13" cy="5.6" r="2.1" />
      <path d="M7.5 10h11M13 10v5.5M13 15.5l-3.5 6M13 15.5l3.5 6" />
    </svg>
  )
}

/* --------------------------------------------------------- day ribbons --- */

function DayRibbon({ day, nowMinutes, isToday, animate }) {
  if (!day.openMin) {
    return (
      <div className="ribbon ribbon--closed">
        <span className="ribbon__none">Closed all day</span>
      </div>
    )
  }
  const left = axisPct(day.openMin)
  const right = axisPct(day.closeMin)
  const lastLeft = axisPct(day.lastMin)
  return (
    <div className="ribbon">
      <div className="ribbon__window" style={{ left: `${left}%`, width: `${right - left}%` }}>
        <span className="ribbon__reg" style={{ left: `${((lastLeft - left) / (right - left)) * 100}%` }} />
      </div>
      {isToday && nowMinutes >= AXIS_START && nowMinutes <= AXIS_END && (
        <span
          className={`ribbon__now${animate ? ' is-armed' : ''}`}
          style={{ '--from': `${left}%`, '--x': `${axisPct(nowMinutes)}%` }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

function TodayClock({ status, animate }) {
  const { today, minutes } = status
  const hasWindow = Boolean(today.openMin)
  const shown = hasWindow ? today : status.next
  if (!shown || !shown.openMin) return null

  const left = axisPct(shown.openMin)
  const right = axisPct(shown.closeMin)
  const lastLeft = axisPct(shown.lastMin)
  const nowPct = axisPct(minutes)
  const nowOnAxis = hasWindow && minutes >= AXIS_START && minutes <= AXIS_END

  // The solid block is the time you can still turn up in — not the time
  // already gone. On a closed day the whole of the next session is solid.
  const openFrom = hasWindow ? Math.min(Math.max(nowPct, left), lastLeft) : left
  const openTo = lastLeft
  const nowEdge = nowPct < 9 ? ' clock__now--start' : nowPct > 91 ? ' clock__now--end' : ''

  return (
    <figure className={`clock clock--${status.state}`}>
      <figcaption className="clock__caption">
        <span className="clock__day">{shown.day}</span>
        <span className="clock__range">
          {hasWindow ? 'Doors ' : 'Next session '}
          <b>
            {shown.open}–{shown.close}
          </b>
        </span>
        <span className="clock__reg">
          Registration closes <b>{toClock(shown.lastMin)}</b>
        </span>
        {status.remaining && (
          <span className="clock__left">
            {status.remainingLabel} <b>{status.remaining}</b>
          </span>
        )}
      </figcaption>

      <div className="clock__track">
        <div className="clock__window" style={{ left: `${left}%`, width: `${right - left}%` }}>
          <span
            className="clock__regzone"
            style={{ left: `${((lastLeft - left) / (right - left)) * 100}%` }}
          />
        </div>
        <div
          className={`clock__live${animate ? ' is-armed' : ''}`}
          style={{ left: `${openFrom}%`, '--w': `${Math.max(openTo - openFrom, 0)}%` }}
        />
        {nowOnAxis && (
          <div
            className={`clock__now${animate ? ' is-armed' : ''}${nowEdge}`}
            style={{ '--from': `${left}%`, '--x': `${nowPct}%` }}
          >
            <span className="clock__nowlabel">now {toClock(minutes)}</span>
          </div>
        )}
      </div>

      <div className="clock__axis" aria-hidden="true">
        {[6, 8, 10, 12, 14, 16, 18, 20, 22].map((h) => (
          <span
            key={h}
            className={h % 4 === 0 ? 'clock__tick clock__tick--major' : 'clock__tick'}
            style={{ left: `${axisPct(h * 60)}%` }}
          >
            {h % 4 === 0 ? `${h}:00` : ''}
          </span>
        ))}
      </div>
    </figure>
  )
}

/* ----------------------------------------------------------------- app --- */

export default function App() {
  const [service, setService] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [booked, setBooked] = useState(false)
  const [now, setNow] = useState(readClock)
  const [animate, setAnimate] = useState(false)
  const [flash, setFlash] = useState(false)
  const selectRef = useRef(null)

  useReveal()

  useEffect(() => {
    const id = window.setInterval(() => setNow(readClock()), 30000)
    const raf = window.requestAnimationFrame(() => setAnimate(true))
    return () => {
      window.clearInterval(id)
      window.cancelAnimationFrame(raf)
    }
  }, [])

  const status = useMemo(() => readStatus(now), [now])
  const todayIndex = rowForDate(now)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !phone || !service) return
    setBooked(true)
  }

  // A service row hands its own id to the form and points the reader at it, so
  // the list and the request are one motion rather than two screens.
  function requestService(id) {
    setService(id)
    setFlash(false)
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => {
      setFlash(true)
      selectRef.current?.focus({ preventScroll: true })
    }, 380)
    window.setTimeout(() => setFlash(false), 2000)
  }

  return (
    <>
      <a className="skip" href="#today">
        Skip to today’s opening status
      </a>

      <header className="masthead">
        <div className="shell masthead__inner">
          <a className="wordmark" href="#today">
            <span className="wordmark__name">Eastside Community Health</span>
            <span className="wordmark__kind">Free walk-in clinic · Springfield County</span>
          </a>
          <nav className="masthead__nav" aria-label="Sections of this page">
            <a href="#services">Services</a>
            <a href="#hours">Hours</a>
            <a href="#find">Getting here</a>
            <a href="#languages">Languages</a>
          </nav>
          <div className="masthead__right">
            <span className={`pill pill--${status.state}`}>
              <span className="pill__dot" aria-hidden="true" />
              {status.pill}
            </span>
            <a className="btn btn--ink" href="tel:+15550142900">
              Call (555) 014-2900
            </a>
          </div>
        </div>
      </header>

      <aside className="emergency" role="note">
        <div className="shell emergency__inner">
          <span className="emergency__flag" aria-hidden="true">
            Emergency
          </span>
          <p className="emergency__text">
            If you have chest pain, trouble breathing, or severe bleeding, call 911 now. Do not wait
            for the clinic.
          </p>
          <a className="btn btn--siren" href="tel:911">
            Call 911
          </a>
        </div>
      </aside>

      <main>
        {/* 1 — the answer to the question everyone arrives with */}
        <section className={`today today--${status.state}`} id="today">
          <div className="shell today__grid">
            <div className="today__lede">
              <p className="eyebrow">Free healthcare for everyone in the Eastside, no questions asked.</p>
              <h1 className="today__headline">
                {status.headline}
                <em>{status.headlineTail}</em>
              </h1>
              <p className="today__line">{status.line}</p>
              <div className="today__actions">
                <a className="btn btn--green" href="#find">
                  1140 East Barrow Street →
                </a>
                <a className="btn btn--quiet" href="#book">
                  Book dental or counselling
                </a>
              </div>
            </div>

            <ul className="assure">
              <li>
                <span className="assure__no">No</span>
                <span className="assure__what">insurance required</span>
              </li>
              <li>
                <span className="assure__no">No</span>
                <span className="assure__what">immigration status questions</span>
              </li>
              <li>
                <span className="assure__no">No</span>
                <span className="assure__what">cost for any visit</span>
              </li>
            </ul>

            <div className="today__clock">
              <TodayClock status={status} animate={animate} />
            </div>
          </div>
        </section>

        {/* 2 — why it is safe to walk through the door */}
        <section className="promise" data-reveal>
          <div className="shell promise__inner">
            <p className="promise__text">
              You do not need insurance. You do not need a permanent address. We do not ask about
              your immigration status, and we do not share patient records with any other agency.
            </p>
          </div>
        </section>

        {/* 3 — what we can treat, and what each thing costs */}
        <section className="services" id="services" data-reveal>
          <div className="shell">
            <header className="head">
              <h2>What we can help with</h2>
              <p className="head__note">Six services. Every one of them free.</p>
            </header>

            <ol className="svc">
              {SERVICES.map((s, i) => {
                // "no appointment needed" must not read as "appointment needed".
                const bookable =
                  !/no appointment needed/.test(s.eligibility) &&
                  /appointment needed|booked/.test(s.eligibility)
                return (
                  <li key={s.id} data-service={s.id} className={bookable ? 'svc__row is-bookable' : 'svc__row'}>
                    <span className="svc__num">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="svc__name">{s.name}</h3>
                    <p className="svc__elig">{s.eligibility}</p>
                    <p className="svc__cost">{s.cost}</p>
                    <div className="svc__act">
                      {bookable ? (
                        <button type="button" className="btn btn--outline" onClick={() => requestService(s.id)}>
                          Request a time
                        </button>
                      ) : (
                        <span className="svc__walk">Just walk in</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        {/* 4 — the whole week against the same axis as today */}
        <section className="week" id="hours" data-reveal>
          <div className="shell week__inner">
            <header className="head">
              <h2>When we’re open</h2>
              <p className="head__note">
                Every day of the week, drawn against the same clock as today. The shaded tail of
                each bar is the last 30 minutes, when registration is already closed.
              </p>
            </header>

            <div className="week__axis" aria-hidden="true">
              {[8, 12, 16, 20].map((h) => (
                <span key={h} style={{ left: `${axisPct(h * 60)}%` }}>{`${h}:00`}</span>
              ))}
            </div>

            <ul className="week__list">
              {HOURS.map((h, i) => {
                const day = describeDay(i)
                const isToday = i === todayIndex
                return (
                  <li
                    key={h.day}
                    data-day={h.day.toLowerCase()}
                    className={isToday ? 'week__row is-today' : 'week__row'}
                  >
                    <span className="week__day">
                      {h.day}
                      {isToday && <span className="week__badge">today</span>}
                    </span>
                    <DayRibbon day={day} nowMinutes={status.minutes} isToday={isToday} animate={animate} />
                    <span className="week__time">
                      {h.open ? `${h.open} – ${h.close}` : 'Closed'}
                    </span>
                  </li>
                )
              })}
            </ul>

            <p className="week__note">
              Walk-in registration closes 30 minutes before we do. If you arrive late and it is
              urgent, come in anyway and speak to the front desk.
            </p>
          </div>
        </section>

        {/* 5 — what the room you are walking into looks like */}
        <section className="arrive" data-reveal>
          <figure className="arrive__figure">
            <img
              src={waitingRoom}
              width="1800"
              height="1201"
              loading="lazy"
              decoding="async"
              alt="The waiting area of a community health centre: rows of red, green and blue chairs facing a reception hatch."
            />
            <figcaption className="arrive__caption">
              <span className="arrive__label">When you arrive</span>
              <p>
                Take a seat and give your first name at the desk. Walk-ins are always welcome.
                Booking is only needed for dental and some counselling slots.
              </p>
            </figcaption>
          </figure>
        </section>

        {/* 6 — address, and the four ways to reach it */}
        <section className="find" id="find" data-reveal>
          <div className="shell find__grid">
            <div className="find__where">
              <h2 className="head__h2">Getting here</h2>
              <p className="find__address">
                1140 East Barrow Street
                <span>Eastside, Springfield 62704</span>
              </p>
              <a className="btn btn--green" href="tel:+15550142900">
                Call (555) 014-2900
              </a>
            </div>
            <ul className="find__transit">
              {TRANSIT.map((t, i) => (
                <li key={t}>
                  <span className="find__mark">
                    <TransitMark kind={TRANSIT_MARKS[i]} />
                  </span>
                  <span className="find__copy">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 7 — find your own language on the page */}
        <section className="langs" id="languages" data-reveal>
          <div className="shell">
            <header className="head">
              <h2>Languages we speak</h2>
              <p className="head__note">
                Staff or on-site interpreters are available in these languages during all opening
                hours:
              </p>
            </header>
            <ul className="langs__list">
              {LANGUAGES.map((l) => {
                const e = ENDONYMS[l]
                return (
                  <li key={l} className="langs__chip">
                    <span className="langs__native" dir={e.dir} lang={l === 'Mandarin' ? 'zh' : undefined}>
                      {e.native}
                    </span>
                    <span className="langs__en">{l}</span>
                  </li>
                )
              })}
            </ul>
            <p className="langs__line">
              For any other language, call our free interpreter line at{' '}
              <a href="tel:+15550142911">(555) 014-2911</a> and we will connect a translator before
              your visit.
            </p>
          </div>
        </section>

        {/* 8 — the only thing on this page that needs a form */}
        <section className="book" id="book" data-reveal>
          <div className="shell book__grid">
            <div className="book__lede">
              <h2 className="head__h2">Book a time</h2>
              <p>
                Walk-ins are always welcome. Booking is only needed for dental and some counselling
                slots.
              </p>
            </div>

            {booked ? (
              <div className="book__done" role="status">
                <span className="book__check" aria-hidden="true">
                  ✓
                </span>
                <p>
                  Thank you, {name}. We will call {phone} within one working day to confirm your
                  time.
                </p>
              </div>
            ) : (
              <form className="book__form" onSubmit={handleSubmit}>
                <div className={flash ? 'field field--wide is-flash' : 'field field--wide'}>
                  <label htmlFor="svc">Which service?</label>
                  <select
                    id="svc"
                    name="service"
                    required
                    ref={selectRef}
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
                    autoComplete="name"
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
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn--green btn--submit">
                  Request appointment
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="shell foot__inner">
          <p className="foot__who">
            Eastside Community Health. A free walk-in clinic funded by Springfield County. © 2026.
          </p>
          <nav className="foot__links" aria-label="More information">
            <a href="#today">Patient privacy</a>
            <a href="#today">Your rights</a>
            <a href="#today">Volunteer</a>
          </nav>
          <p className="foot__credit">
            Waiting-area photograph: USDA Rural Development, public domain, via{' '}
            <a href="https://commons.wikimedia.org/wiki/File:RD_CFDL-Lytle_Community_Health_Center_-_Community_Facility_Direct_Loan_(20171205-RD-LSC-0238).jpg">
              Wikimedia Commons
            </a>
            .
          </p>
        </div>
      </footer>
    </>
  )
}
