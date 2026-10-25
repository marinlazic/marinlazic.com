// /library: the program library. Programs live in shared/programs.ts and are
// sold and delivered in Bridge. Sections with no programs yet show a note.
import { useAnalytics } from "@/hooks/useAnalytics";
import { PROGRAMS, UPCOMING, SECTIONS, programLength, programPath } from "@shared/programs";
import { Breadcrumbs, Navigation } from "./InformationPage";
import { GuideSignup } from "@/components/GuideSignup";
import type { Thumb } from "@shared/programs";
import { ProgramThumb, THUMB_YELLOW } from "@/components/ProgramThumb";

export function LibraryFooter() {
  return (
    <footer className="border-t border-black/10">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 py-8 flex flex-wrap justify-between gap-4 text-[10px] tracking-[0.16em] uppercase text-black/45">
        <span>Marin Lazic</span>
        <a href="/" className="hover:text-black transition-colors">marinlazic.com</a>
      </div>
    </footer>
  );
}

const TEAM_THUMB: Thumb = {
  image: "/images/guide/floor.jpg",
  imageAlt: "People training together on a gym floor",
  focus: "center",
  word: "team",
  emoji: "\u{1F91D}",
  place: "Gym or home",
  tag: "corporate athlete",
};

const HERO_PHOTOS = [
  { src: "/images/library/max-strength.webp", pin: "Water polo", alt: "A water polo goal and net in a pool" },
  { src: "/images/guide/gym.jpg", pin: "Gym", alt: "People training in a gym with suspension straps" },
  { src: "/images/guide/lane.jpg", pin: "Pool", alt: "The edge of a pool lane" },
];

const BRIDGE_STEPS = [
  { n: "01", t: "Buy once", d: "No subscription." },
  { n: "02", t: "Check your email", d: "Your Bridge invite arrives in minutes." },
  { n: "03", t: "Train in the app", d: "A video for every exercise. Log your weights." },
];

const GUIDES = [
  { tag: "Water Polo Max Strength and Power", q: "How should a water polo player lift in a 4 week block?" },
  { tag: "Perimenopause Strength", q: "Where should you start with strength training in perimenopause?" },
  { tag: "Strength for Runners", q: "How many days a week should a runner lift?" },
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2.5 text-[11px] tracking-[0.16em] uppercase text-black/55">
      <span className="inline-block w-2 h-2 bg-[#2F6BF0]" aria-hidden="true" />
      {children}
    </span>
  );
}

