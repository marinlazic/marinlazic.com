// Service checks for the deployed site. GET /api/diagnostics with the
// CRON_SECRET bearer token. Each check calls the real service with the
// configured key and reports ok or a short reason. No key or secret value
// is ever returned, only whether it works.
import type { Express, Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
import { sql } from "drizzle-orm";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { storageConfigured, storageDelete, storageGetBuffer, storagePut } from "./storage";

// skipped: the service is not set up at all, which is reported but not counted as a failure.
type Check = { ok: boolean; detail: string; skipped?: boolean };
const notSet = (name: string): Check => ({ ok: false, skipped: true, detail: `${name} not set` });

function authorised(req: Request): boolean {
  if (!ENV.cronSecret) return false;
  const header = req.headers.authorization || "";
  const expected = `Bearer ${ENV.cronSecret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timed out after ${ms / 1000}s`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

function errText(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.slice(0, 160);
}

async function checkDatabase(): Promise<Check> {
  if (!ENV.databaseUrl) return notSet("DATABASE_URL");
  try {
    const db = await getDb();
    if (!db) return { ok: false, detail: "database client not available" };
    await withTimeout(db.execute(sql`select 1 from leads limit 1`));
    return { ok: true, detail: "connected, leads table present" };
  } catch (e) {
    return { ok: false, detail: errText(e) };
  }
}

async function checkResend(): Promise<Check> {
  if (!ENV.resendApiKey) return notSet("RESEND_API_KEY");
  if (!ENV.resendFromEmail) return notSet("RESEND_FROM_EMAIL");
  try {
    const res = await withTimeout(
      fetch("https://api.resend.com/domains", {
        headers: { authorization: `Bearer ${ENV.resendApiKey}` },
      })
    );
    const body: any = await res.json().catch(() => null);
    // A key restricted to sending cannot list domains. That is the normal
    // setup for this site, and the key is proven by every email it sends.
    if (res.status === 401 || res.status === 403) {
      const name = String(body?.name || "");
      if (name === "restricted_api_key") return { ok: true, detail: "key accepted (sending only)" };
      return { ok: false, detail: `key rejected (${res.status}${name ? " " + name : ""})` };
    }
    if (!res.ok) return { ok: false, detail: `unexpected status ${res.status}` };
    const address = ENV.resendFromEmail.match(/<([^>]+)>/)?.[1] ?? ENV.resendFromEmail;
    const fromDomain = address.trim().split("@")[1]?.toLowerCase() ?? "";
    const domains: any[] = body?.data ?? [];
    const match = domains.find(d => String(d.name).toLowerCase() === fromDomain);
    if (!match) return { ok: false, detail: `key works but the from domain ${fromDomain} is not in Resend` };
    const verified = match.status === "verified";
    return { ok: verified, detail: `${fromDomain} is ${match.status}` };
  } catch (e) {
    return { ok: false, detail: errText(e) };
  }
}

async function checkKit(): Promise<Check> {
  if (!ENV.kitApiKey) return notSet("KIT_API_KEY");
  try {
    const res = await withTimeout(
      fetch("https://api.kit.com/v4/account", {
        headers: { "X-Kit-Api-Key": ENV.kitApiKey, accept: "application/json" },
      })
    );
    if (res.status === 401) return { ok: false, detail: "key rejected (401)" };
    if (!res.ok) return { ok: false, detail: `unexpected status ${res.status}` };
    const body: any = await res.json();
    const name = body?.account?.name || body?.account?.primary_email_address ? "account found" : "key accepted";
    return { ok: true, detail: name };
  } catch (e) {
    return { ok: false, detail: errText(e) };
  }
}

async function checkGemini(): Promise<Check> {
  if (!ENV.geminiApiKey) return notSet("GEMINI_API_KEY");
  try {
    const res = await withTimeout(
      fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${ENV.geminiApiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: ENV.geminiModel,
          messages: [{ role: "user", content: "Reply with the single word OK." }],
          max_tokens: 5,
        }),
      }),
      30000
    );
    if (res.status === 401 || res.status === 403) return { ok: false, detail: `key rejected (${res.status})` };
    if (res.status === 404) return { ok: false, detail: `model ${ENV.geminiModel} not found (404)` };
    if (!res.ok) return { ok: false, detail: `unexpected status ${res.status}` };
    return { ok: true, detail: `model ${ENV.geminiModel} answered` };
  } catch (e) {
    return { ok: false, detail: errText(e) };
  }
}

