// /resources. A magazine style front page: a featured guide in the middle,
// short lists either side, then every guide as a card. Photos are black and
// white, bright enough to read the subject at a glance.
import { SiteFooter } from "@/components/site/SiteFooter";
import { Navigation, Breadcrumbs, Picture } from "./InformationPage";
import { resourcesHero, resourceImagePath } from "@/data/resourceImages";
import { WordTile } from "@/components/WordTile";

const TILE_WORDS: Record<string, { word: string; emoji: string }> = {
  template: { word: "lift", emoji: "\u{1F3CB}\uFE0F" },
  groove: { word: "groove", emoji: "\u{1F4AA}" },
  routine: { word: "daily", emoji: "\u{1F305}" },
  move: { word: "warm up", emoji: "\u{1F938}" },
  protein: { word: "eat", emoji: "\u{1F373}" },
  engine: { word: "engine", emoji: "\u{1FAC0}" },
  recover: { word: "recover", emoji: "\u{1F30A}" },
  week3: { word: "week 3", emoji: "\u{1F4D3}" },
  sleep: { word: "sleep", emoji: "\u{1F634}" },
};
import { GuideSignup } from "@/components/GuideSignup";
import { featuredResource, popularResources, resourceCards, startHereResources, type ResourceCard } from "@/data/resourceIndex";

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-2.5 h-2.5 hidden" aria-hidden="true" />
      <h2 className="font-heading text-[13px] font-semibold">{children}</h2>
    </div>
  );
}

function ListItem({ card }: { card: ResourceCard }) {
  return (
    <li className="border-b border-line last:border-b-0">
      <a href={card.href} className="group flex gap-4 py-4">
        {card.photo && (
          <Picture photo={card.photo} sizes="96px" className="w-24 h-24 object-cover shrink-0 block" />
        )}
        <span className="min-w-0">
          <span className="block text-[13px] text-mute font-medium mb-1">{card.category}</span>
          <span className="block font-heading font-bold text-[15px] leading-snug text-black group-hover:text-mute transition-colors">{card.title}</span>
          <span className="block mt-1 text-[11px] text-mute">{card.minutes} min read</span>
        </span>
      </a>
    </li>
  );
}

function Card({ card }: { card: ResourceCard }) {
  return (
    <li>
      <a href={card.href} className="group block">
        {card.photo && (
          <WordTile
            src={resourceImagePath(card.photo.base, 1200, "jpg")}
            alt={card.photo.alt}
            word={(TILE_WORDS[card.alias] ?? { word: "read" }).word}
            emoji={(TILE_WORDS[card.alias] ?? { emoji: "\u{1F4D6}" }).emoji}
            pin={card.category}
          />
        )}
        <span className="block pt-4">
          <span className="block text-[13px] text-black font-semibold mb-2">{card.category}</span>
          <span className="block font-heading font-bold text-lg leading-tight text-black group-hover:text-mute transition-colors">{card.title}</span>
          <span className="block mt-2 text-sm text-mute leading-relaxed">{card.summary}</span>
          <span className="block mt-2 text-[11px] text-mute">{card.minutes} min read</span>
        </span>
      </a>
    </li>
  );
}

export default function ResourcesIndex() {
  const featured = featuredResource;
  const grid = resourceCards.filter(c => c.alias !== featured.alias);

  return (
    <div className="min-h-screen bg-ivory text-black flex flex-col">
      <Navigation />
      <main className="flex-1 px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <Breadcrumbs label="Resources" />
          <div className="w-3 h-3 hidden mb-6" aria-hidden="true" />
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-10 lg:mb-12">
            <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-[-0.03em] leading-[1.02]">
              Resources
            </h1>
            <p className="text-base sm:text-lg text-black/65 leading-relaxed max-w-xl">
              Nine short guides on training, recovery, nutrition and sleep. Free, practical, written for busy people who still want to train well.
            </p>
          </div>

          {/* Front page: popular, featured, start here */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 border-t border-line pt-8">
            <aside className="lg:col-span-3 order-2 lg:order-1">
              <SectionLabel>Most read</SectionLabel>
              <ul>
                {popularResources.map(c => (
                  <ListItem key={c.alias} card={c} />
                ))}
              </ul>
            </aside>

            <section className="lg:col-span-6 order-1 lg:order-2" aria-labelledby="featured-heading">
              <a href={featured.href} className="group block">
                <WordTile
                  src={resourceImagePath(resourcesHero.base, 1800, "jpg")}
                  alt={resourcesHero.alt}
                  word="start"
                  emoji={"\u{1F3CB}\uFE0F"}
                  pin="Featured guide"
                  aspect="aspect-[3/2]"
                  eager
                />
                <span className="block text-[13px] text-black font-semibold mt-5 mb-3">
                  Featured guide. {featured.category}
                </span>
                <h2 id="featured-heading" className="font-heading font-bold text-3xl sm:text-4xl lg:text-[40px] leading-[1.02] tracking-[-0.02em] group-hover:text-mute transition-colors">
                  {featured.title}
                </h2>
                <span className="block mt-3 text-base text-black/65 leading-relaxed">{featured.summary}</span>
                <span className="inline-flex items-center mt-5 text-[13px] font-medium border-b border-black pb-0.5 group-hover:border-black group-hover:text-mute transition-colors">
                  Read the guide
                </span>
              </a>
            </section>

            <aside className="lg:col-span-3 order-3">
              <SectionLabel>Start here</SectionLabel>
              <ul>
                {startHereResources.map(c => (
                  <ListItem key={c.alias} card={c} />
                ))}
              </ul>
            </aside>
          </div>

          {/* Every guide */}
          <section className="mt-14 lg:mt-20 border-t border-line pt-8" aria-labelledby="all-guides">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2.5 h-2.5 hidden" aria-hidden="true" />
              <h2 id="all-guides" className="font-heading text-[13px] font-semibold">
                All guides
              </h2>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {grid.map(c => (
                <Card key={c.alias} card={c} />
              ))}
            </ul>
          </section>

          {/* How to use, and next step */}
          <section className="mt-14 lg:mt-20 border-t border-line pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <h2 className="text-[13px] text-mute font-medium mb-4">How to use these guides</h2>
              <p className="text-sm sm:text-base text-body leading-relaxed max-w-2xl">
                These are short educational guides, not programmes written for you. Take what fits your experience and context, and adjust when needed. They are not medical advice. Stop an activity if it causes pain, and see a qualified clinician for symptoms, injuries or health concerns.
              </p>
            </div>
            <div className="lg:col-span-5 lg:border-l lg:border-black/10 lg:pl-8">
              <h2 className="text-[13px] text-mute font-medium mb-4">Want it done for you</h2>
              <p className="text-sm sm:text-base text-body leading-relaxed mb-5">
                Take the free assessment for a score and a written report, or apply for coaching and I build the plan around your week.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="/assessment" className="inline-flex items-center bg-ink text-ivory rounded-lg hover:bg-[#3D3D3A] text-[15px] px-6 py-3.5 transition-colors font-medium">
                  Take the assessment
                </a>
                <a href="/apply" className="inline-flex items-center text-ink text-[15px] px-6 py-3.5 transition-colors font-medium bg-stone rounded-lg hover:bg-[#D9D5C9]">
                  Apply for coaching
                </a>
              </div>
            </div>
          </section>

          <GuideSignup placement="resources-index" variant="inline" className="mt-16" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
