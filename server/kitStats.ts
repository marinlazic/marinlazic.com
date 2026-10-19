// Read side of Kit (ConvertKit) for the dashboard: subscribers, growth,
// broadcasts, sequences and tag counts. Results are cached for five minutes
// because Kit allows 120 requests a minute and the dashboard polls.
import { ENV } from "./_core/env";
import { KIT_TAGS } from "./kit";

const KIT_BASE = "https://api.kit.com/v4";
const CACHE_MS = 5 * 60_000;

type Json = Record<string, any>;

async function kitGet(path: string): Promise<Json> {
  const res = await fetch(`${KIT_BASE}${path}`, {
    headers: { "X-Kit-Api-Key": ENV.kitApiKey, Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Kit ${path} answered ${res.status}${text ? ": " + text.slice(0, 120) : ""}`);
  }
  return (await res.json()) as Json;
}

const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));

/** Kit puts total_count either at the top level or inside pagination. */
function totalCount(body: Json): number | null {
  const v = body.total_count ?? body.pagination?.total_count;
  return v === undefined || v === null ? null : Number(v);
}

function dateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

export type KitBroadcast = {
  id: number;
  subject: string;
  status: string;
  sentAt: string | null;
  recipients: number;
  openRate: number | null;
  clickRate: number | null;
  opened: number;
  clicks: number;
  unsubscribes: number;
  url: string;
};

export type KitSequence = {
  id: number;
  name: string;
  active: boolean;
  emails: number;
  subscribers: number;
  recipients: number | null;
  openRate: number | null;
  clickRate: number | null;
  unsubscribeRate: number | null;
  url: string;
};

export type KitTagCount = { id: number; name: string; count: number | null; url: string };

export type KitSubscriber = {
  id: number;
  email: string;
  firstName: string | null;
  state: string;
  createdAt: string;
  tags: string[];
  source: string | null;
  url: string;
};

export type KitOverview = {
  configured: boolean;
  error?: string;
  fetchedAt: string;
  account: { name: string | null; plan: string | null; timezone: string | null };
  subscribers: { active: number | null; cancelled: number | null; bounced: number | null };
  growth: { days: number; newSubscribers: number; cancellations: number; net: number; starting: string; ending: string } | null;
  emailStats: {
    sent: number; opened: number; clicked: number;
    openRate: number | null; clickRate: number | null; unsubscribeRate: number | null; bounceRate: number | null;
    openTracking: boolean; clickTracking: boolean; starting: string; ending: string;
  } | null;
  tags: KitTagCount[];
  broadcasts: KitBroadcast[];
  sequences: KitSequence[];
  recentSubscribers: KitSubscriber[];
};

const PIPELINE_ORDER = [
  KIT_TAGS.assessmentStarted,
  KIT_TAGS.assessmentCompleted,
  KIT_TAGS.assessmentAbandoned,
  KIT_TAGS.applicationSubmitted,
  KIT_TAGS.purchased,
  KIT_TAGS.enquiry,
  KIT_TAGS.corporateEnquiry,
] as string[];

async function fetchOverview(days: number): Promise<KitOverview> {
  const fetchedAt = new Date().toISOString();
  const base: KitOverview = {
    configured: true,
    fetchedAt,
    account: { name: null, plan: null, timezone: null },
    subscribers: { active: null, cancelled: null, bounced: null },
    growth: null,
    emailStats: null,
    tags: [],
    broadcasts: [],
    sequences: [],
    recentSubscribers: [],
  };
  const ending = new Date();
  const starting = new Date(ending.getTime() - days * 86_400_000);

  const [account, growth, emailStats, active, cancelled, bounced, tags, broadcasts, broadcastStats, sequences, recent] =
    await Promise.allSettled([
      kitGet("/account"),
      kitGet(`/account/growth_stats?starting=${dateOnly(starting)}&ending=${dateOnly(ending)}`),
      kitGet("/account/email_stats"),
      kitGet("/subscribers?status=active&per_page=1&include_total_count=true&slim=true"),
      kitGet("/subscribers?status=cancelled&per_page=1&include_total_count=true&slim=true"),
      kitGet("/subscribers?status=bounced&per_page=1&include_total_count=true&slim=true"),
      kitGet("/tags?per_page=200"),
      kitGet("/broadcasts?per_page=50&slim=true"),
      kitGet("/broadcasts/stats?per_page=50"),
      kitGet("/sequences?per_page=100&include=stats"),
      kitGet(`/subscribers?status=all&sort_field=created_at&sort_order=desc&per_page=25&include=tags,attribution&created_after=${dateOnly(starting)}`),
    ]);

  const errors: string[] = [];
  const take = <T,>(r: PromiseSettledResult<T>, label: string): T | null => {
    if (r.status === "fulfilled") return r.value;
    errors.push(`${label}: ${String((r.reason as Error)?.message ?? r.reason).slice(0, 140)}`);
    return null;
  };

  const acc = take(account, "account");
  if (acc?.account) {
    base.account = {
      name: acc.account.name ?? null,
      plan: acc.account.plan_type ?? null,
      timezone: acc.account.timezone?.name ?? acc.account.timezone ?? null,
    };
  }
  const g = take(growth, "growth")?.stats;
  if (g) {
    base.growth = {
      days,
      newSubscribers: Number(g.new_subscribers ?? 0),
      cancellations: Number(g.cancellations ?? 0),
      net: Number(g.net_new_subscribers ?? 0),
      starting: String(g.starting ?? ""),
      ending: String(g.ending ?? ""),
    };
  }
  const es = take(emailStats, "email stats")?.stats;
  if (es) {
    base.emailStats = {
      sent: Number(es.sent ?? 0),
      opened: Number(es.opened ?? 0),
      clicked: Number(es.clicked ?? 0),
      openRate: num(es.open_rate),
      clickRate: num(es.click_rate),
      unsubscribeRate: num(es.unsubscribe_rate),
      bounceRate: num(es.bounce_rate),
      openTracking: Boolean(es.open_tracking_enabled),
      clickTracking: Boolean(es.click_tracking_enabled),
      starting: String(es.starting ?? ""),
      ending: String(es.ending ?? ""),
    };
  }
  const a = take(active, "active subscribers");
  const c = take(cancelled, "cancelled subscribers");
  const b = take(bounced, "bounced subscribers");
  base.subscribers = {
    active: a ? totalCount(a) : null,
    cancelled: c ? totalCount(c) : null,
    bounced: b ? totalCount(b) : null,
  };

  // Tag counts: one extra call per tag, so only for the tags the site uses
  // plus up to eight others, to stay inside the rate limit.
  const tagList: { id: number; name: string }[] = (take(tags, "tags")?.tags ?? []).map((t: Json) => ({ id: Number(t.id), name: String(t.name) }));
  const siteTags = tagList.filter(t => PIPELINE_ORDER.includes(t.name));
  const otherTags = tagList.filter(t => !PIPELINE_ORDER.includes(t.name)).slice(0, 8);
  const counted = await Promise.allSettled(
    [...siteTags, ...otherTags].map(async t => {
      const body = await kitGet(`/tags/${t.id}/subscribers?per_page=1&include_total_count=true&slim=true`);
      return { ...t, count: totalCount(body) };
    })
  );
  base.tags = counted
    .map((r, i) => (r.status === "fulfilled" ? r.value : { ...[...siteTags, ...otherTags][i], count: null }))
    .map(t => ({ ...t, url: `https://app.kit.com/subscribers?tag_id=${t.id}` }))
    .sort((x, y) => {
      const ix = PIPELINE_ORDER.indexOf(x.name), iy = PIPELINE_ORDER.indexOf(y.name);
      if (ix !== -1 || iy !== -1) return (ix === -1 ? 99 : ix) - (iy === -1 ? 99 : iy);
      return (y.count ?? 0) - (x.count ?? 0);
    });

  const statsById = new Map<number, Json>();
  for (const bs of take(broadcastStats, "broadcast stats")?.broadcasts ?? []) statsById.set(Number(bs.id), bs.stats ?? {});
  base.broadcasts = ((take(broadcasts, "broadcasts")?.broadcasts ?? []) as Json[])
    .map(br => {
      const st = statsById.get(Number(br.id)) ?? {};
      return {
        id: Number(br.id),
        subject: String(br.subject ?? "(no subject)"),
        status: String(st.status ?? br.status ?? "unknown"),
        sentAt: br.send_at ?? br.published_at ?? null,
        recipients: Number(st.recipients ?? 0),
        openRate: num(st.open_rate),
        clickRate: num(st.click_rate),
        opened: Number(st.emails_opened ?? 0),
        clicks: Number(st.total_clicks ?? 0),
        unsubscribes: Number(st.unsubscribes ?? 0),
        url: `https://app.kit.com/broadcasts/${br.id}`,
      };
    })
    .sort((x, y) => String(y.sentAt ?? "").localeCompare(String(x.sentAt ?? "")));

  base.sequences = ((take(sequences, "sequences")?.sequences ?? []) as Json[]).map(sq => ({
    id: Number(sq.id),
    name: String(sq.name ?? ""),
    active: Boolean(sq.active),
    emails: Number(sq.email_count ?? 0),
    subscribers: Number(sq.subscriber_count ?? 0),
    recipients: num(sq.stats?.recipients),
    openRate: num(sq.stats?.open_rate),
    clickRate: num(sq.stats?.click_rate),
    unsubscribeRate: num(sq.stats?.unsubscribe_rate),
    url: `https://app.kit.com/sequences/${sq.id}`,
  }));

  base.recentSubscribers = ((take(recent, "recent subscribers")?.subscribers ?? []) as Json[]).map(su => ({
    id: Number(su.id),
    email: String(su.email_address ?? ""),
    firstName: su.first_name ?? null,
    state: String(su.state ?? ""),
    createdAt: String(su.created_at ?? ""),
    tags: (su.tags ?? []).map((t: Json) => String(t.name)),
    source: su.attribution?.source_name ?? su.attribution?.utm_source ?? su.attribution?.referrer ?? null,
    url: `https://app.kit.com/subscribers/${su.id}`,
  }));

  if (errors.length) base.error = errors.join("; ");
  return base;
}

const cache = new Map<number, { at: number; value: KitOverview }>();

export async function kitOverview(days: number, force = false): Promise<KitOverview> {
  if (!ENV.kitApiKey) {
    return {
      configured: false,
      fetchedAt: new Date().toISOString(),
      account: { name: null, plan: null, timezone: null },
      subscribers: { active: null, cancelled: null, bounced: null },
      growth: null,
      emailStats: null,
      tags: [],
      broadcasts: [],
      sequences: [],
      recentSubscribers: [],
    };
  }
  const hit = cache.get(days);
  if (!force && hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = await fetchOverview(days);
  cache.set(days, { at: Date.now(), value });
  return value;
}

/** Test helper. */
export function _resetKitCache() {
  cache.clear();
}
