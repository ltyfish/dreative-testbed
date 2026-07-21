import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "./style.css";

gsap.registerPlugin(ScrollTrigger);

const ORIGINS = [
  { id: "ethiopia", index: "01", name: "Ethiopia", lot: "Konga · 74110", process: "Natural", altitude: "2,100 masl", notes: ["blueberry", "bergamot", "cacao"], roast: 0.42, color: "#b74c2d" },
  { id: "colombia", index: "02", name: "Colombia", lot: "Huila · Caturra", process: "Washed", altitude: "1,850 masl", notes: ["red apple", "caramel", "pecan"], roast: 0.56, color: "#d39a44" },
  { id: "guatemala", index: "03", name: "Guatemala", lot: "Atitlán · Bourbon", process: "Washed", altitude: "1,700 masl", notes: ["plum", "cocoa", "spice"], roast: 0.68, color: "#c66b36" },
  { id: "kenya", index: "04", name: "Kenya", lot: "Nyeri · SL28", process: "Double washed", altitude: "1,900 masl", notes: ["blackcurrant", "hibiscus", "molasses"], roast: 0.48, color: "#a6362b" },
  { id: "brazil", index: "05", name: "Brazil", lot: "Cerrado · Acaia", process: "Pulped natural", altitude: "1,200 masl", notes: ["praline", "fig", "milk chocolate"], roast: 0.74, color: "#9f673a" },
  { id: "sumatra", index: "06", name: "Sumatra", lot: "Gayo · Typica", process: "Wet hulled", altitude: "1,500 masl", notes: ["cedar", "cacao nib", "herbs"], roast: 0.82, color: "#6e4936" },
];

const CHAPTERS = ["intake", "origin", "roast", "rest", "brew"];

