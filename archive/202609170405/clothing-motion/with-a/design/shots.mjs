// Drive the real app and capture named states.
// node design/shots.mjs <width> <tag> [--reduce]
import { chromium } from 'playwright'
import fs from 'node:fs'

const width = +process.argv[2]
const tag = process.argv[3]
const reduce = process.argv.includes('--reduce')
const dir = 'design/shots'
fs.mkdirSync(dir, { recursive: true })

const b = await chromium.launch()
const ctx = await b.newContext({
  viewport: { width, height: width < 700 ? 844 : 1000 },
  reducedMotion: reduce ? 'reduce' : 'no-preference',
  hasTouch: width < 700,
  isMobile: width < 700,
})
const p = await ctx.newPage()
const errors = []
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
p.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
await p.goto('http://127.0.0.1:4173/', { waitUntil: 'load' })
await p.waitForTimeout(1200)

const shot = async (name) => {
  await p.screenshot({ path: `${dir}/${tag}-${name}.png` })
  console.log('  ', name)
}

// 1. top of the page, before anything has printed
await shot('01-top')

// 2. scroll the frontispiece across the fold in steps, watch it print
for (const y of [300, 700, 1100]) {
  await p.evaluate((v) => scrollTo(0, v), y)
  await p.waitForTimeout(420)
}
await shot('02-frontispiece-printed')
console.log('   frontispiece cell/pct:', await p.$eval('.frontfig canvas', (c) => c.dataset.cell + ' / ' + c.dataset.pct))

// 3. the device band mid-resolve
const deviceY = await p.$eval('.resolve', (e) => e.getBoundingClientRect().top + scrollY - 120)
await p.evaluate((v) => scrollTo(0, v), deviceY)
await p.waitForTimeout(700)
await shot('03-device-band')
console.log('   band cells:', await p.$$eval('.resolve canvas', (cs) => cs.map((c) => c.dataset.cell + '/' + c.dataset.pct).join('  ')))

// 4. the sheet
const sheetY = await p.$eval('#sheet', (e) => e.getBoundingClientRect().top + scrollY - 20)
await p.evaluate((v) => scrollTo(0, v), sheetY)
await p.waitForTimeout(500)
await shot('04-sheet')

// 5. filter to Knitwear — registration shift
await p.getByRole('button', { name: /^Knitwear \(2\)$/ }).click()
await p.waitForTimeout(120)
await shot('05-filter-midshift')
await p.waitForTimeout(600)
await shot('06-filter-knitwear')
console.log('   showing:', await p.$eval('.showing', (e) => e.textContent))

// 6. back to All, then buy something: choose a size, add, check the bag
await p.getByRole('button', { name: /^All \(9\)$/ }).click()
await p.waitForTimeout(600)

// sold-out must be unusable: XS on the Oxford Shirt
const xsDisabled = await p.$eval('#sheet-oxford-XS', (e) => e.disabled)
console.log('   oxford XS disabled:', xsDisabled)

await p.click('#sheet-oxford-M')
await p.waitForTimeout(150)
await p.locator('#plate-oxford .addbtn').click()
await p.waitForTimeout(200)
await p.click('#sheet-chore-L')
await p.locator('#plate-chore .addbtn').click()
await p.waitForTimeout(300)

// 7. lift a plate into the enlarged view
const before = await p.$eval('#plate-jean .img', (e) => JSON.stringify(e.getBoundingClientRect()))
await p.locator('#plate-jean .img').click()
await p.waitForTimeout(140)
await shot('07-lift-midflight')
await p.waitForTimeout(600)
const openY = await p.$eval('.open', (e) => e.getBoundingClientRect().top + scrollY - 40)
await p.evaluate((v) => scrollTo(0, v), openY)
await p.waitForTimeout(400)
await shot('08-opened-and-bag')
console.log('   opened caption:', (await p.$eval('.openimg .cap', (e) => e.textContent)).slice(0, 60))
console.log('   bag total:', await p.$eval('.bagp .tot', (e) => e.textContent))
console.log('   delivery:', await p.$eval('.bagp .prog + .m', (e) => e.textContent))

// 8. the ending
for (const sel of ['.spec', '.margin', '.shiprow', '.quotes', '.colophon']) {
  const y = await p.$eval(sel, (e) => e.getBoundingClientRect().top + scrollY - 40)
  await p.evaluate((v) => scrollTo(0, v), y)
  await p.waitForTimeout(350)
}
await p.evaluate(() => scrollTo(0, document.body.scrollHeight))
await p.waitForTimeout(400)
await shot('09-ending')

const specY = await p.$eval('.spec', (e) => e.getBoundingClientRect().top + scrollY - 40)
await p.evaluate((v) => scrollTo(0, v), specY)
await p.waitForTimeout(350)
await shot('10-spec')

console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : '   no console errors')
await b.close()
