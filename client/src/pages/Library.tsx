// /library: the program library. Programs live in shared/programs.ts and are
// sold and delivered in Bridge. Sections with no programs yet show a note.
import { useAnalytics } from "@/hooks/useAnalytics";
import { PROGRAMS, SECTIONS, programLength, programPath } from "@shared/programs";
import { Breadcrumbs, Navigation } from "./InformationPage";
import { GuideSignup } from "@/components/GuideSignup";
import { ProgramThumb } from "@/components/ProgramThumb";

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

export default function Library() {
  const { track } = useAnalytics();
  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black flex flex-col">
      <Navigation />
      <main className="flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <Breadcrumbs label="Program library" />
          <div className="w-3 h-3 bg-[#2F6BF0] mb-8" aria-hidden="true" />
          <p className="text-[10px] tracking-[0.2em] uppercase text-black font-semibold mb-4">
            Program library
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold uppercase tracking-[-0.035em] leading-[0.93] mb-6 max-w-4xl">
            Training programs by Marin Lazic
          </h1>
          <p className="text-base sm:text-lg text-black/65 leading-relaxed max-w-2xl mb-8">
            Buy a program and train in the Bridge app. Each program comes from
            the strength and conditioning work Marin does with the Australian
            Men's Water Polo Team.
          </p>

          <nav aria-label="Jump to" className="flex flex-wrap items-center gap-3 mb-16">
            <span className="text-[10px] tracking-[0.2em] uppercase text-black/45 mr-2">
              Jump to
            </span>
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="border border-black/20 text-xs tracking-[0.14em] uppercase px-4 py-2 hover:border-black/60 transition-colors font-medium"
              >
                {s.title}
              </a>
            ))}
          </nav>

          <div className="space-y-16">
            {SECTIONS.map((s, i) => {
              const items = PROGRAMS.filter(p => p.section === s.id);
              return (
                <section key={s.id} id={s.id} className="border-t border-black/10 pt-7 scroll-mt-8">
                  <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-5">
                    {String(i + 1).padStart(2, "0")} {s.title}
                  </h2>
                  <p className="text-sm sm:text-base text-black/70 leading-relaxed max-w-2xl mb-8">
                    {s.blurb}
                  </p>
                  {items.length === 0 ? (
                    <p className="text-sm text-black/55">Programs coming soon.</p>
                  ) : (
                    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map(p => (
                        <li key={p.slug} className="bg-white border border-black/10 flex flex-col">
                          <a href={programPath(p)} className="block">
                            <ProgramThumb p={p} />
                          </a>
                          <div className="p-5 flex flex-col flex-1">
                            <h3 className="font-heading font-bold text-xl tracking-[-0.02em] mb-2">
                              <a href={programPath(p)} className="hover:text-black/60 transition-colors">
                                {p.name}
                              </a>
                            </h3>
                            <p className="text-sm text-black/65 leading-relaxed mb-4">{p.description}</p>
                            <ul className="mb-5 space-y-1.5">
                              {p.highlights.map(h => (
                                <li key={h} className="text-sm text-black/70 leading-snug">{h}</li>
                              ))}
                            </ul>
                            <p className="text-[10px] tracking-[0.16em] uppercase text-black/45 mb-5">
                              {programLength(p)} · {p.place}
                            </p>
                            <div className="mt-auto flex items-center justify-between gap-3">
                              <span className="font-heading font-bold text-xl">
                                ${p.price} <span className="text-xs font-medium text-black/45">{p.currency}</span>
                              </span>
                              <a
                                href={p.buyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => track("cta_click", { button: `library_buy_${p.slug}` })}
                                className="inline-flex bg-black text-white text-xs tracking-[0.15em] uppercase px-5 py-3 hover:bg-black/80 transition-colors font-medium"
                              >
                                Buy
                              </a>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}

            <section id="how-it-works" className="border-t border-black/10 pt-7 scroll-mt-8">
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-5">
                Where your program lives
              </h2>
              <ol className="grid sm:grid-cols-3 gap-6 max-w-4xl">
                {[
                  "Pick a program and press Buy. You check out on Bridge.",
                  "Bridge adds the program to your account and your team, Program Library.",
                  "Open the Bridge app on your phone. Each session, set and rep is in there.",
                ].map((t, i) => (
                  <li key={t} className="border-t border-black/10 pt-4">
                    <span className="block font-heading font-bold text-2xl mb-2">{i + 1}</span>
                    <span className="text-sm text-black/70 leading-relaxed">{t}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="border-t border-black/10 pt-7">
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-5">
                Free
              </h2>
              <p className="font-heading text-2xl font-bold tracking-[-0.02em] mb-4">
                Get the Recovery Guide
              </p>
              <GuideSignup placement="library" variant="inline" />
            </section>
          </div>
        </div>
      </main>
      <LibraryFooter />
    </div>
  );
}
