import { useState, useEffect, useRef } from 'react'

const SECTIONS = [
  {
    id: 'the-shape',
    heading: 'The shape of a working day',
    // Marginalia: log-style metadata, in the voice of the book the essay is about.
    log: { vol: 'Vol. 1–41', entry: 'LH/2/44', note: 'Wind, visibility, hours lit.' },
    paragraphs: [
      'The lighthouse at Ardnamurchan was automated in 1988. For the ninety-nine years before that, three men lived on the point in rotation, and one of them was always awake. The logbooks they kept are dull in the way that only genuinely serious documents are dull: wind, visibility, the hour the light was lit, the hour it was put out. Nothing about weather as an experience. Nothing about the sea except as a condition affecting the work.',
      'I went looking for those logbooks expecting loneliness and found administration. Forty-one volumes, and in all of them perhaps a dozen sentences that could be called personal. A keeper named Angus MacBride recorded, on 3 February 1934, that the lens had been cleaned twice because the first cleaning was unsatisfactory. He did not record that his wife had died in Oban the week before. That fact comes from the parish register, not from him.',
    ],
  },
  {
    id: 'instrument',
    heading: 'An instrument for not thinking',
    log: { vol: '3 Feb 1934', entry: 'Lens cleaned ×2', note: 'First cleaning unsatisfactory.' },
    paragraphs: [
      'It would be sentimental to read the silence as stoicism. The more likely explanation is procedural: the log was an instrument of the Northern Lighthouse Board, subject to inspection, and a keeper who filled it with feeling was a keeper who had misunderstood his job. The form produced the restraint.',
      'But the form also produced something else, and this is the part I keep returning to. Because the logbook admitted only observable facts, it became, accidentally, a nearly perfect climate record. Ninety-nine years of daily visibility readings from a fixed point on the Atlantic edge of Scotland, taken by men with no theory to defend and no result they preferred. Meteorologists have been mining Ardnamurchan since the 1970s precisely because MacBride and his colleagues were not interested in the weather.',
    ],
  },
  {
    id: 'the-transfer',
    heading: 'What automation actually removed',
    log: { vol: '1988–1998', entry: 'No entry', note: 'Sensor monitors lamp, battery, door.' },
    paragraphs: [
      'When the light was automated, the readings stopped. Not because a machine could not take them, but because nobody specified that a machine should. The sensor package installed in 1988 monitored the lamp, the battery, and the door. It did not look out.',
      'This is the ordinary shape of automation and it is worth naming plainly. The task was replaced. The by-product of the task, which had turned out to be more valuable than the task, was not replaced, because nobody had ever written it down as a requirement. It existed only as a consequence of a human being physically present and obliged to fill in a column.',
      'A ten-year gap opens in the record at that point. It closes in 1998, when an automatic weather station was finally installed a hundred metres from the tower, at a cost that would have paid a keeper for a decade.',
    ],
  },
  {
    id: 'coda',
    heading: 'Coda',
    log: { vol: 'Final entry', entry: 'SW 4 · vis. good', note: 'Light lit 16:42.' },
    paragraphs: [
      'MacBride retired in 1951 and died in Fort William in 1963. His last entry is characteristically complete: wind south-westerly, force four, visibility good, light lit at 16:42. Below it, in a different hand, the next keeper begins.',
      'The lens he cleaned twice is still in the tower. It is no longer connected to anything.',
    ],
  },
]

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

const RAIL = [
  { id: 'the-shape', label: 'The shape of a working day' },
  { id: 'instrument', label: 'An instrument for not thinking' },
  { id: 'the-transfer', label: 'What automation actually removed' },
  { id: 'coda', label: 'Coda' },
  { id: 'notes', label: 'Notes' },
]

/* Scroll position, read as a percentage the way a log reads a gauge. */
function useProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const doc = document.documentElement
      const span = doc.scrollHeight - doc.clientHeight
      setProgress(span > 0 ? Math.min(1, Math.max(0, doc.scrollTop / span)) : 0)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return progress
}

/* Whichever section currently owns the upper third of the viewport. */
function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!nodes.length) return
    const pick = () => {
      const line = window.innerHeight * 0.33
      let current = nodes[0]
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= line) current = node
      }
      setActive(current.id)
    }
    let frame = 0
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; pick() })
    }
    pick()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids])
  return active
}

/* Sections fade up once, then stay put. */
function useReveal() {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') { setSeen(true); return }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])
  return [ref, seen]
}

