import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Turn a potter's profile into geometry. The wall has a real thickness, the
// base is thicker than the wall, the foot is a ring, and the surface carries
// throwing rings — because that is what separates a thrown pot from a pressed
// one, and this page's whole argument is that difference.

function mulberry(seed) {
  let t = seed * 1831565813 + 0x6d2b79f5
  return function () {
    t |= 0; t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function resample(points, count) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'catmullrom', 0.4,
  )
  return curve.getSpacedPoints(count - 1).map((p) => [p.x, p.y])
}

// The lathe profile: outside up, over the rim, inside down. Returns points plus
// the per-point glaze attributes the shader reads.
function buildProfile(spec, rand) {
  const N = 96
  const outer = resample(spec.outer, N)
  // The glaze reads the form, not the fingermarks: keep a copy of the profile
  // before the throwing rings go on, or every ring registers as "the form
  // turning here" and the pot ends up wearing stripes.
  const base = outer.map(([r, y]) => [r, y])
  const height = outer[outer.length - 1][1]

  // throwing rings: the spiral the fingers leave, a few millimetres apart.
  const ringPhase = rand() * Math.PI * 2
  const ringFreq = 0.115 + rand() * 0.035
  const wobblePhase = rand() * Math.PI * 2
  for (let i = 0; i < outer.length; i++) {
    const y = outer[i][1]
    const fade = Math.min(1, y / 6) * Math.min(1, (height - y) / 4 + 0.35)
    const ring = Math.sin(y * ringFreq + ringPhase) * 0.30 + Math.sin(y * ringFreq * 2.3 + ringPhase * 1.7) * 0.09 + Math.sin(y * ringFreq * 0.41 + ringPhase * 2.9) * 0.16
    const wobble = Math.sin(y * 0.035 + wobblePhase) * 0.6
    outer[i][0] += (ring * spec.rings + wobble * spec.rings * 0.4) * fade
  }

  const wall = spec.wall
  const baseT = Math.max(wall * 1.9, 5)
  // inner wall, offset inward along the outer normal, rim first
  const inner = []
  for (let i = outer.length - 1; i >= 0; i--) {
    const [r, y] = outer[i]
    const p = outer[Math.max(0, i - 1)], n = outer[Math.min(outer.length - 1, i + 1)]
    const tx = n[0] - p[0], ty = n[1] - p[1]
    const len = Math.hypot(tx, ty) || 1
    const nx = -ty / len, ny = tx / len
    const t = wall * (0.75 + 0.45 * Math.min(1, y / (height * 0.6)))
    const ir = r + nx * t, iy = y + ny * t
    if (iy <= baseT) break
    inner.push([Math.max(0.4, ir), iy])
  }
  if (inner.length) inner.push([Math.max(0.4, inner[inner.length - 1][0] * 0.55), baseT])
  inner.push([0.35, baseT])

  const pts = []
  const meta = []
  const footEdge = spec.foot
  pts.push([0.35, 0]); meta.push({ foot: 1, turn: 0, pool: 0.15 })
  pts.push([footEdge * 0.62, 0]); meta.push({ foot: 1, turn: 0, pool: 0.1 })
  for (let i = 0; i < outer.length; i++) {
    const [r, y] = outer[i]
    const p = base[Math.max(0, i - 1)], n = base[Math.min(base.length - 1, i + 1)]
    // how sharply the form turns here — where a runny glaze thins and breaks
    const d1 = (n[0] - p[0]) / ((n[1] - p[1]) || 0.001)
    const p2 = base[Math.max(0, i - 3)], n2 = base[Math.min(base.length - 1, i + 3)]
    const d2 = (n2[0] - p2[0]) / ((n2[1] - p2[1]) || 0.001)
    const turn = Math.min(1, Math.abs(d1) * 0.55 + Math.abs(d1 - d2) * 1.6)
    // and where it collects: low on the wall, and in anything facing up
    const low = Math.pow(1 - y / height, 1.6)
    const concave = Math.max(0, d1 - d2)
    const pool = Math.min(1, low * 0.55 + concave * 1.2 + (y < height * 0.12 ? 0.25 : 0))
    const foot = y < 1.8 ? 1 : y < 4.4 ? 1 - (y - 1.8) / 2.6 : 0
    pts.push([r, y]); meta.push({ foot, turn, pool })
  }
  for (let i = 0; i < inner.length; i++) {
    const [r, y] = inner[i]
    const rel = y / height
    pts.push([r, y])
    meta.push({ foot: 0, turn: rel > 0.94 ? 0.75 : 0.1, pool: Math.min(1, Math.pow(1 - rel, 2.0) * 0.9 + 0.1) })
  }
  return { pts, meta, height }
}

