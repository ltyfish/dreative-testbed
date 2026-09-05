import { useLayoutEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../lib/motion.js'
import { MAKING, GLAZES } from '../data.js'

// The firing curve. One authored progress value drives the drawn curve, the
// temperature readout, the heat in the kiln photograph, and which line of the
// making statement is being read.
const Y0 = 420
const TOP = 1300
const y = (t) => Y0 - (t / TOP) * 360

// Firing one: bisque to 1000°C. Then the glazing gap. Then firing two:
// fourteen hours up to 1260°C and a four hour hold.
const PATH = [`M 60 ${y(20)}`, `C 150 ${y(20)} 190 ${y(620)} 260 ${y(1000)}`, `L 300 ${y(1000)}`, `C 340 ${y(1000)} 380 ${y(240)} 420 ${y(40)}`].join(' ')
const PATH2 = [`M 520 ${y(40)}`, `C 640 ${y(120)} 780 ${y(900)} 900 ${y(1260)}`, `L 1030 ${y(1260)}`, `C 1080 ${y(1260)} 1120 ${y(700)} 1160 ${y(360)}`].join(' ')

const BEATS = [
  { text: MAKING[0], from: 0, to: 0.34 },
  { text: MAKING[1], from: 0.34, to: 0.66 },
  { text: MAKING[2], from: 0.66, to: 1.01 },
]

export default function Firing({ reduced, glaze }) {
  const root = useRef(null)
  const p1 = useRef(null)
  const p2 = useRef(null)
  const [readout, setReadout] = useState({ temp: 20, stage: 'The kiln is cold' })
  const [heat, setHeat] = useState(0)
  const [beat, setBeat] = useState(0)

  useLayoutEffect(() => {
    const el = root.current
    const a = p1.current
    const b = p2.current
    const la = a.getTotalLength()
    const lb = b.getTotalLength()
    gsap.set(a, { strokeDasharray: la })
    gsap.set(b, { strokeDasharray: lb })

    const apply = (prog) => {
      const pa = gsap.utils.clamp(0, 1, prog / 0.42)
      const pb = gsap.utils.clamp(0, 1, (prog - 0.5) / 0.44)
      gsap.set(a, { strokeDashoffset: la * (1 - pa) })
      gsap.set(b, { strokeDashoffset: lb * (1 - pb) })
      const active = pb > 0 ? b : a
      const len = pb > 0 ? lb * pb : la * pa
      const pt = active.getPointAtLength(Math.max(len, 0.01))
      const temp = Math.max(20, Math.round(((Y0 - pt.y) / 360) * TOP))
      let stage = 'The kiln is cold'
      if (prog > 0.02 && prog < 0.3) stage = 'First firing — bisque'
      else if (prog >= 0.3 && prog < 0.42) stage = 'Cooling'
      else if (prog >= 0.42 && prog < 0.5) stage = 'Glazed by hand'
      else if (prog >= 0.5 && prog < 0.78) stage = 'Second firing — fourteen hours up'
      else if (prog >= 0.78 && prog < 0.92) stage = 'Four hour hold'
      else if (prog >= 0.92) stage = 'Cooling — two days before it is opened'
      setReadout({ temp: prog < 0.02 ? 20 : temp, stage })
      setHeat(gsap.utils.clamp(0, 1, temp / 1260))
      setBeat(BEATS.findIndex((s) => prog >= s.from && prog < s.to))
    }

    if (reduced) {
      apply(0.86)
      setBeat(-1)
      return
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        pin: el.querySelector('.firing__stage'),
        pinSpacing: false,
        scrub: true,
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      })
    }, el)
    return () => ctx.revert()
  }, [reduced])

  return (
    <>
      <section className="firing" id="making" ref={root} aria-labelledby="firing-h">
        <div className="firing__stage">
          <img className="firing__kiln" src="/media/kiln.webp" alt="Flame inside the firebox of a kiln" />
          <div className="firing__heat" style={{ opacity: 0.12 + heat * 0.72, transform: `translate(-50%, -50%) scale(${1 + heat * 0.45})` }} />
          <div className="firing__grid">
            <div className="firing__head">
              <p className="eyebrow">The making</p>
              <h2 id="firing-h">Two firings, and a hold at the top</h2>
            </div>
            <div className="firing__readout" aria-live="polite">
              <span className="firing__temp">
                {readout.temp}
                <span className="firing__deg">°C</span>
              </span>
              <span className="firing__stagename">{readout.stage}</span>
            </div>
            <div className="firing__narr">
              {BEATS.map((s, i) => (
                <p className={`firing__beat ${beat === i || beat === -1 ? 'is-on' : ''}`} key={i}>
                  {s.text}
                </p>
              ))}
            </div>
            <svg
              className="firing__chart"
              viewBox="0 0 1220 470"
              role="img"
              aria-label="The firing schedule: bisque to 1000°C, then a second firing to 1260°C over fourteen hours with a four hour hold."
            >
              <g className="firing__axis">
                {[400, 800, 1200].map((t) => (
                  <g key={t}>
                    <line x1="60" x2="1180" y1={y(t)} y2={y(t)} />
                    <text x="40" y={y(t) + 5} textAnchor="end">
                      {t}
                    </text>
                  </g>
                ))}
              </g>
              <path className="firing__ghost" d={PATH} />
              <path className="firing__ghost" d={PATH2} />
              <path className="firing__line" ref={p1} d={PATH} />
              <path className="firing__line" ref={p2} d={PATH2} />
              <g className="firing__marks">
                <line className="firing__gap" x1="425" x2="515" y1={y(40)} y2={y(40)} />
                <text x="470" y={y(40) - 14} textAnchor="middle">
                  glazed by hand
                </text>
                <text x="280" y={y(1000) - 16} textAnchor="middle">
                  1000°C bisque
                </text>
                <text x="965" y={y(1260) - 16} textAnchor="middle">
                  1260°C · four hour hold
                </text>
                <text x="700" y={y(1150)} textAnchor="middle">
                  fourteen hours
                </text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      <section className="afterfire" aria-label="Out of the firing">
        <div className="firing__out" data-reveal>
          <p className="firing__outlead">Three pieces out of one firing, in the three glazes.</p>
          <ul className="firing__trio">
            {GLAZES.map((g) => (
              <li key={g.id} className={g.id === glaze ? 'is-chosen' : ''}>
                <img src={`/media/glaze-${g.id}.webp`} alt={`A piece glazed in ${g.name}`} loading="lazy" />
                <span>{g.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="firing__restock" data-reveal>
          <img src="/media/greenware.webp" alt="Racks of unfired pots drying in the studio" loading="lazy" />
          <p>{MAKING[3]}</p>
        </div>
      </section>
    </>
  )
}
