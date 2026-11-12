// The home page. Nov 2026 redesign: ivory page, one opening statement, text
// cards, line graphics. The engine is unchanged: the same tracking events,
// the same enquiry form, the same guide signup, the same destinations.
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAnalytics } from "@/hooks/useAnalytics";
import { getAttribution } from "@/lib/attribution";
import { CheckCircle, AlertCircle, X, ArrowRight, Plus } from "lucide-react";
import { articles as insightsData } from "@/data/articlesData";
import { HOME_FAQS } from "@shared/siteFaq";
import { GuideSignup } from "@/components/GuideSignup";
import { RECOVERY_GUIDE } from "@shared/recoveryGuide";
import { PROGRAMS, SECTIONS, programPath } from "@shared/programs";
import { cardLine } from "@/data/programCards";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  SeasonChart,
  SampleRadar,
  SampleBars,
  WeekGraphic,
  WaveGraphic,
  TeamGraphic,
  TravelGraphic,
} from "@/components/site/graphics";

// The header lives in components/site/SiteNav. Exported here under its old
// name because the navigation test imports it from this page.
export function Nav() {
  return <SiteNav />;
}

function Label({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="ml-label mt-14 lg:mt-[88px]">
      <span>{children}</span>
      {right ? <span className="font-sans font-medium">{right}</span> : null}
    </div>
  );
}

function Heading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mt-7 lg:mt-11 grid gap-4 lg:gap-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-end">
      <h2 className="ml-h2">{title}</h2>
      {children ? <p className="ml-lede max-w-[460px]">{children}</p> : null}
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────
function Hero() {
  const { track } = useAnalytics();
  return (
    <section id="hero" className="pt-6 lg:pt-10">
      <div className="font-heading text-[28px] leading-[1.17] tracking-[-0.02em] sm:text-[34px] lg:text-[42px] max-w-[1200px] text-ink">
        <h1 className="inline font-bold">
          <span className="sr-only">Marin Lazic. </span>Performance coaching for
          founders, training and recovery.
        </h1>{" "}
        <p className="inline font-normal text-body">
          I'm Marin Lazic, strength and conditioning coach for the Australian
          Men's Water Polo Team. I worked with the team at Paris 2024 and I
          support the LA28 pathway.
        </p>
      </div>
      <div className="mt-6 lg:mt-[30px] flex flex-wrap items-center gap-2.5">
        <a
          href="/assessment"
          onClick={() => track("cta_click", { button: "hero_assessment" })}
          className="ml-btn ml-btn-dark w-full sm:w-auto"
        >
          Take the free assessment <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
        <a
          href="/library"
          onClick={() => track("cta_click", { button: "hero_library" })}
          className="ml-btn w-full sm:w-auto"
        >
          Browse the program library <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
        <span className="text-sm text-mute sm:ml-2.5 basis-full sm:basis-auto">
          30 questions. About 5 minutes. A personal report at the end.
        </span>
      </div>
      <figure className="mt-7 lg:mt-11">
        <img
          src="/images/site/home-hero-paris-ball-2000.jpg"
          srcSet="/images/site/home-hero-paris-ball-1200.jpg 1200w, /images/site/home-hero-paris-ball-2000.jpg 2000w"
          sizes="(min-width: 1440px) 1312px, 100vw"
          alt="A water polo match ball in the pool at Paris 2024"
          width={2000}
          height={1334}
          loading="eager"
          fetchPriority="high"
          className="block w-full h-[300px] sm:h-[440px] lg:h-[580px] object-cover object-[12%_80%] sm:object-[50%_86%] rounded-lg bg-oat"
        />
        <figcaption className="ml-small mt-2.5">Paris 2024.</figcaption>
      </figure>
    </section>
  );
}

