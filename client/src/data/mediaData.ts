// Podcasts and interviews. The Resources page shows the first item as its cover
// story, and the schema items sit on the Person record. The Media page itself
// was removed on 19 Nov 2026 and its address goes to Resources.

export const YOUTUBE_URL = "https://www.youtube.com/@MarinLazic";
export const SUBSTACK_URL = "https://marinlazic.substack.com";
export const INSTAGRAM_URL = "https://www.instagram.com/marinlazic";

/** The Substack subscribe page, tagged so Substack shows which part of the site sent the reader. */
export const substackSubscribeUrl = (placement: string) =>
  `${SUBSTACK_URL}/subscribe?utm_source=marinlazic.com&utm_medium=${encodeURIComponent(placement)}`;

// Shown until the live Substack feed answers, and if it fails. Taken from the
// feed on 19 Nov 2026. Two titles and lines were tidied on Substack on 22 Nov.
export const SUBSTACK_SNAPSHOT = [
  { title: "Right Supplement, Wrong Hour", description: "A two-minute guide to when to take what, and why the harder questions are dose and source.", link: "https://marinlazic.substack.com/p/when-to-take-vitamins-supplements", pubDate: "Mon, 31 Aug 2026 06:42:14 GMT", image: "https://substack-post-media.s3.amazonaws.com/public/images/2bb4dca4-4895-48e3-9d99-363240cc3b5b_2000x1342.jpeg" as string | null },
  { title: "I Was 23, In The Best Shape Of My Life, And I Could Not Swim", description: "What I told Kelly and Juliet Starrett on The Ready State Podcast.", link: "https://marinlazic.substack.com/p/happy-athletes-perform-better-so", pubDate: "Sun, 16 Aug 2026 21:06:03 GMT", image: "https://substackcdn.com/image/fetch/$s_!ln4r!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F0b690c8e-28b5-4190-933c-c62de5edf59c_4032x2268.heic" },
  { title: "Your Training is Useless Without This One Simple Thing", description: "Why the smartest thing you can do for your performance is strategically do less", link: "https://marinlazic.substack.com/p/your-training-is-useless-without", pubDate: "Tue, 03 Mar 2026 00:51:33 GMT", image: "https://substack-post-media.s3.amazonaws.com/public/images/6be0bf89-a9ba-48b3-a344-f60addca0133_1200x627.png" },
  { title: "Your Physio Said Rest. Here's Why That Might Be Terrible Advice.", description: "", link: "https://marinlazic.substack.com/p/your-p-hysio-said-rest-heres-why", pubDate: "Sat, 28 Feb 2026 01:02:26 GMT", image: "https://substackcdn.com/image/fetch/$s_!E6IG!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F0a270899-1e94-4d33-ba4b-244b60a8e223_1179x649.jpeg" },
  { title: "What Is Your Weekly HRV Trend Telling You?", description: "Are you actually using it?", link: "https://marinlazic.substack.com/p/what-is-your-weekly-hrv-trend-telling", pubDate: "Sun, 22 Feb 2026 01:24:22 GMT", image: "https://substackcdn.com/image/fetch/$s_!EyNI!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F18df2dbc-cd3e-43a6-802a-6f2bf714cb87_1179x1023.png" },
  { title: "Corporate Athlete Test, 7 Kettlebell Benchmarks That Actually Matter", description: "Competent adult standards for men and women. Not elite numbers.", link: "https://marinlazic.substack.com/p/corporate-athlete-test-7-kettlebell", pubDate: "Sun, 15 Feb 2026 23:17:19 GMT", image: "https://substackcdn.com/image/fetch/$s_!mw3Q!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F1a31e6c2-4f45-482b-8940-90d2685567aa_1168x784.jpeg" },
];

export const postDate = (d: string) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime())
    ? ""
    : t.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Sydney" });
};

/** The post's own line, when it is short and does not just repeat the title. */
export const postLine = (title: string, d: string) => (d && d.length <= 170 && d.trim() !== title.trim() ? d : "");

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
  videos?: { id: string; title: string }[];
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
    videos: [
      { id: "mpW9QbWSkG0", title: "Why We Laughed Before an Olympic Match" },
      { id: "OBjo8yAk94g", title: "The Olympic Mindset That Changed Everything" },
      { id: "CTeNQ6LR7RQ", title: "Can You Build an Olympian Without a Fancy Gym?" },
      { id: "1KT-aeg5SuI", title: "The Moment I Learned Stress Is Physical" },
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

const PERSON_REF = { "@id": "https://marinlazic.com/#person" };

/** Items used in the Person.subjectOf array. */
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
