import { chromium } from 'playwright'

const width = Number(process.argv[2] || 1440)
const height = Number(process.argv[3] || 900)
const reduced = process.argv[4] === '1'
const tag = process.argv[5] || 'task'

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

const ok = []
const fail = []
const check = (name, cond, extra = '') => (cond ? ok : fail).push(`${name}${extra ? ` (${extra})` : ''}`)

// --- filter ---------------------------------------------------------------
await p.click('text=Knitwear (2)')
await p.waitForTimeout(600)
let cards = await p.$$eval('.card h3', (n) => n.map((x) => x.textContent))
check('filter Knitwear shows 2', cards.length === 2, cards.join(', '))
let count = await p.textContent('.count')
check('count line updates', /Showing 2 of 9 garments in Knitwear/.test(count), count.trim())

await p.click('text=All (9)')
await p.waitForTimeout(600)
cards = await p.$$eval('.card h3', (n) => n.length)
check('All restores 9', cards === 9, String(cards))

// --- sold-out sizes cannot be added --------------------------------------
const soldDisabled = await p.$$eval('#garment-oxford .size', (n) =>
  n.map((x) => [x.textContent.trim(), x.disabled]),
)
check('Oxford XS disabled', soldDisabled.find((s) => s[0] === 'XS')?.[1] === true)
check('Oxford S enabled', soldDisabled.find((s) => s[0] === 'S')?.[1] === false)
const choreSold = await p.$$eval('#garment-chore .size', (n) =>
  n.filter((x) => x.disabled).map((x) => x.textContent.trim()),
)
check('Chore S+XL disabled', choreSold.join(',') === 'S,XL', choreSold.join(','))

// add button must be inert before a size is picked
check('add disabled with no size', await p.isDisabled('#garment-oxford .add'))

// --- choose a size and add ------------------------------------------------
await p.click('#garment-oxford .size:has-text("M")')
await p.waitForTimeout(250)
check('size state announces', (await p.textContent('#garment-oxford .size-state')).includes('Size M chosen'))
check('add enabled after size', !(await p.isDisabled('#garment-oxford .add')))
await p.click('#garment-oxford .add')
await p.waitForTimeout(400)

let lines = await p.$$eval('.bag-lines li .bag-name', (n) => n.map((x) => x.textContent.trim()))
check('bag names garment + size', lines[0] === 'The Oxford Shirt, size M', lines[0])
let sub = await p.textContent('.bag-row')
check('subtotal £78', sub.includes('£78.00'), sub.trim())
let del = await p.textContent('.bag-delivery')
check('shortfall to free delivery', /£22\.00 more for free delivery/.test(del), del.trim())
check('postage shown as £4.95', del.includes('£4.95'), del.trim())

// --- cross £100 -----------------------------------------------------------
await p.click('#garment-knit .size:has-text("M")')
await p.click('#garment-knit .add')
await p.waitForTimeout(400)
del = await p.textContent('.bag-delivery')
check('free delivery over £100', del.includes('Delivery free'), del.trim())
const total = await p.$$eval('.bag-row', (n) => n.map((x) => x.textContent))
check('total £213.00', total.some((t) => t.includes('Total') && t.includes('£213.00')), total.join(' | '))

await p.screenshot({ path: `design/_check/${tag}-bag-full.png` })

// --- remove a line --------------------------------------------------------
await p.click('.bag-lines li:first-child .bag-remove')
await p.waitForTimeout(400)
lines = await p.$$eval('.bag-lines li .bag-name', (n) => n.map((x) => x.textContent.trim()))
check('remove drops the line', lines.length === 1 && lines[0].startsWith('Lambswool Crew'), lines.join(' | '))
sub = await p.textContent('.bag-row')
check('subtotal recalculates', sub.includes('£135.00'), sub.trim())

// --- keyboard -------------------------------------------------------------
await p.focus('#garment-tee .size:has-text("L")')
await p.keyboard.press('Enter')
await p.waitForTimeout(200)
check('keyboard selects size', (await p.textContent('#garment-tee .size-state')).includes('Size L chosen'))

console.log('PASS:', ok.length)
for (const f of fail) console.log('  FAIL:', f)
console.log(fail.length ? 'FAILURES: ' + fail.length : 'ALL TASK CHECKS PASSED')
if (errors.length) console.log('CONSOLE ERRORS:', errors.slice(0, 6).join(' | '))
await b.close()
process.exit(fail.length ? 1 : 0)
