import { useEffect, useRef, useState } from 'react'
import { createLoom } from './loom.js'

// The signature moment. One scroll progress drives it end to end:
//   0.00 inside the cloth, thread by thread
//   0.14 the weave closes up while an editorial frame draws in around the garment
//   0.56 held: the Chore Jacket, sharp, beside its name
//   0.74 the frame hands itself to the first tile of the shop
//   0.80 the rest of the row arrives still woven and resolves in place
// Every destination is a measured DOM rectangle, so the scene lands on the real markup.

export const ROW = [
  { id: 'chore', src: '/garment-chore.webp', name: 'Chore Jacket', category: 'Outerwear', price: 165, fabric: '12oz cotton canvas, unlined' },
  { id: 'oxford', src: '/garment-oxford.webp', name: 'The Oxford Shirt', category: 'Shirts', price: 78, fabric: '100% long-staple cotton oxford, 140gsm' },
  { id: 'jean', src: '/garment-jean.webp', name: 'Straight Jean', category: 'Trousers', price: 98, fabric: '13.5oz rigid cotton denim, selvedge' },
  { id: 'knit', src: '/garment-knit.webp', name: 'Lambswool Crew', category: 'Knitwear', price: 135, fabric: '100% lambswool, spun in Scotland' },
]

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
const range = (p, a, b) => clamp((p - a) / (b - a || 1))
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)
const mix = (a, b, t) => a + (b - a) * t
const mixRect = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t), mix(a[3], b[3], t)]

