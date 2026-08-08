# Dreative Testbed

An automated A/B testing ground for the [Dreative](https://github.com/ltyfish/DREATIVE) design skill.

The question this repo exists to answer is narrow and unforgiving:

> **Does a site built with Dreative look better than the same site built without it?**

Everything here serves that one question. If the answer is no on a scenario, that is the
most valuable output the testbed can produce.

## The whole loop is two commands

```sh
npm install                      # once
npx playwright install chromium  # once

node scripts/run-all.mjs         # 10 headless sessions, then screenshots
node scripts/review.mjs          # blind review UI at http://127.0.0.1:4321
```

`run-all.mjs` scaffolds ten isolated projects (five scenarios × two arms), spawns a
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
node scripts/run-all.mjs --direction showcase                     # default recommended
node scripts/run-all.mjs --scenarios civic-clinic,devtool-docs   # subset
node scripts/run-all.mjs --concurrency 5                          # default 3
node scripts/run-all.mjs --model opus                             # default: your CLI default
node scripts/run-all.mjs --agent codex                            # default claude
node scripts/run-all.mjs --timeout 40                             # minutes per session, default 25
node scripts/run-all.mjs --arms with                              # re-run one arm only
```

**`--direction` matters.** Dreative normally blocks on the user choosing Recommended,
Efficient, or Showcase. Unattended there is nobody to ask, so it falls back to Recommended
and you end up scoring a direction you did not pick. The flag states the choice up front;
`--direction none` reproduces the old implicit behaviour. Compare like with like — a
Showcase round against a control is a different question from a Recommended round.

Sessions run with `acceptEdits` and a scoped tool allowlist, so an agent can edit files in
its own run directory and run the project's npm scripts without prompting. `--yolo` gives
full bypass; it is not the default, because these are real agents on your machine even
though each run directory is disposable.

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

## The five scenarios

| Scenario | Field | What it tests |
|---|---|---|
| `coffee-roaster` | DTC physical product | Storytelling, appetite, product comparability |
| `saas-analytics` | B2B SaaS | Density, credibility, pricing comparison |
| `editorial-longform` | Publishing | Typography and reading comfort, almost no interface |
| `devtool-docs` | Developer tooling | Utility under density, scannable API tables |
| `civic-clinic` | Public service | **Restraint** — spectacle is the wrong answer here |

`civic-clinic` is the honesty check. It is a free walk-in clinic used by stressed people on
old phones, so a good redesign is calmer and faster than the baseline. If Dreative reaches
for scroll choreography and cinematic drama there, that is a real finding about the skill,
and you will only see it because the scenario was built to expose it.

Each scenario's `scenario.json` holds the brief and the preservation contract — the content
and behaviour that are product requirements rather than design opinions.

## Rules that keep the result meaningful

1. **Do not open the run directories before scoring.** The folder names give it away.
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
node ../Dreative/dist/cli/index.js install-skill --skills all --claude
node ../Dreative/dist/cli/index.js install-skill --skills all --codex
```

`run-all.mjs` refuses to start if no skill is installed at the repo root.

## Layout

```
scenarios/<name>/   baseline App.jsx, styles.css, scenario.json (brief + preservation contract)
_template/          shared Vite skeleton every run is built from
runs/               one isolated real project per run, plus verdicts/ (gitignored)
scripts/run-all.mjs orchestrator: scaffold → sessions → capture
scripts/review.mjs  blind review server
scripts/new-run.mjs scaffold a single run by hand
scripts/capture.mjs recapture after a manual fix
VERDICTS.md         the accumulating record
EVALUATION.md       what each scoring criterion means
```

Runs are disposable; the verdicts are the artefact worth keeping.
