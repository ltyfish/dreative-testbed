# Implementation note — direction-a, "The Bolt"

Selected images: `design/a-1-open.png`, `a-2-bolt.png`, `a-x-dis.png`, `a-3-shop.png`,
`a-4-end.png`, `a-5-mobile.png`. No user changes requested.

## Concept as built

One length of cloth runs the height of the page; every garment is a hole cut in it. The
hero cloth, the three bolt runs, the quantising transition, the nine product plates and the
footer are all the same material, and the product card is another cut in it rather than a
container for a picture.

Page order: hero → THE BOLT (three runs) → the dissolve → the shop (filter, grid, bag) →
sizing → care → shipping & returns → reviews → the three shop facts → footer cloth →
disclosure and cloth credits.

## Actual assets

- Nine cloth plates, `public/cloth/*.jpg` (900×1200), duotone-toned to each garment's stated
  colour from five open-licensed fabric photographs. Sources and licence obligations in
  `design/SOURCES.md`; credits are printed in the page footer.
- Nine quantised previews, `public/cloth/*-lo.jpg` (21×28), used for the arriving tile state.
- Garment forms: authored SVG in `src/silhouettes.js`, with the construction lines the copy
  describes (yoke seam, patch pockets, shawl opening, forward pleat).
- Type: Bodoni Moda 700/900 + 400 italic, IBM Plex Mono 400/500, Archivo 400/500/600,
  self-hosted woff2 in `public/fonts`, declared in `src/fonts.css`. No network font fetch.

## Motion, and who owns what

One scroll source: `src/motion.js` runs a single rAF ticker with IntersectionObserver gating.
Native scrolling is untouched; no smooth-scroll runtime.

| Beat | Driver | Property | Owner |
|---|---|---|---|
| Hero cloth drift + headline lift/fade | scroll progress | `transform`, `opacity` | `Hero` |
| Bolt runs: cloth feeds through a fixed frame | scroll progress | `transform` on the img | `BoltRun` |
| The dissolve: weave quantises to the grid pitch | scroll progress | canvas raster | `Dissolve` |
| Card arrives quantised and resolves | first intersection | `opacity`/`filter` | `Card` |
| Filter recut | category change | WAAPI FLIP | `useFlip` |
| Footer cloth drift | scroll progress | `transform` | `Ending` |

The dissolve's block size climbs to the shop grid's exact column pitch, and a tile boundary
is placed on the grid's left padding, so the last row of tiles and the first row of cards
share edges. Verified: 7 distinct canvas states across the section
(`design/_mockups/probe.mjs`).

Touch: parallax rate halves and the dissolve quantises on a 6-step ladder instead of 26.
Reduced motion: every inline transform is cleared, the dissolve holds one resolved state,
tiles render full-resolution immediately, FLIP is off. Nothing is hidden and no crop changes.

## Deviations from the plan, disclosed

1. **The mobile bag is a panel in the page flow under the grid, not a fixed bottom sheet.**
   The sheet was built first; its labels sat on top of garment copy during scroll (caught by
   the glyph-rectangle collision check, and legible as a real problem in the captures). The
   panel is always expanded, still names garment + size + price per line, removes per line,
   and shows subtotal, free-delivery progress and total.
2. **The nav scrolls away with the hero instead of staying fixed.** Same cause, and it is
   closer to the selected image, where the nav sits on the hero only. The bag stays reachable:
   a sticky rail beside the grid on desktop, and the in-flow panel on mobile.
3. **The dissolve quantises the wool overshirt, not the chore jacket** — it is the cloth you
   were looking at one section earlier, so the join is continuous.
4. Product cards carry the detail sentence, which the mockup's cards did not; it is required
   content, and it makes the cards taller than the reference by about one line.

## Verified

- `design/_mockups/task.mjs` — 18 shopping-flow assertions at 1440, 390 and reduced motion.
- `design/_mockups/motion.mjs` — motion moves, reduced motion holds still.
- `dreative finalize --claude --profile recommended` — `DREATIVE_CHECKS_PASSED`.

## Known limitations

- Garment views are drawings, not photographs, because no menswear product photography could
  be sourced and no image generator is callable (`design-blocker.md`). Real garment shots at
  phase three would drop straight into the card plate.
- The canvas dissolve was measured only in headless Chromium, not on real mid-range hardware.
