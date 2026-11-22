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

// Brand: the same tokens as marinlazic.com (client/src/index.css), the PDF
// report and the emails. Ink does the work. Signal is the one mark on a page
// that says "look here". Sun is the warm fill from the program pictures.
const PAPER = "#FAF9F5";
const INK = "#141413";
const BODY = "#3D3D3A";
const GREY = "#5E5D59";
const RULE = "#DDDBD0";
const SOFT = "#B0AEA5";
const OAT = "#F0EEE6";
const SIGNAL = "#FF5A36";
const SUN = "#F6DC98";

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

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

// ---------- pictures in the site's style ----------
// The site's pictures are collages: one line drawing on a flat colour, a block
// of graph or dot paper, and a mono photograph (see client/public/images/site).
// The guide's pictures are built the same way, from the same colours.
const P_INK = "#1F1E1C";
const P_DARK = "#2A2927";
const P_LIGHT = "#F1EADD";
const BUTTER = "#F6DC98";
const SKY = "#8FB3E2";
const MINT = "#CCDED5";
const GREEN = "#62AD6A";
const CLAY = "#D9694D";
const GRAPH = "#F4EDE0";
const DOTP = "#FBF6E8";

// Line drawings on a 100 by 100 box. S is the line colour, F the colour of the block behind.
const sw = (w: number) => `stroke-width="${w}"`;
const DRAW: Record<string, (S: string, F: string) => string> = {
  // work, dip, and the rebound above where you started
  curve: S => `<line x1="8" y1="56" x2="92" y2="56" ${sw(0.47)} stroke-dasharray="1.2 2.4"/><path d="M8 56 C17 56 20 80 31 80 C44 80 48 30 61 30 C72 30 78 50 92 52" ${sw(0.95)}/><line x1="61" y1="30" x2="61" y2="56" ${sw(0.47)}/><line x1="31" y1="80" x2="31" y2="56" ${sw(0.47)}/><circle cx="61" cy="30" r="2.7" fill="${SIGNAL}" stroke="none"/><circle cx="8" cy="56" r="1.7" fill="${S}" stroke="none"/>`,
  // work on one side, rest on the other
  scale: (S, F) => `<path d="M50 30 V80 M36 84 H64 M43 84 L50 77 L57 84" ${sw(0.82)}/><line x1="16" y1="30" x2="84" y2="30" ${sw(0.82)}/><path d="M16 30 L7 56 M16 30 L25 56 M84 30 L75 56 M84 30 L93 56" ${sw(0.47)}/><path d="M5 56 H27 C27 63 21 67 16 67 C11 67 5 63 5 56 Z" fill="${F}" ${sw(0.82)}/><path d="M73 56 H95 C95 63 89 67 84 67 C79 67 73 63 73 56 Z" fill="${F}" ${sw(0.82)}/><rect x="10.5" y="47" width="11" height="9" rx="1.3" fill="${F}" ${sw(0.82)}/><path d="M13.5 47 V44.4 H18.5 V47" ${sw(0.47)}/><path d="M85.6 44.6 A5.6 5.6 0 1 0 90.6 53.6 A4.6 4.6 0 0 1 85.6 44.6 Z" fill="${F}" ${sw(0.82)}/><circle cx="50" cy="30" r="2.7" fill="${SIGNAL}" stroke="none"/>`,
  // rest
  hammock: (S, F) => `<line x1="6" y1="84" x2="94" y2="84" ${sw(0.47)}/><path d="M14 22 V84 M86 22 V84" ${sw(0.82)}/><path d="M14 30 L24 40 M86 30 L76 40" ${sw(0.47)}/><path d="M24 40 C34 68 66 68 76 40 C66 55 34 55 24 40 Z" fill="${F}" ${sw(0.82)}/><circle cx="50" cy="21" r="5.6" fill="${SIGNAL}" stroke="none"/>`,
  // four systems, each at its own level
  faders: (S, F) => [20, 40, 60, 80].map((x, i) => { const y = [30, 62, 44, 70][i]; return `<line x1="${x}" y1="16" x2="${x}" y2="84" ${sw(0.82)}/><line x1="${x - 4}" y1="16" x2="${x + 4}" y2="16" ${sw(0.47)}/><line x1="${x - 4}" y1="84" x2="${x + 4}" y2="84" ${sw(0.47)}/><rect x="${x - 7}" y="${y - 3.6}" width="14" height="7.2" rx="2" fill="${i === 1 ? SIGNAL : F}" ${sw(0.82)}/>`; }).join(""),
  // four kinds that overlap
  rings: () => [[39, 39], [61, 39], [39, 61], [61, 61]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="21" ${sw(0.82)}/>`).join("") + `<circle cx="50" cy="50" r="3.1" fill="${SIGNAL}" stroke="none"/>`,
  // the right fix for the right fatigue
  plug: (S, F) => `<rect x="60" y="26" width="30" height="48" rx="6" fill="${F}" ${sw(0.82)}/><circle cx="72" cy="42" r="2.9" ${sw(0.82)}/><circle cx="72" cy="58" r="2.9" ${sw(0.82)}/><path d="M16 50 C6 50 4 62 8 72 C12 82 22 86 30 86" ${sw(0.82)}/><rect x="16" y="36" width="20" height="28" rx="4" fill="${F}" ${sw(0.82)}/><path d="M36 42 H46 M36 58 H46" ${sw(1.5)}/><path d="M49.5 42 H67 M49.5 58 H67" stroke="${SIGNAL}" ${sw(0.6)} stroke-dasharray="1.2 2.2"/>`,
  // exact numbers
  thermo: (S, F) => `<path d="M44 20 A6 6 0 0 1 56 20 V62.6 A12 12 0 1 1 44 62.6 Z" fill="${F}" ${sw(0.82)}/><line x1="50" y1="73" x2="50" y2="44" stroke="${SIGNAL}" ${sw(3.2)}/><circle cx="50" cy="73" r="6.6" fill="${SIGNAL}" stroke="none"/>` + [24, 32, 40, 48, 56].map((y, i) => `<line x1="61" y1="${y}" x2="${i % 2 ? 66 : 70}" y2="${y}" ${sw(0.47)}/>`).join("") + `<path d="M75 40 H79 V56 H75" ${sw(0.82)}/>`,
  // which way from here
  sign: (S, F) => `<path d="M50 14 V88 M36 88 H64" ${sw(0.82)}/><path d="M50 20 H76 L85 27.5 L76 35 H50 Z" fill="${F}" ${sw(0.82)}/><path d="M50 41 H24 L15 48.5 L24 56 H50 Z" fill="${F}" ${sw(0.82)}/><path d="M50 62 H70 L79 69.5 L70 77 H50 Z" fill="${F}" ${sw(0.82)}/><path d="M56 27.5 H72 M28 48.5 H44 M56 69.5 H66" ${sw(0.47)}/><circle cx="50" cy="12" r="2.7" fill="${SIGNAL}" stroke="none"/>`,
  // a warm meal
  bowl: (S, F) => `<path d="M16 46 H84 C84 66 70 80 50 80 C30 80 16 66 16 46 Z" fill="${F}" ${sw(0.82)}/><path d="M40 84 H60" ${sw(0.82)}/><path d="M23 53 H77" ${sw(0.47)}/><path d="M38 37 C34 32 42 28 38 22 M62 37 C58 32 66 28 62 22" ${sw(0.82)}/><path d="M50 35 C46 29 54 24 50 16" stroke="${SIGNAL}" ${sw(0.95)}/>`,
  // first thing in the morning
  sunrise: S => `<line x1="8" y1="66" x2="92" y2="66" ${sw(0.82)}/><path d="M29 66 A21 21 0 0 1 71 66" ${sw(0.82)}/>` + [30, 60, 90, 120, 150].map(a => { const r = (a * Math.PI) / 180, c = Math.cos(r), n = Math.sin(r); return `<line x1="${fmt(50 + 27 * c)}" y1="${fmt(66 - 27 * n)}" x2="${fmt(50 + 36 * c)}" y2="${fmt(66 - 36 * n)}" ${a === 90 ? `stroke="${SIGNAL}" ${sw(1.1)}` : sw(0.82)}/>`; }).join("") + `<path d="M22 75 H78 M34 83 H66" ${sw(0.47)}/>`,
  // seven days, hard and easy: the load of each day, and the day off
  week: (S, F) => `<line x1="8" y1="56" x2="92" y2="56" ${sw(0.82)}/>` + [26, 16, 16, 21, 26, 6, 0].map((h, k) => { const x = 14 + 12 * k, hard = h >= 21; return (h ? `<rect x="${x - 3.6}" y="${56 - h}" width="7.2" height="${h}" rx="1.2" fill="${hard ? S : F}" ${sw(0.82)}/>` : "") + `<circle cx="${x}" cy="66" r="2.3" fill="${k === 6 ? SIGNAL : F}" ${k === 6 ? 'stroke="none"' : sw(0.47)}/>`; }).join(""),
  // where you stand across six areas
  hex: (S, F) => `<polygon points="50,14 81.2,32 81.2,68 50,86 18.8,68 18.8,32" ${sw(0.82)}/><polygon points="50,32 65.6,41 65.6,59 50,68 34.4,59 34.4,41" ${sw(0.47)}/><path d="M50 14 V86 M18.8 32 L81.2 68 M81.2 32 L18.8 68" ${sw(0.3)}/><polygon points="50,19.4 68.7,39.2 62.5,57.2 50,77 32.9,59.9 28.2,37.4" fill="${F}" fill-opacity=".55" ${sw(0.95)}/><circle cx="62.5" cy="57.2" r="2.7" fill="${SIGNAL}" stroke="none"/>`,
};
// Small marks for the four systems, used on the photo tiles.
const ICON: Record<string, string> = {
  barbell: `<path d="M56 10 L28 54 H48 L42 90 L72 44 H52 Z"/>`,
  roller: `<path d="M30 14 H70 M30 86 H70 M34 20 L66 31 L34 42 L66 53 L34 64 L66 75 L34 80"/>`,
  lanes: `<path d="M50 82 C20 60 14 40 28 28 C38 20 48 26 50 36 C52 26 62 20 72 28 C86 40 80 60 50 82 Z"/>`,
  desk: `<circle cx="50" cy="44" r="28"/><path d="M40 70 V88 M60 70 V88"/><path d="M50 44 m-9 0 a9 9 0 1 1 9 9 a5 5 0 1 1 -5 -5"/>`,
};
type Tile = { x: number; y: number; w: number; h: number } & (
  | { k: "color"; fill: string; draw?: string; size?: number }
  | { k: "graph" }
  | { k: "dot" }
  | { k: "photo"; p: GuidePhoto; pos?: string }
);
let collageId = 0;
function collage(W: number, H: number, tiles: Tile[], cls = ""): string {
  const id = ++collageId;
  const body = tiles
    .map(t => {
      const box = `x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}"`;
      if (t.k === "graph") return `<rect ${box} fill="${GRAPH}"/><rect ${box} fill="url(#gp${id})"/>`;
      if (t.k === "dot") return `<rect ${box} fill="${DOTP}"/><rect ${box} fill="url(#dp${id})"/>`;
      if (t.k === "photo") {
        const par = t.pos?.includes("top") ? "xMidYMin" : t.pos?.includes("bottom") ? "xMidYMax" : t.pos?.includes("left") ? "xMinYMid" : t.pos?.includes("right") ? "xMaxYMid" : "xMidYMid";
        return `<rect ${box} fill="${P_DARK}"/><image href="${photo(t.p)}" ${box} preserveAspectRatio="${par} slice"/>`;
      }
      let out = `<rect ${box} fill="${t.fill}"/>`;
      if (t.draw) {
        const dark = t.fill === P_DARK || t.fill === P_INK;
        const size = t.size ?? Math.min(t.w, t.h) * 0.78;
        const k = size / 100;
        out += `<g transform="translate(${fmt(t.x + (t.w - size) / 2)} ${fmt(t.y + (t.h - size) / 2)}) scale(${fmt(k)})" fill="none" stroke="${dark ? P_LIGHT : P_INK}" stroke-linecap="round" stroke-linejoin="round">${DRAW[t.draw](dark ? P_LIGHT : P_INK, t.fill)}</g>`;
      }
      return out;
    })
    .join("");
  return `<svg class="collage ${cls}" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><pattern id="gp${id}" width="3.4" height="3.4" patternUnits="userSpaceOnUse"><path d="M3.4 0H0V3.4" fill="none" stroke="#D5C9B6" stroke-width=".15"/></pattern><pattern id="dp${id}" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r=".2" fill="#CFC4B1"/></pattern></defs>${body}</svg>`;
}
// One picture per section: its drawing, its colour and which of three layouts it uses.
const PIC: Record<string, { draw: string; fill: string; second: string; layout: 1 | 2 | 3 }> = {
  "01": { draw: "scale", fill: BUTTER, second: SKY, layout: 1 },
  "02": { draw: "hammock", fill: MINT, second: BUTTER, layout: 1 },
  "03": { draw: "faders", fill: P_DARK, second: SKY, layout: 2 },
  "04": { draw: "rings", fill: P_DARK, second: MINT, layout: 3 },
  "05": { draw: "plug", fill: SKY, second: BUTTER, layout: 2 },
  "06": { draw: "thermo", fill: MINT, second: CLAY, layout: 1 },
  "07": { draw: "sign", fill: BUTTER, second: GREEN, layout: 2 },
  "08": { draw: "bowl", fill: BUTTER, second: MINT, layout: 1 },
  "09": { draw: "sunrise", fill: P_DARK, second: BUTTER, layout: 3 },
  "10": { draw: "week", fill: GREEN, second: BUTTER, layout: 1 },
  "11": { draw: "hex", fill: SKY, second: BUTTER, layout: 2 },
};
// A full height picture, W wide: the section drawing, a paper block and the section photo.
function sectionPicture(num: string, p: GuidePhoto, W: number, pos?: string): string {
  const c = PIC[num], H = 210;
  if (c.layout === 1) {
    const top = 128, pw = Math.round(W * 0.64);
    return collage(W, H, [{ k: "color", x: 0, y: 0, w: W, h: top, fill: c.fill, draw: c.draw, size: 114 }, { k: "photo", x: 0, y: top, w: pw, h: H - top, p, pos }, { k: "graph", x: pw, y: top, w: W - pw, h: H - top }]);
  }
  if (c.layout === 2) {
    const top = 98, dw = Math.round(W * 0.68);
    return collage(W, H, [{ k: "photo", x: 0, y: 0, w: W, h: top, p, pos }, { k: "color", x: 0, y: top, w: dw, h: H - top, fill: c.fill, draw: c.draw, size: 84 }, { k: "dot", x: dw, y: top, w: W - dw, h: (H - top) / 2 }, { k: "color", x: dw, y: top + (H - top) / 2, w: W - dw, h: (H - top) / 2, fill: c.second }]);
  }
  const strip = Math.round(W * 0.26), top = 116;
  return collage(W, H, [{ k: "color", x: 0, y: 0, w: strip, h: H, fill: c.second }, { k: "color", x: strip, y: 0, w: W - strip, h: top, fill: c.fill, draw: c.draw, size: 88 }, { k: "photo", x: strip, y: top, w: W - strip, h: H - top, p, pos }]);
}
// The strip across the foot of a page: photographs with a flat colour and a paper block between them.
const BAND_FILLS = [BUTTER, SKY, MINT, CLAY, GREEN];
let bandCount = 0;
function bandPicture(photos: GuidePhoto[], pos?: string[]): string {
  const i = bandCount++, fill = BAND_FILLS[i % BAND_FILLS.length], paper = (i % 2 ? "dot" : "graph") as "dot" | "graph", H = 42, flip = i % 2 === 1;
  let tiles: Tile[];
  if (photos.length > 1) tiles = [{ k: "photo", x: 0, y: 0, w: 118, h: H, p: photos[0], pos: pos?.[0] }, { k: "color", x: 118, y: 0, w: 26, h: H, fill }, { k: "photo", x: 144, y: 0, w: 112, h: H, p: photos[1], pos: pos?.[1] }, { k: paper, x: 256, y: 0, w: 41, h: H }];
  else if (flip) tiles = [{ k: paper, x: 0, y: 0, w: 52, h: H }, { k: "color", x: 52, y: 0, w: 34, h: H, fill }, { k: "photo", x: 86, y: 0, w: 211, h: H, p: photos[0], pos: pos?.[0] }];
  else tiles = [{ k: "photo", x: 0, y: 0, w: 211, h: H, p: photos[0], pos: pos?.[0] }, { k: "color", x: 211, y: 0, w: 34, h: H, fill }, { k: paper, x: 245, y: 0, w: 52, h: H }];
  return collage(297, H, tiles);
}
const TILE_FILLS = [BUTTER, MINT, SKY, GREEN];

