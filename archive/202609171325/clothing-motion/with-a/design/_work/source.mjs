import fs from 'fs'
const queries = [
  'oxford shirt', 'cotton t-shirt plain', 'chore jacket', 'wool overshirt',
  'pleated trousers', 'selvedge denim jeans', 'lambswool sweater', 'shawl cardigan', 'cotton shorts',
  'clothing rail garments', 'folded knitwear', 'tailor workshop fabric'
]
const out = []
for (const q of queries) {
  const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license_type=commercial&page_size=8&aspect_ratio=tall,square,wide`
  try {
    const r = await fetch(u)
    const j = await r.json()
    for (const it of (j.results||[])) out.push({q, id:it.id, title:it.title, url:it.url, thumb:it.thumbnail||it.url, license:it.license, creator:it.creator, page:it.foreign_landing_url, w:it.width, h:it.height})
  } catch(e) { console.error(q, e.message) }
}
fs.writeFileSync('design/_work/candidates.json', JSON.stringify(out,null,1))
console.log('got', out.length)
