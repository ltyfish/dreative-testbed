// Drawn plan and section views of Caliber 08.
//
// These are schematics — the kind of plate drawing a workshop publishes — not
// renderings pretending to be photographs. Geometry follows how a manual-winding
// movement is actually organised: barrel at one side, the train stepping across
// the plate, escapement and balance at the other, motion work concentric at the
// centre where the hands come through.
//
// The escape wheel and balance run at Caliber 08's real rate: five releases per
// second, 18,000 semi-oscillations per hour. Train speeds are compressed so the
// step-up is visible; the relationship between them is the true part.

const TAU = Math.PI * 2

function ticks(cx, cy, r, n, len, phase = 0) {
  const out = []
  for (let i = 0; i < n; i++) {
    const a = phase + (i / n) * TAU
    const c = Math.cos(a)
    const s = Math.sin(a)
    out.push(
      'M' + (cx + c * (r - len)).toFixed(2) + ' ' + (cy + s * (r - len)).toFixed(2) +
      'L' + (cx + c * (r + len * 0.35)).toFixed(2) + ' ' + (cy + s * (r + len * 0.35)).toFixed(2)
    )
  }
  return out.join('')
}

function spokes(cx, cy, r, n, phase = 0) {
  const out = []
  for (let i = 0; i < n; i++) {
    const a = phase + (i / n) * Math.PI
    out.push(
      'M' + (cx - Math.cos(a) * r).toFixed(2) + ' ' + (cy - Math.sin(a) * r).toFixed(2) +
      'L' + (cx + Math.cos(a) * r).toFixed(2) + ' ' + (cy + Math.sin(a) * r).toFixed(2)
    )
  }
  return out.join('')
}

function spiral(cx, cy, rStart, rEnd, turns, steps = 240) {
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = t * turns * TAU
    const r = rStart + (rEnd - rStart) * t
    d += (i === 0 ? 'M' : 'L') + (cx + Math.cos(a) * r).toFixed(2) + ' ' + (cy + Math.sin(a) * r).toFixed(2)
  }
  return d
}

// Wheel positions, kept as data so the bridge outline, the layer plates and the
// energy trace are all derived from the numbers the wheels are drawn from.
const W = {
  barrel: { x: 132, y: 148, r: 64 },
  t1: { x: 224, y: 166, r: 40 },
  t2: { x: 274, y: 228, r: 29 },
  t3: { x: 322, y: 184, r: 22 },
  t4: { x: 331, y: 250, r: 16 },
  escape: { x: 292, y: 306, r: 20 },
  balance: { x: 164, y: 302, r: 58 },
}

const BRIDGE_D =
  'M196 132C246 108 316 128 350 168C378 200 372 250 348 268C322 288 286 276 276 254C266 232 246 224 226 214C200 200 176 158 196 132Z'

const COCK_D =
  'M84 380C96 336 122 306 158 296C196 286 224 300 238 328C246 344 244 362 236 378C222 356 206 344 182 342C150 340 118 354 96 384Z'

function Wheel({ w, teethCount, spokeCount, spin }) {
  return (
    <g className="wh" style={{ '--spin': spin + 's', '--ox': w.x + 'px', '--oy': w.y + 'px' }}>
      <circle className="wh-body" cx={w.x} cy={w.y} r={w.r} />
      <path className="wh-teeth" d={ticks(w.x, w.y, w.r, teethCount, w.r * 0.09)} />
      <path className="wh-spoke" d={spokes(w.x, w.y, w.r * 0.86, spokeCount)} />
      <circle className="wh-arbor" cx={w.x} cy={w.y} r={3.1} />
      <circle className="wh-jewel" cx={w.x} cy={w.y} r={1.4} />
    </g>
  )
}

/**
 * Plan view of the whole movement. `focus` lifts one stage of the power path and
 * drops the rest to hairlines; `running` gates every animation, so the plate is
 * still when it is offscreen or when the reader has asked for reduced motion.
 */
