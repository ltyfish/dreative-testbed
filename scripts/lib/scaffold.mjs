// Shared run scaffolding. Used by new-run.mjs (manual) and run-all.mjs (automated).

import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

export const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..')
export const RUNS = path.join(ROOT, 'runs')

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
export function buildPrompt(meta, arm, runDir) {
  const skillLine =
    arm === 'with'
      ? 'Use the Dreative skill for this work. It is installed in this project.'
      : 'Do not use any design skill, framework, or checklist beyond your own judgement.'

  return `Work in the project at ${runDir.replace(/\\/g, '/')}

${meta.prompt}

${skillLine}

Work only inside this directory. Preserve the following, which are product requirements rather than design opinions:
${meta.preserve.map((p) => `- ${p}`).join('\n')}

When you are done, make sure \`npm run build\` succeeds. Do not commit anything.`
}

/** Create an isolated, real Vite project for one scenario and one arm. */
export function scaffoldRun({ scenario, arm, label, seq }) {
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
  fs.cpSync(path.join(scenarioDir, 'App.jsx'), path.join(runDir, 'src', 'App.jsx'))
  fs.cpSync(path.join(scenarioDir, 'styles.css'), path.join(runDir, 'src', 'styles.css'))
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

  // The skill goes into the "with" arm only. A control containing skill files is not a control.
  if (arm === 'with') {
    for (const dir of ['.claude', '.codex']) {
      const src = path.join(ROOT, dir)
      if (fs.existsSync(src)) fs.cpSync(src, path.join(runDir, dir), { recursive: true })
    }
    const agents = path.join(ROOT, 'AGENTS.md')
    if (fs.existsSync(agents)) fs.cpSync(agents, path.join(runDir, 'AGENTS.md'))
  }

  const prompt = buildPrompt(meta, arm, runDir)
  fs.writeFileSync(path.join(runDir, 'BRIEF.md'), `# Brief — ${meta.product} (${arm} Dreative)\n\n${prompt}\n`, 'utf8')
  fs.writeFileSync(
    path.join(runDir, 'run.json'),
    JSON.stringify(
      { scenario, arm, seq: index, label: label ?? null, product: meta.product, field: meta.field },
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
