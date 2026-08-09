// Clinic facts and the time logic the whole page answers against.
// Every section on the site is written relative to "now": the front desk clock
// is the continuity device, so it lives here rather than in a component.

export const CLINIC = {
  name: 'Eastside Community Health',
  phone: '(555) 014-2900',
  phoneHref: 'tel:+15550142900',
  interpreterPhone: '(555) 014-2911',
  interpreterHref: 'tel:+15550142911',
  addressLines: ['1140 East Barrow Street', 'Eastside, Springfield 62704'],
}

// index matches Date.getDay(): 0 = Sunday
export const HOURS = [
  { day: 'Sunday', open: null, close: null },
  { day: 'Monday', open: '8:00', close: '20:00' },
  { day: 'Tuesday', open: '8:00', close: '20:00' },
  { day: 'Wednesday', open: '8:00', close: '20:00' },
  { day: 'Thursday', open: '8:00', close: '20:00' },
  { day: 'Friday', open: '8:00', close: '17:00' },
  { day: 'Saturday', open: '9:00', close: '14:00' },
]

// Monday-first order for reading the table.
export const WEEK = [1, 2, 3, 4, 5, 6, 0].map((i) => ({ ...HOURS[i], index: i }))

export const REGISTRATION_CLOSES_MINUTES = 30

export const SERVICES = [
  {
    id: 'primary',
    name: 'General check-ups and illness',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    access: 'walkin',
  },
  {
    id: 'screening',
    name: 'Blood pressure, diabetes, and vision screening',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    access: 'walkin',
  },
  {
    id: 'pediatric',
    name: 'Children and infant care',
    eligibility: 'Under 18 with any adult',
    cost: 'Free, including vaccinations',
    access: 'walkin',
  },
  {
    id: 'mental',
    name: 'Counselling and mental health',
    eligibility: 'Anyone 14+, walk-in or booked',
    cost: 'Free, first session same day when possible',
    access: 'walkin',
  },
  {
    id: 'prescriptions',
    name: 'Prescriptions and refills',
    eligibility: 'Existing and new patients',
    cost: 'Free to issue, medication costs vary',
    access: 'walkin',
  },
  {
    id: 'dental',
    name: 'Dental cleaning and extractions',
    eligibility: 'Adults 18+, appointment needed',
    cost: 'Free, limited slots each week',
    access: 'booked',
  },
]

export const LANGUAGES = [
  'English',
  'Spanish',
  'Vietnamese',
  'Somali',
  'Haitian Creole',
  'Mandarin',
  'Arabic',
]

export const ASSURANCES = [
  {
    id: 'insurance',
    lead: 'No insurance required',
    detail: 'Nothing to pay, and no bill afterwards.',
  },
  {
    id: 'immigration',
    lead: 'No immigration status questions',
    detail: 'We never ask, and we never share records with any other agency.',
  },
  {
    id: 'address',
    lead: 'No permanent address needed',
    detail: 'You can register with no fixed address and no ID.',
  },
]

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function formatMinutes(total) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

// The window the hours bars are drawn against: earliest open to latest close,
// padded by an hour on each side so a bar is never flush to the edge.
export const DAY_WINDOW = { start: 7 * 60, end: 21 * 60 }

export function barPosition(day) {
  if (!day.open) return null
  const span = DAY_WINDOW.end - DAY_WINDOW.start
  const from = toMinutes(day.open) - DAY_WINDOW.start
  const to = toMinutes(day.close) - DAY_WINDOW.start
  return {
    left: `${(from / span) * 100}%`,
    width: `${((to - from) / span) * 100}%`,
  }
}

export function nowPosition(minutes) {
  const span = DAY_WINDOW.end - DAY_WINDOW.start
  const offset = ((minutes - DAY_WINDOW.start) / span) * 100
  if (offset < 0 || offset > 100) return null
  return `${offset}%`
}

function nextOpenDay(fromIndex) {
  for (let step = 1; step <= 7; step += 1) {
    const day = HOURS[(fromIndex + step) % 7]
    if (day.open) return { day, step }
  }
  return null
}

/**
 * The single answer the site exists to give: can I walk in right now?
 * Returns a state used by the hero, the hours table, and the services list.
 */
export function getWalkInStatus(date = new Date()) {
  const index = date.getDay()
  const today = HOURS[index]
  const minutes = date.getHours() * 60 + date.getMinutes()
  const upcoming = nextOpenDay(index)
  const nextLabel = upcoming
    ? `${upcoming.step === 1 ? 'tomorrow' : upcoming.day.day} at ${upcoming.day.open}`
    : ''

  if (today.open) {
    const open = toMinutes(today.open)
    const close = toMinutes(today.close)
    const lastWalkIn = close - REGISTRATION_CLOSES_MINUTES

    if (minutes < open) {
      return {
        state: 'before',
        headline: 'Not open yet',
        answer: `We open today at ${today.open}.`,
        detail: `Walk in any time between ${today.open} and ${formatMinutes(lastWalkIn)} and you will be seen today.`,
        today,
        todayIndex: index,
        minutes,
        lastWalkIn,
      }
    }
    if (minutes < lastWalkIn) {
      return {
        state: 'open',
        headline: 'Yes — walk in now',
        answer: `Open until ${today.close}.`,
        detail: `The last patient is accepted at ${formatMinutes(lastWalkIn)} today. No appointment, no insurance, no ID.`,
        today,
        todayIndex: index,
        minutes,
        lastWalkIn,
      }
    }
    if (minutes < close) {
      return {
        state: 'closing',
        headline: 'Walk-in registration has closed',
        answer: `The doors are open until ${today.close}, but new walk-ins are no longer being registered.`,
        detail: `If it is urgent, come in anyway and speak to the front desk. Otherwise we reopen ${nextLabel}.`,
        today,
        todayIndex: index,
        minutes,
        lastWalkIn,
      }
    }
  }

  return {
    state: 'closed',
    headline: 'Closed right now',
    answer: upcoming ? `We reopen ${nextLabel}.` : 'We are closed.',
    detail:
      'If you have a medical emergency, call 911. For advice in any language, our interpreter line answers around the clock.',
    today,
    todayIndex: index,
    minutes,
    lastWalkIn: today.open ? toMinutes(today.close) - REGISTRATION_CLOSES_MINUTES : null,
  }
}
