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
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { mediaItems, postDate, postLine, READY_STATE_URL, SUBSTACK_SNAPSHOT, SUBSTACK_URL, YOUTUBE_URL } from "@/data/mediaData";
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
        <img src={guideArt(card.alias)} alt="" width={96} height={96} loading="lazy" className="w-24 h-24 object-cover shrink-0 block rounded-md bg-oat" />
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

// The Resources page is laid out like the front of a magazine: nameplate,
// a cover story (The Ready State Podcast with Kelly and Juliet Starrett),
// the newsletter from Substack, videos from YouTube, then the guides.


// Hand picked from youtube.com/@MarinLazic so that team and match clips stay
// off the site. Add an id here to show another video.
const YOUTUBE_PICKS = [
  { id: "Kag7FKbFAM8", title: "TRX lateral lunge" },
  { id: "e3XdhguRMD0", title: "Suitcase carry, heavy, one hand" },
  { id: "Q4iXOp4-LP8", title: "Lateral lunge with offset load" },
  { id: "erH4wjFwAN0", title: "The only thing that matters is doing the thing" },
];

// One drawing per guide, made to show what the guide is about. The files are
// client/public/images/site/guide-<alias>.svg, in the program image style.
const guideArt = (alias: string) => `/images/site/guide-${alias}.svg`;
const GUIDE_ALT: Record<string, string> = {
  template: "Five round signs for push, pull, hinge, squat and carry",
  groove: "A pull up bar with a tally of small sets under it",
  routine: "A clock with five minutes marked, above seven dots for the days of the week",
  move: "Arrows pointing forward, to each side and around in a turn",
  protein: "A plate with an egg on it, a fork and a knife",
  engine: "Four bars, each a little taller than the last",
  recover: "A checklist with four of five boxes ticked",
  week3: "Four rows of seven dots. Three dots are missing in the third row",
  sleep: "A bed under a crescent moon",
};

// Substack's image address takes a width. Ask for a small copy where we can.
const postImg = (u: string | null, w: number) =>
  u && u.includes("substackcdn.com/image/fetch/$s_") && !/,w_\d+/.test(u)
    ? u.replace(/(\/image\/fetch\/\$s_![^!]+!,)/, `$1w_${w},c_limit,`)
    : u;

function PostImage({ src, w, className }: { src: string | null; w: number; className: string }) {
  if (!src) return <span className={`${className} block`} aria-hidden="true" />;
  return (
    <img
      src={postImg(src, w) ?? src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={e => {
        const t = e.currentTarget;
        if (!t.dataset.plain) {
          t.dataset.plain = "1";
          t.src = src;
        } else {
          t.style.visibility = "hidden";
        }
      }}
      className={className}
    />
  );
}


function PlayPill() {
  return (
    <span className="absolute left-4 bottom-4 inline-flex items-center gap-2.5 bg-ivory text-ink rounded-full pl-3.5 pr-4.5 py-2 text-[14px] font-semibold">
      <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true"><path d="M0 0 L12 7 L0 14 Z" fill="currentColor" /></svg>
      Play
    </span>
  );
}

function Player({ id, title, on, onPlay, big }: { id: string; title: string; on: boolean; onPlay: () => void; big?: boolean }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-ink">
      {on ? (
        <iframe
          key={id}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <button type="button" onClick={onPlay} aria-label={`Play: ${title}`} className="absolute inset-0 w-full h-full cursor-pointer">
          <img
            key={id}
            src={`https://i.ytimg.com/vi/${id}/${big ? "maxresdefault" : "hqdefault"}.jpg`}
            onError={e => {
              const t = e.currentTarget;
              if (!t.dataset.fallback) {
                t.dataset.fallback = "1";
                t.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
              }
            }}
            alt=""
            loading={big ? "eager" : "lazy"}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <PlayPill />
        </button>
      )}
    </div>
  );
}

function VideoCard({ id, title }: { id: string; title: string }) {
  const [on, setOn] = useState(false);
  return (
    <li>
      <Player id={id} title={title} on={on} onPlay={() => setOn(true)} />
      <p className="font-heading font-bold text-[17px] leading-snug mt-3">{title}</p>
    </li>
  );
}

function GuideCard({ card }: { card: ResourceCard }) {
  return (
    <li>
      <a href={card.href} className="group block">
        <img src={guideArt(card.alias)} alt={GUIDE_ALT[card.alias] ?? ""} width={1200} height={800} loading="lazy" className="block w-full aspect-[3/2] object-cover rounded-lg bg-oat" />
        <span className="block text-[13px] font-semibold mt-4">{card.category}</span>
        <span className="block font-heading font-bold text-[21px] leading-tight mt-1.5 group-hover:text-mute transition-colors">{card.title}</span>
        <span className="block mt-2 text-[15px] text-body leading-normal">{card.summary}</span>
        <span className="block mt-2 text-[13px] text-mute">{card.minutes} min read</span>
      </a>
    </li>
  );
}

