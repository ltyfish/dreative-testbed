import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const vertexShader = `
  varying vec2 vUv;
  uniform float uProgress;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 p = position;
    float wave = sin((p.x * 5.0) + (uProgress * 8.0) + (uTime * 0.28));
    p.z += wave * 0.09 * (0.25 + uProgress);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragmentShader = `
  varying vec2 vUv;
  uniform float uProgress;
  uniform float uTime;

  void main() {
    vec3 blue = vec3(0.114, 0.169, 0.82);
    vec3 yellow = vec3(0.906, 1.0, 0.22);
    vec3 orange = vec3(1.0, 0.357, 0.208);
    float lines = smoothstep(0.46, 0.5, abs(sin((vUv.y + sin(vUv.x * 7.0 + uTime * 0.16) * 0.035) * 34.0)));
    vec3 base = mix(blue, orange, smoothstep(0.12, 0.92, uProgress + vUv.x * 0.18));
    vec3 color = mix(base, yellow, lines * (0.2 + uProgress * 0.5));
    float edge = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
    gl_FragColor = vec4(color, 0.92 * edge);
  }
`

export default function RoastField({ progress }) {
  const mountRef = useRef(null)
  const materialRef = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compact = window.matchMedia('(max-width: 767px)').matches
    if (reduced || compact) return undefined

    let renderer
    let frameId
    let visible = true
    const clock = new THREE.Clock()

    try {
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 10)
      camera.position.z = 2.7
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.setClearColor(0x000000, 0)
      renderer.domElement.setAttribute('data-roast-field', 'live')
      mount.appendChild(renderer.domElement)

      const geometry = new THREE.PlaneGeometry(3.4, 1.55, 72, 36)
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uProgress: { value: progress },
          uTime: { value: 0 },
        },
      })
      materialRef.current = material
      const mesh = new THREE.Mesh(geometry, material)
      mesh.rotation.x = -0.12
      mesh.rotation.z = -0.06
      scene.add(mesh)

      function resize() {
        const width = Math.max(1, mount.clientWidth)
        const height = Math.max(1, mount.clientHeight)
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }

      function render() {
        if (!visible || document.hidden) return
        material.uniforms.uTime.value = clock.getElapsedTime()
        renderer.render(scene, camera)
        frameId = window.requestAnimationFrame(render)
      }

      function onContextLost(event) {
        event.preventDefault()
        setFailed(true)
      }

      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        if (visible && !frameId) render()
        if (!visible && frameId) {
          window.cancelAnimationFrame(frameId)
          frameId = undefined
        }
      }, { threshold: 0.05 })

      renderer.domElement.addEventListener('webglcontextlost', onContextLost)
      window.addEventListener('resize', resize)
      observer.observe(mount)
      resize()
      render()

      return () => {
        observer.disconnect()
        window.removeEventListener('resize', resize)
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
        if (frameId) window.cancelAnimationFrame(frameId)
        geometry.dispose()
        material.dispose()
        renderer.dispose()
        renderer.domElement.remove()
        materialRef.current = null
      }
    } catch {
      setFailed(true)
      return undefined
    }
  }, [])

  useEffect(() => {
    if (materialRef.current) materialRef.current.uniforms.uProgress.value = progress
  }, [progress])

  return <div className={`roast-field ${failed ? 'has-failed' : ''}`} ref={mountRef}><div className="roast-field-fallback" /></div>
}
