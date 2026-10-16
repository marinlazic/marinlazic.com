/**
 * Kit (ConvertKit) v4 API integration module.
 * All calls are async/non-blocking and use a retry queue for reliability.
 */
import { ENV } from "./_core/env";

const KIT_BASE = "https://api.kit.com/v4";

// Known tag IDs (looked up from the account)
const TAG_IDS = {
  "assessment-completed": 20240106,
  "application-submitted": 20240217,
} as const;

// Retry queue stored in memory (acceptable for single-process deploy)
interface QueuedJob {
  id: string;
  fn: () => Promise<void>;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  createdAt: number;
}

const retryQueue: QueuedJob[] = [];
let processingInterval: ReturnType<typeof setInterval> | null = null;

function startQueueProcessor() {
  if (processingInterval) return;
  processingInterval = setInterval(processQueue, 10_000); // check every 10s
}

async function processQueue() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (let i = retryQueue.length - 1; i >= 0; i--) {
    const job = retryQueue[i];

    // Remove jobs older than 24 hours
    if (now - job.createdAt > maxAge) {
      console.error(`[Kit] Job ${job.id} expired after 24 hours, removing.`);
      retryQueue.splice(i, 1);
      continue;
    }

    // Skip if not ready for retry
    if (now < job.nextRetryAt) continue;

    try {
      await job.fn();
      retryQueue.splice(i, 1); // success, remove
    } catch (err) {
      job.attempts++;
      if (job.attempts >= job.maxAttempts) {
        console.error(`[Kit] Job ${job.id} failed after ${job.attempts} attempts:`, err);
        retryQueue.splice(i, 1);
      } else {
        // Exponential backoff: 10s, 20s, 40s, 80s, 160s...
        const backoff = Math.min(10_000 * Math.pow(2, job.attempts), 600_000);
        job.nextRetryAt = now + backoff;
        console.warn(`[Kit] Job ${job.id} failed (attempt ${job.attempts}), retrying in ${backoff / 1000}s`);
      }
    }
  }

  // Stop processor if queue is empty
  if (retryQueue.length === 0 && processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
  }
}

function enqueue(id: string, fn: () => Promise<void>) {
  retryQueue.push({
    id,
    fn,
    attempts: 0,
    maxAttempts: 10,
    nextRetryAt: 0,
    createdAt: Date.now(),
  });
  startQueueProcessor();
}

// ─── API Helpers ────────────────────────────────────────────────────────────

function kitHeaders() {
  return {
    "X-Kit-Api-Key": ENV.kitApiKey,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

async function kitFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${KIT_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...kitHeaders(), ...(options.headers || {}) },
  });

  if (res.status === 429) {
    throw new Error(`Kit rate limited: ${res.status}`);
  }
  if (res.status >= 500) {
    throw new Error(`Kit server error: ${res.status}`);
  }

  return res;
}

// ─── Tag Management ─────────────────────────────────────────────────────────

let assessmentStartedTagId: number | null = null;

