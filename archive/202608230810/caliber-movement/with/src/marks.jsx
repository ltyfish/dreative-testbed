// Technical marks, drawn as line diagrams. These are schematics of the parts —
// not attempts at photographs of them. The photographs on the page are real and
// credited; see assets/CREDITS.md.

function spiral({ cx = 20, cy = 20, r0 = 1.5, r1 = 15, turns = 3.2, steps = 220 }) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = t * turns * Math.PI * 2 - Math.PI / 2
    const r = r0 + (r1 - r0) * t
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`)
  }
  return 'M' + pts.join(' L')
}

function toothedCircle({ cx, cy, r, teeth, depth = 2 }) {
  const pts = []
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2
    const rr = i % 2 === 0 ? r : r - depth
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`)
  }
  return 'M' + pts.join(' L') + ' Z'
}

function escapeWheel({ cx, cy, r, teeth = 15 }) {
  const pts = []
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2
    const b = ((i + 0.42) / teeth) * Math.PI * 2
    pts.push(`M${(cx + Math.cos(a) * r * 0.62).toFixed(2)},${(cy + Math.sin(a) * r * 0.62).toFixed(2)}`)
    pts.push(`L${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`)
    pts.push(`L${(cx + Math.cos(b) * r * 0.62).toFixed(2)},${(cy + Math.sin(b) * r * 0.62).toFixed(2)}`)
  }
  return pts.join(' ')
}

const svg = {
  viewBox: '0 0 40 40',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
}

function Mainspring() {
  return (
    <svg {...svg} className="mark">
      <circle cx="20" cy="20" r="18" className="mark-faint" />
      <path d={spiral({})} />
      <rect x="18.5" y="18.5" width="3" height="3" />
    </svg>
  )
}

function Barrel() {
  return (
    <svg {...svg} className="mark">
      <path d={toothedCircle({ cx: 20, cy: 20, r: 17, teeth: 30, depth: 2.2 })} />
      <circle cx="20" cy="20" r="10.5" className="mark-faint" />
      <path d="M20 9.5 A10.5 10.5 0 0 1 30.5 20" strokeWidth="2.4" />
      <circle cx="20" cy="20" r="2" />
    </svg>
  )
}

function Train() {
  return (
    <svg {...svg} className="mark">
      <path d={toothedCircle({ cx: 12, cy: 24, r: 12, teeth: 22, depth: 1.8 })} />
      <path d={toothedCircle({ cx: 28, cy: 15, r: 8.5, teeth: 16, depth: 1.6 })} />
      <path d={toothedCircle({ cx: 33, cy: 30, r: 5, teeth: 11, depth: 1.4 })} />
      <circle cx="12" cy="24" r="1.4" />
      <circle cx="28" cy="15" r="1.4" />
      <circle cx="33" cy="30" r="1.4" />
    </svg>
  )
}

function Escapement() {
  return (
    <svg {...svg} className="mark mark-escapement">
      <g className="mark-escapewheel">
        <path d={escapeWheel({ cx: 15, cy: 22, r: 12.5 })} />
        <circle cx="15" cy="22" r="2.6" />
      </g>
      <g className="mark-lever">
        <path d="M33 8 L33 30 M33 30 L26.5 26 M33 30 L28 34" strokeWidth="1.4" />
        <circle cx="33" cy="30" r="1.6" />
      </g>
    </svg>
  )
}

function Balance() {
  return (
    <svg {...svg} className="mark mark-balance">
      <g className="mark-wheel">
        <circle cx="20" cy="20" r="17" strokeWidth="1.6" />
        <path d="M3 20 H37 M20 3 V37" />
        <path d={spiral({ r0: 1.2, r1: 8.5, turns: 2.6, steps: 160 })} className="mark-faint" />
        <circle cx="20" cy="20" r="2" />
      </g>
      <path d="M20 0.5 V4" className="mark-index" strokeWidth="1.6" />
    </svg>
  )
}

function Hands() {
  return (
    <svg {...svg} className="mark">
      <circle cx="20" cy="20" r="18" className="mark-faint" />
      <path d={toothedCircle({ cx: 20, cy: 20, r: 9, teeth: 18, depth: 1.4 })} className="mark-faint" />
      <path d="M20 20 L20 7.5" strokeWidth="2" />
      <path d="M20 20 L31 25" strokeWidth="1.2" />
      <circle cx="20" cy="20" r="1.8" fill="currentColor" />
    </svg>
  )
}

export const STAGE_MARKS = {
  mainspring: Mainspring,
  barrel: Barrel,
  train: Train,
  escapement: Escapement,
  balance: Balance,
  hands: Hands,
}
