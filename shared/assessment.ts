// Shared assessment definitions. The client renders these questions, the
// server scores them for Kit and the PDF, and the report page reads them.
// One source of truth so every score shown to a person matches.

export type QuestionType = "single" | "multi" | "text" | "number" | "select";

export interface Option {
  label: string;
  value: string;
  description?: string;
  score?: number;
}

export interface Question {
  id: string;
  section: string;
  type: QuestionType;
  text: string;
  subtext: string;
  options?: Option[];
  placeholder?: string;
  required?: boolean;
  conditional?: { questionId: string; value: string };
  /** Show this question only when another answer is one of these values. */
  showIf?: { questionId: string; anyOf: string[] };
  /** Number questions: the range a real reading falls in. */
  min?: number;
  max?: number;
}

/** Whether a question is asked, given the answers so far. */
export function isQuestionShown(q: Question, answers: Record<string, unknown>): boolean {
  const matches = (questionId: string, values: string[]) => {
    const dep = answers[questionId];
    return Array.isArray(dep) ? dep.some(v => values.includes(v)) : values.includes(dep as string);
  };
  if (q.conditional && !matches(q.conditional.questionId, [q.conditional.value])) return false;
  if (q.showIf && !matches(q.showIf.questionId, q.showIf.anyOf)) return false;
  return true;
}

/** A simple shape check for an email address: something@something.tld, no spaces. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}


/** The questions shown on the landing page before the quiz asks for a name or an email. */
export const QUICK_START_IDS = ["occupation", "primary-goal", "age"] as const;

