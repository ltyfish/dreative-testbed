import { chromium } from 'playwright'
import path from 'node:path'
const [file, out, w, h] = process.argv.slice(2)
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: +w, height: +(h || 1000) }, deviceScaleFactor: 1 })
await p.goto(new URL('file:///' + path.resolve(file).split(path.sep).join('/')).href, { waitUntil: 'load' })
await p.waitForTimeout(2500)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log('wrote', out)
