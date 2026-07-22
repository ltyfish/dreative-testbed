# Current run

> Status: implementation and builder verification complete; independent review pending.

## Run identity

- Commit or branch: working tree on `main`
- Baseline: `baseline`
- Date: 2026-07-22
- User prompt: “redesidgn the whole website”
- Dreative/skill version: project-local skill snapshot, inspected 2026-07-22
- Selected direction and configuration: Showcase — From Green Bean to First Pour; Full Audit; cross-domain reference scout; sourced/generated media permitted; focused packages permitted; required central-mechanism prototype.

## Product observations

Northwind’s strongest product facts are the 12kg maximum batch, the 1962 Probat, less-than-24-hour roast-to-shipment promise, eleven direct farm relationships, and published contracts at 2.4× commodity price. The page serves both product selection and brewing education. The redesign preserves five navigation destinations, both hero journeys, six purchasable products, the four-step guide, all testimonials, the subscription route, contact validation/success, and four footer links.

## Decision summary

### Alternatives considered

Recommended was a tactile roast ledger organized around timestamped batches. Efficient was a Nordic dispatch bulletin retaining the baseline’s structure. Showcase reframes the complete route as a physical transformation from origin through drum heat to first pour, with meaningful state changes before, during, and after the central roast scene.

### Selection and rationale

The user selected Showcase. The source material has enough process, geography, machinery, and measurable freshness data to support an experiential route without fabricating content. A bounded native prototype showed that a CSS/DOM roast instrument can communicate bean color and timing without the loading, cleanup, and mobile costs of WebGL.

### Creative promise

- Product-native concept: a green bean becomes a shipped roast and then a measured pour.
- Composition and type voice: industrial instrument layouts, large humanist display type, and compact monospaced batch labels.
- Material, color, and media role: Bergen green, parchment, electric freshness yellow, and Probat ember orange; procedural objects make the process legible without unrelated stock photography.
- Experience arc and section ownership: time-stamped hero → transparent roastery proof → selectable origins → interactive roast transformation → stateful brew sequence → subscriber table → subscription decision → contact.
- Signature behavior and post-hero peak: the roast profile changes bean color, temperature, timing, and flavour label through a drag control.
- Continuity beyond the hero: batch coordinates, numbered process chapters, and a moving journey progress line.
- Mobile transformation: chaptered vertical instrument, two-column origin controls, condensed brew accordion, and swipeable subscriber notes.
- Protected behavior/content: the complete baseline contract in `test-plan.md`.

## Material decision changes

A heavy 3D runtime was considered and rejected after prototyping because the process is clearer as an immediate, semantic CSS/DOM instrument. This preserved the Showcase structure and interactive transformation while reducing failure and performance risk. Playwright was added only as a development dependency after browser preflight identified its absence as the sole blocker to rendered verification.

## What shipped

The full route now moves from a timestamped Probat hero through an asymmetric roastery story, selectable origin instrument, six-item purchasing ledger, interactive roast profile, stateful four-step brewing scene, horizontal subscriber table, subscription decision, and working contact endpoint. The three distributed Showcase mechanisms are the origin selector, roast-profile drag control, and brew-step transformation.

## Preservation results

- Navigation and hero journeys: pass — five named destinations and both hero links present and exercised.
- Six product actions: pass — all six buttons clicked and produced bag confirmation.
- Story, products, guide, reviews, and subscription content: pass — baseline copy and product data remain represented.
- Contact validation and success state: pass — malformed email was blocked; valid email/message produced the success state.
- Footer identity and links: pass — Northwind identity and four links present.

## Verification performed

- Clean install: `npm ci` — succeeded; 68 packages installed, zero audit vulnerabilities.
- Production build: `npm run build` — succeeded; Vite transformed 27 modules.
- Other deterministic checks: scripted Playwright checks at 1440, 390, and 320px — zero overflow, console errors, or failed requests; menu and all primary states exercised.
- Dreative finalization: `dreative finalize --codex --profile showcase --visual-smoke-url http://127.0.0.1:4173 --mechanism-contract .dreative/mechanism-contract.json` — all desktop/mobile/reduced-motion samples passed and printed `DREATIVE_CHECKS_PASSED`.
- Desktop full-page inspection: 1440×900, `.dreative/evaluation/screenshots/desktop-full.webp`.
- Mobile full-page inspection: 390×844, `.dreative/evaluation/screenshots/mobile-390-full.webp`; additional 320×700 overflow check passed.
- Keyboard/touch journey: focus-driven brew steps, native buttons/links/inputs, mobile menu, origin selection, cart actions, and contact journey exercised.
- Reduced motion: 320×700 browser context matched reduced motion; CSS disables continuous orbit, transitions, smooth scroll, and progress motion.
- Console/network/assets/text integrity: no console errors, page errors, request failures, or horizontal overflow observed.

## Visual correction pass

Initial desktop and mobile captures revealed that the brew vessel’s handle was clipped by the fill container, causing the cup to read as a beaker. The vessel was restructured so the liquid remains bounded while the handle renders outside the silhouette. Final full-page captures confirm the correction at desktop and mobile.

## Known limitations and not pursued

WebGL/3D was not pursued because the native roast instrument communicates the transformation more directly and avoids disproportionate runtime/mobile cost. The three footer policy destinations remain link surfaces inherited from the baseline; this single-page repository does not implement separate policy content. Google Fonts are remotely hosted, with system-family fallbacks declared.

## Reviewer verdict

- Result: ready for independent review; no builder-authored pass verdict
- Rationale: source implementation, deterministic checks, interaction audit, correction cycle, and final screenshots are available for comparison against `test-plan.md`.
