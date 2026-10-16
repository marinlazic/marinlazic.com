const ATTRIBUTION_STORAGE_KEY = "ml_attribution";
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

const MAX_LANDING_PATH_LENGTH = 512;
const MAX_REFERRER_LENGTH = 2048;
const MAX_CAMPAIGN_VALUE_LENGTH = 200;

export type CampaignParameter = (typeof UTM_KEYS)[number];

export type Attribution = {
  landingPath: string;
  /** An external, query-free origin and pathname, or an explicit empty string for direct traffic. */
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

let memoryAttribution: Attribution | undefined;

function canUseBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.location !== "undefined";
}

function getSessionStorage(): Storage | undefined {
  if (!canUseBrowser()) return undefined;

  try {
    return window.sessionStorage;
  } catch {
    // Storage can be disabled or unavailable in embedded/private contexts.
    return undefined;
  }
}

function clip(value: string, maxLength: number): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength);
}

function isEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function cleanCampaignValue(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  const cleaned = clip(value, MAX_CAMPAIGN_VALUE_LENGTH);
  // Do not allow a campaign parameter to become an email collection channel.
  return cleaned && !isEmailAddress(cleaned) ? cleaned : undefined;
}

/**
 * Returns a query-free pathname suitable for analytics. It intentionally never
 * returns the current URL's search parameters or hash.
 */
export function sanitizePath(value: string | null | undefined): string {
  if (!value) return "/";

  const rawValue = String(value).trim();
  let pathname = rawValue;

  try {
    if (/^https?:\/\//i.test(rawValue)) {
      pathname = new URL(rawValue).pathname;
    }
  } catch {
    // Fall through to a conservative path-only value below.
  }

  pathname = pathname.split(/[?#]/, 1)[0].replace(/[\u0000-\u001f\u007f]/g, "");
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;

  return pathname.slice(0, MAX_LANDING_PATH_LENGTH) || "/";
}

/**
 * Keeps only an HTTP(S) referrer's origin and pathname. Credentials, query
 * parameters and fragments are never retained.
 */
export function sanitizeReferrer(value: string | null | undefined): string {
  if (!value) return "";

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";

    return `${url.origin}${url.pathname}`.slice(0, MAX_REFERRER_LENGTH);
  } catch {
    return "";
  }
}

function getInitialExternalReferrer(): string {
  if (!canUseBrowser()) return "";

  const referrer = window.document?.referrer || "";
  if (!referrer) return "";

  try {
    const referrerUrl = new URL(referrer);
    // A same-site navigation is not an acquisition referrer. Preserve an
    // explicit empty value instead of falling back to an internal API header.
    if (referrerUrl.origin === window.location.origin) return "";
  } catch {
    return "";
  }

  return sanitizeReferrer(referrer);
}

function normalizeStoredAttribution(value: unknown): Attribution | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const candidate = value as Record<string, unknown>;
  const landingPath = sanitizePath(
    typeof candidate.landingPath === "string" ? candidate.landingPath : "/"
  );
  const referrer = sanitizeReferrer(
    typeof candidate.referrer === "string" ? candidate.referrer : ""
  );
  const attribution: Attribution = { landingPath, referrer };

  for (const key of UTM_KEYS) {
    const campaignValue = cleanCampaignValue(
      typeof candidate[key] === "string" ? candidate[key] : undefined
    );
    if (campaignValue) attribution[key] = campaignValue;
  }

  return attribution;
}

function readStoredAttribution(): Attribution | undefined {
  const storage = getSessionStorage();
  if (!storage) return undefined;

  try {
    const serialized = storage.getItem(ATTRIBUTION_STORAGE_KEY);
    return serialized ? normalizeStoredAttribution(JSON.parse(serialized)) : undefined;
  } catch {
    return undefined;
  }
}

function createInitialAttribution(): Attribution {
  const attribution: Attribution = {
    landingPath: canUseBrowser() ? sanitizePath(window.location.pathname) : "/",
    referrer: getInitialExternalReferrer(),
  };

  if (!canUseBrowser()) return attribution;

  const search = new URLSearchParams(window.location.search);
  for (const key of UTM_KEYS) {
    const campaignValue = cleanCampaignValue(search.get(key));
    if (campaignValue) attribution[key] = campaignValue;
  }

  return attribution;
}

function persistAttribution(attribution: Attribution): void {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Attribution remains available in memory for this page lifetime.
  }
}

/**
 * Gets the first-touch attribution for this browser session. This function is
 * SSR-safe; invoke it from an effect or an interaction handler when browser
 * storage is needed.
 */
export function getAttribution(): Attribution {
  // Do not cache a synthetic SSR value in the module: a server process can
  // serve multiple visitors, while browser first-touch state is per session.
  if (!canUseBrowser()) return createInitialAttribution();
  if (memoryAttribution) return memoryAttribution;

  const stored = readStoredAttribution();
  memoryAttribution = stored ?? createInitialAttribution();
  if (!stored) persistAttribution(memoryAttribution);

  return memoryAttribution;
}

function toCampaignParameter(name: string): CampaignParameter | undefined {
  const normalized = name.startsWith("utm_") ? name : `utm_${name}`;
  return (UTM_KEYS as readonly string[]).includes(normalized)
    ? (normalized as CampaignParameter)
    : undefined;
}

/**
 * Returns a current allowed UTM value when present, otherwise the session's
 * first-touch value. `name` accepts either `source` or `utm_source` forms.
 */
export function getCampaignValue(
  name: string,
  currentSearch?: string | URLSearchParams
): string | undefined {
  const key = toCampaignParameter(name);
  if (!key) return undefined;

  const search = currentSearch instanceof URLSearchParams
    ? currentSearch
    : new URLSearchParams(currentSearch ?? (canUseBrowser() ? window.location.search : ""));
  const currentValue = cleanCampaignValue(search.get(key));

  return currentValue ?? getAttribution()[key];
}
