# Dreative evaluation package

This directory is the small, versioned review surface for the Dreative testbed.
It lets a reviewer understand the test, reproduce it, and judge a run without
committing Dreative's generated prototypes, caches, traces, or build output.

## Contents

- `test-plan.md` defines the baseline contract, test procedure, and pass criteria.
- `current-run.md` is updated in place for the run being submitted. It contains
  the public decision trail and final review, not private reasoning.
- `screenshots/README.md` defines the small set of useful visual evidence.

The application source remains the authority for the implementation. The
repository's `README.md`, `AGENTS.md`, and installed Dreative skill snapshot
provide the surrounding harness and instructions.

## Reviewer quick start

1. Read `test-plan.md` and the submitted `current-run.md`.
2. Inspect the source diff from the `baseline` tag.
3. Run `npm ci`, then `npm run build` and `npm run dev`.
4. Exercise the preservation checks and viewport checks in `test-plan.md`.
5. Compare the rendered result with the submitted screenshots, if present.

## What belongs here

Commit concise Markdown/JSON summaries and a few current screenshots. Do not
copy generated application bundles into this directory. As a practical limit,
keep the whole package below 10 MB, each image below 2 MB, and replace evidence
from an older run instead of accumulating it.

The following remain intentionally ignored outside this allowlisted directory:
prototypes, build output, caches, traces, raw evidence, critic scratch work, and
archived runs. Those can be shared separately when a specific debugging audit
requires them.

## Agent routing contract

The presence of this file opts the testbed into Dreative's evaluator handoff.
During a run, update `current-run.md` after direction/configuration and again
after rendered verification. Record observable product findings, summarized
alternatives, selection reasons, promises, material changes and their triggers,
what shipped, corrections, checks, and limitations.

Do not record chain-of-thought, private exploration, raw chat transcripts,
discarded scratch notes, secrets, or unrelated repository state. Do not change
`test-plan.md` to make a weak run pass. Replace prior-run screenshots instead of
accumulating them. If the run is incomplete, say so plainly in `current-run.md`.
