import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1 });
await p.goto('http://127.0.0.1:4177/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/s-hero.png' });
for (const [name, sel] of [['metrics','#metrics'],['features','#features'],['pricing','#pricing'],['faq','#faq'],['signup','#signup']]) {
  await p.locator(sel).scrollIntoViewIfNeeded();
  await p.waitForTimeout(900);
  await p.screenshot({ path: `/tmp/s-${name}.png` });
}
// interactions
await p.locator('#pricing').scrollIntoViewIfNeeded();
await p.getByRole('button', { name: /Annual/ }).click();
await p.waitForTimeout(600);
await p.screenshot({ path: '/tmp/s-annual.png' });
console.log('growth price:', await p.locator('[data-plan=growth] .plan-price strong').innerText());
await p.locator('.faq-q').first().click();
await p.waitForTimeout(500);
await p.locator('#faq').scrollIntoViewIfNeeded();
await p.screenshot({ path: '/tmp/s-faqopen.png' });
await p.fill('#email', 'ops@northwind.com');
await p.locator('.signup-form button[type=submit]').click();
await p.waitForTimeout(500);
await p.locator('#signup').scrollIntoViewIfNeeded();
await p.screenshot({ path: '/tmp/s-success.png' });
// mobile
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto('http://127.0.0.1:4177/', { waitUntil: 'networkidle' });
await m.waitForTimeout(1000);
await m.screenshot({ path: '/tmp/m-hero.png' });
await m.locator('#pricing').scrollIntoViewIfNeeded();
await m.waitForTimeout(800);
await m.screenshot({ path: '/tmp/m-pricing.png' });
await b.close();
