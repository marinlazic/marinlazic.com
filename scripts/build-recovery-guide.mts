// Builds client/public/guides/the-recovery-guide.pdf from shared/recoveryGuide.ts
// in the brand style (DM Sans headings, Inter body, paper, black type, blue
// markers, striped gradient panel). Run after changing the guide:
//   node --experimental-strip-types scripts/build-recovery-guide.mts
// Needs a Chromium: PLAYWRIGHT module and CHROME path can be overridden by env.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { RECOVERY_GUIDE, type GuideBlock } from "../shared/recoveryGuide.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "client/public/guides/the-recovery-guide.pdf");
const FONTS = pathToFileURL(path.join(ROOT, "client/public/fonts")).href;
const PLAYWRIGHT = process.env.PLAYWRIGHT_MODULE ?? "/opt/npm-tools/node_modules/playwright/index.mjs";
const CHROME = process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const G = RECOVERY_GUIDE;

function block(b: GuideBlock): string {
  switch (b.type) {
    case "break":
      return "";
    case "lead":
      return `<p class="lead">${esc(b.text)}</p>`;
    case "p":
      return `<p>${esc(b.text)}</p>`;
    case "list":
      return `<ul>${b.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`;
    case "callout":
      return `<aside class="callout"><span class="label">${esc(b.label)}</span><p>${esc(b.text)}</p></aside>`;
    case "steps":
      return `<div class="steps">${b.items.map((s, i) => `<div class="step"><span class="n">${String(i + 1).padStart(2, "0")}</span><div><h4>${esc(s.title)}</h4><p>${esc(s.text)}</p></div></div>`).join("")}</div>`;
    case "table":
      return `<table><thead><tr>${b.columns.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${b.rows
        .map(r => `<tr>${r.map((c, i) => `<td class="${i === 0 ? "k" : ""}">${esc(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`;
  }
}

const css = `
@font-face{font-family:"DM Sans";font-weight:400;src:url(${FONTS}/dm-sans-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"DM Sans";font-weight:500;src:url(${FONTS}/dm-sans-latin-500-normal.woff2) format("woff2")}
@font-face{font-family:"DM Sans";font-weight:700;src:url(${FONTS}/dm-sans-latin-700-normal.woff2) format("woff2")}
@font-face{font-family:"Inter";font-weight:400;src:url(${FONTS}/inter-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Inter";font-weight:500;src:url(${FONTS}/inter-latin-500-normal.woff2) format("woff2")}
@font-face{font-family:"Inter";font-weight:600;src:url(${FONTS}/inter-latin-600-normal.woff2) format("woff2")}
@font-face{font-family:"Inter";font-weight:700;src:url(${FONTS}/inter-latin-700-normal.woff2) format("woff2")}
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:#F4F4F4;color:#121212;font-family:Inter,sans-serif;font-size:10.5pt;line-height:1.5}
.page{width:210mm;height:297mm;padding:16mm 18mm 18mm;position:relative;page-break-after:always;overflow:hidden;background:#F4F4F4}
.page:last-child{page-break-after:auto}
.bar{display:flex;justify-content:space-between;align-items:center;font-size:7.5pt;letter-spacing:.18em;text-transform:uppercase;padding-bottom:3mm;border-bottom:.5pt solid #121212;margin-bottom:9mm}
.bar b{font-family:"DM Sans";font-weight:700;letter-spacing:.24em}
.bar span{color:#6a6a6a}
.foot{position:absolute;left:18mm;right:18mm;bottom:9mm;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:#6a6a6a;border-top:.5pt solid #D6D6D6;padding-top:2.5mm}
h1{font-family:"DM Sans";font-weight:500;font-size:46pt;line-height:.92;letter-spacing:-.03em;margin:0 0 6mm;color:#000}
h2{font-family:"DM Sans";font-weight:500;font-size:26pt;line-height:1;letter-spacing:-.025em;margin:0 0 7mm;color:#000}
h4{font-family:"DM Sans";font-weight:700;font-size:11pt;margin:0 0 1.5mm}
.kicker{font-size:7.5pt;letter-spacing:.2em;text-transform:uppercase;color:#6a6a6a;margin:0 0 3mm;display:flex;align-items:center;gap:2.5mm}
.kicker:before{content:"";width:2.2mm;height:2.2mm;background:#2F6BF0;display:inline-block}
.num{font-family:"DM Sans";font-weight:500;font-size:34pt;letter-spacing:-.04em;color:#B9BCC2;line-height:1;margin:0 0 2mm}
p{margin:0 0 3.5mm}
p.lead{font-size:12.5pt;line-height:1.4;max-width:140mm;margin-bottom:5mm}
ul{margin:0 0 4mm;padding:0;list-style:none}
li{position:relative;padding-left:6mm;margin-bottom:2mm}
li:before{content:"";position:absolute;left:0;top:2.2mm;width:2mm;height:2mm;background:#2F6BF0}
.callout{border-top:.5pt solid #121212;border-bottom:.5pt solid #121212;padding:3.5mm 0;margin:5mm 0}
.callout .label{display:block;font-size:7.5pt;letter-spacing:.18em;text-transform:uppercase;color:#6a6a6a;margin-bottom:1.5mm}
.callout p{margin:0;font-size:11.5pt;line-height:1.4}
.steps{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin:4mm 0 5mm}
.step{display:flex;gap:4mm;border-top:.5pt solid #121212;padding-top:3mm}
.step .n{font-family:"DM Sans";font-weight:500;font-size:22pt;letter-spacing:-.04em;color:#B9BCC2;line-height:1}
.step p{margin:0;font-size:9.8pt}
table{width:100%;border-collapse:collapse;margin:3mm 0 6mm;page-break-inside:auto}
tr{page-break-inside:avoid}
th{text-align:left;font-family:"DM Sans";font-weight:700;font-size:8pt;letter-spacing:.16em;text-transform:uppercase;padding:0 3mm 2mm 0;border-bottom:.5pt solid #121212}
td{vertical-align:top;padding:2.6mm 3mm 2.6mm 0;border-bottom:.5pt solid #D6D6D6;font-size:9.6pt;line-height:1.42}
td.k{font-weight:600;width:28%}
table.three td.k{width:20%}
.grad{background:repeating-linear-gradient(90deg,rgba(255,255,255,.55) 0 2px,transparent 2px 9px,rgba(255,255,255,.25) 9px 10px,transparent 10px 23px),linear-gradient(180deg,#FFFFFF 0%,#C2D9FB 38%,#548DF8 72%,#3068F0 100%)}
.cover .grad{position:absolute;left:18mm;right:18mm;bottom:40mm;height:118mm}
.cover .sub{font-family:"DM Sans";font-weight:400;font-size:16pt;letter-spacing:-.01em;margin:0 0 5mm;max-width:120mm;line-height:1.25}
.cover .by{position:absolute;left:18mm;right:18mm;bottom:18mm;font-size:8pt;letter-spacing:.16em;text-transform:uppercase;color:#6a6a6a;display:flex;justify-content:space-between}
.cols{display:grid;grid-template-columns:62mm 1fr;gap:10mm;align-items:start}
.small{font-size:9.2pt;color:#3a3a3a}
.end{margin-top:10mm;display:grid;grid-template-columns:1fr 1fr;gap:10mm}
.end .grad{height:70mm}
.url{font-family:"DM Sans";font-weight:500;font-size:16pt;letter-spacing:-.02em;color:#000}
`;

const inside = G.whatsInside.map(i => `<li>${esc(i)}</li>`).join("");
const pages: string[] = [];
const foot = (n: number) => `<div class="foot"><span>${esc(G.title)}</span><span>${esc(G.author)}</span><span>${String(n).padStart(2, "0")}</span></div>`;
const bar = `<div class="bar"><b>ML</b><span>${esc(G.title)}</span></div>`;

pages.push(`<section class="page cover">${bar}
  <h1>The Recovery<br>Guide</h1>
  <p class="sub">${esc(G.subtitle)}</p>
  <div class="grad"></div>
  <div class="by"><span>${esc(G.author)}</span><span>${esc(G.edition)}</span></div>
</section>`);

pages.push(`<section class="page">${bar}
  <p class="kicker">Before you start</p>
  <h2>Why the same recovery for everything does not work</h2>
  <div class="cols">
    <div><p class="lead" style="font-size:11.5pt">${esc(G.promise)}</p></div>
    <div><p class="kicker" style="margin-top:1mm">What is inside</p><ul>${inside}</ul>
    <p class="small">${esc(G.authorLine)}</p></div>
  </div>
  ${foot(2)}
</section>`);

let n = 3;
for (const s of G.sections) {
  // A "break" block starts a new page; later pages repeat the number and title, smaller.
  const chunks: GuideBlock[][] = [[]];
  for (const b of s.blocks) {
    if (b.type === "break") chunks.push([]);
    else chunks[chunks.length - 1].push(b);
  }
  chunks.forEach((blocks, i) => {
    const body = blocks.map(block).join("").replace(/<table>/g, s.number === "04" || s.number === "08" ? '<table class="three">' : "<table>");
    const head = i === 0
      ? `<p class="num">${s.number}</p><p class="kicker">${esc(s.kicker)}</p><h2>${esc(s.title)}</h2>`
      : `<p class="kicker">${s.number} ${esc(s.title)}, continued</p>`;
    pages.push(`<section class="page">${bar}
    ${head}
    ${body}
    ${foot(n)}
  </section>`);
    n++;
  });
}

const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(G.title)}</title><style>${css}</style></head><body>${pages.join("\n")}</body></html>`;
const htmlPath = path.join(path.dirname(OUT), "the-recovery-guide.preview.html");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(htmlPath, html);

const { chromium } = await import(PLAYWRIGHT);
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
await page.evaluate(() => (document as any).fonts.ready);
await page.pdf({ path: OUT, format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
fs.unlinkSync(htmlPath);
console.log("wrote", OUT, Math.round(fs.statSync(OUT).size / 1024), "KB,", pages.length, "pages");
