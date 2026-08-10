import { useEffect, useRef, useState } from 'react'
import { BEANS, PLOT, curvePoints, smoothPath, px, py, mmss } from './data.js'

const TEMP_TICKS = [100, 150, 200]
const TIME_TICKS = [2, 4, 6, 8, 10, 12]

const PATHS = Object.fromEntries(BEANS.map((b) => [b.id, smoothPath(curvePoints(b.log))]))

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * The roast log. Six beans, six profiles recorded off the same drum: the plot is
 * the reason a Northwind bag tastes the way it does, so it is the page's peak.
 */
export default function RoastLog({ onAdd, added }) {
  const [selectedId, setSelectedId] = useState(BEANS[0].id)
  const pathRef = useRef(null)
  const bean = BEANS.find((b) => b.id === selectedId)
  const { log } = bean

  useEffect(() => {
    const el = pathRef.current
    if (!el) return
    if (prefersReducedMotion()) {
      el.style.strokeDasharray = 'none'
      el.style.strokeDashoffset = '0'
      return
    }
    const len = el.getTotalLength()
    el.style.transition = 'none'
    el.style.strokeDasharray = `${len}`
    el.style.strokeDashoffset = `${len}`
    // Force a reflow so the reset is committed before the draw begins.
    void el.getBoundingClientRect()
    el.style.transition = 'stroke-dashoffset 1.05s cubic-bezier(.32,.72,.24,1)'
    el.style.strokeDashoffset = '0'
  }, [selectedId])

  const devStart = px(log.firstCrack)
  const devEnd = px(log.drop)

  return (
    <div className="roastlog">
      <figure className="plot" style={{ '--bean': bean.swatch }}>
        <figcaption className="plot-head">
          <span className="tag">Roast log · 12kg batch</span>
          <h3>{bean.name}</h3>
          <p className="plot-sub">
            {bean.origin} · {bean.altitude} · {bean.process}
          </p>
        </figcaption>

        <svg
          className="plot-svg"
          viewBox={`0 0 ${PLOT.w} ${PLOT.h}`}
          role="img"
          aria-label={`Roast profile for ${bean.name}: bean temperature rising to ${log.dropTemp} degrees Celsius, first crack at ${mmss(
            log.firstCrack,
          )}, dropped at ${mmss(log.drop)} with ${log.dev} percent development time.`}
        >
          <rect
            className="phase phase-dev"
            x={devStart}
            y={PLOT.mt}
            width={devEnd - devStart}
            height={PLOT.h - PLOT.mt - PLOT.mb}
          />

          {TEMP_TICKS.map((t) => (
            <g key={t} className="grid-h">
              <line x1={PLOT.ml} x2={PLOT.w - PLOT.mr} y1={py(t)} y2={py(t)} />
              <text x={PLOT.ml - 10} y={py(t) + 4} textAnchor="end">
                {t}°
              </text>
            </g>
          ))}

          {TIME_TICKS.map((t) => (
            <g key={t} className="grid-v">
              <line x1={px(t)} x2={px(t)} y1={PLOT.mt} y2={PLOT.h - PLOT.mb} />
              <text x={px(t)} y={PLOT.h - PLOT.mb + 20} textAnchor="middle">
                {t}′
              </text>
            </g>
          ))}

          <line
            className="axis"
            x1={PLOT.ml}
            x2={PLOT.w - PLOT.mr}
            y1={PLOT.h - PLOT.mb}
            y2={PLOT.h - PLOT.mb}
          />

          {/* The other five profiles stay on the plot: this is a family of roasts,
              and the shape of the difference is the argument. */}
          {BEANS.filter((b) => b.id !== selectedId).map((b) => (
            <path key={b.id} className="ghost" d={PATHS[b.id]} />
          ))}

          <path ref={pathRef} className="curve" d={PATHS[selectedId]} />

          <g className="marks">
            <g className="mark" transform={`translate(${px(1.3)} ${py(log.turn)})`}>
              <circle r="4" />
              <text className="mark-label mark-min" x="8" y="14">
                Turn
              </text>
            </g>
            <g className="mark" transform={`translate(${px(5)} ${py(log.dryEnd)})`}>
              <circle r="4" />
              <text className="mark-label mark-min" x="8" y="-8">
                Dry end
              </text>
            </g>
            <g className="mark mark-crack" transform={`translate(${px(log.firstCrack)} ${py(196)})`}>
              <circle r="5.5" />
              <text className="mark-label" x="-10" y="-12" textAnchor="end">
                First crack {mmss(log.firstCrack)}
              </text>
            </g>
            <g className="mark mark-drop" transform={`translate(${px(log.drop)} ${py(log.dropTemp)})`}>
              <circle r="6.5" />
              <text className="mark-label" x="-12" y="-14" textAnchor="end">
                Drop {mmss(log.drop)}
              </text>
            </g>
          </g>

          <text className="phase-label" x={(devStart + devEnd) / 2} y={PLOT.h - PLOT.mb - 8} textAnchor="middle">
            {log.dev}% development
          </text>
        </svg>

        <dl className="readout">
          <div>
            <dt>Drop</dt>
            <dd>{mmss(log.drop)}</dd>
          </div>
          <div>
            <dt>Bean temp</dt>
            <dd>{log.dropTemp}°C</dd>
          </div>
          <div>
            <dt>Development</dt>
            <dd>{log.dev}%</dd>
          </div>
          <div>
            <dt>Roast</dt>
            <dd className="readout-roast">
              <span className="chip" aria-hidden="true" />
              {bean.roast}
            </dd>
          </div>
        </dl>
      </figure>

      <div className="rail">
        <p className="rail-head">
          <span>Six origins</span>
          <span>Drop · Dev</span>
        </p>
        <ul className="bean-list">
          {BEANS.map((b) => {
            const on = b.id === selectedId
            return (
              <li
                key={b.id}
                data-bean={b.id}
                className={`bean-row${on ? ' is-selected' : ''}`}
                style={{ '--bean': b.swatch }}
              >
                <button
                  type="button"
                  className="bean-select"
                  aria-pressed={on}
                  onClick={() => setSelectedId(b.id)}
                >
                  <span className="bean-swatch" aria-hidden="true" />
                  <span className="bean-text">
                    <span className="bean-name">{b.name}</span>
                    <span className="bean-notes">{b.notes}</span>
                  </span>
                  <span className="bean-log">
                    <span className="bean-drop">{mmss(b.log.drop)}</span>
                    <span className="bean-dev">{b.log.dev}%</span>
                  </span>
                </button>
                <div className="bean-buy">
                  <span className="bean-meta">
                    {b.roast} roast · 250g
                  </span>
                  <span className="bean-price">${b.price}</span>
                  <button type="button" className="btn btn-add" onClick={() => onAdd(b)}>
                    {added === b.id ? 'Added ✓' : 'Add to cart'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
