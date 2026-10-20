import { articles } from "./articlesData";
import { articleCitations, articleWordCount } from "./articleMetadata";
import { resources } from "../pages/ResourcePage";
import { HOME_FAQS, APPLY_FAQS } from "@shared/siteFaq";
import { MEDIA_TITLE, MEDIA_DESCRIPTION, mediaSubjects, YOUTUBE_URL } from "./mediaData";

export const SITE_NAME = "Marin Lazic";
export const CANONICAL_ORIGIN = "https://marinlazic.com";
const PREVIOUS_CONTENT_DATE = "2026-10-12";
export const HOME_DESCRIPTION =
  "Performance coach for founders, training and recovery. Marin Lazic is the Strength and Conditioning Coach for the Australian Men's Water Polo Team and coaches founders from Sydney, online.";
export const DEFAULT_IMAGE =
  "/images/site/og-homepage-5TTgpTWqZd2uZue4W5vq6e.png";
const PERSON_ID = `${CANONICAL_ORIGIN}/#person`;
const WEBSITE_ID = `${CANONICAL_ORIGIN}/#website`;

export type HeadMeta = {
  title: string;
  description: string;
  socialTitle?: string;
  socialDescription?: string;
  canonicalPath?: string;
  ogType?: "website" | "article";
  ogImage?: string;
  ogImageAlt?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  notFound?: boolean;
  structuredData?: Record<string, unknown>;
};

