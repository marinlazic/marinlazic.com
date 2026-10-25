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
import {
  QUESTIONS,
  calculateScores,
  getScoreBand as scoreBandOf,
  type Question,
  type Option,
} from "@shared/assessment";

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
    id: "personal",
    title: "About You",
    subtitle: "A few details to put your responses in context",
    icon: <User className="w-5 h-5" />,
    color: "#2F6BF0",
  },
  {
    id: "goals",
    title: "Goals",
    subtitle: "What would you like to work towards?",
    icon: <Target className="w-5 h-5" />,
    color: "#2F6BF0",
  },
  {
    id: "sleep",
    title: "Sleep",
    subtitle: "Your recent sleep habits and experience",
    icon: <Moon className="w-5 h-5" />,
    color: "#2F6BF0",
  },
  {
    id: "stress",
    title: "Stress & Mental",
    subtitle: "Your workload, stress and focus",
    icon: <Brain className="w-5 h-5" />,
    color: "#2F6BF0",
  },
  {
    id: "training",
    title: "Current Training",
    subtitle: "What you are doing now",
    icon: <Dumbbell className="w-5 h-5" />,
    color: "#2F6BF0",
  },
  {
    id: "injuries",
    title: "Injuries & Health",
    subtitle: "Health and pain considerations for training",
    icon: <Heart className="w-5 h-5" />,
    color: "#2F6BF0",
  },
  {
    id: "nutrition",
    title: "Nutrition & Energy",
    subtitle: "Your current eating and energy patterns",
    icon: <Utensils className="w-5 h-5" />,
    color: "#2F6BF0",
  },
  {
    id: "recovery",
    title: "Recovery & Technology",
    subtitle: "How you recover and what you track",
    icon: <Watch className="w-5 h-5" />,
    color: "#2F6BF0",
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
      <div className="border border-black/10 bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-black" />
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium">
              Share Your Results
            </h3>
          </div>
          <button
            onClick={() => {
              if (!showPanel) track("share_panel_open", { score: overallPct });
              setShowPanel(!showPanel);
            }}
            className="text-xs tracking-[0.1em] uppercase text-black font-bold hover:text-[#c62828] transition-colors flex items-center gap-1.5"
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
                  <p className="text-xs text-black mt-2">{assessmentUrl}</p>
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
                    className="flex-1 flex items-center justify-center gap-2 bg-[#FFD400] text-black border-2 border-black px-5 py-3.5 text-xs tracking-[0.1em] uppercase font-bold hover:bg-black hover:text-[#FFD400] transition-colors"
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
            <span className="text-black mt-1 shrink-0 text-xs">&bull;</span>
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
          <span className="text-black mt-1 shrink-0 text-xs">&bull;</span>
          <p className="text-sm text-black/70 leading-relaxed">
            {line.replace("- ", "")}
          </p>
        </div>
      );
    if (line.match(/^\d+\.\s/))
      return (
        <div key={i} className="flex items-start gap-3 mb-1.5">
          <span className="text-[10px] font-bold text-black mt-1 shrink-0 w-4 text-right">
            {line.match(/^(\d+)\./)?.[1]}.
          </span>
          <p className="text-sm text-black/70 leading-relaxed">
            {line.replace(/^\d+\.\s*/, "")}
          </p>
        </div>
      );
    if (line.startsWith("> "))
      return (
        <blockquote key={i} className="border-l-2 border-[#2F6BF0] pl-4 my-3">
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
            className="flex items-center gap-1 text-xs tracking-[0.1em] uppercase text-black font-bold hover:text-[#c62828] transition-colors"
          >
            {expanded ? "Collapse" : "Read Full Analysis"}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      <div className="bg-white border border-black/10 p-6 sm:p-8">
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
                className="mt-4 flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-black font-bold hover:text-[#c62828] transition-colors"
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
export function KickstartCheckoutButton({
  email,
  name,
  source,
}: {
  email: string;
  name: string;
  source: string;
}) {
  const createSession = trpc.checkout.createSession.useMutation();
  const { track } = useAnalytics();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!email) {
      toast.error("Email is required to proceed with checkout.");
      return;
    }
    setLoading(true);
    track("checkout_started", { product: "kickstart-4-week", source });
    try {
      const result = await createSession.mutateAsync({
        productId: "kickstart-4-week",
        email,
        name: name || undefined,
        origin: window.location.origin,
      });
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error("Failed to create checkout session. Please try again.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Something went wrong. Please try again or contact us.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full sm:w-auto bg-[#FFD400] text-black border-2 border-black px-8 py-4 text-xs tracking-[0.15em] uppercase font-bold hover:bg-black hover:text-[#FFD400] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Opening checkout
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" /> Start the 4 week programme, $299 AUD
        </>
      )}
    </button>
  );
}

