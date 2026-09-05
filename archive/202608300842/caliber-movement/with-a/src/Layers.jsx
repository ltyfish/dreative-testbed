import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { LAYERS } from './data'
import { applyLoupe } from './loupe'
import { prefersReduced } from './reveal'
import { useReveal } from './reveal'

const TOTAL = LAYERS.reduce((s, l) => s + l.mm, 0) // 3.8mm, which is the spec

// The same loupe as the power path, driven by a different value: here it is
// which layer you picked, not how far you scrolled. Beside it, the four layers
// drawn edge-on at their real relative thicknesses — the one thing a
// photograph of a movement cannot show you.
export default function Layers() {
  const frameRef = useRef(null)
  const imgRef = useRef(null)
  const current = useRef({ ...LAYERS[1].focus })
  const [index, setIndex] = useState(1)
  const sectionRef = useReveal()

  const render = () => applyLoupe(frameRef.current, imgRef.current, current.current)

  useLayoutEffect(() => {
    const img = imgRef.current
    const onReady = () => render()
    if (img.complete) onReady()
    else img.addEventListener('load', onReady, { once: true })
    window.addEventListener('resize', render)
    return () => {
      window.removeEventListener('resize', render)
      img.removeEventListener('load', onReady)
    }
  }, [])

  const select = (i) => {
    setIndex(i)
    const to = LAYERS[i].focus
    if (prefersReduced()) {
      current.current = { ...to }
      render()
      return
    }
    gsap.to(current.current, { ...to, duration: 0.8, ease: 'power3.inOut', onUpdate: render })
  }

  const layer = LAYERS[index]

  return (
    <section className="layers" id="layers" ref={sectionRef} aria-labelledby="layers-title">
      <div className="layers-inner">
        <header className="layers-head">
          <div>
            <p className="label">Front to back</p>
            <h2 id="layers-title" className="display">
              Four layers, three point eight millimetres.
            </h2>
          </div>
          <p className="lede">
            The movement is built up from one surface. Every pivot in it is located from
            the main plate, which is why that plate is the thickest thing here and the
            only one finished before anything is mounted on it. Pick a layer to look at
            the part of the movement it carries.
          </p>
        </header>

        <div className="layers-body">
          <figure className="layers-frame" ref={frameRef}>
            <img
              ref={imgRef}
              src="/media/bench.jpg"
              srcSet="/media/bench-sm.jpg 1200w, /media/bench.jpg 2400w"
              sizes="(max-width: 899px) 100vw, 52vw"
              alt="A mechanical movement taken apart on a bench: main plate, balance cock, balance wheel and hairspring, escape wheel, train wheels and a screw, beside a match head for scale."
              draggable="false"
            />
            <figcaption className="mono">{layer.look}</figcaption>
          </figure>

          <div className="layers-stack">
            <p className="mono stack-scale" aria-hidden="true">
              Section, to scale
            </p>
            <ul className="stack" role="list">
              {LAYERS.map((l, i) => (
                <li
                  key={l.id}
                  style={{ '--mm': l.mm, '--share': l.mm / TOTAL }}
                  data-current={i === index ? 'true' : 'false'}
                >
                  <button
                    type="button"
                    className="stack-btn"
                    onClick={() => select(i)}
                    aria-pressed={i === index}
                  >
                    <span className="stack-plate" aria-hidden="true" />
                    <span className="stack-label">
                      <span className="stack-name">{l.name}</span>
                      <span className="stack-mm mono">{l.thickness}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="stack-total mono">
              <span>Total height</span>
              <span>3.8mm</span>
            </p>
            <p className="layers-note">{layer.note}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
