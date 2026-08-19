import { useEffect, useRef, useState } from 'react'
import {
  MapPin,
  Users,
  Hash,
  ClipboardCheck,
  Infinity as InfinityIcon,
} from 'lucide-react'
import valleePhoto from './assets/vallee-de-joux.jpg'

// ---------------------------------------------------------------------------
// Product facts. Preserved verbatim from the content baseline.
// ---------------------------------------------------------------------------

// The power path, in the order energy actually travels. This order is a fact
// about the movement, not a layout decision.
const POWER_PATH = [
  {
    id: 'mainspring',
    name: 'Mainspring',
    detail: 'A 380mm hardened alloy ribbon, wound to 6.5 turns.',
    figure: '72 hours of stored energy at full wind',
    lead: '72',
    unit: 'hours stored',
  },
  {
    id: 'barrel',
    name: 'Barrel and stop-work',
    detail: 'Releases the spring at a near-constant torque and refuses the last eight per cent, where the rate would drift.',
    figure: 'Torque held within 4% across the run',
    lead: '4%',
    unit: 'torque window',
  },
  {
    id: 'train',
    name: 'Gear train',
    detail: 'Four wheels step the barrel’s one slow turn up to the escape wheel’s fast one.',
    figure: 'Ratio 1 : 4,608',
    lead: '1:4,608',
    unit: 'step-up ratio',
  },
  {
    id: 'escapement',
    name: 'Escapement',
    detail: 'A free-sprung lever in silicon releases the train one tooth at a time. This is the ticking.',
    figure: '5 releases per second',
    lead: '5',
    unit: 'releases per second',
  },
  {
    id: 'balance',
    name: 'Balance wheel',
    detail: 'A 10.6mm glucydur wheel swinging against a flat hairspring. Its period is what the watch calls a second.',
    figure: '18,000 semi-oscillations per hour',
    lead: '18,000',
    unit: 'semi-oscillations / hour',
  },
  {
    id: 'hands',
    name: 'Motion work and hands',
    detail: 'The last reduction divides that swing back down into minutes and hours.',
    figure: 'Cumulative deviation −1 to +4 seconds per day',
    lead: '−1 / +4',
    unit: 'seconds per day',
  },
]

// Physical layers, front of the movement to back. Also a fact, not an order
// chosen for the page.
const LAYERS = [
  { id: 'dial-side', name: 'Dial-side plate', thickness: '0.9mm', mm: 0.9, note: 'Carries the motion work and the hand posts.' },
  { id: 'main', name: 'Main plate', thickness: '1.4mm', mm: 1.4, note: 'German silver, frosted by hand. Every pivot is located from this one surface.' },
  { id: 'bridge', name: 'Train bridge', thickness: '0.8mm', mm: 0.8, note: 'One continuous bridge over all four train wheels, black-polished on the upper flanks.' },
  { id: 'balance-cock', name: 'Balance cock', thickness: '0.7mm', mm: 0.7, note: 'Holds the balance from one side only, so the wheel can be seen turning.' },
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

const ATELIER_MARKS = [
  { Icon: MapPin, label: 'Vallée de Joux' },
  { Icon: Users, label: 'Eleven watchmakers' },
  { Icon: Hash, label: '200 movements' },
  { Icon: ClipboardCheck, label: '21 days, six positions' },
  { Icon: InfinityIcon, label: 'Serviced indefinitely' },
]

const chf = (n) => n.toLocaleString('en-CH')

const TOTAL_RUN = 200
const UNALLOCATED = CONFIGURATIONS.reduce((n, c) => n + c.remaining, 0)

// ---------------------------------------------------------------------------
// Movement plan geometry. A drawn schematic, not a photograph: the six stages
// of the power path are located on the plate where the parts actually sit, and
// the trace follows the energy through them.
// ---------------------------------------------------------------------------

const PLATE = { cx: 200, cy: 200, r: 170 }

const NODES = {
  barrel: { x: 128, y: 132, r: 62 },
  centre: { x: 200, y: 200, r: 38 },
  third: { x: 272, y: 150, r: 26 },
  fourth: { x: 286, y: 238, r: 24 },
  escape: { x: 250, y: 300, r: 17 },
  pallet: { x: 214, y: 320 },
  balance: { x: 132, y: 284, r: 54 },
}

function spiral(cx, cy, r0, r1, turns, steps = 200) {
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = t * turns * Math.PI * 2 - Math.PI / 2
    const r = r0 + (r1 - r0) * t
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1) + ' '
  }
  return d.trim()
}