function attributeArrays(geo, meta) {
  const per = meta.length
  const count = geo.attributes.position.count
  const turn = new Float32Array(count)
  const pool = new Float32Array(count)
  const foot = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const m = meta[Math.min(per - 1, i % per)]
    turn[i] = m.turn; pool[i] = m.pool; foot[i] = m.foot
  }
  geo.setAttribute('aTurn', new THREE.BufferAttribute(turn, 1))
  geo.setAttribute('aPool', new THREE.BufferAttribute(pool, 1))
  geo.setAttribute('aFoot', new THREE.BufferAttribute(foot, 1))
}

function buildHandle(spec, height, rand) {
  const h = spec.handle
  const yTop = height * h.top
  const yBot = height * h.bottom
  const rAt = (y) => {
    const o = spec.outer
    for (let i = 1; i < o.length; i++) {
      if (o[i][1] >= y) {
        const t = (y - o[i - 1][1]) / ((o[i][1] - o[i - 1][1]) || 1)
        return o[i - 1][0] + t * (o[i][0] - o[i - 1][0])
      }
    }
    return o[o.length - 1][0]
  }
  const rTop = rAt(yTop), rBot = rAt(yBot)
  const out = h.out * (0.96 + rand() * 0.08)
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(rTop - 1.5, yTop, 0),
    new THREE.Vector3(rTop + out * 0.62, yTop + 1.5, 0),
    new THREE.Vector3(rTop + out, yTop - (yTop - yBot) * 0.34, 0),
    new THREE.Vector3(rTop + out * 0.72, yBot + (yTop - yBot) * 0.18, 0),
    new THREE.Vector3(rBot - 1.5, yBot, 0),
  ], false, 'catmullrom', 0.5)
  const geo = new THREE.TubeGeometry(curve, 64, h.thick * 0.5, 16, false)
  // a pulled handle is not round: flatten it across the grip
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) * 0.62)
  geo.computeVertexNormals()
  const count = pos.count
  const turn = new Float32Array(count), pool = new Float32Array(count), foot = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    turn[i] = Math.min(0.34, 0.1 + Math.max(0, (x - rTop)) / (out * 4.0))
    pool[i] = Math.max(0, 0.55 - (y - yBot) / ((yTop - yBot) || 1) * 0.55) + 0.12
    foot[i] = 0
  }
  geo.setAttribute('aTurn', new THREE.BufferAttribute(turn, 1))
  geo.setAttribute('aPool', new THREE.BufferAttribute(pool, 1))
  geo.setAttribute('aFoot', new THREE.BufferAttribute(foot, 1))
  return geo
}

// The jug's lip is pulled out of the rim with a thumb; do that to the vertices
// rather than pretending a jug is a cylinder.
function pullSpout(geo, height) {
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const near = Math.max(0, 1 - (height - v.y) / 26)
    if (near <= 0) continue
    const ang = Math.atan2(v.z, v.x)
    const side = Math.max(0, Math.cos(ang))
    const k = Math.pow(near, 1.6) * Math.pow(side, 5.0)
    if (k <= 0.001) continue
    const s = 1 + k * 0.34
    pos.setX(i, v.x * s)
    pos.setZ(i, v.z * (1 - k * 0.22))
    pos.setY(i, v.y + k * 9)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
}

export function buildVesselGeometry(spec, seed = 1) {
  const rand = mulberry(seed)
  const { pts, meta, height } = buildProfile(spec, rand)
  const lathe = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 160)
  attributeArrays(lathe, meta)
  if (spec.spout) pullSpout(lathe, height)

  const parts = [lathe]
  if (spec.handle) parts.push(buildHandle(spec, height, rand))
  const geo = parts.length > 1 ? mergeGeometries(parts, false) : lathe
  geo.computeVertexNormals()

  // no wheel runs perfectly true, and nothing comes out of a kiln perfectly round
  const oval = 1 + (rand() - 0.5) * 0.012
  const lean = (rand() - 0.5) * 0.012
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    pos.setX(i, pos.getX(i) * oval + y * lean)
    pos.setZ(i, pos.getZ(i) / oval)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  geo.userData.height = height
  geo.userData.radius = Math.max(...spec.outer.map((p) => p[0]))
  return geo
}
