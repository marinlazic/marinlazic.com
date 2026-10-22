/**
 * Tagged short links.
 *
 * Marin posts the same few pages to Instagram, YouTube, Substack and the Kit
 * newsletter. Pasting a full UTM string every time does not happen, so on
 * 21 Oct 2026 25 of 49 leads had no source. These links do the tagging for
 * him: he posts marinlazic.com/ig and the server redirects to the page with
 * the tags attached, so Traffic and every contact record the source.
 *
 *   /ig            the Recovery Guide, tagged instagram
 *   /ig/a          the assessment, tagged instagram
 *   /ig/a/october  the same with utm_campaign=october
 *
 * Unknown first segments fall through to the normal routes, so adding a page
 * called /about keeps working.
 */
import type { Express, Request, Response, NextFunction } from "express";

/** Where a post can point. The key is the second path segment. */
export const SHORT_DESTINATIONS: Record<string, string> = {
  "": "/recovery-guide",
  g: "/recovery-guide",
  a: "/assessment",
  p: "/program",
  s: "/speaking",
  r: "/resources",
  i: "/insights",
};

/** Where the post lives. The key is the first path segment. */
export const SHORT_CHANNELS: Record<string, { source: string; medium: string }> = {
  ig: { source: "instagram", medium: "social" },
  yt: { source: "youtube", medium: "video" },
  li: { source: "linkedin", medium: "social" },
  fb: { source: "facebook", medium: "social" },
  sub: { source: "substack", medium: "newsletter" },
  kit: { source: "kit", medium: "email" },
  wa: { source: "whatsapp", medium: "message" },
  qr: { source: "qr", medium: "print" },
  bio: { source: "instagram", medium: "bio" },
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 60);

/** The tagged URL a short link points at, or null when the channel is unknown. */
export function resolveShortLink(channel: string, dest = "", campaign = ""): string | null {
  const c = SHORT_CHANNELS[channel.toLowerCase()];
  if (!c) return null;
  const path = SHORT_DESTINATIONS[dest.toLowerCase()];
  if (path === undefined) return null;
  const q = new URLSearchParams({ utm_source: c.source, utm_medium: c.medium });
  const camp = slug(campaign);
  if (camp) q.set("utm_campaign", camp);
  return `${path}?${q.toString()}`;
}

export function registerShortLinks(app: Express) {
  const handle = (req: Request, res: Response, next: NextFunction) => {
    const { channel, dest, campaign } = req.params as Record<string, string | undefined>;
    const target = resolveShortLink(channel ?? "", dest ?? "", campaign ?? "");
    if (!target) return next();
    // 302: the tags may change, so browsers and link previewers should not cache it.
    res.redirect(302, target);
  };
  app.get("/:channel", handle);
  app.get("/:channel/:dest", handle);
  app.get("/:channel/:dest/:campaign", handle);
}
