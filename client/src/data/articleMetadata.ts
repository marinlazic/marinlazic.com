export type ArticleCitation = {
  "@type": "ScholarlyArticle" | "WebPage";
  name: string;
  url: string;
};

/** Count words in the article body, excluding Markdown syntax and link URLs. */
export function articleWordCount(content: string): number {
  const text = content
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*#{1,6}\s+|^\s*[-*]\s+|^\s*\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*|_([^_]+)_/g, (_, bold, italic) => bold ?? italic)
    .replace(/<[^>]*>/g, " ");
  const words = new RegExp(
    String.raw`[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*`,
    "gu"
  );
  return text.match(words)?.length ?? 0;
}

function isScholarlySource(url: string): boolean {
  const { hostname, pathname } = new URL(url);
  const host = hostname.replace(/^www\./, "");
  return (
    [
      "pmc.ncbi.nlm.nih.gov",
      "pubmed.ncbi.nlm.nih.gov",
      "doi.org",
      "jamanetwork.com",
      "nature.com",
      "sciencedirect.com",
      "springer.com",
      "link.springer.com",
      "frontiersin.org",
      "tandfonline.com",
      "thelancet.com",
      "bmj.com",
      "bjsm.bmj.com",
      "journals.plos.org",
      "onlinelibrary.wiley.com",
    ].includes(host) ||
    host.startsWith("journals.") ||
    (host === "endocrine.org" && pathname.startsWith("/journals/"))
  );
}

/** One citation for each link in Sources, never inline or Related resources links. */
export function articleCitations(content: string): ArticleCitation[] {
  const afterHeading =
    content.match(/^## Sources[ \t]*\r?\n([\s\S]*)/m)?.[1] ?? "";
  const sources = afterHeading.split(/^##\s/m)[0];
  return Array.from(
    sources.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)
  ).map(([, name, url]) => ({
    "@type": isScholarlySource(url) ? "ScholarlyArticle" : "WebPage",
    name,
    url,
  }));
}
