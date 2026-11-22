import { SiteFooter } from "@/components/site/SiteFooter";
import { WordTile } from "@/components/WordTile";
import { SiteNav } from "@/components/site/SiteNav";
import { useLocation } from "wouter";
import {
  resourcePhoto,
  srcSet,
  resourceImagePath,
  type ResourcePhoto,
} from "@/data/resourceImages";

export type InformationLink = {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
  /** Short alias of a resource whose square photo illustrates this link. */
  photo?: string;
};

export type InformationSection = {
  heading: string;
  /** Small label line under the heading, for dates and episode names. */
  meta?: string;
  content: string[];
  links?: InformationLink[];
  /** YouTube clips shown as embedded players. */
  videos?: { id: string; title: string }[];
  /** Render links as a grid of square photo cards instead of a list. */
  cards?: boolean;
};

export type InformationPageConfig = {
  title: string;
  h1: string;
  description: string;
  label: string;
  hero?: ResourcePhoto;
  sections: InformationSection[];
  cta?: InformationLink;
  closing?: string;
};

export const informationPages: Record<string, InformationPageConfig> = {
  "/privacy": {
    title: "Privacy | Marin Lazic",
    h1: "Privacy",
    description:
      "What this site collects, why, where it is kept and how to have it removed.",
    label: "Privacy",
    sections: [
      {
        heading: "Who is responsible",
        content: [
          "This site is run by Marin Lazic, a health and performance coach based in Sydney, Australia. Questions about your information go to marin@marinlazic.coach.",
        ],
      },
      {
        heading: "What I collect",
        content: [
          "When you take the Performance Assessment: your first name, your email address and your answers. The answers cover sleep, stress, training, nutrition, recovery and whether you have any current injuries or pain. If you use a wearable you can add your resting heart rate, heart rate variability and respiratory rate. Those three are optional.",
          "When you ask for the Recovery Guide, send an enquiry, request a call or apply for coaching: your name, your email address and whatever you write in the form.",
          "When you browse: which pages you open, which buttons you press, the site that sent you here and the type of device. This is recorded against a random number kept in your browser tab for that visit.",
          "If you buy a program, Bridge Athletic takes the payment on its own site. I see your name, your email address and what you bought. I do not see or keep your card details.",
        ],
      },
      {
        heading: "Why I collect it",
        content: [
          "To work out your score and write your report. To send you what you asked for. To reply to you. To send my weekly email if you signed up for it. To see which pages and emails are working.",
        ],
      },
      {
        heading: "Health information",
        content: [
          "Some assessment answers are about your health. I use them to prepare your score and report and, if you ask about coaching, to prepare for that conversation. The assessment is a coaching tool. It is not a medical assessment.",
        ],
      },
      {
        heading: "Who else handles it",
        content: [
          "I use other companies to run this site. Each one handles your information only to provide its service to me.",
          "Vercel hosts the site and its files. Neon stores the database. Resend sends the emails that carry your report and guide. Kit keeps my email list and sends the follow up emails after an assessment. Substack sends my Tuesday newsletter. Google's Gemini service helps write the assessment report from your first name and your answers. Bridge Athletic delivers programs and takes payment for them.",
          "Some of these companies store information outside Australia, including in the United States.",
          "I do not sell your information, and I do not pass it to anyone for their own marketing.",
        ],
      },
      {
        heading: "How long I keep it",
        content: [
          "The link to your saved report works for 90 days. I keep your contact details and answers while they are useful for coaching you or replying to you. Ask and I will delete them.",
        ],
      },
      {
        heading: "Your choices",
        content: [
          "Every newsletter has an unsubscribe link. You can ask to see, correct or delete the information I hold about you by emailing marin@marinlazic.coach. I will reply as soon as I can, and within 30 days.",
          "If you are not happy with my answer, you can contact the Office of the Australian Information Commissioner at oaic.gov.au.",
        ],
      },
      {
        heading: "Changes",
        content: ["Last updated 18 November 2026."],
      },
    ],
  },
  "/about": {
    title: "About Marin Lazic | Strength, health and performance coaching",
    h1: "About Marin Lazic",
    description:
      "Marin Lazic is a Sydney based health and performance coach, founder of Otion, and Strength and Conditioning Coach for the Australian Men's Water Polo team.",
    label: "About",
    sections: [
      {
        heading: "Work",
        content: [
          "Marin Lazic is a Sydney based health and performance coach. He is the Strength and Conditioning Coach for the Australian Men's Water Polo team, with the Paris 2024 Olympic campaign behind him and the Los Angeles 2028 campaign ahead.",
          "He also founded Otion, a health and performance business that works with people and teams on practical training, recovery and health behaviours.",
        ],
      },
      {
        heading: "Experience and qualifications",
        content: [
          "Strength and Conditioning Coach, Australian Men's Water Polo Team, October 2021 to present. National Lead S&C through four international campaigns: 2023 World Championships in Fukuoka, 2024 World Championships in Doha, the Paris 2024 Olympic Games, and the 2025 World Championships in Singapore. Now supporting the LA28 pathway.",
          "First worked with the Australian national water polo program in 2015, supporting Rio Olympic preparation across Sydney camps and test series against Japan and Italy. Assistant coach and S&C with the Australian team at the World University Games in Taipei.",
          "Founder, Otion, September 2023 to present. Health and performance coaching for founders, executives and organisations.",
          "TRX Master Instructor, 2008 to 2023. Trigger Point Master Trainer, 2012 to 2021.",
          "Strength and conditioning for Australian Water Polo League clubs: West Magpies, Drummoyne Devils, Balmain Tigers.",
          "Former New Zealand Men's National Water Polo Team athlete. Trained under Hungarian coach Dénes Kemény.",
          "Qualifications: ASCA Level 2 (Australian Strength and Conditioning Association), Certificate IV in Fitness, TRX Master Instructor, Institute of Motion certified.",
        ],
      },
      {
        heading: "Coaching",
        content: [
          "The work brings strength and conditioning practice into a personal health and performance context. Training, recovery, sleep, aerobic work and day to day habits are considered together, then adjusted to the person's goals and circumstances.",
          "Coaching is not medical care. Marin does not diagnose conditions, prescribe treatment or replace a doctor, physiotherapist, dietitian or other qualified clinician. New, severe or persistent symptoms should be discussed with an appropriate health professional.",
        ],
      },
      {
        heading: "Interview",
        content: [
          "For a conversation about performance anxiety and helping athletes, listen to the Ready State interview.",
        ],
        links: [
          {
            label:
              "Ready State interview: Solving Performance Anxiety and Happy Athletes",
            href: "https://thereadystate.com/trs_podcast/solving-performance-anxiety-happy-athletes-marin-lazic/",
            external: true,
          },
        ],
      },
    ],
    cta: { label: "Apply for coaching", href: "/apply" },
  },
  "/executive-health-performance": {
    title: "Executive health and performance coaching | Marin Lazic",
    h1: "Executive health and performance",
    description:
      "One to one health and performance coaching for executives, based around training, recovery, sleep and aerobic fitness.",
    label: "Executive health and performance",
    sections: [
      {
        heading: "One to one coaching",
        content: [
          "This is one to one health and performance coaching for executives who want a clear training and recovery plan that fits the reality of work and life.",
          "Coaching is a monthly commitment with a minimum of three months. Pricing is shared after you apply. The programme is agreed after an application, so the scope is appropriate for the person and their context.",
        ],
      },
      {
        heading: "What informs the work",
        content: [
          "Training, recovery, sleep and aerobic work are considered alongside the metrics already available to the client. These can include HRV, resting heart rate, strength markers and subjective context such as workload, sleep and how training feels.",
          "The training programme is delivered through BridgeAthletic, using the existing platform as the home for the programme.",
        ],
      },
      {
        heading: "Getting started",
        content: [
          "Start with an application. It is a chance to outline your goals, current training, constraints and relevant context. If there is a fit, the programme can then be agreed by email.",
          "This is coaching, not medical care. It does not diagnose illness, prescribe treatment or replace advice from a qualified health professional.",
        ],
      },
    ],
    cta: { label: "Apply for coaching", href: "/apply" },
  },
  "/corporate-health-performance": {
    title: "Corporate health and performance | Otion",
    h1: "Corporate health and performance",
    description:
      "Otion corporate health workshops and practical team health behaviours, shaped around company goals.",
    label: "Corporate health and performance",
    sections: [
      {
        heading: "Otion corporate health",
        content: [
          "Otion works with organisations on corporate health. The corporate athlete is a useful description for people whose work asks a lot of their energy, attention and capacity.",
          "The aim is practical: help teams build health behaviours that support the company goals already in front of them.",
        ],
      },
      {
        heading: "Workshops and team habits",
        content: [
          "Work can include workshops and practical team health behaviours. The content is shaped to the company, its people and the problem it wants to address.",
          "Duration, delivery format and any reporting are agreed before work begins. There is no assumed package or fixed set of inclusions.",
        ],
      },
      {
        heading: "Privacy and scope",
        content: [
          "Personal health information is not shared with an employer. Corporate work is education and behaviour support, not individual medical assessment or treatment.",
          "Use the contact form to begin an enquiry. Follow up is by email once the enquiry is received.",
        ],
      },
    ],
    cta: {
      label: "Enquire about corporate health",
      href: "/?enquiry=corporate#contact",
    },
  },
  "/training-for-long-term-health": {
    title: "Training for long term health | Marin Lazic",
    h1: "Training for long term health",
    description:
      "An educational hub on strength, aerobic fitness, recovery and sleep for health across the years.",
    label: "Training for long term health",
    sections: [
      {
        heading: "A practical education hub",
        content: [
          "This is an educational hub for training that supports health over time. It covers strength, aerobic fitness, recovery and sleep using evidence informed ideas that can be adapted to real life.",
          "Fitness supports healthy ageing, but no training plan can promise a particular lifespan or prevent illness. Match training to your starting point, history and current health, and seek clinical advice where needed.",
        ],
      },
      {
        heading: "Start with the basics",
        content: [
          "Aerobic fitness, strength, sleep and a sensible training dose are useful foundations. The articles below explain selected topics in plain language. They are education, not a clinical offer or individual medical advice.",
        ],
        links: [
          {
            label: "VO2 max for executives",
            href: "/insights/vo2-max-for-executives-longevity-metric",
            description:
              "What VO2 max measures and why aerobic capacity is worth tracking in context.",
          },
          {
            label: "Zone 2 training for busy professionals",
            href: "/insights/zone-2-training-busy-professionals",
            description: "A guide to easier aerobic work when time is limited.",
          },
          {
            label: "Executive fitness programme",
            href: "/insights/executive-fitness-program-strength-cardio-recovery",
            description:
              "An example framework that combines strength, cardio and recovery.",
          },
          {
            label: "How to do a chin up",
            href: "/insights/how-to-do-a-chin-up",
            description:
              "A progression for building a chin up from your current level.",
          },
          {
            label: "Improve sleep quality",
            href: "/insights/how-to-improve-sleep-quality",
            description: "A practical look at sleep habits and recovery.",
          },
          {
            label: "Free resources",
            href: "/resources",
            description: "Short training, recovery and habit guides.",
          },
        ],
      },
    ],
    cta: { label: "Browse resources", href: "/resources" },
  },
};