export default function Library() {
  const { track } = useAnalytics();
  const num = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black flex flex-col">
      <Navigation />
      <main className="flex-1">
        {/* Hero: three photos side by side with one big word across them */}
        <section id="top" className="border-b border-black">
          <div className="relative flex flex-col sm:flex-row" style={{ containerType: "inline-size" }}>
            {HERO_PHOTOS.map(h => (
              <div key={h.src} className="relative flex-1 min-h-[220px] sm:min-h-[400px] bg-[#D9D9D9] overflow-hidden">
                <img src={h.src} alt={h.alt} className="absolute inset-0 w-full h-full object-cover" loading="eager" />
                <span className="absolute left-4 bottom-4 bg-white text-[#0B2530] text-[13px] font-semibold px-3 py-1.5 rounded-full">
                  {"\u{1F4CD}"} {h.pin}
                </span>
              </div>
            ))}
            <div
              aria-hidden="true"
              className="absolute inset-x-[3%] top-1/2 -translate-y-1/2 font-heading font-black lowercase leading-[0.8] tracking-[-0.05em] pointer-events-none"
              style={{ fontSize: "15cqw", color: THUMB_YELLOW, textShadow: "0 3px 20px rgba(0,0,0,0.4)" }}
            >
              your program
            </div>
            <span aria-hidden="true" className="absolute right-6 top-4 text-6xl rotate-12">{"\u{1F4A6}"}</span>
            <span aria-hidden="true" className="absolute left-6 bottom-12 text-6xl -rotate-12">{"\u{1F4AA}"}</span>
          </div>
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 pt-12 pb-14">
            <Breadcrumbs label="Program library" />
            <div className="mt-8 mb-6"><Label>01 The library</Label></div>
            <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-[-0.03em] leading-[1.02] max-w-4xl mb-6">
              Training programs built{" "}
              <span style={{ background: "#F4F59A", padding: "0 10px" }}>around your life.</span>
            </h1>
            <p className="text-base sm:text-lg text-black/70 leading-relaxed max-w-xl mb-8">
              Pick your sport, your hobby, your stage of life or your job. Every program lives in the Bridge app on your phone.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#water-polo" className="inline-flex bg-black text-white text-xs tracking-[0.15em] uppercase px-7 py-4 font-medium hover:bg-black/80 transition-colors">
                Browse the library
              </a>
              <a href="#guide" className="inline-flex border border-black text-xs tracking-[0.15em] uppercase px-7 py-4 font-medium hover:bg-black hover:text-white transition-colors">
                Get the free Recovery Guide
              </a>
            </div>
          </div>
        </section>

        <nav aria-label="Jump to" className="px-5 sm:px-8 lg:px-12 py-6 border-b border-black flex flex-wrap items-center gap-3">
          <span className="text-[11px] tracking-[0.16em] uppercase text-black/55 mr-2">Jump to</span>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className="bg-white border border-black/15 text-xs tracking-[0.12em] uppercase px-4 py-2 hover:border-black transition-colors font-medium">
              {s.title}
            </a>
          ))}
        </nav>

        <div className="px-5 sm:px-8 lg:px-12">
          {SECTIONS.map((s, i) => {
            const items = PROGRAMS.filter(p => p.section === s.id);
            const soon = UPCOMING.filter(u => u.section === s.id);
            return (
              <section key={s.id} id={s.id} className="pt-16 pb-6 scroll-mt-4">
                <div className="flex flex-wrap justify-between items-end gap-x-12 gap-y-4 pb-5 border-b border-black mb-7">
                  <div className="max-w-2xl">
                    <div className="mb-3"><Label>{num(i + 2)} {s.title}</Label></div>
                    <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-[-0.03em] leading-[1.06]">{s.heading}</h2>
                  </div>
                  <p className="text-base text-black/70 leading-relaxed max-w-md">{s.blurb}</p>
                </div>
                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map(p => (
                    <li key={p.slug} className="bg-white flex flex-col">
                      <a href={programPath(p)} className="block"><ProgramThumb p={p} /></a>
                      <div className="p-5 flex flex-col gap-3 flex-1">
                        <span className="text-[11px] tracking-[0.1em] uppercase text-black/55">{p.tag}</span>
                        <h3 className="font-heading font-bold text-[22px] leading-tight">
                          <a href={programPath(p)} className="hover:text-black/60 transition-colors">{p.name}</a>
                        </h3>
                        <p className="text-[15px] text-black/70 leading-relaxed">{p.description}</p>
                        <ul className="space-y-1.5">
                          {p.highlights.map(h => (
                            <li key={h} className="text-sm text-black/70 leading-snug">{h}</li>
                          ))}
                        </ul>
                        <p className="text-[13px] text-black/55 pt-3 border-t border-black/10 mt-auto">{programLength(p)} · {p.place}</p>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-heading font-bold text-3xl">${p.price}</span>
                          <a
                            href={p.buyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => track("cta_click", { button: `library_buy_${p.slug}` })}
                            className="inline-flex bg-black text-white text-xs tracking-[0.15em] uppercase px-6 py-3.5 hover:bg-black/80 transition-colors font-medium"
                          >
                            Buy now
                          </a>
                        </div>
                      </div>
                    </li>
                  ))}
                  {soon.map(u => (
                    <li key={u.name} className="bg-white flex flex-col">
                      <div className="relative">
                        <ProgramThumb p={u} />
                        <span className="absolute top-3 right-3 text-[11px] tracking-[0.08em] uppercase bg-black text-white px-2 py-1">Coming soon</span>
                      </div>
                      <div className="p-5 flex flex-col gap-3 flex-1">
                        <span className="text-[11px] tracking-[0.1em] uppercase text-black/55">{u.tag}</span>
                        <h3 className="font-heading font-bold text-[22px] leading-tight">{u.name}</h3>
                        <p className="text-[15px] text-black/70 leading-relaxed">{u.line}</p>
                        <p className="text-[13px] text-black/55 pt-3 border-t border-black/10 mt-auto">
                          {u.weeks} weeks, {u.sessionsPerWeek} sessions a week · {u.place}
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-heading font-bold text-3xl">${u.price}</span>
                          <a href="#guide" className="inline-flex border border-black text-xs tracking-[0.12em] uppercase px-5 py-3.5 hover:bg-black hover:text-white transition-colors font-medium">
                            Tell me when it is ready
                          </a>
                        </div>
                      </div>
                    </li>
                  ))}
                  {s.id === "corporate-athlete" ? (
                    <li className="bg-white flex flex-col">
                      <div className="relative">
                        <ProgramThumb p={TEAM_THUMB} />
                      </div>
                      <div className="p-5 flex flex-col gap-3 flex-1">
                        <span className="text-[11px] tracking-[0.1em] uppercase text-black/55">corporate athlete</span>
                        <h3 className="font-heading font-bold text-[22px] leading-tight">Team Program, 6 Weeks</h3>
                        <p className="text-[15px] text-black/70 leading-relaxed">One program for 10 or more people in your company, with a team check in at week 3.</p>
                        <p className="text-[13px] text-black/55 pt-3 border-t border-black/10 mt-auto">6 weeks, 3 sessions a week · Gym or home</p>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-heading font-bold text-3xl">Enquire</span>
                          <a href="/apply" className="inline-flex bg-black text-white text-xs tracking-[0.15em] uppercase px-6 py-3.5 hover:bg-black/80 transition-colors font-medium">
                            Enquire now
                          </a>
                        </div>
                      </div>
                    </li>
                  ) : null}
                </ul>
              </section>
            );
          })}
        </div>

        {/* Where the program lives */}
        <section id="bridge" className="mt-16 border-t border-black flex flex-col lg:flex-row scroll-mt-4">
          <div className="flex-1 px-5 sm:px-8 lg:px-12 py-16 flex flex-col gap-5">
            <Label>{num(SECTIONS.length + 2)} Where your program lives</Label>
            <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-[-0.03em] leading-[1.06]">Your program lives in the Bridge app.</h2>
            <p className="text-base text-black/70 leading-relaxed max-w-xl">
              Bridge is the training app I use with the Australian Men's Water Polo Team and my coaching clients. When you buy, you get an invite by email. Download the app, sign in, and your program is waiting.
            </p>
            <ol className="grid sm:grid-cols-3 gap-4 mt-2">
              {BRIDGE_STEPS.map(b => (
                <li key={b.n} className="bg-white p-5 flex flex-col gap-2">
                  <span className="font-heading font-bold text-sm text-black/55">{b.n}</span>
                  <span className="font-heading font-bold text-lg">{b.t}</span>
                  <span className="text-sm text-black/70 leading-relaxed">{b.d}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-3 mt-2">
              <a href="https://apps.apple.com/app/id1024299963" target="_blank" rel="noopener noreferrer" className="inline-flex bg-black text-white text-xs tracking-[0.15em] uppercase px-7 py-4 font-medium hover:bg-black/80 transition-colors">
                Download on the App Store
              </a>
              <span className="inline-flex items-center text-sm text-black/60">On Android, search for BridgeAthletic in Google Play.</span>
            </div>
          </div>
          <div className="flex-1 bg-[#D9D9D9] flex items-center justify-center p-6 sm:p-10">
            <figure className="max-w-[520px] w-full">
              <img src="/images/library/bridge-app.webp" alt="The Max Power and Strength program in Bridge, showing weekly volume, difficulty and load" className="w-full h-auto shadow-lg" loading="lazy" />
              <figcaption className="text-xs text-black/60 mt-3">A real program in Bridge: volume, difficulty and load for every week.</figcaption>
            </figure>
          </div>
        </section>

        {/* Guides */}
        <section id="blog" className="px-5 sm:px-8 lg:px-12 py-16 border-t border-black scroll-mt-4">
          <div className="mb-3"><Label>{num(SECTIONS.length + 3)} The guides</Label></div>
          <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-[-0.03em] leading-[1.06] mb-8 max-w-4xl">
            Every program has a guide that answers the questions first.
          </h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {GUIDES.map(g => (
              <li key={g.q} className="bg-white p-7 flex flex-col gap-3">
                <span className="text-[11px] tracking-[0.1em] uppercase text-black/55">{g.tag}</span>
                <span className="font-heading font-bold text-[22px] leading-snug">{g.q}</span>
                <span className="text-xs tracking-[0.12em] uppercase text-black/55 mt-1">Coming soon</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Free guide */}
        <section id="guide" className="border-t border-black flex flex-col lg:flex-row scroll-mt-4">
          <div className="flex-1 px-5 sm:px-8 lg:px-12 py-16 flex flex-col gap-5 justify-center">
            <Label>{num(SECTIONS.length + 4)} Free</Label>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-[-0.03em] leading-[1.08]">Not ready to buy? Start with the free Recovery Guide.</h2>
            <p className="text-base text-black/70 leading-relaxed max-w-lg">
              How to recover between sessions. Add your email and we send it now. We will also tell you when new programs land.
            </p>
            <GuideSignup placement="library" variant="inline" />
          </div>
          <div className="flex-1 min-h-[320px] bg-[#D9D9D9] relative">
            <img src="/images/guide/ice.jpg" alt="Athletes in ice baths" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          </div>
        </section>

        <div className="px-5 sm:px-8 lg:px-12 py-8 border-t border-black text-[13px] leading-relaxed text-black/60 flex flex-col gap-2">
          <span>Prices in Australian dollars. These programs are general training advice and not medical advice. If you have a health condition, are pregnant or have not trained for a long time, check with your doctor before you start.</span>
          <span>Marin Lazic, ASCA Level 2 Strength and Conditioning Coach. Sydney.</span>
        </div>
      </main>
      <LibraryFooter />
    </div>
  );
}
