// Clinic facts. Everything on the page is derived from this file; nothing is
// invented at the component level.

export const HOURS = [
  { day: 'Monday', open: '8:00', close: '20:00' },
  { day: 'Tuesday', open: '8:00', close: '20:00' },
  { day: 'Wednesday', open: '8:00', close: '20:00' },
  { day: 'Thursday', open: '8:00', close: '20:00' },
  { day: 'Friday', open: '8:00', close: '17:00' },
  { day: 'Saturday', open: '9:00', close: '14:00' },
  { day: 'Sunday', open: null, close: null },
]

// The clinic's own rule, stated on the page: walk-in registration closes 30
// minutes before the doors do.
export const REGISTRATION_LEAD_MINUTES = 30

// `access` is derived from the clinic's own statement that booking is only
// needed for dental and some counselling slots.
export const SERVICES = [
  {
    id: 'primary',
    name: 'General check-ups and illness',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    access: 'walk-in',
  },
  {
    id: 'screening',
    name: 'Blood pressure, diabetes, and vision screening',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    access: 'walk-in',
  },
  {
    id: 'pediatric',
    name: 'Children and infant care',
    eligibility: 'Under 18 with any adult',
    cost: 'Free, including vaccinations',
    access: 'walk-in',
  },
  {
    id: 'prescriptions',
    name: 'Prescriptions and refills',
    eligibility: 'Existing and new patients',
    cost: 'Free to issue, medication costs vary',
    access: 'walk-in',
  },
  {
    id: 'mental',
    name: 'Counselling and mental health',
    eligibility: 'Anyone 14+, walk-in or booked',
    cost: 'Free, first session same day when possible',
    access: 'either',
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

export const CLINIC = {
  phone: '(555) 014-2900',
  phoneHref: 'tel:+15550142900',
  interpreterPhone: '(555) 014-2911',
  interpreterHref: 'tel:+15550142911',
  street: '1140 East Barrow Street',
  city: 'Eastside, Springfield 62704',
}

export const TRANSIT = [
  { mode: 'Bus', text: 'Bus 14 and 27 stop directly outside the door on East Barrow.' },
  { mode: 'Train', text: 'Green line to Barrow Street station, then a four-minute walk east.' },
  { mode: 'Car', text: 'Free parking behind the building, entrance from Alder Lane.' },
  { mode: 'Access', text: 'Step-free entrance and accessible restrooms on the ground floor.' },
]

/* ------------------------------------------------------------------ */

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h} hour${h === 1 ? '' : 's'}`
  return `${h} hour${h === 1 ? '' : 's'} ${m} min`
}

// HOURS is Monday-first; Date#getDay is Sunday-first.
export function hoursIndexFor(date) {
  return (date.getDay() + 6) % 7
}

function nextOpening(fromIndex, nowMinutes) {
  for (let step = 0; step < 8; step += 1) {
    const index = (fromIndex + step) % 7
    const row = HOURS[index]
    if (!row.open) continue
    const open = toMinutes(row.open)
    if (step === 0 && nowMinutes >= open) continue
    const minutesUntil = step * 24 * 60 + open - nowMinutes
    return {
      day: row.day,
      when: step === 0 ? 'today' : step === 1 ? 'tomorrow' : `on ${row.day}`,
      time: row.open,
      minutesUntil,
    }
  }
  return null
}

/**
 * Resolve the one question this site exists to answer: can I walk in right now?
 *
 * States: `open` (registration accepting), `last-call` (doors open, registration
 * closed), `before-open`, `after-close`, `closed-today`.
 */
export function resolveWalkIn(now = new Date()) {
  const index = hoursIndexFor(now)
  const today = HOURS[index]
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const base = {
    today,
    todayIndex: index,
    nowMinutes,
    nowLabel: formatTime(nowMinutes),
    dayLabel: today.day,
  }

  if (!today.open) {
    return {
      ...base,
      state: 'closed-today',
      canWalkIn: false,
      tone: 'closed',
      headline: 'Closed today',
      registrationCloses: null,
      window: null,
      progress: null,
      next: nextOpening(index, nowMinutes),
    }
  }

  const open = toMinutes(today.open)
  const close = toMinutes(today.close)
  const registration = close - REGISTRATION_LEAD_MINUTES
  const window = { open, close, registration }
  const span = Math.max(registration - open, 1)
  const clamp = (v) => Math.min(1, Math.max(0, v))

  if (nowMinutes < open) {
    return {
      ...base,
      state: 'before-open',
      canWalkIn: false,
      tone: 'closed',
      headline: 'Not open yet',
      registrationCloses: registration,
      window,
      progress: 0,
      next: nextOpening(index, nowMinutes),
    }
  }

  if (nowMinutes < registration) {
    return {
      ...base,
      state: 'open',
      canWalkIn: true,
      tone: 'open',
      headline: 'Yes — walk in today',
      registrationCloses: registration,
      minutesLeft: registration - nowMinutes,
      window,
      progress: clamp((nowMinutes - open) / span),
      next: null,
    }
  }

  if (nowMinutes < close) {
    return {
      ...base,
      state: 'last-call',
      canWalkIn: false,
      tone: 'closing',
      headline: 'Registration has closed',
      registrationCloses: registration,
      minutesLeft: close - nowMinutes,
      window,
      progress: 1,
      next: nextOpening(index, nowMinutes),
    }
  }

  return {
    ...base,
    state: 'after-close',
    canWalkIn: false,
    tone: 'closed',
    headline: 'Closed for today',
    registrationCloses: registration,
    window,
    progress: 1,
    next: nextOpening(index, nowMinutes),
  }
}
