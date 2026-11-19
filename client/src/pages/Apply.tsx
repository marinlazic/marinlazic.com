// /apply: the coaching application. Same magazine layout as the coaching,
// corporate and about pages: masthead rule, large headline, a drawing, then
// sections with a large heading beside the content.
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { APPLY_FAQS } from "@shared/siteFaq";
import { getCampaignValue } from "@/lib/attribution";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Loader2 } from "lucide-react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Breadcrumbs, Navigation } from "./InformationPage";

const H1 =
  "font-heading font-bold text-[46px] leading-[0.98] tracking-[-0.035em] sm:text-7xl lg:text-[92px] lg:leading-[0.94]";
const STANDFIRST =
  "font-heading text-[21px] leading-[1.32] text-body mt-6 sm:text-2xl lg:mt-9 lg:text-[27px] max-w-[640px]";
const H2 = "font-heading font-bold text-[30px] leading-[1.08] tracking-[-0.02em] lg:text-[46px]";
const RULE = "mt-14 lg:mt-24 border-t border-ink pt-6 lg:pt-8";
const LABEL = "block font-heading font-bold text-[17px] leading-snug text-ink mb-2.5";
const FIELD = "ml-input focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-colors";
const FIELD_ERROR = "border-red-600";
const ERROR = "text-red-700 text-[13px] mt-2";

const PROOF = [
  "Strength and Conditioning Coach for the Australian Men's Water Polo Team, including preparation for Paris 2024.",
  "Your training and recovery plan is shaped around your goals, current fitness and available time.",
  "The coaching scope, communication and availability are agreed before you start.",
];

function Picture() {
  return (
    <figure className="lg:col-span-5">
      <picture>
        <source media="(min-width: 1024px)" srcSet="/images/site/apply-hero.svg" />
        <img
          src="/images/site/apply-wide.svg"
          alt="A drawing of a short form on a clipboard, with a pencil beside it"
          width={1200}
          height={800}
          loading="eager"
          className="block w-full aspect-[3/2] lg:aspect-[4/5] rounded-lg bg-oat"
        />
      </picture>
      <figcaption className="ml-small mt-2.5">I read every application myself.</figcaption>
    </figure>
  );
}

