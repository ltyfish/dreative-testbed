# Dreative Testbed

An A/B testing ground for the [Dreative](https://github.com/ltyfish/DREATIVE) design skill.

The question this repo exists to answer is narrow and unforgiving:

> **Does a site built with Dreative look better than the same site built without it?**

Everything here serves that one question. If the answer is no on a scenario, that is the
most valuable output the testbed can produce.

## Why it is built this way

The previous version of this testbed had one scenario (a coffee roastery) and no control.
That combination makes it impossible to learn anything: with one scenario you overfit to
coffee, and with no control you cannot tell whether the skill helped, hurt, or did nothing,
because you have nothing to compare against except your memory of the last run.

So: **five scenarios from different fields**, and **every run is paired with a control run**
that receives an identical brief without the skill. You score them side by side without
being told which is which.

## The five scenarios

| Scenario | Field | What it tests |
|---|---|---|
| `coffee-roaster` | DTC physical product | Storytelling, appetite, product comparability |
| `saas-analytics` | B2B SaaS | Density, credibility, pricing comparison |
| `editorial-longform` | Publishing | Typography and reading comfort, almost no interface |
| `devtool-docs` | Developer tooling | Utility under density, scannable API tables |
| `civic-clinic` | Public service | **Restraint** — spectacle is the wrong answer here |

`civic-clinic` is the honesty check. It is a free walk-in clinic used by stressed people on
old phones. A good redesign is calmer and faster than the baseline. If Dreative reaches for
scroll choreography and dark cinematic drama on this one, that is a real finding about the
skill, and you will only see it because the scenario was designed to expose it.

Each scenario ships a `scenario.json` holding the brief and the preservation contract — the
content and behaviour that are product requirements rather than design opinions.

## The loop

```sh
npm install                    # once, at the repo root
npx playwright install chromium

# 1. scaffold both arms of a scenario
node scripts/new-run.mjs --scenario coffee-roaster --arm with
node scripts/new-run.mjs --scenario coffee-roaster --arm without
```

Each command prints the exact prompt to hand the agent. **Paste it verbatim.** The two
prompts are identical except for one line about whether to use the skill; if you improvise,
you have changed the variable you were trying to measure.

```sh
# 2. after both agents have finished, capture screenshots
node scripts/capture.mjs --all

# 3. score them blind
node scripts/compare.mjs --scenario coffee-roaster
```

Step 3 writes `runs/compare-<scenario>.html`. Open it. Left/right is randomised and the
arms are hidden until you commit a verdict. Score six criteria plus an overall, then hit
reveal and paste the generated record into `VERDICTS.md`.

## Rules that keep the result meaningful

1. **Never look at the run directories before scoring.** The folder names give it away.
2. **Score the control honestly.** The temptation is to find reasons the Dreative build won.
   A testbed that always confirms the skill works is a testbed that has stopped measuring.
3. **Run the same scenario more than once per arm.** Model output varies a lot. One pair is
   an anecdote; five pairs across five scenarios is a signal.
4. **Do not fix the skill mid-scenario.** Finish the whole round, then change one thing.
5. **Log ties and losses.** They are the only entries that can change your mind.

## Reading the results

Across a full round of ten runs, the useful patterns are:

- **Dreative wins on some fields and loses on others** — the most likely and most useful
  outcome. It tells you what the skill is actually for, and you should narrow its scope.
- **Dreative wins everywhere by a little** — plausible and good. Keep going.
- **Dreative wins everywhere by a lot** — be suspicious of your own blinding before believing it.
- **Ties everywhere** — the skill is elaborate machinery producing no visible effect, which
  is the outcome the enforcement-heavy design was always most at risk of.

## Layout

```
scenarios/<name>/     baseline App.jsx, styles.css, scenario.json
_template/            shared Vite project skeleton every run is built from
runs/<scenario>__<arm>__<n>/   one isolated, real project per run (gitignored)
scripts/              new-run, capture, compare
VERDICTS.md           the accumulating record
EVALUATION.md         what each scoring criterion means
```

Runs are gitignored. They are disposable; the verdicts are the artefact worth keeping.
