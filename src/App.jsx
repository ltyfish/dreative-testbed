import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BEANS, POLICIES, REVIEWS, STEPS } from "./data";

const RoastStage = lazy(() => import("./experience/RoastStage"));
gsap.registerPlugin(ScrollTrigger);

const CHAPTERS = ["intake", "origin", "roast", "rest", "brew"];

function Mark({ children }) {
  return <p className="section-mark">{children}</p>;
}

function Wordmark({ href = "#hero" }) {
  return (
    <a className="wordmark" href={href} aria-label="Northwind home">
      <span>N</span> Northwind
    </a>
  );
}

function PolicyPage({ policy, path }) {
  return (
    <div className="policy-shell">
      <header className="policy-nav">
        <Wordmark href="/" />
        <a className="policy-home" href="/">Return to the roast ledger <span>↗</span></a>
      </header>
      <main>
        <Mark>Policy ledger / {policy.index}</Mark>
        <h1 className="policy-title">{policy.title}</h1>
        <p className="policy-intro">{policy.intro}</p>
        <div className="policy-grid">
          {policy.sections.map(([title, copy], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{title}</h2>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </main>
      <footer className="policy-footer">
        <p>Northwind Coffee Roasters · Bergen, Norway</p>
        <p>Informational page · last reviewed July 2026</p>
        <nav aria-label="Policy index">
          <a href="/shipping">Shipping</a>
          <a href="/returns">Returns</a>
          <a href="/privacy">Privacy</a>
        </nav>
        <code>{path}</code>
      </footer>
    </div>
  );
}

function HomePage() {
  const reducedMotion = useMemo(
    () => new URLSearchParams(window.location.search).get("motion") === "reduce"
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const progressRef = useRef(0);
  const originRef = useRef(0);
  const pointerStart = useRef(null);
  const menuButton = useRef(null);
  const menuPanel = useRef(null);
  const [selected, setSelected] = useState(0);
  const [chapter, setChapter] = useState("intake");
  const [progress, setProgress] = useState(0);
  const [fps, setFps] = useState(60);
  const [menuOpen, setMenuOpen] = useState(false);
  const [brewStep, setBrewStep] = useState(0);
  const [cartStatus, setCartStatus] = useState("Batch tray is empty.");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);

  const selectedBean = BEANS[selected];

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: "#main",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const p = self.progress;
          progressRef.current = p;
          setProgress(Math.round(p * 100));
        },
      });
      [
        ["#hero", "intake"],
        ["#story", "roast"],
        ["#origin", "origin"],
        ["#reviews", "rest"],
        ["#brew-guide", "brew"],
        ["#subscribe", "brew"],
        ["#contact", "intake"],
      ].forEach(([trigger, nextChapter]) => {
        ScrollTrigger.create({
          trigger,
          start: "top center",
          end: "bottom center",
          onEnter: () => setChapter(nextChapter),
          onEnterBack: () => setChapter(nextChapter),
        });
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
          scrollTrigger: { trigger: ".beans", start: "top 80%", end: "center center", scrub: 0.45 },
        });
        gsap.fromTo(".review-line", { scaleX: 0 }, {
          scaleX: 1,
          transformOrigin: "left",
          ease: "none",
          scrollTrigger: { trigger: ".reviews-section", start: "top 75%", end: "bottom 75%", scrub: 0.4 },
        });
      }
    });
    return () => context.revert();
  }, [reducedMotion]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const panel = menuPanel.current;
    const focusable = [...panel.querySelectorAll("a, button")];
    focusable[0]?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        queueMicrotask(() => menuButton.current?.focus());
      }
      if (event.key === "Tab" && focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const choose = (next) => {
    const safe = (next + BEANS.length) % BEANS.length;
    originRef.current = safe;
    setSelected(safe);
  };

  const closeMenu = () => setMenuOpen(false);

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
    if (event.key === "End") choose(BEANS.length - 1);
  };

  const onPointerDown = (event) => {
    if (event.target.closest("button")) {
      pointerStart.current = null;
      return;
    }
    pointerStart.current = event.clientX;
  };

  const onPointerUp = (event) => {
    if (event.target.closest("button")) {
      pointerStart.current = null;
      return;
    }
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    if (Math.abs(delta) > 38) choose(selected + (delta < 0 ? 1 : -1));
    pointerStart.current = null;
  };

  const addToCart = (bean) => {
    setCartStatus(`${bean.name}, 250g, added to the batch tray.`);
  };

  const submitContact = (event) => {
    event.preventDefault();
    if (!email.includes("@")) {
      setFormError("Enter a valid email address so we can reply.");
      setSent(false);
      return;
    }
    setFormError("");
    setSent(true);
    setEmail("");
    setMessage("");
  };

  return (
    <div
      className="site-shell batch-journey"
      data-chapter={chapter}
      data-state={progress >= 75 ? "resolved" : chapter}
      data-progress={progress}
      data-selected={selectedBean.id}
    >
      <Suspense fallback={<div className="stage-poster" aria-hidden="true" />}>
        <RoastStage
          progressRef={progressRef}
          originRef={originRef}
          reducedMotion={reducedMotion}
          onFps={setFps}
        />
      </Suspense>

      <a className="skip-link" href="#main">Skip to the ledger</a>
      <header className="site-nav">
        <Wordmark />
        <button
          className="menu-trigger"
          ref={menuButton}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          Index <span>{menuOpen ? "×" : "+"}</span>
        </button>
        <nav id="primary-navigation" aria-label="Primary" data-open={menuOpen} ref={menuPanel}>
          <a className="nav-beans" href="#beans" onClick={closeMenu}>Beans</a>
          <a href="#brew-guide" onClick={closeMenu}>Brew Guide</a>
          <a href="#reviews" onClick={closeMenu}>Reviews</a>
          <a href="#subscribe" onClick={closeMenu}>Subscribe</a>
          <a href="#contact" onClick={closeMenu}>Contact</a>
        </nav>
      </header>

      <aside className="stage-telemetry" aria-label="Experience telemetry">
        <span>{String(CHAPTERS.indexOf(chapter) + 1).padStart(2, "0")} / 05</span>
        <span>{chapter}</span>
        <span>{progress}%</span>
        <span>{fps} fps</span>
      </aside>
      <aside className="batch-lineage" aria-label={`Batch 024-07, ${selectedBean.name}, ${chapter} chapter`}>
        <span>024—07</span>
        <b>{selectedBean.name}</b>
        <i>instrument / {chapter}</i>
      </aside>

      <main id="main">
        <section className="hero" id="hero">
          <div className="hero-media" aria-hidden="true" />
          <div className="hero-ledger">
            <p className="eyebrow">Bergen · Batch record 024—07</p>
            <h1>Small-batch<br />coffee, <em>roasted</em><br />the morning it ships.</h1>
            <p className="hero-deck">
              We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway,
              and ship them within hours. Freshness is not a slogan here; it is a timestamp on the bag.
            </p>
            <div className="hero-actions">
              <a className="text-link" href="#origin">Shop the beans <span>↓</span></a>
              <a className="text-link muted" href="#brew-guide">Learn to brew <span>↘</span></a>
            </div>
          </div>
          <div className="hero-stamp" aria-hidden="true"><span>Roasted</span><b>18·07</b><span>Bergen</span></div>
        </section>

        <section className="story chapter-panel" id="story">
          <Mark>I / Provenance</Mark>
          <div className="story-copy">
            <p className="display-quote">Small on purpose.<br />Precise by habit.</p>
            <p>
              Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still
              two roasters, one machine, and direct relationships with eleven farms across Ethiopia,
              Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the commodity price and
              publish every contract.
            </p>
          </div>
          <dl className="ledger-facts">
            <div><dt>Partner farms</dt><dd>11</dd></div>
            <div><dt>Commodity price paid</dt><dd>2.4×</dd></div>
            <div><dt>Max batch size</dt><dd>12kg</dd></div>
            <div><dt>Roast to shipment</dt><dd>&lt;24h</dd></div>
          </dl>
        </section>

        <section className="beans chapter-panel" id="origin">
          <span className="anchor-alias" id="beans" aria-hidden="true" />
          <div className="section-head">
            <Mark>II / This month’s beans</Mark>
            <h2>Turn the ledger.<br /><em>Find your frequency.</em></h2>
          </div>
          <div className="origin-workbench">
            <div className="origin-media ledger-media ledger-media-reveal" data-state="transformed" aria-live="polite">
              {Array.from({ length: 9 }, (_, i) => (
                <span
                  className="media-slice"
                  key={i}
                  style={{ "--slice": i, backgroundImage: `url(/assets/${selectedBean.id}.webp)` }}
                />
              ))}
              <p>{selectedBean.name} / {selectedBean.lot}</p>
            </div>
            <div className="origin-controls">
              <div
                className="origin-ring"
                data-state="settled"
                role="listbox"
                aria-label="Coffee origin"
                aria-activedescendant={`origin-${selectedBean.id}`}
                tabIndex="0"
                onKeyDown={onRingKeyDown}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
              >
                {BEANS.map((bean, index) => (
                  <button
                    className={`origin-option origin-${bean.id}`}
                    id={`origin-${bean.id}`}
                    role="option"
                    aria-selected={selected === index}
                    tabIndex="-1"
                    key={bean.id}
                    style={{ "--i": index, "--origin-color": bean.color }}
                    onClick={() => choose(index)}
                  >
                    <span>{bean.index}</span> {bean.id === "decaf" ? "Decaf" : bean.name.split(" ")[0]}
                  </button>
                ))}
                <div className="ring-core" aria-hidden="true">
                  <span>Profile</span>
                  <b>{selectedBean.development}</b>
                  <span>development</span>
                </div>
              </div>
              <article className="bean-dossier" data-bean={selectedBean.id}>
                <p>Lot {selectedBean.index} / 06</p>
                <h3>{selectedBean.name}</h3>
                <dl>
                  <div><dt>Process</dt><dd>{selectedBean.process}</dd></div>
                  <div><dt>Altitude</dt><dd>{selectedBean.altitude}</dd></div>
                  <div><dt>Roast</dt><dd>{selectedBean.roast}</dd></div>
                  <div><dt>Weight</dt><dd>250g</dd></div>
                </dl>
                <ul aria-label="Tasting notes">
                  {selectedBean.notes.map((note) => <li key={note}>{note}</li>)}
                </ul>
                <button className="add-to-cart" type="button" onClick={() => addToCart(selectedBean)}>
                  Add 250g <span>${selectedBean.price} —</span>
                </button>
              </article>
            </div>
          </div>
          <div className="product-index" aria-label="All coffees">
            {BEANS.map((bean) => (
              <article key={bean.id} data-bean={bean.id}>
                <span>{bean.index}</span><h3>{bean.name}</h3><p>{bean.notes.join(", ")}</p>
                <button type="button" onClick={() => addToCart(bean)}>Add ${bean.price}</button>
              </article>
            ))}
          </div>
          <p className="cart-status" role="status" aria-live="polite">{cartStatus}</p>
        </section>

        <section className="reviews-section chapter-panel" id="reviews">
          <Mark>III / Field notes</Mark>
          <div className="review-line" aria-hidden="true" />
          <h2>What subscribers say</h2>
          <div className="reviews">
            {REVIEWS.map((review, index) => (
              <blockquote className="review" key={review.name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>“{review.quote}”</p>
                <footer><strong>{review.name}</strong> — {review.role}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="brew-guide chapter-panel" id="brew-guide">
          <div className="section-head">
            <Mark>IV / Brew guide</Mark>
            <h2>Pour over in<br /><em>four movements.</em></h2>
          </div>
          <div className="brew-layout">
            <ol className="brew-score" data-state={brewStep === 3 ? "resolved" : "active"} aria-label="Pour-over steps">
              {STEPS.map((step, index) => (
                <li className="brew-step" key={step.n}>
                  <button
                    className={`brew-step-control brew-step-${step.n}`}
                    aria-pressed={brewStep === index}
                    onClick={() => setBrewStep(index)}
                  >
                    <span>{step.time}</span><b>{step.title}</b><small>{step.body}</small>
                  </button>
                </li>
              ))}
            </ol>
            <div className="brew-vessel" data-step={brewStep} aria-live="polite">
              <span className="water" />
              <span className="coffee" />
              <span className="drip one" />
              <span className="drip two" />
              <p><b>{brewStep + 1}</b> / 4<br /><span>{STEPS[brewStep].cue}</span></p>
            </div>
          </div>
        </section>

        <section className="subscribe chapter-panel" id="subscribe">
          <Mark>V / Monthly record</Mark>
          <h2>The Northwind<br />subscription.</h2>
          <p>
            Two 250g bags of our current favourites, every month, free shipping, pause any time.
            <strong> $29/month.</strong>
          </p>
          <a className="primary-action" href="#contact">Start a subscription <span>→</span></a>
        </section>

        <section className="contact chapter-panel" id="contact">
          <Mark>VI / Direct line</Mark>
          <div>
            <h2>Get in touch.</h2>
            <p>Questions, wholesale, or just coffee talk. We read everything and reply within a day.</p>
          </div>
          {sent ? (
            <div className="form-success" role="status">
              <span>Message logged / 024</span>
              <p>Thanks — we read everything and reply within a day.</p>
              <button type="button" onClick={() => setSent(false)}>Send another</button>
            </div>
          ) : (
            <form className="contact-form" noValidate onSubmit={submitContact}>
              <label htmlFor="email">Email</label>
              <input
                className="email-input"
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                aria-invalid={Boolean(formError)}
                aria-describedby={formError ? "form-error" : undefined}
                onChange={(event) => setEmail(event.target.value)}
              />
              {formError && <p className="form-error" id="form-error">{formError}</p>}
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows={4}
                placeholder="Questions, wholesale, or just coffee talk"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <button className="contact-submit primary-action" type="submit">Send message <span>→</span></button>
            </form>
          )}
        </section>
      </main>

      <footer className="site-footer" id="site-footer">
        <Wordmark />
        <p>© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
        <nav aria-label="Legal">
          <a href="#hero">Top</a>
          <a href="/shipping">Shipping</a>
          <a href="/returns">Returns</a>
          <a href="/privacy">Privacy</a>
        </nav>
        <p>Original generated imagery · procedural 3D · provenance on file</p>
      </footer>
    </div>
  );
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const policy = POLICIES[path];
  if (policy) return <PolicyPage policy={policy} path={path} />;
  return <HomePage />;
}
