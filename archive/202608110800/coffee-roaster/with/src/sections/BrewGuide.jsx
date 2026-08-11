import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import brewBloom from '../media/brew-bloom.jpg'
import brewPour from '../media/brew-pour.jpg'
import { STEPS } from '../data.js'
import { prefersReducedMotion } from '../roast.jsx'

gsap.registerPlugin(ScrollTrigger)

// The four steps placed on the real clock the copy describes: two dry steps
// before any water, a 30-second bloom, then 2.5 minutes of pouring. The bloom
// occupies exactly 30/180 of the wet part of the track.
const MARKS = [0.05, 0.14, 0.22, 0.35]
const WATER = 0.22

export default function BrewGuide() {
  const root = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = root.current
    if (!el) return

    if (prefersReducedMotion()) {
      setProgress(1)
      el.style.setProperty('--brew', '1')
      return
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el.querySelector('[data-brew-clock]'),
        start: 'top 85%',
        end: 'bottom 55%',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress
          el.style.setProperty('--brew', String(p))
          setProgress(p)
        },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  const wet = progress >= WATER
  const activeIndex = MARKS.reduce((acc, m, i) => (progress >= m ? i : acc), 0)
  const elapsed = Math.max(0, (progress - WATER) / (1 - WATER)) * 180
  const clock = wet
    ? `${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, '0')}`
    : '—:––'

  return (
    <section className="section brew" id="brew-guide" ref={root} data-wet={wet ? 'true' : 'false'}>
      <div className="brew-head">
        <p className="section-eyebrow">Brew guide</p>
        <h2 className="section-title">Brew guide: pour over in four steps</h2>
        <p className="brew-lede">
          Laid out on the clock it actually runs on. Two steps happen before any water; the bloom
          takes thirty seconds; the pour takes the remaining two and a half minutes.
        </p>
      </div>

      <div className="brew-clock" data-brew-clock>
        <div className="brew-media" aria-hidden="true">
          <span className="brew-media-dry">
            <span className="brew-media-dry-text">Dry — no water yet</span>
          </span>
          <img className="brew-shot brew-shot--bloom" src={brewBloom} alt="" loading="lazy" />
          <img className="brew-shot brew-shot--pour" src={brewPour} alt="" loading="lazy" />
        </div>

        <div className="brew-axis">
          <span className="brew-axis-line" aria-hidden="true">
            <span className="brew-axis-fill" />
            <span className="brew-axis-head" />
          </span>

          <span className="brew-axis-mark brew-axis-mark--water" aria-hidden="true">
            <b>0:00</b>
            <i>water hits the bed</i>
          </span>
          <span className="brew-axis-mark brew-axis-mark--end" aria-hidden="true">
            <b>3:00</b>
            <i>cup is done</i>
          </span>
          <span className="brew-axis-clock" aria-hidden="true">
            {clock}
          </span>
        </div>

        <ol className="brew-steps">
          {STEPS.map((s, i) => (
            <li
              className={`brew-step${i <= activeIndex ? ' is-reached' : ''}${
                i === activeIndex ? ' is-current' : ''
              }`}
              key={s.n}
              data-step={s.n}
              style={{ '--mark': MARKS[i] }}
            >
              <span className="brew-step-stem" aria-hidden="true" />
              <p className="brew-step-clock">{s.clock}</p>
              <h3 className="brew-step-title">
                <span className="brew-step-number">{s.n}</span>
                {s.title}
              </h3>
              <p className="brew-step-body">{s.body}</p>
              <p className="brew-step-metric">{s.metric}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
