// Every form here is described the way a potter describes it: a profile in
// millimetres, taken from the piece's own listed height and width. Nothing is
// invented — the numbers in PRODUCTS are the numbers the lathe turns.

// A profile is a list of [radius, height] in mm, outside wall, foot upward.
// `wall` is the wall thickness at the rim; the base is always thicker.
export const PROFILES = {
  'mug-tall': {
    wall: 4.5, foot: 30, rings: 1.0,
    outer: [[30, 0], [31.5, 6], [34, 20], [37.5, 45], [39, 72], [39, 95]],
    handle: { top: 0.78, bottom: 0.24, out: 30, thick: 5.6 },
  },
  'mug-low': {
    wall: 5, foot: 34, rings: 1.1,
    outer: [[34, 0], [36, 5], [40, 18], [43.5, 42], [44, 62], [44, 72]],
    handle: { top: 0.8, bottom: 0.22, out: 28, thick: 6 },
  },
  'cup-espresso': {
    wall: 4, foot: 21, rings: 0.7,
    outer: [[21, 0], [22.5, 4], [25.5, 16], [28.5, 34], [30, 47], [30, 55]],
    handle: { top: 0.76, bottom: 0.26, out: 20, thick: 4.4 },
  },
  'bowl-deep': {
    wall: 5.5, foot: 58, rings: 1.0,
    outer: [[58, 0], [62, 6], [72, 26], [85, 55], [93, 78], [95, 90]],
  },
  'bowl-shallow': {
    wall: 5, foot: 62, rings: 0.9,
    outer: [[62, 0], [67, 4], [80, 14], [97, 30], [107, 42], [110, 48]],
  },
  'plate-side': {
    wall: 4.5, foot: 56, rings: 0.9,
    outer: [[56, 0], [62, 3], [76, 8], [90, 13], [98, 16.5], [100, 18]],
  },
  'plate-dinner': {
    wall: 5, foot: 78, rings: 1.0,
    outer: [[78, 0], [86, 4], [104, 10], [124, 16], [134, 20], [137.5, 22]],
  },
  'jug': {
    wall: 5, foot: 40, rings: 0.85, spout: true,
    outer: [[40, 0], [44, 8], [52, 34], [55, 62], [50, 96], [38, 124], [33, 142], [36, 154], [37, 160]],
    handle: { top: 0.86, bottom: 0.34, out: 40, thick: 7 },
  },
  'vase': {
    wall: 5.5, foot: 42, rings: 0.95,
    outer: [[42, 0], [48, 14], [57, 56], [60, 96], [52, 146], [34, 200], [22, 244], [18, 268], [21, 280]],
  },
}

// A supermarket mug, for the one place the page compares them. Straight-sided,
// pressed not thrown: no belly, no ring, a machined foot.
export const FACTORY_MUG = {
  wall: 3.2, foot: 41, rings: 0,
  outer: [[41, 0], [42, 2], [42, 4], [42, 50], [42, 92], [42, 96]],
  handle: { top: 0.8, bottom: 0.26, out: 30, thick: 5.5 },
}
