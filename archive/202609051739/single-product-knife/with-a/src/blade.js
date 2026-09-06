// Registration and feature geometry for the push-in.
//
// Two real photographs of the same knife — a whole-blade frame and a macro of
// its heel — measured against each other so one camera can travel through both.
// Every constant here was read off the shipped files, not guessed; the method
// and the marker checks are recorded in public/media/CREDITS.md.

// The shared physical anchor is the bottom corner of the heel, where the ground
// bevel runs into the heel curve. It is present in both frames.
export const ANCHOR_WIDE = { x: 0.56, y: 0.6115 }
export const ANCHOR_MACRO = { x: 0.6846, y: 0.8098 }

// How much larger the blade is in the macro frame than in the wide frame.
export const MACRO_GAIN = 5

// The camera is a point in macro-normalised space plus a zoom. At rest the
// zoom is set so the wide frame sits at exactly 1:1 in the stage, which fixes
// where the camera has to start.
export const Z_START = 1 / MACRO_GAIN
export const Z_END = 2.4
export const CAM_START = {
  x: ANCHOR_MACRO.x + MACRO_GAIN * (0.5 - ANCHOR_WIDE.x),
  y: ANCHOR_MACRO.y + MACRO_GAIN * (0.5 - ANCHOR_WIDE.y),
}
export const CAM_END = { x: 0.42, y: 0.6 }

// The handoff: the wide frame is carrying the picture until the macro overtakes
// it in real resolution, which happens while the blade fills most of the frame.
export const FADE_IN = 0.88
export const FADE_OUT = 1.14

// Features, in macro-normalised coordinates. Each was confirmed by drawing a
// marker at the coordinate onto the actual file and looking at where it landed.
export const FEATURES = [
  {
    id: 'machi',
    x: 0.714,
    y: 0.345,
    label: 'The machi',
    note: 'Where the blade stops and the tang begins. Cut by hand, so it is a shape rather than a radius.',
    from: 0.46,
    to: 0.70,
    side: 'right',
  },
  {
    id: 'scale',
    x: 0.552,
    y: 0.5,
    label: 'Forge scale',
    note: 'Black oxide left on the steel by the fire. A ground blade has none, because grinding removes it.',
    from: 0.72,
    to: 0.89,
    side: 'right',
  },
  {
    id: 'grind',
    x: 0.4,
    y: 0.677,
    label: 'The grind line',
    note: 'Hard core under soft iron, opened up on a wheel by eye. It wanders, and it wanders differently on every knife.',
    from: 0.90,
    to: 1.01,
    side: 'left',
  },
]

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
export const lerp = (a, b, t) => a + (b - a) * t
// Slow at both ends: the frame settles into the establishing shot and settles
// again onto the grind line, and does its travelling in between.
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// The plate is 16:9 and so is every frame, so a layer at scale z covers it
// exactly when its offset stays between 1 - z and 0 on both axes.
const cover = (t, z) => ({ x: clamp(t.x, Math.min(0, 1 - z), 0), y: clamp(t.y, Math.min(0, 1 - z), 0) })

// One authored value in, both layers' transforms out.
export function camera(progress) {
  const e = easeInOut(clamp(progress))
  const zMacro = Z_START * Math.pow(Z_END / Z_START, e)
  const zWide = zMacro * MACRO_GAIN
  const cam = { x: lerp(CAM_START.x, CAM_END.x, e), y: lerp(CAM_START.y, CAM_END.y, e) }
  const camWide = {
    x: ANCHOR_WIDE.x + (cam.x - ANCHOR_MACRO.x) / MACRO_GAIN,
    y: ANCHOR_WIDE.y + (cam.y - ANCHOR_MACRO.y) / MACRO_GAIN,
  }
  return {
    e,
    zMacro,
    zWide,
    cam,
    macro: cover({ x: 0.5 - cam.x * zMacro, y: 0.5 - cam.y * zMacro }, zMacro),
    wide: cover({ x: 0.5 - camWide.x * zWide, y: 0.5 - camWide.y * zWide }, zWide),
    // The wide frame is the picture until the macro can out-resolve it.
    macroOpacity: clamp((zMacro - FADE_IN) / (FADE_OUT - FADE_IN)),
  }
}
