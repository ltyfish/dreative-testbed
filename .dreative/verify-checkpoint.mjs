import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const runId = `checkpoint-${new Date().toISOString().replace(/[:.]/g, '-')}`
const runDir = path.resolve('.dreative', 'runs', runId)
fs.mkdirSync(runDir, { recursive: true })

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

async function observe(page) {
  page.on('console', (message) => {
    if (message.type() === 'error') findings.consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => findings.pageErrors.push(error.message))
  page.on('requestfailed', (request) => findings.failedRequests.push({
    url: request.url(),
    failure: request.failure()?.errorText ?? 'unknown',
  }))
}

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await observe(desktop)
await desktop.goto(findings.url, { waitUntil: 'networkidle' })
await desktop.locator('canvas').waitFor()
await desktop.waitForTimeout(700)
await desktop.screenshot({ path: path.join(runDir, 'desktop-hero.png'), fullPage: false })
findings.desktop = await desktop.evaluate(() => {
  const canvas = document.querySelector('canvas')
  const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl')
  return {
    title: document.title,
    bodyOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    canvas: canvas ? { width: canvas.width, height: canvas.height } : null,
    webgl: Boolean(gl),
    renderer: gl?.getParameter(gl.RENDERER) ?? null,
    heroVisible: Boolean(document.querySelector('.hero-title')),
    currentLength: document.querySelector('.current-path')?.getTotalLength() ?? null,
  }
})

await desktop.mouse.move(1140, 360)
await desktop.waitForTimeout(500)
await desktop.screenshot({ path: path.join(runDir, 'desktop-hero-active.png'), fullPage: false })
await desktop.locator('#story').scrollIntoViewIfNeeded()
await desktop.waitForTimeout(500)
await desktop.screenshot({ path: path.join(runDir, 'desktop-story-handoff.png'), fullPage: false })
await desktop.locator('#beans').scrollIntoViewIfNeeded()
await desktop.waitForTimeout(700)
await desktop.screenshot({ path: path.join(runDir, 'desktop-beans-start.png'), fullPage: false })
const selectedBefore = await desktop.locator('[role="option"][aria-selected="true"]').getAttribute('aria-selected')
await desktop.getByRole('button', { name: 'Next coffee' }).click()
await desktop.waitForTimeout(500)
const selectedName = await desktop.locator('.dossier-origin strong').textContent()
await desktop.screenshot({ path: path.join(runDir, 'desktop-beans-active.png'), fullPage: false })
await desktop.getByRole('button', { name: /Add to cart/i }).click()
const cartStatus = await desktop.locator('.cart-toast').textContent()
findings.interactions.desktop = { selectedBefore, selectedName, cartStatus }

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
await observe(mobile)
await mobile.goto(findings.url, { waitUntil: 'networkidle' })
await mobile.locator('canvas').waitFor()
await mobile.waitForTimeout(700)
await mobile.screenshot({ path: path.join(runDir, 'mobile-hero.png'), fullPage: false })
await mobile.getByRole('button', { name: 'Menu', exact: true }).click()
const menuExpanded = await mobile.getByRole('button', { name: 'Close', exact: true }).getAttribute('aria-expanded')
await mobile.screenshot({ path: path.join(runDir, 'mobile-menu.png'), fullPage: false })
await mobile.keyboard.press('Escape')
await mobile.locator('#beans').scrollIntoViewIfNeeded()
await mobile.waitForTimeout(500)
await mobile.getByRole('button', { name: 'Next coffee' }).click()
await mobile.waitForTimeout(300)
await mobile.screenshot({ path: path.join(runDir, 'mobile-beans.png'), fullPage: false })
findings.mobile = await mobile.evaluate(() => ({
  bodyOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  menuOpen: document.documentElement.classList.contains('menu-is-open'),
  activeBean: document.querySelector('.dossier-origin strong')?.textContent,
  minTapHeight: Math.min(...Array.from(document.querySelectorAll('button, a')).filter((el) => {
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }).map((el) => el.getBoundingClientRect().height)),
}))
findings.interactions.mobile = { menuExpanded }

await mobile.locator('#contact').scrollIntoViewIfNeeded()
await mobile.getByRole('button', { name: /Send message/i }).click()
findings.interactions.mobile.formError = await mobile.locator('#email-error').textContent()

const narrow = await browser.newPage({ viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true })
await observe(narrow)
await narrow.goto(findings.url, { waitUntil: 'networkidle' })
await narrow.locator('canvas').waitFor()
await narrow.waitForTimeout(500)
await narrow.screenshot({ path: path.join(runDir, 'narrow-320.png'), fullPage: false })
findings.mobile.narrow320Overflow = await narrow.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

const reduced = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'reduce',
})
await observe(reduced)
await reduced.goto(findings.url, { waitUntil: 'networkidle' })
await reduced.locator('#beans').scrollIntoViewIfNeeded()
await reduced.waitForTimeout(250)
await reduced.screenshot({ path: path.join(runDir, 'mobile-reduced-motion.png'), fullPage: false })
findings.reducedMotion = await reduced.evaluate(() => ({
  preference: matchMedia('(prefers-reduced-motion: reduce)').matches,
  currentDashOffset: getComputedStyle(document.querySelector('.current-path')).strokeDashoffset,
  currentOrbDisplay: getComputedStyle(document.querySelector('.current-orb')).display,
  spectrumProgress: getComputedStyle(document.querySelector('.spectrum-track')).getPropertyValue('--track-progress').trim(),
}))

await browser.close()
fs.writeFileSync(path.join(runDir, 'checkpoint.json'), JSON.stringify(findings, null, 2))
console.log(JSON.stringify({ runId, runDir, findings }, null, 2))
