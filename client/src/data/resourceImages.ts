// Photos for the Resources section. Black and white, graded bright enough
// that the subject reads at a glance. Cards are square (1200x1200), the
// featured photo is 3:2 (1800x1200). Nobody topless.
// Files live in client/public/images/resources as jpg with webp variants.

export type ResourcePhoto = {
  base: string;
  alt: string;
  widths: number[];
  /** Width to height. Square when omitted. */
  aspect?: [number, number];
};

const CARD_WIDTHS = [600, 1200];

export const resourcesHero: ResourcePhoto = {
  base: "resources-hero",
  alt: "Athlete squatting with a foam roller held in front on a gym turf",
  widths: [600, 1200, 1800],
  aspect: [3, 2],
};

const photos: Record<string, ResourcePhoto> = {
  template: { base: "template", alt: "Athlete working with a sandbag in a gym", widths: CARD_WIDTHS },
  groove: { base: "groove", alt: "Push up on a gym floor in a white t shirt", widths: CARD_WIDTHS },
  routine: { base: "routine", alt: "Two people on the beach at first light with surfboards", widths: CARD_WIDTHS },
  move: { base: "move", alt: "Overhead medicine ball throw outdoors", widths: CARD_WIDTHS },
  protein: { base: "protein", alt: "A plate of eggs, meat, bread and salad", widths: CARD_WIDTHS },
  engine: { base: "engine", alt: "Cartwheel on an empty beach", widths: CARD_WIDTHS },
  recover: { base: "recover", alt: "Ladder into an ocean rock pool", widths: CARD_WIDTHS },
  week3: { base: "week3", alt: "Handwritten training plan in a notebook", widths: CARD_WIDTHS },
  sleep: { base: "sleep", alt: "Sunrise over the ocean through broken cloud", widths: CARD_WIDTHS },
};

export function resourceImagePath(base: string, width: number, ext: "jpg" | "webp" = "jpg") {
  return `/images/resources/${base}-${width}.${ext}`;
}

export function srcSet(photo: ResourcePhoto, ext: "jpg" | "webp") {
  return photo.widths.map(w => `${resourceImagePath(photo.base, w, ext)} ${w}w`).join(", ");
}

/** Photo for a resource, looked up by its short alias (the URL segment). */
export function resourcePhoto(aliasOrSlug: string): ResourcePhoto | undefined {
  return photos[aliasOrSlug];
}