function arcPath(cx, cy, r, a0, a1, steps = 90) {
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const a = ((a0 + (a1 - a0) * (i / steps)) * Math.PI) / 180
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1) + ' '
  }
  return d.trim()
}

const poly = (...pts) => pts.map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.y).join(' ')

// One trace segment per stage, in the order energy travels.
const TRACE = [
  spiral(NODES.barrel.x, NODES.barrel.y, 9, 50, 4),
  arcPath(NODES.barrel.x, NODES.barrel.y, 56, 100, 400),
  poly(NODES.barrel, NODES.centre, NODES.third, NODES.fourth),
  poly(NODES.fourth, NODES.escape, NODES.pallet),
  poly(NODES.pallet, NODES.balance),
  poly(NODES.balance, NODES.centre),
]

// Where the part tag sits for each stage, and where its leader line starts.
const TAGS = [
  { x: -30, y: 82, anchor: 'start', from: { x: 92, y: 104 } },
  { x: -30, y: -2, anchor: 'start', from: { x: 98, y: 80 } },
  { x: 398, y: 54, anchor: 'end', from: { x: 288, y: 130 } },
  { x: 402, y: 392, anchor: 'end', from: { x: 264, y: 314 } },
  { x: -30, y: 402, anchor: 'start', from: { x: 96, y: 330 } },
  { x: 200, y: 442, anchor: 'middle', from: { x: 200, y: 232 } },
]

const teeth = (n, node) => {
  const out = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    out.push(
      <line
        key={i}
        x1={(node.x + Math.cos(a) * (node.r - 4)).toFixed(1)}
        y1={(node.y + Math.sin(a) * (node.r - 4)).toFixed(1)}
        x2={(node.x + Math.cos(a) * node.r).toFixed(1)}
        y2={(node.y + Math.sin(a) * node.r).toFixed(1)}
      />,
    )
  }
  return out
}

const spokes = (n, node) => {
  const out = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.3
    out.push(
      <line
        key={i}
        x1={(node.x + Math.cos(a) * 6).toFixed(1)}
        y1={(node.y + Math.sin(a) * 6).toFixed(1)}
        x2={(node.x + Math.cos(a) * (node.r - 5)).toFixed(1)}
        y2={(node.y + Math.sin(a) * (node.r - 5)).toFixed(1)}
      />,
    )
  }
  return out
}

// 27 jewels, at fixed positions so the drawing is stable between renders.
const JEWELS = [
  [128, 132], [200, 200], [272, 150], [286, 238], [250, 300], [214, 320], [132, 284],
  [166, 108], [96, 176], [238, 118], [304, 190], [258, 258], [188, 296], [104, 236],
  [150, 224], [232, 172], [292, 288], [168, 350], [86, 118], [236, 356], [318, 132],
  [312, 300], [66, 226], [200, 62], [110, 330], [268, 84], [150, 62],
]

