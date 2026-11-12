// The site footer: black, name on the left, the main pages as rows, a short
// line about Marin on the right.
import { PROGRAMS } from "@shared/programs";

const ROWS = [
  { label: "Performance Assessment", note: "Free", href: "/assessment" },
  { label: "Program library", note: `${PROGRAMS.length} programs`, href: "/library" },
  { label: "Coaching", note: "Apply", href: "/apply" },
  { label: "Corporate", note: "For teams", href: "/corporate-health-performance" },
  { label: "Resources", note: "Guides", href: "/resources" },
  { label: "Insights", note: "Articles", href: "/insights" },
  { label: "Speaking", note: "Enquire", href: "/speaking" },
  { label: "Media", note: "Interviews", href: "/media" },
  { label: "About", note: "Marin", href: "/about" },
  { label: "Contact", note: "Email", href: "/#contact" },
];

const SOCIAL = [
  { label: "Instagram", href: "https://www.instagram.com/marinLazic" },
  { label: "YouTube", href: "https://www.youtube.com/@MarinLazic" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/marinlazic?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
  },
  { label: "X", href: "https://x.com/marinlazic" },
  { label: "Substack", href: "https://marinlazic.substack.com/" },
];

export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`bg-ink text-ivory ${className}`}>
      <div className="ml-wrap pt-12 lg:pt-[72px] pb-8 lg:pb-12 flex flex-wrap gap-8 lg:gap-16">
        <div className="flex-[1_1_200px] font-heading font-bold text-2xl tracking-[-0.01em]">
          Marin Lazic
        </div>
        <div className="flex-[2_1_280px] lg:flex-[2_1_520px] min-w-0 border-b border-[#3A3A37]">
          {ROWS.map(r => (
            <a
              key={r.href}
              href={r.href}
              className="flex justify-between gap-4 py-3.5 border-t border-[#3A3A37] text-[15px] leading-snug text-ivory no-underline hover:text-[#B0AEA5] transition-colors"
            >
              <span>{r.label}</span>
              <span className="text-[#B0AEA5]">{r.note}</span>
            </a>
          ))}
        </div>
        <div className="flex-[1_1_240px] flex flex-col gap-3.5">
          <p className="text-sm leading-[1.55] text-[#B0AEA5]">
            <span className="text-ivory">
              Health and performance coaching in Sydney and online.
            </span>{" "}
            Marin Lazic, ASCA Level 2 Strength and Conditioning Coach.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {SOCIAL.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ivory underline underline-offset-2 hover:text-[#B0AEA5] transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="ml-wrap pb-8 text-[13px] text-[#B0AEA5]">
        &copy; {new Date().getFullYear()} Marin Lazic. All rights reserved.
      </div>
    </footer>
  );
}
