import { useEffect, useState } from 'react'
import { HOURS } from './data.js'
import { AXIS_END, AXIS_START, axisPercent, dayInfo, formatTime, nowMinutes, todayIndex } from './clock.js'

const TICKS = []
for (let m = AXIS_START; m <= AXIS_END; m += 180) TICKS.push(m)

/**
 * The opening-hours table, drawn on a time axis.
 *
 * Every day is a row of the real table; the bar in each row is the same data as
 * the Opens/Closes columns beside it. The hatched tail is the half hour after
 * walk-in registration closes, and the vertical line is the current time of day,
 * which is why it crosses every row: at this hour, these are the days you could
 * have walked in.
 */
export default function WeekTimeline({ selected, onSelect, now }) {
  const today = todayIndex(now)
  const minutes = nowMinutes(now)
  const nowPct = axisPercent(minutes)
  const inAxis = minutes >= AXIS_START && minutes <= AXIS_END

  // Draw the bars and the now-line into place once, after first paint.
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setArmed(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className={`week${armed ? ' is-armed' : ''}`}>
      <table className="week-table" id="hours-table">
        <caption className="week-caption">
          Opening hours for every day of the week. Walk-in registration closes 30 minutes before the
          doors do — the striped end of each bar.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="c-day">
              Day
            </th>
            <th scope="col" className="c-hours">
              Open — Close
            </th>
            <th scope="col" className="c-track">
              <span className="vh">Timeline</span>
              <div className="axis" aria-hidden="true">
                {TICKS.map((m) => (
                  <span key={m} className="axis-tick" style={{ left: `${axisPercent(m)}%` }}>
                    {formatTime(m)}
                  </span>
                ))}
                {inAxis && (
                  <span className="axis-now" style={{ left: `${armed ? nowPct : 0}%` }}>
                    now {formatTime(minutes)}
                  </span>
                )}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {HOURS.map((row, i) => {
            const info = dayInfo(i)
            const isToday = i === today
            const isSelected = i === selected
            return (
              <tr
                key={row.day}
                data-day={row.day.toLowerCase()}
                className={[
                  'week-row',
                  info.closed ? 'is-shut' : '',
                  isToday ? 'is-today' : '',
                  isSelected ? 'is-selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelect(i)}
              >
                <th scope="row" className="c-day">
                  <button
                    type="button"
                    className="day-btn"
                    aria-pressed={isSelected}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(i)
                    }}
                  >
                    <span className="day-full">{row.day}</span>
                    <span className="day-short" aria-hidden="true">
                      {row.day.slice(0, 3)}
                    </span>
                    {isToday && <span className="day-flag">today</span>}
                  </button>
                </th>
                <td className="c-hours">
                  {info.closed ? (
                    <span className="shut-word">Closed</span>
                  ) : (
                    <span className="range">
                      <time>{row.open}</time>
                      <span className="dash" aria-hidden="true">
                        —
                      </span>
                      <time>{row.close}</time>
                    </span>
                  )}
                </td>
                <td className="c-track">
                  <div className="track" style={{ transitionDelay: `${80 + i * 45}ms` }}>
                    {!info.closed && (
                      <>
                        <span
                          className="bar"
                          style={{
                            left: `${axisPercent(info.open)}%`,
                            width: `${axisPercent(info.close) - axisPercent(info.open)}%`,
                            transitionDelay: `${80 + i * 45}ms`,
                          }}
                        >
                          <span
                            className="bar-tail"
                            style={{
                              width: `${
                                ((info.close - info.cutoff) / (info.close - info.open)) * 100
                              }%`,
                            }}
                          />
                        </span>
                        <span className="bar-label" style={{ left: `${axisPercent(info.open)}%` }}>
                          walk in until {formatTime(info.cutoff)}
                        </span>
                      </>
                    )}
                    {inAxis && <span className="now-line" style={{ left: `${armed ? nowPct : 0}%` }} />}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
