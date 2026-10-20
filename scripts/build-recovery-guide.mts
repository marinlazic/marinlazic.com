// Builds client/public/guides/the-recovery-guide.pdf from shared/recoveryGuide.ts.
// A designed document in the brand style: full bleed photo openers with the
// heading on the image, big display type, large figures for the numbers,
// photo tiles for the four kinds of fatigue, a scorecard and a week grid.
// Run after changing the guide:
//   node --experimental-strip-types scripts/build-recovery-guide.mts
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { GUIDE_PHOTOS, RECOVERY_GUIDE, type GuideBlock, type GuidePhoto, type GuideSection } from "../shared/recoveryGuide.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "client/public/guides/the-recovery-guide.pdf");
const PUBLIC = path.join(ROOT, "client/public");
const FONTS = pathToFileURL(path.join(PUBLIC, "fonts")).href;
const PLAYWRIGHT = process.env.PLAYWRIGHT_MODULE ?? "/opt/npm-tools/node_modules/playwright/index.mjs";
const CHROME = process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const G = RECOVERY_GUIDE;

// Photos go in as 1400px JPEGs so the PDF stays small enough to email.
const IMG_DIR = path.join(ROOT, "node_modules/.cache/recovery-guide");
fs.mkdirSync(IMG_DIR, { recursive: true });
const sharp = (await import("sharp")).default;
const prepared = new Map<GuidePhoto, string>();
async function prepare(k: GuidePhoto): Promise<string> {
  if (prepared.has(k)) return prepared.get(k)!;
  const src = path.join(PUBLIC, GUIDE_PHOTOS[k].replace(/^\//, ""));
  const out = path.join(IMG_DIR, `${k}.jpg`);
  await sharp(src).resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 76, mozjpeg: true }).toFile(out);
  const url = pathToFileURL(out).href;
  prepared.set(k, url);
  return url;
}
for (const k of Object.keys(GUIDE_PHOTOS) as GuidePhoto[]) await prepare(k);
const photo = (k: GuidePhoto) => prepared.get(k)!;

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
    case "loop":
      return `<div class="loop">${b.words.map((w, i) => `<span class="w">${esc(w)}</span>${i < b.words.length - 1 ? '<span class="arrow"></span>' : ""}`).join("")}<span class="again">and again, from a little higher</span></div>`;
    case "table":
      return `<table><thead><tr>${b.columns.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${b.rows
        .map(r => `<tr>${r.map((c, i) => `<td class="${i === 0 ? "k" : ""}">${esc(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`;
    case "tiles":
      return `<div class="tiles">${b.items
        .map(
          t => `<div class="tile"><div class="ph" style="background-image:url('${photo(t.photo)}')"><h3>${esc(t.title)}</h3></div>
          <div class="tx"><p class="k">What causes it</p><p>${esc(t.cause)}</p><p class="k">What it feels like</p><p>${esc(t.feel)}</p></div></div>`
        )
        .join("")}</div>`;
    case "cards":
      return `<div class="sys"><div class="syshead"><h3>${esc(b.title)}</h3><p>${esc(b.goal)}</p></div><div class="cards">${b.items
        .map(c => `<div class="card"><span class="fig">${esc(c.figure)}</span><span class="lab">${esc(c.label)}</span><p>${esc(c.text)}</p></div>`)
        .join("")}</div></div>`;
    case "scorecard":
      return `<div class="score">${b.rows
        .map(
          r => `<div class="srow"><div><h4>${esc(r.system)}</h4><p>${esc(r.question)}</p></div><div class="boxes">${[1, 2, 3, 4, 5].map(n => `<span class="box">${n}</span>`).join("")}</div></div>`
        )
        .join("")}<div class="scale"><span>1 empty</span><span>5 fresh</span></div></div>`;
    case "week":
      return `<div class="week">${b.rows
        .map(r => `<div class="day"><h4>${esc(r.day)}</h4><p class="work">${esc(r.work)}</p><p class="rec">${esc(r.recovery)}</p></div>`)
        .join("")}</div>`;
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
html,body{margin:0;background:#F4F4F4;color:#121212;font-family:Inter,sans-serif;font-size:10.5pt;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;padding:16mm 18mm 18mm;position:relative;page-break-after:always;overflow:hidden;background:#F4F4F4}
.page:last-child{page-break-after:auto}
.bar{display:flex;justify-content:space-between;align-items:center;font-size:7.5pt;letter-spacing:.18em;text-transform:uppercase;padding-bottom:3mm;border-bottom:.5pt solid #121212;margin-bottom:8mm}
.bar b{font-family:"DM Sans";font-weight:700;letter-spacing:.24em}
.bar span{color:#6a6a6a}
.foot{position:absolute;left:18mm;right:18mm;bottom:9mm;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:#6a6a6a;border-top:.5pt solid #D6D6D6;padding-top:2.5mm}
h2{font-family:"DM Sans";font-weight:700;font-size:30pt;line-height:.98;letter-spacing:-.03em;margin:0 0 6mm;color:#000}
h3{font-family:"DM Sans";font-weight:700;font-size:14pt;letter-spacing:-.01em;margin:0 0 2mm}
h4{font-family:"DM Sans";font-weight:700;font-size:11pt;margin:0 0 1.5mm}
.kicker{font-size:7.5pt;letter-spacing:.2em;text-transform:uppercase;color:#6a6a6a;margin:0 0 3mm;display:flex;align-items:center;gap:2.5mm}
.kicker:before{content:"";width:2.2mm;height:2.2mm;background:#2F6BF0;display:inline-block;flex:none}
.num{font-family:"DM Sans";font-weight:700;font-size:64pt;letter-spacing:-.05em;color:#D6D6D6;line-height:.9;margin:0 0 4mm}
p{margin:0 0 3.5mm}
p.lead{font-family:"DM Sans";font-weight:500;font-size:17pt;line-height:1.25;letter-spacing:-.015em;color:#000;max-width:150mm;margin-bottom:6mm}
ul{margin:0 0 4mm;padding:0;list-style:none}
li{position:relative;padding-left:6mm;margin-bottom:2mm}
li:before{content:"";position:absolute;left:0;top:2.2mm;width:2mm;height:2mm;background:#2F6BF0}
.callout{border-top:.5pt solid #121212;border-bottom:.5pt solid #121212;padding:3.5mm 0;margin:5mm 0 0}
.callout .label{display:block;font-size:7.5pt;letter-spacing:.18em;text-transform:uppercase;color:#6a6a6a;margin-bottom:1.5mm}
.callout p{margin:0;font-family:"DM Sans";font-weight:500;font-size:14pt;line-height:1.25;letter-spacing:-.01em}
.steps{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin:4mm 0 5mm}
.step{display:flex;gap:4mm;border-top:.5pt solid #121212;padding-top:3mm}
.step .n{font-family:"DM Sans";font-weight:700;font-size:26pt;letter-spacing:-.04em;color:#D6D6D6;line-height:1}
.step p{margin:0;font-size:9.8pt}
.loop{display:flex;flex-wrap:wrap;align-items:center;gap:3mm;margin:6mm 0 7mm;font-family:"DM Sans";font-weight:700;font-size:27pt;letter-spacing:-.04em;line-height:1}
.loop .arrow{width:12mm;height:.6mm;background:#2F6BF0;position:relative}
.loop .arrow:after{content:"";position:absolute;right:0;top:-1.7mm;border:2mm solid transparent;border-left:3mm solid #2F6BF0;border-right:0}
.loop .again{flex-basis:100%;font-family:Inter;font-weight:400;font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:#6a6a6a;margin-top:1mm}
table{width:100%;border-collapse:collapse;margin:3mm 0 6mm}
th{text-align:left;font-family:"DM Sans";font-weight:700;font-size:8pt;letter-spacing:.16em;text-transform:uppercase;padding:0 3mm 2mm 0;border-bottom:.5pt solid #121212}
td{vertical-align:top;padding:2.6mm 3mm 2.6mm 0;border-bottom:.5pt solid #D6D6D6;font-size:9.6pt;line-height:1.42}
td.k{font-weight:600;width:28%}
.grad{background:repeating-linear-gradient(90deg,rgba(255,255,255,.55) 0 2px,transparent 2px 9px,rgba(255,255,255,.25) 9px 10px,transparent 10px 23px),linear-gradient(180deg,#FFFFFF 0%,#C2D9FB 38%,#548DF8 72%,#3068F0 100%)}
/* photo pages */
.photo{padding:0;background:#121212}
.photo .img{position:absolute;inset:0;background-size:cover;background-position:center}
.photo .bar{position:absolute;left:18mm;right:18mm;top:16mm;color:#fff;border-bottom-color:rgba(255,255,255,.7);margin:0}
.photo .bar span{color:rgba(255,255,255,.75)}
.photo .title{position:absolute;left:18mm;right:18mm;bottom:22mm;color:#fff}
.photo .title .kicker{color:rgba(255,255,255,.8)}
.photo .title .n{font-family:"DM Sans";font-weight:700;font-size:20pt;letter-spacing:-.02em;margin:0 0 3mm;color:#fff}
.photo .title h1,.photo .title h2{font-family:"DM Sans";font-weight:700;font-size:56pt;line-height:.92;letter-spacing:-.04em;margin:0;color:#fff;max-width:160mm}
.photo .title p.sub{font-family:"DM Sans";font-weight:500;font-size:16pt;letter-spacing:-.01em;margin:5mm 0 0;color:#fff;max-width:130mm;line-height:1.25}
.photo .by{position:absolute;left:18mm;right:18mm;bottom:10mm;display:flex;justify-content:space-between;font-size:7.5pt;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.8);border-top:.5pt solid rgba(255,255,255,.5);padding-top:2.5mm}
.photo.top .title{top:34mm;bottom:auto}
.photo.dark .bar,.photo.dark .title,.photo.dark .title .n,.photo.dark .title h2,.photo.dark .title p.sub,.photo.dark .by{color:#121212}
.photo.dark .bar{border-bottom-color:rgba(18,18,18,.6)}.photo.dark .bar span,.photo.dark .title .kicker{color:#3a3a3a}
.photo.dark .by{color:#3a3a3a;border-top-color:rgba(18,18,18,.4)}
.photo.dark .title .kicker:before{background:#2F6BF0}
.gradpage{padding:16mm 18mm 18mm}
.gradpage .panel{position:absolute;left:0;right:0;top:0;height:150mm}
.gradpage .title{position:absolute;left:18mm;right:18mm;bottom:28mm}
.gradpage .title .n{font-family:"DM Sans";font-weight:700;font-size:20pt;letter-spacing:-.02em;margin:0 0 3mm}
.gradpage .title h2{font-size:56pt;line-height:.92;letter-spacing:-.04em;margin:0;max-width:160mm}
.gradpage .title p.sub{font-family:"DM Sans";font-weight:500;font-size:16pt;letter-spacing:-.01em;margin:5mm 0 0;max-width:130mm;line-height:1.25}
/* intro */
.cols{display:grid;grid-template-columns:1fr 62mm;gap:12mm;align-items:start}
.intro .big{font-family:"DM Sans";font-weight:500;font-size:19pt;line-height:1.22;letter-spacing:-.02em;color:#000;margin:0 0 8mm}
.small{font-size:9.2pt;color:#3a3a3a}
.inside li{font-size:9.6pt;margin-bottom:2.6mm;padding-left:0;display:flex;gap:3mm}
.inside li:before{display:none}
.inside .i{font-family:"DM Sans";font-weight:700;color:#B9BCC2;flex:none;width:8mm}
/* side photo layout */
.withside{display:grid;grid-template-columns:1fr 58mm;gap:10mm;align-items:stretch;min-height:218mm}
.side{background-size:cover;background-position:center;min-height:120mm}
/* tiles */
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:5mm 6mm;margin-top:2mm}
.tile .ph{height:44mm;background-size:cover;background-position:center;position:relative}
.tile .ph h3{position:absolute;left:4mm;bottom:3mm;margin:0;color:#fff;font-size:15pt;letter-spacing:-.02em}
.tile .tx{padding-top:2.5mm}
.tile .tx p{font-size:8.6pt;line-height:1.4;margin:0 0 1.5mm}
.tile .tx p.k{font-size:6.8pt;letter-spacing:.16em;text-transform:uppercase;color:#6a6a6a;margin:1.5mm 0 .8mm}
/* cards */
.sys{margin:0 0 8mm}
.syshead{display:grid;grid-template-columns:62mm 1fr;gap:6mm;align-items:end;border-bottom:.5pt solid #121212;padding-bottom:2.5mm;margin-bottom:4mm}
.syshead h3{font-size:18pt;margin:0}
.syshead p{margin:0;font-size:9.6pt;color:#3a3a3a}
.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:4mm}
.cards.n4{grid-template-columns:repeat(4,1fr)}
.card{border-top:1.2pt solid #2F6BF0;padding-top:2.5mm;min-width:0}
.card .fig{display:block;font-family:"DM Sans";font-weight:700;font-size:19pt;letter-spacing:-.035em;line-height:1;margin-bottom:1.8mm;white-space:nowrap}
.card .lab{display:block;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:#121212;font-weight:600;margin-bottom:1.5mm;line-height:1.3}
.card p{font-size:8.2pt;line-height:1.38;color:#3a3a3a;margin:0}
/* scorecard */
.score{margin:4mm 0 6mm}
.srow{display:grid;grid-template-columns:1fr 70mm;gap:8mm;align-items:center;border-top:.5pt solid #121212;padding:4mm 0}
.srow h4{font-size:14pt;letter-spacing:-.02em}
.srow p{margin:0;color:#3a3a3a}
.boxes{display:flex;gap:2.5mm;justify-content:flex-end}
.box{width:12mm;height:12mm;border:.6pt solid #121212;display:flex;align-items:center;justify-content:center;font-family:"DM Sans";font-weight:500;font-size:11pt;color:#6a6a6a}
.scale{display:flex;justify-content:space-between;font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:#6a6a6a;border-top:.5pt solid #121212;padding-top:2.5mm}
/* week */
.week{display:grid;grid-template-columns:repeat(7,1fr);gap:3mm;margin:4mm 0 6mm}
.day{border-top:1.2pt solid #121212;padding-top:2.5mm;min-height:70mm}
.day h4{font-size:8.5pt;letter-spacing:.1em;text-transform:uppercase;margin-bottom:3mm}
.day p{font-size:7.8pt;line-height:1.38;margin:0 0 2mm}
.day .work{font-family:"DM Sans";font-weight:700;font-size:10pt;line-height:1.2;letter-spacing:-.01em;margin-bottom:3mm;min-height:12mm}
.day .rec{color:#3a3a3a}
.day .rec:before{content:"";display:block;width:2.2mm;height:2.2mm;background:#2F6BF0;margin-bottom:1.5mm}
/* back page */
.back .withside{grid-template-columns:1fr 70mm;min-height:0}
.back .side{height:70mm;min-height:0;background-position:center 20%}
.back .close{position:absolute;left:18mm;right:18mm;bottom:22mm;height:62mm}
.url{font-family:"DM Sans";font-weight:700;font-size:22pt;letter-spacing:-.03em;color:#000;margin:0}
`;

const pages: string[] = [];
let n = 1;
const foot = () => `<div class="foot"><span>${esc(G.title)}</span><span>${esc(G.author)}</span><span>${String(n).padStart(2, "0")}</span></div>`;
const bar = `<div class="bar"><b>ML</b><span>${esc(G.title)}</span></div>`;
const push = (html: string) => {
  pages.push(html);
  n++;
};

// Cover
push(`<section class="page photo"><div class="img" style="background-image:url('${photo(G.cover)}')"></div>${bar}
  <div class="title"><p class="kicker">Free guide, by ${esc(G.author)}</p><h1>The Recovery<br>Guide</h1><p class="sub">${esc(G.subtitle)}</p></div>
  <div class="by"><span>${esc(G.author)}</span><span>${esc(G.edition)}</span></div>
</section>`);

// Intro
push(`<section class="page intro">${bar}
  <p class="kicker">Before you start</p>
  <h2>Why the same recovery<br>for everything does not work</h2>
  <div class="cols">
    <div><p class="big">${esc(G.promise)}</p><p class="small">${esc(G.authorLine)}</p></div>
    <div><p class="kicker">What is inside</p><ul class="inside">${G.whatsInside.map((i, k) => `<li><span class="i">${String(k + 1).padStart(2, "0")}</span><span>${esc(i)}</span></li>`).join("")}</ul></div>
  </div>
  ${foot()}
</section>`);

function sectionPages(s: GuideSection) {
  if (s.opener === "gradient") {
    push(`<section class="page gradpage">${bar}<div class="panel grad"></div>
      <div class="title"><p class="n">${s.number}</p><h2>${esc(s.title)}</h2><p class="sub">${esc(s.kicker)}</p></div>
      ${foot()}
    </section>`);
  } else if (s.opener) {
    const cls = `${s.openerStyle?.ink === "dark" ? " dark" : ""}${s.openerStyle?.at === "top" ? " top" : ""}`;
    push(`<section class="page photo${cls}"><div class="img" style="background-image:url('${photo(s.opener)}')"></div>${bar}
      <div class="title"><p class="n">${s.number}</p><h2>${esc(s.title)}</h2><p class="sub">${esc(s.kicker)}</p></div>
      <div class="by"><span>${esc(G.title)}</span><span>${String(n).padStart(2, "0")}</span></div>
    </section>`);
  }
  const chunks: GuideBlock[][] = [[]];
  for (const b of s.blocks) {
    if (b.type === "break") chunks.push([]);
    else chunks[chunks.length - 1].push(b);
  }
  chunks.forEach((blocks, i) => {
    let body = blocks.map(block).join("");
    body = body.replace(/<div class="cards">((?:(?!<\/div><\/div>).)*?)<\/div><\/div>/gs, (m, inner) => {
      const count = (inner.match(/<div class="card">/g) ?? []).length;
      return count === 4 ? m.replace('<div class="cards">', '<div class="cards n4">') : m;
    });
    const head =
      i === 0
        ? s.opener
          ? `<p class="kicker">${s.number} ${esc(s.kicker)}</p>`
          : `<p class="num">${s.number}</p><p class="kicker">${esc(s.kicker)}</p><h2>${esc(s.title)}</h2>`
        : `<p class="kicker">${s.number} ${esc(s.title)}, continued</p>`;
    const content = s.side && i === 0 ? `<div class="withside"><div>${body}</div><div class="side" style="background-image:url('${photo(s.side)}')"></div></div>` : body;
    const close = s.number === "09" ? '<div class="close grad"></div>' : "";
    push(`<section class="page ${s.number === "09" ? "back" : ""}">${bar}${head}${content}${close}${foot()}</section>`);
  });
}

for (const s of G.sections) sectionPages(s);

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
