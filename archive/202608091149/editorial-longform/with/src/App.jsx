import { useEffect, useRef, useState } from 'react'
import ledeImage from './assets/ardnamurchan-small-isles.jpg'
import coastalProfile from './assets/coastal-profile-1851.jpg'

/*
 * Every figure in the margin column below is taken from the essay itself.
 * The rail is an index of the record the piece describes, not invented data.
 */
const SECTIONS = [
  {
    id: 'the-shape',
    folio: 'I',
    heading: 'The shape of a working day',
    log: [
      ['Keepers on the point', '3'],
      ['Years manned', '1889–1988'],
      ['Volumes', '41'],
    ],
    paragraphs: [
      'The lighthouse at Ardnamurchan was automated in 1988. For the ninety-nine years before that, three men lived on the point in rotation, and one of them was always awake. The logbooks they kept are dull in the way that only genuinely serious documents are dull: wind, visibility, the hour the light was lit, the hour it was put out. Nothing about weather as an experience. Nothing about the sea except as a condition affecting the work.',
      'I went looking for those logbooks expecting loneliness and found administration. Forty-one volumes, and in all of them perhaps a dozen sentences that could be called personal. A keeper named Angus MacBride recorded, on 3 February 1934, that the lens had been cleaned twice because the first cleaning was unsatisfactory. He did not record that his wife had died in Oban the week before. That fact comes from the parish register, not from him.',
    ],
  },
  {
    id: 'instrument',
    folio: 'II',
    heading: 'An instrument for not thinking',
    log: [
      ['Personal sentences', 'c. 12'],
      ['Visibility readings', 'daily'],
      ['First mined', '1970s'],
    ],
    paragraphs: [
      'It would be sentimental to read the silence as stoicism. The more likely explanation is procedural: the log was an instrument of the Northern Lighthouse Board, subject to inspection, and a keeper who filled it with feeling was a keeper who had misunderstood his job. The form produced the restraint.',
      'But the form also produced something else, and this is the part I keep returning to. Because the logbook admitted only observable facts, it became, accidentally, a nearly perfect climate record. Ninety-nine years of daily visibility readings from a fixed point on the Atlantic edge of Scotland, taken by men with no theory to defend and no result they preferred. Meteorologists have been mining Ardnamurchan since the 1970s precisely because MacBride and his colleagues were not interested in the weather.',
    ],
  },
  {
    id: 'the-transfer',
    folio: 'III',
    heading: 'What automation actually removed',
    log: [
      ['Automated', '1988'],
      ['Sensors installed', 'lamp · battery · door'],
      ['Weather station', '1998'],
    ],
    paragraphs: [
      'When the light was automated, the readings stopped. Not because a machine could not take them, but because nobody specified that a machine should. The sensor package installed in 1988 monitored the lamp, the battery, and the door. It did not look out.',
      'This is the ordinary shape of automation and it is worth naming plainly. The task was replaced. The by-product of the task, which had turned out to be more valuable than the task, was not replaced, because nobody had ever written it down as a requirement. It existed only as a consequence of a human being physically present and obliged to fill in a column.',
      'A ten-year gap opens in the record at that point. It closes in 1998, when an automatic weather station was finally installed a hundred metres from the tower, at a cost that would have paid a keeper for a decade.',
    ],
    /* The ruled page keeps going after the second paragraph; the entries do not. */
    gapAfter: 1,
  },
  {
    id: 'coda',
    folio: 'IV',
    heading: 'Coda',
    log: [
      ['MacBride retired', '1951'],
      ['Died, Fort William', '1963'],
      ['Last entry, light lit', '16:42'],
    ],
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

/* Sections observed by the margin rail, in reading order. */
const RAIL_IDS = [...SECTIONS.map((s) => s.id), 'notes']

function useReadingState() {
  const [progress, setProgress] = useState(0)
  const [current, setCurrent] = useState(SECTIONS[0].id)
  const [posted, setPosted] = useState(() => new Set())
  const [lightOut, setLightOut] = useState(false)

  useEffect(() => {
    const article = document.getElementById('article')
    const sentinel = document.getElementById('light-out')
    const marks = RAIL_IDS.map((id) => document.getElementById(id)).filter(Boolean)
    let frame = 0

    function measure() {
      frame = 0
      if (!article) return
      const view = window.innerHeight
      const rect = article.getBoundingClientRect()
      const span = Math.max(1, rect.height - view * 0.5)
      const seen = Math.min(Math.max(-rect.top + view * 0.35, 0), span)
      setProgress(seen / span)

      // The keeper is at whichever entry the reading line has last reached.
      let at = marks[0]
      marks.forEach((el) => {
        if (el.getBoundingClientRect().top < view * 0.4) at = el
      })
      if (at) setCurrent(at.id)

      if (sentinel) setLightOut(sentinel.getBoundingClientRect().top < view * 0.55)
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    const marker = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const { id } = entry.target
          setPosted((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
        })
      },
      { rootMargin: '-12% 0px -45% 0px', threshold: 0 },
    )
    marks.forEach((el) => marker.observe(el))

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
      marker.disconnect()
    }
  }, [])

  return { progress, current, posted, lightOut }
}

