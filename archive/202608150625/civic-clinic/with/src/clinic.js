// Clinic opening data and the live "can I be seen today" logic.
// Times are minutes from midnight so the page can compare them to the clock.

export const HOURS = [
  { day: 'Sunday', short: 'Sun', open: null, close: null },
  { day: 'Monday', short: 'Mon', open: 8 * 60, close: 20 * 60 },
  { day: 'Tuesday', short: 'Tue', open: 8 * 60, close: 20 * 60 },
  { day: 'Wednesday', short: 'Wed', open: 8 * 60, close: 20 * 60 },
  { day: 'Thursday', short: 'Thu', open: 8 * 60, close: 20 * 60 },
  { day: 'Friday', short: 'Fri', open: 8 * 60, close: 17 * 60 },
  { day: 'Saturday', short: 'Sat', open: 9 * 60, close: 14 * 60 },
]

// Walk-in registration closes half an hour before the doors do.
export const CUTOFF_BEFORE_CLOSE = 30

// The Today Bar draws this window, so the open band always has room either side.
export const AXIS_START = 6 * 60
export const AXIS_END = 21 * 60

export const SERVICES = [
  {
    id: 'primary',
    name: 'General check-ups and illness',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    walkIn: true,
  },
  {
    id: 'screening',
    name: 'Blood pressure, diabetes, and vision screening',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    walkIn: true,
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
    id: 'dental',
    name: 'Dental cleaning and extractions',
    eligibility: 'Adults 18+, appointment needed',
    cost: 'Free, limited slots each week',
    walkIn: false,
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

export function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return h === 1 ? '1 hour' : `${h} hours`
  return `${h}h ${m}m`
}

export function cutoffOf(entry) {
  return entry.open === null ? null : entry.close - CUTOFF_BEFORE_CLOSE
}

function nextOpenDay(fromIndex) {
  for (let step = 1; step <= 7; step += 1) {
    const entry = HOURS[(fromIndex + step) % 7]
    if (entry.open !== null) return { entry, step }
  }
  return null
}

/**
 * The one piece of state the whole page reads from: what is true right now.
 * Every degenerate case of the day has a named phase, so nothing on the route
 * has to guess what to say.
 */
export function clinicStatus(now = new Date()) {
  const index = now.getDay()
  const today = HOURS[index]
  const minutes = now.getHours() * 60 + now.getMinutes()
  const cutoff = cutoffOf(today)
  const next = nextOpenDay(index)
  const nextLabel = next
    ? `${next.step === 1 ? 'tomorrow' : next.entry.day} at ${formatTime(next.entry.open)}`
    : null

  let phase = 'closed-today'
  if (today.open !== null) {
    if (minutes < today.open) phase = 'before-open'
    else if (minutes < cutoff) phase = 'open'
    else if (minutes < today.close) phase = 'last-call'
    else phase = 'after-close'
  }

  const base = { phase, today, todayIndex: index, minutes, cutoff, nextLabel }

  switch (phase) {
    case 'open':
      return {
        ...base,
        openNow: true,
        acceptingWalkIns: true,
        answer: 'Yes — walk in today',
        detail: `Open until ${formatTime(today.close)}. Last walk-in accepted at ${formatTime(
          cutoff,
        )}, in ${formatDuration(cutoff - minutes)}.`,
      }
    case 'last-call':
      return {
        ...base,
        openNow: true,
        acceptingWalkIns: false,
        answer: 'Still open — come in now',
        detail: `Walk-in registration closed at ${formatTime(cutoff)}. The doors are open until ${formatTime(
          today.close,
        )}. If it is urgent, come in anyway and speak to the front desk.`,
      }
    case 'before-open':
      return {
        ...base,
        openNow: false,
        acceptingWalkIns: false,
        answer: `Yes — from ${formatTime(today.open)} today`,
        detail: `We open in ${formatDuration(today.open - minutes)}. Walk-ins are accepted until ${formatTime(
          cutoff,
        )}.`,
      }
    case 'after-close':
      return {
        ...base,
        openNow: false,
        acceptingWalkIns: false,
        answer: 'Closed for today',
        detail: `We closed at ${formatTime(today.close)}. Next open ${nextLabel}.`,
      }
    default:
      return {
        ...base,
        openNow: false,
        acceptingWalkIns: false,
        answer: `Closed on ${today.day}`,
        detail: `We are not open today. Next open ${nextLabel}.`,
      }
  }
}

export function axisPercent(minutes) {
  const clamped = Math.min(Math.max(minutes, AXIS_START), AXIS_END)
  return ((clamped - AXIS_START) / (AXIS_END - AXIS_START)) * 100
}
