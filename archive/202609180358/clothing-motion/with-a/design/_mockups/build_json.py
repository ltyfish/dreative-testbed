# -*- coding: utf-8 -*-
import json

plan_a = """THE BOLT - one continuous cloth that the whole shop is cut out of.

THE IDEA
One unbroken column of real cloth photography runs from the first pixel of the hero to the
footer. Every garment is literally a hole cut in it: a garment-shaped knockout through which
you see that garment's own fabric at macro scale, so scrolling the page feels like unrolling
a bolt across a cutting table. The brand line "Cut from one cloth" is not a slogan pasted on
a hero - it is the page's construction, and it is still true at the size chart and the footer.

THE JOURNEY
1. Hero (design/a-1-open.png) - full-bleed indigo denim, the Chore Jacket outline scored into
   it in hairline, "CUT FROM / one cloth" in Bodoni 900 + italic, the shop's real promise
   underneath, and a mono rule across the foot.
2. THE BOLT (design/a-2-bolt.png) - three full-height cloth ribbons, one per garment, each
   with the garment cut out of it and its real fabric statement, detail sentence, price and
   colours set alongside. Tonal range is deliberate: indigo denim, then camel alpaca, then
   grey brushed wool, so the middle of the page develops rather than repeats.
3. The transition (design/a-x-dis.png) - the focal set-piece. The cloth quantises: a canvas
   mosaic whose block size is driven by scroll position, running from raw weave at the top to
   large flat tiles at the bottom. The last row of tiles resolves into the product grid's
   column rhythm, so the shop is the cloth, resolved. This is the "carries the visual idea
   into the shopping experience" requirement, answered by one mechanism rather than four.
4. Shop (design/a-3-shop.png) - nine cards, each a cloth plate with its garment knocked out.
   Filter pills with live counts and the All state, size row with sold-out sizes struck by a
   hatched fill (not just dimmed), "Choose a size" disabled state on the add button, and a
   persistent bag panel naming garment + size + price per line, an x per line, a running
   subtotal and a free-delivery progress rule.
5. Ending (design/a-4-end.png) - the full size chart set as a measured plate, care and
   shipping as two hairline-ruled columns, three reviews as Bodoni italic pull quotes, the
   three shop facts as 11 / 4 / 0 numerals, then the wordmark in difference blend over a last
   run of wool.

MOTION - what changes, what drives it, where it resolves
- Owner: one scroll-progress source (IntersectionObserver + rAF), no smooth-scroll library.
  Native scrolling is preserved.
- The cloth ribbons translate vertically at ~0.72x scroll against their text at 1.0x - real
  parallax with a purpose: the cloth appears to feed continuously through a fixed frame.
- The dissolve is a canvas mosaic; scroll progress drives block size from 2px to ~120px, with
  brightness falling as it quantises. One canvas, one property, one owner.
- FLIP hand-off at the join: the final mosaic tile and the first product tile share a
  bounding box, so the grid appears to be what the cloth became.
- Filter changes animate the grid with FLIP, not a fade - cards move to their new cells so
  the "one cloth, recut" idea survives into the working task.
- Reduced motion: cloth becomes static, correctly framed crops; the dissolve renders once at
  its resolved state (large tiles) as a still band; FLIP is replaced by instant reflow. The
  composition, the crops and the whole journey are unchanged - nothing is hidden, and the
  page is still identifiably this design.
- Touch: parallax rate halves (iOS scroll events are coarse), the bag becomes a bottom sheet,
  and the dissolve is pre-rendered at two block sizes rather than scrubbed per frame.

ASSETS
Already produced and inspected: nine duotone cloth plates in design/_src/cloth/, derived from
five CC0/CC-BY/CC-BY-SA fabric photographs (denim, lambswool, corduroy, Donegal tweed, canvas)
and toned to each garment's stated colour so the set reads as one shoot. Full attribution in
design/SOURCES.md. Garment forms are authored SVG silhouettes with construction lines
(yoke seam, patch pockets, shawl collar, pleat). Type: Bodoni Moda + IBM Plex Mono + Archivo,
all self-hosted at build. No stock menswear photography exists to source and no image
generator is callable - see design-blocker.md. The site will state plainly that the cloth is
representative material photography and the garment views are drawings.

MOBILE (design/a-5-mobile.png)
Hero drops to 660px with the headline at 60px; the bolt becomes a single column, cloth above
text; the dissolve compresses to 300px and is pre-rendered; cards go one-up at full bleed so
the cloth is still read at scale; the bag docks as a bottom sheet with the subtotal always
visible. Touch targets are 44px minimum.

IMPLEMENTATION
Plain React 18 + CSS, no new runtime dependency beyond what ships. One scroll controller, one
canvas, CSS transforms elsewhere. The prototype slice to build first is the join - the last
cloth ribbon, the dissolve, and the first two rows of the live shop grid with working filter,
size selection and add-to-bag - because that is where the concept either survives into the
task or does not.

UNCERTAINTY
The mosaic's cost on a mid-range phone is the real risk; mitigation is a fixed-step block
ladder and a pre-rendered mobile path, and the slice will be measured before the route is
finished. Secondary risk: the garment knockout must stay legible on the busiest cloth (the
tweeds); the answer is a hairline stroke plus a slight luminance offset inside the cut.

COST
Higher than B. The canvas dissolve, the FLIP join and the per-garment cloth toning are real
work, and the mosaic needs performance tuning on two form factors.

WHY I RECOMMEND THIS ONE
The brief asks for continuity carried into the shopping experience, and for a page that is
memorable beyond the hero while staying easy to buy from. A is the only one of the two whose
idea is still operating inside the product grid: the card is not a container for a picture,
it is another cut in the same cloth. It also handles the material constraint honestly rather
than in spite of it - with no sourceable garment photography, making the cloth itself the
subject turns the shortage into the art direction, and it puts real photographic texture in
front of the buyer at the moment they are deciding, which B cannot. The single mechanism
(quantisation) also satisfies "choose the approach rather than adding every effect"."""

