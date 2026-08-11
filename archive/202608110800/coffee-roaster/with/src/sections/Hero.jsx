import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import heroDrum from '../media/hero-drum.jpg'
import { prefersReducedMotion } from '../roast.jsx'

gsap.registerPlugin(ScrollTrigger)

export default function Hero() {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const reduced = prefersReducedMotion()

    const ctx = gsap.context(() => {
      if (!reduced) {
        gsap.from('[data-hero-line] > span', {
          yPercent: 110,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.09,
          delay: 0.1,
        })
        gsap.from('[data-hero-card]', {
          opacity: 0,
          y: 18,
          duration: 0.9,
          ease: 'power2.out',
          delay: 0.55,
        })
        // The drum keeps turning as you leave it: the frame drifts and darkens
        // so the cut to paper in the next section lands as a cut.
        gsap.to('[data-hero-image]', {
          scale: 1.14,
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: () => `+=${Math.max(el.offsetHeight, window.innerHeight * 1.3)}`,
            scrub: true,
          },
        })
        gsap.to('[data-hero-veil]', {
          opacity: 0.92,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: () => `+=${Math.max(el.offsetHeight, window.innerHeight * 1.3)}`,
            scrub: true,
          },
        })
      }
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <header className="hero" id="hero" ref={root}>
      <div className="hero-frame">
        <img
          className="hero-image"
          data-hero-image
          src={heroDrum}
          alt="Roasted coffee tumbling out of the drum of a roaster into the cooling tray, still smoking"
          fetchPriority="high"
        />
        <div className="hero-veil" data-hero-veil aria-hidden="true" />
      </div>

      <div className="hero-body">
        <p className="hero-eyebrow">Bergen, Norway — since 2014</p>
        <h1 className="hero-title">
          <span className="hero-line" data-hero-line>
            <span>Small-batch coffee,</span>
          </span>
          <span className="hero-line hero-line--em" data-hero-line>
            <span>roasted the morning</span>
          </span>
          <span className="hero-line hero-line--em" data-hero-line>
            <span>it ships.</span>
          </span>
        </h1>
        <p className="hero-lede">
          We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and ship
          them within hours. Freshness is not a slogan here; it is a timestamp on the bag.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#beans">
            Shop the beans
          </a>
          <a className="btn btn-secondary" href="#brew-guide">
            Learn to brew
          </a>
        </div>
      </div>

      {/* The batch card: the same stamp reappears in the footer, closing the route. */}
      <aside className="hero-card" data-hero-card aria-label="Current batch">
        <p className="hero-card-head">Batch record</p>
        <dl className="hero-card-list">
          <div>
            <dt>Machine</dt>
            <dd>1962 Probat</dd>
          </div>
          <div>
            <dt>Max batch</dt>
            <dd>12kg</dd>
          </div>
          <div>
            <dt>Roast to shipment</dt>
            <dd>&lt;24h</dd>
          </div>
        </dl>
      </aside>

      <a className="hero-scroll" href="#story" aria-label="Continue to the story">
        <span aria-hidden="true">Scroll</span>
      </a>
    </header>
  )
}
