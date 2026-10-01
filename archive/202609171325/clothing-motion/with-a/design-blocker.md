# Capability finding — no callable image generator in this host

**This is not a stop.** Two full visual directions were produced and are in `design-directions.json`.
This note records precisely what was unavailable, so the reviewer can supply an alternative if they
want a different class of imagery before phase two.

## What was probed

| Capability | Result |
|---|---|
| Host image-generation / image-editing tool | **Not present.** `ToolSearch` for "image generation / generate image / create image / editing" and for `+image` returned no deferred tool. The only MCP server configured for this project (`.mcp.json`) is Playwright; the only global MCP server is `vercel`. |
| `dreative preflight --generated-images allow` | `image-generation: permission "allowed", status "permitted-but-tool-unverified"` — "Image-generation permission exists, but no generation tool was confirmed." Its declared permitted substitutes: **sourced image, supplied image, procedural graphic**. `image-editing` reports the same. |
| Local generative tooling | None. No Python (`python` is the Microsoft Store alias stub), no Blender, no ImageMagick (`convert` on PATH is the Windows filesystem utility, not IM), no local diffusion runtime. `ffmpeg` is present; `node` + Playwright/Chromium are present. |
| Generation API credentials | None in the environment (no OpenAI / Gemini / Replicate / Stability / Pexels / Unsplash keys). |
| Network image sourcing | Working, keyless: Openverse API and Wikimedia Commons both return results and downloadable originals. Pexels and Unsplash need API keys that are not present. |

## What this changes about the mockups

The two direction images are **browser-rendered compositions** (authored HTML/CSS/SVG, screenshotted
with Chromium at 1440px and 390px), not diffusion-generated page images. That is the substitution
named in the Dreative skill: *"If generation is unavailable, use supplied images or a material-backed
visual composition in a capable design tool/browser, and name the substitution."* They are real
viewable images built from real assets at real scale, so they can be judged and chosen between.

## What this changes about the clothing imagery

This is the more consequential finding, and it is why the two directions differ the way they do.

Openverse and Wikimedia can supply **excellent cloth macros** (linen, herringbone twill, selvedge
denim, indigo canvas, lambswool, corduroy, tweed) under commercial-use licences. They **cannot**
supply a coherent nine-garment studio set for a fictional label: the available garment photography is
amateur, inconsistently lit, frequently branded, and never the described garment. Contact sheets are
at `design/_work/sheet.png`, `sheet2.png`, `sheet3.png`, `sheet4.png`; the downloaded working set is
at `design/_work/local.png` with provenance in `design/_work/manifest.json`.

- **Direction A** is designed *around* that constraint: cloth macro (real, honest — it is cloth) plus
  an **authored SVG technical flat per garment**, drawn to each garment's own described construction.
  No image in it claims to be a photograph of inventory, and the buy view is exact.
- **Direction B** accepts photography as the lead and therefore inherits the constraint: its garment
  images are *representative contextual photography*, labelled as such on the page, and several
  visibly are not the described garment (the Lambswool Crew stand-in is a puff-sleeve mannequin knit).

If you want photographic art direction with accurate garment identity, the unblocking input is either
(a) an image-generation tool/credential added to this session, or (b) supplied garment imagery.
Either can be dropped in before resuming the gate.

## Attribution note for phase two

All sourced imagery is Openverse-indexed under commercial-use licences (Flickr CC / rawpixel /
StockSnap). `design/_work/manifest.json` carries creator, licence and source page per file, and
per-asset terms will be re-checked and credited at build time.
