import { useCallback } from "react";
import { nanoid } from "nanoid";
import { trpc } from "@/lib/trpc";
import { getAttribution, sanitizePath, sanitizeReferrer } from "@/lib/attribution";

const SESSION_STORAGE_KEY = "ml_session";
const DEDUPE_WINDOW_MS = 2_000;
const MAX_EVENT_DATA_LENGTH = 20_000;
const MAX_EVENT_VALUE_LENGTH = 500;
const MAX_EVENT_KEYS = 30;

const recentlyTracked = new Map<string, number>();

type EventData = Record<string, unknown>;

type TrackOptions = {
  /** A query-free route path. Defaults to the current browser pathname. */
  path?: string;
  /** An explicit HTTP(S) referrer. It is sanitised before being sent. */
  referrer?: string;
};

function getSessionId(): string {
  // This function is called only from a tracking effect or interaction handler,
  // never while React is rendering (including SSR).
  if (typeof window === "undefined") return "";

  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing.slice(0, 100);

    const sessionId = nanoid(16);
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    return sessionId;
  } catch {
    // Storage may be unavailable in private/embedded contexts. A generated ID
    // still scopes events from this interaction without rendering side effects.
    return nanoid(16);
  }
}

function isSensitiveKey(key: string): boolean {
  return /(email|e-mail|name|person)/i.test(key);
}

function containsEmail(value: string): boolean {
  return /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(value);
}

function sanitizeEventValue(value: unknown, depth = 0): unknown {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    return containsEmail(value) ? undefined : value.slice(0, MAX_EVENT_VALUE_LENGTH);
  }
  if (depth >= 2) return undefined;

  if (Array.isArray(value)) {
    return value
      .slice(0, 10)
      .map(item => sanitizeEventValue(item, depth + 1))
      .filter((item): item is Exclude<typeof item, undefined> => item !== undefined);
  }

  if (!value || typeof value !== "object") return undefined;

  const safeObject: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value).slice(0, 10)) {
    if (isSensitiveKey(key)) continue;
    const sanitized = sanitizeEventValue(nestedValue, depth + 1);
    if (sanitized !== undefined) safeObject[key] = sanitized;
  }
  return safeObject;
}

/** Removes person-name and email fields from caller-supplied event metadata. */
function sanitizeEventData(eventData?: EventData): EventData {
  if (!eventData) return {};

  const safeEventData: EventData = {};
  for (const [key, value] of Object.entries(eventData).slice(0, MAX_EVENT_KEYS)) {
    if (isSensitiveKey(key)) continue;
    const sanitized = sanitizeEventValue(value);
    if (sanitized !== undefined) safeEventData[key] = sanitized;
  }
  return safeEventData;
}

function pruneRecentEvents(now: number): void {
  for (const [key, trackedAt] of Array.from(recentlyTracked.entries())) {
    if (now - trackedAt >= DEDUPE_WINDOW_MS) recentlyTracked.delete(key);
  }
}

/**
 * Analytics hook that fires tracking events silently. Session storage and the
 * document are accessed lazily only from tracking effects or event handlers.
 */
export function useAnalytics() {
  const trackMutation = trpc.analytics.track.useMutation({
    onError: () => {
      // Analytics must never disrupt the user experience.
    },
    retry: false,
  });

  const track = useCallback(
    (eventType: string, eventData?: EventData, options?: TrackOptions) => {
      try {
        const attribution = getAttribution();
        const path = sanitizePath(
          options?.path ?? (typeof window !== "undefined" ? window.location.pathname : "/")
        );
        const referrer = options?.referrer === undefined
          ? attribution.referrer
          : sanitizeReferrer(options.referrer);

        // Attribution is spread after user data so callers cannot overwrite the
        // session's first touch values. `path` records only the current pathname.
        const payload = {
          ...sanitizeEventData(eventData),
          ...attribution,
          path,
          referrer,
        };
        const serializedEventData = JSON.stringify(payload);
        if (serializedEventData.length > MAX_EVENT_DATA_LENGTH) return;

        const sessionId = getSessionId();
        const now = Date.now();
        const key = `${sessionId}:${eventType}:${serializedEventData}`;
        pruneRecentEvents(now);
        if ((recentlyTracked.get(key) ?? 0) > now - DEDUPE_WINDOW_MS) return;
        recentlyTracked.set(key, now);

        trackMutation.mutate({
          eventType: eventType.slice(0, 100),
          eventData: serializedEventData,
          sessionId: sessionId || undefined,
          // Sending an explicit empty string records direct traffic and prevents
          // the server from substituting an internal request Referer.
          referrer,
        });
      } catch {
        // Swallow synchronous analytics failures.
      }
    },
    [trackMutation]
  );

  return { track };
}
