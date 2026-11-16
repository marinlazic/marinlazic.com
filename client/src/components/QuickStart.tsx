// The first three quiz questions, answered with a tap on the page itself. No
// name, no email, no typing. After the third answer the person goes on to the
// rest of the quiz (the same page when already on /assessment, or /assessment
// from the home page) with these answers carried over.
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { QUESTIONS, QUICK_START_IDS } from "@shared/assessment";
import { useAnalytics } from "@/hooks/useAnalytics";

export const QUICK_START_KEY = "ml_quick_start";

const QUICK = QUICK_START_IDS.map(id => QUESTIONS.find(q => q.id === id)!).filter(Boolean);

/** Answers saved by the landing page, read once by the quiz. Returns null when there are none. */
export function takeQuickStart(): Record<string, string> | null {
  try {
    const raw = sessionStorage.getItem(QUICK_START_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(QUICK_START_KEY);
    const parsed = JSON.parse(raw) as Record<string, string>;
    return QUICK_START_IDS.every(id => typeof parsed[id] === "string") ? parsed : null;
  } catch {
    return null;
  }
}

type Props = {
  placement: "home" | "assessment";
  /** On the quiz page the answers are handed over directly instead of through storage. */
  onDone?: (answers: Record<string, string>) => void;
  className?: string;
};

export function QuickStart({ placement, onDone, className = "" }: Props) {
  const { track } = useAnalytics();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [leaving, setLeaving] = useState(false);
  const q = QUICK[step];

  function pick(value: string) {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    track("quick_start_answer", { step: step + 1, questionId: q.id, placement });
    if (step < QUICK.length - 1) {
      setStep(step + 1);
      return;
    }
    track("quick_start_done", { placement });
    if (onDone) {
      onDone(next);
      return;
    }
    setLeaving(true);
    try {
      sessionStorage.setItem(QUICK_START_KEY, JSON.stringify(next));
    } catch {
      /* the quiz simply starts from question 1 if storage is blocked */
    }
    window.location.href = "/assessment";
  }

  return (
    <div className={`bg-oat rounded-xl p-5 lg:p-8 min-w-0 ${className}`} aria-live="polite">
      <div className="ml-meta">
        <span className="ml-tag">Free</span>
        <span>
          Question {Math.min(step + 1, QUICK.length)} of {QUICK.length}, then {QUESTIONS.length - QUICK.length} more
        </span>
      </div>
      <div className="mt-3 h-1 bg-line rounded-full overflow-hidden" aria-hidden="true">
        <div className="h-1 bg-ink transition-all" style={{ width: `${((step + (leaving ? 1 : 0)) / QUICK.length) * 100}%` }} />
      </div>
      <h3 className="font-heading font-bold text-[22px] lg:text-[26px] leading-[1.2] tracking-[-0.01em] mt-5">{q.text}</h3>
      <p className="text-sm text-mute mt-1.5">Tap one. No email needed yet.</p>
      <div className="mt-4 grid gap-2">
        {q.options?.map(o => (
          <button
            key={o.value}
            type="button"
            disabled={leaving}
            onClick={() => pick(o.value)}
            className="ml-btn w-full justify-between text-left min-h-11 leading-snug py-3"
          >
            <span>{o.label}</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>
        ))}
      </div>
      {step > 0 && !leaving && (
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="mt-3 inline-flex items-center gap-1.5 min-h-11 text-sm font-medium text-mute hover:text-ink"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back
        </button>
      )}
    </div>
  );
}
