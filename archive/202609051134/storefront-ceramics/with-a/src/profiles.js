// Measured notation, not a picture of a pot.
//
// Each path is generated from the product's own stated millimetres, in a
// viewBox that is literally `0 0 w h` in mm. Rendered at one shared px-per-mm
// factor, the nine outlines are therefore true to each other and to the ruler
// drawn beside them. This is the one drawn element on the route that is allowed
// to hold a section, because it is a scale diagram: it answers "how big is it"
// in a way the photographs cannot, and it is drawn from the real numbers.

const r = (n) => Math.round(n * 100) / 100

// A vessel wall: rim at the top spanning the full width, curving down to a foot.
function vessel(w, h, { foot = 0.34, waist = 0.5, belly = 0, footH = 0.1 } = {}) {
  const fx1 = r(w * (0.5 - foot / 2))
  const fx2 = r(w * (0.5 + foot / 2))
  const fy = r(h * (1 - footH))
  const bx = r(w * belly)
  return [
    `M0 0`,
    `C${r(-bx)} ${r(h * waist)} ${r(fx1 * 0.55 - bx * 0.4)} ${r(h * 0.86)} ${fx1} ${fy}`,
    `L${fx1} ${r(h)}`,
    `L${fx2} ${r(h)}`,
    `L${fx2} ${fy}`,
    `C${r(w - fx1 * 0.55 + bx * 0.4)} ${r(h * 0.86)} ${r(w + bx)} ${r(h * waist)} ${r(w)} 0`,
    `Z`,
  ].join(' ')
}

// A drinking form: near-cylindrical wall, slight taper, no interior.
function cylinder(w, h, taper = 0.9) {
  const b = r(w * (1 - taper) * 0.5)
  return [
    `M0 0`,
    `C${r(-w * 0.015)} ${r(h * 0.5)} ${r(b * 0.7)} ${r(h * 0.85)} ${b} ${r(h)}`,
    `L${r(w - b)} ${r(h)}`,
    `C${r(w - b * 0.7)} ${r(h * 0.85)} ${r(w + w * 0.015)} ${r(h * 0.5)} ${r(w)} 0`,
    `Z`,
  ].join(' ')
}

// The handle is drawn as a separate stroked arc so it reads as an outline,
// the way a handle does against the light.
function handle(bodyW, w, h) {
  const top = r(h * 0.18)
  const bot = r(h * 0.74)
  const out = r(w)
  return `M${r(bodyW - 1)} ${top} C${r(out)} ${r(h * 0.2)} ${r(out)} ${r(h * 0.68)} ${r(bodyW - 1)} ${bot}`
}

export function profile(p) {
  const { w, h, form } = p
  switch (form) {
    case 'mug': {
      const bw = r(w * 0.74)
      return { body: cylinder(bw, h, 0.9), handle: handle(bw, w, h) }
    }
    case 'cup':
      return { body: cylinder(w, h, 0.78), handle: null }
    case 'bowl':
      return { body: vessel(w, h, { foot: 0.33, waist: 0.52, footH: 0.12 }), handle: null }
    case 'plate':
      return { body: vessel(w, h, { foot: 0.42, waist: 0.42, footH: 0.28 }), handle: null }
    case 'jug': {
      const bw = r(w * 0.72)
      // body swells low, neck draws in, a lip pulled forward at the rim
      const body = [
        `M${r(bw * 0.16)} 0`,
        `L${r(bw * 0.9)} ${r(h * 0.02)}`,
        `C${r(bw * 1.02)} ${r(h * 0.16)} ${r(bw * 1.06)} ${r(h * 0.42)} ${r(bw * 0.94)} ${r(h * 0.72)}`,
        `C${r(bw * 0.88)} ${r(h * 0.88)} ${r(bw * 0.8)} ${r(h * 0.95)} ${r(bw * 0.74)} ${r(h)}`,
        `L${r(bw * 0.2)} ${r(h)}`,
        `C${r(bw * 0.14)} ${r(h * 0.95)} ${r(bw * 0.06)} ${r(h * 0.88)} ${r(bw * 0.02)} ${r(h * 0.72)}`,
        `C${r(-bw * 0.06)} ${r(h * 0.42)} ${r(-bw * 0.02)} ${r(h * 0.14)} ${r(bw * 0.16)} 0`,
        `Z`,
      ].join(' ')
      return { body, handle: handle(bw, w, h) }
    }
    case 'vase': {
      // a bottle: belly of full width at the base, neck drawn to a narrow lip
      const neck = r(w * 0.17)
      const bellyTop = r(h - w * 0.98)
      return {
        body: [
          `M${r(w * 0.5 - neck / 2)} 0`,
          `L${r(w * 0.5 + neck / 2)} 0`,
          `C${r(w * 0.5 + neck * 0.62)} ${r(h * 0.3)} ${r(w * 0.92)} ${r(bellyTop * 0.94)} ${r(w)} ${r(bellyTop + w * 0.34)}`,
          `C${r(w * 1.02)} ${r(h * 0.96)} ${r(w * 0.72)} ${r(h)} ${r(w * 0.5)} ${r(h)}`,
          `C${r(w * 0.28)} ${r(h)} ${r(-w * 0.02)} ${r(h * 0.96)} 0 ${r(bellyTop + w * 0.34)}`,
          `C${r(w * 0.08)} ${r(bellyTop * 0.94)} ${r(w * 0.5 - neck * 0.62)} ${r(h * 0.3)} ${r(w * 0.5 - neck / 2)} 0`,
          `Z`,
        ].join(' '),
        handle: null,
      }
    }
    default:
      return { body: cylinder(w, h), handle: null }
  }
}
