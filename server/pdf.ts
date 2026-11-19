import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "node:fs";
import {
  QUESTIONS,
  calculateScores as calculateSharedScores,
  getResponseLabel,
  getScoreLabel,
  isQuestionShown,
  type CategoryScore,
} from "@shared/assessment";

// On Vercel (and any Lambda style host) use the bundled headless Chromium.
// Elsewhere use a local Chromium binary.
async function launchBrowser() {
  const serverless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (serverless) {
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/opt/pw-browsers/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter((p): p is string => Boolean(p));
  const executablePath = candidates.find(p => fs.existsSync(p));
  if (!executablePath) {
    throw new Error("No Chromium found. Set PUPPETEER_EXECUTABLE_PATH.");
  }
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });
}

// ─── Score Calculation ─────────────────────────────────
// One shared scoring function (shared/assessment.ts) so the PDF, the screen
// and Kit all show the same numbers.

function calculateScores(answers: Record<string, unknown>): {
  categories: CategoryScore[];
  overallPct: number;
} {
  const { categories, overallPct } = calculateSharedScores(answers);
  return { categories, overallPct };
}

// The dot colour for a score, the same one the results page shows.
function getScoreColour(pct: number): string {
  return getResponseLabel(pct).color;
}

// ─── Brief coaching summaries per category based on score ───
function getCategorySummary(id: string, pct: number): string {
  const summaries: Record<string, Record<string, string>> = {
    sleep: {
      high: "Your answers describe sleep habits that are working for you.",
      mid: "Choose one sleep habit to make more consistent this week.",
      low: "Start with one practical sleep habit that fits your current routine.",
    },
    stress: {
      high: "Your answers describe regular stress management habits.",
      mid: "There is room to make a simple management routine more regular.",
      low: "Create a little more space for rest, support, or a calming routine.",
    },
    training: {
      high: "Structured sessions are a useful base. Keep reviewing what feels sustainable.",
      mid: "A clearer plan can make sessions easier to repeat.",
      low: "Start with a simple training routine that fits your week.",
    },
    injuries: {
      high: "No current issue was selected. Continue to adjust activity to your comfort.",
      mid: "Consider adjusting activity around your comfort and seeking qualified advice when needed.",
      low: "Choose comfortable activity modifications and consider qualified guidance.",
    },
    nutrition: {
      high: "Your answers describe nutrition habits you feel are working for you.",
      mid: "Use regular meals and snacks that suit your schedule and preferences.",
      low: "Start with one small food planning habit that is workable this week.",
    },
    recovery: {
      high: "Your answers describe several rest and recovery habits.",
      mid: "Choose one check in habit to notice what supports you.",
      low: "Start with a small, sustainable rest or mobility habit.",
    },
  };
  let level = pct >= 60 ? "high" : pct >= 50 ? "mid" : "low";
  // "No current issue was selected" is only true at a full score.
  if (id === "injuries" && level === "high" && pct < 100) level = "mid";
  return summaries[id]?.[level] || "Questionnaire complete.";
}

