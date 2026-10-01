import { chromium } from 'playwright'
import crypto from 'node:crypto'
const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage()
await p.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'}); await p.waitForTimeout(800)
for (const off of [-820,-620,-420,-180,0,180,360,520]) {
  await p.evaluate((o)=>{const el=document.querySelector('.dissolve');window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY+o,behavior:'auto'})},off)
  await p.waitForTimeout(350)
  const d=await p.evaluate(()=>{const el=document.querySelector('.dissolve');const r=el.getBoundingClientRect();
    return {p:((window.innerHeight-r.top)/(r.height+window.innerHeight)).toFixed(3), u:document.querySelector('.dissolve canvas').toDataURL('image/png')}})
  console.log(off, 'p='+d.p, crypto.createHash('sha1').update(d.u).digest('hex').slice(0,8))
}
await b.close()
