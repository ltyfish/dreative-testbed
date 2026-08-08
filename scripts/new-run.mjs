#!/usr/bin/env node
// Scaffold an isolated run directory for one scenario and one arm.
//
//   node scripts/new-run.mjs --scenario coffee-roaster --arm with
//
// Arms:
//   with     — the agent is told to use the Dreative skill
//   without  — the agent gets the same brief and no skill (the control)
//
// The run is a real, standalone Vite project so the agent edits real code.
// node_modules is linked from the repo root, so scaffolding is instant.

import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const scenario = arg('scenario')
const arm = arg('arm')
const label = arg('label')

const scenarioDir = path.join(ROOT, 'scenarios', scenario ?? '')
if (!scenario || !fs.existsSync(scenarioDir)) {
  const available = fs.readdirSync(path.join(ROOT, 'scenarios'))
  console.error(`usage: node scripts/new-run.mjs --scenario <name> --arm with|without [--label note]`)
  console.error(`scenarios: ${available.join(', ')}`)
  process.exit(1)
}
if (arm !== 'with' && arm !== 'without') {
  console.error(`--arm must be "with" (Dreative) or "without" (control)`)
  process.exit(1)
}

const meta = JSON.parse(fs.readFileSync(path.join(scenarioDir, 'scenario.json'), 'utf8'))

const runsDir = path.join(ROOT, 'runs')
fs.mkdirSync(runsDir, { recursive: true })
const seq = String(
  fs.readdirSync(runsDir).filter((d) => d.startsWith(`${scenario}__`)).length + 1,
).padStart(2, '0')
const runName = [scenario, arm, seq, label].filter(Boolean).join('__')
const runDir = path.join(runsDir, runName)

if (fs.existsSync(runDir)) {
  console.error(`run already exists: ${runDir}`)
  process.exit(1)
}

// Copy the shared project template, then the scenario source on top of it.
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

// Share one node_modules across every run. Junctions need no admin rights on Windows.
const linkTarget = path.join(ROOT, 'node_modules')
const linkPath = path.join(runDir, 'node_modules')
if (fs.existsSync(linkTarget)) {
  try {
    fs.symlinkSync(linkTarget, linkPath, 'junction')
  } catch {
    console.warn('could not link node_modules; run `npm install` inside the run directory')
  }
} else {
  console.warn('no node_modules at repo root; run `npm install` there first')
}

// The skill is installed into the "with" run only. The control run must contain no skill
// files and no agent pointer at all, or it is not a control.
if (arm === 'with') {
  let installed = false
  for (const dir of ['.claude', '.codex']) {
    const src = path.join(ROOT, dir)
    if (fs.existsSync(src)) {
      fs.cpSync(src, path.join(runDir, dir), { recursive: true })
      installed = true
    }
  }
  if (fs.existsSync(path.join(ROOT, 'AGENTS.md'))) {
    fs.cpSync(path.join(ROOT, 'AGENTS.md'), path.join(runDir, 'AGENTS.md'))
  }
  if (!installed) {
    console.warn(
      'WARNING: no .claude or .codex skill found at the repo root.\n' +
        'Run `npm i -g dreative@latest && dreative install-skill --codex` here first,\n' +
        'otherwise the "with" arm is not actually using the skill.',
    )
  }
}

// The brief the agent receives. Identical in both arms except the skill instruction,
// so any quality difference is attributable to the skill rather than the prompt.
const skillLine =
  arm === 'with'
    ? `Use the Dreative skill for this work.`
    : `Do not use any design skill, framework, or checklist beyond your own judgement.`

const prompt = `${meta.prompt}

${skillLine}

Work only inside this directory. Preserve the following, which are product requirements rather than design opinions:
${meta.preserve.map((p) => `- ${p}`).join('\n')}
`

fs.writeFileSync(path.join(runDir, 'BRIEF.md'), `# Brief — ${meta.product} (${arm} Dreative)\n\n${prompt}`, 'utf8')
fs.writeFileSync(
  path.join(runDir, 'run.json'),
  JSON.stringify({ scenario, arm, seq, label: label ?? null, product: meta.product, field: meta.field }, null, 2),
  'utf8',
)

console.log(`\nrun ready:  runs/${runName}`)
console.log(`preview:    cd runs/${runName} && npm run dev`)
console.log(`\n--- paste this to the agent -------------------------------------\n`)
console.log(`Work in the project at ${runDir.replace(/\\/g, '/')}\n`)
console.log(prompt)
console.log(`-----------------------------------------------------------------\n`)
