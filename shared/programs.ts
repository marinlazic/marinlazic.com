// The program library. Add a program by adding an object to PROGRAMS under the
// section it belongs to. Programs are sold and delivered in Bridge: the Buy link
// is the Bridge checkout page, and a purchase puts the buyer in the Bridge team
// "Program Library". No discounts or sale pricing yet.
//
// Pricing. Net price (what Marin keeps) by length: 4 weeks $79, 6 weeks $119,
// 8 weeks $159. Specialist programs add $20 (water polo, women) and leader and
// corporate programs add $40. The shown price covers Stripe fees, assuming
// about 2% plus $0.30 a sale: price = round up((net + 0.30) / 0.98).
// Net $99 shows as $102. All prices are AUD and GST is not added.
export function shownPrice(net: number) {
  return Math.ceil((net + 0.3) / 0.98);
}

export type ProgramSection = {
  id: string;
  title: string;
  heading: string;
  blurb: string;
};

export type Thumb = {
  cutout?: string;
  tag?: string;
  image: string;
  imageAlt: string;
  focus: string;
  word: string;
  emoji: string;
  place: string;
};

export type Program = Thumb & {
  slug: string;
  section: string;
  name: string;
  line: string;
  description: string;
  // Longer copy shown on the card and page. Facts from the Bridge product page only.
  highlights: string[];
  weeks: number;
  sessionsPerWeek?: number;
  level: string;
  price: number;
  currency: "AUD";
  buyUrl: string;
  forWho: string[];
  includes: string[];
  faqs: { q: string; a: string }[];
  modified: string;
};

