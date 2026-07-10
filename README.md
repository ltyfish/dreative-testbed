# Dreative Testbed

A deliberately plain single-page site (Northwind Coffee Roasters) used to repeatedly test
the [Dreative](https://github.com/ltyfish/DREATIVE) design skill. The baseline is boring on
purpose: real nav, hero, story + stats, product grid with cart buttons, brew-guide steps,
reviews, subscription CTA, working contact form (success state), footer with legal links —
plenty of preservation surface and plenty of room for drastic redesign.

## Test loop

```sh
npm i                                # once
npm i -g dreative@latest             # update the CLI/skill
dreative install-skill               # refresh .claude/skills/dreative to latest
# ask the agent: "redesign this site with dreative"
npm run dev                          # inspect the result
git reset --hard baseline && git clean -fd   # back to the plain site for the next run
```

The `baseline` tag marks the pristine plain state. Never commit redesign output to `main`;
judge it, note findings in the Dreative vault, and reset.

## What a run should exercise

- The plan gate (agent must ask plan-vs-direct first).
- Question round: depth ladder, treatments, media multi-select (with token warning), mockups.
- Preservation: 5 nav links, 6 add-to-cart buttons, contact form fields + success state,
  4 footer links, all visible copy.
- Drastic-change floor at restructure/reimagine rungs.
