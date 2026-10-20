// Media and interviews page content and schema items.

export const MEDIA_TITLE = "Media and Interviews | Marin Lazic";
export const MEDIA_DESCRIPTION =
  "Podcasts and interviews with Marin Lazic, Strength and Conditioning Coach for the Australian Men's Water Polo Team and performance coach for founders. Summaries, topics and links.";

export const YOUTUBE_URL = "https://www.youtube.com/@MarinLazic";
export const SUBSTACK_URL = "https://marinlazic.substack.com";
export const INSTAGRAM_URL = "https://www.instagram.com/marinlazic";

export const READY_STATE_URL =
  "https://thereadystate.com/trs_podcast/solving-performance-anxiety-happy-athletes-marin-lazic/";
export const AIF_PODCAST_URL = "https://fitness.edu.au/?p=70992";
export const DELFINA_URL =
  "https://www.delfinasport.com/blogs/news/interview-with-trx-master-instructor-marin-lazic";

export type MediaItem = {
  heading: string;
  meta: string;
  paragraphs: string[];
  links: { label: string; href: string }[];
};

export const mediaItems: MediaItem[] = [
  {
    heading: "The Ready State Podcast with Kelly and Juliet Starrett",
    meta: "23 July 2026. 1 hour 13 minutes. Episode: Happy Athletes Perform Better: A Coach's Guide to Beating Performance Anxiety.",
    paragraphs: [
      "Kelly and Juliet Starrett asked me about the day I was dropped from my national team four weeks before a World Championship, and what it taught me about stress and performance. My fitness had not changed. My ability to use it had.",
      "We covered how I coach the Aussie Sharks now. Why happy athletes perform better. Warm up games before matches to take the edge off performance anxiety. Beating Serbia at the Paris Olympics, the six weeks in Europe before the Games, and removing decision fatigue on match day. The quarterfinal shootout loss to the USA.",
      "On the training side we talked about the physicality of elite water polo, borrowing from wrestling and MMA for strength in the water, eye training and vision work, breath work, how I structure sessions, and coaching on the road with whatever equipment is there. Influences we discussed: Peter Twist, Dan John and Pavel Tsatsouline. My book pick was Legacy by James Kerr.",
    ],
    links: [
      { label: "Listen on The Ready State", href: READY_STATE_URL },
      {
        label: "My written version of the story on Substack",
        href: "https://marinlazic.substack.com/p/happy-athletes-perform-better-so",
      },
      {
        label: "Episode chapters and summary",
        href: "https://podcastrex.com/shows/the-ready-state-podcast/happy-athletes-perform-better-a-coachs-guide-to-beating-performance-anxiety-marin-lazic",
      },
    ],
  },
  {
    heading: "The Fitness Industry Podcast, Australian Institute of Fitness",
    meta: "3 March 2020. Host: Oliver Kitchingman. Episode: Be curious, try new training and keep growing.",
    paragraphs: [
      "Recorded when I was a TRX Master Instructor. We talked about suspension training, why new training methods can challenge even very fit people, using body temperature data to spot illness before it hits, and reaching out to the people you admire in the industry to learn from them.",
    ],
    links: [
      { label: "Listen on the Australian Institute of Fitness site", href: AIF_PODCAST_URL },
    ],
  },
  {
    heading: "Delfina Sport interview",
    meta: "2019. Written interview.",
    paragraphs: [
      "A short interview on recovery, performance and mobility for water polo players, from my time as a TRX Master Instructor and Trigger Point Master Trainer. It covers my playing background with the New Zealand national team and Balmain Tigers in the Australian National Water Polo League.",
    ],
    links: [{ label: "Read on Delfina Sport", href: DELFINA_URL }],
  },
];

export const MEDIA_INTRO =
  "Podcasts and interviews where I talk about preparing the Australian Men's Water Polo Team, coaching founders, and what stress does to performance. Each one has a short summary of what we covered and a link to the episode. Media enquiries go through the contact form on the home page. Speaking enquiries go through the Speaking page.";

export const MEDIA_CLOSING =
  "If you would like me on your podcast or at your event, send a note through the contact form on the home page.";

const PERSON_REF = { "@id": "https://marinlazic.com/#person" };

/** Items used both in the Person.subjectOf array and the /media ItemList. */
export const mediaSubjects = [
  {
    "@type": "PodcastEpisode",
    name: "Happy Athletes Perform Better: A Coach's Guide to Beating Performance Anxiety",
    datePublished: "2026-07-23",
    timeRequired: "PT1H13M",
    url: READY_STATE_URL,
    partOfSeries: { "@type": "PodcastSeries", name: "The Ready State Podcast" },
    actor: PERSON_REF,
    description:
      "Kelly and Juliet Starrett asked me about the day I was dropped from my national team four weeks before a World Championship, and what it taught me about stress and performance.",
  },
  {
    "@type": "PodcastEpisode",
    name: "Be curious, try new training and keep growing, with Marin Lazic",
    datePublished: "2020-03-03",
    url: AIF_PODCAST_URL,
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "The Fitness Industry Podcast",
      publisher: { "@type": "Organization", name: "Australian Institute of Fitness" },
    },
    actor: PERSON_REF,
  },
  {
    "@type": "Article",
    name: "Interview with TRX Master Instructor Marin Lazic",
    url: DELFINA_URL,
    publisher: { "@type": "Organization", name: "Delfina Sport" },
    about: PERSON_REF,
  },
];
