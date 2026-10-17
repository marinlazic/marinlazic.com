// End to end smoke test against a deployed site. Run from GitHub Actions
// (or anywhere with network access):
//   BASE_URL=https://marinlazic-com.vercel.app TEST_EMAIL=you@example.com node scripts/smoke.mjs
// Exercises: pages, database, Resend, Kit, Gemini, PDF, Blob, saved report,
// admin login endpoint, Stripe configuration. Prints PASS/FAIL per check.

import { QUESTIONS } from "../shared/assessment.ts";

const BASE = (process.env.BASE_URL || "").replace(/\/$/, "");
const EMAIL = process.env.TEST_EMAIL || "";
if (!BASE || !EMAIL) {
  console.error("BASE_URL and TEST_EMAIL are required");
  process.exit(2);
}

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`);
}

async function trpc(path, input, method = "POST") {
  const url = method === "GET"
    ? `${BASE}/api/trpc/${path}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`
    : `${BASE}/api/trpc/${path}`;
  const res = await fetch(url, {
    method,
    headers: { "content-type": "application/json", "user-agent": "marinlazic-smoke/1.0" },
    body: method === "GET" ? undefined : JSON.stringify({ json: input }),
  });
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { /* keep text */ }
  return { status: res.status, body, text };
}

async function page(path, mustContain) {
  const res = await fetch(`${BASE}${path}`, { headers: { "user-agent": "marinlazic-smoke/1.0" } });
  const html = await res.text();
  const ok = res.status === 200 && (!mustContain || html.includes(mustContain));
  record(`page ${path}`, ok, `status ${res.status}${mustContain && !html.includes(mustContain) ? ", text missing" : ""}`);
  return html;
}

// 1. Pages render server side
await page("/", "Performance coach for founders");
await page("/media", "Kelly and Juliet Starrett");
await page("/resources", "images/resources/resources-hero");
await page("/resources/sleep", "images/resources/sleep-1200");
await page("/insights/how-to-boost-your-hrv", "application/ld+json");
await page("/program", "Start the 4 week programme");
await page("/report/not-a-real-token-1234", "Report not found");

// 2. Health
{
  const r = await trpc("system.health", { timestamp: Date.now() }, "GET");
  record("api health", r.status === 200 && r.body?.result?.data?.json?.ok === true, `status ${r.status}`);
}

// 3. Admin login endpoint rejects a wrong password (proves the route and JWT config exist)
{
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "definitely-not-the-password" }),
  });
  record("admin login rejects wrong password", res.status === 401, `status ${res.status}`);
}

// 4. Enquiry form: database row, Resend confirmation, Kit tag
{
  const r = await trpc("leads.submit", {
    email: EMAIL,
    name: "Smoke Test",
    source: "smoke-test",
    message: "Automated test of the enquiry form. Safe to ignore.",
  });
  record("enquiry submit (database + Resend + Kit)", r.status === 200 && r.body?.result?.data?.json?.success === true, `status ${r.status} ${r.status !== 200 ? r.text.slice(0, 200) : ""}`);
}

// 5. Assessment progress save (database + Kit assessment-started)
let resumeToken = null;
{
  const r = await trpc("assessment.saveProgress", {
    email: EMAIL,
    name: "Smoke Test",
    answers: { name: "Smoke Test", email: EMAIL },
    answeredCount: 2,
    totalQuestions: QUESTIONS.length,
  });
  resumeToken = r.body?.result?.data?.json?.resumeToken ?? null;
  record("assessment progress save", r.status === 200 && Boolean(resumeToken), `status ${r.status}`);
}
if (resumeToken) {
  const r = await trpc("assessment.getProgress", { resumeToken }, "GET");
  record("assessment progress resume", r.status === 200 && r.body?.result?.data?.json?.email === EMAIL, `status ${r.status}`);
}

// 6. Full assessment: Gemini report, PDF, Blob, saved report, results email
let reportUrl = null;
{
  const answers = { name: "Smoke Test", email: EMAIL };
  for (const q of QUESTIONS) {
    if (q.id === "name" || q.id === "email") continue;
    if (q.options?.length) {
      const scored = q.options.filter(o => o.score !== undefined);
      const pick = (scored.length ? scored : q.options)[Math.min(2, (scored.length ? scored : q.options).length - 1)];
      answers[q.id] = q.type === "multi" ? [pick.value] : pick.value;
    } else if (q.type === "number") {
      answers[q.id] = "40";
    } else {
      answers[q.id] = "Automated smoke test answer.";
    }
  }
  const started = Date.now();
  const r = await trpc("assessment.submit", { answers, utmSource: "smoke-test" });
  const data = r.body?.result?.data?.json;
  const secs = Math.round((Date.now() - started) / 1000);
  const analysisOk = typeof data?.analysis === "string" && data.analysis.length > 500 && !/Analysis generation failed/.test(data.analysis);
  record("assessment submit (Gemini report)", r.status === 200 && analysisOk, `status ${r.status}, ${secs}s${!analysisOk && r.text ? ", " + r.text.slice(0, 300) : ""}`);
  record("assessment scores returned", typeof data?.scores?.overallPct === "number", `overall ${data?.scores?.overallPct}`);
  reportUrl = data?.reportUrl ?? null;
  record("saved report link returned (database)", Boolean(data?.reportToken), reportUrl || "none");
}

// 7. Saved report page, API and PDF (Blob)
if (reportUrl) {
  const token = reportUrl.split("/report/")[1];
  const r = await trpc("report.get", { token }, "GET");
  const rep = r.body?.result?.data?.json;
  record("report.get returns the report", r.status === 200 && rep?.analysis?.length > 500, `status ${r.status}`);
  record("report has PDF stored (Blob)", rep?.hasPdf === true, rep?.hasPdf ? "yes" : "no PDF key");
  const pdf = await fetch(`${BASE}/api/report/${token}/pdf`);
  const ct = pdf.headers.get("content-type") || "";
  const buf = Buffer.from(await pdf.arrayBuffer());
  record("report PDF downloads", pdf.status === 200 && ct.includes("pdf") && buf.subarray(0, 4).toString() === "%PDF", `status ${pdf.status}, ${buf.length} bytes`);
  await page(`/report/${token}`, "Saved report");
}

// 8. Stripe configuration
{
  const r = await trpc("checkout.createSession", {
    productId: "kickstart-4-week",
    email: EMAIL,
    name: "Smoke Test",
    origin: BASE,
  });
  const url = r.body?.result?.data?.json?.url;
  if (r.status === 200 && url) record("stripe checkout session", true, url.slice(0, 40) + "...");
  else record("stripe checkout session", false, `status ${r.status}: ${(r.body?.error?.json?.message || r.text).slice(0, 160)}`);
}

// 9. Cron endpoint is protected
{
  const res = await fetch(`${BASE}/api/cron/daily`);
  record("cron endpoint requires secret", res.status === 401, `status ${res.status}`);
}

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
