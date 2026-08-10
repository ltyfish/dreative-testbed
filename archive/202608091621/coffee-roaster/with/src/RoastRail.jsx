import { useEffect, useState } from 'react'
import { PROFILE, formatClock } from './roast.js'
import { useRoast } from './useRoast.jsx'
import SightGlass from './SightGlass.jsx'

const T_MIN = 40
const T_MAX = 240
const tempX = (temp) => (Math.max(T_MIN, Math.min(T_MAX, temp)) - T_MIN) / (T_MAX - T_MIN)

const MARKS = [
  { p: 0.0, label: 'Charge' },
  { p: 0.2, label: 'Drying' },
  { p: 0.46, label: 'Yellowing' },
  { p: 0.53, label: 'First crack' },
  { p: 0.66, label: 'Drop' },
  { p: 0.73, label: 'Cooling tray' },
  { p: 0.82, label: 'Brewer' },
  { p: 0.95, label: 'Cup' },
]

function curvePath(width, height, pad) {
  const usable = width - pad * 2
  return PROFILE.map((pt, i) => {
    const x = pad + tempX(pt.temp) * usable
    const y = pt.p * height
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')
}

function useViewport() {
  const [vp, setVp] = useState({ w: 1440, h: 900 })
  useEffect(() => {
    const read = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])
  return vp
}

/** The sight glass is one element. It starts in the middle of the first screen
 *  and lands in the instrument rail; nothing is duplicated or cross-faded. */
function TravellingGlass() {
  const { heroHandoff, reduced } = useRoast()
  const { w, h } = useViewport()
  const mobile = w < 900
  const eased = heroHandoff * heroHandoff * (3 - 2 * heroHandoff)
  // Reduced motion gets the two resting positions and no travel between them.
  const k = reduced ? (heroHandoff > 0.5 ? 1 : 0) : eased

  const from = mobile
    ? { size: Math.min(w * 0.66, 300), cx: w * 0.5, cy: h * 0.44 }
    : { size: Math.min(w * 0.4, 440), cx: w * 0.5, cy: h * 0.5 }
  const to = mobile
    ? { size: 46, cx: 38, cy: h - 34 }
    : { size: 146, cx: 106, cy: h - 108 }

  const size = from.size + (to.size - from.size) * k
  const cx = from.cx + (to.cx - from.cx) * k
  const cy = from.cy + (to.cy - from.cy) * k

  return (
    <div
      className="sight-glass"
      data-landed={k > 0.98 ? 'true' : 'false'}
      style={{ width: size, height: size, left: cx - size / 2, top: cy - size / 2 }}
    >
      <SightGlass />
      <span className="sight-glass-ring" aria-hidden="true" />
    </div>
  )
}

export default function RoastRail() {
  const { reading, progress, selectedBean } = useRoast()
  const { h } = useViewport()

  const railH = Math.max(320, h - 300)
  const shownTemp = selectedBean ? selectedBean.drop : reading.temp
  const shownPhase = selectedBean ? `${selectedBean.roast} roast` : reading.phase
  const markerY = progress * railH
  const markerX = 14 + tempX(reading.temp) * 72

  return (
    <>
      <TravellingGlass />

      <aside className="rail" aria-hidden="true">
        <p className="rail-title">
          Roast log
          <span>drum probe · °C</span>
        </p>

        <div className="rail-plot" style={{ height: railH }}>
          <svg width="100" height={railH} viewBox={`0 0 100 ${railH}`} preserveAspectRatio="none">
            <path className="rail-curve-dim" d={curvePath(100, railH, 14)} pathLength="1" />
            <path
              className="rail-curve-hot"
              d={curvePath(100, railH, 14)}
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - progress}
            />
          </svg>
          <span className="rail-marker" style={{ top: markerY, left: markerX }} />
          <ul className="rail-marks">
            {MARKS.map((m) => (
              <li
                key={m.label}
                style={{ top: m.p * railH }}
                data-passed={progress >= m.p ? 'true' : 'false'}
              >
                {m.label}
              </li>
            ))}
          </ul>
        </div>

        <p className="rail-readout">
          <span className="rail-clock">{formatClock(reading.clock)}</span>
          <span className="rail-temp">{Math.round(shownTemp)}°</span>
          <span className="rail-phase">{shownPhase}</span>
        </p>
      </aside>

      <div className="instrument-bar" aria-hidden="true">
        <span className="instrument-bar-slot" />
        <span className="instrument-bar-readout">
          <b>{Math.round(shownTemp)}°C</b>
          <i>{shownPhase}</i>
        </span>
        <span className="instrument-bar-track">
          <span className="instrument-bar-fill" style={{ transform: `scaleX(${progress})` }} />
          <span className="instrument-bar-clock">{formatClock(reading.clock)}</span>
        </span>
      </div>
    </>
  )
}
