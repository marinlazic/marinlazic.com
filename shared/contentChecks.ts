/**
 * The style guide's mechanical rules, shared by the dashboard (server/studio.ts)
 * and the command line checker (.claude/skills/content/check.mjs). Both read
 * the same rules.json so a word banned in one place is banned in the other.
 */
import rules from "../.claude/skills/content/rules.json";

export type CheckHit = { line: number; message: string };

const BANNED: string[] = rules.banned;
const US: [string, string][] = rules.usSpelling as [string, string][];
const ADVERB = new RegExp(`\\b(${rules.fillerAdverbs.join("|")})\\b`, "i");
const EMOJI = new RegExp("[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{1F900}-\\u{1F9FF}]", "u");
const EMOJI_ALL = new RegExp(EMOJI.source, "gu");

/**
 * Fixes the model can be trusted to have got wrong in a mechanical way: dashes,
 * exclamation marks, emoji, hashtags, stray double spaces. Words are left to
 * the person, because a replacement word changes meaning.
 */
export function autoFix(text: string): string {
  return text
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/ -- /g, ", ")
    .replace(/!+/g, ".")
    .replace(EMOJI_ALL, "")
    .replace(/(^|\s)#(?![0-9A-Fa-f]{6}\b)([A-Za-z]\w*)/g, "$1$2")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ ,/g, ",")
    .replace(/,\s*\./g, ".");
}

/** Everything the style guide forbids that is still in the text. */
export function checkText(text: string): CheckHit[] {
  const hits: CheckHit[] = [];
  const lines = text.split("\n");
  let inFence = false;
  lines.forEach((line, i) => {
    const n = i + 1;
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    if (/[—–]/.test(line)) hits.push({ line: n, message: "dash (em or en). Use a comma, full stop or colon." });
    if (/ -- /.test(line)) hits.push({ line: n, message: "double hyphen used as a dash." });
    if (/!/.test(line) && !/\[MARIN/.test(line)) hits.push({ line: n, message: "exclamation mark." });
    if (EMOJI.test(line)) hits.push({ line: n, message: "emoji." });
    if (/(^|\s)#[A-Za-z]/.test(line) && !/^#{1,6} /.test(line) && !/#[0-9A-Fa-f]{6}\b/.test(line)) hits.push({ line: n, message: "hashtag." });
    if (/\b\d+\s?-\s?\d+\b/.test(line) && !/\d{4}-\d{2}-\d{2}/.test(line) && !/\d+ by \d+/.test(line)) hits.push({ line: n, message: "number range with a hyphen. Write 4 to 8." });
    for (const b of BANNED) {
      const re = new RegExp(`\\b${b}\\b`, "i");
      const m = line.match(re);
      if (m) hits.push({ line: n, message: `banned: "${m[0]}"` });
    }
    for (const [us, au] of US) {
      const m = line.match(new RegExp(`\\b${us}\\b`, "i"));
      if (m) hits.push({ line: n, message: `US spelling "${m[0]}". Use "${au}".` });
    }
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      const words = h[1].split(/\s+/).filter(w => /^[A-Za-z]/.test(w));
      const caps = words.filter(w => /^[A-Z]/.test(w)).length;
      if (words.length >= 3 && caps >= 3 && caps / words.length > 0.6) hits.push({ line: n, message: "heading looks like Title Case. Use sentence case." });
    }
    const a = line.match(ADVERB);
    if (a) hits.push({ line: n, message: `filler adverb "${a[0]}".` });
  });
  return hits;
}
