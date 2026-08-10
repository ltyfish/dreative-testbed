import { HOURS, REGISTRATION_CUTOFF_MINUTES } from './data.js'

// The timeline axis. Wide enough to hold every opening hour with air on each side.
export const AXIS_START = 6 * 60
export const AXIS_END = 21 * 60
const AXIS_SPAN = AXIS_END - AXIS_START

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/** Position on the timeline axis, 0–100. */
export function axisPercent(minutes) {
  return ((clamp(minutes, AXIS_START, AXIS_END) - AXIS_START) / AXIS_SPAN) * 100
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v))
}

/** Rich view of one row of the opening-hours table. */
export function dayInfo(index) {
  const row = HOURS[index]
  if (!row.open) return { ...row, index, closed: true }
  const open = toMinutes(row.open)
  const close = toMinutes(row.close)
  return {
    ...row,
    index,
    closed: false,
    open,
    close,
    cutoff: close - REGISTRATION_CUTOFF_MINUTES,
  }
}

/** HOURS is Monday-first; Date.getDay() is Sunday-first. */
export function todayIndex(now) {
  return (now.getDay() + 6) % 7
}

export function nowMinutes(now) {
  return now.getHours() * 60 + now.getMinutes()
}

function nextOpenDay(fromIndex) {
  for (let step = 1; step <= 7; step += 1) {
    const info = dayInfo((fromIndex + step) % 7)
    if (!info.closed) return { info, step }
  }
  return null
}

/**
 * The whole page's answer, derived from the hours table rather than written by hand.
 * `state` drives colour; `headline` is the sentence a worried person reads first.
 */
export function statusFor(dayIdx, now) {
  const today = todayIndex(now)
  const isToday = dayIdx === today
  const info = dayInfo(dayIdx)
  const minutes = nowMinutes(now)

  if (!isToday) {
    if (info.closed) {
      return {
        info,
        isToday,
        state: 'closed',
        headline: `We are closed on ${info.day}.`,
        detail: 'Pick another day on the timeline, or call us and we will help you plan.',
        facts: [{ label: 'Walk-in', value: 'Closed' }],
      }
    }
    return {
      info,
      isToday,
      state: 'other-day',
      headline: `On ${info.day} you can walk in from ${formatTime(info.open)}.`,
      detail: `Doors open ${formatTime(info.open)} and close ${formatTime(
        info.close,
      )}. Walk-in registration closes at ${formatTime(info.cutoff)}.`,
      facts: [
        { label: 'Doors open', value: formatTime(info.open) },
        { label: 'Walk in until', value: formatTime(info.cutoff) },
        { label: 'You pay', value: '$0' },
      ],
    }
  }

  const next = nextOpenDay(dayIdx)
  const nextLabel = next ? (next.step === 1 ? 'tomorrow' : `on ${next.info.day}`) : ''
  const nextSentence = next
    ? `We open again ${nextLabel} at ${formatTime(next.info.open)}.`
    : 'Call us and we will help you plan a visit.'

  if (info.closed) {
    return {
      info,
      isToday,
      state: 'closed',
      headline: 'We are closed today.',
      detail: `${nextSentence} If this is urgent and cannot wait, call 911 or go to the nearest emergency room.`,
      facts: next
        ? [
            { label: 'Next open', value: `${next.info.day} ${formatTime(next.info.open)}` },
            { label: 'You pay', value: '$0' },
          ]
        : [{ label: 'You pay', value: '$0' }],
    }
  }

  if (minutes < info.open) {
    return {
      info,
      isToday,
      state: 'before-open',
      headline: `Yes — we open at ${formatTime(info.open)} today.`,
      detail: `No appointment needed. Walk-in registration runs until ${formatTime(
        info.cutoff,
      )}, and the doors close at ${formatTime(info.close)}.`,
      facts: [
        { label: 'Doors open', value: formatTime(info.open) },
        { label: 'Walk in until', value: formatTime(info.cutoff) },
        { label: 'You pay', value: '$0' },
      ],
    }
  }

  if (minutes < info.cutoff) {
    const left = info.cutoff - minutes
    return {
      info,
      isToday,
      state: 'open',
      headline: 'Yes — you can walk in today.',
      detail: `We are open now for walk-ins. The last patient is accepted at ${formatTime(
        info.cutoff,
      )} today, which is ${humanGap(left)} from now.`,
      facts: [
        { label: 'Open until', value: formatTime(info.close) },
        { label: 'Walk in until', value: formatTime(info.cutoff) },
        { label: 'You pay', value: '$0' },
      ],
    }
  }

  if (minutes < info.close) {
    return {
      info,
      isToday,
      state: 'closing',
      headline: 'We are open, but walk-in registration has closed.',
      detail: `Registration closed at ${formatTime(info.cutoff)} and the doors close at ${formatTime(
        info.close,
      )}. If it is urgent, come in anyway and speak to the front desk. ${nextSentence}`,
      facts: [
        { label: 'Doors close', value: formatTime(info.close) },
        { label: 'Walk in until', value: formatTime(info.cutoff) },
        { label: 'You pay', value: '$0' },
      ],
    }
  }

  return {
    info,
    isToday,
    state: 'closed',
    headline: 'We are closed for today.',
    detail: `${nextSentence} If this is urgent and cannot wait, call 911 or go to the nearest emergency room.`,
    facts: next
      ? [
          { label: 'Next open', value: `${next.info.day} ${formatTime(next.info.open)}` },
          { label: 'You pay', value: '$0' },
        ]
      : [{ label: 'You pay', value: '$0' }],
  }
}

function humanGap(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} minute${m === 1 ? '' : 's'}`
  if (m === 0) return `${h} hour${h === 1 ? '' : 's'}`
  return `${h} hour${h === 1 ? '' : 's'} ${m} minutes`
}

/** Short line for the sticky header. */
export function stickySummary(now) {
  const s = statusFor(todayIndex(now), now)
  if (s.state === 'open') return { tone: 'open', text: `Open now · walk in until ${formatTime(s.info.cutoff)}` }
  if (s.state === 'before-open') return { tone: 'soon', text: `Opens ${formatTime(s.info.open)} today` }
  if (s.state === 'closing') return { tone: 'soon', text: `Open until ${formatTime(s.info.close)} · registration closed` }
  return { tone: 'closed', text: 'Closed right now' }
}
