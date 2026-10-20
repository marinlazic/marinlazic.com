import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAnalytics } from "@/hooks/useAnalytics";
import { getAttribution } from "@/lib/attribution";
import {
  ArrowDown,
  Instagram,
  Linkedin,
  Twitter,
  CheckCircle,
  AlertCircle,
  X,
  ArrowRight,
} from "lucide-react";
import { articles as insightsData } from "@/data/articlesData";
import { HOME_FAQS } from "@shared/siteFaq";
import { GuideSignup } from "@/components/GuideSignup";
import { RECOVERY_GUIDE } from "@shared/recoveryGuide";

const HEADSHOT_URL =
  "/images/site/marin-about-photo_5aa64d77.jpg";

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  quot: '"',
  lt: "<",
  gt: ">",
  nbsp: " ",
  ndash: String.fromCharCode(0x2013),
  mdash: String.fromCharCode(0x2014),
  hellip: String.fromCharCode(0x2026),
};

function decodeHtml(value: string) {
  const text = value.replace(/<[^>]*>/g, " ");

  return text
    .replace(
      /&(#x[0-9a-f]+|#\d+|amp|apos|quot|lt|gt|nbsp|ndash|mdash|hellip);/gi,
      (entity, code: string) => {
        const key = code.toLowerCase();
        if (HTML_ENTITIES[key]) return HTML_ENTITIES[key];

        const codePoint = key.startsWith("#x")
          ? Number.parseInt(key.slice(2), 16)
          : Number.parseInt(key.slice(1), 10);
        const isSafeCodePoint =
          Number.isInteger(codePoint) &&
          codePoint >= 32 &&
          codePoint <= 0x10ffff &&
          (codePoint < 0xd800 || codePoint > 0xdfff);

        return isSafeCodePoint ? String.fromCodePoint(codePoint) : entity;
      }
    )
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Navigation with Sticky CTA ──────────────────────────
export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { track } = useAnalytics();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links: { label: string; href: string; external?: boolean }[] = [
    { label: "About", href: "/about" },
    { label: "Executive", href: "/executive-health-performance" },
    { label: "Corporate", href: "/corporate-health-performance" },
    { label: "Resources", href: "/resources" },
    { label: "Media", href: "/media" },
    { label: "Speaking", href: "/speaking" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#F4F4F4]/95 backdrop-blur-sm border-b border-black/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between gap-12 h-16">
        <a
          href="#hero"
          aria-label="Marin Lazic home"
          className="inline-flex items-center min-w-16 min-h-11 shrink-0 whitespace-nowrap font-heading font-bold text-sm tracking-[0.2em] uppercase"
        >
          ML
        </a>
        {/* Desktop */}
        <div className="hidden xl:flex items-center gap-8 shrink-0 whitespace-nowrap">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              {...(l.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="text-xs tracking-[0.15em] uppercase text-black/60 hover:text-black transition-colors font-medium"
            >
              {l.label}
            </a>
          ))}
          {/* Dual nav CTAs: ghost assessment + solid apply */}
          <a
            href="/assessment"
            onClick={() => track("cta_click", { button: "nav_check_score" })}
            className="border border-black/20 text-black text-xs tracking-[0.15em] uppercase px-5 py-2.5 hover:border-black/60 transition-colors font-medium"
          >
            Check Your Score
          </a>
          <a
            href="/apply"
            onClick={() => track("cta_click", { button: "nav_apply_coaching" })}
            className="bg-black text-white text-xs tracking-[0.15em] uppercase px-5 py-2.5 hover:bg-black/80 transition-colors font-medium"
          >
            Apply for Coaching
          </a>
        </div>
        {/* Mobile toggle */}
        <button
          className="xl:hidden flex flex-col items-center justify-center gap-1.5 min-w-11 min-h-11 shrink-0 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          aria-controls="main-mobile-menu"
        >
          <span
            className={`block w-5 h-[1.5px] bg-black transition-transform ${mobileOpen ? "rotate-45 translate-y-[5px]" : ""}`}
          />
          <span
            className={`block w-5 h-[1.5px] bg-black transition-opacity ${mobileOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-[1.5px] bg-black transition-transform ${mobileOpen ? "-rotate-45 -translate-y-[5px]" : ""}`}
          />
        </button>
      </div>
      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="main-mobile-menu"
          className="xl:hidden bg-[#F4F4F4] border-b border-black/10 px-5 sm:px-8 lg:px-12 pb-6 pt-2"
        >
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              {...(l.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="block py-3 text-sm tracking-[0.1em] uppercase text-black/70 hover:text-black border-b border-black/5 last:border-0"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/apply"
            onClick={() => {
              setMobileOpen(false);
              track("cta_click", { button: "nav_apply_coaching_mobile" });
            }}
            className="block mt-4 bg-black text-white text-center text-sm tracking-[0.1em] uppercase px-5 py-3"
          >
            Apply for Coaching
          </a>
          <a
            href="/assessment"
            onClick={() => {
              setMobileOpen(false);
              track("cta_click", { button: "nav_check_score_mobile" });
            }}
            className="block mt-2 border border-black/20 text-black text-center text-sm tracking-[0.1em] uppercase px-5 py-3"
          >
            Check Your Score
          </a>
        </div>
      )}
    </nav>
  );
}

// ─── Section wrapper with fade-in ──────────────────────────
function Section({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Hero ────────────────────────────────────────────────
function Hero() {
  const { track } = useAnalytics();

  return (
    <section
      id="hero"
      className="min-h-screen flex items-center relative pt-16"
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Text content */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            {/* Red accent square */}
            <div
              className="w-3 h-3 bg-[#2F6BF0] mb-8"
              aria-hidden="true"
              role="presentation"
            />
            <h1 className="font-heading font-bold text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] tracking-[-0.03em] text-black uppercase">
              Marin
              <br /> Lazic
            </h1>
            <div
              className="w-16 h-[1.5px] bg-black mt-6 mb-6"
              aria-hidden="true"
              role="presentation"
            />
            <p className="text-base sm:text-lg text-black/70 max-w-lg leading-relaxed font-light">
              Performance coach for founders, training and recovery. Strength
              and Conditioning Coach for the Australian Men's Water Polo Team.
              Worked with the team at Paris 2024 and supports the LA28 pathway.
            </p>
            {/* Hero CTAs: Apply primary, Assessment secondary */}
            <div className="flex flex-wrap gap-4 mt-10">
              <a
                href="/apply"
                onClick={() =>
                  track("cta_click", { button: "hero_apply_coaching" })
                }
                className="inline-flex items-center bg-black text-white text-sm tracking-[0.15em] uppercase px-8 py-4 hover:bg-black/80 transition-colors font-medium"
              >
                Apply for Coaching
              </a>
              <a
                href="/assessment"
                onClick={() =>
                  track("cta_click", { button: "hero_assessment" })
                }
                className="inline-flex items-center border border-black/20 text-black text-sm tracking-[0.15em] uppercase px-8 py-4 hover:border-black/60 transition-colors font-medium"
              >
                Take the Free Assessment
              </a>
              <a
                href="#about"
                className="inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase text-black/60 hover:text-black px-4 py-4 transition-colors font-medium"
              >
                The Story <ArrowDown className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          {/* Right: Photo */}
          <div className="lg:col-span-5 order-1 lg:order-2 relative">
            <div className="relative">
              {/* Brand gradient panel behind the photo */}
              <div
                className="absolute -top-5 -right-5 w-full h-full ml-gradient hidden lg:block"
                aria-hidden="true"
                role="presentation"
              />
              <img
                src={HEADSHOT_URL}
                alt="Marin Lazic, Strength and Conditioning Coach for the Australian Men's Water Polo Team, at Paris 2024"
                className="relative w-full aspect-[3/4] object-cover object-top grayscale"
              />
              {/* Small red square accent */}
              <div
                className="absolute bottom-6 -left-3 w-6 h-6 bg-[#2F6BF0] hidden lg:block"
                aria-hidden="true"
                role="presentation"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-black/30">
        <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <div
          className="w-[1px] h-8 bg-black/20"
          aria-hidden="true"
          role="presentation"
        />
      </div>
    </section>
  );
}

// ─── QUICK WIN #3: Trust Bar / Credential Logos ──────────
const LOGO_AOC =
  "/images/site/logo-aoc_4dbb2319.png";
const LOGO_OTION =
  "/images/site/logo-otion_f3da2ae0.png";
const LOGO_PARIS =
  "/images/site/logo-paris2024_5f63ac2a.png";

function TrustBar() {
  const logos = [
    {
      name: "Australian Olympic Committee",
      src: LOGO_AOC,
      height: "h-10 sm:h-12",
    },
    {
      name: "Otion Health and Performance",
      src: LOGO_OTION,
      height: "h-7 sm:h-9",
    },
    {
      name: "Paris 2024 Olympic Games",
      src: LOGO_PARIS,
      height: "h-8 sm:h-10",
    },
  ];

  return (
    <div className="border-t border-b border-black/10 py-6 sm:py-8 bg-white">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="text-[10px] tracking-[0.2em] uppercase text-black/30 font-medium shrink-0">
            Experience includes
          </span>
          <div className="flex items-center gap-10 sm:gap-16 flex-wrap justify-center">
            {logos.map(logo => (
              <img
                key={logo.name}
                src={logo.src}
                alt={logo.name}
                className={`${logo.height} w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── About / Bio ──────────────────────────────────────────
function About() {
  return (
    <Section id="about" className="py-24 lg:py-32 border-t border-black/10">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Label column */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-2.5 h-2.5 bg-[#2F6BF0]"
                aria-hidden="true"
                role="presentation"
              />
              <span className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium">
                About
              </span>
            </div>
            <h2 className="font-heading font-bold text-2xl lg:text-3xl tracking-[-0.02em]">
              The Work
              <br />
              Behind the
              <br />
              Coaching.
            </h2>
          </div>
          {/* Content column */}
          <div className="lg:col-span-9 lg:pl-8 lg:border-l border-black/10">
            <p className="text-xl sm:text-2xl text-black font-heading font-semibold leading-snug mb-8 tracking-[-0.01em]">
              Training is one part of performance. Sleep, recovery, stress and
              the demands outside the gym matter too.
            </p>
            <p className="text-base sm:text-lg text-black/70 leading-relaxed mb-6">
              Four weeks before a World Championship, I was dropped from my
              national team. My fitness had not disappeared overnight, but
              stress changed how I felt and trained. At the time, I did not have
              the language or tools to deal with it.
            </p>
            <p className="text-base sm:text-lg text-black/70 leading-relaxed mb-6">
              That experience shaped how I coach. In my current role as Strength
              and Conditioning Coach for the Australian Men's Water Polo Team, I
              supported preparation for Paris 2024 and continue to support the
              LA28 pathway. I also work with founders and executives who want
              training and recovery plans that fit their work and family
              commitments.
            </p>
            <p className="text-base sm:text-lg text-black/70 leading-relaxed mb-8">
              I founded Otion to offer health and performance support to
              organisations. The work is practical, individual and shaped around
              the person or team in front of me.
            </p>
            <a
              href="/about"
              className="inline-flex items-center gap-2 text-sm text-black font-medium hover:text-black/70 transition-colors mb-8"
            >
              More about Marin <ArrowRight className="w-3.5 h-3.5" />
            </a>
            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-black/10">
              {[
                { value: "Paris 2024", label: "Olympics" },
                { value: "LA28", label: "Pathway" },
                { value: "Otion", label: "Founder" },
                { value: "Sydney", label: "Based" },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="font-heading font-bold text-lg sm:text-xl tracking-[-0.02em]">
                    {stat.value}
                  </p>
                  <p className="text-xs text-black/40 mt-1 tracking-[0.05em] uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── CV Timeline ──────────────────────────────────────────
const timelineData = [
  {
    year: "Current role",
    role: "Strength & Conditioning Coach",
    org: "Australian Men's Water Polo Team",
    desc: "Supported the team's preparation for Paris 2024 and continues to support the LA28 pathway.",
  },
  {
    year: "Current work",
    role: "Founder",
    org: "Otion, Corporate Health & Performance",
    desc: "Health and performance support for organisations and leadership teams.",
  },
  {
    year: "Athlete experience",
    role: "National Team Athlete",
    org: "New Zealand Men's Water Polo",
    desc: "International competition experience that informs Marin's approach to training, recovery and preparation.",
  },
];

function Timeline() {
  return (
    <Section
      id="experience"
      className="py-24 lg:py-32 bg-white border-t border-black/10"
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-2.5 h-2.5 bg-[#2F6BF0]"
                aria-hidden="true"
                role="presentation"
              />
              <span className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium">
                Experience
              </span>
            </div>
            <h2 className="font-heading font-bold text-2xl lg:text-3xl tracking-[-0.02em]">
              Experience
              <br />
              and context
            </h2>
            <p className="text-sm text-black/50 mt-4 leading-relaxed">
              Experience across high performance sport and health coaching.
            </p>
          </div>
          <div className="lg:col-span-9">
            <div className="space-y-0">
              {timelineData.map((item, i) => (
                <div
                  key={i}
                  className="group grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-8 py-8 border-b border-black/10 first:pt-0 last:border-0"
                >
                  <div className="text-xs tracking-[0.1em] uppercase text-black/40 font-medium pt-1">
                    {item.year}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-base sm:text-lg text-black">
                      {item.role}
                    </h3>
                    <p className="text-sm text-black font-medium mt-0.5">
                      {item.org}
                    </p>
                    <p className="text-sm text-black/55 mt-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Services with Email Contact buttons ───────────────────
const services = [
  {
    number: "01",
    title: "1:1 Executive Performance Coaching",
    description:
      "Coaching for founders and executives who want a clear plan for training, recovery, sleep and daily habits. The work starts with your schedule, training history and goals.",
    outcomes: [
      "A training plan that works around work and family commitments",
      "Regular review of sleep, recovery and training data where available",
      "Direct coaching and adjustments as your schedule changes",
    ],
    href: "/executive-health-performance",
    linkLabel: "Executive coaching details",
  },
  {
    number: "02",
    title: "Athlete Performance Programming",
    description:
      "Strength and conditioning programming for athletes, built around the demands of their sport, season and training history.",
    outcomes: [
      "Periodised training and recovery planning",
      "Training load review alongside the competition calendar",
      "Clear communication with the athlete and their support team",
    ],
  },
  {
    number: "03",
    title: "Corporate Health & Performance Programs",
    description:
      "Otion programs for organisations that want practical support for staff health, movement, recovery and sustainable work habits.",
    outcomes: [
      "Sessions and resources shaped around the needs of your team",
      "Practical guidance on movement, sleep, recovery and nutrition",
      "A clear scope agreed with your organisation before the work begins",
    ],
    href: "/corporate-health-performance",
    linkLabel: "Corporate program details",
  },
  {
    number: "04",
    title: "Travel & Jet Lag Recovery Protocols",
    description:
      "Travel planning for athletes and professionals crossing time zones, based on the trip schedule, destination and event or work demands.",
    outcomes: [
      "Plans for sleep timing, light exposure, meals and training around travel",
      "Guidance adjusted to the travel route and arrival schedule",
      "A practical routine for the days before, during and after travel",
    ],
  },
];

function Services() {
  const { track } = useAnalytics();
  return (
    <Section id="services" className="py-24 lg:py-32 border-t border-black/10">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-2.5 h-2.5 bg-[#2F6BF0]"
                aria-hidden="true"
                role="presentation"
              />
              <span className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium">
                Services
              </span>
            </div>
            <h2 className="font-heading font-bold text-2xl lg:text-3xl tracking-[-0.02em]">
              Coaching and
              <br />
              Programs
            </h2>
            <p className="text-sm text-black/50 mt-4 leading-relaxed">
              Clear support shaped around the person, team or organisation.
            </p>
            {/* Availability note */}
            <div className="mt-6 p-4 border border-black/20 bg-black/5">
              <p className="text-[10px] tracking-[0.15em] uppercase text-black font-semibold mb-1">
                Availability
              </p>
              <p className="text-xs text-black/50 leading-relaxed">
                Applications are reviewed before coaching places are confirmed.
              </p>
            </div>
          </div>
          <div className="lg:col-span-9 lg:pl-8 lg:border-l border-black/10">
            <div className="space-y-0">
              {services.map((service, i) => (
                <div
                  key={i}
                  className="py-8 border-b border-black/10 first:pt-0 last:border-0"
                >
                  {/* Service header */}
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-xs tracking-[0.1em] text-black font-bold mt-1 shrink-0">
                      {service.number}
                    </span>
                    <h3 className="font-heading font-semibold text-lg sm:text-xl tracking-[-0.01em]">
                      {service.title}
                    </h3>
                  </div>
                  {/* Description */}
                  <p className="text-sm sm:text-base text-black/60 leading-relaxed mb-5 pl-8 sm:pl-10">
                    {service.description}
                  </p>
                  {/* Outcomes */}
                  <div className="pl-8 sm:pl-10 space-y-2.5">
                    <p className="text-xs tracking-[0.15em] uppercase text-black/35 font-medium mb-3">
                      Included
                    </p>
                    {service.outcomes.map((outcome, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-[#2F6BF0] mt-1.5 shrink-0" />
                        <p className="text-sm text-black/55 leading-relaxed">
                          {outcome}
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* CTA: Apply for 1:1, Get in Touch for others */}
                  <div className="pl-8 sm:pl-10 mt-5">
                    {service.number === "01" ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-4">
                          <a
                            href="/apply"
                            onClick={() =>
                              track("cta_click", { button: "service_01_apply" })
                            }
                            className="inline-flex items-center gap-2 bg-black text-white text-xs tracking-[0.15em] uppercase px-6 py-3 hover:bg-black/80 transition-colors font-medium"
                          >
                            Apply for Coaching{" "}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={service.href}
                            className="text-xs text-black/50 hover:text-black transition-colors"
                          >
                            {service.linkLabel}
                          </a>
                        </div>
                        <a
                          href="/assessment"
                          onClick={() =>
                            track("cta_click", {
                              button: "service_01_assessment",
                            })
                          }
                          className="inline-flex items-center gap-1.5 text-xs text-black/50 hover:text-black/70 transition-colors"
                        >
                          Not sure yet? Take the free assessment
                        </a>
                      </div>
                    ) : service.href ? (
                      <a
                        href={service.href}
                        onClick={() =>
                          track("cta_click", {
                            button: `service_${service.number}_details`,
                          })
                        }
                        className="inline-flex items-center gap-2 text-sm text-black font-medium hover:text-black/70 transition-colors group"
                      >
                        {service.linkLabel}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </a>
                    ) : (
                      <a
                        href="/#contact"
                        onClick={() =>
                          track("cta_click", {
                            button: `service_email_${service.number}`,
                          })
                        }
                        className="inline-flex items-center gap-2 text-sm text-black font-medium hover:text-black/70 transition-colors group"
                      >
                        Get in Touch
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/apply"
                onClick={() =>
                  track("cta_click", { button: "services_apply_coaching" })
                }
                className="inline-flex items-center bg-black text-white text-sm tracking-[0.15em] uppercase px-8 py-4 hover:bg-black/80 transition-colors font-medium"
              >
                Apply for Coaching
              </a>
              <a
                href="/assessment"
                onClick={() =>
                  track("cta_click", {
                    button: "services_performance_assessment",
                  })
                }
                className="inline-flex items-center border border-black/20 text-black text-sm tracking-[0.15em] uppercase px-8 py-4 hover:border-black/60 transition-colors font-medium"
              >
                Take the Free Assessment
              </a>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Assessment Preview (Marketing) ──────────────────────
function AssessmentPreview() {
  const { track } = useAnalytics();

  const sampleCategories = [
    { name: "Sleep", score: 40 },
    { name: "Stress", score: 30 },
    { name: "Training", score: 50 },
    { name: "Recovery", score: 35 },
    { name: "Nutrition", score: 55 },
    { name: "Injuries", score: 40 },
  ];

  const radarPoints = sampleCategories.map((cat, i) => {
    const angle = (Math.PI * 2 * i) / sampleCategories.length - Math.PI / 2;
    const r = (cat.score / 100) * 80;
    return { x: 100 + r * Math.cos(angle), y: 100 + r * Math.sin(angle) };
  });
  const radarPath =
    radarPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ") + " Z";
  const gridLevels = [25, 50, 75, 100];

  return (
    <Section
      id="assessment-preview"
      className="py-16 sm:py-20 lg:py-32 border-t border-black/10"
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-16">
          {/* Left label column */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-2.5 h-2.5 bg-[#2F6BF0]"
                aria-hidden="true"
                role="presentation"
              />
              <span className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium">
                Free Report
              </span>
            </div>
            <h2 className="font-heading font-bold text-2xl lg:text-3xl tracking-[-0.02em]">
              See Where
              <br />
              You Stand
            </h2>
            <p className="text-sm text-black/50 mt-4 leading-relaxed">
              27 questions and a personal report to help you consider your
              training, recovery and daily habits.
            </p>
            <div className="mt-6">
              <a
                href="/assessment"
                onClick={() =>
                  track("cta_click", { button: "preview_get_report" })
                }
                className="inline-flex items-center bg-black text-white text-xs sm:text-sm tracking-[0.15em] uppercase px-6 sm:px-8 py-3.5 sm:py-4 hover:bg-black/80 transition-colors font-medium"
              >
                Get Your Free Report
              </a>
              <p className="text-[10px] text-black/30 mt-3 tracking-[0.05em]">
                About 5 minutes.
              </p>
            </div>
          </div>

          {/* Right content column */}
          <div className="lg:col-span-9 lg:pl-8 lg:border-l border-black/10">
            {/* Radar chart + category bars side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
              {/* Radar chart */}
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-black/30 font-medium mb-4 sm:mb-6">
                  Performance Radar
                </p>
                <div className="flex justify-center">
                  <svg
                    viewBox="0 0 200 200"
                    className="w-[200px] sm:w-[220px] md:w-full md:max-w-[260px]"
                  >
                    {gridLevels.map(level => (
                      <polygon
                        key={level}
                        points={sampleCategories
                          .map((_, i) => {
                            const a =
                              (Math.PI * 2 * i) / sampleCategories.length -
                              Math.PI / 2;
                            const r = (level / 100) * 80;
                            return `${100 + r * Math.cos(a)},${100 + r * Math.sin(a)}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="rgba(0,0,0,0.06)"
                        strokeWidth="0.5"
                      />
                    ))}
                    {sampleCategories.map((_, i) => {
                      const a =
                        (Math.PI * 2 * i) / sampleCategories.length -
                        Math.PI / 2;
                      return (
                        <line
                          key={i}
                          x1="100"
                          y1="100"
                          x2={100 + 80 * Math.cos(a)}
                          y2={100 + 80 * Math.sin(a)}
                          stroke="rgba(0,0,0,0.04)"
                          strokeWidth="0.5"
                        />
                      );
                    })}
                    <path
                      d={radarPath}
                      fill="rgba(47,107,240,0.10)"
                      stroke="#2F6BF0"
                      strokeWidth="1.5"
                    />
                    {radarPoints.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="3" fill="#2F6BF0" />
                    ))}
                    {sampleCategories.map((cat, i) => {
                      const a =
                        (Math.PI * 2 * i) / sampleCategories.length -
                        Math.PI / 2;
                      return (
                        <text
                          key={i}
                          x={100 + 95 * Math.cos(a)}
                          y={100 + 95 * Math.sin(a)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-black/40"
                          style={{
                            fontSize: "8px",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {cat.name}
                        </text>
                      );
                    })}
                  </svg>
                </div>
                <p className="text-center text-[10px] text-black/25 mt-3 italic">
                  Illustrative scores only. This report is not a clinical
                  diagnosis.
                </p>
              </div>

              {/* Category bars */}
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-black/30 font-medium mb-4 sm:mb-6">
                  Category Scores
                </p>
                <div className="space-y-3 sm:space-y-4">
                  {sampleCategories.map(cat => {
                    const isLow = cat.score < 50;
                    return (
                      <div key={cat.name}>
                        <div className="flex justify-between items-baseline mb-1 sm:mb-1.5">
                          <span className="text-xs sm:text-sm text-black/70 font-medium">
                            {cat.name}
                          </span>
                          <span
                            className={`text-xs sm:text-sm font-bold ${isLow ? "text-black" : "text-black/70"}`}
                          >
                            {cat.score}
                          </span>
                        </div>
                        <div className="h-[2px] sm:h-[3px] bg-black/5 overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${cat.score}%`,
                              backgroundColor: isLow ? "#2F6BF0" : "#1a1a1a",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-[1px] bg-black/10 my-8 sm:my-10" />

            {/* Pro Tips */}
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-black/30 font-medium mb-4 sm:mb-6">
                Sample Pro Tips From Your Report
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-1.5 h-1.5 bg-[#2F6BF0] mt-1.5 sm:mt-2 shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.1em] uppercase text-black font-semibold mb-1">
                      Stress
                    </p>
                    <p className="text-xs sm:text-sm text-black/55 leading-relaxed">
                      Short breathing exercises may help some people with mood
                      and perceived stress. A review found no significant change
                      in HRV.{" "}
                      <a
                        href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black underline underline-offset-2 hover:text-black/70"
                      >
                        Read the review
                      </a>
                      .
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-1.5 h-1.5 bg-[#2F6BF0] mt-1.5 sm:mt-2 shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.1em] uppercase text-black font-semibold mb-1">
                      Sleep
                    </p>
                    <p className="text-xs sm:text-sm text-black/55 leading-relaxed">
                      Start with a consistent sleep and wake time. If you want
                      to change your evening routine, test one change at a time
                      and notice how it affects you.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom line */}
            <p className="text-[10px] sm:text-xs text-black/30 mt-8 sm:mt-10">
              Scores are illustrative and are designed to prompt reflection, not
              to diagnose a health condition.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Latest Insights ─────────────────────────
function LatestInsights() {
  const { track } = useAnalytics();
  const latestArticles = useMemo(() => {
    return [...insightsData]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Section
      id="articles"
      className="py-24 lg:py-32 bg-white border-t border-black/10"
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left label */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-[#2F6BF0]" aria-hidden="true" />
              <span className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium">
                Latest Writing
              </span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em] leading-[1.1]">
              Latest
              <br />
              Insights
            </h2>
            <p className="text-sm text-black/50 mt-4 leading-relaxed">
              Practical writing on training, recovery and health.
            </p>
            <a
              href="/resources"
              onClick={() =>
                track("cta_click", { button: "articles_view_all" })
              }
              className="inline-flex items-center gap-2 mt-6 text-sm text-black font-medium hover:text-black/70 transition-colors group"
            >
              Browse resources
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Articles grid */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestArticles.map((article, idx) => (
                <a
                  key={article.slug}
                  href={`/insights/${article.slug}`}
                  onClick={() =>
                    track("cta_click", { button: `insight_${idx}` })
                  }
                  className="group bg-white border border-black/5 hover:border-black/15 transition-all duration-300 hover:shadow-sm"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
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
                    <p className="text-sm text-black/55 leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-1.5 mt-4 text-xs text-black font-medium tracking-[0.1em] uppercase group-hover:gap-2.5 transition-all">
                      Read
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── From the Substack (RSS Feed) ─────────────────────────
// ─── Free guide ─────────────────────────────────────────
function FreeGuide() {
  return (
    <Section id="free-guide" className="py-24 lg:py-32 border-t border-black/10">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-[#2F6BF0]" aria-hidden="true" />
              <span className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium">Free guide</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em] leading-[1.1]">
              The Recovery
              <br />
              Guide
            </h2>
            <p className="text-sm text-black/50 mt-4 leading-relaxed">17 pages. {RECOVERY_GUIDE.subtitle}.</p>
          </div>
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-8">
                <p className="text-base sm:text-lg text-black/70 leading-relaxed mb-6 max-w-2xl">{RECOVERY_GUIDE.promise}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-8 max-w-2xl">
                  {RECOVERY_GUIDE.whatsInside.slice(0, 4).map(item => (
                    <li key={item} className="flex gap-3 text-sm text-black/65 leading-relaxed">
                      <span className="w-2 h-2 bg-[#2F6BF0] mt-2 shrink-0" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <GuideSignup placement="home" />
                <a href="/recovery-guide" className="inline-block mt-4 text-xs tracking-[0.15em] uppercase text-black/50 hover:text-black transition-colors font-medium">
                  See what is inside
                </a>
              </div>
              <div className="hidden lg:block lg:col-span-4 ml-gradient min-h-[260px]" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function SubstackArticles() {
  const { track } = useAnalytics();
  const { data: articles, isLoading } = trpc.articles.latest.useQuery({
    limit: 3,
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Section id="substack" className="py-24 lg:py-32 border-t border-black/10">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left label */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-[#2F6BF0]" aria-hidden="true" />
              <span className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium">
                Substack
              </span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em] leading-[1.1]">
              From the
              <br />
              Substack
            </h2>
            <p className="text-sm text-black/50 mt-4 leading-relaxed">
              Long form writing on training and recovery.
            </p>
            <a
              href="https://marinlazic.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                track("cta_click", { button: "substack_view_all" })
              }
              className="inline-flex items-center gap-2 mt-6 text-sm text-black font-medium hover:text-black/70 transition-colors group"
            >
              Read on Substack
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Articles grid */}
          <div className="lg:col-span-9">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[0, 1, 2].map(i => (
                  <div key={i} className="bg-white animate-pulse">
                    <div className="aspect-[16/9] bg-black/5" />
                    <div className="p-6 space-y-3">
                      <div className="h-3 bg-black/5 rounded w-1/3" />
                      <div className="h-5 bg-black/5 rounded w-full" />
                      <div className="h-4 bg-black/5 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : articles && articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {articles.map((article, idx) => (
                  <a
                    key={idx}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      track("cta_click", { button: `substack_article_${idx}` })
                    }
                    className="group bg-white border border-black/5 hover:border-black/15 transition-all duration-300 hover:shadow-sm"
                  >
                    {article.image && (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-black/35 font-medium">
                        {formatDate(article.pubDate)}
                      </span>
                      <h3 className="font-heading font-bold text-base sm:text-lg tracking-[-0.01em] leading-snug mt-2 mb-3 group-hover:text-black/60 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-black/55 leading-relaxed line-clamp-3">
                        {decodeHtml(article.description)}
                      </p>
                      <span className="inline-flex items-center gap-1.5 mt-4 text-xs text-black font-medium tracking-[0.1em] uppercase group-hover:gap-2.5 transition-all">
                        Read on Substack
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-black/40">
                No articles available right now.
              </p>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Email Capture / Contact ─────────────────────────────
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
    <Section id="contact" className="py-24 lg:py-32 border-t border-black/10">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-2.5 h-2.5 bg-[#2F6BF0]"
                aria-hidden="true"
                role="presentation"
              />
              <span className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium">
                Contact
              </span>
            </div>
            <h2 className="font-heading font-bold text-2xl lg:text-3xl tracking-[-0.02em]">
              Get in
              <br />
              touch
            </h2>
          </div>
          <div className="lg:col-span-9 lg:pl-8 lg:border-l border-black/10">
            {submitted ? (
              <div className="flex items-start gap-4 py-8">
                <CheckCircle className="w-6 h-6 text-black shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-heading font-semibold text-xl mb-2">
                    Thanks for getting in touch.
                  </h3>
                  <p className="text-black/60 leading-relaxed">
                    Your details have been received.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-heading font-semibold text-xl lg:text-2xl mb-3">
                  Looking for coaching support?
                </h3>
                <p className="text-black/60 leading-relaxed mb-8 max-w-xl">
                  Apply directly, take the assessment, or leave your email to
                  hear from Marin.
                </p>

                {/* Two clear forks */}
                <div className="flex flex-wrap gap-4 mb-10">
                  <a
                    href="/apply"
                    onClick={() =>
                      track("cta_click", { button: "contact_apply_coaching" })
                    }
                    className="inline-flex items-center bg-black text-white text-sm tracking-[0.15em] uppercase px-8 py-4 hover:bg-black/80 transition-colors font-medium"
                  >
                    Apply for Coaching
                  </a>
                  <a
                    href="/assessment"
                    onClick={() =>
                      track("cta_click", { button: "contact_assessment" })
                    }
                    className="inline-flex items-center border border-black/20 text-black text-sm tracking-[0.15em] uppercase px-8 py-4 hover:border-black/60 transition-colors font-medium"
                  >
                    Take the Free Assessment
                  </a>
                </div>

                {/* Email capture as tertiary path */}
                <div className="border-t border-black/10 pt-8">
                  <p className="text-xs tracking-[0.15em] uppercase text-black/40 font-medium mb-4">
                    Email enquiry or updates
                  </p>
                  <form onSubmit={handleSubmit} className="max-w-lg">
                    <label
                      htmlFor="contact-message"
                      className="block text-xs text-black/50 mb-2"
                    >
                      Your enquiry (optional)
                    </label>
                    <textarea
                      id="contact-message"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder="Tell me about your goals or company. Please do not include sensitive health information here."
                      className="w-full border border-black/20 p-4 mb-4 text-sm focus:border-black bg-white"
                    />
                    <label
                      htmlFor="contact-email"
                      className="block text-xs text-black/50 mb-2"
                    >
                      Email
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="flex-1 border border-black/20 bg-transparent px-4 py-3.5 text-sm placeholder:text-black/30 focus:outline-none focus:border-black transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={submitMutation.isPending}
                        className="bg-black text-white text-sm tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-black/80 transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
                      >
                        {submitMutation.isPending
                          ? "Sending..."
                          : "Send enquiry"}
                      </button>
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 mt-3 text-black text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── FAQ Section (GEO/AEO) ──────────────────────────────────
function FAQ() {
  return (
    <section className="py-20 lg:py-28 border-t border-black/10">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <span className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium">
            Frequently Asked Questions
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight leading-[0.95] mt-3 mb-10">
            Common Questions
          </h2>
          <div className="space-y-8">
            {HOME_FAQS.map((faq, i) => (
              <div
                key={i}
                className="border-b border-black/10 pb-8 last:border-0"
              >
                <h3 className="text-base font-semibold text-black mb-3">
                  {faq.q}
                </h3>
                <p className="text-sm text-black/60 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-12 border-t border-black/10">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <span className="font-heading font-bold text-sm tracking-[0.2em] uppercase">
              Marin Lazic
            </span>
            <p className="text-xs text-black/40 mt-2">
              Health and performance coaching in Sydney and online.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <a
                href="/apply"
                className="text-xs tracking-[0.1em] uppercase text-black font-medium hover:text-black/70 transition-colors"
              >
                Apply for Coaching
              </a>
              <a
                href="/assessment"
                className="text-xs tracking-[0.1em] uppercase text-black/50 hover:text-black transition-colors"
              >
                Free Assessment
              </a>
              <a
                href="/resources"
                className="text-xs tracking-[0.1em] uppercase text-black/50 hover:text-black transition-colors"
              >
                Resources
              </a>
              <a
                href="/media"
                className="text-xs tracking-[0.1em] uppercase text-black/50 hover:text-black transition-colors"
              >
                Media and interviews
              </a>
            </div>
          </div>
          <div className="md:col-span-4">
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/marinLazic"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/40 hover:text-black transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/marinlazic?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/40 hover:text-black transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://x.com/marinlazic"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/40 hover:text-black transition-colors"
                aria-label="X (Twitter)"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="md:col-span-4 md:text-right">
            <p className="text-xs text-black/30">
              &copy; {new Date().getFullYear()} Marin Lazic. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F4F4F4]/95 backdrop-blur-sm border-t border-black/10 px-4 py-3 flex items-center justify-between">
        <span className="text-[10px] tracking-[0.1em] uppercase text-black/50 font-medium">
          Coaching applications
        </span>
        <a
          href="/apply"
          className="bg-black text-white text-[11px] tracking-[0.15em] uppercase px-5 py-2.5 hover:bg-black/80 transition-colors font-medium"
        >
          Apply for Coaching
        </a>
      </div>
      {/* Desktop: floating button bottom-right */}
      <a
        href="/apply"
        className="hidden md:flex fixed bottom-8 right-8 z-50 items-center gap-2 bg-black text-white text-xs tracking-[0.15em] uppercase px-6 py-3.5 hover:bg-black/80 transition-all shadow-lg hover:shadow-xl font-medium"
      >
        Apply for Coaching <ArrowRight className="w-3.5 h-3.5" />
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/10 p-4 sm:p-6"
    >
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-xs text-black/60 max-w-xl leading-relaxed">
          This site uses analytics cookies.
        </p>
        <button
          onClick={accept}
          className="bg-black text-white text-xs tracking-[0.1em] uppercase px-6 py-2.5 hover:bg-black/80 transition-colors font-medium shrink-0"
        >
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
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
          />
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[90vw] max-w-md bg-white p-8 sm:p-10"
          >
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 text-black/30 hover:text-black transition-colors"
              aria-label="Close popup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-3 h-3 bg-[#2F6BF0] mb-6" aria-hidden="true" />

            <h3 className="font-heading font-bold text-xl sm:text-2xl tracking-[-0.02em] mb-3">
              Before you leave
            </h3>
            <p className="text-sm text-black/60 leading-relaxed mb-6">
              Take the performance assessment to review your sleep, stress,
              recovery, energy and movement.
            </p>

            <button
              onClick={goToAssessment}
              className="w-full bg-black text-white text-sm tracking-[0.15em] uppercase px-8 py-4 hover:bg-black/80 transition-colors font-medium"
            >
              Take the Performance Assessment
            </button>

            <button
              onClick={dismiss}
              className="w-full mt-3 text-xs text-black/30 hover:text-black/50 transition-colors py-2"
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
      "about",
      "experience",
      "services",
      "assessment-preview",
      "articles",
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
    <div className="min-h-screen bg-[#F4F4F4] text-black">
      <Nav />
      <Hero />
      <AssessmentPreview />
      <TrustBar />
      <About />
      <Timeline />
      <Services />
      <LatestInsights />
      <FreeGuide />
      <SubstackArticles />
      <Contact />
      <FAQ />
      <Footer />
      <StickyApplyBar />
      <CookieConsent />
      <ExitIntentPopup />
    </div>
  );
}
