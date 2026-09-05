import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { buildVesselGeometry } from './vessel.js'
import { makeGlazeMaterial } from './glaze.js'
import { PROFILES, FACTORY_MUG } from './profiles.js'

// One studio, one light, one shelf, running the length of the page.
//
// The canvas is fixed to the viewport and never moves; the pots are anchored to
// the sections that own them, so scrolling walks you along a single shelf
// instead of cutting between separate pictures of separate things. Everything
// stands on the same ground line at true scale — a 275mm dinner plate really is
// three and a half times a 78mm mug — which is the one thing a shop photograph
// never tells you honestly.

const HDRI = '/hdri/studio_small_08_1k.hdr'
const CAM_DIST = 1000

export class Stage {
  constructor(canvas) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.6 : 2)
    this.renderer.setPixelRatio(this.dpr)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.03
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(26, 1, 10, 4000)
    this.camera.position.set(0, 0, CAM_DIST)

    this.key = new THREE.DirectionalLight(0xfff3e2, 1.0)
    this.key.castShadow = true
    this.key.shadow.mapSize.set(2048, 2048)
    this.key.shadow.bias = -0.0015
    this.key.shadow.normalBias = 1.2
    this.scene.add(this.key, this.key.target)

    this.berths = new Map()
    this.running = false
    this._raf = 0
    this._turn = 0
    this._turnTo = 0
    this._drag = null
    this._onResize = () => this.resize()
    window.addEventListener('resize', this._onResize)
    this._bindPointer()
  }

  async init() {
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    const hdr = await new RGBELoader().loadAsync(HDRI)
    this.scene.environment = pmrem.fromEquirectangular(hdr).texture
    this.scene.environmentRotation = new THREE.Euler(0, -0.85, 0)
    hdr.dispose(); pmrem.dispose()
    this.resize()
    return this
  }

  // ---- berths -------------------------------------------------------------
  // A berth is a section that owns some pots. It follows its own element, so
  // the pots scroll with the page while the canvas stays put.
  addBerth(name, el, { turnable = false, lift = 0.5 } = {}) {
    const group = new THREE.Group()
    const inner = new THREE.Group()
    group.add(inner)
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShadowMaterial({ opacity: 0.26, color: 0x2c2018 }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.receiveShadow = true
    inner.add(shadow)
    this.scene.add(group)
    const berth = { name, el, group, inner, shadow, pieces: [], turnable, lift, box: new THREE.Box3() }
    this.berths.set(name, berth)
    return berth
  }

  setBerthElement(name, el) {
    const b = this.berths.get(name)
    if (b) b.el = el
  }

  // A piece is a form, a glaze, and a firing. The firing is the seed: two Tall
  // Mugs in Ash are the same geometry and the same shader with a different seed,
  // and they do not come out the same. That is the studio's actual claim, and
  // it is cheaper to show it than to write it down.
  setPieces(name, list) {
    const berth = this.berths.get(name)
    if (!berth) return
    for (const m of berth.pieces) {
      berth.inner.remove(m)
      m.geometry.dispose()
      m.material.dispose()
    }
    berth.pieces = []

    let x = 0
    const placed = []
    list.forEach((item, i) => {
      const spec = item.factory ? FACTORY_MUG : PROFILES[item.id]
      const geo = buildVesselGeometry(spec, item.seed ?? i * 17 + 3)
      const mat = item.glaze
        ? makeGlazeMaterial(item.glaze, item.seed ?? i * 17 + 3)
        : new THREE.MeshPhysicalMaterial({
            color: item.factory ? 0xf1efe9 : 0xb59b80,
            roughness: item.factory ? 0.08 : 0.92,
            clearcoat: item.factory ? 1 : 0,
            clearcoatRoughness: 0.05,
            metalness: 0,
            envMapIntensity: item.factory ? 1.15 : 0.85,
          })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.rotation.y = item.turn ?? -0.4
      const r = geo.userData.radius
      const gap = item.gap ?? 0.34
      x += r
      mesh.position.x = x
      x += r + r * gap
      mesh.userData = { ...item, radius: r, height: geo.userData.height }
      berth.inner.add(mesh)
      berth.pieces.push(mesh)
      placed.push(mesh)
    })

    // centre the row on its own ground line and size the shadow catcher to it
    const box = new THREE.Box3().setFromObject(berth.inner)
    const spanX = box.max.x - box.min.x || 1
    const cx = (box.max.x + box.min.x) / 2
    for (const m of placed) m.position.x -= cx
    berth.shadow.scale.set(spanX * 3, spanX * 3, 1)
    berth.shadow.position.set(0, 0, 0)
    berth.box = new THREE.Box3().setFromObject(berth.inner)
    berth.contentW = spanX
    berth.contentH = Math.max(...placed.map((m) => m.userData.height), 1)
    berth.dirty = true
  }

  // ---- pointer ------------------------------------------------------------
  _bindPointer() {
    const el = this.canvas
    this._down = (e) => {
      const b = this._turnableUnder(e.clientY)
      if (!b) return
      this._drag = { x: e.clientX, berth: b, start: this._turnTo }
      el.setPointerCapture?.(e.pointerId)
      this.canvas.classList.add('is-turning')
    }
    this._move = (e) => {
      if (!this._drag) return
      this._turnTo = this._drag.start + (e.clientX - this._drag.x) * 0.008
    }
    this._up = () => { this._drag = null; this.canvas.classList.remove('is-turning') }
    el.addEventListener('pointerdown', this._down)
    window.addEventListener('pointermove', this._move)
    window.addEventListener('pointerup', this._up)
    window.addEventListener('pointercancel', this._up)
  }

  _turnableUnder(clientY) {
    for (const b of this.berths.values()) {
      if (!b.turnable || !b.el) continue
      const r = b.el.getBoundingClientRect()
      if (clientY >= r.top && clientY <= r.bottom) return b
    }
    return null
  }

  // keyboard parity for turning the piece
  turnBy(delta) { this._turnTo += delta }

  // ---- layout -------------------------------------------------------------
  resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 760 ? 1.6 : 2))
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.visH = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * CAM_DIST
    this.visW = this.visH * this.camera.aspect
    this.vw = w
    this.vh = h
  }

  _placeBerths() {
    let best = null
    let bestScore = Infinity
    for (const b of this.berths.values()) {
      if (!b.el || !b.pieces.length) { b.group.visible = false; continue }
      const r = b.el.getBoundingClientRect()
      const onScreen = r.bottom > -240 && r.top < this.vh + 240
      b.group.visible = onScreen
      if (!onScreen) continue

      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const sx = (r.width / this.vw) * this.visW / (b.contentW * 1.06)
      const sy = (r.height / this.vh) * this.visH / (b.contentH * 1.16)
      const s = Math.min(sx, sy)
      b.group.position.set(
        (cx / this.vw - 0.5) * this.visW,
        (0.5 - cy / this.vh) * this.visH,
        0,
      )
      b.group.scale.setScalar(s)
      // stand the row on the berth's ground line rather than its centre
      b.inner.position.y = -b.contentH * b.lift
      const score = Math.abs(cy - this.vh * 0.45)
      if (score < bestScore) { bestScore = score; best = b }
    }

    if (best) {
      const p = best.group.position
      const reach = this.visH * 0.75
      this.key.position.set(p.x - reach * 0.42, p.y + reach * 0.9, reach * 0.55)
      this.key.target.position.copy(p)
      this.key.target.updateMatrixWorld()
      const c = this.key.shadow.camera
      c.left = -reach; c.right = reach; c.top = reach; c.bottom = -reach
      c.near = 10; c.far = reach * 4
      c.updateProjectionMatrix()
    }
  }

  render() {
    this._turn += (this._turnTo - this._turn) * 0.09
    for (const b of this.berths.values()) if (b.turnable) b.inner.rotation.y = this._turn
    this._placeBerths()
    this.renderer.render(this.scene, this.camera)
  }

  start() {
    if (this.running) return
    this.running = true
    const tick = () => {
      this._raf = requestAnimationFrame(tick)
      this.render()
    }
    tick()
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this._raf)
  }

  dispose() {
    this.stop()
    window.removeEventListener('resize', this._onResize)
    window.removeEventListener('pointermove', this._move)
    window.removeEventListener('pointerup', this._up)
    window.removeEventListener('pointercancel', this._up)
    this.canvas.removeEventListener('pointerdown', this._down)
    for (const b of this.berths.values()) {
      for (const m of b.pieces) { m.geometry.dispose(); m.material.dispose() }
      b.shadow.geometry.dispose(); b.shadow.material.dispose()
      this.scene.remove(b.group)
    }
    this.berths.clear()
    this.scene.environment?.dispose()
    this.renderer.dispose()
  }
}
