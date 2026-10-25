import { useParams } from "wouter";
import NotFound from "./NotFound";
import { resourcePhoto, resourceImagePath, srcSet } from "@/data/resourceImages";
import { GuideSignup } from "@/components/GuideSignup";

export type Resource = {
  slug: string;
  aliases: string[];
  title: string;
  keyword: string;
  kitTag: string;
  tags: string[];
  intro: string;
  sections: { heading?: string; content: string[] }[];
  footer?: string;
};

export const resources: Resource[] = [
  {
    slug: "5-movement-template",
    aliases: ["template", "fewer"],
    title: "The 5 Movement Training Template",
    keyword: "FEWER",
    kitTag: "lead-fewer",
    tags: ["Strength", "Training"],
    intro:
      "A simple strength template built around five movement patterns: push, pull, hinge, squat and loaded carry. Choose movements you can perform with good control, then progress at a pace that suits your experience and recovery.",
    sections: [
      {
        heading: "The movements",
        content: [
          "Push: dumbbell bench press or overhead press. A starting point could be 3 sets of 8 to 10 reps.",
          "Pull: barbell row or chin up. A starting point could be 3 sets of 8 to 10 reps.",
          "Hinge: Romanian deadlift or trap bar deadlift. A starting point could be 3 sets of 6 to 8 reps.",
          "Squat: goblet squat or barbell back squat. A starting point could be 3 sets of 6 to 8 reps.",
          "Loaded carry: farmer's walk. A starting point could be 3 sets of 30 to 40 metres.",
        ],
      },
      {
        heading: "Weekly layout",
        content: [
          "Day 1: Squat, push and loaded carry.",
          "Day 2: Hinge, pull and loaded carry.",
          "Day 3, if appropriate: repeat Day 1 or use lighter versions of all five movements.",
          "Allow recovery between sessions. The amount you need depends on training history, work, sleep and other activity.",
        ],
      },
      {
        heading: "How to progress",
        content: [
          "When you complete the planned sets at the top of the rep range with good control, consider a small increase that suits the equipment and your current capacity.",
          "If a load or rep target is not working, reduce the load, reps or overall session demand and reassess. A coach can help with persistent plateaus or technique concerns.",
          "Track the exercises, loads, reps and how the session felt. A notebook or phone note is enough.",
        ],
      },
    ],
    footer:
      "Use this as a starting template rather than a prescription. Change an exercise when your goals, access, technique or comfort call for a different option.",
  },
  {
    slug: "greasing-the-groove",
    aliases: ["groove"],
    title: "Greasing the Groove Guide",
    keyword: "GROOVE",
    kitTag: "lead-groove",
    tags: ["Strength", "Skill practice"],
    intro:
      "Greasing the groove is a way to practise a movement often at low effort across the day. It can suit movements such as pull ups and push ups when the volume stays comfortable and does not interfere with other training.",
    sections: [
      {
        heading: "How it works",
        content: [
          "Choose one movement you want to practise. Pull ups and push ups are common examples.",
          "Find a comfortable fresh set, rather than testing to an absolute limit. A starting working set is often around 40 to 50% of that number.",
          "Do the working set several times across the day, with plenty of time between efforts. Start with fewer sets and add only if recovery remains good.",
          "Keep each set well short of failure. If the movement becomes slow, painful or technically messy, reduce the effort or stop for the day.",
        ],
      },
      {
        heading: "Example: pull ups",
        content: [
          "If six controlled pull ups is your current fresh set, a starting working set might be two or three reps.",
          "Try two or three reps on several occasions across the day, with long breaks between them.",
          "The aim is practice volume that remains manageable. Some fatigue can still occur, especially when you are new to the method.",
          "After a couple of weeks, review how the movement feels and whether your controlled set has changed. Adjust only if the extra practice is being tolerated well.",
        ],
      },
      {
        heading: "Example: push ups",
        content: [
          "If 20 controlled push ups is your current fresh set, a starting working set might be eight reps.",
          "Do the set on a few occasions across the day, leaving plenty of time between efforts.",
          "Use an incline, fewer repetitions or fewer sets if standard push ups are too demanding.",
          "Review your tolerance after one or two weeks before adding more volume.",
        ],
      },
      {
        heading: "Rules",
        content: [
          "Avoid adding this on top of a demanding training day for the same muscle group unless the total load has been planned.",
          "Stop if you feel joint pain, sharp pain, numbness, dizziness or other concerning symptoms. Seek appropriate professional advice if symptoms persist.",
          "This is skill practice rather than a hard conditioning session. Keep the effort modest.",
        ],
      },
    ],
  },
  {
    slug: "daily-maintenance-routine",
    aliases: ["routine"],
    title: "5 Minute Daily Maintenance Routine",
    keyword: "ROUTINE",
    kitTag: "lead-routine",
    tags: ["Movement", "Balance", "Recovery"],
    intro:
      "A short movement check can help you notice how you feel before training or during a busy day. It is not a diagnostic screen and it cannot identify or prevent injuries.",
    sections: [
      {
        heading: "Three movement checks",
        content: [
          "Squat to a comfortable depth: hold a supported squat position for up to 30 seconds. Keep your heels down if comfortable. Use a doorframe, bench or table for support when needed.",
          "Shoulder reach: reach one hand over your shoulder and the other behind your back. Compare sides without forcing the range. Stop if it is painful.",
          "Single leg balance: stand on one leg for up to 30 seconds with eyes open, near a stable support such as a bench or kitchen counter. Keep a hand close enough to steady yourself if needed.",
        ],
      },
      {
        heading: "Simple options",
        content: [
          "For a stiff feeling squat, try a few slow bodyweight squats to a comfortable depth, pausing briefly where you can control the position.",
          "For shoulders, try gentle wall slides through a pain free range.",
          "For balance, do a few short single leg stands on each side with eyes open and support nearby. Only reduce support when you feel steady and the setting is safe.",
        ],
      },
      {
        heading: "When to use it",
        content: [
          "Use it at a time that works for you, such as before training or after a long period at a desk.",
          "A change in how you feel is information, not a diagnosis. Persistent restriction, pain, swelling, weakness, numbness or dizziness should be assessed by a qualified health professional.",
        ],
      },
    ],
  },
  {
    slug: "multi-direction-warmup",
    aliases: ["move"],
    title: "Multi Direction Warm Up",
    keyword: "MOVE",
    kitTag: "lead-move",
    tags: ["Warm up", "Movement"],
    intro:
      "This warm up includes forward, lateral and rotational movement. Choose a range and load you can control, and use it before training when it suits the session.",
    sections: [
      {
        heading: "The movements",
        content: [
          "Lateral lunges: try up to 8 per side. Step wide, sit your hips back and keep the trailing leg comfortable. Use only a depth you can control.",
          "Band chops or a rotational press: try up to 10 per side. Anchor the band securely at chest height. Stand side on and press or rotate through a comfortable range, then control the return.",
          "Side loaded carry: carry one dumbbell or kettlebell for a comfortable distance, then switch hands. Choose a load that lets you walk steadily without leaning or holding your breath.",
        ],
      },
      {
        heading: "How to scale",
        content: [
          "If lateral lunges feel difficult, use less depth or hold a stable support for balance.",
          "If you do not have a band, use a cable machine if you are familiar with it, or practise a slow standing rotation without a load.",
          "For carries, begin with a light load and shorter distance. Increase only when the walk remains controlled.",
        ],
      },
      {
        heading: "When to use it",
        content: [
          "Use it before a training session after a brief general warm up such as easy walking, cycling or skipping.",
          "The sequence may take around six to eight minutes, depending on rest and the options you choose. Stop or change an exercise if it causes pain.",
        ],
      },
    ],
  },
  {
    slug: "high-protein-meals",
    aliases: ["protein"],
    title: "High Protein Meals List",
    keyword: "PROTEIN",
    kitTag: "lead-protein",
    tags: ["Nutrition", "Recovery"],
    intro:
      "Protein needs vary with body size, age, training, total food intake, health conditions and goals. The meal ideas below are examples, not an individual prescription.",
    sections: [
      {
        heading: "Breakfast ideas",
        content: [
          "Four eggs scrambled with spinach and feta can provide roughly 25 to 30 grams of protein, depending on portions.",
          "Greek yoghurt with protein powder and berries can provide around 25 to 40 grams, depending on the yoghurt and powder used.",
          "Overnight oats with milk, chia seeds and protein powder can be another higher protein option. Check product labels for the amount in your serving.",
          "Including protein at breakfast may be practical if it helps you meet your daily food needs, but there is no single meal pattern that suits everyone.",
        ],
      },
      {
        heading: "Lunch ideas",
        content: [
          "Chicken with rice and vegetables, with portion sizes chosen for your appetite and goals.",
          "Tinned tuna on sourdough with avocado and salad.",
          "A beef mince, beans, rice and salsa bowl. Lentils or tofu can be used as alternatives where preferred.",
        ],
      },
      {
        heading: "Dinner ideas",
        content: [
          "Salmon with sweet potato and greens.",
          "Steak with roasted vegetables.",
          "Chicken stir fry with noodles and vegetables.",
        ],
      },
      {
        heading: "Snack ideas",
        content: [
          "A protein shake with milk or a suitable alternative.",
          "Cottage cheese with fruit.",
          "Beef jerky, yoghurt, eggs, tofu or edamame, depending on your preferences and dietary needs.",
          "Nuts and fruit can add energy and fibre alongside a protein source.",
        ],
      },
      {
        heading: "Working out your target",
        content: [
          "A daily range of about 1.6 to 2.2 grams of protein per kilogram of body weight is often used in resistance training research, but it is not appropriate for every person.",
          "Spread protein containing foods across meals if that helps with appetite, training and meal planning. The amount used by the body is not limited to a fixed number at one meal.",
          "If you have kidney disease, another medical condition, are pregnant, or have been advised to limit protein, discuss changes with your doctor or an accredited practising dietitian first.",
        ],
      },
    ],
  },
  {
    slug: "base-building-plan",
    aliases: ["engine"],
    title: "4 Week Base Building Plan",
    keyword: "ENGINE",
    kitTag: "lead-engine",
    tags: ["Aerobic fitness", "Training"],
    intro:
      "This is an example of gradually building easy aerobic work before adding harder sessions. Use a pace that allows comfortable conversation, and adapt the plan to your current activity, health and recovery.",
    sections: [
      {
        heading: "Guiding principles",
        content: [
          "Start with two easy sessions each week if this is appropriate for your current activity level. Leave recovery time between them.",
          "Use a conversational pace. If breathing becomes uncomfortably hard, slow down, rest or shorten the session.",
          "Walking, jogging, cycling, rowing and swimming can all work. Choose an option you enjoy and can do without pain.",
          "Consistency matters, but missed sessions are normal. Resume with an amount that feels manageable rather than trying to make up all the time.",
        ],
      },
      {
        heading: "Week 1 example",
        content: [
          "Session 1: 20 to 30 minutes at an easy pace.",
          "Session 2: 20 to 30 minutes at an easy pace.",
        ],
      },
      {
        heading: "Week 2 example",
        content: [
          "Session 1: 25 to 35 minutes at an easy pace.",
          "Session 2: 25 to 35 minutes at an easy pace.",
        ],
      },
      {
        heading: "Week 3 example",
        content: [
          "Session 1: 30 to 40 minutes at an easy pace.",
          "Session 2: 25 to 35 minutes at an easy pace.",
        ],
      },
      {
        heading: "Week 4 example",
        content: [
          "Session 1: 30 to 40 minutes at an easy pace.",
          "Session 2: 30 to 40 minutes at an easy pace.",
        ],
      },
      {
        heading: "What next",
        content: [
          "If the sessions feel manageable, you might continue with two easy sessions at a duration that fits your week.",
          "If you want to add intensity, consider keeping easy work in the week and build harder sessions gradually. A coach or clinician can help if you have symptoms, a relevant health condition or are returning after a long break.",
        ],
      },
    ],
  },
  {
    slug: "recovery-checklist",
    aliases: ["recover"],
    title: "Daily Recovery Checklist",
    keyword: "RECOVER",
    kitTag: "lead-recover",
    tags: ["Recovery", "Sleep", "Habits"],
    intro:
      "Recovery is influenced by training, sleep, food, fluids, stress, illness and life demands. This checklist is a prompt for reflection, not a test of whether you are recovered or a substitute for medical advice.",
    sections: [
      {
        heading: "Sleep",
        content: [
          "Aim for a regular sleep and wake pattern where practical.",
          "Many adults benefit from around seven to nine hours of sleep, though needs vary.",
          "A cool, dark and quiet room may support sleep if you can arrange it.",
        ],
      },
      {
        heading: "Food and fluids",
        content: [
          "Include enough food and protein containing meals to support your training and appetite. Individual needs differ.",
          "Drink regularly across the day and adjust for heat, sweat loss, activity, food intake, medications and medical advice. Thirst, urine colour and how you feel can offer useful context, but are not clinical tests.",
          "Seek individual nutrition advice if you have a medical condition, a history of disordered eating or specific performance goals.",
        ],
      },
      {
        heading: "Movement",
        content: [
          "On rest days, an easy walk or gentle movement can be useful if it feels good.",
          "Use the daily maintenance routine only as a comfortable movement check, not to diagnose a problem.",
        ],
      },
      {
        heading: "Stress and training load",
        content: [
          "Make time for something outside work, training and screens when possible, such as reading, cooking, being outdoors or speaking with someone.",
          "Resting heart rate, HRV and fatigue can change for many reasons. A sustained change, especially with feeling unwell, is not a diagnosis. Review the wider context, reduce or pause training if needed, and seek medical advice for concerning or persistent symptoms.",
        ],
      },
    ],
    footer:
      "Training is one part of progress. Recovery habits can support adaptation, but they cannot guarantee a particular result.",
  },
  {
    slug: "week-3-dip-guide",
    aliases: ["week3"],
    title: "The Week 3 Dip Guide",
    keyword: "WEEK3",
    kitTag: "lead-week3",
    tags: ["Habits", "Mindset", "Training"],
    intro:
      "A new routine can feel harder to maintain once the early novelty fades. For some people this happens around week three, while for others it appears at a different time or not at all.",
    sections: [
      {
        heading: "Why it can happen",
        content: [
          "Early sessions can feel new and motivating.",
          "As a routine becomes more familiar, work, family, sleep or changing expectations can make it feel less easy to continue.",
          "A slower period does not automatically mean the plan is wrong. It can be a cue to review whether the plan still suits your life and recovery.",
        ],
      },
      {
        heading: "Three ways to respond",
        content: [
          "Expect variation. Notice a drop in motivation without treating it as a failure.",
          "Make the next step smaller. A shorter session or an easy walk can be a reasonable choice when a full session is not realistic.",
          "Track useful context beyond appearance, such as session completion, comfort with a movement, sleep routine or energy. These signals vary and are not proof of a health outcome.",
        ],
      },
      {
        heading: "Keep perspective",
        content: [
          "Some people stop a new routine in its first few weeks and others find it settles over time. There is no universal week when a habit is formed. Choose a plan you can revisit and adjust rather than forcing a fixed timeline.",
        ],
      },
    ],
  },
  {
    slug: "sleep-checklist",
    aliases: ["sleep"],
    title: "The Sleep Checklist",
    keyword: "SLEEP",
    kitTag: "lead-sleep",
    tags: ["Sleep", "Recovery"],
    intro:
      "Sleep is an important part of recovery, mood and day to day performance. This checklist offers general habits to test one at a time. It is not treatment for insomnia, sleep apnoea or another sleep condition.",
    sections: [
      {
        heading: "Timing",
        content: [
          "Keep bed and wake times reasonably consistent where your life allows.",
          "Many adults need around seven to nine hours of sleep, though individual needs vary.",
          "If a schedule change is needed, make it gradually where possible.",
        ],
      },
      {
        heading: "Light",
        content: [
          "Spend some time outdoors in daylight after waking if practical.",
          "Dim lights in the hour or two before bed if that fits your evening routine.",
          "Reduce bright screen exposure before bed where possible. If you use a screen, lower brightness and choose content that does not keep you alert.",
        ],
      },
      {
        heading: "Environment",
        content: [
          "Set up a bedroom that is as dark, quiet and comfortably cool as you can make it.",
          "A sleep mask, earplugs or changes to bedding may help some people.",
          "Choose solutions that are safe and comfortable for you.",
        ],
      },
      {
        heading: "Caffeine and alcohol",
        content: [
          "If caffeine affects your sleep, experiment with moving it earlier in the day. Sensitivity and clearance differ between people.",
          "Alcohol can affect sleep for some people, including sleep later in the night. If you drink, notice your own response and avoid using alcohol as a sleep aid.",
        ],
      },
      {
        heading: "Wind down",
        content: [
          "A repeatable pre bed routine can help signal the end of the day. Keep it simple enough to use most nights.",
          "Keep work tasks out of bed where possible so bed is associated with rest.",
          "If sleep problems persist, or you snore loudly, wake gasping, have severe daytime sleepiness or changes in mood, speak with a GP or qualified sleep clinician.",
        ],
      },
    ],
    footer:
      "Choose one or two changes that fit your circumstances, then review how they feel. Seek professional help for ongoing sleep concerns.",
  },
];

