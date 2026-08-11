import { useEffect, useRef, useState } from 'react'
import { BEANS, ROASTS } from '../data.js'
import { prefersReducedMotion, useRoast } from '../roast.jsx'

const countFor = (id) => BEANS.filter((b) => b.roast.toLowerCase() === id).length

/**
 * The signature component. Four macro photographs of the same coffee at four
 * points in the drum, and the six coffees Northwind sells docked at the exact
 * point their roast is stopped. Picking a rung re-grades the whole site.
 */
export default function RoastLadder() {
  const { roast, setRoast, pinned } = useRoast()
  const [played, setPlayed] = useState(false)
  const root = useRef(null)

  // On first sight the ladder runs the roast once — green to dark — then
  // settles on Medium, which is where three of the six coffees live.
  useEffect(() => {
    const el = root.current
    if (!el || played) return

    if (prefersReducedMotion()) {
      setPlayed(true)
      return
    }

    let timers = []
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        setPlayed(true)
        if (pinned) return
        const order = ['green', 'light', 'medium', 'dark', 'medium']
        order.forEach((id, i) => {
          timers.push(setTimeout(() => setRoast(id, { silent: true }), i * 620))
        })
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [played, pinned, setRoast])

  const activeIndex = ROASTS.findIndex((r) => r.id === roast)
  const stage = ROASTS[activeIndex] || ROASTS[2]

  // Hold the rung we came from so the cross-fade has something to fade over.
  const prevRef = useRef(stage)
  const previous = prevRef.current
  useEffect(() => {
    prevRef.current = stage
  }, [stage])

  const onKeyDown = (e) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const next = ROASTS[(activeIndex + dir + ROASTS.length) % ROASTS.length]
    setRoast(next.id)
    root.current?.querySelector(`[data-rung="${next.id}"]`)?.focus()
  }

  return (
    <section className="section ladder" id="roast-ladder" ref={root}>
      <div className="ladder-head">
        <p className="section-eyebrow">The drum</p>
        <h2 className="section-title">
          Everything here is decided by <em>when we stop.</em>
        </h2>
        <p className="ladder-lede">
          The same bean, four minutes apart. Pick where the drum stops and the rest of this page —
          the catalogue, the box, the colour of the ink — follows you there.
        </p>
      </div>

      <div className="ladder-stage">
        {/* Two layers: the rung you left is held underneath while the rung you
            picked fades up over it, so the drum reads as continuing rather
            than cutting. */}
        <img
          className="ladder-shot ladder-shot--under"
          src={previous.photo}
          alt=""
          aria-hidden="true"
          data-ladder-shot={previous.id}
        />
        <img
          key={stage.id}
          className="ladder-shot ladder-shot--over"
          src={stage.photo}
          alt={stage.photoAlt}
          data-ladder-shot={stage.id}
          data-ladder-current
        />
        <div className="ladder-stage-grade" aria-hidden="true" />

        <div className="ladder-readout" data-ladder-readout>
          <p className="ladder-readout-stage">{stage.label}</p>
          <p className="ladder-readout-drop">{stage.drop}</p>
          <p className="ladder-readout-note">{stage.note}</p>
        </div>
      </div>

      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="ladder-rungs"
        role="radiogroup"
        aria-label="Roast level"
        onKeyDown={onKeyDown}
        style={{ '--ladder-pos': activeIndex }}
      >
        <span className="ladder-track" aria-hidden="true">
          <span className="ladder-travel" />
        </span>

        {ROASTS.map((r, i) => {
          const n = countFor(r.id)
          const active = r.id === roast
          return (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              data-rung={r.id}
              className={`ladder-rung${active ? ' is-active' : ''}`}
              onClick={() => setRoast(r.id)}
            >
              <span className="ladder-rung-tick" aria-hidden="true" />
              <span className="ladder-rung-index">{`0${i}`}</span>
              <span className="ladder-rung-label">{r.label}</span>
              <span className="ladder-rung-count">
                {r.sells ? `${n} coffee${n === 1 ? '' : 's'}` : 'not sold'}
              </span>
            </button>
          )
        })}
      </div>

      <p className="ladder-foot">
        <span className="ladder-foot-mark" aria-hidden="true" />
        Green coffee is not for sale — it is what arrives from the eleven farms. Everything below
        this line is what came out of the drum.
      </p>
    </section>
  )
}
