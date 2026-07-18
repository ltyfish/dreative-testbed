import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const CONTINUITY_SOURCE_OWNER = "src/experience/RoastStage.jsx";
import { BEANS } from "../data";

function Instrument({ progressRef, originRef, reducedMotion }) {
  const rig = useRef();
  const drum = useRef();
  const needle = useRef();
  const aperture = useRef();
  const sparks = useRef();
  const target = useMemo(() => new THREE.Vector3(), []);
  const sparkPositions = useMemo(() => {
    const values = new Float32Array(108);
    for (let i = 0; i < values.length; i += 3) {
      const a = (i / 3) * 2.399;
      const r = 0.45 + ((i / 3) % 7) * 0.08;
      values[i] = Math.cos(a) * r;
      values[i + 1] = ((i / 3) % 9) * 0.1 - 0.35;
      values[i + 2] = Math.sin(a) * r;
    }
    return values;
  }, []);

  useFrame((state, delta) => {
    if (!rig.current) return;
    const p = progressRef.current;
    const origin = BEANS[originRef.current];
    const ease = reducedMotion ? 1 : Math.min(1, delta * 4.5);
    const phase = Math.min(4, Math.floor(p * 5));
    const local = p * 5 - phase;
    const positions = [
      [-0.15, 0.08, 0],
      [0.62, -0.12, -0.2],
      [-0.28, 0.2, 0.22],
      [0.12, -0.32, -0.12],
      [-0.48, 0.15, 0.16],
    ];
    const rotations = [
      [0.1, -0.3, 0.08],
      [0.25, 0.8, -0.1],
      [-0.15, 1.7, 0.08],
      [0.35, 2.55, -0.18],
      [-0.25, 3.35, 0.08],
    ];
    const next = Math.min(4, phase + 1);
    const lineageOffset = state.viewport.width < 3.2 ? 0.42 : 1.42;
    target.set(
      THREE.MathUtils.lerp(positions[phase][0], positions[next][0], local) + lineageOffset,
      THREE.MathUtils.lerp(positions[phase][1], positions[next][1], local),
      THREE.MathUtils.lerp(positions[phase][2], positions[next][2], local),
    );
    rig.current.position.lerp(target, ease);
    rig.current.rotation.x = THREE.MathUtils.lerp(
      rig.current.rotation.x,
      THREE.MathUtils.lerp(rotations[phase][0], rotations[next][0], local),
      ease,
    );
    rig.current.rotation.y = THREE.MathUtils.lerp(
      rig.current.rotation.y,
      THREE.MathUtils.lerp(rotations[phase][1], rotations[next][1], local),
      ease,
    );
    rig.current.rotation.z = THREE.MathUtils.lerp(
      rig.current.rotation.z,
      THREE.MathUtils.lerp(rotations[phase][2], rotations[next][2], local),
      ease,
    );
    rig.current.scale.setScalar(reducedMotion ? 1 : 1 + Math.sin(state.clock.elapsedTime * 1.3) * 0.012);
    drum.current.rotation.z += reducedMotion ? 0 : delta * (0.18 + p * 0.65);
    needle.current.rotation.z = THREE.MathUtils.lerp(-1.65, 1.35, Math.min(1, p * 1.15));
    aperture.current.scale.setScalar(0.72 + (origin.development / 100) * 0.38);
    sparks.current.rotation.y += reducedMotion ? 0 : delta * 0.08;
  });

  return (
    <group ref={rig}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.22, 1.22, 0.34, 64]} />
        <meshStandardMaterial color="#181713" metalness={0.87} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.19, 0]}>
        <torusGeometry args={[0.93, 0.055, 18, 96]} />
        <meshStandardMaterial color="#b98743" metalness={0.92} roughness={0.22} />
      </mesh>
      <group ref={drum} position={[0, 0.22, 0]}>
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          return (
            <mesh key={i} rotation={[0, angle, 0]} position={[Math.sin(angle) * 0.78, 0, Math.cos(angle) * 0.78]}>
              <boxGeometry args={[0.025, 0.035, 0.24]} />
              <meshStandardMaterial color="#695132" metalness={0.74} roughness={0.31} />
            </mesh>
          );
        })}
      </group>
      <mesh ref={aperture} position={[0, 0.4, 0]}>
        <ringGeometry args={[0.48, 0.69, 64]} />
        <meshStandardMaterial color="#0c0c0a" metalness={0.74} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 64]} />
        <meshStandardMaterial color="#d87c2f" emissive="#a83c0e" emissiveIntensity={1.4} metalness={0.2} roughness={0.52} />
      </mesh>
      <group ref={needle} position={[0, 0.465, 0]}>
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[0.035, 0.68, 0.035]} />
          <meshStandardMaterial color="#e3d9c6" metalness={0.25} roughness={0.48} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.075, 0.075, 0.07, 24]} />
          <meshStandardMaterial color="#d2a45d" metalness={0.9} roughness={0.22} />
        </mesh>
      </group>
      <mesh position={[-1.02, -0.3, 0.45]} rotation={[0.15, 0, 0.2]}>
        <boxGeometry args={[0.46, 0.16, 0.75]} />
        <meshStandardMaterial color="#25231d" metalness={0.83} roughness={0.31} />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.44, 0.72, 0.65, 8]} />
        <meshStandardMaterial color="#11110f" metalness={0.8} roughness={0.38} />
      </mesh>
      <points ref={sparks} position={[0, 0.5, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#f1a549" size={0.028} transparent opacity={0.7} sizeAttenuation />
      </points>
    </group>
  );
}

function FrameMonitor({ onFps }) {
  const frames = useRef(0);
  const last = useRef(performance.now());
  useFrame(() => {
    frames.current += 1;
    const now = performance.now();
    if (now - last.current > 700) {
      const measured = Math.round((frames.current * 1000) / (now - last.current));
      if (measured >= 15) onFps(measured);
      frames.current = 0;
      last.current = now;
    }
  });
  return null;
}

export default function RoastStage({ progressRef, originRef, reducedMotion, onFps }) {
  return (
    <div className="roast-stage" data-state="active" aria-hidden="true" data-stage-instance="singleton">
      <Canvas
        className="stage-canvas"
        dpr={[1, 1.5]}
        camera={{ position: [0, 2.7, 4.6], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        shadows
      >
        <color attach="background" args={["#15130f"]} />
        <fog attach="fog" args={["#15130f", 4.5, 8]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[-4, 5, 3]} intensity={2.4} color="#e9dfc9" castShadow />
        <pointLight position={[2, 0.8, 1]} intensity={18} distance={5} color="#d96c27" />
        <Suspense fallback={null}>
          <Instrument progressRef={progressRef} originRef={originRef} reducedMotion={reducedMotion} />
        </Suspense>
        <mesh position={[0, -0.92, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[2.6, 64]} />
          <meshStandardMaterial color="#13120f" metalness={0.1} roughness={0.94} />
        </mesh>
        <FrameMonitor onFps={onFps} />
      </Canvas>
    </div>
  );
}
