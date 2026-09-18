import { chromium } from 'playwright'
import fs from 'node:fs'
const queries = process.argv.slice(2)
const file='design/src/ids.json'
const out = fs.existsSync(file)? JSON.parse(fs.readFileSync(file,'utf8')) : {}
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:1500,height:1400}, userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36' })
for (const q of queries) {
  if (out[q]?.length) { console.log(q,'cached',out[q].length); continue }
  let ids=[]
  for (let attempt=0; attempt<3 && !ids.length; attempt++) {
    const p = await ctx.newPage()
    try {
      await p.goto('https://www.pexels.com/search/'+encodeURIComponent(q)+'/', {waitUntil:'load', timeout:60000})
      await p.waitForTimeout(6000 + attempt*6000)
      await p.mouse.wheel(0,2200); await p.waitForTimeout(4000)
      ids = await p.$$eval('img', is => [...new Set(is.map(i=>i.currentSrc||i.src)
        .map(s=>(s.match(/photos\/(\d+)\/pexels-photo-\1\.(jpe?g|png)/)||[])[1]).filter(Boolean))].slice(0,12))
    } catch(e){ console.log(q,'attempt',attempt,'ERR',e.message.slice(0,60)) }
    await p.close()
  }
  out[q]=ids; console.log(q, ids.length)
  fs.writeFileSync(file, JSON.stringify(out,null,1))
  await new Promise(r=>setTimeout(r, 4000))
}
await b.close()
