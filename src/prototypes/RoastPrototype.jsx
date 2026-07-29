import { useMemo, useRef, useState } from 'react'
import './prototype.css'

const PROFILES = [
  {
    id: 'bright',
    index: '01',
    label: 'Bright',
    character: 'Floral & lifted',
    bean: 'Ethiopia Yirgacheffe',
    notes: 'Jasmine, lemon zest, honey',
    roast: 'Light roast',
    price: '$18',
    brewFocus: 'Bloom',
    position: { x: 18, y: 28 },
  },
  {
    id: 'balanced',
    index: '02',
    label: 'Balanced',
    character: 'Sweet & rounded',
    bean: 'Colombia Huila',
    notes: 'Caramel, red apple, cocoa',
    roast: 'Medium roast',
    price: '$16',
    brewFocus: 'Pour',
    position: { x: 51, y: 56 },
  },
  {
    id: 'deep',
    index: '03',
    label: 'Deep',
    character: 'Dark & grounded',
    bean: 'Sumatra Mandheling',
    notes: 'Dark chocolate, cedar, earth',
    roast: 'Dark roast',
    price: '$17',
    brewFocus: 'Grind',
    position: { x: 82, y: 77 },
  },
]

function ProfileOutput({ profile, compact = false }) {
  return (
    <aside className={`prototype-output${compact ? ' prototype-output--compact' : ''}`} aria-live="polite">
      <div className="output-kicker">
        <span>Recommended this month</span>
        <span>{profile.index} / 03</span>
      </div>
      <div className="output-bean">
        <div>
          <p className="output-origin">Single origin</p>
          <h2>{profile.bean}</h2>
          <p>{profile.notes}</p>
        </div>
        <div className="output-price">
          <strong>{profile.price}</strong>
          <span>250g</span>
        </div>
      </div>
      <div className="output-specs">
        <div><span>Roast</span><strong>{profile.roast.replace(' roast', '')}</strong></div>
        <div><span>Brew focus</span><strong>{profile.brewFocus}</strong></div>
        <div><span>Recipe</span><strong>18g · 300ml</strong></div>
        <div><span>Water</span><strong>95°C</strong></div>
      </div>
      <div className="output-action">
        <p>Roasted this morning in a 12kg batch. Ships in under 24 hours.</p>
        <button type="button">Choose {profile.label.toLowerCase()}</button>
      </div>
    </aside>
  )
}

function PrototypeTopbar({ mode }) {
  const other = mode === 'arc' ? 'field' : 'arc'
  return (
    <nav className="prototype-nav" aria-label="Prototype comparison">
      <a className="prototype-brand" href="/">
        <span className="prototype-brandmark">N</span>
        <span>Northwind<br />Coffee Roasters</span>
      </a>
      <div className="prototype-status">
        <span className="status-dot" />
        Bergen · Batch 0729 · Live
      </div>
      <a className="prototype-switch" href={`/prototype/${other}`}>
        View {other === 'arc' ? 'Best Fit' : 'Bold Alternative'}
        <span aria-hidden="true">↗</span>
      </a>
    </nav>
  )
}

function RoastBean({ profile }) {
  return (
    <div className="roast-visual" aria-label={`${profile.label} roast profile visualization`}>
      <div className="orbit orbit--outer"><span>1962</span><span>PROBAT</span></div>
      <div className="orbit orbit--middle"><span>12 KG</span><span>95°C</span></div>
      <div className="heat-ring" />
      <div className="bean-object">
        <div className="bean-surface" />
        <div className="bean-seam" />
        <span className="bean-glint" />
      </div>
      <div className="roast-readout">
        <span>Profile</span>
        <strong>{profile.label}</strong>
      </div>
      <div className="roast-coordinate">60.3913° N<br />5.3221° E</div>
    </div>
  )
}

