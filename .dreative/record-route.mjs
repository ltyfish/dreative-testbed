import fs from "node:fs";
import path from "node:path";
import playwright from "file:///C:/Users/lty/AppData/Roaming/npm/node_modules/dreative/node_modules/playwright-core/index.js";

const { chromium } = playwright;

const runId = process.argv[2];
if (!runId) throw new Error("Pass the verification run ID.");

const root = process.cwd();
const runDir = path.join(root, ".dreative", "runs", runId);
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});

async function recordJourney(name, viewport, mobile = false) {
  const videoDir = path.join(runDir, `${name}-raw`);
  fs.mkdirSync(videoDir, { recursive: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    hasTouch: mobile,
    isMobile: mobile,
    recordVideo: { dir: videoDir, size: viewport },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const startedAt = new Date().toISOString();
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  for (const target of ["#story", "#origin"]) {
    await page.locator(target).scrollIntoViewIfNeeded();
    await page.waitForTimeout(850);
  }
  await page.locator("#origin-kenya").click();
  await page.waitForTimeout(700);
  await page.locator("#origin-colombia").click();
  await page.waitForTimeout(700);
  await page.locator("#reviews").scrollIntoViewIfNeeded();
  await page.waitForTimeout(850);
  await page.locator("#brew-guide").scrollIntoViewIfNeeded();
  await page.waitForTimeout(650);
  for (const selector of [".brew-step-2", ".brew-step-3", ".brew-step-4"]) {
    await page.locator(selector).click();
    await page.waitForTimeout(650);
  }
  await page.locator("#subscribe").scrollIntoViewIfNeeded();
  await page.waitForTimeout(850);

  const video = page.video();
  await page.close();
  const rawPath = await video.path();
  const finalPath = path.join(runDir, `${name}-journey.webm`);
  fs.copyFileSync(rawPath, finalPath);
  await context.close();
  fs.rmSync(videoDir, { recursive: true, force: true });
  return {
    id: `${name}-journey-recording`,
    path: path.relative(root, finalPath).replaceAll("\\", "/"),
    viewport,
    startedAt,
    endedAt: new Date().toISOString(),
  };
}

const recordings = [];
recordings.push(await recordJourney("desktop", { width: 1440, height: 1000 }));
recordings.push(await recordJourney("mobile", { width: 390, height: 844 }, true));
await browser.close();

fs.writeFileSync(
  path.join(runDir, "recordings.json"),
  `${JSON.stringify({ runId, recordings }, null, 2)}\n`,
);
console.log(JSON.stringify(recordings, null, 2));
