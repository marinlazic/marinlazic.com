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
  wordTop?: string;
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
    wordTop: "50%",
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

// Stock photos are free to use under the Unsplash licence and are shown in
// black and white to match the site. Swap any for your own photo by changing the path.
function unsplash(id: string) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&h=750&q=75`;
}

// Planned programs. They show on the library page as coming soon, with no
// buy link, no price and no page of their own until they exist in Bridge.
export type Upcoming = Thumb & {
  section: string;
  name: string;
  line: string;
  weeks: number;
  sessionsPerWeek: number;
  price: number;
  highlights: string[];
};
export const UPCOMING: Upcoming[] = [
  {
    section: "hobbies",
    name: "Strength for Runners",
    line: "A 6 week strength training program for runners. It builds stronger legs, hips and calves for 5k, 10k, half marathon and marathon training, and fits around your running week.",
    highlights: ["3 gym sessions a week that fit around your runs", "Single leg strength, hips and calves", "Built to help you run longer with fewer niggles", "6 weeks, delivered in the Bridge app"],
    weeks: 6,
    sessionsPerWeek: 3,
    price: shownPrice(119),
    tag: "hobby",
    place: "Gym",
    word: "run",
    emoji: "\u{1F3C3}",
    image: unsplash("photo-1581889470536-467bdbe30cd0"),
    imageAlt: "A runner on a road",
    focus: "center",
  },
  {
    section: "hobbies",
    name: "Strength for Golfers",
    line: "A 4 week golf fitness program for rotational power, strong hips and a back that holds up over 18 holes. Built for the weeks before your season.",
    highlights: ["Hip and trunk strength for a stronger swing", "A back that holds up over 18 holes", "3 gym sessions a week", "4 weeks, delivered in the Bridge app"],
    weeks: 4,
    sessionsPerWeek: 3,
    price: shownPrice(79),
    tag: "hobby",
    place: "Gym",
    word: "drive",
    emoji: "\u26F3",
    image: unsplash("photo-1593282153762-a41e3cceb06c"),
    imageAlt: "A golfer mid swing on a golf course",
    focus: "center",
  },
  {
    section: "hobbies",
    name: "Strength for Tennis Players",
    line: "A 6 week strength program for tennis players. Legs, shoulders and trunk for longer matches, quicker movement and fewer niggles.",
    highlights: ["Leg strength for quick changes of direction", "Shoulder and trunk strength for serving and hitting", "3 gym sessions a week", "6 weeks, delivered in the Bridge app"],
    weeks: 6,
    sessionsPerWeek: 3,
    price: shownPrice(119),
    tag: "hobby",
    place: "Gym",
    word: "serve",
    emoji: "\u{1F3BE}",
    image: unsplash("photo-1554068865-24cecd4e34b8"),
    imageAlt: "A tennis player on court",
    focus: "center",
  },
  {
    section: "hobbies",
    name: "Strength for Boxing",
    line: "A 4 week strength program for boxing. Ground force, trunk and shoulder strength for bag work and sparring, written for people who train in a boxing gym.",
    highlights: ["Ground force and leg drive", "Trunk and shoulder strength for bag work and sparring", "3 gym sessions a week", "4 weeks, delivered in the Bridge app"],
    weeks: 4,
    sessionsPerWeek: 3,
    price: shownPrice(79),
    tag: "hobby",
    place: "Gym",
    word: "punch",
    emoji: "\u{1F94A}",
    image: unsplash("photo-1517438322307-e67111335449"),
    imageAlt: "Two boxers sparring in a boxing gym",
    focus: "center",
  },
  {
    section: "hobbies",
    name: "Strength for Swimmers",
    line: "A 6 week dryland strength program for swimmers. Lat, shoulder and trunk strength that carries over to the water, for lap swimmers and open water swimmers.",
    highlights: ["Lat, shoulder and trunk strength", "Dryland work that carries over to the pool", "3 gym sessions a week", "6 weeks, delivered in the Bridge app"],
    weeks: 6,
    sessionsPerWeek: 3,
    price: shownPrice(119),
    tag: "hobby",
    place: "Gym",
    word: "swim",
    emoji: "\u{1F3CA}",
    image: unsplash("photo-1519315901367-f34ff9154487"),
    imageAlt: "A swimmer in a lap pool",
    focus: "center",
  },
  {
    section: "hobbies",
    name: "Ski and Snowboard Pre Season",
    line: "An 8 week ski and snowboard pre season program. Legs, glutes and knees ready for the first day on the snow.",
    highlights: ["Leg and knee strength for long days on the slopes", "Built for the 8 weeks before your trip or season", "3 gym sessions a week", "8 weeks, delivered in the Bridge app"],
    weeks: 8,
    sessionsPerWeek: 3,
    price: shownPrice(159),
    tag: "hobby",
    place: "Gym",
    word: "snow",
    emoji: "\u{1F3C2}",
    image: unsplash("photo-1478700485868-972b69dc3fc4"),
    imageAlt: "A snowboarder on a mountain",
    focus: "center",
  },
  {
    section: "women",
    name: "Perimenopause Strength",
    line: "An 8 week strength training program for women in perimenopause. Heavy, progressive lifting to build strength and keep your energy steady as your hormones start to change.",
    highlights: ["Heavy, progressive strength training", "Clear explanations of why each part is there", "3 gym sessions a week", "8 weeks, delivered in the Bridge app"],
    weeks: 8,
    sessionsPerWeek: 3,
    price: shownPrice(179),
    tag: "women",
    place: "Gym",
    word: "steady",
    emoji: "\u{1F338}",
    image: unsplash("photo-1541534741688-6078c6bfb5c5"),
    imageAlt: "A woman lifting weights in a gym",
    focus: "center",
  },
  {
    section: "women",
    name: "Menopause Strength",
    line: "An 8 week strength training program for women in menopause and after. Lift heavier with a plan built for life after your periods stop.",
    highlights: ["Heavy, progressive strength training", "Built for life after your periods stop", "3 gym sessions a week", "8 weeks, delivered in the Bridge app"],
    weeks: 8,
    sessionsPerWeek: 3,
    price: shownPrice(179),
    tag: "women",
    place: "Gym",
    word: "strong",
    emoji: "\u{1F4AA}",
    image: unsplash("photo-1574680096145-d05b474e2155"),
    imageAlt: "A woman lifting a barbell",
    focus: "center",
  },
  {
    section: "women",
    name: "Strength for Bone Health",
    line: "An 8 week strength program for bone health. Heavy, progressive loading to build stronger bones. Check with your doctor before you start.",
    highlights: ["Heavy, progressive loading", "Written to be followed step by step", "3 gym sessions a week", "8 weeks, delivered in the Bridge app"],
    weeks: 8,
    sessionsPerWeek: 3,
    price: shownPrice(179),
    tag: "women",
    place: "Gym",
    word: "bones",
    emoji: "\u{1F9B4}",
    image: unsplash("photo-1546483875-ad9014c88eba"),
    imageAlt: "A woman training with dumbbells",
    focus: "center",
  },
  {
    section: "women",
    name: "Women Leaders Performance",
    line: "A 6 week strength, energy and stress control program for women who run teams and companies. Train at the gym or at home.",
    highlights: ["Strength, energy and stress control", "Works at the gym or at home", "3 sessions a week", "6 weeks, delivered in the Bridge app"],
    weeks: 6,
    sessionsPerWeek: 3,
    price: shownPrice(139),
    tag: "women",
    place: "Gym or home",
    word: "lead",
    emoji: "\u{1F451}",
    image: unsplash("photo-1722925541142-5db2668ca492"),
    imageAlt: "A woman lifting a barbell in a gym",
    focus: "center",
  },
  {
    section: "leaders",
    name: "Leader Performance Program",
    line: "A 6 week fitness program for busy executives and founders. Strength, energy and sleep habits for people with too many meetings.",
    highlights: ["Short sessions built around a full calendar", "Strength, energy and sleep habits", "3 gym sessions a week", "6 weeks, delivered in the Bridge app"],
    weeks: 6,
    sessionsPerWeek: 3,
    price: shownPrice(159),
    tag: "leaders",
    place: "Gym",
    word: "lead",
    emoji: "\u{1F4BC}",
    image: unsplash("photo-1745329532588-1394a50671f0"),
    imageAlt: "A man training in a gym",
    focus: "center",
  },
  {
    section: "leaders",
    name: "Travel Week Training",
    line: "A 4 week travel workout plan. 30 minute hotel room sessions that keep your training going on the road, with no gym needed.",
    highlights: ["30 minute sessions you can do in a hotel room", "No gym needed", "3 sessions a week", "4 weeks, delivered in the Bridge app"],
    weeks: 4,
    sessionsPerWeek: 3,
    price: shownPrice(119),
    tag: "leaders",
    place: "Hotel room",
    word: "travel",
    emoji: "\u2708\uFE0F",
    image: unsplash("photo-1760084081757-6f918c08403b"),
    imageAlt: "A man doing push ups indoors",
    focus: "center",
  },
  {
    section: "corporate-athlete",
    name: "The Corporate Athlete",
    line: "An 8 week program to train, recover and perform at work the way an athlete prepares for a season.",
    highlights: ["Training, recovery and sleep in one plan", "Built from the work done with elite athletes", "3 gym sessions a week", "8 weeks, delivered in the Bridge app"],
    weeks: 8,
    sessionsPerWeek: 3,
    price: shownPrice(199),
    tag: "corporate athlete",
    place: "Gym",
    word: "perform",
    emoji: "\u{1F3C6}",
    image: unsplash("photo-1758506971986-b0d0edebd8d5"),
    imageAlt: "A man running across a city street",
    focus: "center",
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