// ─── Individual, non-clinical coaching prompts based on answers ───────────
function getSolutions(answers: Record<string, unknown>): Record<string, string[]> {
  const solutions: Record<string, string[]> = {
    sleep: [],
    stress: [],
    training: [],
    injuries: [],
    nutrition: [],
    recovery: [],
  };

  // Sleep
  const sleepHours = answers["sleep-hours"] as string;
  const sleepQuality = answers["sleep-quality"] as string;
  const sleepRoutine = answers["sleep-routine"] as string;
  if (sleepHours === "under-5" || sleepHours === "5-6") {
    solutions.sleep.push("Experiment with adding 30 minutes to your sleep opportunity when practical.");
    solutions.sleep.push("Set a wind down reminder 30 minutes before your preferred bedtime.");
  } else if (sleepHours === "6-7") {
    solutions.sleep.push("Experiment with adding 30 minutes to your sleep opportunity when practical.");
  }
  if (sleepQuality === "terrible" || sleepQuality === "poor" || sleepQuality === "average") {
    solutions.sleep.push("Try reducing late night screen use or using a comfortable sleep mask if it suits you.");
  }
  if (sleepRoutine === "none" || sleepRoutine === "sometimes" || sleepRoutine === "inconsistent") {
    solutions.sleep.push("Choose a consistent wind down and wake time range that fits your schedule.");
  }
  if (solutions.sleep.length === 0) {
    solutions.sleep.push("Your answers describe a solid sleep routine. Continue the habits you find helpful.");
    solutions.sleep.push("Notice which evening and morning routines feel most sustainable for you.");
  }

  // Stress
  const stressLevel = answers["stress-level"] as string;
  const stressMgmt = answers["stress-management"] as string;
  if (stressLevel === "daily" || stressLevel === "most-days") {
    solutions.stress.push("Try a five minute breathing pause or quiet walk when it feels useful.");
    solutions.stress.push("Set aside a short phone free break when your schedule allows.");
  } else if (stressLevel === "few-times") {
    solutions.stress.push("Experiment with a calming activity you enjoy, such as an easy walk, journaling, or music.");
  }
  if (stressMgmt === "none" || stressMgmt === "aware" || stressMgmt === "reactive") {
    solutions.stress.push("Pick one brief reflection, breathing, or planning practice to try this week.");
  }
  if (solutions.stress.length === 0) {
    solutions.stress.push("Your answers describe regular stress management habits. Keep the routines that feel supportive.");
  }

  // Training
  const trainingFreq = answers["training-frequency"] as string;
  const trainingStructure = answers["training-structure"] as string;
  const trainingType = answers["training-type"];
  const trainingTypes = Array.isArray(trainingType) ? (trainingType as string[]) : [];
  // The lists below name the quiz's current answer values and the older ones,
  // so reports rebuilt from old answers still read correctly.
  if (trainingFreq === "none" || trainingFreq === "1-2" || trainingFreq === "0-1" || trainingFreq === "2") {
    solutions.training.push("Consider a simple weekly training plan based on your goals, experience, and available time.");
  }
  if (trainingStructure === "loose" || trainingStructure === "none" || trainingStructure === "random") {
    solutions.training.push("Track sessions in a way that helps you notice what feels sustainable.");
    solutions.training.push("Plan easier sessions alongside more demanding ones when useful.");
  }
  if (
    (typeof trainingType === "string" && !trainingType.includes("strength") && trainingType !== "programmed") ||
    (trainingTypes.length > 0 && !trainingTypes.includes("strength"))
  ) {
    solutions.training.push("Consider whether adding resistance work appeals to you, adjusted to your experience and preferences.");
  }
  if (solutions.training.length === 0) {
    solutions.training.push("Your answers describe regular training. Keep reviewing what feels sustainable.");
  }

  // Injuries and physical comfort
  const injuries = answers["current-injuries"] as string;
  const injuryDetail = answers["injury-detail"] as string;
  if (injuries === "major" || injuries === "moderate" || injuries === "significant" || injuries === "multiple") {
    solutions.injuries.push("Consider speaking with a qualified clinician or sports physio about individual guidance, especially if symptoms persist.");
    solutions.injuries.push("Modify or pause movements that feel painful, and work within your comfort.");
    if (injuryDetail?.trim()) {
      solutions.injuries.push("Bring the area you described to a qualified clinician or sports physio for individual guidance.");
    }
  } else if (injuries === "minor") {
    solutions.injuries.push("Use comfortable ranges of motion and adjust training if something feels painful.");
    solutions.injuries.push("Consider gentle mobility in your warm up if it feels good for you.");
  } else {
    solutions.injuries.push("No current injury was selected. Continue using warm ups and adjust training to your comfort.");
    solutions.injuries.push("Choose mobility work that feels comfortable and fits your routine.");
  }

  // Nutrition
  const nutritionQuality = answers["nutrition-quality"] as string;
  const energyLevel = answers["energy-level"] as string;
  const hydrationLevel = answers["hydration"] as string;
  if (nutritionQuality === "terrible" || nutritionQuality === "poor" || nutritionQuality === "inconsistent" || nutritionQuality === "average") {
    solutions.nutrition.push("Choose one meal each week to plan around a protein source you enjoy.");
    solutions.nutrition.push("Prepare a few familiar meals or snacks in advance when it reduces friction.");
    solutions.nutrition.push("Use a simple shopping list built around foods you enjoy.");
  }
  if (["crashed", "low", "average", "zombie", "caffeine", "dip"].includes(energyLevel)) {
    solutions.nutrition.push("Notice when energy dips and record meal timing, sleep, workload, or other context without assuming a cause.");
  }
  if (["poor", "low", "moderate", "under-1", "1-2"].includes(hydrationLevel)) {
    solutions.nutrition.push("Keep water available and drink to thirst, adjusting for activity, weather, and clinician guidance where relevant.");
  }
  if (solutions.nutrition.length === 0) {
    solutions.nutrition.push("Your answers describe nutrition habits that work for you. Continue choosing routines that suit your schedule.");
  }

  // Recovery
  const recoveryPractice = (answers["recovery-practice"] as string) || (answers["recovery-practices"] as string);
  const hasWhoop = answers["has-whoop"] as string;
  if (["none", "basic", "occasional", "some", "reactive"].includes(recoveryPractice)) {
    solutions.recovery.push("Choose one recovery routine you enjoy, such as an easy walk, gentle mobility, or a quieter evening.");
    solutions.recovery.push("Build in a short mobility or stretching break on days it feels useful.");
    solutions.recovery.push("Plan a rest day or lighter session when that fits your training and energy.");
  }
  if (hasWhoop === "no") {
    solutions.recovery.push("Optional: a wearable such as WHOOP, Oura, or Apple Watch can help you log patterns, but its readings do not predict health outcomes.");
  }
  if (solutions.recovery.length === 0) {
    solutions.recovery.push("Your answers describe several recovery habits. Keep what feels sustainable and review your routine over time.");
  }

  return solutions;
}

