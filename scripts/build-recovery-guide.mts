// Builds client/public/guides/the-recovery-guide.pdf from shared/recoveryGuide.ts.
// A4 landscape, in the brand style: Marin's own photos as full bleed openers and
// half page side photos, big display type, large figures, and charts and tables
// drawn in the brand palette (blue marks, black and grey type, hairline grid).
// Run after changing the guide or the photos:
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

// Brand
const BLUE = "#2F6BF0";
const INK = "#121212";
const GREY = "#6a6a6a";
const RULE = "#D6D6D6";
const PALE = "#C2D9FB";

// Photos go in at 1600px so the PDF stays small enough to email.
const IMG_DIR = path.join(ROOT, "node_modules/.cache/recovery-guide");
fs.mkdirSync(IMG_DIR, { recursive: true });
const sharp = (await import("sharp")).default;
const prepared = new Map<GuidePhoto, string>();
async function prepare(k: GuidePhoto): Promise<string> {
  if (prepared.has(k)) return prepared.get(k)!;
  const src = path.join(PUBLIC, GUIDE_PHOTOS[k].replace(/^\//, ""));
  const out = path.join(IMG_DIR, `${k}.jpg`);
  await sharp(src).resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 74, mozjpeg: true }).toFile(out);
  const url = pathToFileURL(out).href;
  prepared.set(k, url);
  return url;
}
for (const k of Object.keys(GUIDE_PHOTOS) as GuidePhoto[]) await prepare(k);
const photo = (k: GuidePhoto) => prepared.get(k)!;

// The striped gradient panel as a raster image. A layered CSS gradient with
// transparency comes out magenta in some PDF viewers; a PNG never does.
const GRAD = path.join(IMG_DIR, "gradient.png");
{
  const W = 1200, H = 1200;
  const stops: [number, [number, number, number]][] = [[0, [255, 255, 255]], [0.38, [194, 217, 251]], [0.72, [84, 141, 248]], [1, [48, 104, 240]]];
  const buf = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    const t = y / (H - 1);
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; }
    const f = (t - a[0]) / (b[0] - a[0] || 1);
    const base = a[1].map((c, i) => c + (b[1][i] - c) * f);
    for (let x = 0; x < W; x++) {
      // 2px of white at 55% every 23px, 1px at 25% nine pixels later: the brand stripe.
      const m = x % 23;
      const alpha = m < 2 ? 0.55 : m === 9 ? 0.25 : 0;
      const o = (y * W + x) * 3;
      for (let i = 0; i < 3; i++) buf[o + i] = Math.round(base[i] + (255 - base[i]) * alpha);
    }
  }
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 9 }).toFile(GRAD);
}
const gradUrl = pathToFileURL(GRAD).href;

// ---------- charts (SVG in mm units; 1pt = 0.353mm) ----------
const fmt = (n: number) => (Math.round(n * 100) / 100).toString();
const T = (x: number, y: number, s: string, o: { size?: number; fill?: string; anchor?: "start" | "middle" | "end"; weight?: number; family?: string; dy?: number } = {}) =>
  `<text x="${fmt(x)}" y="${fmt(y)}" font-size="${o.size ?? 3}" fill="${o.fill ?? INK}" text-anchor="${o.anchor ?? "start"}" font-family="${o.family ?? "Inter"}" font-weight="${o.weight ?? 400}"${o.dy ? ` dy="${o.dy}"` : ""}>${esc(s)}</text>`;
// Wrapped text: breaks on words at about maxChars per line.
const WT = (x: number, y: number, s: string, maxChars: number, lineH: number, o: Parameters<typeof T>[3] = {}) => {
  const lines: string[] = [];
  for (const wd of s.split(" ")) {
    if (lines.length && (lines[lines.length - 1] + " " + wd).length <= maxChars) lines[lines.length - 1] += " " + wd;
    else lines.push(wd);
  }
  return lines.map((ln, i) => T(x, y + i * lineH, ln, o)).join("");
};
const L = (x1: number, y1: number, x2: number, y2: number, stroke = RULE, w = 0.25) => `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="${stroke}" stroke-width="${w}"/>`;
const svg = (w: number, h: number, inner: string, cls = "") => `<svg class="chart ${cls}" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

function chartHead(title: string, subtitle?: string) {
  return `<h3 class="ct">${esc(title)}</h3>${subtitle ? `<p class="cs">${esc(subtitle)}</p>` : ""}`;
}
const chartNote = (note?: string) => (note ? `<p class="cn">${esc(note)}</p>` : "");

// Small multiples: one line per panel, same scale.
function linesChart(b: Extract<GuideBlock, { type: "lines" }>): string {
  const n = b.series.length;
  const panels = b.series
    .map(s => {
      const w = 60, h = 72, left = 6, right = 2, top = 4, bottom = 8;
      const px = (i: number) => left + (i / (b.x.length - 1)) * (w - left - right);
      const py = (v: number) => top + (1 - (v - b.min) / (b.max - b.min)) * (h - top - bottom);
      let g = "";
      for (let v = b.min; v <= b.max; v++) g += L(left, py(v), w - right, py(v)) + T(left - 1.5, py(v) + 1, String(v), { size: 2.7, fill: GREY, anchor: "end" });
      g += b.x.map((x, i) => T(px(i), h - 1.5, x, { size: 2.7, fill: GREY, anchor: "middle" })).join("");
      const pts = s.values.map((v, i) => `${fmt(px(i))},${fmt(py(v))}`).join(" ");
      g += `<polyline points="${pts}" fill="none" stroke="${BLUE}" stroke-width="0.7" stroke-linejoin="round" stroke-linecap="round"/>`;
      const lowest = Math.min(...s.values);
      g += s.values
        .map((v, i) => `<circle cx="${fmt(px(i))}" cy="${fmt(py(v))}" r="1.3" fill="${v === lowest ? BLUE : "#F4F4F4"}" stroke="${BLUE}" stroke-width="0.55"/>`)
        .join("");
      // Label the low points only: the days that matter.
      g += s.values.map((v, i) => (v === lowest ? T(px(i), py(v) + 4.8, String(v), { size: 3, anchor: "middle", weight: 700, family: "DM Sans" }) : "")).join("");
      return `<div class="panel"><h4>${esc(s.label)}</h4>${svg(w, h, g)}<p>${esc(s.note)}</p></div>`;
    })
    .join("");
  return `<div class="chartblock">${chartHead(b.title, b.subtitle)}<div class="panels n${n}">${panels}</div></div>`;
}

