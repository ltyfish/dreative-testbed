import { useMemo } from 'react'
import { PRODUCTS } from './data.js'
import { profile } from './profiles.js'

// Nine pieces at true scale against a millimetre rule.
//
// Every outline is generated from the piece's own stated dimensions and drawn
// at one shared px-per-mm factor, so the row is honest: a 275mm dinner plate is
// genuinely three and a half times the width of a 78mm mug here. This is the
// question a photograph of a pot on a plain ground cannot answer and the one
// every buyer asks first.

const TALLEST = 280

export default function TrueScale({ selected, onSelect }) {
  const order = useMemo(() => [...PRODUCTS].sort((a, b) => b.h - a.h), [])

  return (
    <section className="scale" id="scale" aria-labelledby="scale-h">
      <div className="wrap scale__head" data-enter>
        <h2 className="h2" id="scale-h">At true scale</h2>
        <p className="lede">
          Drawn from the measurements, not from the photographs. Everything below
          is to the same rule, so you can see what 275mm across and 280mm tall
          actually mean before you decide. Pick one to jump to it.
        </p>
      </div>

      <div className="scale__rail" role="group" aria-label="The nine pieces drawn to scale">
        <div className="scale__floor">
          {order.map((p) => {
            const { body, handle } = profile(p)
            const on = selected === p.id
            return (
              <button
                key={p.id}
                type="button"
                className={'scale__piece' + (on ? ' is-on' : '')}
                onClick={() => onSelect(p.id)}
                aria-pressed={on}
                style={{
                  '--mmw': p.w,
                  '--mmh': p.h,
                }}
              >
                <span className="scale__draw" style={{ '--tall': TALLEST }}>
                  <svg
                    viewBox={`0 0 ${p.w} ${p.h}`}
                    width={`calc(${p.w} * var(--ppm))`}
                    height={`calc(${p.h} * var(--ppm))`}
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path className="scale__body" d={body} />
                    {handle && <path className="scale__handle" d={handle} />}
                  </svg>
                </span>
                <span className="scale__tag">
                  <span className="scale__name">{p.name}</span>
                  <span className="mono scale__mm">{p.h}&#8202;&times;&#8202;{p.w}<span className="scale__unit">mm</span></span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="scale__rule" aria-hidden="true">
          <span className="scale__rulebar" />
          <span className="mono scale__rulelab">100&#8202;mm &mdash; everything above is drawn to this</span>
        </div>
      </div>
    </section>
  )
}
