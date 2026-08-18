// Turning a `claude -p --output-format stream-json` byte stream into (a) a readable
// transcript and (b) an answer to "which skill files did the builder actually open?".
//
// Why this exists: with the default output format, `claude -p` prints ONLY the final
// assistant message. Every archived agent.log is therefore a prompt plus a summary, and
// contains zero tool calls — which is why a grep for REFERENCE_ADOPTION across every round
// returned nothing for *every* reference file, SLOP.md and PRINCIPLES.md included. That was
// read as "the builder never opens routed files". It was never evidence of anything: the
// harness could not see a file read even in principle. Same class of mistake as DL-014.
//
// Anything derived here is observation, never a gate. Nothing in the skill is scored on it.

/** File-path-bearing arguments, in the order tools actually use them. */
const PATH_KEYS = ['file_path', 'path', 'notebook_path', 'pattern']

// A builder told to prefer Bash reads files with `cat`, not with Read. The first
// instrumented round (202608181141) recorded 27 Reads — every one a screenshot — and 56
// Bash calls, six of which cat'd skill files. `skillFilesRead` came out empty and read as
// "the skill never loaded". It had loaded; the parser was watching the wrong tool.
//
// Two rules keep the Bash scan honest:
//   - only content-reading utilities count. `wc -l skills/*.md` and `ls references/` are
//     surveys; counting them would have reported motion.md as read when it was not.
//   - globs never count. A path containing `*` names a set, not a file that was opened.
const SKILL_DIRS = 'references|exemplars|skills|frameworks|systems|schemas|agents'
const READING_UTIL = /(^|[|;&(]|\s)(cat|bat|head|tail|less|more|sed|awk|grep|rg)\s/
const SKILL_FILE = new RegExp(
  String.raw`(?:^|[\s'"=\/])((?:${SKILL_DIRS})\/[A-Za-z0-9_.-]+\.(?:md|txt|ya?ml|json)|SKILL\.md|PLAN\.md|llms\.txt)`,
  'g',
)

/** Skill-relative paths a Bash command actually opened. Empty for surveys and globs. */
function skillPathsFromCommand(cmd) {
  if (typeof cmd !== 'string' || !cmd) return []
  const norm = cmd.replace(/\\/g, '/')
  if (!/skills\/dreative/i.test(norm)) return []
  if (!READING_UTIL.test(norm)) return []
  const out = new Set()
  for (const m of norm.matchAll(SKILL_FILE)) {
    if (!m[1].includes('*') && !m[1].includes('?')) out.add(m[1])
  }
  return [...out]
}

function pathFromInput(input) {
  if (!input || typeof input !== 'object') return null
  for (const key of PATH_KEYS) {
    const v = input[key]
    if (typeof v === 'string' && v) return v
  }
  return null
}

/**
 * Every tool call in a recorded stream, as one compact JSON line each.
 *
 * `runs/` is gitignored and `agent.jsonl` runs to ~11MB a session, so neither survives a
 * round being archived — which meant that when this parser was fixed on 2026-08-18, the
 * only reason the round could be re-derived at all was that `runs/` happened to still be
 * on the same machine. Anything already archived was unrecoverable. A distilled call log
 * is ~130KB and keeps a round answerable by a parser that does not exist yet.
 */
export function distillToolCalls(buf) {
  const out = []
  for (const line of String(buf).split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('{')) continue
    let ev
    try { ev = JSON.parse(trimmed) } catch { continue }
    if (ev?.type !== 'assistant') continue
    for (const block of ev.message?.content ?? []) {
      if (block.type === 'tool_use') out.push(JSON.stringify({ tool: block.name, input: block.input }))
    }
  }
  return out.length ? `${out.join('\n')}\n` : ''
}

/** `…/skills/dreative/references/MEDIA_SOURCES.md` -> `references/MEDIA_SOURCES.md`. */
export function skillRelativePath(p) {
  if (typeof p !== 'string') return null
  const m = p.replace(/\\/g, '/').match(/skills\/dreative\/(.+)$/i)
  return m ? m[1] : null
}

/**
 * Consumes stream-json lines and accumulates both a human transcript and a record of which
 * skill files were opened. Tolerant of partial lines, non-JSON noise, and unknown event
 * types — a parser that throws would cost a whole session.
 */
export function createTranscript() {
  let carry = ''
  const chunks = []
  const skillReads = new Map() // skill-relative path -> times opened
  const toolCounts = new Map()
  let sawJson = false
  let lastText = '' // the final `result` repeats the last assistant message verbatim

  const note = (text) => { if (text) chunks.push(text) }

  function handleEvent(ev) {
    if (!ev || typeof ev !== 'object') return
    if (ev.type === 'assistant' && ev.message?.content) {
      for (const block of ev.message.content) {
        if (block.type === 'text') { note(block.text); lastText = block.text.trim() }
        if (block.type === 'tool_use') {
          toolCounts.set(block.name, (toolCounts.get(block.name) ?? 0) + 1)
          const p = pathFromInput(block.input)
          const hits = new Set()
          const rel = skillRelativePath(p)
          if (rel) hits.add(rel)
          if (block.name === 'Bash') for (const r of skillPathsFromCommand(block.input?.command)) hits.add(r)
          for (const r of hits) skillReads.set(r, (skillReads.get(r) ?? 0) + 1)
          const shown = p || [...hits].join(' ')
          note(`
  → ${block.name}${shown ? ` ${shown}` : ''}
`)
        }
      }
    }
    if (ev.type === 'result' && typeof ev.result === 'string' && ev.result.trim() !== lastText) {
      note(`\n\n${ev.result}\n`)
    }
  }

  return {
    /** Feed raw stdout/stderr. Returns readable text to append to agent.log. */
    write(buf) {
      const before = chunks.length
      carry += String(buf)
      const lines = carry.split('\n')
      carry = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (trimmed.startsWith('{')) {
          try {
            handleEvent(JSON.parse(trimmed))
            sawJson = true
            continue
          } catch {
            // fall through: not a complete JSON object
          }
        }
        note(`${line}\n`) // plain output (codex, stderr, crash traces)
      }
      return chunks.splice(before).join('')
    },
    /** Flush anything left in the buffer when the process exits. */
    end() {
      const rest = carry
      carry = ''
      return rest ? `${rest}\n` : ''
    },
    /** What the session opened. `null` when the stream carried no JSON to read. */
    summary() {
      if (!sawJson) return null
      return {
        skillFilesRead: Object.fromEntries([...skillReads].sort((a, b) => a[0].localeCompare(b[0]))),
        toolCalls: Object.fromEntries([...toolCounts].sort((a, b) => b[1] - a[1])),
      }
    },
  }
}