// Horizontal range bars, built in HTML so the notes can wrap.
function barsChart(b: Extract<GuideBlock, { type: "bars" }>): string {
  const pct = (v: number) => `${(v / b.max) * 100}%`;
  const ticks = b.ticks.map(t => `<span class="tick" style="left:${pct(t.at)}"><i></i>${esc(t.label)}</span>`).join("");
  const rows = b.rows
    .map(
      r => `<div class="brow"><div><h4>${esc(r.label)}</h4><span class="val">${r.lo} to ${r.hi} ${esc(b.unit)}</span></div><div class="track">${b.ticks.map(t => `<i class="g" style="left:${pct(t.at)}"></i>`).join("")}<span class="bar" style="left:${pct(r.lo)};width:${pct(r.hi - r.lo)}"></span></div><p>${esc(r.note)}</p></div>`
    )
    .join("");
  return `<div class="chartblock bars">${chartHead(b.title)}<div class="brow axis"><h4></h4><div class="track">${ticks}</div><p></p></div>${rows}${chartNote(b.note)}</div>`;
}

// Tools against systems.
function matrixChart(b: Extract<GuideBlock, { type: "matrix" }>): string {
  const cell = (v: 0 | 1 | 2) => `<td class="c"><span class="m${v}"></span></td>`;
  return `<div class="chartblock matrix">${chartHead(b.title)}<table class="mx"><thead><tr><th></th>${b.columns.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${b.rows
    .map(r => `<tr><td class="k">${esc(r.label)}</td>${r.cells.map(cell).join("")}</tr>`)
    .join("")}</tbody></table><div class="legend">${b.legend.map((l, i) => `<span><span class="m${2 - i}"></span>${esc(l)}</span>`).join("")}</div>${chartNote(b.note)}</div>`;
}

// One column chart with an optional reference line and notes on particular columns.
function columnsChart(b: Extract<GuideBlock, { type: "columns" }>, half: boolean): string {
  const w = half ? 126 : 265, h = b.labels ? 58 : 78, left = 9, right = 3, top = b.notes ? 16 : 5, bottom = b.labels ? 16 : 7;
  const n = b.values.length;
  const slot = (w - left - right) / n;
  const bw = Math.min(slot * 0.56, 14);
  const px = (i: number) => left + slot * i + slot / 2;
  const py = (v: number) => top + (1 - v / b.max) * (h - top - bottom);
  let g = "";
  const step = b.max <= 5 ? 1 : 5;
  for (let v = 0; v <= b.max; v += step) g += L(left, py(v), w - right, py(v), v === 0 ? INK : RULE, v === 0 ? 0.35 : 0.25) + T(left - 1.5, py(v) + 1, String(v), { size: 2.4, fill: GREY, anchor: "end" });
  b.values.forEach((v, i) => {
    if (v > 0) g += `<rect x="${fmt(px(i) - bw / 2)}" y="${fmt(py(v))}" width="${fmt(bw)}" height="${fmt(py(0) - py(v))}" fill="${BLUE}"/>`;
    g += T(px(i), py(0) + 4, b.x[i], { size: 2.5, fill: GREY, anchor: "middle" });
    if (b.labels) {
      const words = b.labels[i].split(" ");
      const lines: string[] = [];
      for (const wd of words) { if (lines.length && (lines[lines.length - 1] + " " + wd).length <= 13) lines[lines.length - 1] += " " + wd; else lines.push(wd); }
      lines.forEach((ln, k) => (g += T(px(i), py(0) + 8 + k * 3.2, ln, { size: 2.5, anchor: "middle", weight: 500 })));
    }
  });
  if (b.reference) {
    g += L(left, py(b.reference.at), w - right, py(b.reference.at), INK, 0.3);
    g += T(w - right, py(b.reference.at) - 2.2, b.reference.label, { size: 2.5, anchor: "end", weight: 500 });
  }
  (b.notes ?? []).forEach((nt, k) => {
    const x = px(nt.at), y = py(b.values[nt.at]);
    const ty = top - 10 + k * 5;
    g += L(x, y - 1.5, x, ty + 1.5, INK, 0.25);
    const anchor = x > w * 0.6 ? "end" : "start";
    g += T(x + (anchor === "end" ? -1.5 : 1.5), ty + 0.8, nt.text, { size: 2.6, anchor, weight: 500 });
  });
  return `<div class="chartblock">${chartHead(b.title, b.subtitle)}${svg(w, h, g)}${chartNote(b.note)}</div>`;
}

