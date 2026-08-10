/*
 * One diagram per feature, drawn from what that feature actually does. These are
 * not interchangeable icons — shuffling them would make each row wrong.
 * Each animates on hover/focus of its row via CSS on `.ledger-row`.
 */

const box = { viewBox: '0 0 120 72', fill: 'none', 'aria-hidden': true, focusable: 'false' }

export const GLYPHS = {
  // Three warehouses push down into one plane; nothing crosses back out.
  ingest: (
    <svg {...box} className="glyph glyph-ingest">
      {[18, 60, 102].map((x, i) => (
        <g key={x} style={{ '--i': i }}>
          <rect className="g-store" x={x - 13} y="6" width="26" height="16" />
          <path className="g-flow" d={`M${x} 24 L${x} 46`} />
          <path className="g-head" d={`M${x - 4} 41 L${x} 47 L${x + 4} 41`} />
        </g>
      ))}
      <path className="g-plane" d="M6 52 H114" />
      <path className="g-plane g-plane-2" d="M6 58 H114" />
    </svg>
  ),

  // One definition at the top; every downstream surface inherits it.
  metrics: (
    <svg {...box} className="glyph glyph-metrics">
      <rect className="g-def" x="34" y="6" width="52" height="18" />
      <path className="g-tie" d="M60 24 V34" />
      <path className="g-tie" d="M22 34 H98" />
      {[22, 60, 98].map((x, i) => (
        <g key={x} style={{ '--i': i }}>
          <path className="g-tie g-drop" d={`M${x} 34 V46`} />
          <rect className="g-leaf" x={x - 12} y="46" width="24" height="14" />
        </g>
      ))}
    </svg>
  ),

  // The shape of normal, and the one point that leaves it.
  alerts: (
    <svg {...box} className="glyph glyph-alerts">
      <path className="g-band" d="M4 24 H116" />
      <path className="g-band" d="M4 50 H116" />
      <path className="g-series" d="M4 40 L20 34 L34 42 L48 33 L62 39 L76 12 L90 38 L104 35 L116 40" />
      <circle className="g-breach" cx="76" cy="12" r="5" />
    </svg>
  ),

  // Your product's frame; our chart inside it, permissions and all.
  embed: (
    <svg {...box} className="glyph glyph-embed">
      <rect className="g-outer" x="4" y="6" width="112" height="60" />
      <path className="g-chrome" d="M4 18 H116" />
      <rect className="g-inner" x="18" y="28" width="84" height="28" />
      <path className="g-bar" d="M26 50 V38" />
      <path className="g-bar" d="M40 50 V32" />
      <path className="g-bar" d="M54 50 V42" />
      <path className="g-bar" d="M68 50 V34" />
      <path className="g-bar" d="M82 50 V44" />
    </svg>
  ),

  // Every visual opens as the query that made it.
  sql: (
    <svg {...box} className="glyph glyph-sql">
      <rect className="g-outer" x="4" y="6" width="112" height="60" />
      <path className="g-code" d="M16 20 H62" />
      <path className="g-code" d="M16 30 H88" />
      <path className="g-code" d="M16 40 H44" />
      <path className="g-code" d="M16 50 H72" />
      <rect className="g-caret" x="90" y="34" width="2" height="12" />
    </svg>
  ),

  // Column-level policy: some columns pass, one is held at the boundary.
  audit: (
    <svg {...box} className="glyph glyph-audit">
      <path className="g-gate" d="M60 4 V68" />
      {[16, 30, 44, 58].map((y, i) => (
        <path key={y} className={`g-col ${y === 44 ? 'is-blocked' : ''}`} style={{ '--i': i }} d={`M14 ${y} H${y === 44 ? 52 : 106}`} />
      ))}
      <rect className="g-lock" x="52" y="38" width="16" height="12" />
    </svg>
  ),
}
