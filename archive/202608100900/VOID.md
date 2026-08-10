# Round 202608100900 — VOID, do not score

Direction `recommended`, scenarios `coffee-roaster` and `civic-clinic`.

Three of four sessions died on the provider session limit ("You've hit your
session limit · resets 6:20pm (Asia/Singapore)"). The round finished in eight
minutes, which is the tell — real sessions in this harness take far longer.

Both pairs are broken, in opposite directions:

| Pair | with | without |
|---|---|---|
| coffee-roaster | **never edited — byte-identical to the seed** | completed, 621 lines |
| civic-clinic | edited, 429 lines, itself cut off mid-session | **never edited — byte-identical to the seed** |

Scoring coffee-roaster would record a control win against an untouched seed.
Scoring civic-clinic would record a skill win against an untouched seed. Neither
number would mean anything, and the two errors point opposite ways, so they do
not even cancel.

Nothing here is evidence about the 2026-08-10 rebuild. The sources are kept only
so the failure is inspectable.

## Operational cause

The round was launched at the end of a long build session that had already
consumed most of the day's quota. Four sessions was not the problem by itself;
starting four sessions on a nearly exhausted allowance was. Check remaining
quota before a round, or run one scenario (two sessions) at a time.