async function checkBlob(): Promise<Check> {
  if (!storageConfigured()) return notSet("BLOB_READ_WRITE_TOKEN");
  const key = `diagnostics/${Date.now()}.txt`;
  try {
    await withTimeout(storagePut(key, "ok", "text/plain"));
    const back = await withTimeout(storageGetBuffer(key));
    await storageDelete(key).catch(() => undefined);
    if (!back || back.toString() !== "ok") return { ok: false, detail: "wrote a file but could not read it back" };
    return { ok: true, detail: "write, read and delete worked" };
  } catch (e) {
    return { ok: false, detail: errText(e) };
  }
}

async function checkStripe(): Promise<Check> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return notSet("STRIPE_SECRET_KEY");
  const mode = key.startsWith("sk_live_") ? "live" : key.startsWith("sk_test_") ? "test" : "unknown";
  try {
    const stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" as any });
    const account = await withTimeout(stripe.accounts.retrieve());
    const webhook = process.env.STRIPE_WEBHOOK_SECRET ? "webhook secret set" : "STRIPE_WEBHOOK_SECRET not set";
    const charges = account.charges_enabled ? "charges enabled" : "charges not enabled";
    return {
      ok: Boolean(process.env.STRIPE_WEBHOOK_SECRET) && account.charges_enabled === true,
      detail: `${mode} key accepted, ${charges}, ${webhook}`,
    };
  } catch (e) {
    return { ok: false, detail: `${mode} key: ${errText(e)}` };
  }
}

function checkSettings(): Record<string, Check> {
  return {
    adminPassword: ENV.adminPassword
      ? { ok: ENV.adminPassword.length >= 8, detail: ENV.adminPassword.length >= 8 ? "set" : "set but shorter than 8 characters" }
      : notSet("ADMIN_PASSWORD"),
    jwtSecret: ENV.cookieSecret
      ? { ok: ENV.cookieSecret.length >= 32, detail: ENV.cookieSecret.length >= 32 ? "set" : "set but too short" }
      : notSet("JWT_SECRET"),
    ownerEmail: ENV.ownerEmail
      ? { ok: /@/.test(ENV.ownerEmail), detail: "set" }
      : notSet("OWNER_EMAIL"),
    siteOrigin: { ok: /^https:\/\//.test(ENV.siteOrigin), detail: ENV.siteOrigin },
    geminiModel: { ok: Boolean(ENV.geminiModel), detail: ENV.geminiModel },
  };
}

export async function runDiagnostics() {
  const [database, resend, kit, gemini, blob, stripe] = await Promise.all([
    checkDatabase(),
    checkResend(),
    checkKit(),
    checkGemini(),
    checkBlob(),
    checkStripe(),
  ]);
  const checks: Record<string, Check> = {
    database,
    resend,
    kit,
    gemini,
    blob,
    stripe,
    ...checkSettings(),
  };
  const failed = Object.entries(checks).filter(([, c]) => !c.ok && !c.skipped).map(([k]) => k);
  const skipped = Object.entries(checks).filter(([, c]) => c.skipped).map(([k]) => k);
  return { ok: failed.length === 0, failed, skipped, checks, ranAt: new Date().toISOString() };
}

export function registerDiagnosticsRoute(app: Express) {
  app.get("/api/diagnostics", async (req: Request, res: Response) => {
    if (!authorised(req)) {
      res.status(401).json({ error: "Unauthorised" });
      return;
    }
    try {
      res.status(200).setHeader("Cache-Control", "no-store").json(await runDiagnostics());
    } catch (error) {
      console.error("[Diagnostics] failed:", error);
      res.status(500).json({ ok: false, error: errText(error) });
    }
  });
}