/** Email capture form plus the checkout button, for pages without a known email. */
export function ProgrammeCheckout({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  return (
    <div className="border border-black/10 p-6 sm:p-8">
      <p className="text-[10px] tracking-[0.2em] uppercase text-black font-semibold mb-3">
        Start now
      </p>
      <p className="text-sm text-black/60 leading-relaxed mb-6 max-w-xl">
        Four weeks, built from your assessment answers. One payment of $299 AUD. Marin will be in touch within one business day of your payment.
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mb-4 max-w-xl">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          aria-label="Your name"
          className="border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email"
          aria-label="Your email"
          className="border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black"
        />
      </div>
      <KickstartCheckoutButton email={email.trim()} name={name.trim()} source={source} />
    </div>
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
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");
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
      <div className="min-h-screen bg-[#F4F4F4] flex flex-col">
        <header className="border-b border-black/10">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
            <a
              href="/"
              className="font-heading font-bold text-sm tracking-[0.2em] uppercase"
            >
              ML
            </a>
            <span className="text-[10px] tracking-[0.2em] uppercase text-black/40">
              📊 Performance Assessment
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 py-16">
          <div className="max-w-2xl w-full">
            <div className="w-3 h-3 bg-[#FFD400] mb-8" aria-hidden="true" />
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
                onClick={() => {
                  track("assessment_started");
                  setPhase("quiz");
                }}
                className="bg-[#FFD400] text-black border-2 border-black px-8 py-4 text-xs tracking-[0.15em] uppercase font-bold hover:bg-black hover:text-[#FFD400] transition-colors"
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
      <div className="min-h-screen bg-[#F4F4F4] flex flex-col">
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
            <Loader2 className="w-12 h-12 animate-spin text-black mx-auto mb-8" />
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
                  <div className="w-1.5 h-1.5 bg-[#FFD400] rounded-full" />
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

    // Scores come from the shared scoring function so the screen, the PDF
    // and Kit all show the same numbers.
    const shared = calculateScores(answers);
    const scoredCategories = SECTIONS.filter(
      s => !["personal", "goals"].includes(s.id)
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
        return { label: "Some consistent responses", color: "#2F6BF0" };
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
      <div className="min-h-screen bg-[#F4F4F4] flex flex-col" ref={containerRef}>
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
                className="w-3 h-3 bg-[#FFD400] mx-auto mb-8"
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
              <div className="bg-white border border-black/10 p-6 sm:p-8 flex flex-col items-center">
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
                    fill="rgba(47, 107, 240, 0.12)"
                    stroke="#2F6BF0"
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
                      fill="#2F6BF0"
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
                    <div className="w-2 h-2 bg-[#FFD400] rounded-full" />
                    <span className="text-[10px] tracking-[0.2em] uppercase text-black font-medium">
                      Biggest Opportunity
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-black">{weakest?.icon}</span>
                      <span className="font-heading text-lg font-bold uppercase">
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
                        className="bg-white border border-black/10 p-3 flex flex-col items-center"
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
                color: "#2F6BF0",
                desc: "Use this reading as one data point alongside your own recent trend, sleep, symptoms and training load. A single reading does not indicate health, fitness or a diagnosis.",
                pct: 50,
              });
              const getRHRRating = (_v: number) => ({
                label: "Indicative reading",
                color: "#2F6BF0",
                desc: "Compare readings taken with the same device and method over time. A single reading does not establish a health or fitness rating and is not a diagnosis.",
                pct: 50,
              });
              const getRRRating = (_v: number) => ({
                label: "Indicative reading",
                color: "#2F6BF0",
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
                    <Heart className="w-4 h-4 text-black" />
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
                        className="border border-black/10 bg-white"
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
                                <Target className="w-3.5 h-3.5 text-black" />
                                <span className="text-[9px] tracking-[0.15em] uppercase text-black font-bold">
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
                      className="border border-black/10 bg-white"
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
                                    className={`w-full rounded-sm ${isYou ? "bg-[#FFD400]" : "bg-black/10"}`}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${val}%` }}
                                    transition={{
                                      duration: 0.6,
                                      delay: 1 + gi * 0.05,
                                    }}
                                  />
                                  {isYou && (
                                    <span className="text-[8px] font-bold text-black uppercase">
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
                            <Zap className="w-3.5 h-3.5 text-black" />
                            <span className="text-[9px] tracking-[0.15em] uppercase text-black font-bold">
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
              <div className="bg-white border border-black/10 p-6 sm:p-8 mb-16">
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

            {reportUrl && (
              <div className="border border-black/10 p-6 sm:p-8 mb-12">
                <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-3">
                  Your saved report
                </p>
                <p className="text-sm text-black/60 leading-relaxed mb-4">
                  This page is not saved in your browser. Your report and the PDF are at the link below for 90 days, and the same link is in your email.
                </p>
                <a
                  href={reportUrl}
                  className="text-sm font-semibold text-black underline underline-offset-4 hover:text-black/60 transition-colors break-all"
                >
                  {reportUrl}
                </a>
              </div>
            )}

            {/* Four week programme */}
            <div className="mb-16">
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-4">
                Act on your results
              </h3>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-4 leading-tight">
                The 4 week programme
              </h2>
              <p className="text-sm sm:text-base text-black/60 leading-relaxed mb-6 max-w-2xl">
                A structured four week programme built from these answers. Periodised training, sleep, recovery and nutrition guidance, with weekly email check ins. One payment of $299 AUD.
              </p>
              <KickstartCheckoutButton
                email={(answers.email as string) || ""}
                name={(answers.name as string) || ""}
                source="assessment_results"
              />
            </div>

            {/* ── This Is Where Most People Stop ── */}
            <div className="border-t border-black/10 pt-12 mb-16">
              <div className="bg-[#FFD400] text-black border-2 border-black p-8 sm:p-12">
                <div className="max-w-2xl">
                  <h3 className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-medium mb-4">
                    What Happens Next
                  </h3>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-6 leading-tight">
                    This Is Where Most People Stop
                  </h2>
                  <div className="w-8 h-0.5 bg-[#FFD400] mb-8" />
                  <p className="text-sm sm:text-base text-white/60 leading-relaxed mb-6">
                    You have the data. You know what is holding you back. The
                    difference between knowing and doing is having someone build
                    the system for you and hold you accountable to it.
                  </p>
                  <p className="text-sm sm:text-base text-white/60 leading-relaxed mb-8">
                    Coaching is shaped around your assessment responses,
                    training history and day to day context. It does not
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
                          <CheckCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
                          <span className="text-sm text-white/70">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <a
                    href={`/apply?name=${encodeURIComponent((answers.name as string) || "")}&email=${encodeURIComponent((answers.email as string) || "")}${utmSource ? `&utm_source=${encodeURIComponent(utmSource)}` : ""}${utmMedium ? `&utm_medium=${encodeURIComponent(utmMedium)}` : ""}${utmCampaign ? `&utm_campaign=${encodeURIComponent(utmCampaign)}` : ""}`}
                    className="inline-flex items-center gap-2 bg-[#FFD400] text-black border-2 border-black px-10 py-4 text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#c62828] transition-colors mb-4"
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
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col" ref={containerRef}>
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
            className="h-full bg-[#FFD400]"
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
                <div className="border border-black/10 bg-white px-4 py-3 mb-6 flex items-center gap-3">
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
                    className="bg-[#FFD400] text-black border-2 border-black px-8 py-3 min-h-[44px] text-xs tracking-[0.15em] uppercase font-bold hover:bg-black hover:text-[#FFD400] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                    <p className="text-black text-xs mb-4 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationError}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleTextSubmit}
                      className="bg-[#FFD400] text-black border-2 border-black px-8 py-3 min-h-[44px] text-xs tracking-[0.15em] uppercase font-bold hover:bg-black hover:text-[#FFD400] transition-colors"
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
                    <p className="text-black text-xs mb-4 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationError}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleTextSubmit}
                      className="bg-[#FFD400] text-black border-2 border-black px-8 py-3 min-h-[44px] text-xs tracking-[0.15em] uppercase font-bold hover:bg-black hover:text-[#FFD400] transition-colors"
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
