// The Resources index page: which guide is featured, which are listed as
// popular and as a starting point, plus a category and a one line summary
// for each guide. Titles and body copy live in pages/ResourcePage.tsx.
import { resources, type Resource } from "@/pages/ResourcePage";
import { resourcePhoto, type ResourcePhoto } from "./resourceImages";

export type ResourceCard = {
  alias: string;
  href: string;
  title: string;
  category: string;
  summary: string;
  minutes: number;
  photo: ResourcePhoto | undefined;
};

const SUMMARIES: Record<string, string> = {
  template: "A simple push, pull, hinge, squat and carry template you can run two or three days a week.",
  groove: "Low effort, frequent practice for a movement such as a pull up or push up.",
  routine: "A short movement and balance check you can do every day, with scaled options.",
  move: "Warm up movements for forward, lateral and rotational work before you train.",
  protein: "Meal ideas with rough protein amounts, to match to your own needs.",
  engine: "A flexible four week example for building easy aerobic work gradually.",
  recover: "Sleep, food, fluids, movement and stress prompts to check each day.",
  week3: "What to do when a new routine starts to feel harder to keep up.",
  sleep: "Timing, light, environment and wind down habits, as a checklist.",
};

const CATEGORIES: Record<string, string> = {
  template: "Strength",
  groove: "Skill practice",
  routine: "Movement",
  move: "Warm up",
  protein: "Nutrition",
  engine: "Conditioning",
  recover: "Recovery",
  week3: "Habits",
  sleep: "Sleep",
};

function wordCount(r: Resource) {
  const text = [r.intro, ...r.sections.flatMap(s => [s.heading ?? "", ...s.content]), r.footer ?? ""].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

function card(r: Resource): ResourceCard {
  const alias = r.aliases[0] ?? r.slug;
  return {
    alias,
    href: `/resources/${alias}`,
    title: r.title,
    category: CATEGORIES[alias] ?? r.tags[0] ?? "Guide",
    summary: SUMMARIES[alias] ?? r.intro,
    minutes: Math.max(2, Math.round(wordCount(r) / 200)),
    photo: resourcePhoto(alias),
  };
}

export const resourceCards: ResourceCard[] = resources.map(card);
const byAlias = new Map(resourceCards.map(c => [c.alias, c]));
const pick = (aliases: string[]) => aliases.map(a => byAlias.get(a)).filter((c): c is ResourceCard => Boolean(c));

/** The guide given the big spot at the top. */
export const featuredResource = byAlias.get("template")!;
/** Read most often. */
export const popularResources = pick(["sleep", "protein", "recover"]);
/** The order to read in if you are new. */
export const startHereResources = pick(["routine", "move", "engine"]);
