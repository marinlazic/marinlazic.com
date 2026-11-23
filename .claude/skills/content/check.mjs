// Checks a content folder against the marinlazic.com style guide.
// Usage: node .claude/skills/content/check.mjs content/<folder>
// Prints one line per hit, then OK or the hit count. Exit code 1 on hits.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node check.mjs content/<folder>");
  process.exit(2);
}

const RULES = JSON.parse(readFileSync(new URL("./rules.json", import.meta.url), "utf8"));
const BANNED = RULES.banned;
const US = RULES.usSpelling;
const ADVERB = new RegExp(`\\b(${RULES.fillerAdverbs.join("|")})\\b`, "i");
const LIMITS = {
  "01-linkedin-post.md": { chars: 3000, label: "LinkedIn post body" },
  "06-x-post.md": { perLine: 280, label: "X post" },
};

const files = readdirSync(dir).filter(f => f.endsWith(".md")).sort();
let hits = 0;
const hit = (file, line, msg) => { hits++; console.log(`${file}:${line}: ${msg}`); };

for (const f of files) {
  const text = readFileSync(join(dir, f), "utf8");
  const lines = text.split("\n");
  // Header block and bracketed directions are not content.
  let inFence = false;
  lines.forEach((raw, i) => {
    const n = i + 1;
    if (raw.trim().startsWith("```")) { inFence = !inFence; return; }
    if (inFence) return;
    const line = raw;
    if (/—|–/.test(line)) hit(f, n, "dash (em or en). Use a comma, full stop or colon.");
    if (/ -- /.test(line)) hit(f, n, "double hyphen used as a dash.");
    if (/!/.test(line) && !/\[MARIN/.test(line)) hit(f, n, "exclamation mark.");
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}]/u.test(line)) hit(f, n, "emoji.");
    if (/(^|\s)#[A-Za-z]/.test(line) && !/^#{1,6} /.test(line) && !/#[0-9A-Fa-f]{6}\b/.test(line)) hit(f, n, "hashtag.");
    if (/\b\d+\s?-\s?\d+\b/.test(line) && !/\d{4}-\d{2}-\d{2}/.test(line) && !/\d+ by \d+/.test(line)) hit(f, n, "number range with a hyphen. Write 4 to 8.");
    for (const b of BANNED) {
      const re = new RegExp(`\\b${b}\\b`, "i");
      if (re.test(line)) hit(f, n, `banned: "${line.match(re)[0]}"`);
    }
    for (const [us, au] of US) {
      if (!au) continue;
      const re = new RegExp(`\\b${us}\\b`, "i");
      if (re.test(line)) hit(f, n, `US spelling "${line.match(re)[0]}". Use "${au}".`);
    }
    // Title Case headings: three or more capitalised words in a markdown heading.
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      const words = h[1].split(/\s+/).filter(w => /^[A-Za-z]/.test(w));
      const caps = words.filter(w => /^[A-Z]/.test(w)).length;
      if (words.length >= 3 && caps >= 3 && caps / words.length > 0.6) hit(f, n, "heading looks like Title Case. Use sentence case.");
    }
    if (ADVERB.test(line)) hit(f, n, `filler adverb "${line.match(ADVERB)[0]}".`);
  });

  const lim = LIMITS[f];
  if (lim?.chars) {
    // Body is everything after the first fenced header block.
    const parts = text.split("```");
    const body = parts.length >= 3 ? parts.slice(2).join("```") : text;
    const main = body.split(/\n#+\s*First comment/i)[0].trim();
    if (main.length > lim.chars) hit(f, 0, `${lim.label} is ${main.length} characters, limit ${lim.chars}.`);
  }
  if (lim?.perLine) {
    let inF = false;
    lines.forEach((l, i) => {
      if (l.trim().startsWith("```")) { inF = !inF; return; }
      if (inF || /^#/.test(l) || /^\s*$/.test(l) || /^\(/.test(l)) return;
      if (l.length > lim.perLine) hit(f, i + 1, `${lim.label} line is ${l.length} characters, limit ${lim.perLine}.`);
    });
  }
}

const words = files.map(f => [f, readFileSync(join(dir, f), "utf8").split(/\s+/).filter(Boolean).length]);
console.log("");
for (const [f, w] of words) console.log(`${w.toString().padStart(5)} words  ${f}`);
console.log(hits === 0 ? "\nOK" : `\n${hits} hit${hits === 1 ? "" : "s"}`);
process.exit(hits === 0 ? 0 : 1);
