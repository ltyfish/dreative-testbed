import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const PROFILES = {
  light: { label: 'Light', temp: 196, color: '#c99049', note: 'Jasmine · citrus · honey', turn: '08:42' },
  medium: { label: 'Medium', temp: 208, color: '#9b4e2f', note: 'Caramel · red apple · cocoa', turn: '10:18' },
  dark: { label: 'Dark', temp: 220, color: '#4a231b', note: 'Dark chocolate · cedar · earth', turn: '12:06' },
}

function SpatialDrum({ profile }) {
  const mount = useRef(null)

  useEffect(() => {
    const host = mount.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, host.clientWidth / host.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 11)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7))
    renderer.setSize(host.clientWidth, host.clientHeight)
    host.appendChild(renderer.domElement)

    const group = new THREE.Group()
    group.scale.setScalar(.82)
    scene.add(group)
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(1.75, 1.75, 2.4, 48, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x392e28, metalness: .82, roughness: .27, side: THREE.DoubleSide })
    )
    drum.rotation.z = Math.PI / 2
    group.add(drum)
    const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xc48543, metalness: .9, roughness: .2 })
    ;[-1.2, 1.2].forEach((x) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.76, .06, 12, 64), ringMaterial)
      ring.rotation.y = Math.PI / 2
      ring.position.x = x
      group.add(ring)
    })
    const beanMaterial = new THREE.MeshStandardMaterial({ color: PROFILES[profile].color, roughness: .72 })
    const beanGeometry = new THREE.SphereGeometry(.13, 12, 8)
    const beans = []
    for (let i = 0; i < 54; i += 1) {
      const bean = new THREE.Mesh(beanGeometry, beanMaterial)
      bean.scale.set(1.25, .7, .7)
      bean.position.set((Math.random() - .5) * 2, (Math.random() - .5) * 2.4, (Math.random() - .5) * 2.4)
      bean.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3)
      group.add(bean)
      beans.push(bean)
    }
    scene.add(new THREE.HemisphereLight(0xffe0b5, 0x091516, 2.2))
    const hot = new THREE.PointLight(PROFILES[profile].color, 34, 10)
    hot.position.set(-2, 1, 3)
    scene.add(hot)
    let frame
    const tick = (time) => {
      group.rotation.x = Math.sin(time * .00025) * .12
      group.rotation.y = time * .00023
      beans.forEach((bean, index) => { bean.rotation.y += .008 + (index % 4) * .002 })
      renderer.render(scene, camera)
      frame = requestAnimationFrame(tick)
    }
    tick(0)
    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(host.clientWidth, host.clientHeight)
    }
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      renderer.dispose()
      drum.geometry.dispose()
      beanGeometry.dispose()
      beanMaterial.dispose()
      ringMaterial.dispose()
      host.replaceChildren()
    }
  }, [profile])

  return <div className="three-host" ref={mount} aria-label={`A rotating spatial roaster drum showing the ${profile} roast`} />
}

export default function RoastPrototype({ mode }) {
  const [profile, setProfile] = useState('medium')
  const data = PROFILES[profile]
  return (
    <main className={`prototype prototype--${mode}`} style={{ '--heat': data.color }}>
      <header className="proto-nav">
        <span className="proto-mark">NORTHWIND / LAB 01</span>
        <span>BERGEN · ROASTED 06:14</span>
      </header>
      <section className="proto-copy">
        <p className="eyebrow">{mode === 'spatial' ? 'HIGHER-CEILING / LIVE GEOMETRY' : 'BOUNDED / DOM + SVG'}</p>
        <h1>Heat leaves<br />a signature.</h1>
        <p className="intro">Turn the roast dial. One batch moves from green density to aromatic fracture inside our 1962 Probat.</p>
      </section>
      <section className="roast-stage">
        <div className="stage-readout">
          <span>CHARGE</span><strong>{data.temp}°</strong><small>TURN / {data.turn}</small>
        </div>
        {mode === 'spatial' ? (
          <SpatialDrum profile={profile} />
        ) : (
          <div className="svg-stage" aria-label={`Layered illustration of the ${profile} roast`}>
            <div className="heat-orbit" />
            <svg viewBox="0 0 600 420" role="img">
              <defs>
                <linearGradient id="drum" x1="0" x2="1"><stop stopColor="#171d1c"/><stop offset=".5" stopColor="#726253"/><stop offset="1" stopColor="#111615"/></linearGradient>
              </defs>
              <ellipse cx="300" cy="340" rx="210" ry="35" fill="#071010" opacity=".7"/>
              <rect x="125" y="105" width="350" height="230" rx="115" fill="url(#drum)" stroke="#c48947" strokeWidth="5"/>
              <circle cx="300" cy="220" r="82" fill={data.color} opacity=".86"/>
              <circle cx="300" cy="220" r="58" fill="#111716"/>
              {[0,1,2,3,4,5,6,7].map((i) => <circle key={i} cx={300 + Math.cos(i * .785) * 42} cy={220 + Math.sin(i * .785) * 42} r="9" fill={data.color}/>)}
            </svg>
          </div>
        )}
        <div className="profile-note"><span>{data.label} roast</span><strong>{data.note}</strong></div>
      </section>
      <section className="roast-controls" aria-label="Choose roast profile">
        {Object.keys(PROFILES).map((key) => (
          <button key={key} className={profile === key ? 'active' : ''} onClick={() => setProfile(key)}>
            <span>0{Object.keys(PROFILES).indexOf(key) + 1}</span>{PROFILES[key].label}
          </button>
        ))}
      </section>
      <footer className="proto-footer">
        <span>12 KG / BATCH</span><span>THE ROAST STATE CONTINUES INTO BEANS + BREW</span>
      </footer>
    </main>
  )
}