function Shell({ note, children }: { note: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory text-black flex flex-col">
      <Navigation />
      <main className="flex-1 px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <Breadcrumbs label="Apply for coaching" />
          <div className="flex items-center justify-between gap-4 border-y border-ink py-3 text-[13px] font-semibold">
            <span>Coaching application</span>
            <span className="font-normal text-mute">{note}</span>
          </div>
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

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
    let prefillName = params.get("name");
    let prefillEmail = params.get("email");
    // The assessment results page hands these over in this tab, so they never sit in the web address.
    try {
      const carried = JSON.parse(sessionStorage.getItem("ml_apply_prefill") || "null");
      if (carried) {
        prefillName = prefillName || carried.name;
        prefillEmail = prefillEmail || carried.email;
      }
    } catch {
      // The form starts empty when browser storage is unavailable.
    }
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

  // The confirmation stays on the page. It is not a toast.
  if (submitted) {
    return (
      <Shell note="Application received">
        <header className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-end pt-8 lg:pt-12">
          <div className="lg:col-span-7">
            <h1 className={H1}>Application received</h1>
            <p className={STANDFIRST}>You will hear from me personally by email.</p>
            <p className="text-[17px] leading-[1.62] text-body mt-4">Check your inbox.</p>
            <a href="/" className="ml-btn mt-7 px-6">
              Back to site
            </a>
          </div>
          <Picture />
        </header>
      </Shell>
    );
  }

  const invalid = (field: string) => Boolean(touched[field] && errors[field]);

  return (
    <Shell note="No sales call">
      <header className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-end pt-8 lg:pt-12">
        <div className="lg:col-span-7">
          <h1 className={H1}>Apply for coaching</h1>
          <p className={STANDFIRST}>Short application. Personal email follow up.</p>
          <a href="#application" className="ml-btn ml-btn-dark mt-7 px-6">
            Start the application
          </a>
        </div>
        <Picture />
      </header>

      <section
        id="application"
        aria-labelledby="application-heading"
        className={`${RULE} grid lg:grid-cols-12 gap-8 lg:gap-14 items-start scroll-mt-24`}
      >
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <h2 id="application-heading" className={H2}>
            The application
          </h2>
          <ul className="mt-6 border-t border-line">
            {PROOF.map(t => (
              <li key={t} className="border-b border-line py-3.5 text-[15px] leading-normal text-body">
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[15px] font-semibold text-ink">
            Availability is confirmed after your application
          </p>
        </div>

        <form onSubmit={handleSubmit} className="lg:col-span-8 max-w-[680px] w-full space-y-8" noValidate>
          <div className="grid sm:grid-cols-2 gap-8 sm:gap-5">
            <div>
              <label htmlFor="apply-name" className={LABEL}>
                Name *
              </label>
              <input
                id="apply-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder="Your name"
                aria-invalid={invalid("name")}
                className={`${FIELD} ${invalid("name") ? FIELD_ERROR : ""}`}
              />
              {invalid("name") && (
                <p className={ERROR} role="alert">
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="apply-email" className={LABEL}>
                Email *
              </label>
              <input
                id="apply-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="your@email.com"
                aria-invalid={invalid("email")}
                className={`${FIELD} ${invalid("email") ? FIELD_ERROR : ""}`}
              />
              {invalid("email") && (
                <p className={ERROR} role="alert">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="apply-q1" className={LABEL}>
              What do you want to change in the next 90 days? *
            </label>
            <textarea
              id="apply-q1"
              value={q1}
              onChange={e => setQ1(e.target.value)}
              onBlur={() => handleBlur("q1")}
              placeholder="Be specific. What does success look like?"
              rows={3}
              aria-invalid={invalid("q1")}
              className={`${FIELD} resize-none ${invalid("q1") ? FIELD_ERROR : ""}`}
            />
            {invalid("q1") && (
              <p className={ERROR} role="alert">
                {errors.q1}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="apply-q2" className={LABEL}>
              What is your biggest obstacle right now? *
            </label>
            <textarea
              id="apply-q2"
              value={q2}
              onChange={e => setQ2(e.target.value)}
              onBlur={() => handleBlur("q2")}
              placeholder="What is holding you back from where you want to be?"
              rows={3}
              aria-invalid={invalid("q2")}
              className={`${FIELD} resize-none ${invalid("q2") ? FIELD_ERROR : ""}`}
            />
            {invalid("q2") && (
              <p className={ERROR} role="alert">
                {errors.q2}
              </p>
            )}
          </div>

          <div role="group" aria-labelledby="apply-q3-label">
            <p id="apply-q3-label" className={LABEL}>
              Coaching is a monthly commitment with a minimum of 3 months. Are you ready to invest at that level? *
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "Yes", value: "yes" },
                { label: "I have questions", value: "questions" },
                { label: "No", value: "no" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={q3 === opt.value}
                  onClick={() => {
                    setQ3(opt.value as "yes" | "questions" | "no");
                    setTouched(prev => ({ ...prev, q3: true }));
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.q3;
                      return next;
                    });
                  }}
                  className={`min-h-12 rounded-lg border px-4 py-3 text-base font-medium text-left sm:text-center transition-colors ${
                    q3 === opt.value
                      ? "border-ink bg-ink text-ivory"
                      : "border-line bg-oat text-ink hover:border-ink"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {invalid("q3") && (
              <p className={ERROR} role="alert">
                {errors.q3}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="apply-q4" className={LABEL}>
              Anything else I should know?
            </label>
            <textarea
              id="apply-q4"
              value={q4}
              onChange={e => setQ4(e.target.value)}
              placeholder="Optional. Injuries, timeline, questions."
              rows={3}
              className={`${FIELD} resize-none`}
            />
          </div>

          {errors.form && (
            <p className="text-red-700 text-[15px]" role="alert">
              {errors.form}
            </p>
          )}

          <button
            type="submit"
            disabled={submitApplication.isPending}
            className="ml-btn ml-btn-dark w-full sm:w-auto px-8 disabled:cursor-not-allowed"
          >
            {submitApplication.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit application"
            )}
          </button>

          <p className="text-[15px] leading-relaxed text-mute max-w-lg">
            I read every application myself and reply by email. No sales call. If coaching is not right for you, I
            will tell you straight.
          </p>
        </form>
      </section>

      <section className={`${RULE} grid lg:grid-cols-12 gap-5 lg:gap-14`} aria-labelledby="application-questions">
        <h2 id="application-questions" className={`lg:col-span-4 ${H2}`}>
          Application questions
        </h2>
        <div className="lg:col-span-8 border-t border-line">
          {APPLY_FAQS.map(f => (
            <div key={f.q} className="border-b border-line py-5">
              <h3 className="font-heading font-bold text-[20px] leading-snug text-ink">{f.q}</h3>
              <p className="text-[17px] leading-[1.62] text-body mt-2 max-w-[680px]">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
