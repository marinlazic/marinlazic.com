import superjson from "superjson";
import type { HeadMeta } from "../client/src/data/siteMetadata";

// Fixed verified site identity is the deployment-safe default. Never trust Host headers.
const ORIGIN = (
  process.env.CANONICAL_ORIGIN || "https://marinlazic.com"
).replace(/\/$/, "");
const SITE_NAME = process.env.SITE_NAME || "Marin Lazic";
export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const clean = (text: string, max = 200) =>
  Array.from(text.replace(/\s+/g, " ").trim()).slice(0, max).join("");
const scriptJson = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export function buildHeadTags(head: HeadMeta) {
  const title = escapeHtml(clean(head.title, 160));
  const desc = escapeHtml(clean(head.description));
  const socialTitle = escapeHtml(clean(head.socialTitle ?? head.title, 160));
  const socialDesc = escapeHtml(clean(head.socialDescription ?? head.description));
  const url = head.canonicalPath
    ? escapeHtml(ORIGIN + head.canonicalPath)
    : undefined;
  const image = head.ogImage
    ? escapeHtml(new URL(head.ogImage, ORIGIN).href)
    : undefined;
  const tags = [
    `<title data-site-head>${title}</title>`,
    `<meta data-site-head name="description" content="${desc}" />`,
    `<meta data-site-head name="author" content="Marin Lazic" />`,
    `<meta data-site-head property="og:title" content="${socialTitle}" />`,
    `<meta data-site-head property="og:description" content="${socialDesc}" />`,
    `<meta data-site-head property="og:type" content="${head.ogType || "website"}" />`,
    `<meta data-site-head property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta data-site-head property="og:locale" content="en_AU" />`,
    `<meta data-site-head name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta data-site-head name="twitter:title" content="${socialTitle}" />`,
    `<meta data-site-head name="twitter:description" content="${socialDesc}" />`,
    `<link data-site-head rel="alternate" type="application/rss+xml" title="Marin Lazic: Insights" href="${ORIGIN}/feed.xml" />`,
  ];
  if (url)
    tags.push(
      `<link data-site-head rel="canonical" href="${url}" />`,
      `<meta data-site-head property="og:url" content="${url}" />`
    );
  if (image)
    tags.push(
      `<meta data-site-head property="og:image" content="${image}" />`,
      `<meta data-site-head name="twitter:image" content="${image}" />`,
      `<meta data-site-head property="og:image:alt" content="${escapeHtml(head.ogImageAlt || head.title)}" />`
    );
  if (head.publishedTime)
    tags.push(
      `<meta data-site-head property="article:published_time" content="${escapeHtml(head.publishedTime)}" />`
    );
  if (head.modifiedTime)
    tags.push(
      `<meta data-site-head property="article:modified_time" content="${escapeHtml(head.modifiedTime)}" />`
    );
  tags.push(
    `<meta data-site-head name="robots" content="${head.noindex || head.notFound ? "noindex, follow" : "index, follow, max-image-preview:large"}" />`
  );
  if (head.structuredData && !head.notFound)
    tags.push(
      `<script data-site-head type="application/ld+json">${scriptJson(head.structuredData)}</script>`
    );
  return tags.join("\n");
}

export function composeHtml(
  template: string,
  html: string,
  head: HeadMeta,
  state: unknown
) {
  const stateScript = `<script>window.__RQ_STATE__ = ${scriptJson(superjson.serialize(state))}</script>`;
  return template
    .replace("</body>", () => `${stateScript}</body>`)
    .replace("<!--app-head-->", () => buildHeadTags(head))
    .replace("<!--app-html-->", () => html);
}
