// /resources. A magazine style front page: a featured guide in the middle,
// short lists either side, then every guide as a card. Photos are black and
// white, bright enough to read the subject at a glance.
import { Navigation, Breadcrumbs, Picture } from "./InformationPage";
import { resourcesHero } from "@/data/resourceImages";
import { featuredResource, popularResources, resourceCards, startHereResources, type ResourceCard } from "@/data/resourceIndex";

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-2.5 h-2.5 bg-[#2F6BF0]" aria-hidden="true" />
      <h2 className="font-heading text-xs tracking-[0.22em] uppercase font-semibold">{children}</h2>
    </div>
  );
}

function ListItem({ card }: { card: ResourceCard }) {
  return (
    <li className="border-b border-black/10 last:border-b-0">
      <a href={card.href} className="group flex gap-4 py-4">
        {card.photo && (
          <Picture photo={card.photo} sizes="96px" className="w-24 h-24 object-cover shrink-0 block" />
        )}
        <span className="min-w-0">
          <span className="block text-[10px] tracking-[0.18em] uppercase text-black/45 font-medium mb-1">{card.category}</span>
          <span className="block font-heading font-bold text-[15px] leading-snug text-black group-hover:text-black/60 transition-colors">{card.title}</span>
          <span className="block mt-1 text-[11px] text-black/45">{card.minutes} min read</span>
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
          <Picture
            photo={card.photo}
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="w-full aspect-[4/3] object-cover block"
          />
        )}
        <span className="block pt-4">
          <span className="block text-[10px] tracking-[0.18em] uppercase text-black font-semibold mb-2">{card.category}</span>
          <span className="block font-heading font-bold text-lg leading-tight text-black group-hover:text-black/60 transition-colors">{card.title}</span>
          <span className="block mt-2 text-sm text-black/60 leading-relaxed">{card.summary}</span>
          <span className="block mt-2 text-[11px] text-black/45">{card.minutes} min read</span>
        </span>
      </a>
    </li>
  );
}

export default function ResourcesIndex() {
  const featured = featuredResource;
  const grid = resourceCards.filter(c => c.alias !== featured.alias);

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black flex flex-col">
      <Navigation />
      <main className="flex-1 px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <Breadcrumbs label="Resources" />
          <div className="w-3 h-3 bg-[#2F6BF0] mb-6" aria-hidden="true" />
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-10 lg:mb-12">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-[-0.035em] leading-[0.93]">
              Resources
            </h1>
            <p className="text-base sm:text-lg text-black/65 leading-relaxed max-w-xl">
              Nine short guides on training, recovery, nutrition and sleep. Free, practical, written for busy people who still want to train well.
            </p>
          </div>

          {/* Front page: popular, featured, start here */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 border-t border-black/10 pt-8">
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
                <Picture photo={resourcesHero} sizes="(min-width: 1024px) 620px, 100vw" className="w-full aspect-[3/2] object-cover block" eager />
                <span className="block text-[10px] tracking-[0.18em] uppercase text-black font-semibold mt-5 mb-3">
                  Featured guide. {featured.category}
                </span>
                <h2 id="featured-heading" className="font-heading font-bold text-3xl sm:text-4xl lg:text-[40px] leading-[1.02] tracking-[-0.02em] group-hover:text-black/60 transition-colors">
                  {featured.title}
                </h2>
                <span className="block mt-3 text-base text-black/65 leading-relaxed">{featured.summary}</span>
                <span className="inline-flex items-center mt-5 text-xs tracking-[0.15em] uppercase font-medium border-b border-black pb-0.5 group-hover:border-black group-hover:text-black/60 transition-colors">
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
          <section className="mt-14 lg:mt-20 border-t border-black/10 pt-8" aria-labelledby="all-guides">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2.5 h-2.5 bg-[#2F6BF0]" aria-hidden="true" />
              <h2 id="all-guides" className="font-heading text-xs tracking-[0.22em] uppercase font-semibold">
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
          <section className="mt-14 lg:mt-20 border-t border-black/10 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-4">How to use these guides</h2>
              <p className="text-sm sm:text-base text-black/70 leading-relaxed max-w-2xl">
                These are short educational guides, not programmes written for you. Take what fits your experience and context, and adjust when needed. They are not medical advice. Stop an activity if it causes pain, and see a qualified clinician for symptoms, injuries or health concerns.
              </p>
            </div>
            <div className="lg:col-span-5 lg:border-l lg:border-black/10 lg:pl-8">
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-4">Want it done for you</h2>
              <p className="text-sm sm:text-base text-black/70 leading-relaxed mb-5">
                Take the free assessment for a score and a written report, or apply for coaching and I build the plan around your week.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="/assessment" className="inline-flex items-center bg-black text-white text-xs tracking-[0.15em] uppercase px-6 py-3.5 hover:bg-black/80 transition-colors font-medium">
                  Take the assessment
                </a>
                <a href="/apply" className="inline-flex items-center border border-black text-black text-xs tracking-[0.15em] uppercase px-6 py-3.5 hover:bg-black hover:text-white transition-colors font-medium">
                  Apply for coaching
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
      <footer className="border-t border-black/10 py-8">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-wrap items-center justify-between gap-4 text-xs text-black/45">
          <a href="/" className="tracking-[0.1em] uppercase hover:text-black transition-colors">Marin Lazic</a>
          <nav aria-label="Footer" className="flex gap-5">
            <a href="/insights" className="hover:text-black transition-colors">Insights</a>
            <a href="/media" className="hover:text-black transition-colors">Media</a>
            <a href="/about" className="hover:text-black transition-colors">About</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
