/**
 * The Recovery Guide: the lead magnet. One source of truth for the PDF
 * (scripts/build-recovery-guide.mts), the landing page and the email.
 * Marin's voice: plain, short, practical. No dashes anywhere.
 */

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "lead"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; columns: string[]; rows: string[][] }
  | { type: "callout"; label: string; text: string }
  | { type: "steps"; items: { title: string; text: string }[] }
  /** The four kinds of fatigue as photo tiles. */
  | { type: "tiles"; items: { photo: GuidePhoto; title: string; cause: string; feel: string }[] }
  /** One system's recovery list: a goal and big figure cards. */
  | { type: "cards"; title: string; goal: string; items: { figure: string; label: string; text: string }[] }
  /** The morning scorecard: four questions, scored 1 to 5. */
  | { type: "scorecard"; rows: { system: string; question: string }[] }
  /** A week laid out. */
  | { type: "week"; rows: { day: string; work: string; recovery: string }[] }
  /** The loop: three words with arrows. */
  | { type: "loop"; words: string[] }
  /** A new page in the PDF; the web page ignores it. */
  | { type: "break" };

/** Photos from the site, by name. The builder and the page map them to files. */
export type GuidePhoto =
  | "hero" | "morning" | "zone2" | "whoop" | "executive" | "chinup" | "periodisation" | "vo2max" | "stress"
  | "pool" | "plate" | "sunrise" | "notes" | "marin";

export const GUIDE_PHOTOS: Record<GuidePhoto, string> = {
  hero: "/images/articles/insights-hero-bwvACFKZNH25ufFn36wzkx.webp",
  morning: "/images/articles/article-morning-FYrEKKJ4PY5r5Smq5Niq9s.webp",
  zone2: "/images/articles/article-zone2-LN7HkbGvgQW45DUWj9D4zX.webp",
  whoop: "/images/articles/article-whoop-aPcJLKrMSwjXphtA9QV7Yq.webp",
  executive: "/images/articles/article-executive-fitness-7smAuKbB8VnoomqQR4MdYo.webp",
  chinup: "/images/articles/article-chinup-b3w94tbnjqHCj5eJMpGWRR.webp",
  periodisation: "/images/articles/article-periodisation-EvdvYK7AKq2qNs5Tup927x.webp",
  vo2max: "/images/articles/article-vo2max-MLepkJc5Xo8tvTbdeNGm5X.webp",
  stress: "/images/articles/article-stress-FpEMk5MfHkqRzb7BWPiKEY.webp",
  pool: "/images/resources/recover-1200.jpg",
  plate: "/images/resources/protein-1200.jpg",
  sunrise: "/images/resources/sleep-1200.jpg",
  notes: "/images/resources/week3-1200.jpg",
  marin: "/images/site/marin-about-photo_5aa64d77.jpg",
};

export type GuideSection = {
  number: string;
  title: string;
  kicker: string;
  /** Full page photo opener before the content, with the title on the image; "gradient" is the striped brand panel instead of a photo. */
  opener?: GuidePhoto | "gradient";
  /** Where the title sits on the opener and in what colour: light type at the bottom by default. */
  openerStyle?: { ink?: "light" | "dark"; at?: "top" | "bottom" };
  /** A photo beside the content, for sections without an opener. */
  side?: GuidePhoto;
  blocks: GuideBlock[];
};