function ResourceNavigation() {
  return (
    <header className="border-b border-black/10">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-6">
        <a
          href="/"
          className="font-heading font-bold text-sm tracking-[0.2em] uppercase"
          aria-label="Marin Lazic home"
        >
          ML
        </a>
        <nav aria-label="Primary" className="flex items-center gap-4 sm:gap-6">
          <a
            href="/"
            className="text-[10px] sm:text-xs tracking-[0.14em] uppercase text-black/60 hover:text-black transition-colors font-medium"
          >
            Home
          </a>
          <a
            href="/insights"
            className="text-[10px] sm:text-xs tracking-[0.14em] uppercase text-black/60 hover:text-black transition-colors font-medium"
          >
            Insights
          </a>
          <a
            href="/library"
            className="text-[10px] sm:text-xs tracking-[0.14em] uppercase text-black/60 hover:text-black transition-colors font-medium"
          >
            Library
          </a>
          <a
            href="/resources"
            className="text-[10px] sm:text-xs tracking-[0.14em] uppercase text-black hover:text-black/60 transition-colors font-medium"
          >
            Resources
          </a>
          <a
            href="/media"
            className="text-[10px] sm:text-xs tracking-[0.14em] uppercase text-black/60 hover:text-black transition-colors font-medium"
          >
            Media
          </a>
          <a
            href="/apply"
            className="bg-[#FFD400] text-black border-2 border-black text-[10px] sm:text-xs tracking-[0.14em] uppercase px-3 sm:px-4 py-2.5 hover:bg-black hover:text-[#FFD400] transition-colors font-medium"
          >
            Apply
          </a>
        </nav>
      </div>
    </header>
  );
}

