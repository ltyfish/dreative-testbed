import fs from 'fs'
const queries = ['oxford shirt','plain t-shirt','denim jacket','wool coat jacket','trousers pants','denim jeans','knit sweater','cardigan','shorts','clothing rail','folded clothes','fashion studio apparel']
const out = []
for (const q of queries) {
  const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&source=rawpixel,stocksnap,nappy&page_size=10`
  const r = await fetch(u); const j = await r.json()
  for (const it of (j.results||[])) out.push({q,title:it.title,url:it.url,thumb:it.thumbnail||it.url,license:it.license,creator:it.creator,page:it.foreign_landing_url,source:it.source,w:it.width,h:it.height})
}
fs.writeFileSync('design/_work/candidates2.json', JSON.stringify(out,null,1))
const cells = out.map((x,i)=>`<figure><img src="${x.thumb}"><figcaption>${i} · ${x.source} · ${x.q}</figcaption></figure>`).join('')
fs.writeFileSync('design/_work/sheet2.html', `<html><body style="background:#111;color:#eee;font:11px system-ui;margin:0"><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;padding:6px">${cells}</div><style>figure{margin:0}img{width:100%;height:150px;object-fit:cover;background:#333}figcaption{padding:2px}</style></body></html>`)
console.log(out.length)
