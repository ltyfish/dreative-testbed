# Current run

> Status: implementation complete; independent visual verdict awaiting user review.

## Run identity

- Commit or branch: `b9bda62`
- Baseline: `baseline`
- Date: `2026-07-30`
- User prompt: `"redesign the whole website"` with later direction: `"showcase"` and craft override: `"all 5, heavy animated, rendered, image editing frame by frame ... modern and clean"`
- Dreative/skill version: `project-local .codex/skills/dreative`
- Selected direction and configuration: `Showcase / Full Audit / cross-domain scout / sourced and generated media / focused packages allowed / prototype required`

## Product observations

Record the baseline facts that materially shaped the design, including at least
three Northwind-specific observations and the behavior that must be preserved.

Northwind's differentiator is verifiable speed: coffee is roasted the morning it
ships and the bag carries a timestamp. Its physical vocabulary includes a 1962
Probat, 12 kg batches, green-to-roasted bean transformation, and Bergen's
industrial setting. The catalogue has six stable products with distinct roast
levels and tasting notes. The redesign must preserve five navigation journeys,
six product actions, the story and statistics, four brew steps, three reviews,
subscription CTA, working contact form, and four footer links.

## Decision summary

### Alternatives considered

Summarize Recommended, Efficient, and Showcase at the concept level. State what
would materially differ; do not reproduce private exploration.

Efficient proposed a typographic Bergen roastery journal while preserving the
baseline structure. Recommended proposed a traceable roast ledger with an
interactive bean selector. Showcase turns a visitor's flavor choice into a
connected green-bean-to-first-pour journey spanning the hero, central roast and
bean peak, brewing, and subscription outcome.

### Selection and rationale

Explain why the selected direction fits this product, audience, content, and
implementation reality. This is a concise conclusion that a reviewer can test
against the result, not a transcript of internal reasoning.

Showcase was explicitly selected. It fits the product because roast development
is both Northwind's core physical transformation and a useful way to connect
taste preference to a concrete buying recommendation. The user explicitly
requested flagship craft in every section and heavy, frame-authored animation,
while constraining the visual language to modern industrial realism.

### Creative promise

- Product-native concept: `A live roast ledger: choose the cup, trace the roast, receive the batch.`
- Composition and type voice: `Large clean grotesk headlines, italic editorial inflection, and compact monospaced batch data in asymmetric industrial layouts.`
- Material, color, and media role: `Near-black machinery, warm metal, off-white ledger stock, one acid-green state color, and photoreal generated roast-stage media.`
- Experience arc and section ownership: `Flavor choice → farm/roaster proof → bean and roast transformation Peak → adapted brew ritual → subscriber proof → tailored subscription.`
- Signature behavior and post-hero peak: `Eight-frame green-to-roasted bean transformation linked to a stable product recommendation.`
- Continuity beyond the hero: `The selected bright/round/deep flavor profile changes the Peak and downstream bean, brew, and subscription states.`
- Mobile transformation: `One-subject tasting deck and full-height roast instrument instead of a shrunken desktop field.`
- Protected behavior/content: `All baseline copy, links, six add-to-cart actions, contact success state, and footer utilities.`

## Material decision changes

Record only changes that alter the promise, allocation, runtime, fallback, or
scope. For each, state the prior decision, new decision, observable trigger, and
product impact. Write `None` if the promise remained stable.

The accepted Experience Map was raised from mixed intensity to craft level 5 in
every section at the user's request. The single Peak remains the bean/roast
transformation so the overall rhythm retains hierarchy.

## What shipped

Summarize the implemented experience in concrete terms. Name the sections and
behaviors that can be seen or exercised in the application.

The real route now ships a modern industrial editorial system, a three-way
flavor control with downstream bean/brew/subscription consequences, six stable
coffee cards, a fully contained twelve-shot Probat sequence, a drawn brew
ritual, subscriber field notes, physical subscription bags, and a working
received-stamp contact state. Desktop and mobile use distinct compositions.

## Preservation results

- Navigation and hero journeys: `pass; five links and shared profile control preserved`
- Six product actions: `pass; all six stable identities add to the batch count`
- Story, products, guide, reviews, and subscription content: `pass`
- Contact validation and success state: `pass`
- Footer identity and links: `pass; four utilities preserved`

## Verification performed

- Clean install: `npm ci was blocked by Windows EPERM file locks from the active preview; npm install restored dependencies`
- Production build: `npm run build; pass`
- Other deterministic checks: `Playwright behavior checks for counts, cart, form, overflow and reduced motion; pass`
- Dreative finalization: `visual smoke passes desktop 1440x900, mobile 390x844, mobile 320x720, and reduced motion; final committed-head check follows this handoff update`
- Desktop full-page inspection: `1440x900; .dreative/evaluation/screenshots/desktop-hero.png and desktop-roast.png`
- Mobile full-page inspection: `390x844; .dreative/evaluation/screenshots/mobile-hero.png and mobile-roast.png`
- Keyboard/touch journey: `buttons, links, menu, product actions and form remain native controls`
- Reduced motion: `verified at 390x844`
- Console/network/assets/text integrity: `no runtime blocker; local generated assets load; favicon 404 removed`

## Visual correction pass

List visible problems found during rendered review and the corresponding fixes.

Raised low-contrast product buttons to black, reduced mobile bag width/rotation
after clipping, kept the complete machine inside contain framing, restored a
real main landmark, removed a prototype stylesheet's global smooth-scroll
collision, increased small operational labels to the readability floor, and
shortened empty mobile spacing.

## Known limitations and not pursued

Document anything promised but not delivered, blocked verification, and any
material treatment rejected or replaced, including why.

The first crossfade and slider prototypes were rejected and not integrated.
The selected sequence uses twelve generated high-resolution PNGs (roughly
19 MB uncompressed), so a future production pass could transcode them to AVIF.
The Google font import remains network-dependent. A clean `npm ci` could not be
repeated while Windows held the active preview's Rollup files.

## Reviewer verdict

- Result: `awaiting independent review`
- Rationale: `Deterministic and viewport checks pass; human taste remains for the user to judge.`
