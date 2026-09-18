# Image-generation capability: discovery result

**No callable image generator is available in this session.** Recorded here as the
protocol requires, together with what was done instead. The gate is **not** skipped —
real, viewable mockups are in `design/` and `design-directions.json`.

## What was probed

| Capability | Result |
|---|---|
| MCP servers | `.mcp.json` declares `{}` — none configured |
| Host tools (incl. deferred/lazy-loaded) | Searched for image generation/editing; none exists. Available deferred tools are cron, worktree, DesignSync, RemoteTrigger, WebFetch/WebSearch, etc. |
| Generation API credentials | No `OPENAI_*`, `ANTHROPIC_*`, `GEMINI_*`, `REPLICATE_*`, `STABILITY_*`, `FAL_*` or similar keys in the environment |
| Local generative tooling | `ffmpeg` present; no Stable Diffusion / ComfyUI / Blender / `magick` |

## Stock photography sourcing was also constrained

- `api.pexels.com` → **401** (key required, none supplied).
- `unsplash.com` search (site and `napi`) → **401 bot challenge** (Anubis), both via `curl` and a real Chromium session.
- `pexels.com` rendered search via Playwright → works, but **rate-limits after ~2 queries per session**. Two queries succeeded; the following eleven returned nothing across three attempts each.
- `api.openverse.org` → works, but returns incoherent, mostly `by-nc-nd` material unusable as a coherent nine-garment set.

A contact sheet of the Pexels results was inspected (`design/contact.png`): mixed subject,
mixed light, several irrelevant. Not a coherent product set for a fictional label.

## Substitution used, per the skill's named fallback

`VISUAL_DESIGN.md`: *"If generation is unavailable, use supplied images or a
material-backed visual composition in a capable design tool/browser, and name the substitution."*

Both directions were therefore **authored as real page compositions in HTML/CSS/SVG/canvas and
rendered to PNG through headless Chromium at 1440px and 390px**. These are actual rendered
images of actual designs, not prompts and not sourced references relabelled as mockups.

The garment imagery is likewise **authored**: nine drawn technical "flats"
(`design/flats.mjs`, inspected at plate scale in `design/flats.png`), one consistent
drawing system, one shared scale. This satisfies the brief's requirement for coherent,
representative clothing imagery that never implies a verified photograph of fictional
inventory — both directions label it as such on the page.

The three photographs that did survive sourcing (Pexels, free licence) appear in
direction B only, as halftoned atmosphere, never as a product view.

**Consequence for phase two:** without a generator, product views stay drawn rather than
photographic. If the reviewer can supply photography or a generation route, direction B
absorbs it with no structural change (it already mixes drawn plates with halftoned photography);
direction A would need a full nine-garment photographic set to change medium.
