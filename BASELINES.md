# Baselines

Each scenario ships the starting project both arms receive. There are two kinds,
and the choice decides what the round is capable of measuring.

## `designed` (default)

`App.jsx` + `styles.css`: a real, mediocre, already-structured page. The brief
says it is plain and asks for a redesign.

**What this can measure:** visual craft, hierarchy inside a section, motion,
legibility, restraint — everything downstream of the page's architecture.

**What it cannot measure: architecture.** Verified on 2026-08-16. Both arms of
`civic-clinic__202608160436` shipped the fixture's own section list —
`status, hours, services, visit, languages, book, footer` — the control in the
fixture's exact order, the Dreative arm with one swap. The same held for
`devtool-docs`, identical in both arms. An earlier round was read as "Dreative
reskins instead of re-composing"; the honest reading is that **both arms
reskinned, because both were handed the composition.** A conclusion about page
structure cannot be drawn from a designed baseline, in either direction.

## `content-only`

`content.jsx` becomes the run's `App.jsx`, and `styles.css` is empty. It carries
every fact and every behaviour the designed baseline had — same copy, same data,
same form, same phone numbers — as flat unstyled markup with no sections, no
ids, no nav, no cards, no table, and no order that means anything. The brief
drops the "currently plain, improve it" framing and says: decide what sections
this page has, in what order, and what it looks like.

Set it in `scenario.json`:

```json
{ "baseline": "content-only", "promptContentOnly": "…design and build that website." }
```

`promptContentOnly` is optional and replaces `prompt` when present, because the
redesign framing is a lie when there is nothing to redesign.

**Keep the two baselines' content identical.** When you edit one, edit the
other, or the arms stop being comparable across rounds.

**Watch for the obvious risk:** a content-only baseline makes both arms slower
and gives both more room to fail. If the control's scores drop as much as the
Dreative arm's, the harder task is what moved, not the skill. Compare *within*
a round, never across baselines.
