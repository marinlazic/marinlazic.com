// The site header, used on every public page. Small pills each side of the
// name on wide screens, a menu button below that. Every destination the old
// header had is still here.
import React, { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

export const NAV_LEFT = [
  { label: "Programs", href: "/library" },
  { label: "Coaching", href: "/executive-health-performance" },
  { label: "Corporate", href: "/corporate-health-performance" },
  { label: "Resources", href: "/resources" },
];

export const NAV_RIGHT = [
  { label: "About", href: "/about" },
  { label: "Speaking", href: "/speaking" },
  { label: "Media", href: "/media" },
  { label: "Contact", href: "/#contact" },
];

// Shown in the menu on small screens only. The footer carries it on wide screens.
const NAV_MORE = [{ label: "Insights", href: "/insights" }];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const { track } = useAnalytics();

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 bg-ivory/95 backdrop-blur-sm"
    >
      <div className="ml-wrap flex items-center justify-between gap-4 h-[68px]">
        <div className="hidden xl:flex flex-1 items-center gap-1.5 shrink-0 whitespace-nowrap">
          {NAV_LEFT.map(l => (
            <a key={l.href} href={l.href} className="ml-pill">
              {l.label}
            </a>
          ))}
        </div>
        <a
          href="/"
          aria-label="Marin Lazic home"
          className="inline-flex items-center min-h-11 shrink-0 whitespace-nowrap font-heading font-bold text-[20px] sm:text-[21px] tracking-[-0.01em] text-ink no-underline"
        >
          Marin Lazic
        </a>
        <div className="hidden xl:flex flex-1 items-center justify-end gap-1.5 shrink-0 whitespace-nowrap">
          {NAV_RIGHT.map(l => (
            <a key={l.href} href={l.href} className="ml-pill">
              {l.label}
            </a>
          ))}
          <a
            href="/apply"
            onClick={() => track("cta_click", { button: "nav_apply_coaching" })}
            className="ml-pill"
          >
            Apply
          </a>
          <a
            href="/assessment"
            onClick={() => track("cta_click", { button: "nav_check_score" })}
            className="ml-pill ml-pill-dark"
          >
            Take the assessment
          </a>
        </div>
        <div className="xl:hidden flex items-center gap-1.5 shrink-0">
          <a
            href="/assessment"
            onClick={() =>
              track("cta_click", { button: "nav_check_score_mobile" })
            }
            className="ml-pill ml-pill-dark min-h-11"
          >
            Assessment
          </a>
          <button
            type="button"
            className="ml-pill min-h-11 min-w-11 justify-center"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="main-mobile-menu"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {open && (
        <div
          id="main-mobile-menu"
          className="xl:hidden bg-ivory border-b border-line"
        >
          <div className="ml-wrap pb-6 pt-1">
            {[...NAV_LEFT, ...NAV_RIGHT, ...NAV_MORE].map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center min-h-12 border-t border-line text-base font-medium text-ink no-underline"
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-line">
              <a
                href="/assessment"
                onClick={() => {
                  setOpen(false);
                  track("cta_click", { button: "nav_check_score_mobile" });
                }}
                className="ml-btn ml-btn-dark"
              >
                Take the free assessment
              </a>
              <a
                href="/apply"
                onClick={() => {
                  setOpen(false);
                  track("cta_click", { button: "nav_apply_coaching_mobile" });
                }}
                className="ml-btn"
              >
                Apply for coaching
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
