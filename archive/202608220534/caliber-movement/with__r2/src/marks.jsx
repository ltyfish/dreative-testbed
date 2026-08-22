// Six marks drawn for the six stages of this movement's power path, plus the
// plan view of the caliber. Nothing here pretends to be a photograph — these
// are schematics, and they sit alongside real macro photography, not instead
// of it.

const base = {
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

function Spiral() {
  return (
    <svg {...base} className="mark">
      <path d="M16 16.6c0-.9 1.3-1 1.5.1.3 1.6-1.9 2.4-3 1.3-1.6-1.5-.5-4.3 1.7-4.7 2.9-.6 5.2 2.3 4.4 5.4-1 3.9-5.9 5.4-9 3.1C7.8 18.9 6.4 12.4 9.6 8.6c3.7-4.4 11-3.4 14.3 1.2" />
      <path d="M23.9 9.8l2.5-1M23.9 9.8l.2 2.7" />
    </svg>
  )
}

function Barrel() {
  return (
    <svg {...base} className="mark">
      <circle cx="16" cy="16" r="9.5" />
      <circle cx="16" cy="16" r="4" />
      <path d="M16 6.5v3M25.5 16h-3M16 25.5v-3M6.5 16h3" />
      <path d="M22.7 9.3l-2.1 2.1M22.7 22.7l-2.1-2.1M9.3 22.7l2.1-2.1M9.3 9.3l2.1 2.1" />
    </svg>
  )
}

function Train() {
  return (
    <svg {...base} className="mark">
      <circle cx="11" cy="13" r="6.5" />
      <circle cx="11" cy="13" r="1.6" />
      <circle cx="22.5" cy="21.5" r="4" />
      <circle cx="22.5" cy="21.5" r="1.1" />
      <path d="M11 4.5v2M17.5 13h2M11 21.5v-2M2.5 13h2M15.6 8.4l1.4-1.4M15.6 17.6l1.4 1.4M6.4 17.6L5 19M6.4 8.4L5 7" />
      <path d="M22.5 15.5v2M28.5 21.5h-2M22.5 27.5v-2M16.5 21.5h2" />
    </svg>
  )
}

function Escapement() {
  return (
    <svg {...base} className="mark">
      <path d="M4.5 20a8.5 8.5 0 0 1 16.6-2.6" />
      <path d="M6 15.4l1.9 2.4M10.6 12.6l.9 2.9M16 12l-.2 3M21 13.7l-1.4 2.6" />
      <path d="M16 28.5V22l-4-3.4M16 22l4-3.4" />
      <circle cx="16" cy="28.5" r="1.6" />
      <path d="M25 8.5v6" />
    </svg>
  )
}

function Balance() {
  return (
    <svg {...base} className="mark">
      <circle cx="16" cy="16" r="10" />
      <path d="M6 16h20M16 6v20" />
      <path d="M16 16c0-.7 1-.8 1.2 0 .3 1.3-1.4 2-2.4 1-1.4-1.3-.3-3.6 1.5-3.9 2.4-.4 4.3 1.9 3.7 4.4" />
      <path d="M9.6 8.4l1.6 1.6M22.4 8.4l-1.6 1.6" />
    </svg>
  )
}

function Hands() {
  return (
    <svg {...base} className="mark">
      <circle cx="16" cy="16" r="11" />
      <path d="M16 16V8.5M16 16l5.5 4" />
      <circle cx="16" cy="16" r="1.4" fill="currentColor" stroke="none" />
      <path d="M16 3.6v1.6M28.4 16h-1.6M16 28.4v-1.6M3.6 16h1.6" />
    </svg>
  )
}

export const STAGE_MARKS = {
  mainspring: Spiral,
  barrel: Barrel,
  train: Train,
  escapement: Escapement,
  balance: Balance,
  hands: Hands,
}

// Plan view of the caliber, drawn to the stated 31.0mm diameter, with the
// bridges that the layer stack describes. A drawing, deliberately: no
// photograph of Caliber 08 exists yet.
export function PlanView() {
  return (
    <svg
      viewBox="0 0 320 320"
      className="plan"
      role="img"
      aria-label="Plan view of Caliber 08: a 31.0mm circular movement showing the barrel, the four-wheel train bridge, the escapement and the balance."
    >
      <defs>
        <pattern id="frost" width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.4" fill="currentColor" opacity="0.28" />
        </pattern>
      </defs>

      <g className="plan-dim">
        <path d="M22 160h276" />
        <path d="M22 155v10M298 155v10" />
        <text x="160" y="152" textAnchor="middle">31.0mm</text>
      </g>

      <circle cx="160" cy="160" r="138" className="plan-edge" />
      <circle cx="160" cy="160" r="138" fill="url(#frost)" stroke="none" />
      <circle cx="160" cy="160" r="130" className="plan-hair" />

      {/* barrel */}
      <g className="plan-part">
        <circle cx="108" cy="112" r="47" />
        <circle cx="108" cy="112" r="12" />
        <text x="108" y="116" textAnchor="middle" className="plan-label">01</text>
      </g>

      {/* train bridge, one continuous bridge over four wheels */}
      <g className="plan-bridge">
        <path d="M176 74c34 4 62 30 66 66 3 30-8 58-32 74-14 9-22 22-24 38-1 10-9 16-19 14-9-2-14-11-11-20 7-24 22-42 43-52 15-7 22-24 17-40-5-15-20-24-36-22-9 1-16-5-17-14-1-9 5-16 13-16z" />
        <circle cx="228" cy="126" r="8" className="plan-jewel" />
        <circle cx="243" cy="176" r="8" className="plan-jewel" />
        <circle cx="212" cy="216" r="8" className="plan-jewel" />
        <circle cx="180" cy="252" r="8" className="plan-jewel" />
        <text x="236" y="152" textAnchor="middle" className="plan-label">03</text>
      </g>

      {/* escapement */}
      <g className="plan-part">
        <circle cx="112" cy="216" r="26" />
        <path d="M112 216l-14 22M112 216l16 20" />
        <text x="76" y="212" textAnchor="middle" className="plan-label">04</text>
      </g>

      {/* balance, held from one side only */}
      <g className="plan-balance">
        <circle cx="130" cy="252" r="52" />
        <circle cx="130" cy="252" r="6" />
        <path d="M78 252h104M130 200v104" />
        <path d="M130 252c0-2 2.6-2.2 3 0 .8 3.4-3.6 5.2-6.2 2.6-3.6-3.4-.8-9.4 4-10.2 6.2-1 11.2 5 9.6 11.4" />
      </g>

      <g className="plan-cock">
        <path d="M186 300c-6-26-24-42-50-48" />
      </g>
    </svg>
  )
}