export function MovementPlate({ focus = null, running = true, id = 'plate' }) {
  return (
    <svg
      className="plate"
      data-focus={focus || 'none'}
      data-running={running ? 'yes' : 'no'}
      viewBox="0 0 460 420"
      role="img"
      aria-label="Plan view of Caliber 08: the mainspring barrel at upper left, four train wheels stepping across to the escape wheel, the balance wheel under its cock at lower left, and the motion work concentric at the centre where the hands come through."
    >
      <defs>
        <radialGradient id={id + '-frost'} cx="38%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#3b4148" />
          <stop offset="55%" stopColor="#242830" />
          <stop offset="100%" stopColor="#12141a" />
        </radialGradient>
        <clipPath id={id + '-clip'}>
          <circle cx="210" cy="210" r="190" />
        </clipPath>
      </defs>

      {/* Main plate: the one surface every pivot is located from. */}
      <g className="pl-ground">
        <circle cx="210" cy="210" r="190" fill={'url(#' + id + '-frost)'} />
        <g clipPath={'url(#' + id + '-clip)'} className="pl-grain">
          {Array.from({ length: 36 }, (_, i) => (
            <line key={i} x1="8" y1={6 + i * 12} x2="412" y2={-46 + i * 12} />
          ))}
        </g>
        <circle className="pl-rim" cx="210" cy="210" r="190" />
        <circle className="pl-rim-inner" cx="210" cy="210" r="180" />
        {/* Winding stem at three o'clock. Manual wind: there is no rotor. */}
        <path className="pl-stem" d="M398 210h38" />
        <circle className="pl-crown" cx="443" cy="210" r="11" />
        <path className="pl-crown-knurl" d={ticks(443, 210, 11, 16, 2.4)} />
      </g>

      {/* Stage 6 — motion work, dial side, drawn as the far plane under the hands. */}
      <g data-part="hands" className="pt pt-hands">
        <circle className="mw-ring" cx="210" cy="210" r="36" />
        <circle className="mw-ring" cx="210" cy="210" r="24" />
        <circle className="mw-ring" cx="210" cy="210" r="13" />
        <path className="mw-teeth" d={ticks(210, 210, 36, 44, 2.6)} />
        <g className="mw-hands">
          <path className="hand hand-h" d="M210 210L174 156" />
          <path className="hand hand-m" d="M210 210L286 128" />
          <circle className="hand-boss" cx="210" cy="210" r="4.6" />
        </g>
      </g>

      {/* One continuous bridge over all four train wheels. */}
      <path className="pl-bridge" d={BRIDGE_D} />

      {/* Stage 1 — the mainspring itself, coiled inside the barrel. */}
      <g data-part="mainspring" className="pt pt-mainspring">
        <path className="ms-coil" d={spiral(W.barrel.x, W.barrel.y, 10, 51, 6.5)} />
        <circle className="ms-arbor" cx={W.barrel.x} cy={W.barrel.y} r={7} />
      </g>

      {/* Stage 2 — barrel wall, ratchet, and the stop-work click. */}
      <g data-part="barrel" className="pt pt-barrel">
        <circle className="br-wall" cx={W.barrel.x} cy={W.barrel.y} r={W.barrel.r} />
        <path className="br-teeth" d={ticks(W.barrel.x, W.barrel.y, W.barrel.r, 72, 5.5)} />
        <circle className="br-ratchet" cx={W.barrel.x} cy={W.barrel.y} r={22} />
        <path className="br-ratchet-teeth" d={ticks(W.barrel.x, W.barrel.y, 22, 12, 3)} />
        <path className="br-stopwork" d="M130 64C152 58 172 66 180 82" />
        <circle className="br-click" cx="180" cy="82" r="4.4" />
      </g>

      {/* Stage 3 — the four train wheels, each turning faster than the last. */}
      <g data-part="train" className="pt pt-train">
        <Wheel w={W.t1} teethCount={64} spokeCount={4} spin={60} />
        <Wheel w={W.t2} teethCount={52} spokeCount={3} spin={20} />
        <Wheel w={W.t3} teethCount={44} spokeCount={3} spin={6} />
        <Wheel w={W.t4} teethCount={36} spokeCount={3} spin={2} />
      </g>

      {/* Stage 4 — escapement. Fifteen teeth, one released every 0.2s. */}
      <g data-part="escapement" className="pt pt-escapement">
        <g className="esc-wheel">
          <circle className="esc-body" cx={W.escape.x} cy={W.escape.y} r={W.escape.r} />
          <path className="esc-teeth" d={ticks(W.escape.x, W.escape.y, W.escape.r, 15, 4.4)} />
          <path className="esc-spoke" d={spokes(W.escape.x, W.escape.y, W.escape.r * 0.78, 3)} />
          <circle className="esc-arbor" cx={W.escape.x} cy={W.escape.y} r={2.8} />
        </g>
        <g className="esc-lever">
          <path className="lv-body" d="M252 323L284 305M252 323L280 341M252 323L232 317" />
          <path className="lv-fork" d="M226 311L232 317L226 324" />
          <circle className="lv-pivot" cx="252" cy="323" r="3.6" />
          <circle className="lv-pallet" cx="284" cy="305" r="3.4" />
          <circle className="lv-pallet" cx="280" cy="341" r="3.4" />
        </g>
      </g>

      {/* Stage 5 — balance and hairspring, held from one side only. */}
      <g data-part="balance" className="pt pt-balance">
        <path className="bl-cock" d="M62 356C82 328 112 310 150 306L182 308C206 314 220 330 226 352" />
        <g className="bl-wheel">
          <circle className="bl-rim" cx={W.balance.x} cy={W.balance.y} r={W.balance.r} />
          <circle className="bl-rim-in" cx={W.balance.x} cy={W.balance.y} r={W.balance.r - 6} />
          <path className="bl-arm" d={spokes(W.balance.x, W.balance.y, W.balance.r - 3, 2, Math.PI / 4)} />
          {[0, 1, 2, 3].map((i) => {
            const a = Math.PI / 4 + (i / 4) * TAU
            return (
              <circle
                key={i}
                className="bl-weight"
                cx={W.balance.x + Math.cos(a) * (W.balance.r - 3)}
                cy={W.balance.y + Math.sin(a) * (W.balance.r - 3)}
                r={5}
              />
            )
          })}
        </g>
        <path className="bl-hairspring" d={spiral(W.balance.x, W.balance.y, 5, 34, 7)} />
        <circle className="bl-jewel" cx={W.balance.x} cy={W.balance.y} r={3.6} />
      </g>

      {/* Energy trace: barrel, train, escapement, balance, back to the hands. */}
      <path className="pl-trace" d="M132 148L224 166L274 228L322 184L331 250L292 306L164 302L210 210" />
    </svg>
  )
}

