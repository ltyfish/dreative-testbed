// Halfmoon — the Contour legging.
//
// The page is built as the garment's own measured document: every claim on it
// is either a number you can check against a centimetre rule, or the real
// cloth, lit, at a magnification where you can see the yarn. The buyer this is
// for has been lied to by a size chart before.
//
// Two things run the whole route. The centimetre rule, which appears in the
// masthead, sizes the chart, sizes the three lengths, and finally carries the
// three reviewers' heights. And the fabric, which is one captured knit surface
// shown in the selected dye at every magnification the page needs.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Check, Minus, Ruler, RotateCcw, Truck } from 'lucide-react'
import { FabricPanel, FabricTile, useFabricMaps, usePrefersReducedMotion } from './stage.jsx'

gsap.registerPlugin(ScrollTrigger)

const COLOURWAYS = [
  { id: 'slate', name: 'Slate', price: 88, stock: 'in', hex: '#5F6B77', note: 'The first dye lot, and still the one we make most of.' },
  { id: 'clay', name: 'Burnt Clay', price: 88, stock: 'in', hex: '#A85C39', note: 'A warm red-brown that holds its depth after washing.' },
  { id: 'moss', name: 'Deep Moss', price: 88, stock: 'in', hex: '#53663F', note: 'Dark enough to read as neutral in most light.' },
  { id: 'black', name: 'True Black', price: 84, stock: 'in', hex: '#2A2724', note: 'A single-bath black, which is why it costs four dollars less.' },
  { id: 'oat', name: 'Oat', price: 88, stock: 'out', hex: '#DCCAAB', note: 'The lightest dye we will make in this cloth. Back when the mill runs it again.' },
  { id: 'plum', name: 'Dried Plum', price: 92, stock: 'out', hex: '#75485C', note: 'A slow, expensive dye. Sold out.' },
]

// Waist and hip are the garment laid flat and doubled; inseam is the 26 inch length.
const SIZES = [
  { size: 'XXS', waist: 58, hip: 80, inseam: 66 },
  { size: 'XS', waist: 63, hip: 85, inseam: 66 },
  { size: 'S', waist: 68, hip: 90, inseam: 66 },
  { size: 'M', waist: 74, hip: 96, inseam: 66 },
  { size: 'L', waist: 81, hip: 103, inseam: 67 },
  { size: 'XL', waist: 89, hip: 111, inseam: 67 },
  { size: '2XL', waist: 98, hip: 120, inseam: 68 },
  { size: '3XL', waist: 108, hip: 130, inseam: 68 },
]

const INSEAMS = [
  { id: 'short', label: '24 inch, short', offered: 'XXS to XL', cm: 61, from: 'XXS', to: 'XL' },
  { id: 'regular', label: '26 inch, regular', offered: 'XXS to 3XL', cm: 66, from: 'XXS', to: '3XL' },
  { id: 'tall', label: '28 inch, tall', offered: 'S to 3XL', cm: 71, from: 'S', to: '3XL' },
]

const FABRIC = [
  '78% recycled nylon, 22% elastane, knitted in a single mill in Portugal.',
  '240gsm, heavier than most leggings sold at this price, which is where the opacity comes from.',
  'Opacity tested at full squat under studio light by nine wearers across the size range. No sheerness recorded at any size.',
  'Four-way stretch, so the fabric recovers across the leg as well as along it.',
  'A single diamond gusset, flatlocked, so there is no seam at the crotch to rub or fail.',
]

const REVIEWS = [
  {
    quote:
      'The waistband is the first one I have owned that stays where I put it through a full session. I stopped thinking about it, which is the whole point.',
    name: 'Renata K.',
    fit: '172cm, usually a M, bought M regular',
    height: 172,
  },
  {
    quote:
      'I ordered the tall inseam expecting the usual compromise and it actually reaches my ankle. The fabric is thicker than I expected from the photos.',
    name: 'Junho P.',
    fit: '181cm, usually a L, bought L tall',
    height: 181,
  },
  {
    quote:
      'Sized down after the fit finder told me to and it was right. They are firm at first and settle after an hour.',
    name: 'Amara O.',
    fit: '158cm, usually an S, bought XS short',
    height: 158,
  },
]

