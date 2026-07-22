# Current run

> Status: complete and ready for review.

## Run identity

- Commit or branch: `v.20.8-newest` at `a0cc947e12125a6d812c2f0ac3542b7740677cda` (working tree uncommitted)
- Baseline: `baseline`
- Date: `2026-07-22`
- User prompt: “redesign the whole website”
- Dreative/skill version: project-local installed snapshot
- Selected direction and configuration: Showcase — From Green Bean to First Pour; Full Audit; cross-domain reference synthesis; generated imagery allowed; focused packages allowed; prototype required.

## Product observations

Northwind is defined by a 1962 Probat, 12 kg batches, a Bergen fishing-shed origin, eleven direct farm relationships, and roast-to-shipment under 24 hours. The page combines a six-item catalogue with a four-step pour-over guide. The redesign preserves five navigation targets, two hero journeys, all product data/actions, story claims/stats, brewing instructions, reviews, subscription, contact behavior, and footer links.

## Decision summary

### Alternatives considered

The Roast Ledger (Recommended) was a transparent timestamped production record; Bergen Dispatch (Efficient) retained the route structure in a sharper Nordic storefront; From Green Bean to First Pour (Showcase) restructured the route as an interactive transformation from origin through roasting and brewing.

### Selection and rationale

The user selected Showcase. It makes Northwind’s actual production facts—not generic coffee luxury—the organizing logic while preserving the compact React application’s business behavior.

### Creative promise

- Product-native concept: follow one fresh batch from the Bergen shed through heat, selection, brew, and delivery.
- Composition and type voice: industrial display typography, italic sensory notes, and monospaced batch readings.
- Material, color, and media role: cast-iron black, parchment, green-bean acid, furnace ember; generated documentary Probat image, SVG instrument, and CSS bag studies.
- Experience arc and section ownership: documentary hero → story proof → interactive roast transformation → bean catalogue → measured brew ritual → reviews → subscription arrival → contact.
- Signature behavior and post-hero peak: three scrubbed roast states change drum rotation, heat field, temperature, and active phase across a dense 1.9-viewport passage.
- Continuity beyond the hero: circles, timestamps, temperatures, and measurement rules migrate through the route.
- Mobile transformation: bottom-staged hero, oversized off-edge roast instrument, docked phase cards, two-column tasting ledger, and narrow brew measure.
- Protected behavior/content: all baseline content and interactions in `test-plan.md`.

## Material decision changes

The required prototype selected a bounded SVG/DOM roast instrument over WebGL because it preserved phase and temperature legibility on desktop and mobile. During finalization the roast hold was tightened from 3.4 to 1.9 viewports after the visual-smoke checker identified excessive static dwell; all three stages remain.

## What shipped

A full single-route redesign with a generated Probat hero, provenance story, scrubbed three-phase roast chamber, six tactile product studies with working add states, animated four-step brew measure, testimonials, subscription composition, working contact form, and responsive footer. GSAP owns the coordinated scroll animation; native CSS supplies hover, mobile, and reduced-motion states.

## Preservation results

- Navigation and hero journeys: pass; five anchors and both hero links remain.
- Six product actions: pass; six buttons produce named live-region feedback.
- Story, products, guide, reviews, and subscription content: pass; baseline facts and copy retained.
- Contact validation and success state: pass; required email, message field, submit, and success feedback exercised.
- Footer identity and links: pass; identity, Top, Shipping, Returns, and Privacy retained.

## Verification performed

- Clean install: `npm ci` completed with 69 packages and zero vulnerabilities.
- Production build: `npm run build` passed (Vite 6.4.3, 33 modules).
- Other deterministic checks: Playwright checks found 5 nav links, 6 product actions, working success state, no overflow, and no console errors; `/shipping`, `/returns`, and `/privacy` returned HTTP 200 through the SPA fallback.
- Dreative finalization: Showcase visual smoke passed desktop 1440×900, mobile 390×844, mobile 320×720, and reduced-motion mobile; `DREATIVE_CHECKS_PASSED` printed.
- Desktop full-page inspection: 1440×1000, `.dreative/evaluation/screenshots/desktop-full.png`.
- Mobile full-page inspection: 390×844 and 320×700; the stable 390px evidence is `.dreative/evaluation/screenshots/mobile-390-full.png`.
- Keyboard/touch journey: native links/buttons/form controls retained; mobile click journey exercised through Playwright.
- Reduced motion: verified with emulated reduced motion; drum transform is `none`, no overflow or console errors.
- Console/network/assets/text integrity: no browser errors; generated image loads locally; corrected baseline mojibake in degree, multiplication, quote, copyright, and dash characters.

## Visual correction pass

The first full-page render exposed content hidden by reveal opacity, excessive empty roast dwell, tiny utility labels, and a very tall single-column mobile catalogue. The correction removed opacity as a content dependency, raised labels/actions to the readability floor, removed root clipping around sticky scenes, tightened the roast passage, and changed the mobile catalogue to a compact two-column tasting ledger. Working before images remain outside the evaluator package under ignored `.dreative/generated/visual-correction-2026-07-22/`; only stable final evidence is submitted.

## Known limitations and not pursued

A WebGL Probat reconstruction was not pursued: the prototype showed that the lighter SVG instrument communicated roast phase, temperature, and mobile state more directly. Footer policy links intentionally retain the baseline SPA-fallback behavior because no policy copy exists in the product.

## Reviewer verdict

- Result: pass
- Rationale: The selected concept is visible across the entire route, the baseline contract is preserved, deterministic and rendered checks pass, and desktop/mobile correction evidence is current.
