// The Recovery Guide signup. One component, two sizes: "panel" for the home
// page and the guide's own page, "inline" for the end of an article or
// resource. The PDF goes out by email; the person joins the Kit list.
import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getAttribution } from "@/lib/attribution";
import { getSessionId } from "@/hooks/useAnalytics";
import { RECOVERY_GUIDE } from "@shared/recoveryGuide";

export function GuideSignup({ placement, variant = "panel", className = "" }: { placement: string; variant?: "panel" | "inline"; className?: string }) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const subscribe = trpc.guides.subscribe.useMutation();
  const done = subscribe.isSuccess;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    const a = getAttribution();
    subscribe.mutate(
      {
        guide: "recovery",
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        placement,
        sessionId: getSessionId() || undefined,
        landingPath: a.landingPath,
        referrer: a.referrer,
        utmSource: a.utm_source,
        utmMedium: a.utm_medium,
        utmCampaign: a.utm_campaign,
      },
      { onError: () => setError("Something went wrong. Try again, or email marin@marinlazic.coach.") }
    );
  };

  const form = done ? (
    <div className="flex items-start gap-3 text-sm">
      <Check className="w-4 h-4 mt-0.5 shrink-0" />
      <p>
        Sent. Check your inbox for "Your Recovery Guide". If it is not there in a minute, look in promotions or spam, or{" "}
        <a className="underline hover:text-black/60" href={RECOVERY_GUIDE.pdfPath} target="_blank" rel="noopener noreferrer">
          open the guide here
        </a>
        .
      </p>
    </div>
  ) : (
    <form onSubmit={submit} className="flex flex-col sm:flex-row sm:flex-wrap gap-3" aria-label="Get the Recovery Guide">
      <input
        type="text"
        value={firstName}
        onChange={e => setFirstName(e.target.value)}
        placeholder="First name"
        aria-label="First name"
        autoComplete="given-name"
        maxLength={100}
        className="sm:w-40 sm:flex-none border border-black/20 bg-white px-4 py-3.5 text-sm placeholder:text-black/30 focus:outline-none focus:border-black transition-colors"
      />
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        aria-label="Email"
        autoComplete="email"
        required
        className="flex-1 min-w-[14rem] border border-black/20 bg-white px-4 py-3.5 text-sm placeholder:text-black/30 focus:outline-none focus:border-black transition-colors"
      />
      <button type="submit" disabled={subscribe.isPending} className="bg-black text-white text-sm tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-black/80 transition-colors font-medium disabled:opacity-50 whitespace-nowrap">
        {subscribe.isPending ? "Sending" : "Send me the guide"}
      </button>
    </form>
  );

  if (variant === "inline") {
    return (
      <aside className={`border-t border-b border-black/10 py-8 ${className}`} aria-labelledby={`guide-${placement}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 bg-[#2F6BF0]" aria-hidden="true" />
          <span className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium">Free guide</span>
        </div>
        <h3 id={`guide-${placement}`} className="font-heading font-bold text-xl sm:text-2xl tracking-[-0.02em] leading-tight mb-2">
          {RECOVERY_GUIDE.title}: {RECOVERY_GUIDE.subtitle.toLowerCase()}
        </h3>
        <p className="text-sm text-black/60 leading-relaxed mb-5 max-w-2xl">
          A heavy lifting day, a long run and a week of meetings each leave a different kind of fatigue. Thirty four pages on how to tell them apart and what to do about each one, with the numbers. Free, by email.
        </p>
        {form}
        {error && (
          <div className="flex items-center gap-2 mt-3 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        <p className="text-[11px] text-black/40 mt-3">You also get my weekly email. Unsubscribe any time.</p>
      </aside>
    );
  }

  return (
    <div className={className}>
      {form}
      {error && (
        <div className="flex items-center gap-2 mt-3 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      <p className="text-[11px] text-black/40 mt-3">You also get my weekly email. Unsubscribe any time.</p>
    </div>
  );
}
