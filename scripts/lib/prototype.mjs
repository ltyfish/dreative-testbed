// The two-phase round: build the signature mechanism, stop, get a decision, then continue.
//
// This is the gate the user actually asked for, and it is a different instrument from the one
// that gates a finished build. That one can only tell you a round was wasted. This one can
// stop it while there is still budget left, which matters because five of the last six rounds
// died mid-work and every one of them spent its best hour on the wrong half of the page.
//
// It also attacks the failure named in every recent verdict: the builder implements the page
// and *then* decorates it, so the expensive moment is whatever was left over — a fade. Phase
// one makes the expensive moment the first thing built, at full fidelity, while the budget is
// untouched, and refuses to let the rest of the page exist until someone has seen it.
//
// The mechanics: `claude -p --session-id <uuid>` assigns the id, `claude -p --resume <uuid>`
// picks the same conversation back up with its context intact. So phase two is genuinely the
// same session continuing, not a second agent reading someone else's work. I previously said
// this was impossible because `-p` is one-shot; that was wrong.
//
// Both arms get identical phase wording. The skill already asks for this (SKILL.md step 3:
// "Build the signature mechanism before the page that will hold it… and look at it running"),
// so the harness is enforcing the protocol the skill states, not adding a requirement to it.

/**
 * Appended to the brief for phase one. Identical for every arm.
 *
 * Deliberately does not say what the mechanism should be, what it should use, or how many of
 * anything. It says when to stop and what "finished" means for this phase.
 */
export const PROTOTYPE_PHASE = `
STOP AFTER THE SIGNATURE MOMENT. This session has two phases and you are in the first.

Build only the one moment this route exists for — the thing the subject does that a static
picture cannot show — at full intended fidelity, on a route that renders and can be scrolled.
Its material must already be on disk and already treated before you write it. Do not build
the other sections. Do not build a simplified version meant to be upgraded later: a
placeholder here is precisely what this checkpoint exists to catch, and a placeholder that
renders correctly never gets replaced.

When it runs, stop and report: what the moment is, what material it moves, what drives it,
and what you could not get. Then end your turn. Someone will look at it and decide whether
the rest of the page gets built. Nothing you write after that report is used.`

/** Sent to the resumed session once the prototype is accepted. Identical for every arm. */
export const CONTINUE_PHASE = `The prototype was accepted. Build the full route around it now.

Keep what you built — it is the anchor, not a draft to be replaced or toned down to match the
rest. Everything else on the page is designed to lead into it and out of it. The interaction
baseline (hover, focus, press, entrance) is part of the route and is not optional.

When you are done, make sure \`npm run build\` succeeds.`

/** Sent when the reviewer rejects the prototype but the round is continuing anyway. */
export const RETRY_PHASE = `The prototype was rejected.

What was built is not the moment this route is for, or is not at the fidelity it needs. Do not
repair it and do not soften it into something safer. Go back to the question — what does this
subject do that a static picture cannot show — and build a different answer, at full fidelity,
with material you have actually obtained. Then stop and report again.`