export const QUESTIONS: Question[] = [
  // ── QUICK START: three taps, no typing, no email yet ──
  {
    id: "occupation",
    section: "start",
    type: "select",
    text: "What best describes your role?",
    subtext: "This helps us understand your daily demands and stress profile.",
    options: [
      {
        label: "CEO, C suite or founder",
        value: "executive",
        description: "Running the show",
      },
      {
        label: "Business owner or self employed",
        value: "entrepreneur",
        description: "Building something",
      },
      {
        label: "Senior leader or director",
        value: "senior-leader",
        description: "High stakes, high pressure",
      },
      {
        label: "Professional or manager",
        value: "professional",
        description: "Career-focused",
      },
      {
        label: "Athlete (competitive)",
        value: "athlete",
        description: "Sport is your life",
      },
      { label: "Other", value: "other", description: "None of the above" },
    ],
  },
  {
    id: "primary-goal",
    section: "start",
    type: "select",
    text: "What's your primary goal right now?",
    subtext:
      "If you could only fix one thing in the next 90 days, what would it be?",
    options: [
      {
        label: "Change body composition",
        value: "fat-loss",
        description: "Body composition",
      },
      {
        label: "Build strength and muscle",
        value: "strength",
        description: "Strength development",
      },
      {
        label: "Improve day to day energy",
        value: "energy",
        description: "More consistent energy",
      },
      {
        label: "Better sleep and recovery",
        value: "sleep-recovery",
        description: "Wake up actually feeling rested",
      },
      {
        label: "Manage stress",
        value: "stress",
        description: "Develop sustainable habits",
      },
      {
        label: "Athletic performance",
        value: "performance",
        description: "Compete at a higher level",
      },
      {
        label: "Overall health and longevity",
        value: "longevity",
        description: "Play the long game",
      },
    ],
  },
  {
    id: "age",
    section: "start",
    type: "select",
    text: "What's your age range?",
    subtext: "This helps put training and recovery habits in context.",
    options: [
      { label: "Under 25", value: "under-25" },
      { label: "25 to 34", value: "25-34" },
      { label: "35 to 44", value: "35-44" },
      { label: "45 to 54", value: "45-54" },
      { label: "55+", value: "55+" },
    ],
  },

  // ── ABOUT YOU ──
  {
    id: "name",
    section: "personal",
    type: "text",
    required: true,
    text: "What's your first name?",
    subtext: "So your report speaks to you.",
    placeholder: "Your name",
  },
  {
    id: "email",
    section: "personal",
    type: "text",
    required: true,
    text: "What's your email?",
    subtext: "Your score and personal report go here. No spam.",
    placeholder: "your@email.com",
  },


  // ── SLEEP ──
  {
    id: "sleep-hours",
    section: "sleep",
    type: "select",
    text: "How many hours of sleep do you average per night?",
    subtext: "Think about the last 2 weeks, not your best night.",
    options: [
      {
        label: "Less than 5 hours",
        value: "under-5",
        score: 1,
        description: "Very short sleep opportunity",
      },
      {
        label: "5 to 6 hours",
        value: "5-6",
        score: 2,
        description: "Short sleep opportunity",
      },
      {
        label: "6 to 7 hours",
        value: "6-7",
        score: 3,
        description: "Moderate sleep opportunity",
      },
      {
        label: "7 to 8 hours",
        value: "7-8",
        score: 4,
        description: "Longer sleep opportunity",
      },
      {
        label: "8+ hours",
        value: "8+",
        score: 5,
        description: "Extended sleep opportunity",
      },
    ],
  },
  {
    id: "sleep-quality",
    section: "sleep",
    type: "select",
    text: "How would you rate your sleep quality?",
    subtext: "Think about how settled and restorative it has felt recently.",
    options: [
      {
        label: "Frequently disrupted",
        value: "terrible",
        score: 1,
        description: "Restless or broken sleep",
      },
      {
        label: "Often disrupted",
        value: "poor",
        score: 2,
        description: "Multiple awakenings",
      },
      {
        label: "It varies",
        value: "average",
        score: 3,
        description: "Mixed recent experience",
      },
      {
        label: "Usually settled",
        value: "good",
        score: 4,
        description: "Generally continuous sleep",
      },
      {
        label: "Usually restorative",
        value: "excellent",
        score: 5,
        description: "Often feel rested on waking",
      },
    ],
  },
  {
    id: "sleep-routine",
    section: "sleep",
    type: "select",
    text: "Do you have a consistent wind-down routine before bed?",
    subtext: "For example, a regular time to wind down before bed.",
    options: [
      { label: "No regular routine", value: "none", score: 1 },
      { label: "Sometimes", value: "sometimes", score: 2 },
      { label: "I try, but it varies", value: "inconsistent", score: 3 },
      { label: "Yes, most nights", value: "mostly", score: 4 },
      { label: "A regular routine most nights", value: "locked-in", score: 5 },
    ],
  },

  // ── STRESS ──
  {
    id: "stress-level",
    section: "stress",
    type: "select",
    text: "How often do you feel overwhelmed by your workload?",
    subtext: "Consider the last few weeks.",
    options: [
      {
        label: "Every day",
        value: "daily",
        score: 1,
        description: "Frequent overload",
      },
      {
        label: "Most days",
        value: "most-days",
        score: 2,
        description: "Regularly difficult",
      },
      {
        label: "A few times a week",
        value: "few-times",
        score: 3,
        description: "Periodic pressure",
      },
      {
        label: "Rarely",
        value: "rarely",
        score: 4,
        description: "Less frequent",
      },
      {
        label: "Almost never",
        value: "never",
        score: 5,
        description: "Infrequent",
      },
    ],
  },
  {
    id: "stress-management",
    section: "stress",
    type: "select",
    text: "Do you have a deliberate stress management practice?",
    subtext:
      "For example, time outdoors, breathing practice, talking with someone or another routine that suits you.",
    options: [
      {
        label: "No regular practice",
        value: "none",
        score: 1,
        description: "No current routine",
      },
      {
        label: "I know I should, but I do not",
        value: "aware",
        score: 2,
        description: "Considering a routine",
      },
      {
        label: "Sometimes, when I feel overwhelmed",
        value: "reactive",
        score: 3,
        description: "Occasional practice",
      },
      {
        label: "Yes, a few times a week",
        value: "regular",
        score: 4,
        description: "Regular practice",
      },
      {
        label: "Daily",
        value: "daily",
        score: 5,
        description: "Regular routine",
      },
    ],
  },
  {
    id: "mental-health",
    section: "stress",
    type: "select",
    text: "How would you describe your mental clarity and focus during the day?",
    subtext: "Think about your experience over the last few weeks.",
    options: [
      { label: "Brain fog most of the day", value: "fog", score: 1 },
      {
        label: "Scattered. Hard to focus for long.",
        value: "scattered",
        score: 2,
      },
      {
        label: "Decent in the morning, fades fast.",
        value: "morning-only",
        score: 3,
      },
      { label: "Good focus most of the day.", value: "good", score: 4 },
      {
        label: "Sharp and clear. I can lock in when needed.",
        value: "sharp",
        score: 5,
      },
    ],
  },

  // ── TRAINING ──
  {
    id: "training-frequency",
    section: "training",
    type: "select",
    text: "How many days per week do you currently train?",
    subtext: "Include planned exercise and training.",
    options: [
      {
        label: "0 to 1 days",
        value: "0-1",
        score: 1,
        description: "Infrequent training",
      },
      { label: "2 days", value: "2", score: 2, description: "Some training" },
      {
        label: "3 days",
        value: "3",
        score: 3,
        description: "Regular training",
      },
      {
        label: "4 to 5 days",
        value: "4-5",
        score: 4,
        description: "Frequent training",
      },
      {
        label: "6+ days",
        value: "6+",
        score: 5,
        description: "Very frequent training",
      },
    ],
  },
  {
    id: "training-type",
    section: "training",
    type: "multi",
    text: "What does your current training look like?",
    subtext: "Select all that apply.",
    options: [
      { label: "Strength / weight training", value: "strength" },
      { label: "Running / cardio", value: "cardio" },
      { label: "HIIT / CrossFit", value: "hiit" },
      { label: "Yoga / Pilates", value: "yoga" },
      { label: "Sport-specific training", value: "sport" },
      { label: "Swimming", value: "swimming" },
      { label: "Walking only", value: "walking" },
      { label: "Nothing right now", value: "nothing" },
    ],
  },
  {
    id: "training-structure",
    section: "training",
    type: "select",
    text: "Does your training have structure and progression?",
    subtext: "For example, a plan, routine or progression you can follow.",
    options: [
      {
        label: "I don't train",
        value: "none",
        score: 1,
        description: "No program",
      },
      {
        label: "I do random workouts",
        value: "random",
        score: 2,
        description: "No plan",
      },
      {
        label: "I follow a loose routine",
        value: "loose",
        score: 3,
        description: "Some structure",
      },
      {
        label: "I have a program I follow",
        value: "programmed",
        score: 4,
        description: "Programmed",
      },
      {
        label: "Periodised, tracked, and progressing",
        value: "periodised",
        score: 5,
        description: "Structured approach",
      },
    ],
  },

  // ── INJURIES ──
  {
    id: "current-injuries",
    section: "injuries",
    type: "select",
    text: "Do you have any current injuries or pain?",
    subtext:
      "If pain affects movement or persists, include it here and consider speaking with a clinician.",
    options: [
      { label: "No injuries or pain", value: "none", score: 5 },
      { label: "Minor niggles that don't stop me", value: "minor", score: 4 },
      {
        label: "Ongoing issue that limits some movements",
        value: "moderate",
        score: 2,
      },
      {
        label: "Significant injury affecting daily life",
        value: "significant",
        score: 1,
      },
      { label: "Multiple issues I'm managing", value: "multiple", score: 1 },
    ],
  },

  // ── NUTRITION ──
  {
    id: "nutrition-quality",
    section: "nutrition",
    type: "select",
    text: "How would you rate your overall nutrition?",
    subtext: "Think about what you generally eat, rather than an ideal week.",
    options: [
      {
        label: "Mostly convenience foods",
        value: "terrible",
        score: 1,
        description: "Few planned meals",
      },
      {
        label: "Hard to maintain a routine",
        value: "poor",
        score: 2,
        description: "Routine varies",
      },
      {
        label: "A mix of planned and unplanned meals",
        value: "average",
        score: 3,
        description: "Mixed pattern",
      },
      {
        label: "Mostly planned meals",
        value: "good",
        score: 4,
        description: "Regular routine",
      },
      {
        label: "A consistent approach that suits me",
        value: "excellent",
        score: 5,
        description: "Established routine",
      },
    ],
  },
  {
    id: "energy-level",
    section: "nutrition",
    type: "select",
    text: "What's your energy like by 3pm?",
    subtext: "Think about a typical afternoon.",
    options: [
      {
        label: "Very low",
        value: "zombie",
        score: 1,
        description: "Little energy left",
      },
      {
        label: "Low",
        value: "caffeine",
        score: 2,
        description: "Rely on caffeine or effort",
      },
      {
        label: "A noticeable dip",
        value: "dip",
        score: 3,
        description: "Lower but manageable",
      },
      {
        label: "Fairly steady",
        value: "productive",
        score: 4,
        description: "Usually able to continue",
      },
      {
        label: "Similar to the morning",
        value: "same",
        score: 5,
        description: "Often steady",
      },
    ],
  },
  {
    id: "hydration",
    section: "nutrition",
    type: "select",
    text: "How much water do you drink daily?",
    subtext:
      "Fluids in drinks and food contribute. Needs vary with climate, activity and medical context.",
    options: [
      { label: "Less than 1 litre", value: "under-1", score: 1 },
      { label: "1 to 2 litres", value: "1-2", score: 2 },
      { label: "2 to 3 litres", value: "2-3", score: 4 },
      { label: "3+ litres", value: "3+", score: 5 },
    ],
  },

  // ── RECOVERY & TECH ──
  {
    id: "recovery-practice",
    section: "recovery",
    type: "select",
    text: "Do you schedule deliberate recovery into your week?",
    subtext: "Active recovery, mobility, cold/heat therapy, rest days.",
    options: [
      {
        label: "No planned recovery",
        value: "none",
        score: 1,
        description: "No current routine",
      },
      {
        label: "I rest when I'm forced to",
        value: "reactive",
        score: 2,
        description: "Reactive only",
      },
      {
        label: "Occasionally, when I feel beat up",
        value: "occasional",
        score: 3,
        description: "Sporadic",
      },
      {
        label: "1 to 2 planned sessions per week",
        value: "regular",
        score: 4,
        description: "Intentional",
      },
      {
        label: "It's built into my weekly system",
        value: "systematic",
        score: 5,
        description: "Systematic",
      },
    ],
  },
  {
    id: "has-whoop",
    section: "recovery",
    type: "select",
    text: "Do you currently use a WHOOP strap?",
    subtext:
      "Wearables estimate recovery trends. Device methods differ, and their scores are not medical tests.",
    options: [
      { label: "Yes, I use WHOOP", value: "yes" },
      {
        label: "No, but I use another wearable (Oura, Garmin, Apple Watch)",
        value: "other-wearable",
      },
      { label: "No, I don't use any wearable", value: "no" },
    ],
  },
  {
    id: "resting-heart-rate",
    section: "recovery",
    type: "number",
    showIf: { questionId: "has-whoop", anyOf: ["yes", "other-wearable"] },
    min: 30,
    max: 120,
    text: "What's your resting heart rate (RHR)?",
    subtext:
      "Check your wearable's morning reading. Tap I don't know to skip.",
    placeholder: "e.g. 58",
  },
  {
    id: "hrv",
    section: "recovery",
    type: "number",
    showIf: { questionId: "has-whoop", anyOf: ["yes", "other-wearable"] },
    min: 10,
    max: 250,
    text: "What's your Heart Rate Variability (HRV)?",
    subtext:
      "HRV is one recovery signal. Use the same device and method; individual trends matter more than comparisons. Tap I don't know to skip.",
    placeholder: "e.g. 45",
  },
  {
    id: "respiratory-rate",
    section: "recovery",
    type: "number",
    showIf: { questionId: "has-whoop", anyOf: ["yes", "other-wearable"] },
    min: 6,
    max: 40,
    text: "What's your average respiratory rate during sleep?",
    subtext:
      "Use a reading from the same wearable and method where possible. Wearable estimates are not medical tests. Tap I don't know to skip.",
    placeholder: "e.g. 15",
  },
  {
    id: "after-work-energy",
    section: "recovery",
    type: "select",
    text: "After work, do you have energy for the people and things you care about?",
    subtext: "Think about your recent routine outside work.",
    options: [
      {
        label: "I collapse on the couch",
        value: "collapse",
        score: 1,
        description: "Nothing left",
      },
      {
        label: "I'm present but checked out",
        value: "checked-out",
        score: 2,
        description: "Physically there, mentally gone",
      },
      {
        label: "Depends on the day",
        value: "depends",
        score: 3,
        description: "Hit or miss",
      },
      {
        label: "Usually yes, with some effort",
        value: "usually",
        score: 4,
        description: "Good reserves",
      },
      {
        label: "Absolutely. That's the whole point.",
        value: "absolutely",
        score: 5,
        description: "Full tank",
      },
    ],
  },
  {
    id: "commitment",
    section: "recovery",
    type: "select",
    text: "How committed are you to making a real change in the next 90 days?",
    subtext: "Choose the option that best reflects where you are now.",
    options: [
      {
        label: "Just curious right now",
        value: "curious",
        description: "Exploring options",
      },
      {
        label: "Thinking about it seriously",
        value: "thinking",
        description: "Getting closer",
      },
      {
        label: "Ready to start but need guidance",
        value: "ready",
        description: "Looking for the right plan",
      },
      {
        label: "Ready to begin with support",
        value: "all-in",
        description: "Ready to take the next step",
      },
    ],
  },
  // Not scored. It tells Marin what kind of help the person has in mind,
  // which is also a read on budget, and it picks the next step on the
  // results page. Added 19 Nov 2026.
  {
    id: "help-type",
    section: "recovery",
    type: "select",
    text: "What kind of help would suit you best right now?",
    subtext: "There is no wrong answer. It tells me which next step to show you.",
    options: [
      {
        label: "A program I follow myself",
        value: "program",
        description: "Buy once, train from your phone",
      },
      {
        label: "A small group with a coach",
        value: "group",
        description: "Train alongside a few others",
      },
      {
        label: "1:1 coaching with me",
        value: "one-to-one",
        description: "A plan built around your week",
      },
      {
        label: "Not sure yet",
        value: "unsure",
        description: "Show me the options",
      },
    ],
  },
];

