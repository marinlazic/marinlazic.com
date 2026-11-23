/**
 * The channels the Studio writes for, in the order they appear. The id is the
 * file name of the channel's spec in .claude/skills/content/formats. The
 * short key is the first segment of the site's tagged short links
 * (server/shortLinks.ts), so a piece's link records where the visitor came from.
 */
export type ChannelGroup = "written" | "video";
export type Platform = "linkedin" | "substack" | "instagram" | "x" | "kit" | "youtube";

export type Channel = {
  id: string;
  label: string;
  platform: Platform;
  group: ChannelGroup;
  short: string;
  /** What Marin does with the body. */
  paste: string;
};

export const CHANNELS: Channel[] = [
  { id: "linkedin-post", label: "LinkedIn post", platform: "linkedin", group: "written", short: "li", paste: "Paste into a new LinkedIn post. Put the link in the first comment." },
  { id: "linkedin-article", label: "LinkedIn article", platform: "linkedin", group: "written", short: "li", paste: "Paste into LinkedIn, Write article." },
  { id: "substack-newsletter", label: "Substack newsletter", platform: "substack", group: "written", short: "sub", paste: "Paste into a new Substack post. Subject and subtitle are above." },
  { id: "substack-note", label: "Substack Notes", platform: "substack", group: "written", short: "sub", paste: "Three notes. Post one a day." },
  { id: "instagram-carousel", label: "Instagram carousel", platform: "instagram", group: "written", short: "ig", paste: "Design the slides at 1080 by 1350 in the site look, then paste the caption." },
  { id: "x-post", label: "X posts", platform: "x", group: "written", short: "x", paste: "Five single posts and a thread. Post across the week." },
  { id: "x-article", label: "X article", platform: "x", group: "written", short: "x", paste: "Paste into X, Write article." },
  { id: "kit-newsletter", label: "Kit newsletter", platform: "kit", group: "written", short: "kit", paste: "Paste into a new Kit broadcast. Keep the merge tag as written." },
  { id: "youtube-short", label: "YouTube Short", platform: "youtube", group: "video", short: "yt", paste: "Film the script in one take, vertical, under 60 seconds." },
  { id: "youtube-video", label: "YouTube video", platform: "youtube", group: "video", short: "yt", paste: "Film by chapter. Title, thumbnail and description are above." },
  { id: "instagram-reel", label: "Instagram Reel", platform: "instagram", group: "video", short: "ig", paste: "Re-cut the Short, add the cover text, paste the caption." },
];

export const CHANNEL_IDS = CHANNELS.map(c => c.id);
export const channelById = (id: string) => CHANNELS.find(c => c.id === id);

export const PLATFORMS: Record<Platform, { label: string }> = {
  linkedin: { label: "LinkedIn" },
  substack: { label: "Substack" },
  instagram: { label: "Instagram" },
  x: { label: "X" },
  kit: { label: "Kit" },
  youtube: { label: "YouTube" },
};

/** Where a piece sends people. dest is the second segment of a short link. */
export const CTAS: Record<string, { label: string; dest: string; path: string; line: string }> = {
  assessment: { label: "Free assessment", dest: "a", path: "/assessment", line: "Take the free assessment. 5 minutes, a personal report at the end." },
  resources: { label: "Recovery Guide", dest: "g", path: "/recovery-guide", line: "Get the Recovery Guide." },
  library: { label: "Program library", dest: "l", path: "/library", line: "Browse the program library. Every program lives in the Bridge app." },
  apply: { label: "Apply for coaching", dest: "ap", path: "/apply", line: "Apply for coaching. I read every application and reply by email. No sales call." },
};

/** The campaign key the short link records: letters and digits only, as resolveShortLink cleans it. */
export const campaignKey = (slug: string) => slug.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 60);

/** The tagged link for one piece: marinlazic.com/li/a/nooffseason. */
export function trackedLink(origin: string, channel: Channel, cta: string, slug: string): string {
  const c = CTAS[cta] ?? CTAS.assessment;
  return `${origin}/${channel.short}/${c.dest}/${campaignKey(slug)}`;
}
