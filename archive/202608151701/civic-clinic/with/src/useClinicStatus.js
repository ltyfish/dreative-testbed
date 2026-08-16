import { useEffect, useState } from 'react'
import { CLINIC, SCHEDULE, formatDuration, formatTime } from './clinic-data.js'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function minutesOf(date) {
  return date.getHours() * 60 + date.getMinutes()
}

function cutOf(span) {
  return span.close - CLINIC.registrationCutMinutes
}

// The next moment the doors open, searched forward from `from`.
function nextOpening(from) {
  for (let offset = 0; offset <= 7; offset += 1) {
    const probe = new Date(from)
    probe.setDate(probe.getDate() + offset)
    const span = SCHEDULE[probe.getDay()]
    if (!span || span.open === null) continue
    if (offset === 0 && minutesOf(from) >= span.open) continue
    const at = new Date(probe)
    at.setHours(0, 0, 0, 0)
    at.setMinutes(span.open)
    return {
      dayIndex: probe.getDay(),
      dayName: offset === 1 ? 'tomorrow' : DAY_NAMES[probe.getDay()],
      time: formatTime(span.open),
      inMinutes: (at - from) / 60000,
    }
  }
  return null
}

/**
 * Answers the one question a walk-in patient arrives with, for the moment they
 * would actually reach the door.
 *
 * @param {Date} now       real current time
 * @param {number} offset  minutes until the patient expects to arrive
 */
export function resolveStatus(now, offset) {
  const arrival = new Date(now.getTime() + offset * 60000)
  const arrivalMinutes = minutesOf(arrival)
  const span = SCHEDULE[arrival.getDay()]
  const openToday = span && span.open !== null
  const upcoming = nextOpening(arrival)

  const base = {
    arrival,
    arrivalDayName: DAY_NAMES[arrival.getDay()],
    arrivalMinutes,
    span: openToday ? span : null,
    cut: openToday ? cutOf(span) : null,
    next: upcoming,
  }

  if (openToday && arrivalMinutes < span.open) {
    return {
      ...base,
      kind: 'early',
      tone: 'wait',
      verdict: offset === 0 ? 'Not open yet' : 'Not open yet',
      detail:
        offset === 0
          ? `Doors open at ${formatTime(span.open)} today, in ${formatDuration(span.open - arrivalMinutes)}.`
          : `You would arrive before we open. Doors open at ${formatTime(span.open)}.`,
    }
  }

  if (openToday && arrivalMinutes <= cutOf(span)) {
    const left = cutOf(span) - arrivalMinutes
    return {
      ...base,
      kind: 'open',
      tone: 'go',
      verdict: offset === 0 ? 'Open now for walk-ins' : 'Yes, you can walk in',
      detail:
        offset === 0
          ? `Last patient accepted at ${formatTime(cutOf(span))} today — ${formatDuration(left)} from now.`
          : `Walk-in registration is open until ${formatTime(cutOf(span))}. You would have ${formatDuration(left)} to spare.`,
    }
  }

  if (openToday && arrivalMinutes <= span.close) {
    return {
      ...base,
      kind: 'late',
      tone: 'wait',
      verdict: 'Walk-in registration has closed',
      detail: `Registration closed at ${formatTime(cutOf(span))}. If it is urgent, come in anyway and speak to the front desk.`,
    }
  }

  return {
    ...base,
    kind: 'closed',
    tone: 'stop',
    verdict: 'Closed right now',
    detail: upcoming
      ? `We open again ${upcoming.dayName} at ${upcoming.time}, in ${formatDuration(upcoming.inMinutes)}.`
      : 'Please call us for the next opening time.',
  }
}

/** Ticks once a minute so the countdown on screen stays true. */
export function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  return now
}
