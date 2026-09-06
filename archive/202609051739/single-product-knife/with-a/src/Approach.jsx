// The signature moment.
//
// A buyer cannot tell a £280 knife from a £56 one at the size a product photo
// is printed. So the page does the only thing a photograph cannot: it lets them
// walk up to it. One scroll-driven camera travels twelve times into the blade,
// crossing from a whole-knife frame into a real macro of the same knife at the
// moment the macro can out-resolve the wide shot, and stops on the ground bevel
// where the hand is still visible.

import { useEffect, useRef, useState } from 'react'
import { camera, clamp, FEATURES } from './blade'

const SOURCES = {
  wide: { lg: '/media/blade-wide-5000.webp', sm: '/media/blade-wide-2200.webp' },
  macro: { lg: '/media/blade-macro-3400.webp', sm: '/media/blade-macro-1200.webp' },
}

const PLATE_MARGIN = 40
// 5618px of wide source, shown at 6.5x through the handoff, is 864 CSS pixels
// of plate. Past that the picture is being enlarged past what was photographed.
const MAX_HELD = 864

const REST_PROGRESS = 0.88 // the authored still, for reduced motion

function pickSources() {
  if (typeof window === 'undefined') return { wide: SOURCES.wide.lg, macro: SOURCES.macro.lg }
  const heavy = window.innerWidth > 760
  return {
    wide: heavy ? SOURCES.wide.lg : SOURCES.wide.sm,
    macro: heavy ? SOURCES.macro.lg : SOURCES.macro.sm,
  }
}

