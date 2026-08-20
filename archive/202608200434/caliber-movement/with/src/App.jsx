import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight, Check, ChevronDown, Mail } from 'lucide-react'
import atelier1100 from './assets/atelier-plate-1100.jpg'
import atelier640 from './assets/atelier-plate-640.jpg'

// The power path, in the order energy actually travels. This order is a fact
// about the movement, not a layout decision.
const POWER_PATH = [
  {
    id: 'mainspring',
    name: 'Mainspring',
    detail: 'A 380mm hardened alloy ribbon, wound to 6.5 turns.',
    figure: '72 hours of stored energy at full wind',
  },
  {
    id: 'barrel',
    name: 'Barrel and stop-work',
    detail: 'Releases the spring at a near-constant torque and refuses the last eight per cent, where the rate would drift.',
    figure: 'Torque held within 4% across the run',
  },
  {
    id: 'train',
    name: 'Gear train',
    detail: 'Four wheels step the barrel’s one slow turn up to the escape wheel’s fast one.',
    figure: 'Ratio 1 : 4,608',
  },
  {
    id: 'escapement',
    name: 'Escapement',
    detail: 'A free-sprung lever in silicon releases the train one tooth at a time. This is the ticking.',
    figure: '5 releases per second',
  },
  {
    id: 'balance',
    name: 'Balance wheel',
    detail: 'A 10.6mm glucydur wheel swinging against a flat hairspring. Its period is what the watch calls a second.',
    figure: '18,000 semi-oscillations per hour',
  },
  {
    id: 'hands',
    name: 'Motion work and hands',
    detail: 'The last reduction divides that swing back down into minutes and hours.',
    figure: 'Cumulative deviation −1 to +4 seconds per day',
  },
]

// Physical layers, front of the movement to back. Also a fact, not an order
// chosen for the page.
const LAYERS = [
  { id: 'dial-side', name: 'Dial-side plate', thickness: '0.9mm', note: 'Carries the motion work and the hand posts.' },
  { id: 'main', name: 'Main plate', thickness: '1.4mm', note: 'German silver, frosted by hand. Every pivot is located from this one surface.' },
  { id: 'bridge', name: 'Train bridge', thickness: '0.8mm', note: 'One continuous bridge over all four train wheels, black-polished on the upper flanks.' },
  { id: 'balance-cock', name: 'Balance cock', thickness: '0.7mm', note: 'Holds the balance from one side only, so the wheel can be seen turning.' },
]

const CONFIGURATIONS = [
  {
    id: 'frosted',
    name: 'Frosted German silver',
    finish: 'Hand-frosted plates, straight-grained bridges, blued screws.',
    price: 24800,
    lead: 'Delivered from March 2027',
    remaining: 41,
  },
  {
    id: 'skeleton',
    name: 'Open-worked',
    finish: 'Main plate cut back to the load paths, every remaining edge anglaged by hand.',
    price: 39500,
    lead: 'Delivered from September 2027',
    remaining: 12,
  },
  {
    id: 'black',
    name: 'Black-polished steel',
    finish: 'Bridges polished to a true black at every angle, matte plates for contrast.',
    price: 31200,
    lead: 'Delivered from June 2027',
    remaining: 24,
  },
]

const SPECS = [
  ['Reference', 'Caliber 08'],
  ['Diameter', '31.0mm'],
  ['Height', '3.8mm'],
  ['Jewels', '27'],
  ['Frequency', '2.5 Hz (18,000 A/h)'],
  ['Power reserve', '72 hours'],
  ['Regulation', 'Free-sprung, four inertia weights'],
  ['Winding', 'Manual'],
  ['Components', '214'],
  ['Finishing hours', '62 per movement'],
]

const ATELIER = [
  'Designed, cut, and finished at the workshop in Vallée de Joux. Nothing is subcontracted except the jewels and the mainspring.',
  'Eleven watchmakers. Two of them do nothing but finishing.',
  'A total of 200 movements will be made, after which the tooling is retired.',
  'Every movement is run for 21 days in six positions before it leaves. The timing record ships with it.',
  'Serviceable indefinitely. We keep parts for retired calibers and will not stop.',
]

const NAV = [
  ['power-path', 'Power path'],
  ['layers', 'Layers'],
  ['specification', 'Specification'],
  ['workshop', 'Workshop'],
  ['finishes', 'Finishes'],
  ['reserve', 'Reserve'],
]

