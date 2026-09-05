// Shared run scaffolding. Used by new-run.mjs (manual) and run-all.mjs (automated).

import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

export const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..')
export const RUNS = path.join(ROOT, 'runs')

/**
 * Which arms carry the skill. `with` is the original single Dreative arm; `with-<name>`
 * is one side of a Dreative-vs-Dreative round, where both sides have the skill and the
 * variable under test is something else — the direction, a local skill edit, or plain
 * run-to-run variance. Anything else is a control.
 */
export function isSkillArm(arm) {
  return arm === 'with' || String(arm).startsWith('with-')
}

/** Human name for an arm. Used everywhere an arm is revealed, never before. */
export function armTitle(arm) {
  if (arm === 'without') return 'CONTROL — no skill'
  if (arm === 'with') return 'WITH Dreative'
  if (isSkillArm(arm)) return `DREATIVE ${String(arm).slice(5).toUpperCase()}`
  return String(arm).toUpperCase()
}

export function listScenarios() {
  return fs
    .readdirSync(path.join(ROOT, 'scenarios'))
    .filter((d) => fs.existsSync(path.join(ROOT, 'scenarios', d, 'scenario.json')))
    .sort()
}

export function readScenario(name) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'scenarios', name, 'scenario.json'), 'utf8'))
}

/**
 * The brief handed to the agent. Identical across arms except for one line, so any
 * difference in output is attributable to the skill rather than to the wording.
 */
export function buildPrompt(meta, arm, runDir, direction) {
  // Dreative blocks twice on the user: the direction, then the configuration. Unattended
  // there is nobody to ask, so the agent either stalls or quietly falls back and the round
  // silently tests settings you did not pick. Both are neutralised here rather than in the
  // skill: waiting for a reply is correct product behaviour, and a real user is the case
  // the skill is actually for. This is a property of the harness, so it belongs to the
  // harness. The control never sees these gates, and the line costs it nothing.
  const directionLine =
    isSkillArm(arm) && direction
      ? ` Build the ${direction} direction; treat this message as the user's explicit choice of direction and settings. Nobody is available to answer during this session, so take the recommended configuration and build — do not pause for any confirmation.`
      : ''

  const skillLine =
    isSkillArm(arm)
      ? `Use the Dreative skill for this work. It is installed in this project.${directionLine}`
      : 'Do not use any design skill, framework, or checklist beyond your own judgement.'

  // A content-only baseline has no design to redesign, so the "it is currently plain, improve it"
  // framing would be a lie and would still invite an edit-in-place response.
  const contentOnly = meta.baseline === 'content-only'
  const brief = (contentOnly && meta.promptContentOnly) || meta.prompt
  const baselineLine = contentOnly
    ? `\n\n\`src/App.jsx\` holds the required content and behaviour as unstyled markup in no meaningful order, and \`src/styles.css\` is empty. There is no existing design to keep or improve. Decide what sections this page has, in what order, and what it looks like.`
    : ''

  // Eyes. Identical for every arm, and deliberately so: a browser is an environment
  // capability like network access, not a skill advantage, and the same argument that puts
  // WebSearch in both arms (see ALLOWED_TOOLS in run-all.mjs) puts this in both. Before
  // 2026-09-05 a session had no way to render its own output — `202609050422` went looking
  // for chrome.exe on the filesystem, failed, and shipped a page it had never seen — while
  // the skill instructed it to inspect the rendered page at roughly twenty separate points.
  // That was an instruction with no hands, and the rounds concluding "prose changes nothing"
  // were partly measuring that. The wording below reports; it prescribes nothing.
  const lookLine = `
You can see the page. \`npm run look\` builds it, renders it at desktop 1440 and mobile 390,
writes screenshot tiles to \`.look/\`, and prints what a browser can observe that source code
cannot. Read the tiles — they are images, open them. Run it before you consider the work
finished, and again after any change whose appearance you cannot predict.

Its report has two parts and they are not the same kind of thing. BROKEN is output that is
invalid however you feel about it — a viewport-sized hole, text too small to read, a page
that scrolls sideways, an image that never loaded, a reveal that never fired. Fix those.
OBSERVED is neutral fact about what the rendered page does, offered because you cannot
otherwise know it: what changes across a scroll, what does not, what responds to a pointer.
Observations are not defects and there is nothing to hit — decide for yourself what, if
anything, they mean for this page.`

  return `Work in the project at ${runDir.replace(/\\/g, '/')}

${brief}${baselineLine}

${skillLine}
${lookLine}

Work only inside this directory. Preserve the following, which are product requirements rather than design opinions:
${meta.preserve.map((p) => `- ${p}`).join('\n')}

When you are done, make sure \`npm run build\` succeeds. Do not commit anything.`
}

/**
 * Replace the installed skill in a scaffolded run with a specific tree.
 *
 * Both arms of a Dreative-vs-Dreative round otherwise install whatever is in the testbed
 * root, which makes the only available variable the direction — and a direction A/B does
 * not answer "did this edit change anything". Pointing one arm at an older tree does.
 */
