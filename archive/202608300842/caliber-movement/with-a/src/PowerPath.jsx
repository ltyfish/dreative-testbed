import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { POWER_PATH } from './data.js'
import { applyView, lerpView, easeInOut, prefersReducedMotion } from './loupe.js'

gsap.registerPlugin(ScrollTrigger)

const LAST = POWER_PATH.length - 1

// Desktop: the section is pinned and one scroll value drives everything —
// the crop, the stage, the readout, the rail. Mobile: the same value, set a
// stop at a time by the reader, because six pinned screens on a phone is a
// trap. There is only ever one progress number.
export default function PowerPath() {
  const section = useRef(null)
  const pin = useRef(null)
  const box = useRef(null)
  const img = useRef(null)
  const clip = useRef(null)
  const [stage, setStage] = useState(0)
  const [travel, setTravel] = useState(0)
  const [stepped, setStepped] = useState(false)
  const progress = useRef({ p: 0 })

  // One place where a progress value becomes a rendered frame.
  const render = (p) => {
    const raw = Math.min(LAST, Math.max(0, p * LAST))
    const i = Math.min(LAST - 1, Math.floor(raw))
    const t = easeInOut(raw - i)
    applyView(img.current, box.current, lerpView(POWER_PATH[i].view, POWER_PATH[i + 1].view, t))
    const active = Math.round(raw)
    setStage((s) => (s === active ? s : active))
    setTravel(raw / LAST)
  }

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()

    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      setStepped(false)
      const st = ScrollTrigger.create({
        trigger: section.current,
        start: 'top top',
        end: 'bottom bottom',
        pin: pin.current,
        pinSpacing: false,
        scrub: 0.35,
        onUpdate: (self) => {
          progress.current.p = self.progress
          render(self.progress)
        },
        onRefresh: () => render(progress.current.p),
      })
      render(progress.current.p)
      return () => st.kill()
    })

    mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => {
      setStepped(true)
      render(progress.current.p)
      const onResize = () => render(progress.current.p)
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    })

    return () => mm.revert()
  }, [])

  // Stepped mode: tween the same progress value so the travel between two
  // stops is the same camera move it is on the desktop scrub.
  const goTo = (index) => {
    const target = index / LAST
    if (prefersReducedMotion()) {
      progress.current.p = target
      render(target)
      return
    }
    gsap.to(progress.current, {
      p: target,
      duration: 0.9,
      ease: 'power2.inOut',
      overwrite: true,
      onUpdate: () => render(progress.current.p),
    })
  }

  const current = POWER_PATH[stage]
  const live = !!current.live

  // The clip runs only while the escapement and balance are on screen.
  useEffect(() => {
    const v = clip.current
    if (!v) return
    if (live) v.play().catch(() => {})
    else v.pause()
  }, [live])

  return (
    <section
      className="path"
      id="power-path"
      ref={section}
      aria-labelledby="path-title"
      style={stepped ? undefined : { height: `${(POWER_PATH.length + 1) * 100}vh` }}
    >
      <div className="path-pin" ref={pin}>
        <div className="path-inner">
          <header className="path-head">
            <p className="eyebrow">Section 01 — the power path</p>
            <h2 id="path-title" className="path-title">
              Where the energy goes
            </h2>
            <p className="path-lede">
              Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five
              times a second, for three days from a single wind. Follow it in the order it travels.
            </p>
          </header>

          <div className="loupe-wrap">
            <div className="loupe" ref={box}>
              <img
                ref={img}
                className="loupe-img"
                src="/media/plate.jpg"
                alt="A complete manual-winding movement, photographed from the bridge side."
                decoding="async"
                fetchPriority="high"
              />
              <video
                ref={clip}
                className={`loupe-clip${live ? ' is-live' : ''}`}
                src="/media/escapement.webm"
                poster="/media/escapement-poster.jpg"
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
              <div className="loupe-frame" aria-hidden="true">
                <span className="loupe-corner tl" />
                <span className="loupe-corner tr" />
                <span className="loupe-corner bl" />
                <span className="loupe-corner br" />
              </div>
              <p className="loupe-caption">{current.look}</p>
            </div>

            <div className="travel" aria-hidden="true">
              <span className="travel-label">from the mainspring</span>
              <span className="travel-track">
                <span className="travel-fill" style={{ transform: `scaleX(${travel})` }} />
              </span>
              <span className="travel-label right">to the hands</span>
            </div>
          </div>

          <div className="path-readout">
            <p className="path-index">
              <span className="mono">{String(stage + 1).padStart(2, '0')}</span>
              <span className="path-index-of">/ 06</span>
            </p>
            <h3 className="path-stage">{current.name}</h3>
            <p className="path-detail">{current.detail}</p>
            <p className="path-figure mono">{current.figure}</p>
          </div>

          <ol className="path-rail">
            {POWER_PATH.map((s, i) => (
              <li key={s.id} className={i === stage ? 'is-on' : ''}>
                <button
                  type="button"
                  onClick={() => (stepped ? goTo(i) : jumpTo(section.current, i))}
                  aria-current={i === stage ? 'step' : undefined}
                >
                  <span className="rail-tick" aria-hidden="true" />
                  <span className="rail-name">{s.name}</span>
                  <span className="rail-figure mono">{s.short}</span>
                </button>
              </li>
            ))}
          </ol>

          {stepped && (
            <div className="path-steps">
              <button type="button" onClick={() => goTo(Math.max(0, stage - 1))} disabled={stage === 0}>
                ← Back
              </button>
              <button
                type="button"
                onClick={() => goTo(Math.min(LAST, stage + 1))}
                disabled={stage === LAST}
              >
                Next stage →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// On the pinned desktop version the rail is a way of scrolling, not a separate
// state: it moves the page to the scroll position that stop lives at.
function jumpTo(sectionEl, i) {
  if (!sectionEl) return
  const rect = sectionEl.getBoundingClientRect()
  const top = rect.top + window.scrollY
  const scrollable = sectionEl.offsetHeight - window.innerHeight
  window.scrollTo({ top: top + (scrollable * i) / LAST, behavior: 'smooth' })
}
