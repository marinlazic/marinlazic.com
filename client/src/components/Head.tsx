import { useEffect } from "react";
import { useLocation } from "wouter";
import { getPageMeta, CANONICAL_ORIGIN, SITE_NAME } from "../data/siteMetadata";

export function Head() {
  const [location] = useLocation();
  useEffect(() => {
    const head = getPageMeta(location);
    document.querySelectorAll("[data-site-head]").forEach(el => el.remove());
    const owned = <T extends HTMLElement>(el: T) => {
      el.setAttribute("data-site-head", "");
      document.head.appendChild(el);
      return el;
    };
    const title = owned(document.createElement("title"));
    title.textContent = head.title;
    const meta = (key: string, value: string, property = false) => {
      const el = document.createElement("meta");
      el.setAttribute(property ? "property" : "name", key);
      el.content = value;
      owned(el);
    };
    meta("description", head.description.replace(/\s+/g, " ").slice(0, 200));
    meta("author", "Marin Lazic");
    meta("og:title", head.socialTitle ?? head.title, true);
    meta(
      "og:description",
      (head.socialDescription ?? head.description).replace(/\s+/g, " ").slice(0, 200),
      true
    );
    meta("og:type", head.ogType || "website", true);
    meta("og:site_name", SITE_NAME, true);
    meta("og:locale", "en_AU", true);
    meta("twitter:card", head.ogImage ? "summary_large_image" : "summary");
    meta("twitter:title", head.socialTitle ?? head.title);
    meta(
      "twitter:description",
      (head.socialDescription ?? head.description).replace(/\s+/g, " ").slice(0, 200)
    );
    meta(
      "robots",
      head.noindex || head.notFound
        ? "noindex, follow"
        : "index, follow, max-image-preview:large"
    );
    if (head.canonicalPath) {
      const url = CANONICAL_ORIGIN + head.canonicalPath;
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = url;
      owned(link);
      meta("og:url", url, true);
    }
    if (head.ogImage) {
      meta("og:image", head.ogImage, true);
      meta("twitter:image", head.ogImage);
      meta("og:image:alt", head.ogImageAlt || head.title, true);
    }
    if (head.publishedTime)
      meta("article:published_time", head.publishedTime, true);
    if (head.modifiedTime)
      meta("article:modified_time", head.modifiedTime, true);
    if (head.structuredData && !head.notFound) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(head.structuredData);
      owned(script);
    }
  }, [location]);
  return null;
}
