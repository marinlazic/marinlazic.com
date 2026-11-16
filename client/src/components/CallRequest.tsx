// A short call request. It uses the same lead form as the contact box on the
// home page, so the request lands in Contacts and Follow up and Marin gets the
// usual alert. When the page already knows who the person is (the quiz results,
// the saved report), it asks for nothing but an optional note.
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

/** One plain sentence of facts about the quiz result, sent with a call request. */
export function scoreContext(overallPct: number, categories: { name: string; percentage: number }[]) {
  const scored = categories.filter(c => c.percentage > 0);
  const weakest = [...scored].sort((a, b) => a.percentage - b.percentage)[0];
  return `Assessment score ${overallPct} out of 100.${weakest ? ` Weakest area: ${weakest.name}.` : ""}`;
}

type Props = {
  /** Where the request came from, kept on the lead as "call-request-<placement>". */
  placement: string;
  email?: string;
  name?: string;
  /** Plain facts sent with the request so Marin sees the score before he replies. */
  context?: string;
  heading?: string;
  className?: string;
};

export function CallRequest({ placement, email: knownEmail = "", name: knownName = "", context = "", heading, className = "" }: Props) {
  const { track } = useAnalytics();
  const [email, setEmail] = useState(knownEmail);
  const [name, setName] = useState(knownName);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = trpc.leads.submit.useMutation({
    onSuccess: () => {
      setDone(true);
      setError("");
      track("lead_submitted", { kind: "call_request", placement });
    },
    onError: err => setError(err.message || "Something went wrong. Please try again."),
  });

  const needsEmail = !knownEmail;

  function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    track("cta_click", { button: `call_request_${placement}` });
    const message = ["Asked for a short call.", context, note.trim() ? `Note: ${note.trim()}` : ""]
      .filter(Boolean)
      .join(" ");
    submit.mutate({
      email: email.trim(),
      name: name.trim() || undefined,
      source: `call-request-${placement}`,
      message,
    });
  }

  if (done) {
    return (
      <div className={`bg-oat rounded-xl p-5 lg:p-8 ${className}`}>
        <div className="flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-ink shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-heading font-semibold text-xl mb-2">Got it.</h3>
            <p className="text-body leading-relaxed">
              I will reply by email with a few times. If you do not see it, check your junk folder.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={send} className={`bg-oat rounded-xl p-5 lg:p-8 ${className}`}>
      <h3 className="font-heading font-bold text-[22px] leading-tight tracking-[-0.01em]">
        {heading ?? "Talk it through with me."}
      </h3>
      <p className="text-[15px] leading-normal text-body mt-2 max-w-xl">
        A short call to go through your results and what to change first. No sales pitch. I reply by email with a few times.
      </p>
      {needsEmail && (
        <div className="grid gap-3 sm:grid-cols-2 mt-5">
          <div>
            <label htmlFor={`call-name-${placement}`} className="block text-[13px] font-medium text-mute mb-1.5">
              Name
            </label>
            <input
              id={`call-name-${placement}`}
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="given-name"
              className="ml-input"
            />
          </div>
          <div>
            <label htmlFor={`call-email-${placement}`} className="block text-[13px] font-medium text-mute mb-1.5">
              Email
            </label>
            <input
              id={`call-email-${placement}`}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="ml-input"
            />
          </div>
        </div>
      )}
      <label htmlFor={`call-note-${placement}`} className="block text-[13px] font-medium text-mute mt-4 mb-1.5">
        What would you like to cover? (optional)
      </label>
      <textarea
        id={`call-note-${placement}`}
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Sleep, energy, getting training back into a busy week. Please leave out sensitive health details."
        className="ml-input"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={submit.isPending} className="ml-btn ml-btn-dark w-full sm:w-auto">
          {submit.isPending ? "Sending..." : "Request a short call"} <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 mt-3 text-ink text-sm" role="alert">
          <AlertCircle className="w-4 h-4" aria-hidden="true" />
          {error}
        </div>
      )}
    </form>
  );
}
