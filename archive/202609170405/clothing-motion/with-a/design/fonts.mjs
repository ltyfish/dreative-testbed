// Self-host the three typefaces of the Plate & Press direction (latin subset only).
import fs from 'node:fs'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
const URL =
  'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Roboto+Mono:wght@400;500' +
  '&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..500&display=swap'

const css = await (await fetch(URL, { headers: { 'user-agent': UA } })).text()
fs.mkdirSync('src/fonts', { recursive: true })

const blocks = css.split('@font-face').slice(1)
const out = []
for (const b of blocks) {
  if (!/unicode-range:\s*U\+0000-00FF/.test(b)) continue // latin only
  const fam = b.match(/font-family:\s*'([^']+)'/)[1]
  const style = b.match(/font-style:\s*(\w+)/)[1]
  const weight = b.match(/font-weight:\s*([\d ]+)/)[1].trim()
  const url = b.match(/url\((https[^)]+)\)/)[1]
  const name = `${fam.toLowerCase().replace(/\s+/g, '-')}-${style}-${weight.replace(/\s+/g, '-')}.woff2`
  const buf = Buffer.from(await (await fetch(url, { headers: { 'user-agent': UA } })).arrayBuffer())
  fs.writeFileSync('src/fonts/' + name, buf)
  out.push(`@font-face{font-family:'${fam}';font-style:${style};font-weight:${weight};font-display:swap;src:url('./fonts/${name}') format('woff2')}`)
  console.log(name, buf.length)
}
fs.writeFileSync('src/fonts.css', out.join('\n') + '\n')
