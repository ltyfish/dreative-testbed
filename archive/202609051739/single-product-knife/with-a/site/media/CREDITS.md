# Media credits

Both photographs are of a Moritaka Hamono 8.25" Aogami Super kurouchi gyuto,
photographed by Frank Schulenburg. Sourced from Wikimedia Commons.

| Shipped file | Source file | Author | Licence | Source |
|---|---|---|---|---|
| `blade-wide-4200.webp`, `blade-wide-1600.webp` | `Moritaka 8.25-Inch Aogami Super Carbon Steel Gyuto (2026)-104A7336.jpg` (5618x3160) | Frank Schulenburg | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Moritaka_8.25-Inch_Aogami_Super_Carbon_Steel_Gyuto_(2026)-104A7336.jpg |
| `blade-macro-2800.webp`, `blade-macro-1200.webp` | `Kurouchi finish on Moritaka Gyūtō (2026)-104A7972.jpg` (6000x4000) | Frank Schulenburg | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Kurouchi_finish_on_Moritaka_Gy%C5%ABt%C5%8D_(2026)-104A7972.jpg |

## Treatment applied (ffmpeg)

Wide: `eq=contrast=1.10:brightness=-0.035:saturation=0.72`, cool/warm split
via `colorbalance`, `vignette=PI/4.6`, `unsharp=5:5:0.5`, then scaled to 4200px
and 1600px webp.

Macro: `hflip`, `rotate=-25deg`, `crop=3911:2200:1086:2064` — mirrored and
rotated so the blade sits on the same axis and in the same orientation as the
wide frame, then `eq=contrast=1.08:brightness=-0.03:saturation=0.62`,
`colorbalance`, `vignette=PI/4.6`, `unsharp=5:5:0.9`, scaled to 2800px and
1200px webp.

Because both derivatives are adaptations of CC BY-SA 4.0 originals, they are
themselves distributed under CC BY-SA 4.0.

## Registration constants (measured by inspecting the shipped files)

Shared physical anchor: the bottom corner of the heel, where the ground bevel
meets the heel curve.

- wide, normalised to its own frame: `(0.5600, 0.6115)`
- macro, normalised to its own frame: `(0.6846, 0.8098)`
- macro shows the blade `5.0x` larger than the wide frame

Feature coordinates in macro-normalised space, each confirmed by rendering a
marker onto the file and looking at it:

- grind line (bevel meets forge skin): `(0.400, 0.677)`
- forge scale (raised cluster): `(0.552, 0.500)`
- machi / heel notch: `(0.714, 0.345)`