export default function Approach() {
  const trackRef = useRef(null)
  const frameRef = useRef(null)
  const wideRef = useRef(null)
  const macroRef = useRef(null)
  const zoomRef = useRef(null)
  const featureRefs = useRef({})
  const stateRef = useRef({ target: 0, value: 0, raf: 0, active: false, zoom: -1 })

  const [srcs] = useState(pickSources)
  const [ready, setReady] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [beat, setBeat] = useState(0)
  const [activeNote, setActiveNote] = useState(null)

  // Both frames are decoded before the moment can be reached. A push-in that
  // arrives at an undecoded macro is the failure this preload exists to avoid.
  useEffect(() => {
    let live = true
    Promise.all(
      [srcs.wide, srcs.macro].map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image()
            img.src = src
            const done = () => resolve()
            if (img.decode) img.decode().then(done, done)
            else {
              img.onload = done
              img.onerror = done
            }
          })
      )
    ).then(() => {
      if (live) setReady(true)
    })
    return () => {
      live = false
    }
  }, [srcs])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    const frame = frameRef.current
    if (!track || !frame) return undefined

    const st = stateRef.current

    // One authored value. Everything in the section reads from it and nothing
    // else, so the labels cannot drift away from the pixels they point at.
    const write = (p) => {
      const c = camera(p)
      const w = wideRef.current
      const m = macroRef.current
      if (w) {
        w.style.transform = `translate3d(${c.wide.x * 100}%, ${c.wide.y * 100}%, 0) scale(${c.zWide})`
        w.style.opacity = String(1 - c.macroOpacity)
      }
      if (m) {
        m.style.transform = `translate3d(${c.macro.x * 100}%, ${c.macro.y * 100}%, 0) scale(${c.zMacro})`
        m.style.opacity = String(c.macroOpacity)
        // While the macro is still smaller than the plate it comes up through
        // the middle of the wide frame rather than cutting in with a visible
        // edge — the picture resolves rather than being replaced.
        const inner = 18 + 82 * c.macroOpacity
        m.style.maskImage = `radial-gradient(circle at 50% 50%, #000 ${inner}%, transparent ${inner + 36}%)`
        m.style.webkitMaskImage = m.style.maskImage
      }

      // The plate is held small while the wide frame is still carrying the
      // picture — that is exactly as large as 5618px of source can honestly be
      // shown at 6.5x. Once the macro has taken over it has resolution to
      // spare, so the frame opens out and the reader ends up inside it.
      const open = clamp((c.e - 0.8) / 0.14)
      const eased = open * open * (3 - 2 * open)
      const capW = window.innerWidth - 2 * PLATE_MARGIN
      const capH = (window.innerHeight - 2 * PLATE_MARGIN) * (16 / 9)
      const held = Math.min(capW * 0.6, capH * 0.86, MAX_HELD)
      const opened = Math.min(window.innerWidth, window.innerHeight * (16 / 9))
      frame.style.setProperty('--plate-w', `${held + (opened - held) * eased}px`)
      frame.style.setProperty('--plate-shift', (1 - eased).toFixed(4))
      // Once the plate is full-bleed the payoff and the licence credit are
      // sitting on the photograph, so the foot of the frame darkens to carry
      // them. Before that they are on the ink ground and need nothing.
      frame.style.setProperty('--open', eased.toFixed(4))

      const box = frame.getBoundingClientRect()
      let active = null

      for (const f of FEATURES) {
        const el = featureRefs.current[f.id]
        if (!el) continue
        // The label is placed from the same camera that moved the picture, so
        // it sits on its feature at every zoom rather than at a guessed spot.
        const fx = c.macro.x + f.x * c.zMacro
        const fy = c.macro.y + f.y * c.zMacro
        const inFrame = fx > 0.06 && fx < 0.94 && fy > 0.06 && fy < 0.94
        el.style.transform = `translate3d(${fx * box.width}px, ${fy * box.height}px, 0)`
        // The label turns to whichever side of its pin has room left in the
        // plate, so it is never cut off by the frame it is annotating.
        el.dataset.h = fx > 0.52 ? 'left' : 'right'
        el.dataset.v = fy > 0.6 ? 'up' : 'down'
        const shown = inFrame && c.e >= f.from && c.e < f.to
        el.dataset.shown = shown ? 'true' : 'false'
        if (shown) active = f
      }

      setActiveNote((prev) => (prev === active ? prev : active))

      const zoom = Math.round(c.zWide * 10) / 10
      if (zoom !== st.zoom && zoomRef.current) {
        st.zoom = zoom
        zoomRef.current.textContent = zoom.toFixed(1)
      }
      const next = c.e < 0.22 ? 0 : c.e < 0.62 ? 1 : c.e < 0.9 ? 2 : 3
      setBeat((prev) => (prev === next ? prev : next))
    }

    if (reduced) {
      write(REST_PROGRESS)
      const onResize = () => write(REST_PROGRESS)
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    const measure = () => {
      const rect = track.getBoundingClientRect()
      const span = rect.height - window.innerHeight
      st.target = span > 0 ? clamp(-rect.top / span) : 0
    }

    const tick = () => {
      // Smoothed toward the scroll position rather than snapped to it: the
      // push-in glides, and native scrolling is left alone.
      st.value += (st.target - st.value) * 0.14
      if (Math.abs(st.target - st.value) < 0.0004) st.value = st.target
      write(st.value)
      st.raf = st.active ? requestAnimationFrame(tick) : 0
    }

    const start = () => {
      if (st.active) return
      st.active = true
      st.raf = requestAnimationFrame(tick)
    }

    const stop = () => {
      st.active = false
      if (st.raf) cancelAnimationFrame(st.raf)
      st.raf = 0
    }

    const onScroll = () => {
      measure()
      start()
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          measure()
          start()
        } else {
          measure()
          st.value = st.target
          write(st.value)
          stop()
        }
      },
      { rootMargin: '20% 0px' }
    )
    io.observe(track)

    measure()
    st.value = st.target
    write(st.value)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      io.disconnect()
      stop()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [reduced, ready])

  return (
    <section
      className="approach"
      ref={trackRef}
      data-reduced={reduced ? 'true' : 'false'}
      aria-labelledby="approach-title"
    >
      <div className="approach__stage" data-beat={beat}>
        <div className="approach__frame" ref={frameRef}>
          <div className="approach__layers" aria-hidden="true">
            <img className="approach__layer" ref={wideRef} src={srcs.wide} alt="" decoding="async" />
            <img className="approach__layer" ref={macroRef} src={srcs.macro} alt="" decoding="async" />
          </div>

          <div className="approach__scrim" aria-hidden="true" />

          <div className="approach__notes" aria-hidden="true">
            {FEATURES.map((f) => (
              <figure
                key={f.id}
                className="note"
                data-shown="false"
                ref={(el) => {
                  featureRefs.current[f.id] = el
                }}
              >
                <span className="note__pin" />
                <figcaption className="note__body">
                  <span className="note__label">{f.label}</span>
                  <span className="note__text">{f.note}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* On a phone the plate is a 219px band; a floating label would be
            taller than the picture it points at. So the pin stays on the
            feature and its text moves to a caption under the frame. */}
        <div className="approach__caption" data-shown={activeNote ? 'true' : 'false'} aria-hidden="true">
          <span className="note__label">{activeNote ? activeNote.label : ''}</span>
          <span className="note__text">{activeNote ? activeNote.note : ''}</span>
        </div>

        <p className="approach__alt">
          A 210mm kurouchi gyuto photographed whole, then at the heel: black forge scale across the
          upper blade, a bright hand-ground bevel along the edge, and an irregular line where the two
          meet.
        </p>

        <div className="approach__copy" data-beat={beat}>
          <p className="approach__eyebrow">Kaji No.7 &mdash; 210mm</p>
          <h1 className="approach__title" id="approach-title">
            <span>At arm&rsquo;s length</span>
            <span>every knife</span>
            <span>looks like this one.</span>
          </h1>
          <p className="approach__lede">
            So walk up to it. Nothing you are about to see is a photograph of a different knife. It
            is this one, closer.
          </p>
          <p className="approach__cue">Scroll</p>
        </div>

        <p className="approach__payoff" data-beat={beat}>
          Every mark here was put there by a person, one blade at a time. A factory grinds this face
          flat and identical, four thousand times a day, and leaves nothing on it to look at.
          <span>That is the &pound;280.</span>
        </p>

        <div className="approach__hud">
          <span className="hud__key">life size</span>
          <span className="hud__value">
            &times;<span ref={zoomRef}>1.0</span>
          </span>
        </div>

        <p className="approach__credit">
          Moritaka Hamono gy&#363;t&#333;, photographed by Frank Schulenburg. CC&nbsp;BY-SA&nbsp;4.0,
          via Wikimedia Commons. Graded and re-framed for this page.
        </p>
      </div>
      <div className="approach__loading" data-ready={ready ? 'true' : 'false'} aria-hidden="true" />
    </section>
  )
}