function Section({ section, index, children }) {
  const [ref, seen] = useReveal()
  const num = String(index + 1).padStart(2, '0')
  return (
    <section
      className={`article-section${seen ? ' is-visible' : ''}`}
      id={section.id}
      ref={ref}
      style={{ '--i': index }}
    >
      <div className="section-mark" aria-hidden="true">
        <span className="section-num">§ {num}</span>
        <span className="section-rule" />
      </div>

      <div className="section-body">
        <h2>{section.heading}</h2>

        <aside className="marginalia" aria-hidden="true">
          <span className="marginalia-vol">{section.log.vol}</span>
          <span className="marginalia-entry">{section.log.entry}</span>
          <span className="marginalia-note">{section.log.note}</span>
        </aside>

        {section.paragraphs.map((p, j) => (
          <p key={j} className={index === 0 && j === 0 ? 'has-dropcap' : undefined}>
            {p}
          </p>
        ))}
        {children}
      </div>
    </section>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const progress = useProgress()
  const active = useActiveSection(RAIL.map((r) => r.id))

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <div className="page">
      <div className="beacon" style={{ '--p': progress }} aria-hidden="true" />

      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#article">
          <span className="nav-lamp" aria-hidden="true" />
          The Marginal
        </a>
        <div className="nav-links">
          <a href="#article">Essay</a>
          <a href="#notes">Notes</a>
          <a href="#related">More</a>
          <a href="#subscribe">Subscribe</a>
          <a href="/archive">Archive</a>
        </div>
      </nav>

      <div className="shell">
        <aside className="rail" aria-label="Essay contents">
          <p className="rail-title">Logbook</p>
          <ol className="rail-list">
            {RAIL.map((r, i) => (
              <li key={r.id} className={active === r.id ? 'is-active' : undefined}>
                <a href={`#${r.id}`}>
                  <span className="rail-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="rail-label">{r.label}</span>
                </a>
              </li>
            ))}
          </ol>
          <p className="rail-progress">
            <span className="rail-gauge" aria-hidden="true">
              <span className="rail-gauge-fill" style={{ transform: `scaleY(${progress})` }} />
            </span>
            <span className="rail-pct">{Math.round(progress * 100)}%</span>
          </p>
        </aside>

        <main className="main">
          <article className="article" id="article">
            <header className="article-header">
              <p className="kicker">
                <span className="kicker-dot" aria-hidden="true" />
                Archives <span className="kicker-sep">·</span> Issue 34
              </p>
              <h1>The lighthouse keepers who accidentally recorded the weather</h1>
              <p className="dek">
                For ninety-nine years, three men at Ardnamurchan wrote down what they could see. They
                thought they were filling in a form. They were building a climate record.
              </p>
              <p className="byline">
                By <strong>Ellen Voss</strong>
                <span className="byline-sep" aria-hidden="true" />
                8 August 2026
                <span className="byline-sep" aria-hidden="true" />
                12 minute read
              </p>
            </header>

            <figure className="lede-figure">
              <div className="figure-image" aria-hidden="true">
                <div className="fig-sky" />
                <div className="fig-beam" />
                <div className="fig-sea" />
                <div className="fig-tower">
                  <span className="fig-lamp" />
                </div>
                <div className="fig-grain" />
              </div>
              <figcaption>
                <span className="figcaption-index" aria-hidden="true">Fig. 1</span>
                Ardnamurchan Point, looking north-west toward the Small Isles. The tower was built by
                Alan Stevenson in 1849.
              </figcaption>
            </figure>

            {SECTIONS.map((s, i) => (
              <Section key={s.id} section={s} index={i}>
                {i === 1 && (
                  <blockquote className="pull-quote">
                    <p>
                      Because the logbook admitted only observable facts, it became, accidentally, a
                      nearly perfect climate record.
                    </p>
                  </blockquote>
                )}
              </Section>
            ))}

            <section className="article-section notes-section" id="notes">
              <div className="section-mark" aria-hidden="true">
                <span className="section-num">§ N</span>
                <span className="section-rule" />
              </div>
              <div className="section-body">
                <h2>Notes</h2>
                <ol className="notes">
                  {NOTES.map((n) => (
                    <li key={n.n} id={`note-${n.n}`}>
                      <span className="note-num" aria-hidden="true">{String(n.n).padStart(2, '0')}</span>
                      <span className="note-text">{n.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          </article>

          <section className="section" id="related">
            <h2 className="section-title">
              <span className="section-title-label">More from The Marginal</span>
            </h2>
            <ul className="related">
              {RELATED.map((r, i) => (
                <li className="related-item" key={r.title}>
                  <a href="#related">
                    <span className="related-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <span className="related-body">
                      <h3>{r.title}</h3>
                      <p>{r.dek}</p>
                    </span>
                    <span className="read-time">{r.read}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="section subscribe" id="subscribe">
            <div className="subscribe-inner">
              <div className="subscribe-copy">
                <h2 className="section-title">
                  <span className="section-title-label">One essay a fortnight</span>
                </h2>
                <p>
                  No news, no roundups, no comment on the discourse. One long piece about how records
                  get made and what they leave out.
                </p>
              </div>
              {subscribed ? (
                <p className="form-success" role="status">
                  <span className="form-success-mark" aria-hidden="true" />
                  You are on the list. The next issue goes out on the 22nd.
                </p>
              ) : (
                <form className="subscribe-form" onSubmit={handleSubmit}>
                  <label htmlFor="email">Email address</label>
                  <div className="field">
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
                  </div>
                </form>
              )}
            </div>
          </section>
        </main>
      </div>

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