function ArcPrototype() {
  const [activeId, setActiveId] = useState('balanced')
  const profile = useMemo(() => PROFILES.find((item) => item.id === activeId), [activeId])

  return (
    <main className="prototype prototype--arc" data-profile={profile.id}>
      <PrototypeTopbar mode="arc" />
      <section className="arc-layout">
        <div className="prototype-intro">
          <div className="prototype-label"><span>A</span> Best Fit · Calibrated Arc</div>
          <h1>Choose the roast<br />you wake up for.</h1>
          <p className="prototype-lede">
            One useful taste choice, calibrated like the drum of our 1962 Probat.
            Your selection follows you from bean to brew.
          </p>
          <div className="arc-selector" role="group" aria-label="Choose your roast profile">
            {PROFILES.map((item) => (
              <button
                type="button"
                key={item.id}
                className={item.id === activeId ? 'is-active' : ''}
                onClick={() => setActiveId(item.id)}
                aria-pressed={item.id === activeId}
              >
                <span>{item.index}</span>
                <strong>{item.label}</strong>
                <small>{item.character}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="arc-stage">
          <RoastBean profile={profile} />
        </div>
        <ProfileOutput profile={profile} />
      </section>
      <footer className="prototype-foot">
        <span>Interaction model: direct three-state calibration</span>
        <span>Freshness is a timestamp, not a slogan.</span>
      </footer>
    </main>
  )
}

function FieldPrototype() {
  const [activeId, setActiveId] = useState('balanced')
  const [dragging, setDragging] = useState(false)
  const fieldRef = useRef(null)
  const activeIndex = PROFILES.findIndex((item) => item.id === activeId)
  const profile = PROFILES[activeIndex]

  function selectFromPointer(event) {
    const rect = fieldRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    const next = x < 0.34 ? PROFILES[0] : x < 0.67 ? PROFILES[1] : PROFILES[2]
    setActiveId(next.id)
  }

  function handlePointerDown(event) {
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    selectFromPointer(event)
  }

  function handlePointerMove(event) {
    if (dragging) selectFromPointer(event)
  }

  function handleKeyDown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1
    const nextIndex = Math.max(0, Math.min(PROFILES.length - 1, activeIndex + delta))
    setActiveId(PROFILES[nextIndex].id)
  }

  return (
    <main className="prototype prototype--field" data-profile={profile.id}>
      <PrototypeTopbar mode="field" />
      <section className="field-layout">
        <header className="field-heading">
          <div className="prototype-label"><span>B</span> Bold Alternative · Taste Field</div>
          <h1>Navigate by taste,<br />not roast jargon.</h1>
          <p className="prototype-lede">
            Drag across Northwind’s three-part flavor landscape. The closest
            origin becomes your current batch and shapes the brew that follows.
          </p>
        </header>

        <div
          className="taste-field"
          ref={fieldRef}
          role="slider"
          tabIndex="0"
          aria-label="Taste profile"
          aria-valuemin="1"
          aria-valuemax="3"
          aria-valuenow={activeIndex + 1}
          aria-valuetext={profile.label}
          style={{ '--marker-x': `${profile.position.x}%`, '--marker-y': `${profile.position.y}%` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onKeyDown={handleKeyDown}
        >
          <div className="field-contours" aria-hidden="true">
            <span className="contour contour--one" />
            <span className="contour contour--two" />
            <span className="contour contour--three" />
            <span className="field-axis field-axis--x" />
            <span className="field-axis field-axis--y" />
          </div>
          <span className="axis-label axis-label--top">Lifted aromatics</span>
          <span className="axis-label axis-label--bottom">Grounded body</span>
          <span className="axis-label axis-label--left">Crisp</span>
          <span className="axis-label axis-label--right">Syrupy</span>

          {PROFILES.map((item) => (
            <button
              type="button"
              className={`field-node${item.id === activeId ? ' is-active' : ''}`}
              style={{ '--x': `${item.position.x}%`, '--y': `${item.position.y}%` }}
              key={item.id}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setActiveId(item.id)}
              aria-pressed={item.id === activeId}
            >
              <span>{item.index}</span>
              <strong>{item.label}</strong>
              <small>{item.character}</small>
            </button>
          ))}

          <div className="field-marker" aria-hidden="true">
            <span className="marker-core" />
            <span className="marker-orbit" />
            <em>Drag</em>
          </div>
          <div className="field-batch" aria-hidden="true">
            <span>Live batch</span>
            <strong>0729</strong>
          </div>
        </div>

        <ProfileOutput profile={profile} compact />
      </section>
      <footer className="prototype-foot">
        <span>Interaction model: spatial drag with nearest-origin resolution</span>
        <span>Arrow keys and direct profile controls supported.</span>
      </footer>
    </main>
  )
}

export default function RoastPrototype() {
  const mode = window.location.pathname.endsWith('/field') ? 'field' : 'arc'
  return mode === 'field' ? <FieldPrototype /> : <ArcPrototype />
}
