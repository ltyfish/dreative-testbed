import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import roast00 from './assets/roast-frames/frame-00.png'
import roast01 from './assets/roast-frames/frame-01.png'
import roast02 from './assets/roast-frames/frame-02.png'
import roast03 from './assets/roast-frames/frame-03.png'
import roast04 from './assets/roast-frames/frame-04.png'
import roast05 from './assets/roast-frames/frame-05.png'
import roast06 from './assets/roast-frames/frame-06.png'
import roast07 from './assets/roast-frames/frame-07.png'
import roast08 from './assets/roast-frames/frame-08.png'
import roast09 from './assets/roast-frames/frame-09.png'
import roast10 from './assets/roast-frames/frame-10.png'
import roast11 from './assets/roast-frames/frame-11.png'
import './prototype.css'

gsap.registerPlugin(ScrollTrigger)

const FLAVORS = {
  bright: { label: 'Bright', bean: 'Ethiopia Yirgacheffe', note: 'Jasmine · lemon zest · honey', roast: 'Light', frame: 3 },
  round: { label: 'Round', bean: 'Colombia Huila', note: 'Caramel · red apple · cocoa', roast: 'Medium', frame: 5 },
  deep: { label: 'Deep', bean: 'Sumatra Mandheling', note: 'Dark chocolate · cedar · earth', roast: 'Dark', frame: 7 },
}

const ROAST_FRAMES = [roast00, roast01, roast02, roast03, roast04, roast05, roast06, roast07, roast08, roast09, roast10, roast11]
const ROAST_STAGES = [
  ['Ready', 'Twelve kilos. Green and dense.', 22],
  ['Charge', 'The hopper opens. The batch enters.', 38],
  ['Seal', 'The last green beans meet the drum.', 52],
  ['Turn', 'Moisture leaves. Color begins.', 96],
  ['Develop', 'Sugar browns. Structure becomes sweetness.', 148],
  ['Sample', 'The trier checks color at first crack.', 174],
  ['Decide', 'Seconds now separate bright from deep.', 194],
  ['Release', 'The drum door breaks the heat.', 201],
  ['Drop', 'The batch falls into moving air.', 202],
  ['Clear', 'The last beans leave the drum.', 188],
  ['Cool', 'Steel arms turn through the batch.', 132],
  ['Ship', 'Roast complete. Timestamp starts now.', 42],
]

function Sequence({ mode, progress, onAdvance }) {
  const active = Math.min(11, Math.floor(progress * 11.999))
  return (
    <div className="sequence-shell" onClick={mode === 'bold' ? onAdvance : undefined}>
      <div className="roaster-motion" style={{ transform: `translate3d(${progress * -3}%, ${Math.sin(progress * Math.PI) * -2}%, 0) scale(${1 + progress * .09})` }}>
        {ROAST_FRAMES.map((src, index) => (
          <img
            alt={index === active ? `Full coffee roaster at development stage ${index + 1}` : ''}
            aria-hidden={index !== active}
            className={`sequence-frame ${index === active ? 'active' : ''}`}
            key={src}
            src={src}
          />
        ))}
      </div>
      <div className="temperature-ghost" aria-hidden="true">{ROAST_STAGES[active][2]}°</div>
      <div className="sequence-chrome" aria-hidden="true">
        <span>PROBAT 1962</span><span>{String(active + 1).padStart(2, '0')} / 12 · 12 KG</span>
      </div>
      {mode === 'bold' && <button className="advance-shot" type="button" onClick={onAdvance}>Advance machine →</button>}
    </div>
  )
}