export function Picture({
  photo,
  sizes,
  className,
  eager,
}: {
  photo: ResourcePhoto;
  sizes: string;
  className: string;
  eager?: boolean;
}) {
  const largest = photo.widths[photo.widths.length - 1];
  return (
    <picture>
      <source type="image/webp" srcSet={srcSet(photo, "webp")} sizes={sizes} />
      <img
        src={resourceImagePath(photo.base, largest, "jpg")}
        srcSet={srcSet(photo, "jpg")}
        sizes={sizes}
        alt={photo.alt}
        className={className}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        width={largest}
        height={photo.aspect ? Math.round((largest * photo.aspect[1]) / photo.aspect[0]) : largest}
      />
    </picture>
  );
}

export function Navigation() {
  return <SiteNav />;
}

export function Breadcrumbs({ label }: { label: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 text-[13px] font-medium text-mute"
    >
      <a href="/" className="hover:text-black transition-colors">
        Home
      </a>
      <span className="mx-2" aria-hidden="true">
        /
      </span>
      <span aria-current="page" className="text-ink">
        {label}
      </span>
    </nav>
  );
}

const INFO_TILES: Record<string, { src: string; alt: string; word: string; emoji: string; pin: string; aspect?: string; className?: string; position?: string }> = {
  "/executive-health-performance": { src: "/images/guide/pushup.jpg", alt: "Athlete doing a push up in a gym", word: "lead", emoji: "\u{1F4BC}", pin: "One to one" },
  "/corporate-health-performance": { src: "/images/guide/floor.jpg", alt: "People training together on a gym floor", word: "team", emoji: "\u{1F3E2}", pin: "Your workplace" },
  "/about": { src: "/images/site/marin-about.svg", alt: "Marin Lazic, with a drawing of a stopwatch", word: "about", emoji: "\u{1F44B}", pin: "Sydney", aspect: "aspect-[4/5]", className: "max-w-[440px] lg:ml-auto" },
};