export default function LoomScene() {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const mediaRefs = useRef([])
  const heroTypeRef = useRef(null)
  const captionRef = useRef(null)
  const shopRef = useRef(null)

  const [ready, setReady] = useState(false)
  const [still, setStill] = useState(false)   // reduced motion, or no WebGL2

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const stage = stageRef.current
    const canvas = canvasRef.current
    let loom = null
    let raf = 0, alive = true
    let target = 0, current = 0, last = performance.now(), settled = false
    let handedOff = null

    const goStill = () => {
      document.documentElement.classList.add('scene-still')
      setStill(true); setReady(true)
    }
    if (mq.matches) { goStill(); return }

    loom = createLoom(canvas)
    if (!loom) { goStill(); return }

    let cancelled = false
    Promise.all(ROW.map((g) => new Promise((res, rej) => {
      const img = new Image()
      img.onload = () => res([g.id, img])
      img.onerror = rej
      img.src = g.src
    }))).then((pairs) => {
      if (cancelled) return
      for (const [id, img] of pairs) loom.loadTexture(id, img)
      setReady(true)
      start()
    }).catch(goStill)

    let W = 0, H = 0
    const measure = () => {
      W = window.innerWidth; H = window.innerHeight
      loom.resize(W, H, Math.min(window.devicePixelRatio || 1, 2))
      settled = false
    }

    const rectOf = (el) => {
      const r = el.getBoundingClientRect()
      return [r.left, r.top, r.width, r.height]
    }

    const draw = (p) => {
      const frame = rectOf(frameRef.current)
      const tiles = mediaRefs.current.map(rectOf)
      const full = [0, 0, W, H]

      // hero: cloth -> framed garment -> the first tile of the shop
      const open = easeInOut(range(p, 0.10, 0.44))
      const flip = easeInOut(range(p, 0.70, 0.87))
      let rect = mixRect(full, frame, open)
      rect = mixRect(rect, tiles[0], flip)

      const zoom = mix(6.5, 1.0, easeOut(range(p, 0.02, 0.42)))
      const cellP = easeInOut(range(p, 0.22, 0.64))
      const quads = [{
        key: ROW[0].id,
        rect,
        focal: [mix(0.415, 0.5, easeInOut(range(p, 0, 0.44))), mix(0.60, 0.5, easeInOut(range(p, 0, 0.44)))],
        zoom: mix(zoom, 1.0, flip),
        cell: mix(30, 1, cellP),
        amp: 1 - easeInOut(range(p, 0.22, 0.62)),
        alpha: 1 - range(p, 0.96, 0.975),
        grain: 1,
      }]

      // the rest of the row arrives woven and resolves where it lands
      for (let i = 1; i < ROW.length; i++) {
        const stagger = (i - 1) * 0.03
        const rise = easeOut(range(p, 0.74 + stagger, 0.92 + stagger))
        const r = tiles[i].slice()
        r[1] += (1 - rise) * 64
        quads.push({
          key: ROW[i].id,
          rect: r,
          focal: [0.5, 0.5],
          zoom: 1,
          cell: mix(18, 1, easeInOut(range(p, 0.75 + stagger, 0.93 + stagger))),
          amp: 1 - easeInOut(range(p, 0.75 + stagger, 0.91 + stagger)),
          alpha: range(p, 0.72 + stagger, 0.80 + stagger) * (1 - range(p, 0.96, 0.975)),
          grain: 0.6,
        })
      }
      loom.render(quads)

      // ground: the shop arrives in daylight, the cloth was seen in the dark
      stage.style.setProperty('--ground', String(easeInOut(range(p, 0.24, 0.50))))
      stage.style.setProperty('--frame-in', String(range(p, 0.10, 0.24) * (1 - range(p, 0.66, 0.76))))
      // faded copy must stop taking clicks, or it covers the shop row it just handed to
      const heroIn = 1 - range(p, 0.34, 0.46)
      const capIn = range(p, 0.50, 0.60) * (1 - range(p, 0.72, 0.80))
      heroTypeRef.current.style.setProperty('--in', String(heroIn))
      captionRef.current.style.setProperty('--in', String(capIn))
      heroTypeRef.current.classList.toggle('is-spent', heroIn < 0.02)
      captionRef.current.classList.toggle('is-spent', capIn < 0.02)
      const shopIn = range(p, 0.74, 0.90)
      shopRef.current.style.setProperty('--in', String(shopIn))
      shopRef.current.classList.toggle('is-live', shopIn > 0.001)

      // hand the row to the real markup once it has landed, so the shop is DOM again
      const done = p > 0.96
      if (done !== handedOff) {
        handedOff = done
        stage.classList.toggle('is-handed-off', done)
        // the row is not there yet as far as anyone is concerned: keep it out of
        // the tab order until it has actually landed
        shopRef.current.inert = !done
      }
    }

    const onScroll = () => {
      const el = sectionRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const travel = r.height - window.innerHeight
      target = clamp(travel > 0 ? -r.top / travel : 0)
      settled = false
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) }
    }

    const tick = (now) => {
      raf = 0
      if (!alive) return
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      // time-based damping: fast scrolling still tracks, small moves stay smooth
      current += (target - current) * (1 - Math.exp(-dt / 0.055))
      if (Math.abs(target - current) < 0.0004) { current = target; settled = true }
      draw(current)
      if (!settled) raf = requestAnimationFrame(tick)
    }

    function start() {
      shopRef.current.inert = true
      measure()
      onScroll()
      current = target
      draw(current)
      settled = true
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)
    }
    const onResize = () => { measure(); onScroll(); current = target; draw(current); settled = true }

    return () => {
      document.documentElement.classList.remove('scene-still')
      cancelled = true; alive = false
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      loom?.dispose()
    }
  }, [])

  return (
    <section className={`loom${still ? ' loom--still' : ''}${ready ? ' is-ready' : ''}`} ref={sectionRef}>
      <div className="loom__stage" ref={stageRef}>
        <canvas className="loom__canvas" ref={canvasRef} aria-hidden="true" />

        <div className="loom__frame" ref={frameRef}>
          {/* shown only when the scene is still: reduced motion, or no WebGL2 */}
          <img src={ROW[0].src} alt="Chore Jacket, shown as a flat lay in 12oz indigo cotton canvas" />
        </div>

        <div className="loom__hero" ref={heroTypeRef}>
          <p className="loom__eyebrow">Marlow &amp; Vale — Autumn</p>
          <h1 className="loom__title">Cloth<span>first,</span><em>then</em> the garment</h1>
          <p className="loom__lede">
            {still
              ? 'Every picture on this page is woven from the cloth the garment is cut from. This is 12oz cotton canvas, shown closed up.'
              : 'You are looking at 12oz cotton canvas at the width of a thread. Keep scrolling and the weave closes up into the jacket it was cut into.'}
          </p>
        </div>

        <figure className="loom__caption" ref={captionRef}>
          <figcaption>
            <span className="loom__cat">Outerwear</span>
            <span className="loom__name">Chore Jacket</span>
            <span className="loom__fab">12oz cotton canvas, unlined. Indigo or Sand.</span>
            <span className="loom__price">£165</span>
          </figcaption>
        </figure>

        <div className="loom__shop" ref={shopRef}>
          <div className="shop__head">
            <h2>Straight off the loom</h2>
            <p>Four of the nine. The rest are just below.</p>
          </div>
          <ul className="shop__row">
            {ROW.map((g, i) => (
              <li className="tile" key={g.id}>
                <a className="tile__link" href={`#g-${g.id}`}>
                  <div className="tile__media" ref={(el) => { mediaRefs.current[i] = el }}>
                    <img src={g.src} alt={`${g.name}, shown as a flat lay in ${g.fabric}`} />
                  </div>
                  <div className="tile__meta">
                    <span className="tile__name">{g.name}</span>
                    <span className="tile__cat">{g.category}</span>
                    <span className="tile__price">£{g.price}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <p className="shop__note">
            Garment images are made from the cloth each piece is cut from. They represent the
            garments; they are not photographs of stock.
          </p>
        </div>
      </div>
    </section>
  )
}
