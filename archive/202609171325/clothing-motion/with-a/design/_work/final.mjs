import { chromium } from 'file:///C:/Users/lty/Downloads/dreative-testbed/node_modules/playwright/index.mjs'
import path from 'node:path'; import url from 'node:url'
const jobs=[
 ['a1.html','../a-1-page.png',1440,0.68],
 ['a2.html','../a-2-transition.png',1440,0.78],
 ['a3.html','../a-3-mobile.png',390,1],
 ['b1.html','../b-1-page.png',1440,0.68],
 ['b2.html','../b-2-transition.png',1440,0.78],
 ['b3.html','../b-3-mobile.png',390,1],
]
const b=await chromium.launch()
for(const [f,out,w,s] of jobs){
  const p=await b.newPage({viewport:{width:w,height:1000},deviceScaleFactor:s})
  await p.goto(url.pathToFileURL(path.resolve('design/_work/'+f)).href)
  await p.waitForTimeout(7000)
  await p.screenshot({path:'design/_work/'+out, fullPage:true})
  const h=await p.evaluate(()=>document.body.scrollHeight)
  console.log(out,w,'x',h)
  await p.close()
}
await b.close()