function MovementPlan({ active, frac }) {
  const stage = active != null ? POWER_PATH[active] : null
  const tag = active != null ? TAGS[active] : null
  const on = (id) => (stage && stage.id === id ? ' is-lit' : '')

  return (
    <svg
      className="plan"
      viewBox="-46 -34 492 502"
      role="img"
      aria-label="Plan view of Caliber 08 showing the barrel, gear train, escapement, balance wheel and motion work, with the power path traced through them."
    >
      <g className="plan__plate">
        <circle cx={PLATE.cx} cy={PLATE.cy} r={PLATE.r} />
        <circle cx={PLATE.cx} cy={PLATE.cy} r={PLATE.r - 7} className="plan__hair" />
      </g>

      {/* construction marks: every pivot is located from the main plate */}
      <g className="plan__marks">
        <line x1={PLATE.cx} y1={PLATE.cy - PLATE.r - 14} x2={PLATE.cx} y2={PLATE.cy + PLATE.r + 14} />
        <line x1={PLATE.cx - PLATE.r - 14} y1={PLATE.cy} x2={PLATE.cx + PLATE.r + 14} y2={PLATE.cy} />
      </g>

      <g className={'plan__part' + on('mainspring') + on('barrel')}>
        <path className={'plan__spring' + on('mainspring')} d={TRACE[0]} />
        <g className={'plan__barrel-body' + on('barrel')}>
          <circle cx={NODES.barrel.x} cy={NODES.barrel.y} r={NODES.barrel.r} className="plan__rim" />
          <circle cx={NODES.barrel.x} cy={NODES.barrel.y} r={NODES.barrel.r - 6} className="plan__hair" />
          <path className="plan__stopwork" d="M128 62 L128 44 L146 44" />
          <g className="plan__teeth">{teeth(72, NODES.barrel)}</g>
        </g>
      </g>

      <g className={'plan__part' + on('train')}>
        {[[NODES.centre, 48, 5], [NODES.third, 36, 5], [NODES.fourth, 32, 5]].map(([node, t, s], i) => (
          <g key={i}>
            <circle cx={node.x} cy={node.y} r={node.r} className="plan__rim" />
            <g className="plan__teeth">{teeth(t, node)}</g>
            <g className="plan__spokes">{spokes(s, node)}</g>
          </g>
        ))}
      </g>

      <g className={'plan__part' + on('escapement')}>
        <circle cx={NODES.escape.x} cy={NODES.escape.y} r={NODES.escape.r} className="plan__rim" />
        <g className="plan__teeth">{teeth(15, NODES.escape)}</g>
        <g className="plan__fork">
          <path d="M250 300 L214 320 L194 308 M214 320 L194 332" />
          <circle cx="214" cy="320" r="4" className="plan__pivot" />
        </g>
      </g>

      <g className={'plan__part' + on('balance')}>
        <circle cx={NODES.balance.x} cy={NODES.balance.y} r={NODES.balance.r} className="plan__rim" />
        <circle cx={NODES.balance.x} cy={NODES.balance.y} r={NODES.balance.r - 5} className="plan__hair" />
        <g className="plan__spokes">{spokes(2, NODES.balance)}</g>
        {[45, 135, 225, 315].map((a) => (
          <circle
            key={a}
            cx={(NODES.balance.x + Math.cos((a * Math.PI) / 180) * (NODES.balance.r - 3)).toFixed(1)}
            cy={(NODES.balance.y + Math.sin((a * Math.PI) / 180) * (NODES.balance.r - 3)).toFixed(1)}
            r="4"
            className="plan__weight"
          />
        ))}
        <path className={'plan__hairspring' + on('balance')} d={spiral(NODES.balance.x, NODES.balance.y, 4, 30, 5)} />
      </g>

      <g className={'plan__part' + on('hands')}>
        <circle cx={NODES.centre.x} cy={NODES.centre.y} r="15" className="plan__rim" />
        <circle cx={NODES.centre.x} cy={NODES.centre.y} r="8" className="plan__rim" />
        <path className="plan__hands" d="M200 200 L200 116 M200 200 L248 248" />
      </g>

      <g className="plan__jewels">
        {JEWELS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" />
        ))}
      </g>

      {/* the traced power path */}
      <g className="plan__trace">
        {TRACE.map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength="100"
            style={{ strokeDashoffset: i < active ? 0 : i === active ? 100 - Math.round(frac * 100) : 100 }}
            className={
              'plan__seg' +
              (active === i ? ' is-active' : '') +
              (i === 5 ? ' plan__seg--return' : '')
            }
          />
        ))}
      </g>

      {/* the beat: five releases a second, shown only at the escapement */}
      {stage && stage.id === 'escapement' && (
        <circle className="plan__beat" cx={NODES.escape.x} cy={NODES.escape.y} r={NODES.escape.r + 9} />
      )}

      {stage && (
        <g className="plan__tag" key={stage.id}>
          <path
            className="plan__leader"
            d={
              'M' + tag.from.x + ' ' + tag.from.y + ' L' +
              (tag.x + (tag.anchor === 'end' ? -6 : tag.anchor === 'middle' ? 0 : 6)) + ' ' +
              (tag.y - 5)
            }
          />
          <circle cx={tag.from.x} cy={tag.from.y} r="3.5" className="plan__leader-dot" />
          <text x={tag.x} y={tag.y} textAnchor={tag.anchor}>{stage.name}</text>
        </g>
      )}
    </svg>
  )
}

