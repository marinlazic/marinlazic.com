// Gmail, read only. Marin connects his Google account once from the System
// page (OAuth, scope gmail.readonly). After that the daily job, and the Sync
// button, read every email between him and each contact and store them as
// conversation events: what he sent, what they replied, Bridge Athletic
// purchase notices. Nothing is ever written to Gmail.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { and, eq, inArray, sql } from "drizzle-orm";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { conversationEvents } from "../drizzle/schema";
import { deleteSetting, getSetting, patchSetting, setSetting } from "./settings";
import { isTestEmail } from "../shared/testData";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const API = "https://gmail.googleapis.com/gmail/v1/users/me";
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const SETTING = "gmail";

export type GmailSetting = {
  refreshToken: string;
  email: string;
  connectedAt: string;
  lastSyncAt?: string;
  lastSyncStartedAt?: string;
  lastError?: string | null;
  lastCounts?: SyncCounts;
};

export type SyncCounts = { contacts: number; listed: number; added: number; purchases: number; skipped: number; partial: boolean; seconds: number };

export function gmailConfigured(): boolean {
  return Boolean(ENV.googleClientId && ENV.googleClientSecret);
}

export function redirectUri(): string {
  return `${ENV.siteOrigin}/api/gmail/callback`;
}

// ─── OAuth ──────────────────────────────────────────────────────────────────

function signState(ts: string): string {
  return createHmac("sha256", ENV.cookieSecret).update(`gmail:${ts}`).digest("hex").slice(0, 32);
}

export function makeState(): string {
  const ts = String(Date.now());
  return `${ts}.${signState(ts)}`;
}

export function checkState(state: string | undefined): boolean {
  if (!state) return false;
  const [ts, sig] = state.split(".");
  if (!ts || !sig) return false;
  if (Date.now() - Number(ts) > 15 * 60_000) return false;
  const want = signState(ts);
  return want.length === sig.length && timingSafeEqual(Buffer.from(want), Buffer.from(sig));
}

export function authUrl(): string {
  const p = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: makeState(),
  });
  return `${AUTH_URL}?${p.toString()}`;
}

async function tokenRequest(form: Record<string, string>): Promise<Record<string, any>> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form).toString(),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok) throw new Error(`Google token endpoint answered ${res.status}: ${body.error_description ?? body.error ?? ""}`);
  return body;
}

export async function connectWithCode(code: string): Promise<{ email: string }> {
  const tok = await tokenRequest({
    code,
    client_id: ENV.googleClientId,
    client_secret: ENV.googleClientSecret,
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
  });
  if (!tok.refresh_token) throw new Error("Google did not return a refresh token. Remove the app's access at myaccount.google.com/permissions and connect again.");
  const profile = await apiGet<{ emailAddress: string }>("/profile", tok.access_token);
  const email = String(profile.emailAddress ?? "").toLowerCase();
  await setSetting(SETTING, { refreshToken: tok.refresh_token, email, connectedAt: new Date().toISOString(), lastError: null } satisfies GmailSetting);
  accessCache = { token: tok.access_token, expiresAt: Date.now() + Number(tok.expires_in ?? 3000) * 1000 - 60_000 };
  return { email };
}

