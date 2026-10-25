import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Navigation } from "./InformationPage";
import { WordTile } from "@/components/WordTile";
import {
  articles,
  CATEGORIES,
  HERO_IMAGE,
  type Article,
} from "@/data/articlesData";

// ─── Collect all unique tags ──────────────────────────
const ALL_TAGS = Array.from(new Set(articles.flatMap(a => a.tags))).sort();

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const WORDS: Record<string, [string, string]> = {
  Performance: ["lift", "\u{1F3CB}\uFE0F"],
  Recovery: ["recover", "\u{1F9CA}"],
  Methodology: ["method", "\u{1F4DD}"],
  "Mindset & Energy": ["mindset", "\u{1F9E0}"],
  "Nutrition & Lifestyle": ["eat", "\u{1F957}"],
};
function tileFor(a: Article, i: number) {
  const [w, e] = WORDS[a.category] ?? [a.category.split(" ")[0].toLowerCase().slice(0, 8), "\u{1F4AA}"];
  return { word: w, emoji: e, pin: a.readTime };
}

// ─── Article Card ──────────────────────────
function ArticleCard({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  if (featured) {
    return (
      <Link
        href={`/insights/${article.slug}`}
        className="group grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white border border-black/5 hover:border-black/15 transition-all duration-300 hover:shadow-sm"
      >
        <div className="overflow-hidden">
          <WordTile src={article.image} alt={article.title} {...tileFor(article, 0)} aspect="aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[360px]" />
        </div>
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-black font-medium">
              {article.category}
            </span>
            <span className="text-[10px] text-black/30">|</span>
            <span className="text-[10px] tracking-[0.15em] uppercase text-black/35 font-medium">
              {formatDate(article.date)}
            </span>
            <span className="text-[10px] text-black/30">|</span>
            <span className="text-[10px] tracking-[0.15em] uppercase text-black/35 font-medium">
              {article.readTime}
            </span>
          </div>
          <h2 className="font-heading font-bold text-2xl lg:text-3xl tracking-[-0.02em] leading-tight mb-4 group-hover:text-black/60 transition-colors">
            {article.title}
          </h2>
          <p className="text-sm text-black/55 leading-relaxed mb-6 line-clamp-3">
            {article.excerpt}
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="text-[10px] tracking-[0.1em] uppercase text-black/40 border border-black/10 px-2.5 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-black font-medium tracking-[0.1em] uppercase group-hover:gap-3 transition-all">
            Read article <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/insights/${article.slug}`}
      className="group bg-white border border-black/5 hover:border-black/15 transition-all duration-300 hover:shadow-sm"
    >
      <WordTile src={article.image} alt={article.title} {...tileFor(article, 1)} aspect="aspect-[16/10]" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] tracking-[0.2em] uppercase text-black font-medium">
            {article.category}
          </span>
          <span className="text-[10px] text-black/30">|</span>
          <span className="text-[10px] tracking-[0.15em] uppercase text-black/35 font-medium">
            {formatDate(article.date)}
          </span>
        </div>
        <h3 className="font-heading font-bold text-base sm:text-lg tracking-[-0.01em] leading-snug mb-3 group-hover:text-black/60 transition-colors">
          {article.title}
        </h3>
        <p className="text-sm text-black/55 leading-relaxed line-clamp-3 mb-4">
          {article.excerpt}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {article.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-[9px] tracking-[0.1em] uppercase text-black/35 border border-black/8 px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-black font-medium tracking-[0.1em] uppercase group-hover:gap-2.5 transition-all">
          Read <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

// ─── Insights Page ──────────────────────────
export default function Insights() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    let result = [...articles];
    if (activeCategory !== "All") {
      result = result.filter(a => a.category === activeCategory);
    }
    if (activeTag) {
      result = result.filter(a => a.tags.includes(activeTag));
    }
    // Sort by date, newest first
    result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return result;
  }, [activeCategory, activeTag]);

  const featuredArticle = articles.find(a => a.featured);
  const nonFeatured = filteredArticles.filter(
    a => !a.featured || activeCategory !== "All" || activeTag
  );

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black">
      {/* Nav - same as Home */}
      <Navigation />

      {/* Hero */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-20 border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-4">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors mb-8"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to home
              </a>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-[#FFD400]" aria-hidden="true" />
                <span className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium">
                  Insights
                </span>
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-[1.05]">
                Performance insights
              </h1>
              <p className="text-sm text-black/50 mt-4 leading-relaxed max-w-sm">
                Research linked articles on training, recovery, sleep and nutrition,
                written for founders and busy professionals.
              </p>
            </div>
            <div className="lg:col-span-8">
              <WordTile src={HERO_IMAGE} alt="Performance Insights" word="insights" emoji={"\u{1F4DA}"} pin="Research linked" aspect="aspect-[21/9]" eager />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-black/10 bg-white">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-1 overflow-x-auto py-4 -mx-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setActiveTag(null);
                }}
                className={`whitespace-nowrap text-xs tracking-[0.15em] uppercase font-medium px-4 py-2 transition-colors ${
                  activeCategory === cat
                    ? "bg-black text-white"
                    : "text-black/50 hover:text-black hover:bg-black/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tags */}
      <section className="border-b border-black/5">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
            <span className="text-[10px] tracking-[0.15em] uppercase text-black/30 font-medium shrink-0">
              Tags:
            </span>
            {ALL_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`whitespace-nowrap text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 border transition-colors ${
                  activeTag === tag
                    ? "border-[#FFD400] text-black bg-black/5"
                    : "border-black/10 text-black/40 hover:border-black/20 hover:text-black/60"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {activeCategory === "All" && !activeTag && featuredArticle && (
        <section className="py-12 lg:py-16">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
            <span className="text-[10px] tracking-[0.2em] uppercase text-black/30 font-medium mb-4 block">
              Featured
            </span>
            <ArticleCard article={featuredArticle} featured />
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] tracking-[0.2em] uppercase text-black/30 font-medium">
              {activeCategory === "All" && !activeTag
                ? "Latest Insights"
                : `${filteredArticles.length} article${filteredArticles.length !== 1 ? "s" : ""}`}
            </span>
            {(activeCategory !== "All" || activeTag) && (
              <button
                onClick={() => {
                  setActiveCategory("All");
                  setActiveTag(null);
                }}
                className="text-[10px] tracking-[0.15em] uppercase text-black font-medium hover:text-black/70 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
          {(activeCategory === "All" && !activeTag
            ? nonFeatured
            : filteredArticles
          ).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeCategory === "All" && !activeTag
                ? nonFeatured
                : filteredArticles
              ).map(article => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-sm text-black/40">
                No articles match the selected filters.
              </p>
              <button
                onClick={() => {
                  setActiveCategory("All");
                  setActiveTag(null);
                }}
                className="mt-4 text-xs text-black font-medium tracking-[0.1em] uppercase hover:text-black/70 transition-colors"
              >
                View all insights
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 border-t border-black/10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-4">
            Want protocols like these, personalised for you?
          </h2>
          <p className="text-sm text-black/50 mb-8 max-w-lg mx-auto">
            If you already know you want to work together, apply directly.
            Otherwise, take the free assessment to see where you stand.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/apply"
              className="inline-block bg-[#FFD400] text-black border-2 border-black text-xs tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-black hover:text-[#FFD400] transition-colors font-medium"
            >
              Apply for Coaching
            </a>
            <a
              href="/assessment"
              className="inline-block border border-black/20 text-black text-xs tracking-[0.15em] uppercase px-8 py-3.5 hover:border-black/60 transition-colors font-medium"
            >
              Take the Free Assessment
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 py-8">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-heading font-bold text-sm tracking-[0.2em] uppercase">
            ML
          </span>
          <div className="flex items-center gap-4">
            <a
              href="/apply"
              className="text-xs tracking-[0.1em] uppercase text-black font-medium hover:text-black/70 transition-colors"
            >
              Apply for Coaching
            </a>
            <span className="text-black/20">|</span>
            <a
              href="/"
              className="text-xs text-black/40 hover:text-black transition-colors"
            >
              marinlazic.com
            </a>
          </div>
          <span className="text-xs text-black/30">
            &copy; {new Date().getFullYear()} Marin Lazic. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}

