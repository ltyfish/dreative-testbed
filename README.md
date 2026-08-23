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
node scripts/review.mjs          # blind review UI at http://127.0.0.1:4321
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
```

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
git pull
node scripts/setup.mjs
```

`setup.mjs` installs dependencies, installs the Chromium build Playwright uses (it lives
outside the repo, so it never comes across with a pull), installs the skill from a sibling
`../Dreative` checkout or the global `dreative` CLI, checks an agent CLI is on PATH, and
prints what is still missing. `--check` verifies without changing anything.

The skill itself is deliberately **not** committed here: the `with` arm has to test whatever
version of Dreative you are working on now, and a committed copy would silently test a stale
one. Everything else — scenarios, verdicts, and the whole archive — travels with the repo.

## The six scenarios

| Scenario | Field | What it tests |
|---|---|---|
| `coffee-roaster` | DTC physical product | Storytelling, appetite, product comparability |
| `saas-analytics` | B2B SaaS | Density, credibility, pricing comparison |
| `editorial-longform` | Publishing | Typography and reading comfort, almost no interface |
| `devtool-docs` | Developer tooling | Utility under density, scannable API tables |
| `civic-clinic` | Public service | **Restraint** — spectacle is the wrong answer here |
| `caliber-movement` | Luxury hardware | **Ambition** — a static page is the wrong answer here |

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

Each scenario's `scenario.json` holds the brief and the preservation contract — the content
and behaviour that are product requirements rather than design opinions.

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
scenarios/<name>/    baseline App.jsx, styles.css, scenario.json (brief + preservation contract)
_template/           shared Vite skeleton every run is built from
runs/                one isolated real project per run, plus verdicts/ (gitignored)
archive/<round>/     committed record: sources, screenshots, verdicts, dependency-free sites
scripts/setup.mjs    prepare a fresh machine, or --check an existing one
scripts/run-all.mjs  orchestrator: scaffold → sessions → capture
scripts/review.mjs   blind review server
scripts/archive.mjs  archive browser, works on a bare clone
scripts/new-run.mjs  scaffold a single run by hand
scripts/capture.mjs  recapture after a manual fix
VERDICTS.md          the accumulating record
EVALUATION.md        what each scoring criterion means
```

Runs are disposable; the archive and the verdicts are the artefacts worth keeping.