export const RECOVERY_GUIDE = {
  slug: "recovery-guide",
  title: "The Recovery Guide",
  subtitle: "Match your recovery to the work you did",
  pdfPath: "/guides/the-recovery-guide.pdf",
  cover: "hero" as GuidePhoto,
  kitTag: "Recovery Guide Subscribers",
  author: "Marin Lazic",
  authorLine: "Strength and conditioning coach to the Australian men's water polo team, and to busy professionals who want to stay strong.",
  edition: "October 2026",
  promise: "Most people recover the same way after everything: a stretch, an early night, maybe an ice bath. It does not work like that. A heavy lifting day, a long run, a week of back to back meetings and a flight each leave a different kind of fatigue, and each needs a different fix. This guide shows you how to tell them apart and what to do about each one, with the numbers.",
  whatsInside: [
    "Why the rest is where you get stronger, and what happens when you skip it",
    "The four kinds of fatigue and how to tell which one you have",
    "What to do after each kind: cold water, stretching, easy movement, breathing, compression, light and sleep, with times and temperatures",
    "The foods that help you repair, and the ones worth a conversation",
    "A morning check that takes thirty seconds and tells you what to do today",
    "A week that works, laid out",
  ],
  sections: [
    {
      number: "01",
      title: "You get stronger in the rest",
      kicker: "Work plus rest",
      opener: "morning",
      side: "pool",
      blocks: [
        { type: "lead", text: "Training is a stress. The body does not get fitter during the session. It gets fitter afterwards, while it repairs the damage and builds a bit extra so the next session is easier." },
        { type: "p", text: "That means two things are true at the same time. Work without rest ends in overtraining, injury and illness. Rest without work changes nothing. The result you want sits between them: enough work to ask for change, enough rest to let it happen." },
        { type: "loop", words: ["Work", "Rest", "Adapt"] },
        { type: "p", text: "Think of it as a loop. Work, then rest, then adapt. Then go again from a slightly higher base. Every time you shorten the rest, you shrink the gain." },
        { type: "callout", label: "The rule", text: "Work plus rest equals progress. Miss either half and you are standing still, or going backwards." },
      ],
    },
    {
      number: "02",
      title: "Two kinds of recovery",
      kicker: "Rest and regeneration",
      side: "zone2",
      blocks: [
        { type: "p", text: "Recovery is just the process of getting over the stress you put on yourself, at training, at work and at home. There are two ways to help it along." },
        {
          type: "steps",
          items: [
            { title: "Rest", text: "The passive kind. Sleep, food, fluids, switching your head off. It happens inside every 24 hours whether you plan it or not, and the quality of it decides most of your recovery." },
            { title: "Regeneration", text: "The active kind. Easy movement, stretching, cold water, breathing drills, compression. Planned, put in the diary, done on purpose. A regeneration day is a training day with a different job." },
          ],
        },
        { type: "p", text: "Most people only ever do the first kind, and do it badly. The second kind is where a coach earns their keep, and it is what the rest of this guide is about." },
      ],
    },
    {
      number: "03",
      title: "Your readiness changes every day",
      kicker: "Four systems",
      side: "whoop",
      blocks: [
        { type: "p", text: "How ready you are to train, think and perform is not fixed. It moves from day to day and sometimes hour to hour, depending on what you did yesterday and what is on your mind today." },
        { type: "p", text: "It helps to think of four systems, each with its own readiness:" },
        {
          type: "list",
          items: [
            "Nervous system: your speed, power and coordination. Can you move fast and sharp?",
            "Muscles and joints: the tissue. Are you sore, stiff or heavy?",
            "Engine: your heart, lungs and fuel tank. Do you have energy, or are you drained?",
            "Head: your mood and your fuse. Are you calm and clear, or wired and short?",
          ],
        },
        { type: "p", text: "Each system can be fresh or flat on its own. You can be sore but sharp. You can be rested but wired. That is the whole point: once you know which system is down, you know what to fix." },
      ],
    },
    {
      number: "04",
      title: "The four kinds of fatigue",
      kicker: "Stress adds up, but each kind is specific",
      opener: "chinup",
      blocks: [
        { type: "p", text: "Every session and every hard day lands mostly on one of the four systems. Here is how to tell them apart." },
        {
          type: "tiles",
          items: [
            { photo: "executive", title: "Nervous system", cause: "Heavy lifting above about 85% of your max. Top speed sprints. Hard jumping and landing. Low rep power work. Any session where the bar moves slowly because it is heavy.", feel: "Flat. No pop. Weights feel heavier than they are. Reaction time is off. You can still grind, but nothing is snappy." },
            { photo: "periodisation", title: "Muscles and joints", cause: "Muscle building work like 6 sets of 6 with two minutes rest. Long lowering phases. Downhill running. Lots of stopping, starting and changing direction. A long flight or a day on your feet.", feel: "Sore and stiff. Heavy legs. Stairs are a thought. You move like you are 20 years older for a day or two." },
            { photo: "vo2max", title: "Engine", cause: "High volume sessions. 3 sets of 12 with a minute of rest. Tempo runs, intervals, long swims, anything repetitive for a long time. A big week of training volume.", feel: "Drained and hungry. Breathing hard on things that are normally easy. Sleep is heavy but you still wake tired." },
            { photo: "stress", title: "Head", cause: "A big game, a pitch, a presentation. A new team or a new job. Conflict at home or at work. Travel. Anything you read as a threat, even a small one. Or things are just not right and you cannot say why.", feel: "Wired, not tired. Short fuse. Busy mind at 2am. You skip the warm up and rush the session, or you cannot make yourself start." },
          ],
        },
        { type: "callout", label: "For the busy professional", text: "A twelve hour day of meetings is head fatigue with a side of nervous system fatigue. A red eye flight is muscles and joints plus head. A week on the road with bad food and little sleep hits all four. Treat it like training load, because that is what it is." },
      ],
    },
    {
      number: "05",
      title: "Match the recovery to the fatigue",
      kicker: "The part most people get wrong",
      opener: "gradient",
      blocks: [
        { type: "lead", text: "We are careful about which system a session targets when we write a program. Then we recover from everything the same way. That makes no sense. Cold water after a muscle building session is a different tool from cold water after a sprint session, and breathing drills do nothing for sore quads." },
        { type: "p", text: "Pick the list that matches the fatigue. The numbers are starting points that work for most people; adjust to how you respond." },
        {
          type: "cards",
          title: "Nervous system",
          goal: "Let the nervous system settle so it can fire sharp again.",
          items: [
            { figure: "10 to 15°", label: "Cold water", text: "10 to 15 minutes in a bath, the ocean or a plunge tub." },
            { figure: "30 to 60 s", label: "Static stretching", text: "1 to 2 sets per muscle. Slow and relaxed, nothing forced." },
            { figure: "0", label: "Alcohol and caffeine before bed", text: "Protect the sleep. Nothing in the hours before bed." },
            { figure: "Eat", label: "Foods that calm inflammation", text: "See section 06." },
          ],
        },
        {
          type: "cards",
          title: "Muscles and joints",
          goal: "Give the tissue what it needs to rebuild.",
          items: [
            { figure: "3 to 4", label: "Areas to foam roll", text: "1 to 2 sets of 30 to 60 seconds each. Slow, not frantic." },
            { figure: "30 to 60 s", label: "Static stretching", text: "1 to 2 sets per muscle." },
            { figure: "6 to 8", label: "Reps of dynamic stretching", text: "3 to 4 movements, 1 to 2 sets. Leg swings, hip openers, thoracic rotations." },
            { figure: "120", label: "mmHg of compression", text: "Garments or boots, if the device lets you set it." },
            { figure: "Every meal", label: "Protein", text: "Plus foods that calm inflammation." },
          ],
        },
        { type: "break" },
        {
          type: "cards",
          title: "Engine",
          goal: "Refill the tank and repair the working tissue.",
          items: [
            { figure: "20 to 30 min", label: "Easy movement", text: "A pace where you can talk in full sentences. Bike, swim or walk; nothing that loads the joints." },
            { figure: "3 to 4", label: "Areas to foam roll", text: "1 to 2 sets of 30 to 60 seconds each." },
            { figure: "120", label: "mmHg of compression", text: "Garments or boots." },
            { figure: "Carbs", label: "And fluids in the hours after", text: "Then protein at every meal." },
          ],
        },
        {
          type: "cards",
          title: "Head",
          goal: "Respond to stress in proportion instead of overreacting to everything.",
          items: [
            { figure: "2 to 10 min", label: "Morning daylight", text: "Within an hour of waking. Outside, not through a window. Caffeine after, not before." },
            { figure: "2 min", label: "A hand in iced water", text: "Or a cold shower or a short plunge. Practise staying calm while it is uncomfortable." },
            { figure: "4 / 2", label: "Breathing to switch on", text: "In for 4, hold for 2, out at your own pace. Or box breathing: 4 in, 4 hold, 4 out, 4 hold." },
            { figure: "6 / 4 / 10", label: "Breathing to switch off", text: "In for 6, hold for 4, out for 10. Five minutes is plenty." },
            { figure: "Sleep", label: "The same rules as above", text: "Nothing fixes a head that has not slept." },
          ],
        },
        { type: "callout", label: "A word of care", text: "If you have a heart condition, are pregnant, or have a history of fainting, talk to your doctor before cold water or breath holds. Start shorter and warmer than you think." },
      ],
    },
    {
      number: "06",
      title: "Food does the repair",
      kicker: "Feed the system that fixes you",
      side: "plate",
      blocks: [
        { type: "p", text: "We sort fatigue by the system it hits, but the body answers all of it through the same two channels: the nervous system that organises the response and the immune system that carries it out. Anything that helps the immune system do its job improves how much and how well you recover. Food is the most effective tool you have for that, and you use it three times a day already." },
        {
          type: "table",
          columns: ["Lever", "What to eat"],
          rows: [
            ["A healthy gut", "Fermented foods most days: yoghurt, kefir, sauerkraut, kimchi, miso."],
            ["Omega 3 fats", "Fatty fish two or three times a week. Seaweed, flaxseed and walnuts if you do not eat fish."],
            ["Omega 6 fats from whole foods", "Poultry, eggs, nuts and seeds. Whole foods, not seed oils from a bottle."],
            ["Antioxidant rich foods", "Cherries, berries, avocado, beetroot, red cabbage, beans, and dark leafy greens like spinach and kale."],
            ["Protein", "Some at every meal. It is the raw material for every repair on the list."],
          ],
        },
        { type: "p", text: "Supplements can help at the margins once the food is right: fish oil, tart cherry, zinc, a probiotic, glutamine. Which ones, and whether you need any, is a conversation for your doctor or dietitian, not a guess from a label." },
      ],
    },
    {
      number: "07",
      title: "The thirty second morning check",
      kicker: "Decide what today needs",
      opener: "sunrise",
      openerStyle: { at: "top" },
      blocks: [
        { type: "p", text: "Before coffee, score each system from 1 to 5. One is empty, five is fresh." },
        {
          type: "scorecard",
          rows: [
            { system: "Nervous system", question: "Do I feel quick and sharp, or flat?" },
            { system: "Muscles and joints", question: "Am I sore, stiff or heavy anywhere?" },
            { system: "Engine", question: "Do I have energy, or am I running on fumes?" },
            { system: "Head", question: "Am I calm and clear, or wired and short?" },
          ],
        },
        { type: "p", text: "Any system at 3 or under gets its list from section 05 today, before anything hard. Two systems at 2 or under means today is a regeneration day: easy movement, the lists, food, sleep. Twenty minutes on the right list beats an hour on the wrong one." },
        { type: "callout", label: "Track it", text: "Write the four numbers in your phone each morning. After two weeks you will see your pattern: which sessions cost you most, how many days you need after them, and what Monday looks like after a big weekend." },
      ],
    },
    {
      number: "08",
      title: "A week that works",
      kicker: "Put it in the diary",
      opener: "notes",
      openerStyle: { ink: "dark" },
      blocks: [
        { type: "p", text: "Here is how it fits together for someone who lifts three times a week, does one hard conditioning session and works a full week." },
        {
          type: "week",
          rows: [
            { day: "Monday", work: "Heavy lower body lift", recovery: "Evening: 10 minutes static stretching, early night, no alcohol." },
            { day: "Tuesday", work: "Full day of meetings", recovery: "Morning light before the first coffee. Five minutes of long exhale breathing at the end of the day." },
            { day: "Wednesday", work: "Upper body lift, moderate loads", recovery: "Foam roll 3 to 4 areas. Protein at every meal." },
            { day: "Thursday", work: "Intervals or a hard swim", recovery: "20 to 30 minutes easy walk or spin. Carbohydrate and fluids after. Compression if you have it." },
            { day: "Friday", work: "Heavy full body lift", recovery: "Cold water 10 to 15 minutes if you can get it. Static stretching. Early night." },
            { day: "Saturday", work: "Easy day, family, outdoors", recovery: "This is regeneration: a walk, the ocean, sunlight, a proper meal." },
            { day: "Sunday", work: "Off", recovery: "Sleep in if you can. Plan the week. Prepare food." },
          ],
        },
        { type: "p", text: "Every day, no matter what: a consistent sleep window, daylight in the first hour, protein at each meal, and at least a 20 minute walk. Those four do more than every gadget combined." },
      ],
    },
    {
      number: "09",
      title: "Where do you stand?",
      kicker: "Next step",
      side: "marin",
      blocks: [
        { type: "p", text: "Recovery is one part of the picture. Sleep, stress, training, nutrition and energy all pull on each other, and the weakest one sets your ceiling. My free assessment takes about ten minutes and scores you across all of them, with a report on what to fix first." },
        { type: "callout", label: "Take the assessment", text: "marinlazic.com/assessment" },
        { type: "p", text: "If you want help putting any of this into a plan that fits your week, reply to the email this guide came with. I read every one." },
      ],
    },
  ] as GuideSection[],
};
