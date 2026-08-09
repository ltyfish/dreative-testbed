import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Plate from './Plate.jsx'

const SECTIONS = [
  {
    id: 'the-shape',
    heading: 'The shape of a working day',
    paragraphs: [
      'The lighthouse at Ardnamurchan was automated in 1988. For the ninety-nine years before that, three men lived on the point in rotation, and one of them was always awake. The logbooks they kept are dull in the way that only genuinely serious documents are dull: wind, visibility, the hour the light was lit, the hour it was put out. Nothing about weather as an experience. Nothing about the sea except as a condition affecting the work.',
      'I went looking for those logbooks expecting loneliness and found administration. Forty-one volumes, and in all of them perhaps a dozen sentences that could be called personal. A keeper named Angus MacBride recorded, on 3 February 1934, that the lens had been cleaned twice because the first cleaning was unsatisfactory. He did not record that his wife had died in Oban the week before. That fact comes from the parish register, not from him.',
    ],
  },
  {
    id: 'instrument',
    heading: 'An instrument for not thinking',
    paragraphs: [
      'It would be sentimental to read the silence as stoicism. The more likely explanation is procedural: the log was an instrument of the Northern Lighthouse Board, subject to inspection, and a keeper who filled it with feeling was a keeper who had misunderstood his job. The form produced the restraint.',
      'But the form also produced something else, and this is the part I keep returning to. Because the logbook admitted only observable facts, it became, accidentally, a nearly perfect climate record. Ninety-nine years of daily visibility readings from a fixed point on the Atlantic edge of Scotland, taken by men with no theory to defend and no result they preferred. Meteorologists have been mining Ardnamurchan since the 1970s precisely because MacBride and his colleagues were not interested in the weather.',
    ],
  },
  {
    id: 'the-transfer',
    heading: 'What automation actually removed',
    paragraphs: [
      'When the light was automated, the readings stopped. Not because a machine could not take them, but because nobody specified that a machine should. The sensor package installed in 1988 monitored the lamp, the battery, and the door. It did not look out.',
      'This is the ordinary shape of automation and it is worth naming plainly. The task was replaced. The by-product of the task, which had turned out to be more valuable than the task, was not replaced, because nobody had ever written it down as a requirement. It existed only as a consequence of a human being physically present and obliged to fill in a column.',
      'A ten-year gap opens in the record at that point. It closes in 1998, when an automatic weather station was finally installed a hundred metres from the tower, at a cost that would have paid a keeper for a decade.',
    ],
  },
  {
    id: 'coda',
    heading: 'Coda',
    paragraphs: [
      'MacBride retired in 1951 and died in Fort William in 1963. His last entry is characteristically complete: wind south-westerly, force four, visibility good, light lit at 16:42. Below it, in a different hand, the next keeper begins.',
      'The lens he cleaned twice is still in the tower. It is no longer connected to anything.',
    ],
  },
]

// The rail annotation for each entry: the span of years the section is standing
// in, written the way the column itself would have been kept.
const MARGINALIA = {
  'the-shape': { span: '1889–1988', note: 'Kept by hand' },
  instrument: { span: '1934', note: 'The form, and what it excluded' },
  'the-transfer': { span: '1988–1998', note: 'Nothing entered' },
  coda: { span: '1951–', note: 'A different hand' },
}

const NOTES = [
  { n: 1, text: 'Northern Lighthouse Board, Station Logbooks: Ardnamurchan, vols. 1–41, National Records of Scotland, LH/2/44.' },
  { n: 2, text: 'Parish register, Kilmore and Oban, entry for Mary MacBride, 27 January 1934.' },
  { n: 3, text: 'Hulme, M. and Barrow, E., “Long instrumental records from the Scottish west coast”, Climatic Change 31 (1995), pp. 401–422.' },
]

const RELATED = [
  { title: 'The clerks who accidentally measured the tide', dek: 'Harbour dues records as a two-century sea-level dataset.', read: '14 min' },
  { title: 'Nobody specified the birds', dek: 'What automated agricultural monitoring stopped noticing in 2004.', read: '9 min' },
  { title: 'In praise of the boring column', dek: 'On forms, restraint, and the accidental archive.', read: '6 min' },
]

const GAP_ID = 'the-transfer'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return reduced
}