const chf = (n) => n.toLocaleString('en-CH')
const pad = (n) => String(n).padStart(2, '0')

/* ------------------------------------------------------------------ *
 * Drawing helpers. Real geometry, generated — these are schematics of
 * the movement, not photographs of it.
 * ------------------------------------------------------------------ */

function gearPath(cx, cy, r, teeth, depth = 0.14) {
  const inner = r * (1 - depth)
  const pts = []
  const step = (Math.PI * 2) / teeth
  for (let i = 0; i < teeth; i += 1) {
    const a0 = i * step
    const a1 = a0 + step * 0.42
    const a2 = a0 + step * 0.5
    const a3 = a0 + step * 0.92
    pts.push(`${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r}`)
    pts.push(`${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r}`)
    pts.push(`${cx + Math.cos(a2) * inner} ${cy + Math.sin(a2) * inner}`)
    pts.push(`${cx + Math.cos(a3) * inner} ${cy + Math.sin(a3) * inner}`)
  }
  return `M ${pts.join(' L ')} Z`
}

function spiralPath(cx, cy, r0, r1, turns, points = 180) {
  const d = []
  for (let i = 0; i <= points; i += 1) {
    const t = i / points
    const a = t * turns * Math.PI * 2
    const r = r0 + (r1 - r0) * t
    d.push(`${i === 0 ? 'M' : 'L'} ${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`)
  }
  return d.join(' ')
}

// Jewelled pivots visible from the bridge side: the wheel arbours, the
// pallet stones, and the balance staff. The rest sit under the plates.
const JEWELS = [
  [150, 145], [262, 132], [312, 196], [296, 262], [232, 300], [150, 285],
  [206, 314], [190, 322],
]

const FROST = Array.from({ length: 15 }, (_, i) => 24 + i * 10)

function MovementPlate() {
  return (
    <svg className="plate-svg" viewBox="0 0 440 452" role="img"
      aria-label="Schematic plate view of Caliber 08: barrel and mainspring, a four-wheel train, the lever escapement and the balance wheel, inside a 31mm main plate.">
      <defs>
        <clipPath id="plateClip"><circle cx="220" cy="210" r="175" /></clipPath>
      </defs>

      <circle className="ln-plate" cx="220" cy="210" r="175" />
      <circle className="ln-hair" cx="220" cy="210" r="168" />

      <g clipPath="url(#plateClip)">
        <g className="ln-frost">
          {FROST.map((r) => <circle key={r} cx="220" cy="210" r={r} />)}
        </g>

        {/* barrel and mainspring */}
        <path className="ln-part" d={gearPath(150, 145, 68, 72, 0.05)} />
        <path className="ln-spring" d={spiralPath(150, 145, 10, 55, 6)} />
        <circle className="ln-part" cx="150" cy="145" r="8" />

        {/* the train, barrel to escape wheel */}
        <path className="ln-part" d={gearPath(262, 132, 44, 54, 0.07)} />
        <circle className="ln-hair" cx="262" cy="132" r="13" />
        <path className="ln-part" d={gearPath(312, 196, 34, 44, 0.08)} />
        <circle className="ln-hair" cx="312" cy="196" r="11" />
        <path className="ln-part" d={gearPath(296, 262, 27, 36, 0.09)} />
        <circle className="ln-hair" cx="296" cy="262" r="9" />

        {/* escape wheel and pallet lever */}
        <path className="ln-escape" d={gearPath(232, 300, 22, 15, 0.36)} />
        <circle className="ln-hair" cx="232" cy="300" r="6" />
        <path className="ln-lever" d="M 234 324 L 214 342 L 190 336 L 182 322 L 202 310 Z" />
        <path className="ln-lever" d="M 190 336 L 166 320" />

        {/* balance: the moving part */}
        <g className="balance">
          <g className="balance-spin">
            <circle className="ln-part" cx="150" cy="285" r="62" />
            <circle className="ln-hair" cx="150" cy="285" r="54" />
            {[0, 90, 180, 270].map((a) => (
              <circle key={a} className="ln-weight"
                cx={150 + Math.cos((a * Math.PI) / 180) * 58}
                cy={285 + Math.sin((a * Math.PI) / 180) * 58} r="7" />
            ))}
            <path className="ln-part" d="M 88 285 H 212 M 150 223 V 347" />
            <path className="ln-spring" d={spiralPath(150, 285, 6, 34, 5)} />
          </g>
          {/* balance cock: holds the wheel from one side only */}
          <path className="ln-bridge" d="M 22 236 C 62 224 108 240 138 262 C 154 274 158 292 150 304 C 140 316 120 314 104 304 C 78 288 46 268 22 262 Z" />
          <circle className="ln-bridge" cx="150" cy="285" r="15" />
          <circle className="ln-pivot" cx="150" cy="285" r="4.5" />
        </g>

        {JEWELS.map(([x, y], i) => (
          <g key={i} className="jewel">
            <circle cx={x} cy={y} r="4.4" />
            <circle className="jewel__ring" cx={x} cy={y} r="4.4" />
          </g>
        ))}
      </g>

      {/* diameter, called out below the plate */}
      <g className="dim">
        <path d="M 45 398 V 434 M 395 398 V 434" />
        <path d="M 45 424 H 395" />
        <path d="M 45 424 l 9 -4 v 8 z M 395 424 l -9 -4 v 8 z" className="dim-tip" />
        <rect className="dim-plate" x="176" y="412" width="88" height="24" />
        <text x="220" y="429" textAnchor="middle">⌀ 31.0 mm</text>
      </g>

      <g className="leader">
        <path d="M 150 145 L 62 52 L 16 52" />
        <text x="16" y="44">Barrel, 72 h</text>
        <path d="M 312 196 L 404 74 L 428 74" />
        <text x="428" y="66" textAnchor="end">Gear train</text>
        <path d="M 232 300 L 392 348 L 428 348" />
        <text x="428" y="340" textAnchor="end">Escapement</text>
        <path d="M 150 285 L 52 372 L 16 372" />
        <text x="16" y="388">Balance, 2.5 Hz</text>
      </g>
    </svg>
  )
}

