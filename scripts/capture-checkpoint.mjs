import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const outputDir = path.join(root, 'checkpoint-evidence')
const videoScratch = path.join(root, '.dreative', 'checkpoint-video-scratch')
const baseUrl = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173'

await mkdir(outputDir, { recursive: true })
await mkdir(videoScratch, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const cases = [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'mobile', viewport: { width: 390, height: 844 } },
]
const results = []

for (const testCase of cases) {
  const context = await browser.newContext({
    viewport: testCase.viewport,
    recordVideo: { dir: videoScratch, size: testCase.viewport },
  })
  const page = await context.newPage()
  const errors = []

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  page.on('requestfailed', (request) => errors.push(`request: ${request.url()} — ${request.failure()?.errorText ?? 'failed'}`))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const video = page.video()

  if (testCase.name === 'mobile') {
    await page.getByRole('button', { name: 'Toggle navigation' }).click()
    const mobileNav = page.locator('.nav-links')
    if (!(await mobileNav.evaluate((node) => node.classList.contains('is-open')))) {
      throw new Error('Mobile navigation did not open')
    }
    await page.getByRole('button', { name: 'Toggle navigation' }).click()
  }

  const heroControl = page.locator('.hero-profile')
  await heroControl.getByRole('button', { name: /Bright/ }).click()
  await page.waitForTimeout(850)
  await page.locator('#beans').scrollIntoViewIfNeeded()
  await page.waitForTimeout(900)

  const firstBright = await page.locator('.bean-card').first().getAttribute('data-bean')
  if (firstBright !== 'ethiopia') throw new Error(`Bright profile expected ethiopia first, received ${firstBright}`)

  const toolbar = page.locator('.beans-toolbar')
  await toolbar.getByRole('button', { name: /Deep/ }).click()
  await page.waitForTimeout(900)
  const firstDeep = await page.locator('.bean-card').first().getAttribute('data-bean')
  if (firstDeep !== 'sumatra') throw new Error(`Deep profile expected sumatra first, received ${firstDeep}`)

  await page.locator('.bean-card').first().getByRole('button', { name: /Add to cart/ }).click()
  await page.waitForTimeout(450)
  const cartVisible = await page.locator('.cart-toast').evaluate((node) => node.classList.contains('is-visible'))

  await toolbar.getByRole('button', { name: /Balanced/ }).click()
  await page.waitForTimeout(850)

  for (const step of [1, 2, 3, 4]) {
    await page.locator(`.brew-step[data-step="${step}"]`).scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
  }

  await page.screenshot({ path: path.join(outputDir, `${testCase.name}-brew.png`) })

  await page.locator('.bean-card--recommended').scrollIntoViewIfNeeded()
  await page.waitForTimeout(650)
  await page.screenshot({ path: path.join(outputDir, `${testCase.name}-beans.png`) })

  await page.locator('#story').scrollIntoViewIfNeeded()
  await page.waitForTimeout(650)
  await page.screenshot({ path: path.join(outputDir, `${testCase.name}-story.png`) })

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(850)
  await page.screenshot({ path: path.join(outputDir, `${testCase.name}-hero.png`) })

  const inspection = await page.evaluate(() => ({
    hasContent: document.body.innerText.trim().length > 1000,
    hasOverlay: Boolean(document.querySelector('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay')),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    navDestinations: document.querySelectorAll('.nav-links a').length,
    beanActions: document.querySelectorAll('.bean-buy button').length,
    activeProfile: document.querySelector('.page')?.getAttribute('data-profile'),
    activeBrewStep: document.querySelector('.brew-step.is-active')?.getAttribute('data-step'),
  }))

  await context.close()
  await video.saveAs(path.join(outputDir, `${testCase.name}.webm`))

  results.push({
    ...testCase,
    firstBright,
    firstDeep,
    cartVisible,
    inspection,
    errors,
  })
}

await browser.close()
console.log(JSON.stringify(results, null, 2))
