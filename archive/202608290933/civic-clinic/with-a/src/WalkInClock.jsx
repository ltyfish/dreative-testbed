import { useEffect, useRef, useState } from 'react'
import {
  HOURS,
  AXIS_START,
  AXIS_END,
  REGISTRATION_LEAD,
  axisPercent,
  formatClock,
  toMinutes,
} from './clock.js'

const TICKS = [
  { min: 6 * 60, label: '6am' },
  { min: 9 * 60, label: '9am' },
  { min: 12 * 60, label: 'noon' },
  { min: 15 * 60, label: '3pm' },
  { min: 18 * 60, label: '6pm' },
  { min: 21 * 60, label: '9pm' },
]

/**
 * The signature component: the clinic's week drawn on one shared time axis,
 * with the live moment swept across it.
 *
 * It answers the question the visitor actually arrived with — can I walk in,
 * and how long have I got — by putting "now" inside the schedule rather than
 * beside it. Every bar carries the last-30-minutes tail hatched out, because
 * registration closing before the doors do is the fact people get wrong.
 */
export default function WalkInClock({ clock, reducedMotion }) {
  const { nowMin, todayIndex, status, doorsOpen } = clock
  const nowPct = Math.min(100, Math.max(0, axisPercent(nowMin)))
  const inAxis = nowMin >= AXIS_START && nowMin <= AXIS_END

  // The sweep is drawn from the start of the axis to "now" once, on entry.
  // Reduced motion gets the resolved position with no travel.
  const gridRef = useRef(null)
  const [swept, setSwept] = useState(reducedMotion)
  useEffect(() => {
    if (reducedMotion) return setSwept(true)
    const el = gridRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            requestAnimationFrame(() => setSwept(true))
            io.disconnect()
          }
        }
      },
      { rootMargin: '-8% 0px -35% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reducedMotion])

  return (
    <figure className={`clock clock--${status}`} aria-labelledby="clock-cap">
      <div className="clock__axis" aria-hidden="true">
        {TICKS.map((t) => (
          <span key={t.min} className="clock__tick" style={{ left: `${axisPercent(t.min)}%` }}>
            {t.label}
          </span>
        ))}
      </div>

      <div className="clock__grid" ref={gridRef}>
        {/* One overlay inset to exactly the bar column, so the gridlines and the
            live sweep share the geometry of every bar underneath them. */}
        <div className="clock__lanes" aria-hidden="true">
          {TICKS.map((t) => (
            <span
              key={t.min}
              className="clock__gridline"
              style={{ left: `${axisPercent(t.min)}%` }}
            />
          ))}
          {inAxis && (
            <div
              className={`clock__sweep${swept ? ' is-swept' : ''}`}
              style={{ '--now': `${nowPct}%` }}
            >
              <span className="clock__sweep-flag">{formatClock(nowMin)}</span>
            </div>
          )}
        </div>

        <ol className="clock__days">
          {HOURS.map((d, i) => {
            const isToday = i === todayIndex
            const openMin = d.open ? toMinutes(d.open) : null
            const closeMin = d.close ? toMinutes(d.close) : null
            const regMin = closeMin === null ? null : closeMin - REGISTRATION_LEAD
            const left = openMin === null ? 0 : axisPercent(openMin)
            const width = openMin === null ? 0 : axisPercent(closeMin) - left
            const tailWidth =
              closeMin === null ? 0 : ((closeMin - regMin) / (closeMin - openMin)) * 100
            const elapsed =
              isToday && doorsOpen
                ? Math.min(100, ((nowMin - openMin) / (closeMin - openMin)) * 100)
                : 0

            return (
              <li
                key={d.day}
                className={`clock__day${isToday ? ' is-today' : ''}${d.open ? '' : ' is-shut'}`}
                data-day={d.day.toLowerCase()}
              >
                <span className="clock__label">
                  <b>{d.short}</b>
                  {isToday && <em className="clock__badge">today</em>}
                </span>

                <span className="clock__track">
                  {d.open ? (
                    <span className="clock__bar" style={{ left: `${left}%`, width: `${width}%` }}>
                      {isToday && doorsOpen && (
                        <span
                          className={`clock__elapsed${swept ? ' is-swept' : ''}`}
                          style={{ '--elapsed': `${elapsed}%` }}
                        />
                      )}
                      <span className="clock__tail" style={{ width: `${tailWidth}%` }} />
                    </span>
                  ) : (
                    <span className="clock__shut">Closed all day</span>
                  )}
                </span>

                <span className="clock__hours">
                  {d.open ? (
                    <>
                      {d.open}
                      <span className="clock__dash">&ndash;</span>
                      {d.close}
                    </>
                  ) : (
                    <span className="clock__dash">&mdash;</span>
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      <figcaption id="clock-cap" className="clock__legend">
        <span className="clock__key clock__key--open">Doors open</span>
        <span className="clock__key clock__key--tail">
          Last {REGISTRATION_LEAD} min — no new walk-in registrations
        </span>
        <span className="clock__key clock__key--now">Now</span>
      </figcaption>
    </figure>
  )
}