/**
 * One of the four physical layers, each drawn as its own silhouette so the stack
 * reads as four different parts rather than four copies of a disc.
 */
export function LayerPlate({ variant }) {
  const common = { viewBox: '0 0 420 420', className: 'lp lp-' + variant, 'aria-hidden': 'true' }

  if (variant === 'dial-side') {
    return (
      <svg {...common}>
        <circle className="lp-face" cx="210" cy="210" r="190" />
        <circle className="lp-edge" cx="210" cy="210" r="190" />
        <circle className="lp-line" cx="210" cy="210" r="150" />
        <circle className="lp-line" cx="210" cy="210" r="36" />
        <circle className="lp-line" cx="210" cy="210" r="24" />
        <path className="lp-tick" d={ticks(210, 210, 168, 60, 9)} />
        <circle className="lp-post" cx="210" cy="210" r="7" />
        <circle className="lp-hole" cx="210" cy="112" r="5.5" />
        <circle className="lp-hole" cx="122" cy="290" r="5.5" />
        <circle className="lp-hole" cx="300" cy="292" r="5.5" />
      </svg>
    )
  }

  if (variant === 'main') {
    return (
      <svg {...common}>
        <circle className="lp-face" cx="210" cy="210" r="190" />
        <circle className="lp-edge" cx="210" cy="210" r="190" />
        <g className="lp-frost">
          {Array.from({ length: 200 }, (_, i) => {
            const a = (i * 2.3999632) % TAU
            const r = 10 + 178 * Math.sqrt(((i * 0.618034) % 1))
            return (
              <circle
                key={i}
                cx={(210 + Math.cos(a) * r).toFixed(1)}
                cy={(210 + Math.sin(a) * r).toFixed(1)}
                r={(1.2 + ((i * 13) % 7) / 6).toFixed(2)}
              />
            )
          })}
        </g>
        {[W.barrel, W.t1, W.t2, W.t3, W.t4, W.escape, W.balance].map((w, i) => (
          <circle key={i} className="lp-jewel" cx={w.x} cy={w.y} r={7} />
        ))}
        <path className="lp-stemline" d="M392 210h30" />
      </svg>
    )
  }

  if (variant === 'bridge') {
    return (
      <svg {...common}>
        <g transform="translate(-46 14)">
          <path className="lp-face lp-face-cut" d={BRIDGE_D} />
          <path className="lp-anglage" d={BRIDGE_D} />
        {[W.t1, W.t2, W.t3, W.t4].map((w, i) => (
          <circle key={i} className="lp-jewel" cx={w.x} cy={w.y} r={7.5} />
        ))}
          <circle className="lp-screw" cx="214" cy="140" r="6.5" />
          <circle className="lp-screw" cx="350" cy="250" r="6.5" />
        </g>
      </svg>
    )
  }

  return (
    <svg {...common}>
      <g transform="translate(36 -104)">
        <path className="lp-face lp-face-cut" d={COCK_D} />
        <path className="lp-anglage" d={COCK_D} />
        <circle className="lp-jewel" cx="168" cy="326" r="9" />
        <circle className="lp-screw" cx="108" cy="368" r="6.5" />
      </g>
    </svg>
  )
}
