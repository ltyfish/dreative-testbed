# Independent critic review — FAIL

Reviewed the current Northwind source against `.dreative/plan.yaml` and production run `verify-1784364672004-b4a54105` (approved plan hash `b6b03222…`, source hash `780603fc…`, build hash `95ace8a8…`). This is an objective, read-only review of the declared Experimental / Full Audit / Dogfood, all-treatment contract.

## Verdict

**FAIL.** The visual system is polished and recognizably authored, and the recorded frame-rate/transfer observations are encouraging, but the production evidence is fail-closed: **12 of 13 requirement rows fail**, only the contact-form row passes, and the run reconciles only `ux-shell`, `origin-ring`, and `brew-score` while marking `roast-stage`, `batch-journey`, and `ledger-media-reveal` missing. It therefore cannot support Experimental, all-treatment, or Dogfood completion.

## Findings

- **[CRITICAL] Production requirements are not certified.** `verify.json` fails content, navigation, cart, policies, continuity, structural scroll, spatial/3D, cinematic, experimental, responsive, performance, and finalization. Several tests use invalid relative `page.goto("/")` / `page.goto("/privacy")`; desktop navigation waits for the intentionally hidden mobile `.menu-trigger`; cart expects Kenya but observes Ethiopia. These are still blocking test/evidence failures, not passes that may be inferred from screenshots.

- **[CRITICAL] The defining continuity and transformation mechanisms are absent from typed runtime evidence.** Reconciliation marks `roast-stage`, `batch-journey`, and `ledger-media-reveal` missing. Across 35 home observations, `.batch-journey`, `.chapter`, `.ledger-media`, and `.media-fallback` are never present; every observed mechanism has a null state. Plan execution also records `implementationFile: runtime-owner-unresolved`, `structuralDifferenceFromPrevious: 0` for the stage, `mobile.authored: false`, and no reverse-scroll result. This blocks Motion, 3D, Immersive, Cinematic, and Experimental.

- **[HIGH] Content preservation is visibly broken by mojibake.** Current source contains `Â`, `Ã—`, `â€”`, `â€™`, `â€œ`, `â€`, and corrupted arrows in customer-facing copy, prices, policy text, navigation, reviews, temperature, and footer text. The contract explicitly requires fixing corrupted characters while preserving all Northwind copy. The content requirement also fails in the production run.

- **[HIGH] Function preservation is not proven.** Contact invalid/success behavior is the sole passing requirement. Navigation and cart requirements fail; policy screenshots exist but the required route assertion fails. Source provides six cart buttons, five primary anchors, policy routes, subscription CTA, focus styles, menu trapping, and semantic form controls, but a critic cannot promote source plausibility over failed production actions.

- **[HIGH] Media/asset execution deviates from the approved source contract.** `PROVENANCE.md` gives clear generated-image and font-license provenance, so there is no evident third-party-rights violation. However, execution records no assets or bindings, while the plan required external-first searches or documented asset-specific generation exemptions. The plan also says every origin uses a unique source; provenance says six origins are crops of one atlas and `decaf.webp` reuses the Brazil crop. `ledger-media-reveal` is missing, leaving only the origin slice treatment as a demonstrated internal pixel transformation and no second post-hero media transformation.

- **[HIGH] Accessibility and responsive parity are only partially evidenced.** The source includes a skip link, visible focus, menu focus containment, keyboard origin selection, pointer/swipe handling, live regions, labels, and a global reduced-motion rule. Desktop, 390px, 320px, and reduced-motion captures preserve the major sections. Nevertheless `req-responsive` fails, no accessibility audit/contrast result is present, mobile execution is recorded `authored: false`, and many utility labels are only `.5rem`–`.61rem`, materially weakening legibility at 320px. `overflow-x: clip` can conceal overflow rather than prove its absence, although recorded `scrollX` remains zero.

- **[MEDIUM] Performance numbers look viable but the performance gate still fails.** Capture observations report approximately 59.95–60.01 FPS at all five viewports, worst frame time at most 17.3 ms, no long tasks, roughly 791 KB maximum transferred per observed home state, and a 236 KB heavy chunk; the built lazy `RoastStage` file is 875,051 bytes raw and media is well below 4 MB. These support the stated budgets, but `req-performance` fails because its browser action is invalid, a 404 remains in console evidence, and no passing CLS assertion is recorded. Performance is therefore promising, not certified.

- **[MEDIUM] Award-level coherence is uneven.** Desktop/mobile captures show a distinctive editorial-mechanical palette, strong Instrument Serif hierarchy, restrained ember accents, coherent dark/light chapter pacing, a content-specific origin selector, and a clear brew vessel. The hero, origin, and brew chapters carry the concept well. The long normal-motion provenance capture is initially blank because its reveal depends on scroll, later chapters settle into conventional cards/forms, and the missing persistent stage/handoffs leave the page reading as a strong art-directed landing page rather than the promised living cross-section instrument.

## Treatment evaluation

- **UX — FAIL:** sound semantic intent, but navigation/cart/policy/content production requirements fail.
- **Mobile — FAIL:** complete-looking 390/320 layouts and controls exist, but the required responsive assertion fails and execution labels mobile mechanisms unauthored.
- **Refined — FAIL:** visually strong typography, spacing, palette, and chapter hierarchy; mojibake and sub-10px-equivalent utility text prevent a complete refined pass.
- **Motion — FAIL:** GSAP parallax, clip reveal, slice settling, and review-line growth exist, but `batch-journey` is absent and no typed resolved structural state is observed.
- **Interaction — FAIL:** origin keyboard/pointer/swipe and brew buttons are meaningful; required settled/resolved state evidence and cart parity fail.
- **Media — FAIL:** generated roaster/origin imagery is transformed in the origin slices, but the second contracted reveal is missing and asset/source obligations are unreconciled.
- **3D — FAIL:** a procedural multi-part R3F chronometer is implemented and lazy-loaded, but the spatial assertion fails, `roast-stage` is missing from reconciliation, canvas state never becomes typed, and the promised authored fallback evidence is absent.
- **Immersive — FAIL:** a singleton stage is mounted, but evidence shows no persistent cross-section state/structural change and the continuity requirement fails.
- **Cinematic — FAIL:** setup/rest/resolution are visible in page sequencing, but no proven shared-object handoff or resolved `brew-score` state exists.
- **Experimental — FAIL:** the radial origin calibration is content-specific; the brew treatment is comparatively conventional, both typed experimental state assertions fail, and the two promised distributed peaks are not proven.

## Exact blockers to a PASS

1. Produce a fresh source-linked production run in which every requirement row passes; repair invalid route actions, viewport-specific navigation actions, cart expectations, and mechanism-state assertions.
2. Implement or truthfully reconcile all six contracted mechanisms with non-null typed start/active/resolved/mobile/fallback observations; specifically restore/prove `roast-stage`, `batch-journey`, and `ledger-media-reveal`.
3. Remove all customer-visible encoding corruption and re-prove complete content preservation.
4. Prove desktop/mobile/reduced-motion/keyboard/touch parity, reverse behavior where required, no overflow at 320px, accessibility/contrast, CLS, console/network cleanliness, and the performance budgets.
5. Reconcile every shipped asset and fallback with the approved external-first/generation-exemption, uniqueness, rights, and derivative records; supply the missing second internal media transformation.
6. Obtain a fresh independent critic pass, then pass `dreative audit` and `dreative finalize --codex` with `DREATIVE_FINALIZED`.
