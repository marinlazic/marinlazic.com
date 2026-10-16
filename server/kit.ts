/**
 * Kit (ConvertKit) v4 API integration.
 *
 * Calls run inside the request with a short retry, and on Vercel they are
 * registered with waitUntil so the function stays alive until they finish.
 * A background interval would never fire on a serverless host.
 */
import { waitUntil } from "@vercel/functions";
import { ENV } from "./_core/env";

const KIT_BASE = "https://api.kit.com/v4";

// Tag IDs already known in the account. Anything else is looked up by name.
const KNOWN_TAG_IDS: Record<string, number> = {
  "assessment-completed": 20240106,
  "application-submitted": 20240217,
};

export const KIT_TAGS = {
  assessmentStarted: "assessment-started",
  assessmentCompleted: "assessment-completed",
  assessmentAbandoned: "assessment-abandoned",
  applicationSubmitted: "application-submitted",
  purchased: "purchased",
  enquiry: "enquiry",
  corporateEnquiry: "corporate_enquiry",
} as const;

// ─── Background execution ───────────────────────────────────────────────────

const pending = new Set<Promise<void>>();

function runInBackground(id: string, fn: () => Promise<void>, attempts = 3) {
  const job = (async () => {
    let delay = 1000;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await fn();
        return;
      } catch (err) {
        if (attempt === attempts) {
          console.error(`[Kit] Job ${id} failed after ${attempts} attempts:`, err);
          return;
        }
        console.warn(`[Kit] Job ${id} failed (attempt ${attempt}), retrying in ${delay / 1000}s`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 3;
      }
    }
  })();
  pending.add(job);
  job.finally(() => pending.delete(job));
  try {
    waitUntil(job);
  } catch {
    // Not on Vercel: the promise simply runs in the long lived process.
  }
}

/** Awaits any Kit work still running. Used by tests and the local server. */
export async function flushKit(): Promise<void> {
  await Promise.allSettled(Array.from(pending));
}

// ─── API Helpers ────────────────────────────────────────────────────────────

function kitHeaders() {
  return {
    "X-Kit-Api-Key": ENV.kitApiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function kitFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${KIT_BASE}${path}`, {
    ...options,
    headers: { ...kitHeaders(), ...(options.headers || {}) },
  });
  if (res.status === 429) throw new Error(`Kit rate limited: ${res.status}`);
  if (res.status >= 500) throw new Error(`Kit server error: ${res.status}`);
  return res;
}

// ─── Tags ───────────────────────────────────────────────────────────────────

const tagIdCache: Record<string, number> = { ...KNOWN_TAG_IDS };

async function getOrCreateTag(name: string): Promise<number> {
  if (tagIdCache[name]) return tagIdCache[name];

  const listRes = await kitFetch("/tags?per_page=500");
  if (listRes.ok) {
    const data = await listRes.json();
    const existing = data.tags?.find((t: any) => t.name === name);
    if (existing) {
      tagIdCache[name] = existing.id;
      return existing.id;
    }
  }

  const createRes = await kitFetch("/tags", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  if (!createRes.ok) {
    throw new Error(`Failed to create tag "${name}": ${createRes.status}`);
  }
  const created = await createRes.json();
  const tagId = created.tag?.id;
  if (!tagId) throw new Error(`Tag "${name}" was created without an id`);
  tagIdCache[name] = tagId;
  return tagId;
}

// ─── Custom fields ──────────────────────────────────────────────────────────

const customFieldCache: Record<string, boolean> = {};

async function ensureCustomField(label: string): Promise<void> {
  if (customFieldCache[label]) return;

  const listRes = await kitFetch("/custom_fields?per_page=500");
  if (listRes.ok) {
    const data = await listRes.json();
    const existing = data.custom_fields?.find((f: any) => f.label === label);
    if (existing) {
      customFieldCache[label] = true;
      return;
    }
  }

  const createRes = await kitFetch("/custom_fields", {
    method: "POST",
    body: JSON.stringify({ label }),
  });
  if (createRes.ok || createRes.status === 422) {
    customFieldCache[label] = true;
  } else {
    const text = await createRes.text();
    throw new Error(`Failed to create custom field "${label}": ${createRes.status} ${text}`);
  }
}

// ─── Subscribers ────────────────────────────────────────────────────────────

async function createOrUpdateSubscriber(email: string, firstName?: string): Promise<number> {
  const body: Record<string, string> = { email_address: email };
  if (firstName) body.first_name = firstName;

  const res = await kitFetch("/subscribers", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create/update subscriber: ${res.status}`);
  const data = await res.json();
  return data.subscriber?.id;
}

