# Current run

> Status: implementation and browser review complete; awaiting human taste verdict.

## Run identity

- Commit or branch: `v.20.9-newest-V2` (`uncommitted` until the submission commit below is created)
- Baseline: `baseline`
- Date: `2026-07-27`
- User prompt: `redesign this whole website`
- Dreative/skill version: package `1.2.1`, schema `2`
- Selected direction and configuration: Showcase — From Green Bean to First Pour; Full Audit; cross-domain reference scout; sourced/generated media allowed; focused packages allowed; required prototype; user selected the spatial chamber.

## Product observations

Northwind's specific design material is the 1962 Probat, 12 kg maximum batches, roast-to-shipment under 24 hours, Bergen fishing-shed origin, eleven direct farm relationships, published contracts, and six coffees with distinct tasting profiles. The baseline was a single React/Vite route with a plain linear layout. The redesign preserves five navigation destinations, two hero journeys, all product data and purchase actions, the four-step brew guide, reviews, subscription offer, contact validation/success state, and footer links.

## Decision summary

### Alternatives considered

- Recommended — Roast Ledger: editorial commerce organized around timestamps, contracts, and batch labels.
- Efficient — Bergen Batch Sheet: a typographic and responsive overhaul retaining the current section structure and stack.
- Showcase — From Green Bean to First Pour: a connected transformation in which bean selection propagates through origin, roasting, products, brewing, and subscription.

### Selection and rationale

The user selected Showcase and then explicitly selected the spatial prototype over the bounded SVG roast curve. The final route turns the small batch, old machine, freshness window, and distinct origins into the interaction model rather than presenting those facts as decorative statistics.

### Creative promise

- Product-native concept: follow one selected coffee from green bean through the 1962 Probat, cooling, shipping, and first pour.
- Composition and type voice: cinematic process stages paired with precise batch-ledger typography and legible commerce controls.
- Material, color, and media role: carbon black, heated copper, parchment, and origin-specific accents; procedural spatial media explains physical transformation.
- Experience arc and section ownership: select origin → establish proof → transform in the roaster → choose beans → learn the pour → subscribe/contact.
- Signature behavior and post-hero peak: selected origin drives a continuous spatial roast transformation across charge, drying, first crack, and drop.
- Continuity beyond the hero: origin state changes hero media, live roast identity, selected product, brew copy, and subscription ticket.
- Mobile transformation: a bounded sticky chamber with explicit four-stage touch controls replaces desktop editorial chapters.
- Protected behavior/content: the complete baseline contract.

## Material decision changes

- The production roast mechanism uses native DOM/CSS geometry and a bounded scroll signal instead of Three.js. The prototype showed that real spatial change could be communicated without a GPU runtime or fabricated model asset.
- The desktop roast chapter was tightened from four viewport heights to 2.4 viewport heights after finalizer evidence showed the longer allocation was treated as an untreated region. The four stages and continuous geometry remain.
- Separate legal information views were added for Shipping, Returns, and Privacy because indistinguishable SPA fallbacks were not acceptable preservation.

## What shipped

A full single-route redesign with a batch-ledger hero, three-origin shared-state selector, story and business proof, scroll-authored Probat chamber, six-row coffee catalogue with individual cart feedback, responsive four-step brew ritual, subscriber review field, selected-batch subscription ticket, working contact form, and distinct legal information views. At 390px and 320px the chamber remains in-flow with explicit stage controls, product rows become compact purchase rails, and the subscription ticket stacks.

## Preservation results

- Navigation and hero journeys: pass — five anchors and both hero CTAs are reachable.
- Six product actions: pass — six buttons independently produce named live-region feedback.
- Story, products, guide, reviews, and subscription content: pass — baseline copy and data are present.
- Contact validation and success state: pass — invalid email is rejected and valid submission shows the success view.
- Footer identity and links: pass — identity, Top, Shipping, Returns, and Privacy are present; legal paths render distinct content.

## Verification performed

- Clean install: not rerun; existing lockfile install was used.
- Production build: `npm run build` — pass.
- Other deterministic checks: no project lint, typecheck, or test scripts exist.
- Dreative finalization: pending final rerun after evaluator-required commit.
- Desktop full-page inspection: 1440×1000 — `screenshots/desktop-full.png`; no horizontal overflow.
- Mobile full-page inspection: 390×844 — `screenshots/mobile-390-full.png`; no horizontal overflow.
- Additional Full Audit view: 320×740 inspected; no horizontal overflow.
- Keyboard/touch journey: keyboard focus remained visible; mobile stage buttons and product controls exercised.
- Reduced motion: `prefers-reduced-motion: reduce` resolves scroll behavior to auto and transitions to 0.01 ms.
- Console/network/assets/text integrity: no console errors, page errors, or failed requests in the final automated pass.

## Visual correction pass

The first 320px capture exposed a clipped subscription price column. The ticket now changes to a stacked receipt with a horizontal price divider at narrow widths. Finalizer review also led to readable 11px minimum action labels, removal of sticky-clipping ancestors, a continuous roast geometry signal, distinct legal pages, and shorter authored desktop roast pacing.

## Known limitations and not pursued

Documentary farm/roastery photography was not used because no trustworthy Northwind-specific source assets were supplied; generic stock would imply false provenance. The spatial bean is procedural DOM/CSS geometry, not a photorealistic 3D model. There is no real commerce backend: the preserved baseline behavior is local add-to-cart feedback.

## Reviewer verdict

- Result: awaiting independent review
- Rationale: deterministic and visual checks are builder-observed evidence only; human visual acceptance has not been supplied.
