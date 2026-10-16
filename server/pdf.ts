import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "node:fs";

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

// ─── Score Calculation (mirrors frontend logic) ────────
interface CategoryScore {
  name: string;
  id: string;
  percentage: number;
}

const SCORED_SECTIONS = [
  { id: "sleep", title: "Sleep" },
  { id: "stress", title: "Stress & Mental" },
  { id: "training", title: "Training" },
  { id: "injuries", title: "Injuries & Health" },
  { id: "nutrition", title: "Nutrition & Energy" },
  { id: "recovery", title: "Recovery" },
];

const SCORE_MAP: Record<string, Record<string, number>> = {
  "sleep-hours": { "under-5": 1, "5-6": 2, "6-7": 3, "7-8": 4, "8+": 5 },
  "sleep-quality": { terrible: 1, poor: 2, average: 3, good: 4, excellent: 5 },
  "sleep-routine": { none: 1, sometimes: 2, inconsistent: 3, mostly: 4, "locked-in": 5 },
  "stress-level": { daily: 1, "most-days": 2, "few-times": 3, rarely: 4, never: 5 },
  "stress-management": { none: 1, aware: 2, reactive: 3, regular: 4, daily: 5 },
  "mental-clarity": { fog: 1, scattered: 2, "morning-only": 3, good: 4, sharp: 5 },
  "training-frequency": { none: 1, "1-2": 2, "3-4": 3, "5-6": 4, daily: 5 },
  "training-type": { none: 1, cardio: 2, weights: 3, mixed: 4, programmed: 5 },
  "training-intensity": { low: 1, moderate: 2, mixed: 3, high: 4, periodised: 5 },
  "current-injuries": { major: 1, moderate: 2, minor: 3, past: 4, none: 5 },
  "nutrition-quality": { poor: 1, inconsistent: 2, average: 3, good: 4, dialled: 5 },
  "energy-level": { crashed: 1, low: 2, average: 3, good: 4, high: 5 },
  hydration: { poor: 1, low: 2, moderate: 3, good: 4, excellent: 5 },
  "recovery-practices": { none: 1, basic: 2, some: 3, regular: 4, comprehensive: 5 },
  "recovery-quality": { terrible: 1, poor: 2, average: 3, good: 4, excellent: 5 },
};

const QUESTION_SECTION_MAP: Record<string, string> = {
  "sleep-hours": "sleep",
  "sleep-quality": "sleep",
  "sleep-routine": "sleep",
  "stress-level": "stress",
  "stress-management": "stress",
  "mental-clarity": "stress",
  "training-frequency": "training",
  "training-type": "training",
  "training-intensity": "training",
  "current-injuries": "injuries",
  "nutrition-quality": "nutrition",
  "energy-level": "nutrition",
  hydration: "nutrition",
  "recovery-practices": "recovery",
  "recovery-quality": "recovery",
};

function calculateScores(answers: Record<string, unknown>): {
  categories: CategoryScore[];
  overallPct: number;
} {
  const sectionScores: Record<string, { total: number; max: number }> = {};

  for (const section of SCORED_SECTIONS) {
    sectionScores[section.id] = { total: 0, max: 0 };
  }

  for (const [qId, scoreMap] of Object.entries(SCORE_MAP)) {
    const sectionId = QUESTION_SECTION_MAP[qId];
    if (!sectionId) continue;

    const answerVal = answers[qId] as string | undefined;
    if (answerVal && scoreMap[answerVal] !== undefined) {
      sectionScores[sectionId].total += scoreMap[answerVal];
      sectionScores[sectionId].max += 5;
    }
  }

  const categories: CategoryScore[] = SCORED_SECTIONS.map((s) => ({
    name: s.title,
    id: s.id,
    percentage:
      sectionScores[s.id].max > 0
        ? Math.round((sectionScores[s.id].total / sectionScores[s.id].max) * 100)
        : 0,
  }));

  const totalScore = Object.values(sectionScores).reduce((sum, s) => sum + s.total, 0);
  const totalMax = Object.values(sectionScores).reduce((sum, s) => sum + s.max, 0);
  const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  return { categories, overallPct };
}

function getScoreLabel(pct: number): string {
  if (pct >= 80) return "STRONG HABITS";
  if (pct >= 60) return "STEADY BASE";
  if (pct >= 50) return "FOCUS AREA";
  return "STARTING POINT";
}

function getScoreBand(pct: number): string {
  if (pct >= 80) return "80-100";
  if (pct >= 60) return "60-79";
  if (pct >= 50) return "50-59";
  if (pct >= 40) return "40-49";
  return "0-39";
}

