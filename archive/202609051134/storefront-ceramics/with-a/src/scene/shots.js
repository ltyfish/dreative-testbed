import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { buildVesselGeometry } from './vessel.js'
import { makeGlazeMaterial } from './glaze.js'
import { PROFILES } from './profiles.js'

// The shop's pictures are taken here, in the same studio light as the live
// stage, one piece at a time. Nine pieces photographed in one session by one
// camera is the thing a stock library can never hand you, and it is why the
// shelf below reads as one shelf.

const HDRI = '/hdri/studio_small_08_1k.hdr'
const W = 620
const H = 760

let mill = null

function createMill() {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(1)
  renderer.setSize(W, H, false)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.04
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(24, W / H, 1, 4000)

  const key = new THREE.DirectionalLight(0xfff2e0, 1.0)
  key.position.set(-220, 420, 300)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.bias = -0.002
  key.shadow.normalBias = 1.1
  Object.assign(key.shadow.camera, { near: 5, far: 1600, left: -320, right: 320, top: 320, bottom: -220 })
  key.shadow.camera.updateProjectionMatrix()
  scene.add(key, key.target)

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 3000),
    new THREE.ShadowMaterial({ opacity: 0.3, color: 0x2c2018 }),
  )
  shadowPlane.rotation.x = -Math.PI / 2
  shadowPlane.receiveShadow = true
  scene.add(shadowPlane)

  return { renderer, scene, camera, key, canvas, ready: false }
}

export async function initShots() {
  if (mill?.ready) return mill
  if (!mill) mill = createMill()
  const pmrem = new THREE.PMREMGenerator(mill.renderer)
  const hdr = await new RGBELoader().loadAsync(HDRI)
  mill.scene.environment = pmrem.fromEquirectangular(hdr).texture
  mill.scene.environmentRotation = new THREE.Euler(0, -0.85, 0)
  hdr.dispose(); pmrem.dispose()
  mill.ready = true
  return mill
}

const cache = new Map()

// glaze === null means an unglazed, once-fired piece: what is actually on the
// shelf when something has sold out and the next firing has not happened yet.
export function shootPiece(id, glaze, seed = 3) {
  const cacheKey = `${id}:${glaze || 'bisque'}:${seed}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)
  if (!mill?.ready) return null

  const { renderer, scene, camera, key } = mill
  const geo = buildVesselGeometry(PROFILES[id], seed)
  const mat = glaze
    ? makeGlazeMaterial(glaze, seed)
    : new THREE.MeshPhysicalMaterial({ color: 0xb59b80, roughness: 0.92, metalness: 0, envMapIntensity: 0.85 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.rotation.y = -0.42
  scene.add(mesh)

  const h = geo.userData.height
  const r = geo.userData.radius
  const span = Math.max(h, r * 2) * 1.34
  const fov = (camera.fov * Math.PI) / 180
  const dist = span / (2 * Math.tan(fov / 2))
  camera.position.set(0, h * 0.52 + span * 0.06, dist)
  camera.lookAt(0, h * 0.46, 0)
  key.target.position.set(0, h * 0.4, 0)
  key.target.updateMatrixWorld()

  renderer.render(scene, camera)
  const url = mill.canvas.toDataURL('image/png')

  scene.remove(mesh)
  geo.dispose()
  mat.dispose()
  cache.set(cacheKey, url)
  return url
}

export function disposeShots() {
  if (!mill) return
  mill.scene.environment?.dispose()
  mill.renderer.dispose()
  cache.clear()
  mill = null
}
