import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { APPLY_FAQS } from "@shared/siteFaq";
import { getCampaignValue } from "@/lib/attribution";
import { useAnalytics } from "@/hooks/useAnalytics";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Apply() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState<"yes" | "questions" | "no" | "">("");
  const [q4, setQ4] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const submitApplication = trpc.application.submit.useMutation();
  const { track } = useAnalytics();

  // Pre-fill from URL params (coming from assessment or nurture emails)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    try {
      if (sessionStorage.getItem("ml_application_received") === "true") {
        setSubmitted(true);
      }
    } catch {
      // Confirmation still works when browser storage is unavailable.
    }
    const prefillName = params.get("name");
    const prefillEmail = params.get("email");
    if (prefillName) setName(prefillName);
    if (prefillEmail) setEmail(prefillEmail);
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required.";
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!isValidEmail(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!q1.trim()) newErrors.q1 = "This field is required.";
    if (!q2.trim()) newErrors.q2 = "This field is required.";
    if (!q3) newErrors.q3 = "Please select an option.";
    return newErrors;
  }, [name, email, q1, q2, q3]);

  function handleBlur(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
    const newErrors = validate();
    setErrors(newErrors);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors = validate();
    setErrors(newErrors);
    setTouched({ name: true, email: true, q1: true, q2: true, q3: true });

    if (Object.keys(newErrors).length > 0) return;

    // Gather UTM params from URL
    const params = new URLSearchParams(window.location.search);
    const utmSource =
      getCampaignValue("utm_source", params.toString()) || undefined;
    const utmMedium =
      getCampaignValue("utm_medium", params.toString()) || undefined;
    const utmCampaign =
      getCampaignValue("utm_campaign", params.toString()) || undefined;

    try {
      await submitApplication.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        q1_90day_goal: q1.trim(),
        q2_obstacle: q2.trim(),
        q3_investment: q3 as "yes" | "questions" | "no",
        q4_anything_else: q4.trim() || undefined,
        utmSource,
        utmMedium,
        utmCampaign,
      });
      track("apply_submitted", { investment: q3 });
      try {
        sessionStorage.setItem("ml_application_received", "true");
      } catch {
        // A successful submission does not depend on browser storage.
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    }
  }

  // ─── Confirmation Screen (persistent, not a toast) ──────
  if (submitted) {
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
              Application Received
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-lg w-full text-center"
          >
            <CheckCircle className="w-16 h-16 text-black mx-auto mb-8" />
            <h1 className="font-heading text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-4">
              Application Received
            </h1>
            <div className="w-12 h-[2px] bg-[#FFD400] mx-auto mb-8" />
            <p className="text-lg text-black/60 leading-relaxed mb-4">
              You will hear from me personally by email.
            </p>
            <p className="text-base text-black/40 leading-relaxed mb-10">
              Check your inbox.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 border border-black/20 px-8 py-4 text-xs tracking-[0.15em] uppercase font-bold text-black/60 hover:text-black hover:border-black transition-colors"
            >
              Back to Site
            </a>
          </motion.div>
        </main>
      </div>
    );
  }

  // ─── Application Form ──────────────────────────────────
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
            📝 Coaching Application
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12 sm:py-16">
        <div className="max-w-2xl w-full">
          {/* Headline */}
          <div className="w-3 h-3 bg-[#FFD400] mb-8" aria-hidden="true" />
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight leading-[0.95] mb-4">
            Apply for Coaching
          </h1>
          <p className="text-base text-black/50 leading-relaxed mb-8 max-w-xl">
            Short application. Personal email follow up.
          </p>

          {/* Proof Block */}
          <div className="border-l-2 border-[#2F6BF0] pl-5 mb-8 space-y-2">
            <p className="text-sm text-black/70 leading-relaxed">
              Strength and Conditioning Coach for the Australian Men's Water
              Polo Team, including preparation for Paris 2024.
            </p>
            <p className="text-sm text-black/70 leading-relaxed">
              Your training and recovery plan is shaped around your goals,
              current fitness and available time.
            </p>
            <p className="text-sm text-black/70 leading-relaxed">
              The coaching scope, communication and availability are agreed
              before you start.
            </p>
          </div>

          {/* Scarcity line */}
          <div className="mb-12 flex items-center gap-3">
            <div className="w-2 h-2 bg-[#FFD400] rounded-full animate-pulse" />
            <p className="text-xs tracking-[0.1em] uppercase text-black font-semibold">
              Availability is confirmed after your application
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {/* Name */}
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-2">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder="Your name"
                className={`w-full border px-5 py-4 text-sm focus:outline-none transition-colors bg-transparent placeholder:text-black/30 ${
                  touched.name && errors.name
                    ? "border-red-500"
                    : "border-black/20 focus:border-black"
                }`}
              />
              {touched.name && errors.name && (
                <p className="text-red-600 text-xs mt-2">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="your@email.com"
                className={`w-full border px-5 py-4 text-sm focus:outline-none transition-colors bg-transparent placeholder:text-black/30 ${
                  touched.email && errors.email
                    ? "border-red-500"
                    : "border-black/20 focus:border-black"
                }`}
              />
              {touched.email && errors.email && (
                <p className="text-red-600 text-xs mt-2">{errors.email}</p>
              )}
            </div>

            {/* Q1: 90-day goal */}
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-2">
                What do you want to change in the next 90 days? *
              </label>
              <textarea
                value={q1}
                onChange={e => setQ1(e.target.value)}
                onBlur={() => handleBlur("q1")}
                placeholder="Be specific. What does success look like?"
                rows={3}
                className={`w-full border px-5 py-4 text-sm focus:outline-none transition-colors bg-transparent placeholder:text-black/30 resize-none ${
                  touched.q1 && errors.q1
                    ? "border-red-500"
                    : "border-black/20 focus:border-black"
                }`}
              />
              {touched.q1 && errors.q1 && (
                <p className="text-red-600 text-xs mt-2">{errors.q1}</p>
              )}
            </div>

            {/* Q2: Biggest obstacle */}
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-2">
                What is your biggest obstacle right now? *
              </label>
              <textarea
                value={q2}
                onChange={e => setQ2(e.target.value)}
                onBlur={() => handleBlur("q2")}
                placeholder="What is holding you back from where you want to be?"
                rows={3}
                className={`w-full border px-5 py-4 text-sm focus:outline-none transition-colors bg-transparent placeholder:text-black/30 resize-none ${
                  touched.q2 && errors.q2
                    ? "border-red-500"
                    : "border-black/20 focus:border-black"
                }`}
              />
              {touched.q2 && errors.q2 && (
                <p className="text-red-600 text-xs mt-2">{errors.q2}</p>
              )}
            </div>

            {/* Q3: Investment readiness */}
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-2">
                The investment is $2,400 AUD per month for a minimum of 3
                months. Are you ready to invest at that level? *
              </label>
              <div className="space-y-3 mt-3">
                {[
                  { label: "Yes", value: "yes" },
                  { label: "I have questions", value: "questions" },
                  { label: "No", value: "no" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setQ3(opt.value as "yes" | "questions" | "no");
                      setTouched(prev => ({ ...prev, q3: true }));
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.q3;
                        return next;
                      });
                    }}
                    className={`w-full text-left border px-5 py-4 transition-all duration-200 flex items-center justify-between min-h-[52px] ${
                      q3 === opt.value
                        ? "border-black bg-black text-white"
                        : "border-black/15 hover:border-black/40"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${q3 === opt.value ? "text-white" : "text-black"}`}
                    >
                      {opt.label}
                    </span>
                    {q3 === opt.value && (
                      <CheckCircle className="w-4 h-4 text-white shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              {touched.q3 && errors.q3 && (
                <p className="text-red-600 text-xs mt-2">{errors.q3}</p>
              )}
            </div>

            {/* Q4: Anything else */}
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-2">
                Anything else I should know?
              </label>
              <textarea
                value={q4}
                onChange={e => setQ4(e.target.value)}
                placeholder="Optional. Injuries, timeline, questions."
                rows={3}
                className="w-full border border-black/20 px-5 py-4 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-black/30 resize-none"
              />
            </div>

            {/* Form-level error */}
            {errors.form && (
              <p className="text-red-600 text-sm">{errors.form}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitApplication.isPending}
              className="w-full sm:w-auto bg-[#FFD400] text-black border-2 border-black px-10 py-4 text-xs tracking-[0.15em] uppercase font-bold hover:bg-black hover:text-[#FFD400] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px]"
            >
              {submitApplication.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  Submit Application <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>

            {/* Reassurance line */}
            <p className="text-sm text-black/40 leading-relaxed max-w-lg">
              I read every application myself and reply by email. No sales call.
              If coaching is not right for you, I will tell you straight.
            </p>
          </form>
          <section
            className="mt-16 border-t border-black/10 pt-10"
            aria-labelledby="application-questions"
          >
            <h2
              id="application-questions"
              className="font-heading font-bold text-xl mb-6"
            >
              Application questions
            </h2>
            <div className="space-y-6">
              {APPLY_FAQS.map(f => (
                <div key={f.q}>
                  <h3 className="text-sm font-semibold mb-2">{f.q}</h3>
                  <p className="text-sm text-black/60 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
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