async function getOrCreateTag(name: string): Promise<number> {
  // Check if it is a known tag
  if (name in TAG_IDS) {
    return TAG_IDS[name as keyof typeof TAG_IDS];
  }

  // For assessment-started, cache the ID after first lookup/create
  if (name === "assessment-started" && assessmentStartedTagId) {
    return assessmentStartedTagId;
  }

  // Search existing tags
  const listRes = await kitFetch("/tags?per_page=100");
  if (listRes.ok) {
    const data = await listRes.json();
    const existing = data.tags?.find((t: any) => t.name === name);
    if (existing) {
      if (name === "assessment-started") assessmentStartedTagId = existing.id;
      return existing.id;
    }
  }

  // Create the tag
  const createRes = await kitFetch("/tags", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create tag "${name}": ${createRes.status}`);
  }

  const created = await createRes.json();
  const tagId = created.tag?.id;
  if (name === "assessment-started") assessmentStartedTagId = tagId;
  return tagId;
}

// ─── Custom Fields ──────────────────────────────────────────────────────────

const customFieldCache: Record<string, boolean> = {};

async function ensureCustomField(label: string): Promise<void> {
  if (customFieldCache[label]) return;

  // Check if exists
  const listRes = await kitFetch("/custom_fields?per_page=100");
  if (listRes.ok) {
    const data = await listRes.json();
    const existing = data.custom_fields?.find((f: any) => f.label === label);
    if (existing) {
      customFieldCache[label] = true;
      return;
    }
  }

  // Create it
  const createRes = await kitFetch("/custom_fields", {
    method: "POST",
    body: JSON.stringify({ label }),
  });

  if (createRes.ok) {
    customFieldCache[label] = true;
  } else {
    const text = await createRes.text();
    // If 422 it likely already exists (race condition)
    if (createRes.status === 422) {
      customFieldCache[label] = true;
    } else {
      throw new Error(`Failed to create custom field "${label}": ${createRes.status} ${text}`);
    }
  }
}

// ─── Subscriber Management ──────────────────────────────────────────────────

async function createOrUpdateSubscriber(email: string, firstName?: string): Promise<number> {
  const body: any = { email_address: email };
  if (firstName) body.first_name = firstName;

  const res = await kitFetch("/subscribers", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to create/update subscriber: ${res.status}`);
  }

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
  // Ensure all custom fields exist first
  for (const label of Object.keys(fields)) {
    await ensureCustomField(label);
  }

  // Update subscriber with custom fields
  const res = await kitFetch(`/subscribers/${subscriberId}`, {
    method: "PUT",
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    throw new Error(`Failed to set custom fields: ${res.status}`);
  }
}

// ─── Public API (fire-and-forget with retry) ────────────────────────────────

/**
 * Called when user enters their email at assessment question 2.
 * Creates/updates subscriber and adds "assessment-started" tag.
 */
export function kitOnEmailCapture(email: string, firstName?: string) {
  if (!ENV.kitApiKey) return;

  const jobId = `email-capture-${email}-${Date.now()}`;
  enqueue(jobId, async () => {
    const subscriberId = await createOrUpdateSubscriber(email, firstName);
    const tagId = await getOrCreateTag("assessment-started");
    await tagSubscriber(subscriberId, tagId);
    console.log(`[Kit] Email capture: ${email} tagged assessment-started`);
  });
}

/**
 * Called when user completes the assessment.
 * Adds "assessment-completed" tag and writes custom fields.
 */
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
  if (!ENV.kitApiKey) return;

  const jobId = `assessment-complete-${email}-${Date.now()}`;
  enqueue(jobId, async () => {
    const subscriberId = await createOrUpdateSubscriber(email);
    const tagId = TAG_IDS["assessment-completed"];
    await tagSubscriber(subscriberId, tagId);

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

    await setCustomFields(subscriberId, fields);
    console.log(`[Kit] Assessment complete: ${email} tagged + fields set`);
  });
}

/**
 * Called when user submits the /apply coaching application form.
 * Adds "application-submitted" tag.
 */
export function kitOnApplicationSubmit(email: string) {
  if (!ENV.kitApiKey) return;

  const jobId = `application-submit-${email}-${Date.now()}`;
  enqueue(jobId, async () => {
    const subscriberId = await createOrUpdateSubscriber(email);
    const tagId = TAG_IDS["application-submitted"];
    await tagSubscriber(subscriberId, tagId);
    console.log(`[Kit] Application submitted: ${email} tagged application-submitted`);
  });
}

/**
 * Get current queue status for debugging.
 */
export function getKitQueueStatus() {
  return {
    queueLength: retryQueue.length,
    jobs: retryQueue.map((j) => ({
      id: j.id,
      attempts: j.attempts,
      nextRetryAt: new Date(j.nextRetryAt).toISOString(),
    })),
  };
}