// The training curve, the cold water target and the repair plate.
function figure(b: Extract<GuideBlock, { type: "figure" }>, half: boolean): string {
  let body = "";
  if (b.kind === "supercompensation") {
    const w = 265, h = 118, pw = 81, gap = 11, base = 72, bottom = 104;
    const panel = (x0: number, title: string, inner: string, caption: string) =>
      T(x0, 6, title, { size: 4.2, weight: 700, family: "DM Sans" }) + L(x0, base, x0 + pw, base, INK, 0.3) + T(x0, base - 1.6, "Where you started", { size: 2.7, fill: GREY }) + inner + WT(x0, bottom + 5, caption, 50, 4, { size: 3, fill: "#3a3a3a" });
    // One session, rested well.
    const x0 = 0;
    const c1 = `M${x0} ${base} C${x0 + 6} ${base},${x0 + 8} ${base + 22},${x0 + 15} ${base + 22} C${x0 + 25} ${base + 22},${x0 + 30} ${base - 26},${x0 + 45} ${base - 26} C${x0 + 60} ${base - 26},${x0 + 70} ${base - 3},${x0 + pw} ${base}`;
    let inner = `<path d="${c1}" fill="none" stroke="${BLUE}" stroke-width="0.9"/>`;
    inner += `<circle cx="${x0 + 45}" cy="${base - 26}" r="1.8" fill="${BLUE}"/>`;
    inner += T(x0 + 15, base + 28, "Session", { size: 3, anchor: "middle", weight: 500 }) + T(x0 + 24, base - 10, "Rest", { size: 3, anchor: "end", weight: 500 }) + T(x0 + 45, base - 31, "Adapt: next session here", { size: 3, anchor: "middle", weight: 700, family: "DM Sans" }) + T(x0 + pw, base + 5, "Fades if you wait too long", { size: 2.7, fill: GREY, anchor: "end" });
    body += panel(x0, "One session, rested well", inner, "Down during the work, up and past the start during the rest.");
    // Too soon: each session starts before the rise is finished.
    const x1 = pw + gap;
    let d = `M${x1} ${base}`, y = base, inner2 = "";
    for (let i = 0; i < 4; i++) {
      const sx = x1 + i * 20;
      d += ` C${sx + 4} ${y},${sx + 5} ${y + 18},${sx + 9} ${y + 18} C${sx + 14} ${y + 18},${sx + 17} ${y + 5},${sx + 20} ${y + 5}`;
      inner2 += `<circle cx="${sx + 20}" cy="${y + 5}" r="1.3" fill="${INK}"/>`;
      y += 5;
    }
    inner2 = `<path d="${d}" fill="none" stroke="${BLUE}" stroke-width="0.9"/>` + inner2 + T(x1, base - 8, "Next session before the rest is done", { size: 3, weight: 500 }) + T(x1 + pw, base - 2, "Each one starts lower", { size: 3, anchor: "end", weight: 700, family: "DM Sans" });
    body += panel(x1, "The next session too soon", inner2, "Shorten the rest and the gain shrinks, then turns into a loss.");
    // Timed right: each session starts at the previous peak.
    const x2 = 2 * (pw + gap);
    d = `M${x2} ${base}`; y = base; let inner3 = "";
    for (let i = 0; i < 4; i++) {
      const sx = x2 + i * 20;
      d += ` C${sx + 4} ${y},${sx + 5} ${y + 14},${sx + 8} ${y + 14} C${sx + 13} ${y + 14},${sx + 16} ${y - 8},${sx + 20} ${y - 8}`;
      inner3 += `<circle cx="${sx + 20}" cy="${y - 8}" r="1.3" fill="${BLUE}"/>`;
      y -= 8;
    }
    inner3 = `<path d="${d}" fill="none" stroke="${BLUE}" stroke-width="0.9"/>` + inner3 + T(x2, base - 40, "Next session at the peak", { size: 3, weight: 500 }) + T(x2 + pw, y - 3, "Each one starts higher", { size: 3, anchor: "end", weight: 700, family: "DM Sans" });
    body += panel(x2, "The next session timed right", inner3, "Rest until the peak, then go again from a little higher. That is progress.");
    body = svg(w, h, body);
  } else if (b.kind === "coldzone") {
    const w = 126, h = 100, left = 12, right = 4, top = 6, bottom = 13;
    const px = (m: number) => left + (m / 20) * (w - left - right);
    const py = (t: number) => top + (1 - (t - 5) / 15) * (h - top - bottom);
    let g = "";
    for (const m of [0, 5, 10, 15, 20]) g += L(px(m), top, px(m), py(5)) + T(px(m), py(5) + 4.5, String(m), { size: 2.8, fill: GREY, anchor: "middle" });
    for (const t of [5, 10, 15, 20]) g += L(left, py(t), w - right, py(t)) + T(left - 1.5, py(t) + 1, `${t}°`, { size: 2.8, fill: GREY, anchor: "end" });
    g += T((left + w - right) / 2, h - 1, "Minutes in the water", { size: 2.8, fill: GREY, anchor: "middle" });
    g += `<rect x="${fmt(px(10))}" y="${fmt(py(15))}" width="${fmt(px(15) - px(10))}" height="${fmt(py(10) - py(15))}" fill="${BLUE}"/>`;
    g += T((px(10) + px(15)) / 2, (py(10) + py(15)) / 2 - 1.5, "The target", { size: 3.4, fill: "#fff", anchor: "middle", weight: 700, family: "DM Sans" }) + T((px(10) + px(15)) / 2, (py(10) + py(15)) / 2 + 3, "10 to 15°, 10 to 15 min", { size: 2.6, fill: "#fff", anchor: "middle" });
    g += T(px(5), py(12.5), "Not long enough", { size: 2.9, fill: GREY, anchor: "middle" }) + WT(px(17.5), py(13), "Nothing more to gain", 13, 3.6, { size: 2.9, fill: GREY, anchor: "middle" });
    g += T(px(12.5), py(17.5), "Does little", { size: 2.9, fill: GREY, anchor: "middle" }) + T(px(12.5), py(7.5), "Adds risk, not benefit", { size: 2.9, fill: GREY, anchor: "middle" });
    body = svg(w, h, g);
  } else {
    const w = 126, h = 96, cx = 36, cy = 48, r = 34;
    const arc = (a0: number, a1: number, fill: string) => {
      const p = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      const [x0, y0] = p(a0), [x1, y1] = p(a1);
      return `<path d="M${cx} ${cy} L${fmt(x0)} ${fmt(y0)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${fmt(x1)} ${fmt(y1)} Z" fill="${fill}" stroke="#F4F4F4" stroke-width="0.7"/>`;
    };
    const s = -Math.PI / 2;
    let g = arc(s, s + Math.PI, BLUE) + arc(s + Math.PI, s + 1.5 * Math.PI, PALE) + arc(s + 1.5 * Math.PI, s + 2 * Math.PI, RULE);
    g += `<circle cx="${cx}" cy="${cy}" r="${r + 1.2}" fill="none" stroke="${INK}" stroke-width="0.3"/>`;
    const lab = (y: number, sw: string, a: string, b2: string) => `<rect x="78" y="${y - 3.6}" width="4.4" height="4.4" fill="${sw}"/>` + T(85, y, a, { size: 3.4, weight: 700, family: "DM Sans" }) + T(85, y + 4.6, b2, { size: 2.7, fill: GREY });
    g += lab(16, BLUE, "Half: vegetables and fruit", "Greens, berries, beetroot, red cabbage") + lab(36, PALE, "A quarter: protein", "Fish, eggs, poultry, beans, yoghurt") + lab(56, RULE, "A quarter: slow carbohydrate", "Rice, potato, oats, bread") + T(85, 65, "More after a hard session", { size: 2.7, fill: GREY });
    g += `<circle cx="80.2" cy="78.6" r="1.8" fill="none" stroke="${INK}" stroke-width="0.45"/>` + T(85, 80, "A thumb of fat", { size: 3.4, weight: 700, family: "DM Sans" }) + T(85, 84.6, "Olive oil, avocado, nuts, oily fish", { size: 2.7, fill: GREY });
    body = svg(w, h, g);
  }
  return `<div class="chartblock fig">${chartHead(b.title)}${body}${chartNote(b.note)}</div>`;
}