const RETURNS =
  'Sixty days to return anything, return shipping is free, and we accept them worn and washed. If they did not work out we would rather have them back than have you keep them in a drawer.'

// The fit finder. Below 165cm recommends the short inseam, above 176cm the tall
// one. It sizes down one step only when the wearer reports being between sizes.
function recommend(height, usualSize, between) {
  const h = Number(height)
  if (!h || !usualSize) return null
  if (h < 140 || h > 210) return { unsure: true }
  const i = SIZES.findIndex((s) => s.size === usualSize)
  if (i < 0) return { unsure: true }
  const size = between && i > 0 ? SIZES[i - 1].size : usualSize
  const inseam = h < 165 ? INSEAMS[0] : h > 176 ? INSEAMS[2] : INSEAMS[1]
  return { size, inseam }
}

const sizeIndex = (s) => SIZES.findIndex((x) => x.size === s)
const offersSize = (ins, size) =>
  !size || (sizeIndex(size) >= sizeIndex(ins.from) && sizeIndex(size) <= sizeIndex(ins.to))

// The rule everything on this page is drawn against. 140cm of it, which is the
// widest hip in the chart plus a margin, so a bar's length is honestly its
// measurement and not a percentage of a box.
const RULE_CM = 140
const pct = (cm) => (cm / RULE_CM) * 100

function Rule({ every = 10, labelled = 20 }) {
  const ticks = []
  for (let cm = 0; cm <= RULE_CM; cm += every) {
    ticks.push(
      <span
        key={cm}
        className={'tick' + (cm % labelled === 0 ? ' tick--major' : '')}
        style={{ left: pct(cm) + '%' }}
      >
        {cm % labelled === 0 ? <i>{cm}</i> : null}
      </span>,
    )
  }
  return (
    <div className="rule" aria-hidden="true">
      {ticks}
    </div>
  )
}

