import { useLocation } from "wouter";

export type InformationLink = {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
};

export type InformationSection = {
  heading: string;
  content: string[];
  links?: InformationLink[];
};

export type InformationPageConfig = {
  title: string;
  h1: string;
  description: string;
  label: string;
  sections: InformationSection[];
  cta?: InformationLink;
};

export const informationPages: Record<string, InformationPageConfig> = {
  "/about": {
    title: "About Marin Lazic | Strength, health and performance coaching",
    h1: "About Marin Lazic",
    description:
      "Marin Lazic is a Sydney-based health and performance coach, founder of Otion, and Strength and Conditioning Coach for the Australian Men's Water Polo team.",
    label: "About",
    sections: [
      {
        heading: "Work",
        content: [
          "Marin Lazic is a Sydney-based health and performance coach. He is the Strength and Conditioning Coach for the Australian Men's Water Polo team, with the Paris 2024 Olympic campaign behind him and the Los Angeles 2028 campaign ahead.",
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
          "The work brings strength and conditioning practice into a personal health and performance context. Training, recovery, sleep, aerobic work and day-to-day habits are considered together, then adjusted to the person's goals and circumstances.",
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
      "One-to-one health and performance coaching for executives, based around training, recovery, sleep and aerobic fitness.",
    label: "Executive health and performance",
    sections: [
      {
        heading: "One-to-one coaching",
        content: [
          "This is one-to-one health and performance coaching for executives who want a clear training and recovery plan that fits the reality of work and life.",
          "Coaching is $2,400 AUD per month with a minimum three-month commitment. The programme is agreed after an application, so the scope is appropriate for the person and their context.",
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
          "Use the contact form to begin an enquiry. Follow-up is by email once the enquiry is received.",
        ],
      },
    ],
    cta: {
      label: "Enquire about corporate health",
      href: "/?enquiry=corporate#contact",
    },
  },
  "/training-for-long-term-health": {
    title: "Training for long-term health | Marin Lazic",
    h1: "Training for long-term health",
    description:
      "An educational hub on strength, aerobic fitness, recovery and sleep for health across the years.",
    label: "Training for long-term health",
    sections: [
      {
        heading: "A practical education hub",
        content: [
          "This is an educational hub for training that supports health over time. It covers strength, aerobic fitness, recovery and sleep using evidence-informed ideas that can be adapted to real life.",
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
            label: "How to do a chin-up",
            href: "/insights/how-to-do-a-chin-up",
            description:
              "A progression for building a chin-up from your current level.",
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
  "/resources": {
    title: "Free health and performance resources | Marin Lazic",
    h1: "Resources",
    description:
      "Nine short, educational training, recovery, nutrition and sleep resources from Marin Lazic.",
    label: "Resources",
    sections: [
      {
        heading: "Short guides for practice",
        content: [
          "These resources are short educational guides for training, recovery, nutrition and sleep. Take what fits your experience and context, and adjust when needed.",
          "They are not medical advice. Stop an activity if it causes pain, and seek advice from a qualified clinician for symptoms, injuries or health concerns.",
        ],
      },
      {
        heading: "Resource library",
        content: ["Choose a guide to read the full resource."],
        links: [
          {
            label: "The 5-Movement Training Template",
            href: "/resources/template",
            description:
              "A simple push, pull, hinge, squat and carry template.",
          },
          {
            label: "Greasing the Groove Guide",
            href: "/resources/groove",
            description:
              "Low-effort practice for a movement such as a pull-up or push-up.",
          },
          {
            label: "5-Minute Daily Maintenance Routine",
            href: "/resources/routine",
            description:
              "A brief movement and balance check with scaled options.",
          },
          {
            label: "Multi-Direction Warm-Up",
            href: "/resources/move",
            description:
              "Warm-up movements for forward, lateral and rotational work.",
          },
          {
            label: "High-Protein Meals List",
            href: "/resources/protein",
            description:
              "Meal ideas and protein amounts to discuss with your needs in mind.",
          },
          {
            label: "4-Week Base-Building Plan",
            href: "/resources/engine",
            description:
              "A flexible example for building easy aerobic work gradually.",
          },
          {
            label: "Daily Recovery Checklist",
            href: "/resources/recover",
            description:
              "Sleep, food, fluids, movement and stress prompts for reflection.",
          },
          {
            label: "The Week-3 Dip Guide",
            href: "/resources/week3",
            description:
              "Ways to respond when a new routine feels harder to maintain.",
          },
          {
            label: "The Sleep Checklist",
            href: "/resources/sleep",
            description:
              "A checklist for timing, light, environment and wind-down habits.",
          },
        ],
      },
    ],
  },
};

function Navigation() {
  return (
    <header className="border-b border-black/10">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-6">
        <a
          href="/"
          className="font-heading font-bold text-sm tracking-[0.2em] uppercase"
          aria-label="Marin Lazic home"
        >
          ML
        </a>
        <nav aria-label="Primary" className="flex items-center gap-4 sm:gap-6">
          <a
            href="/"
            className="text-[10px] sm:text-xs tracking-[0.14em] uppercase text-black/60 hover:text-black transition-colors font-medium"
          >
            Home
          </a>
          <a
            href="/insights"
            className="text-[10px] sm:text-xs tracking-[0.14em] uppercase text-black/60 hover:text-black transition-colors font-medium"
          >
            Insights
          </a>
          <a
            href="/resources"
            className="text-[10px] sm:text-xs tracking-[0.14em] uppercase text-black/60 hover:text-black transition-colors font-medium"
          >
            Resources
          </a>
          <a
            href="/apply"
            className="bg-[#E53935] text-white text-[10px] sm:text-xs tracking-[0.14em] uppercase px-3 sm:px-4 py-2.5 hover:bg-[#C62828] transition-colors font-medium"
          >
            Apply
          </a>
        </nav>
      </div>
    </header>
  );
}

function Breadcrumbs({ label }: { label: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-8 text-[10px] tracking-[0.16em] uppercase text-black/45"
    >
      <a href="/" className="hover:text-black transition-colors">
        Home
      </a>
      <span className="mx-2" aria-hidden="true">
        /
      </span>
      <span aria-current="page" className="text-black/70">
        {label}
      </span>
    </nav>
  );
}

export default function InformationPage() {
  const [location] = useLocation();
  const normalisedLocation =
    location.length > 1 ? location.replace(/\/$/, "") : location;
  const page =
    informationPages[normalisedLocation] ?? informationPages["/about"];

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Navigation />
      <main className="flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="max-w-2xl mx-auto">
          <Breadcrumbs label={page.label} />
          <div className="w-3 h-3 bg-[#E53935] mb-8" aria-hidden="true" />
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#E53935] font-semibold mb-4">
            {page.label}
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold uppercase tracking-[-0.035em] leading-[0.93] mb-6">
            {page.h1}
          </h1>
          <p className="text-base sm:text-lg text-black/65 leading-relaxed mb-12">
            {page.description}
          </p>

          <div className="space-y-12">
            {page.sections.map(section => (
              <section
                key={section.heading}
                className="border-t border-black/10 pt-7"
              >
                <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-5">
                  {section.heading}
                </h2>
                <div className="space-y-4">
                  {section.content.map(paragraph => (
                    <p
                      key={paragraph}
                      className="text-sm sm:text-base text-black/70 leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.links && (
                  <ul className="mt-6 border-t border-black/10">
                    {section.links.map(link => (
                      <li
                        key={link.href}
                        className="border-b border-black/10 py-4"
                      >
                        <a
                          href={link.href}
                          {...(link.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className="group block"
                        >
                          <span className="text-sm font-semibold text-black group-hover:text-[#E53935] transition-colors">
                            {link.label}
                          </span>
                          {link.description && (
                            <span className="block mt-1 text-sm text-black/55 leading-relaxed">
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

          {page.cta && (
            <div className="mt-12">
              <a
                href={page.cta.href}
                className="inline-flex bg-[#E53935] text-white text-xs tracking-[0.15em] uppercase px-6 py-3.5 hover:bg-[#C62828] transition-colors font-bold"
              >
                {page.cta.label}
              </a>
            </div>
          )}
        </div>
      </main>
      <footer className="border-t border-black/10 py-6">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <a
            href="/"
            className="text-xs tracking-[0.1em] uppercase text-black/40 hover:text-black transition-colors"
          >
            Marin Lazic
          </a>
        </div>
      </footer>
    </div>
  );
}
