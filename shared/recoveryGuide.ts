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
  /** A new page in the PDF; the web page ignores it. */
  | { type: "break" };

export type GuideSection = {
  number: string;
  title: string;
  kicker: string;
  blocks: GuideBlock[];
};

export const RECOVERY_GUIDE = {
  slug: "recovery-guide",
  title: "The Recovery Guide",
  subtitle: "Match your recovery to the work you did",
  pdfPath: "/guides/the-recovery-guide.pdf",
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
      blocks: [
        { type: "lead", text: "Training is a stress. The body does not get fitter during the session. It gets fitter afterwards, while it repairs the damage and builds a bit extra so the next session is easier." },
        { type: "p", text: "That means two things are true at the same time. Work without rest ends in overtraining, injury and illness. Rest without work changes nothing. The result you want sits between them: enough work to ask for change, enough rest to let it happen." },
        { type: "p", text: "Think of it as a loop. Work, then rest, then adapt. Then go again from a slightly higher base. Every time you shorten the rest, you shrink the gain." },
        { type: "callout", label: "The rule", text: "Work plus rest equals progress. Miss either half and you are standing still, or going backwards." },
      ],
    },
    {
      number: "02",
      title: "Two kinds of recovery",
      kicker: "Rest and regeneration",
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
      blocks: [
        { type: "p", text: "Every session and every hard day lands mostly on one of the four systems. Here is how to tell them apart." },
        {
          type: "table",
          columns: ["Fatigue", "What causes it", "What it feels like"],
          rows: [
            ["Nervous system", "Heavy lifting above about 85% of your max. Top speed sprints. Hard jumping and landing. Low rep power work. Any session where the bar moves slowly because it is heavy.", "Flat. No pop. Weights feel heavier than they are. Reaction time is off. You can still grind, but nothing is snappy."],
            ["Muscles and joints", "Muscle building work like 6 sets of 6 with two minutes rest. Long lowering phases. Downhill running. Lots of stopping, starting and changing direction. A long flight or a day on your feet.", "Sore and stiff. Heavy legs. Stairs are a thought. You move like you are 20 years older for a day or two."],
            ["Engine", "High volume sessions. 3 sets of 12 with a minute of rest. Tempo runs, intervals, long swims, anything repetitive for a long time. A big week of training volume.", "Drained and hungry. Breathing hard on things that are normally easy. Sleep is heavy but you still wake tired."],
            ["Head", "A big game, a pitch, a presentation. A new team or a new job. Conflict at home or at work. Travel. Anything you read as a threat, even a small one. Or things are just not right and you cannot say why.", "Wired, not tired. Short fuse. Busy mind at 2am. You skip the warm up and rush the session, or you cannot make yourself start."],
          ],
        },
        { type: "callout", label: "For the busy professional", text: "A twelve hour day of meetings is head fatigue with a side of nervous system fatigue. A red eye flight is muscles and joints plus head. A week on the road with bad food and little sleep hits all four. Treat it like training load, because that is what it is." },
      ],
    },
    {
      number: "05",
      title: "Match the recovery to the fatigue",
      kicker: "The part most people get wrong",
      blocks: [
        { type: "lead", text: "We are careful about which system a session targets when we write a program. Then we recover from everything the same way. That makes no sense. Cold water after a muscle building session is a different tool from cold water after a sprint session, and breathing drills do nothing for sore quads." },
        { type: "p", text: "Pick the list that matches the fatigue. The numbers are starting points that work for most people; adjust to how you respond." },
        {
          type: "table",
          columns: ["Nervous system", "What to do"],
          rows: [
            ["Goal", "Let the nervous system settle so it can fire sharp again."],
            ["Cold water", "10 to 15 degrees for 10 to 15 minutes. A bath, the ocean, a plunge tub."],
            ["Static stretching", "1 to 2 sets of 30 to 60 seconds per muscle. Slow and relaxed, nothing forced."],
            ["Sleep", "Protect it. No alcohol and no caffeine in the hours before bed."],
            ["Food", "Foods that calm inflammation. See section 06."],
          ],
        },
        {
          type: "table",
          columns: ["Muscles and joints", "What to do"],
          rows: [
            ["Goal", "Give the tissue what it needs to rebuild."],
            ["Foam roll or massage", "3 to 4 areas, 1 to 2 sets of 30 to 60 seconds each. Slow, not frantic."],
            ["Static stretching", "1 to 2 sets of 30 to 60 seconds per muscle."],
            ["Dynamic stretching", "3 to 4 movements, 6 to 8 reps each, 1 to 2 sets. Leg swings, hip openers, thoracic rotations."],
            ["Compression", "Compression garments or boots, around 120 mmHg if the device lets you set it."],
            ["Food", "Protein at every meal and foods that calm inflammation."],
          ],
        },
        { type: "break" },
        {
          type: "table",
          columns: ["Engine", "What to do"],
          rows: [
            ["Goal", "Refill the tank and repair the working tissue."],
            ["Easy movement", "20 to 30 minutes at a pace where you can talk in full sentences. Bike, swim or walk; something that does not load the joints."],
            ["Foam roll or massage", "3 to 4 areas, 1 to 2 sets of 30 to 60 seconds."],
            ["Compression", "Garments or boots, around 120 mmHg."],
            ["Food", "Carbohydrate and fluids in the hours after, then protein at every meal."],
          ],
        },
        {
          type: "table",
          columns: ["Head", "What to do"],
          rows: [
            ["Goal", "Respond to stress in proportion instead of overreacting to everything."],
            ["Morning light", "2 to 10 minutes of daylight within an hour of waking. Outside, not through a window."],
            ["Caffeine", "After the daylight, not before. Let the body wake up on its own first."],
            ["Small doses of stress", "Practise a calm response on purpose: a cold shower, a short cold plunge, or a hand in a bowl of iced water for 2 minutes. Stay relaxed while it is uncomfortable."],
            ["Breathing to switch on", "Longer in than out. Breathe in for 4, hold for 2, out at your own pace. Or box breathing: 4 in, 4 hold, 4 out, 4 hold."],
            ["Breathing to switch off", "Longer out than in. In for 6, hold for 4, out for 10. Five minutes is plenty."],
            ["Sleep", "The same as above. Nothing fixes a head that has not slept."],
          ],
        },
        { type: "callout", label: "A word of care", text: "If you have a heart condition, are pregnant, or have a history of fainting, talk to your doctor before cold water or breath holds. Start shorter and warmer than you think." },
      ],
    },
    {
      number: "06",
      title: "Food does the repair",
      kicker: "Feed the system that fixes you",
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
      blocks: [
        { type: "p", text: "Before coffee, score each system from 1 to 5. One is empty, five is fresh." },
        {
          type: "list",
          items: [
            "Nervous system: do I feel quick and sharp, or flat?",
            "Muscles and joints: am I sore, stiff or heavy anywhere?",
            "Engine: do I have energy, or am I running on fumes?",
            "Head: am I calm and clear, or wired and short?",
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
      blocks: [
        { type: "p", text: "Here is how it fits together for someone who lifts three times a week, does one hard conditioning session and works a full week." },
        {
          type: "table",
          columns: ["Day", "Work", "Recovery that matches"],
          rows: [
            ["Monday", "Heavy lower body lift", "Evening: 10 minutes static stretching, early night, no alcohol."],
            ["Tuesday", "Full day of meetings", "Morning light before the first coffee. Five minutes of long exhale breathing at the end of the day."],
            ["Wednesday", "Upper body lift, moderate loads", "Foam roll 3 to 4 areas. Protein at every meal."],
            ["Thursday", "Intervals or a hard swim", "20 to 30 minutes easy walk or spin. Carbohydrate and fluids after. Compression if you have it."],
            ["Friday", "Heavy full body lift", "Cold water 10 to 15 minutes if you can get it. Static stretching. Early night."],
            ["Saturday", "Easy day, family, outdoors", "This is regeneration: a walk, the ocean, sunlight, a proper meal."],
            ["Sunday", "Off", "Sleep in if you can. Plan the week. Prepare food."],
          ],
        },
        { type: "p", text: "Every day, no matter what: a consistent sleep window, daylight in the first hour, protein at each meal, and at least a 20 minute walk. Those four do more than every gadget combined." },
      ],
    },
    {
      number: "09",
      title: "Where do you stand?",
      kicker: "Next step",
      blocks: [
        { type: "p", text: "Recovery is one part of the picture. Sleep, stress, training, nutrition and energy all pull on each other, and the weakest one sets your ceiling. My free assessment takes about ten minutes and scores you across all of them, with a report on what to fix first." },
        { type: "callout", label: "Take the assessment", text: "marinlazic.com/assessment" },
        { type: "p", text: "If you want help putting any of this into a plan that fits your week, reply to the email this guide came with. I read every one." },
      ],
    },
  ] as GuideSection[],
};
