/**
 * The "Start here" tip for each scored area on the assessment results page.
 *
 * Each tip has four parts: what a low score often looks like, why it tends to
 * happen, one thing to do first, and how long to give it. The actions and
 * numbers come from Marin's own Recovery Guide (shared/recoveryGuide.ts) and
 * his coaching page, so the results page says the same thing he says
 * everywhere else.
 *
 * These are coaching pointers, not diagnosis. Nothing here promises an
 * outcome: "give it" is how long to try the habit before judging it. Sleep,
 * stress, injuries and nutrition each point to a GP, physio or dietitian.
 */
export interface AreaTip {
  looks: string;
  why: string;
  first: string;
  give: string;
}

export const AREA_TIPS: Record<string, AreaTip> = {
  sleep: {
    looks: "You go to bed tired, wake up tired and run the morning on coffee.",
    why: "Bed and wake times that move around. Your body clock never knows when the day starts.",
    first:
      "Same wake time seven days a week. Get outside light for 2 to 10 minutes within an hour of waking. Coffee after that.",
    give: "Two weeks before you judge it. If sleep stays poor, see your GP.",
  },
  stress: {
    looks: "Wired by mid morning, flat by 3pm, short with the people at home.",
    why: "Load stacked on load with no switch off in between. Your head needs recovery the same way your legs do.",
    first:
      "Between your two hardest blocks of the day, breathe in for 6, hold for 4, out for 10. Five minutes is plenty. Or walk for ten minutes with no phone.",
    give: "Every work day for two weeks. If it feels like more than a busy patch, talk to your GP.",
  },
  training: {
    looks: "You train when work allows, do what you feel like on the day and are not sure you are getting stronger.",
    why: "No plan and no numbers. If the load is not written down, you cannot add to it.",
    first:
      "Pick two or three days and protect them. One main lift a session. Write down the weight and add a little when it moves well.",
    give: "Six weeks, then retest the lift.",
  },
  injuries: {
    looks: "A niggle that keeps coming back, so you train around it or skip the session.",
    why: "Often the sore spot is covering for a stiff ankle, hip or upper back. Only an assessment can tell you.",
    first:
      "Keep training what feels fine. Get the sore part looked at by a physio or your GP before you load it.",
    give: "Do not wait on this one. If pain lasts more than two weeks or changes how you move, book it now.",
  },
  nutrition: {
    looks: "You skip meals on busy days, then eat whatever is closest at 3pm.",
    why: "Long gaps between meals and not much protein early. The afternoon pays for the morning.",
    first:
      "Build each main meal the same way: half vegetables and fruit, a quarter protein, a quarter slow carbohydrate, a thumb of fat.",
    give: "Two weeks of work days. For a plan built for you, see an accredited practising dietitian.",
  },
  recovery: {
    looks: "You train hard and rest by accident. Every week feels the same.",
    why: "You get stronger in the rest, and nothing in your week is planned as rest.",
    first:
      "Put an easy day after each hard one: 20 to 30 minutes of easy movement. Each morning, score how you feel from 1 to 5. On a 3, take 10 to 20 percent off the load.",
    give: "Two weeks of morning scores will show you the pattern.",
  },
};

/** At or above this score the area is treated as a strength and gets no fix. */
export const STRENGTH_FROM = 70;
export const STRENGTH_LINE = "This is a strength in your answers. Keep doing what you are doing, and put your effort into your lowest area first.";
