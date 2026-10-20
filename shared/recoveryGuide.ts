/**
 * The Recovery Guide: the lead magnet. One source of truth for the PDF
 * (scripts/build-recovery-guide.mts), the landing page and the email.
 * Marin's voice: plain, short, practical. No dashes anywhere.
 */

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "lead"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; title?: string; columns: string[]; rows: string[][]; note?: string }
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
  /** An exact routine: when to use it, then numbered steps with a time on each. */
  | { type: "protocol"; title: string; when: string; steps: { time: string; text: string }[]; care?: string }
  /** What to do when: read the situation, act today and tomorrow, and what to skip. */
  | { type: "scenario"; title: string; read: string; today: string[]; tomorrow: string[]; skip: string[] }
  /** A drawn figure the builder knows how to draw: the training curve, the cold water target, the repair plate. */
  | { type: "figure"; kind: "supercompensation" | "coldzone" | "plate"; title: string; note?: string }
  /** Horizontal range bars: each row spans lo to hi in the unit given. */
  | { type: "bars"; title: string; unit: string; max: number; ticks: { at: number; label: string }[]; rows: { label: string; lo: number; hi: number; note: string }[]; note?: string }
  /** A grid of tools against the four systems: 2 first choice, 1 helps, 0 not the tool. */
  | { type: "matrix"; title: string; columns: string[]; rows: { label: string; cells: (0 | 1 | 2)[] }[]; legend: string[]; note?: string }
  /** Small line charts, one per series, all on the same scale. */
  | { type: "lines"; title: string; subtitle?: string; x: string[]; min: number; max: number; series: { label: string; values: number[]; note: string }[] }
  /** One column chart with an optional reference line and a few notes on particular columns. */
  | { type: "columns"; title: string; subtitle?: string; x: string[]; values: number[]; max: number; labels?: string[]; reference?: { at: number; label: string }; notes?: { at: number; text: string }[]; note?: string }
  /** A full bleed strip of one to three photos across the foot of the page. */
  | { type: "band"; photos: GuidePhoto[]; pos?: string[] }
  /** Two blocks side by side on the page (the web page lays them out one after the other). */
  | { type: "row"; blocks: GuideBlock[] }
  /** A new page in the PDF; the web page ignores it. */
  | { type: "break" };

/** Marin's own photos, graded black and white. The builder and the page map them to files. */
export type GuidePhoto =
  | "hero" | "morning" | "olympic" | "walk" | "phone" | "floor" | "grass" | "pool" | "coach"
  | "plate" | "sunrise" | "notes" | "marin"
  | "slam" | "muscles" | "engine" | "head"
  | "paris" | "field" | "team" | "gym" | "pushup" | "boards" | "ice" | "boat" | "coast"
  | "wave" | "lane" | "dawn" | "netpool" | "squad" | "bondi" | "shore" | "ladder";

export const GUIDE_PHOTOS: Record<GuidePhoto, string> = {
  hero: "/images/guide/hero.jpg",
  morning: "/images/guide/morning.jpg",
  olympic: "/images/guide/olympic.jpg",
  walk: "/images/guide/walk.jpg",
  phone: "/images/guide/phone.jpg",
  floor: "/images/guide/floor.jpg",
  grass: "/images/guide/grass.jpg",
  pool: "/images/guide/pool.jpg",
  coach: "/images/guide/coach.jpg",
  plate: "/images/guide/plate.jpg",
  sunrise: "/images/guide/sunrise.jpg",
  notes: "/images/guide/notes.jpg",
  marin: "/images/guide/marin.jpg",
  slam: "/images/guide/slam.jpg",
  muscles: "/images/guide/muscles.jpg",
  engine: "/images/guide/engine.jpg",
  head: "/images/guide/head.jpg",
  paris: "/images/guide/paris.jpg",
  field: "/images/guide/field.jpg",
  team: "/images/guide/team.jpg",
  gym: "/images/guide/gym.jpg",
  pushup: "/images/guide/pushup.jpg",
  boards: "/images/guide/boards.jpg",
  ice: "/images/guide/ice.jpg",
  boat: "/images/guide/boat.jpg",
  coast: "/images/guide/coast.jpg",
  wave: "/images/guide/wave.jpg",
  lane: "/images/guide/lane.jpg",
  dawn: "/images/guide/dawn.jpg",
  netpool: "/images/guide/netpool.jpg",
  squad: "/images/guide/squad.jpg",
  bondi: "/images/guide/bondi.jpg",
  shore: "/images/guide/shore.jpg",
  ladder: "/images/guide/ladder.jpg",
};