plan_b = """THE CUTTING TABLE - the shop as a drawing set, seen from above.

THE IDEA
The page is a drafting table. It opens on a lay plan: the Chore Jacket's pattern pieces laid
out on gridded paper inside a marked cloth width, annotated in blueprint blue. As you scroll,
pieces rotate and converge into the garment's flat, and the finished flat becomes the first
product tile. Every garment is a numbered drawing (MV-01 to MV-09), every fact is a clause on
a sheet, and the footer is a drawing title block. It suits a label whose whole pitch is
measurement, named factories and no sales - the transparency is the aesthetic.

THE JOURNEY
1. Hero (design/b-1-open.png) - grid paper, "EVERY PIECE, BEFORE IT IS A COAT" in Archivo
   Expanded, a dashed 150cm cloth-width boundary holding eight labelled pattern pieces, a
   drawing-number stamp (MV-03, scale 1:8, sheet 1 of 9), and a ruler along the bottom edge.
2. Three sheets (design/b-x-sheets.png) - the shop facts as 11 / 4 / 0 on translucent tracing
   sheets that parallax at different depths.
3. The transition (design/b-2-assembly.png) - five frames: scattered pieces, then rotate and
   converge, then land inside the blue garment outline, then invert to ink, captioned "Chore
   Jacket, GBP 165, in the shop", which is the first tile of the grid below.
4. Shop (design/b-3-shop.png) - a hairline-ruled 3-up drawing set. Each cell: technical flat
   on grid paper, drawing code top-left, a 54px cloth swatch pinned top-right, then name,
   price, fabric, colours, a segmented size control (blue = selected, hatched = sold out) and
   the add button. Filter is a sticky segmented tab rail with counts; the bag is a printed
   docket with dashed rules, per-line x, subtotal, delivery status and total.
5. Ending (design/b-4-end.png) - size chart beside an annotated body diagram, care and
   shipping as numbered clauses (01 to 05), reviews as margin notes, and a four-cell title
   block before the wordmark.

MOTION
- Scroll-driven SVG transform interpolation on the pattern pieces (translate/rotate/scale
  towards authored final positions), plus layered parallax on the tracing sheets.
- The assembly is genuinely one continuous scrubbed timeline, not five stills; the five frames
  in the image are samples of it.
- FLIP from the resolved flat into the first grid cell.
- Reduced motion: pieces render at their assembled positions; sheets are flat; no parallax.
- Touch: the lay plan reflows to a stacked, smaller set; assembly runs as a 2x2 frame grid
  rather than a scrub.

ASSETS
Lighter than A. Authored SVG pattern pieces and technical flats; the same nine cloth plates
appear only as small swatch chips. Archivo / Archivo Expanded / IBM Plex Mono. Same sourcing
constraint and same disclosure as A (design-blocker.md, design/SOURCES.md).

MOBILE (design/b-5-mobile.png)
Lay plan drops below the headline as a compact six-piece set; assembly becomes a 2x2 grid;
cards go one-up; the docket docks to the bottom edge. Known fix needed: the drawing-number
stamp currently collides with the lay plan at 390px.

IMPLEMENTATION
Simplest of the two - SVG transforms and CSS grid, no canvas, no per-frame raster work. Fast
to build and cheap to run.

UNCERTAINTY - and it is the load-bearing one
The assembly does not fully convince yet. Pattern pieces do not naturally tile into a flat
silhouette: in frame 04 the sleeves still do not reach the silhouette's shoulders, and making
them land would mean drafting pieces that are geometrically true to each of nine garments -
nine real lay plans, not one. That is the expensive part of B, and it is exactly the part the
brief calls the transition. The second risk is subject legibility: a buyer choosing between a
GBP 210 overshirt and a GBP 155 cardigan sees two similar hairline outlines and a 54px
swatch, which is a weaker buying view than A offers.

COST
Lower than A to build, higher than A to get right, because the credibility depends on drafting
nine accurate pattern sets rather than tuning one mechanism.

RECOMMENDATION
Not recommended over A, but genuinely worth choosing if the reviewer wants a light, legible,
paper-white shop with a strong information character rather than an atmospheric one - it is
much easier to read, cheaper to run, and its ending (title block, numbered clauses) is
arguably the stronger piece of the two. Combining is also viable: A's cloth plates and
dissolve with B's numbered-clause care/shipping sheets and title-block footer."""

data = {"version": 1, "directions": [
    {"id": "direction-a",
     "title": "The Bolt - one continuous cloth, quantised into the shop",
     "images": ["design/a-1-open.png", "design/a-2-bolt.png", "design/a-x-dis.png",
                "design/a-3-shop.png", "design/a-4-end.png", "design/a-5-mobile.png"],
     "plan": plan_a},
    {"id": "direction-b",
     "title": "The Cutting Table - the shop as a drawing set",
     "images": ["design/b-1-open.png", "design/b-x-sheets.png", "design/b-2-assembly.png",
                "design/b-3-shop.png", "design/b-4-end.png", "design/b-5-mobile.png"],
     "plan": plan_b}]}

with open("design-directions.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=1, ensure_ascii=False)
print("written")