// ─── Site look ─────────────────────────────────────────
// The report uses the same colours, type and parts as marinlazic.com
// (client/src/index.css): ivory paper, ink type, oat cards, hairlines, and the
// signal colour as the one mark that points at the lowest area.
const PAPER = "#FAF9F5";
const INK = "#141413";
const BODY = "#3D3D3A";
const MUTE = "#5E5D59";
const OAT = "#F0EEE6";
const STONE = "#E6E3DA";
const LINE = "#DDDBD0";
const SIGNAL = "#FF5A36";

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const HEADING_STEM: Record<string, string> = {
  sleep: "Sleep",
  stress: "Stress",
  training: "Training",
  injuries: "Injur",
  nutrition: "Nutrition",
  recovery: "Recovery",
};

/** Cuts text at the end of a sentence where it can, never part way through a word. */
function trimToSentence(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  if (end > max * 0.5) return cut.slice(0, end + 1);
  return cut.slice(0, cut.lastIndexOf(" ")) + "...";
}

/** The area the report points at first. The lowest score, the same pick as the results page. */
function lowestArea(categories: CategoryScore[]): CategoryScore | undefined {
  return [...categories].sort((a, b) => b.percentage - a.percentage)[categories.length - 1];
}

// ─── Build SVG Radar Chart ────────────────────────────
// Same drawing as the sample report on the home page (SampleRadar in
// client/src/components/site/graphics.tsx): ink shape, one signal dot on the
// lowest area.
function buildRadarSvg(categories: CategoryScore[]): string {
  const cx = 170, cy = 150, R = 100;
  const n = categories.length || 1;
  const pt = (i: number, r: number): [number, number] => {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const f1 = (v: number) => v.toFixed(1);
  const ring = (f: number) => categories.map((_, i) => pt(i, R * f).map(f1).join(",")).join(" ");
  const pts = categories.map((c, i) => pt(i, (R * c.percentage) / 100));
  const low = lowestArea(categories)?.id;

  const rings = [0.25, 0.5, 0.75, 1]
    .map(f => `<polygon points="${ring(f)}" fill="none" stroke="${f < 1 ? LINE : "#C9C6BA"}" stroke-width="1"/>`)
    .join("");

  const spokes = categories
    .map((c, i) => {
      const [ex, ey] = pt(i, R);
      const [lx, ly] = pt(i, R + 16);
      const side = Math.abs(lx - cx) < 8 ? "middle" : lx > cx ? "start" : "end";
      // Long names sit on two lines at the sides so nothing is cut off.
      const words = c.name.split(" ");
      const lines =
        side !== "middle" && words.length > 1
          ? c.name.includes("&")
            ? [c.name.slice(0, c.name.indexOf("&") + 1), c.name.slice(c.name.indexOf("&") + 2)]
            : [words[0], words.slice(1).join(" ")]
          : [c.name];
      const top = side === "middle" ? (ly < cy ? ly - 2 : ly + 12) : ly + 4 - (lines.length - 1) * 7;
      const text = lines
        .map(
          (ln, k) =>
            `<text x="${f1(lx)}" y="${f1(top + k * 14)}" text-anchor="${side}" font-family="Inter, sans-serif" font-size="12" font-weight="500" fill="${INK}">${esc(ln)}</text>`,
        )
        .join("");
      return `<line x1="${cx}" y1="${cy}" x2="${f1(ex)}" y2="${f1(ey)}" stroke="${LINE}" stroke-width="1"/>${text}`;
    })
    .join("");

  const dots = pts
    .map(([a, b], i) => {
      const isLow = categories[i].id === low;
      return `<circle cx="${f1(a)}" cy="${f1(b)}" r="${isLow ? 6 : 4}" fill="${isLow ? SIGNAL : INK}"/>`;
    })
    .join("");

  return `<svg class="radar" viewBox="0 0 340 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Radar chart of your six area scores">
    ${rings}
    ${spokes}
    <polygon points="${pts.map(p => p.map(f1).join(",")).join(" ")}" fill="rgba(20,20,19,0.08)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots}
  </svg>`;
}

// The score ring from the top of the results page.
function buildRingSvg(pct: number, colour: string): string {
  const c = 2 * Math.PI * 85;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="transform:rotate(-90deg)">
    <circle cx="100" cy="100" r="85" fill="none" stroke="${STONE}" stroke-width="12"/>
    <circle cx="100" cy="100" r="85" fill="none" stroke="${colour}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - Math.max(0, Math.min(100, pct)) / 100)).toFixed(1)}"/>
  </svg>`;
}

// ─── Build HTML Template ──────────────────────────────
function buildPdfHtml(params: {
  name: string;
  analysis: string;
  answers: Record<string, unknown>;
  categories: CategoryScore[];
  overallPct: number;
  overallLabel: string;
  overallColour: string;
  solutions: Record<string, string[]>;
}): string {
  const { name, analysis, answers, categories, overallPct, solutions } = params;
  // "Your Results" is what the callers pass when no name was given.
  const hasName = Boolean(name.trim()) && name.trim() !== "Your Results";
  const safeName = hasName ? esc(name.trim()) : "";
  const firstName = hasName ? esc(name.trim().split(" ")[0]) : "";
  const initials = name.split(" ").map(w => w[0]?.toUpperCase() || "").join("").replace(/[^A-Z]/g, "");
  const dateStr = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, "").slice(2);
  const reportId = `ML-PRF-${dateCode}-${initials}`;
  const questionCount = QUESTIONS.filter(q => isQuestionShown(q, answers)).length;
  const overall = getResponseLabel(overallPct);

  const scope = `<p class="scope"><strong>Scope.</strong> This questionnaire coaching score reflects self reported answers. It is not medical advice or a diagnosis. Scores and bands are illustrative coaching references, not founder cohort comparisons or clinically validated measures. Speak with a qualified clinician about persistent fatigue, pain, or sleep problems.</p>`;
  const footer = (page: number) => `<div class="foot"><span>marinlazic.com</span><span>Report ${reportId}</span><span>Page ${page} of 4</span></div>`;
  const nav = `<div class="nav"><span class="wordmark">Marin Lazic</span><span>Performance Assessment</span></div>`;
  const label = (left: string, right: string) => `<div class="label"><span>${left}</span><span>${right}</span></div>`;
  const chip = (pct: number) => {
    const l = getResponseLabel(pct);
    return `<span class="chip"><i style="background:${l.color}"></i>${l.label}</span>`;
  };

  const sorted = [...categories].sort((a, b) => b.percentage - a.percentage);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const barColour = (cat: CategoryScore) => (cat.id === weakest?.id ? SIGNAL : INK);

  const radarSvg = buildRadarSvg(categories);

  // Category scores, drawn like the sample report on the home page.
  const domainBarsHtml = categories.map((cat) => {
    return `<div class="domain-bar-row">
      <div class="domain-bar-line">
        <span class="domain-bar-name">${esc(cat.name)}</span>
        <span class="domain-bar-track"><span class="domain-bar-fill" style="width:${cat.percentage}%;background:${barColour(cat)}"></span></span>
        <span class="domain-bar-score">${cat.percentage}</span>
      </div>
      <div class="domain-bar-note">${getCategorySummary(cat.id, cat.percentage)}</div>
    </div>`;
  }).join("");

  // Action plan cards, two across.
  const protocolCardsHtml = categories.map((cat, i) => {
    const catSolutions = solutions[cat.id] || [];
    const checks = catSolutions.slice(0, 3).map(s => `<div class="check"><span class="box"></span><span>${s}</span></div>`).join("");
    return `<div class="card proto-card">
      <div class="meta"><span class="tag">0${i + 1}</span>${chip(cat.percentage)}</div>
      <div class="proto-head">
        <h3>${esc(cat.name)}</h3>
        <span class="proto-score">${cat.percentage}<small>/100</small></span>
      </div>
      <span class="domain-bar-track"><span class="domain-bar-fill" style="width:${cat.percentage}%;background:${barColour(cat)}"></span></span>
      <div class="checks">${checks}</div>
    </div>`;
  }).join("");

  const tidy = (s: string) =>
    s.replace(/^[-*•]\s*/gm, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/^>\s*/gm, "").replace(/\s+[–—]\s+/g, ", ").replace(/\s*\n+\s*/g, " ").trim();

  // Coach analysis rows: the part of the written analysis that belongs to each area.
  const analysisRowsHtml = categories.map((cat) => {
    // The analysis headings are "Sleep Analysis", "Injury & Health Considerations" and so on,
    // so each area is found by the start of its name.
    const stem = HEADING_STEM[cat.id] ?? cat.name.replace(/[&]/g, ".");
    const regex = new RegExp(`(?:#{1,3}\\s*(?:\\d+\\.?\\s*)?${stem}[^\\n]*\\n)([\\s\\S]*?)(?=\\n#{1,3}\\s|$)`, "i");
    const match = analysis.match(regex);
    const excerpt = trimToSentence(tidy(match ? match[1] : "") || getCategorySummary(cat.id, cat.percentage), 270);
    return `<div class="analysis-row">
      <div class="analysis-name"><span>${esc(cat.name)}</span><span class="analysis-score"${cat.id === weakest?.id ? ` style="color:${SIGNAL}"` : ""}>${cat.percentage}</span></div>
      <div class="analysis-text">${esc(excerpt)}</div>
    </div>`;
  }).join("");

  // Top 5 actions: the first prompt from each area, lowest score first.
  const top5 = [...categories]
    .sort((a, b) => a.percentage - b.percentage)
    .flatMap(cat => (solutions[cat.id] || []).slice(0, 1))
    .slice(0, 5);
  const top5Html = top5.map((move, i) => `<div class="step">
    <div class="step-num">0${i + 1}</div>
    <div class="step-text">${move}</div>
  </div>`).join("");

  // The 30 second read: the first full paragraph of the written analysis.
  const firstPara = analysis.split("\n").find(l => l.trim().length > 50 && !l.startsWith("#") && !l.startsWith("-") && !l.startsWith(">"));
  const thirtySecondRead = esc(
    trimToSentence(
      (firstPara ? tidy(firstPara) : "") ||
        `A driven professional who clearly values performance but the current systems are not matching the ambition.`,
      300,
    ),
  );
  // Page one shows the opening sentence only, never a line cut off part way.
  const opening = trimToSentence(thirtySecondRead, 190);

  const included = [
    "Periodised training program built from your data",
    "Sleep and recovery planning guidance",
    "Nutrition framework aligned to your goals",
    "Weekly coaching and program adjustments",
    "Wearable data analysis (WHOOP, Oura, etc.)",
    "Direct access to your coach",
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${firstName ? `${firstName}'s` : "Your"} performance profile</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    background: ${PAPER};
    color: ${INK};
    font-family: 'Inter', -apple-system, 'Helvetica Neue', Arial, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1, h2, h3, .wordmark, .label, .num { font-family: 'DM Sans', 'Inter', sans-serif; font-weight: 700; }

  .page {
    width: 210mm;
    height: 297mm;
    position: relative;
    overflow: hidden;
    background: ${PAPER};
    padding: 30px 50px 0;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

  /* Top of every page: the wordmark, then the label row the site uses to open a section. */
  .nav { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; font-size: 11px; font-weight: 500; color: ${MUTE}; }
  .wordmark { font-size: 17px; letter-spacing: -0.01em; color: ${INK}; }
  .label { display: flex; justify-content: space-between; gap: 16px; border-top: 1px solid ${LINE}; border-bottom: 1px solid ${LINE}; padding: 10px 0; font-size: 12px; color: ${INK}; }
  .label span:last-child { font-family: 'Inter', sans-serif; font-weight: 500; }

  h1 { font-size: 40px; line-height: 1.06; letter-spacing: -0.025em; }
  h2 { font-size: 31px; line-height: 1.1; letter-spacing: -0.02em; }
  h2.one { font-size: 28px; }
  h3 { font-size: 16px; line-height: 1.22; letter-spacing: -0.01em; }
  .lede { font-size: 13px; line-height: 1.55; color: ${BODY}; }
  .small { font-size: 10.5px; line-height: 1.45; color: ${MUTE}; }
  .heading { margin-top: 28px; }
  .heading .lede { margin-top: 10px; max-width: 560px; }

  .card { background: ${OAT}; border-radius: 12px; padding: 20px 22px; min-width: 0; }
  .meta { display: flex; align-items: center; gap: 9px; font-size: 11px; font-weight: 500; color: ${MUTE}; }
  .tag { display: inline-block; background: ${STONE}; color: ${INK}; border-radius: 6px; padding: 2px 7px; font-size: 10.5px; font-weight: 500; white-space: nowrap; }
  .chip { display: inline-flex; align-items: center; gap: 7px; background: ${OAT}; color: ${INK}; border-radius: 999px; padding: 5px 13px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  .chip i { width: 7px; height: 7px; border-radius: 50%; display: block; flex: none; }
  .card .chip { background: ${PAPER}; padding: 3px 10px; font-size: 10px; }

  /* Bottom of every page */
  .scope { position: absolute; left: 50px; right: 50px; bottom: 46px; border-top: 1px solid ${LINE}; padding-top: 9px; font-size: 9.5px; line-height: 1.45; color: ${MUTE}; }
  .scope strong { color: ${INK}; font-weight: 600; }
  .foot { position: absolute; left: 50px; right: 50px; bottom: 20px; display: flex; justify-content: space-between; font-size: 9.5px; color: ${MUTE}; }

  /* ═══ PAGE 1: PROFILE ═══ */
  .p1 h1 { margin-top: 32px; }
  .hero { display: grid; grid-template-columns: 196px 1fr; gap: 36px; align-items: center; margin-top: 28px; }
  .ring { position: relative; width: 196px; height: 196px; }
  .ring svg { width: 100%; height: 100%; display: block; }
  .ring-in { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .ring-in .num { font-size: 60px; line-height: 1; letter-spacing: -0.03em; }
  .ring-in span:last-child { font-size: 11px; color: ${MUTE}; margin-top: 3px; }
  .hero .chip { margin-bottom: 12px; }
  .hero .opening { font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 18px; line-height: 1.32; letter-spacing: -0.01em; color: ${INK}; }
  .hero .small { margin-top: 10px; max-width: 400px; }
  .hero .small b { color: ${INK}; font-weight: 600; }

  .charts { display: grid; grid-template-columns: 1.12fr 1fr; gap: 14px; margin-top: 32px; }
  .charts .card:first-child { display: flex; flex-direction: column; }
  .radar { display: block; width: 100%; height: auto; margin: auto 0; }
  .charts h3 { font-size: 14px; margin-bottom: 6px; }
  .domain-bar-row { padding: 10px 0 0; }
  .domain-bar-line { display: flex; align-items: center; gap: 10px; font-size: 12.5px; line-height: 1.3; }
  .domain-bar-name { flex: 0 0 124px; color: ${INK}; font-weight: 500; }
  .domain-bar-track { flex: 1; display: block; height: 5px; border-radius: 999px; background: ${LINE}; }
  .domain-bar-fill { display: block; height: 5px; border-radius: 999px; }
  .domain-bar-score { flex: 0 0 22px; text-align: right; font-weight: 600; color: ${INK}; }
  .domain-bar-note { font-size: 10.5px; line-height: 1.42; color: ${MUTE}; margin-top: 3px; }

  .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; margin-top: 30px; border-top: 1px solid ${LINE}; border-bottom: 1px solid ${LINE}; }
  .stat { padding: 15px 16px 16px; border-left: 1px solid ${LINE}; }
  .stat:first-child { border-left: 0; padding-left: 0; }
  .stat .k { display: flex; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 500; color: ${MUTE}; }
  .stat .k i { width: 7px; height: 7px; border-radius: 50%; display: block; }
  .stat .num { font-size: 20px; line-height: 1.15; letter-spacing: -0.015em; margin-top: 5px; }
  .stat .small { margin-top: 3px; }

  /* ═══ PAGE 2: ACTION PLAN ═══ */
  .proto-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 22px; }
  .proto-card { padding: 14px 18px 13px; }
  .proto-card .meta { justify-content: space-between; }
  .proto-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin: 10px 0 8px; }
  .proto-score { font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 22px; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; }
  .proto-score small { font-family: 'Inter', sans-serif; font-size: 10.5px; font-weight: 500; color: ${MUTE}; letter-spacing: 0; margin-left: 2px; }
  .proto-card .domain-bar-track { width: 100%; }
  .checks { margin-top: 10px; border-top: 1px solid ${LINE}; }
  .check { display: flex; align-items: flex-start; gap: 9px; padding: 7px 0; border-bottom: 1px solid ${LINE}; font-size: 11.5px; line-height: 1.4; color: ${INK}; }
  .check:last-child { border-bottom: 0; padding-bottom: 0; }
  .box { flex: none; width: 11px; height: 11px; margin-top: 2px; border: 1.2px solid ${INK}; border-radius: 3px; background: ${PAPER}; }

  /* ═══ PAGE 3: COACH ANALYSIS ═══ */
  .read { margin-top: 20px; padding: 18px 22px; }
  .read p { font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 16px; line-height: 1.38; letter-spacing: -0.01em; color: ${INK}; margin-top: 9px; }
  .analysis { margin-top: 18px; border-bottom: 1px solid ${LINE}; }
  .analysis-row { display: grid; grid-template-columns: 178px 1fr; gap: 22px; padding: 10px 0; border-top: 1px solid ${LINE}; }
  .analysis-name { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-size: 12.5px; font-weight: 600; color: ${INK}; }
  .analysis-score { font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 15px; letter-spacing: -0.01em; }
  .analysis-text { font-size: 12px; line-height: 1.5; color: ${BODY}; }
  .steps-title { display: flex; justify-content: space-between; align-items: baseline; margin-top: 22px; }
  .steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-top: 12px; }
  .step { border-top: 1.5px solid ${INK}; padding-top: 9px; }
  .step-num { font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 19px; letter-spacing: -0.02em; line-height: 1; }
  .step-text { font-size: 11px; line-height: 1.45; color: ${BODY}; margin-top: 7px; }

  /* ═══ PAGE 4: NEXT STEP ═══ */
  .dark { background: ${INK}; color: ${PAPER}; border-radius: 12px; padding: 34px 36px 32px; margin-top: 30px; }
  .dark .k { font-size: 12px; font-weight: 500; color: rgba(250,249,245,0.62); }
  .dark h3 { font-size: 27px; line-height: 1.15; letter-spacing: -0.02em; margin-top: 6px; }
  .incl { display: grid; grid-template-columns: 1fr 1fr; gap: 0 28px; margin-top: 22px; }
  .incl div { display: flex; align-items: flex-start; gap: 10px; padding: 13px 0; border-top: 1px solid rgba(250,249,245,0.16); font-size: 13px; line-height: 1.4; color: rgba(250,249,245,0.86); }
  .incl svg { flex: none; width: 13px; height: 13px; margin-top: 2px; }
  .btn { display: inline-flex; align-items: center; gap: 8px; margin-top: 26px; background: ${PAPER}; color: ${INK}; border-radius: 8px; padding: 15px 24px; font-size: 14px; font-weight: 500; line-height: 1; text-decoration: none; }
  .dark .fine { font-size: 11px; line-height: 1.5; color: rgba(250,249,245,0.62); margin-top: 14px; max-width: 470px; }
  .rows { margin-top: 34px; border-bottom: 1px solid ${LINE}; }
  .rows h3 { margin-bottom: 12px; }
  .row { display: flex; justify-content: space-between; gap: 16px; padding: 13px 0; border-top: 1px solid ${LINE}; font-size: 13px; }
  .row span:first-child { font-weight: 500; }
  .row span:last-child { color: ${MUTE}; text-align: right; }
  .row a { color: inherit; text-decoration: none; }
</style>
</head>
<body>

<!-- ═══ PAGE 1: PROFILE ═══ -->
<div class="page p1">
  ${nav}
  ${label("Your report", dateStr)}

  <h1>${firstName ? `${firstName}'s` : "Your"} performance profile</h1>

  <div class="hero">
    <div class="ring">
      ${buildRingSvg(overallPct, overall.color)}
      <div class="ring-in"><span class="num">${overallPct}</span><span>out of 100</span></div>
    </div>
    <div>
      ${chip(overallPct)}
      <p class="opening">${opening}</p>
      <p class="small"><b>Score context.</b> A self reported coaching reference for reflection and conversation. It does not predict a health outcome or a recovery timeline.</p>
    </div>
  </div>

  <div class="charts">
    <div class="card">
      <div class="meta"><span class="tag">Your report</span><span>Performance radar</span></div>
      ${radarSvg}
    </div>
    <div class="card">
      <h3>Category scores</h3>
      ${domainBarsHtml}
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="k"><i style="background:#16a34a"></i>Strongest area</div>
      <div class="num">${esc(strongest?.name ?? "")}</div>
      <div class="small">${strongest?.percentage ?? 0} out of 100</div>
    </div>
    <div class="stat">
      <div class="k"><i style="background:${SIGNAL}"></i>Biggest opportunity</div>
      <div class="num">${esc(weakest?.name ?? "")}</div>
      <div class="small">${weakest?.percentage ?? 0} out of 100. Start here.</div>
    </div>
    <div class="stat">
      <div class="k">Based on</div>
      <div class="num">${questionCount} questions</div>
      <div class="small">Your own answers${safeName ? `. For ${safeName}` : ""}.</div>
    </div>
  </div>

  ${scope}
  ${footer(1)}
</div>

<!-- ═══ PAGE 2: ACTION PLAN ═══ -->
<div class="page p2">
  ${nav}
  ${label("Action plan", "Based on your answers")}

  <div class="heading">
    <h2 class="one">Six focus areas. Choose what fits your week.</h2>
    <p class="lede">Use these optional prompts to pick small, practical actions. Adapt them to your preferences, your schedule and qualified guidance where relevant.</p>
  </div>

  <div class="proto-grid">
    ${protocolCardsHtml}
  </div>

  ${scope}
  ${footer(2)}
</div>

<!-- ═══ PAGE 3: COACH ANALYSIS ═══ -->
<div class="page p3">
  ${nav}
  ${label("Coach analysis", "By Marin Lazic")}

  <div class="heading">
    <h2 class="one">A closer look at your questionnaire responses.</h2>
  </div>

  <div class="card read">
    <div class="meta"><span class="tag">The 30 second read</span></div>
    <p>${thirtySecondRead}</p>
  </div>

  <div class="analysis">
    ${analysisRowsHtml}
  </div>

  <div class="steps-title">
    <h3>Top 5 actions for the next 30 days</h3>
    <span class="small">Lowest area first</span>
  </div>
  <div class="steps">
    ${top5Html}
  </div>

  ${scope}
  ${footer(3)}
</div>

<!-- ═══ PAGE 4: NEXT STEP ═══ -->
<div class="page p4">
  ${nav}
  ${label("Next step", safeName ? `For ${safeName}` : "1:1 coaching")}

  <div class="heading">
    <h2>Turn insight into your next action.</h2>
    <p class="lede">Use this questionnaire as a starting point for a coaching conversation. Coaching plans are agreed with you and adjusted to your preferences, goals and schedule.</p>
  </div>

  <div class="dark">
    <div class="k">1:1 coaching</div>
    <h3>What coaching with me includes</h3>
    <div class="incl">
      ${included.map(item => `<div><svg viewBox="0 0 16 16" fill="none" stroke="${PAPER}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.6"/><path d="M5.2 8.2l2 2 3.6-4.2"/></svg><span>${item}</span></div>`).join("")}
    </div>
    <a class="btn" href="https://www.marinlazic.com/apply?utm_source=assessment&amp;utm_medium=pdf&amp;utm_campaign=results">Apply for coaching &rarr;</a>
    <p class="fine">Monthly, 3 month minimum. A short application. I read each one myself. Coaching does not diagnose, treat or replace medical, allied health or dietetic care.</p>
  </div>

  <div class="rows">
    <h3>Or pick a smaller step</h3>
    <div class="row"><span>A program you follow on your phone</span><span><a href="https://www.marinlazic.com/library?utm_source=assessment&amp;utm_medium=pdf&amp;utm_campaign=results">marinlazic.com/library</a></span></div>
    <div class="row"><span>The Recovery Guide, free</span><span><a href="https://www.marinlazic.com/recovery-guide?utm_source=assessment&amp;utm_medium=pdf&amp;utm_campaign=results">marinlazic.com/recovery-guide</a></span></div>
    <div class="row"><span>Apply for coaching</span><span><a href="https://www.marinlazic.com/apply?utm_source=assessment&amp;utm_medium=pdf&amp;utm_campaign=results">marinlazic.com/apply</a></span></div>
    <div class="row"><span>Email</span><span><a href="mailto:marin@marinlazic.coach">marin@marinlazic.coach</a></span></div>
  </div>

  ${scope}
  ${footer(4)}
</div>

</body>
</html>`;
}

// ─── Generate Assessment PDF ───────────────────────────
export async function generateAssessmentPDF(params: {
  name: string;
  analysis: string;
  answers: Record<string, unknown>;
}): Promise<Buffer> {
  const { name, analysis, answers } = params;
  const { categories, overallPct } = calculateScores(answers);
  const overallLabel = getScoreLabel(overallPct);
  const overallColour = getScoreColour(overallPct);
  const solutions = getSolutions(answers);

  const html = buildPdfHtml({
    name,
    analysis,
    answers,
    categories,
    overallPct,
    overallLabel,
    overallColour,
    solutions,
  });

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// Export for testing
export { calculateScores, getScoreLabel, getScoreColour, getSolutions, getCategorySummary, buildPdfHtml, buildRadarSvg };
