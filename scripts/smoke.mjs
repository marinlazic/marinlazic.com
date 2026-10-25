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
  const shell = html.includes("<!--app-html-->") || /id="root"><\/div>/.test(html);
  record(`page ${path}`, ok, `status ${res.status}${mustContain && !html.includes(mustContain) ? ", text missing" : ""}${shell ? ", SSR fell back to the shell" : ""}`);
  if (!ok) console.log("   root snippet:", (html.split('id="root">')[1] || "").slice(0, 200).replace(/\s+/g, " "));
  return html;
}

// 1. Pages render server side
await page("/", "Performance coach for founders");
await page("/media", "Kelly and Juliet Starrett");
await page("/resources", "images/resources/resources-hero");
await page("/recovery-guide", "The four kinds of fatigue");
await page("/speaking", "Olympic level performance science");
await page("/library", "Water Polo Hypertrophy");
await page("/library/water-polo-max-strength-and-power", "bridgeathletic.com/product/waterpolomaxstrengthandpower-1747737");
await page("/resources/sleep", "images/resources/sleep-1200");
await page("/insights/how-to-boost-your-hrv", "application/ld+json");
await page("/program", "Start the 4 week programme");
await page("/report/not-a-real-token-1234", "Saved report");

// 1b. Tagged short links redirect with the UTM tags attached, and do not shadow real pages
{
  const checks = [
    ["/ig", "/recovery-guide?utm_source=instagram&utm_medium=social"],
    ["/yt/a", "/assessment?utm_source=youtube&utm_medium=video"],
    ["/kit/p/october", "/program?utm_source=kit&utm_medium=email&utm_campaign=october"],
  ];
  for (const [from, to] of checks) {
    const res = await fetch(`${BASE}${from}`, { redirect: "manual", headers: { "user-agent": "marinlazic-smoke/1.0" } });
    const loc = res.headers.get("location") || "";
    record(`short link ${from}`, res.status === 302 && loc === to, `status ${res.status}, location ${loc || "none"}`);
  }
}

// 1a. Feed and IndexNow key file are served
{
  const feed = await fetch(`${BASE}/feed.xml`);
  const xml = await feed.text();
  record("rss feed", feed.status === 200 && xml.includes("<rss") && xml.includes("/insights/"), `status ${feed.status}`);
  const key = "b1a22b3384a75608ac5a98b4ca4db8c4";
  const kf = await fetch(`${BASE}/${key}.txt`);
  record("indexnow key file", kf.status === 200 && (await kf.text()).trim() === key, `status ${kf.status}`);
}

// 1b. Dashboard shell loads and its API is locked
{
  for (const p of ["/admin", "/admin/followup", "/admin/contacts", "/admin/traffic", "/admin/email"]) {
    const res = await fetch(`${BASE}${p}`);
    const html = await res.text();
    record(`dashboard ${p}`, res.status === 200 && /id="root"/.test(html) && /noindex/.test(html), `status ${res.status}`);
  }
  const r = await trpc("admin.overview", { days: 30 }, "GET");
  record("dashboard API rejects anonymous", r.status === 401 || r.status === 403, `status ${r.status}`);
}

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

// 4. Enquiry form: database row, Resend confirmation (test addresses never go to Kit)
{
  const r = await trpc("leads.submit", {
    email: EMAIL,
    name: "Smoke Test",
    source: "smoke-test",
    message: "Automated test of the enquiry form. Safe to ignore.",
  });
  record("enquiry submit (database + Resend)", r.status === 200 && r.body?.result?.data?.json?.success === true, `status ${r.status} ${r.status !== 200 ? r.text.slice(0, 200) : ""}`);
}

// 4b. Recovery Guide signup: email with the PDF attached (Kit skipped for a test address)
{
  const r = await trpc("guides.subscribe", { guide: "recovery", email: EMAIL, firstName: "Smoke", placement: "smoke-test" });
  record("recovery guide signup (Resend + PDF)", r.status === 200 && r.body?.result?.data?.json?.sent === true, `status ${r.status} ${r.status !== 200 ? r.text.slice(0, 200) : ""}`);
  const pdf = await fetch(`${BASE}/guides/the-recovery-guide.pdf`, { method: "HEAD" });
  record("recovery guide pdf served", pdf.status === 200 && /pdf/.test(pdf.headers.get("content-type") || ""), `status ${pdf.status}`);
}

// 5. Assessment progress save (database)
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
  const msg = String(r.body?.error?.json?.message || r.text || "");
  if (r.status === 200 && url) record("stripe checkout session", true, url.slice(0, 40) + "...");
  else if (/not configured/i.test(msg)) console.log("SKIP  stripe checkout session  (STRIPE_SECRET_KEY not set yet)");
  else record("stripe checkout session", false, `status ${r.status}: ${msg.slice(0, 160)}`);
}

// 9. Cron endpoint is protected
{
  const res = await fetch(`${BASE}/api/cron/daily`);
  record("cron endpoint requires secret", res.status === 401, `status ${res.status}`);
}

// 10. Service checks with the real keys (needs CRON_SECRET). Reports ok or a
// short reason per service, never a key value.
if (process.env.CRON_SECRET) {
  const res = await fetch(`${BASE}/api/diagnostics`, {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  let body = null;
  try { body = await res.json(); } catch { /* not json */ }
  if (res.status !== 200 || !body?.checks) {
    record("diagnostics endpoint", false, `status ${res.status}`);
  } else {
    for (const [name, check] of Object.entries(body.checks)) {
      if (check.skipped) console.log(`SKIP  service ${name}  (${check.detail})`);
      else record(`service ${name}`, check.ok, check.detail);
    }
  }
} else {
  console.log("SKIP  service checks (CRON_SECRET not provided)");
}

const failed = results.filter(r => !r.ok);
// 11. Remove everything this run wrote, so the dashboard only holds real people.
{
  const res = await fetch(`${BASE}/api/test/cleanup`, { method: "POST", headers: { "user-agent": "marinlazic-smoke/1.0" } });
  let body = null;
  try { body = await res.json(); } catch { /* not json */ }
  record("test data removed", res.status === 200 && body?.ok === true, body?.summary || `status ${res.status}`);
}

console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
