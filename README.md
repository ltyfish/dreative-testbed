# Dreative Testbed

A deliberately plain single-page site (Northwind Coffee Roasters) used to repeatedly test
the [Dreative](https://github.com/ltyfish/DREATIVE) design skill. The baseline is boring on
purpose: real nav, hero, story + stats, product grid with cart buttons, brew-guide steps,
reviews, subscription CTA, working contact form (success state), footer with legal links —
plenty of preservation surface and plenty of room for drastic redesign.

## Test loop

Build the local Dreative branch first. A plain `dreative` command may resolve to
an older globally installed npm package, so use this branch's compiled CLI
directly when installing the skill:

```powershell
$dreative = "C:\Users\User\Downloads\Dreative\DREATIVE"
$testbed = "C:\Users\User\Downloads\dreative-test-bed\dreative-testbed"

Set-Location $dreative
git switch codex/v.20.3
git pull --ff-only
npm ci
npm run build:server

Set-Location $testbed
git switch v.20.3
git pull --ff-only
node "$dreative\dist\cli\index.js" install-skill --codex
node "$dreative\dist\cli\index.js" install-skill --codex --check
npm run dev
```

After judging a run, reset the app to the current branch state without rewinding
the branch's committed skill updates:

```powershell
Set-Location $testbed
git reset --hard HEAD
git clean -fd
Remove-Item -Recurse -Force .dreative, dist, web -ErrorAction SilentlyContinue
node "$dreative\dist\cli\index.js" install-skill --codex
node "$dreative\dist\cli\index.js" install-skill --codex --check
```

The `baseline` tag records the original plain app, but do not reset the branch
to that tag: it predates current skill commits. Never commit redesign output to
`main`; judge it, note findings in the Dreative vault, and reset.

## What a run should exercise

- The plan gate (agent must ask plan-vs-direct first).
- Question round: depth ladder, treatments, media multi-select (with token warning), mockups.
- Preservation: 5 nav links, 6 add-to-cart buttons, contact form fields + success state,
  4 footer links, all visible copy.
- Drastic-change floor at restructure/reimagine rungs.