export async function disconnect(): Promise<void> {
  const s = await getSetting<GmailSetting>(SETTING);
  if (s?.refreshToken) {
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(s.refreshToken)}`, { method: "POST" }).catch(() => undefined);
  }
  await deleteSetting(SETTING);
  accessCache = null;
}

let accessCache: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (accessCache && accessCache.expiresAt > Date.now()) return accessCache.token;
  const s = await getSetting<GmailSetting>(SETTING);
  if (!s?.refreshToken) throw new Error("Gmail is not connected");
  const tok = await tokenRequest({
    refresh_token: s.refreshToken,
    client_id: ENV.googleClientId,
    client_secret: ENV.googleClientSecret,
    grant_type: "refresh_token",
  });
  accessCache = { token: tok.access_token, expiresAt: Date.now() + Number(tok.expires_in ?? 3000) * 1000 - 60_000 };
  return tok.access_token;
}

async function apiGet<T>(path: string, token?: string): Promise<T> {
  const t = token ?? (await accessToken());
  const res = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${t}` } });
  if (res.status === 429) {
    await new Promise(r => setTimeout(r, 1500));
    const again = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${t}` } });
    if (!again.ok) throw new Error(`Gmail ${path.split("?")[0]} answered ${again.status}`);
    return (await again.json()) as T;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gmail ${path.split("?")[0]} answered ${res.status}${text ? ": " + text.slice(0, 160) : ""}`);
  }
  return (await res.json()) as T;
}

export async function gmailStatus(): Promise<{ configured: boolean; connected: boolean; email: string | null; connectedAt: string | null; lastSyncAt: string | null; lastError: string | null; lastCounts: SyncCounts | null; redirectUri: string }> {
  const s = await getSetting<GmailSetting>(SETTING).catch(() => null);
  return {
    configured: gmailConfigured(),
    connected: Boolean(s?.refreshToken),
    email: s?.email ?? null,
    connectedAt: s?.connectedAt ?? null,
    lastSyncAt: s?.lastSyncAt ?? null,
    lastError: s?.lastError ?? null,
    lastCounts: s?.lastCounts ?? null,
    redirectUri: redirectUri(),
  };
}

// ─── Messages ───────────────────────────────────────────────────────────────

type GmailMessage = {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: { headers?: { name: string; value: string }[]; mimeType?: string; body?: { data?: string }; parts?: any[] };
};

const header = (m: GmailMessage, name: string) => m.payload?.headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

/** Every address in a From/To/Cc header, lowercased. */
export function addressesIn(value: string): string[] {
  const out: string[] = [];
  const re = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value))) out.push(m[0].toLowerCase());
  return out;
}

export type Classified = { kind: "sent" | "reply" | "auto"; email: string } | null;

/**
 * Which side a message belongs to. `mine` holds Marin's own addresses;
 * `contact` is the person the search was for.
 */
export function classify(m: GmailMessage, contact: string, mine: Set<string>): Classified {
  const from = addressesIn(header(m, "From"))[0] ?? "";
  const to = new Set([...addressesIn(header(m, "To")), ...addressesIn(header(m, "Cc"))]);
  const sentByMe = (m.labelIds ?? []).includes("SENT") || mine.has(from);
  if (sentByMe) {
    if (!to.has(contact)) return null;
    return { kind: header(m, "List-Unsubscribe") ? "auto" : "sent", email: contact };
  }
  if (from === contact) return { kind: "reply", email: contact };
  return null;
}