// The same plate, unlit and empty: the drawing before the mechanism goes in.
function PlateOutline() {
  return (
    <svg
      className="outline"
      viewBox="-58 -40 552 500"
      role="img"
      aria-label="Outline drawing of the Caliber 08 main plate, 31.0mm across and 3.8mm high, with its twenty-seven jewels located."
    >
      <g className="outline__dim">
        <line x1={PLATE.cx - PLATE.r} y1="-6" x2={PLATE.cx - PLATE.r} y2="34" />
        <line x1={PLATE.cx + PLATE.r} y1="-6" x2={PLATE.cx + PLATE.r} y2="34" />
        <path d={'M' + (PLATE.cx - PLATE.r) + ' 14 L' + (PLATE.cx + PLATE.r) + ' 14'} />
        <text x={PLATE.cx} y="4" textAnchor="middle">Ø 31.0mm</text>
      </g>

      <circle className="outline__plate" cx={PLATE.cx} cy={PLATE.cy} r={PLATE.r} />
      <circle className="outline__hair" cx={PLATE.cx} cy={PLATE.cy} r={PLATE.r - 7} />
      <circle className="outline__hair" cx={PLATE.cx} cy={PLATE.cy} r={PLATE.r - 30} />

      <g className="outline__ghost">
        <circle cx={NODES.barrel.x} cy={NODES.barrel.y} r={NODES.barrel.r} />
        <circle cx={NODES.balance.x} cy={NODES.balance.y} r={NODES.balance.r} />
        <circle cx={NODES.centre.x} cy={NODES.centre.y} r={NODES.centre.r} />
        <circle cx={NODES.third.x} cy={NODES.third.y} r={NODES.third.r} />
        <circle cx={NODES.fourth.x} cy={NODES.fourth.y} r={NODES.fourth.r} />
        <circle cx={NODES.escape.x} cy={NODES.escape.y} r={NODES.escape.r} />
      </g>

      <g className="outline__jewels">
        {JEWELS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.2" />
        ))}
      </g>

      <g className="outline__marks">
        <line x1={PLATE.cx} y1={PLATE.cy - PLATE.r - 16} x2={PLATE.cx} y2={PLATE.cy + PLATE.r + 16} />
        <line x1={PLATE.cx - PLATE.r - 16} y1={PLATE.cy} x2={PLATE.cx + PLATE.r + 16} y2={PLATE.cy} />
      </g>

      {/* side elevation: 3.8mm, which is the four layers added up */}
      <g className="outline__side">
        <rect x={PLATE.cx - PLATE.r} y="410" width={PLATE.r * 2} height="20" />
        <line x1={PLATE.cx - PLATE.r - 20} y1="410" x2={PLATE.cx - PLATE.r - 20} y2="430" />
        <text x={PLATE.cx - PLATE.r - 28} y="426" textAnchor="end">3.8mm</text>
        <text x={PLATE.cx + PLATE.r + 8} y="426" textAnchor="start">27 jewels</text>
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------------------

