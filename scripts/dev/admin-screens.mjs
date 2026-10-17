// Logs in to a running local server and screenshots every dashboard section.
// node scripts/dev/admin-screens.mjs http://127.0.0.1:3460 testpass123 /tmp/out
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import fs from "node:fs";

const [base = "http://127.0.0.1:3460", password = "testpass123", out = "/tmp/admin-screens"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
page.on("console", m => m.type() === "error" && errors.push(`console: ${m.text()}`));

await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${out}/00-login.png` });
await page.fill('input[type="password"]', password);
await page.click('button[type="submit"]');
await page.waitForSelector("nav[aria-label='Dashboard sections']", { timeout: 15000 });

const sections = ["", "contacts", "applications", "assessments", "content", "traffic", "system"];
for (const s of sections) {
  await page.goto(`${base}/admin/${s}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${s || "overview"}.png`, fullPage: true });
  console.log("shot", s || "overview");
}
// Contact drawer
await page.goto(`${base}/admin/contacts`, { waitUntil: "networkidle" });
await page.waitForSelector("tbody tr");
await page.click("tbody tr >> nth=0 >> td >> nth=0");
await page.waitForSelector("aside h2", { timeout: 10000 });
await page.waitForTimeout(800);
await page.click("text=Show all");
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/contact-drawer.png`, fullPage: true });
// Mobile
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${out}/mobile-overview.png`, fullPage: true });
console.log("errors:", errors.length ? errors : "none");
await browser.close();
