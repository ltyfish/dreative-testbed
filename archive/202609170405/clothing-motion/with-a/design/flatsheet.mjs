import fs from 'node:fs'
import { FLATS, PALETTES, flat } from './flats.mjs'
const names = Object.keys(FLATS)
const cells = names.map(n => `<figure>${flat(n, PALETTES.paper, 'width="200" height="300"')}<figcaption>${n}</figcaption></figure>`).join('')
const dark = names.map(n => `<figure class=d>${flat(n, PALETTES.ink, 'width="200" height="300"')}<figcaption>${n}</figcaption></figure>`).join('')
fs.writeFileSync('design/flats.html', `<style>
body{margin:0;background:#efe9dd;font:11px ui-monospace,monospace;color:#1a1a18;padding:16px}
.row{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;background:#fff;padding:8px}
figure.d{background:#14171c;color:#d9d2c4}figcaption{text-transform:uppercase;letter-spacing:.1em;margin-top:6px}
h2{font:11px ui-monospace,monospace;letter-spacing:.2em;text-transform:uppercase}
</style><h2>paper palette</h2><div class=row>${cells}</div><h2>ink palette</h2><div class=row style="background:#14171c;padding:12px">${dark}</div>`)
