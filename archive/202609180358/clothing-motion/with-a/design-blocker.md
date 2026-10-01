# Image-generation capability: discovery result and substitution

## What was probed (2026-09-18)

| Capability | Result |
|---|---|
| Host image-generation / image-editing tool | **Not available.** `ToolSearch` over the deferred tool list returns no image, media, or asset-generation tool. Available tools are file/shell/browser/scheduling/design-sync only. |
| MCP servers | **None.** `.mcp.json` in this run directory is `{"mcpServers":{}}`. |
| Generation API credentials in environment | **None.** No `OPENAI_*`, `GEMINI_*`, `ANTHROPIC_API_KEY`, `REPLICATE_*`, `FAL_*` or equivalent key is present. |
| Pexels API | **401 — missing credentials.** `GET https://api.pexels.com/v1/search` returns HTTP 401 with no key configured. |
| Unsplash API | **Not usable.** Requires an application access key; none present. (The `images.unsplash.com` CDN answers 200 for a known photo id, but there is no authorized search route to discover ids.) |
| Openverse API (no key) | **Available**, and used. Menswear *product* photography is effectively absent; *fabric and material* photography is good. |
| Local production tools | Python 3.13 + Pillow, ffmpeg, Node 22, Playwright 1.54 with Chromium — all working. |

## Consequence, and what was done instead

Two separate things were unavailable, and they were handled differently.

**1. Page-mockup generation → substituted, and named here.**
`references/VISUAL_DESIGN.md` allows this explicitly: *"If generation is unavailable, use
supplied images or a material-backed visual composition in a capable design tool/browser,
and name the substitution."* Both direction mockups in `design/` are **real rendered page
compositions** — authored HTML/SVG/canvas in `design/_mockups/`, rendered by headless
Chromium at 1440px and 390px at `deviceScaleFactor: 2`, using the real brief content and
real sourced cloth photography. They are inspectable PNGs, not prompts and not sourced
references relabelled as designs. They are **not** diffusion-model output.

**2. Nine coherent garment product photographs → cannot be obtained at all.**
This is a material finding, not a styling preference, and it shapes both directions:

- No callable generator exists to create them.
- Openverse/Wikimedia/rawpixel/StockSnap yield no coherent modern-menswear product set.
  A 24-query sweep produced the contact sheet at `design/_src/contact.png`: usable
  **fabric macro** photography (denim, lambswool, corduroy, tweed, canvas), plus museum
  and archive objects — and essentially nothing that could pass as nine catalogue views
  of one label's autumn range.

Both directions therefore make an explicit, disclosed decision rather than a silent
substitution: **the real photograph in the page is the cloth, and the garment form is
authored vector art.** Direction A shows the cloth at full scale and cuts the garment out
of it; Direction B draws the garment as a technical flat and pins the cloth beside it as a
swatch. Neither presents any image as a photograph of this fictional label's inventory,
and the shipped site will carry a visible line saying the cloth imagery is representative
material photography and the garment views are authored drawings.

Nothing here was faked or skipped: the gate's images exist and were inspected, and the
selection gate is open and waiting.

## If the reviewer can supply alternatives

Supplying either of the following at phase two would materially improve the result, and
both directions are built to absorb it:

- Nine garment photographs (front-on, plain ground) — Direction A would swap the authored
  silhouette knockout for a real cut-out garment; Direction B would replace the flat.
- A Pexels or Unsplash API key, or any image-generation credential — the cloth set could
  then be widened beyond the nine plates currently derived from five CC0/CC-BY sources.
