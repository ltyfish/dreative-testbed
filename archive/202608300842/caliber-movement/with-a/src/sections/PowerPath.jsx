import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { POWER_PATH } from '../data.js'

gsap.registerPlugin(ScrollTrigger)

const PLATE = { src: '/media/plate-wide-1900.jpg', w: 1900, h: 2553 }

// The traverse begins on the whole movement — the same framing the hero above
// it ends on — and then goes in. KEYS[0] is that arrival frame; the rest are
// the six stages, in the order energy travels through them.
const ARRIVAL = { cx: 0.47, cy: 0.648, z: 1.06 }
const KEYS = [ARRIVAL, ...POWER_PATH.map((s) => s.frame)]
const SEGMENTS = KEYS.length // one to arrive, one held on each stage
// Proportion of each stop's segment spent held on the subject before the frame
// starts travelling to the next one.
const HOLD = 0.46

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lerp = (a, b, t) => a + (b - a) * t

// The plate is sized to cover the window and centred in it, then moved. It is
// deliberately not `object-fit: cover`: that clips the picture to the element,
// so translating the element drags empty window in behind it.
function coverSize(win, img) {
  const scale = Math.max(win.w / img.w, win.h / img.h)
  return { w: img.w * scale, h: img.h * scale }
}

export default function PowerPath({ reducedMotion }) {
  const rootRef = useRef(null)
  const stickyRef = useRef(null)
  const windowRef = useRef(null)
  const imgRef = useRef(null)
  const videoRef = useRef(null)
  const [active, setActive] = useState(0)
  const readoutRef = useRef(null)
  const stateRef = useRef({ active: 0, travelling: false })

  useLayoutEffect(() => {
    if (reducedMotion) return
    const root = rootRef.current
    const win = windowRef.current
    const img = imgRef.current
    if (!root || !win || !img) return

    const ctx = gsap.context(() => {
      let box = { w: win.clientWidth, h: win.clientHeight }
      let plate = coverSize(box, PLATE)
      const measure = () => {
        box = { w: win.clientWidth, h: win.clientHeight }
        plate = coverSize(box, PLATE)
        gsap.set(img, { width: plate.w, height: plate.h })
      }
      measure()
      const ro = new ResizeObserver(measure)
      ro.observe(win)

      // Narrow windows cannot carry the deepest crops without going soft, so
      // the whole zoom range is pulled back rather than the framing changed.
      const zoomFor = (z) => (box.w < 760 ? 1 + (z - 1) * 0.82 : z)

      const apply = (frame) => {
        if (win.clientWidth !== box.w || win.clientHeight !== box.h) measure()
        const z = zoomFor(frame.z)
        // Keep the scaled plate covering the window: a stop near an edge of the
        // photograph must not drag the photograph's own border into frame.
        const limit = {
          x: Math.max(0, (plate.w * z - box.w) / 2),
          y: Math.max(0, (plate.h * z - box.h) / 2),
        }
        const clamp = (v, m) => Math.max(-m, Math.min(m, v))
        const tx = clamp(-z * (frame.cx - 0.5) * plate.w, limit.x)
        const ty = clamp(-z * (frame.cy - 0.5) * plate.h, limit.y)
        gsap.set(img, { x: tx, y: ty, scale: z, force3D: true })
        if (readoutRef.current) readoutRef.current.textContent = '×' + z.toFixed(1)
      }

      const onProgress = (p) => {
        // One authored value drives the frame, the live stage, the readout and
        // the rail. Nothing in this section reads scroll on its own.
        const raw = Math.min(p, 0.99999) * SEGMENTS
        const i = Math.floor(raw)
        const local = raw - i
        const hold = i === 0 ? 0 : HOLD
        const travel = local <= hold ? 0 : (local - hold) / (1 - hold)
        const from = KEYS[i]
        const to = KEYS[Math.min(i + 1, KEYS.length - 1)]
        const t = easeInOut(travel)
        const stageIndex = Math.max(0, i - 1)
        apply({
          cx: lerp(from.cx, to.cx, t),
          cy: lerp(from.cy, to.cy, t),
          z: lerp(from.z, to.z, t),
        })
        const s = stateRef.current
        const travelling = travel > 0.08 && travel < 0.96
        if (s.active !== stageIndex || s.travelling !== travelling) {
          s.active = stageIndex
          s.travelling = travelling
          setActive(stageIndex)
          root.dataset.travelling = travelling ? 'true' : 'false'
        }
      }

      apply(ARRIVAL)

      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        pin: stickyRef.current,
        pinSpacing: false,
        scrub: true,
        invalidateOnRefresh: true,
        onRefresh: () => measure(),
        onUpdate: (self) => onProgress(self.progress),
      })

      return () => ro.disconnect()
    }, root)

    return () => ctx.revert()
  }, [reducedMotion])

  // The clip only runs while its own stage is the live one.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (POWER_PATH[active]?.live && !reducedMotion) {
      const play = v.play()
      if (play && play.catch) play.catch(() => {})
    } else {
      v.pause()
    }
  }, [active, reducedMotion])

  if (reducedMotion) return <PowerPathStatic />

  const stage = POWER_PATH[active]

  return (
    <section
      className="pp"
      id="power-path"
      ref={rootRef}
      aria-labelledby="pp-title"
      data-travelling="false"
      style={{ height: `${SEGMENTS * 112}vh` }}
    >
      <div className="pp-sticky" ref={stickyRef}>
        <div className="pp-inner">
          <div className="pp-text">
            <p className="eyebrow" id="pp-title">
              <span className="eyebrow-mark" aria-hidden="true" />
              How the energy travels
            </p>

            <ol className="pp-rail" aria-hidden="true">
              {POWER_PATH.map((s, i) => (
                <li
                  key={s.id}
                  className="pp-rail-item"
                  data-state={i === active ? 'live' : i < active ? 'past' : 'ahead'}
                >
                  <span className="pp-rail-tick" />
                  <span className="pp-rail-name">{s.name}</span>
                </li>
              ))}
            </ol>

            <div className="pp-stage" key={stage.id}>
              <p className="pp-stage-index">{stage.index}</p>
              <h3 className="pp-stage-name">{stage.name}</h3>
              <p className="pp-stage-figure">
                <span className="pp-stage-lead">{stage.figureLead}</span>
                <span className="pp-stage-unit">{stage.figureUnit}</span>
              </p>
              <p className="pp-stage-detail">{stage.detail}</p>
              <p className="pp-stage-sight">{stage.sight}</p>
            </div>
          </div>

          <figure className="pp-window" ref={windowRef}>
            <img
              ref={imgRef}
              className="pp-plate"
              src={PLATE.src}
              width={PLATE.w}
              height={PLATE.h}
              alt="A mechanical watch movement, its bridges, wheels and jewelled bearings visible."
              decoding="async"
              fetchPriority="high"
            />
            <div className="pp-loupe" data-live={stage.live ? 'true' : 'false'}>
              <video
                ref={videoRef}
                className="pp-loupe-video"
                src="/media/escapement.webm"
                poster="/media/escapement-poster.jpg"
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="An escapement running."
              />
              <span className="pp-loupe-label">running, 2.5&nbsp;Hz</span>
            </div>
            <figcaption className="pp-readout">
              <span className="pp-readout-key">field</span>
              <span className="pp-readout-val" ref={readoutRef}>&times;1.1</span>
            </figcaption>
            <span className="pp-frame" aria-hidden="true" />
          </figure>
        </div>
      </div>

      <ol className="visually-hidden">
        {POWER_PATH.map((s) => (
          <li key={s.id}>
            {s.name}. {s.detail} {s.figure}.
          </li>
        ))}
      </ol>
    </section>
  )
}