function block(b: GuideBlock, half = false): string {
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
      return `<div class="tbl">${b.title ? `<h3 class="ct">${esc(b.title)}</h3>` : ""}<table><thead><tr>${b.columns.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${b.rows
        .map(r => `<tr>${r.map((c, i) => `<td class="${i === 0 ? "k" : ""}">${esc(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>${chartNote(b.note)}</div>`;
    case "tiles":
      return `<div class="tiles">${b.items
        .map(
          t => `<div class="tile"><div class="ph" style="background-image:url('${photo(t.photo)}')"></div><h3>${esc(t.title)}</h3>
          <div class="tx"><p class="k">What causes it</p><p>${esc(t.cause)}</p><p class="k">What it feels like</p><p>${esc(t.feel)}</p></div></div>`
        )
        .join("")}</div>`;
    case "cards":
      return `<div class="sys"><div class="syshead"><h3>${esc(b.title)}</h3><p>${esc(b.goal)}</p></div><div class="cards n${b.items.length}">${b.items
        .map(c => `<div class="card"><span class="fig">${esc(c.figure)}</span><span class="lab">${esc(c.label)}</span><p>${esc(c.text)}</p></div>`)
        .join("")}</div></div>`;
    case "protocol":
      return `<div class="proto"><h3>${esc(b.title)}</h3><p class="when"><span>When</span>${esc(b.when)}</p>
        <ol class="psteps">${b.steps.map((st, i) => `<li><span class="i">${String(i + 1).padStart(2, "0")}</span><span class="t">${esc(st.time)}</span><p>${esc(st.text)}</p></li>`).join("")}</ol>${b.care ? `<p class="care"><span>Care</span>${esc(b.care)}</p>` : ""}</div>`;
    case "scenario":
      return `<div class="scen"><h3>When ${esc(b.title.charAt(0).toLowerCase() + b.title.slice(1))}</h3><p class="read"><span>Read it</span>${esc(b.read)}</p>
        <div class="acts"><div><p class="k">Today</p><ul>${b.today.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div><div><p class="k">Tomorrow</p><ul>${b.tomorrow.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div><div><p class="k">Skip</p><ul class="skip">${b.skip.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div></div></div>`;
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
    case "figure":
      return figure(b, half);
    case "bars":
      return barsChart(b);
    case "matrix":
      return matrixChart(b);
    case "lines":
      return linesChart(b);
    case "columns":
      return columnsChart(b, half);
    case "row":
      return `<div class="row">${b.blocks.map(x => `<div>${block(x, true)}</div>`).join("")}</div>`;
  }
}

// Consecutive protocols or scenarios sit side by side: two or three to a row.
function layout(blocks: GuideBlock[]): string {
  const out: string[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "protocol" || b.type === "scenario") {
      const run: GuideBlock[] = [b];
      while (blocks[i + 1] && blocks[i + 1].type === b.type && run.length < 3) run.push(blocks[++i]);
      out.push(`<div class="row ${run.length === 3 ? "trio" : "pair"}">${run.map(x => block(x, true)).join("")}</div>`);
    } else out.push(block(b));
  }
  return out.join("");
}

