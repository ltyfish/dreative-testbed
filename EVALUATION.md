# How to score a comparison

You do not need design training to score these well. You need to look at two images and
answer specific questions honestly. Vague questions ("which is better?") are what make
non-designers feel unqualified; specific questions are answerable by anyone.

Score each criterion **A / Tie / B** in the blind comparison page.

---

## Distinctiveness

> Could this be any other company? Does it look like a template with the words changed?

The concrete test: mentally swap the logo and copy for a different business in the same
field. If the design still works perfectly, it is generic. Good design breaks when you
swap the product out, because it was built around that product.

Watch for the standard AI-generated house style: a centred hero with a gradient, three
evenly-weighted feature cards with small icons, a soft purple-blue palette, rounded corners
everywhere, and a pricing table with the middle plan highlighted. That is a template.

## Fit to the product

> Does the design say something true about this specific business?

A coffee roastery that grinds beans on a 1962 machine and a B2B analytics tool should not
be able to share a design language. Ask what the design is claiming about the business, and
whether that claim is true.

Failure mode: **decoration that contradicts the product.** Cinematic dark drama on a free
health clinic is not neutral, it is wrong — it makes an anxious user feel they are in the
wrong place.

## Hierarchy and pacing

> Does your eye know where to go? Do sections have different weight?

Squint at the full-page screenshot until it blurs. You should still see structure: some
areas heavy, some light, an obvious entry point. If the blurred page is an even grey
texture from top to bottom, everything is competing and nothing is leading.

## Craft

> Spacing, type, alignment, colour, edges.

This is the most learnable criterion and the one where you can be objective:

- Do things that should line up line up?
- Is spacing consistent, or arbitrary between similar elements?
- Is any text too small or too low-contrast to read comfortably?
- Are there awkward gaps, orphaned words, or elements crowding a container edge?
- Does anything overlap or get clipped?

Count the defects in each. It is genuinely that mechanical.

## Material — not a separate score

There is no seventh criterion; this feeds Craft and Distinctiveness. It is here
because it is the defect this project has spent the most rounds on and the one
easiest to misread from a screenshot.

Go section by section and name **what holds it** — the thing your eye lands on
first — and whether that thing is real material (a photograph, a render, a
model, a real texture) or something the build drew (SVG, CSS gradients, canvas
geometry). Then count.

- A page can ship real photographs and still be *made of drawings*, if every
  focal moment is drawn and the photographs sit in strips, cards, or a
  below-fold gallery. That is what "it's all SVG" usually means, and it is a
  placement failure, not a sourcing one. `202608241142` shipped five sourced
  photographs and read as vector-built.
- Drawn **notation** does not count against a build: charts, icons, marks,
  diagrams, annotation drawn over a photograph. The question is only whether a
  drawn thing is standing in for something physical that could have been
  photographed.
- Untextured construction is the specific tell — flat fills, invented colour,
  edges too clean, gradients standing in for light.

Then ask what the material is *doing*. Sourced stills that only fade in are
decoration; a page whose transitions feel absent is often a page with nothing
animatable in it, because a flat vector offers only position, scale and opacity.

Both arms get judged the same way. A control that never sources anything is not
excused for it, and a skill arm that sources well and places badly does not get
credit for the asset directory.

## Mobile

> Is the 390px version designed, or is it the desktop layout surviving?

A designed mobile view makes different decisions: different type scale, different section
order sometimes, navigation that suits a thumb. A surviving one is the desktop layout with
columns stacked, tiny text, and a hero that now takes three screens to scroll past.

Check specifically: horizontal overflow, collided text, buttons under 44px, and whether the
most important information is still above the fold.

## Restraint

> Is the effort spent where it matters, or is there decoration doing no work?

For every visible effect, ask what it is *for*. An animation that helps you understand a
process earns its place. An animation that exists because the section looked empty does not.

This is the criterion most likely to reveal that a design skill is over-firing.

---

## Overall

> Which would you actually ship for this client?

Not which is more impressive. Which would you defend to the person paying for it. These
come apart more often than you would expect, and the gap between them is where "AI slop"
actually lives — output that is impressive at a glance and indefensible on inspection.

---

## Notes field

Write two things, always:

1. **The worst thing about the winner.**
2. **The best thing about the loser.**

Forcing both prevents the write-up from collapsing into a verdict you already held, and
over a few rounds these two lines will be more useful than the scores.
