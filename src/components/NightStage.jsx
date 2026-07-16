import { useEffect, useRef } from 'react'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const fragmentShader = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uProgress;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uPointer;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
  }

  void main() {
    vec2 cover = vUv;
    float imageAspect = 1.7777778;
    if (uAspect > imageAspect) {
      float scale = imageAspect / uAspect;
      cover.y = cover.y * scale + (1.0 - scale) * .5;
    } else {
      float scale = uAspect / imageAspect;
      cover.x = cover.x * scale + (1.0 - scale) * .5;
    }

    vec2 grid = floor(vUv * vec2(70.0, 38.0));
    float drop = smoothstep(.9, .97, hash(grid));
    float rain = sin((vUv.y + hash(grid) * .3) * 110.0 - uTime * 2.2) * .0022 * drop;
    float pointerDistance = length((vUv - (uPointer * .5 + .5)) * vec2(uAspect, 1.0));
    float lens = smoothstep(.4, 0.0, pointerDistance) * (.014 - uProgress * .006);
    float heatPeak = sin(uProgress * 3.14159265);
    float heatMask = smoothstep(.62, .06, length((vUv - vec2(.73, .48)) * vec2(1.05, .78)));
    float heatRipple = sin(vUv.y * 48.0 + uTime * 1.35 + sin(vUv.x * 21.0) * 1.8) * .0032;
    vec2 distortion = vec2(rain + lens * uPointer.x, -rain * 1.8 + lens * uPointer.y);
    distortion += vec2(heatRipple * .34, heatRipple) * heatPeak * heatMask;
    distortion *= mix(1.0, .42, smoothstep(.0, .42, uProgress));

    vec4 cold = texture2D(uTexture, cover + distortion);
    vec4 warm = texture2D(uTexture, cover - distortion * .3);
    warm.rgb *= vec3(1.17, .89, .72);
    cold.rgb *= vec3(.74, .89, 1.06);

    vec3 color = mix(cold.rgb, warm.rgb, heatPeak * .5);
    color += vec3(.12, .025, .006) * heatPeak * heatMask;
    color *= mix(.7, .96, smoothstep(.0, .35, uProgress));
    gl_FragColor = vec4(color, 1.0);
  }
`

export default function NightStage({ progress = 0, reducedMotion = false }) {
  const mountRef = useRef(null)
  const progressRef = useRef(progress)
  const renderFrameRef = useRef(null)

  useEffect(() => {
    progressRef.current = progress
    renderFrameRef.current?.(progress)
  }, [progress])

  useEffect(() => {
    if (reducedMotion || !mountRef.current) return undefined

    const mount = mountRef.current
    let disposed = false
    let teardown = () => {}

    async function setup() {
      const THREE = await import('three')
      if (disposed) return

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20)
      camera.position.z = 4

      let renderer
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        })
      } catch {
        mount.dataset.failed = 'true'
        return
      }

      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.domElement.setAttribute('aria-hidden', 'true')
      mount.appendChild(renderer.domElement)

      const pointer = new THREE.Vector2()
      const textureLoader = new THREE.TextureLoader()
      const roastery = textureLoader.load('/assets/night-roastery-prototype.png')
      roastery.colorSpace = THREE.SRGBColorSpace

      const uniforms = {
        uTexture: { value: roastery },
        uProgress: { value: 0 },
        uPointer: { value: pointer },
        uTime: { value: 0 },
        uAspect: { value: 1 },
      }

      const backgroundGeometry = new THREE.PlaneGeometry(2, 2)
      const backgroundMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        depthWrite: false,
      })
      scene.add(new THREE.Mesh(backgroundGeometry, backgroundMaterial))

      const bagTexture = textureLoader.load('/assets/northwind-bag-prototype.png')
      bagTexture.colorSpace = THREE.SRGBColorSpace
      const bagGeometry = new THREE.PlaneGeometry(0.65, 1.1)
      const bagMaterial = new THREE.MeshBasicMaterial({
        map: bagTexture,
        transparent: true,
        alphaTest: 0.02,
        depthWrite: false,
      })
      const bag = new THREE.Mesh(bagGeometry, bagMaterial)
      bag.position.z = 1
      scene.add(bag)

      const clock = new THREE.Clock()
      let visible = true

      function resize() {
        const rect = mount.getBoundingClientRect()
        const mobile = rect.width < 760
        renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5))
        renderer.setSize(rect.width, rect.height, false)
        uniforms.uAspect.value = rect.width / Math.max(1, rect.height)
        draw(progressRef.current)
      }

      function draw(currentProgress) {
        if (!visible || document.hidden || disposed) return
        uniforms.uProgress.value = currentProgress
        uniforms.uTime.value = clock.getElapsedTime()

        const enter = THREE.MathUtils.smoothstep(currentProgress, 0.26, 0.5)
        const exit = 1 - THREE.MathUtils.smoothstep(currentProgress, 0.8, 1)
        const presence = enter * exit
        const phase = THREE.MathUtils.clamp((currentProgress - 0.2) / 0.8, 0, 1)
        const lift = Math.sin(phase * Math.PI)
        bag.position.x = 0.88 - enter * 0.17 + (1 - exit) * 0.08
        bag.position.y = -0.1 + lift * 0.12 - (1 - exit) * 0.22
        bag.rotation.y = -0.22 + pointer.x * 0.065 + enter * 0.28
        bag.rotation.z = -0.035 + (enter - 0.5) * 0.055
        bag.scale.setScalar(0.34 + enter * 0.27 - (1 - exit) * 0.08)
        bagMaterial.opacity = presence

        renderer['render'](scene, camera)
      }

      function handlePointer(event) {
        const rect = mount.getBoundingClientRect()
        pointer.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -(((event.clientY - rect.top) / rect.height) * 2 - 1),
        )
        draw(progressRef.current)
      }

      function handleVisibility() {
        if (!document.hidden && visible) draw(progressRef.current)
      }

      function handleContextLoss(event) {
        event.preventDefault()
        mount.dataset.failed = 'true'
        renderer.domElement.hidden = true
      }

      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        if (visible && !document.hidden) draw(progressRef.current)
      }, { threshold: 0.01 })

      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(mount)
      observer.observe(mount)
      mount.addEventListener('pointermove', handlePointer)
      document.addEventListener('visibilitychange', handleVisibility)
      renderer.domElement.addEventListener('webglcontextlost', handleContextLoss)
      renderFrameRef.current = draw
      resize()

      teardown = () => {
        renderFrameRef.current = null
        observer.disconnect()
        resizeObserver.disconnect()
        mount.removeEventListener('pointermove', handlePointer)
        document.removeEventListener('visibilitychange', handleVisibility)
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLoss)
        backgroundGeometry.dispose()
        backgroundMaterial.dispose()
        bagGeometry.dispose()
        bagMaterial.dispose()
        roastery.dispose()
        bagTexture.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    }

    setup()
    return () => {
      disposed = true
      teardown()
    }
  }, [reducedMotion])

  return (
    <div className="night-stage" ref={mountRef} aria-hidden="true">
      <img src="/assets/night-roastery-prototype.png" alt="" />
    </div>
  )
}
