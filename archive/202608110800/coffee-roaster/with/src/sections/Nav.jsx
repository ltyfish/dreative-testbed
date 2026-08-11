import { useRoast } from '../roast.jsx'

const LINKS = [
  { href: '#beans', label: 'Beans' },
  { href: '#brew-guide', label: 'Brew Guide' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#subscribe', label: 'Subscribe' },
  { href: '#contact', label: 'Contact' },
]

export default function Nav() {
  const { stage } = useRoast()

  return (
    <nav className="nav" id="site-nav" aria-label="Primary">
      <a className="nav-logo" href="#hero">
        <span className="nav-logo-mark">N</span>
        <span className="nav-logo-text">
          Northwind <em>Coffee Roasters</em>
        </span>
      </a>

      <div className="nav-links">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </div>

      {/* The continuity chip: the current point in the roast, visible on every
          screen of the route, and a way back to the ladder that sets it. */}
      <a className="nav-roast" href="#roast-ladder" data-roast-chip>
        <span className="nav-roast-swatch" aria-hidden="true" />
        <span className="nav-roast-text">
          <span className="nav-roast-label">Roast</span>
          <span className="nav-roast-value">{stage.label}</span>
        </span>
      </a>
    </nav>
  )
}
