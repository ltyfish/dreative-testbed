# Current run

> Status: implementation and rendered review complete; independent reviewer verdict pending.

## Run identity

- Commit or branch: `f9d16d00642b8220b22b919fac2c2456d27fe75d`
- Baseline: `baseline`
- Date: `2026-07-25`
- User prompt: “redesign the whole website”
- Dreative/skill version: project-local Dreative snapshot
- Selected direction and configuration: Showcase; Full Audit; cross-domain scout; sourced/generated media allowed; focused packages allowed; required prototype

## Product observations

Northwind is a deliberately small Bergen roastery: two roasters, one 1962 Probat, 12kg maximum batches, eleven farm relationships, contracts averaging 2.4× commodity price, and shipment within 24 hours. The design preserves the complete six-bean catalogue, pour-over guide, reviews, subscription, contact workflow, navigation, and footer links. The strongest product tension is old industrial machinery producing unusually time-sensitive freshness.

## Decision summary

### Alternatives considered

Efficient was a compact production-sheet redesign retaining the route structure. Recommended was a timestamp-led roast ledger with an editorial catalogue. Showcase was selected as a stateful journey from origin choice through physical roasting to the customer’s pour.

### Selection and rationale

The product already describes a real transformation, so a journey makes its strongest claims—origin, batch size, temperature, freshness, and brewing—observable rather than decorative.

### Creative promise

- Product-native concept: follow one small batch from origin to first pour.
- Composition and type voice: industrial labels against large editorial headlines and changing spatial stages.
- Material, color, and media role: charcoal iron, mineral paper, fresh acid green, heat orange, and one documentary Probat image.
- Experience arc and section ownership: timestamp hero → business proof → origin decision → roast transformation → brew ritual → subscriber proof → subscription decision.
- Signature behavior and post-hero peak: four-state scroll-authored roast chamber; four-state brew apparatus after the peak.
- Continuity beyond the hero: timestamps, numbered process stages, batch data, and material changes from green to roasted.
- Mobile transformation: compact numbered origin tabs, complete product ledger, scaled roast chamber, vertical brew apparatus, and horizontal review rail.
- Protected behavior/content: all baseline content, destinations, six add actions, validation, success feedback, and footer links.

## Material decision changes

The first full-page inspection showed that the initial 400vh/300vh roast duration created a visually empty interval between the central peak and brew ritual. It was tightened to 280vh desktop and 190vh mobile while preserving four process states. WebGL was not integrated: the bounded prototype kept the process more legible and gave mobile a faithful fallback.

## What shipped

A documentary Probat hero with roast timestamp; Northwind-specific story and operating facts; six-state origin/profile selector plus complete mobile product ledger; scroll-controlled roast drum with physical bean, temperature, copy and progress changes; four-state direct-manipulation brew illustration; review rail; subscription offer; and contact/footer resolution.

## Preservation results

- Navigation and hero journeys: pass; all five destinations and both hero journeys remain.
- Six product actions: pass; automated interaction tested every origin and confirmed bag count 06.
- Story, products, guide, reviews, and subscription content: pass.
- Contact validation and success state: pass; invalid email did not submit and a valid message reached the success state.
- Footer identity and links: pass.

## Verification performed

- Clean install: not rerun; existing lockfile and installed dependencies were used.
- Production build: `npm run build` passed.
- Other deterministic checks: no lint, typecheck, or test scripts are defined.
- Dreative finalization: visual smoke and production build passed; handoff checks are rerun after the source commit.
- Desktop full-page inspection: 1440×900, `.dreative/evaluation/screenshots/desktop-full.webp`.
- Mobile full-page inspection: 390×844, `.dreative/evaluation/screenshots/mobile-390-full.webp`; 320px overflow check also passed.
- Keyboard/touch journey: native buttons, links, form controls and focus order retained; click/touch primary journey automated.
- Reduced motion: verified at 320×720; sticky sequence collapses to one viewport and transitions are removed.
- Console/network/assets/text integrity: zero browser console errors; generated image loaded; corrected source encoding is clean.

## Visual correction pass

Desktop and mobile before-captures exposed an overlong pale interval in the sticky roast sequence. Reducing its scroll duration materially tightened the handoff to the orange brew section without removing the four observable roast states.

## Known limitations and not pursued

Decorative pour video was rejected because it duplicated the interactive brew content. WebGL volumetric roasting was replaced by a bounded DOM/CSS mechanism because the prototype comparison favored process clarity and mobile continuity. Google Fonts rely on network availability and fall back to local sans/serif/monospace families.

## Reviewer handoff

The independent reviewer verdict is intentionally left open. Builder-observed checks and limitations are recorded above.
