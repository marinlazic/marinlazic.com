import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Moon,
  Brain,
  Zap,
  Dumbbell,
  Heart,
  Target,
  Utensils,
  Watch,
  User,
  ChevronRight,
  ChevronDown,
  Loader2,
  ExternalLink,
  CreditCard,
  Share2,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useSearch } from "wouter";
import { getCampaignValue } from "@/lib/attribution";

// ─── Types ──────────────────────────────────────────────
type QuestionType = "single" | "multi" | "text" | "number" | "select";

interface Option {
  label: string;
  value: string;
  description?: string;
  score?: number;
}

interface Question {
  id: string;
  section: string;
  type: QuestionType;
  text: string;
  subtext: string;
  options?: Option[];
  placeholder?: string;
  required?: boolean;
  conditional?: { questionId: string; value: string };
}

interface Section {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

// ─── Sections ──────────────────────────────────────────
const SECTIONS: Section[] = [
  {
    id: "personal",
    title: "About You",
    subtitle: "A few details to put your responses in context",
    icon: <User className="w-5 h-5" />,
    color: "#1a1a1a",
  },
  {
    id: "goals",
    title: "Goals",
    subtitle: "What would you like to work towards?",
    icon: <Target className="w-5 h-5" />,
    color: "#E53935",
  },
  {
    id: "sleep",
    title: "Sleep",
    subtitle: "Your recent sleep habits and experience",
    icon: <Moon className="w-5 h-5" />,
    color: "#1a1a2e",
  },
  {
    id: "stress",
    title: "Stress & Mental",
    subtitle: "Your workload, stress and focus",
    icon: <Brain className="w-5 h-5" />,
    color: "#6B21A8",
  },
  {
    id: "training",
    title: "Current Training",
    subtitle: "What you are doing now",
    icon: <Dumbbell className="w-5 h-5" />,
    color: "#264653",
  },
  {
    id: "injuries",
    title: "Injuries & Health",
    subtitle: "Health and pain considerations for training",
    icon: <Heart className="w-5 h-5" />,
    color: "#dc2626",
  },
  {
    id: "nutrition",
    title: "Nutrition & Energy",
    subtitle: "Your current eating and energy patterns",
    icon: <Utensils className="w-5 h-5" />,
    color: "#e76f51",
  },
  {
    id: "recovery",
    title: "Recovery & Technology",
    subtitle: "How you recover and what you track",
    icon: <Watch className="w-5 h-5" />,
    color: "#2d6a4f",
  },
];

// ─── Questions ──────────────────────────────────────────
const QUESTIONS: Question[] = [
  // ── PERSONAL ──
  {
    id: "name",
    section: "personal",
    type: "text",
    required: true,
    text: "What's your name?",
    subtext: "First name is enough.",
    placeholder: "Your name",
  },
  {
    id: "email",
    section: "personal",
    type: "text",
    required: true,
    text: "What's your email?",
    subtext: "We will use this to send your assessment summary.",
    placeholder: "your@email.com",
  },
  {
    id: "age",
    section: "personal",
    type: "select",
    text: "What's your age range?",
    subtext: "This helps put training and recovery habits in context.",
    options: [
      { label: "Under 25", value: "under-25" },
      { label: "25–34", value: "25-34" },
      { label: "35–44", value: "35-44" },
      { label: "45–54", value: "45-54" },
      { label: "55+", value: "55+" },
    ],
  },
  {
    id: "occupation",
    section: "personal",
    type: "select",
    text: "What best describes your role?",
    subtext: "This helps us understand your daily demands and stress profile.",
    options: [
      {
        label: "C-Suite / Founder",
        value: "executive",
        description: "Running the show",
      },
      {
        label: "Senior Leader / Director",
        value: "senior-leader",
        description: "High stakes, high pressure",
      },
      {
        label: "Professional / Manager",
        value: "professional",
        description: "Career-focused",
      },
      {
        label: "Athlete (competitive)",
        value: "athlete",
        description: "Sport is your life",
      },
      {
        label: "Entrepreneur / Self-Employed",
        value: "entrepreneur",
        description: "Building something",
      },
      { label: "Other", value: "other", description: "None of the above" },
    ],
  },

  // ── GOALS ──
  {
    id: "primary-goal",
    section: "goals",
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
        label: "Improve day-to-day energy",
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
        label: "5–6 hours",
        value: "5-6",
        score: 2,
        description: "Short sleep opportunity",
      },
      {
        label: "6–7 hours",
        value: "6-7",
        score: 3,
        description: "Moderate sleep opportunity",
      },
      {
        label: "7–8 hours",
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
        label: "0–1 days",
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
        label: "4–5 days",
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
      { label: "1–2 litres", value: "1-2", score: 2 },
      { label: "2–3 litres", value: "2-3", score: 4 },
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
        label: "1–2 planned sessions per week",
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
    text: "What's your resting heart rate (RHR)?",
    subtext:
      "Check your wearable's morning reading. If you don't know, type 0 and we'll skip this.",
    placeholder: "e.g. 58",
  },
  {
    id: "hrv",
    section: "recovery",
    type: "number",
    text: "What's your Heart Rate Variability (HRV)?",
    subtext:
      "HRV is one recovery signal. Use the same device and method; individual trends matter more than comparisons. Type 0 if you do not know.",
    placeholder: "e.g. 45",
  },
  {
    id: "respiratory-rate",
    section: "recovery",
    type: "number",
    text: "What's your average respiratory rate during sleep?",
    subtext:
      "Use a reading from the same wearable and method where possible. Wearable estimates are not medical tests. Type 0 if you do not know.",
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
];

// ─── Helpers ──────────────────────────────────────────────
function getQuestionsForSection(sectionId: string): Question[] {
  return QUESTIONS.filter(q => q.section === sectionId);
}

function getSectionIcon(sectionId: string): React.ReactNode {
  return (
    SECTIONS.find(s => s.id === sectionId)?.icon || (
      <BarChart3 className="w-5 h-5" />
    )
  );
}

function getSectionColor(sectionId: string): string {
  return SECTIONS.find(s => s.id === sectionId)?.color || "#000";
}

// ─── Share Results Component ───────────────────────────
function ShareResults({
  userName,
  overallPct,
  strongest,
  weakest,
}: {
  userName: string;
  overallPct: number;
  strongest: { title: string; percentage: number } | undefined;
  weakest: { title: string; percentage: number } | undefined;
}) {
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const { track } = useAnalytics();

  const assessmentUrl = "https://marinlazic.com/assessment";

  const shareText = `I just scored ${overallPct}/100 on the ML Performance Assessment.${strongest ? ` Strongest area: ${strongest.title} (${strongest.percentage}%).` : ""}${weakest ? ` Biggest opportunity: ${weakest.title} (${weakest.percentage}%).` : ""} Take yours and see where you stand.`;

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(assessmentUrl)}`;

  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(assessmentUrl)}`;

  const handleCopyLink = async () => {
    const fullText = `${shareText}\n\n${assessmentUrl}`;
    try {
      await navigator.clipboard.writeText(fullText);
      track("share_click", { platform: "copy", score: overallPct });
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy. Try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
      className="mb-16"
    >
      <div className="border border-black/10 bg-[#FAFAFA] p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#E53935]" />
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium">
              Share Your Results
            </h3>
          </div>
          <button
            onClick={() => {
              if (!showPanel) track("share_panel_open", { score: overallPct });
              setShowPanel(!showPanel);
            }}
            className="text-xs tracking-[0.1em] uppercase text-[#E53935] font-bold hover:text-[#c62828] transition-colors flex items-center gap-1.5"
          >
            {showPanel ? "Close" : "Share"}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showPanel ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <p className="text-sm text-black/50 leading-relaxed">
          Challenge your network. Share your score and see who takes the
          assessment.
        </p>

        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-6 pt-6 border-t border-black/10">
                {/* Preview of what gets shared */}
                <div className="bg-white border border-black/10 p-4 mb-6">
                  <p className="text-[9px] tracking-[0.15em] uppercase text-black/30 font-medium mb-2">
                    Preview
                  </p>
                  <p className="text-sm text-black/70 leading-relaxed">
                    {shareText}
                  </p>
                  <p className="text-xs text-[#E53935] mt-2">{assessmentUrl}</p>
                </div>

                {/* Share buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* LinkedIn */}
                  <a
                    href={linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#0A66C2] text-white px-5 py-3.5 text-xs tracking-[0.1em] uppercase font-bold hover:bg-[#004182] transition-colors"
                    onClick={() => {
                      track("share_click", {
                        platform: "linkedin",
                        score: overallPct,
                      });
                      toast.info("Opening LinkedIn...");
                    }}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    Share on LinkedIn
                  </a>

                  {/* X / Twitter */}
                  <a
                    href={xUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-5 py-3.5 text-xs tracking-[0.1em] uppercase font-bold hover:bg-black/80 transition-colors"
                    onClick={() => {
                      track("share_click", {
                        platform: "x",
                        score: overallPct,
                      });
                      toast.info("Opening X...");
                    }}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Share on X
                  </a>

                  {/* Copy Link */}
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-black text-black px-5 py-3.5 text-xs tracking-[0.1em] uppercase font-bold hover:bg-black hover:text-white transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy Text
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Collapsible Analysis Section ──────────────────────
function AnalysisSection({
  analysisResult,
  analysisError,
}: {
  analysisResult: string | null;
  analysisError: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const renderLine = (line: string, i: number) => {
    if (!line.trim()) return <div key={i} className="h-3" />;
    if (line.startsWith("### "))
      return (
        <h3
          key={i}
          className="font-heading text-base font-bold uppercase tracking-tight mt-6 mb-2"
        >
          {line.replace("### ", "")}
        </h3>
      );
    if (line.startsWith("## "))
      return (
        <h2
          key={i}
          className="font-heading text-lg font-bold uppercase tracking-tight mt-8 mb-3"
        >
          {line.replace("## ", "")}
        </h2>
      );
    if (line.startsWith("# "))
      return (
        <h1
          key={i}
          className="font-heading text-xl font-bold uppercase tracking-tight mt-8 mb-3"
        >
          {line.replace("# ", "")}
        </h1>
      );
    if (line.startsWith("- **")) {
      const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
      if (match)
        return (
          <div key={i} className="flex items-start gap-3 mb-1.5">
            <span className="text-[#E53935] mt-1 shrink-0 text-xs">&bull;</span>
            <p className="text-sm text-black/70 leading-relaxed">
              <strong className="text-black">{match[1]}</strong>
              {match[2] ? `: ${match[2]}` : ""}
            </p>
          </div>
        );
    }
    if (line.startsWith("- "))
      return (
        <div key={i} className="flex items-start gap-3 mb-1.5">
          <span className="text-[#E53935] mt-1 shrink-0 text-xs">&bull;</span>
          <p className="text-sm text-black/70 leading-relaxed">
            {line.replace("- ", "")}
          </p>
        </div>
      );
    if (line.match(/^\d+\.\s/))
      return (
        <div key={i} className="flex items-start gap-3 mb-1.5">
          <span className="text-[10px] font-bold text-[#E53935] mt-1 shrink-0 w-4 text-right">
            {line.match(/^(\d+)\./)?.[1]}.
          </span>
          <p className="text-sm text-black/70 leading-relaxed">
            {line.replace(/^\d+\.\s*/, "")}
          </p>
        </div>
      );
    if (line.startsWith("> "))
      return (
        <blockquote key={i} className="border-l-2 border-[#E53935] pl-4 my-3">
          <p className="text-sm text-black/60 italic leading-relaxed">
            {line.replace("> ", "")}
          </p>
        </blockquote>
      );
    return (
      <p key={i} className="text-sm text-black/70 leading-relaxed mb-2">
        {line}
      </p>
    );
  };

  if (analysisError) {
    return (
      <div className="border-t border-black/10 pt-12 mb-16">
        <div className="bg-red-50 border border-red-200 p-6">
          <p className="text-sm text-red-600">{analysisError}</p>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="border-t border-black/10 pt-12 mb-16">
        <div className="flex items-center gap-3 text-black/40">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">
            Generating your personalised analysis...
          </span>
        </div>
      </div>
    );
  }

  const lines = analysisResult.split("\n");
  const previewLines = lines.slice(0, 12);
  const hasMore = lines.length > 12;

  return (
    <div className="border-t border-black/10 pt-12 mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-1">
            Your Personalised Analysis
          </h3>
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs tracking-[0.1em] uppercase text-[#E53935] font-bold hover:text-[#c62828] transition-colors"
          >
            {expanded ? "Collapse" : "Read Full Analysis"}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      <div className="bg-[#FAFAFA] border border-black/10 p-6 sm:p-8">
        <div className="prose prose-sm max-w-none">
          {expanded || !hasMore ? (
            lines.map((line, i) => renderLine(line, i))
          ) : (
            <>
              {previewLines.map((line, i) => renderLine(line, i))}
              <div className="relative">
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FAFAFA] to-transparent" />
              </div>
              <button
                onClick={() => setExpanded(true)}
                className="mt-4 flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#E53935] font-bold hover:text-[#c62828] transition-colors"
              >
                Read Full Analysis <ChevronDown className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Kickstart Checkout Button ─────────────────────────
function KickstartCheckoutButton({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  const createSession = trpc.checkout.createSession.useMutation();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!email) {
      toast.error("Email is required to proceed with checkout.");
      return;
    }
    setLoading(true);
    try {
      const result = await createSession.mutateAsync({
        productId: "kickstart-4-week",
        email,
        name: name || undefined,
        origin: window.location.origin,
      });
      if (result.url) {
        toast.info("Redirecting you to checkout...");
        window.open(result.url, "_blank");
      } else {
        toast.error("Failed to create checkout session. Please try again.");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Something went wrong. Please try again or contact us.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="block w-full border border-black text-black px-6 py-4 text-xs tracking-[0.15em] uppercase font-bold hover:bg-black hover:text-white transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" /> Get the 4-Week Program
        </>
      )}
    </button>
  );
}

// ─── Assessment Page ────────────────────────────────────
export default function Assessment() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [phase, setPhase] = useState<
    "intro" | "quiz" | "analyzing" | "results"
  >("intro");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");
  const [textInput, setTextInput] = useState("");
  const [resumeToken, setResumeToken] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchString = useSearch();

  const submitAssessment = trpc.assessment.submit.useMutation();
  const saveProgress = trpc.assessment.saveProgress.useMutation();

  // Parse URL params for resume token and UTM
  const urlParams = new URLSearchParams(searchString);
  const resumeParam = urlParams.get("resume");
  const utmSource = getCampaignValue("utm_source", searchString) || "";
  const utmMedium = getCampaignValue("utm_medium", searchString) || "";
  const utmCampaign = getCampaignValue("utm_campaign", searchString) || "";

  // Load resumed assessment
  const { data: resumedData } = trpc.assessment.getProgress.useQuery(
    { resumeToken: resumeParam || "" },
    { enabled: !!resumeParam }
  );

  useEffect(() => {
    if (resumedData && !resumedData.completed) {
      setAnswers(resumedData.answers || {});
      setCurrentQ(resumedData.answeredCount || 0);
      setPhase("quiz");
      if (resumedData.answers?.name) {
        setTextInput("");
      }
    }
  }, [resumedData]);

  // Auto-save progress after email is captured and on each answer
  useEffect(() => {
    const email = answers.email as string;
    if (!email || phase !== "quiz") return;

    const answeredCount = Object.keys(answers).length;
    const timer = setTimeout(() => {
      saveProgress.mutate(
        {
          email,
          name: (answers.name as string) || undefined,
          answers,
          answeredCount,
          totalQuestions: QUESTIONS.length,
          utmSource: utmSource || undefined,
          utmMedium: utmMedium || undefined,
          utmCampaign: utmCampaign || undefined,
        },
        {
          onSuccess: data => {
            if (data.resumeToken) setResumeToken(data.resumeToken);
          },
        }
      );
    }, 2000); // Debounce 2s

    return () => clearTimeout(timer);
  }, [answers, phase]);

  const question = QUESTIONS[currentQ];
  const totalQuestions = QUESTIONS.length;
  const progress = ((currentQ + 1) / totalQuestions) * 100;
  const sectionId = question?.section || "";
  const section = SECTIONS.find(s => s.id === sectionId);

  // Check if we're at the start of a new section
  const isNewSection =
    currentQ === 0 || QUESTIONS[currentQ - 1]?.section !== sectionId;
  const currentSectionIndex = SECTIONS.findIndex(s => s.id === sectionId);

  // Visible questions (skip conditional ones where condition isn't met)
  function shouldShowQuestion(q: Question): boolean {
    if (!q.conditional) return true;
    const depAnswer = answers[q.conditional.questionId];
    if (Array.isArray(depAnswer))
      return depAnswer.includes(q.conditional.value);
    return depAnswer === q.conditional.value;
  }

  function handleSelectAnswer(value: string) {
    const newAnswers = { ...answers, [question.id]: value };
    setAnswers(newAnswers);
    setValidationError("");

    setTimeout(() => {
      advanceToNext(newAnswers);
    }, 150);
  }

  function handleMultiSelect(value: string) {
    const current = (answers[question.id] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setAnswers({ ...answers, [question.id]: updated });
    setValidationError("");
  }

  function handleTextSubmit() {
    if (question.required && !textInput.trim()) {
      setValidationError("This field is required.");
      return;
    }
    const newAnswers = { ...answers, [question.id]: textInput.trim() };
    setAnswers(newAnswers);
    setTextInput("");
    setValidationError("");
    advanceToNext(newAnswers);
  }

  function advanceToNext(currentAnswers: Record<string, string | string[]>) {
    let nextQ = currentQ + 1;
    while (nextQ < totalQuestions) {
      if (shouldShowQuestion(QUESTIONS[nextQ])) break;
      nextQ++;
    }
    if (nextQ >= totalQuestions) {
      handleSubmit(currentAnswers);
    } else {
      setCurrentQ(nextQ);
      // Pre-fill text input if answer exists
      const nextAnswer = currentAnswers[QUESTIONS[nextQ].id];
      if (QUESTIONS[nextQ].type === "text" && typeof nextAnswer === "string") {
        setTextInput(nextAnswer);
      } else {
        setTextInput("");
      }
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    let prevQ = currentQ - 1;
    while (prevQ >= 0) {
      if (shouldShowQuestion(QUESTIONS[prevQ])) break;
      prevQ--;
    }
    if (prevQ >= 0) {
      setCurrentQ(prevQ);
      const prevAnswer = answers[QUESTIONS[prevQ].id];
      if (QUESTIONS[prevQ].type === "text" && typeof prevAnswer === "string") {
        setTextInput(prevAnswer);
      } else {
        setTextInput("");
      }
    }
  }

  async function handleSubmit(finalAnswers: Record<string, string | string[]>) {
    setPhase("analyzing");
    setAnalysisError(null);

    try {
      const result = await submitAssessment.mutateAsync({
        answers: finalAnswers,
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
      });
      setAnalysisResult(result.analysis);
      setPhase("results");
    } catch (err: any) {
      console.error("Assessment submission failed:", err);
      setAnalysisError(
        "Something went wrong generating your analysis. Please try again."
      );
      setPhase("results");
    }
  }

  // ─── Intro Screen ────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-black/10">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
            <a
              href="/"
              className="font-heading font-bold text-sm tracking-[0.2em] uppercase"
            >
              ML
            </a>
            <span className="text-[10px] tracking-[0.2em] uppercase text-black/40">
              Performance Assessment
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 py-16">
          <div className="max-w-2xl w-full">
            <div className="w-3 h-3 bg-[#E53935] mb-8" aria-hidden="true" />
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-tight leading-[0.95] mb-6">
              Performance
              <br />
              Assessment
            </h1>
            <div className="w-16 h-[2px] bg-black mb-8" aria-hidden="true" />
            <p className="text-lg sm:text-xl text-black/60 leading-relaxed mb-4 max-w-xl">
              This questionnaire helps you reflect on your recent sleep, stress,
              energy, training and recovery habits. It can support a coaching
              conversation and help identify areas to discuss.
            </p>
            <p className="text-base text-black/40 leading-relaxed mb-4 max-w-xl">
              It takes about five minutes. At the end, you will receive a
              summary based on your responses, lifestyle and goals.
            </p>
            <p className="text-base text-black/40 leading-relaxed mb-10 max-w-xl font-medium">
              This is a coaching tool, not a medical assessment. Your responses
              and any wearable data are indicative only and should be considered
              in your personal context. For persistent fatigue, pain, sleep
              concerns or other health concerns, speak with a GP or appropriate
              clinician.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={() => setPhase("quiz")}
                className="bg-black text-white px-8 py-4 text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#E53935] transition-colors"
              >
                Start the Assessment
              </button>
              <a
                href="/"
                className="border border-black/20 px-8 py-4 text-xs tracking-[0.15em] uppercase font-bold text-black/60 hover:text-black hover:border-black transition-colors text-center"
              >
                Back to Site
              </a>
            </div>

            {/* Section preview */}
            <div className="border-t border-black/10 pt-8">
              <p className="text-[10px] tracking-[0.2em] uppercase text-black/30 mb-6">
                What we'll cover
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {SECTIONS.map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-black/30">{s.icon}</span>
                    <span className="text-xs text-black/50">{s.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Analyzing Screen ────────────────────────────────
  if (phase === "analyzing") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-black/10">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
            <a
              href="/"
              className="font-heading font-bold text-sm tracking-[0.2em] uppercase"
            >
              ML
            </a>
            <span className="text-[10px] tracking-[0.2em] uppercase text-black/40">
              Analysing Your Results
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 py-16">
          <div className="max-w-lg w-full text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#E53935] mx-auto mb-8" />
            <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-4">
              Building Your Analysis
            </h2>
            <p className="text-base text-black/50 leading-relaxed mb-6">
              Our AI is reviewing your answers and generating a personalised
              performance report. This takes about 15 to 30 seconds.
            </p>
            <div className="flex flex-col gap-2 text-left max-w-sm mx-auto">
              {[
                "Analysing sleep patterns",
                "Evaluating stress profile",
                "Reviewing training history",
                "Assessing recovery capacity",
                "Generating protocols",
              ].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 2, duration: 0.3 }}
                  className="flex items-center gap-3 text-sm text-black/40"
                >
                  <div className="w-1.5 h-1.5 bg-[#E53935] rounded-full" />
                  {step}
                </motion.div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Results Screen ───────────────────────────────────
  if (phase === "results") {
    const userName = (answers["name"] as string) || "there";
    const hasWhoop = answers["has-whoop"] as string;

    // Calculate scores for the visual breakdown
    const scoredCategories = SECTIONS.filter(
      s => !["personal", "goals"].includes(s.id)
    ).map(s => {
      const sectionQuestions = QUESTIONS.filter(
        q => q.section === s.id && q.options?.some(o => o.score !== undefined)
      );
      let totalScore = 0;
      let maxScore = 0;
      for (const q of sectionQuestions) {
        const answer = answers[q.id];
        const selectedOption = q.options?.find(o => o.value === answer);
        if (selectedOption?.score !== undefined) {
          totalScore += selectedOption.score;
          maxScore += 5;
        }
      }
      const percentage =
        maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
      return { ...s, percentage, totalScore, maxScore };
    });

    const overallScore = scoredCategories.reduce(
      (sum, c) => sum + c.totalScore,
      0
    );
    const overallMax = scoredCategories.reduce((sum, c) => sum + c.maxScore, 0);
    const overallPct =
      overallMax > 0 ? Math.round((overallScore / overallMax) * 100) : 0;

    // Get score level label
    const getScoreLabel = (pct: number) => {
      if (pct >= 80)
        return { label: "More consistent responses", color: "#16a34a" };
      if (pct >= 60)
        return { label: "Some consistent responses", color: "#2563eb" };
      if (pct >= 40) return { label: "Mixed responses", color: "#f59e0b" };
      return { label: "Areas to review", color: "#E53935" };
    };

    const overallLabel = getScoreLabel(overallPct);
    const weakest = [...scoredCategories].sort(
      (a, b) => a.percentage - b.percentage
    )[0];
    const strongest = [...scoredCategories].sort(
      (a, b) => b.percentage - a.percentage
    )[0];

    // Radar chart calculations
    const radarSize = 280;
    const radarCenter = radarSize / 2;
    const radarRadius = 110;
    const radarLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    const numAxes = scoredCategories.length;
    const angleStep = (2 * Math.PI) / numAxes;
    const startAngle = -Math.PI / 2; // Start from top

    const getRadarPoint = (index: number, value: number) => {
      const angle = startAngle + index * angleStep;
      const r = radarRadius * value;
      return {
        x: radarCenter + r * Math.cos(angle),
        y: radarCenter + r * Math.sin(angle),
      };
    };

    const radarPoints = scoredCategories.map((cat, i) =>
      getRadarPoint(i, cat.percentage / 100)
    );
    const radarPath =
      radarPoints
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ") + " Z";

    return (
      <div className="min-h-screen bg-white flex flex-col" ref={containerRef}>
        <header className="border-b border-black/10">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
            <a
              href="/"
              className="font-heading font-bold text-sm tracking-[0.2em] uppercase"
            >
              ML
            </a>
            <span className="text-[10px] tracking-[0.2em] uppercase text-black/40">
              Your Results
            </span>
          </div>
        </header>

        <main className="flex-1 px-5 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto">
            {/* ── HERO: Overall Score Ring ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <div
                className="w-3 h-3 bg-[#E53935] mx-auto mb-8"
                aria-hidden="true"
              />
              <h2 className="font-heading text-xl sm:text-2xl font-bold uppercase tracking-tight mb-8 text-black/40">
                {userName}'s Performance Profile
              </h2>

              {/* Circular Score Gauge */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto mb-6">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="#f0f0f0"
                    strokeWidth="12"
                  />
                  {/* Score arc */}
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke={overallLabel.color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 85}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 85 * (1 - overallPct / 100),
                    }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    className="font-heading text-5xl sm:text-6xl font-bold leading-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {overallPct}
                  </motion.span>
                  <span className="text-xs text-black/30 uppercase tracking-widest mt-1">
                    out of 100
                  </span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em]"
                style={{
                  backgroundColor: overallLabel.color + "15",
                  color: overallLabel.color,
                }}
              >
                {overallLabel.label}
              </motion.div>
            </motion.div>

            {/* ── SHARE YOUR RESULTS ── */}
            <ShareResults
              userName={userName}
              overallPct={overallPct}
              strongest={strongest}
              weakest={weakest}
            />

            {/* ── RADAR CHART + QUICK STATS ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-2 gap-8 mb-16"
            >
              {/* Radar Chart */}
              <div className="bg-[#FAFAFA] border border-black/10 p-6 sm:p-8 flex flex-col items-center">
                <h3 className="text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-6 self-start">
                  Performance Radar
                </h3>
                <svg
                  viewBox={`0 0 ${radarSize} ${radarSize}`}
                  className="w-full max-w-[280px]"
                >
                  {/* Grid levels */}
                  {radarLevels.map((level, li) => {
                    const levelPoints = scoredCategories.map((_, i) =>
                      getRadarPoint(i, level)
                    );
                    const levelPath =
                      levelPoints
                        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                        .join(" ") + " Z";
                    return (
                      <path
                        key={li}
                        d={levelPath}
                        fill="none"
                        stroke="#e5e5e5"
                        strokeWidth="0.5"
                      />
                    );
                  })}
                  {/* Axis lines */}
                  {scoredCategories.map((_, i) => {
                    const endPoint = getRadarPoint(i, 1);
                    return (
                      <line
                        key={i}
                        x1={radarCenter}
                        y1={radarCenter}
                        x2={endPoint.x}
                        y2={endPoint.y}
                        stroke="#e5e5e5"
                        strokeWidth="0.5"
                      />
                    );
                  })}
                  {/* Data polygon */}
                  <motion.path
                    d={radarPath}
                    fill="rgba(229, 57, 53, 0.15)"
                    stroke="#E53935"
                    strokeWidth="2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                  {/* Data points */}
                  {radarPoints.map((p, i) => (
                    <motion.circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="#E53935"
                      initial={{ opacity: 0, r: 0 }}
                      animate={{ opacity: 1, r: 4 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                    />
                  ))}
                  {/* Labels */}
                  {scoredCategories.map((cat, i) => {
                    const labelPoint = getRadarPoint(i, 1.22);
                    return (
                      <text
                        key={i}
                        x={labelPoint.x}
                        y={labelPoint.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[9px] uppercase tracking-wider"
                        fill="#666"
                      >
                        {cat.title}
                      </text>
                    );
                  })}
                </svg>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-col gap-4">
                {/* Strongest */}
                <div className="bg-green-50 border border-green-200 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-[10px] tracking-[0.2em] uppercase text-green-600 font-medium">
                      Strongest Area
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">{strongest?.icon}</span>
                      <span className="font-heading text-lg font-bold uppercase">
                        {strongest?.title}
                      </span>
                    </div>
                    <span className="font-heading text-2xl font-bold text-green-600">
                      {strongest?.percentage}%
                    </span>
                  </div>
                </div>

                {/* Weakest */}
                <div className="bg-red-50 border border-red-200 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-[#E53935] rounded-full" />
                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#E53935] font-medium">
                      Biggest Opportunity
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[#E53935]">{weakest?.icon}</span>
                      <span className="font-heading text-lg font-bold uppercase">
                        {weakest?.title}
                      </span>
                    </div>
                    <span className="font-heading text-2xl font-bold text-[#E53935]">
                      {weakest?.percentage}%
                    </span>
                  </div>
                </div>

                {/* Category mini gauges */}
                <div className="grid grid-cols-3 gap-3">
                  {scoredCategories.map((cat, i) => {
                    const catLabel = getScoreLabel(cat.percentage);
                    const circumference = 2 * Math.PI * 30;
                    return (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="bg-[#FAFAFA] border border-black/10 p-3 flex flex-col items-center"
                      >
                        <div className="relative w-16 h-16 mb-2">
                          <svg
                            viewBox="0 0 70 70"
                            className="w-full h-full -rotate-90"
                          >
                            <circle
                              cx="35"
                              cy="35"
                              r="30"
                              fill="none"
                              stroke="#f0f0f0"
                              strokeWidth="5"
                            />
                            <motion.circle
                              cx="35"
                              cy="35"
                              r="30"
                              fill="none"
                              stroke={catLabel.color}
                              strokeWidth="5"
                              strokeLinecap="round"
                              strokeDasharray={`${circumference}`}
                              initial={{ strokeDashoffset: circumference }}
                              animate={{
                                strokeDashoffset:
                                  circumference * (1 - cat.percentage / 100),
                              }}
                              transition={{
                                duration: 1,
                                ease: "easeOut",
                                delay: 0.6 + i * 0.1,
                              }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-heading text-sm font-bold">
                              {cat.percentage}
                            </span>
                          </div>
                        </div>
                        <span className="text-[8px] tracking-[0.1em] uppercase text-black/40 font-medium text-center leading-tight">
                          {cat.title}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* ── BIOMETRICS: HRV / RHR / RESPIRATORY RATE ── */}
            {(() => {
              const hrvVal = Number(answers["hrv"] || 0);
              const rhrVal = Number(answers["resting-heart-rate"] || 0);
              const rrVal = Number(answers["respiratory-rate"] || 0);
              const hasBiometrics = hrvVal > 0 || rhrVal > 0 || rrVal > 0;
              if (!hasBiometrics) return null;

              const getHRVRating = (_v: number) => ({
                label: "Indicative reading",
                color: "#2563eb",
                desc: "Use this reading as one data point alongside your own recent trend, sleep, symptoms and training load. A single reading does not indicate health, fitness or a diagnosis.",
                pct: 50,
              });
              const getRHRRating = (_v: number) => ({
                label: "Indicative reading",
                color: "#2563eb",
                desc: "Compare readings taken with the same device and method over time. A single reading does not establish a health or fitness rating and is not a diagnosis.",
                pct: 50,
              });
              const getRRRating = (_v: number) => ({
                label: "Indicative reading",
                color: "#2563eb",
                desc: "Compare this estimate with your usual device-consistent trend. Wearable respiratory readings are not diagnostic and should not be used as a stand-alone health assessment.",
                pct: 50,
              });

              const metrics = [
                ...(hrvVal > 0
                  ? [
                      {
                        id: "hrv",
                        label: "HRV",
                        value: hrvVal,
                        unit: "ms",
                        rating: getHRVRating(hrvVal),
                        why: "Heart rate variability is the variation in time between heartbeats. Wearable methods differ, so the most useful comparison is your own trend using the same device and method.",
                      },
                    ]
                  : []),
                ...(rhrVal > 0
                  ? [
                      {
                        id: "rhr",
                        label: "Resting Heart Rate",
                        value: rhrVal,
                        unit: "bpm",
                        rating: getRHRRating(rhrVal),
                        why: "Resting heart rate can vary with device method, sleep, stress, recent activity, illness and other personal factors. Compare it with your own device-consistent baseline.",
                      },
                    ]
                  : []),
                ...(rrVal > 0
                  ? [
                      {
                        id: "rr",
                        label: "Respiratory Rate",
                        value: rrVal,
                        unit: "br/min",
                        rating: getRRRating(rrVal),
                        why: "A wearable estimate of sleeping respiratory rate can vary by device and context. Look for changes from your personal baseline rather than universal cut-offs.",
                      },
                    ]
                  : []),
              ];

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="border-t border-black/10 pt-12 mb-16"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-[#E53935]" />
                    <h3 className="text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium">
                      Your Biometrics
                    </h3>
                  </div>
                  <p className="text-sm text-black/40 mb-3">
                    Indicative readings from your wearable
                  </p>
                  <p className="text-xs text-black/50 leading-relaxed mb-8 max-w-2xl">
                    Wearable data are estimates for coaching context, not
                    medical tests or diagnoses. Compare readings from the same
                    device and method with your personal baseline. For
                    persistent fatigue, pain, sleep concerns or any health
                    concern, speak with a GP or appropriate clinician.
                  </p>

                  <div className="grid gap-6">
                    {metrics.map((m, mi) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + mi * 0.1 }}
                        className="border border-black/10 bg-[#FAFAFA]"
                      >
                        <div className="p-5 sm:p-6 grid sm:grid-cols-[200px_1fr] gap-6">
                          {/* Value display */}
                          <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-[9px] tracking-[0.15em] uppercase text-black/30 font-medium mb-2">
                              {m.label}
                            </span>
                            <div className="relative w-28 h-28 mb-2">
                              <svg
                                viewBox="0 0 120 120"
                                className="w-full h-full -rotate-90"
                              >
                                <circle
                                  cx="60"
                                  cy="60"
                                  r="50"
                                  fill="none"
                                  stroke="#f0f0f0"
                                  strokeWidth="8"
                                />
                                <motion.circle
                                  cx="60"
                                  cy="60"
                                  r="50"
                                  fill="none"
                                  stroke={m.rating.color}
                                  strokeWidth="8"
                                  strokeLinecap="round"
                                  strokeDasharray={`${2 * Math.PI * 50}`}
                                  initial={{
                                    strokeDashoffset: 2 * Math.PI * 50,
                                  }}
                                  animate={{
                                    strokeDashoffset:
                                      2 *
                                      Math.PI *
                                      50 *
                                      (1 - m.rating.pct / 100),
                                  }}
                                  transition={{
                                    duration: 1,
                                    delay: 0.8 + mi * 0.15,
                                  }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="font-heading text-2xl font-bold">
                                  {m.value}
                                </span>
                                <span className="text-[9px] text-black/30 uppercase">
                                  {m.unit}
                                </span>
                              </div>
                            </div>
                            <span
                              className="text-[9px] uppercase tracking-wider font-bold px-3 py-1"
                              style={{
                                backgroundColor: m.rating.color + "15",
                                color: m.rating.color,
                              }}
                            >
                              {m.rating.label}
                            </span>
                          </div>

                          {/* Education */}
                          <div className="flex flex-col gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="w-3.5 h-3.5 text-black/30" />
                                <span className="text-[9px] tracking-[0.15em] uppercase text-black/30 font-medium">
                                  Why This Matters
                                </span>
                              </div>
                              <p className="text-xs text-black/50 leading-relaxed">
                                {m.why}
                              </p>
                            </div>
                            <div className="bg-white border border-black/5 p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="w-3.5 h-3.5 text-[#E53935]" />
                                <span className="text-[9px] tracking-[0.15em] uppercase text-[#E53935] font-bold">
                                  Your Reading
                                </span>
                              </div>
                              <p className="text-xs text-black/60 leading-relaxed">
                                {m.rating.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })()}

            {/* ── CATEGORY DETAIL CARDS WITH GRAPHS & PRO TIPS ── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="border-t border-black/10 pt-12 mb-16"
            >
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-8">
                Detailed Breakdown
              </h3>
              <div className="space-y-8">
                {scoredCategories.map((cat, i) => {
                  const catLabel = getScoreLabel(cat.percentage);
                  const proTips: Record<
                    string,
                    { tip: string; context: string; graph: number[] }
                  > = {
                    sleep: {
                      tip: "Consider a regular wind-down routine and note what helps your sleep feel more settled. Persistent sleep concerns are best discussed with a clinician.",
                      context:
                        "Use your recent routines and experience as context, not a universal sleep target.",
                      graph: [40, 55, 65, 75, 85, 100],
                    },
                    stress: {
                      tip: "Choose a short, practical way to pause during the day, such as a walk, breathing practice or a conversation with someone you trust.",
                      context:
                        "Stress responses are individual and should be considered alongside your circumstances.",
                      graph: [30, 45, 55, 60, 70, 85],
                    },
                    training: {
                      tip: "Build training gradually and choose a routine you can sustain. Adjust it around your experience, schedule and any clinician or allied health advice.",
                      context:
                        "The score reflects your answers, not a universal training standard.",
                      graph: [20, 40, 55, 70, 80, 95],
                    },
                    injuries: {
                      tip: "Do not train through pain that persists or affects movement. Seek guidance from an appropriate clinician or allied health professional before changing activity around an injury.",
                      context:
                        "This is coaching context only, not injury assessment or diagnosis.",
                      graph: [50, 55, 60, 70, 80, 90],
                    },
                    nutrition: {
                      tip: "Focus on a regular eating pattern that suits your training, preferences and daily life. For individual nutrition care, speak with an accredited practising dietitian.",
                      context:
                        "Nutrition needs are individual and are not set by this score.",
                      graph: [25, 40, 55, 65, 80, 95],
                    },
                    recovery: {
                      tip: "Use regular check-ins on sleep, symptoms, training load and device-consistent trends when planning recovery. Wearable data are one input, not a decision-maker.",
                      context:
                        "Your personal trend is more relevant than a universal wearable threshold.",
                      graph: [35, 45, 55, 65, 80, 95],
                    },
                  };
                  const catTip = proTips[cat.id] || {
                    tip: "Focus on a small, practical habit that fits your current routine.",
                    context:
                      "This score summarises your answers and is not a health benchmark.",
                    graph: [30, 45, 55, 65, 75, 90],
                  };
                  const barLabels = ["", "", "", "", "", ""];

                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.08 }}
                      className="border border-black/10 bg-[#FAFAFA]"
                    >
                      {/* Header */}
                      <div className="p-5 sm:p-6 border-b border-black/5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span style={{ color: cat.color }}>{cat.icon}</span>
                            <span className="font-heading text-sm font-bold uppercase tracking-[0.05em]">
                              {cat.title}
                            </span>
                            <span
                              className="text-[9px] uppercase tracking-wider font-medium px-2 py-0.5"
                              style={{
                                backgroundColor: catLabel.color + "15",
                                color: catLabel.color,
                              }}
                            >
                              {catLabel.label}
                            </span>
                          </div>
                          <span className="font-heading text-2xl font-bold">
                            {cat.percentage}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-black/5 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: cat.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.percentage}%` }}
                            transition={{
                              duration: 0.8,
                              ease: "easeOut",
                              delay: 0.8 + i * 0.08,
                            }}
                          />
                        </div>
                      </div>

                      {/* Graph + Pro Tip */}
                      <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-6">
                        {/* Mini Bar Chart */}
                        <div>
                          <p className="text-[9px] tracking-[0.15em] uppercase text-black/30 font-medium mb-3">
                            Where You Stand
                          </p>
                          <div className="flex items-end gap-1.5 h-24">
                            {catTip.graph.map((val, gi) => {
                              const isYou =
                                gi ===
                                Math.min(Math.floor(cat.percentage / 20), 5);
                              return (
                                <div
                                  key={gi}
                                  className="flex-1 flex flex-col items-center gap-1"
                                >
                                  <motion.div
                                    className={`w-full rounded-sm ${isYou ? "bg-[#E53935]" : "bg-black/10"}`}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${val}%` }}
                                    transition={{
                                      duration: 0.6,
                                      delay: 1 + gi * 0.05,
                                    }}
                                  />
                                  {isYou && (
                                    <span className="text-[8px] font-bold text-[#E53935] uppercase">
                                      You
                                    </span>
                                  )}
                                  {!isYou && barLabels[gi] && (
                                    <span className="text-[7px] text-black/20 uppercase">
                                      {barLabels[gi]}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-[8px] text-black/25 mt-2 italic">
                            {catTip.context}
                          </p>
                        </div>

                        {/* Pro Tip */}
                        <div className="bg-white border border-black/5 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-3.5 h-3.5 text-[#E53935]" />
                            <span className="text-[9px] tracking-[0.15em] uppercase text-[#E53935] font-bold">
                              Pro Tip
                            </span>
                          </div>
                          <p className="text-xs text-black/60 leading-relaxed">
                            {catTip.tip}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Wearable note */}
            {hasWhoop === "no" && (
              <div className="bg-[#FAFAFA] border border-black/10 p-6 sm:p-8 mb-16">
                <p className="text-sm text-black/60 leading-relaxed">
                  If you use a wearable, its device-consistent trend can be one
                  input alongside sleep, symptoms and training load. It does not
                  make decisions on its own.
                </p>
              </div>
            )}

            {/* AI Analysis - Collapsible */}
            <AnalysisSection
              analysisResult={analysisResult}
              analysisError={analysisError}
            />

            {/* ── This Is Where Most People Stop ── */}
            <div className="border-t border-black/10 pt-12 mb-16">
              <div className="bg-black text-white p-8 sm:p-12">
                <div className="max-w-2xl">
                  <h3 className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-medium mb-4">
                    What Happens Next
                  </h3>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-6 leading-tight">
                    This Is Where Most People Stop
                  </h2>
                  <div className="w-8 h-0.5 bg-[#E53935] mb-8" />
                  <p className="text-sm sm:text-base text-white/60 leading-relaxed mb-6">
                    You have the data. You know what is holding you back. The
                    difference between knowing and doing is having someone build
                    the system for you and hold you accountable to it.
                  </p>
                  <p className="text-sm sm:text-base text-white/60 leading-relaxed mb-8">
                    Coaching is shaped around your assessment responses,
                    training history and day-to-day context. It does not
                    diagnose, treat or replace medical, allied health or
                    dietetic care.
                  </p>

                  {/* What You Get */}
                  <div className="border-t border-white/10 pt-8 mb-8">
                    <h4 className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-medium mb-5">
                      What You Get
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        "Periodised training program built from your data",
                        "Sleep and recovery planning guidance",
                        "Nutrition framework aligned to your goals",
                        "Weekly coaching and program adjustments",
                        "Wearable data analysis (WHOOP, Oura, etc.)",
                        "Direct access to your coach",
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-[#E53935] shrink-0 mt-0.5" />
                          <span className="text-sm text-white/70">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <a
                    href={`/apply?name=${encodeURIComponent((answers.name as string) || "")}&email=${encodeURIComponent((answers.email as string) || "")}${utmSource ? `&utm_source=${encodeURIComponent(utmSource)}` : ""}${utmMedium ? `&utm_medium=${encodeURIComponent(utmMedium)}` : ""}${utmCampaign ? `&utm_campaign=${encodeURIComponent(utmCampaign)}` : ""}`}
                    className="inline-flex items-center gap-2 bg-[#E53935] text-white px-10 py-4 text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#c62828] transition-colors mb-4"
                  >
                    Apply for Coaching
                  </a>
                  <p className="text-xs text-white/40 mb-8">
                    Short application. Each application is reviewed personally.
                  </p>

                  {/* Pricing */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading text-2xl font-bold text-white">
                        $2,400
                      </span>
                      <span className="text-sm text-white/40">/month</span>
                    </div>
                    <p className="text-xs text-white/30 mt-2">
                      Limited spots available. Application required.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to site */}
            <div className="border-t border-black/10 pt-8 text-center">
              <a
                href="/"
                className="text-xs tracking-[0.1em] uppercase text-black/40 hover:text-black transition-colors"
              >
                Back to Site
              </a>
            </div>
          </div>
        </main>

        <footer className="border-t border-black/10 py-6 mt-16">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
            <p className="text-[10px] tracking-[0.15em] uppercase text-black/30">
              Marin Lazic. Health and Performance Coach. Sydney, Australia.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // ─── Quiz Screen ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col" ref={containerRef}>
      <header className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <a
            href="/"
            className="font-heading font-bold text-sm tracking-[0.2em] uppercase"
          >
            ML
          </a>
          <div className="flex items-center gap-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-black/40">
              {currentQ + 1} / {totalQuestions}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-0.5 bg-black/5">
          <motion.div
            className="h-full bg-[#E53935]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12 sm:py-16">
        <div className="max-w-2xl w-full">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={question.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              layout
            >
              {/* Section header - synced with current question */}
              {isNewSection && section && (
                <div className="border border-black/10 bg-[#FAFAFA] px-4 py-3 mb-6 flex items-center gap-3">
                  <span style={{ color: section.color }}>{section.icon}</span>
                  <div>
                    <span className="text-xs font-bold tracking-[0.1em] uppercase">
                      {section.title}
                    </span>
                    <span className="text-[10px] text-black/40 block">
                      {section.subtitle}
                    </span>
                  </div>
                  <span className="ml-auto text-[10px] tracking-[0.1em] uppercase text-black/30">
                    Section {currentSectionIndex + 1} of {SECTIONS.length}
                  </span>
                </div>
              )}

              {/* Category badge */}
              <div className="flex items-center gap-2 mb-6">
                <span style={{ color: getSectionColor(sectionId) }}>
                  {getSectionIcon(sectionId)}
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium">
                  {section?.title}
                </span>
              </div>

              {/* Question */}
              <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight leading-tight mb-2">
                {question.text}
              </h2>
              <p className="text-sm text-black/40 mb-10">{question.subtext}</p>

              {/* ── Select / Single Choice ── */}
              {(question.type === "select" || question.type === "single") &&
                question.options && (
                  <div className="space-y-3">
                    {question.options.map(opt => {
                      const isSelected = answers[question.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleSelectAnswer(opt.value)}
                          className={`w-full text-left border px-5 py-4 transition-all duration-200 group flex items-center justify-between ${
                            isSelected
                              ? "border-black bg-black text-white"
                              : "border-black/15 hover:border-black/40"
                          }`}
                        >
                          <div>
                            <span
                              className={`text-sm font-medium ${isSelected ? "text-white" : "text-black"}`}
                            >
                              {opt.label}
                            </span>
                            {opt.description && (
                              <span
                                className={`block text-xs mt-0.5 ${isSelected ? "text-white/60" : "text-black/30"}`}
                              >
                                {opt.description}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-white shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

              {/* ── Multi Select ── */}
              {question.type === "multi" && question.options && (
                <>
                  <div className="space-y-3 mb-6">
                    {question.options.map(opt => {
                      const selected = (
                        (answers[question.id] as string[]) || []
                      ).includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleMultiSelect(opt.value)}
                          className={`w-full text-left border px-5 py-4 transition-all duration-200 flex items-center justify-between ${
                            selected
                              ? "border-black bg-black text-white"
                              : "border-black/15 hover:border-black/40"
                          }`}
                        >
                          <span
                            className={`text-sm font-medium ${selected ? "text-white" : "text-black"}`}
                          >
                            {opt.label}
                          </span>
                          {selected && (
                            <CheckCircle className="w-4 h-4 text-white shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => advanceToNext(answers)}
                    disabled={
                      !answers[question.id] ||
                      (answers[question.id] as string[]).length === 0
                    }
                    className="bg-black text-white px-8 py-3 min-h-[44px] text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#E53935] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Continue <ArrowRight className="w-3 h-3 inline ml-2" />
                  </button>
                </>
              )}

              {/* ── Number Input ── */}
              {question.type === "number" && (
                <div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={textInput}
                    onChange={e => {
                      setTextInput(e.target.value);
                      setValidationError("");
                    }}
                    placeholder={question.placeholder}
                    className="w-full border border-black/20 px-5 py-4 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-black/30 mb-4"
                    onKeyDown={e => {
                      if (e.key === "Enter") handleTextSubmit();
                    }}
                  />
                  {validationError && (
                    <p className="text-[#E53935] text-xs mb-4 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationError}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleTextSubmit}
                      className="bg-black text-white px-8 py-3 min-h-[44px] text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#E53935] transition-colors"
                    >
                      Continue <ArrowRight className="w-3 h-3 inline ml-2" />
                    </button>
                    <button
                      onClick={() => {
                        setTextInput("");
                        advanceToNext({ ...answers, [question.id]: "0" });
                      }}
                      className="border border-black/20 px-6 py-3 min-h-[44px] text-xs tracking-[0.1em] uppercase text-black/40 hover:text-black hover:border-black transition-colors"
                    >
                      I don't know
                    </button>
                  </div>
                </div>
              )}

              {/* ── Text Input ── */}
              {question.type === "text" && (
                <div>
                  {question.id === "email" ? (
                    <input
                      type="email"
                      value={textInput}
                      onChange={e => {
                        setTextInput(e.target.value);
                        setValidationError("");
                      }}
                      placeholder={question.placeholder}
                      className="w-full border border-black/20 px-5 py-4 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-black/30 mb-4"
                      onKeyDown={e => {
                        if (e.key === "Enter") handleTextSubmit();
                      }}
                    />
                  ) : (
                    <textarea
                      value={textInput}
                      onChange={e => {
                        setTextInput(e.target.value);
                        setValidationError("");
                      }}
                      placeholder={question.placeholder}
                      rows={question.required ? 2 : 4}
                      className="w-full border border-black/20 px-5 py-4 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-black/30 mb-4 resize-none"
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleTextSubmit();
                        }
                      }}
                    />
                  )}
                  {validationError && (
                    <p className="text-[#E53935] text-xs mb-4 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationError}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleTextSubmit}
                      className="bg-black text-white px-8 py-3 min-h-[44px] text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#E53935] transition-colors"
                    >
                      Continue <ArrowRight className="w-3 h-3 inline ml-2" />
                    </button>
                    {!question.required && (
                      <button
                        onClick={() => {
                          setTextInput("");
                          advanceToNext({ ...answers, [question.id]: "" });
                        }}
                        className="border border-black/20 px-6 py-3 min-h-[44px] text-xs tracking-[0.1em] uppercase text-black/40 hover:text-black hover:border-black transition-colors"
                      >
                        Skip
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-black/10">
                <button
                  onClick={handleBack}
                  disabled={currentQ === 0}
                  className="flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-black/40 hover:text-black transition-colors disabled:opacity-20 disabled:cursor-not-allowed min-h-[44px] px-3"
                >
                  <ArrowLeft className="w-3 h-3" /> Previous
                </button>
                <a
                  href="/"
                  className="text-xs tracking-[0.1em] uppercase text-black/30 hover:text-black/60 transition-colors min-h-[44px] flex items-center px-3"
                >
                  Exit
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
