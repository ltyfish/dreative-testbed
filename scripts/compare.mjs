#!/usr/bin/env node
// Build a blind side-by-side comparison page for one scenario.
//
//   node scripts/compare.mjs --scenario coffee-roaster
//
// Left/right assignment is randomised and the arm labels are withheld until you
// have committed a verdict. This is the point of the whole harness: if you can
// see which one Dreative built, you are scoring the label and not the design.

import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const RUNS = path.join(ROOT, 'runs')

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? process.argv[i + 1] : undefined
}

const scenario = arg('scenario')
if (!scenario) {
  console.error('usage: node scripts/compare.mjs --scenario <name>')
  process.exit(1)
}

const runs = fs
  .readdirSync(RUNS)
  .filter((d) => d.startsWith(`${scenario}__`))
  .map((d) => ({ dir: d, meta: JSON.parse(fs.readFileSync(path.join(RUNS, d, 'run.json'), 'utf8')) }))
  .filter((r) => fs.existsSync(path.join(RUNS, r.dir, '.captures', 'desktop.png')))

const withArm = runs.filter((r) => r.meta.arm === 'with').at(-1)
const withoutArm = runs.filter((r) => r.meta.arm === 'without').at(-1)

if (!withArm || !withoutArm) {
  console.error(`need one captured "with" run and one captured "without" run for ${scenario}`)
  console.error(`found: ${runs.map((r) => r.dir).join(', ') || 'none'}`)
  process.exit(1)
}

// Coin flip decides which arm is shown as A.
const flip = Math.random() < 0.5
const sideA = flip ? withArm : withoutArm
const sideB = flip ? withoutArm : withArm

const dataUri = (runDir, file) =>
  `data:image/png;base64,${fs.readFileSync(path.join(RUNS, runDir, '.captures', file)).toString('base64')}`

const shots = {
  aDesktop: dataUri(sideA.dir, 'desktop.png'),
  aMobile: dataUri(sideA.dir, 'mobile.png'),
  bDesktop: dataUri(sideB.dir, 'desktop.png'),
  bMobile: dataUri(sideB.dir, 'mobile.png'),
}

const CRITERIA = [
  ['distinct', 'Distinctiveness', 'Could this be any other company? Does it look like a template with the words changed?'],
  ['fit', 'Fit to the product', 'Does the design say something true about this specific business, or is it generic polish?'],
  ['hierarchy', 'Hierarchy and pacing', 'Does your eye know where to go? Do sections have different weight, or is everything shouting equally?'],
  ['craft', 'Craft', 'Spacing, type, alignment, colour, edges. Look for the small wrongness.'],
  ['mobile', 'Mobile', 'Is the 390px version designed, or is it the desktop layout surviving?'],
  ['restraint', 'Restraint', 'Is the effort spent where it matters, or is there decoration doing no work?'],
]

