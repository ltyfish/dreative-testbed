import { chromium } from 'file:///C:/Users/lty/Downloads/dreative-testbed/node_modules/playwright/index.mjs'
import path from 'node:path'
import url from 'node:url'
const [file, out, w, h, full] = process.argv.slice(2)
const b = await chromium.launch()
const p = await b.newPage({ viewport:{width:+w,height:+h}, deviceScaleFactor:1 })
await p.goto(url.pathToFileURL(path.resolve(file)).href)
await p.waitForTimeout(7000)
await p.screenshot({ path: out, fullPage: full==='full' })
await b.close()
