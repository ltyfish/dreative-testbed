#!/usr/bin/env node
// Get a freshly cloned copy of this repo ready to run a round.
//
//   node scripts/setup.mjs               # deps, chromium, skill, then verify
//   node scripts/setup.mjs --check       # verify only, change nothing
//   node scripts/setup.mjs --skill-from ../Dreative   # install the skill from a local build
//
// The archive needs none of this — `node scripts/archive.mjs` works on a bare clone. This
// is only required to run new sessions and capture new screenshots.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, listScenarios, skillInstalled } from './lib/scaffold.mjs'

const argv = process.argv.slice(2)
const CHECK_ONLY = argv.includes('--check')
const SKILL_FROM = argv.includes('--skill-from') ? argv[argv.indexOf('--skill-from') + 1] : null

const steps = []
const note = (ok, label, detail = '') => {
  steps.push({ ok, label, detail })
  console.log(`${ok ? '  ok  ' : ' MISS '} ${label}${detail ? ` — ${detail}` : ''}`)
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, shell: true, stdio: 'inherit', ...opts })
  return r.status === 0
}

function has(cmd) {
  const probe = spawnSync(cmd, ['--version'], { shell: true, encoding: 'utf8' })
  return probe.status === 0 ? (probe.stdout || probe.stderr || '').trim().split('\n')[0] : null
}

console.log('\nDreative testbed setup\n')

// ---------------------------------------------------------------- node deps

const depsPresent = fs.existsSync(path.join(ROOT, 'node_modules', 'vite'))
if (!depsPresent && !CHECK_ONLY) {
  console.log('Installing dependencies…')
  run('npm', ['install'])
}
note(fs.existsSync(path.join(ROOT, 'node_modules', 'vite')), 'node dependencies', 'vite, react, playwright')

// ---------------------------------------------------------------- chromium
//
// Playwright's browser download lives outside the repo, so it never comes across with a
// pull. Every new machine needs it once.

let chromiumOk = false
try {
  const { chromium } = await import('playwright')
  const exe = chromium.executablePath()
  chromiumOk = fs.existsSync(exe)
} catch {
  chromiumOk = false
}
if (!chromiumOk && !CHECK_ONLY) {
  console.log('Installing the Chromium build Playwright uses…')
  run('npx', ['playwright', 'install', 'chromium'])
  try {
    const { chromium } = await import('playwright')
    chromiumOk = fs.existsSync(chromium.executablePath())
  } catch {
    /* reported below */
  }
}
note(chromiumOk, 'playwright chromium', chromiumOk ? '' : 'run: npx playwright install chromium')

// ---------------------------------------------------------------- the skill
//
// The skill is deliberately not committed here: the "with" arm must test whatever version
// of Dreative you are currently working on, and a stale committed copy would silently test
// last month's skill. It is installed from a local Dreative checkout or from npm.

if (!skillInstalled() && !CHECK_ONLY) {
  const local = SKILL_FROM ? path.resolve(ROOT, SKILL_FROM) : path.resolve(ROOT, '..', 'Dreative')
  const cli = path.join(local, 'dist', 'cli', 'index.js')
  if (fs.existsSync(cli)) {
    console.log(`Installing the skill from ${local}…`)
    run('node', [JSON.stringify(cli), 'install-skill', '--skills', 'all', '--claude'])
    run('node', [JSON.stringify(cli), 'install-skill', '--skills', 'all', '--codex'])
  } else if (has('dreative')) {
    console.log('Installing the skill from the globally installed dreative CLI…')
    run('dreative', ['install-skill', '--skills', 'all', '--claude'])
    run('dreative', ['install-skill', '--skills', 'all', '--codex'])
  } else {
    console.log('No local Dreative build and no global dreative CLI found.')
  }
}
note(
  skillInstalled(),
  'dreative skill installed at the repo root',
  skillInstalled() ? '' : 'npm i -g dreative@latest && dreative install-skill --skills all --claude --codex',
)

// ---------------------------------------------------------------- agent CLIs

const claude = has('claude')
const codex = has('codex')
note(Boolean(claude || codex), 'an agent CLI on PATH', [claude && `claude ${claude}`, codex && `codex ${codex}`].filter(Boolean).join(' · ') || 'install claude or codex')

// ---------------------------------------------------------------- content

note(listScenarios().length >= 1, 'scenarios', listScenarios().join(', '))
const rounds = fs.existsSync(path.join(ROOT, 'archive'))
  ? fs.readdirSync(path.join(ROOT, 'archive')).filter((d) => fs.existsSync(path.join(ROOT, 'archive', d, 'round.json')))
  : []
note(true, 'archived rounds', rounds.length ? rounds.join(', ') : 'none yet')

// ---------------------------------------------------------------- verdict

const blocking = steps.filter((s) => !s.ok)
console.log('')
if (!blocking.length) {
  console.log('Ready.\n\n  node scripts/run-all.mjs 2       run two random scenarios')
  console.log('  node scripts/review.mjs          score them blind')
  console.log('  node scripts/archive.mjs         browse every past round\n')
} else {
  console.log(`${blocking.length} thing(s) still missing:`)
  for (const s of blocking) console.log(`  - ${s.label}${s.detail ? ` — ${s.detail}` : ''}`)
  console.log('')
  process.exitCode = 1
}