// The static windows are square (see .pp-window-static) and the plate is sized
// to cover one, so it is as wide as the window and R times as tall. Offsets are
// expressed as percentages of the plate itself and clamped the same way the
// scrubbed version clamps, so no stop drags the photograph's edge into view.
const R = PLATE.h / PLATE.w

function staticFrame({ cx, cy, z }) {
  const clamp = (v, m) => Math.max(-m, Math.min(m, v))
  const tx = clamp(-z * (cx - 0.5), Math.max(0, (z - 1) / 2)) / z
  const ty = clamp(-z * (cy - 0.5) * R, Math.max(0, (R * z - 1) / 2)) / (z * R)
  return `scale(${z}) translate(${tx * 100}%, ${ty * 100}%)`
}

// Reduced motion gets six authored stills of the same plate, framed on the same
// six places, rather than the sequence with the animation switched off.
function PowerPathStatic() {
  return (
    <section className="pp pp-static" id="power-path" aria-labelledby="pp-title-static">
      <p className="eyebrow" id="pp-title-static">
        <span className="eyebrow-mark" aria-hidden="true" />
        How the energy travels
      </p>
      <ol className="pp-static-list">
        {POWER_PATH.map((s) => (
          <li className="pp-static-item" key={s.id}>
            <figure className="pp-window pp-window-static">
              <img
                className="pp-plate"
                src={PLATE.src}
                width={PLATE.w}
                height={PLATE.h}
                alt=""
                loading="lazy"
                decoding="async"
                style={{ transform: staticFrame(s.frame) }}
              />
              <span className="pp-frame" aria-hidden="true" />
            </figure>
            <div className="pp-stage">
              <p className="pp-stage-index">{s.index}</p>
              <h3 className="pp-stage-name">{s.name}</h3>
              <p className="pp-stage-figure">
                <span className="pp-stage-lead">{s.figureLead}</span>
                <span className="pp-stage-unit">{s.figureUnit}</span>
              </p>
              <p className="pp-stage-detail">{s.detail}</p>
              <p className="pp-stage-sight">{s.sight}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
