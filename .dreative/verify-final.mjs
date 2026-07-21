import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const runId = `final-${new Date().toISOString().replace(/[:.]/g, '-')}`
const runDir = path.resolve('.dreative', 'runs', runId)
const videoDir = path.join(runDir, 'video')
fs.mkdirSync(videoDir, { recursive: true })

const browser = await chromium.launch()
const findings = {
  runId,
  url: 'http://127.0.0.1:4173',
  consoleErrors: [],
  pageErrors: [],
  failedRequests: [],
  desktop: {},
  mobile: {},
  reducedMotion: {},
  interactions: {},
}

function observe(page) {
  page.on('console', (message) => {
    if (message.type() === 'error') findings.consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => findings.pageErrors.push(error.message))
  page.on('requestfailed', (request) => findings.failedRequests.push({
    url: request.url(),
    failure: request.failure()?.errorText ?? 'unknown',
  }))
}

const desktopContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
})
const desktop = await desktopContext.newPage()
observe(desktop)
await desktop.goto(findings.url, { waitUntil: 'networkidle' })
await desktop.locator('canvas').waitFor()
await desktop.waitForTimeout(900)
await desktop.screenshot({ path: path.join(runDir, 'desktop-full.png'), fullPage: true })
await desktop.screenshot({ path: path.join(runDir, 'desktop-hero.png') })

await desktop.mouse.move(1140, 390)
await desktop.waitForTimeout(450)
await desktop.screenshot({ path: path.join(runDir, 'desktop-hero-active.png') })

for (const [id, file] of [
  ['story', 'desktop-story.png'],
  ['beans', 'desktop-beans.png'],
  ['brew-guide', 'desktop-brew.png'],
  ['reviews', 'desktop-reviews.png'],
  ['subscribe', 'desktop-subscribe.png'],
  ['contact', 'desktop-contact.png'],
]) {
  await desktop.locator(`#${id}`).scrollIntoViewIfNeeded()
  await desktop.waitForTimeout(650)
  await desktop.screenshot({ path: path.join(runDir, file) })
}

await desktop.locator('#brew-guide').scrollIntoViewIfNeeded()
await desktop.getByRole('button', { name: /Bloom/i }).click()
await desktop.waitForTimeout(250)
findings.interactions.brewReadout = await desktop.locator('.brew-readout span').textContent()

await desktop.locator('#reviews').scrollIntoViewIfNeeded()
const reviewBefore = await desktop.locator('.review-stage blockquote p').textContent()
await desktop.getByRole('button', { name: 'Next review' }).click()
const reviewAfter = await desktop.locator('.review-stage blockquote p').textContent()
findings.interactions.reviewChanged = reviewBefore !== reviewAfter

await desktop.locator('#beans').scrollIntoViewIfNeeded()
await desktop.getByRole('button', { name: 'Next coffee' }).click()
await desktop.getByRole('button', { name: /Add to cart/i }).click()
findings.interactions.cartStatus = await desktop.locator('.cart-toast').textContent()

await desktop.locator('#contact').scrollIntoViewIfNeeded()
await desktop.getByLabel('Email').fill('coffee@example.com')
await desktop.getByLabel('Message').fill('Please tell me about wholesale.')
await desktop.getByRole('button', { name: /Send message/i }).click()
findings.interactions.loadingState = await desktop.getByRole('button', { name: /Sending/i }).textContent()
await desktop.locator('.form-success').waitFor()
findings.interactions.successState = await desktop.locator('.form-success').textContent()

findings.desktop = await desktop.evaluate(() => ({
  title: document.title,
  bodyOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  bodyTextLength: document.body.innerText.trim().length,
  webgl: Boolean(document.querySelector('canvas')?.getContext('webgl2') || document.querySelector('canvas')?.getContext('webgl')),
  images: Array.from(document.images).map((image) => ({
    file: image.currentSrc.split('/').pop(),
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
  })),
  sectionCount: document.querySelectorAll('main > section').length,
  currentSections: ['hero', 'story', 'beans', 'brew-guide', 'reviews', 'subscribe', 'contact']
    .filter((id) => document.getElementById(id)),
}))
await desktopContext.close()

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
observe(mobile)
await mobile.goto(findings.url, { waitUntil: 'networkidle' })
await mobile.locator('canvas').waitFor()
await mobile.waitForTimeout(700)
await mobile.screenshot({ path: path.join(runDir, 'mobile-full.png'), fullPage: true })
await mobile.screenshot({ path: path.join(runDir, 'mobile-hero.png') })
await mobile.getByRole('button', { name: 'Menu', exact: true }).click()
await mobile.screenshot({ path: path.join(runDir, 'mobile-menu.png') })
await mobile.keyboard.press('Escape')
await mobile.locator('#brew-guide').scrollIntoViewIfNeeded()
await mobile.waitForTimeout(350)
await mobile.screenshot({ path: path.join(runDir, 'mobile-brew.png') })
await mobile.locator('#subscribe').scrollIntoViewIfNeeded()
await mobile.waitForTimeout(350)
await mobile.screenshot({ path: path.join(runDir, 'mobile-subscribe.png') })
findings.mobile = await mobile.evaluate(() => ({
  bodyOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  minTapHeight: Math.min(...Array.from(document.querySelectorAll('button, a'))
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect) => rect.height)),
  menuOpen: document.documentElement.classList.contains('menu-is-open'),
}))

const narrow = await browser.newPage({ viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true })
observe(narrow)
await narrow.goto(findings.url, { waitUntil: 'networkidle' })
await narrow.waitForTimeout(500)
await narrow.screenshot({ path: path.join(runDir, 'narrow-320-full.png'), fullPage: true })
findings.mobile.narrow320Overflow = await narrow.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
)

const reduced = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'reduce',
})
observe(reduced)
await reduced.goto(findings.url, { waitUntil: 'networkidle' })
await reduced.locator('#brew-guide').scrollIntoViewIfNeeded()
await reduced.waitForTimeout(200)
await reduced.screenshot({ path: path.join(runDir, 'mobile-reduced-motion.png') })
findings.reducedMotion = await reduced.evaluate(() => ({
  preference: matchMedia('(prefers-reduced-motion: reduce)').matches,
  orbDisplay: getComputedStyle(document.querySelector('.current-orb')).display,
  currentResolved: getComputedStyle(document.querySelector('.current-path')).strokeDashoffset,
  brewStreamResolved: getComputedStyle(document.querySelector('.brew-stream-path')).strokeDashoffset,
}))

await browser.close()
fs.writeFileSync(path.join(runDir, 'final.json'), JSON.stringify(findings, null, 2))
console.log(JSON.stringify({ runId, runDir, findings }, null, 2))