export type GuideSection = {
  number: string;
  title: string;
  kicker: string;
  /** Full page photo opener before the content, with the title on the image. */
  opener?: GuidePhoto;
  /** Where the title sits on the opener and in what colour: light type at the bottom by default. "split" puts a portrait photo on the left half and the title on paper on the right. */
  openerStyle?: { ink?: "light" | "dark"; at?: "top" | "bottom"; align?: "left" | "right"; pos?: string; split?: boolean };
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
    "What to do after each kind, with times and temperatures, and a grid of which tool fits which fatigue",
    "Eight exact protocols: cold water, the ten minute reset, switching off, switching on, the foam roll map, refuelling, the flight, the morning",
    "What to do when: eight real situations, read and acted on",
    "The foods that help you repair, a thirty second morning check, and a week laid out",
  ],
  sections: [
    {
      number: "01",
      title: "You get stronger in the rest",
      kicker: "Work plus rest",
      opener: "morning",
      side: "olympic",
      blocks: [
        { type: "lead", text: "Training is a stress. The body does not get fitter during the session. It gets fitter afterwards, while it repairs the damage and builds a bit extra so the next session is easier." },
        { type: "p", text: "That means two things are true at the same time. Work without rest ends in overtraining, injury and illness. Rest without work changes nothing. The result you want sits between them: enough work to ask for change, enough rest to let it happen." },
        { type: "loop", words: ["Work", "Rest", "Adapt"] },
        { type: "p", text: "Think of it as a loop. Work, then rest, then adapt. Then go again from a slightly higher base. Every time you shorten the rest, you shrink the gain." },
        { type: "callout", label: "The rule", text: "Work plus rest equals progress. Miss either half and you are standing still, or going backwards." },
        { type: "break" },
        {
          type: "figure",
          kind: "supercompensation",
          title: "The same idea, drawn",
          note: "The line is your capacity: how much you can lift, how far you can run, how sharp you are. A session knocks it down. Rest brings it back and a little past where it started. The whole game is timing the next session for that peak.",
        },
        { type: "band", photos: ["field"] },
      ],
    },
    {
      number: "02",
      title: "Two kinds of recovery",
      kicker: "Rest and regeneration",
      side: "walk",
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
      side: "phone",
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
        { type: "break" },
        {
          type: "lines",
          title: "An example week, scored each morning",
          subtitle: "The week from section 10, scored 1 to 5 before coffee. Each system has its own bad day, and none of them line up.",
          x: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          min: 1,
          max: 5,
          series: [
            { label: "Nervous system", values: [4, 2, 3, 4, 4, 2, 3], note: "Low the morning after Monday's and Friday's heavy lifts." },
            { label: "Muscles and joints", values: [4, 3, 3, 3, 4, 3, 4], note: "Stiff after each lift. Never below 3 with the evening reset." },
            { label: "Engine", values: [4, 4, 4, 4, 2, 3, 4], note: "Empty on Friday morning after Thursday's intervals." },
            { label: "Head", values: [4, 4, 3, 4, 4, 5, 5], note: "Wednesday pays for Tuesday's meetings. The weekend outdoors lifts it." },
          ],
        },
        { type: "band", photos: ["grass"] },
      ],
    },
    {
      number: "04",
      title: "The four kinds of fatigue",
      kicker: "Stress adds up, but each kind is specific",
      opener: "floor",
      blocks: [
        { type: "p", text: "Every session and every hard day lands mostly on one of the four systems. Here is how to tell them apart." },
        {
          type: "tiles",
          items: [
            { photo: "slam", title: "Nervous system", cause: "Heavy lifting above about 85% of your max. Top speed sprints. Hard jumping and landing. Low rep power work. Any session where the bar moves slowly because it is heavy.", feel: "Flat. No pop. Weights feel heavier than they are. Reaction time is off. You can still grind, but nothing is snappy." },
            { photo: "muscles", title: "Muscles and joints", cause: "Muscle building work like 6 sets of 6 with two minutes rest. Long lowering phases. Downhill running. Lots of stopping, starting and changing direction. A long flight or a day on your feet.", feel: "Sore and stiff. Heavy legs. Stairs are a thought. You move like you are 20 years older for a day or two." },
            { photo: "engine", title: "Engine", cause: "High volume sessions. 3 sets of 12 with a minute of rest. Tempo runs, intervals, long swims, anything repetitive for a long time. A big week of training volume.", feel: "Drained and hungry. Breathing hard on things that are normally easy. Sleep is heavy but you still wake tired." },
            { photo: "head", title: "Head", cause: "A big game, a pitch, a presentation. A new team or a new job. Conflict at home or at work. Travel. Anything you read as a threat, even a small one. Or things are just not right and you cannot say why.", feel: "Wired, not tired. Short fuse. Busy mind at 2am. You skip the warm up and rush the session, or you cannot make yourself start." },
          ],
        },
        { type: "callout", label: "For the busy professional", text: "A twelve hour day of meetings is head fatigue with a side of nervous system fatigue. A red eye flight is muscles and joints plus head. A week on the road with bad food and little sleep hits all four. Treat it like training load, because that is what it is." },
        { type: "break" },
        {
          type: "bars",
          title: "How long each kind takes to clear",
          unit: "hours",
          max: 84,
          ticks: [
            { at: 0, label: "0" },
            { at: 24, label: "1 day" },
            { at: 48, label: "2 days" },
            { at: 72, label: "3 days" },
          ],
          rows: [
            { label: "Nervous system", lo: 48, hi: 72, note: "The longest to clear and the easiest to miss, because nothing hurts. The morning score is the only honest test." },
            { label: "Muscles and joints", lo: 24, hi: 72, note: "Soreness peaks at 24 to 48 hours and is gone by 72 with easy movement and protein at every meal." },
            { label: "Engine", lo: 12, hi: 24, note: "Refills with carbohydrate, fluids and a night's sleep. A very long session can take 48." },
            { label: "Head", lo: 8, hi: 48, note: "One good night for a hard day. Longer when the stress does not stop, which is the problem with most weeks." },
          ],
          note: "Typical ranges with the right recovery. Shorter with the matching list from section 05. Longer with alcohol, poor sleep, or another hard session on top.",
        },
        { type: "band", photos: ["gym"] },
      ],
    },
    {
      number: "05",
      title: "Match the recovery to the fatigue",
      kicker: "The part most people get wrong",
      opener: "team",
      openerStyle: { split: true },
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
            { figure: "Eat", label: "Foods that calm inflammation", text: "See section 08." },
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
        { type: "break" },
        {
          type: "matrix",
          title: "Which tool for which fatigue",
          columns: ["Nervous system", "Muscles and joints", "Engine", "Head"],
          rows: [
            { label: "Cold water, 10 to 15 minutes", cells: [2, 1, 0, 1] },
            { label: "Static stretching, 30 to 60 seconds", cells: [2, 2, 1, 0] },
            { label: "Dynamic stretching, 6 to 8 reps", cells: [0, 2, 1, 0] },
            { label: "Foam rolling, 3 to 4 areas", cells: [1, 2, 2, 0] },
            { label: "Easy movement, 20 to 30 minutes", cells: [1, 1, 2, 1] },
            { label: "Compression, 120 mmHg", cells: [0, 2, 2, 0] },
            { label: "Breathing to switch off, 6 in 4 hold 10 out", cells: [1, 0, 0, 2] },
            { label: "Breathing to switch on, 4 in 2 hold", cells: [0, 0, 0, 2] },
            { label: "Morning daylight, 2 to 10 minutes", cells: [1, 0, 1, 2] },
            { label: "Carbohydrate and fluids in the hours after", cells: [0, 1, 2, 0] },
            { label: "Protein at every meal", cells: [1, 2, 1, 0] },
            { label: "Foods that calm inflammation", cells: [2, 2, 1, 1] },
            { label: "No alcohol or caffeine before bed", cells: [2, 1, 1, 2] },
            { label: "Sleep", cells: [2, 2, 2, 2] },
          ],
          legend: ["First choice: it is on that system's list", "Helps", "Not the tool for this one"],
          note: "Skip cold water in the 24 hours before speed or power work, and the day before a competition. It dulls the spring you want. The rest of the grid is additive: a day that hits two systems gets both lists.",
        },
      ],
    },
    {
      number: "06",
      title: "The protocols",
      kicker: "Exact routines, with the clock on them",
      opener: "pool",
      blocks: [
        { type: "lead", text: "A list is not a routine. These are the eight routines I actually hand to people, with the minutes on each step. Pick the one the situation calls for and run it as written the first few times. Then adjust." },
        {
          type: "protocol",
          title: "Cold water, done properly",
          when: "After heavy lifting or sprint sessions. Not in the 24 hours before power or speed work, and not within an hour of bed.",
          steps: [
            { time: "10 to 15°", text: "Bath, ocean or plunge tub. Colder is not better. If you cannot hold a thermometer in it, add warm water." },
            { time: "60 s", text: "Get in slowly to the chest. Long exhales through the nose for the first minute. The gasp passes." },
            { time: "10 to 15 min", text: "Stay still. Hands out of the water if your fingers ache. Talk to someone if that helps you relax." },
            { time: "10 min", text: "Get out and warm up by moving: walk, light arm circles. Not a hot shower straight away." },
          ],
          care: "Heart condition, pregnant, or a history of fainting: talk to your doctor first. Never alone in open water.",
        },
        {
          type: "protocol",
          title: "The ten minute evening reset",
          when: "After a heavy day on the legs or a day on your feet. Any night you want to sleep better.",
          steps: [
            { time: "2 min", text: "Hip flexors, half kneeling, 60 seconds each side. Squeeze the glute of the back leg." },
            { time: "2 min", text: "Hamstrings, one leg on a chair, 60 seconds each side. Hinge from the hips, back flat." },
            { time: "2 min", text: "Glutes, figure four lying on your back, 60 seconds each side." },
            { time: "2 min", text: "Calves against a wall, 60 seconds each side. Knee straight, then slightly bent." },
            { time: "2 min", text: "Chest in a doorway, 60 seconds. Then lats, one hand on a frame and sit back, 30 seconds each side." },
          ],
          care: "Slow breathing throughout. Stretch to a pull, never to pain.",
        },
        { type: "break" },
        {
          type: "protocol",
          title: "Switching off",
          when: "Before bed after a late session, after a wired day, or any time your mind will not stop. Five minutes.",
          steps: [
            { time: "0 min", text: "Lie down or sit with your back supported. Lights low. Phone in another room." },
            { time: "6 s", text: "Breathe in through the nose for a count of six." },
            { time: "4 s", text: "Hold for four. Soft, not strained." },
            { time: "10 s", text: "Out through the nose or pursed lips for ten. Longer out than in is the whole trick." },
            { time: "12 rounds", text: "About four minutes. If you lose count, start again. Done." },
          ],
        },
        {
          type: "protocol",
          title: "Switching on",
          when: "Before a session, a game or a presentation when you feel flat. Three minutes, then move.",
          steps: [
            { time: "4 s", text: "In through the nose for four." },
            { time: "2 s", text: "Hold for two." },
            { time: "Out fast", text: "Out through the mouth, quick. Ten rounds. Or box breathing: four in, four hold, four out, four hold, eight rounds." },
            { time: "5 min", text: "Then move: leg swings, arm circles, a few easy jumps, building to two or three short fast efforts." },
          ],
        },
        {
          type: "protocol",
          title: "The foam roll map",
          when: "Before a session when you are stiff, or after a session when you are sore. Six minutes.",
          steps: [
            { time: "Lower day", text: "Calves, quads, glutes, hip flexors or adductors. 60 seconds each. Slow passes, pause on the tight spots, keep breathing." },
            { time: "Upper day", text: "Lats, upper back, pecs. 60 seconds each. The upper back with the roller across the spine, arms crossed." },
            { time: "1 to 2 passes", text: "That is it. More does not help. Follow with the dynamic stretches before training or the static ones after." },
          ],
        },
        { type: "band", photos: ["pushup", "slam"] },

        { type: "break" },
        {
          type: "protocol",
          title: "Refuelling after a hard session",
          when: "After anything over 60 minutes, two sessions in a day, or a session that left you drained.",
          steps: [
            { time: "0 to 60 min", text: "20 to 40 g of protein and about 1 g of carbohydrate per kilo of bodyweight. A real meal is best; a shake and a banana will do." },
            { time: "500 ml", text: "Water with a pinch of salt, or an electrolyte drink if you sweated a lot. Then keep sipping through the afternoon." },
            { time: "Next meal", text: "Protein again, plus the antioxidant foods from section 08. Cherries, berries, greens." },
          ],
        },
        {
          type: "protocol",
          title: "The flight",
          when: "Any flight over four hours. Most of the damage is on the plane, not after it.",
          steps: [
            { time: "Before", text: "Compression socks on. Set your watch to the destination. Decide now whether it is day or night where you are going and act like it." },
            { time: "Every 90 min", text: "Up and walk the aisle. Calf raises, hip circles, a few squats by the galley." },
            { time: "250 ml / h", text: "Water every hour. No alcohol. Caffeine only if it is morning at your destination." },
            { time: "Landing", text: "Twenty to thirty minutes walking outside in daylight. Then the ten minute reset that night. First proper session 48 hours later, moderate." },
          ],
        },
        {
          type: "protocol",
          title: "The morning",
          when: "Every day. This is the one that makes the others work.",
          steps: [
            { time: "0 to 60 min", text: "Outside, 2 to 10 minutes of daylight. Not through a window, not through sunglasses." },
            { time: "500 ml", text: "Water before anything else." },
            { time: "30 s", text: "The four scores. Nervous system, muscles and joints, engine, head, each 1 to 5. Section 09." },
            { time: "5 min", text: "Easy movement: a walk, the dynamic stretches, a few squats. Then coffee, if you want it." },
          ],
        },
        { type: "band", photos: ["boat", "coast"] },
        { type: "break" },
        {
          type: "row",
          blocks: [
            {
              type: "figure",
              kind: "coldzone",
              title: "Cold water: how cold, how long",
              note: "The box is the target. Colder than 10 degrees adds risk, not benefit. Warmer than 15 does little. Under 10 minutes the nervous system does not settle. Past 15 minutes there is nothing more to gain.",
            },
            {
              type: "table",
              title: "Refuelling by bodyweight",
              columns: ["Bodyweight", "Protein", "Carbohydrate", "What that looks like"],
              rows: [
                ["60 kg", "25 g", "60 g", "A tub of Greek yoghurt and two bananas"],
                ["70 kg", "28 g", "70 g", "Three eggs on two slices of toast, a banana and a glass of milk"],
                ["80 kg", "32 g", "80 g", "A chicken breast, a cup and a half of cooked rice, a piece of fruit"],
                ["90 kg", "36 g", "90 g", "A shake with a scoop of whey, a banana and a cup of oats made on milk"],
                ["100 kg", "40 g", "100 g", "A tin of tuna, two cups of cooked pasta, a piece of fruit"],
              ],
              note: "Protein at 0.4 g per kilo, carbohydrate at 1 g per kilo, inside the first hour after a hard session. The meals are rough matches, not recipes. Add 500 ml of water with a pinch of salt.",
            },
          ],
        },
        { type: "band", photos: ["ice", "lane"] },

      ],
    },
    {
      number: "07",
      title: "What to do when",
      kicker: "Eight situations, read and acted on",
      opener: "coach",
      blocks: [
        { type: "p", text: "Knowing the four kinds of fatigue is only useful on the day something happens. Here are the eight situations I get asked about most, and what I tell people to do. Read the situation, do today's list, do tomorrow's, and skip what is on the skip line." },
        {
          type: "table",
          title: "Find your situation",
          columns: ["What you notice", "Which system", "First move", "Then"],
          rows: [
            ["Flat, no pop, the weights feel heavier than they are", "Nervous system", "Cold water 10 to 15 minutes, early night", "Nothing heavy or fast for 48 hours"],
            ["Sore, stiff, heavy legs", "Muscles and joints", "The foam roll map, then the dynamic stretches", "Train, 20 to 30 percent lighter"],
            ["Drained and hungry, breathing hard on easy things", "Engine", "Carbohydrate and fluids, 20 to 30 minutes easy movement", "Protein at every meal, early night"],
            ["Wired, short fuse, busy mind at 2am", "Head", "Daylight 2 to 10 minutes, switching off before bed", "No caffeine after 2pm, phone out of the room"],
            ["Cannot sleep after a late session", "Nervous system", "Switching off, a warm shower, carbohydrate with dinner", "Move late sessions earlier"],
            ["Just landed from a long flight", "Muscles and joints, head", "Walk outside in daylight for 20 to 30 minutes", "Local bedtime, first hard session 48 hours later"],
            ["A week of bad sleep", "Head, nervous system", "Same wake time every day, daylight before coffee", "Talking pace sessions only this week"],
            ["A big day in 48 hours", "Nervous system, head", "Easy movement only, carbohydrate, early night", "Switching on an hour before"],
            ["Something coming on", "All four", "Above the neck: an easy walk. Below the neck: stop", "Easy movement first when the scores come back"],
          ],
        },
        { type: "band", photos: ["wave"] },
        { type: "break" },
        {
          type: "scenario",
          title: "You lifted heavy today and have a big day tomorrow",
          read: "Nervous system fatigue now, head fatigue coming. You need to be sharp twice in 24 hours.",
          today: ["Cold water 10 to 15 minutes if you can get it, otherwise the ten minute evening reset.", "Dinner with carbohydrate and protein. No alcohol.", "Switching off: five minutes before bed. In bed 30 minutes earlier than usual."],
          tomorrow: ["Daylight 2 to 10 minutes before coffee.", "Switching on for three minutes before the meeting if you feel flat.", "A 20 minute walk at lunch, outside."],
          skip: ["Another hard session.", "Screens in bed.", "A second coffee after 2pm."],
        },
        {
          type: "scenario",
          title: "You are sore and have a session today",
          read: "Muscles and joints. Soreness is dull, both sides, eases as you warm up. Pain is sharp, one sided or in a joint. Pain means stop and get it looked at.",
          today: ["The foam roll map, six minutes, then the dynamic stretches.", "Keep the session, drop the load 20 to 30 percent, keep the movements.", "Protein at every meal. Compression after if you have it."],
          tomorrow: ["Easy movement 20 to 30 minutes at talking pace.", "The ten minute evening reset.", "Reassess with the morning scores. Back to full load when muscles and joints score 4 or better."],
          skip: ["Adding volume to make up for the lighter day.", "Training through sharp pain.", "A hot bath straight after, which makes the soreness worse for most people."],
        },
        { type: "band", photos: ["boards"] },
        { type: "break" },
        {
          type: "scenario",
          title: "You land after a long flight",
          read: "Muscles and joints from sitting, head from the clock change. Both systems are down; nothing is broken.",
          today: ["Walk outside in daylight for 20 to 30 minutes, whatever the hour.", "Water, a proper meal with protein, no alcohol.", "The ten minute evening reset. Bed at local bedtime, even if you are not tired. No naps over 20 minutes."],
          tomorrow: ["Daylight first thing. Caffeine only before 2pm local.", "Easy movement, 20 to 30 minutes. The dynamic stretches.", "First proper session the day after, moderate loads."],
          skip: ["Heavy lifting or sprints in the first 48 hours.", "Sleeping until noon to catch up.", "Deciding how you feel until day three."],
        },
        {
          type: "scenario",
          title: "You have had a week of bad sleep",
          read: "Head and nervous system together. Everything feels harder than it is. The fix is a boring week, not a hard one.",
          today: ["Daylight 2 to 10 minutes within an hour of waking.", "Caffeine after the daylight and none after 2pm.", "Sessions at talking pace only. Easy movement, the foam roll map, the reset at night.", "Switching off before bed, every night this week."],
          tomorrow: ["Same wake time, even on the weekend. That is what resets the clock.", "A bigger breakfast with protein. Cold water in the morning if you like it, not at night."],
          skip: ["Heavy or maximum work, intervals, late sessions.", "Alcohol as a sleep aid. It knocks you out and wrecks the second half of the night.", "Weekend lie ins past 60 minutes."],
        },
        { type: "band", photos: ["squad"] },
        { type: "break" },
        {
          type: "scenario",
          title: "A game, a race or a big presentation is 48 hours away",
          read: "You want the nervous system fresh and the head calm. Everything from here is about arriving sharp, not fitter.",
          today: ["The last hard session is done. Easy movement only: 20 minutes at talking pace.", "Static stretching 1 to 2 sets of 30 to 60 seconds. Carbohydrate with dinner.", "Early night. Switching off before bed."],
          tomorrow: ["Daylight on waking. Short dynamic warm up, a few fast efforts, then stop.", "Carbohydrate at every meal. Nothing new on the plate.", "On the day: switching on for three minutes an hour before, coffee 60 minutes before if you use it."],
          skip: ["An ice bath the day before. It dulls the spring you want.", "A new shoe, a new food, a new routine.", "Trying to squeeze in one more session."],
        },
        {
          type: "scenario",
          title: "You feel flat and cannot get going",
          read: "Score the four systems. If the nervous system is low, the body is tired. If the head is low and the body scores fine, you are not tired, you are stuck.",
          today: ["Nervous system low: swap speed and heavy work for 20 to 30 minutes easy movement. Cold water. Early night.", "Head low: 10 minutes walking in daylight, switching on for three minutes, then start the warm up.", "The ten minute rule: warm up, reassess. If you are still flat after ten minutes, stop without guilt. If not, carry on."],
          tomorrow: ["Scores again. Two days flat in a row means a regeneration day, not a harder session.", "Eat properly. Flat is often just under fed."],
          skip: ["Forcing a maximum session to prove something.", "Skipping food because you did not train.", "Deciding you have lost it. You have not."],
        },
        { type: "band", photos: ["bondi"] },
        { type: "break" },
        {
          type: "scenario",
          title: "You cannot sleep after a late session",
          read: "Nervous system still switched on. The session was the right call; the two hours after it were not.",
          today: ["Switching off: five minutes, lying down, lights low.", "Carbohydrate with the evening meal. A warm shower, not a cold one.", "Phone out of the room. If you are awake after 20 minutes, get up, dim light, read, back when sleepy."],
          tomorrow: ["Wake at the usual time. Daylight before coffee.", "Move late sessions earlier where you can. Finish hard work three hours before bed when it matters."],
          skip: ["Scrolling in bed.", "Alcohol to come down.", "Caffeine after 2pm on training days."],
        },
        {
          type: "scenario",
          title: "You feel something coming on",
          read: "Above the neck, a runny nose or a scratchy throat, you can move. Below the neck, a chest, a fever, aching all over, you stop. A fever and training do not mix.",
          today: ["Above the neck: an easy walk, 20 minutes, then home. Below the neck: nothing, and see a doctor if it does not settle.", "Sleep as much as you can. Fluids, soup, protein, the antioxidant foods.", "No cold water this week."],
          tomorrow: ["Scores in the morning. Return to easy movement first, two days of it, then moderate, then hard.", "The ten minute reset at night helps you sleep when you are blocked up."],
          skip: ["Hard sessions. They lengthen the illness.", "Cold plunges and breath holds.", "Heroics. Nobody remembers the session you trained through sick."],
        },
        { type: "band", photos: ["netpool"] },
      ],
    },
    {
      number: "08",
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
        { type: "break" },
        {
          type: "row",
          blocks: [
            {
              type: "figure",
              kind: "plate",
              title: "The repair plate",
              note: "Half the plate is vegetables and fruit, the antioxidant foods. A quarter is protein. A quarter is slow carbohydrate, and that quarter grows after a hard session. A thumb of fat from whole foods on top: olive oil, avocado, nuts, oily fish.",
            },
            {
              type: "table",
              title: "A day that does the repair",
              columns: ["Meal", "What is on it", "Which lever"],
              rows: [
                ["Breakfast", "Eggs with spinach, berries, a spoon of yoghurt or kefir", "Protein, antioxidants, a healthy gut"],
                ["Lunch", "Salmon or sardines, a big salad with beetroot and avocado, rice", "Omega 3, antioxidants, protein"],
                ["After training", "A shake or yoghurt with a banana and cherries", "Protein and carbohydrate inside the hour"],
                ["Dinner", "Chicken, beans or tofu, red cabbage and greens, sweet potato", "Protein, antioxidants, carbohydrate to sleep"],
                ["Most days", "Something fermented: sauerkraut, kimchi, miso, kefir", "A healthy gut"],
                ["Two or three times a week", "Fatty fish", "Omega 3"],
              ],
            },
          ],
        },
        { type: "band", photos: ["shore"] },
      ],
    },
    {
      number: "09",
      title: "The thirty second morning check",
      kicker: "Decide what today needs",
      opener: "sunrise",
      openerStyle: { split: true },
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
        { type: "p", text: "Any system at 3 or under gets its list from section 05 today, or the matching page in 07, before anything hard. Two systems at 2 or under means today is a regeneration day: easy movement, the lists, food, sleep. Twenty minutes on the right list beats an hour on the wrong one." },
        { type: "callout", label: "Track it", text: "Write the four numbers in your phone each morning. After two weeks you will see your pattern: which sessions cost you most and how long you take to come back." },
        { type: "band", photos: ["dawn"] },
        { type: "break" },
        {
          type: "row",
          blocks: [
            {
              type: "table",
              title: "Read the scores",
              columns: ["What you see", "What today is", "What to do"],
              rows: [
                ["All four at 4 or 5", "Train as planned", "Go hard if the plan says so. Run the morning protocol and get on with it."],
                ["One or more at 3", "Train, with care", "Run their lists first. If the session hits that system, drop the load 10 to 20 percent."],
                ["One at 2 or under", "A modified day", "Its list before anything else. If the session needs that system, swap it for easy movement."],
                ["Two or more at 2 or under", "A regeneration day", "Easy movement, the lists, food, sleep. No hard work today, whatever the plan says."],
                ["Any at 1, or three days under 3 in a row", "Rest", "Nothing today. If it does not lift inside a week, talk to your doctor, or to me."],
              ],
            },
            {
              type: "columns",
              title: "What two weeks of scores looks like",
              subtitle: "The four scores added up, 4 to 20, for an example fortnight.",
              x: ["M", "T", "W", "T", "F", "S", "S", "M", "T", "W", "T", "F", "S", "S"],
              values: [17, 13, 15, 16, 16, 11, 14, 17, 15, 15, 14, 9, 12, 15],
              max: 20,
              reference: { at: 16, label: "Every system at 4" },
              notes: [
                { at: 5, text: "Friday's heavy lift, late night" },
                { at: 11, text: "After a red eye flight" },
              ],
              note: "Two weeks of numbers show which days cost you and how long you take to come back. That is the pattern to plan around.",
            },
          ],
        },
        { type: "band", photos: ["ladder"] },

      ],
    },
    {
      number: "10",
      title: "A week that works",
      kicker: "Put it in the diary",
      opener: "notes",
      openerStyle: { split: true },
      blocks: [
        { type: "p", text: "Here is how it fits together for someone who lifts three times a week, does one hard conditioning session and works a full week." },
        {
          type: "columns",
          title: "How the week loads",
          x: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          values: [5, 3, 3, 4, 5, 1, 0],
          max: 5,
          labels: ["Heavy lower lift", "Meetings all day", "Upper lift, moderate", "Intervals", "Heavy full body lift", "Outdoors, easy", "Off"],
          note: "Two heavy days, never back to back. The hard conditioning sits mid week with an easy day either side. The weekend is the recovery, not an afterthought.",
        },
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
      number: "11",
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
