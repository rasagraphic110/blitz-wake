import { chromium } from "playwright";

const URLS = [
  "https://n8n.sortstone110.blitz.cloud/",
  "https://waha.sortstone110.blitz.cloud/",
];
const MAX_WAIT_MS = 150000; // حداکثر ۲.۵ دقیقه صبر برای هر سرویس
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wake(browser, url) {
  const context = await browser.newContext({ userAgent: UA });
  const page = await context.newPage();
  const start = Date.now();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    while (Date.now() - start < MAX_WAIT_MS) {
      const title = await page.title().catch(() => "");
      const text = await page
        .evaluate(() => (document.body ? document.body.innerText.slice(0, 400) : ""))
        .catch(() => "");
      const stillWaking = /waking up|is asleep/i.test(`${title} ${text}`);
      if (!stillWaking) {
        const secs = Math.round((Date.now() - start) / 1000);
        console.log(`AWAKE  ${url} (after ${secs}s) title="${title}"`);
        return true;
      }
      await sleep(5000);
    }
    console.log(`STILL ASLEEP  ${url} (gave up after ${MAX_WAIT_MS / 1000}s)`);
    return false;
  } catch (e) {
    console.log(`ERROR  ${url}: ${e.message}`);
    return false;
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
const results = await Promise.all(URLS.map((u) => wake(browser, u)));
await browser.close();

console.log(results.every(Boolean) ? "All services awake." : "Some services are not awake.");

