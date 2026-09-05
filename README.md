# Dreative Testbed

An automated A/B testing ground for the [Dreative](https://github.com/ltyfish/DREATIVE) design skill.

The question this repo exists to answer is narrow and unforgiving:

> **Does a site built with Dreative look better than the same site built without it?**

Everything here serves that one question. If the answer is no on a scenario, that is the
most valuable output the testbed can produce.

## The whole loop

```sh
node scripts/setup.mjs           # once per machine: deps, chromium, skill, then verifies

node scripts/run-all.mjs 2       # 2 scenarios picked at random × 2 arms, then screenshots
node scripts/review.mjs          # review UI at http://127.0.0.1:4321  (start rounds at /status)
node scripts/status.mjs          # is the round done? one line per run
node scripts/archive.mjs         # every past round at http://127.0.0.1:4322
```

The number is how many scenarios to run, chosen at random; leave it off for all five.
`run-all.mjs` scaffolds one isolated project per scenario per arm, spawns a
headless agent in each, waits for them, then builds and screenshots every result. **You do
not write or paste a prompt.** The brief lives in each scenario's `scenario.json`, and the
arm flips exactly one line of it:

- `with` — "Use the Dreative skill for this work. It is installed in this project."
- `without` — "Do not use any design skill, framework, or checklist beyond your own judgement."

The skill is copied into the `with` run only; the control directory has no `.claude`,
`.codex`, or `AGENTS.md`. That one line is the only difference between the arms, which is
what makes the comparison mean anything.

### Options

```sh
node scripts/run-all.mjs 3                       # 3 random scenarios, Recommended
node scripts/run-all.mjs 2 showcase              # …in the Showcase direction
node scripts/run-all.mjs 5 random                # direction picked at random for the round
node scripts/run-all.mjs --scenarios civic-clinic,devtool-docs   # a named subset instead
node scripts/run-all.mjs --concurrency 5         # default 3
node scripts/run-all.mjs --model opus            # default: your CLI default
node scripts/run-all.mjs --agent codex           # default claude
node scripts/run-all.mjs --timeout 40            # minutes per session, default 25
node scripts/run-all.mjs --arms with             # re-run one arm only
node scripts/run-all.mjs --repeat 2              # same input twice — variance check
node scripts/run-all.mjs --no-yolo               # scoped permissions instead of full bypass
node scripts/run-all.mjs --archive               # archive at round end, for a round you will not score
node scripts/run-all.mjs --gate                  # stop at each build and keep it or throw it out
node scripts/run-all.mjs --label "what this tests"   # a name you will still understand in three months
```

### The prototype gate

With `--gate`, the round stops after every build and shows you what is already known about
it — whether it was truncated, what `npm run look` found, whether visual smoke blocked — then
serves it and asks:

```
  Keep this prototype and score it?  [y/n]
```

`n` writes `rejected` into that run's `run.json`. The review UI then labels it and will not
offer it for scoring, so a build you already threw out cannot pick up a verdict later. The
right answer for anything marked TRUNCATED is almost always `n`: a build the provider or the
time cap ended mid-work is not evidence about the skill.

The gate asks on stdin, so it only works from a terminal — a round started from the web UI
does not gate.

### Seeing the page (`npm run look`)

Every scaffolded run gets `look.mjs`, and the brief tells **both arms** about it in identical
words. It builds the project, renders it at 1440 and 390, writes screenshot tiles to `.look/`,
and prints two lists:

- **BROKEN** — output that is invalid however you feel about it: a viewport-sized hole, text
  under 12px, sideways scroll, an image that never loaded, a reveal that never fired.
- **OBSERVED** — neutral fact: what changes across each section on scroll, what does not, what
  responds to a pointer. Not defects, no thresholds, nothing to hit.

This exists because until 2026-09-05 a session in this harness had **no way to render its own
output**. `202609050422` searched the filesystem for `chrome.exe`, found no way in, and shipped
a page it had never seen — while the skill instructed it to inspect the rendered result at
roughly twenty separate points. Those were instructions with no hands. A browser is an
environment capability like network access, so it goes to every arm, for the same reason
WebSearch does.

It is not a gate. Nothing fails a build, and the report says so on every run.

### Dreative against Dreative

The default round is skill versus control. To compare two Dreative builds instead — a
direction against another direction, a local skill edit against the installed one, or the
same input twice head to head — give both arms the skill:

```sh
node scripts/run-all.mjs --scenarios caliber-movement \
  --arms with-a,with-b --direction-a showcase --direction-b recommended
```

Any arm named `with-<name>` gets the skill installed and its own `--direction-<name>`,
falling back to `--direction` when you do not name one. The review is blind exactly as
before, and the reveal names the arms rather than "Dreative" and "control".

**To test a skill edit rather than a setting, give each arm its own skill tree.** Otherwise
both arms install whatever is in the testbed root and the only thing left to vary is a
setting — which answers a different question than "did this change do anything":

```sh
node scripts/run-all.mjs --scenarios caliber-movement \
  --arms with-a,with-b --skill-a git:HEAD --skill-b git:a59ee84 --timeout 40
```

`--skill-<name>` takes a directory containing the skill, or `git:<ref>` to read
`skill/dreative` out of the code repository at that commit. The tree is extracted into
`scratch/skill-<sha>/` with `git ls-tree` and `git show` — nothing is checked out and the
code project's working tree is never touched, so an old skill can be run while you keep
editing the current one. Set `DREATIVE_REPO` if the code project is not at `../Dreative`.
Each run records which tree it got in `run.json`, and the round header prints them.

With both arms on the same direction and the same brief, the skill is the only difference.

Such a round is deliberately **left out of the scoreboard**: it cannot say whether the
skill helps, only which of two Dreative variants is better. The verdict block is written
to `VERDICTS.md` in full, with the arm names in place of `with`/`without`.

### One arm now, the other later

A round is the unit that gets paired, archived and scored, so a second arm run hours later
has to join the *same* round rather than open its own. `--round` does that:

```sh
node scripts/run-all.mjs --scenarios caliber-movement --arms with-a --direction-a showcase
# … the round number is printed at the top; when you have budget again:
node scripts/run-all.mjs --round 202608241142 --scenarios caliber-movement --arms with-b
```

Until the second arm exists the first shows up in `review.mjs` as a view-only tab, since
there is nothing to compare it against. **Do not reset the round in between** — reset
archives and clears `runs/`, and a cleared arm cannot be paired with anything. `--round`
refuses a round that is no longer in `runs/` rather than building half a comparison.

### Variance check

`--repeat N` runs the same scenario N times inside one round, tagged `r1`, `r2`, …
Nothing differs between the repeats, so anything that does differ is a property of the
run and not of the skill. Skip the control — it has no skill installed and reads nothing:

```sh
node scripts/run-all.mjs --scenarios caliber-movement --arms with --repeat 2
node scripts/variance.mjs
```

`variance.mjs` tables what each repeat opened and says whether read selection was stable.
If it was not, a single round's read count is not evidence for anything.

The repeats are viewable in `review.mjs` too. With no control to compare against there is
nothing to score, so that scenario opens in a **view-only** tab: both runs side by side,
screenshots and live previews, no criteria and no verdict. Reset still archives them.
A scenario whose blind pair is still unscored hides its extra runs until the pair is judged.

Both a bare number (how many scenarios) and a bare direction word work positionally, so a
round is one short command. Anything you do not state falls back to: all six scenarios,
the Recommended direction, `claude`, concurrency 3.

**Direction matters.** Dreative normally blocks on the user choosing Recommended,
Efficient, or Showcase. Unattended there is nobody to ask, so it falls back to Recommended
and you end up scoring a direction you did not pick. Stating it makes the round honest;
`random` picks one per round, and `none` reproduces the old implicit behaviour. Compare
like with like — a Showcase round against a control is a different question from a
Recommended round.

**Permissions.** Sessions run with full bypass and network access by default, so agents can
look up references and install what they need instead of stalling on a prompt nobody is
there to answer. Both arms get the same access — a control that cannot look anything up is
handicapped in a way the comparison would wrongly credit to the skill. `--no-yolo` swaps in
`acceptEdits` plus a scoped tool allowlist (still with web access). These are real agents on
your machine, even though each run directory is disposable.

Each session's transcript is written to `runs/<run>/agent.log`. A round of ten at
concurrency 3 takes roughly 30–45 minutes; you can walk away.

## Status, and starting a round from the browser

```sh
node scripts/status.mjs             # one line per run
node scripts/status.mjs --watch     # …refreshed every 15s
node scripts/status.mjs --json
```

Each run is `running`, `stalled`, `truncated`, `rejected`, `built`, `finished`, or `empty`,
derived from what the round writes to disk as it goes — so it is right after a reboot, and
right for a round somebody else started. Alongside the state it shows what `npm run look`
found, whether smoke blocked, and whether a verdict has been recorded.

The same thing lives at **http://127.0.0.1:4321/status** while `review.mjs` is running, with a
form to start a round: pick scenarios, arms, the skill tree per arm (`git:HEAD`, `git:<sha>`,
or a directory), direction, sessions each, time cap, and a label. It shells out to
`run-all.mjs`, so there is one definition of what a round is. The page polls every 15 seconds
and reloads itself when a run actually changes state.

## Reviewing

`review.mjs` serves a blind comparison of every captured pair. Left/right is randomised
per scenario and **stored**, so refreshing does not reshuffle and you cannot infer the arm
by reloading. Arms are revealed only after you submit that scenario's verdict.

**Screenshots cannot show motion**, so each side has an **Open live ↗** button. It builds
that run if needed, starts a preview server on demand, and opens it on a bare
`127.0.0.1:<random-port>` URL — the address never names the run, so scrolling, hovering,
and animation stay blind. Stop the review server with Ctrl+C and the previews shut down
with it.

For each scenario you give:

- six criteria scored A / Tie / B (see `EVALUATION.md` for what each one means)
- **free-text feedback on each design separately** — filed against whichever arm it turns
  out to be, so the notes stay honest
- an overall winner and a summary

Submitting appends to `VERDICTS.md` and writes `runs/verdicts/<scenario>.json`. A build
failure is shown in place of the screenshots rather than hidden, because failing to build
is a real result, and a page that rendered almost nothing is flagged with a capture warning
instead of appearing as an unexplained white rectangle.

### Single-arm rounds

The control arm was retired on 2026-09-04, so most rounds now run one arm and have nothing
to compare against. Those used to be view-only and **saved nothing at all**, which is how six
separate complaints about the same defect accumulated in chat with no way to sort or count
them. A one-arm round is now scored on its own axes — material, subject, motion, craft,
structure — each 1-5, plus an overall, plus *what is wrong with it* and *what to keep*.

They are scores, not gates: nothing reads them back into a build. They exist so that a flat
line across rounds becomes visible as a flat line. Verdicts go to the same three places a
paired verdict does — `VERDICTS.md`, `runs/verdicts/<scenario>.json`, and the vault changelog
— and the block appended to `VERDICTS.md` deliberately does not match the shapes the
with-versus-control scoreboard reads, so a solo round cannot land in a tally it is not part of.

Runs that were **rejected at the prototype gate** or **truncated** are labelled as such in the
review UI, so neither can quietly collect a verdict.

## The archive

`runs/` is disposable and gitignored — it holds `node_modules` junctions, absolute paths and
half-built state, none of which survives a pull on another machine. **Reset round** in
`review.mjs` copies each run into `archive/<round>/<scenario>/<arm>/`, which **is** committed,
and only then clears `runs/`. Archiving and retiring a round are one action deliberately: a
round that was archived but left in `runs/` looks exactly like live work to every other
script. A round you know you will not score can be archived early with `--archive`.

```
archive/202608081241/
  round.json                     agent, model, direction, session exit codes
  editorial-longform/
    scenario.json                the brief, as it stood that round
    verdict.json                 written when you score it, next to the designs it judges
    with/     without/
      site/                      the built site, relative base, zero dependencies
      src/ index.html BRIEF.md   what the agent actually wrote
      shots/                     desktop, mobile, and dark if the design declares one
      meta.json agent.log        run metadata and the transcript (tail)
```

```sh
node scripts/archive.mjs         # http://127.0.0.1:4322
```

Browse every past round: screenshots side by side, the verdict table, the transcripts, and
**Open site ↗** on each design, served straight from `archive/`. This works on a bare clone
with nothing installed and nothing built — the archived sites carry no dependencies. Arms
are labelled here; the archive is the record after the reveal, not another blind test.

A round is about 1 MB per design, mostly full-page screenshots. Delete a round directory to
drop it; nothing else refers to it.

## Working across two machines

```sh
git checkout measure-visual-smoke-per-run && git pull
cd ../Dreative && git checkout fix-motion-floor-sampling && git pull && npm run build
cd ../dreative-testbed && node scripts/setup.mjs --skill-from ../Dreative
```

**Check out the branch in the code repo, not just here.** Dreative's `main` is 114 commits
behind the working branch and still on 0.5.4, and it is what a fresh clone gives you. Nothing
errors if you skip this: `--skill-<arm> git:HEAD` resolves against whatever branch the code
repo is on, so the round runs happily against a months-old skill and the result looks like a
verdict on the current one. One line proves you are clear:

```sh
grep -c "Look at forty" ../Dreative/skill/dreative/references/MEDIA_SOURCES.md   # 1, not 0
```

`setup.mjs` installs dependencies, installs the Chromium build Playwright uses (it lives
outside the repo, so it never comes across with a pull), installs the skill from a sibling
`../Dreative` checkout or the global `dreative` CLI, checks an agent CLI is on PATH, and
prints what is still missing. `--check` verifies without changing anything.

The skill itself is deliberately **not** committed here: the `with` arm has to test whatever
version of Dreative you are working on now, and a committed copy would silently test a stale
one. It was tracked anyway until 2026-08-30, by which point the committed tree predated
`MOTION_MATERIAL.md` entirely — so a fresh clone now has no `.claude/` or `.codex/` at all and
`run-all.mjs` refuses to start until `setup.mjs` installs one. That refusal is the guard, not a
broken checkout. Everything else — scenarios, verdicts, and the whole archive — travels with
the repo.

## The seven scenarios

| Scenario | Field | What it tests |
|---|---|---|
| `coffee-roaster` | DTC physical product | Storytelling, appetite, product comparability |
| `saas-analytics` | B2B SaaS | Density, credibility, pricing comparison |
| `editorial-longform` | Publishing | Typography and reading comfort, almost no interface |
| `devtool-docs` | Developer tooling | Utility under density, scannable API tables |
| `civic-clinic` | Public service | **Restraint** — spectacle is the wrong answer here |
| `caliber-movement` | Luxury hardware | **Ambition** — a static page is the wrong answer here |
| `apparel-leggings` | DTC apparel | **The ordinary domain** — nothing can hide behind an unfamiliar object |

The last two are the poles, and they are the reason the set is worth running.

`civic-clinic` is the honesty check. It is a free walk-in clinic used by stressed people on
old phones, so a good redesign is calmer and faster than the baseline. If Dreative reaches
for scroll choreography and cinematic drama there, that is a real finding about the skill,
and you will only see it because the scenario was built to expose it.

`caliber-movement` is the opposite check, added 2026-08-17 because twenty-two blind pairs
had all been run on briefs where restraint was correct — so the record said nothing about
whether the skill can build the ambitious thing at all. The subject is a watch movement:
spatial (four stacked plates, 3.8mm deep) and temporal (a six-stage power path that is
literally energy moving through a machine), sold to people who expect to be shown it. A
calm page of cards and a spec table is a legitimate failure. Neither brief names motion,
3D, or scroll work, because naming them would test compliance instead of judgement.

`apparel-leggings` was added 2026-08-30 because `caliber-movement` turned out to be a poor
instrument for judging *imagery*: almost nobody can tell a correct photograph of a watch
movement from a wrong one, which is how a clip of a tourbillon survived three rounds while the
copy described a lever escapement. Everybody knows what leggings look like. Material is also
abundant here rather than scarce — garment photography, fabric texture and movement footage are
all easy to reach, and the free video libraries are strongest on exactly this subject — so a
thin page cannot blame the archive. The standing risk is convergence, because generic activewear
stock is the easiest thing on the internet to find and the least worth shipping.

Each scenario's `scenario.json` holds the brief and the preservation contract — the content
and behaviour that are product requirements rather than design opinions. A scenario with
`"baseline": "content-only"` ships `content.jsx` instead of `App.jsx` and an empty stylesheet,
so the page has to be designed rather than reordered — see `BASELINES.md`. `caliber-movement`
and `apparel-leggings` are both content-only.

## Rules that keep the result meaningful

1. **Do not open the run directories or the archive before scoring.** Both name the arm.
   `review.mjs` is the only blind surface; `archive.mjs` is for after the reveal.
2. **Score the control honestly.** A testbed that always confirms the skill works has
   stopped measuring.
3. **Run more than one round.** Model output varies a lot; one pair is an anecdote.
4. **Do not fix the skill mid-round.** Finish, then change one thing.
5. **Log ties and losses.** They are the only entries that can change your mind.

## Reading the results

- **Wins on some fields, loses on others** — most likely and most useful. It tells you what
  the skill is actually for, and you should narrow its scope to that.
- **Wins everywhere by a little** — plausible and good. Keep going.
- **Wins everywhere by a lot** — be suspicious of the blinding before believing it.
- **Ties everywhere** — elaborate machinery producing no visible effect, which is the risk
  the enforcement-heavy design always carried.

### Before you score, check the instruments

Some questions are answerable from the run directory in seconds, and they tell you whether the
change under test fired **at all**. A page can look fine and still prove that nothing landed.

```sh
d=$(ls -dt runs/<scenario>__* | head -1)

grep -c "position: sticky" $d/src/*.css          # did anything persist across a section?
node -e "console.log(require('./$d/material.json').continuity)"   # credits, domains, warmth spread
node -e "console.log(require('./$d/../round-<seq>.json').sessions[0].reads.skillFilesRead)"
```

Reference points from the rounds so far: `202608300433` shipped 58 rasters behind **10 credits
across 2 domains**; `202608300842` shipped 199 behind **24 across 3** after the contact-sheet
change, which is what a wide search looks like. `warmthSpread` was 0.517 and 0.53 in those two
and **0.011** in the one round whose imagery read as a single shoot — above roughly 0.25 means
mixed material that was never graded. Both of those rounds scored **zero** `position: sticky`
and never opened `systems/NATIVE_FOUNDATIONS.md`, which is why nothing carried across a section
boundary. Do not read ambition off the motion count or off `sectionCoverage`; both have been
satisfied by pages that were rejected on sight.

## Keeping the skill current

The `with` arm is only meaningful if the installed skill is the one you are testing:

```sh
node scripts/setup.mjs --skill-from ../Dreative   # or, by hand:
node ../Dreative/dist/cli/index.js install-skill --skills all --claude
node ../Dreative/dist/cli/index.js install-skill --skills all --codex
```

`run-all.mjs` refuses to start if no skill is installed at the repo root.

## Layout

```
scenarios/<name>/    scenario.json (brief + preservation contract), App.jsx + styles.css,
                     and content.jsx for a content-only baseline
_template/           shared Vite skeleton every run is built from
runs/                one isolated real project per run, plus verdicts/ (gitignored)
archive/<round>/     committed record: sources, screenshots, verdicts, dependency-free sites
scripts/setup.mjs    prepare a fresh machine, or --check an existing one
scripts/run-all.mjs  orchestrator: scaffold → sessions → capture → optional gate
scripts/review.mjs   review + scoring server, and /status to start rounds
scripts/status.mjs   is the round done? derived from disk, not remembered
scripts/lib/gate.mjs      the prototype keep/throw-out prompt
scripts/lib/status.mjs    run states, read from what the round leaves behind
scripts/lib/launcher.mjs  the /status page and the round launcher
_template/look.mjs   the eyes every run gets: render, tile, report BROKEN and OBSERVED
scripts/archive.mjs  archive browser, works on a bare clone
scripts/new-run.mjs  scaffold a single run by hand
scripts/capture.mjs  recapture after a manual fix
VERDICTS.md          the accumulating record
EVALUATION.md        what each scoring criterion means
```

Runs are disposable; the archive and the verdicts are the artefacts worth keeping.