function Chronometer({ progressRef, originRef, reducedMotion }) {
  const rig = useRef();
  const drum = useRef();
  const needle = useRef();
  const aperture = useRef();
  const sparks = useRef();
  const target = useMemo(() => new THREE.Vector3(), []);
  const sparkPositions = useMemo(() => {
    const values = new Float32Array(90);
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
    const p = progressRef.current;
    const origin = ORIGINS[originRef.current];
    const ease = reducedMotion ? 1 : Math.min(1, delta * 4.5);
    const phase = Math.min(4, Math.floor(p * 5));
    const local = p * 5 - phase;
    const positions = [
      [-0.1, 0.05, 0],
      [0.55, -0.1, -0.2],
      [-0.25, 0.18, 0.2],
      [0.1, -0.35, -0.1],
      [-0.5, 0.15, 0.15],
    ];
    const rotations = [
      [0.1, -0.3, 0.08],
      [0.25, 0.8, -0.1],
      [-0.15, 1.7, 0.08],
      [0.35, 2.55, -0.18],
      [-0.25, 3.35, 0.08],
    ];
    const next = Math.min(4, phase + 1);
    target.set(
      THREE.MathUtils.lerp(positions[phase][0], positions[next][0], local),
      THREE.MathUtils.lerp(positions[phase][1], positions[next][1], local),
      THREE.MathUtils.lerp(positions[phase][2], positions[next][2], local),
    );
    rig.current.position.lerp(target, ease);
    rig.current.rotation.x = THREE.MathUtils.lerp(rig.current.rotation.x, THREE.MathUtils.lerp(rotations[phase][0], rotations[next][0], local), ease);
    rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, THREE.MathUtils.lerp(rotations[phase][1], rotations[next][1], local), ease);
    rig.current.rotation.z = THREE.MathUtils.lerp(rig.current.rotation.z, THREE.MathUtils.lerp(rotations[phase][2], rotations[next][2], local), ease);
    const pulse = reducedMotion ? 1 : 1 + Math.sin(state.clock.elapsedTime * 1.3) * 0.012;
    rig.current.scale.setScalar(pulse);
    drum.current.rotation.z += reducedMotion ? 0 : delta * (0.18 + p * 0.65);
    needle.current.rotation.z = THREE.MathUtils.lerp(-1.65, 1.35, Math.min(1, p * 1.15));
    aperture.current.scale.setScalar(0.72 + origin.roast * 0.38);
    sparks.current.rotation.y += reducedMotion ? 0 : delta * 0.08;
  });

  return (
    <group ref={rig}>
      <group rotation={[0.05, 0, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.22, 1.22, 0.34, 64]} />
          <meshStandardMaterial color="#181713" metalness={0.87} roughness={0.26} />
        </mesh>
        <mesh position={[0, 0.19, 0]}>
          <torusGeometry args={[0.93, 0.055, 18, 96]} />
          <meshStandardMaterial color="#b98743" metalness={0.92} roughness={0.22} />
        </mesh>
        <group ref={drum} position={[0, 0.22, 0]}>
          {Array.from({ length: 16 }, (_, i) => (
            <mesh key={i} rotation={[0, (i / 16) * Math.PI * 2, 0]} position={[Math.sin((i / 16) * Math.PI * 2) * 0.78, 0, Math.cos((i / 16) * Math.PI * 2) * 0.78]}>
              <boxGeometry args={[0.025, 0.035, 0.24]} />
              <meshStandardMaterial color="#695132" metalness={0.74} roughness={0.31} />
            </mesh>
          ))}
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
      </group>
      <points ref={sparks} position={[0, 0.5, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#f1a549" size={0.028} transparent opacity={0.7} sizeAttenuation />
      </points>
    </group>
  );
}

function RoastStage({ progressRef, originRef, reducedMotion, setFps }) {
  const frames = useRef(0);
  const last = useRef(performance.now());
  function Monitor() {
    useFrame(() => {
      frames.current += 1;
      const now = performance.now();
      if (now - last.current > 700) {
        setFps(Math.round((frames.current * 1000) / (now - last.current)));
        frames.current = 0;
        last.current = now;
      }
    });
    return null;
  }
  return (
    <div className="roast-stage" aria-hidden="true" data-stage-instance="singleton">
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
          <Chronometer progressRef={progressRef} originRef={originRef} reducedMotion={reducedMotion} />
        </Suspense>
        <mesh position={[0, -0.92, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[2.6, 64]} />
          <meshStandardMaterial color="#13120f" metalness={0.1} roughness={0.94} />
        </mesh>
        <Monitor />
      </Canvas>
    </div>
  );
}

function App() {
  const reducedMotion = useMemo(
    () => new URLSearchParams(window.location.search).get("motion") === "reduce"
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const compact = useMemo(() => window.matchMedia("(max-width: 760px), (pointer: coarse)").matches, []);
  const progressRef = useRef(0);
  const originRef = useRef(0);
  const ringRef = useRef();
  const pointerStart = useRef(null);
  const [selected, setSelected] = useState(0);
  const [chapter, setChapter] = useState("intake");
  const [progress, setProgress] = useState(0);
  const [fps, setFps] = useState(60);
  const [lenisOn, setLenisOn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [brewStep, setBrewStep] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
    document.documentElement.dataset.prototype = "roast-stage-vertical-slice";
    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: "#main",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const p = self.progress;
          progressRef.current = p;
          setProgress(Math.round(p * 100));
          setChapter(CHAPTERS[Math.min(CHAPTERS.length - 1, Math.floor(p * CHAPTERS.length))]);
        },
      });
      if (!reducedMotion) {
        gsap.fromTo(".hero-ledger", { yPercent: 0 }, {
          yPercent: -18,
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.5 },
        });
        gsap.fromTo(".story-copy", { clipPath: "inset(0 0 100% 0)" }, {
          clipPath: "inset(0 0 0% 0)",
          ease: "none",
          scrollTrigger: { trigger: ".story", start: "top 70%", end: "center 50%", scrub: 0.5 },
        });
        gsap.fromTo(".media-slice", { yPercent: (i) => (i % 2 ? 18 : -18) }, {
          yPercent: 0,
          ease: "none",
          scrollTrigger: { trigger: ".origin-lab", start: "top 80%", end: "center center", scrub: 0.45 },
        });
      }
    });
    return () => context.revert();
  }, [reducedMotion]);

  useEffect(() => {
    if (!lenisOn || reducedMotion || compact) return undefined;
    const lenis = new Lenis({ duration: 1.05, anchors: true, smoothWheel: true });
    const update = (time) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, [lenisOn, reducedMotion, compact]);

  const choose = (next) => {
    const safe = (next + ORIGINS.length) % ORIGINS.length;
    originRef.current = safe;
    setSelected(safe);
  };
  const selectedOrigin = ORIGINS[selected];

  const onRingKeyDown = (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      choose(selected + 1);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      choose(selected - 1);
    }
    if (event.key === "Home") choose(0);
    if (event.key === "End") choose(ORIGINS.length - 1);
  };

  const onPointerDown = (event) => {
    pointerStart.current = event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerUp = (event) => {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    if (Math.abs(delta) > 38) choose(selected + (delta < 0 ? 1 : -1));
    pointerStart.current = null;
  };

  return (
    <div className="site-shell" data-chapter={chapter} data-progress={progress} data-selected={selectedOrigin.id}>
      <RoastStage progressRef={progressRef} originRef={originRef} reducedMotion={reducedMotion} setFps={setFps} />
      <header className="site-nav">
        <a className="wordmark" href="#top" aria-label="Northwind home"><span>N</span> Northwind</a>
        <button className="menu-trigger" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>Index <span>{menuOpen ? "×" : "+"}</span></button>
        <nav aria-label="Primary" data-open={menuOpen}>
          <a href="#origin" onClick={() => setMenuOpen(false)}>Beans</a>
          <a href="#brew" onClick={() => setMenuOpen(false)}>Brew</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Visit</a>
        </nav>
      </header>

      <aside className="stage-telemetry" aria-label="Experience telemetry">
        <span>{String(CHAPTERS.indexOf(chapter) + 1).padStart(2, "0")} / 05</span>
        <span>{chapter}</span>
        <span>{progress}%</span>
        <span>{fps} fps</span>
      </aside>

      <main id="main">
        <section className="hero" id="top" data-chapter="intake">
          <div className="hero-media" aria-hidden="true" />
          <div className="hero-ledger">
            <p className="eyebrow">Bergen · Batch record 024—07</p>
            <h1>Coffee,<br /><em>measured</em><br />in moments.</h1>
            <p className="hero-deck">Six origins. One living record. Follow the batch as landscape becomes heat, rest, and ritual.</p>
            <a className="text-link" href="#origin">Open today’s ledger <span>↓</span></a>
          </div>
          <div className="hero-stamp" aria-hidden="true"><span>Roasted</span><b>18·07</b><span>Bergen</span></div>
        </section>

        <section className="story chapter-panel" id="story" data-chapter="origin">
          <p className="section-mark">I / Provenance</p>
          <div className="story-copy">
            <p className="display-quote">The batch begins long before the drum turns.</p>
            <p>We buy coffee with traceable names, elevations, and harvests—then roast to reveal the decisions already held inside each seed.</p>
          </div>
          <dl className="ledger-facts">
            <div><dt>Found</dt><dd>2014</dd></div>
            <div><dt>Latitude</dt><dd>60.39° N</dd></div>
            <div><dt>Roast days</dt><dd>Tue + Fri</dd></div>
          </dl>
        </section>

        <section className="origin-lab chapter-panel" id="origin" data-chapter="roast">
          <div className="section-head">
            <p className="section-mark">II / Origin calibration</p>
            <h2>Turn the ledger.<br /><em>Find your frequency.</em></h2>
          </div>
          <div className="origin-workbench">
            <div className="origin-media" aria-live="polite">
              {Array.from({ length: 9 }, (_, i) => (
                <span
                  className="media-slice"
                  key={i}
                  style={{
                    "--slice": i,
                    backgroundImage: `url(/assets/${selectedOrigin.id}.webp)`,
                  }}
                />
              ))}
              <p>{selectedOrigin.name} / {selectedOrigin.lot}</p>
            </div>
            <div className="origin-controls">
              <div
                className="origin-ring"
                ref={ringRef}
                role="listbox"
                aria-label="Coffee origin"
                aria-activedescendant={`origin-${selectedOrigin.id}`}
                tabIndex="0"
                onKeyDown={onRingKeyDown}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
              >
                {ORIGINS.map((origin, index) => (
                  <button
                    className="origin-option"
                    id={`origin-${origin.id}`}
                    role="option"
                    aria-selected={selected === index}
                    tabIndex="-1"
                    key={origin.id}
                    style={{ "--i": index, "--origin-color": origin.color }}
                    onClick={() => choose(index)}
                  >
                    <span>{origin.index}</span> {origin.name}
                  </button>
                ))}
                <div className="ring-core" aria-hidden="true">
                  <span>Profile</span>
                  <b>{Math.round(selectedOrigin.roast * 100)}</b>
                  <span>development</span>
                </div>
              </div>
              <article className="bean-dossier">
                <p>Lot {selectedOrigin.index} / 06</p>
                <h3>{selectedOrigin.lot}</h3>
                <dl>
                  <div><dt>Process</dt><dd>{selectedOrigin.process}</dd></div>
                  <div><dt>Altitude</dt><dd>{selectedOrigin.altitude}</dd></div>
                </dl>
                <ul aria-label="Tasting notes">
                  {selectedOrigin.notes.map((note) => <li key={note}>{note}</li>)}
                </ul>
                <button className="add-to-cart">Add 250g <span>€18 —</span></button>
              </article>
            </div>
          </div>
        </section>

        <section className="rest chapter-panel" id="rest" data-chapter="rest">
          <p className="section-mark">III / Rest</p>
          <blockquote>“It tastes like the weather cleared.”</blockquote>
          <p>— Amalie S., batch 021</p>
          <div className="rest-line" aria-hidden="true"><span /></div>
        </section>

        <section className="brew-lab chapter-panel" id="brew" data-chapter="brew">
          <div className="section-head">
            <p className="section-mark">IV / Transmutation</p>
            <h2>A score for<br /><em>water and time.</em></h2>
          </div>
          <div className="brew-layout">
            <div className="brew-score" role="group" aria-label="Brew steps">
              {[
                ["00:00", "Bloom", "50g water · wake the bed"],
                ["00:45", "First pour", "Spiral to 180g · hold"],
                ["01:30", "Final pour", "Centre to 300g · settle"],
                ["03:10", "Drawdown", "Remove · swirl · rest"],
              ].map(([time, title, copy], index) => (
                <button className="brew-step" aria-pressed={brewStep === index} onClick={() => setBrewStep(index)} key={time}>
                  <span>{time}</span><b>{title}</b><small>{copy}</small>
                </button>
              ))}
            </div>
            <div className="brew-vessel" data-step={brewStep} aria-live="polite">
              <span className="water" />
              <span className="coffee" />
              <span className="drip one" />
              <span className="drip two" />
              <p><b>{brewStep + 1}</b> / 4</p>
            </div>
          </div>
        </section>

        <section className="subscribe chapter-panel" id="contact">
          <p className="section-mark">V / Keep the record</p>
          <h2>The next batch<br />lands quietly.</h2>
          <form className="contact-form" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="email">Email address</label>
            <div><input id="email" type="email" placeholder="you@example.com" required /><button>Subscribe <span>→</span></button></div>
          </form>
          <button
            className="lenis-probe"
            aria-pressed={lenisOn}
            disabled={reducedMotion || compact}
            onClick={() => setLenisOn(!lenisOn)}
          >
            Scroll probe: {reducedMotion || compact ? "native (protected)" : lenisOn ? "Lenis" : "native"}
          </button>
        </section>
      </main>

      <footer>
        <a className="wordmark" href="#top"><span>N</span> Northwind</a>
        <p>Small-batch coffee, roasted beside the North Sea.</p>
        <nav aria-label="Legal"><a href="#shipping">Shipping</a><a href="#returns">Returns</a><a href="#privacy">Privacy</a></nav>
        <p>Prototype · generated imagery · procedural 3D</p>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