const html = `<!doctype html>
<meta charset="utf-8">
<title>Blind comparison — ${scenario}</title>
<style>
  :root { color-scheme: light dark; --bg:#0f1115; --fg:#e8eaf0; --mut:#9aa2b1; --line:#272b35; --card:#171a21; --acc:#6ea8ff; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }
  header { padding:20px 24px; border-bottom:1px solid var(--line); position:sticky; top:0; background:var(--bg); z-index:10; }
  h1 { margin:0 0 4px; font-size:17px; letter-spacing:-.01em; }
  .sub { color:var(--mut); font-size:13px; }
  .wrap { display:grid; grid-template-columns:1fr 1fr; gap:20px; padding:24px; }
  .col { min-width:0; }
  .tag { font:600 13px/1 ui-monospace,monospace; padding:8px 10px; background:var(--card); border:1px solid var(--line); border-radius:6px; display:inline-block; margin-bottom:10px; }
  .shot { width:100%; border:1px solid var(--line); border-radius:8px; display:block; margin-bottom:14px; background:#fff; }
  .shot.mobile { width:min(300px,100%); }
  .lbl { color:var(--mut); font-size:12px; text-transform:uppercase; letter-spacing:.06em; margin:14px 0 6px; }
  .panel { margin:0 24px 40px; padding:20px; background:var(--card); border:1px solid var(--line); border-radius:10px; }
  table { width:100%; border-collapse:collapse; }
  td, th { text-align:left; padding:9px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { color:var(--mut); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.05em; }
  .why { color:var(--mut); font-size:12.5px; font-weight:400; display:block; margin-top:3px; }
  .choices { display:flex; gap:6px; }
  label.pick { cursor:pointer; padding:5px 11px; border:1px solid var(--line); border-radius:999px; font-size:13px; user-select:none; white-space:nowrap; }
  label.pick:has(input:checked) { background:var(--acc); color:#06101f; border-color:var(--acc); font-weight:600; }
  label.pick input { display:none; }
  textarea { width:100%; min-height:80px; background:var(--bg); color:var(--fg); border:1px solid var(--line); border-radius:6px; padding:10px; font:inherit; resize:vertical; }
  button { background:var(--acc); color:#06101f; border:0; border-radius:7px; padding:11px 18px; font:600 14px ui-sans-serif,system-ui,sans-serif; cursor:pointer; }
  button:disabled { opacity:.4; cursor:not-allowed; }
  #reveal { margin-top:18px; padding:16px; border:1px dashed var(--line); border-radius:8px; display:none; }
  #reveal.show { display:block; }
  code { background:#0b0d12; padding:2px 6px; border-radius:4px; font-size:13px; }
  pre { background:#0b0d12; padding:14px; border-radius:8px; overflow:auto; font-size:12.5px; }
  @media (max-width:900px){ .wrap { grid-template-columns:1fr; } }
</style>

<header>
  <h1>Blind comparison — ${scenario}</h1>
  <div class="sub">One of these was built with Dreative. You will not be told which until you score it. Judge the pixels.</div>
</header>

<div class="wrap">
  <div class="col">
    <div class="tag">DESIGN A</div>
    <div class="lbl">Desktop · 1440</div>
    <img class="shot" src="${shots.aDesktop}" alt="Design A desktop">
    <div class="lbl">Mobile · 390</div>
    <img class="shot mobile" src="${shots.aMobile}" alt="Design A mobile">
  </div>
  <div class="col">
    <div class="tag">DESIGN B</div>
    <div class="lbl">Desktop · 1440</div>
    <img class="shot" src="${shots.bDesktop}" alt="Design B desktop">
    <div class="lbl">Mobile · 390</div>
    <img class="shot mobile" src="${shots.bMobile}" alt="Design B mobile">
  </div>
</div>

<div class="panel">
  <table>
    <tr><th style="width:42%">Criterion</th><th>Which is better?</th></tr>
    ${CRITERIA.map(
      ([key, name, why]) => `<tr>
      <td><strong>${name}</strong><span class="why">${why}</span></td>
      <td><div class="choices">
        ${['A', 'Tie', 'B']
          .map(
            (v) =>
              `<label class="pick"><input type="radio" name="${key}" value="${v}">${v}</label>`,
          )
          .join('')}
      </div></td>
    </tr>`,
    ).join('')}
    <tr>
      <td><strong>Overall</strong><span class="why">Which would you actually ship for this client?</span></td>
      <td><div class="choices">
        ${['A', 'Tie', 'B'].map((v) => `<label class="pick"><input type="radio" name="overall" value="${v}">${v}</label>`).join('')}
      </div></td>
    </tr>
  </table>

  <p class="lbl">Notes — what specifically made the difference?</p>
  <textarea id="notes" placeholder="The worst thing about the winner. The best thing about the loser."></textarea>

  <p style="margin-top:16px"><button id="submit">Lock in verdict and reveal</button></p>

  <div id="reveal">
    <p><strong>Design A</strong> was <code id="ra"></code> &nbsp;·&nbsp; <strong>Design B</strong> was <code id="rb"></code></p>
    <p id="conclusion" style="font-size:15px"></p>
    <p class="lbl">Append this to VERDICTS.md</p>
    <pre id="record"></pre>
  </div>
</div>

<script>
  const MAP = { A: ${JSON.stringify(sideA.meta.arm)}, B: ${JSON.stringify(sideB.meta.arm)} };
  const DIRS = { A: ${JSON.stringify(sideA.dir)}, B: ${JSON.stringify(sideB.dir)} };
  const CRITERIA = ${JSON.stringify(CRITERIA.map(([k, n]) => [k, n]))};
  const pretty = (arm) => arm === 'with' ? 'WITH Dreative' : 'WITHOUT Dreative (control)';

  document.getElementById('submit').addEventListener('click', () => {
    const picks = {};
    for (const [key, name] of [...CRITERIA, ['overall', 'Overall']]) {
      const el = document.querySelector('input[name="' + key + '"]:checked');
      picks[key] = { name, value: el ? el.value : '—' };
    }
    if (picks.overall.value === '—') { alert('Score "Overall" at least.'); return; }

    document.getElementById('ra').textContent = pretty(MAP.A);
    document.getElementById('rb').textContent = pretty(MAP.B);

    const winnerArm = picks.overall.value === 'Tie' ? 'tie' : MAP[picks.overall.value];
    const conclusion =
      winnerArm === 'tie'
        ? 'Tie. On this scenario the skill did not produce a visible advantage.'
        : winnerArm === 'with'
          ? 'The Dreative build won. That is one data point of real value.'
          : 'The control won. The skill made the output worse on this scenario — the most useful result you can get.';
    document.getElementById('conclusion').textContent = conclusion;

    const rows = [...CRITERIA, ['overall', 'Overall']]
      .map(([key]) => {
        const p = picks[key];
        const arm = p.value === 'Tie' || p.value === '—' ? p.value : pretty(MAP[p.value]);
        return '| ' + p.name + ' | ' + arm + ' |';
      })
      .join('\\n');

    document.getElementById('record').textContent =
      '## ' + ${JSON.stringify(scenario)} + ' — ' + new Date().toISOString().slice(0, 10) + '\\n\\n' +
      '- with:    ' + DIRS[MAP.A === 'with' ? 'A' : 'B'] + '\\n' +
      '- without: ' + DIRS[MAP.A === 'without' ? 'A' : 'B'] + '\\n\\n' +
      '| Criterion | Winner |\\n|---|---|\\n' + rows + '\\n\\n' +
      'Notes: ' + (document.getElementById('notes').value || '—') + '\\n';

    document.getElementById('reveal').classList.add('show');
    document.getElementById('submit').disabled = true;
    document.getElementById('reveal').scrollIntoView({ behavior: 'smooth' });
  });
</script>
`

const out = path.join(ROOT, 'runs', `compare-${scenario}.html`)
fs.writeFileSync(out, html, 'utf8')
console.log(`\nblind comparison written: runs/compare-${scenario}.html`)
console.log(`open it, score it, then paste the record block into VERDICTS.md\n`)
