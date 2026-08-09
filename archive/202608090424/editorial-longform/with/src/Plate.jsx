// Coastal-profile plate, drawn in the manner of an Admiralty coastal view:
// an engraved record of a place rather than a photograph of it. Hatching
// density carries distance; the lamp wedge is the only warm mark in the frame.
export default function Plate() {
  const isles = [
    'M 0 372 L 34 356 L 66 366 L 104 352 L 142 368 L 176 362 L 210 372 Z',
    'M 246 371 L 288 349 L 318 360 L 352 344 L 392 366 L 430 358 L 462 372 Z',
    'M 512 372 L 548 361 L 586 367 L 618 355 L 656 370 Z',
  ]

  return (
    <svg
      className="plate-svg"
      viewBox="0 0 1200 640"
      role="img"
      aria-label="Engraved coastal profile of Ardnamurchan Point, looking north-west toward the Small Isles, with the 1849 tower on the headland."
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dcd7c7" />
          <stop offset="0.62" stopColor="#e9e5d8" />
          <stop offset="1" stopColor="#efece2" />
        </linearGradient>

        {/* Sky ruling: the same feint line that rules the page, laid flat. */}
        <pattern id="skyRule" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="none" />
          <line x1="0" y1="0.5" x2="8" y2="0.5" stroke="#8f9bab" strokeWidth="0.6" />
        </pattern>
        <linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.62" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="skyMask">
          <rect x="0" y="0" width="1200" height="372" fill="url(#skyFade)" />
        </mask>

        {/* Sea: broken tick hatching, denser toward the foreground. */}
        <pattern id="seaNear" width="26" height="9" patternUnits="userSpaceOnUse">
          <path d="M 1 6 q 5 -4 10 0" stroke="#3c4757" strokeWidth="1.1" fill="none" />
          <path d="M 15 2.5 q 4 -3 8 0" stroke="#3c4757" strokeWidth="0.9" fill="none" />
        </pattern>
        <pattern id="seaFar" width="30" height="7" patternUnits="userSpaceOnUse">
          <path d="M 2 4 q 5 -3 10 0" stroke="#5c6675" strokeWidth="0.7" fill="none" />
        </pattern>

        {/* Headland: cross-hatch, the densest ink in the plate. */}
        <pattern
          id="rock"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(38)"
        >
          <rect width="7" height="7" fill="#e4e0d3" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="#23201a" strokeWidth="1.5" />
        </pattern>
        <pattern
          id="rockDark"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-40)"
        >
          <rect width="5" height="5" fill="none" />
          <line x1="0" y1="0" x2="0" y2="5" stroke="#23201a" strokeWidth="1.2" />
        </pattern>

        <radialGradient id="lampGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f0a24a" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#c8721e" stopOpacity="0.35" />
          <stop offset="1" stopColor="#c8721e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e79a3f" stopOpacity="0.5" />
          <stop offset="1" stopColor="#e79a3f" stopOpacity="0" />
        </linearGradient>

        <clipPath id="frame">
          <rect x="0" y="0" width="1200" height="640" />
        </clipPath>
      </defs>

      <g clipPath="url(#frame)">
        <rect width="1200" height="640" fill="url(#sky)" />
        <rect
          x="0"
          y="0"
          width="1200"
          height="372"
          fill="url(#skyRule)"
          mask="url(#skyMask)"
          opacity="0.5"
        />

        {/* The beam, thrown north-west across the sky from the tower. */}
        <g className="plate-beam" transform="translate(966 250)">
          <path d="M 0 0 L -940 -104 L -940 96 Z" fill="url(#beam)" />
        </g>

        {isles.map((d, i) => (
          <path key={i} d={d} fill="#6f7683" opacity={0.42 + i * 0.06} />
        ))}
        <line x1="0" y1="372" x2="1200" y2="372" stroke="#3c4757" strokeWidth="1.2" />

        <rect x="0" y="372" width="1200" height="120" fill="url(#seaFar)" opacity="0.75" />
        <rect x="0" y="452" width="1200" height="188" fill="url(#seaNear)" opacity="0.85" />

        {/* Headland and tower. */}
        <path
          d="M 812 640 L 838 566 L 884 528 L 936 508 L 1010 500 L 1086 512 L 1152 546 L 1200 592 L 1200 640 Z"
          fill="url(#rock)"
        />
        <path
          d="M 812 640 L 838 566 L 884 528 L 936 508 L 1010 500 L 1086 512 L 1152 546 L 1200 592 L 1200 640 Z"
          fill="url(#rockDark)"
          opacity="0.55"
        />
        <path
          d="M 812 640 L 838 566 L 884 528 L 936 508 L 1010 500 L 1086 512 L 1152 546 L 1200 592 L 1200 640 Z"
          fill="none"
          stroke="#23201a"
          strokeWidth="1.6"
        />

        <g>
          <path d="M 944 504 L 950 316 L 986 316 L 992 504 Z" fill="#efece2" stroke="#23201a" strokeWidth="2" />
          <line x1="957" y1="504" x2="961" y2="320" stroke="#23201a" strokeWidth="0.8" opacity="0.5" />
          <line x1="972" y1="504" x2="974" y2="320" stroke="#23201a" strokeWidth="0.8" opacity="0.5" />
          <rect x="942" y="300" width="52" height="16" fill="#efece2" stroke="#23201a" strokeWidth="2" />
          <rect x="948" y="266" width="40" height="34" fill="#efece2" stroke="#23201a" strokeWidth="2" />
          <line x1="960" y1="266" x2="960" y2="300" stroke="#23201a" strokeWidth="0.9" />
          <line x1="976" y1="266" x2="976" y2="300" stroke="#23201a" strokeWidth="0.9" />
          <path d="M 948 266 L 968 246 L 988 266 Z" fill="#efece2" stroke="#23201a" strokeWidth="2" />
          <line x1="968" y1="246" x2="968" y2="234" stroke="#23201a" strokeWidth="2" />
        </g>

        <circle className="plate-glow" cx="968" cy="283" r="66" fill="url(#lampGlow)" />
        <circle className="plate-lamp" cx="968" cy="283" r="7" fill="#f2ad5c" />
      </g>
    </svg>
  )
}
