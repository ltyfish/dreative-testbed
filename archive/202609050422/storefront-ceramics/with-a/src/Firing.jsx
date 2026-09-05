import { useRef, useState, useEffect } from 'react'
import { MAKING } from './data.js'
import { useProgress, prefersReducedMotion } from './useProgress.js'

// The firing.
//
// One photograph — a kiln loaded cold, real, credited — relit across the real
// firing schedule the studio states: fourteen hours up to 1260°C, then a four
// hour hold. Scroll is the clock. The event in the subject is heat, so heat is
// what moves: nothing here slides, fades or parallaxes. Ceramics begin to glow
// dull red somewhere around 600°C, so that is where the light starts.

const RAMP_HOURS = 14
const HOLD_HOURS = 4
const TOTAL = RAMP_HOURS + HOLD_HOURS
const TOP = 1260
const COLD = 20

// Copy stages, keyed to where they belong in the cycle.
const STAGES = [
  { from: 0.0, to: 0.28, label: 'On the wheel', text: MAKING[0] },
  { from: 0.28, to: 0.74, label: 'In the kiln', text: MAKING[1] },
  { from: 0.74, to: 1.01, label: 'And again', text: MAKING[3] },
]

function schedule(p) {
  const hours = p * TOTAL
  const temp = hours <= RAMP_HOURS ? COLD + (TOP - COLD) * (hours / RAMP_HOURS) : TOP
  return { hours, temp }
}

export default function Firing() {
  const stageRef = useRef(null)
  const hourRef = useRef(null)
  const tempRef = useRef(null)
  const barRef = useRef(null)
  const [stage, setStage] = useState(0)
  const [reduced, setReduced] = useState(false)
  const stageIndex = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const set = () => setReduced(mq.matches)
    set()
    mq.addEventListener('change', set)
    return () => mq.removeEventListener('change', set)
  }, [])

  const ref = useProgress((p) => {
    const el = stageRef.current
    if (!el) return
    const { hours, temp } = schedule(p)
    // incandescence: nothing until the ware is hot enough to give off light
    const glow = Math.min(1, Math.max(0, (temp - 560) / (TOP - 560)))
    const soak = Math.min(1, Math.max(0, (p - 0.74) / 0.26))
    el.style.setProperty('--glow', glow.toFixed(4))
    el.style.setProperty('--glow2', (glow * glow).toFixed(4))
    el.style.setProperty('--soak', soak.toFixed(4))
    if (hourRef.current) {
      hourRef.current.textContent =
        hours < RAMP_HOURS
          ? `${hours.toFixed(1)} h`
          : `${(hours - RAMP_HOURS).toFixed(1)} h hold`
    }
    if (tempRef.current) tempRef.current.textContent = `${Math.round(temp)}\u2009°C`
    if (barRef.current) barRef.current.style.setProperty('--p', p.toFixed(4))
    const i = STAGES.findIndex((s) => p >= s.from && p < s.to)
    const next = i === -1 ? STAGES.length - 1 : i
    if (next !== stageIndex.current) {
      stageIndex.current = next
      setStage(next)
    }
  })

  if (reduced) {
    return (
      <section className="firing firing--still" id="firing" aria-labelledby="firing-h">
        <div className="firing__still">
          <img src="/img/kiln-loaded.webp" alt="A kiln packed with unfired pots on stacked shelves, before the door is bricked up." />
        </div>
        <div className="firing__stillbody">
          <h2 id="firing-h" className="h2">The firing</h2>
          <ol className="firing__list">
            {STAGES.map((s) => (
              <li key={s.label}>
                <span className="mono label">{s.label}</span>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <p className="mono firing__sched">
            20&#8201;°C &rarr; 1260&#8201;°C over fourteen hours, then a four hour hold.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="firing" id="firing" ref={ref} aria-labelledby="firing-h">
      <div className="firing__pin">
        <div className="firing__stage" ref={stageRef}>
          <img
            className="firing__img"
            src="/img/kiln-loaded.webp"
            alt="A kiln packed with unfired pots on stacked shelves, before the door is bricked up."
          />
          <div className="firing__heat" aria-hidden="true" />
          <div className="firing__bloom" aria-hidden="true" />
          <div className="firing__soak" aria-hidden="true" />
        </div>

        <div className="firing__ui">
          <div className="firing__head">
            <h2 id="firing-h" className="h2 firing__title">The firing</h2>
            <p className="firing__lede">
              One kiln load. The pots go in cold and come out changed, and this is
              the whole of what happens in between.
            </p>
          </div>

          <div className="firing__readout" ref={barRef}>
            <div className="firing__nums">
              <span className="firing__temp mono" ref={tempRef}>20&#8201;°C</span>
              <span className="firing__hour mono" ref={hourRef}>0.0 h</span>
            </div>
            <div className="firing__track">
              <div className="firing__fill" />
              <div className="firing__hold" title="four hour hold" />
            </div>
            <div className="firing__ticks mono" aria-hidden="true">
              <span>cold</span><span>1000&#8201;°C bisque</span><span>1260&#8201;°C</span><span>hold</span>
            </div>
          </div>

          <div className="firing__stages">
            {STAGES.map((s, i) => (
              <div key={s.label} className={'firing__stagecopy' + (i === stage ? ' is-on' : '')} aria-hidden={i !== stage}>
                <span className="mono label">{s.label}</span>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
