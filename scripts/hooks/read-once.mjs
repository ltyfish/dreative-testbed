// PreToolUse hook: deny a second Read of the same skill file within one session.
//
// SKILL.md line 21 already says re-reading "buys nothing and costs the whole file again",
// and DL-020 shipped that rule as prose. Run 202608221603 then read PRINCIPLES.md,
// SLOP.md and CREATIVE_DIRECTION.md twice each — 18 total reads against 15 distinct files.
// Prose cannot enforce itself; the harness can.
//
// Scope is deliberately narrow. Only files under a `skills/dreative` directory are
// guarded, so the control arm — which has no such directory — is never affected, and a
// session re-reading its own source, its screenshots, or anything else is untouched.
//
// NOTE this is a testbed instrument, not shipped behaviour. A real installation has no
// such hook, so a round run with it measures "would enforcement help", not "what users
// get". If it helps, that is the argument for shipping a hook alongside the skill.

import fs from 'node:fs'
import path from 'node:path'

const LEDGER = process.env.DREATIVE_READ_LEDGER || path.join(process.cwd(), '.read-ledger.json')

const read = () => {
  try {
    return JSON.parse(fs.readFileSync(LEDGER, 'utf8'))
  } catch {
    return {}
  }
}

let raw = ''
process.stdin.setEncoding('utf8')
for await (const chunk of process.stdin) raw += chunk

let input
try {
  input = JSON.parse(raw)
} catch {
  // A hook that crashes on malformed input would block every read in the session, which
  // is a far worse failure than letting one duplicate through.
  process.exit(0)
}

const file = input?.tool_input?.file_path
if (!file) process.exit(0)

const normalised = file.replace(/\\/g, '/')
if (!/skills\/dreative\//i.test(normalised)) process.exit(0)

// Keyed on the path below the skill root, so the two installed copies (.claude and
// .codex) of one file count as the same file rather than as two budgets.
const key = normalised.replace(/^.*skills\/dreative\//i, '')
const ledger = read()

if (ledger[key]) {
  // Recorded because a denial leaves no trace in reads.json — that file would show one
  // read either way, so without this you cannot tell "enforcement worked" from "the
  // session never tried". The count of attempts is the measurement.
  try {
    fs.appendFileSync(LEDGER.replace(/\.json$/, '-denied.log'), key + '\n', 'utf8')
  } catch {
    /* logging is not worth failing a session over */
  }
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `${key} was already read in this session. Its content has not changed, so re-reading returns the same text and costs the whole file again. Work from what it said the first time; if you cannot recall it, that is a note to write down, not a file to reopen.`,
      },
    }),
  )
  process.exit(0)
}

ledger[key] = true
try {
  fs.writeFileSync(LEDGER, JSON.stringify(ledger), 'utf8')
} catch {
  /* an unwritable ledger degrades to no enforcement, which is the safe direction */
}
process.exit(0)
