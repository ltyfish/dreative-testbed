import { chromium } from 'playwright'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const file = process.argv[2]           // a.html
const tag  = process.argv[3]           // a
const shots = JSON.parse(process.argv[4]) // [["hero","#s-hero"],...]
const width = Number(process.argv[5] || 1440)
const suffix = process.argv[6] || ''

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 })
await p.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: 'networkidle' })
await p.waitForTimeout(1800)
for (const [name, sel] of shots) {
  const el = await p.$(sel)
  if (!el) { console.log('MISSING', sel); continue }
  await el.screenshot({ path: `design/${tag}-${name}${suffix}.png` })
  console.log('shot', `design/${tag}-${name}${suffix}.png`)
}
await b.close()