// ---------- charts (SVG in mm units; 1pt = 0.353mm) ----------
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
      g += `<polyline points="${pts}" fill="none" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round" stroke-linecap="round"/>`;
      const lowest = Math.min(...s.values);
      g += s.values
        .map((v, i) => `<circle cx="${fmt(px(i))}" cy="${fmt(py(v))}" r="1.3" fill="${v === lowest ? SIGNAL : PAPER}" stroke="${v === lowest ? SIGNAL : INK}" stroke-width="0.55"/>`)
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
    if (v > 0) g += `<rect x="${fmt(px(i) - bw / 2)}" y="${fmt(py(v))}" width="${fmt(bw)}" height="${fmt(py(0) - py(v))}" rx="0.8" fill="${INK}"/>`;
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
    const w = 265, h = 98, pw = 81, gap = 11, base = 56, bottom = 86;
    const panel = (x0: number, title: string, inner: string, caption: string) =>
      T(x0, 5, title, { size: 4.2, weight: 700, family: "DM Sans" }) + L(x0, base, x0 + pw, base, INK, 0.3) + T(x0, base - 1.6, "Where you started", { size: 2.7, fill: GREY }) + inner + WT(x0, bottom, caption, 50, 4, { size: 3, fill: "#3a3a3a" });
    // One session, rested well.
    const x0 = 0;
    const c1 = `M${x0} ${base} C${x0 + 6} ${base},${x0 + 8} ${base + 15},${x0 + 15} ${base + 15} C${x0 + 25} ${base + 15},${x0 + 30} ${base - 22},${x0 + 45} ${base - 22} C${x0 + 60} ${base - 22},${x0 + 70} ${base - 3},${x0 + pw} ${base}`;
    let inner = `<path d="${c1}" fill="none" stroke="${INK}" stroke-width="0.9"/>`;
    inner += `<circle cx="${x0 + 45}" cy="${base - 22}" r="1.8" fill="${SIGNAL}"/>`;
    inner += T(x0 + 15, base + 20, "Session", { size: 3, anchor: "middle", weight: 500 }) + T(x0 + 24, base - 9, "Rest", { size: 3, anchor: "end", weight: 500 }) + T(x0 + 45, base - 26, "Adapt: next session here", { size: 3, anchor: "middle", weight: 700, family: "DM Sans" }) + T(x0 + pw, base + 5, "Fades if you wait too long", { size: 2.7, fill: GREY, anchor: "end" });
    body += panel(x0, "One session, rested well", inner, "Down during the work, up and past the start during the rest.");
    // Too soon: each session starts before the rise is finished.
    const x1 = pw + gap;
    let d = `M${x1} ${base}`, y = base, inner2 = "";
    for (let i = 0; i < 4; i++) {
      const sx = x1 + i * 20;
      d += ` C${sx + 4} ${y},${sx + 5} ${y + 12},${sx + 9} ${y + 12} C${sx + 14} ${y + 12},${sx + 17} ${y + 4},${sx + 20} ${y + 4}`;
      inner2 += `<circle cx="${sx + 20}" cy="${y + 4}" r="1.3" fill="${INK}"/>`;
      y += 4;
    }
    inner2 = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="0.9"/>` + inner2 + T(x1, base - 8, "Next session before the rest is done", { size: 3, weight: 500 }) + T(x1 + pw, base - 2, "Each one starts lower", { size: 3, anchor: "end", weight: 700, family: "DM Sans" });
    body += panel(x1, "The next session too soon", inner2, "Shorten the rest and the gain shrinks, then turns into a loss.");
    // Timed right: each session starts at the previous peak.
    const x2 = 2 * (pw + gap);
    d = `M${x2} ${base}`; y = base; let inner3 = "";
    for (let i = 0; i < 4; i++) {
      const sx = x2 + i * 20;
      d += ` C${sx + 4} ${y},${sx + 5} ${y + 10},${sx + 8} ${y + 10} C${sx + 13} ${y + 10},${sx + 16} ${y - 7},${sx + 20} ${y - 7}`;
      inner3 += `<circle cx="${sx + 20}" cy="${y - 7}" r="1.3" fill="${SIGNAL}"/>`;
      y -= 7;
    }
    inner3 = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="0.9"/>` + inner3 + T(x2, base - 36, "Next session at the peak", { size: 3, weight: 500 }) + T(x2 + pw, y - 3, "Each one starts higher", { size: 3, anchor: "end", weight: 700, family: "DM Sans" });
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
    g += `<rect x="${fmt(px(10))}" y="${fmt(py(15))}" width="${fmt(px(15) - px(10))}" height="${fmt(py(10) - py(15))}" rx="1.5" fill="${SIGNAL}"/>`;
    g += T((px(10) + px(15)) / 2, (py(10) + py(15)) / 2 - 1.5, "The target", { size: 3.4, fill: "#fff", anchor: "middle", weight: 700, family: "DM Sans" }) + T((px(10) + px(15)) / 2, (py(10) + py(15)) / 2 + 3, "10 to 15°, 10 to 15 min", { size: 2.6, fill: "#fff", anchor: "middle" });
    g += T(px(5), py(12.5), "Not long enough", { size: 2.9, fill: GREY, anchor: "middle" }) + WT(px(17.5), py(13), "Nothing more to gain", 13, 3.6, { size: 2.9, fill: GREY, anchor: "middle" });
    g += T(px(12.5), py(17.5), "Does little", { size: 2.9, fill: GREY, anchor: "middle" }) + T(px(12.5), py(7.5), "Adds risk, not benefit", { size: 2.9, fill: GREY, anchor: "middle" });
    body = svg(w, h, g);
  } else {
    const w = 126, h = 96, cx = 36, cy = 48, r = 34;
    const arc = (a0: number, a1: number, fill: string) => {
      const p = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      const [x0, y0] = p(a0), [x1, y1] = p(a1);
      return `<path d="M${cx} ${cy} L${fmt(x0)} ${fmt(y0)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${fmt(x1)} ${fmt(y1)} Z" fill="${fill}" stroke="${PAPER}" stroke-width="0.7"/>`;
    };
    const s = -Math.PI / 2;
    let g = arc(s, s + Math.PI, INK) + arc(s + Math.PI, s + 1.5 * Math.PI, SUN) + arc(s + 1.5 * Math.PI, s + 2 * Math.PI, RULE);
    g += `<circle cx="${cx}" cy="${cy}" r="${r + 1.2}" fill="none" stroke="${INK}" stroke-width="0.3"/>`;
    const lab = (y: number, sw: string, a: string, b2: string) => `<rect x="78" y="${y - 3.6}" width="4.4" height="4.4" fill="${sw}"/>` + T(85, y, a, { size: 3.4, weight: 700, family: "DM Sans" }) + T(85, y + 4.6, b2, { size: 2.7, fill: GREY });
    g += lab(16, INK, "Half: vegetables and fruit", "Greens, berries, beetroot, red cabbage") + lab(36, SUN, "A quarter: protein", "Fish, eggs, poultry, beans, yoghurt") + lab(56, RULE, "A quarter: slow carbohydrate", "Rice, potato, oats, bread") + T(85, 65, "More after a hard session", { size: 2.7, fill: GREY });
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
          (t, i) => `<div class="tile"><div class="ph" style="background-image:url('${photo(t.photo)}')">${ICON[t.photo] ? `<span class="ic" style="background:${TILE_FILLS[i % 4]}"><svg viewBox="0 0 100 100" fill="none" stroke="${P_INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${ICON[t.photo]}</svg></span>` : ""}</div><h3>${esc(t.title)}</h3>
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
    case "band":
      return `<div class="band">${bandPicture(b.photos, b.pos)}</div>`;
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
html,body{margin:0;background:${PAPER};color:${INK};font-family:Inter,sans-serif;font-size:10pt;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:13mm 16mm 16mm;position:relative;page-break-after:always;overflow:hidden;background:${PAPER}}
.page:last-child{page-break-after:auto}
.bar{display:flex;justify-content:space-between;align-items:center;font-size:8.5pt;font-weight:500;padding-bottom:2.5mm;border-bottom:.5pt solid ${RULE};margin-bottom:4.65mm}
.bar b{font-family:"DM Sans";font-weight:700;font-size:11.5pt;letter-spacing:-.01em;line-height:1}
.bar span{color:${GREY}}
.foot{position:absolute;left:16mm;right:16mm;bottom:8mm;display:flex;justify-content:space-between;font-size:8pt;font-weight:500;color:${GREY};border-top:.5pt solid ${RULE};padding-top:1.7mm}
h2{font-family:"DM Sans";font-weight:700;font-size:28pt;line-height:.98;letter-spacing:-.03em;margin:0 0 5mm;color:${INK}}
h3{font-family:"DM Sans";font-weight:700;font-size:14pt;letter-spacing:-.01em;margin:0 0 2mm}
h4{font-family:"DM Sans";font-weight:700;font-size:11pt;margin:0 0 1.5mm}
.kicker{font-size:8.5pt;font-weight:500;color:${GREY};margin:0 0 2.45mm;display:flex;align-items:center;gap:2.5mm}
.num{font-family:"DM Sans";font-weight:700;font-size:56pt;letter-spacing:-.05em;color:${RULE};line-height:.9;margin:0 0 3mm}
p{margin:0 0 3.2mm}
.page>p,.page>.lead,.page>ul{max-width:178mm}
.page>.callout{max-width:187mm}
p.lead{font-family:"DM Sans";font-weight:500;font-size:16pt;line-height:1.25;letter-spacing:-.015em;color:${INK};margin-bottom:5mm}
.page>p.lead{max-width:200mm}
ul{margin:0 0 4mm;padding:0;list-style:none}
li{position:relative;padding-left:6mm;margin-bottom:1.8mm}
li:before{content:"";position:absolute;left:.2mm;top:2.25mm;width:1.7mm;height:1.7mm;border-radius:50%;background:${INK}}
.callout{background:${OAT};border-radius:2.5mm;padding:2.75mm 4.5mm;margin:3mm 0 0}
.callout .label{display:block;font-size:8.5pt;font-weight:500;color:${GREY};margin-bottom:1mm}
.callout p{margin:0;font-family:"DM Sans";font-weight:500;font-size:13pt;line-height:1.25;letter-spacing:-.01em}
.steps{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin:3mm 0 5mm}
.step{display:flex;gap:4mm;border-top:.75pt solid ${INK};padding-top:3mm}
.step .n{font-family:"DM Sans";font-weight:700;font-size:24pt;letter-spacing:-.04em;color:${INK};line-height:1}
.step p{margin:0;font-size:9.4pt}
.loop{display:flex;flex-wrap:wrap;align-items:center;gap:3mm;margin:5mm 0 6mm;font-family:"DM Sans";font-weight:700;font-size:25pt;letter-spacing:-.04em;line-height:1}
.loop .arrow{width:12mm;height:.6mm;background:${INK};position:relative}
.loop .arrow:after{content:"";position:absolute;right:0;top:-1.7mm;border:2mm solid transparent;border-left:3mm solid ${INK};border-right:0}
.loop .again{flex-basis:100%;font-family:Inter;font-weight:500;font-size:8.5pt;letter-spacing:0;color:${GREY};margin-top:.5mm}
table{width:100%;border-collapse:collapse;margin:2mm 0 4mm}
th{text-align:left;font-family:"DM Sans";font-weight:700;font-size:9pt;line-height:1.3;padding:0 3mm 2mm 0;border-bottom:.5pt solid ${INK};vertical-align:bottom}
td{vertical-align:top;padding:1.8mm 3mm 1.8mm 0;border-bottom:.5pt solid ${RULE};font-size:9pt;line-height:1.4}
td.k{font-weight:600;width:24%}
.tbl{margin-bottom:4mm}
/* charts */
.ct{font-family:"DM Sans";font-weight:700;font-size:14pt;letter-spacing:-.015em;margin:0 0 1.5mm}
.cs{font-size:9pt;color:${BODY};margin:0 0 4mm;max-width:190mm}
.cn{font-size:8.6pt;color:${BODY};line-height:1.42;margin:3mm 0 0;max-width:190mm}
.chartblock{margin:0 0 5mm}
svg.chart{display:block;overflow:visible}
.panels{display:grid;gap:8mm;margin-top:3mm}
.panels.n4{grid-template-columns:repeat(4,1fr)}
.panel h4{font-size:11pt;margin-bottom:2mm;border-top:1.2pt solid ${INK};padding-top:2.5mm}
.panel p{font-size:8.4pt;color:${BODY};line-height:1.4;margin:2.5mm 0 0}
.bars .brow{display:grid;grid-template-columns:42mm 1fr 92mm;gap:7mm;align-items:center;padding:3.8mm 0;border-top:.5pt solid ${RULE}}
.bars .brow.axis{border-top:0;padding:0 0 1mm;align-items:end}
.bars .brow.axis h4{display:none}
.bars .brow.axis:before{content:""}
.bars .brow h4{font-size:13pt;letter-spacing:-.02em;margin:0}
.bars .brow p{font-size:9.2pt;color:${BODY};line-height:1.42;margin:0}
.bars .track{position:relative;height:9mm}
.bars .axis .track{height:5mm}
.bars .track .g{position:absolute;top:0;bottom:0;width:0;border-left:.25pt solid ${RULE}}
.bars .track .bar{position:absolute;top:2.8mm;height:3.4mm;border-radius:99px;background:${INK}}
.bars .val{display:block;font-family:"DM Sans";font-weight:700;font-size:11pt;letter-spacing:-.02em;margin-top:.5mm}
.bars .tick{position:absolute;bottom:0;transform:translateX(-50%);font-size:7.6pt;line-height:1.38;color:${GREY};white-space:nowrap}
.bars .tick:first-child{transform:none}
.bars .tick i{display:block;width:0;height:2mm;border-left:.25pt solid ${GREY};margin:0 auto 1mm}
.mx th{text-align:center;padding:0 2mm 2mm;font-size:8.4pt;line-height:1.32;width:26mm}
.mx th:first-child{text-align:left;width:auto}
.mx td{padding:1.9mm 2mm 1.9mm 0;font-size:9.2pt}
.mx td.k{width:auto;font-weight:500}
.mx td.c{text-align:center;vertical-align:middle}
.m2,.m1,.m0{display:inline-block;width:3.6mm;height:3.6mm;vertical-align:middle}
.m2{background:${INK};border-radius:.9mm}
.m1{border:.5pt solid ${INK};border-radius:.9mm}
.m0{width:1.2mm;height:1.2mm;background:${RULE};border-radius:50%}
.legend{display:flex;gap:8mm;font-size:8.2pt;color:${BODY};margin-top:2mm}
.legend span span{margin-right:2mm}
.row{display:grid;grid-template-columns:1fr 1fr;gap:12mm;align-items:start}
/* photo band across the foot of a page */
.band{position:absolute;left:0;right:0;bottom:0;height:42mm}
svg.collage{display:block}
.split>svg.collage,.withside>svg.collage,.cover>svg.collage{position:absolute;left:0;top:0}
.page.hasband{padding-bottom:51mm}
.page.hasband .foot{bottom:45mm;border-top:0;padding-top:0}
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
.photo .by{position:absolute;left:16mm;right:16mm;bottom:9mm;display:flex;justify-content:space-between;font-size:8pt;font-weight:500;color:rgba(255,255,255,.85);border-top:.5pt solid rgba(255,255,255,.5);padding-top:1.9mm}
.photo.top .title{top:30mm;bottom:auto}
.photo.cover .title{top:28mm;bottom:auto}
.photo.right .title{text-align:right}
.photo.right .title .kicker{justify-content:flex-end}
.photo.right .title h2,.photo.right .title p.sub{margin-left:auto}
.photo.dark .bar,.photo.dark .title,.photo.dark .title .n,.photo.dark .title h2,.photo.dark .title p.sub,.photo.dark .by{color:${INK}}
.photo.dark .bar{border-bottom-color:rgba(18,18,18,.6)}.photo.dark .bar span,.photo.dark .title .kicker{color:${BODY}}
.photo.dark .by{color:${BODY};border-top-color:rgba(18,18,18,.4)}
/* split opener: photo left, title on paper right */
.split .bar{position:absolute;left:156mm;right:16mm;top:13mm;margin:0}
.split .title{position:absolute;left:156mm;right:16mm;bottom:24mm}
.split .title .n{font-family:"DM Sans";font-weight:700;font-size:20pt;letter-spacing:-.02em;margin:0 0 3mm}
.split .title h2{font-size:44pt;line-height:.94;letter-spacing:-.04em;margin:0}
.split .title p.sub{font-family:"DM Sans";font-weight:500;font-size:14pt;letter-spacing:-.01em;margin:4mm 0 0;line-height:1.25}
.split .foot{left:156mm}
/* intro */
.cols{display:grid;grid-template-columns:1fr 92mm;gap:16mm;align-items:start}
.intro .big{font-family:"DM Sans";font-weight:500;font-size:17pt;line-height:1.24;letter-spacing:-.02em;color:${INK};margin:0 0 6mm}
.small{font-size:9pt;color:${BODY}}
.inside li{font-size:9.4pt;margin-bottom:2.4mm;padding-left:0;display:flex;gap:3mm}
.inside li:before{display:none}
.inside .i{font-family:"DM Sans";font-weight:700;color:${SOFT};flex:none;width:8mm}
/* side photo layout: photo full bleed on the left, content on the right */
.withside{padding-left:150mm}
.withside .bar{margin-left:0}
.withside .foot{left:166mm}
.withside>p,.withside>.lead,.withside>ul,.withside>.callout{max-width:none}
/* tiles */
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:0 7mm;margin-top:2mm}
.tile .ph{position:relative;height:47mm;background-size:cover;background-position:center;border-radius:2.5mm;overflow:hidden}
.tile .ph .ic{position:absolute;left:0;bottom:0;width:15mm;height:15mm;display:flex;align-items:center;justify-content:center;border-top-right-radius:2.5mm}
.tile .ph .ic svg{width:8.6mm;height:8.6mm}
.tile h3{margin:3.5mm 0 0;font-size:17pt;letter-spacing:-.025em;line-height:1}
.tile .tx{padding-top:1mm}
.tile .tx p{font-size:9.2pt;line-height:1.42;margin:0 0 1.5mm}
.tile .tx p.k{font-size:8pt;font-weight:500;line-height:1.3;color:${GREY};margin:1.4mm 0 .6mm}
/* cards */
.sys{margin:0 0 7mm}
.syshead{display:grid;grid-template-columns:84mm 1fr;gap:8mm;align-items:end;border-bottom:.5pt solid ${INK};padding-bottom:2.2mm;margin-bottom:3.5mm}
.syshead h3{font-size:19pt;margin:0;white-space:nowrap}
.syshead p{margin:0;font-size:9.4pt;color:${BODY}}
.cards{display:grid;gap:6mm}
.cards.n4{grid-template-columns:repeat(4,1fr)}
.cards.n5{grid-template-columns:repeat(5,1fr)}
.card{border-top:1.2pt solid ${INK};padding-top:2.5mm;min-width:0}
.card .fig{display:block;font-family:"DM Sans";font-weight:700;font-size:24pt;letter-spacing:-.035em;line-height:1;margin-bottom:1.8mm;white-space:nowrap}
.card .lab{display:block;font-size:8.6pt;color:${INK};font-weight:600;margin-bottom:1.05mm;line-height:1.3}
.card p{font-size:8.8pt;line-height:1.4;color:${BODY};margin:0}
/* protocols: two per page, side by side */
.row.pair{gap:14mm}
.row.trio{grid-template-columns:1fr 1fr 1fr;gap:10mm}
.row.trio .psteps li{grid-template-columns:6mm 24mm 1fr;gap:2.5mm}
.row.trio .psteps .t{font-size:12pt}
.row.trio .proto h3{font-size:17pt}
.proto{border-top:1.2pt solid ${INK};padding-top:3.5mm}
.proto h3{font-size:19pt;letter-spacing:-.025em;line-height:1.05;margin:0 0 2.5mm}
.proto .when,.proto .care{font-size:8.8pt;line-height:1.42;color:${BODY};margin:0 0 3mm}
.proto .care{margin:3mm 0 0}
.proto .when span,.proto .care span{display:block;font-size:8pt;font-weight:500;line-height:1.3;color:${GREY};margin-bottom:.5mm}
.psteps{list-style:none;margin:0;padding:0}
.psteps li{display:grid;grid-template-columns:7mm 28mm 1fr;gap:3mm;align-items:start;padding:2.2mm 0;border-bottom:.5pt solid ${RULE}}
.psteps li:before{display:none}
.psteps .i{font-family:"DM Sans";font-weight:700;font-size:9pt;color:${SOFT};padding-top:1.2mm}
.psteps .t{font-family:"DM Sans";font-weight:700;font-size:13pt;letter-spacing:-.03em;line-height:1.05;white-space:nowrap}
.psteps p{margin:0;font-size:9pt;line-height:1.42}
/* scenarios: two per page, side by side */
.scen{border-top:1.2pt solid ${INK};padding-top:3.5mm}
.scen h3{font-size:20pt;letter-spacing:-.03em;line-height:1.04;margin:0 0 2.4mm}
.scen .read{font-family:"DM Sans";font-weight:500;font-size:11.5pt;line-height:1.3;letter-spacing:-.005em;margin:0 0 3mm}
.scen .read span{display:block;font-family:Inter;font-weight:500;font-size:8pt;letter-spacing:0;line-height:1.3;color:${GREY};margin-bottom:.6mm}
.acts .k{font-size:8.4pt;line-height:1.3;color:${INK};font-weight:600;border-bottom:.5pt solid ${INK};padding-bottom:.8mm;margin:0 0 1.4mm}
.acts>div{margin-bottom:3mm}
.acts ul{margin-bottom:0}
.acts li{font-size:9.2pt;line-height:1.36;margin-bottom:1.1mm}
.acts ul.skip li:before{background:${SOFT}}
/* scorecard */
.score{margin:3mm 0 5mm}
.srow{display:grid;grid-template-columns:1fr 72mm;gap:8mm;align-items:center;border-top:.5pt solid ${INK};padding:1.9mm 0}
.srow h4{font-size:13pt;letter-spacing:-.02em;margin-bottom:.5mm}
.srow p{margin:0;color:${BODY}}
.boxes{display:flex;gap:2.5mm;justify-content:flex-end}
.box{width:10mm;height:10mm;border-radius:1.6mm;border:.6pt solid ${INK};display:flex;align-items:center;justify-content:center;font-family:"DM Sans";font-weight:500;font-size:11pt;color:${GREY}}
.scale{display:flex;justify-content:space-between;font-size:8.2pt;font-weight:500;color:${GREY};border-top:.5pt solid ${INK};padding-top:1.9mm}
/* week */
.week{display:grid;grid-template-columns:repeat(7,1fr);gap:4mm;margin:2mm 0 3mm}
.day{border-top:1.2pt solid ${INK};padding-top:2.5mm;min-height:36mm}
.day h4{font-size:10pt;line-height:1.3;margin-bottom:2.9mm}
.day p{font-size:8.2pt;line-height:1.38;margin:0 0 2mm}
.day .work{font-family:"DM Sans";font-weight:700;font-size:11pt;line-height:1.15;letter-spacing:-.01em;margin-bottom:3mm;min-height:10mm}
.day .rec{color:${BODY}}
.day .rec:before{content:"";display:block;width:2mm;height:2mm;border-radius:50%;background:${INK};margin-bottom:1.6mm}
/* back page */
.url{font-family:"DM Sans";font-weight:700;font-size:22pt;letter-spacing:-.03em;color:${INK};margin:0}
/* cover */
.cover{padding:0}
.cover .txt{position:absolute;left:14mm;top:13mm;width:86mm;bottom:9mm;color:${P_LIGHT}}
.cover .bar{border-bottom-color:rgba(241,234,221,.35);margin:0}
.cover .bar b{color:${P_LIGHT}}
.cover .title{position:absolute;left:0;right:0;top:52mm}
.cover .title .kicker{color:rgba(241,234,221,.72)}
.cover .title h1{font-family:"DM Sans";font-weight:700;font-size:47pt;line-height:.94;letter-spacing:-.04em;margin:0;color:${P_LIGHT}}
.cover .title p.sub{font-family:"DM Sans";font-weight:500;font-size:14.5pt;letter-spacing:-.01em;margin:5mm 0 0;color:${P_LIGHT};line-height:1.25}
.cover .by{position:absolute;left:0;right:0;bottom:0;font-size:8pt;font-weight:500;color:rgba(241,234,221,.72);border-top:.5pt solid rgba(241,234,221,.35);padding-top:1.9mm}
`;

const pages: string[] = [];
let n = 1;
const foot = () => `<div class="foot"><span>${esc(G.title)}</span><span>${esc(G.author)}</span><span>${String(n).padStart(2, "0")}</span></div>`;
const bar = `<div class="bar"><b>Marin Lazic</b><span>${esc(G.title)}</span></div>`;
const push = (html: string) => {
  pages.push(html);
  n++;
};

// Cover: the title on ink, the surf photograph, the rest curve and a block of graph paper.
push(`<section class="page cover">${collage(297, 210, [
  { k: "color", x: 0, y: 0, w: 112, h: 210, fill: P_DARK },
  { k: "photo", x: 112, y: 0, w: 185, h: 126, p: G.cover },
  { k: "color", x: 112, y: 126, w: 117, h: 84, fill: BUTTER, draw: "curve", size: 76 },
  { k: "graph", x: 229, y: 126, w: 68, h: 84 },
])}
  <div class="txt"><div class="bar"><b>Marin Lazic</b></div>
    <div class="title"><p class="kicker">Free guide, by ${esc(G.author)}</p><h1>The Recovery<br>Guide</h1><p class="sub">${esc(G.subtitle)}</p></div>
    <div class="by"><span>${esc(G.edition)}</span></div></div>
