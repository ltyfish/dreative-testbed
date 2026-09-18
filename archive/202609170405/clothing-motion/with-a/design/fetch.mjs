import fs from 'node:fs'
const ids = JSON.parse(fs.readFileSync('design/src/ids.json','utf8'))
fs.mkdirSync('design/src/img',{recursive:true})
const jobs=[]
for (const [q, list] of Object.entries(ids)) for (const id of list) jobs.push(id)
for (const id of [...new Set(jobs)]) {
  const f = `design/src/img/${id}.jpg`
  if (fs.existsSync(f)) continue
  const r = await fetch(`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900`)
  if (!r.ok) { console.log(id, r.status); continue }
  fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()))
}
console.log('files', fs.readdirSync('design/src/img').length)