// ─── Three ways in ───────────────────────────────────────
function Ways() {
  const { track } = useAnalytics();
  const ways = [
    {
      tag: "Free",
      kind: "Assessment",
      title: "The Performance Assessment",
      body: "Questions on your goals, sleep, stress, training, injuries, nutrition and recovery. You get a score, a category breakdown and a personal report.",
      rows: [["Questions", "30"], ["Time", "About 5 minutes"]],
      cta: "Take the assessment",
      href: "/assessment",
      event: "ways_assessment",
    },
    {
      tag: "Programs",
      kind: "Library",
      title: "The program library",
      body: "Pick your sport, your hobby, your stage of life or your job. Every program lives in the Bridge app on your phone.",
      rows: [["Programs", String(PROGRAMS.length)], ["Length", "4 to 8 weeks"]],
      cta: "Browse the library",
      href: "/library",
      event: "ways_library",
    },
    {
      tag: "Coaching",
      kind: "Founders and executives",
      title: "1:1 Executive Performance Coaching",
      body: "A clear plan for training, recovery, sleep and daily habits. The work starts with your schedule, training history and goals.",
      rows: [["Minimum", "3 months"], ["Applications", "Reviewed personally"]],
      cta: "Apply for coaching",
      href: "/apply",
      event: "hero_apply_coaching",
    },
  ];
  return (
    <section
      aria-label="Where to start"
      className="mt-9 lg:mt-14 flex gap-3 lg:gap-4 overflow-x-auto lg:overflow-visible -mx-5 px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0 pb-1"
    >
      {ways.map(w => (
        <article key={w.title} className="ml-card flex-[0_0_296px] lg:flex-1">
          <div className="ml-meta">
            <span className="ml-tag">{w.tag}</span>
            <span>{w.kind}</span>
          </div>
          <h2 className="font-heading font-bold text-[23px] leading-[1.2] tracking-[-0.01em] mt-4">{w.title}</h2>
          <p className="text-[15px] leading-normal text-body mt-2.5">{w.body}</p>
          <div className="mt-auto pt-6">
            {w.rows.map(([a, b]) => (
              <div key={a} className="ml-row">
                <span>{a}</span>
                <span>{b}</span>
              </div>
            ))}
            <a
              href={w.href}
              onClick={() => track("cta_click", { button: w.event })}
              className="ml-btn w-full mt-1.5"
            >
              {w.cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </article>
      ))}
    </section>
  );
}

// ─── How I coach: the season chart ───────────────────────
function Season() {
  const { track } = useAnalytics();
  const notes = [
    ["Build", "Load goes up in steps, with easy weeks planned in."],
    ["Peak", "Volume drops and sharpness goes up. You arrive fresh, not fried."],
    ["Recover", "Time off goes in the plan before the season starts."],
  ];
  return (
    <section id="season">
      <Label>How I coach</Label>
      <Heading title="My athletes peak on purpose.">
        Four campaigns since 2023. Each one was built, peaked and recovered to
        a plan. Nobody guessed, and nobody trained flat out all year.
      </Heading>
      <div className="bg-oat rounded-xl p-5 lg:p-9 mt-7 lg:mt-11">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink">
          <span className="inline-flex items-center gap-2">
            <span className="block w-7 h-[3px] rounded-full bg-ink" aria-hidden="true" />
            Athlete training load
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="block w-7 h-[3px] rounded-full bg-signal" aria-hidden="true" />
            Your year. No off season.
          </span>
        </div>
        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[760px]">
            <SeasonChart />
          </div>
        </div>
        <p className="ml-small mt-3">Drawn to show the pattern. Not real training data.</p>
      </div>
      <div className="grid gap-x-8 md:grid-cols-3 mt-5 lg:mt-8">
        {notes.map(([a, b]) => (
          <div key={a} className="border-t border-ink pt-3.5 pb-4 md:pb-0">
            <h3 className="font-heading font-bold text-base">{a}</h3>
            <p className="text-[15px] leading-normal text-body mt-1.5">{b}</p>
          </div>
        ))}
      </div>
      <div className="mt-7 lg:mt-14 flex flex-wrap items-center justify-between gap-5">
        <p className="font-heading font-semibold text-[22px] lg:text-[30px] leading-tight tracking-[-0.015em] max-w-[760px]">
          You don't get an off season. So the plan has to fit inside your week.
        </p>
        <a
          href="/assessment"
          onClick={() => track("cta_click", { button: "season_assessment" })}
          className="ml-btn ml-btn-dark w-full sm:w-auto"
        >
          See where your week stands <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

// ─── The assessment ──────────────────────────────────────
const AREAS = [
  ["Sleep", "Hours, quality and whether you wind down before bed."],
  ["Stress and mental", "Workload, focus through the day and what you do to manage stress."],
  ["Training", "Days a week, what you do and whether it has structure and progression."],
  ["Injuries and health", "Current injuries or pain and anything that limits training."],
  ["Nutrition and energy", "What you generally eat, your 3pm energy and how much you drink."],
  ["Recovery", "Planned recovery, wearable numbers if you have them and what is left after work."],
];

function AssessmentPreview() {
  const { track } = useAnalytics();
  return (
    <section id="assessment-preview">
      <Label right="Free">The Performance Assessment</Label>
      <div className="mt-7 lg:mt-11 grid gap-8 lg:gap-[72px] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-start">
        <div className="min-w-0">
          <h2 className="ml-h2">See where you stand.</h2>
          <p className="ml-lede mt-4 max-w-[520px]">
            30 questions and a personal report to help you consider your
            training, recovery and daily habits.
          </p>
          <div className="mt-6 lg:mt-9 border-b border-line">
            {AREAS.map(([a, b]) => (
              <div key={a} className="grid gap-x-6 gap-y-1 sm:grid-cols-[190px_minmax(0,1fr)] py-3.5 border-t border-line">
                <span className="text-base font-semibold text-ink">{a}</span>
                <span className="text-[15px] leading-normal text-body">{b}</span>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3.5">
            <a
              href="/assessment"
              onClick={() => track("cta_click", { button: "preview_get_report" })}
              className="ml-btn ml-btn-dark w-full sm:w-auto"
            >
              Get your free report <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <span className="text-sm text-mute">About 5 minutes.</span>
          </div>
        </div>
        <div className="bg-oat rounded-xl p-5 lg:p-8 min-w-0 w-full max-w-[520px]">
          <div className="ml-meta">
            <span className="ml-tag">Sample report</span>
            <span>Performance radar</span>
          </div>
          <div className="mt-3">
            <SampleRadar />
          </div>
          <div className="mt-2 border-t border-line pt-3.5">
            <h3 className="font-heading font-bold text-sm mb-1">Category scores</h3>
            <SampleBars />
          </div>
          <p className="ml-small mt-3.5">
            Illustrative scores only. This report is not a clinical diagnosis.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Programs ────────────────────────────────────────────
const FEATURED = [
  "the-corporate-athlete",
  "leader-performance-program",
  "women-leaders-performance",
  "travel-week-training",
];

function Programs() {
  const { track } = useAnalytics();
  const featured = FEATURED.map(slug => PROGRAMS.find(p => p.slug === slug)).filter(
    (p): p is (typeof PROGRAMS)[number] => Boolean(p)
  );
  const sectionTitle = (id: string) => SECTIONS.find(s => s.id === id)?.title ?? "";
  return (
    <section id="programs">
      <Label
        right={
          <a href="/library" className="underline underline-offset-2">
            See all {PROGRAMS.length} programs
          </a>
        }
      >
        Program library
      </Label>
      <Heading title="Buy a program. Follow it on your phone.">
        Pick your sport, your hobby, your stage of life or your job. Every
        program lives in the Bridge app on your phone.
      </Heading>
      <div className="mt-6 lg:mt-11 flex gap-3 lg:gap-4 overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-4 -mx-5 px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0 pb-1">
        {featured.map(p => (
          <article key={p.slug} className="ml-card flex-[0_0_284px] lg:flex-auto">
            <div className="ml-meta">
              <span className="ml-tag">{p.weeks} weeks</span>
              <span>{sectionTitle(p.section)}</span>
            </div>
            <h3 className="ml-h3 mt-3.5">{p.name}</h3>
            <p className="text-[14.5px] leading-normal text-body mt-2">{cardLine(p)}</p>
            <div className="mt-auto pt-5">
              <div className="ml-row">
                <span>Sessions</span>
                <span>{p.sessionsPerWeek ? `${p.sessionsPerWeek} a week` : p.place}</span>
              </div>
              <div className="ml-row">
                <span>Where</span>
                <span>Bridge app</span>
              </div>
              <a
                href={programPath(p)}
                onClick={() => track("cta_click", { button: `home_program_${p.slug}` })}
                className="ml-btn w-full mt-1.5"
              >
                View program <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {SECTIONS.map(s => (
          <a key={s.id} href={`/library#${s.id}`} className="ml-pill ml-pill-line min-h-11 lg:min-h-[38px] gap-2">
            {s.title}
            <span className="text-mute">{PROGRAMS.filter(p => p.section === s.id).length}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

// ─── Coaching and programs: the four services ────────────
function Services() {
  const { track } = useAnalytics();
  const services = [
    {
      number: "01",
      kind: "Founders and executives",
      title: "1:1 Executive Performance Coaching",
      body: "A training plan that works around work and family commitments, with direct coaching as your schedule changes.",
      graphic: <WeekGraphic />,
      href: "/executive-health-performance",
      link: "Executive coaching details",
      event: "service_01_details",
    },
    {
      number: "02",
      kind: "Athletes",
      title: "Athlete Performance Programming",
      body: "Strength and conditioning built around the demands of your sport, season and training history.",
      graphic: <WaveGraphic />,
      href: "/#contact",
      link: "Get in touch",
      event: "service_email_02",
    },
    {
      number: "03",
      kind: "Organisations",
      title: "Corporate Health and Performance Programs",
      body: "Otion programs for staff health, movement, recovery and sustainable work habits.",
      graphic: <TeamGraphic />,
      href: "/corporate-health-performance",
      link: "Corporate program details",
      event: "service_03_details",
    },
    {
      number: "04",
      kind: "Travel",
      title: "Travel and Jet Lag Recovery Protocols",
      body: "Sleep timing, light, meals and training planned around your route and arrival.",
      graphic: <TravelGraphic />,
      href: "/#contact",
      link: "Get in touch",
      event: "service_email_04",
    },
  ];
  return (
    <section id="services">
      <Label>Coaching and programs</Label>
      <Heading title="Shaped around the person, team or organisation.">
        Applications are reviewed before coaching places are confirmed.
      </Heading>
      <div className="mt-6 lg:mt-11 flex gap-3 lg:gap-4 overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-4 -mx-5 px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0 pb-1">
        {services.map(s => (
          <article key={s.number} className="flex flex-col min-w-0 flex-[0_0_264px] lg:flex-auto">
            <div className="text-[13px] font-medium text-mute mb-3">{s.kind}</div>
            {s.graphic}
            <h3 className="ml-h3 mt-4">{s.title}</h3>
            <p className="text-[14.5px] leading-normal text-mute mt-2">{s.body}</p>
            <a
              href={s.href}
              onClick={() => track("cta_click", { button: s.event })}
              className="mt-3 inline-flex items-center min-h-11 lg:min-h-0 self-start text-sm font-medium text-ink underline underline-offset-2"
            >
              {s.link}
            </a>
          </article>
        ))}
      </div>
      <div className="mt-6 lg:mt-9 flex flex-wrap items-center gap-3.5">
        <a
          href="/apply"
          onClick={() => track("cta_click", { button: "services_apply_coaching" })}
          className="ml-btn ml-btn-dark w-full sm:w-auto"
        >
          Apply for coaching <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
        <a
          href="/assessment"
          onClick={() => track("cta_click", { button: "services_performance_assessment" })}
          className="inline-flex items-center min-h-11 text-[15px] font-medium text-ink underline underline-offset-2"
        >
          Not sure yet? Take the free assessment
        </a>
      </div>
    </section>
  );
}

// ─── About ───────────────────────────────────────────────
const EXPERIENCE = [
  [
    "Strength and Conditioning Coach",
    "Australian Men's Water Polo Team",
    "Supported the team's preparation for Paris 2024 and continues to support the LA28 pathway.",
  ],
  ["Otion", "Corporate health and performance", "Health and performance support for organisations and leadership teams."],
  [
    "New Zealand Men's Water Polo",
    "Former national team player",
    "International competition experience that informs my approach to training, recovery and preparation.",
  ],
];

function About() {
  return (
    <section id="about">
      <Label>About</Label>
      <div className="mt-7 lg:mt-11 flex flex-wrap items-start gap-6 lg:gap-[72px]">
        <figure className="flex-[0_0_168px] sm:flex-[0_0_260px] lg:flex-[0_0_330px]">
          <img
            src="/images/site/marin-paris-2024-1120.jpg"
            srcSet="/images/site/marin-paris-2024-640.jpg 640w, /images/site/marin-paris-2024-1120.jpg 1120w"
            sizes="(min-width: 1024px) 330px, (min-width: 640px) 260px, 168px"
            alt="Marin Lazic standing in front of the Paris 2024 rings"
            width={1120}
            height={1400}
            loading="lazy"
            decoding="async"
            className="block w-full aspect-[4/5] object-cover rounded-lg bg-oat"
          />
          <figcaption className="ml-small mt-2.5">Marin Lazic, Paris 2024.</figcaption>
        </figure>
        <div className="flex-[1_1_300px] lg:flex-[1_1_560px] min-w-0 max-w-[760px]">
          <p className="font-heading font-semibold text-2xl lg:text-[34px] leading-[1.22] tracking-[-0.015em]">
            Training is one part of performance. Sleep, recovery, stress and the
            demands outside the gym matter too.
          </p>
          <p className="ml-lede mt-5">
            Four weeks before a World Championship, I was dropped from my
            national team. My fitness had not disappeared overnight, but stress
            changed how I felt and trained. At the time, I did not have the
            language or tools to deal with it.
          </p>
          <p className="ml-lede mt-3.5">
            That experience shaped how I coach. In my current role as Strength
            and Conditioning Coach for the Australian Men's Water Polo Team, I
            supported preparation for Paris 2024 and continue to support the
            LA28 pathway. I also work with founders and executives who want
            training and recovery plans that fit their work and family
            commitments.
          </p>
          <p className="ml-lede mt-3.5">
            I founded Otion to offer health and performance support to
            organisations. The work is practical, individual and shaped around
            the person or team in front of me.
          </p>
          <a
            href="/about"
            className="mt-4 inline-flex items-center min-h-11 text-[15px] font-medium text-ink underline underline-offset-2"
          >
            More about Marin
          </a>
        </div>
      </div>
      <div id="experience" className="grid gap-x-8 md:grid-cols-3 mt-7 lg:mt-14">
        {EXPERIENCE.map(([a, b, c]) => (
          <div key={a} className="border-t border-ink pt-3.5 pb-4 md:pb-0">
            <h3 className="font-heading font-bold text-base">{a}</h3>
            <p className="text-sm font-medium text-mute mt-0.5">{b}</p>
            <p className="text-[15px] leading-normal text-body mt-2">{c}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Latest insights ─────────────────────────────────────
function LatestInsights() {
  const { track } = useAnalytics();
  const latest = useMemo(
    () => [...insightsData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3),
    []
  );
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  return (
    <section id="articles">
      <Label
        right={
          <a
            href="/insights"
            onClick={() => track("cta_click", { button: "articles_view_all" })}
            className="underline underline-offset-2"
          >
            View all insights
          </a>
        }
      >
        Insights
      </Label>
      <div className="mt-7 lg:mt-11 grid gap-3 lg:gap-4 md:grid-cols-3">
        {latest.map((article, idx) => (
          <article key={article.slug} className="ml-card">
            <div className="ml-meta flex-wrap">
              <span className="ml-tag">{article.category}</span>
              <time dateTime={article.date}>{formatDate(article.date)}</time>
            </div>
            <h3 className="ml-h3 mt-3.5">{article.title}</h3>
            <p className="text-[14.5px] leading-normal text-body mt-2 line-clamp-3">{article.excerpt}</p>
            <div className="mt-auto pt-5">
              <a
                href={`/insights/${article.slug}`}
                onClick={() => track("cta_click", { button: `insight_${idx}` })}
                className="ml-btn w-full"
              >
                Read the article <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── Free guide: email sign up ───────────────────────────
function FreeGuide() {
  return (
    <section
      id="guide"
      className="mt-14 lg:mt-[88px] bg-oat rounded-xl p-5 lg:p-10 flex flex-wrap items-center gap-6 lg:gap-14"
    >
      <img
        src="/images/site/recovery-guide-surf-1600.jpg"
        srcSet="/images/site/recovery-guide-surf-800.jpg 800w, /images/site/recovery-guide-surf-1600.jpg 1600w"
        sizes="(min-width: 1024px) 480px, 100vw"
        alt="A surfer on a large breaking wave"
        width={1600}
        height={1200}
        loading="lazy"
        decoding="async"
        className="block flex-[1_1_280px] lg:flex-[1_1_420px] min-w-0 max-w-[520px] w-full aspect-[4/3] object-cover rounded-lg"
      />
      <div className="flex-[1_1_280px] lg:flex-[1_1_480px] min-w-0">
        <div className="ml-meta">
          <span className="ml-tag">Free guide</span>
          <span>34 pages</span>
        </div>
        <h2 className="font-heading font-bold text-[28px] lg:text-[40px] leading-[1.12] tracking-[-0.02em] mt-3.5">
          {RECOVERY_GUIDE.title}
        </h2>
        <p className="font-heading font-medium text-[17px] lg:text-[19px] leading-snug mt-1.5">
          {RECOVERY_GUIDE.subtitle}.
        </p>
        <p className="text-base leading-[1.55] text-body mt-3 max-w-[520px]">
          How to recover between sessions. Add your email and we send it now.
          We will also tell you when new programs land.
        </p>
        <GuideSignup placement="home" className="mt-5" />
        <a
          href="/recovery-guide"
          className="mt-2 inline-flex items-center min-h-11 text-sm font-medium text-ink underline underline-offset-2"
        >
          See what is inside
        </a>
      </div>
    </section>
  );
}

// ─── Common questions ────────────────────────────────────
function FAQ() {
  return (
    <section id="faq">
      <Label>Common questions</Label>
      <div className="mt-4 lg:mt-7 border-b border-line max-w-[980px]">
        {HOME_FAQS.map((faq, i) => (
          <details key={faq.q} open={i === 0} className="group border-t border-line">
            <summary className="flex items-start justify-between gap-4 py-[18px] cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <h3 className="font-heading font-semibold text-[17px] lg:text-[19px] leading-snug">{faq.q}</h3>
              <Plus className="w-[22px] h-[22px] shrink-0 mt-0.5 transition-transform group-open:rotate-45" aria-hidden="true" />
            </summary>
            <p className="text-base leading-[1.55] text-body pb-5 max-w-[760px]">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ─── Contact: the enquiry form ───────────────────────────
function Contact() {
  const { track } = useAnalytics();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [corporateEnquiry, setCorporateEnquiry] = useState(false);
  useEffect(() => {
    const corporate =
      new URLSearchParams(window.location.search).get("enquiry") ===
      "corporate";
    setCorporateEnquiry(corporate);
    if (corporate) setMessage("Corporate health enquiry. Company: ");
  }, []);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submitMutation = trpc.leads.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setError("");
      track("lead_submitted", {
        kind: corporateEnquiry ? "corporate_enquiry" : "contact",
      });
    },
    onError: err => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    track("cta_click", { button: "contact_submit" });

    submitMutation.mutate({
      email,
      source: corporateEnquiry
        ? "corporate-enquiry"
        : getAttribution().utm_source || getAttribution().referrer || "direct",
      message: message.trim() || undefined,
      corporate: corporateEnquiry,
    });
  };

  return (
    <section id="contact" className="scroll-mt-20">
      <Label>Contact</Label>
      <div className="mt-7 lg:mt-11 grid gap-7 lg:gap-[72px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-start">
        <div className="min-w-0">
          <h2 className="ml-h2">Get in touch.</h2>
          <p className="ml-lede mt-4 max-w-[520px]">
            Looking for coaching support? Apply directly, take the assessment,
            or leave your email to hear from Marin.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <a
              href="/apply"
              onClick={() => track("cta_click", { button: "contact_apply_coaching" })}
              className="ml-btn ml-btn-dark w-full sm:w-auto"
            >
              Apply for coaching <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href="/assessment"
              onClick={() => track("cta_click", { button: "contact_assessment" })}
              className="ml-btn w-full sm:w-auto"
            >
              Take the free assessment <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="bg-oat rounded-xl p-5 lg:p-8 min-w-0">
          {submitted ? (
            <div className="flex items-start gap-4 py-4">
              <CheckCircle className="w-6 h-6 text-ink shrink-0 mt-0.5" />
              <div>
                <h3 className="font-heading font-semibold text-xl mb-2">
                  Thanks for getting in touch.
                </h3>
                <p className="text-body leading-relaxed">
                  Your details have been received.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 className="font-heading font-bold text-sm mb-4">Email enquiry or updates</h3>
              <label htmlFor="contact-message" className="block text-[13px] font-medium text-mute mb-1.5">
                Your enquiry (optional)
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Tell me about your goals or company. Please do not include sensitive health information here."
                className="ml-input mb-4"
              />
              <label htmlFor="contact-email" className="block text-[13px] font-medium text-mute mb-1.5">
                Email
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="ml-input sm:flex-1"
                />
                <button type="submit" disabled={submitMutation.isPending} className="ml-btn ml-btn-dark">
                  {submitMutation.isPending ? "Sending..." : "Send enquiry"}
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-2 mt-3 text-ink text-sm" role="alert">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Sticky Apply Bar (A4) ───────────────────────────────
function StickyApplyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Mobile: slim bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-ivory/95 backdrop-blur-sm border-t border-line px-4 py-2.5 flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-mute">
          Coaching applications
        </span>
        <a href="/apply" className="ml-pill ml-pill-dark min-h-11">
          Apply for coaching
        </a>
      </div>
      {/* Desktop: floating button bottom-right */}
      <a
        href="/apply"
        className="hidden md:inline-flex fixed bottom-8 right-8 z-40 ml-btn ml-btn-dark"
      >
        Apply for coaching <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </a>
    </>
  );
}

// ─── Cookie Consent ───────────────────────────────────────
function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("ml_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("ml_cookie_consent", "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-ivory border-t border-line p-4 sm:p-5"
    >
      <div className="ml-wrap flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-body max-w-xl leading-relaxed">
          This site uses analytics cookies.
        </p>
        <button onClick={accept} className="ml-btn ml-btn-dark">
          Accept
        </button>
      </div>
    </motion.div>
  );
}

// ─── QUICK WIN #6: Exit-Intent Popup ─────────────────────
function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { track } = useAnalytics();

  useEffect(() => {
    // Don't show if already dismissed or already submitted a lead
    const wasDismissed = sessionStorage.getItem("ml_exit_popup_dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse moves to top of viewport (exit intent)
      if (e.clientY <= 5 && !dismissed) {
        setVisible(true);
        track("exit_intent_shown", {});
      }
    };

    // Delay adding the listener so it doesn't fire immediately
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [dismissed, track]);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("ml_exit_popup_dismissed", "true");
  };

  const goToAssessment = () => {
    dismiss();
    track("cta_click", { button: "exit_intent_assessment" });
    window.location.href = "/assessment";
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 bg-ink/60 z-[60] backdrop-blur-sm"
          />
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[90vw] max-w-md bg-ivory rounded-xl p-7 sm:p-9"
          >
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 inline-flex items-center justify-center w-11 h-11 text-mute hover:text-ink transition-colors"
              aria-label="Close popup"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="ml-tag">Free</span>
            <h3 className="font-heading font-bold text-2xl tracking-[-0.02em] mt-4 mb-3">
              Before you leave
            </h3>
            <p className="text-[15px] text-body leading-relaxed mb-6">
              Take the performance assessment to review your sleep, stress,
              recovery, energy and movement.
            </p>
            <button onClick={goToAssessment} className="ml-btn ml-btn-dark w-full">
              Take the Performance Assessment
            </button>
            <button
              onClick={dismiss}
              className="w-full mt-2 min-h-11 text-sm text-mute hover:text-ink transition-colors"
            >
              Close
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function Home() {
  const { track } = useAnalytics();

  // Track scroll depth
  useEffect(() => {
    const sections = [
      "hero",
      "season",
      "assessment-preview",
      "programs",
      "services",
      "about",
      "experience",
      "articles",
      "guide",
      "contact",
    ];
    const observers: IntersectionObserver[] = [];

    sections.forEach(sectionId => {
      const el = document.getElementById(sectionId);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            track("section_view", { section: sectionId });
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [track]);

  return (
    <div className="min-h-screen bg-ivory text-ink">
      <Nav />
      <main className="ml-wrap">
        <Hero />
        <Ways />
        <Season />
        <AssessmentPreview />
        <Programs />
        <Services />
        <About />
        <LatestInsights />
        <FreeGuide />
        <FAQ />
        <Contact />
      </main>
      <SiteFooter className="mt-[72px] lg:mt-[120px]" />
      <StickyApplyBar />
      <CookieConsent />
      <ExitIntentPopup />
    </div>
  );
}