export const SECTIONS: ProgramSection[] = [
  {
    id: "water-polo",
    heading: "Written for water polo players.",
    title: "Water polo",
    blurb:
      "Built by the strength and conditioning coach of the Australian Men's Water Polo Team.",
  },
  {
    id: "hobbies",
    heading: "Train for the thing you love.",
    title: "Hobbies",
    blurb: "Strength work built around one hobby, so you move better, last longer and get hurt less.",
  },
  {
    id: "women",
    heading: "Strength built for women.",
    title: "Women",
    blurb: "Programs for each stage of life. Heavy, progressive training with clear explanations of why.",
  },
  {
    id: "leaders",
    heading: "Programs for people who lead.",
    title: "Leaders",
    blurb: "Short sessions for a full calendar. Built from the work I do with founders and executives.",
  },
  {
    id: "corporate-athlete",
    heading: "Train your team like athletes.",
    title: "Corporate athlete",
    blurb: "The same method used with elite athletes, for people at work and for whole teams.",
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
      "A four week gym program for water polo players who want more muscle, strength that holds up in contact and shoulders that stay healthy. It is hypertrophy training built for water polo, not general bodybuilding. It comes from the strength and conditioning work Marin Lazic does as the Strength and Conditioning Coach of the Australian Men's Water Polo Team, including the Paris Olympic Games.",
    highlights: [
      "Water polo specific hypertrophy",
      "Shoulder smart training volume",
      "A simple 4 week progression",
      "Gym work that supports performance in the pool",
    ],
    weeks: 4,
    place: "Gym",
    level: "Water polo players",
    price: shownPrice(99),
    currency: "AUD",
    image: "/images/library/hypertrophy.webp",
    imageAlt: "An athlete training in a gym with a weight rack",
    cutout: "/images/library/hypertrophy-cut.webp",
    tag: "water polo",
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
      "A four week gym program, three days a week, that builds maximum strength and power for water polo players. Each main lift is paired with a jump or a throw, so the strength you build gets used at speed. It comes from the work Marin Lazic does as the Strength and Conditioning Coach of the Australian Men's Water Polo Team.",
    highlights: [
      "Trap bar deadlift, bench press and Zercher squat, each paired with a jump or a throw",
      "3 pulls for every 1 push, to look after your shoulders",
      "You rate each set by percent difficulty, so the load matches how you feel",
      "4 weeks, 3 sessions a week",
    ],
    weeks: 4,
    sessionsPerWeek: 3,
    place: "Gym",
    level: "Water polo players",
    price: shownPrice(99),
    currency: "AUD",
    image: "/images/library/max-strength.webp",
    imageAlt: "A water polo goal and net seen from the pool edge, with a player in the water",
    tag: "water polo",
    word: "power",
    emoji: "\u{1F525}",
    focus: "center",
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

// Planned programs. They show on the library page as coming soon, with no
// buy link, no price and no page of their own until they exist in Bridge.
export type Upcoming = Thumb & {
  section: string;
  name: string;
  line: string;
  weeks: number;
  sessionsPerWeek: number;
  price: number;
};
export const UPCOMING: Upcoming[] = [
  { section: "hobbies", name: "Strength for Runners", line: "Stronger legs and hips for 5k, half marathon and marathon runners. Fits around your running week.", weeks: 6, sessionsPerWeek: 3, price: shownPrice(119), tag: "hobby", place: "Gym", word: "run", emoji: "\u{1F3C3}", image: "/images/guide/walk.jpg", imageAlt: "Strength for Runners", focus: "center" },
  { section: "hobbies", name: "Strength for Golfers", line: "Power, hips and a back that holds up over 18 holes. Built for the weeks before your season.", weeks: 4, sessionsPerWeek: 3, price: shownPrice(79), tag: "hobby", place: "Gym", word: "drive", emoji: "\u26F3", image: "/images/guide/dawn.jpg", imageAlt: "Strength for Golfers", focus: "center" },
  { section: "hobbies", name: "Strength for Tennis Players", line: "Legs, shoulders and trunk for longer matches and fewer niggles.", weeks: 6, sessionsPerWeek: 3, price: shownPrice(119), tag: "hobby", place: "Gym", word: "serve", emoji: "\u{1F3BE}", image: "/images/guide/shore.jpg", imageAlt: "Strength for Tennis Players", focus: "center" },
  { section: "hobbies", name: "Strength for Boxing", line: "Ground force, trunk and shoulder strength for bag work and sparring.", weeks: 4, sessionsPerWeek: 3, price: shownPrice(79), tag: "hobby", place: "Gym", word: "punch", emoji: "\u{1F94A}", image: "/images/guide/pushup.jpg", imageAlt: "Strength for Boxing", focus: "center" },
  { section: "hobbies", name: "Strength for Swimmers", line: "Lat, shoulder and trunk strength that carries over to the water.", weeks: 6, sessionsPerWeek: 3, price: shownPrice(119), tag: "hobby", place: "Gym", word: "swim", emoji: "\u{1F3CA}", image: "/images/guide/lane.jpg", imageAlt: "Strength for Swimmers", focus: "center" },
  { section: "hobbies", name: "Ski and Snowboard Pre Season", line: "Legs and knees ready for the first day on the snow.", weeks: 8, sessionsPerWeek: 3, price: shownPrice(159), tag: "hobby", place: "Gym", word: "snow", emoji: "\u{1F3C2}", image: "/images/guide/coast.jpg", imageAlt: "Ski and Snowboard Pre Season", focus: "center" },
  { section: "women", name: "Perimenopause Strength", line: "Build strength and keep your energy steady as your hormones start to change.", weeks: 8, sessionsPerWeek: 3, price: shownPrice(179), tag: "women", place: "Gym", word: "steady", emoji: "\u{1F338}", image: "/images/guide/floor.jpg", imageAlt: "Perimenopause Strength", focus: "center" },
  { section: "women", name: "Menopause Strength", line: "Lift heavier with a plan built for life after your periods stop.", weeks: 8, sessionsPerWeek: 3, price: shownPrice(179), tag: "women", place: "Gym", word: "strong", emoji: "\u{1F4AA}", image: "/images/guide/gym.jpg", imageAlt: "Menopause Strength", focus: "center" },
  { section: "women", name: "Strength for Bone Health", line: "Heavy, progressive loading for stronger bones. Check with your doctor first.", weeks: 8, sessionsPerWeek: 3, price: shownPrice(179), tag: "women", place: "Gym", word: "bones", emoji: "\u{1F9B4}", image: "/images/guide/muscles.jpg", imageAlt: "Strength for Bone Health", focus: "center" },
  { section: "women", name: "Women Leaders Performance", line: "Strength, energy and stress control for women who run teams and companies.", weeks: 6, sessionsPerWeek: 3, price: shownPrice(139), tag: "women", place: "Gym or home", word: "lead", emoji: "\u{1F451}", image: "/images/guide/notes.jpg", imageAlt: "Women Leaders Performance", focus: "center" },
  { section: "leaders", name: "Leader Performance Program", line: "Strength, energy and sleep habits for people with too many meetings.", weeks: 6, sessionsPerWeek: 3, price: shownPrice(159), tag: "leaders", place: "Gym", word: "lead", emoji: "\u{1F4BC}", image: "/images/guide/phone.jpg", imageAlt: "Leader Performance Program", focus: "center" },
  { section: "leaders", name: "Travel Week Training", line: "30 minute hotel room sessions that keep your training alive on the road.", weeks: 4, sessionsPerWeek: 3, price: shownPrice(119), tag: "leaders", place: "Hotel room", word: "travel", emoji: "\u2708\uFE0F", image: "/images/guide/boat.jpg", imageAlt: "Travel Week Training", focus: "center" },
  { section: "corporate-athlete", name: "The Corporate Athlete", line: "Train, recover and perform at work the way an athlete prepares for a season.", weeks: 8, sessionsPerWeek: 3, price: shownPrice(199), tag: "corporate athlete", place: "Gym", word: "perform", emoji: "\u{1F3C6}", image: "/images/guide/wave.jpg", imageAlt: "The Corporate Athlete", focus: "center" },
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
