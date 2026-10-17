// Seeds synthetic analytics events into the LOCAL test database only.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { analyticsEvents } from "../../drizzle/schema";

if (!process.env.DATABASE_URL?.includes("localhost")) throw new Error("local only");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const paths = ["/", "/", "/", "/assessment", "/insights", "/insights/how-to-boost-your-hrv", "/insights/sleep-for-founders", "/resources", "/resources/sleep", "/media", "/program", "/apply", "/about"];
const refs = ["", "", "", "https://www.google.com/", "https://www.linkedin.com/feed/", "https://marinlazic.substack.com/p/post", "https://www.instagram.com/", "https://t.co/abc"];
const uas = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36",
];
const buttons = ["hero_apply_coaching", "hero_assessment", "nav_check_score", "contact_submit", "services_apply_coaching", "insight_0", "articles_view_all"];
const rnd = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(xs: T[]) => xs[rnd(xs.length)];

const rows: (typeof analyticsEvents.$inferInsert)[] = [];
const now = Date.now();
for (let day = 0; day < 90; day++) {
  const sessions = 8 + rnd(20) + (day < 30 ? 10 : 0);
  for (let s = 0; s < sessions; s++) {
    const sessionId = `s${day}_${s}_${rnd(1e6)}`;
    const ua = pick(uas);
    const referrer = pick(refs);
    const utm = Math.random() < 0.25 ? { utm_source: pick(["linkedin", "instagram", "newsletter", "substack"]), utm_medium: pick(["social", "email"]), utm_campaign: pick(["hrv-article", "october-launch", "sleep-series"]) } : {};
    const landing = pick(paths);
    const base = now - day * 86_400_000 - rnd(86_400_000);
    const views = 1 + rnd(4);
    let t = base;
    const visited: string[] = [];
    for (let v = 0; v < views; v++) {
      const path = v === 0 ? landing : pick(paths);
      visited.push(path);
      rows.push({ eventType: "page_view", eventData: JSON.stringify({ ...utm, landingPath: landing, referrer, path }), sessionId, userAgent: ua, referrer, createdAt: new Date(t) });
      t += 20_000 + rnd(120_000);
      if (Math.random() < 0.3) rows.push({ eventType: "cta_click", eventData: JSON.stringify({ button: pick(buttons), ...utm, landingPath: landing, referrer, path }), sessionId, userAgent: ua, referrer, createdAt: new Date(t) });
      if (path === "/" && Math.random() < 0.5) rows.push({ eventType: "section_view", eventData: JSON.stringify({ section: pick(["services", "about", "insights", "contact", "results"]), path }), sessionId, userAgent: ua, referrer, createdAt: new Date(t) });
    }
    if (visited.includes("/assessment") && Math.random() < 0.6) {
      rows.push({ eventType: "assessment_started", eventData: JSON.stringify({ path: "/assessment", ...utm, landingPath: landing, referrer }), sessionId, userAgent: ua, referrer, createdAt: new Date(t) });
      if (Math.random() < 0.6) rows.push({ eventType: "assessment_completed", eventData: JSON.stringify({ path: "/assessment" }), sessionId, userAgent: ua, referrer, createdAt: new Date(t + 300_000) });
      if (Math.random() < 0.1) rows.push({ eventType: "checkout_started", eventData: JSON.stringify({ product: "kickstart-4-week", path: "/assessment" }), sessionId, userAgent: ua, referrer, createdAt: new Date(t + 400_000) });
    }
  }
}
for (let i = 0; i < rows.length; i += 500) await db.insert(analyticsEvents).values(rows.slice(i, i + 500));
console.log("seeded", rows.length, "events");
await pool.end();
