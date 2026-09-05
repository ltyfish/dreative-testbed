import { useState } from 'react'
import { LAYERS } from '../data.js'

const TOTAL = LAYERS.reduce((s, l) => s + l.mm, 0) // 3.8mm

export default function Layers() {
  const [open, setOpen] = useState(1)
  const layer = LAYERS[open]

  // Where the selected layer sits through the stack, front face to back face.
  const before = LAYERS.slice(0, open).reduce((s, l) => s + l.mm, 0)
  const planeTop = (before / TOTAL) * 100
  const planeHeight = (layer.mm / TOTAL) * 100

  return (
    <section className="layers" id="layers" aria-labelledby="layers-title">
      <header className="layers-head">
        <p className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          Built up in four layers, front to back
        </p>
        <h2 className="section-title" id="layers-title">
          Three point eight millimetres,
          <br />
          in four pieces
        </h2>
      </header>

      <div className="layers-body">
        <div className="layers-left">
        <div className="layers-section-figure">
          <p className="layers-scale-cap">
            <span>Front</span>
            <span className="layers-scale-total">{TOTAL.toFixed(1)}mm</span>
            <span>Back</span>
          </p>
          <ol className="layers-stack" role="list">
            {LAYERS.map((l, i) => (
              <li
                key={l.id}
                className="layers-band"
                style={{ '--band': l.mm / TOTAL }}
                data-open={i === open ? 'true' : 'false'}
              >
                <button
                  type="button"
                  className="layers-band-btn"
                  aria-expanded={i === open}
                  aria-controls="layer-note"
                  onClick={() => setOpen(i)}
                >
                  <span className="layers-band-rule" aria-hidden="true" />
                  <span className="layers-band-name">{l.name}</span>
                  <span className="layers-band-mm">{l.thickness}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="layers-scale-note">Bands are drawn at true relative thickness.</p>
        </div>

        <div className="layers-note-wrap">
          <p className="layers-note-index">
            {String(open + 1).padStart(2, '0')} <span>of four</span>
          </p>
          <h3 className="layers-note-name">{layer.name}</h3>
          <p className="layers-note-mm">{layer.thickness}</p>
          <p className="layers-note" id="layer-note">
            {layer.note}
          </p>
        </div>
        </div>

        <figure className="layers-figure">
          <div className="layers-plate-wrap">
            <img
              className="layers-plate"
              src="/media/plate-macro-2200.jpg"
              srcSet="/media/plate-macro-1100.jpg 1100w, /media/plate-macro-2200.jpg 2200w"
              sizes="(max-width: 860px) 92vw, 46vw"
              width="2200"
              height="1462"
              alt="Bridges, wheels and jewelled bearings of a mechanical movement in close-up."
              loading="lazy"
              decoding="async"
              style={{ transform: `scale(${1.02 + open * 0.045})` }}
            />
            <span
              className="layers-plane"
              aria-hidden="true"
              style={{ top: `${planeTop}%`, height: `${planeHeight}%` }}
            >
              <span className="layers-plane-tag">
                {layer.name} · {layer.thickness}
              </span>
            </span>
          </div>
          <figcaption>
            The plate, in close-up. The band marks where {layer.name.toLowerCase()} sits through the
            thickness.
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