function useReveal() {
  useEffect(() => {
    // Written as an attribute rather than a class: React owns className on
    // some of these elements and would wipe the revealed state on re-render.
    const els = Array.from(document.querySelectorAll('[data-reveal="true"]'))
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.setAttribute('data-reveal', 'in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.setAttribute('data-reveal', 'in')
            io.unobserve(en.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    )
    els.forEach((e) => {
      // Anything already on screen at load must not animate in.
      if (e.getBoundingClientRect().top < window.innerHeight * 0.92) e.setAttribute('data-reveal', 'shown')
      else io.observe(e)
    })
    return () => io.disconnect()
  }, [])
}

function PowerPath() {
  const [active, setActive] = useState(0)
  const [frac, setFrac] = useState(0)
  const stageRefs = useRef([])

  // Driven from scroll position rather than an observer, so the lit stage is
  // correct at any scroll offset — including an anchor jump or a restored
  // position, where an intersection observer leaves the wrong stage lit.
  useEffect(() => {
    let frame = 0
    const read = () => {
      frame = 0
      const els = stageRefs.current.filter(Boolean)
      if (!els.length) return
      const middle = window.innerHeight * 0.5
      const first = els[0].getBoundingClientRect()
      const last = els[els.length - 1].getBoundingClientRect()
      const span = last.bottom - first.top
      // 0 at the head of the first stage, 6 at the foot of the last: the energy
      // advances with the reader rather than snapping between six states.
      const p = Math.max(0, Math.min(els.length, ((middle - first.top) / span) * els.length))
      const next = Math.max(0, Math.min(els.length - 1, Math.floor(p)))
      setActive((prev) => (prev === next ? prev : next))
      setFrac(Math.max(0, Math.min(1, p - next)))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const progress = (active + frac) / POWER_PATH.length

  function onKeyDown(e) {
    const fwd = e.key === 'ArrowDown' || e.key === 'ArrowRight'
    const back = e.key === 'ArrowUp' || e.key === 'ArrowLeft'
    if (!fwd && !back) return
    e.preventDefault()
    const i = Math.max(0, Math.min(POWER_PATH.length - 1, active + (fwd ? 1 : -1)))
    setActive(i)
    setFrac(1)
    const el = stageRefs.current[i]
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      el.focus({ preventScroll: true })
    }
  }

  return (
    <section className="path" id="power-path" aria-labelledby="path-h">
      <div className="band-head band-head--dark" data-reveal>
        <p className="eyebrow"><span className="eyebrow__no">02</span> The power path</p>
        <h2 id="path-h">Seventy-two hours, spent one tooth at a time.</h2>
        <p className="band-head__lede">
          Six stages, in the order energy travels through them. The trace starts coiled in the
          barrel and ends at the tip of a minute hand.
        </p>
        <div className="path__rail" aria-hidden="true">
          <span className="path__rail-fill" style={{ transform: 'scaleX(' + progress.toFixed(4) + ')' }} />
          <span className="path__rail-a">Mainspring</span>
          <span className="path__rail-b">Hands</span>
        </div>
      </div>

      <div className="path__grid">
        <div className="path__stagewrap">
          <div className="path__plan">
            <MovementPlan active={active} frac={frac} />
            <p className="path__counter" aria-hidden="true">
              <span className="path__counter-no">{String(active + 1).padStart(2, '0')}</span>
              <span className="path__counter-of">/ 06</span>
            </p>
          </div>
        </div>

        <ol className="path__list">
          {POWER_PATH.map((s, i) => (
            <li
              key={s.id}
              data-stage={s.id}
              data-index={i}
              ref={(el) => (stageRefs.current[i] = el)}
              tabIndex={0}
              className={'stage' + (active === i ? ' is-active' : '') + (i < active ? ' is-past' : '')}
              onFocus={() => { setActive(i); setFrac(1) }}
              onMouseEnter={() => { setActive(i); setFrac(1) }}
              onKeyDown={onKeyDown}
              aria-current={active === i ? 'step' : undefined}
            >
              <p className="stage__figure">
                <span className="stage__lead">{s.lead}</span>
                <span className="stage__unit">{s.unit}</span>
              </p>
              <h3 className="stage__name">
                <span className="stage__no">{String(i + 1).padStart(2, '0')}</span>
                {s.name}
              </h3>
              <p className="stage__detail">{s.detail}</p>
              <p className="stage__full">{s.figure}.</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Construction() {
  const [open, setOpen] = useState(null)
  const total = LAYERS.reduce((n, l) => n + l.mm, 0)

  return (
    <section className="layers" id="construction" aria-labelledby="layers-h">
      <div className="band-head" data-reveal>
        <p className="eyebrow"><span className="eyebrow__no">03</span> Construction</p>
        <h2 id="layers-h">Four layers, {total.toFixed(1)}mm from dial side to case back.</h2>
        <p className="band-head__lede">
          Shown edge-on and to scale. Take one away and everything below it loses its reference.
        </p>
      </div>

      <div className="layers__body" data-reveal>
        <div className="layers__stack">
          <p className="layers__edge">Dial side</p>
          <div className="layers__slabs">
            {LAYERS.map((l, i) => (
              <button
                key={l.id}
                type="button"
                data-layer={l.id}
                className={'slab' + (open === i ? ' is-open' : '')}
                style={{ '--mm': l.mm }}
                onMouseEnter={() => setOpen(i)}
                onMouseLeave={() => setOpen(null)}
                onFocus={() => setOpen(i)}
                onBlur={() => setOpen(null)}
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                aria-controls={'layer-note-' + l.id}
              >
                <span className="slab__face" aria-hidden="true" />
                <span className="slab__name">{l.name}</span>
                <span className="slab__mm num">{l.thickness}</span>
              </button>
            ))}
            <span className="layers__dim" aria-hidden="true">
              <span className="layers__dim-value num">{total.toFixed(1)}mm</span>
            </span>
          </div>
          <p className="layers__edge">Case back</p>
        </div>

        <div className="layers__notes">
          {LAYERS.map((l, i) => (
            <p
              key={l.id}
              id={'layer-note-' + l.id}
              className={'layers__note' + (open === i ? ' is-open' : '')}
            >
              <span className="layers__note-name">
                {l.name} <span className="num">{l.thickness}</span>
              </span>
              {l.note}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

function Specification() {
  return (
    <section className="spec" id="specification" aria-labelledby="spec-h">
      <div className="spec__inner" data-reveal>
        <div className="spec__head">
          <p className="eyebrow"><span className="eyebrow__no">04</span> Specification</p>
          <h2 id="spec-h">The sheet.</h2>
          <p className="spec__note">Measured at delivery and again at every service.</p>
        </div>
        <dl className="spec__list">
          {SPECS.map(([k, v]) => (
            <div className="spec__row" key={k}>
              <dt>{k}</dt>
              <dd className="num">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Workshop() {
  return (
    <section className="shop" id="workshop" aria-labelledby="shop-h">
      <div className="band-head" data-reveal>
        <p className="eyebrow"><span className="eyebrow__no">05</span> The workshop</p>
        <h2 id="shop-h">Eleven people, and then the tooling is retired.</h2>
      </div>

      <figure className="shop__figure" data-reveal>
        <img
          src={valleePhoto}
          alt="The Jura valley at Le Brassus, Vallée de Joux, under low cloud."
          width="1280"
          height="720"
          loading="lazy"
        />
        <figcaption>Le Brassus, Vallée de Joux. Photograph: Shev123, Wikimedia Commons, CC0.</figcaption>
      </figure>

      <ul className="shop__facts">
        {ATELIER.map((a, i) => {
          const { Icon, label } = ATELIER_MARKS[i]
          return (
            <li key={a} data-reveal className={i === 2 ? 'is-lead' : undefined}>
              <span className="shop__mark" aria-hidden="true">
                <Icon size={17} strokeWidth={1.5} />
              </span>
              <span className="shop__label">{label}</span>
              <p>{a}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Allocation({ selected }) {
  // 200 movements. 123 are spoken for; the remaining 77 are grouped by finish.
  const ticks = []
  for (let i = 0; i < TOTAL_RUN - UNALLOCATED; i++) ticks.push(null)
  CONFIGURATIONS.forEach((c) => {
    for (let i = 0; i < c.remaining; i++) ticks.push(c.id)
  })
  const chosen = CONFIGURATIONS.find((c) => c.id === selected)

  return (
    <div className="alloc" data-reveal>
      <div className={'alloc__ticks' + (selected ? ' is-filtered' : '')} aria-hidden="true">
        {ticks.map((id, i) => (
          <span
            key={i}
            className={'alloc__tick' + (id ? ' is-free' : '') + (id && selected === id ? ' is-picked' : '')}
          />
        ))}
      </div>
      <p className="alloc__caption">
        <span className="num alloc__big">{UNALLOCATED}</span> of {TOTAL_RUN} movements are still
        unallocated
        {chosen ? (
          <>
            {' — '}
            <span className="num">{chosen.remaining}</span> of them in {chosen.name.toLowerCase()}
          </>
        ) : null}
        .
      </p>
    </div>
  )
}

const SWATCHES = {
  frosted: (
    <svg viewBox="0 0 60 60" aria-hidden="true" className="swatch swatch--frosted">
      <rect width="60" height="60" className="swatch__ground" />
      {Array.from({ length: 150 }, (_, i) => {
        const x = 3 + ((i * 17) % 55) + ((i % 5) - 2) * 0.7
        const y = 3 + ((i * 29) % 55) + ((i % 7) - 3) * 0.6
        return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={(0.9 + (i % 3) * 0.3).toFixed(2)} />
      })}
    </svg>
  ),
  skeleton: (
    <svg viewBox="0 0 60 60" aria-hidden="true" className="swatch swatch--skeleton">
      <path d="M30 2 L55 16.5 L55 43.5 L30 58 L5 43.5 L5 16.5 Z" className="swatch__body" />
      <path d="M30 13 L46 22 L46 38 L30 47 L14 38 L14 22 Z" className="swatch__cut" />
      <path d="M30 2 L55 16.5 M5 43.5 L30 58" className="swatch__angle" />
    </svg>
  ),
  black: (
    <svg viewBox="0 0 60 60" aria-hidden="true" className="swatch swatch--black">
      <defs>
        <linearGradient id="sw-black" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b0c0d" />
          <stop offset="0.44" stopColor="#0b0c0d" />
          <stop offset="0.5" stopColor="#d7dbda" />
          <stop offset="0.56" stopColor="#0b0c0d" />
          <stop offset="1" stopColor="#0b0c0d" />
        </linearGradient>
      </defs>
      <rect width="60" height="60" fill="url(#sw-black)" />
    </svg>
  ),
}

function Reserve() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)

  const chosen = CONFIGURATIONS.find((c) => c.id === config)
  const ready = Boolean(name && email && config)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  return (
    <section className="reserve" id="reserve" aria-labelledby="reserve-h">
      <div className="band-head" data-reveal>
        <p className="eyebrow"><span className="eyebrow__no">06</span> Finishes and reservation</p>
        <h2 id="reserve-h">Three finishes. The price is for the movement alone.</h2>
        <p className="band-head__lede">Casing is arranged separately.</p>
      </div>

      <Allocation selected={config} />

      {reserved ? (
        <div className="record" role="status">
          <p className="record__stamp">Reserved</p>
          <p className="record__lede">
            {name}, we have held one {chosen.name} movement at CHF {chf(chosen.price)} and will
            write to {email}. {chosen.lead}.
          </p>
          <dl className="record__rows">
            <div><dt>Finish</dt><dd>{chosen.name}</dd></div>
            <div><dt>Price</dt><dd className="num">CHF {chf(chosen.price)}</dd></div>
            <div><dt>Delivery</dt><dd>{chosen.lead}</dd></div>
            <div><dt>Correspondence</dt><dd>{email}</dd></div>
          </dl>
          <p className="record__note">
            Reservations are not binding and no payment is taken now. We will write once, with the
            timing record of the movement allocated to you.
          </p>
        </div>
      ) : (
        <form className="reserve__form" onSubmit={handleSubmit}>
          <fieldset className="finishes">
            <legend className="sr-only">Which finish?</legend>
            <div className="finishes__grid">
              {CONFIGURATIONS.map((c) => (
                <label
                  key={c.id}
                  data-config={c.id}
                  className={'finish' + (config === c.id ? ' is-chosen' : '')}
                  data-reveal
                >
                  <input
                    type="radio"
                    name="config"
                    value={c.id}
                    required
                    checked={config === c.id}
                    onChange={(e) => setConfig(e.target.value)}
                  />
                  <span className="finish__swatch">{SWATCHES[c.id]}</span>
                  <span className="finish__name">{c.name}</span>
                  <span className="finish__price num">CHF {chf(c.price)}</span>
                  <span className="finish__finish">{c.finish}</span>
                  <span className="finish__meta">
                    <span>{c.lead}</span>
                    <span className="finish__left num">{c.remaining} of the run still unallocated</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="reserve__panel" data-reveal>
            <div className="reserve__fields">
              <p className="reserve__title">Reserve a movement</p>
              <div className="field">
                <label htmlFor="name">Your name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn" disabled={!ready}>
                Reserve a movement
              </button>
              <p className="reserve__hint" aria-live="polite">
                {chosen
                  ? chosen.name + ' — CHF ' + chf(chosen.price) + '. ' + chosen.lead + '.'
                  : 'Choose a finish above to continue.'}
              </p>
            </div>
            <div className="reserve__aside">
              <p className="reserve__aside-title">This reservation</p>
              <dl className="reserve__summary">
                <div><dt>Finish</dt><dd>{chosen ? chosen.name : <span className="muted">Not chosen</span>}</dd></div>
                <div><dt>Price</dt><dd className="num">{chosen ? 'CHF ' + chf(chosen.price) : <span className="muted">—</span>}</dd></div>
                <div><dt>Delivery</dt><dd>{chosen ? chosen.lead : <span className="muted">—</span>}</dd></div>
              </dl>
              <p className="reserve__terms">
                Reservations are not binding and no payment is taken now. We will write once, with
                the timing record of the movement allocated to you.
              </p>
            </div>
          </div>
        </form>
      )}
    </section>
  )
}

export default function App() {
  useReveal()

  return (
    <>
      <header className="bar">
        <a className="bar__mark" href="#top">
          <span className="bar__house">Aubry &amp; Vent</span>
          <span className="bar__ref num">Cal. 08</span>
        </a>
        <nav className="bar__nav" aria-label="Sections">
          <a href="#power-path">Power path</a>
          <a href="#construction">Construction</a>
          <a href="#specification">Specification</a>
          <a href="#workshop">Workshop</a>
        </nav>
        <a className="bar__cta" href="#reserve">
          Reserve<span className="bar__left num">{UNALLOCATED} left</span>
        </a>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-h">
          <div className="hero__type">
            <p className="eyebrow"><span className="eyebrow__no">01</span> Vallée de Joux · Manual winding</p>
            <h1 id="hero-h">
              Caliber<span className="hero__num">08</span>
            </h1>
            <p className="hero__lede">
              A manual-winding mechanical movement, made in a run of 200 and then never again.
            </p>
            <p className="hero__claim">
              Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five
              times a second, for three days from a single wind.
            </p>
            <div className="hero__actions">
              <a className="btn" href="#reserve">Reserve a movement</a>
              <a className="btn btn--quiet" href="#power-path">Follow the power path</a>
            </div>
          </div>

          <div className="hero__plate">
            <PlateOutline />
          </div>

          <dl className="hero__block">
            {[
              ['Reference', 'Caliber 08'],
              ['Diameter', '31.0mm'],
              ['Height', '3.8mm'],
              ['Jewels', '27'],
              ['Components', '214'],
              ['Run', '200'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd className="num">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <PowerPath />
        <Construction />
        <Specification />
        <Workshop />
        <Reserve />
      </main>

      <footer className="foot">
        <div className="foot__inner">
          <p className="foot__house">Aubry &amp; Vent</p>
          <ul className="foot__links">
            <li><a href="#workshop">Servicing</a></li>
            <li><a href="#workshop">Provenance</a></li>
            <li><a href="#reserve">Terms of reservation</a></li>
          </ul>
          <p className="foot__mail">
            Enquiries <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
          </p>
          <p className="foot__legal">Aubry &amp; Vent. Caliber 08. © 2026.</p>
        </div>
      </footer>
    </>
  )
}
