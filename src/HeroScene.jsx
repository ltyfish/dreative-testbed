import { Suspense, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { ContactShadows, Environment } from '@react-three/drei'
import { TextureLoader, SRGBColorSpace } from 'three'
import { gsap } from 'gsap'

function CoffeeBagCutout({ pointer, reducedMotion }) {
  const group = useRef()
  const texture = useLoader(TextureLoader, '/assets/northwind-bag.webp')
  texture.colorSpace = SRGBColorSpace

  useFrame((state, delta) => {
    if (!group.current) return
    const targetX = reducedMotion ? 0 : pointer.current.y * 0.1
    const targetY = reducedMotion ? -0.12 : pointer.current.x * 0.2 - 0.12
    group.current.rotation.x = gsap.utils.interpolate(group.current.rotation.x, targetX, 1 - Math.pow(0.002, delta))
    group.current.rotation.y = gsap.utils.interpolate(group.current.rotation.y, targetY, 1 - Math.pow(0.002, delta))
    group.current.rotation.z = gsap.utils.interpolate(group.current.rotation.z, pointer.current.x * -0.025, 1 - Math.pow(0.003, delta))
    group.current.position.y = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.68) * 0.035
  })

  return (
    <group ref={group} rotation={[0, -0.12, 0]}>
      <mesh castShadow>
        <planeGeometry args={[2.55, 3.7, 12, 12]} />
        <meshStandardMaterial map={texture} transparent alphaTest={0.03} roughness={0.76} metalness={0.02} />
      </mesh>
    </group>
  )
}

export default function HeroScene({ pointer, reducedMotion, active }) {
  return (
    <Canvas
      frameloop={active && !reducedMotion ? 'always' : 'demand'}
      dpr={[1, reducedMotion ? 1 : 1.7]}
      camera={{ position: [0, 0, 5.5], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      aria-label="Spatial preview of a Northwind coffee bag"
    >
      <ambientLight intensity={1.25} />
      <directionalLight position={[-4, 5, 5]} intensity={3.4} color="#ffd6a4" castShadow />
      <pointLight position={[4, 0, 3]} intensity={7} color="#b96a3f" />
      <Suspense fallback={null}>
        <CoffeeBagCutout pointer={pointer} reducedMotion={reducedMotion} />
        <Environment preset="warehouse" />
        <ContactShadows position={[0, -1.87, 0]} opacity={0.36} scale={5} blur={2.8} far={4} />
      </Suspense>
    </Canvas>
  )
}