function StageGlyph({ id }) {
  const c = { viewBox: '0 0 48 48', className: 'glyph', 'aria-hidden': 'true' }
  switch (id) {
    case 'mainspring':
      return <svg {...c}><path d={spiralPath(24, 24, 2, 20, 4)} /></svg>
    case 'barrel':
      return <svg {...c}><path d={gearPath(24, 24, 19, 34, 0.08)} /><circle cx="24" cy="24" r="6" /><path d="M24 6 V 18" /></svg>
    case 'train':
      return (
        <svg {...c}>
          <path d={gearPath(15, 15, 11, 18, 0.16)} />
          <path d={gearPath(33, 24, 8, 14, 0.18)} />
          <path d={gearPath(20, 36, 6, 12, 0.2)} />
        </svg>
      )
    case 'escapement':
      return (
        <svg {...c}>
          <path d={gearPath(19, 21, 13, 15, 0.36)} />
          <circle cx="19" cy="21" r="3" />
          <path d="M 30 28 L 38 36 L 44 36" />
          <path d="M 26 30 L 32 40" />
        </svg>
      )
    case 'balance':
      return (
        <svg {...c}>
          <circle cx="24" cy="24" r="19" /><path d="M5 24 H43 M24 5 V43" />
          {[0, 90, 180, 270].map((a) => (
            <circle key={a} cx={24 + Math.cos((a * Math.PI) / 180) * 17} cy={24 + Math.sin((a * Math.PI) / 180) * 17} r="3" />
          ))}
        </svg>
      )
    default:
      return (
        <svg {...c}>
          <circle cx="24" cy="24" r="19" />
          <path d="M24 24 V 10 M24 24 L 34 30" />
          <circle cx="24" cy="24" r="2.5" />
        </svg>
      )
  }
}

/* ------------------------------------------------------------------ *
 * Reveal + liveness. One shared observer grammar for the whole route.
 * ------------------------------------------------------------------ */

function useInView(options) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  const { once = true, margin = '0px 0px -14% 0px', threshold = 0.12 } = options || {}
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return undefined }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          if (once) io.disconnect()
        } else if (!once) setSeen(false)
      },
      { rootMargin: margin, threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once, margin, threshold])
  return [ref, seen]
}

