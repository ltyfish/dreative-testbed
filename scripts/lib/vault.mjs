// Verdicts survive a round reset in VERDICTS.md, but the project's own memory lives in the
// Obsidian vault, and syncing it by hand is how rounds got scored and then forgotten. This
// appends one line per verdict to the vault CHANGELOG under a dated heading.
//
// It is deliberately one-way and additive: it never edits an existing line, never touches
// HANDOFF/TODO/DECISIONS (those carry judgement, not records), and no-ops when the vault is
// not on this machine. Set DREATIVE_VAULT to override the path.

import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_VAULT = 'C:/Users/lty/Downloads/PC_SYNC/Projects/Dreative'

export function vaultDir() {
  const dir = process.env.DREATIVE_VAULT || DEFAULT_VAULT
  return fs.existsSync(dir) ? dir : null
}

function winnerWord(overall) {
  if (overall === 'with') return 'Dreative'
  if (overall === 'without') return 'control'
  return 'Tie'
}

/** Append one verdict line to the vault CHANGELOG. Returns the file written, or null. */
export function recordVerdict(record) {
  const dir = vaultDir()
  if (!dir) return null
  const file = path.join(dir, 'CHANGELOG.md')
  if (!fs.existsSync(file)) return null

  const day = record.judgedAt.slice(0, 10)
  const heading = `## ${day}`
  const round = (record.runs.with.split('__').pop() || '').trim()
  const losses = Object.entries(record.criteria)
    .filter(([, v]) => v === 'without')
    .map(([k]) => k)
  const detail = losses.length ? ` (control took ${losses.join(', ')})` : ''
  const line = `- Blind verdict — **${record.scenario}** round \`${round}\`: **${winnerWord(record.overall)}**${detail}. Verbatim feedback in the testbed's \`VERDICTS.md\`\n`

  let text = fs.readFileSync(file, 'utf8')
  if (text.includes(line.trim())) return file
  if (text.includes(heading)) {
    // Insert directly under today's heading so the day's entries stay together.
    const at = text.indexOf(heading) + heading.length
    const nl = text.indexOf('\n', at)
    text = `${text.slice(0, nl + 1)}\n${line}${text.slice(nl + 1)}`
  } else {
    text = `${text.replace(/\s*$/, '')}\n\n${heading}\n\n${line}`
  }
  fs.writeFileSync(file, text, 'utf8')
  return file
}