export default function App() {
  const [colourway, setColourway] = useState('')
  const [size, setSize] = useState('')
  const [inseam, setInseam] = useState('')
  const [bag, setBag] = useState(null)
  const [height, setHeight] = useState('')
  const [usualSize, setUsualSize] = useState('')
  const [between, setBetween] = useState(false)

  const chosen = COLOURWAYS.find((c) => c.id === colourway)
  const canAdd = Boolean(chosen && chosen.stock === 'in' && size && inseam)
  const suggestion = recommend(height, usualSize, between)

  function addToBag(e) {
    e.preventDefault()
    if (!canAdd) return
    setBag({
      colourway: chosen.name,
      size,
      inseam: INSEAMS.find((i) => i.id === inseam).label,
      price: chosen.price,
    })
  }

  // --- presentation state -------------------------------------------------
  const { maps, failed } = useFabricMaps()
  const reduced = usePrefersReducedMotion()
  const dye = chosen ? chosen.hex : '#5F6B77'
  const dyeName = chosen ? chosen.name : 'Slate'

  // The opacity test's single authored value. Scroll drives it; the range input
  // drives it too, so the mechanism is reachable by keyboard and by thumb.
  const [test, setTest] = useState(0)
  const testRef = useRef(null)
  const peakRef = useRef(null)
  const draggingRef = useRef(false)

  // A length the label does not offer is not selectable, so the bag can never
  // name a combination that cannot be made.
  useEffect(() => {
    if (inseam && size) {
      const ins = INSEAMS.find((i) => i.id === inseam)
      if (ins && !offersSize(ins, size)) setInseam('')
    }
  }, [size, inseam])

  // Scroll ownership: one trigger, one progress value, reverted on unmount.
  useLayoutEffect(() => {
    if (reduced || !peakRef.current) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: peakRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.4,
        onUpdate: (self) => {
          if (draggingRef.current) return
          setTest(gsap.utils.clamp(0, 1, (self.progress - 0.06) / 0.78))
        },
      })
    }, peakRef)
    return () => ctx.revert()
  }, [reduced])

  // The regional entrance grammar. One observer, one class, the whole route.
  useEffect(() => {
    const els = document.querySelectorAll('[data-enter]')
    if (reduced) {
      els.forEach((el) => el.setAttribute('data-enter', 'in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          // Measured against the top of the viewport, so a reveal cannot resolve
          // behind a reader who has already gone past it.
          if (e.isIntersecting) {
            e.target.setAttribute('data-enter', 'in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [reduced])

  const stretch = test
  const back = gsap.utils.clamp(0, 1, (test - 0.18) / 0.72)
  const testStage =
    test < 0.28
      ? { k: 'Relaxed', t: 'The cloth off the body. 240gsm, which is where all of this starts.' }
      : test < 0.72
        ? { k: 'Mid stretch', t: 'The courses open across the leg. The wales draw in along it.' }
        : { k: 'Full squat', t: 'Lamp behind at full. This is the state nine wearers were photographed in.' }

  const recommendedRow = suggestion && !suggestion.unsure ? suggestion.size : null

  return (
    <div className="page" style={{ '--dye': dye }}>
      <a className="skip" href="#buy">
        Skip to choosing a pair
      </a>

      <Header colourway={chosen} size={size} inseam={inseam} dyeName={dyeName} />

      {/* 1 — masthead ---------------------------------------------------- */}
      <section className="mast" aria-labelledby="mast-h">
        <div className="mast__cloth">
          {maps && !failed ? (
            <FabricPanel maps={maps} dye={dye} scale={3.2} light={[0.3, 0.68]} live={!reduced} className="cv" />
          ) : (
            <div className="cv cv--fallback" style={{ background: dye }} />
          )}
          <figcaption className="mast__cap">
            The cloth, in {dyeName}. Lit live, at about four times life size.
          </figcaption>
        </div>

        <div className="mast__text">
          <p className="brand">Halfmoon</p>
          <h1 id="mast-h">
            The Contour
            <br />
            legging
          </h1>
          <p className="deck">
            One garment. Six dye lots, three lengths, eight sizes, and every measurement on this page
            given in centimetres so you can check it against a pair you already own.
          </p>
          <p className="price">
            <b>$84–92</b> <span>depending on the dye</span>
          </p>
          <nav className="jump" aria-label="On this page">
            <a href="#test">The opacity test</a>
            <a href="#measure">The measure</a>
            <a href="#fit">The fit finder</a>
            <a href="#buy">Choose a pair</a>
          </nav>
        </div>

        <div className="mast__rule">
          <Rule />
          <p className="rule__legend">
            <Ruler size={13} aria-hidden="true" /> centimetres. This rule runs the length of the page.
          </p>
        </div>
      </section>

      {/* 2 — the opacity test (peak) ------------------------------------- */}
      <section className="peak" id="test" ref={peakRef} aria-labelledby="peak-h">
        <div className="peak__sticky">
          <div className="peak__frame">
            <div
              className="peak__lamp"
              style={{ opacity: back, transform: `scale(${1 + back * 0.14})` }}
              aria-hidden="true"
            />
            <div className="peak__cloth">
              {maps && !failed ? (
                <FabricPanel
                  maps={maps}
                  dye={dye}
                  scale={1.15}
                  stretch={stretch}
                  back={back}
                  light={[0.36, 0.66]}
                  className="cv"
                />
              ) : (
                <div className="cv cv--fallback" style={{ background: dye }} />
              )}
            </div>
          </div>

          <div className="peak__panel">
            <p className="eyebrow">The test people ask about first</p>
            <h2 id="peak-h">
              Is it <em>sheer</em>?
            </h2>
            <p className="peak__stage">
              <b>{testStage.k}</b> {testStage.t}
            </p>

            <dl className="readout">
              <div>
                <dt>Stretch</dt>
                <dd>{Math.round(stretch * 100)}%</dd>
              </div>
              <div>
                <dt>Lamp behind</dt>
                <dd>{Math.round(back * 100)}%</dd>
              </div>
              <div>
                <dt>Through the cloth</dt>
                <dd className="readout__result">none recorded</dd>
              </div>
            </dl>

            <label className="scrub">
              <span>Stretch the cloth</span>
              <input
                ref={testRef}
                type="range"
                min="0"
                max="100"
                value={Math.round(test * 100)}
                onChange={(e) => setTest(Number(e.target.value) / 100)}
                onPointerDown={() => (draggingRef.current = true)}
                onPointerUp={() => (draggingRef.current = false)}
                onFocus={() => (draggingRef.current = true)}
                onBlur={() => (draggingRef.current = false)}
                aria-describedby="peak-claim"
              />
            </label>

            <p className="peak__claim" id="peak-claim">
              {FABRIC[2]}
            </p>
          </div>
        </div>
      </section>

      {/* 3 — the dye lots ------------------------------------------------- */}
      <section className="dyes" aria-labelledby="dyes-h" data-enter="out">
        <header className="sec">
          <p className="eyebrow">Step one of three</p>
          <h2 id="dyes-h">Six dye lots</h2>
          <p className="sec__deck">
            The same cloth every time. Two of them are sold out and we have left them here rather than
            hiding them, because the dye is the reason the price moves.
          </p>
        </header>

        <ul className="swatches" role="radiogroup" aria-label="Colourway">
          {COLOURWAYS.map((c) => {
            const out = c.stock === 'out'
            const sel = colourway === c.id
            return (
              <li key={c.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  disabled={out}
                  className={'swatch' + (sel ? ' is-selected' : '') + (out ? ' is-out' : '')}
                  onClick={() => setColourway(c.id)}
                >
                  <span className="swatch__cloth">
                    {maps && !failed ? (
                      <FabricTile maps={maps} dye={c.hex} scale={1.9} light={[0.32, 0.72]} />
                    ) : (
                      <span className="cv cv--fallback" style={{ background: c.hex }} />
                    )}
                    {out ? <span className="swatch__veil" /> : null}
                  </span>
                  <span className="swatch__meta">
                    <b>{c.name}</b>
                    <span className="swatch__price">${c.price}</span>
                    <span className={'swatch__stock' + (out ? ' is-out' : '')}>
                      {out ? (
                        <>
                          <Minus size={12} aria-hidden="true" /> sold out
                        </>
                      ) : sel ? (
                        <>
                          <Check size={12} aria-hidden="true" /> chosen
                        </>
                      ) : (
                        'in stock'
                      )}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <p className="swatches__note" aria-live="polite">
          {chosen ? (
            <>
              <b>{chosen.name}, ${chosen.price}.</b> {chosen.note}
            </>
          ) : (
            <>Pick a dye. It sets the colour of the cloth everywhere else on this page.</>
          )}
        </p>
      </section>

      {/* 4 — the measure -------------------------------------------------- */}
      <section className="measure" id="measure" aria-labelledby="measure-h" data-enter="out">
        <header className="sec">
          <p className="eyebrow">Step two of three</p>
          <h2 id="measure-h">The measure</h2>
          <p className="sec__deck">
            Every bar below is drawn at its real length against the same centimetre rule. Waist and hip
            are the garment laid flat and doubled; the inseam column is the 26 inch length. Lay a pair
            you already own on the floor and compare.
          </p>
        </header>

        <div className="measure__body">
          <FitFinder
            height={height}
            setHeight={setHeight}
            usualSize={usualSize}
            setUsualSize={setUsualSize}
            between={between}
            setBetween={setBetween}
            suggestion={suggestion}
            onUse={() => {
              if (suggestion && !suggestion.unsure) {
                setSize(suggestion.size)
                setInseam(suggestion.inseam.id)
              }
            }}
          />

          <div className="chart" role="radiogroup" aria-label="Size">
            <div className="chart__scale">
              <Rule />
            </div>
            <ol className="chart__rows">
              {SIZES.map((s) => {
                const sel = size === s.size
                const rec = recommendedRow === s.size
                return (
                  <li key={s.size}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      className={'row' + (sel ? ' is-selected' : '') + (rec ? ' is-rec' : '')}
                      onClick={() => setSize(s.size)}
                      aria-label={`Size ${s.size}, waist ${s.waist} centimetres, hip ${s.hip} centimetres, inseam ${s.inseam} centimetres`}
                    >
                      <span className="row__size">{s.size}</span>
                      <span className="row__bars">
                        <span className="bar bar--waist" style={{ width: pct(s.waist) + '%' }}>
                          <i>
                            waist <b>{s.waist}</b>
                          </i>
                        </span>
                        <span className="bar bar--hip" style={{ width: pct(s.hip) + '%' }}>
                          <i>
                            hip <b>{s.hip}</b>
                          </i>
                        </span>
                      </span>
                      <span className="row__inseam">
                        inseam <b>{s.inseam}</b>cm
                      </span>
                      {rec ? <span className="row__flag">the fit finder sent you here</span> : null}
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* 5 — the three lengths -------------------------------------------- */}
      <section className="lengths" aria-labelledby="len-h" data-enter="out">
        <header className="sec">
          <p className="eyebrow">Step three of three</p>
          <h2 id="len-h">Three lengths</h2>
          <p className="sec__deck">
            Drawn against the same rule, turned on its side. Not every length is cut in every size,
            and we would rather say so here than at checkout.
          </p>
        </header>

        <ul className="len" role="radiogroup" aria-label="Inseam">
          {INSEAMS.map((i) => {
            const ok = offersSize(i, size)
            const sel = inseam === i.id
            return (
              <li key={i.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  disabled={!ok}
                  className={'len__opt' + (sel ? ' is-selected' : '') + (!ok ? ' is-off' : '')}
                  onClick={() => setInseam(i.id)}
                >
                  <span className="len__draw" aria-hidden="true">
                    <span className="len__line" style={{ height: (i.cm / 75) * 100 + '%' }}>
                      <i />
                    </span>
                  </span>
                  <span className="len__meta">
                    <b>{i.label}</b>
                    <span className="len__cm">{i.cm}cm on a size M</span>
                    <span className="len__offered">
                      offered {i.offered}
                      {!ok ? <em> — not cut in {size}</em> : null}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* 6 — the build ---------------------------------------------------- */}
      <section className="build" aria-labelledby="build-h" data-enter="out">
        <header className="sec">
          <p className="eyebrow">What it is made of</p>
          <h2 id="build-h">The cloth, closer</h2>
          <p className="sec__deck">
            The same surface as the test above, at three magnifications. Nothing here is a stock photo
            of somebody else's legging.
          </p>
        </header>

        <div className="build__grid">
          <figure className="mag mag--near">
            <span className="mag__cloth">
              {maps && !failed ? (
                <FabricTile maps={maps} dye={dye} scale={0.6} light={[0.33, 0.71]} />
              ) : (
                <span className="cv cv--fallback" style={{ background: dye }} />
              )}
              <span className="mag__label">≈ 12×</span>
            </span>
            <figcaption>
              <h3>The yarn</h3>
              <p>{FABRIC[0]}</p>
              <p className="mag__second">{FABRIC[3]}</p>
            </figcaption>
          </figure>

          <figure className="mag mag--mid">
            <span className="mag__cloth">
              {maps && !failed ? (
                <FabricTile maps={maps} dye={dye} scale={2.4} light={[0.33, 0.71]} />
              ) : (
                <span className="cv cv--fallback" style={{ background: dye }} />
              )}
              <span className="mag__label">≈ 4×</span>
            </span>
            <figcaption>
              <h3>The weight</h3>
              <p>{FABRIC[1]}</p>
            </figcaption>
          </figure>

          <figure className="mag mag--gusset">
            <span className="mag__cloth">
              {maps && !failed ? (
                <FabricTile maps={maps} dye={dye} scale={1.3} light={[0.33, 0.71]} />
              ) : (
                <span className="cv cv--fallback" style={{ background: dye }} />
              )}
              <GussetDiagram />
            </span>
            <figcaption>
              <h3>The gusset</h3>
              <p>{FABRIC[4]}</p>
              <p className="mag__second mag__note">
                Drawn over the real cloth — a construction diagram, not a photograph of the seam.
              </p>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 7 — worn by ------------------------------------------------------ */}
      <section className="worn" aria-labelledby="worn-h" data-enter="out">
        <header className="sec">
          <p className="eyebrow">Three people, on the same rule</p>
          <h2 id="worn-h">Worn by</h2>
          <p className="sec__deck">
            Each review is placed at the height its writer gave us, so you can find the one nearest
            your own before you read it.
          </p>
        </header>

        <div className="heights">
          <div className="heights__rule" aria-hidden="true">
            {[150, 160, 170, 180, 190].map((cm) => (
              <span key={cm} className="heights__tick" style={{ left: ((cm - 145) / 50) * 100 + '%' }}>
                <i>{cm}</i>
              </span>
            ))}
            {[...REVIEWS].map((r) => (
              <span
                key={r.name}
                className="heights__mark"
                style={{ left: ((r.height - 145) / 50) * 100 + '%' }}
              >
                <b>{r.height}</b>
                <em>{r.name.split(' ')[0]}</em>
              </span>
            ))}
          </div>
          <p className="heights__cap">
            The three of them on the same rule, in centimetres.
          </p>
        </div>

        <ol className="worn__list">
          {[...REVIEWS]
            .sort((a, b) => a.height - b.height)
            .map((r) => (
              <li key={r.name} className="review">
                <p className="review__fit">
                  <span className="review__h">{r.height}cm</span>
                  {r.fit}
                </p>
                <blockquote>{r.quote}</blockquote>
                <p className="review__name">{r.name}</p>
              </li>
            ))}
        </ol>
      </section>

      {/* 8 — decide ------------------------------------------------------- */}
      <section className="buy" id="buy" aria-labelledby="buy-h" data-enter="out">
        <div className="buy__cloth" aria-hidden="true">
          {maps && !failed ? (
            <FabricPanel maps={maps} dye={dye} scale={2.3} light={[0.36, 0.66]} grain={0.025} className="cv" />
          ) : (
            <div className="cv cv--fallback" style={{ background: dye }} />
          )}
        </div>

        <div className="buy__inner">
          <header className="sec sec--onCloth">
            <p className="eyebrow">Everything you chose</p>
            <h2 id="buy-h">Your Contour</h2>
            <p className="buy__deck">
              The cloth behind this is the dye you picked, lit the same way as the test.
              {chosen ? ` This is ${chosen.name}.` : ' Nothing picked yet, so it is showing Slate.'}
            </p>
          </header>

          <form onSubmit={addToBag} className="buy__form">
            <ol className="picked">
              <li className={colourway ? 'is-done' : ''}>
                <span className="picked__k">Dye</span>
                <span className="picked__v">{chosen ? `${chosen.name}, $${chosen.price}` : 'not chosen'}</span>
                {!colourway ? <a href="#dyes-h">choose</a> : null}
              </li>
              <li className={size ? 'is-done' : ''}>
                <span className="picked__k">Size</span>
                <span className="picked__v">
                  {size
                    ? `${size} — waist ${SIZES[sizeIndex(size)].waist}cm, hip ${SIZES[sizeIndex(size)].hip}cm`
                    : 'not chosen'}
                </span>
                {!size ? <a href="#measure">choose</a> : null}
              </li>
              <li className={inseam ? 'is-done' : ''}>
                <span className="picked__k">Length</span>
                <span className="picked__v">
                  {inseam ? INSEAMS.find((i) => i.id === inseam).label : 'not chosen'}
                </span>
                {!inseam ? <a href="#len-h">choose</a> : null}
              </li>
            </ol>

            <button type="submit" className="add" disabled={!canAdd}>
              {canAdd ? `Add to bag — $${chosen.price}` : 'Add to bag'}
            </button>
            {!canAdd && chosen && chosen.stock === 'out' ? (
              <p className="add__why">{chosen.name} is sold out. Pick another dye.</p>
            ) : !canAdd ? (
              <p className="add__why">Choose a dye, a size and a length first.</p>
            ) : null}
          </form>

          <p className="bag" aria-live="polite">
            {bag ? (
              <>
                In your bag: the Contour legging in {bag.colourway}, size {bag.size}, {bag.inseam},{' '}
                {bag.price} dollars.
              </>
            ) : null}
          </p>
        </div>
      </section>

      {/* returns ----------------------------------------------------------- */}
      <section className="returns" aria-labelledby="ret-h" data-enter="out">
        <h2 id="ret-h" className="sr-only">
          Returns
        </h2>
        <p className="returns__body">{RETURNS}</p>
        <ul className="returns__facts">
          <li>
            <RotateCcw size={16} aria-hidden="true" />
            <b>60 days</b> to send them back
          </li>
          <li>
            <Truck size={16} aria-hidden="true" />
            <b>Free</b> return shipping
          </li>
          <li>
            <Check size={16} aria-hidden="true" />
            <b>Worn and washed</b> returns accepted
          </li>
        </ul>
      </section>

      <footer className="foot">
        <p className="foot__mark">Halfmoon</p>
        <p>
          The cloth on this page is a photographic capture of a technical sportswear jersey, released
          CC0 by{' '}
          <a href="https://ambientcg.com/view?id=Fabric075" rel="noreferrer">
            ambientCG (Fabric075)
          </a>
          , relit and dyed live in the browser. Type is Cabinet Grotesk, Switzer and Erode.
        </p>
      </footer>
    </div>
  )
}

function Header({ colourway, size, inseam, dyeName }) {
  const parts = [
    colourway ? colourway.name : null,
    size || null,
    inseam ? INSEAMS.find((i) => i.id === inseam).label.split(',')[0] : null,
  ]
  const done = parts.filter(Boolean).length
  return (
    <header className="topbar">
      <a className="topbar__mark" href="#top">
        Halfmoon
      </a>
      <p className="topbar__product">The Contour legging</p>
      <div className="topbar__state">
        <span className="topbar__dots" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <i key={i} className={i < done ? 'on' : ''} />
          ))}
        </span>
        <span className="topbar__parts">
          {done ? parts.filter(Boolean).join(' · ') : `${dyeName} — nothing chosen yet`}
        </span>
        <a className="topbar__cta" href="#buy">
          {colourway ? `$${colourway.price}` : 'Choose'}
        </a>
      </div>
    </header>
  )
}

function FitFinder({ height, setHeight, usualSize, setUsualSize, between, setBetween, suggestion, onUse }) {
  return (
    <div className="fit" id="fit">
      <h3>The fit finder</h3>
      <p className="fit__intro">
        Two answers. It sizes down only if you tell us you are between sizes, and it says so when it
        does not know.
      </p>

      <div className="fit__fields">
        <label className="field">
          <span>Your height in cm</span>
          <input
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 168"
          />
        </label>
        <label className="field">
          <span>The size you usually wear</span>
          <select value={usualSize} onChange={(e) => setUsualSize(e.target.value)}>
            <option value="">choose</option>
            {SIZES.map((s) => (
              <option key={s.size} value={s.size}>
                {s.size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="check">
        <input type="checkbox" checked={between} onChange={(e) => setBetween(e.target.checked)} />
        <span>I am usually between sizes</span>
      </label>

      <div className="fit__out" aria-live="polite">
        {suggestion && suggestion.unsure && (
          <p className="fit__unsure">
            We are not confident enough to recommend a size from that. The chart is above.
          </p>
        )}
        {suggestion && !suggestion.unsure && (
          <>
            <p className="fit__say">
              We would send you the <b>{suggestion.size}</b> in the <b>{suggestion.inseam.label}</b>.
            </p>
            <button type="button" className="fit__use" onClick={onUse}>
              Use this
            </button>
          </>
        )}
        {!suggestion && <p className="fit__idle">Answer both and we will point at a row.</p>}
      </div>
    </div>
  )
}

// Notation, drawn over the real cloth: the diamond gusset and its flatlock, in
// the language of a pattern sheet rather than a rendering of one.
function GussetDiagram() {
  return (
    <svg className="gusset" viewBox="0 0 200 200" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.1" vectorEffect="non-scaling-stroke">
        <path d="M100 62 L138 100 L100 138 L62 100 Z" />
        <path d="M100 62 L138 100 L100 138 L62 100 Z" strokeDasharray="3 4" transform="scale(1.13) translate(-11.5 -11.5)" />
        <path d="M62 100 L20 148 M138 100 L180 148" />
        <path d="M100 62 L100 24" strokeDasharray="2 5" />
      </g>
      <g className="gusset__note" fill="currentColor">
        <text x="100" y="104" textAnchor="middle">diamond</text>
        <text x="100" y="118" textAnchor="middle">one piece</text>
        <text x="150" y="46">flatlock, no crotch seam</text>
      </g>
      <path d="M146 50 L120 74" stroke="currentColor" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