function decodeBody(data?: string): string {
  if (!data) return "";
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

/** Plain text of a full message: text parts first, HTML stripped as a fallback. */
export function messageText(m: GmailMessage): string {
  const texts: string[] = [];
  const htmls: string[] = [];
  const walk = (part: any) => {
    if (!part) return;
    const mime = String(part.mimeType ?? "");
    if (part.body?.data) {
      if (mime.startsWith("text/plain")) texts.push(decodeBody(part.body.data));
      else if (mime.startsWith("text/html")) htmls.push(decodeBody(part.body.data));
    }
    for (const p of part.parts ?? []) walk(p);
  };
  walk(m.payload);
  if (texts.length) return texts.join("\n");
  return htmls.join("\n").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
}

const PURCHASE_WORDS = /purchas|payment|paid|order|receipt|bought|sold|subscri|checkout/i;

// ─── Sync ───────────────────────────────────────────────────────────────────

/** Every contact the site knows, lowercased, test addresses and Marin's own left out. */
export async function contactAddresses(exclude: Set<string>): Promise<string[]> {
  const d = await getDb();
  if (!d) return [];
  const rows = (await d.execute(sql`
    SELECT DISTINCT lower(email) AS email FROM (
      SELECT email FROM leads
      UNION ALL SELECT email FROM assessment_progress
      UNION ALL SELECT email FROM assessment_reports
      UNION ALL SELECT email FROM applications
    ) t WHERE email IS NOT NULL AND email <> ''`)) as any;
  return ((rows.rows ?? rows) as { email: string }[])
    .map(r => String(r.email))
    .filter(e => e.includes("@") && !isTestEmail(e) && !exclude.has(e));
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}

const TIME_BUDGET_MS = 150_000;

/**
 * Reads new mail for every contact. Incremental after the first run (two
 * days of overlap, duplicates are dropped by message id). Stops early if the
 * time budget runs out and leaves lastSyncAt alone so the next run continues.
 */
export async function syncGmail(options: { full?: boolean } = {}): Promise<SyncCounts> {
  const started = Date.now();
  const s = await getSetting<GmailSetting>(SETTING);
  if (!s?.refreshToken) throw new Error("Gmail is not connected");
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  await patchSetting(SETTING, { lastSyncStartedAt: new Date().toISOString() });

  const mine = new Set([s.email, ENV.ownerEmail.toLowerCase()].filter(Boolean));
  const contacts = await contactAddresses(mine);
  const since = !options.full && s.lastSyncAt ? Math.floor((Date.parse(s.lastSyncAt) - 2 * 86_400_000) / 1000) : null;
  const afterClause = since ? ` after:${since}` : "";

  const known = new Set(
    ((await d.select({ id: conversationEvents.externalId }).from(conversationEvents).where(eq(conversationEvents.origin, "gmail"))) as { id: string | null }[])
      .map(r => r.id)
      .filter((x): x is string => Boolean(x))
  );

  const counts: SyncCounts = { contacts: contacts.length, listed: 0, added: 0, purchases: 0, skipped: 0, partial: false, seconds: 0 };
  const touched = new Set<string>();
  const inserts: (typeof conversationEvents.$inferInsert)[] = [];

  const listIds = async (q: string): Promise<string[]> => {
    const ids: string[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < 5; page++) {
      const res = await apiGet<{ messages?: { id: string }[]; nextPageToken?: string }>(`/messages?q=${encodeURIComponent(q)}&maxResults=100${pageToken ? `&pageToken=${pageToken}` : ""}`);
      for (const m of res.messages ?? []) ids.push(m.id);
      pageToken = res.nextPageToken;
      if (!pageToken) break;
    }
    return ids;
  };

  const meta = (id: string) =>
    apiGet<GmailMessage>(`/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=List-Unsubscribe`);

  // 1. Mail between Marin and each contact.
  for (const contact of contacts) {
    if (Date.now() - started > TIME_BUDGET_MS) {
      counts.partial = true;
      break;
    }
    let ids: string[] = [];
    try {
      ids = await listIds(`(from:${contact} OR to:${contact})${afterClause}`);
    } catch (err) {
      console.warn("[Gmail] list failed for a contact:", (err as Error).message);
      counts.skipped++;
      continue;
    }
    counts.listed += ids.length;
    const fresh = ids.filter(id => !known.has(id));
    const messages = await mapLimit(fresh, 4, async id => {
      try {
        return await meta(id);
      } catch (err) {
        console.warn("[Gmail] get failed:", (err as Error).message);
        return null;
      }
    });
    for (const m of messages) {
      if (!m) continue;
      const c = classify(m, contact, mine);
      if (!c) continue;
      known.add(m.id);
      touched.add(contact);
      inserts.push({
        email: contact,
        kind: c.kind,
        channel: "email",
        at: new Date(Number(m.internalDate ?? Date.now())),
        subject: header(m, "Subject").slice(0, 300) || null,
        snippet: (m.snippet ?? "").slice(0, 600) || null,
        origin: "gmail",
        externalId: m.id,
        threadId: m.threadId,
      });
    }
  }

  // 2. Purchase notices from Bridge Athletic that name a contact.
  if (!counts.partial) {
    try {
      const contactSet = new Set(contacts);
      const ids = (await listIds(`from:bridgeathletic.com${afterClause}`)).filter(id => !known.has(id));
      const full = await mapLimit(ids, 4, async id => {
        try {
          return await apiGet<GmailMessage>(`/messages/${id}?format=full`);
        } catch {
          return null;
        }
      });
      for (const m of full) {
        if (!m) continue;
        const subject = header(m, "Subject");
        const text = `${subject}\n${messageText(m)}`;
        if (!PURCHASE_WORDS.test(text)) continue;
        for (const addr of Array.from(new Set(addressesIn(text)))) {
          if (!contactSet.has(addr)) continue;
          known.add(`${m.id}:${addr}`);
          touched.add(addr);
          counts.purchases++;
          inserts.push({
            email: addr,
            kind: "purchase",
            channel: "email",
            at: new Date(Number(m.internalDate ?? Date.now())),
            subject: subject.slice(0, 300) || null,
            snippet: (m.snippet ?? "").slice(0, 600) || null,
            origin: "gmail",
            externalId: `${m.id}:${addr}`,
            threadId: m.threadId,
          });
        }
      }
    } catch (err) {
      console.warn("[Gmail] Bridge purchase scan failed:", (err as Error).message);
    }
  }

  // 3. Store, then drop the one off import rows for contacts Gmail now covers.
  for (let i = 0; i < inserts.length; i += 200) {
    await d.insert(conversationEvents).values(inserts.slice(i, i + 200)).onConflictDoNothing();
  }
  counts.added = inserts.length;
  if (touched.size) {
    await d.delete(conversationEvents).where(and(eq(conversationEvents.origin, "import"), inArray(conversationEvents.email, Array.from(touched))));
  }

  counts.seconds = Math.round((Date.now() - started) / 1000);
  await patchSetting(SETTING, {
    lastCounts: counts,
    lastError: null,
    ...(counts.partial ? {} : { lastSyncAt: new Date().toISOString() }),
  });
  return counts;
}

export async function recordSyncError(err: unknown): Promise<void> {
  await patchSetting(SETTING, { lastError: String((err as Error)?.message ?? err).slice(0, 300) }).catch(() => undefined);
}

// ─── Routes ─────────────────────────────────────────────────────────────────

async function isAdmin(req: Request): Promise<boolean> {
  try {
    const user = await sdk.authenticateRequest(req);
    return user?.role === "admin";
  } catch {
    return false;
  }
}

export function registerGmailRoutes(app: Express) {
  // Starts the Google sign in. Only the logged in admin can reach it.
  app.get("/api/gmail/connect", async (req: Request, res: Response) => {
    if (!(await isAdmin(req))) {
      res.redirect("/admin");
      return;
    }
    if (!gmailConfigured()) {
      res.redirect("/admin/system?gmail=not-configured");
      return;
    }
    res.redirect(authUrl());
  });

  // Google sends the code back here.
  app.get("/api/gmail/callback", async (req: Request, res: Response) => {
    if (!(await isAdmin(req))) {
      res.redirect("/admin");
      return;
    }
    const { code, state, error } = req.query as Record<string, string | undefined>;
    if (error) {
      res.redirect(`/admin/system?gmail=${encodeURIComponent(error)}`);
      return;
    }
    if (!code || !checkState(state)) {
      res.redirect("/admin/system?gmail=bad-state");
      return;
    }
    try {
      await connectWithCode(code);
      res.redirect("/admin/system?gmail=connected");
    } catch (err) {
      console.error("[Gmail] Connect failed:", err);
      res.redirect(`/admin/system?gmail=${encodeURIComponent(String((err as Error)?.message ?? "failed").slice(0, 120))}`);
    }
  });
}
