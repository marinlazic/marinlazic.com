// The program library. Add a program by adding an object to PROGRAMS under the
// section it belongs to. Programs are sold and delivered in Bridge: the Buy link
// is the Bridge checkout page, and a purchase puts the buyer in the Bridge team
// "Program Library". No discounts or sale pricing yet.

export type ProgramSection = {
  id: string;
  title: string;
  blurb: string;
};

export type Program = {
  slug: string;
  section: string;
  name: string;
  line: string;
  description: string;
  weeks: number;
  sessionsPerWeek?: number;
  place: string;
  level: string;
  price: number;
  currency: "AUD";
  image: string;
  imageAlt: string;
  // Thumbnail look: a big word sits behind the cut out person.
  cutout: string;
  word: string;
  emoji: string;
  focus: string;
  buyUrl: string;
  forWho: string[];
  includes: string[];
  faqs: { q: string; a: string }[];
  modified: string;
};

export const SECTIONS: ProgramSection[] = [
  {
    id: "water-polo",
    title: "Water polo",
    blurb:
      "Gym programs from the Strength and Conditioning Coach of the Australian Men's Water Polo Team.",
  },
  {
    id: "hobbies",
    title: "Hobbies",
    blurb: "Programs built around the sport or hobby you want to be better at.",
  },
  {
    id: "women",
    title: "Women",
    blurb: "Programs for women, including perimenopause, menopause and bone density.",
  },
  {
    id: "leaders",
    title: "Leaders",
    blurb: "Programs for founders and executives who train around a full calendar.",
  },
  {
    id: "corporate-athlete",
    title: "Corporate athlete",
    blurb: "Training, recovery and sleep for people who perform at work.",
  },
];

const DEFAULT_FAQS = [
  {
    q: "Where do I do the program?",
    a: "In the Bridge app. After you buy, Bridge adds the program to your account. You open it on your phone, see each session and log your sets.",
  },
  {
    q: "Do I need a gym?",
    a: "Yes. This program uses gym equipment.",
  },
  {
    q: "Is this a medical program?",
    a: "No. It is training support. If you have an injury or a health condition, check with your doctor before you start.",
  },
];

export const PROGRAMS: Program[] = [
  {
    slug: "water-polo-hypertrophy",
    section: "water-polo",
    name: "Water Polo Hypertrophy",
    line: "Build muscle for the pool over 4 weeks.",
    description:
      "A four week gym program for water polo players who want more muscle. It comes from the strength and conditioning work Marin Lazic does with the Australian Men's Water Polo Team.",
    weeks: 4,
    place: "Gym",
    level: "Water polo players",
    price: 99,
    currency: "AUD",
    image: "/images/library/hypertrophy.webp",
    imageAlt: "A water polo player squatting in the gym with a foam roller",
    cutout: "/images/library/hypertrophy-cut.webp",
    word: "muscle",
    emoji: "\u{1F4AA}",
    focus: "center",
    buyUrl: "https://bridgeathletic.com/product/waterpolohypertrophy-1694014",
    forWho: [
      "Water polo players in or near the pre season who want to add muscle",
      "Players who already lift and want a structured block",
    ],
    includes: [
      "4 weeks of gym sessions in the Bridge app",
      "Sets, reps and exercise demos for each session",
      "A log for your weights, so you can see progress week to week",
    ],
    faqs: [
      {
        q: "How long is the Water Polo Hypertrophy program?",
        a: "Four weeks.",
      },
      ...DEFAULT_FAQS,
    ],
    modified: "2026-10-25",
  },
  {
    slug: "water-polo-max-strength-and-power",
    section: "water-polo",
    name: "Water Polo Max Strength and Power",
    line: "Get stronger and more powerful in 4 weeks, 3 sessions a week.",
    description:
      "A four week gym program with three sessions a week. It builds maximum strength and power for water polo players, using the approach Marin Lazic applies with the Australian Men's Water Polo Team.",
    weeks: 4,
    sessionsPerWeek: 3,
    place: "Gym",
    level: "Water polo players",
    price: 99,
    currency: "AUD",
    image: "/images/library/max-strength.webp",
    imageAlt: "An athlete throwing a medicine ball overhead",
    cutout: "/images/library/max-strength-cut.webp",
    word: "power",
    emoji: "\u{1F525}",
    focus: "center 20%",
    buyUrl: "https://bridgeathletic.com/product/waterpolomaxstrengthandpower-1747737",
    forWho: [
      "Water polo players who want more strength and power in the water",
      "Players who can train in a gym three days a week",
    ],
    includes: [
      "4 weeks, 3 gym sessions a week, in the Bridge app",
      "Sets, reps and exercise demos for each session",
      "A log for your weights, so you can see progress week to week",
    ],
    faqs: [
      {
        q: "How many sessions a week is the Max Strength and Power program?",
        a: "Three sessions a week for four weeks.",
      },
      ...DEFAULT_FAQS,
    ],
    modified: "2026-10-25",
  },
];

export function programPath(p: Program) {
  return `/library/${p.slug}`;
}
export function findProgram(slug: string) {
  return PROGRAMS.find(p => p.slug === slug);
}
export function programLength(p: Program) {
  return `${p.weeks} weeks${p.sessionsPerWeek ? `, ${p.sessionsPerWeek} sessions a week` : ""}`;
}