export default function Prototype({ mode }) {
  const [flavor, setFlavor] = useState('bright')
  const [progress, setProgress] = useState(0)
  const journeyRef = useRef(null)
  const selected = FLAVORS[flavor]
  const frame = Math.min(11, Math.floor(progress * 11.999))

  useEffect(() => {
    if (mode !== 'best') return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: '.proto-roast',
        start: 'top top',
        end: 'bottom bottom',
        pin: '.roast-stage',
        scrub: 0.25,
        onUpdate: ({ progress: value }) => setProgress(value),
      })
    }, journeyRef)
    return () => ctx.revert()
  }, [mode])

  useEffect(() => {
    if (mode === 'bold') setProgress(selected.frame / 7)
  }, [flavor, mode, selected.frame])

  const advanceShot = (event) => {
    event?.stopPropagation()
    setProgress((value) => ((Math.min(11, Math.floor(value * 11.999)) + 1) % 12) / 11)
  }

  return (
    <main className={`prototype ${mode}`} ref={journeyRef}>
      <nav className="proto-nav">
        <a className="proto-wordmark" href="#proto-hero"><span>N</span> Northwind</a>
        <div><span>Prototype / {mode === 'best' ? 'Best Fit' : 'Bold Alternative'}</span><span>Bergen · Norway</span></div>
      </nav>

      <header className="proto-hero" id="proto-hero">
        <p className="eyebrow">Roasted the morning it ships · Batch 074</p>
        <h1>Choose the cup.<br /><em>We’ll trace the roast.</em></h1>
        <p className="hero-deck">Start with how you want coffee to feel. Northwind follows that choice from green bean to first pour.</p>
        <div className="flavor-control" aria-label="Choose a flavor profile">
          {Object.entries(FLAVORS).map(([key, item]) => (
            <button className={flavor === key ? 'active' : ''} key={key} onClick={() => setFlavor(key)}>
              <span>{item.label}</span><small>{item.note}</small>
            </button>
          ))}
        </div>
        <div className="hero-proof">
          <span>11 direct farm partners</span><span>2.4× commodity price</span><span>&lt;24h roast to shipment</span>
        </div>
      </header>

      <section className="proto-roast" id="proto-peak">
        <div className="roast-stage">
          <div className="roast-copy">
            <p className="eyebrow">{mode === 'best' ? 'Scroll to develop the roast' : 'Your profile sets the roast'}</p>
            <h2>{ROAST_STAGES[frame][0]}</h2>
            <p>{ROAST_STAGES[frame][1]}</p>
            <div className="roast-readout">
              <span>{String(frame + 1).padStart(2, '0')} / 12</span>
              <span>{ROAST_STAGES[frame][2]}°C</span>
              <span>{frame < 5 ? 'Endothermic' : frame < 9 ? 'Exothermic' : 'Cooling'}</span>
            </div>
          </div>
          <Sequence mode={mode} progress={progress} onAdvance={advanceShot} />
          {mode === 'best' && <div className="scroll-meter"><span style={{ transform: `scaleX(${Math.max(.02, progress)})` }} /></div>}
        </div>
      </section>

      <section className="proto-consequence" id="proto-post-peak">
        <div className="ledger-line"><span>Profile</span><strong>{selected.label}</strong><span>Roast</span><strong>{selected.roast}</strong></div>
        <p className="eyebrow">Your batch recommendation</p>
        <div className="recommendation">
          <div>
            <p>NW / 074 / {selected.roast.toUpperCase()}</p>
            <h2>{selected.bean}</h2>
            <p>{selected.note}</p>
          </div>
          <div className="bag">
            <span>NORTHWIND</span><strong>{selected.bean.split(' ')[0]}</strong><small>ROASTED IN BERGEN<br />250 G · FILTER</small>
          </div>
          <div className="recommend-actions">
            <span>$18 · ships tomorrow</span>
            <button>Add batch to cart</button>
            <a href="#proto-hero">Try another profile ↑</a>
          </div>
        </div>
      </section>

      <footer className="proto-footer">
        <span>Two roasters. One 1962 Probat.</span>
        <span>Prototype continuity: choice → roast → recommendation</span>
      </footer>
    </main>
  )
}