async function tagSubscriber(subscriberId: number, tagId: number): Promise<void> {
  const res = await kitFetch(`/tags/${tagId}/subscribers`, {
    method: "POST",
    body: JSON.stringify({ id: subscriberId }),
  });
  if (!res.ok && res.status !== 422) {
    throw new Error(`Failed to tag subscriber: ${res.status}`);
  }
}

async function setCustomFields(subscriberId: number, fields: Record<string, string>): Promise<void> {
  for (const label of Object.keys(fields)) await ensureCustomField(label);
  const res = await kitFetch(`/subscribers/${subscriberId}`, {
    method: "PUT",
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Failed to set custom fields: ${res.status}`);
}

async function tagByName(email: string, tag: string, firstName?: string, fields?: Record<string, string>) {
  const subscriberId = await createOrUpdateSubscriber(email, firstName);
  const tagId = await getOrCreateTag(tag);
  await tagSubscriber(subscriberId, tagId);
  if (fields && Object.keys(fields).length > 0) await setCustomFields(subscriberId, fields);
  console.log(`[Kit] ${tag}: subscriber ${subscriberId}`);
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Assessment email captured: subscriber created, tagged assessment-started. */
export function kitOnEmailCapture(email: string, firstName?: string) {
  if (!ENV.kitApiKey || !email) return;
  runInBackground(`email-capture-${email}`, () =>
    tagByName(email, KIT_TAGS.assessmentStarted, firstName)
  );
}

/** Assessment completed: tag plus score fields. */
export function kitOnAssessmentComplete(
  email: string,
  data: {
    score: number;
    weakestArea: string;
    strongestArea: string;
    primaryGoal?: string;
    role?: string;
    commitmentLevel?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }
) {
  if (!ENV.kitApiKey || !email) return;
  const fields: Record<string, string> = {
    score: String(data.score),
    weakest_area: data.weakestArea,
    strongest_area: data.strongestArea,
  };
  if (data.primaryGoal) fields.primary_goal = data.primaryGoal;
  if (data.role) fields.role = data.role;
  if (data.commitmentLevel) fields.commitment_level = data.commitmentLevel;
  if (data.utmSource) fields.utm_source = data.utmSource;
  if (data.utmMedium) fields.utm_medium = data.utmMedium;
  if (data.utmCampaign) fields.utm_campaign = data.utmCampaign;
  runInBackground(`assessment-complete-${email}`, () =>
    tagByName(email, KIT_TAGS.assessmentCompleted, undefined, fields)
  );
}

/** Coaching application submitted. */
export function kitOnApplicationSubmit(email: string, firstName?: string) {
  if (!ENV.kitApiKey || !email) return;
  runInBackground(`application-submit-${email}`, () =>
    tagByName(email, KIT_TAGS.applicationSubmitted, firstName)
  );
}

/** Stripe purchase completed. Tags purchased and records what was bought. */
export function kitOnPurchase(
  email: string,
  data: { product: string; amount: string; date: string; firstName?: string }
) {
  if (!ENV.kitApiKey || !email) return;
  runInBackground(`purchase-${email}`, () =>
    tagByName(email, KIT_TAGS.purchased, data.firstName, {
      purchase_product: data.product,
      purchase_amount: data.amount,
      purchase_date: data.date,
    })
  );
}

/** Home page enquiry form. Corporate enquiries get a second tag. */
export function kitOnEnquiry(email: string, firstName?: string, corporate = false) {
  if (!ENV.kitApiKey || !email) return;
  runInBackground(`enquiry-${email}`, async () => {
    await tagByName(email, KIT_TAGS.enquiry, firstName);
    if (corporate) await tagByName(email, KIT_TAGS.corporateEnquiry, firstName);
  });
}

/** Abandoned assessment reminder sent. Awaited by the scheduled job. */
export async function kitOnAssessmentAbandoned(email: string, firstName?: string) {
  if (!ENV.kitApiKey || !email) return;
  await tagByName(email, KIT_TAGS.assessmentAbandoned, firstName);
}
