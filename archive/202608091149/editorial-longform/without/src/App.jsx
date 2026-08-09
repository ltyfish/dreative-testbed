import { useEffect, useRef, useState } from 'react'

const SECTIONS = [
  {
    id: 'the-shape',
    heading: 'The shape of a working day',
    marginNote: 'Vols. 1–41 · NRS LH/2/44',
    paragraphs: [
      'The lighthouse at Ardnamurchan was automated in 1988. For the ninety-nine years before that, three men lived on the point in rotation, and one of them was always awake. The logbooks they kept are dull in the way that only genuinely serious documents are dull: wind, visibility, the hour the light was lit, the hour it was put out. Nothing about weather as an experience. Nothing about the sea except as a condition affecting the work.',
      'I went looking for those logbooks expecting loneliness and found administration. Forty-one volumes, and in all of them perhaps a dozen sentences that could be called personal. A keeper named Angus MacBride recorded, on 3 February 1934, that the lens had been cleaned twice because the first cleaning was unsatisfactory. He did not record that his wife had died in Oban the week before. That fact comes from the parish register, not from him.',
    ],
  },
  {
    id: 'instrument',
    heading: 'An instrument for not thinking',
    marginNote: 'The form produced the restraint',
    paragraphs: [
      'It would be sentimental to read the silence as stoicism. The more likely explanation is procedural: the log was an instrument of the Northern Lighthouse Board, subject to inspection, and a keeper who filled it with feeling was a keeper who had misunderstood his job. The form produced the restraint.',
      'But the form also produced something else, and this is the part I keep returning to. Because the logbook admitted only observable facts, it became, accidentally, a nearly perfect climate record. Ninety-nine years of daily visibility readings from a fixed point on the Atlantic edge of Scotland, taken by men with no theory to defend and no result they preferred. Meteorologists have been mining Ardnamurchan since the 1970s precisely because MacBride and his colleagues were not interested in the weather.',
    ],
  },
  {
    id: 'the-transfer',
    heading: 'What automation actually removed',
    marginNote: '1988 · sensor package installed',
    paragraphs: [
      'When the light was automated, the readings stopped. Not because a machine could not take them, but because nobody specified that a machine should. The sensor package installed in 1988 monitored the lamp, the battery, and the door. It did not look out.',
      'This is the ordinary shape of automation and it is worth naming plainly. The task was replaced. The by-product of the task, which had turned out to be more valuable than the task, was not replaced, because nobody had ever written it down as a requirement. It existed only as a consequence of a human being physically present and obliged to fill in a column.',
      'A ten-year gap opens in the record at that point. It closes in 1998, when an automatic weather station was finally installed a hundred metres from the tower, at a cost that would have paid a keeper for a decade.',
    ],
  },
  {
    id: 'coda',
    heading: 'Coda',
    marginNote: 'Light lit at 16:42',
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

const NAV_LINKS = [
  { href: '#article', label: 'Essay' },
  { href: '#notes', label: 'Notes' },
  { href: '#related', label: 'More' },
  { href: '#subscribe', label: 'Subscribe' },
  { href: '/archive', label: 'Archive' },
]

const FOOTER_LINKS = [
  { href: '#article', label: 'Top' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/rss', label: 'RSS' },
]

/* Ordinal used for the marginal rail and the section rules. */
const ord = (i) => String(i + 1).padStart(2, '0')

/* The lede plate: a Fresnel lens seen head-on, over the horizon it was aimed at. */
function LensPlate() {
  return (
    <svg
      className="plate"
      viewBox="0 0 1600 900"
      role="img"
      aria-label="Ardnamurchan Point, looking north-west toward the Small Isles"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b1d21" />
          <stop offset="62%" stopColor="#33322e" />
          <stop offset="100%" stopColor="#14140f" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="46%" r="46%">
          <stop offset="0%" stopColor="#f0b364" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#c2611f" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#c2611f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f2c07d" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f2c07d" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#sky)" />

      {/* Two sweeping beams, slowly rotating about the lens centre. */}
      <g className="plate-beams" transform="translate(800 414)">
        <polygon points="0,0 1500,-360 1500,360" fill="url(#beam)" />
        <polygon points="0,0 -1500,-300 -1500,300" fill="url(#beam)" opacity="0.55" />
      </g>

      <rect width="1600" height="900" fill="url(#glow)" />

      {/* Horizon and the sea's ruled bands — the visibility a keeper would log. */}
      <g stroke="#e9e4d9" fill="none">
        <line x1="0" y1="640" x2="1600" y2="640" strokeOpacity="0.5" />
        {[688, 730, 768, 802, 832, 858, 880].map((y, i) => (
          <line key={y} x1="0" y1={y} x2="1600" y2={y} strokeOpacity={0.16 - i * 0.016} />
        ))}
      </g>

      {/* Dioptric rings. */}
      <g className="plate-lens" transform="translate(800 414)" fill="none" stroke="#f4e3c4">
        {[44, 78, 112, 146, 180, 214, 248, 282, 316].map((r, i) => (
          <circle key={r} r={r} strokeOpacity={0.62 - i * 0.05} strokeWidth={i < 3 ? 1.6 : 1} />
        ))}
        <circle r="22" fill="#f6dcae" stroke="none" />
        {[0, 45, 90, 135].map((a) => (
          <line
            key={a}
            x1={-330 * Math.cos((a * Math.PI) / 180)}
            y1={-330 * Math.sin((a * Math.PI) / 180)}
            x2={330 * Math.cos((a * Math.PI) / 180)}
            y2={330 * Math.sin((a * Math.PI) / 180)}
            strokeOpacity="0.14"
          />
        ))}
      </g>

      {/* The tower, in silhouette, at the right of the point. */}
      <g fill="#0f0f0c" opacity="0.92">
        <path d="M1272 640 L1286 402 h44 l14 238 z" />
        <rect x="1278" y="382" width="60" height="22" />
        <path d="M1160 646 q120 -34 240 -6 v20 h-240 z" />
      </g>
    </svg>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(SECTIONS[0].id)
  const articleRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSubscribed(true)
    setEmail('')
  }

  /* Reading position: how far through the essay body, not the whole document. */
  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const el = articleRef.current
      if (!el) return
      const top = el.offsetTop
      const span = el.offsetHeight - window.innerHeight * 0.6
      const p = (window.scrollY - top + window.innerHeight * 0.35) / Math.max(span, 1)
      setProgress(Math.min(1, Math.max(0, p)))
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

  /* Which section the rail should mark as current. */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-18% 0px -70% 0px' },
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="page">
      <div className="progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#article">
          <span className="nav-mark" aria-hidden="true" />
          The Marginal
        </a>
        <div className="nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
      </nav>

      <article className="article" id="article" ref={articleRef}>
        <header className="article-header">
          <p className="kicker">
            <span>Archives</span>
            <i aria-hidden="true" />
            <span>Issue 34</span>
          </p>
          <h1>
            The lighthouse keepers who <em>accidentally</em> recorded the weather
          </h1>
          <p className="dek">
            For ninety-nine years, three men at Ardnamurchan wrote down what they could see. They
            thought they were filling in a form. They were building a climate record.
          </p>
          <p className="byline">
            <span className="byline-cell">
              <b>Written by</b>
              <strong>Ellen Voss</strong>
            </span>
            <span className="byline-cell">
              <b>Filed</b>8 August 2026
            </span>
            <span className="byline-cell">
              <b>Length</b>12 minute read
            </span>
          </p>
        </header>

        <figure className="lede-figure">
          <div className="figure-image">
            <LensPlate />
          </div>
          <figcaption>
            <span className="fig-label">Plate I</span>
            Ardnamurchan Point, looking north-west toward the Small Isles. The tower was built by
            Alan Stevenson in 1849.
          </figcaption>
        </figure>

        <div className="article-body">
          {SECTIONS.map((s, i) => (
            <section className="article-section" key={s.id} id={s.id}>
              <div className="rail" aria-hidden="true">
                <span className="rail-num">§ {ord(i)}</span>
                <span className="rail-note">{s.marginNote}</span>
              </div>
              <div className="column">
                <h2>
                  <span className="h2-num" aria-hidden="true">
                    {ord(i)}
                  </span>
                  {s.heading}
                </h2>
                {s.paragraphs.map((p, j) => (
                  <p key={j} className={i === 0 && j === 0 ? 'opener' : undefined}>
                    {p}
                  </p>
                ))}
                {i === 1 && (
                  <blockquote className="pull-quote">
                    <p>
                      Because the logbook admitted only observable facts, it became, accidentally, a
                      nearly perfect climate record.
                    </p>
                  </blockquote>
                )}
              </div>
            </section>
          ))}

          <section className="article-section notes-section" id="notes">
            <div className="rail" aria-hidden="true">
              <span className="rail-num">§ —</span>
              <span className="rail-note">Sources consulted</span>
            </div>
            <div className="column">
              <h2>
                <span className="h2-num" aria-hidden="true">
                  ∗
                </span>
                Notes
              </h2>
              <ol className="notes">
                {NOTES.map((n) => (
                  <li key={n.n} id={`note-${n.n}`}>
                    <span className="note-num" aria-hidden="true">
                      {ord(n.n - 1)}
                    </span>
                    <span className="note-text">{n.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      </article>

      <aside className="reader-rail" aria-hidden="true">
        <ol>
          {SECTIONS.map((s, i) => (
            <li key={s.id} className={active === s.id ? 'is-active' : undefined}>
              <span className="tick" />
              <span className="label">{ord(i)}</span>
            </li>
          ))}
        </ol>
      </aside>

      <section className="section" id="related">
        <h2 className="section-title">
          <span>More from The Marginal</span>
          <i aria-hidden="true" />
        </h2>
        <ul className="related">
          {RELATED.map((r, i) => (
            <li className="related-item" key={r.title}>
              <a href="#related">
                <span className="related-num" aria-hidden="true">
                  {ord(i)}
                </span>
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
            <h2>One essay a fortnight</h2>
            <p>
              No news, no roundups, no comment on the discourse. One long piece about how records get
              made and what they leave out.
            </p>
          </div>
          {subscribed ? (
            <p className="form-success" role="status">
              <span className="tick-mark" aria-hidden="true" />
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
                <button type="submit" className="btn btn-primary">
                  Subscribe
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <footer className="footer" id="site-footer">
        <p>© 2026 The Marginal — published in Glasgow</p>
        <div className="footer-links">
          {FOOTER_LINKS.map((l) => (
            <a key={l.label} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
