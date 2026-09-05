import { useEffect, useRef, useState } from 'react'
import { prefersReduced } from './reveal'

// The escapement running, filmed. Holding the control stops the balance, the
// way a watchmaker stops one with a hair — the film freezes and the count of
// releases freezes with it. Letting go starts it again.
export default function Beat() {
  const videoRef = useRef(null)
  const countRef = useRef(null)
  const rafRef = useRef(0)
  const heldRef = useRef(false)
  const clock = useRef({ releases: 0, last: 0 })
  const [held, setHeld] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    const still = prefersReduced()
    setReduced(still)
    if (still) {
      v && v.pause()
      return
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (!v) return
        if (e.isIntersecting && !heldRef.current) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.25 },
    )
    v && io.observe(v)

    const tick = (t) => {
      const c = clock.current
      if (!c.last) c.last = t
      const dt = (t - c.last) / 1000
      c.last = t
      if (!heldRef.current && v && !v.paused) c.releases += dt * 5
      if (countRef.current)
        countRef.current.textContent = Math.floor(c.releases).toLocaleString('en-CH')
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      io.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const hold = (on) => {
    if (reduced) return
    heldRef.current = on
    setHeld(on)
    const v = videoRef.current
    if (!v) return
    if (on) v.pause()
    else v.play().catch(() => {})
  }

  return (
    <section className="beat" id="beat" aria-labelledby="beat-title">
      <div className="beat-inner">
        <figure className="beat-figure" data-held={held ? 'true' : 'false'}>
          <video
            ref={videoRef}
            poster="/media/beat-poster.jpg"
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Close film of a mechanical escapement running: a brass carriage with blued screws turning against a ruby jewel."
          >
            <source src="/media/beat.webm" type="video/webm" />
            <source src="/media/beat.mp4" type="video/mp4" />
          </video>
          <figcaption className="mono">
            {reduced
              ? 'Film held still — reduced motion'
              : held
                ? 'Balance stopped'
                : 'Running'}
          </figcaption>
        </figure>

        <div className="beat-copy">
          <p className="label">The ticking</p>
          <h2 id="beat-title" className="display">
            Seventy-two hours of stored energy, released one escape-wheel tooth at a time,
            five times a second.
          </h2>
          <p className="lede">
            For three days from a single wind. Everything else on this page exists to
            make that release happen at the same rate on the first day and the third.
          </p>

          <dl className="beat-figures">
            <div>
              <dt className="mono">Releases since you arrived</dt>
              <dd className="fig" ref={countRef}>
                0
              </dd>
            </div>
            <div>
              <dt className="mono">Per hour</dt>
              <dd className="fig">18,000</dd>
            </div>
            <div>
              <dt className="mono">Deviation, per day</dt>
              <dd className="fig">−1 / +4 s</dd>
            </div>
          </dl>

          <button
            type="button"
            className="btn-hold"
            disabled={reduced}
            onPointerDown={() => hold(true)}
            onPointerUp={() => hold(false)}
            onPointerLeave={() => held && hold(false)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                hold(true)
              }
            }}
            onKeyUp={(e) => {
              if (e.key === ' ' || e.key === 'Enter') hold(false)
            }}
          >
            {held ? 'Balance stopped — let go' : 'Hold to stop the balance'}
          </button>
        </div>
      </div>
    </section>
  )
}