// Written questions that were in the quiz until 18 Nov 2026. They were taken
// out to cut typing and to stop collecting health details (injuries,
// medications) on a public form. Kept here so answers already on file still
// show with their question in the dashboard.
export const RETIRED_QUESTIONS: Question[] = [
  {
    id: "goals-detail",
    section: "goals",
    type: "text",
    text: "Tell me more about what you want to achieve.",
    subtext: "A specific example can help put your goals in context.",
    placeholder: "What does success look like for you in 6 months?",
  },
  {
    id: "tried-before",
    section: "goals",
    type: "text",
    text: "What have you tried before that didn't work?",
    subtext: "Previous approaches can help provide context.",
    placeholder: "Previous programs, diets, coaches, approaches...",
  },
  {
    id: "training-history",
    section: "training",
    type: "text",
    text: "Briefly describe your training background.",
    subtext:
      "How long have you been training? Any sports background? What's your experience level?",
    placeholder:
      'e.g., "Played rugby for 10 years, gym on and off for 5 years, no coach"',
  },
  {
    id: "injury-detail",
    section: "injuries",
    type: "text",
    text: "Tell me about any injuries, surgeries, or chronic conditions.",
    subtext:
      "Include past or current issues relevant to training. A clinician should advise on diagnosis and treatment.",
    placeholder:
      "List any injuries, surgeries, or conditions we should know about...",
  },
  {
    id: "medications",
    section: "injuries",
    type: "text",
    text: "Are you currently taking any medications or supplements?",
    subtext:
      "This may be relevant to coaching context. Do not change prescribed treatment based on this assessment.",
    placeholder: "List any medications or supplements...",
  },
];