type Page = {
  title: string;
  description: string;
  label: string;
  socialTitle?: string;
  socialDescription?: string;
  schemaTitle?: string;
  schemaDescription?: string;
  noindex?: boolean;
  modified?: string;
};
export const PUBLIC_PAGES: Record<string, Page> = {
  "/": {
    title: "Marin Lazic | Performance Coach for Founders, Training and Recovery | Sydney",
    description: HOME_DESCRIPTION,
    socialTitle: "Marin Lazic | Performance Coach for Founders, Training and Recovery",
    schemaTitle: "Marin Lazic | Health and Performance Coach for Executives, Sydney",
    schemaDescription: "Sydney health and performance coaching for founders and executives. Individual strength, aerobic fitness, sleep and recovery plans with Marin Lazic.",
    label: "Home",
    modified: "2026-10-14",
  },
  "/about": {
    title: "About Marin Lazic | Performance Coach for Founders, Training and Recovery",
    description:
      "Marin Lazic, performance coach for founders, training and recovery. Strength and Conditioning Coach for the Australian Men's Water Polo Team, Paris 2024, founder of Otion.",
    socialTitle: "About Marin Lazic | Coaching Background and Media",
    socialDescription: "Meet Sydney health and performance coach Marin Lazic. Australian Men's Water Polo strength and conditioning, Paris 2024 preparation and Otion.",
    schemaTitle: "About Marin Lazic | Coaching Background and Media",
    schemaDescription: "Meet Sydney health and performance coach Marin Lazic. Australian Men's Water Polo strength and conditioning, Paris 2024 preparation and Otion.",
    label: "About",
    modified: "2026-10-14",
  },
  "/executive-health-performance": {
    title: "Executive Health and Performance Coaching | Marin Lazic",
    description:
      "Online coaching for founders and executives, based in Sydney. Individual training, sleep and recovery plans. $2,400 AUD per month, minimum 3 months.",
    label: "Executive health and performance",
    modified: PREVIOUS_CONTENT_DATE,
  },
  "/corporate-health-performance": {
    title: "Corporate Health and Performance, Otion | Marin Lazic",
    description:
      "Corporate athlete principles for leadership teams. Otion's health and performance coaching covers movement, training, sleep and recovery around work.",
    label: "Corporate health and performance",
    modified: PREVIOUS_CONTENT_DATE,
  },
  "/training-for-long-term-health": {
    title: "Training for Long Term Health | Marin Lazic",
    description:
      "Practical guides to strength, aerobic fitness, VO2 max, sleep and sustainable training. Evidence and clear limits, without lifespan promises.",
    label: "Training for long term health",
    modified: PREVIOUS_CONTENT_DATE,
  },
  "/insights": {
    title: "Health and Performance Insights | Marin Lazic",
    description:
      "Research linked guides to strength, aerobic fitness, sleep, HRV, nutrition and recovery for founders and busy professionals.",
    label: "Insights",
    modified: PREVIOUS_CONTENT_DATE,
  },
  "/resources": {
    title: "Free Training and Recovery Resources | Marin Lazic",
    description:
      "Nine practical training templates and checklists for movement, protein, aerobic fitness, sleep and recovery. Free coaching resources.",
    label: "Resources",
    modified: "2026-10-18",
  },
  "/media": {
    title: MEDIA_TITLE,
    description: MEDIA_DESCRIPTION,
    socialTitle: MEDIA_TITLE,
    socialDescription: MEDIA_DESCRIPTION,
    label: "Media",
    modified: "2026-10-15",
  },
  "/apply": {
    title: "Apply for Executive Performance Coaching | Marin Lazic",
    description:
      "Apply for 1:1 coaching with Marin Lazic. $2,400 AUD per month, minimum 3 months. Personal email follow up, no sales call required.",
    label: "Apply for coaching",
    modified: PREVIOUS_CONTENT_DATE,
  },
  "/assessment": {
    title: "Free Performance Assessment | Marin Lazic",
    description:
      "Review your training, sleep, stress, nutrition and recovery. Get a coaching score and AI assisted report from your answers, not a medical diagnosis.",
    label: "Performance assessment",
    modified: PREVIOUS_CONTENT_DATE,
  },
  "/free-assessment": {
    title: "Free Online Performance Assessment | Marin Lazic",
    description:
      "Start the free online training and recovery questionnaire or apply for coaching by email. No booking is needed for the questionnaire.",
    label: "Free assessment",
    modified: PREVIOUS_CONTENT_DATE,
  },
  "/call": {
    title: "Coaching Enquiries | Marin Lazic",
    description:
      "Start a coaching enquiry by application and email. Online appointment booking is not currently available.",
    label: "Coaching enquiries",
    noindex: true,
    modified: PREVIOUS_CONTENT_DATE,
  },
  "/recovery-guide": {
    title: "The Recovery Guide: Match Your Recovery to the Work You Did | Marin Lazic",
    description:
      "A free 17 page guide to the four kinds of fatigue (nervous system, muscles and joints, engine, head) and what to do after each: cold water, stretching, easy movement, breathing, light and sleep, with the numbers.",
    socialTitle: "The Recovery Guide | Free, 17 pages",
    socialDescription: "A heavy lifting day, a long run and a week of meetings each leave a different kind of fatigue. How to tell them apart and what to do about each one.",
    label: "Recovery Guide",
    modified: "2026-10-20",
  },
  "/waitlist": {
    title: "Programme Updates Waitlist | Marin Lazic",
    description:
      "Register your interest in future training programmes. Dates, pricing and availability will be confirmed before enrolment.",
    label: "Waitlist",
    noindex: true,
  },
  "/program": {
    title: "Structured Training Programme | Marin Lazic",
    description:
      "An overview of structured strength training, progression and recovery with Marin Lazic. Enquire about the programme that fits your goals.",
    label: "Training programme",
    modified: PREVIOUS_CONTENT_DATE,
  },
  "/bloodwork": {
    title: "Blood Work and Coaching Scope | Marin Lazic",
    description:
      "Blood test decisions and clinical interpretation belong with qualified healthcare professionals. Coaching can support an agreed training and lifestyle plan.",
    label: "Blood work",
    noindex: true,
    modified: PREVIOUS_CONTENT_DATE,
  },
  "/hrv-program": {
    title: "HRV Guided Conditioning | Marin Lazic",
    description:
      "Use personal HRV trends alongside sleep, symptoms and training history. Programme pricing, dates and availability remain unconfirmed.",
    label: "HRV conditioning",
    noindex: true,
    modified: PREVIOUS_CONTENT_DATE,
  },
};

