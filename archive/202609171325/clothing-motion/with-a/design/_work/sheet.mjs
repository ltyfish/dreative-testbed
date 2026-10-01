import fs from 'fs'
const c = JSON.parse(fs.readFileSync('design/_work/candidates.json','utf8'))
const cells = c.map((x,i)=>`<figure><img src="${x.thumb}" loading="eager"><figcaption>${i} · ${x.q}</figcaption></figure>`).join('')
fs.writeFileSync('design/_work/sheet.html', `<html><body style="background:#111;color:#eee;font:11px system-ui;margin:0"><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;padding:6px">${cells}</div><style>figure{margin:0}img{width:100%;height:150px;object-fit:cover;background:#333}figcaption{padding:2px}</style></body></html>`)
