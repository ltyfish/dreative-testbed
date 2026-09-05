// The clinic's schedule, and everything the page derives from "now".
//
// One authored value drives the whole route: `nowMin`, minutes since midnight
// on the current local day. The status statement, the countdown, the sweep line
// on the week strip, the accent colour, and the walk-in chips on the six
// services all read from the single object returned by readClock().

export const HOURS = [
  { day: 'Monday', short: 'Mon', open: '8:00', close: '20:00' },
  { day: 'Tuesday', short: 'Tue', open: '8:00', close: '20:00' },
  { day: 'Wednesday', short: 'Wed', open: '8:00', close: '20:00' },
  { day: 'Thursday', short: 'Thu', open: '8:00', close: '20:00' },
  { day: 'Friday', short: 'Fri', open: '8:00', close: '17:00' },
  { day: 'Saturday', short: 'Sat', open: '9:00', close: '14:00' },
  { day: 'Sunday', short: 'Sun', open: null, close: null },
]

// Registration closes this many minutes before the doors do.
export const REGISTRATION_LEAD = 30

// The axis every bar on the week strip is measured against.
export const AXIS_START = 6 * 60
export const AXIS_END = 21 * 60

// HOURS is indexed Monday-first; Date#getDay() is Sunday-first.
const DAY_INDEX = [6, 0, 1, 2, 3, 4, 5]

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function formatClock(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

export function formatDuration(min) {
  if (min <= 0) return '0 min'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

export function axisPercent(min) {
  return ((min - AXIS_START) / (AXIS_END - AXIS_START)) * 100
}

/**
 * Everything the page needs to know about this moment.
 * status: 'open' | 'last-call' | 'registration-closed' | 'closed'
 */
export function readClock(date = new Date()) {
  const nowMin = date.getHours() * 60 + date.getMinutes()
  const todayIndex = DAY_INDEX[date.getDay()]
  const today = HOURS[todayIndex]

  const base = {
    nowMin,
    todayIndex,
    today,
    openMin: null,
    closeMin: null,
    registrationCloseMin: null,
    minutesLeft: 0,
    status: 'closed',
    doorsOpen: false,
    nextDay: null,
    nextOpenMin: null,
  }

  if (today.open) {
    base.openMin = toMinutes(today.open)
    base.closeMin = toMinutes(today.close)
    base.registrationCloseMin = base.closeMin - REGISTRATION_LEAD
    base.doorsOpen = nowMin >= base.openMin && nowMin < base.closeMin

    if (base.doorsOpen) {
      base.minutesLeft = base.registrationCloseMin - nowMin
      if (nowMin >= base.registrationCloseMin) base.status = 'registration-closed'
      else if (base.minutesLeft <= 60) base.status = 'last-call'
      else base.status = 'open'
    }
  }

  if (base.status === 'closed' || base.status === 'registration-closed') {
    // Find the next day the doors open, starting with the rest of today.
    for (let step = base.status === 'closed' && !base.doorsOpen && today.open && nowMin < base.openMin ? 0 : 1; step <= 7; step++) {
      const d = HOURS[(base.todayIndex + step) % 7]
      if (!d.open) continue
      base.nextDay = step === 0 ? 'today' : step === 1 ? 'tomorrow' : d.day
      base.nextOpenMin = toMinutes(d.open)
      break
    }
  }

  return base
}

/**
 * Dev/inspection override so both the open and the closed composition can be
 * rendered and screenshotted on demand: ?now=1975-06-05T19:45
 */
export function clockDate() {
  if (typeof window === 'undefined') return new Date()
  const q = new URLSearchParams(window.location.search).get('now')
  if (!q) return new Date()
  const d = new Date(q)
  return Number.isNaN(d.getTime()) ? new Date() : d
}
