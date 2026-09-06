// PHASE 1 — the signature moment only.
//
// Every fact and behaviour the page owes is still here, untouched, waiting for
// the sections that will carry it. What renders right now is one thing: the
// approach, in src/Approach.jsx.
import Approach from './Approach.jsx'

const HANDLES = [
  { id: 'oak', name: 'Smoked oak', extra: 0, stock: 'in' },
  { id: 'walnut', name: 'Walnut and brass', extra: 40, stock: 'in' },
]

const SPECS = [
  ['Blade length', '210mm'],
  ['Total length', '345mm'],
  ['Weight', '198g'],
  ['Steel', 'Shirogami #2 core, soft iron cladding'],
  ['Hardness', '62–63 HRC'],
  ['Bevel', '70/30 asymmetric, 15° on the primary'],
]

const MAKING = [
  'Every blade is forged, ground and finished by one smith in a workshop outside Takefu. Nothing is stamped and nothing is finished anywhere else.',
  'Eleven knives are made in a month. That is the whole output.',
  'Current lead time is nine weeks from order.',
  'The cladding is forge-welded by hand, so the hamon line where the hard core meets the soft iron is different on every knife and is not decorative.',
]

const CARE = [
  'The steel is not stainless. It will darken and take a patina within a fortnight of use, and that patina is what protects it.',
  'Wash and dry it immediately after use. Never leave it wet and never put it in a dishwasher.',
  'A thin coat of camellia oil if it is going unused for more than a month.',
  'Cut on wood or plastic. A glass or stone board will destroy the edge in one use.',
]

const SHARPENING = {
  offer: 'Send it back for sharpening and reconditioning whenever it needs it.',
  free: 'Free for the first year, including return postage.',
  after: 'After that it is £18 plus return postage.',
}

const NOTES = [
  { name: 'Helen R.', owned: 'three years', text: 'I was worried about the patina and now it is the thing I like most about it. It has a mark from the first time I cut a beetroot and I can still see it.' },
  { name: 'Tomasz W.', owned: 'fourteen months', text: 'I cook for a living and this is the one I take between kitchens. The weight is further forward than you expect for the first week and then you stop noticing.' },
]

const RETURNS = [
  'Unused and unsharpened, back within 30 days for a full refund.',
  'Lifetime guarantee against any failure of the maker’s work — a weld, a crack, a handle coming loose. Not against damage from use, and not against a chipped edge from cutting bone.',
]

export const BASE_PRICE = 280
export { HANDLES, SPECS, MAKING, CARE, SHARPENING, NOTES, RETURNS }

export default function App() {
  return (
    <main>
      <Approach />
    </main>
  )
}