function LogEntry({ id, folio, heading, log, posted, active }) {
  return (
    <aside
      className={`log${posted ? ' is-posted' : ''}${active ? ' is-active' : ''}`}
      aria-hidden="true"
    >
      <span className="log-folio">{folio}</span>
      <dl className="log-table">
        {log.map(([label, value]) => (
          <div className="log-row" key={label + id}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <span className="log-heading">{heading}</span>
    </aside>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const { progress, current, posted, lightOut } = useReadingState()
  const successRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSubscribed(true)
    setEmail('')
  }

  useEffect(() => {
    if (subscribed && successRef.current) successRef.current.focus()
  }, [subscribed])

  const currentSection = SECTIONS.find((s) => s.id === current)
  const currentLabel = currentSection ? currentSection.heading : 'Notes'
  const pct = Math.round(progress * 100)

  return (
    <div className={`page${lightOut ? ' light-out' : ''}`}>
      <a className="skip" href="#article">Skip to the essay</a>

      <header className="masthead">
        <nav className="nav" id="site-nav">
          <a className="nav-logo" href="#article">
            <span className="nav-logo-mark" aria-hidden="true" />
            The Marginal
          </a>
          <span className="nav-issue">Issue 34</span>
          <div className="nav-links">
            <a href="#article">Essay</a>
            <a href="#notes">Notes</a>
            <a href="#related">More</a>
            <a href="#subscribe">Subscribe</a>
            <a href="/archive">Archive</a>
          </div>
        </nav>

        <div className="watch-bar" aria-hidden="true">
          <span className="watch-bar-lamp" />
          <span className="watch-bar-label">{lightOut ? 'Light put out' : currentLabel}</span>
          <span className="watch-bar-track">
            <span style={{ width: `${pct}%` }} />
          </span>
        </div>
      </header>

      {/* The keeper's watch: lit while there is still a reader on the point. */}
      <div className="watch" aria-hidden="true">
        <span className="watch-lamp" />
        <span className="watch-column">
          <span className="watch-fill" style={{ height: `${pct}%` }} />
        </span>
        <span className="watch-label">{lightOut ? 'Light put out' : currentLabel}</span>
        <span className="watch-pct">{String(pct).padStart(2, '0')}</span>
      </div>

      <article className="article" id="article">
        <header className="article-header">
          <div className="stamp">
            <p className="kicker">Archives · Issue 34</p>
            <p className="byline">
              By <strong>Ellen Voss</strong>
              <span className="byline-line">8 August 2026</span>
              <span className="byline-line">12 minute read</span>
            </p>
          </div>
          <div className="headline-block">
            <h1>
              The lighthouse keepers who <em>accidentally</em> recorded the weather
            </h1>
            <p className="dek">
              For ninety-nine years, three men at Ardnamurchan wrote down what they could see. They
              thought they were filling in a form. They were building a climate record.
            </p>
          </div>
        </header>

        <figure className="lede-figure">
          <div className="plate">
            <img
              className="figure-image"
              src={ledeImage}
              width="640"
              height="426"
              alt="Ardnamurchan lighthouse standing on a low rocky point, with the hills of the Small Isles on the horizon across grey water."
            />
          </div>
          <figcaption>
            <span className="figcaption-index">Plate 1</span>
            Ardnamurchan Point, looking north-west toward the Small Isles. The tower was built by
            Alan Stevenson in 1849.
            <span className="credit">Photograph: Mark Hardy, geograph.org.uk · CC BY-SA 2.0</span>
          </figcaption>
        </figure>

        {SECTIONS.map((s, i) => (
          <section className="article-section" key={s.id} id={s.id}>
            <LogEntry
              id={s.id}
              folio={s.folio}
              heading={s.heading}
              log={s.log}
              posted={posted.has(s.id)}
              active={current === s.id}
            />
            <div className="prose">
              <h2>
                <span className="h2-folio" aria-hidden="true">{s.folio}</span>
                {s.heading}
              </h2>
              {s.paragraphs.map((p, j) => (
                <div className="para-wrap" key={j}>
                  <p>{p}</p>
                  {s.gapAfter === j && (
                    <div className="gap" role="img" aria-label="The record, ruled but empty, from 1988 to 1998.">
                      <span className="gap-from">1988</span>
                      <span className="gap-note">no entries</span>
                      <span className="gap-to">1998</span>
                    </div>
                  )}
                </div>
              ))}
              {i === 1 && (
                <blockquote className="pull-quote">
                  Because the logbook admitted only observable facts, it became, accidentally, a
                  nearly perfect climate record.
                </blockquote>
              )}
              {s.id === 'coda' && <span id="light-out" className="sentinel" aria-hidden="true" />}
            </div>
          </section>
        ))}

        <section className="article-section" id="notes">
          <LogEntry
            id="notes"
            folio="V"
            heading="Notes"
            log={[['Sources cited', '3'], ['Held at', 'NRS · LH/2/44']]}
            posted={posted.has('notes')}
            active={current === 'notes'}
          />
          <div className="prose">
            <h2>
              <span className="h2-folio" aria-hidden="true">V</span>
              Notes
            </h2>
            <ol className="notes">
              {NOTES.map((n) => (
                <li key={n.n} id={`note-${n.n}`}>
                  {n.text}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </article>

      <div className="horizon" aria-hidden="true">
        <img src={coastalProfile} alt="" />
      </div>

      <section className="section" id="related">
        <h2 className="section-heading">
          <span className="section-heading-label">Continued</span>
          More from The Marginal
        </h2>
        <ul className="related">
          {RELATED.map((r, i) => (
            <li className="related-item" key={r.title}>
              <span className="related-index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
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
        <div className="subscribe-inner">
          <div className="register-sheet">
            <h2 className="section-heading">
              <span className="section-heading-label">The register</span>
              One essay a fortnight
            </h2>
            <p className="subscribe-blurb">
              No news, no roundups, no comment on the discourse. One long piece about how records
              get made and what they leave out.
            </p>
          </div>
          {subscribed ? (
            <p className="form-success" role="status" tabIndex={-1} ref={successRef}>
              <span className="form-success-mark" aria-hidden="true">✓</span>
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

      <footer className="footer" id="site-footer">
        <p>© 2026 The Marginal — published in Glasgow</p>
        <div className="footer-links">
          <a href="#article">Top</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/rss">RSS</a>
        </div>
        <p className="colophon">
          Coastal profile: Hydrographic Office of the Admiralty, <em>Ardnamurchan Lighthouse</em>,
          c. 1851 · public domain.
        </p>
      </footer>
    </div>
  )
}