const css = `
@font-face{font-family:"DM Sans";font-weight:400;src:url(${FONTS}/dm-sans-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"DM Sans";font-weight:500;src:url(${FONTS}/dm-sans-latin-500-normal.woff2) format("woff2")}
@font-face{font-family:"DM Sans";font-weight:700;src:url(${FONTS}/dm-sans-latin-700-normal.woff2) format("woff2")}
@font-face{font-family:"Inter";font-weight:400;src:url(${FONTS}/inter-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Inter";font-weight:500;src:url(${FONTS}/inter-latin-500-normal.woff2) format("woff2")}
@font-face{font-family:"Inter";font-weight:600;src:url(${FONTS}/inter-latin-600-normal.woff2) format("woff2")}
@font-face{font-family:"Inter";font-weight:700;src:url(${FONTS}/inter-latin-700-normal.woff2) format("woff2")}
@page{size:A4 landscape;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:#F4F4F4;color:${INK};font-family:Inter,sans-serif;font-size:10pt;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:13mm 16mm 16mm;position:relative;page-break-after:always;overflow:hidden;background:#F4F4F4}
.page:last-child{page-break-after:auto}
.bar{display:flex;justify-content:space-between;align-items:center;font-size:7.5pt;letter-spacing:.18em;text-transform:uppercase;padding-bottom:2.5mm;border-bottom:.5pt solid ${INK};margin-bottom:6mm}
.bar b{font-family:"DM Sans";font-weight:700;letter-spacing:.24em}
.bar span{color:${GREY}}
.foot{position:absolute;left:16mm;right:16mm;bottom:8mm;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:${GREY};border-top:.5pt solid ${RULE};padding-top:2.2mm}
h2{font-family:"DM Sans";font-weight:700;font-size:28pt;line-height:.98;letter-spacing:-.03em;margin:0 0 5mm;color:#000}
h3{font-family:"DM Sans";font-weight:700;font-size:14pt;letter-spacing:-.01em;margin:0 0 2mm}
h4{font-family:"DM Sans";font-weight:700;font-size:11pt;margin:0 0 1.5mm}
.kicker{font-size:7.5pt;letter-spacing:.2em;text-transform:uppercase;color:${GREY};margin:0 0 3mm;display:flex;align-items:center;gap:2.5mm}
.kicker:before{content:"";width:2.2mm;height:2.2mm;background:${BLUE};display:inline-block;flex:none}
.num{font-family:"DM Sans";font-weight:700;font-size:56pt;letter-spacing:-.05em;color:${RULE};line-height:.9;margin:0 0 3mm}
p{margin:0 0 3.2mm}
.page>p,.page>.lead,.page>ul,.page>.callout{max-width:178mm}
p.lead{font-family:"DM Sans";font-weight:500;font-size:16pt;line-height:1.25;letter-spacing:-.015em;color:#000;margin-bottom:5mm}
.page>p.lead{max-width:200mm}
ul{margin:0 0 4mm;padding:0;list-style:none}
li{position:relative;padding-left:6mm;margin-bottom:1.8mm}
li:before{content:"";position:absolute;left:0;top:2.1mm;width:2mm;height:2mm;background:${BLUE}}
.callout{border-top:.5pt solid ${INK};border-bottom:.5pt solid ${INK};padding:3.2mm 0;margin:4mm 0 0}
.callout .label{display:block;font-size:7.5pt;letter-spacing:.18em;text-transform:uppercase;color:${GREY};margin-bottom:1.5mm}
.callout p{margin:0;font-family:"DM Sans";font-weight:500;font-size:13pt;line-height:1.25;letter-spacing:-.01em}
.steps{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin:3mm 0 5mm}
.step{display:flex;gap:4mm;border-top:.5pt solid ${INK};padding-top:3mm}
.step .n{font-family:"DM Sans";font-weight:700;font-size:24pt;letter-spacing:-.04em;color:${RULE};line-height:1}
.step p{margin:0;font-size:9.4pt}
.loop{display:flex;flex-wrap:wrap;align-items:center;gap:3mm;margin:5mm 0 6mm;font-family:"DM Sans";font-weight:700;font-size:25pt;letter-spacing:-.04em;line-height:1}
.loop .arrow{width:12mm;height:.6mm;background:${BLUE};position:relative}
.loop .arrow:after{content:"";position:absolute;right:0;top:-1.7mm;border:2mm solid transparent;border-left:3mm solid ${BLUE};border-right:0}
.loop .again{flex-basis:100%;font-family:Inter;font-weight:400;font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:${GREY};margin-top:1mm}
table{width:100%;border-collapse:collapse;margin:2mm 0 4mm}
th{text-align:left;font-family:"DM Sans";font-weight:700;font-size:7.8pt;letter-spacing:.14em;text-transform:uppercase;padding:0 3mm 2mm 0;border-bottom:.5pt solid ${INK};vertical-align:bottom}
td{vertical-align:top;padding:2.2mm 3mm 2.2mm 0;border-bottom:.5pt solid ${RULE};font-size:9pt;line-height:1.4}
td.k{font-weight:600;width:24%}
.tbl{margin-bottom:4mm}
.grad{background-image:url('${gradUrl}');background-size:100% 100%;background-repeat:no-repeat}
/* charts */
.ct{font-family:"DM Sans";font-weight:700;font-size:14pt;letter-spacing:-.015em;margin:0 0 1.5mm}
.cs{font-size:9pt;color:#3a3a3a;margin:0 0 4mm;max-width:190mm}
.cn{font-size:8.6pt;color:#3a3a3a;line-height:1.42;margin:3mm 0 0;max-width:190mm}
.chartblock{margin:0 0 5mm}
svg.chart{display:block;overflow:visible}
.panels{display:grid;gap:8mm;margin-top:3mm}
.panels.n4{grid-template-columns:repeat(4,1fr)}
.panel h4{font-size:11pt;margin-bottom:2mm;border-top:1.2pt solid ${INK};padding-top:2.5mm}
.panel p{font-size:8.4pt;color:#3a3a3a;line-height:1.4;margin:2.5mm 0 0}
.bars .brow{display:grid;grid-template-columns:42mm 1fr 92mm;gap:7mm;align-items:center;padding:5mm 0;border-top:.5pt solid ${RULE}}
.bars .brow.axis{border-top:0;padding:0 0 1mm;align-items:end}
.bars .brow.axis h4{display:none}
.bars .brow.axis:before{content:""}
.bars .brow h4{font-size:13pt;letter-spacing:-.02em;margin:0}
.bars .brow p{font-size:9.2pt;color:#3a3a3a;line-height:1.42;margin:0}
.bars .track{position:relative;height:9mm}
.bars .axis .track{height:5mm}
.bars .track .g{position:absolute;top:0;bottom:0;width:0;border-left:.25pt solid ${RULE}}
.bars .track .bar{position:absolute;top:2mm;height:5mm;background:${BLUE}}
.bars .val{display:block;font-family:"DM Sans";font-weight:700;font-size:11pt;letter-spacing:-.02em;margin-top:.5mm}
.bars .tick{position:absolute;bottom:0;transform:translateX(-50%);font-size:7pt;letter-spacing:.1em;text-transform:uppercase;color:${GREY};white-space:nowrap}
.bars .tick:first-child{transform:none}
.bars .tick i{display:block;width:0;height:2mm;border-left:.25pt solid ${GREY};margin:0 auto 1mm}
.mx th{text-align:center;padding:0 2mm 2mm;font-size:7.4pt;width:26mm}
.mx th:first-child{text-align:left;width:auto}
.mx td{padding:1.9mm 2mm 1.9mm 0;font-size:9.2pt}
.mx td.k{width:auto;font-weight:500}
.mx td.c{text-align:center;vertical-align:middle}
.m2,.m1,.m0{display:inline-block;width:3.6mm;height:3.6mm;vertical-align:middle}
.m2{background:${BLUE}}
.m1{border:.5pt solid ${INK}}
.m0{width:1.2mm;height:1.2mm;background:${RULE};border-radius:50%}
.legend{display:flex;gap:8mm;font-size:8.2pt;color:#3a3a3a;margin-top:2mm}
.legend span span{margin-right:2mm}
.row{display:grid;grid-template-columns:1fr 1fr;gap:12mm;align-items:start}
/* photo pages */
.photo{padding:0;background:${INK}}
.photo .img{position:absolute;inset:0;background-size:cover;background-position:center}
.photo .bar{position:absolute;left:16mm;right:16mm;top:13mm;color:#fff;border-bottom-color:rgba(255,255,255,.7);margin:0}
.photo .bar span{color:rgba(255,255,255,.75)}
.photo .title{position:absolute;left:16mm;right:16mm;bottom:22mm;color:#fff}
.photo .title .kicker{color:rgba(255,255,255,.8)}
.photo .title .n{font-family:"DM Sans";font-weight:700;font-size:20pt;letter-spacing:-.02em;margin:0 0 3mm;color:#fff}
.photo .title h1,.photo .title h2{font-family:"DM Sans";font-weight:700;font-size:54pt;line-height:.92;letter-spacing:-.04em;margin:0;color:#fff;max-width:200mm}
.photo .title p.sub{font-family:"DM Sans";font-weight:500;font-size:15pt;letter-spacing:-.01em;margin:4mm 0 0;color:#fff;max-width:150mm;line-height:1.25}
.photo .by{position:absolute;left:16mm;right:16mm;bottom:9mm;display:flex;justify-content:space-between;font-size:7.5pt;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.8);border-top:.5pt solid rgba(255,255,255,.5);padding-top:2.2mm}
.photo.top .title{top:30mm;bottom:auto}
.photo.cover .title{top:28mm;bottom:auto}
.photo.right .title{text-align:right}
.photo.right .title .kicker{justify-content:flex-end}
.photo.right .title h2,.photo.right .title p.sub{margin-left:auto}
.photo.dark .bar,.photo.dark .title,.photo.dark .title .n,.photo.dark .title h2,.photo.dark .title p.sub,.photo.dark .by{color:${INK}}
.photo.dark .bar{border-bottom-color:rgba(18,18,18,.6)}.photo.dark .bar span,.photo.dark .title .kicker{color:#3a3a3a}
.photo.dark .by{color:#3a3a3a;border-top-color:rgba(18,18,18,.4)}
/* split opener: photo left, title on paper right */
.split .img{position:absolute;left:0;top:0;bottom:0;width:140mm;background-size:cover;background-position:center}
.split .bar{position:absolute;left:156mm;right:16mm;top:13mm;margin:0}
.split .title{position:absolute;left:156mm;right:16mm;bottom:24mm}
.split .title .n{font-family:"DM Sans";font-weight:700;font-size:20pt;letter-spacing:-.02em;margin:0 0 3mm}
.split .title h2{font-size:44pt;line-height:.94;letter-spacing:-.04em;margin:0}
.split .title p.sub{font-family:"DM Sans";font-weight:500;font-size:14pt;letter-spacing:-.01em;margin:4mm 0 0;line-height:1.25}
.split .foot{left:156mm}
/* gradient opener */
.gradpage .panel{position:absolute;left:0;top:0;bottom:0;width:160mm}
.gradpage .bar{position:absolute;left:176mm;right:16mm;top:13mm;margin:0}
.gradpage .title{position:absolute;left:176mm;right:16mm;bottom:24mm}
.gradpage .title .n{font-family:"DM Sans";font-weight:700;font-size:20pt;letter-spacing:-.02em;margin:0 0 3mm}
.gradpage .title h2{font-size:40pt;line-height:.94;letter-spacing:-.04em;margin:0}
.gradpage .title p.sub{font-family:"DM Sans";font-weight:500;font-size:14pt;letter-spacing:-.01em;margin:4mm 0 0;line-height:1.25}
.gradpage .foot{left:176mm}
/* intro */
.cols{display:grid;grid-template-columns:1fr 92mm;gap:16mm;align-items:start}
.intro .big{font-family:"DM Sans";font-weight:500;font-size:17pt;line-height:1.24;letter-spacing:-.02em;color:#000;margin:0 0 6mm}
.small{font-size:9pt;color:#3a3a3a}
.inside li{font-size:9.4pt;margin-bottom:2.4mm;padding-left:0;display:flex;gap:3mm}
.inside li:before{display:none}
.inside .i{font-family:"DM Sans";font-weight:700;color:#B9BCC2;flex:none;width:8mm}
/* side photo layout: photo full bleed on the left, content on the right */
.withside{padding-left:150mm}
.withside .side{position:absolute;left:0;top:0;bottom:0;width:134mm;background-size:cover;background-position:center}
.withside .bar{margin-left:0}
.withside .foot{left:166mm}
.withside>p,.withside>.lead,.withside>ul,.withside>.callout{max-width:none}
/* tiles */
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:0 7mm;margin-top:2mm}
.tile .ph{height:66mm;background-size:cover;background-position:center}
.tile h3{margin:3.5mm 0 0;font-size:17pt;letter-spacing:-.025em;line-height:1}
.tile .tx{padding-top:1mm}
.tile .tx p{font-size:9.2pt;line-height:1.42;margin:0 0 1.5mm}
.tile .tx p.k{font-size:6.8pt;letter-spacing:.16em;text-transform:uppercase;color:${GREY};margin:1.5mm 0 .8mm}
/* cards */
.sys{margin:0 0 7mm}
.syshead{display:grid;grid-template-columns:84mm 1fr;gap:8mm;align-items:end;border-bottom:.5pt solid ${INK};padding-bottom:2.2mm;margin-bottom:3.5mm}
.syshead h3{font-size:19pt;margin:0;white-space:nowrap}
.syshead p{margin:0;font-size:9.4pt;color:#3a3a3a}
.cards{display:grid;gap:6mm}
.cards.n4{grid-template-columns:repeat(4,1fr)}
.cards.n5{grid-template-columns:repeat(5,1fr)}
.card{border-top:1.2pt solid ${BLUE};padding-top:2.5mm;min-width:0}
.card .fig{display:block;font-family:"DM Sans";font-weight:700;font-size:24pt;letter-spacing:-.035em;line-height:1;margin-bottom:1.8mm;white-space:nowrap}
.card .lab{display:block;font-size:7.6pt;letter-spacing:.14em;text-transform:uppercase;color:${INK};font-weight:600;margin-bottom:1.5mm;line-height:1.3}
.card p{font-size:8.8pt;line-height:1.4;color:#3a3a3a;margin:0}
/* protocols: two per page, side by side */
.row.pair{gap:14mm}
.row.trio{grid-template-columns:1fr 1fr 1fr;gap:10mm}
.row.trio .psteps li{grid-template-columns:6mm 24mm 1fr;gap:2.5mm}
.row.trio .psteps .t{font-size:12pt}
.row.trio .proto h3{font-size:17pt}
.proto{border-top:1.2pt solid ${INK};padding-top:3.5mm}
.proto h3{font-size:19pt;letter-spacing:-.025em;line-height:1.05;margin:0 0 2.5mm}
.proto .when,.proto .care{font-size:8.8pt;line-height:1.42;color:#3a3a3a;margin:0 0 3mm}
.proto .care{margin:3mm 0 0}
.proto .when span,.proto .care span{display:block;font-size:6.8pt;letter-spacing:.16em;text-transform:uppercase;color:${GREY};margin-bottom:.8mm}
.psteps{list-style:none;margin:0;padding:0}
.psteps li{display:grid;grid-template-columns:7mm 28mm 1fr;gap:3mm;align-items:start;padding:2.2mm 0;border-bottom:.5pt solid ${RULE}}
.psteps li:before{display:none}
.psteps .i{font-family:"DM Sans";font-weight:700;font-size:9pt;color:#B9BCC2;padding-top:1.2mm}
.psteps .t{font-family:"DM Sans";font-weight:700;font-size:13pt;letter-spacing:-.03em;line-height:1.05;white-space:nowrap}
.psteps p{margin:0;font-size:9pt;line-height:1.42}
/* scenarios: two per page, side by side */
.scen{border-top:1.2pt solid ${INK};padding-top:3.5mm}
.scen h3{font-size:20pt;letter-spacing:-.03em;line-height:1.04;margin:0 0 3mm}
.scen .read{font-family:"DM Sans";font-weight:500;font-size:11.5pt;line-height:1.3;letter-spacing:-.005em;margin:0 0 4.5mm}
.scen .read span{display:block;font-family:Inter;font-weight:400;font-size:6.8pt;letter-spacing:.16em;text-transform:uppercase;color:${GREY};margin-bottom:1mm}
.acts .k{font-size:6.8pt;letter-spacing:.16em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:.5pt solid ${INK};padding-bottom:1.2mm;margin:0 0 1.8mm}
.acts>div{margin-bottom:4mm}
.acts ul{margin-bottom:0}
.acts li{font-size:9.4pt;line-height:1.42;margin-bottom:1.8mm}
.acts ul.skip li:before{background:#B9BCC2}
/* scorecard */
.score{margin:3mm 0 5mm}
.srow{display:grid;grid-template-columns:1fr 78mm;gap:8mm;align-items:center;border-top:.5pt solid ${INK};padding:3.2mm 0}
.srow h4{font-size:14pt;letter-spacing:-.02em;margin-bottom:.8mm}
.srow p{margin:0;color:#3a3a3a}
.boxes{display:flex;gap:2.5mm;justify-content:flex-end}
.box{width:12mm;height:12mm;border:.6pt solid ${INK};display:flex;align-items:center;justify-content:center;font-family:"DM Sans";font-weight:500;font-size:11pt;color:${GREY}}
.scale{display:flex;justify-content:space-between;font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:${GREY};border-top:.5pt solid ${INK};padding-top:2.2mm}
/* week */
.week{display:grid;grid-template-columns:repeat(7,1fr);gap:4mm;margin:2mm 0 3mm}
.day{border-top:1.2pt solid ${INK};padding-top:2.5mm;min-height:36mm}
.day h4{font-size:8.5pt;letter-spacing:.1em;text-transform:uppercase;margin-bottom:3mm}
.day p{font-size:8.2pt;line-height:1.38;margin:0 0 2mm}
.day .work{font-family:"DM Sans";font-weight:700;font-size:11pt;line-height:1.15;letter-spacing:-.01em;margin-bottom:3mm;min-height:10mm}
.day .rec{color:#3a3a3a}
.day .rec:before{content:"";display:block;width:2.2mm;height:2.2mm;background:${BLUE};margin-bottom:1.5mm}
/* back page */
.back .close{position:absolute;left:166mm;right:16mm;bottom:22mm;height:50mm}
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
push(`<section class="page photo cover"><div class="img" style="background-image:url('${photo(G.cover)}')"></div>${bar}
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
  } else if (s.opener && s.openerStyle?.split) {
    push(`<section class="page split">${bar}<div class="img" style="background-image:url('${photo(s.opener)}');background-position:${s.openerStyle?.pos ?? "center"}"></div>
      <div class="title"><p class="n">${s.number}</p><h2>${esc(s.title)}</h2><p class="sub">${esc(s.kicker)}</p></div>
      ${foot()}
    </section>`);
  } else if (s.opener) {
    const cls = `${s.openerStyle?.ink === "dark" ? " dark" : ""}${s.openerStyle?.at === "top" ? " top" : ""}${s.openerStyle?.align === "right" ? " right" : ""}`;
    push(`<section class="page photo${cls}"><div class="img" style="background-image:url('${photo(s.opener)}');background-position:${s.openerStyle?.pos ?? "center"}"></div>${bar}
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
    const body = layout(blocks);
    const head =
      i === 0
        ? s.opener
          ? `<p class="kicker">${s.number} ${esc(s.kicker)}</p>`
          : `<p class="num">${s.number}</p><p class="kicker">${esc(s.kicker)}</p><h2>${esc(s.title)}</h2>`
        : `<p class="kicker">${s.number} ${esc(s.title)}, continued</p>`;
    const isBack = s === G.sections[G.sections.length - 1];
    const withSide = Boolean(s.side && i === 0);
    const side = withSide ? `<div class="side" style="background-image:url('${photo(s.side!)}')"></div>` : "";
    const close = isBack ? '<div class="close grad"></div>' : "";
    push(`<section class="page${withSide ? " withside" : ""}${isBack ? " back" : ""}">${side}${bar}${head}${body}${close}${foot()}</section>`);
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
await page.pdf({ path: OUT, width: "297mm", height: "210mm", printBackground: true, preferCSSPageSize: true });
await browser.close();
if (!process.env.KEEP_HTML) fs.unlinkSync(htmlPath);
console.log("wrote", OUT, Math.round(fs.statSync(OUT).size / 1024), "KB,", pages.length, "pages");
