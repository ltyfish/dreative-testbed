import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const STAGES = [
  { name: 'Charge', temp: '196°C', time: '00:00', note: 'Green coffee enters the cast-iron drum.' },
  { name: 'Drying', temp: '154°C', time: '04:12', note: 'Moisture leaves. The bean turns straw-gold.' },
  { name: 'First crack', temp: '203°C', time: '08:46', note: 'Pressure releases. Aroma opens into the room.' },
  { name: 'Development', temp: '211°C', time: '10:08', note: 'Sweetness, acidity, and body find their balance.' },
  { name: 'Drop', temp: '208°C', time: '10:42', note: 'The batch falls into cooling air, ready to ship.' },
]

const COLORS = ['#71845c', '#b79055', '#a45727', '#64311d', '#2b1812']

function StageCopy({ stage }) {
  const item = STAGES[stage]
  return (
    <div className="prototype-copy">
      <span className="eyebrow">Roast study / 12 kg batch</span>
      <p className="stage-count">0{stage + 1} — 05</p>
      <h1>{item.name}</h1>
      <p className="prototype-note">{item.note}</p>
      <dl>
        <div><dt>Bean</dt><dd>Ethiopia Yirgacheffe</dd></div>
        <div><dt>Probe</dt><dd>{item.temp}</dd></div>
        <div><dt>Elapsed</dt><dd>{item.time}</dd></div>
      </dl>
    </div>
  )
}

