import { useRoast } from '../roast.jsx'

export default function SiteFooter() {
  const { stage } = useRoast()

  return (
    <footer className="footer" id="site-footer">
      <div className="footer-stamp">
        <span className="footer-stamp-swatch" aria-hidden="true" />
        <span className="footer-stamp-text">
          Last read on this page: <strong>{stage.label}</strong> · 12kg batch · shipped &lt;24h
          after the drum
        </span>
      </div>

      <div className="footer-base">
        <p>© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
        <div className="footer-links">
          <a href="#hero">Top</a>
          <a href="/shipping">Shipping</a>
          <a href="/returns">Returns</a>
          <a href="/privacy">Privacy</a>
        </div>
      </div>

      <p className="footer-credit">
        Photography: Pexels (free to use) — roastery and roast stages by Maksim Goncharenok.
        Typefaces: Zodiak and Supreme by Indian Type Foundry via Fontshare.
      </p>
    </footer>
  )
}
