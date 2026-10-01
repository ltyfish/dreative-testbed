import fs from 'fs'
const queries = ['shirt flat lay','white t-shirt mockup','sweater mockup','cardigan knitwear garment','jacket flat lay','trousers flat lay','jeans flat lay','shorts flat lay','linen shirt','wool jacket garment','apparel mockup blank','oxford button down shirt']
const out=[]
for (const q of queries){
  const r = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&source=rawpixel,stocksnap&page_size=10`)
  const j = await r.json()
  for (const it of (j.results||[])) out.push({q,title:it.title,url:it.url,thumb:it.thumbnail||it.url,license:it.license,creator:it.creator,page:it.foreign_landing_url,source:it.source})
}
fs.writeFileSync('design/_work/candidates3.json', JSON.stringify(out,null,1))
const cells = out.map((x,i)=>`<figure><img src="${x.thumb}"><figcaption>${i} · ${x.q}</figcaption></figure>`).join('')
fs.writeFileSync('design/_work/sheet3.html', `<html><body style="background:#111;color:#eee;font:11px system-ui;margin:0"><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;padding:6px">${cells}</div><style>figure{margin:0}img{width:100%;height:160px;object-fit:cover;background:#333}figcaption{padding:2px}</style></body></html>`)
console.log(out.length)
