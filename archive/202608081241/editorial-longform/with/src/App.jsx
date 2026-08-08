import { useEffect, useRef, useState } from 'react'

const SECTIONS = [
  {
    id: 'the-shape',
    heading: 'The shape of a working day',
    entry: 'Entry 01',
    datum: 'Vols. 1–41 · Northern Lighthouse Board · NRS LH/2/44',
    paragraphs: [
      'The lighthouse at Ardnamurchan was automated in 1988. For the ninety-nine years before that, three men lived on the point in rotation, and one of them was always awake. The logbooks they kept are dull in the way that only genuinely serious documents are dull: wind, visibility, the hour the light was lit, the hour it was put out. Nothing about weather as an experience. Nothing about the sea except as a condition affecting the work.',
      'I went looking for those logbooks expecting loneliness and found administration. Forty-one volumes, and in all of them perhaps a dozen sentences that could be called personal. A keeper named Angus MacBride recorded, on 3 February 1934, that the lens had been cleaned twice because the first cleaning was unsatisfactory. He did not record that his wife had died in Oban the week before. That fact comes from the parish register, not from him.',
    ],
  },
  {
    id: 'instrument',
    heading: 'An instrument for not thinking',
    entry: 'Entry 02',
    datum: 'The column admits observable facts only',
    paragraphs: [
      'It would be sentimental to read the silence as stoicism. The more likely explanation is procedural: the log was an instrument of the Northern Lighthouse Board, subject to inspection, and a keeper who filled it with feeling was a keeper who had misunderstood his job. The form produced the restraint.',
      'But the form also produced something else, and this is the part I keep returning to. Because the logbook admitted only observable facts, it became, accidentally, a nearly perfect climate record. Ninety-nine years of daily visibility readings from a fixed point on the Atlantic edge of Scotland, taken by men with no theory to defend and no result they preferred. Meteorologists have been mining Ardnamurchan since the 1970s precisely because MacBride and his colleagues were not interested in the weather.',
    ],
  },
  {
    id: 'the-transfer',
    heading: 'What automation actually removed',
    entry: 'Entry 03',
    datum: 'Sensor package, 1988: lamp, battery, door. It did not look out.',
    paragraphs: [
      'When the light was automated, the readings stopped. Not because a machine could not take them, but because nobody specified that a machine should. The sensor package installed in 1988 monitored the lamp, the battery, and the door. It did not look out.',
      'This is the ordinary shape of automation and it is worth naming plainly. The task was replaced. The by-product of the task, which had turned out to be more valuable than the task, was not replaced, because nobody had ever written it down as a requirement. It existed only as a consequence of a human being physically present and obliged to fill in a column.',
      'A ten-year gap opens in the record at that point. It closes in 1998, when an automatic weather station was finally installed a hundred metres from the tower, at a cost that would have paid a keeper for a decade.',
    ],
  },
  {
    id: 'coda',
    heading: 'Coda',
    entry: 'Entry 04',
    datum: 'Last entry: light lit at 16:42',
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

const FIRST_YEAR = 1849
const LAST_YEAR = 2026
const GAP_START = 1988
const GAP_END = 1997

/* One stroke per year of the record. Height stands in for annual mean
   visibility; the run is deterministic so the plate is stable between loads. */
const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => {
  const y = FIRST_YEAR + i
  const wave = Math.sin(i * 0.41) * 0.22 + Math.sin(i * 1.13) * 0.14 + Math.cos(i * 0.07) * 0.1
  return { year: y, height: 0.44 + wave, gap: y >= GAP_START && y <= GAP_END }
})

/* Horizontal centre of the missing decade, used to hang its axis label. */
const GAP_MID =
  ((GAP_START + GAP_END) / 2 - FIRST_YEAR + 0.5) / (LAST_YEAR - FIRST_YEAR + 1) * 100

function LedePlate() {
  return (
    <svg
      className="plate"
      viewBox="0 0 1200 640"
      role="img"
      aria-label="Engraved plate of Ardnamurchan Point, the tower standing above the headland with the light bearing north-west over the sea."
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfc9ba" />
          <stop offset="0.68" stopColor="#ded8c9" />
          <stop offset="1" stopColor="#e6e0d0" />
        </linearGradient>
        <pattern id="screen" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.72" fill="#1c1a16" opacity="0.5" />
        </pattern>
        <linearGradient id="beam" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#a8321e" stopOpacity="0.5" />
          <stop offset="1" stopColor="#a8321e" stopOpacity="0" />
        </linearGradient>
        <clipPath id="frame"><rect width="1200" height="640" /></clipPath>
      </defs>

      <g clipPath="url(#frame)">
        <rect width="1200" height="640" fill="url(#sky)" />

        {/* Engraver's sky ruling, closing toward the horizon */}
        {Array.from({ length: 26 }, (_, i) => (
          <line
            key={`s${i}`}
            x1="0"
            x2="1200"
            y1={40 + i * i * 0.58}
            y2={40 + i * i * 0.58}
            stroke="#1c1a16"
            strokeOpacity={0.05 + i * 0.004}
            strokeWidth="1"
          />
        ))}

        {/* The Small Isles, low on the horizon to the north-west */}
        <path d="M0 404 L96 386 L150 396 L214 380 L268 398 L300 404 Z" fill="#1c1a16" opacity="0.17" />
        <path d="M352 402 L410 390 L452 400 L470 404 Z" fill="#1c1a16" opacity="0.13" />

        <rect y="404" width="1200" height="236" fill="#c8c3b4" />
        <rect y="404" width="1200" height="236" fill="url(#screen)" opacity="0.16" />

        {/* Sea, ruled in broken lines the way a chart engraver would set it */}
        {Array.from({ length: 20 }, (_, i) => {
          const y = 412 + i * 12 + i * i * 0.28
          return (
            <line
              key={`w${i}`}
              x1={-40 + (i % 3) * 46}
              x2="1240"
              y1={y}
              y2={y}
              stroke="#1c1a16"
              strokeOpacity={0.13 + i * 0.012}
              strokeWidth={1 + i * 0.06}
              strokeDasharray={`${34 + i * 9} ${26 + (i % 4) * 11}`}
            />
          )
        })}

        {/* The beam, bearing north-west */}
        <path d="M905 236 L0 130 L0 330 Z" fill="url(#beam)" />

        {/* The point and the tower */}
        <path d="M760 404 L836 372 L900 360 L1010 366 L1120 386 L1200 396 L1200 404 Z" fill="#1c1a16" opacity="0.9" />
        <path d="M898 366 L902 244 L926 244 L930 366 Z" fill="#1c1a16" />
        <rect x="892" y="228" width="44" height="8" fill="#1c1a16" />
        <rect x="899" y="204" width="30" height="26" fill="#1c1a16" opacity="0.86" />
        <rect x="905" y="210" width="18" height="14" fill="#a8321e" />
        <path d="M900 196 L914 182 L928 196 Z" fill="#1c1a16" />
      </g>

      <rect x="0.5" y="0.5" width="1199" height="639" fill="none" stroke="#1c1a16" strokeOpacity="0.35" />
    </svg>
  )
}

function Ledger() {
  const ref = useRef(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setDrawn(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setDrawn(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <figure ref={ref} className={`ledger${drawn ? ' is-drawn' : ''}`} id="record">
      <div className="ledger-head">
        <span className="label">Visibility readings · Ardnamurchan · one stroke per year</span>
        <span className="label ledger-gap-note">1988–1997 · no observer</span>
      </div>
      <div className="ledger-strokes" aria-hidden="true">
        {YEARS.map((y, i) => (
          <span
            key={y.year}
            className={`stroke${y.gap ? ' is-gap' : ''}`}
            style={{
              height: y.gap ? '100%' : `${Math.round(y.height * 100)}%`,
              transitionDelay: `${Math.min(i * 6, 900)}ms`,
            }}
          />
        ))}
      </div>
      <div className="ledger-axis">
        <span className="label">{FIRST_YEAR}</span>
        <span className="label ledger-gap-note" style={{ left: `${GAP_MID}%` }}>
          Automated 1988 · station 1998
        </span>
        <span className="label">{LAST_YEAR}</span>
      </div>
      <figcaption className="label" style={{ marginTop: '0.75rem' }}>
        The ten years the record is missing are the ten years nobody was obliged to fill in a column.
      </figcaption>
    </figure>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const articleRef = useRef(null)
  const [read, setRead] = useState(0)

  useEffect(() => {
    let frame = 0
    function measure() {
      frame = 0
      const el = articleRef.current
      if (!el) return
      const start = el.offsetTop
      const span = el.offsetHeight - window.innerHeight * 0.5
      const p = span > 0 ? (window.scrollY - start + window.innerHeight * 0.5) / span : 0
      setRead(Math.max(0, Math.min(1, p)))
    }
    function onScroll() {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <div className="page">
      <nav className="nav" id="site-nav">
        <div className="nav-inner">
          <span className="nav-logo">
            The Marginal <em>— Issue 34</em>
          </span>
          <div className="nav-links">
            <a href="#article">Essay</a>
            <a href="#notes">Notes</a>
            <a href="#related">More</a>
            <a href="#subscribe">Subscribe</a>
            <a href="/archive">Archive</a>
          </div>
        </div>
        <div
          className="nav-progress"
          style={{ '--read': read }}
          role="progressbar"
          aria-label="Reading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(read * 100)}
        />
      </nav>

      <article className="article sheet" id="article" ref={articleRef}>
        <header className="article-header">
          <p className="kicker label">Archives · Issue 34</p>
          <h1>
            The lighthouse keepers who accidentally recorded the <span className="lit">weather</span>
          </h1>
          <p className="dek">
            For ninety-nine years, three men at Ardnamurchan wrote down what they could see. They
            thought they were filling in a form. They were building a climate record.
          </p>
          <p className="byline">
            <span className="byline-cell">
              <span className="label">Written by</span>
              <span className="byline-value">
                <strong>Ellen Voss</strong>
              </span>
            </span>
            <span className="byline-cell">
              <span className="label">Filed</span>
              <span className="byline-value">8 August 2026</span>
            </span>
            <span className="byline-cell">
              <span className="label">Length</span>
              <span className="byline-value">12 minute read</span>
            </span>
          </p>
        </header>

        <figure className="lede-figure">
          <LedePlate />
          <figcaption>
            Ardnamurchan Point, looking north-west toward the Small Isles. The tower was built by
            Alan Stevenson in 1849.
          </figcaption>
        </figure>

        {SECTIONS.map((s, i) => (
          <section className="article-section" key={s.id} id={s.id}>
            <div className="section-rail">
              <span className="entry-no">{s.entry}</span>
              <span className="entry-datum">{s.datum}</span>
            </div>
            <div className="section-body">
              <h2>{s.heading}</h2>
              {s.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
            {i === 1 && (
              <blockquote className="pull-quote">
                Because the logbook admitted only observable facts, it became, accidentally, a
                nearly perfect climate record.
              </blockquote>
            )}
            {i === 2 && <Ledger />}
          </section>
        ))}

        <section className="notes-section" id="notes">
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

      <section className="sheet band" id="related">
        <div className="band-head">
          <h2>More from The Marginal</h2>
        </div>
        <div className="band-body">
          <ul className="related">
            {RELATED.map((r, i) => (
              <li className="related-item" key={r.title}>
                <span className="related-no">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.dek}</p>
                </div>
                <span className="read-time">{r.read}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sheet band subscribe" id="subscribe">
        <div className="band-head">
          <h2>Fortnightly</h2>
        </div>
        <div className="band-body subscribe-body">
          <h2>One essay a fortnight</h2>
          <p>
            No news, no roundups, no comment on the discourse. One long piece about how records get
            made and what they leave out.
          </p>
          {subscribed ? (
            <p className="form-success" role="status">
              <span className="label">Entered in the book</span>
              You are on the list. The next issue goes out on the 22nd.
            </p>
          ) : (
            <form className="subscribe-form" onSubmit={handleSubmit}>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="btn">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="footer" id="site-footer">
        <div className="footer-inner">
          <p className="label" style={{ margin: 0 }}>
            © 2026 The Marginal — published in Glasgow
          </p>
          <div className="footer-links label">
            <a href="#article">Top</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/rss">RSS</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
