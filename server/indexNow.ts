// IndexNow tells Bing, Yandex, Seznam and Naver which pages changed, so they
// recrawl within hours instead of weeks. Bing's index also feeds ChatGPT
// search and Copilot, so this matters for answer engines too.
//
// The key is public by design: search engines fetch /<key>.txt to confirm the
// site owns the submissions. The matching file lives in client/public.
//
// The daily job calls submitChangedUrls(). It compares each sitemap URL's
// lastmod with the last submitted lastmod (kept in Blob storage) and submits
// only what changed. The first run submits every page once.

import { CANONICAL_ORIGIN, sitemapEntries } from "../client/src/data/siteMetadata";
import { storageConfigured, storageGetBuffer, storagePut } from "./storage";

export const INDEXNOW_KEY = "b1a22b3384a75608ac5a98b4ca4db8c4";
const STATE_KEY = "indexnow/state.json";
const ENDPOINT = "https://api.indexnow.org/indexnow";

type State = Record<string, string>;

async function readState(): Promise<State> {
  if (!storageConfigured()) return {};
  try {
    const buf = await storageGetBuffer(STATE_KEY);
    return buf ? (JSON.parse(buf.toString("utf8")) as State) : {};
  } catch {
    return {};
  }
}

export type IndexNowResult = {
  submitted: string[];
  status: number | null;
  detail: string;
};

/** Submit every sitemap URL whose lastmod differs from the last submission. */
export async function submitChangedUrls(fetchImpl: typeof fetch = fetch): Promise<IndexNowResult> {
  const entries = sitemapEntries();
  const previous = await readState();
  const changed = entries.filter(e => previous[e.path] !== (e.lastmod ?? ""));
  if (changed.length === 0) {
    return { submitted: [], status: null, detail: "nothing changed since the last submission" };
  }
  const host = new URL(CANONICAL_ORIGIN).host;
  const res = await fetchImpl(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${CANONICAL_ORIGIN}/${INDEXNOW_KEY}.txt`,
      urlList: changed.map(e => `${CANONICAL_ORIGIN}${e.path}`),
    }),
  });
  // 200 and 202 both mean accepted.
  if (res.status !== 200 && res.status !== 202) {
    return {
      submitted: [],
      status: res.status,
      detail: `IndexNow answered ${res.status}; will retry tomorrow`,
    };
  }
  const next: State = { ...previous };
  for (const e of changed) next[e.path] = e.lastmod ?? "";
  if (storageConfigured()) {
    await storagePut(STATE_KEY, JSON.stringify(next), "application/json").catch(e =>
      console.warn("[IndexNow] Could not save state:", e)
    );
  }
  return {
    submitted: changed.map(e => e.path),
    status: res.status,
    detail: `submitted ${changed.length} changed page${changed.length === 1 ? "" : "s"}`,
  };
}
