import fs from 'node:fs'
const ids = JSON.parse(fs.readFileSync('design/src/ids.json','utf8'))
let html = `<style>body{font:12px system-ui;background:#111;color:#eee;margin:0;padding:8px}h2{font-size:13px;margin:10px 0 4px}
.row{display:flex;flex-wrap:wrap;gap:4px}figure{margin:0;width:150px}img{width:150px;height:150px;object-fit:cover;background:#333}figcaption{font-size:9px;opacity:.7}</style>`
for (const [q,list] of Object.entries(ids)) {
  if(!list.length) continue
  html += `<h2>${q}</h2><div class=row>` + list.filter(id=>fs.existsSync(`design/src/img/${id}.jpg`)).map(id=>`<figure><img src="src/img/${id}.jpg"><figcaption>${id}</figcaption></figure>`).join('') + `</div>`
}
fs.writeFileSync('design/contact.html', html)