function getScoreColour(pct: number): string {
  if (pct >= 60) return "#4A7C59";
  if (pct >= 50) return "#8B7D3C";
  return "#C8102E";
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
      high: "Your answers describe regular stress-management habits.",
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
      low: "Start with one small food-planning habit that is workable this week.",
    },
    recovery: {
      high: "Your answers describe several rest and recovery habits.",
      mid: "Choose one check-in habit to notice what supports you.",
      low: "Start with a small, sustainable rest or mobility habit.",
    },
  };
  const level = pct >= 60 ? "high" : pct >= 50 ? "mid" : "low";
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
    solutions.sleep.push("Set a wind-down reminder 30 minutes before your preferred bedtime.");
  } else if (sleepHours === "6-7") {
    solutions.sleep.push("Experiment with adding 30 minutes to your sleep opportunity when practical.");
  }
  if (sleepQuality === "terrible" || sleepQuality === "poor" || sleepQuality === "average") {
    solutions.sleep.push("Try reducing late-night screen use or using a comfortable sleep mask if it suits you.");
  }
  if (sleepRoutine === "none" || sleepRoutine === "sometimes" || sleepRoutine === "inconsistent") {
    solutions.sleep.push("Choose a consistent wind-down and wake-time range that fits your schedule.");
  }
  if (solutions.sleep.length === 0) {
    solutions.sleep.push("Your answers describe a solid sleep routine. Continue the habits you find helpful.");
    solutions.sleep.push("Notice which evening and morning routines feel most sustainable for you.");
  }

  // Stress
  const stressLevel = answers["stress-level"] as string;
  const stressMgmt = answers["stress-management"] as string;
  if (stressLevel === "daily" || stressLevel === "most-days") {
    solutions.stress.push("Try a five-minute breathing pause or quiet walk when it feels useful.");
    solutions.stress.push("Set aside a short phone-free break when your schedule allows.");
  } else if (stressLevel === "few-times") {
    solutions.stress.push("Experiment with a calming activity you enjoy, such as an easy walk, journaling, or music.");
  }
  if (stressMgmt === "none" || stressMgmt === "aware" || stressMgmt === "reactive") {
    solutions.stress.push("Pick one brief reflection, breathing, or planning practice to try this week.");
  }
  if (solutions.stress.length === 0) {
    solutions.stress.push("Your answers describe regular stress-management habits. Keep the routines that feel supportive.");
  }

  // Training
  const trainingFreq = answers["training-frequency"] as string;
  const trainingStructure = answers["training-structure"] as string;
  const trainingType = answers["training-type"] as string;
  if (trainingFreq === "none" || trainingFreq === "1-2") {
    solutions.training.push("Consider a simple weekly training plan based on your goals, experience, and available time.");
  }
  if (trainingStructure === "loose" || trainingStructure === "none") {
    solutions.training.push("Track sessions in a way that helps you notice what feels sustainable.");
    solutions.training.push("Plan easier sessions alongside more demanding ones when useful.");
  }
  if (typeof trainingType === "string" && !trainingType.includes("strength") && trainingType !== "programmed") {
    solutions.training.push("Consider whether adding resistance work appeals to you, adjusted to your experience and preferences.");
  }
  if (solutions.training.length === 0) {
    solutions.training.push("Your answers describe regular training. Keep reviewing what feels sustainable.");
  }

  // Injuries and physical comfort
  const injuries = answers["current-injuries"] as string;
  const injuryDetail = answers["injury-detail"] as string;
  if (injuries === "major" || injuries === "moderate") {
    solutions.injuries.push("Consider speaking with a qualified clinician or sports physio about individual guidance, especially if symptoms persist.");
    solutions.injuries.push("Modify or pause movements that feel painful, and work within your comfort.");
    if (injuryDetail?.trim()) {
      solutions.injuries.push("Bring the area you described to a qualified clinician or sports physio for individual guidance.");
    }
  } else if (injuries === "minor") {
    solutions.injuries.push("Use comfortable ranges of motion and adjust training if something feels painful.");
    solutions.injuries.push("Consider gentle mobility in your warm-up if it feels good for you.");
  } else {
    solutions.injuries.push("No current injury was selected. Continue using warm-ups and adjust training to your comfort.");
    solutions.injuries.push("Choose mobility work that feels comfortable and fits your routine.");
  }

  // Nutrition
  const nutritionQuality = answers["nutrition-quality"] as string;
  const energyLevel = answers["energy-level"] as string;
  const hydrationLevel = answers["hydration"] as string;
  if (nutritionQuality === "poor" || nutritionQuality === "inconsistent" || nutritionQuality === "average") {
    solutions.nutrition.push("Choose one meal each week to plan around a protein source you enjoy.");
    solutions.nutrition.push("Prepare a few familiar meals or snacks in advance when it reduces friction.");
    solutions.nutrition.push("Use a simple shopping list built around foods you enjoy.");
  }
  if (energyLevel === "crashed" || energyLevel === "low" || energyLevel === "average") {
    solutions.nutrition.push("Notice when energy dips and record meal timing, sleep, workload, or other context without assuming a cause.");
  }
  if (hydrationLevel === "poor" || hydrationLevel === "low" || hydrationLevel === "moderate") {
    solutions.nutrition.push("Keep water available and drink to thirst, adjusting for activity, weather, and clinician guidance where relevant.");
  }
  if (solutions.nutrition.length === 0) {
    solutions.nutrition.push("Your answers describe nutrition habits that work for you. Continue choosing routines that suit your schedule.");
  }

  // Recovery
  const recoveryPractice = (answers["recovery-practice"] as string) || (answers["recovery-practices"] as string);
  const hasWhoop = answers["has-whoop"] as string;
  if (recoveryPractice === "none" || recoveryPractice === "basic" || recoveryPractice === "occasional" || recoveryPractice === "some") {
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

// ─── Build SVG Radar Chart ────────────────────────────
function buildRadarSvg(categories: CategoryScore[]): string {
  const cx = 140, cy = 140, r = 110;
  const n = categories.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  // Grid rings
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridLines = rings.map((ring) => {
    const points = Array.from({ length: n }, (_, i) => {
      const angle = startAngle + i * angleStep;
      const x = cx + r * ring * Math.cos(angle);
      const y = cy + r * ring * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
    return `<polygon points="${points}" fill="none" stroke="#e0ddd8" stroke-width="0.5"/>`;
  }).join("");

  // Axis lines
  const axes = Array.from({ length: n }, (_, i) => {
    const angle = startAngle + i * angleStep;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e0ddd8" stroke-width="0.5"/>`;
  }).join("");

  // Data polygon
  const dataPoints = categories.map((cat, i) => {
    const angle = startAngle + i * angleStep;
    const val = cat.percentage / 100;
    const x = cx + r * val * Math.cos(angle);
    const y = cy + r * val * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");

  // Data dots
  const dots = categories.map((cat, i) => {
    const angle = startAngle + i * angleStep;
    const val = cat.percentage / 100;
    const x = cx + r * val * Math.cos(angle);
    const y = cy + r * val * Math.sin(angle);
    return `<circle cx="${x}" cy="${y}" r="4" fill="#C8102E"/>`;
  }).join("");

  // Labels
  const labels = categories.map((cat, i) => {
    const angle = startAngle + i * angleStep;
    const labelR = r + 24;
    const x = cx + labelR * Math.cos(angle);
    const y = cy + labelR * Math.sin(angle);
    const anchor = Math.abs(Math.cos(angle)) < 0.1 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
    const dy = Math.sin(angle) > 0.3 ? 12 : Math.sin(angle) < -0.3 ? -4 : 4;
    return `<text x="${x}" y="${y + dy}" text-anchor="${anchor}" font-size="8" font-weight="600" fill="#1a1a1a" font-family="Inter, sans-serif">${cat.name}</text>
            <text x="${x}" y="${y + dy + 11}" text-anchor="${anchor}" font-size="7" fill="#888" font-family="Inter, sans-serif">${cat.percentage}/100</text>`;
  }).join("");

  return `<svg width="280" height="280" viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}
    ${axes}
    <polygon points="${dataPoints}" fill="rgba(200,16,46,0.15)" stroke="#C8102E" stroke-width="1.5"/>
    ${dots}
    ${labels}
  </svg>`;
}

// ─── Build HTML Template (matches reference exactly) ──────
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
  const { name, analysis, categories, overallPct, overallLabel, solutions } = params;
  const firstName = name.split(" ")[0] || "there";
  const initials = name.split(" ").map(w => w[0]?.toUpperCase() || "").join("");
  const dateStr = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
  const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, "").slice(2);
  const reportId = `ML-PRF-${dateCode}-${initials}`;
  const sharedScopeNote = `<div class="shared-scope"><strong>Scope:</strong> This questionnaire coaching score reflects self-reported answers. It is not medical advice or a diagnosis. Scores and bands are illustrative coaching references, not founder cohort comparisons or clinically validated measures. Speak with a qualified clinician about persistent fatigue, pain, or sleep problems.</div>`;

  const sorted = [...categories].sort((a, b) => b.percentage - a.percentage);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  // Build radar SVG
  const radarSvg = buildRadarSvg(categories);

  // Domain bars HTML
  const domainBarsHtml = categories.map((cat) => {
    const colour = getScoreColour(cat.percentage);
    const summary = getCategorySummary(cat.id, cat.percentage);
    return `<div class="domain-bar-row">
      <div class="domain-bar-header">
        <span class="domain-bar-name">${cat.name}</span>
        <span class="domain-bar-score" style="color:${colour}">${cat.percentage}/100</span>
      </div>
      <div class="domain-bar-track">
        <div class="domain-bar-fill" style="width:${cat.percentage}%;background:${colour}"></div>
        <div class="domain-bar-marker" style="left:${cat.percentage}%"></div>
      </div>
      <div class="domain-bar-note">${summary}</div>
    </div>`;
  }).join("");

  // Protocol cards HTML (3x2 grid)
  const protocolCardsHtml = categories.map((cat, i) => {
    const colour = getScoreColour(cat.percentage);
    const summary = getCategorySummary(cat.id, cat.percentage);
    const catSolutions = solutions[cat.id] || [];
    const checkboxes = catSolutions.slice(0, 3).map(s => `<div class="proto-checkbox"><span class="checkbox-box">&#9744;</span> ${s}</div>`).join("");
    return `<div class="proto-card">
      <div class="proto-card-bar" style="background:${colour}"></div>
      <div class="proto-card-inner">
        <div class="proto-card-top">
          <span class="proto-num">&#9632; 0 ${i + 1}</span>
          <span class="proto-score" style="color:${colour}">${cat.percentage}<span class="proto-score-max">/ 100</span></span>
        </div>
        <div class="proto-card-title">${cat.name}</div>
        <div class="proto-card-summary">${summary}</div>
        <div class="proto-card-divider"></div>
        ${checkboxes}
      </div>
    </div>`;
  }).join("");

  // Analysis cards HTML (3x2 grid) - extract per-category analysis from LLM text
  const analysisCardsHtml = categories.map((cat) => {
    const colour = getScoreColour(cat.percentage);
    // Try to extract category-specific analysis from the full analysis text
    const regex = new RegExp(`(?:#{1,3}\\s*(?:\\d+\\.?\\s*)?${cat.name.replace(/[&]/g, ".")}[^\\n]*\\n)([\\s\\S]*?)(?=#{1,3}|$)`, "i");
    const match = analysis.match(regex);
    let excerpt = match ? match[1].trim() : getCategorySummary(cat.id, cat.percentage);
    // Clean up markdown
    excerpt = excerpt.replace(/^[-*•]\s*/gm, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/^>/gm, "").trim();
    // Limit to ~200 chars
    if (excerpt.length > 250) excerpt = excerpt.slice(0, 247) + "...";
    return `<div class="analysis-card">
      <div class="analysis-card-header">
        <span class="analysis-card-name">${cat.name}</span>
        <span class="analysis-card-score" style="color:${colour}">${cat.percentage}</span>
      </div>
      <div class="analysis-card-bar" style="background:${colour}"></div>
      <div class="analysis-card-text">${excerpt}</div>
    </div>`;
  }).join("");

  // Top 5 moves (from solutions, pick most impactful)
  const allSolutions = categories
    .sort((a, b) => a.percentage - b.percentage)
    .flatMap(cat => (solutions[cat.id] || []).slice(0, 1));
  const top5 = allSolutions.slice(0, 5);
  const top5Html = top5.map((move, i) => `<div class="top5-item">
    <div class="top5-num">${i + 1}</div>
    <div class="top5-text">${move}</div>
  </div>`).join("");

  // 30-second read summary (first paragraph of analysis or generated)
  const firstPara = analysis.split("\n").find(l => l.trim().length > 50 && !l.startsWith("#") && !l.startsWith("-") && !l.startsWith(">"));
  const thirtySecondRead = firstPara?.replace(/\*\*/g, "").replace(/\*/g, "").trim() || 
    `A driven professional who clearly values performance but the current systems are not matching the ambition.`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    color: #1a1a1a;
    line-height: 1.4;
    font-size: 9px;
    background: #F5F5F0;
  }

  .page {
    width: 210mm;
    height: 297mm;
    position: relative;
    background: #F5F5F0;
    overflow: hidden;
  }

  /* ═══ FOOTER (all pages) ═══ */
  .page-footer {
    position: absolute;
    bottom: 0;
    left: 0; right: 0;
    padding: 12px 36px;
    display: flex;
    justify-content: space-between;
    font-size: 7px;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-top: 1px solid #e0ddd8;
  }

  /* ═══ PAGE 1: DASHBOARD ═══ */
  .p1 { page-break-after: always; }

  .p1-header {
    background: #1a1a1a;
    padding: 18px 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .p1-header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .logo {
    font-weight: 900;
    font-size: 22px;
    color: #fff;
    letter-spacing: -1px;
  }
  .logo .dot { color: #C8102E; }
  .p1-header-label {
    color: rgba(255,255,255,0.5);
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .p1-header-label .sq { color: #C8102E; margin-right: 6px; }
  .p1-header-right {
    color: rgba(255,255,255,0.4);
    font-size: 8px;
    letter-spacing: 1px;
  }

  /* Metadata row */
  .p1-meta {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    border-bottom: 1px solid #e0ddd8;
    margin: 0 36px;
  }
  .p1-meta-cell {
    padding: 12px 16px;
    border-right: 1px solid #e0ddd8;
  }
  .p1-meta-cell:last-child { border-right: none; }
  .p1-meta-label {
    font-size: 7px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #999;
    margin-bottom: 3px;
  }
  .p1-meta-value {
    font-size: 10px;
    font-weight: 700;
    color: #1a1a1a;
  }

  /* Score section */
  .p1-score-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 24px 36px 16px;
    gap: 24px;
  }
  .p1-score-left {}
  .p1-score-label {
    font-size: 7.5px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #999;
    margin-bottom: 8px;
  }
  .p1-score-label .sq { color: #C8102E; margin-right: 6px; }
  .p1-big-score {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 6px;
  }
  .p1-big-num {
    font-size: 72px;
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -4px;
    color: #1a1a1a;
  }
  .p1-big-suffix {
    font-size: 24px;
    font-weight: 300;
    color: #bbb;
  }
  .p1-badge {
    display: inline-block;
    background: #C8102E;
    color: #fff;
    font-size: 7px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    padding: 3px 10px;
    margin-bottom: 4px;
  }
  .p1-band-text {
    font-size: 7.5px;
    color: #888;
    letter-spacing: 0.5px;
  }

  /* Score context */
  .p1-score-context {
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-left: 1px solid #e0ddd8;
    padding-left: 20px;
  }
  .p1-score-context-label {
    font-size: 7.5px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #999;
    margin-bottom: 6px;
  }
  .p1-score-context-text {
    font-size: 9px;
    color: #555;
    line-height: 1.5;
    max-width: 220px;
  }

  /* Shared scope note */
  .shared-scope {
    margin: 0 36px 12px;
    padding: 8px 10px;
    background: #edeae5;
    border-left: 2px solid #C8102E;
    font-size: 7px;
    color: #555;
    line-height: 1.45;
  }
  .p4 .shared-scope {
    margin: -20px 0 24px;
    background: rgba(255,255,255,0.06);
    border-left-color: #C8102E;
    color: rgba(255,255,255,0.72);
  }

  /* Summary line */
  .p1-summary {
    padding: 0 36px 16px;
    font-size: 10px;
    font-style: italic;
    color: #555;
    line-height: 1.5;
  }

  /* Radar + Domain bars */
  .p1-charts {
    display: grid;
    grid-template-columns: 280px 1fr;
    padding: 0 36px 16px;
    gap: 20px;
    align-items: start;
  }
  .p1-chart-label {
    font-size: 7.5px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #999;
    margin-bottom: 8px;
  }
  .p1-chart-label .sq { color: #C8102E; margin-right: 6px; }

  /* Domain bars */
  .domain-bar-row {
    margin-bottom: 10px;
  }
  .domain-bar-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 3px;
  }
  .domain-bar-name {
    font-size: 9px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .domain-bar-score {
    font-size: 9px;
    font-weight: 700;
  }
  .domain-bar-track {
    height: 6px;
    background: #e8e5e0;
    border-radius: 3px;
    position: relative;
    overflow: visible;
  }
  .domain-bar-fill {
    height: 100%;
    border-radius: 3px;
  }
  .domain-bar-marker {
    position: absolute;
    top: -2px;
    width: 2px;
    height: 10px;
    background: #1a1a1a;
    transform: translateX(-1px);
  }
  .domain-bar-note {
    font-size: 7px;
    color: #888;
    margin-top: 2px;
    font-style: italic;
  }

  /* Bottom stats */
  .p1-bottom {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    margin: 0 36px;
    border-top: 1px solid #e0ddd8;
    border-bottom: 1px solid #e0ddd8;
  }
  .p1-bottom-cell {
    padding: 12px 16px;
    border-right: 1px solid #e0ddd8;
  }
  .p1-bottom-cell:last-child { border-right: none; }
  .p1-bottom-label {
    font-size: 7px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #999;
    margin-bottom: 3px;
  }
  .p1-bottom-value {
    font-size: 11px;
    font-weight: 800;
    color: #1a1a1a;
  }
  .p1-bottom-sub {
    font-size: 7px;
    color: #888;
    margin-top: 2px;
  }

  /* ═══ PAGE 2: ACTION PLAN ═══ */
  .p2 { page-break-before: always; page-break-after: always; }

  .p2-header {
    padding: 18px 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e0ddd8;
  }
  .p2-header-left {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #1a1a1a;
    font-weight: 600;
  }
  .p2-header-left .sq { color: #C8102E; margin-right: 6px; }
  .p2-header-right {
    font-size: 7px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #999;
  }

  .p2-headline {
    padding: 28px 36px 8px;
    font-size: 30px;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -1px;
    color: #1a1a1a;
  }
  .p2-headline .red { color: #C8102E; }
  .p2-subtext {
    padding: 0 36px 24px;
    font-size: 9px;
    color: #666;
    line-height: 1.5;
  }

  /* Protocol grid */
  .proto-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
    padding: 0 36px 36px;
  }
  .proto-card {
    background: #fff;
    border: 1px solid #e0ddd8;
    border-radius: 2px;
    position: relative;
    overflow: hidden;
  }
  .proto-card-bar {
    height: 3px;
    width: 100%;
  }
  .proto-card-inner {
    padding: 12px 14px;
  }
  .proto-card-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
  }
  .proto-num {
    font-size: 7px;
    color: #999;
    letter-spacing: 1px;
  }
  .proto-score {
    font-size: 28px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -1px;
  }
  .proto-score-max {
    font-size: 10px;
    font-weight: 300;
    color: #bbb;
    margin-left: 2px;
  }
  .proto-card-title {
    font-size: 11px;
    font-weight: 800;
    color: #1a1a1a;
    margin-bottom: 2px;
  }
  .proto-card-summary {
    font-size: 8px;
    font-style: italic;
    color: #888;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  .proto-card-divider {
    height: 1px;
    background: #e0ddd8;
    margin-bottom: 8px;
  }
  .proto-checkbox {
    font-size: 8px;
    color: #333;
    line-height: 1.5;
    margin-bottom: 4px;
    display: flex;
    align-items: flex-start;
    gap: 4px;
  }
  .checkbox-box {
    font-size: 10px;
    color: #ccc;
    flex-shrink: 0;
  }

  /* ═══ PAGE 3: COACH ANALYSIS ═══ */
  .p3 { page-break-before: always; page-break-after: always; }

  .p3-headline {
    padding: 28px 36px 8px;
    font-size: 28px;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -0.5px;
    color: #1a1a1a;
  }
  .p3-headline .red { color: #C8102E; font-style: italic; }

  /* 30-second read */
  .p3-read-box {
    margin: 16px 36px;
    background: #edeae5;
    padding: 16px 20px;
    border-radius: 2px;
  }
  .p3-read-label {
    font-size: 7px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #999;
    margin-bottom: 6px;
  }
  .p3-read-label .sq { color: #C8102E; margin-right: 6px; }
  .p3-read-text {
    font-size: 11px;
    font-weight: 500;
    color: #1a1a1a;
    line-height: 1.5;
  }

  /* Analysis grid */
  .analysis-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
    padding: 16px 36px;
  }
  .analysis-card {
    background: #fff;
    border: 1px solid #e0ddd8;
    padding: 14px;
    border-radius: 2px;
  }
  .analysis-card-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
  }
  .analysis-card-name {
    font-size: 10px;
    font-weight: 800;
    color: #1a1a1a;
  }
  .analysis-card-score {
    font-size: 14px;
    font-weight: 800;
  }
  .analysis-card-bar {
    height: 2px;
    width: 100%;
    margin-bottom: 8px;
    border-radius: 1px;
  }
  .analysis-card-text {
    font-size: 8px;
    color: #555;
    line-height: 1.5;
  }

  /* Top 5 moves */
  .p3-top5 {
    margin: 16px 36px 0;
    border: 1px solid #e0ddd8;
    background: #fff;
    padding: 14px 20px;
    border-radius: 2px;
  }
  .p3-top5-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .p3-top5-title {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #1a1a1a;
    font-weight: 700;
  }
  .p3-top5-title .sq { color: #C8102E; margin-right: 6px; }
  .p3-top5-badge {
    font-size: 7px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #C8102E;
    font-weight: 700;
  }
  .p3-top5-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    gap: 12px;
  }
  .top5-item {
    text-align: center;
  }
  .top5-num {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #C8102E;
    color: #fff;
    font-size: 9px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
  }
  .top5-text {
    font-size: 7.5px;
    color: #333;
    line-height: 1.4;
  }

  /* ═══ PAGE 4: CTA ═══ */
  .p4 {
    page-break-before: always;
    background: #1a1a1a;
    height: 297mm;
    position: relative;
  }

  .p4-header {
    padding: 18px 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .p4-header-left {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.5);
    font-weight: 600;
  }
  .p4-header-left .sq { color: #C8102E; margin-right: 6px; }
  .p4-header-right {
    font-size: 7px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.3);
  }
  .p4-header-right .sq { color: #C8102E; margin-right: 6px; }

  .p4-content {
    padding: 40px 36px;
  }
  .p4-stage {
    font-size: 7.5px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #C8102E;
    font-weight: 700;
    margin-bottom: 16px;
  }
  .p4-stage .sq { margin-right: 6px; }
  .p4-headline {
    font-size: 52px;
    font-weight: 900;
    color: #fff;
    line-height: 1.05;
    letter-spacing: -2px;
    margin-bottom: 16px;
  }
  .p4-headline .red { color: #C8102E; }
  .p4-subtext {
    font-size: 10px;
    color: rgba(255,255,255,0.6);
    line-height: 1.6;
    max-width: 460px;
    margin-bottom: 40px;
  }

  /* Coaching table */
  .p4-table {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    margin-bottom: 24px;
    border-radius: 2px;
  }
  .p4-table-header {
    display: flex;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .p4-table-title {
    font-size: 7.5px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.6);
    font-weight: 700;
  }
  .p4-table-title .sq { color: #C8102E; margin-right: 6px; }
  .p4-table-count {
    font-size: 7px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.4);
    font-weight: 700;
  }
  .p4-table-count .sq { color: #C8102E; margin-right: 4px; }
  .p4-table-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .p4-table-row:last-child { border-bottom: none; }
  .p4-table-num {
    font-size: 8px;
    color: rgba(255,255,255,0.3);
    font-weight: 500;
    margin-right: 12px;
  }
  .p4-table-item {
    font-size: 9px;
    color: rgba(255,255,255,0.85);
    font-weight: 500;
    flex: 1;
  }
  .p4-table-status {
    font-size: 7px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #C8102E;
    font-weight: 700;
  }

  .p4-investment {
    margin: -8px 0 20px;
    font-size: 8px;
    color: rgba(255,255,255,0.7);
    letter-spacing: 0.4px;
  }
  .p4-investment strong {
    color: #fff;
  }

  /* CTA box */
  .p4-cta-box {
    background: #C8102E;
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 2px;
  }
  .p4-cta-left {}
  .p4-cta-label {
    font-size: 7px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.7);
    margin-bottom: 4px;
  }
  .p4-cta-email {
    font-size: 20px;
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.5px;
  }
  .p4-cta-right {
    text-align: right;
  }
  .p4-cta-limited {
    font-size: 7px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.8);
    font-weight: 600;
  }
  .p4-cta-url {
    font-size: 7px;
    color: rgba(255,255,255,0.6);
    margin-top: 3px;
  }

  .p4-footer {
    position: absolute;
    bottom: 0;
    left: 0; right: 0;
    padding: 12px 36px;
    display: flex;
    justify-content: space-between;
    font-size: 7px;
    color: rgba(255,255,255,0.25);
    text-transform: uppercase;
    letter-spacing: 1px;
    border-top: 1px solid rgba(255,255,255,0.1);
  }
</style>
</head>
<body>

<!-- ═══ PAGE 1: DASHBOARD ═══ -->
<div class="page p1">
  <div class="p1-header">
    <div class="p1-header-left">
      <div class="logo">ML<span class="dot">.</span></div>
      <div class="p1-header-label"><span class="sq">&#9632;</span>PERFORMANCE ASSESSMENT REPORT</div>
    </div>
    <div class="p1-header-right">V4 &middot; ${dateStr}</div>
  </div>

  <div class="p1-meta">
    <div class="p1-meta-cell">
      <div class="p1-meta-label">Subject</div>
      <div class="p1-meta-value">${name.toUpperCase()}</div>
    </div>
    <div class="p1-meta-cell">
      <div class="p1-meta-label">Assessed</div>
      <div class="p1-meta-value">${dateStr}</div>
    </div>
    <div class="p1-meta-cell">
      <div class="p1-meta-label">Instrument</div>
      <div class="p1-meta-value">27-ITEM SURVEY</div>
    </div>
    <div class="p1-meta-cell">
      <div class="p1-meta-label">Score Basis</div>
      <div class="p1-meta-value">SELF-REPORTED ANSWERS</div>
    </div>
  </div>

  <div class="p1-score-section">
    <div class="p1-score-left">
      <div class="p1-score-label"><span class="sq">&#9632;</span>QUESTIONNAIRE COACHING SCORE</div>
      <div class="p1-big-score">
        <span class="p1-big-num">${overallPct}</span>
        <span class="p1-big-suffix">/ 100</span>
      </div>
      <div class="p1-badge">${overallLabel}</div>
      <div class="p1-band-text">BAND: ${getScoreBand(overallPct)} &middot; ${overallLabel}</div>
    </div>
    <div class="p1-score-context">
      <div class="p1-score-context-label">Score Context</div>
      <div class="p1-score-context-text">A self-reported coaching reference for reflection and conversation. It does not predict a health outcome or a recovery timeline.</div>
    </div>
  </div>

  <div class="p1-summary">"${thirtySecondRead.slice(0, 120)}"</div>
  ${sharedScopeNote}

  <div class="p1-charts">
    <div>
      <div class="p1-chart-label"><span class="sq">&#9632;</span>FIG. 01 &middot; PERFORMANCE RADAR</div>
      ${radarSvg}
    </div>
    <div>
      <div class="p1-chart-label"><span class="sq">&#9632;</span>FIG. 02 &middot; DOMAIN SCORES</div>
      ${domainBarsHtml}
    </div>
  </div>

  <div class="p1-bottom">
    <div class="p1-bottom-cell">
      <div class="p1-bottom-label">Strongest Domain</div>
      <div class="p1-bottom-value">${strongest?.name}</div>
      <div class="p1-bottom-sub">${strongest?.percentage}/100</div>
    </div>
    <div class="p1-bottom-cell">
      <div class="p1-bottom-label">Priority Domain</div>
      <div class="p1-bottom-value">${weakest?.name}</div>
      <div class="p1-bottom-sub">${weakest?.percentage}/100 &middot; address first</div>
    </div>
    <div class="p1-bottom-cell">
      <div class="p1-bottom-label">Score Context</div>
      <div class="p1-bottom-value">Illustrative Reference</div>
      <div class="p1-bottom-sub">for coaching reflection</div>
    </div>
  </div>

  <div class="page-footer">
    <span>ML / MARINLAZIC.COM</span>
    <span>REPORT ID &middot; ${reportId}</span>
    <span>P. 01 / 04</span>
  </div>
</div>

<!-- ═══ PAGE 2: ACTION PLAN ═══ -->
<div class="page p2">
  <div class="p2-header">
    <div class="p2-header-left"><span class="sq">&#9632;</span>02 &middot; ACTION PLAN</div>
    <div class="p2-header-right">BASED ON YOUR SPECIFIC RESPONSES</div>
  </div>

  <div class="p2-headline">Six focus areas. <span class="red">Choose what fits your week.</span></div>
  <div class="p2-subtext">Use these optional prompts to identify small, practical actions. Adapt them to your preferences, schedule, and qualified guidance where relevant.</div>
  ${sharedScopeNote}

  <div class="proto-grid">
    ${protocolCardsHtml}
  </div>

  <div class="page-footer">
    <span>ML / MARINLAZIC.COM</span>
    <span>REPORT ID &middot; ${reportId}</span>
    <span>P. 02 / 04</span>
  </div>
</div>

<!-- ═══ PAGE 3: COACH ANALYSIS ═══ -->
<div class="page p3">
  <div class="p2-header">
    <div class="p2-header-left"><span class="sq">&#9632;</span>03 &middot; COACH ANALYSIS</div>
    <div class="p2-header-right">BY MARIN LAZIC</div>
  </div>

  <div class="p3-headline">A closer look at your <span class="red">questionnaire responses.</span></div>

  <div class="p3-read-box">
    <div class="p3-read-label"><span class="sq">&#9632;</span>THE 30-SECOND READ</div>
    <div class="p3-read-text">${thirtySecondRead}</div>
  </div>
  ${sharedScopeNote}

  <div class="analysis-grid">
    ${analysisCardsHtml}
  </div>

  <div class="p3-top5">
    <div class="p3-top5-header">
      <div class="p3-top5-title"><span class="sq">&#9632;</span>TOP 5 ACTIONS &middot; NEXT 30 DAYS</div>
      <div class="p3-top5-badge"><span class="sq">&#9632;</span>PRIORITISED</div>
    </div>
    <div class="p3-top5-grid">
      ${top5Html}
    </div>
  </div>

  <div class="page-footer">
    <span>ML / MARINLAZIC.COM</span>
    <span>REPORT ID &middot; ${reportId}</span>
    <span>P. 03 / 04</span>
  </div>
</div>

<!-- ═══ PAGE 4: CTA ═══ -->
<div class="page p4">
  <div class="p4-header">
    <div class="p4-header-left"><span class="sq">&#9632;</span>04 &middot; NEXT STEP</div>
    <div class="p4-header-right"><span class="sq">&#9632;</span>CONFIDENTIAL &middot; ${name.toUpperCase()}</div>
  </div>

  <div class="p4-content">
    <div class="p4-stage"><span class="sq">&#9632;</span>STAGE 02</div>
    <div class="p4-headline">Turn insight into<br><span class="red">your next action.</span></div>
    <div class="p4-subtext">Use this questionnaire as a starting point for an individual coaching conversation. Coaching plans are agreed with you and adjusted to your preferences, goals, and schedule.</div>
    ${sharedScopeNote}

    <div class="p4-table">
      <div class="p4-table-header">
        <div class="p4-table-title"><span class="sq">&#9632;</span>1:1 COACHING &middot; WHAT'S INCLUDED</div>
        <div class="p4-table-count"><span class="sq">&#9632;</span>5 ITEMS</div>
      </div>
      <div class="p4-table-row">
        <span class="p4-table-num">01</span>
        <span class="p4-table-item">Individual training programme delivered in Bridge Athletic</span>
        <span class="p4-table-status">INCLUDED</span>
      </div>
      <div class="p4-table-row">
        <span class="p4-table-num">02</span>
        <span class="p4-table-item">Optional wearable data review and recovery conversation</span>
        <span class="p4-table-status">INCLUDED</span>
      </div>
      <div class="p4-table-row">
        <span class="p4-table-num">03</span>
        <span class="p4-table-item">Individual nutrition and sleep habit coaching</span>
        <span class="p4-table-status">INCLUDED</span>
      </div>
      <div class="p4-table-row">
        <span class="p4-table-num">04</span>
        <span class="p4-table-item">Direct access to your coach</span>
        <span class="p4-table-status">INCLUDED</span>
      </div>
      <div class="p4-table-row">
        <span class="p4-table-num">05</span>
        <span class="p4-table-item">Monthly programme adjustments</span>
        <span class="p4-table-status">INCLUDED</span>
      </div>
    </div>

    <div class="p4-investment">Investment: <strong>$2,400 AUD / MONTH</strong> &middot; minimum 3-month commitment</div>

    <div class="p4-cta-box">
      <div class="p4-cta-left">
        <div class="p4-cta-label">APPLY FOR COACHING</div>
        <div class="p4-cta-email">marin@marinlazic.coach</div>
      </div>
      <div class="p4-cta-right">
        <div class="p4-cta-limited">LIMITED SPOTS AVAILABLE. APPLICATION REQUIRED.</div>
        <div class="p4-cta-url">&rarr; www.marinlazic.com</div>
      </div>
    </div>
  </div>

  <div class="p4-footer">
    <span>ML / MARINLAZIC.COM</span>
    <span>REPORT ID &middot; ${reportId}</span>
    <span>P. 04 / 04</span>
  </div>
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
