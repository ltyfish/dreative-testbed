# Current run

> Status: implemented and browser-verified; deterministic finalization will run against the committed source.

## Run identity

- Commit or branch: `v.20.9-newest` at `8d878b2` plus uncommitted changes
- Baseline: `baseline`
- Date: `2026-07-27`
- User prompt: `redesign the whole websaite`
- Dreative/skill version: repository snapshot at `.codex/skills/dreative`
- Selected direction and configuration: `Showcase — From Origin to Cup`; Full Audit; 2–4 cross-domain references; sourced/generated media permitted; focused packages permitted; Required prototype.

## Product observations

Northwind's differentiating facts are the 1962 Probat, 12kg maximum batches, Bergen fishing-shed origin, roast-to-shipment time under 24 hours, eleven direct farm relationships, and 2.4× commodity-price payment. The primary task is choosing one of six beans; the secondary task is learning a four-step pour over. The redesign must preserve five navigation destinations, two hero journeys, six add actions, contact validation/success, all supplied copy and facts, and four footer links.

## Decision summary

### Alternatives considered

Recommended treated the page as a provenance-and-freshness roast ledger with editorial composition. Efficient retained the baseline section structure as a packaging-inspired batch catalogue. Showcase creates a stateful journey from origin through roast and extraction to subscription, with one roast preference affecting separated regions and a scroll-authored heat transformation.

### Selection and rationale

Showcase fits because the content already contains a genuine transformation—green seed to roasted bean to brewed cup—and enough real process data to support a cinematic journey without inventing claims. It differs structurally from an editorial landing page through shared roast state and a long-form transformation scene.

### Creative promise

- Product-native concept: A visitor carries a chosen roast signal from origin to cup.
- Composition and type voice: Industrial measurement labels interrupted by large, expressive process typography.
- Material, color, and media role: Cold near-black Bergen atmosphere, warm roast-state accents, paper-toned information rests, and one generated documentary roaster image.
- Experience arc and section ownership: timestamped hero → origin proof → stateful bean selection → pinned roast transformation → tactile brew sequence → subscriber proof → profile-aware subscription decision.
- Signature behavior and post-hero peak: Light/medium/dark state propagates across hero, catalogue, roast chamber, and subscription; the roast chamber is the main scroll-authored peak.
- Continuity beyond the hero: Temperature, accent, tasting language, and matching products carry the chosen profile.
- Mobile transformation: The pinned desktop chamber becomes a bounded cinematic lead followed by readable sequential roast stages; catalogue rows collapse into high-priority product/action pairs.
- Protected behavior/content: Entire baseline contract in `test-plan.md`.

## Material decision changes

None at configuration time.

## What shipped

The single page now carries a selectable light/medium/dark roast profile through a timestamped hero, profile-ranked six-bean catalogue, scroll-authored four-phase roast chamber, brewing sequence, reviews, and profile-aware subscription offer. Mobile releases the pinned scene into one image-led chamber followed by four readable stages. The add actions use an accessible live status message; the contact form retains validation and success feedback. Shipping, returns, and privacy now resolve to distinct information routes instead of indistinguishable Vite fallbacks.

## Preservation results

- Navigation and hero journeys: pass — five section links and both hero CTAs remain.
- Six product actions: pass — all six buttons were clicked in Chromium and each produced the live cart notice.
- Story, products, guide, reviews, and subscription content: pass — all baseline text and data remain visible.
- Contact validation and success state: pass — required email semantics remain; valid submission produced the supplied success message.
- Footer identity and links: pass — identity, Top, Shipping, Returns, and Privacy remain; the three direct routes are now distinct.

## Verification performed

- Clean install: not repeated; dependencies were installed with `npm install` and audited.
- Production build: `npm run build` passed; 33 modules transformed.
- Other deterministic checks: `npm audit --omit=dev` found 0 production vulnerabilities; `git diff --check` found no whitespace errors.
- Dreative finalization: pending exact committed source; standalone Showcase visual smoke passed desktop, 390px, 320px, and reduced-motion passes.
- Desktop full-page inspection: 1440×900; `.dreative/evaluation/screenshots/desktop-full.webp`; inspected with a separate mechanism view because sticky scenes distort stitched full-page captures.
- Mobile full-page inspection: 390×844; `.dreative/evaluation/screenshots/mobile-390-full.webp`; no horizontal overflow.
- Keyboard/touch journey: native anchors, buttons, fields, labels, focus path, and mobile actions retained; add targets measured approximately 60×44px.
- Reduced motion: 390×844 with emulated reduced motion; orbit transform computed as `none` and sequential stages remained readable.
- Console/network/assets/text integrity: no console errors or failed requests in the final scripted journey; 320px and 390px reported zero horizontal overflow.

## Visual correction pass

The first 390px capture showed product names, tasting notes, prices, and add buttons colliding. The product rows were rebuilt as a two-column hierarchy with a dedicated second price row and minimum 44px actions. The audit also found sub-floor utility type, overly long pinned travel, indistinguishable legal routes, weak sampled state propagation, and a wrongly full-page prototype capture. Labels/actions were raised to 12px, the roast chamber was shortened while retaining four stages, distinct legal routes were added, a dedicated three-state continuity control and observable phase display were introduced, and the prototype was recaptured at 1440×900.

## Known limitations and not pursued

Generic farm-stock photography and decorative 3D coffee beans were rejected: neither would prove Northwind's sourcing claims or explain the roast transformation. Generated video was not used because the spatial DOM/image chamber delivered the selected transformation with lower loading and accessibility cost. The generated roaster image is atmospheric rather than documentary evidence and is not presented as a literal photograph of Northwind's machine. Google Fonts remain network-hosted; system fallbacks are declared.

## Reviewer verdict

- Result: `incomplete`
- Rationale: Source and browser verification pass, but the repository requires finalization against a committed source state before this can be updated.
