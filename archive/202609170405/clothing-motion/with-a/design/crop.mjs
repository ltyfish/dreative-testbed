import { chromium } from 'playwright'
import path from 'node:path'
// usage: node design/crop.mjs <file> <width> <out=y:h> ...
const [file, w, ...specs] = process.argv.slice(2)
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: +w, height: 1000 } })
await p.goto('file:///' + path.resolve(file).split(path.sep).join('/'), { waitUntil: 'load' })
await p.waitForTimeout(2500)
for (const s of specs) {
  const [out, y, h] = s.split('=')[0] === s ? [] : [s.split('=')[0], ...s.split('=')[1].split(':')]
  await p.screenshot({ path: out, clip: { x: 0, y: +y, width: +w, height: +h }, fullPage: true })
  console.log('wrote', out)
}
await b.close()
