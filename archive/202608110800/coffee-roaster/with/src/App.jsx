import { RoastProvider } from './roast.jsx'
import Nav from './sections/Nav.jsx'
import Hero from './sections/Hero.jsx'
import Ledger from './sections/Ledger.jsx'
import RoastLadder from './sections/RoastLadder.jsx'
import Beans from './sections/Beans.jsx'
import BrewGuide from './sections/BrewGuide.jsx'
import Reviews from './sections/Reviews.jsx'
import Subscribe from './sections/Subscribe.jsx'
import Contact from './sections/Contact.jsx'
import SiteFooter from './sections/SiteFooter.jsx'

export default function App() {
  return (
    <RoastProvider>
      <div className="page">
        <Nav />
        <main>
          <Hero />
          <Ledger />
          <RoastLadder />
          <Beans />
          <BrewGuide />
          <Reviews />
          <Subscribe />
          <Contact />
        </main>
        <SiteFooter />
      </div>
    </RoastProvider>
  )
}
