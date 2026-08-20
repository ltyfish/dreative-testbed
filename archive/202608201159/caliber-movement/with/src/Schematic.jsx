// A drawn top-plate view of Caliber 08. This is a technical schematic, not a
// photograph of a movement: every part sits where the power path puts it, so
// the drawing can be lit stage by stage as the reader moves through it.

function toothedWheel(cx, cy, r, teeth, depth = 0.14) {
  const inner = r * (1 - depth)
  const pts = []
  const step = (Math.PI * 2) / (teeth * 2)
  for (let i = 0; i < teeth * 2; i++) {
    const rad = i % 2 === 0 ? r : inner
    const a = i * step - Math.PI / 2
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
}

function spiral(cx, cy, r0, r1, turns, points = 240) {
  const d = []
  for (let i = 0; i <= points; i++) {
    const t = i / points
    const a = t * turns * Math.PI * 2
    const r = r0 + (r1 - r0) * t
    d.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`)
  }
  return `M${d.join('L')}`
}

// Where each stage sits on the plate. FLOW traces them in the order energy
// travels, which is the order the section reads in.
const P = {
  mainspring: [138, 148],
  barrel: [138, 148],
  train: [206, 120],
  escapement: [296, 206],
  balance: [188, 286],
  hands: [200, 200],
}

const TRAIN = [
  [206, 120, 28, 38],
  [246, 106, 20, 30],
  [274, 140, 16, 24],
  [290, 174, 11, 18],
]

const FLOW =
  'M138,148 C168,124 186,116 206,120 C244,127 274,150 296,206 C300,246 244,282 188,286 C180,262 190,228 200,200'

const TRAIN_BRIDGE = 'M198,116 C242,102 274,130 294,190'
const BALANCE_COCK = 'M92,336 C126,310 158,296 188,286'

export default function Schematic({ active, beating, id = 'plate', plain = false }) {
  const on = (stage) => (active === stage ? ' is-lit' : '')
  return (
    <svg
      className="plate"
      viewBox="0 0 400 400"
      role={plain ? 'presentation' : 'img'}
      aria-hidden={plain || undefined}
      aria-label={plain ? undefined : "Technical drawing of Caliber 08 seen from the bridge side: barrel and mainspring at the left, the four-wheel train under one continuous bridge at the top right, the escapement at the right, the balance wheel under its cock at the lower left, and the motion work at the centre."}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <circle cx="200" cy="200" r="176" />
        </clipPath>
        <path id={`${id}-engrave`} d="M200,200 m-152,0 a152,152 0 1,1 304,0" fill="none" />
      </defs>

      {/* main plate, frosted */}
      <g clipPath={`url(#${id}-clip)`}>
        <circle cx="200" cy="200" r="176" className="plate-disc" />
        {!plain &&
          Array.from({ length: 60 }).map((_, i) => (
            <line key={i} className="plate-grain" x1={-40 + i * 8} y1="16" x2={24 + i * 8} y2="400" />
          ))}
      </g>
      <circle cx="200" cy="200" r="176" className="plate-edge" />
      <circle cx="200" cy="200" r="167" className="plate-edge-inner" />
      {!plain && (
        <text className="engrave">
          <textPath href={`#${id}-engrave`} startOffset="50%" textAnchor="middle">
            AUBRY &amp; VENT · CALIBER 08 · VALLÉE DE JOUX
          </textPath>
        </text>
      )}

      {/* bridges: one continuous train bridge, and the one-armed balance cock */}
      <path className="bridge-edge" d={TRAIN_BRIDGE} strokeWidth="66" />
      <path className="bridge" d={TRAIN_BRIDGE} strokeWidth="64" />
      <path className="bridge-edge" d={BALANCE_COCK} strokeWidth="36" />
      <path className="bridge" d={BALANCE_COCK} strokeWidth="34" />

      {/* the line energy travels, and the pulse that travels it */}
      {!plain && (
        <>
          <path className="flow-track" d={FLOW} />
          <path className={`flow-pulse${beating ? ' is-running' : ''}`} d={FLOW} />
        </>
      )}

      {/* barrel + mainspring */}
      <g className={`part part-barrel${on('barrel') || on('mainspring')}`}>
        <circle cx={P.barrel[0]} cy={P.barrel[1]} r="60" className="part-fill" />
        <path d={toothedWheel(P.barrel[0], P.barrel[1], 60, 62, 0.06)} className="part-teeth" />
        <path d={spiral(P.barrel[0], P.barrel[1], 11, 51, 6.5)} className="mainspring" />
        <circle cx={P.barrel[0]} cy={P.barrel[1]} r="9" className="arbor" />
      </g>

      {/* gear train: four wheels stepping up under the bridge */}
      <g className={`part part-train${on('train')}`}>
        {TRAIN.map(([x, y, r, t], i) => (
          <g key={i}>
            <path d={toothedWheel(x, y, r, t, 0.17)} className="part-teeth" />
            <circle cx={x} cy={y} r={r * 0.34} className="part-fill" />
            <circle cx={x} cy={y} r="3" className="arbor" />
          </g>
        ))}
      </g>

      {/* escapement: escape wheel and lever */}
      <g className={`part part-escapement${on('escapement')}`}>
        <path d={toothedWheel(P.escapement[0], P.escapement[1], 24, 15, 0.36)} className="part-teeth" />
        <circle cx={P.escapement[0]} cy={P.escapement[1]} r="3.6" className="arbor" />
        <g className={`lever-group${beating ? ' is-beating' : ''}`} style={{ transformOrigin: '256px 236px' }}>
          <path className="lever" d="M256,236 L282,222 M256,236 L240,220 M256,236 L232,258" />
          <circle cx="282" cy="222" r="3" className="jewel-pallet" />
          <circle cx="240" cy="220" r="3" className="jewel-pallet" />
        </g>
        <circle cx="256" cy="236" r="3.4" className="arbor" />
      </g>

      {/* balance wheel under its cock */}
      <g className={`part part-balance${on('balance')}`}>
        <g
          className={`balance-spin${beating ? ' is-beating' : ''}`}
          style={{ transformOrigin: `${P.balance[0]}px ${P.balance[1]}px` }}
        >
          <path d={spiral(P.balance[0], P.balance[1], 5, 32, 11)} className="hairspring" />
          <circle cx={P.balance[0]} cy={P.balance[1]} r="52" className="balance-rim" />
          <line x1={P.balance[0] - 52} y1={P.balance[1]} x2={P.balance[0] + 52} y2={P.balance[1]} className="balance-arm" />
          <line x1={P.balance[0]} y1={P.balance[1] - 52} x2={P.balance[0]} y2={P.balance[1] + 52} className="balance-arm" />
          {[45, 135, 225, 315].map((a) => (
            <circle
              key={a}
              cx={P.balance[0] + Math.cos((a * Math.PI) / 180) * 52}
              cy={P.balance[1] + Math.sin((a * Math.PI) / 180) * 52}
              r="5.5"
              className="inertia-weight"
            />
          ))}
        </g>
        <circle cx={P.balance[0]} cy={P.balance[1]} r="4" className="arbor" />
      </g>

      {/* motion work and hands at the centre */}
      <g className={`part part-hands${on('hands')}`}>
        <path d={toothedWheel(200, 200, 26, 34, 0.12)} className="part-teeth" />
        <circle cx="200" cy="200" r="18" className="part-fill" />
        <line x1="200" y1="200" x2="200" y2="146" className="hand hand-min" />
        <line x1="200" y1="200" x2="236" y2="222" className="hand hand-hr" />
        <circle cx="200" cy="200" r="4.5" className="arbor" />
      </g>

      {/* the two colours the movement actually has: ruby jewels, blued screws */}
      {[...TRAIN.map(([x, y]) => [x, y]), P.escapement, P.balance, P.barrel, [200, 200]].map(
        ([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.4" className="jewel" />
        ),
      )}
      {[[236, 92], [300, 148], [312, 214], [92, 336], [148, 316], [64, 208]].map(([x, y], i) => (
        <g key={i} className="screw">
          <circle cx={x} cy={y} r="5.4" />
          <line x1={x - 3.4} y1={y} x2={x + 3.4} y2={y} className="screw-slot" />
        </g>
      ))}
    </svg>
  )
}