export default function ResourcesIndex() {
  const featured = featuredResource;
  const grid = resourceCards.filter(c => c.alias !== featured.alias);
  const cover = mediaItems[0];
  const clips = cover.videos ?? [];
  const story = cover.links.find(l => l.href.includes("substack.com"))?.href ?? SUBSTACK_URL;
  const current = clips.find(c => /stress/i.test(c.title)) ?? clips[0];
  const moreClips = clips.filter(c => c !== current);
  const [playing, setPlaying] = useState(false);
  const live = trpc.articles.latest.useQuery({ limit: 6 }, { staleTime: 10 * 60 * 1000, retry: false });
  const posts = live.data && live.data.length ? live.data : SUBSTACK_SNAPSHOT;
  const [lead, ...rest] = posts;
  const h2 = "font-heading font-bold text-[32px] leading-[1.05] tracking-[-0.02em] lg:text-[48px]";
  const kicker = "text-[13px] font-semibold text-mute";
  const rule = "mt-14 lg:mt-24 border-t border-ink pt-6 lg:pt-8";

  return (
    <div className="min-h-screen bg-ivory text-black flex flex-col">
      <Navigation />
      <main className="flex-1 px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <Breadcrumbs label="Resources" />
          <div className="flex items-center justify-between gap-4 border-y border-ink py-3 text-[13px] font-semibold">
            <span>Marin Lazic</span>
            <span className="font-normal text-mute">Watch, listen, read</span>
          </div>
          <header className="grid lg:grid-cols-12 gap-5 lg:gap-14 items-end pt-6 lg:pt-8">
            <h1 className="lg:col-span-8 font-heading font-bold text-[68px] leading-[0.86] tracking-[-0.05em] sm:text-[128px] lg:text-[176px]">
              Resources
            </h1>
            <p className="lg:col-span-4 font-heading text-[20px] leading-[1.32] text-body lg:text-[24px] lg:pb-4">
              The Ready State Podcast with Kelly and Juliet Starrett, my newsletter, my videos and nine short guides. All free.
            </p>
          </header>

          {current && (
            <section className="mt-8 lg:mt-12 border-t border-ink pt-6 lg:pt-8" aria-labelledby="cover-heading">
              <div className="grid lg:grid-cols-12 gap-7 lg:gap-12">
                <div className="lg:col-span-8">
                  <Player id={current.id} title={current.title} on={playing} onPlay={() => setPlaying(true)} big />
                  <p className="ml-small mt-2.5">{current.title}. From The Ready State Podcast.</p>
                </div>
                <div className="lg:col-span-4">
                  <p className={kicker}>Cover story</p>
                  <h2 id="cover-heading" className={`${h2} mt-3`}>The moment I learned stress is physical.</h2>
                  <p className="text-[13px] font-semibold mt-4">
                    The Ready State Podcast with Kelly and Juliet Starrett. 23 July 2026. 1 hour 13 minutes.
                  </p>
                  <p className="text-[17px] leading-[1.6] text-body mt-4">{cover.paragraphs[0]}</p>
                  <div className="flex flex-wrap gap-3 mt-6">
                    <a href={READY_STATE_URL} target="_blank" rel="noopener noreferrer" className="ml-btn ml-btn-dark px-6">
                      Listen to the full episode
                    </a>
                    <a href={story} target="_blank" rel="noopener noreferrer" className="ml-btn px-6">
                      Read the story
                    </a>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className={rule} aria-labelledby="newsletter-heading">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
              <div className="lg:col-span-4">
                <p className={kicker}>The newsletter</p>
                <h2 id="newsletter-heading" className={`${h2} mt-3`}>New pieces by email.</h2>
                <p className="text-[17px] leading-[1.6] text-body mt-4">
                  Short pieces on training, recovery, sleep and performance. More than 680 readers get them by email. Free.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <a href={`${SUBSTACK_URL}/subscribe`} target="_blank" rel="noopener noreferrer" className="ml-btn ml-btn-dark px-6">
                    Subscribe on Substack
                  </a>
                  <a href={SUBSTACK_URL} target="_blank" rel="noopener noreferrer" className="ml-btn px-6">
                    Read every post
                  </a>
                </div>
                <img
                  src="/images/site/newsletter.svg"
                  alt="A drawing of a sheet of paper in an envelope, and a paper plane"
                  width={800}
                  height={1000}
                  loading="lazy"
                  className="hidden lg:block w-full max-w-[300px] aspect-[4/5] rounded-lg bg-oat mt-9"
                />
              </div>
              <div className="lg:col-span-8">
                {lead && (
                  <a href={lead.link} target="_blank" rel="noopener noreferrer" className="group block">
                    {lead.image && (
                      <PostImage src={lead.image} w={1456} className="block w-full aspect-[16/9] object-cover rounded-lg bg-oat mb-5" />
                    )}
                    <p className="text-[13px] font-semibold">Latest. {postDate(lead.pubDate)}</p>
                    <p className="font-heading font-bold text-[30px] leading-[1.08] tracking-[-0.02em] mt-2 lg:text-[44px] group-hover:text-mute transition-colors">
                      {lead.title}
                    </p>
                    {postLine(lead.title, lead.description) && (
                      <p className="text-[17px] leading-[1.55] text-body mt-3 max-w-[640px]">{postLine(lead.title, lead.description)}</p>
                    )}
                  </a>
                )}
                <ul className="mt-8 border-t border-ink">
                  {rest.slice(0, 5).map(p => (
                    <li key={p.link} className="border-b border-line">
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="group grid grid-cols-[112px_1fr] sm:grid-cols-[220px_1fr] gap-4 sm:gap-6 py-4 items-start">
                        <PostImage src={p.image} w={848} className="block w-full aspect-[16/10] object-cover rounded-md bg-oat" />
                        <span>
                          <span className="block text-[13px] text-mute">{postDate(p.pubDate)}</span>
                          <span className="block font-heading font-bold text-[17px] sm:text-[20px] leading-snug mt-1 group-hover:text-mute transition-colors">{p.title}</span>
                          {postLine(p.title, p.description) && (
                            <span className="block text-[15px] text-body leading-normal mt-1">{postLine(p.title, p.description)}</span>
                          )}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className={rule} aria-labelledby="youtube-heading">
            <div className="grid lg:grid-cols-12 gap-4 lg:gap-12 items-end">
              <div className="lg:col-span-5">
                <p className={kicker}>On YouTube</p>
                <h2 id="youtube-heading" className={`${h2} mt-3`}>Watch the movements.</h2>
              </div>
              <div className="lg:col-span-7 flex flex-wrap items-center justify-between gap-4">
                <p className="text-[17px] leading-[1.6] text-body max-w-[420px]">Exercise demos and short coaching points from my channel.</p>
                <a href={`${YOUTUBE_URL}?sub_confirmation=1`} target="_blank" rel="noopener noreferrer" className="ml-btn ml-btn-dark px-6">
                  Subscribe on YouTube
                </a>
              </div>
            </div>
            <ul className="mt-8 lg:mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
              {YOUTUBE_PICKS.map(v => (
                <VideoCard key={v.id} id={v.id} title={v.title} />
              ))}
            </ul>
            {moreClips.length > 0 && (
              <>
                <p className="text-[13px] font-semibold mt-12 lg:mt-16 border-t border-line pt-4">
                  More clips from The Ready State Podcast with Kelly and Juliet Starrett
                </p>
                <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-8">
                  {moreClips.map(v => (
                    <VideoCard key={v.id} id={v.id} title={v.title} />
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className={rule} aria-labelledby="guides-heading">
            <div className="grid lg:grid-cols-12 gap-4 lg:gap-12 items-end">
              <div className="lg:col-span-5">
                <p className={kicker}>The guides</p>
                <h2 id="guides-heading" className={`${h2} mt-3`}>Nine short guides.</h2>
              </div>
              <p className="lg:col-span-7 text-[17px] leading-[1.6] text-body max-w-[640px]">
                On training, recovery, nutrition and sleep. Free, practical, written for busy people who still want to train well.
              </p>
            </div>
            <div className="mt-8 lg:mt-10 grid lg:grid-cols-12 gap-9 lg:gap-12">
              <a href={featured.href} className="group block lg:col-span-7">
                <img src={guideArt(featured.alias)} alt={GUIDE_ALT[featured.alias] ?? ""} width={1200} height={800} loading="lazy" className="block w-full aspect-[3/2] object-cover rounded-lg bg-oat" />
                <span className="block text-[13px] font-semibold mt-5">Featured guide. {featured.category}</span>
                <span id="featured-heading" className="block font-heading font-bold text-[32px] leading-[1.04] tracking-[-0.02em] mt-2 lg:text-[44px] group-hover:text-mute transition-colors">
                  {featured.title}
                </span>
                <span className="block mt-3 text-[17px] text-body leading-[1.55] max-w-[600px]">{featured.summary}</span>
              </a>
              <div className="lg:col-span-5 grid sm:grid-cols-2 lg:grid-cols-1 gap-9">
                <div>
                  <SectionLabel>Start here</SectionLabel>
                  <ul className="border-t border-ink">
                    {startHereResources.map(c => (
                      <ListItem key={c.alias} card={c} />
                    ))}
                  </ul>
                </div>
                <div>
                  <SectionLabel>Most read</SectionLabel>
                  <ul className="border-t border-ink">
                    {popularResources.map(c => (
                      <ListItem key={c.alias} card={c} />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <h3 id="all-guides" className="text-[13px] font-semibold mt-12 lg:mt-16 border-t border-line pt-4">All guides</h3>
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {grid.map(c => (
                <GuideCard key={c.alias} card={c} />
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