function Section({ id, fig, label, children, tone }) {
  const [ref, seen] = useInView()
  return (
    <section id={id} ref={ref} className={`section${tone ? ` section--${tone}` : ''}${seen ? ' is-in' : ''}`}>
      <div className="section__rail">
        <span className="fig">Fig. {fig}</span>
        <span className="fig-label">{label}</span>
      </div>
      <div className="section__body">{children}</div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

function PowerPath() {
  const [active, setActive] = useState(null)
  const [ref, live] = useInView({ once: false, margin: '0px', threshold: 0 })
  return (
    <div className={`path${live ? ' is-live' : ''}`} ref={ref}>
      <ol className="path__list">
        {POWER_PATH.map((s, i) => (
          <li
            key={s.id}
            className={`stage${active === s.id ? ' is-active' : ''}`}
            style={{ '--i': i }}
            onMouseEnter={() => setActive(s.id)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(s.id)}
            onBlur={() => setActive(null)}
            tabIndex={0}
          >
            <div className="stage__spine" aria-hidden="true">
              <span className="stage__node"><StageGlyph id={s.id} /></span>
            </div>
            <div className="stage__text">
              <p className="stage__name"><span className="stage__no">{pad(i + 1)}</span>{s.name}</p>
              <p className="stage__detail">{s.detail}</p>
            </div>
            <p className="stage__figure">{s.figure}</p>
          </li>
        ))}
      </ol>
      <p className="path__foot" aria-hidden="true">
        <span className="pulse-key" /> One wind, tracked from spring to hands
      </p>
    </div>
  )
}

const MM = 30 // px per millimetre in the exploded elevation
const GAP = 30
const CX = 266
// each layer's real footprint: the plates run the full diameter, the bridge
// spans only the train, the cock holds the balance from one side
const SPREAD = { 'dial-side': 1, main: 1, bridge: .64, 'balance-cock': .36 }

function slab(y, h, s) {
  const L = [CX - 170 * s, y]
  const R = [CX + 170 * s, y]
  const T = [CX + 50 * s, y - 40 * s]
  const B = [CX - 50 * s, y + 40 * s]
  return {
    top: `M ${L} L ${T} L ${R} L ${B} Z`,
    left: `M ${L} L ${L[0]} ${L[1] + h} L ${B[0]} ${B[1] + h} L ${B} Z`,
    right: `M ${B} L ${B[0]} ${B[1] + h} L ${R[0]} ${R[1] + h} L ${R} Z`,
    leadX: L[0] - 6,
  }
}

function LayerStack() {
  const [active, setActive] = useState(null)
  const [ref, seen] = useInView({ margin: '0px 0px -20% 0px', threshold: 0.2 })

  const plates = useMemo(() => {
    let y = 26
    return LAYERS.map((l) => {
      const h = parseFloat(l.thickness) * MM
      const item = { ...l, y, h, ...slab(y, h, SPREAD[l.id]) }
      y += h + GAP
      return item
    })
  }, [])
  const height = plates[plates.length - 1].y + plates[plates.length - 1].h + 30

  return (
    <div className={`stack${seen ? ' is-in' : ''}`} ref={ref}>
      <svg className="stack__svg" viewBox={`0 0 460 ${height}`} role="img"
        aria-label="Exploded elevation of the four plates, drawn to their real thicknesses, 3.8mm in total.">
        <g className="stack__axis">
          <path d={`M 24 26 V ${height - 26}`} />
          <text x="10" y="14">front</text>
          <text x="10" y={height - 6}>back</text>
        </g>
        {plates.map((p, i) => (
          <g key={p.id} className={`plateg${active === p.id ? ' is-active' : ''}`} style={{ '--i': i }}
            onMouseEnter={() => setActive(p.id)} onMouseLeave={() => setActive(null)}>
            {/* isometric slab: top face + front face, thickness to scale */}
            <path className="plateg__top" d={p.top} />
            <path className="plateg__side" d={p.left} />
            <path className="plateg__side2" d={p.right} />
            <path className="plateg__lead" d={`M ${p.leadX} ${p.y + 4} H 56`} />
            <text className="plateg__mm" x="52" y={p.y + 8} textAnchor="end">{p.thickness}</text>
          </g>
        ))}
      </svg>
      <ol className="stack__list">
        {LAYERS.map((l, i) => (
          <li key={l.id} className={`layer${active === l.id ? ' is-active' : ''}`}
            onMouseEnter={() => setActive(l.id)} onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(l.id)} onBlur={() => setActive(null)} tabIndex={0}>
            <span className="layer__no">{pad(i + 1)}</span>
            <span className="layer__name">{l.name}</span>
            <span className="layer__mm">{l.thickness}</span>
            <span className="layer__note">{l.note}</span>
          </li>
        ))}
      </ol>
      <p className="stack__total"><span>3.8mm</span> assembled, dial-side plate to balance cock</p>
    </div>
  )
}

export default function App() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
  const formRef = useRef(null)

  useEffect(() => { document.documentElement.classList.add('js') }, [])

  const chosen = CONFIGURATIONS.find((c) => c.id === config)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  const pick = useCallback((id) => {
    setConfig(id)
    const el = document.getElementById('reserve')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="page">
      <header className="topbar">
        <a className="topbar__mark" href="#top">
          <span className="topbar__house">Aubry &amp; Vent</span>
          <span className="topbar__cal">Caliber 08</span>
        </a>
        <nav className="topbar__nav" aria-label="Sections of this page">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </nav>
        <a className="topbar__cta" href="#reserve">Reserve</a>
        <p className="beat" title="The balance runs at 2.5 Hz">
          <span className="beat__mark" aria-hidden="true"><span /></span>
          <span className="beat__hz">2.5 Hz</span>
        </p>
      </header>

      <main id="top">
        {/* ---------------------------------------------------- Fig. 01 */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__text">
            <p className="eyebrow">Fig. 01 &nbsp;·&nbsp; Vallée de Joux &nbsp;·&nbsp; MMXXVI</p>
            <h1 id="hero-title">Caliber&nbsp;08</h1>
            <p className="hero__lead">
              A manual-winding mechanical movement, made in a run of 200 and then never again.
            </p>
            <dl className="keyfigs">
              {[['72 h', 'power reserve'], ['2.5 Hz', 'frequency'], ['214', 'components'], ['200', 'ever made']].map(([v, k]) => (
                <div key={k}><dt>{v}</dt><dd>{k}</dd></div>
              ))}
            </dl>
            <div className="hero__actions">
              <a className="btn" href="#reserve">Reserve a movement</a>
              <a className="btn btn--quiet" href="#power-path">
                Read the movement <ArrowDown size={15} strokeWidth={1.6} aria-hidden="true" />
              </a>
            </div>
          </div>
          <figure className="hero__plate">
            <MovementPlate />
            <figcaption>
              Plate view. Jewelled pivots in ruby; the balance beats as you read.
            </figcaption>
          </figure>
        </section>

        {/* ---------------------------------------------------- Fig. 02 */}
        <Section id="power-path" fig="02" label="Power path" tone="ink">
          <header className="head">
            <h2>Seventy-two hours, released five times a second</h2>
            <p className="deck">
              Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five times a
              second, for three days from a single wind. Six stages, in the order the energy travels.
            </p>
          </header>
          <PowerPath />
        </Section>

        {/* ---------------------------------------------------- Fig. 03 */}
        <Section id="layers" fig="03" label="Construction">
          <header className="head">
            <h2>Four layers, 3.8mm</h2>
            <p className="deck">
              The movement is built up in four layers, front to back. Drawn here to their real thicknesses.
            </p>
          </header>
          <LayerStack />
        </Section>

        {/* ---------------------------------------------------- Fig. 04 */}
        <Section id="specification" fig="04" label="Specification">
          <header className="head head--tight">
            <h2>Specification</h2>
          </header>
          <dl className="specs">
            {SPECS.map(([k, v]) => (
              <div className="specs__row" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* ---------------------------------------------------- Fig. 05 */}
        <Section id="workshop" fig="05" label="The workshop">
          <div className="atelier">
            <figure className="atelier__plate">
              <img
                src={atelier1100}
                srcSet={`${atelier640} 640w, ${atelier1100} 1100w`}
                sizes="(max-width: 760px) 92vw, min(1100px, 92vw)"
                width="1100" height="733" loading="lazy" decoding="async"
                alt="Engraved view of an eighteenth-century watchmaking workshop: four craftsmen at benches under tall windows, clocks and cases along the walls."
              />
              <figcaption>
                <em>Horlogerie, Ouvrages et Outils</em>, Plate&nbsp;I — Fossier del., Bénard direxit, from
                Diderot’s <em>Encyclopédie</em>, c.&nbsp;1765. The trade as it was organised two hundred
                years before this movement.{' '}
                <a href="https://commons.wikimedia.org/wiki/File:Horlogerie,_ouvrages_et_outils,_G.36567.jpg"
                  target="_blank" rel="noreferrer">
                  Musée Carnavalet, CC0 <ArrowUpRight size={12} strokeWidth={1.8} aria-hidden="true" />
                </a>
              </figcaption>
            </figure>
            <div className="atelier__lead">
              <h2>Eleven watchmakers, and then the tooling is retired</h2>
              <p className="pullnum"><span>200</span> movements, in total, for ever</p>
            </div>
            <ul className="atelier__facts">
              {ATELIER.map((a, i) => (
                <li key={a}><span className="atelier__no">{pad(i + 1)}</span>{a}</li>
              ))}
            </ul>
          </div>
        </Section>

        {/* ---------------------------------------------------- Fig. 06 */}
        <Section id="finishes" fig="06" label="Finishes">
          <header className="head">
            <h2>Three finishes</h2>
            <p className="deck">
              The same 214 components, finished three ways. Prices are for the movement alone; casing is
              arranged separately.
            </p>
          </header>
          <ul className="configs">
            {CONFIGURATIONS.map((c) => {
              const selected = config === c.id
              return (
                <li key={c.id} className={`config${selected ? ' is-selected' : ''}`}>
                  <div className="config__head">
                    <h3>{c.name}</h3>
                    <span className="config__tag">{selected ? 'Selected' : `${c.remaining} left`}</span>
                  </div>
                  <p className="config__price">
                    <span className="config__cur">CHF</span> {chf(c.price)}
                  </p>
                  <p className="config__finish">{c.finish}</p>
                  <dl className="config__meta">
                    <div><dt>Delivery</dt><dd>{c.lead}</dd></div>
                    <div><dt>Allocation</dt><dd>{c.remaining} of the run still unallocated</dd></div>
                  </dl>
                  <button type="button" className="btn btn--block" onClick={() => pick(c.id)}
                    aria-pressed={selected}>
                    {selected ? (<><Check size={15} strokeWidth={2} aria-hidden="true" /> Chosen</>) : 'Choose this finish'}
                  </button>
                </li>
              )
            })}
          </ul>
        </Section>

        {/* ---------------------------------------------------- Fig. 07 */}
        <Section id="reserve" fig="07" label="Reservation">
          <div className="reserve" ref={formRef}>
            <div className="reserve__side">
              <h2>Reserve a movement</h2>
              <p className="reserve__terms">
                Reservations are not binding and no payment is taken now. We will write once, with the
                timing record of the movement allocated to you.
              </p>
              <div className={`ticket${chosen ? ' is-filled' : ''}`} aria-hidden="true">
                {chosen ? (
                  <>
                    <p className="ticket__name">{chosen.name}</p>
                    <p className="ticket__price">CHF {chf(chosen.price)}</p>
                    <p className="ticket__lead">{chosen.lead}</p>
                    <p className="ticket__rem">{chosen.remaining} of the run still unallocated</p>
                  </>
                ) : (
                  <p className="ticket__empty">No finish chosen yet</p>
                )}
              </div>
            </div>

            {reserved ? (
              <div className="confirm" role="status">
                <p className="confirm__mark"><Check size={18} strokeWidth={2} aria-hidden="true" /> Reserved</p>
                <p className="confirm__body">
                  Reserved. {name}, we have held one {chosen.name} movement at CHF{' '}
                  {chf(chosen.price)} and will write to {email}. {chosen.lead}.
                </p>
                <p className="confirm__note">
                  Reservations are not binding and no payment is taken now.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="form">
                <div className="field">
                  <label htmlFor="config">Which finish?</label>
                  <div className="select">
                    <select id="config" name="config" required value={config}
                      onChange={(e) => setConfig(e.target.value)}>
                      <option value="">Choose a finish</option>
                      {CONFIGURATIONS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — CHF {chf(c.price)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="name">Your name</label>
                  <input id="name" name="name" type="text" required value={name}
                    onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <button type="submit" className="btn btn--solid btn--block">Reserve a movement</button>
              </form>
            )}
          </div>
        </Section>
      </main>

      <footer className="foot">
        <p className="foot__mark">Aubry &amp; Vent. Caliber 08. © 2026.</p>
        <p className="foot__mail">
          <Mail size={14} strokeWidth={1.6} aria-hidden="true" />
          Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
        </p>
        <p className="foot__links">
          <a href="#workshop">Servicing</a>
          <a href="#workshop">Provenance</a>
          <a href="#reserve">Terms of reservation</a>
        </p>
      </footer>
    </div>
  )
}