function PrototypeControls({ stage, setStage }) {
  return (
    <div className="prototype-controls" aria-label="Roast stages">
      <input
        aria-label="Roast progress"
        type="range"
        min="0"
        max="4"
        step="1"
        value={stage}
        onChange={(event) => setStage(Number(event.target.value))}
      />
      <div className="stage-buttons">
        {STAGES.map((item, index) => (
          <button
            type="button"
            className={index === stage ? 'active' : ''}
            onClick={() => setStage(index)}
            key={item.name}
          >
            <span>0{index + 1}</span>{item.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function BoundedChamber({ stage }) {
  return (
    <div className="bounded-chamber" style={{ '--roast': COLORS[stage], '--stage': stage }}>
      <div className="heat-rings" aria-hidden="true" />
      <div className="drum-shell" aria-hidden="true">
        <div className="drum-door" />
        <div className="drum-axis" />
      </div>
      <div className="bean-field" aria-label={`Coffee beans at ${STAGES[stage].name} stage`}>
        {Array.from({ length: 42 }, (_, index) => (
          <i key={index} style={{ '--i': index, '--x': `${(index * 37) % 88}%`, '--y': `${(index * 53) % 80}%` }} />
        ))}
      </div>
      <span className="chamber-label">PROBAT / 1962</span>
    </div>
  )
}

export function ThreeChamber({ stage }) {
  const hostRef = useRef(null)
  const stageRef = useRef(stage)
  const renderRef = useRef(null)

  useEffect(() => {
    stageRef.current = stage
    renderRef.current?.()
  }, [stage])

  useEffect(() => {
    const host = hostRef.current
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x090a08, 0.065)
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 0.25, 9)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    host.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)
    const rimMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x9b8d74,
      metalness: 0.92,
      roughness: 0.24,
      clearcoat: 0.32,
    })
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0x161713,
      metalness: 0.68,
      roughness: 0.54,
      side: THREE.DoubleSide,
    })
    const backPlate = new THREE.Mesh(new THREE.CircleGeometry(2.78, 64), innerMaterial)
    backPlate.position.z = -1.15
    group.add(backPlate)
    ;[0.35, -1.12].forEach((z, index) => {
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(index === 0 ? 3.05 : 2.86, index === 0 ? 0.13 : 0.07, 16, 96),
        rimMaterial
      )
      rim.position.z = z
      group.add(rim)
    })
    const agitator = new THREE.Group()
    for (let i = 0; i < 3; i += 1) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.055, 0.07), rimMaterial)
      arm.position.x = 1.25
      arm.rotation.z = i * (Math.PI * 2 / 3)
      agitator.add(arm)
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 24), rimMaterial)
    hub.rotation.x = Math.PI / 2
    agitator.add(hub)
    agitator.position.z = -0.82
    group.add(agitator)

    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = 128
    textureCanvas.height = 64
    const textureContext = textureCanvas.getContext('2d')
    textureContext.fillStyle = '#f5e7cf'
    textureContext.fillRect(0, 0, 128, 64)
    textureContext.strokeStyle = '#493121'
    textureContext.lineWidth = 7
    textureContext.lineCap = 'round'
    textureContext.beginPath()
    textureContext.moveTo(64, 5)
    textureContext.bezierCurveTo(54, 20, 75, 38, 62, 59)
    textureContext.stroke()
    const beanTexture = new THREE.CanvasTexture(textureCanvas)
    beanTexture.colorSpace = THREE.SRGBColorSpace

    const beanGeometry = new THREE.SphereGeometry(0.25, 24, 16)
    const beanPositions = beanGeometry.attributes.position
    for (let index = 0; index < beanPositions.count; index += 1) {
      const x = beanPositions.getX(index)
      const y = beanPositions.getY(index)
      const z = beanPositions.getZ(index)
      const waist = 1 - 0.16 * Math.exp(-Math.pow(y * 12, 2))
      beanPositions.setXYZ(index, x * 1.08 * waist, y * 0.7, z * 0.56)
    }
    beanGeometry.computeVertexNormals()
    const beanMaterial = new THREE.MeshPhysicalMaterial({
      color: COLORS[stage],
      map: beanTexture,
      roughness: 0.62,
      metalness: 0,
      clearcoat: 0.08,
    })
    const beans = new THREE.InstancedMesh(beanGeometry, beanMaterial, 72)
    const dummy = new THREE.Object3D()
    const beanStates = []
    for (let i = 0; i < 72; i += 1) {
      const angle = i * 2.399
      const radius = 0.35 + (i % 12) * 0.17
      const beanState = {
        angle,
        radius,
        depth: -0.5 + (i % 7) * 0.11,
        speed: 0.72 + (i % 9) * 0.045,
        wobble: (i % 5) * 0.37,
        spin: angle + (i % 4) * 0.32,
      }
      beanStates.push(beanState)
      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, beanState.depth)
      dummy.rotation.set(angle * 0.22, angle * 0.4, beanState.spin)
      dummy.updateMatrix()
      beans.setMatrixAt(i, dummy.matrix)
    }
    group.add(beans)

    const glow = new THREE.PointLight(0xd95c2c, 24, 11, 1.8)
    glow.position.set(-2.3, -1.8, 3.2)
    scene.add(glow)
    const key = new THREE.DirectionalLight(0xffe4bd, 5.5)
    key.position.set(-3, 5, 6)
    scene.add(key)
    const edge = new THREE.DirectionalLight(0x8aa0a1, 2)
    edge.position.set(5, -2, 4)
    scene.add(edge)
    scene.add(new THREE.AmbientLight(0x4b4c43, 1.6))

    const resize = () => {
      const rect = host.getBoundingClientRect()
      renderer.setSize(rect.width, rect.height, false)
      camera.aspect = rect.width / rect.height
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()
    const reducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      new URLSearchParams(window.location.search).has('capture')
    let isVisible = true
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    })
    visibilityObserver.observe(host)

    let frame
    let elapsed = 0
    let stageElapsed = 0
    let lastStage = stageRef.current
    let previousTime = performance.now()
    const animate = () => {
      if (!reducedMotion) frame = requestAnimationFrame(animate)
      const now = performance.now()
      const delta = Math.min((now - previousTime) / 1000, 0.05)
      previousTime = now
      elapsed += delta
      const s = stageRef.current
      if (s !== lastStage) {
        lastStage = s
        stageElapsed = 0
      } else {
        stageElapsed += delta
      }
      beanMaterial.color.lerp(new THREE.Color(COLORS[s]), 0.045)
      if (!reducedMotion && isVisible) {
        beanStates.forEach((bean, index) => {
          const stageSpeed = 0.42 + s * 0.16
          const travel = bean.angle + elapsed * bean.speed * stageSpeed
          const crackExpansion = s === 2 ? 1.12 : s === 3 ? 1.04 : 1
          const drop = s === 4 ? Math.min(2.8, stageElapsed * 0.72 + (index % 8) * 0.035) : 0
          const cascade = Math.sin(travel * 1.7 + bean.wobble) * 0.09
          dummy.position.set(
            Math.cos(travel) * bean.radius * crackExpansion,
            Math.sin(travel) * bean.radius * 0.92 + cascade - drop,
            bean.depth + Math.sin(travel * 0.8) * 0.12
          )
          dummy.rotation.set(
            travel * 0.35 + bean.wobble,
            travel * 0.62,
            bean.spin + elapsed * bean.speed * (1.1 + s * 0.16)
          )
          dummy.updateMatrix()
          beans.setMatrixAt(index, dummy.matrix)
        })
        beans.instanceMatrix.needsUpdate = true
      }
      agitator.rotation.z -= delta * (0.05 + s * 0.025)
      group.rotation.y += ((s - 2) * 0.035 - group.rotation.y) * 0.035
      group.rotation.x += ((s - 2) * -0.018 - group.rotation.x) * 0.035
      glow.intensity += ((12 + s * 7) - glow.intensity) * 0.04
      camera.position.z += ((8.8 - s * 0.25) - camera.position.z) * 0.03
      renderer.render(scene, camera)
    }
    renderRef.current = () => {
      if (reducedMotion) animate()
    }
    animate()
    return () => {
      renderRef.current = null
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibilityObserver.disconnect()
      beanGeometry.dispose()
      beanMaterial.dispose()
      beanTexture.dispose()
      backPlate.geometry.dispose()
      innerMaterial.dispose()
      agitator.children.forEach((child) => child.geometry.dispose())
      rimMaterial.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div className="three-chamber" ref={hostRef}>
      <div className="thermal-scan" aria-hidden="true" />
      <span className="chamber-label">PROBAT / 1962 / LIVE DRUM</span>
      <span className="axis-label">Thermal section A—A</span>
    </div>
  )
}

export default function RoastPrototype({ mode }) {
  const [stage, setStage] = useState(0)
  const isThree = mode === 'spatial'

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('manual')) return undefined
    const timer = window.setInterval(() => setStage((current) => (current + 1) % STAGES.length), 2200)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <main className={`prototype-page ${isThree ? 'spatial-mode' : 'bounded-mode'}`}>
      <header className="prototype-header">
        <a href="/">Northwind</a>
        <span>{isThree ? 'Prototype B / rendered spatial chamber' : 'Prototype A / bounded layered chamber'}</span>
        <span>Bergen · 60.392° N</span>
      </header>
      <section className="prototype-stage">
        <StageCopy stage={stage} />
        <div className="prototype-visual">
          {isThree ? <ThreeChamber stage={stage} /> : <BoundedChamber stage={stage} />}
        </div>
      </section>
      <PrototypeControls stage={stage} setStage={setStage} />
    </main>
  )
}
