import { useEffect, useMemo, useRef, useState } from 'react'
import { samples, phaseAt, developmentRatio, fmtTime, beanColorAt, makeProbe, makeRor } from './roast.js'

// Two coordinate systems, not one scaled down: at 390px the plot is redrawn in
// a narrower space so the labels stay at a readable physical size, and the
// rate-of-rise trace is dropped rather than crowded in.
const DESKTOP = { W: 1000, H: 520, pad: { top: 34, right: 62, bottom: 44, left: 56 }, tempStep: 20, timeStep: 120, ror: true }
const MOBILE = { W: 480, H: 460, pad: { top: 30, right: 16, bottom: 40, left: 44 }, tempStep: 40, timeStep: 180, ror: false }
const T_MIN = 60
const T_MAX = 230
const ROR_MAX = 44

function useMedia(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}

/**
 * The roast log for one lot: bean-probe temperature and rate of rise against
 * elapsed time, with the recorded first crack and drop. Drag the playhead and
 * the batch runs; the swatch is the bean's ground colour at that second.
 */
export default function RoastCurve({ bean }) {
  const wrapRef = useRef(null)
  const plotRef = useRef(null)
  const rafRef = useRef(0)
  const compact = useMedia('(max-width: 720px)')
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const [drawn, setDrawn] = useState(false)
  const [t, setT] = useState(bean.profile.drop)
  const [playing, setPlaying] = useState(false)

  const { profile } = bean
  const end = profile.drop
  const geo = compact ? MOBILE : DESKTOP
  const { W, H, pad: PAD } = geo

  const data = useMemo(() => samples(profile), [profile])
  const tempAt = useMemo(() => makeProbe(profile.points), [profile])
  const rorAt = useMemo(() => makeRor(tempAt), [tempAt])

  useEffect(() => {
    setT(profile.drop)
    setPlaying(false)
  }, [profile])

  const x = (secs) => PAD.left + (secs / end) * (W - PAD.left - PAD.right)
  const y = (temp) => PAD.top + (1 - (temp - T_MIN) / (T_MAX - T_MIN)) * (H - PAD.top - PAD.bottom)
  const yRor = (r) => PAD.top + (1 - r / ROR_MAX) * (H - PAD.top - PAD.bottom)

  const tempPath = useMemo(
    () => data.map((d, i) => `${i ? 'L' : 'M'}${x(d.t).toFixed(1)} ${y(d.temp).toFixed(1)}`).join(' '),
    [data, end, geo],
  )
  const rorPath = useMemo(
    () =>
      data
        // Rate of rise is meaningless before the charge settles at the turning
        // point, so the trace starts where a roaster starts reading it.
        .filter((d) => d.t > profile.points[1][0] + 40)
        .map((d, i) => `${i ? 'L' : 'M'}${x(d.t).toFixed(1)} ${yRor(Math.min(ROR_MAX, d.ror)).toFixed(1)}`)
        .join(' '),
    [data, end, geo],
  )

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setDrawn(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const tick = (now) => {
      const dt = (now - last) / 1000
      last = now
      setT((prev) => {
        // The 12kg batch runs in about eight seconds here.
        const next = prev + (end / 8) * dt
        if (next >= end) {
          setPlaying(false)
          return end
        }
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, end])

  function pointerScrub(e) {
    const rect = plotRef.current.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const inner = (W - PAD.left - PAD.right) / W
    const offset = PAD.left / W
    const secs = ((ratio - offset) / inner) * end
    setPlaying(false)
    setT(Math.min(end, Math.max(0, secs)))
  }

  const temp = tempAt(t)
  const ror = Math.max(0, rorAt(t))
  const phase = phaseAt(profile, t)
  const dtr = developmentRatio(profile)
  const swatch = beanColorAt(bean, t)
  const past = t < end
  const cracked = t >= profile.firstCrack

  const tempTicks = []
  for (let v = 80; v <= 220; v += geo.tempStep) tempTicks.push(v)
  const timeTicks = []
  for (let s = 0; s <= end; s += geo.timeStep) timeTicks.push(s)

  return (
    <div className="curve" ref={wrapRef} data-lot={bean.id} data-phase={phase}>
      <div className="curve__head">
        <div className="curve__title">
          <span className="tag">Roast log</span>
          <h3>{bean.name}</h3>
          <p className="curve__sub">
            Lot {bean.lot} · 12kg batch · charge {profile.charge}°C · drop {fmtTime(end)}
          </p>
        </div>
        <dl className="curve__readout">
          <div>
            <dt>Elapsed</dt>
            <dd className="num">{fmtTime(t)}</dd>
          </div>
          <div>
            <dt>Bean temp</dt>
            <dd className="num">{temp.toFixed(1)}<span className="unit">°C</span></dd>
          </div>
          <div>
            <dt>Rate of rise</dt>
            <dd className="num">{ror.toFixed(1)}<span className="unit">°C/min</span></dd>
          </div>
          <div>
            <dt>Phase</dt>
            <dd className="curve__phase">{phase}</dd>
          </div>
        </dl>
      </div>

      <div
        className={`curve__plot${drawn || reduced ? ' is-drawn' : ''}`}
        ref={plotRef}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          pointerScrub(e)
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) pointerScrub(e)
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} role="img"
          aria-label={`Roast curve for ${bean.name}. Charged at ${profile.charge} degrees, first crack at ${fmtTime(profile.firstCrack)}, dropped at ${fmtTime(end)} and ${profile.points[4][1]} degrees, development ratio ${(dtr * 100).toFixed(1)} percent.`}
        >
          <rect className="curve__field" x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom} />

          <rect
            className="curve__devband"
            x={x(profile.firstCrack)}
            y={PAD.top}
            width={x(end) - x(profile.firstCrack)}
            height={H - PAD.top - PAD.bottom}
          />

          {tempTicks.map((v) => (
            <g key={v} className="curve__grid">
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} />
              <text x={PAD.left - 10} y={y(v) + 4} textAnchor="end">{v}°</text>
            </g>
          ))}

          {timeTicks.map((s) => (
            <g key={s} className="curve__grid curve__grid--v">
              <line x1={x(s)} x2={x(s)} y1={PAD.top} y2={H - PAD.bottom} />
              <text x={x(s)} y={H - PAD.bottom + 24} textAnchor="middle">{fmtTime(s)}</text>
            </g>
          ))}

          {geo.ror
            ? [0, 11, 22, 33, 44].map((v) => (
                <text key={v} className="curve__rorlabel" x={W - PAD.right + 10} y={yRor(v) + 4}>{v}</text>
              ))
            : null}

          {geo.ror ? <path className="curve__ror" d={rorPath} /> : null}
          <path className="curve__temp" d={tempPath} />

          <g className="curve__mark curve__mark--fc" data-cracked={cracked}>
            <line x1={x(profile.firstCrack)} x2={x(profile.firstCrack)} y1={PAD.top + 8} y2={H - PAD.bottom} />
            <text x={x(profile.firstCrack) - 8} y={PAD.top + 22} textAnchor="end">
              {compact ? `1C ${fmtTime(profile.firstCrack)}` : `First crack ${fmtTime(profile.firstCrack)}`}
            </text>
          </g>
          <g className="curve__mark curve__mark--drop">
            <line x1={x(end)} x2={x(end)} y1={PAD.top + 8} y2={H - PAD.bottom} />
            {compact ? null : (
              <text x={x(end) - 8} y={PAD.top + 22} textAnchor="end">Drop {profile.points[4][1]}°C</text>
            )}
          </g>

          <g className="curve__playhead" transform={`translate(${x(t)} 0)`} data-live={past}>
            <line x1="0" x2="0" y1={PAD.top} y2={H - PAD.bottom} />
            <circle cx="0" cy={y(temp)} r="9" style={{ fill: swatch }} />
            {geo.ror ? <circle className="curve__playhead-ror" cx="0" cy={yRor(Math.min(ROR_MAX, ror))} r="4" /> : null}
          </g>

          <text className="curve__axis" x={PAD.left} y={PAD.top - 12}>
            {compact ? 'Bean temp °C' : 'Bean temperature °C'}
          </text>
          {geo.ror ? (
            <text className="curve__axis curve__axis--right" x={W - PAD.right} y={PAD.top - 12} textAnchor="end">Rate of rise</text>
          ) : null}
        </svg>
      </div>

      <div className="curve__controls">
        <button
          type="button"
          className="curve__play"
          onClick={() => {
            if (playing) return setPlaying(false)
            if (t >= end) setT(0)
            setPlaying(true)
          }}
          aria-pressed={playing}
        >
          {playing ? 'Pause batch' : 'Run the batch'}
        </button>
        <label className="curve__slider">
          <span className="visually-hidden">Scrub the roast for {bean.name}</span>
          <input
            type="range"
            min="0"
            max={end}
            step="1"
            value={Math.round(t)}
            onChange={(e) => {
              setPlaying(false)
              setT(Number(e.target.value))
            }}
          />
        </label>
        <div className="curve__swatch">
          <span className="curve__chip" style={{ background: swatch }} aria-hidden="true" />
          <span className="curve__swatch-label">
            {t >= end ? `Agtron ${bean.agtron} · ${bean.roast.toLowerCase()}` : 'colour at this second'}
          </span>
        </div>
      </div>

      <ul className="curve__facts">
        <li><span>Development</span><strong className="num">{(dtr * 100).toFixed(1)}%</strong></li>
        <li><span>Turning point</span><strong className="num">{fmtTime(profile.points[1][0])} / {profile.points[1][1]}°C</strong></li>
        <li><span>Drying ends</span><strong className="num">{fmtTime(profile.points[2][0])} / {profile.points[2][1]}°C</strong></li>
        <li><span>Batch</span><strong className="num">12kg</strong></li>
      </ul>
      {compact ? <p className="curve__hint">Drag the plot or the slider to run the roast.</p> : null}
    </div>
  )
}