export const ALIASES: Record<string, string> = {
  "/book-a-call": "/call",
  "/blood-work": "/bloodwork",
  "/hrv-conditioning": "/hrv-program",
};
export function resourcePath(resource: (typeof resources)[number]) {
  return `/resources/${resource.aliases?.[0] ?? resource.slug}`;
}
export function cleanPath(url: string) {
  let path = url.split("?")[0];
  try {
    path = decodeURI(path);
  } catch {
    /* retain malformed path */
  }
  return path.replace(/\/+$/, "") || "/";
}
export function canonicalPathFor(url: string): string {
  const path = cleanPath(url);
  if (ALIASES[path]) return ALIASES[path];
  const match = path.match(/^\/resources\/([^/]+)$/);
  const resource =
    match &&
    resources.find(r => r.slug === match[1] || r.aliases?.includes(match[1]));
  return resource ? resourcePath(resource) : path;
}
const person = {
  "@type": "Person",
  "@id": "https://marinlazic.com/#person",
  name: "Marin Lazic",
  url: "https://marinlazic.com/about",
  image: `${CANONICAL_ORIGIN}/images/site/marin-about-photo_5aa64d77.jpg`,
  jobTitle:
    "Performance Coach for Founders, Training and Recovery; Strength and Conditioning Coach, Australian Men's Water Polo Team; Founder, Otion",
  description:
    "Performance coach for founders, training and recovery. Strength and Conditioning Coach for the Australian Men's Water Polo Team since 2021, including the Paris 2024 Olympic Games. Founder of Otion. Based in Sydney, coaching online.",
  worksFor: [
    {
      "@type": "SportsOrganization",
      name: "Water Polo Australia",
      url: "https://waterpoloaustralia.com.au",
    },
    {
      "@type": "Organization",
      name: "Otion",
      url: "https://marinlazic.com/corporate-health-performance",
    },
  ],
  hasCredential: [
    {
      "@type": "EducationalOccupationalCredential",
      name: "ASCA Level 2 Strength and Conditioning Coach",
      credentialCategory: "Professional accreditation",
      recognizedBy: {
        "@type": "Organization",
        name: "Australian Strength and Conditioning Association",
        url: "https://www.strengthandconditioning.org",
      },
    },
    {
      "@type": "EducationalOccupationalCredential",
      name: "Certificate IV in Fitness",
      credentialCategory: "Vocational qualification",
    },
    {
      "@type": "EducationalOccupationalCredential",
      name: "TRX Master Instructor",
      credentialCategory: "Professional certification",
    },
  ],
  knowsAbout: [
    "Strength and conditioning",
    "Water polo",
    "Olympic athlete preparation",
    "Executive health and performance",
    "Heart rate variability",
    "Sleep and recovery",
    "Periodisation",
    "Aerobic fitness and VO2 max",
    "Jet lag and travel recovery",
  ],
  memberOf: {
    "@type": "Organization",
    name: "Australian Strength and Conditioning Association",
  },
  homeLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Sydney",
      addressRegion: "NSW",
      addressCountry: "AU",
    },
  },
  sameAs: [
    "https://www.linkedin.com/in/marinlazic",
    "https://www.instagram.com/marinlazic",
    "https://x.com/marinlazic",
    "https://marinlazic.substack.com",
    YOUTUBE_URL,
    "https://thereadystate.com/trs_podcast/solving-performance-anxiety-happy-athletes-marin-lazic/",
  ],
  subjectOf: mediaSubjects,
};
function faqGraph(faqs: { q: string; a: string }[], path: string) {
  return {
    "@type": "FAQPage",
    "@id": `${CANONICAL_ORIGIN}${path}#faq`,
    mainEntity: faqs.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
function breadcrumb(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${CANONICAL_ORIGIN}${item.path}`,
    })),
  };
}
export function getPageMeta(url: string): HeadMeta {
  const path = canonicalPathFor(url);
  if (
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path.startsWith("/payment/") ||
    path.startsWith("/report/")
  ) {
    return {
      title: SITE_NAME,
      description: "Private account and transaction pages.",
      noindex: true,
    };
  }
  const article = path.match(/^\/insights\/([^/]+)$/);
  const record = article && articles.find(a => a.slug === article[1]);
  const resource = resources.find(r => resourcePath(r) === path);
  const page = PUBLIC_PAGES[path];
  if (!page && !record && !resource)
    return {
      title: `Page not found | ${SITE_NAME}`,
      description:
        "This page is unavailable. Browse Insights or return to the homepage.",
      notFound: true,
      noindex: true,
    };
  const head: HeadMeta = {
    title: record
      ? `${record.seoTitle ?? record.title} | ${SITE_NAME}`
      : resource
        ? `${resource.title} | ${SITE_NAME}`
        : page!.title,
    description: record
      ? record.excerpt
      : resource
        ? resource.intro
        : page!.description,
    ...(page?.socialTitle ? { socialTitle: page.socialTitle } : {}),
    ...(page?.socialDescription ? { socialDescription: page.socialDescription } : {}),
    canonicalPath: path,
    ogType: record ? "article" : "website",
    ogImage: record ? record.image : DEFAULT_IMAGE,
    ogImageAlt: record
      ? record.title
      : resource
        ? resource.title
        : "Marin Lazic, health and performance coach",
    noindex: page?.noindex,
    publishedTime: record ? record.date : undefined,
    modifiedTime: record?.dateModified ? record.dateModified : undefined,
  };
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      url: `${CANONICAL_ORIGIN}/`,
      publisher: { "@id": PERSON_ID },
    },
    person,
    {
      "@type": record
        ? "WebPage"
        : path === "/about"
          ? "AboutPage"
          : path === "/insights" || path === "/resources"
            ? "CollectionPage"
            : "WebPage",
      "@id": `${CANONICAL_ORIGIN}${path}#webpage`,
      url: `${CANONICAL_ORIGIN}${path}`,
      name: page?.schemaTitle ?? head.title,
      description: page?.schemaDescription ?? head.description,
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: "en-AU",
    },
  ];
  if (record) {
    graph.push({
      "@type": "BlogPosting",
      "@id": `${CANONICAL_ORIGIN}${path}#article`,
      headline: record.title,
      description: record.excerpt,
      image: record.image.startsWith("/") ? `${CANONICAL_ORIGIN}${record.image}` : record.image,
      keywords: [...record.tags],
      about: record.tags.slice(0, 3).map(name => ({ "@type": "Thing", name })),
      isAccessibleForFree: true,
      wordCount: articleWordCount(record.content),
      citation: articleCitations(record.content),
      datePublished: record.date,
      ...(record.dateModified ? { dateModified: record.dateModified } : {}),
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      mainEntityOfPage: { "@id": `${CANONICAL_ORIGIN}${path}#webpage` },
      inLanguage: "en-AU",
    });
    graph.push(
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Insights", path: "/insights" },
        { name: record.title, path },
      ])
    );
  } else if (resource) {
    graph.push(
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Resources", path: "/resources" },
        { name: resource.title, path },
      ])
    );
  } else if (
    [
      "/about",
      "/resources",
      "/recovery-guide",
      "/media",
      "/executive-health-performance",
      "/corporate-health-performance",
      "/training-for-long-term-health",
    ].includes(path)
  ) {
    graph.push(
      breadcrumb([
        { name: "Home", path: "/" },
        { name: page!.label, path },
      ])
    );
  }
  if (path === "/media") {
    (graph[2] as Record<string, unknown>).about = { "@id": PERSON_ID };
    graph.push({
      "@type": "ItemList",
      "@id": `${CANONICAL_ORIGIN}/media#list`,
      name: "Media and interviews with Marin Lazic",
      itemListElement: mediaSubjects.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item,
      })),
    });
  }
  if (path === "/") graph.push(faqGraph(HOME_FAQS, path));
  if (path === "/apply") graph.push(faqGraph(APPLY_FAQS, path));
  if (path === "/" || path === "/executive-health-performance")
    graph.push({
      "@type": "Service",
      "@id": `${CANONICAL_ORIGIN}/#executive-service`,
      name: "1:1 Executive Performance Coaching",
      serviceType: "Executive health and performance coaching",
      provider: { "@id": PERSON_ID },
      url: `${CANONICAL_ORIGIN}/executive-health-performance`,
      offers: {
        "@type": "Offer",
        price: "2400",
        priceCurrency: "AUD",
        url: `${CANONICAL_ORIGIN}/apply`,
        description: "Monthly 1:1 coaching, minimum commitment 3 months.",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "2400",
          priceCurrency: "AUD",
          unitText: "month",
        },
      },
    });
  if (path === "/corporate-health-performance")
    graph.push({
      "@type": "Service",
      name: "Otion Corporate Health and Performance",
      provider: {
        "@type": "Organization",
        name: "Otion",
        founder: { "@id": PERSON_ID },
      },
      url: `${CANONICAL_ORIGIN}${path}`,
    });
  head.structuredData = { "@context": "https://schema.org", "@graph": graph };
  return head;
}

export function sitemapEntries() {
  return [
    ...Object.entries(PUBLIC_PAGES)
      .filter(([, p]) => !p.noindex)
      .map(([path, p]) => ({ path, lastmod: p.modified })),
    ...articles.map(a => ({
      path: `/insights/${a.slug}`,
      lastmod: a.dateModified || a.date,
    })),
    ...resources.map(r => ({
      path: resourcePath(r),
      lastmod: PREVIOUS_CONTENT_DATE,
    })),
  ];
}
