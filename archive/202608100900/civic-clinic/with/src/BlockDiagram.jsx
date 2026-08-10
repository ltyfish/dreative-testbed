/**
 * A schematic of the block — not a map. It exists because the transit lines
 * below it describe four different ways in, and the one thing they have in
 * common is where the door is.
 */
export default function BlockDiagram() {
  return (
    <svg
      className="block-diagram"
      viewBox="0 0 480 356"
      role="img"
      aria-label="Schematic of the block. Alder Lane runs along the back with free parking behind the building. The clinic at 1140 East Barrow Street has a step-free entrance onto East Barrow Street, where buses 14 and 27 stop directly outside. Barrow Street station is a four-minute walk east."
    >
      <rect className="bd-ground" x="0" y="0" width="480" height="356" rx="2" />

      {/* Alder Lane, along the back */}
      <rect className="bd-road bd-road--minor" x="0" y="10" width="480" height="30" />
      <text className="bd-street" x="12" y="30">
        ALDER LANE
      </text>

      {/* Parking, between the lane and the building */}
      <rect className="bd-lot" x="54" y="58" width="252" height="50" />
      <text className="bd-label" x="66" y="89">
        Free parking
      </text>
      <path className="bd-flow" d="M330 40 L330 83 L316 83" markerEnd="url(#bd-arrow)" />
      <text className="bd-note" x="338" y="76">
        car
      </text>
      <text className="bd-note" x="338" y="95">
        entrance
      </text>

      {/* The clinic */}
      <rect className="bd-building" x="54" y="122" width="252" height="94" />
      <text className="bd-building-no" x="70" y="156">
        1140
      </text>
      <text className="bd-building-name" x="70" y="180">
        EASTSIDE
      </text>
      <text className="bd-building-name" x="70" y="200">
        COMMUNITY HEALTH
      </text>

      {/* The door */}
      <rect className="bd-door" x="126" y="212" width="46" height="10" />
      <path className="bd-lead" d="M149 222 L149 244" />
      <text className="bd-note bd-note--door" x="149" y="262">
        step-free entrance
      </text>

      {/* East Barrow Street */}
      <rect className="bd-road" x="0" y="272" width="480" height="54" />
      <line className="bd-centreline" x1="0" y1="299" x2="480" y2="299" />
      <text className="bd-street bd-street--major" x="12" y="345">
        EAST BARROW STREET
      </text>

      {/* Bus stop at the door */}
      <circle className="bd-stop" cx="149" cy="288" r="9" />
      <text className="bd-stop-label" x="166" y="293">
        BUS 14 · 27
      </text>

      {/* Walk east to the station */}
      <path className="bd-walk" d="M149 314 L392 314" markerEnd="url(#bd-arrow)" />
      <text className="bd-note bd-walk-note" x="196" y="333">
        4 min walk east
      </text>
      <rect className="bd-station" x="398" y="272" width="82" height="54" />
      <text className="bd-station-label" x="410" y="295">
        BARROW ST
      </text>
      <text className="bd-station-label bd-station-label--sub" x="410" y="313">
        green line
      </text>

      <text className="bd-compass" x="462" y="60" textAnchor="end">
        E →
      </text>

      <defs>
        <marker id="bd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" className="bd-arrowhead" />
        </marker>
      </defs>
    </svg>
  )
}
