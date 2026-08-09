// One purpose-built figure per performance metric. They are deliberately not
// interchangeable: each draws the thing the number is actually measuring, so a
// reader can tell the four apart without reading the labels.

export function LatencyFigure() {
  // Query-time distribution. Buckets in ms; the marker sits at the median.
  const buckets = [3, 9, 21, 34, 27, 16, 9, 5, 3, 2]
  const max = Math.max(...buckets)
  return (
    <svg className="fig" viewBox="0 0 200 56" role="img" aria-label="Query time distribution, median marked at 340 milliseconds">
      {buckets.map((b, i) => (
        <rect
          key={i}
          x={i * 20 + 1}
          y={44 - (b / max) * 40}
          width="17"
          height={(b / max) * 40}
          className={i === 3 ? 'fig-bar fig-bar-key' : 'fig-bar'}
        />
      ))}
      <line x1="70" y1="0" x2="70" y2="50" className="fig-marker" />
      <text x="74" y="54" className="fig-tick">340ms</text>
      <text x="1" y="54" className="fig-tick">0</text>
    </svg>
  )
}

export function OnboardingFigure() {
  // Eleven minutes, as the three steps a new workspace actually goes through.
  const steps = [
    { label: 'connect', mins: 2 },
    { label: 'model', mins: 5 },
    { label: 'publish', mins: 4 },
  ]
  let x = 1
  return (
    <svg className="fig" viewBox="0 0 200 56" role="img" aria-label="Eleven minutes split into connect, model, and publish">
      {steps.map((s, i) => {
        const w = (s.mins / 11) * 198
        const el = (
          <g key={s.label}>
            <rect x={x} y="14" width={w - 2} height="16" className={i === 1 ? 'fig-bar fig-bar-key' : 'fig-bar'} />
            <text x={x} y="44" className="fig-tick">{s.label}</text>
            <text x={x} y="10" className="fig-tick">{s.mins}m</text>
          </g>
        )
        x += w
        return el
      })}
    </svg>
  )
}

export function GovernedFigure() {
  // Cumulative governed definitions, eight quarters, drawn as a step.
  const pts = [1400, 2900, 4300, 6800, 8900, 11800, 15100, 18400]
  const max = 18400
  let d = 'M 1 50'
  pts.forEach((p, i) => {
    const x = 1 + (i / (pts.length - 1)) * 197
    const y = 50 - (p / max) * 42
    d += ` L ${x.toFixed(1)} ${(i === 0 ? 50 : 50 - (pts[i - 1] / max) * 42).toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)}`
  })
  return (
    <svg className="fig" viewBox="0 0 200 56" role="img" aria-label="Governed definitions rising over eight quarters to 18,400">
      <path d={d} className="fig-step" />
      <circle cx="198" cy={50 - 42} r="2.6" className="fig-dot" />
      <text x="1" y="55" className="fig-tick">2024 Q1</text>
      <text x="199" y="55" textAnchor="end" className="fig-tick">2026 Q1</text>
    </svg>
  )
}

export function UptimeFigure() {
  // Twelve months. One month carries the only measured interruption, so the
  // 0.02% is visible rather than asserted.
  return (
    <svg className="fig" viewBox="0 0 200 56" role="img" aria-label="Twelve months of uptime with one measured interruption">
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i}>
          <rect x={i * 16.6 + 1} y="12" width="14" height="24" className="fig-bar" />
          {i === 7 && <rect x={i * 16.6 + 1} y="12" width="14" height="5" className="fig-bar-break" />}
        </g>
      ))}
      <text x="1" y="48" className="fig-tick">Aug 25</text>
      <text x="199" y="48" textAnchor="end" className="fig-tick">Jul 26</text>
      <text x="120" y="9" className="fig-tick">1 incident, 104 min</text>
    </svg>
  )
}

export const FIGURES = {
  'Median query time': LatencyFigure,
  'Time to first dashboard': OnboardingFigure,
  'Metric definitions governed': GovernedFigure,
  'Uptime, trailing 12 months': UptimeFigure,
}

// Feature marks. Each is a diagram of its own feature, not a decorative icon:
// swapping any two would be visibly wrong.
export function FeatureMark({ id }) {
  const common = { className: 'mark', viewBox: '0 0 32 32', 'aria-hidden': 'true' }
  switch (id) {
    case 'ingest':
      return (
        <svg {...common}>
          <ellipse cx="22" cy="9" rx="8" ry="3.2" />
          <path d="M14 9v14c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2V9" />
          <path d="M1 16h9M7 12l4 4-4 4" />
        </svg>
      )
    case 'metrics':
      return (
        <svg {...common}>
          <path d="M4 12h24M4 20h24" />
          <rect x="11" y="2" width="10" height="8" rx="1.5" />
          <path d="M16 22v8" />
        </svg>
      )
    case 'alerts':
      return (
        <svg {...common}>
          <path d="M1 22h6l3-6 4 10 3-14 3 8 3-4h6" />
          <path d="M1 8h30" strokeDasharray="2 3" />
        </svg>
      )
    case 'embed':
      return (
        <svg {...common}>
          <rect x="1.5" y="4" width="29" height="24" rx="2" />
          <rect x="8" y="12" width="16" height="12" rx="1" />
          <path d="M1.5 9h29" />
        </svg>
      )
    case 'sql':
      return (
        <svg {...common}>
          <path d="M11 6 3 16l8 10M21 6l8 10-8 10" />
          <path d="M18 4l-4 24" />
        </svg>
      )
    case 'audit':
      return (
        <svg {...common}>
          <path d="M16 2l12 5v9c0 7-5 12-12 14C9 28 4 23 4 16V7z" />
          <path d="M11 16l4 4 7-8" />
        </svg>
      )
    default:
      return null
  }
}