// Pages that are text only: a photo beside them would make no sense.
const NO_TILE = ["/privacy"];

export default function InformationPage() {
  const [location] = useLocation();
  const normalisedLocation =
    location.length > 1 ? location.replace(/\/$/, "") : location;
  const page =
    informationPages[normalisedLocation] ?? informationPages["/about"];

  if (normalisedLocation === "/executive-health-performance") return <CoachingMagazine page={page} />;
  if (MAGAZINE_PAGES[normalisedLocation]) return <MagazineInfo page={page} extra={MAGAZINE_PAGES[normalisedLocation]} />;

  return (
    <div className="min-h-screen bg-ivory text-black flex flex-col">
      <Navigation />
      <main className="flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        {page.hero && (
          <div className="max-w-[1280px] mx-auto mb-12">
            <Picture
              photo={page.hero}
              sizes="(min-width: 1280px) 1200px, 100vw"
              className="w-full aspect-[2/1] object-cover block"
              eager
            />
          </div>
        )}
        <div className="max-w-[1280px] mx-auto">
          <Breadcrumbs label={page.label} />
          <div className={page.hero ? "" : "grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch mb-12"}>
            <div className={page.hero ? "" : "lg:col-span-7"}>
              <div className="w-3 h-3 hidden mb-8" aria-hidden="true" />
              <p className="text-[13px] text-black font-semibold mb-4">
                {page.label}
              </p>
              <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-[-0.03em] leading-[1.02] mb-6">
                {page.h1}
              </h1>
              <p className={`text-base sm:text-lg text-black/65 leading-relaxed max-w-2xl ${page.hero ? "mb-12" : ""}`}>
                {page.description}
              </p>
            </div>
            {!page.hero && !NO_TILE.includes(normalisedLocation) && (
              <div className="lg:col-span-5">
                {(() => {
                  const t = INFO_TILES[normalisedLocation] ?? INFO_TILES["/about"];
                  return <WordTile src={t.src} alt={t.alt} word={t.word} emoji={t.emoji} pin={t.pin} aspect={t.aspect} position={t.position} className={t.className} eager />;
                })()}
              </div>
            )}
          </div>

          <div className="space-y-12">
            {page.sections.map(section => (
              <section
                key={section.heading}
                className="border-t border-line pt-7"
              >
                <h2 className="text-[13px] text-mute font-medium mb-5">
                  {section.heading}
                </h2>
                {section.meta && (
                  <p className="text-xs text-mute mb-4 max-w-2xl">{section.meta}</p>
                )}
                <div className="space-y-4 max-w-2xl">
                  {section.content.map(paragraph => (
                    <p
                      key={paragraph}
                      className="text-sm sm:text-base text-body leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.videos && (
                  <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {section.videos.map(v => (
                      <div key={v.id}>
                        <div className="aspect-[9/16] bg-black overflow-hidden">
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${v.id}`}
                            title={v.title}
                            loading="lazy"
                            className="w-full h-full border-0"
                            allow="accelerometer; encrypted-media; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <p className="text-sm font-medium mt-3 leading-snug">{v.title}</p>
                      </div>
                    ))}
                  </div>
                )}
                {section.links && section.cards && (
                  <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {section.links.map(link => {
                      const photo = link.photo ? resourcePhoto(link.photo) : undefined;
                      return (
                        <li key={link.href} className="border border-line">
                          <a href={link.href} className="group block">
                            {photo && (
                              <Picture
                                photo={photo}
                                sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                                className="w-full aspect-square object-cover block"
                              />
                            )}
                            <span className="block p-5">
                              <span className="block text-sm font-semibold text-black group-hover:text-mute transition-colors">
                                {link.label}
                              </span>
                              {link.description && (
                                <span className="block mt-1 text-sm text-mute leading-relaxed">
                                  {link.description}
                                </span>
                              )}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {section.links && !section.cards && (
                  <ul className="mt-6 border-t border-line max-w-2xl">
                    {section.links.map(link => (
                      <li
                        key={link.href}
                        className="border-b border-line py-4"
                      >
                        <a
                          href={link.href}
                          {...(link.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className="group block"
                        >
                          <span className="text-sm font-semibold text-black group-hover:text-mute transition-colors">
                            {link.label}
                          </span>
                          {link.description && (
                            <span className="block mt-1 text-sm text-mute leading-relaxed">
                              {link.description}
                            </span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {page.closing && (
            <p className="mt-12 text-sm sm:text-base text-body leading-relaxed max-w-2xl border-t border-line pt-7">
              {page.closing}
            </p>
          )}

          {page.cta && (
            <div className="mt-12">
              <a
                href={page.cta.href}
                className="inline-flex bg-ink text-ivory rounded-lg hover:bg-[#3D3D3A] text-[15px] px-6 py-3.5 transition-colors font-medium"
              >
                {page.cta.label}
              </a>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// /executive-health-performance, laid out like a magazine feature.
// Order: the outcome, proof in numbers, WHY, WHAT, HOW (the journey after
// you sign up), one client's first year, actual results, how to start.
// Every number comes from the Bridge training logs of three one to one
// clients, pulled on 18 Oct 2026 (project doc marinlazic-client-results).
// No names, ages or injuries are shown. Do not add a number that is not in
// that doc.
const COACHING_PROOF = [
  { n: "676", t: "sessions logged by one client in four years" },
  { n: "109 of 117", t: "planned sessions done by a client in the first year" },
  { n: "2,266,555 kg", t: "lifted by one client since October 2022" },
];
const COACHING_STOP = ["Working out what to do in the gym", "Guessing the weights", "Starting again after every trip"];
const COACHING_WHAT = [
  { h: "A program written for you", t: "Your sessions, sets, reps and loads, in the Bridge app on your phone. Open it and train." },
  { h: "One plan, four parts", t: "Training, recovery, sleep and aerobic work, planned together so they fit in one week." },
  { h: "Your numbers, read by a coach", t: "HRV, resting heart rate, strength markers, workload, sleep and how training feels." },
  { h: "A plan that changes with your week", t: "A trip, a heavy week at work or a sore joint. The program changes so you keep training." },
];
const COACHING_METRICS = ["HRV", "Resting heart rate", "Strength markers", "Workload", "Sleep", "How training feels"];
const COACHING_JOURNEY = [
  { h: "Apply", t: "Tell me your goals, your training now and what gets in the way." },
  { h: "We agree the plan", t: "If it is a fit, we agree your program by email." },
  { h: "It lands in your phone", t: "Your program is in the Bridge app. Nothing to plan." },
  { h: "Train and log", t: "My clients log two to three sessions a week." },
  { h: "I read it and adjust", t: "I read your log and your numbers and write the next block." },
  { h: "Test", t: "We test the main lifts so you can see the change." },
];
const COACHING_YEAR = [
  { when: "Months 1 to 5", h: "Bodyweight and TRX only", t: "33 sessions. No load on the bar yet." },
  { when: "Month 6", h: "First loaded lifts", t: "Kettlebell deadlift 18 kg for 10. Goblet squat 16 kg for 8." },
  { when: "Month 12", h: "Heavier on every lift", t: "Kettlebell deadlift 28 kg for 5. Goblet squat 24 kg for 5. Hip thrust 45 kg for 3." },
  { when: "The whole year", h: "109 of 117 sessions done", t: "119 sessions logged in total." },
];
const COACHING_RESULTS = [
  {
    img: "/images/site/win-trap-bar.svg",
    alt: "A drawing of a trap bar seen from above, with a short bar and a taller bar under it",
    who: "Client one. Four years, 676 sessions.",
    stat: "85 kg to 130 kg",
    lift: "Trap bar deadlift",
    rows: [
      ["Trap bar deadlift", "85 kg for 6 to a 130 kg single"],
      ["Back squat", "45 kg for 10 to 105 kg for 8"],
      ["Chin ups", "18 in a test, and one with 35 kg added"],
      ["Total lifted", "2,266,555 kg"],
    ],
  },
  {
    img: "/images/site/win-back-squat.svg",
    alt: "A drawing of an empty bar above a loaded bar, with a short bar and a taller bar under it",
    who: "Client two. Four years, 410 sessions.",
    stat: "20 kg to 70 kg",
    lift: "Back squat",
    rows: [
      ["Back squat", "The empty 20 kg bar to 70 kg for 2"],
      ["Trap bar deadlift", "160 kg single"],
      ["Chin ups", "19 in a test, and one with 35 kg added"],
      ["2 km row", "8:40"],
    ],
  },
  {
    img: "/images/site/win-kettlebell.svg",
    alt: "A drawing of a small kettlebell beside a bigger one, with a short bar and a taller bar under it",
    who: "Client three. First year, 119 sessions.",
    stat: "18 kg to 28 kg",
    lift: "Kettlebell deadlift",
    rows: [
      ["Kettlebell deadlift", "18 kg for 10 to 28 kg for 5"],
      ["Goblet squat", "16 kg for 8 to 24 kg for 5"],
      ["Hip thrust", "30 kg for 10 to 45 kg for 3"],
      ["Sessions done", "109 of 117 planned"],
    ],
  },
];

function CoachingMagazine({ page }: { page: InformationPageConfig }) {
  const legal = page.sections[2]?.content[1];
  const h2 = "font-heading font-bold text-[30px] leading-[1.08] tracking-[-0.02em] lg:text-[46px]";
  const kicker = "text-[13px] font-semibold text-mute";
  const body = "text-[17px] leading-[1.62] text-body";
  const rule = "mt-14 lg:mt-24 border-t border-ink pt-6 lg:pt-8";
  return (
    <div className="min-h-screen bg-ivory text-black flex flex-col">
      <Navigation />
      <main className="flex-1 px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        <article className="max-w-[1280px] mx-auto">
          <Breadcrumbs label={page.label} />
          <div className="flex items-center justify-between gap-4 border-y border-ink py-3 text-[13px] font-semibold">
            <span>{page.label}</span>
            <span className="font-normal text-mute">One to one coaching</span>
          </div>

          <header className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-end pt-8 lg:pt-12">
            <div className="lg:col-span-7">
              <h1 className="font-heading font-bold text-[44px] leading-[0.98] tracking-[-0.035em] sm:text-7xl lg:text-[84px] lg:leading-[0.95]">
                Train two to three times a week. Get stronger for years.
              </h1>
              <p className="font-heading text-[21px] leading-[1.32] text-body mt-6 sm:text-2xl lg:mt-9 lg:text-[27px] max-w-[640px]">
                One to one coaching for founders, CEOs and executives. I build the plan around your calendar, put it in
                your phone and change it when your week changes. You turn up and train.
              </p>
              {page.cta && (
                <a href={page.cta.href} className="ml-btn ml-btn-dark mt-7 px-6">
                  {page.cta.label}
                </a>
              )}
              <p className="ml-small mt-4">Monthly. Three month minimum. Pricing is shared after you apply.</p>
            </div>
            <figure className="lg:col-span-5">
              <img
                src="/images/site/coaching-hero.svg"
                alt="A recovery dial with three rings and a week of bars, above a photo of a suit jacket hanging on a squat rack"
                width={800}
                height={1000}
                loading="eager"
                className="block w-full aspect-[4/5] rounded-lg bg-oat"
              />
              <figcaption className="ml-small mt-2.5">Training that fits around the job.</figcaption>
            </figure>
          </header>

          <section aria-label="From the training logs" className="mt-12 lg:mt-20 border-y border-ink">
            <ul className="grid sm:grid-cols-3">
              {COACHING_PROOF.map((x, i) => (
                <li key={x.n} className={`py-6 lg:py-9 ${i ? "border-t sm:border-t-0 sm:border-l border-line sm:pl-6 lg:pl-10" : ""}`}>
                  <p className="font-heading font-bold text-[40px] leading-none tracking-[-0.03em] lg:text-[60px]">{x.n}</p>
                  <p className="text-[15px] leading-snug text-body mt-3 max-w-[260px]">{x.t}</p>
                </li>
              ))}
            </ul>
          </section>
          <p className="ml-small mt-2.5">From my clients' training logs in Bridge.</p>

          <section className={`${rule} grid lg:grid-cols-12 gap-5 lg:gap-14`}>
            <div className="lg:col-span-5">
              <p className={kicker}>Why</p>
              <h2 className={`${h2} mt-3`}>A plan that uses the time you already have.</h2>
            </div>
            <div className={`lg:col-span-7 ${body}`}>
              <p className="mb-4 first-letter:float-left first-letter:font-heading first-letter:font-bold first-letter:text-[68px] first-letter:leading-[0.82] first-letter:mr-2.5 first-letter:mt-1 first-letter:text-ink">
                People who run a company usually know what to do. The week gets in the way. Meetings move, a flight comes
                up, sleep gets short, and training is the first thing to go.
              </p>
              <p className="mb-4">
                Coaching takes the planning off your plate. You get one plan for training, recovery, sleep and aerobic
                work, built around your calendar. Your time goes into training, and none of it into working out what to
                do.
              </p>
              <p className="font-semibold text-ink mt-7">What you stop doing</p>
              <ul className="mt-2">
                {COACHING_STOP.map(x => (
                  <li key={x} className="ml-row"><span>{x}</span><span>Done for you</span></li>
                ))}
              </ul>
            </div>
          </section>

          <figure className="mt-10 lg:mt-14">
            <picture>
              <source media="(min-width: 640px)" srcSet="/images/site/coaching-week-wide.svg" />
              <img
                src="/images/site/coaching-week-phone.svg"
                alt="A week drawn as a planner: work blocks, three training sessions, recovery, sleep every night and one flight. Beside it, a photo of dress shoes next to running shoes."
                width={1000}
                height={1100}
                loading="lazy"
                className="block w-full h-auto aspect-[1000/1100] sm:aspect-[2260/900] rounded-lg bg-oat"
              />
            </picture>
            <figcaption className="ml-small mt-2.5">
              One week: work, three training sessions, recovery, sleep and a flight.
            </figcaption>
          </figure>

          <section className={rule}>
            <div className="grid lg:grid-cols-12 gap-5 lg:gap-14">
              <div className="lg:col-span-5">
                <p className={kicker}>What</p>
                <h2 className={`${h2} mt-3`}>What you get.</h2>
              </div>
              <ul className="lg:col-span-7 grid sm:grid-cols-2 gap-x-10 gap-y-7">
                {COACHING_WHAT.map(x => (
                  <li key={x.h} className="border-t border-line pt-4">
                    <p className="font-heading font-bold text-[20px] leading-tight">{x.h}</p>
                    <p className="text-[15.5px] leading-normal text-body mt-2">{x.t}</p>
                  </li>
                ))}
              </ul>
            </div>
            <aside className="mt-9 lg:mt-12 bg-oat rounded-xl p-6 sm:p-7 grid lg:grid-cols-12 gap-3 lg:gap-14">
              <p className="lg:col-span-5 font-heading font-bold text-[20px] leading-tight">
                The numbers you already have. I use what your watch and your log already record.
              </p>
              <ul className="lg:col-span-7 grid sm:grid-cols-2 gap-x-10">
                {COACHING_METRICS.map((m, i) => (
                  <li key={m} className="ml-row"><span>{m}</span><span>{String(i + 1).padStart(2, "0")}</span></li>
                ))}
              </ul>
            </aside>
          </section>

          <section className={rule}>
            <div className="grid lg:grid-cols-12 gap-4 lg:gap-14 items-end">
              <div className="lg:col-span-5">
                <p className={kicker}>How</p>
                <h2 className={`${h2} mt-3`}>Your journey after you sign up.</h2>
              </div>
              <p className={`lg:col-span-7 ${body} max-w-[640px]`}>
                Six steps. You do the first one and the training. I do the rest.
              </p>
            </div>
            <ol className="mt-8 lg:mt-11 grid sm:grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-8">
              {COACHING_JOURNEY.map((x, i) => (
                <li key={x.h} className="border-t-2 border-ink pt-4">
                  <p className="font-heading font-bold text-[34px] leading-none tracking-[-0.02em]">{String(i + 1).padStart(2, "0")}</p>
                  <p className="font-heading font-bold text-[18px] leading-tight mt-3">{x.h}</p>
                  <p className="text-[15px] leading-normal text-body mt-1.5">{x.t}</p>
                </li>
              ))}
            </ol>

            <div className="mt-10 lg:mt-14 bg-ink text-ivory rounded-xl p-6 sm:p-8 lg:p-10">
              <p className="text-[13px] font-semibold text-ivory/70">One client's first year, from the log</p>
              <ol className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-7">
                {COACHING_YEAR.map((x, i) => (
                  <li key={x.when} className="border-t border-ivory/30 pt-4">
                    <p className={`text-[13px] font-semibold ${i === 3 ? "text-[#FF5A36]" : "text-ivory/70"}`}>{x.when}</p>
                    <p className="font-heading font-bold text-[22px] leading-tight mt-2">{x.h}</p>
                    <p className="text-[15px] leading-normal text-ivory/80 mt-2">{x.t}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <blockquote className="mt-14 lg:mt-24 border-y border-line py-10 lg:py-16">
            <p className="font-heading font-bold text-[30px] leading-[1.12] tracking-[-0.02em] sm:text-[44px] lg:text-[60px] lg:leading-[1.05] max-w-[1100px]">
              Training is one part of performance. Sleep, recovery, stress and the demands outside the gym matter too.
            </p>
            <footer className="ml-small mt-5">Marin Lazic</footer>
          </blockquote>

          <section className={rule}>
            <div className="grid lg:grid-cols-12 gap-4 lg:gap-14 items-end">
              <div className="lg:col-span-5">
                <p className={kicker}>Actual results</p>
                <h2 className={`${h2} mt-3`}>Three clients. Their real numbers.</h2>
              </div>
              <p className={`lg:col-span-7 ${body} max-w-[640px]`}>
                Three one to one clients, shared without names. Every number is from their own training log in Bridge,
                pulled on 18 October 2026.
              </p>
            </div>
            <ul className="mt-8 lg:mt-11 grid sm:grid-cols-3 gap-10 sm:gap-5 lg:gap-8">
              {COACHING_RESULTS.map(w => (
                <li key={w.who}>
                  <img src={w.img} alt={w.alt} width={800} height={1000} loading="lazy" className="block w-full aspect-[4/5] rounded-lg bg-oat" />
                  <p className="font-heading font-bold text-[32px] leading-none tracking-[-0.02em] mt-5 lg:text-[42px]">{w.stat}</p>
                  <p className="text-[15px] font-semibold mt-2.5">{w.lift}</p>
                  <p className="ml-small mt-1.5">{w.who}</p>
                  <ul className="mt-4">
                    {w.rows.map(([k, v]) => (
                      <li key={k} className="border-t border-line py-2.5 text-[14.5px] leading-snug">
                        <span className="block font-semibold">{k}</span>
                        <span className="block text-body mt-0.5">{v}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section className={`${rule} grid lg:grid-cols-12 gap-5 lg:gap-14`}>
            <div className="lg:col-span-5">
              <p className={kicker}>Start</p>
              <h2 className={`${h2} mt-3`}>Apply, and we agree your plan.</h2>
            </div>
            <div className="lg:col-span-7 max-w-[640px]">
              <p className={body}>
                Start with an application. Tell me your goals, your current training and your constraints. If there is a
                fit, we agree your program by email and it lands in your phone.
              </p>
              {page.cta && (
                <a href={page.cta.href} className="ml-btn ml-btn-dark mt-6 px-6">
                  {page.cta.label}
                </a>
              )}
              <p className="ml-small mt-4">Monthly. Three month minimum. Pricing is shared after you apply.</p>
              {legal && <p className="ml-small mt-7">{legal}</p>}
            </div>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

// The magazine layout for plain information pages. The words come from
// informationPages above. A section with five or more paragraphs is set as a
// list of rows, with the first sentence of each in bold.
const MAGAZINE_PAGES: Record<string, { note: string; img: string; alt: string; caption: string; quote?: string }> = {
  "/corporate-health-performance": {
    note: "For teams",
    img: "/images/site/corporate-hero.svg",
    alt: "A drawing of a meeting table from above with eight chairs, one of them marked",
    caption: "Shaped around the company and its people.",
  },
  "/about": {
    note: "Coach and founder",
    img: "/images/site/marin-about.svg",
    alt: "Marin Lazic, with a drawing of a stopwatch",
    caption: "Marin Lazic.",
    quote: "Training is one part of performance. Sleep, recovery, stress and the demands outside the gym matter too.",
  },
};

function MagazineInfo({ page, extra }: { page: InformationPageConfig; extra: (typeof MAGAZINE_PAGES)[string] }) {
  const h2 = "font-heading font-bold text-[30px] leading-[1.08] tracking-[-0.02em] lg:text-[46px]";
  const body = "text-[17px] leading-[1.62] text-body";
  const rule = "mt-14 lg:mt-24 border-t border-ink pt-6 lg:pt-8";
  const split = (t: string) => {
    const dot = t.indexOf(". ");
    const comma = t.indexOf(", ");
    const i = dot > 0 && dot < 110 ? dot : comma > 0 && comma < 110 ? comma : -1;
    return i > 0 ? [t.slice(0, i + 1), t.slice(i + 2)] : [t, ""];
  };
  return (
    <div className="min-h-screen bg-ivory text-black flex flex-col">
      <Navigation />
      <main className="flex-1 px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        <article className="max-w-[1280px] mx-auto">
          <Breadcrumbs label={page.label} />
          <div className="flex items-center justify-between gap-4 border-y border-ink py-3 text-[13px] font-semibold">
            <span>{page.label}</span>
            <span className="font-normal text-mute">{extra.note}</span>
          </div>

          <header className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-end pt-8 lg:pt-12">
            <div className="lg:col-span-7">
              <h1 className="font-heading font-bold text-[46px] leading-[0.98] tracking-[-0.035em] sm:text-7xl lg:text-[92px] lg:leading-[0.94]">
                {page.h1}
              </h1>
              <p className="font-heading text-[21px] leading-[1.32] text-body mt-6 sm:text-2xl lg:mt-9 lg:text-[27px] max-w-[640px]">
                {page.description}
              </p>
              {page.cta && (
                <a href={page.cta.href} className="ml-btn ml-btn-dark mt-7 px-6">
                  {page.cta.label}
                </a>
              )}
            </div>
            <figure className="lg:col-span-5">
              <img src={extra.img} alt={extra.alt} width={800} height={1000} loading="eager" className="block w-full aspect-[4/5] rounded-lg bg-oat" />
              <figcaption className="ml-small mt-2.5">{extra.caption}</figcaption>
            </figure>
          </header>

          {page.sections.map((sec, i) => (
            <div key={sec.heading}>
              <section className={`${rule} grid lg:grid-cols-12 gap-5 lg:gap-14`}>
                <h2 className={`lg:col-span-4 ${h2}`}>{sec.heading}</h2>
                <div className="lg:col-span-8">
                  {sec.content.length >= 5 ? (
                    <ul className="border-t border-line">
                      {sec.content.map(t => {
                        const [lead, rest] = split(t);
                        return (
                          <li key={t} className="border-b border-line py-4">
                            <p className="text-[16px] leading-normal text-body max-w-[720px]">
                              <span className="font-heading font-bold text-[18px] text-ink">{lead}</span>
                              {rest ? ` ${rest}` : ""}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className={`${body} max-w-[680px]`}>
                      {sec.content.map((t, k) => (
                        <p
                          key={t}
                          className={
                            i === 0 && k === 0
                              ? "mb-4 first-letter:float-left first-letter:font-heading first-letter:font-bold first-letter:text-[68px] first-letter:leading-[0.82] first-letter:mr-2.5 first-letter:mt-1 first-letter:text-ink"
                              : "mb-4"
                          }
                        >
                          {t}
                        </p>
                      ))}
                    </div>
                  )}
                  {sec.links && (
                    <div className="flex flex-wrap gap-3 mt-5">
                      {sec.links.map(l => (
                        <a
                          key={l.href}
                          href={l.href}
                          className="ml-btn px-6 h-auto py-3 text-left"
                          {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </section>
              {i === 0 && extra.quote && (
                <blockquote className="mt-14 lg:mt-24 border-y border-line py-10 lg:py-16">
                  <p className="font-heading font-bold text-[30px] leading-[1.12] tracking-[-0.02em] sm:text-[44px] lg:text-[60px] lg:leading-[1.05] max-w-[1100px]">
                    {extra.quote}
                  </p>
                  <footer className="ml-small mt-5">Marin Lazic</footer>
                </blockquote>
              )}
            </div>
          ))}

          {page.cta && (
            <section className={`${rule} grid lg:grid-cols-12 gap-5 lg:gap-14 items-center`}>
              <h2 className={`lg:col-span-8 ${h2}`}>{page.cta.label}.</h2>
              <div className="lg:col-span-4 lg:text-right">
                <a href={page.cta.href} className="ml-btn ml-btn-dark px-6">
                  {page.cta.label}
                </a>
              </div>
            </section>
          )}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
