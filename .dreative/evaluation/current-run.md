# Current run

> Status: Showcase prototype comparison in progress. Full-route integration and
> final verification have not started.

## Run identity

- Commit or branch: `v.20.12` at `2b59de8`; redesign changes currently uncommitted
- Baseline: `baseline`
- Date: `2026-07-29`
- User prompt: `"redesign this whole website"`
- Dreative/skill version: `1.3.2`
- Selected direction and configuration: `Showcase / Full Audit / scout 2–4 cross-domain references / sourced and generated media allowed / focused packages allowed / required prototype`

## Product observations

Northwind is a deliberately plain single-page roastery site whose strongest
product truths are a working 1962 Probat, a less-than-24-hour roast-to-dispatch
promise, a 12kg maximum batch, and direct relationships with eleven farms. Its
content naturally forms a journey from morning roast to origin, product choice,
brewing, subscriber proof, and subscription.

The redesign must preserve five navigation destinations, two hero journeys, all
story copy and facts, six products and cart actions, four brew steps, three
reviews, the subscription offer, contact validation and success, and four
footer links.

## Decision summary

### Alternatives considered

Efficient proposed a typographic Morning Dispatch retaining the baseline
structure. Recommended proposed a traceability-led Roast Ledger with an
editorial production-record composition. Showcase proposed From Shed to Cup:
a connected roast journey where one useful taste-profile choice transforms
non-adjacent regions before, during, and after the product Peak.

### Selection and rationale

The user selected Showcase and explicitly requested intensity 5 throughout,
more animation, and a modern, clean, aesthetic character. The concept can
distribute flagship craft across every section while preserving one clear Peak
in the monthly bean field. A required prototype compares two final-worthy
interaction models before either is integrated.

The user selected the Calibrated Arc prototype. Its direct three-state model is
being integrated as the source of shared `roastProfile` state.

### Creative promise

- Product-native concept: `From Shed to Cup — freshness, origin, and heat form one connected roast interface`
- Composition and type voice: `clean spatial fields, precise grotesk hierarchy, large product statements, and calibrated technical metadata`
- Material, color, and media role: `mineral off-white, near-black, controlled ember accents, tactile coffee imagery, and product-native SVG/spatial geometry`
- Experience arc and section ownership: `live roast → provenance proof → bean transformation → brewing consequence → subscriber proof → subscription decision → human contact`
- Signature behavior and post-hero peak: `a roast-profile choice causes the six-bean field to reorganize around a concrete recommendation`
- Continuity beyond the hero: `shared roastProfile state changes hero framing, bean recommendation, brew guidance, and subscription pairing`
- Mobile transformation: `bounded focal subject, stepped thumb control, vertical proof itinerary, snap product sequence, and sticky-free brew/contact sections`
- Protected behavior/content: `all baseline copy, destinations, products, actions, form behavior, and footer routes`

## Material decision changes

The initial recommended Experience Map used varied intensity. At the user's
request, every section now targets intensity 5 with more motion. One Peak remains
in `#beans`; rest and release sections receive flagship craft through evolving
evidence, geometry, and composition rather than competing spectacle.

## What shipped

Two executable, final-worthy prototype routes now compare the riskiest shared
interaction with the same Northwind content and responsive coverage:

- `/prototype/arc` — direct three-state Calibrated Arc with a central roast subject;
- `/prototype/field` — spatial Taste Field with drag, keyboard, and direct-node input.

The user selected `/prototype/arc`. The integrated checkpoint now includes the
responsive hero control, Probat/farm proof handoff, a six-product field that
reorders around the selected recommendation, all six working cart actions, and
a scroll-authored brew consequence. The lower route is structurally present but
has not completed its Showcase polish or full audit.

Generated roast-process media is stored at
`public/media/northwind-roaster.png`; its project-local generation notes are in
`public/media/README.md`.

## Preservation results

- Navigation and hero journeys: `not yet run`
- Six product actions: `not yet run`
- Story, products, guide, reviews, and subscription content: `not yet run`
- Contact validation and success state: `not yet run`
- Footer identity and links: `not yet run`

## Verification performed

- Clean install: `not yet run`
- Production build: `npm run build` passed for the prototype source
- Other deterministic checks: `dreative preflight --probe-browser http://127.0.0.1:4173/prototype/arc` verified browser launch and preview navigation; `node scripts/capture-prototypes.mjs` passed four responsive interaction cases with no overlays, horizontal overflow, console errors, page errors, or failed requests
- Dreative finalization: `not yet run`
- Desktop full-page inspection: `1440×900 prototype captures at prototype-evidence/arc-desktop.png and prototype-evidence/field-desktop.png`
- Mobile full-page inspection: `390×844 prototype captures at prototype-evidence/arc-mobile.png and prototype-evidence/field-mobile.png`
- Keyboard/touch journey: `direct controls exercised for Calibrated Arc; pointer drag and arrow-key control exercised for Taste Field`
- Reduced motion: `not yet run`
- Console/network/assets/text integrity: `not yet run`

## Visual correction pass

The first desktop capture exposed a missing favicon request. An inline Northwind
favicon removed the 404; all four comparison cases were recaptured cleanly.

The integrated checkpoint correction pass also reduced desktop hero scale so all
three profile choices fit in the first viewport, reordered the mobile selector
before the focal dial, corrected the mobile story image fill, and made the
compact brew instrument sticky through later recipe steps.

## Known limitations and not pursued

The selected prototype and full-route implementation are pending user review.
The dedicated `agent-browser` CLI was unavailable; the Dreative browser probe
verified Playwright and Chrome, and the reproducible Playwright capture script
was used instead.

## Reviewer verdict

- Result: `awaiting independent human review`
- Rationale: `Technical and visual verification are incomplete.`