export default function App() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const articleRef = useRef(null)
  const gapRef = useRef(null)
  const [gap, setGap] = useState({ top: 0, height: 0 })
  const [read, setRead] = useState(0) // 0–1 through the article body
  const [active, setActive] = useState(SECTIONS[0].id)
  const reduced = usePrefersReducedMotion()

  // Where the record stops: measured off the real section box so the void in
  // the spine lines up with the paragraphs that describe it.
  useLayoutEffect(() => {
    const article = articleRef.current
    const gapEl = gapRef.current
    if (!article || !gapEl) return
    const measure = () => {
      setGap({ top: gapEl.offsetTop, height: gapEl.offsetHeight })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(article)
    ro.observe(gapEl)
    return () => ro.disconnect()
  }, [])

  // Ink laid down as the reader advances. The lamp marker rides its leading edge.
  useEffect(() => {
    const article = articleRef.current
    if (!article) return
    let frame = 0
    const update = () => {
      frame = 0
      const rect = article.getBoundingClientRect()
      const travelled = window.innerHeight * 0.5 - rect.top
      const progress = travelled / Math.max(rect.height, 1)
      setRead(Math.min(1, Math.max(0, progress)))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    const ids = [...SECTIONS.map((s) => s.id), 'notes']
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: 0 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const inkHeight = read * (articleRef.current?.offsetHeight ?? 0)
  const inGap = inkHeight > gap.top && inkHeight < gap.top + gap.height
  const activeIndex = SECTIONS.findIndex((s) => s.id === active)
  const marginalia = MARGINALIA[active]

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <div className={`page${reduced ? ' is-still' : ''}`}>
      <a className="skip" href="#article">Skip to the essay</a>

      <nav className="nav" id="site-nav">
        <span className="nav-logo">
          The Marginal
          <em>Issue 34</em>
        </span>
        <div className="nav-links">
          <a href="#article">Essay</a>
          <a href="#notes">Notes</a>
          <a href="#related">More</a>
          <a href="#subscribe">Subscribe</a>
          <a href="/archive">Archive</a>
        </div>
      </nav>

      <header className="masthead">
        <div className="masthead-rail" aria-hidden="true">
          <span className="stamp">Archives · Issue 34</span>
        </div>
        <div className="masthead-body">
          <p className="kicker">Archives · Issue 34</p>
          <h1>
            The lighthouse keepers who <em>accidentally</em> recorded the weather
          </h1>
          <p className="dek">
            For ninety-nine years, three men at Ardnamurchan wrote down what they could see. They
            thought they were filling in a form. They were building a climate record.
          </p>
          <p className="byline">
            By <strong>Ellen Voss</strong>
            <span className="byline-rule" aria-hidden="true" />
            8 August 2026
            <span className="byline-rule" aria-hidden="true" />
            12 minute read
          </p>
        </div>
      </header>

      <figure className="lede-figure">
        <div className="plate">
          <Plate />
        </div>
        <figcaption>
          <span className="fig-no" aria-hidden="true">Plate I</span>
          Ardnamurchan Point, looking north-west toward the Small Isles. The tower was built by
          Alan Stevenson in 1849.
        </figcaption>
      </figure>

      <div className="ledger">
        <aside className="rail" aria-hidden="true">
          <div className="rail-inner">
            <span className="rail-label">Column</span>
            <span className="rail-no">{String(activeIndex >= 0 ? activeIndex + 1 : 5).padStart(2, '0')}</span>
            <span className="rail-span">{marginalia ? marginalia.span : 'Sources'}</span>
            <span className="rail-note">{marginalia ? marginalia.note : 'Cited'}</span>
            <span className={`rail-state${inGap ? ' is-dark' : ''}`}>
              {inGap ? 'Light automated — no observation' : 'Observation kept'}
            </span>
          </div>
        </aside>

        <article className="article" id="article" ref={articleRef}>
          {/* The spine: the ruled column of the logbook, inked as you read.
              It goes blank across the years nobody wrote anything down. */}
          <div className="spine" aria-hidden="true">
            <div className="spine-ink" style={{ height: `${read * 100}%` }} />
            <div
              className="spine-void"
              style={{ top: `${gap.top}px`, height: `${gap.height}px` }}
            />
            <div
              className={`spine-lamp${inGap ? ' is-cold' : ''}`}
              style={{ top: `${read * 100}%` }}
            />
          </div>

          {SECTIONS.map((s, i) => (
            <section
              className={`entry${s.id === GAP_ID ? ' entry--gap' : ''}`}
              key={s.id}
              id={s.id}
              ref={s.id === GAP_ID ? gapRef : undefined}
            >
              <div className="entry-mark" aria-hidden="true">
                <span className="entry-no">{String(i + 1).padStart(2, '0')}</span>
                <span className="entry-span">{MARGINALIA[s.id].span}</span>
              </div>
              <h2>{s.heading}</h2>
              {s.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {i === 1 && (
                <blockquote className="pull-quote">
                  <span aria-hidden="true" className="pq-mark">“</span>
                  Because the logbook admitted only observable facts, it became, accidentally, a
                  nearly perfect climate record.
                </blockquote>
              )}
              {s.id === GAP_ID && (
                <p className="gap-caption" aria-hidden="true">
                  1988 — 1998 · the column left unruled
                </p>
              )}
            </section>
          ))}

          <section className="entry entry--notes" id="notes">
            <div className="entry-mark" aria-hidden="true">
              <span className="entry-no">§</span>
              <span className="entry-span">Sources</span>
            </div>
            <h2>Notes</h2>
            <ol className="notes">
              {NOTES.map((n) => (
                <li key={n.n} id={`note-${n.n}`}>
                  {n.text}
                </li>
              ))}
            </ol>
          </section>
        </article>
      </div>

      <section className="section related-section" id="related">
        <h2 className="section-title">
          <span className="section-title-no" aria-hidden="true">Index</span>
          More from The Marginal
        </h2>
        <ul className="related">
          {RELATED.map((r, i) => (
            <li className="related-item" key={r.title}>
              <span className="related-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <div className="related-body">
                <h3>{r.title}</h3>
                <p>{r.dek}</p>
              </div>
              <span className="read-time">{r.read}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section subscribe" id="subscribe">
        <div className="subscribe-copy">
          <h2 className="section-title">
            <span className="section-title-no" aria-hidden="true">Form</span>
            One essay a fortnight
          </h2>
          <p>
            No news, no roundups, no comment on the discourse. One long piece about how records get
            made and what they leave out.
          </p>
        </div>
        <div className="subscribe-panel">
          {subscribed ? (
            <p className="form-success" role="status">
              <span className="form-success-stamp" aria-hidden="true">Entered</span>
              You are on the list. The next issue goes out on the 22nd.
            </p>
          ) : (
            <form className="subscribe-form" onSubmit={handleSubmit}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Subscribe</button>
            </form>
          )}
        </div>
      </section>

      <footer className="footer" id="site-footer">
        <p>© 2026 The Marginal — published in Glasgow</p>
        <div className="footer-links">
          <a href="#article">Top</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/rss">RSS</a>
        </div>
      </footer>
    </div>
  )
}
