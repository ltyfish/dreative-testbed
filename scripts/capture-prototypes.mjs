import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const outputDir = path.join(root, 'prototype-evidence')
const videoScratch = path.join(root, '.dreative', 'prototype-video-scratch')
const baseUrl = process.env.PROTOTYPE_URL ?? 'http://127.0.0.1:4173'

await mkdir(outputDir, { recursive: true })
await mkdir(videoScratch, { recursive: true })

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
})

const cases = [
  { mode: 'arc', viewportName: 'desktop', viewport: { width: 1440, height: 900 } },
  { mode: 'arc', viewportName: 'mobile', viewport: { width: 390, height: 844 } },
  { mode: 'field', viewportName: 'desktop', viewport: { width: 1440, height: 900 } },
  { mode: 'field', viewportName: 'mobile', viewport: { width: 390, height: 844 } },
]

const results = []

for (const testCase of cases) {
  const context = await browser.newContext({
    viewport: testCase.viewport,
    recordVideo: {
      dir: videoScratch,
      size: testCase.viewport,
    },
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  const errors = []

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  page.on('requestfailed', (request) => {
    errors.push(`request: ${request.url()} — ${request.failure()?.errorText ?? 'failed'}`)
  })

  await page.goto(`${baseUrl}/prototype/${testCase.mode}`, { waitUntil: 'networkidle' })
  const video = page.video()

  if (testCase.mode === 'arc') {
    await page.getByRole('button', { name: /Bright Floral/ }).click()
    await page.waitForTimeout(850)
    await page.getByRole('button', { name: /Deep Dark/ }).click()
    await page.waitForTimeout(850)
    await page.getByRole('button', { name: /Balanced Sweet/ }).click()
    await page.waitForTimeout(650)
  } else {
    const field = page.getByRole('slider', { name: 'Taste profile' })
    const box = await field.boundingBox()
    if (!box) throw new Error('Taste field has no visible bounding box')

    await page.mouse.move(box.x + box.width * 0.18, box.y + box.height * 0.28)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.77, { steps: 18 })
    await page.mouse.up()
    await page.waitForTimeout(700)
    await field.press('ArrowLeft')
    await page.waitForTimeout(650)
  }

  const inspection = await page.evaluate(() => ({
    hasContent: document.body.innerText.trim().length > 200,
    hasOverlay: Boolean(document.querySelector('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay')),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    interactiveCount: document.querySelectorAll('a, button, input, [role="slider"]').length,
    selectedProfile: document.querySelector('.prototype')?.getAttribute('data-profile'),
  }))

  const screenshotPath = path.join(outputDir, `${testCase.mode}-${testCase.viewportName}.png`)
  const videoPath = path.join(outputDir, `${testCase.mode}-${testCase.viewportName}.webm`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await context.close()
  await video.saveAs(videoPath)

  results.push({
    ...testCase,
    screenshotPath,
    videoPath,
    inspection,
    errors,
  })
}

await browser.close()
console.log(JSON.stringify(results, null, 2))
