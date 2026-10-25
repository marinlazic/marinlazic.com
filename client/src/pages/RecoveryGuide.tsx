// /recovery-guide: the page every Instagram link and email can point to.
// What the guide is, what is inside, the signup, and a taste of section 04.
import { PageBand } from "@/components/PageBand";
import { Breadcrumbs, Navigation } from "./InformationPage";
import { GuideSignup } from "@/components/GuideSignup";
import { GUIDE_PHOTOS, RECOVERY_GUIDE } from "@shared/recoveryGuide";

const G = RECOVERY_GUIDE;
const fatigue = G.sections.find(s => s.number === "04")?.blocks.find(b => b.type === "tiles");

export default function RecoveryGuide() {
  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black flex flex-col">
      <Navigation />
      <PageBand src="/images/guide/ice.jpg" alt="Ice baths used for recovery" word="recover" emoji={"\u{1F9CA}"} pin="Recovery guide" position="center" />
      <main className="flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <Breadcrumbs label="Recovery Guide" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch mb-16">
            <div className="lg:col-span-7">
              <div className="w-3 h-3 bg-[#FFD400] mb-8" aria-hidden="true" />
              <p className="text-[10px] tracking-[0.2em] uppercase text-black font-semibold mb-4">Free guide, 34 pages</p>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-[0.93] mb-6">
                {G.title}
              </h1>
              <p className="font-heading text-xl sm:text-2xl tracking-[-0.02em] leading-snug mb-6">{G.subtitle}</p>
              <p className="text-base sm:text-lg text-black/65 leading-relaxed max-w-2xl mb-8">{G.promise}</p>
              <GuideSignup placement="recovery-guide-page" />
            </div>
            <div className="hidden lg:block lg:col-span-5 min-h-[320px] bg-black overflow-hidden">
              <img src={GUIDE_PHOTOS.hero} alt="" className="w-full h-full object-cover" />
            </div>
          </div>

          <section className="border-t border-black/10 pt-7 mb-16">
            <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-6">What is inside</h2>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 max-w-4xl">
              {G.whatsInside.map((item, i) => (
                <li key={item} className="flex gap-4 border-t border-black/10 pt-4">
                  <span className="font-heading text-2xl text-black/30 tracking-[-0.04em] leading-none w-10 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-sm sm:text-base text-black/75 leading-relaxed">{item}</p>
                </li>
              ))}
            </ol>
          </section>

          {fatigue && fatigue.type === "tiles" && (
            <section className="border-t border-black/10 pt-7 mb-16">
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-2">A taste of section 04</h2>
              <p className="font-heading text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-8">The four kinds of fatigue</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {fatigue.items.map(t => (
                  <article key={t.title} className="min-w-0">
                    <div className="relative aspect-[4/3] bg-black overflow-hidden">
                      <img src={GUIDE_PHOTOS[t.photo]} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                      <h3 className="absolute left-4 bottom-3 text-white font-heading font-bold text-xl tracking-[-0.02em]">{t.title}</h3>
                    </div>
                    <p className="text-[10px] tracking-[0.16em] uppercase text-black/45 mt-4 mb-1">What causes it</p>
                    <p className="text-sm text-black/70 leading-relaxed">{t.cause}</p>
                    <p className="text-[10px] tracking-[0.16em] uppercase text-black/45 mt-3 mb-1">What it feels like</p>
                    <p className="text-sm text-black/70 leading-relaxed">{t.feel}</p>
                  </article>
                ))}
              </div>
              <p className="text-sm text-black/60 mt-8 max-w-2xl">
                Section 05 gives you the matching list for each one: cold water, stretching, easy movement, compression, breathing, light and sleep, with times and temperatures.
              </p>
            </section>
          )}

          <section className="border-t border-black/10 pt-7 mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7">
                <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-4">Who wrote it</h2>
                <p className="text-sm sm:text-base text-black/70 leading-relaxed max-w-2xl mb-6">
                  {G.author}. {G.authorLine} The guide is the recovery system I use with the national team, written for people who train hard around a full week of work.
                </p>
                <GuideSignup placement="recovery-guide-page-bottom" />
              </div>
              <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-black/10 pt-6 lg:pt-0 lg:pl-10">
                <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-4">Want to know where you stand?</h2>
                <p className="text-sm text-black/70 leading-relaxed mb-5">
                  The free assessment takes about ten minutes and scores your sleep, stress, training, nutrition and recovery, with a report on what to fix first.
                </p>
                <a href="/assessment" className="inline-flex bg-[#FFD400] text-black border-2 border-black text-sm tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-black hover:text-[#FFD400] transition-colors font-medium">
                  Take the assessment
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
      <footer className="border-t border-black/10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 py-8 flex flex-wrap justify-between gap-4 text-[10px] tracking-[0.16em] uppercase text-black/45">
          <span>Marin Lazic</span>
          <a href="/" className="hover:text-black transition-colors">marinlazic.com</a>
        </div>
      </footer>
    </div>
  );
}
