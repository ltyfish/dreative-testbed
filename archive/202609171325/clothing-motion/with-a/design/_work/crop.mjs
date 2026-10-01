import { chromium } from 'file:///C:/Users/lty/Downloads/dreative-testbed/node_modules/playwright/index.mjs'
import path from 'node:path'; import url from 'node:url'
const [file, out, w, y, h, scale] = process.argv.slice(2)
const b = await chromium.launch()
const p = await b.newPage({ viewport:{width:+w,height:1000}, deviceScaleFactor:+(scale||1) })
await p.goto(url.pathToFileURL(path.resolve(file)).href)
await p.waitForTimeout(6000)
const H = await p.evaluate(()=>document.body.scrollHeight)
console.log('pageHeight', H)
await p.screenshot({ path: out, clip:{x:0,y:+y,width:+w,height:Math.min(+h, H-+y)} , fullPage:true})
await b.close()