function useSkillTree(runDir, treeDir) {
  const src = fs.existsSync(path.join(treeDir, 'SKILL.md')) ? treeDir : path.join(treeDir, 'dreative')
  if (!fs.existsSync(path.join(src, 'SKILL.md'))) {
    throw new Error(`no SKILL.md under ${treeDir} — expected a dreative skill directory`)
  }
  for (const host of ['.claude', '.codex']) {
    const dest = path.join(runDir, host, 'skills', 'dreative')
    if (!fs.existsSync(path.join(runDir, host))) continue
    fs.rmSync(dest, { recursive: true, force: true })
    fs.cpSync(src, dest, { recursive: true })
  }
}

/** Create an isolated, real Vite project for one scenario and one arm. */
export function scaffoldRun({ scenario, arm, label, seq, direction, skillTree, skillLabel }) {
  const scenarioDir = path.join(ROOT, 'scenarios', scenario)
  const meta = readScenario(scenario)

  fs.mkdirSync(RUNS, { recursive: true })
  const index =
    seq ??
    String(fs.readdirSync(RUNS).filter((d) => d.startsWith(`${scenario}__`)).length + 1).padStart(2, '0')
  const runName = [scenario, arm, index, label].filter(Boolean).join('__')
  const runDir = path.join(RUNS, runName)

  if (fs.existsSync(runDir)) throw new Error(`run already exists: ${runName}`)

  fs.cpSync(path.join(ROOT, '_template'), runDir, { recursive: true })

  // A designed baseline hands both arms the same section architecture, and both arms keep it —
  // the 2026-08-16 rounds shipped the fixture's own section list in the fixture's own order, so
  // the comparison could not show a structural difference even in principle. `content-only`
  // gives the same facts and the same behaviour with no architecture at all, so the page has to
  // be designed rather than reordered. See BASELINES.md.
  const contentOnly = meta.baseline === 'content-only'
  fs.cpSync(
    path.join(scenarioDir, contentOnly ? 'content.jsx' : 'App.jsx'),
    path.join(runDir, 'src', 'App.jsx'),
  )
  if (contentOnly) fs.writeFileSync(path.join(runDir, 'src', 'styles.css'), '', 'utf8')
  else fs.cpSync(path.join(scenarioDir, 'styles.css'), path.join(runDir, 'src', 'styles.css'))
  if (fs.existsSync(path.join(scenarioDir, 'public'))) {
    fs.cpSync(path.join(scenarioDir, 'public'), path.join(runDir, 'public'), { recursive: true })
  }

  fs.writeFileSync(
    path.join(runDir, 'index.html'),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${meta.product}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
    'utf8',
  )

  // Share one node_modules. Junctions need no admin rights on Windows.
  const linkTarget = path.join(ROOT, 'node_modules')
  if (fs.existsSync(linkTarget)) {
    try {
      fs.symlinkSync(linkTarget, path.join(runDir, 'node_modules'), 'junction')
    } catch {
      /* caller warns */
    }
  }

  // The skill goes into skill arms only. A control containing skill files is not a control.
  if (isSkillArm(arm)) {
    for (const dir of ['.claude', '.codex']) {
      const src = path.join(ROOT, dir)
      if (fs.existsSync(src)) fs.cpSync(src, path.join(runDir, dir), { recursive: true })
    }
    const agents = path.join(ROOT, 'AGENTS.md')
    if (fs.existsSync(agents)) fs.cpSync(agents, path.join(runDir, 'AGENTS.md'))
    if (skillTree) useSkillTree(runDir, skillTree)

    // Enforce the read-once rule the skill only states. See scripts/hooks/read-once.mjs
    // for why this is a harness instrument rather than shipped behaviour. It guards paths
    // under skills/dreative only, so it is inert for anything the run legitimately reads.
    // Read *and* Bash: this builder opens most skill files with `cat`, so a Read-only
    // matcher guarded the minority path and the hook had no observable effect at all.
    const hookCommand = `node "${path.join(ROOT, 'scripts', 'hooks', 'read-once.mjs').replace(/\\/g, '/')}"`
    const settings = { hooks: { PreToolUse: [{ matcher: 'Read|Bash', hooks: [{ type: 'command', command: hookCommand }] }] } }
    fs.mkdirSync(path.join(runDir, '.claude'), { recursive: true })
    fs.writeFileSync(path.join(runDir, '.claude', 'settings.json'), JSON.stringify(settings, null, 2), 'utf8')
  }

  const prompt = buildPrompt(meta, arm, runDir, direction)
  fs.writeFileSync(path.join(runDir, 'BRIEF.md'), `# Brief — ${meta.product} (${arm} Dreative)\n\n${prompt}\n`, 'utf8')
  fs.writeFileSync(
    path.join(runDir, 'run.json'),
    JSON.stringify(
      {
        scenario,
        arm,
        seq: index,
        label: label ?? null,
        direction: isSkillArm(arm) ? (direction ?? null) : null,
        // Which skill this arm ran, so a verdict cannot be attributed to the wrong build.
        skill: isSkillArm(arm) ? (skillLabel ?? 'installed') : null,
        product: meta.product,
        field: meta.field,
      },
      null,
      2,
    ),
    'utf8',
  )

  return { runName, runDir, prompt, meta }
}

/** True when the "with" arm would actually have a skill to use. */
export function skillInstalled() {
  return fs.existsSync(path.join(ROOT, '.claude')) || fs.existsSync(path.join(ROOT, '.codex'))
}
