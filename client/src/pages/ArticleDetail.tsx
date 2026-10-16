import React, { useMemo } from "react";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle,
  Target,
  TrendingUp,
  Zap,
  BookOpen,
  Shield,
  Activity,
  Dumbbell,
  Brain,
  Moon,
} from "lucide-react";
import { articles } from "@/data/articlesData";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Enhanced Content Renderer ──────────────────────────
function ArticleContent({ content }: { content: string }) {
  const sections = useMemo(() => {
    const lines = content.split("\n");
    const elements: { type: string; content: string; items?: string[] }[] = [];
    let currentParagraph: string[] = [];
    let inTable = false;
    let tableRows: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(" ").trim();
        if (text) elements.push({ type: "paragraph", content: text });
        currentParagraph = [];
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        elements.push({ type: "table", content: "", items: tableRows });
        tableRows = [];
        inTable = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (!trimmed) {
        flushParagraph();
        if (inTable) flushTable();
        continue;
      }

      // Headings
      if (trimmed.startsWith("### ")) {
        flushParagraph();
        if (inTable) flushTable();
        elements.push({ type: "h3", content: trimmed.slice(4) });
        continue;
      }
      if (trimmed.startsWith("## ")) {
        flushParagraph();
        if (inTable) flushTable();
        elements.push({ type: "h2", content: trimmed.slice(3) });
        continue;
      }
      if (trimmed.startsWith("# ")) {
        flushParagraph();
        if (inTable) flushTable();
        elements.push({ type: "h2", content: trimmed.slice(2) });
        continue;
      }

      // Pipe-style markdown table (e.g., | Col1 | Col2 |)
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        flushParagraph();
        // Skip separator rows like | --- | --- |
        if (/^\|[\s\-:]+\|/.test(trimmed) && !trimmed.match(/[a-zA-Z0-9]/)) {
          continue;
        }
        if (!inTable) inTable = true;
        // Convert pipe table to tab-separated for consistent rendering
        const cells = trimmed
          .split("|")
          .filter(c => c.trim())
          .map(c => c.trim())
          .join("\t");
        tableRows.push(cells);
        continue;
      }

      // Tab-separated table rows (legacy format)
      if (
        trimmed.includes("\t") &&
        !trimmed.startsWith("-") &&
        !trimmed.startsWith("*")
      ) {
        flushParagraph();
        if (!inTable) inTable = true;
        tableRows.push(trimmed);
        continue;
      }

      // Bullet points
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        flushParagraph();
        if (inTable) flushTable();
        const bulletText = trimmed.replace(/^[-*]\s+/, "");
        elements.push({ type: "bullet", content: bulletText });
        continue;
      }

      // Numbered list items
      if (/^\d+\.\s/.test(trimmed)) {
        flushParagraph();
        if (inTable) flushTable();
        elements.push({ type: "numbered", content: trimmed });
        continue;
      }

      // Blockquote (starts and ends with quotes)
      if (
        trimmed.startsWith('"') &&
        trimmed.endsWith('"') &&
        trimmed.length > 50
      ) {
        flushParagraph();
        elements.push({ type: "quote", content: trimmed.slice(1, -1) });
        continue;
      }

      if (inTable) flushTable();
      currentParagraph.push(trimmed);
    }

    flushParagraph();
    if (inTable) flushTable();

    return elements;
  }, [content]);

  const renderInline = (text: string): React.ReactNode => {
    const tokens = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|_[^_]+_)/g);
    return tokens.map((token, i) => {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        const href = link[2];
        if (!href.startsWith("/") && !/^https?:\/\//.test(href)) return link[1];
        const external = /^https?:\/\//.test(href);
        return (
          <a
            key={i}
            href={href}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="text-[#E53935] underline underline-offset-2 hover:text-[#C62828]"
          >
            {link[1]}
          </a>
        );
      }
      if (token.startsWith("**") && token.endsWith("**"))
        return <strong key={i}>{token.slice(2, -2)}</strong>;
      if (token.startsWith("_") && token.endsWith("_"))
        return <em key={i}>{token.slice(1, -1)}</em>;
      return token;
    });
  };

  // Get heading icon based on content
  const getHeadingIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("key takeaway"))
      return <CheckCircle className="w-5 h-5 text-[#E53935]" />;
    if (lower.includes("step"))
      return <Target className="w-5 h-5 text-[#E53935]" />;
    if (lower.includes("how it works") || lower.includes("client journey"))
      return <Target className="w-5 h-5 text-[#E53935]" />;
    if (
      lower.includes("roi") ||
      lower.includes("investment") ||
      lower.includes("cost")
    )
      return <TrendingUp className="w-5 h-5 text-[#E53935]" />;
    if (lower.includes("bottom line"))
      return <Zap className="w-5 h-5 text-[#E53935]" />;
    if (lower.includes("protocol") || lower.includes("factor"))
      return <Activity className="w-5 h-5 text-[#E53935]" />;
    if (lower.includes("sleep") || lower.includes("wind-down"))
      return <Moon className="w-5 h-5 text-[#E53935]" />;
    if (lower.includes("phase") || lower.includes("progression"))
      return <Dumbbell className="w-5 h-5 text-[#E53935]" />;
    if (
      lower.includes("cognitive") ||
      lower.includes("brain") ||
      lower.includes("mindset")
    )
      return <Brain className="w-5 h-5 text-[#E53935]" />;
    if (
      lower.includes("concern") ||
      lower.includes("safe") ||
      lower.includes("contamination")
    )
      return <Shield className="w-5 h-5 text-[#E53935]" />;
    if (
      lower.includes("what is") ||
      lower.includes("why") ||
      lower.includes("guide") ||
      lower.includes("matter")
    )
      return <BookOpen className="w-5 h-5 text-[#E53935]" />;
    return null;
  };

  // Check if a paragraph is a "key insight" callout (first paragraph after Key Takeaways heading)
  const isKeyInsight = (idx: number) => {
    if (
      idx > 0 &&
      sections[idx - 1]?.type === "h2" &&
      sections[idx - 1]?.content.includes("Key Takeaway")
    )
      return true;
    return false;
  };

  // Check if paragraph contains a step pattern
  const isStepParagraph = (text: string) => {
    return /^Step \d+:/.test(text);
  };

  // Skip stat-like lines that are part of the Sam visual data
  const isStatLine = (text: string) => {
    return (
      /^\d/.test(text) &&
      text.length < 30 &&
      (text.includes("WORKOUTS") ||
        text.includes("PHASES") ||
        text.includes("SESSIONS") ||
        text.includes("COMPLETION") ||
        text.includes("PROGRAMMED"))
    );
  };

  // Collect consecutive bullets into groups
  let bulletGroup: string[] = [];
  let numberedGroup: string[] = [];

  return (
    <div className="prose-custom">
      {sections.map((section, idx) => {
        // Handle bullet grouping
        if (section.type === "bullet") {
          bulletGroup.push(section.content);
          if (
            idx + 1 < sections.length &&
            sections[idx + 1].type === "bullet"
          ) {
            return null;
          }
          const group = [...bulletGroup];
          bulletGroup = [];
          return (
            <ul key={idx} className="my-6 space-y-0 list-none">
              {group.map((item, bi) => (
                <li
                  key={bi}
                  className="flex gap-4 py-3.5 border-b border-black/5 last:border-0"
                >
                  <div className="w-1.5 h-1.5 bg-[#E53935] mt-2.5 shrink-0" />
                  <p className="text-[15px] leading-[1.8] text-black/70">
                    {renderInline(item)}
                  </p>
                </li>
              ))}
            </ul>
          );
        }
        bulletGroup = [];

        // Handle numbered list grouping
        if (section.type === "numbered") {
          numberedGroup.push(section.content);
          if (
            idx + 1 < sections.length &&
            sections[idx + 1].type === "numbered"
          ) {
            return null;
          }
          const group = [...numberedGroup];
          numberedGroup = [];
          return (
            <ol key={idx} className="my-6 space-y-0 list-none">
              {group.map((item, ni) => {
                const numMatch = item.match(/^(\d+)\.\s*(.*)/);
                const num = numMatch ? numMatch[1] : String(ni + 1);
                const text = numMatch ? numMatch[2] : item;
                return (
                  <li
                    key={ni}
                    className="flex gap-4 py-3.5 border-b border-black/5 last:border-0"
                  >
                    <div className="w-6 h-6 bg-[#E53935] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white font-heading font-bold text-[11px]">
                        {num}
                      </span>
                    </div>
                    <p className="text-[15px] leading-[1.8] text-black/70">
                      {renderInline(text)}
                    </p>
                  </li>
                );
              })}
            </ol>
          );
        }
        numberedGroup = [];

        const el = (() => {
          switch (section.type) {
            case "h2": {
              const icon = getHeadingIcon(section.content);
              return (
                <div key={idx} className="mt-14 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    {icon}
                    <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-[-0.02em]">
                      {section.content}
                    </h2>
                  </div>
                  <div className="w-12 h-0.5 bg-[#E53935]" />
                </div>
              );
            }
            case "h3":
              return (
                <div key={idx} className="mt-10 mb-4">
                  <h3 className="font-heading font-bold text-lg sm:text-xl tracking-[-0.01em] text-black/90">
                    {section.content}
                  </h3>
                  <div className="w-8 h-0.5 bg-black/15 mt-2" />
                </div>
              );
            case "paragraph": {
              // Key insight callout
              if (isKeyInsight(idx)) {
                return (
                  <div
                    key={idx}
                    className="bg-[#FAFAFA] border-l-3 border-[#E53935] p-6 sm:p-8 my-6"
                  >
                    <p className="text-[15px] leading-[1.85] text-black/75">
                      {renderInline(section.content)}
                    </p>
                  </div>
                );
              }

              // Step paragraphs get special treatment
              if (isStepParagraph(section.content)) {
                const stepMatch = section.content.match(/^(Step \d+): (.+)/);
                if (stepMatch) {
                  return (
                    <div
                      key={idx}
                      className="mt-10 mb-4 flex items-start gap-4"
                    >
                      <div className="shrink-0 w-10 h-10 bg-[#E53935] flex items-center justify-center">
                        <span className="text-white font-heading font-bold text-sm">
                          {stepMatch[1].replace("Step ", "")}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg sm:text-xl tracking-[-0.01em]">
                          {stepMatch[2]}
                        </h3>
                      </div>
                    </div>
                  );
                }
              }

              // Skip stat-like lines
              if (isStatLine(section.content)) return null;

              // Regular paragraph
              return (
                <p
                  key={idx}
                  className="text-[15px] leading-[1.85] text-black/70 mb-5"
                >
                  {renderInline(section.content)}
                </p>
              );
            }
            case "quote":
              return (
                <blockquote
                  key={idx}
                  className="relative my-10 py-6 px-8 bg-[#FAFAFA] border-l-3 border-[#E53935]"
                >
                  <div className="absolute -top-3 left-6 text-[#E53935] text-4xl font-serif leading-none">
                    "
                  </div>
                  <p className="text-[15px] leading-[1.85] text-black/65 italic pt-2">
                    {renderInline(section.content)}
                  </p>
                </blockquote>
              );
            case "table":
              if (!section.items || section.items.length === 0) return null;
              const rows = section.items.map(r =>
                r
                  .split("\t")
                  .map(c => c.trim())
                  .filter(Boolean)
              );
              if (rows.length === 0) return null;
              return (
                <div
                  key={idx}
                  className="my-8 overflow-x-auto border border-black/8"
                >
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#FAFAFA]">
                        {rows[0]?.map((cell, ci) => (
                          <th
                            key={ci}
                            className="text-left text-[10px] tracking-[0.15em] uppercase text-black/50 font-medium py-3 px-4 border-b border-black/8"
                          >
                            {renderInline(cell)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(1).map((row, ri) => (
                        <tr
                          key={ri}
                          className="border-b border-black/5 hover:bg-[#FAFAFA]/50 transition-colors"
                        >
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className={`text-[14px] py-3 px-4 ${ci === 0 ? "font-medium text-black/80" : "text-black/60"}`}
                            >
                              {renderInline(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            default:
              return null;
          }
        })();

        return <div key={`wrap-${idx}`}>{el}</div>;
      })}
    </div>
  );
}

// ─── Article Detail Page ──────────────────────────
export default function ArticleDetail() {
  const [, params] = useRoute("/insights/:slug");
  const slug = params?.slug;

  const article = useMemo(() => articles.find(a => a.slug === slug), [slug]);

  const related = useMemo(() => {
    if (!article) return [];
    return articles
      .filter(a => a.slug !== article.slug)
      .filter(
        a =>
          a.category === article.category ||
          a.tags.some(t => article.tags.includes(t))
      )
      .slice(0, 3);
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">
            Article not found
          </h1>
          <Link href="/insights" className="text-sm text-[#E53935] font-medium">
            Back to Insights
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Minimal nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between h-14">
          <a
            href="/"
            className="font-heading font-bold text-sm tracking-[0.2em] uppercase"
          >
            ML
          </a>
          <div className="flex items-center gap-4">
            <Link
              href="/insights"
              className="text-xs tracking-[0.15em] uppercase text-black/60 hover:text-black transition-colors font-medium"
            >
              Insights
            </Link>
            <a
              href="/assessment"
              className="border border-black/20 text-black text-xs tracking-[0.15em] uppercase px-4 py-2 hover:border-black/60 transition-colors font-medium"
            >
              Check Your Score
            </a>
            <a
              href="/apply"
              className="bg-[#E53935] text-white text-xs tracking-[0.15em] uppercase px-4 py-2 hover:bg-[#C62828] transition-colors font-medium"
            >
              Apply
            </a>
          </div>
        </div>
      </nav>

      {/* Article Header */}
      <header className="pt-24 pb-8 lg:pt-28 lg:pb-12">
        <div className="max-w-[720px] mx-auto px-5 sm:px-8">
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Insights
          </Link>
          <nav aria-label="Breadcrumb" className="text-xs text-black/50 mb-6">
            <a href="/">Home</a>
            <span className="mx-2">/</span>
            <a href="/insights">Insights</a>
            <span className="mx-2">/</span>
            <span aria-current="page">{article.title}</span>
          </nav>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#E53935] font-medium">
              {article.category}
            </span>
            <span className="text-[10px] text-black/30">|</span>
            <span className="text-[10px] tracking-[0.15em] uppercase text-black/35 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3" />{" "}
              <time dateTime={article.date}>{formatDate(article.date)}</time>
            </span>
            <span className="text-[10px] text-black/30">|</span>
            <span className="text-[10px] tracking-[0.15em] uppercase text-black/35 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> {article.readTime}
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-[-0.03em] leading-[1.1] mb-6">
            {article.title}
          </h1>
          {article.dateModified && (
            <p className="text-xs text-black/45 mb-5">
              Last revised:{" "}
              <time dateTime={article.dateModified}>
                {formatDate(article.dateModified)}
              </time>
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/5 flex items-center justify-center">
              <span className="font-heading font-bold text-xs">ML</span>
            </div>
            <div>
              <a
                href="/about"
                rel="author"
                className="text-sm font-medium block hover:text-[#E53935]"
              >
                Marin Lazic
              </a>
              <span className="text-xs text-black/40">
                Olympic S&C Coach & Executive Performance Coach
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="max-w-[960px] mx-auto px-5 sm:px-8 mb-10">
        <div className="aspect-[21/9] overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-[720px] mx-auto px-5 sm:px-8 pb-16">
        <ArticleContent content={article.content} />

        {/* Tags */}
        <div className="mt-12 pt-8 border-t border-black/10">
          <span className="text-[10px] tracking-[0.2em] uppercase text-black/30 font-medium mb-3 block">
            Tags
          </span>
          <div className="flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] tracking-[0.1em] uppercase text-black/40 border border-black/10 px-3 py-1.5 hover:border-black/20 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-[#FAFAFA] border border-black/8 p-8 sm:p-10 text-center">
          <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-[-0.02em] mb-3">
            Want protocols like these, personalised for you?
          </h3>
          <p className="text-sm text-black/50 mb-6 max-w-md mx-auto">
            If you are ready to work together, apply directly. Otherwise, take
            the free assessment to see where you stand.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/apply"
              className="inline-block bg-[#E53935] text-white text-xs tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#C62828] transition-colors font-medium"
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
      </article>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="py-16 bg-[#FAFAFA] border-t border-black/10">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
            <span className="text-[10px] tracking-[0.2em] uppercase text-black/30 font-medium mb-6 block">
              Related Insights
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(a => (
                <Link
                  key={a.slug}
                  href={`/insights/${a.slug}`}
                  className="group bg-white border border-black/5 hover:border-black/15 transition-all duration-300"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={a.image}
                      alt={a.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#E53935] font-medium">
                      {a.category}
                    </span>
                    <h3 className="font-heading font-bold text-sm tracking-[-0.01em] leading-snug mt-2 mb-2 group-hover:text-[#E53935] transition-colors">
                      {a.title}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#E53935] font-medium tracking-[0.1em] uppercase">
                      Read <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-black/10 py-8">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-heading font-bold text-sm tracking-[0.2em] uppercase">
            ML
          </span>
          <div className="flex items-center gap-4">
            <a
              href="/apply"
              className="text-xs tracking-[0.1em] uppercase text-[#E53935] font-medium hover:text-[#C62828] transition-colors"
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