export const ALL_QUESTIONS: Question[] = [...QUESTIONS, ...RETIRED_QUESTIONS];

/** Questions every visitor is asked. Wearable readings are extra, for people who have one. */
export const BASE_QUESTION_COUNT = QUESTIONS.filter(q => !q.conditional && !q.showIf).length;

export const SCORED_SECTIONS = [
  { id: "sleep", title: "Sleep" },
  { id: "stress", title: "Stress & Mental" },
  { id: "training", title: "Training" },
  { id: "injuries", title: "Injuries & Health" },
  { id: "nutrition", title: "Nutrition & Energy" },
  { id: "recovery", title: "Recovery" },
] as const;

export type CategoryScore = {
  id: string;
  name: string;
  percentage: number;
  total: number;
  max: number;
};

export type AssessmentScores = {
  categories: CategoryScore[];
  overallPct: number;
  weakest: CategoryScore | null;
  strongest: CategoryScore | null;
};

/** Scores an answer set from the option scores on the questions. */
export function calculateScores(answers: Record<string, unknown>): AssessmentScores {
  const bySection: Record<string, { total: number; max: number }> = {};
  for (const s of SCORED_SECTIONS) bySection[s.id] = { total: 0, max: 0 };
  for (const q of QUESTIONS) {
    if (!q.options || !(q.section in bySection)) continue;
    if (!q.options.some(o => o.score !== undefined)) continue;
    const answer = answers[q.id];
    const option = q.options.find(o => o.value === answer);
    if (option?.score !== undefined) {
      bySection[q.section].total += option.score;
      bySection[q.section].max += 5;
    }
  }
  const categories: CategoryScore[] = SCORED_SECTIONS.map(s => ({
    id: s.id,
    name: s.title,
    total: bySection[s.id].total,
    max: bySection[s.id].max,
    percentage:
      bySection[s.id].max > 0
        ? Math.round((bySection[s.id].total / bySection[s.id].max) * 100)
        : 0,
  }));
  const total = categories.reduce((sum, c) => sum + c.total, 0);
  const max = categories.reduce((sum, c) => sum + c.max, 0);
  const overallPct = max > 0 ? Math.round((total / max) * 100) : 0;
  const answered = categories.filter(c => c.max > 0);
  const weakest = answered.length ? [...answered].sort((a, b) => a.percentage - b.percentage)[0] : null;
  const strongest = answered.length ? [...answered].sort((a, b) => b.percentage - a.percentage)[0] : null;
  return { categories, overallPct, weakest, strongest };
}

export function getScoreBand(pct: number): string {
  if (pct >= 80) return "80-100";
  if (pct >= 60) return "60-79";
  if (pct >= 50) return "50-59";
  if (pct >= 40) return "40-49";
  return "0-39";
}

export function getScoreLabel(pct: number): string {
  if (pct >= 80) return "STRONG HABITS";
  if (pct >= 60) return "STEADY BASE";
  if (pct >= 50) return "FOCUS AREA";
  return "STARTING POINT";
}
