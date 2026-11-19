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
  Share2,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";
import { CallRequest, scoreContext } from "@/components/CallRequest";
import { QuickStart, takeQuickStart } from "@/components/QuickStart";
import { useSearch } from "wouter";
import { getCampaignValue } from "@/lib/attribution";
import {
  BASE_QUESTION_COUNT,
  QUESTIONS,
  isQuestionShown,
  isValidEmail,
  calculateScores,
  getScoreBand as scoreBandOf,
  type Question,
  type Option,
} from "@shared/assessment";
import { SHOW_PROGRAM_PRICES, findProgram, programLength, programPath } from "@shared/programs";
import { AREA_TIPS, STRENGTH_FROM, STRENGTH_LINE } from "@/data/areaTips";

// ─── Types ──────────────────────────────────────────────
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
    id: "start",
    title: "Quick start",
    subtitle: "Three taps. No email needed yet.",
    icon: <Zap className="w-5 h-5" />,
    color: "#FF5A36",
  },
  {
    id: "personal",
    title: "About You",
    subtitle: "A few details to put your responses in context",
    icon: <User className="w-5 h-5" />,
    color: "#FF5A36",
  },
  {
    id: "sleep",
    title: "Sleep",
    subtitle: "Your recent sleep habits and experience",
    icon: <Moon className="w-5 h-5" />,
    color: "#FF5A36",
  },
  {
    id: "stress",
    title: "Stress & Mental",
    subtitle: "Your workload, stress and focus",
    icon: <Brain className="w-5 h-5" />,
    color: "#FF5A36",
  },
  {
    id: "training",
    title: "Current Training",
    subtitle: "What you are doing now",
    icon: <Dumbbell className="w-5 h-5" />,
    color: "#FF5A36",
  },
  {
    id: "injuries",
    title: "Injuries & Health",
    subtitle: "Health and pain considerations for training",
    icon: <Heart className="w-5 h-5" />,
    color: "#FF5A36",
  },
  {
    id: "nutrition",
    title: "Nutrition & Energy",
    subtitle: "Your current eating and energy patterns",
    icon: <Utensils className="w-5 h-5" />,
    color: "#FF5A36",
  },
  {
    id: "recovery",
    title: "Recovery & Technology",
    subtitle: "How you recover and what you track",
    icon: <Watch className="w-5 h-5" />,
    color: "#FF5A36",
  },
];

// ─── Questions ──────────────────────────────────────────

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
      <div className="border border-line bg-ivory p-6 sm:p-8 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-black" />
            <h3 className="text-[13px] text-mute font-medium">
              Share Your Results
            </h3>
          </div>
          <button
            onClick={() => {
              if (!showPanel) track("share_panel_open", { score: overallPct });
              setShowPanel(!showPanel);
            }}
            className="text-[13px] text-black font-bold hover:text-[#c62828] transition-colors flex items-center gap-1.5"
          >
            {showPanel ? "Close" : "Share"}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showPanel ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <p className="text-sm text-mute leading-relaxed">
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
              <div className="mt-6 pt-6 border-t border-line">
                {/* Preview of what gets shared */}
                <div className="bg-ivory border border-line p-4 mb-6 rounded-lg">
                  <p className="text-[11px] text-mute font-medium mb-2">
                    Preview
                  </p>
                  <p className="text-sm text-body leading-relaxed">
                    {shareText}
                  </p>
                  <p className="text-xs text-black mt-2">{assessmentUrl}</p>
                </div>

                {/* Share buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* LinkedIn */}
                  <a
                    href={linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#0A66C2] text-white px-5 py-3.5 text-[13px] font-bold hover:bg-[#004182] transition-colors"
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
                    className="flex-1 flex items-center justify-center gap-2 bg-ink text-ivory rounded-lg hover:bg-[#3D3D3A] px-5 py-3.5 text-[15px] font-medium transition-colors"
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
                    className="flex-1 flex items-center justify-center gap-2 border-2 text-ink px-5 py-3.5 text-[15px] font-medium transition-colors bg-stone rounded-lg hover:bg-[#D9D5C9]"
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

// Turns **bold** inside a line of the written analysis into real bold text.
function inlineBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, k) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={k} className="text-ink font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

