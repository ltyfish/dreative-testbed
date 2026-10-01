import fs from 'fs'
const queries=['cotton oxford fabric texture','cotton jersey knit texture','indigo cotton canvas texture','brushed wool fabric texture','wool twill fabric texture','selvedge denim fabric texture','lambswool knit texture','alpaca wool knit texture','washed cotton twill texture','linen weave texture close up','wool flannel texture','corduroy texture']
const out=[]
for(const q of queries){
  const r=await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license_type=commercial&page_size=8`)
  const j=await r.json()
  for(const it of (j.results||[])) out.push({q,title:it.title,url:it.url,thumb:it.thumbnail||it.url,license:it.license,creator:it.creator,page:it.foreign_landing_url,source:it.source})
}
fs.writeFileSync('design/_work/candidates4.json',JSON.stringify(out,null,1))
const cells=out.map((x,i)=>`<figure><img src="${x.thumb}"><figcaption>${i} · ${x.q}</figcaption></figure>`).join('')
fs.writeFileSync('design/_work/sheet4.html',`<html><body style="background:#111;color:#eee;font:11px system-ui;margin:0"><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;padding:6px">${cells}</div><style>figure{margin:0}img{width:100%;height:150px;object-fit:cover;background:#333}figcaption{padding:2px}</style></body></html>`)
console.log(out.length)
