import { chromium } from 'playwright'

// node inspect.mjs <out-prefix> <width> <height> <reduced:0|1> <json shots>
// shot forms: {"name":"x","selector":"#shop"} | {"name":"x","scrollTo":"#shop","offset":-90}
//             {"name":"x","y":1200}
const [prefix, wRaw, hRaw, reducedRaw, shotsRaw] = process.argv.slice(2)
const width = Number(wRaw)
const height = Number(hRaw)
const reduced = reducedRaw === '1'
const shots = JSON.parse(shotsRaw)

const b = await chromium.launch()
const ctx = await b.newContext({
  viewport: { width, height },
  deviceScaleFactor: 2,
  reducedMotion: reduced ? 'reduce' : 'no-preference',
  hasTouch: width < 900,
  isMobile: width < 900,
})
const p = await ctx.newPage()
const errors = []
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
p.on('pageerror', (e) => errors.push(String(e)))

await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(900)

for (const s of shots) {
  if (s.y !== undefined) {
    await p.evaluate((y) => window.scrollTo(0, y), s.y)
  } else if (s.scrollTo) {
    await p.evaluate(([sel, off]) => {
      const el = document.querySelector(sel)
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + off)
    }, [s.scrollTo, s.offset || 0])
  }
  if (s.click) await p.click(s.click)
  await p.waitForTimeout(s.wait || 700)
  if (s.selector && !s.viewportOnly) {
    const el = await p.$(s.selector)
    await el.screenshot({ path: `design/_check/${prefix}-${s.name}.png` })
  } else {
    await p.screenshot({ path: `design/_check/${prefix}-${s.name}.png` })
  }
  console.log('shot', `${prefix}-${s.name}`)
}

const docH = await p.evaluate(() => document.documentElement.scrollHeight)
console.log('docHeight', docH)
if (errors.length) console.log('CONSOLE ERRORS:', errors.slice(0, 8).join(' | '))
else console.log('no console errors')
await b.close()