// ─── Collapsible Analysis Section ──────────────────────
export function AnalysisSection({
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
          className="font-heading text-[17px] font-bold tracking-[-0.01em] mt-6 mb-2"
        >
          {line.replace("### ", "")}
        </h3>
      );
    if (line.startsWith("## "))
      return (
        <h2
          key={i}
          className="font-heading text-xl font-bold tracking-[-0.01em] mt-8 mb-3"
        >
          {line.replace("## ", "")}
        </h2>
      );
    if (line.startsWith("# "))
      return (
        <h1
          key={i}
          className="font-heading text-2xl font-bold tracking-[-0.01em] mt-8 mb-3"
        >
          {line.replace("# ", "")}
        </h1>
      );
    if (line.startsWith("- **")) {
      const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
      if (match)
        return (
          <div key={i} className="flex items-start gap-3 mb-1.5">
            <span className="text-black mt-1 shrink-0 text-xs">&bull;</span>
            <p className="text-sm text-body leading-relaxed">
              <strong className="text-black">{match[1]}</strong>
              {match[2] ? <>: {inlineBold(match[2])}</> : ""}
            </p>
          </div>
        );
    }
    if (line.startsWith("- "))
      return (
        <div key={i} className="flex items-start gap-3 mb-1.5">
          <span className="text-black mt-1 shrink-0 text-xs">&bull;</span>
          <p className="text-sm text-body leading-relaxed">
            {inlineBold(line.replace("- ", ""))}
          </p>
        </div>
      );
    if (line.match(/^\d+\.\s/))
      return (
        <div key={i} className="flex items-start gap-3 mb-1.5">
          <span className="text-xs font-bold text-ink mt-0.5 shrink-0 w-4 text-right">
            {line.match(/^(\d+)\./)?.[1]}.
          </span>
          <p className="text-sm text-body leading-relaxed">
            {inlineBold(line.replace(/^\d+\.\s*/, ""))}
          </p>
        </div>
      );
    if (line.startsWith("> "))
      return (
        <blockquote key={i} className="border-l-2 border-ink pl-4 my-3">
          <p className="text-sm text-mute italic leading-relaxed">
            {inlineBold(line.replace("> ", ""))}
          </p>
        </blockquote>
      );
    return (
      <p key={i} className="text-sm text-body leading-relaxed mb-2">
        {inlineBold(line)}
      </p>
    );
  };

  if (analysisError) {
    return (
      <div className="border-t border-line pt-12 mb-16">
        <div className="bg-red-50 border border-red-200 p-6">
          <p className="text-sm text-red-600">{analysisError}</p>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="border-t border-line pt-12 mb-16">
        <div className="flex items-center gap-3 text-mute">
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
    <div className="border-t border-line pt-12 mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[13px] text-mute font-medium mb-1">
            Your Personalised Analysis
          </h3>
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[13px] text-black font-bold hover:text-[#c62828] transition-colors"
          >
            {expanded ? "Collapse" : "Read Full Analysis"}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      <div className="bg-ivory border border-line p-6 sm:p-8 rounded-lg">
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
                className="mt-4 flex items-center gap-2 text-[13px] text-black font-bold hover:text-[#c62828] transition-colors"
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

// The first question with no answer yet. Used when a quiz is resumed or carried over.
function firstUnanswered(answers: Record<string, string | string[]>) {
  const i = QUESTIONS.findIndex(q => {
    if (!isQuestionShown(q, answers)) return false;
    const a = answers[q.id];
    return a === undefined || a === "" || (Array.isArray(a) && a.length === 0);
  });
  return i === -1 ? QUESTIONS.length - 1 : i;
}

// Facts sent with a call request so the reply can start from the person's own result.
function callContext(answers: Record<string, string | string[]>) {
  const scores = calculateScores(answers);
  const label = (id: string) => {
    const q = QUESTIONS.find(x => x.id === id);
    return q?.options?.find(o => o.value === answers[id])?.label;
  };
  const role = label("occupation");
  const goal = label("primary-goal");
  const help = label("help-type");
  return [scoreContext(scores.overallPct, scores.categories), role ? `Role: ${role}.` : "", goal ? `Main goal: ${goal}.` : "", help ? `Help wanted: ${help}.` : ""]
    .filter(Boolean)
    .join(" ");
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
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [resumeToken, setResumeToken] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchString = useSearch();

  const submitAssessment = trpc.assessment.submit.useMutation();
  const saveProgress = trpc.assessment.saveProgress.useMutation();
  const { track } = useAnalytics();

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
      const saved = (resumedData.answers || {}) as Record<string, string | string[]>;
      setAnswers(saved);
      setCurrentQ(firstUnanswered(saved));
      setPhase("quiz");
      if (resumedData.answers?.name) {
        setTextInput("");
      }
    }
  }, [resumedData]);

  // Answers tapped on the home page carry straight into the quiz.
  useEffect(() => {
    if (resumeParam) return;
    const quick = takeQuickStart();
    if (!quick) return;
    setAnswers(quick);
    setCurrentQ(firstUnanswered(quick));
    setPhase("quiz");
    track("assessment_started", { via: "home_quick_start" });
  }, []);

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
          totalQuestions: QUESTIONS.filter(q => isQuestionShown(q, answers)).length,
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
  // What the person sees: only the questions they are asked.
  const shownQuestions = QUESTIONS.filter(q => isQuestionShown(q, answers));
  const shownTotal = shownQuestions.length;
  const shownIndex = Math.max(0, shownQuestions.findIndex(q => q.id === question?.id));
  const progress = ((shownIndex + 1) / shownTotal) * 100;
  const sectionId = question?.section || "";
  const section = SECTIONS.find(s => s.id === sectionId);

  // Check if we're at the start of a new section
  const isNewSection =
    currentQ === 0 || QUESTIONS[currentQ - 1]?.section !== sectionId;
  // The three tap start is not counted as a section, so the count matches the list on the start page.
  const QUIZ_SECTIONS = SECTIONS.filter(s => s.id !== "start");
  const currentSectionIndex = QUIZ_SECTIONS.findIndex(s => s.id === sectionId);

  // Visible questions (skip conditional ones where condition isn't met)
  function shouldShowQuestion(q: Question, current = answers): boolean {
    return isQuestionShown(q, current);
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
    if (question.id === "email" && !isValidEmail(textInput)) {
      setValidationError("That email does not look right. Check it and try again, your report is sent there.");
      return;
    }
    if (question.type === "number" && textInput.trim()) {
      const n = Number(textInput);
      const { min, max } = question;
      if (!Number.isFinite(n) || (min !== undefined && n < min) || (max !== undefined && n > max)) {
        setValidationError(`Enter a number between ${min} and ${max}, or tap I don't know.`);
        return;
      }
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
      if (shouldShowQuestion(QUESTIONS[nextQ], currentAnswers)) break;
      nextQ++;
    }
    track("assessment_question", { question: currentQ + 1, questionId: question.id });
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
      setReportUrl(result.reportUrl ?? null);
      track("assessment_completed", {
        score: result.scores?.overallPct,
        band: result.scores ? scoreBandOf(result.scores.overallPct) : undefined,
      });
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
      <div className="min-h-screen bg-ivory text-ink flex flex-col">
        <header>
          <div className="ml-wrap h-[68px] flex items-center justify-between">
            <a
              href="/"
              aria-label="Marin Lazic home"
              className="inline-flex items-center min-h-11 font-heading font-bold text-[20px] tracking-[-0.01em] text-ink no-underline"
            >
              Marin Lazic
            </a>
            <a href="/" className="ml-pill min-h-11">
              Back to site
            </a>
          </div>
        </header>

        <main className="flex-1 ml-wrap pt-6 lg:pt-12 pb-16">
          <div className="grid gap-9 lg:gap-[72px] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
            <div className="min-w-0">
              <div className="ml-meta">
                <span className="ml-tag">Free</span>
                <span>About 5 minutes</span>
              </div>
              <h1 className="font-heading font-bold text-[38px] sm:text-5xl lg:text-[64px] leading-[1.04] tracking-[-0.025em] mt-4">
                <span className="block font-sans font-semibold text-sm tracking-normal leading-normal text-mute mb-2">
                  Performance Assessment
                </span>
                See where you stand.
              </h1>
              <p className="ml-lede mt-5 max-w-xl">
                This questionnaire helps you reflect on your recent sleep, stress,
                energy, training and recovery habits. It can support a coaching
                conversation and help identify areas to discuss.
              </p>
              <p className="ml-lede mt-3 max-w-xl">
                It takes about five minutes. At the end, you will receive a
                summary based on your responses, lifestyle and goals.
              </p>
              <QuickStart
                placement="assessment"
                className="mt-7 max-w-xl"
                onDone={quick => {
                  track("assessment_started", { via: "assessment_page" });
                  setAnswers(quick);
                  setCurrentQ(firstUnanswered(quick));
                  setPhase("quiz");
                }}
              />
              <p className="ml-small mt-6 max-w-xl">
                This is a coaching tool, not a medical assessment. Your responses
                and any wearable data are indicative only and should be considered
                in your personal context. For persistent fatigue, pain, sleep
                concerns or other health concerns, speak with a GP or appropriate
                clinician. How your answers are used is on the{" "}
                <a href="/privacy" className="underline underline-offset-2">privacy page</a>.
              </p>
            </div>

            {/* Section preview */}
            <div className="bg-oat rounded-xl p-5 lg:p-8 min-w-0">
              <h2 className="font-heading font-bold text-sm">What we'll cover</h2>
              <div className="mt-3 border-b border-line">
                {SECTIONS.filter(s => s.id !== "start").map(s => (
                  <div key={s.id} className="flex items-center gap-3 py-3 border-t border-line text-[15px] font-medium">
                    <span className="text-mute" aria-hidden="true">{s.icon}</span>
                    <span>{s.title}</span>
                  </div>
                ))}
              </div>
              <p className="ml-small mt-3.5">{BASE_QUESTION_COUNT} questions, nearly all one tap. A score, a category breakdown and a personal report at the end.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Analyzing Screen ────────────────────────────────
  if (phase === "analyzing") {
    // The score needs no waiting: it is worked out from the answers on this device.
    const early = calculateScores(answers);
    return (
      <div className="min-h-screen bg-ivory flex flex-col">
        <header className="border-b border-line">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
            <a
              href="/"
              className="font-heading font-bold text-[20px] tracking-[-0.01em] text-ink no-underline"
            >
              Marin Lazic
            </a>
            <span className="text-[13px] text-mute">
              Analysing Your Results
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 py-16">
          <div className="max-w-lg w-full text-center">
            <p className="text-[13px] text-mute font-medium mb-2">Your score</p>
            <p className="font-heading text-6xl sm:text-7xl font-bold leading-none tracking-[-0.02em]">
              {early.overallPct}
              <span className="text-lg sm:text-xl text-mute font-medium tracking-normal"> out of 100</span>
            </p>
            {early.weakest && (
              <p className="text-base text-body mt-4">
                Lowest area: {early.weakest.name}, {early.weakest.percentage}%.
              </p>
            )}
            <div className="border-t border-line mt-8 pt-8">
              <Loader2 className="w-7 h-7 animate-spin text-black mx-auto mb-5" />
              <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight mb-3">
                Writing your report
              </h2>
              <p className="text-base text-mute leading-relaxed mb-6">
                This usually takes 20 to 45 seconds. Keep this page open. A copy
                goes to your email.
              </p>
            </div>
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
                  className="flex items-center gap-3 text-sm text-mute"
                >
                  <div className="w-1.5 h-1.5 bg-ink rounded-full rounded-full" />
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

    // Scores come from the shared scoring function so the screen, the PDF
    // and Kit all show the same numbers.
    const shared = calculateScores(answers);
    const scoredCategories = SECTIONS.filter(
      s => !["start", "personal"].includes(s.id)
    ).map(s => {
      const c = shared.categories.find(x => x.id === s.id);
      return {
        ...s,
        percentage: c?.percentage ?? 0,
        totalScore: c?.total ?? 0,
        maxScore: c?.max ?? 0,
      };
    });
    const overallPct = shared.overallPct;

    // Get score level label
    const getScoreLabel = (pct: number) => {
      if (pct >= 80)
        return { label: "More consistent responses", color: "#16a34a" };
      if (pct >= 60)
        return { label: "Some consistent responses", color: "#FF5A36" };
      if (pct >= 40) return { label: "Mixed responses", color: "#f59e0b" };
      return { label: "Areas to review", color: "#121212" };
    };

    const overallLabel = getScoreLabel(overallPct);
    const weakest = [...scoredCategories].sort(
      (a, b) => a.percentage - b.percentage
    )[0];
    const strongest = [...scoredCategories].sort(
      (a, b) => b.percentage - a.percentage
    )[0];

    // The next step depends on what the person told us. Ready to start: the
    // call leads. Still deciding: a program and the free guide lead, and the
    // call is offered after them.
    const commitment = answers["commitment"] as string;
    // What they said would suit them comes first: 1:1 gets the call, a
    // program gets the program. Otherwise it goes on how ready they are.
    const helpType = answers["help-type"] as string;
    const readyNow =
      helpType === "one-to-one" ||
      (helpType !== "program" && (commitment === "ready" || commitment === "all-in"));
    const occupation = answers["occupation"] as string;
    const matchedProgram =
      occupation === "athlete"
        ? undefined
        : findProgram(
            occupation === "executive" || occupation === "entrepreneur"
              ? "leader-performance-program"
              : "the-corporate-athlete"
          );
    const lowestTwo = [...scoredCategories]
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 2)
      .map(c => c.id);
    const shownAreas = showAllAreas
      ? scoredCategories
      : scoredCategories.filter(c => lowestTwo.includes(c.id));
    const applyHref = `/apply${utmSource || utmMedium || utmCampaign ? `?${[utmSource && `utm_source=${encodeURIComponent(utmSource)}`, utmMedium && `utm_medium=${encodeURIComponent(utmMedium)}`, utmCampaign && `utm_campaign=${encodeURIComponent(utmCampaign)}`].filter(Boolean).join("&")}` : ""}`;
    // Name and email travel to the Apply form in this browser tab, not in the web address.
    const carryToApply = () => {
      try {
        sessionStorage.setItem(
          "ml_apply_prefill",
          JSON.stringify({ name: answers.name || "", email: answers.email || "" })
        );
      } catch {
        /* the form simply starts empty */
      }
    };

    const programCard = (
      <div className="bg-oat rounded-xl p-5 lg:p-8 flex flex-col">
        <p className="text-[13px] text-mute font-medium mb-2">A program you follow on your phone</p>
        {matchedProgram ? (
          <>
            <h3 className="font-heading font-bold text-[22px] leading-tight tracking-[-0.01em]">
              {matchedProgram.name}
            </h3>
            <p className="text-[15px] leading-normal text-body mt-2">{matchedProgram.line}</p>
            <p className="text-[13px] text-mute mt-3">
              {programLength(matchedProgram)}
              {SHOW_PROGRAM_PRICES ? `. A$${matchedProgram.price}, one payment.` : ""}
            </p>
            <a
              href={programPath(matchedProgram)}
              onClick={() => track("cta_click", { button: `results_program_${matchedProgram.slug}` })}
              className={`inline-flex self-start items-center gap-2 rounded-lg px-6 py-3 min-h-[44px] text-[15px] font-medium transition-colors mt-5 ${readyNow ? "bg-stone text-ink hover:bg-[#D9D5C9]" : "bg-ink text-ivory hover:bg-[#3D3D3A]"}`}
            >
              See the program <ArrowRight className="w-3 h-3" />
            </a>
          </>
        ) : (
          <>
            <h3 className="font-heading font-bold text-[22px] leading-tight tracking-[-0.01em]">
              Programs by sport
            </h3>
            <p className="text-[15px] leading-normal text-body mt-2">
              Strength programs for water polo, swimming, running and more, 4 to 8 weeks each.
            </p>
            <a
              href="/library"
              onClick={() => track("cta_click", { button: "results_program_library" })}
              className={`inline-flex self-start items-center gap-2 rounded-lg px-6 py-3 min-h-[44px] text-[15px] font-medium transition-colors mt-5 ${readyNow ? "bg-stone text-ink hover:bg-[#D9D5C9]" : "bg-ink text-ivory hover:bg-[#3D3D3A]"}`}
            >
              Browse the library <ArrowRight className="w-3 h-3" />
            </a>
          </>
        )}
      </div>
    );
    const guideCard = (
      <div className="bg-oat rounded-xl p-5 lg:p-8 flex flex-col">
        <p className="text-[13px] text-mute font-medium mb-2">Free guide, 34 pages</p>
        <h3 className="font-heading font-bold text-[22px] leading-tight tracking-[-0.01em]">
          The Recovery Guide
        </h3>
        <p className="text-[15px] leading-normal text-body mt-2">
          Match your recovery to the work you did, with times and temperatures.
        </p>
        <a
          href="/recovery-guide"
          onClick={() => track("cta_click", { button: "results_recovery_guide" })}
          className="inline-flex self-start items-center gap-2 rounded-lg px-6 py-3 min-h-[44px] text-[15px] font-medium transition-colors mt-5 bg-stone text-ink hover:bg-[#D9D5C9]"
        >
          Get the guide <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    );
    const applyCard = (
      <div className="bg-oat rounded-xl p-5 lg:p-8 flex flex-col">
        <p className="text-[13px] text-mute font-medium mb-2">1:1 coaching</p>
        <h3 className="font-heading font-bold text-[22px] leading-tight tracking-[-0.01em]">
          Apply for coaching
        </h3>
        <p className="text-[15px] leading-normal text-body mt-2">
          A short form. I read each one myself and reply by email.
        </p>
        <a
          href={applyHref}
          onClick={() => {
            carryToApply();
            track("cta_click", { button: "results_apply_card" });
          }}
          className="inline-flex self-start items-center gap-2 rounded-lg px-6 py-3 min-h-[44px] text-[15px] font-medium transition-colors mt-5 bg-stone text-ink hover:bg-[#D9D5C9]"
        >
          Apply <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    );
    const callBlock = (
      <CallRequest
        placement="assessment_results"
        email={(answers.email as string) || ""}
        name={(answers.name as string) || ""}
        context={callContext(answers)}
        heading={readyNow ? undefined : "Or talk it through with me."}
      />
    );

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
      <div className="min-h-screen bg-ivory flex flex-col" ref={containerRef}>
        <header className="border-b border-line">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
            <a
              href="/"
              className="font-heading font-bold text-[20px] tracking-[-0.01em] text-ink no-underline"
            >
              Marin Lazic
            </a>
            <span className="text-[13px] text-mute">
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
                className="w-3 h-3 hidden mx-auto mb-8"
                aria-hidden="true"
              />
              <h2 className="font-heading text-2xl sm:text-[32px] font-bold tracking-[-0.02em] mb-8 text-ink">
                {userName}'s performance profile
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
                    stroke="#E6E3DA"
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
                  <span className="text-[13px] text-mute mt-1">
                    out of 100
                  </span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 text-[13px] font-semibold rounded-full bg-oat text-ink"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: overallLabel.color }}
                  aria-hidden="true"
                />
                {overallLabel.label}
              </motion.div>
            </motion.div>

            {/* ── RADAR CHART + QUICK STATS ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-2 gap-8 mb-16"
            >
              {/* Radar Chart */}
              <div className="bg-oat border border-line p-6 sm:p-8 flex flex-col items-center rounded-xl">
                <h3 className="text-[13px] text-mute font-medium mb-6 self-start">
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
                    fill="rgba(47, 107, 240, 0.12)"
                    stroke="#FF5A36"
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
                      fill="#FF5A36"
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
                        className="text-[10px]"
                        fill="#5E5D59"
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
                <div className="bg-oat border border-line rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-[#16a34a] rounded-full" />
                    <span className="text-[13px] text-mute font-medium">
                      Strongest area
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-ink">{strongest?.icon}</span>
                      <span className="font-heading text-lg font-bold">
                        {strongest?.title}
                      </span>
                    </div>
                    <span className="font-heading text-2xl font-bold text-ink">
                      {strongest?.percentage}%
                    </span>
                  </div>
                </div>

                {/* Weakest */}
                <div className="bg-oat border border-line rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-signal rounded-full" />
                    <span className="text-[13px] text-mute font-medium">
                      Biggest opportunity
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-black">{weakest?.icon}</span>
                      <span className="font-heading text-lg font-bold">
                        {weakest?.title}
                      </span>
                    </div>
                    <span className="font-heading text-2xl font-bold text-black">
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
                        className="bg-oat border border-line p-3 flex flex-col items-center rounded-xl"
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
                              stroke="#E6E3DA"
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
                        <span className="text-[11px] text-mute font-medium text-center leading-tight">
                          {cat.title}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* ── YOUR NEXT STEP: changes with the answers ── */}
            <div className="border-t border-line pt-12 mb-16">
              <h3 className="text-[13px] text-mute font-medium mb-3">Your next step</h3>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-3 max-w-2xl">
                Start with {weakest?.title}. It is your lowest score at {weakest?.percentage}%.
              </h2>
              <p className="text-base text-body leading-relaxed mb-8 max-w-2xl">
                {helpType === "one-to-one"
                  ? "You said 1:1 coaching would suit you best. The quickest way is to talk it through."
                  : helpType === "program"
                    ? "You said a program would suit you best. This is the one that fits your answers."
                    : readyNow
                      ? "You said you are ready to start. The quickest way is to talk it through."
                      : "Pick the size of step that suits you now."}
              </p>
              {readyNow ? (
                <div className="grid gap-5">
                  {callBlock}
                  <div className="grid gap-5 md:grid-cols-2">
                    {applyCard}
                    {programCard}
                  </div>
                </div>
              ) : (
                <div className="grid gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    {programCard}
                    {guideCard}
                  </div>
                  {callBlock}
                </div>
              )}
              {reportUrl && (
                <p className="text-sm text-mute leading-relaxed mt-6 max-w-2xl">
                  Your full report and the PDF are saved for 90 days at{" "}
                  <a href={reportUrl} className="font-semibold text-black underline underline-offset-4 break-all">
                    this link
                  </a>
                  . The same link is in your email.
                </p>
              )}
            </div>

            {/* ── BIOMETRICS: HRV / RHR / RESPIRATORY RATE ── */}
            {(() => {
              const hrvVal = Number(answers["hrv"] || 0);
              const rhrVal = Number(answers["resting-heart-rate"] || 0);
              const rrVal = Number(answers["respiratory-rate"] || 0);
              const hasBiometrics = hrvVal > 0 || rhrVal > 0 || rrVal > 0;
              if (!hasBiometrics) return null;

              const getHRVRating = (_v: number) => ({
                label: "Indicative reading",
                color: "#FF5A36",
                desc: "Use this reading as one data point alongside your own recent trend, sleep, symptoms and training load. A single reading does not indicate health, fitness or a diagnosis.",
                pct: 50,
              });
              const getRHRRating = (_v: number) => ({
                label: "Indicative reading",
                color: "#FF5A36",
                desc: "Compare readings taken with the same device and method over time. A single reading does not establish a health or fitness rating and is not a diagnosis.",
                pct: 50,
              });
              const getRRRating = (_v: number) => ({
                label: "Indicative reading",
                color: "#FF5A36",
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
                  className="border-t border-line pt-12 mb-16"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-black" />
                    <h3 className="text-[13px] text-mute font-medium">
                      Your Biometrics
                    </h3>
                  </div>
                  <p className="text-sm text-mute mb-3">
                    Indicative readings from your wearable
                  </p>
                  <p className="text-xs text-mute leading-relaxed mb-8 max-w-2xl">
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
                        className="border border-line bg-oat"
                      >
                        <div className="p-5 sm:p-6 grid sm:grid-cols-[200px_1fr] gap-6">
                          {/* Value display */}
                          <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-[11px] text-mute font-medium mb-2">
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
                                  stroke="#E6E3DA"
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
                                <span className="text-[11px] text-mute">
                                  {m.unit}
                                </span>
                              </div>
                            </div>
                            <span
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-ivory text-ink"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: m.rating.color }}
                                aria-hidden="true"
                              />
                              {m.rating.label}
                            </span>
                          </div>

                          {/* Education */}
                          <div className="flex flex-col gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="w-3.5 h-3.5 text-mute" />
                                <span className="text-[11px] text-mute font-medium">
                                  Why This Matters
                                </span>
                              </div>
                              <p className="text-xs text-mute leading-relaxed">
                                {m.why}
                              </p>
                            </div>
                            <div className="bg-ivory border border-line p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="w-3.5 h-3.5 text-black" />
                                <span className="text-[11px] text-ink font-bold">
                                  Your Reading
                                </span>
                              </div>
                              <p className="text-xs text-mute leading-relaxed">
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
              className="border-t border-line pt-12 mb-16"
            >
              <h3 className="text-[13px] text-mute font-medium mb-8">
                {showAllAreas ? "All six areas" : "Your two lowest areas"}
              </h3>
              <div className="space-y-8">
                {shownAreas.map((cat, i) => {
                  const catLabel = getScoreLabel(cat.percentage);
                  const proTips: Record<
                    string,
                    { context: string; graph: number[] }
                  > = {
                    sleep: {
                      context:
                        "Use your recent routines and experience as context, not a universal sleep target.",
                      graph: [40, 55, 65, 75, 85, 100],
                    },
                    stress: {
                      context:
                        "Stress responses are individual and should be considered alongside your circumstances.",
                      graph: [30, 45, 55, 60, 70, 85],
                    },
                    training: {
                      context:
                        "The score reflects your answers, not a universal training standard.",
                      graph: [20, 40, 55, 70, 80, 95],
                    },
                    injuries: {
                      context:
                        "This is coaching context only, not injury assessment or diagnosis.",
                      graph: [50, 55, 60, 70, 80, 90],
                    },
                    nutrition: {
                      context:
                        "Nutrition needs are individual and are not set by this score.",
                      graph: [25, 40, 55, 65, 80, 95],
                    },
                    recovery: {
                      context:
                        "Your personal trend is more relevant than a universal wearable threshold.",
                      graph: [35, 45, 55, 65, 80, 95],
                    },
                  };
                  const catTip = proTips[cat.id] || {
                    context:
                      "This score summarises your answers and is not a health benchmark.",
                    graph: [30, 45, 55, 65, 75, 90],
                  };
                  const barLabels = ["", "", "", "", "", ""];
                  const areaTip = AREA_TIPS[cat.id];
                  const isStrength = cat.percentage >= STRENGTH_FROM;

                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.08 }}
                      className="border border-line bg-oat"
                    >
                      {/* Header */}
                      <div className="p-5 sm:p-6 border-b border-line">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span style={{ color: cat.color }}>{cat.icon}</span>
                            <span className="font-heading text-[13px] font-bold">
                              {cat.title}
                            </span>
                            <span
                              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-ivory text-ink"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: catLabel.color }}
                                aria-hidden="true"
                              />
                              {catLabel.label}
                            </span>
                          </div>
                          <span className="font-heading text-2xl font-bold">
                            {cat.percentage}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-oat rounded-full overflow-hidden">
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
                          <p className="text-[11px] text-mute font-medium mb-3">
                            Where You Stand
                          </p>
                          <div className="flex items-stretch gap-1.5 h-28">
                            {catTip.graph.map((val, gi) => {
                              const isYou =
                                gi ===
                                Math.min(Math.floor(cat.percentage / 20), 5);
                              return (
                                <div
                                  key={gi}
                                  className="flex-1 flex flex-col items-center gap-1"
                                >
                                  <div className="flex-1 min-h-0 w-full flex items-end">
                                    <motion.div
                                      className={`w-full rounded-sm ${isYou ? "bg-signal" : "bg-[#D5D1C4]"}`}
                                      initial={{ height: 0 }}
                                      animate={{ height: `${val}%` }}
                                      transition={{
                                        duration: 0.6,
                                        delay: 1 + gi * 0.05,
                                      }}
                                    />
                                  </div>
                                  {isYou && (
                                    <span className="text-[11px] font-bold text-ink h-4 leading-4">
                                      You
                                    </span>
                                  )}
                                  {!isYou && (
                                    <span className="text-[10px] text-mute h-4 leading-4">
                                      {barLabels[gi]}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-[11px] text-mute mt-2">
                            {catTip.context}
                          </p>
                        </div>

                        {/* Start here: what it looks like, why, what to do first, how long to give it */}
                        <div className="bg-ivory border border-line p-4 sm:p-5 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-3.5 h-3.5 text-black" />
                            <span className="text-[13px] text-ink font-bold">
                              {isStrength || !areaTip ? "Keep going" : "Start here"}
                            </span>
                          </div>
                          {isStrength || !areaTip ? (
                            <p className="text-[14px] text-body leading-relaxed">{STRENGTH_LINE}</p>
                          ) : (
                            <dl className="space-y-3">
                              {(
                                [
                                  ["What it often looks like", areaTip.looks],
                                  ["Why it happens", areaTip.why],
                                  ["Do this first", areaTip.first],
                                  ["Give it", areaTip.give],
                                ] as const
                              ).map(([label, text]) => (
                                <div key={label}>
                                  <dt className="text-[13px] text-mute font-medium">{label}</dt>
                                  <dd className="text-[14px] text-ink leading-[1.45] mt-0.5">{text}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {!showAllAreas && (
                <button
                  onClick={() => {
                    setShowAllAreas(true);
                    track("cta_click", { button: "results_show_all_areas" });
                  }}
                  className="mt-6 inline-flex items-center gap-2 bg-stone text-ink rounded-lg hover:bg-[#D9D5C9] px-6 py-3 min-h-[44px] text-[15px] font-medium transition-colors"
                >
                  Show all {scoredCategories.length} areas <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </motion.div>

            {/* AI Analysis - Collapsible */}
            <AnalysisSection
              analysisResult={analysisResult}
              analysisError={analysisError}
            />

            {/* ── What 1:1 coaching includes ── */}
            <div className="border-t border-line pt-12 mb-16">
              <div className="bg-ink text-ivory rounded-xl p-8 sm:p-12">
                <div className="max-w-2xl">
                  <h3 className="text-[13px] text-white/60 font-medium mb-4">
                    1:1 coaching
                  </h3>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight mb-6 leading-tight">
                    What coaching with me includes
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {[
                      "Periodised training program built from your data",
                      "Sleep and recovery planning guidance",
                      "Nutrition framework aligned to your goals",
                      "Weekly coaching and program adjustments",
                      "Wearable data analysis (WHOOP, Oura, etc.)",
                      "Direct access to your coach",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-ivory shrink-0 mt-0.5" />
                        <span className="text-sm text-white/80">{item}</span>
                      </div>
                    ))}
                  </div>
                  <a
                    href={applyHref}
                    onClick={() => {
                      carryToApply();
                      track("cta_click", { button: "results_apply" });
                    }}
                    className="inline-flex items-center gap-2 bg-ivory text-ink rounded-lg hover:bg-stone px-8 py-3.5 text-[15px] font-medium transition-colors mb-4"
                  >
                    Apply for Coaching
                  </a>
                  <p className="text-xs text-white/60">
                    Monthly, 3 month minimum. A short application. I read each one myself. Coaching does
                    not diagnose, treat or replace medical, allied health or dietetic care.
                  </p>
                </div>
              </div>
            </div>

            {/* ── SHARE YOUR RESULTS ── */}
            <ShareResults
              userName={userName}
              overallPct={overallPct}
              strongest={strongest}
              weakest={weakest}
            />

            {/* Back to site */}
            <div className="border-t border-line pt-8 text-center">
              <a
                href="/"
                className="text-[13px] text-mute hover:text-black transition-colors"
              >
                Back to Site
              </a>
            </div>
          </div>
        </main>

        <footer className="border-t border-line py-6 mt-16">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
            <p className="text-[13px] text-mute">
              Marin Lazic. Health and Performance Coach. Sydney, Australia. <a href="/privacy" className="underline underline-offset-2">Privacy</a>.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // ─── Quiz Screen ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-ivory flex flex-col" ref={containerRef}>
      <header className="border-b border-line">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <a
            href="/"
            className="font-heading font-bold text-[20px] tracking-[-0.01em] text-ink no-underline"
          >
            Marin Lazic
          </a>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-mute">
              {shownIndex + 1} / {shownTotal}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1 bg-stone">
          <motion.div
            className="h-full bg-ink"
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
              {isNewSection && section && currentSectionIndex >= 0 && (
                <div className="border border-line bg-ivory px-4 py-3 mb-6 flex items-center gap-3 rounded-lg">
                  <span style={{ color: section.color }}>{section.icon}</span>
                  <div>
                    <span className="text-[13px] font-bold">
                      {section.title}
                    </span>
                    <span className="text-[12px] text-mute block">
                      {section.subtitle}
                    </span>
                  </div>
                  <span className="ml-auto text-[13px] text-mute">
                    Section {currentSectionIndex + 1} of {QUIZ_SECTIONS.length}
                  </span>
                </div>
              )}

              {/* Category badge */}
              <div className="flex items-center gap-2 mb-6">
                <span style={{ color: getSectionColor(sectionId) }}>
                  {getSectionIcon(sectionId)}
                </span>
                <span className="text-[13px] text-mute font-medium">
                  {section?.title}
                </span>
              </div>

              {/* Question */}
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-2">
                {question.text}
              </h2>
              <p className="text-sm text-mute mb-10">{question.subtext}</p>

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
                          className={`w-full text-left border rounded-lg px-5 py-4 transition-colors duration-200 group flex items-center justify-between ${
                            isSelected
                              ? "border-ink bg-ink text-white"
                              : "border-line bg-oat hover:border-ink/50"
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
                                className={`block text-xs mt-0.5 ${isSelected ? "text-white/60" : "text-mute"}`}
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
                          className={`w-full text-left border rounded-lg px-5 py-4 transition-colors duration-200 flex items-center justify-between ${
                            selected
                              ? "border-ink bg-ink text-white"
                              : "border-line bg-oat hover:border-ink/50"
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
                    className="bg-ink text-ivory rounded-lg hover:bg-[#3D3D3A] px-8 py-3 min-h-[44px] text-[15px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                    autoFocus
                    min={question.min}
                    max={question.max}
                    aria-label={question.text}
                    value={textInput}
                    onChange={e => {
                      setTextInput(e.target.value);
                      setValidationError("");
                    }}
                    placeholder={question.placeholder}
                    className="w-full border border-[#C9C6BA] px-5 py-4 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-[#8A887F] mb-4"
                    onKeyDown={e => {
                      if (e.key === "Enter") handleTextSubmit();
                    }}
                  />
                  {validationError && (
                    <p className="text-black text-xs mb-4 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationError}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleTextSubmit}
                      className="bg-ink text-ivory rounded-lg hover:bg-[#3D3D3A] px-8 py-3 min-h-[44px] text-[15px] font-medium transition-colors"
                    >
                      Continue <ArrowRight className="w-3 h-3 inline ml-2" />
                    </button>
                    <button
                      onClick={() => {
                        setTextInput("");
                        advanceToNext({ ...answers, [question.id]: "0" });
                      }}
                      className="px-6 py-3 min-h-[44px] text-[15px] text-mute hover:text-black transition-colors bg-stone text-ink rounded-lg hover:bg-[#D9D5C9]"
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
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      autoFocus
                      aria-label={question.text}
                      value={textInput}
                      onChange={e => {
                        setTextInput(e.target.value);
                        setValidationError("");
                      }}
                      placeholder={question.placeholder}
                      className="w-full border border-[#C9C6BA] px-5 py-4 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-[#8A887F] mb-4"
                      onKeyDown={e => {
                        if (e.key === "Enter") handleTextSubmit();
                      }}
                    />
                  ) : question.id === "name" ? (
                    <input
                      type="text"
                      name="given-name"
                      autoComplete="given-name"
                      autoCapitalize="words"
                      autoFocus
                      aria-label={question.text}
                      value={textInput}
                      onChange={e => {
                        setTextInput(e.target.value);
                        setValidationError("");
                      }}
                      placeholder={question.placeholder}
                      className="w-full border border-[#C9C6BA] px-5 py-4 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-[#8A887F] mb-4"
                      onKeyDown={e => {
                        if (e.key === "Enter") handleTextSubmit();
                      }}
                    />
                  ) : (
                    <textarea
                      autoFocus
                      aria-label={question.text}
                      value={textInput}
                      onChange={e => {
                        setTextInput(e.target.value);
                        setValidationError("");
                      }}
                      placeholder={question.placeholder}
                      rows={question.required ? 2 : 4}
                      className="w-full border border-[#C9C6BA] px-5 py-4 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-[#8A887F] mb-4 resize-none"
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleTextSubmit();
                        }
                      }}
                    />
                  )}
                  {validationError && (
                    <p role="alert" className="text-black text-[13px] mb-4 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {validationError}
                    </p>
                  )}
                  {question.id === "email" && (
                    <p className="text-[13px] text-mute mb-4">
                      How your details are used is on the{" "}
                      <a href="/privacy" target="_blank" rel="noopener" className="underline underline-offset-2 text-ink">
                        privacy page
                      </a>
                      .
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleTextSubmit}
                      className="bg-ink text-ivory rounded-lg hover:bg-[#3D3D3A] px-8 py-3 min-h-[44px] text-[15px] font-medium transition-colors"
                    >
                      Continue <ArrowRight className="w-3 h-3 inline ml-2" />
                    </button>
                    {!question.required && (
                      <button
                        onClick={() => {
                          setTextInput("");
                          advanceToNext({ ...answers, [question.id]: "" });
                        }}
                        className="px-6 py-3 min-h-[44px] text-[15px] text-mute hover:text-black transition-colors bg-stone text-ink rounded-lg hover:bg-[#D9D5C9]"
                      >
                        Skip
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-line">
                <button
                  onClick={handleBack}
                  disabled={currentQ === 0}
                  className="flex items-center gap-2 text-[13px] text-mute hover:text-black transition-colors disabled:opacity-20 disabled:cursor-not-allowed min-h-[44px] px-3"
                >
                  <ArrowLeft className="w-3 h-3" /> Previous
                </button>
                <a
                  href="/"
                  className="text-[13px] text-mute hover:text-mute transition-colors min-h-[44px] flex items-center px-3"
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
