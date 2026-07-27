# Current run

> Status: implementation and rendered verification complete; final clean-tree
> Dreative rerun pending evaluator commit.

## Run identity

- Commit or branch: `v.20.10` (implementation commit pending)
- Baseline: `baseline`
- Date: `2026-07-27`
- User prompt: `"redesign the whole website"`
- Dreative/skill version: workspace Dreative skill snapshot
- Selected direction and configuration: `Showcase — From Green Bean to First Pour; Full Audit; sourced/generated media and focused packages allowed; required prototype; every section explicitly increased to intensity 5/5.`

## Product observations

Northwind is a small-batch Bergen roaster whose strongest product facts are the
1962 Probat, 12 kg batches, roast-to-shipment under 24 hours, and direct farm
relationships. The page is a catalogue, process explanation, trust argument,
and subscription funnel. Five navigation destinations, two hero journeys, all
six products and purchase actions, the complete brew guide, three reviews,
subscription offer, contact behavior, and footer links were protected.

## Decision summary

### Alternatives considered

Recommended proposed a tactile Roast Ledger around timestamps and provenance.
Efficient proposed a Bergen Roastery Journal retaining the baseline structure.
Showcase proposed a connected spatial journey in which roast profile propagates
through roasting, product selection, brewing, proof, subscription, and contact.

### Selection and rationale

Showcase was explicitly selected. It exposes Northwind's product tension:
industrial heat and precision produce a fleeting fresh product. Distinct
spatial, tactile, typographic, and timed mechanisms carry the requested 5/5
intensity without hiding commerce or copy.

### Creative promise

- Product-native concept: `From Green Bean to First Pour`
- Composition and type voice: `process-led spatial chapters; industrial labels with expressive editorial display type`
- Material, color, and media role: `charred iron, hot copper, parchment, and live geometry explaining temperature and transformation`
- Experience arc: `live batch → spatial roast → reactive catalogue → timed brew → subscriber proof → recurring cycle → contact`
- Signature behavior: `roast choice drives a Three.js drum and continues into catalogue emphasis, subscription atmosphere, and the final readout`
- Continuity beyond hero: `one shared roast profile, batch timestamp, heat curve, and drum geometry`
- Mobile transformation: `thumb controls, bounded spatial viewport, two-column product field, vertical brew choreography, and reduced camera travel`
- Protected behavior/content: `all baseline claims, products, actions, navigation, form behavior, and footer destinations`

## Material decision changes

The user changed the initial varied-intensity map to 5/5 throughout. A required
prototype compared bounded DOM/SVG depth with real-time 3D; the user selected
the spatial version. The mobile roast chapter was later compressed from 3.2 to
2.4 viewports because rendered verification showed the longer dwell added no
useful state.

## What shipped

The route now presents a live batch hero, origin-led story, three-stage spatial
roast transformation, six-origin reactive catalogue, interactive four-step brew
sequence, dimensional subscriber field notes, roast-colored subscription cycle,
working contact channel, and selected-roast footer. Light, medium, or dark state
propagates through five non-adjacent regions.

## Preservation results

- Navigation and hero journeys: `Pass — five destinations and both hero CTAs are reachable.`
- Six product actions: `Pass — every Add to batch control produces confirmation.`
- Story, products, guide, reviews, subscription: `Pass — baseline copy and data preserved.`
- Contact validation and success state: `Pass — required email, message, submission, and success verified.`
- Footer identity and links: `Pass — identity, Top, Shipping, Returns, and Privacy preserved.`

## Verification performed

- Clean install: `npm install completed; npm audit reports one high-severity transitive advisory.`
- Production build: `npm run build passed.`
- Other deterministic checks: `Dreative browser preflight passed; Playwright preservation script passed.`
- Dreative finalization: `Visual smoke passed desktop, 390px, 320px, and reduced motion; final clean-tree rerun pending this evaluator commit.`
- Desktop inspection: `1440×1000 — .dreative/evaluation/screenshots/after-desktop.png`
- Mobile inspection: `390×844 and 320×720 — after-mobile.png and after-narrow.png`
- Keyboard/touch journey: `Semantic controls, labels, pressed states, focus styles, and mobile targets verified.`
- Reduced motion: `390×844 media query and static fallback verified — reduced-mobile.png`
- Console/network/assets/text: `No application console errors or horizontal overflow; protected direct links return 200.`

## Visual correction pass

The first capture showed scroll-reveal content missing from stitched screenshots;
removing opacity ownership made all content visible before animation. The 3D
prototype initially overwhelmed copy; camera depth and scale were corrected.
Smoke review raised micro-label sizes, found a clipped sticky ancestor, and
exposed canvas resize lag. Labels were enlarged, sticky geometry was unclipped,
and ResizeObserver now synchronizes WebGL dimensions with scroll geometry. The
mobile catalogue became a two-column spatial field to remove an inert long run.

## Known limitations and not pursued

Three.js produces a Vite chunk-size warning (about 794 kB uncompressed); DPR is
capped and runtime resources are cleaned up. Generic stock coffee photography
was rejected because it weakened the machine, timestamp, and batch premise. The
bounded SVG prototype remains comparison evidence only.

## Reviewer verdict

- Result: `Awaiting independent human review`
- Rationale: `Builder-observed checks are recorded above; no independent taste verdict has been authored.`