</section>`);

// Intro
push(`<section class="page intro hasband">${bar}
  <p class="kicker">Before you start</p>
  <h2>Why the same recovery<br>for everything does not work</h2>
  <div class="cols">
    <div><p class="big">${esc(G.promise)}</p><p class="small">${esc(G.authorLine)}</p></div>
    <div><p class="kicker">What is inside</p><ul class="inside">${G.whatsInside.map((i, k) => `<li><span class="i">${String(k + 1).padStart(2, "0")}</span><span>${esc(i)}</span></li>`).join("")}</ul></div>
  </div>
  <div class="band">${collage(297, 42, [{ k: "graph", x: 0, y: 0, w: 96, h: 42 }, { k: "color", x: 96, y: 0, w: 44, h: 42, fill: MINT }, { k: "dot", x: 140, y: 0, w: 113, h: 42 }, { k: "color", x: 253, y: 0, w: 44, h: 42, fill: CLAY }])}</div>
  ${foot()}
</section>`);

function sectionPages(s: GuideSection) {
  if (s.opener) {
    push(`<section class="page split">${bar}${sectionPicture(s.number, s.opener, 148, s.openerStyle?.pos)}
      <div class="title"><p class="n">${s.number}</p><h2>${esc(s.title)}</h2><p class="sub">${esc(s.kicker)}</p></div>
      ${foot()}
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
    const withSide = Boolean(s.side && i === 0);
    // A section with no opener carries its drawing here. One with an opener gets the photograph and flat blocks.
    const side = !withSide
      ? ""
      : s.opener
        ? collage(134, 210, [{ k: "photo", x: 0, y: 0, w: 134, h: 152, p: s.side! }, { k: "color", x: 0, y: 152, w: 80, h: 58, fill: PIC[s.number].second }, { k: "dot", x: 80, y: 152, w: 54, h: 58 }])
        : sectionPicture(s.number, s.side!, 134);
    const hasBand = blocks.some(b => b.type === "band");
    push(`<section class="page${withSide ? " withside" : ""}${hasBand ? " hasband" : ""}">${side}${bar}${head}${body}${foot()}</section>`);
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
