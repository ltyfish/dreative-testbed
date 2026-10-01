import { chromium } from 'playwright'
import crypto from 'node:crypto'

// Does the page actually move, and does reduced motion actually hold still?
const b = await chromium.launch()

async function probe(reduced, width = 1440) {
  const ctx = await b.newContext({
    viewport: { width, height: 900 },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    hasTouch: width < 900,
    isMobile: width < 900,
  })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)

  const sample = async (offset) => {
    await p.evaluate((off) => {
      const el = document.querySelector('.dissolve')
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + off, behavior: 'auto' })
    }, offset)
    await p.waitForTimeout(450)
    return p.evaluate(() => {
      const c = document.querySelector('.dissolve canvas')
      const ribbon = document.querySelector('.run-ribbon img')
      const hero = document.querySelector('.hero-cloth')
      return {
        canvas: c.toDataURL('image/png'),
        ribbon: ribbon.style.transform || 'none',
        hero: hero.style.transform || 'none',
      }
    })
  }

  const h = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10)
  // Sample the driver where the run above is still on screen, so its parallax
  // is live rather than holding its last value.
  await p.evaluate(() => {
    const el = document.querySelector('.run:last-of-type')
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 200, behavior: 'auto' })
  })
  await p.waitForTimeout(400)
  const ribbonA = await p.evaluate(() => document.querySelector('.run:last-of-type img').style.transform || 'none')
  await p.evaluate(() => window.scrollBy({ top: 320, behavior: 'auto' }))
  await p.waitForTimeout(400)
  const ribbonB = await p.evaluate(() => document.querySelector('.run:last-of-type img').style.transform || 'none')

  const a = await sample(-420)
  const c = await sample(0)
  const d = await sample(360)
  await ctx.close()
  return {
    canvasHashes: [h(a.canvas), h(c.canvas), h(d.canvas)],
    ribbon: [ribbonA, ribbonB],
    hero: a.hero,
  }
}

const normal = await probe(false)
const reduced = await probe(true)
const mobile = await probe(false, 390)

const distinct = (xs) => new Set(xs).size

console.log('NORMAL   canvas states:', distinct(normal.canvasHashes), 'of 3', normal.canvasHashes.join(' '))
console.log('NORMAL   ribbon transforms:', normal.ribbon.join(' | '))
console.log('NORMAL   hero transform:', normal.hero)
console.log('REDUCED  canvas states:', distinct(reduced.canvasHashes), 'of 3', reduced.canvasHashes.join(' '))
console.log('REDUCED  ribbon transforms:', reduced.ribbon.join(' | '))
console.log('REDUCED  hero transform:', reduced.hero)
console.log('MOBILE   canvas states:', distinct(mobile.canvasHashes), 'of 3')
console.log('MOBILE   ribbon transforms:', mobile.ribbon.join(' | '))

const pass =
  distinct(normal.canvasHashes) === 3 &&
  distinct(reduced.canvasHashes) === 1 &&
  new Set(normal.ribbon).size > 1 &&
  new Set(reduced.ribbon).size === 1 &&
  reduced.hero === 'none'
console.log(pass ? 'MOTION CHECKS PASSED' : 'MOTION CHECKS FAILED')
await b.close()
process.exit(pass ? 0 : 1)
