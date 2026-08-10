import { chromium } from 'playwright';
const queries = ['coffee roaster machine','coffee roasting drum','green coffee beans','coffee roastery workshop','bergen norway rain'];
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1440,height:900}});
for (const q of queries) {
  await p.goto('https://unsplash.com/s/photos/'+encodeURIComponent(q), {waitUntil:'networkidle', timeout:60000}).catch(()=>{});
  await p.waitForTimeout(2500);
  const items = await p.evaluate(() => {
    const out=[];
    document.querySelectorAll('figure').forEach(f=>{
      const img=f.querySelector('img[src*="images.unsplash.com/photo-"]');
      const a=f.querySelector('a[href*="/photos/"]');
      if(img) out.push({src:img.src.split('?')[0], alt:img.alt, href:a?a.href:''});
    });
    return out.slice(0,10);
  });
  console.log('=== '+q);
  items.forEach(i=>console.log(i.src+' || '+(i.alt||'').slice(0,70)+' || '+i.href));
}
await b.close();
