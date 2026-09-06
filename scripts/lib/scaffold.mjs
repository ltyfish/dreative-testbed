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

  // Nothing here tells the agent how to look at its own work, and that is deliberate.
  //
  // It did briefly. A harness-written `npm run look` script was added on 2026-09-05 and named
  // in the brief — which is exactly the "teaching to the test" that smoke.mjs is kept out of
  // the brief to avoid. No real user has that script, so a round measuring it measured the
  // fixture. The capability now arrives the two ways it reaches a real user: a browser MCP in
  // the run (writeMcpConfig below), and `dreative look` in the shipped CLI. The agent finds
  // both the way a user's agent does — in its tool list, and in the skill it was told to use.
  return `Work in the project at ${runDir.replace(/\\/g, '/')}

${brief}${baselineLine}

${skillLine}

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

/**
 * The MCP servers a run gets, written where the agent discovers them by itself.
 *
 * A normal user installs a browser MCP and their agent finds it in its tool list. Until
 * 2026-09-06 a testbed session had none — `~/.claude.json` carries no servers and a spawned
 * `claude -p` inherits nothing — so every run was blind while the skill told it to inspect
 * the rendered page at roughly twenty points. That made the harness *less* capable than the
 * environment it is supposed to stand in for, which is the worse direction to be wrong in:
 * it produces defects that no real user would ever see and reads them as design decisions.
 *
 * `@playwright/mcp` is the official Playwright server and the ordinary choice for a headless
 * agent. `--headless` because nobody is watching, and `--isolated` because a round runs three
 * sessions at once and a shared browser profile would have them fighting over one window.
 *
 * Written for EVERY arm, control included. It is environment, not skill — the same argument
 * that gives both arms WebSearch (see ALLOWED_TOOLS in run-all.mjs). An instrument handed to
 * one side would show up in the verdict as something the skill did.
 */
export function writeMcpConfig(runDir) {
  const cli = path.join(ROOT, 'node_modules', '@playwright', 'mcp', 'cli.js')
  if (!fs.existsSync(cli)) return null
  const config = {
    mcpServers: {
      playwright: {
        command: process.execPath,
        args: [cli, '--headless', '--isolated', '--viewport-size', '1440,900'],
      },
    },
  }
  const file = path.join(runDir, '.mcp.json')
  fs.writeFileSync(file, JSON.stringify(config, null, 2), 'utf8')
  return file
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

    // Extra enforcement changes the treatment being tested. Ordinary rounds use
    // the installed skill; this historical intervention is an explicit experiment.
    if (process.env.DREATIVE_EXPERIMENT_READ_ONCE === '1') {
      const hookCommand = `node "${path.join(ROOT, 'scripts', 'hooks', 'read-once.mjs').replace(/\\/g, '/')}"`
      const settingsFile = path.join(runDir, '.claude', 'settings.json')
      const settings = fs.existsSync(settingsFile) ? JSON.parse(fs.readFileSync(settingsFile, 'utf8')) : {}
      settings.hooks ??= {}
      settings.hooks.PreToolUse ??= []
      settings.hooks.PreToolUse.push({ matcher: 'Read|Bash', hooks: [{ type: 'command', command: hookCommand }] })
      fs.mkdirSync(path.dirname(settingsFile), { recursive: true })
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8')
    }
  }

  // Both arms, always. See writeMcpConfig.
  writeMcpConfig(runDir)

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
        readOnceExperiment: isSkillArm(arm) && process.env.DREATIVE_EXPERIMENT_READ_ONCE === '1',
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
