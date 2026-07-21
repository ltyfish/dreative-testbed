# Test plan

## Purpose

This repository is a deliberately plain Northwind Coffee Roasters page used to
test whether Dreative can turn a realistic baseline into a distinctive,
production-quality frontend without losing required content or behavior.

The `baseline` Git tag is the pristine comparison point. A submitted run should
be judged from its source diff and rendered result, not from generated Dreative
working files.

## Baseline contract

A redesign must preserve or deliberately improve these user-facing capabilities:

- five navigation destinations: Beans, Brew Guide, Reviews, Subscribe, Contact;
- the hero's two primary journeys: shop beans and learn to brew;
- the story copy and four business facts;
- all six products, their identifying details, prices, and add-to-cart actions;
- all four pour-over steps;
- three subscriber reviews;
- the subscription offer and route into contact;
- email and message fields, email validation, submission, and success feedback;
- the footer identity and four footer links.

All visible claims and product data should stay faithful to the baseline unless
the run explicitly documents a user-approved content change.

## Repeatable run process

1. Start from the `baseline` tag or a clean branch created from it.
2. Record the exact user prompt and Dreative/skill version in the run review.
3. Let the agent inspect, plan, implement, and refine the real application.
4. Build the production app and run any deterministic checks available in the
   submitted version of the project.
5. Inspect the complete rendered page at desktop and 390 px mobile widths.
6. Test navigation, all add-to-cart actions, the contact error/success paths,
   keyboard use, and reduced-motion behavior where motion exists.
7. Correct visible or functional failures, then capture only the final evidence.
8. Complete `current-run.md` with facts and known limitations. Do not turn
   planned features into claims about what shipped.

## What to observe

### Product specificity

- Does the design feel derived from small-batch roasting, the 1962 Probat,
  Bergen, farm relationships, batch size, and freshness timestamps?
- Would the composition still make sense if the Northwind name were removed,
  or is it a generic premium-product template?

### Creative direction

- Is there one legible concept expressed beyond the hero?
- Do sections change role, scale, density, or state instead of repeating cards?
- Is there a strong post-hero visual moment and an intentional continuity device?
- Do motion and media explain the product, or merely decorate it?

### Usability and preservation

- Is the primary task obvious and is all baseline behavior still reachable?
- Are labels, prices, product notes, controls, and feedback readable?
- Do direct links, focus order, keyboard activation, touch targets, and form
  states work without surprises?

### Responsive quality

- At 390 px, were order, crop, density, type scale, controls, and motion actually
  reconsidered rather than merely stacked?
- Are there clipped controls, horizontal overflow, content-covering visuals, or
  sticky elements that fail to release?

### Engineering confidence

- Does a clean install and production build succeed?
- Are there console, network, asset, hydration, or text-encoding failures?
- Are advanced runtimes bounded, cleaned up, and given reduced-motion/mobile
  fallbacks?

## Result labels

- **Pass:** the concept is distinctive across the page, the baseline contract
  works, desktop/mobile inspection is clean, and deterministic checks pass.
- **Pass with limitations:** the core result is reviewable and functional, with
  specific non-critical limitations documented.
- **Incomplete:** promised scope is missing, preservation fails, the production
  build fails, or required rendered inspection could not be completed.

Do not use artifact presence, a plan, or a successful command as a substitute
for judging the rendered experience.