export default function ResourcePage() {
  const { slug } = useParams<{ slug: string }>();
  const resource = resources.find(
    item => item.slug === slug || item.aliases.includes(slug || "")
  );

  if (!resource) return <NotFound />;
  const photo = resourcePhoto(resource.aliases[0]);

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black flex flex-col">
      <ResourceNavigation />
      <main className="flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <article className="max-w-2xl mx-auto">
          <nav
            aria-label="Breadcrumb"
            className="mb-8 text-[10px] tracking-[0.16em] uppercase text-black/45"
          >
            <a href="/" className="hover:text-black transition-colors">
              Home
            </a>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <a href="/resources" className="hover:text-black transition-colors">
              Resources
            </a>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span aria-current="page" className="text-black/70">
              {resource.title}
            </span>
          </nav>

          <div className="w-3 h-3 bg-[#FFD400] mb-8" aria-hidden="true" />
          <p className="text-xs tracking-[0.15em] uppercase text-black font-semibold mb-4">
            Keyword: {resource.keyword}
          </p>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-[-0.03em] leading-[0.93] mb-6">
            {resource.title}
          </h1>
          <div
            className="flex flex-wrap gap-2 mb-8"
            aria-label="Resource topics"
          >
            {resource.tags.map(tag => (
              <span
                key={tag}
                className="border border-black/15 px-2 py-1 text-[10px] tracking-[0.12em] uppercase text-black/55"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-base sm:text-lg text-black/65 leading-relaxed mb-10">
            {resource.intro}
          </p>

          {photo && (
            <picture>
              <source type="image/webp" srcSet={srcSet(photo, "webp")} sizes="(min-width: 768px) 672px, 100vw" />
              <img
                src={resourceImagePath(photo.base, 1200, "jpg")}
                srcSet={srcSet(photo, "jpg")}
                sizes="(min-width: 768px) 672px, 100vw"
                alt={photo.alt}
                width={1200}
                height={1200}
                loading="eager"
                decoding="async"
                className="w-full aspect-square object-cover block mb-12"
              />
            </picture>
          )}

          <aside
            className="border-l-2 border-[#FFD400] bg-black/[0.025] px-5 py-4 mb-12"
            aria-label="Educational and safety notice"
          >
            <p className="text-sm text-black/65 leading-relaxed">
              <strong className="text-black">Educational notice.</strong> This
              resource is general education, not medical advice, diagnosis or
              treatment. Stop an exercise if it causes pain or concerning
              symptoms. For injuries, symptoms or health concerns, seek advice
              from a qualified health professional.
            </p>
          </aside>

          <div className="space-y-12">
            {resource.sections.map(section => (
              <section
                key={section.heading ?? "resource-section"}
                className="border-t border-black/10 pt-7"
              >
                {section.heading && (
                  <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-5">
                    {section.heading}
                  </h2>
                )}
                <div className="space-y-4">
                  {section.content.map(line => (
                    <div key={line} className="flex items-start gap-3">
                      <div
                        className="w-1.5 h-1.5 bg-[#FFD400] mt-2 shrink-0"
                        aria-hidden="true"
                      />
                      <p className="text-sm sm:text-base text-black/70 leading-relaxed">
                        {line}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {resource.footer && (
            <div className="mt-10 border-t border-black/10 pt-8">
              <p className="text-sm text-black/55 leading-relaxed italic">
                {resource.footer}
              </p>
            </div>
          )}

          <GuideSignup placement="resource" variant="inline" className="mt-12" />

          <div className="mt-12 border-t border-black/10 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium mb-2">
                More resources
              </p>
              <p className="text-sm text-black/60">
                Browse the full library of short guides.
              </p>
            </div>
            <a
              href="/resources"
              className="inline-flex w-fit border border-black/20 text-black text-xs tracking-[0.15em] uppercase px-5 py-3 hover:border-black/60 transition-colors font-bold"
            >
              All resources
            </a>
          </div>
        </article>
      </main>
      <footer className="border-t border-black/10 py-6">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <a
            href="/"
            className="text-xs tracking-[0.1em] uppercase text-black/40 hover:text-black transition-colors"
          >
            Marin Lazic
          </a>
        </div>
      </footer>
    </div>
  );
}
