# Current run

> Status: complete. This record describes the current working tree.

## Run identity

- Commit or branch: `v.20.7-newestV2 (working tree; no commit created)`
- Baseline: `baseline`
- Date: `2026-07-21`
- User prompt: `"redesign this whole website"`
- Dreative/skill version: `workspace .codex/skills/dreative snapshot; CLI v.20.7-newestV2`
- Selected direction and configuration: `Showcase — From Green Bean to Northwind; Full Audit; cross-domain reference scout; sourced/generated media allowed; focused packages allowed; required central-mechanism prototype.`

## Product observations

Northwind is a small Bergen roastery whose strongest proof points are its 1962 Probat, 12 kg maximum batches, sub-24-hour shipment, and eleven direct farm relationships. The content naturally forms a trace from origin through roast, tasting, brewing, and subscription. The redesign preserves five navigation targets, two hero journeys, six product actions, the complete brew guide, reviews, contact validation/success, and footer identity/links.

## Decision summary

### Alternatives considered

Recommended treated the page as a tactile roast ledger; Efficient used a restrained Bergen counter and preserved the baseline section order; Showcase turns the route into a staged origin-to-cup journey with a live roast transformation, tasting tickets, and a timed brewing sequence.

### Selection and rationale

Showcase was explicitly selected. It turns the unusually specific combination of a Norwegian fishing-shed origin, an antique batch roaster, freshness timestamps, and sensory vocabulary into interface structure rather than surface decoration. Reference scouting contributed isolated principles only: chart hierarchy from Norwegian hydrographic publications, progressive heat/color measurement from Probat documentation, and categorical sensory vocabulary from SCA material.

### Creative promise

- Product-native concept: `A batch trace following green coffee from origin through heat, tasting, brewing, and dispatch.`
- Composition and type voice: `Wide cinematic stages, instrument labels, expressive editorial display type, and dense tasting tickets.`
- Material, color, and media role: `North Sea blue warms through parchment and copper to ember; custom SVG/CSS visuals explain geography, roasting, and brewing.`
- Experience arc and section ownership: `Hero/origin → story/proof → roast/peak → beans/tasting rail → guide/timed ritual → reviews/proof → subscription/contact.`
- Signature behavior and post-hero peak: `A scroll-responsive roast chamber changes temperature, color, bean state, and stage copy, with direct controls.`
- Continuity beyond the hero: `Batch codes, timestamps, coordinates, and instrument labels connect every stage.`
- Mobile transformation: `The roast becomes a compact directly controlled scene; products, guide steps, and reviews become clearly cued snap rails.`
- Protected behavior/content: `All baseline claims, products, prices, notes, routes, controls, validation, and success feedback.`

## Material decision changes

The central prototype showed that native scroll state plus SVG/CSS could deliver the bounded roast transformation, reversible direct controls, mobile form, and reduced-motion fallback. GSAP/3D/video were therefore replaced by a lighter semantic mechanism without reducing the promised experience. A focused Playwright development dependency was added after the initial browser probe found an executable but could not launch controlled verification.

## What shipped

A complete origin-to-cup route: navigational origin-chart hero; roastery story and proof statistics; five-state pinned roast chamber; six horizontally browsable sensory tickets with working cart count; timed four-step pour-over ritual; subscriber field notes; dispatch-focused subscription offer; and validated contact form with success state. Mobile navigation, snap-rail cues, 320 px layouts, focus styles, skip navigation, and reduced-motion behavior are included.

## Preservation results

- Navigation and hero journeys: `Pass — all five destinations and both hero CTAs remain reachable.`
- Six product actions: `Pass — all six controls increment the visible bag count to 06; repeated additions remain possible.`
- Story, products, guide, reviews, and subscription content: `Pass — all baseline facts, items, prices, notes, steps, quotes, and offer text remain present.`
- Contact validation and success state: `Pass — invalid email is blocked; valid email/message submission shows status feedback.`
- Footer identity and links: `Pass — identity, Top, Shipping, Returns, and Privacy remain; direct footer paths return HTTP 200 in Vite.`

## Verification performed

- Clean install: `npm ci — passed.`
- Production build: `npm run build — passed.`
- Other deterministic checks: `No lint/typecheck/test scripts are defined. Playwright audit found no document overflow or console errors at 1440, 390, or 320 px.`
- Dreative finalization: `dreative finalize --codex — passed and printed DREATIVE_FINALIZED after a clean rebuild.`
- Desktop full-page inspection: `1440×1000; .dreative/evaluation/screenshots/desktop-full.png. The pinned-scene gap is a full-page capture limitation, so interaction.png records the scene truthfully.`
- Mobile full-page inspection: `390×844; .dreative/evaluation/screenshots/mobile-390-full.png — clean composition and no horizontal document overflow.`
- Keyboard/touch journey: `Skip link receives first focus and activates; native buttons/links are keyboard operable; mobile menu and direct roast stage controls work.`
- Reduced motion: `320×720 Playwright context with reduced motion; animations and sticky duration collapse to a static semantic roast scene; no overflow or errors.`
- Console/network/assets/text integrity: `No console errors; route responses 200; no mojibake; Google font failure retains declared system fallbacks.`

## Visual correction pass

The initial 390 px render made the product, brew, and review rails look accidentally clipped. Explicit directional rail cues, visible next-item peeks, and compact snap widths were added; the final mobile capture makes horizontal continuation perceptible. The default pinned roast sequence produces blank duration in a single full-page screenshot, so a dedicated viewport capture was added instead of presenting the misleading full-page artifact as proof of the interaction.

## Known limitations and not pursued

The external font request depends on network availability but has safe fallbacks. GSAP, WebGL/3D, generated imagery, and video were not pursued because the prototype demonstrated that custom SVG/CSS could carry the roast meaning, responsive transformation, and fallback more coherently with lower runtime cost. Footer legal routes are Vite SPA fallbacks because the baseline contains links but no separate legal page content.

## Reviewer verdict

- Result: `Pass`
- Rationale: `The product-specific concept continues below the hero, the post-hero roast peak is observable, all preservation checks pass, desktop/mobile/reduced-motion states were inspected, visible mobile ambiguity was corrected, and deterministic checks pass.`
