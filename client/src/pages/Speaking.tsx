// /speaking: keynotes and sessions for business leaders.
// Moved here from marinlazicspeak.com (a separate Manus site) on 20 Oct 2026.
// The enquiry form posts to leads.submit like the home page form, with
// speaking: true so Kit tags speaking_enquiry and the confirmation reads right.
import { WordTile } from "@/components/WordTile";
import { PageBand } from "@/components/PageBand";
import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Breadcrumbs, Navigation } from "./InformationPage";

const HERO_PHOTO = "/images/articles/article-olympic-gpLGKvxLbp5dFAxegeMPbR.webp";
const BAND_PHOTO =
  "/images/articles/article-executive-fitness-7smAuKbB8VnoomqQR4MdYo.webp";

const FACTS = [
  { big: "Paris 2024", small: "Olympic Games" },
  { big: "2023 to 2025", small: "World Championships" },
  { big: "2022", small: "World Cup" },
  { big: "Otion", small: "Founder" },
];

const SESSIONS = [
  {
    title: "Olympic athlete and corporate athlete",
    body: "What a CEO and an Olympic water polo player have in common. Both perform under pressure. Both need recovery systems. Both break down without the right inputs. The session covers energy management, stress response and a performance routine that works.",
  },
  {
    title: "Your HRV score is telling you something",
    body: "Heart rate variability is a metric most executives have never heard of. This session covers what it measures, why it matters and five ways to improve it, starting that week.",
  },
  {
    title: "The 1% protocol: daily habits Olympic athletes keep",
    body: "Sleep, morning light, cold water, movement and hydration. These daily habits take under 30 minutes and add up over months.",
  },
  {
    title: "Why fit CEOs make better decisions",
    body: "The link between cardiovascular fitness, brain function and decision quality. Aerobic fitness is tied to thinking speed, emotional regulation and stress tolerance. Includes a simple protocol of three sessions a week.",
  },
  {
    title: "Recovery is a strategy, not a reward",
    body: "Treat recovery as part of the business. The same periodisation used in Olympic training, applied to an executive calendar. Sleep, active recovery and breathwork.",
  },
  {
    title: "The nappuccino and other tools you can use today",
    body: "A practical, interactive session. The coffee nap, a two minute stress reset and zone 2 cardio explained simply. Your audience leaves with things to try that afternoon.",
  },
  {
    title: "Jet lag is a performance problem",
    body: "The protocols Marin uses with the Australian team to cut recovery time and avoid illness after long haul travel: light exposure, sleep shifting, meal timing and supplements.",
  },
  {
    title: "Beyond the bench press: training for real life",
    body: "Most training programs miss. This session covers eye training, breathwork and movement patterning, the methods used with Olympic athletes, and how to programme training that carries over to work and life.",
  },
];

const CREDENTIALS = [
  "Strength and Conditioning Coach, Australian Men's Water Polo Team, since 2021",
  "Prepared the team for the Paris 2024 Olympic Games",
  "World Championships 2023, 2024 and 2025. World Cup 2022",
  "ASCA Level 2 accredited Strength and Conditioning Coach",
  "Founder of Otion, health and performance coaching for founders, executives and organisations",
  "Private coaching clients include founders, venture capital investors and business owners",
  "Protocols drawn from neuroscience, exercise physiology and sleep research",
];

export default function Speaking() {
  const { track } = useAnalytics();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = trpc.leads.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setError("");
      track("lead_submitted", { kind: "speaking_enquiry" });
    },
    onError: err => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    track("cta_click", { button: "speaking_submit" });
    const parts = [
      "Speaking enquiry.",
      org.trim() ? `Organisation: ${org.trim()}.` : "",
      message.trim(),
    ].filter(Boolean);
    submit.mutate({
      email,
      name: name.trim() || undefined,
      source: "speaking-enquiry",
      message: parts.join(" "),
      speaking: true,
    });
  };

  const label =
    "block text-xs text-black/50 mb-2";
  const field =
    "w-full border border-black/20 bg-white px-4 py-3.5 text-sm placeholder:text-black/30 focus:outline-none focus:border-black transition-colors";

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black flex flex-col">
      <Navigation />
      <PageBand src="/images/guide/field.jpg" alt="A team training on a field" word="speak" emoji={"\u{1F3A4}"} pin="Speaking" position="center" />
      <main className="flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="max-w-[1280px] mx-auto mb-12">
          <img
            src={HERO_PHOTO}
            alt="Starting blocks on an empty track under stadium lights, with the Olympic rings above"
            className="w-full aspect-[2/1] object-cover block"
            width={1920}
            height={960}
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="max-w-[1280px] mx-auto">
          <Breadcrumbs label="Speaking" />
          <div className="w-3 h-3 bg-[#FFD400] mb-8" aria-hidden="true" />
          <p className="text-[10px] tracking-[0.2em] uppercase text-black font-semibold mb-4">
            Speaking
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-[-0.03em] leading-[0.93] mb-6 max-w-4xl">
            Olympic level performance science for business leaders
          </h1>
          <p className="text-base sm:text-lg text-black/65 leading-relaxed max-w-2xl mb-8">
            The systems used to prepare athletes for the Paris 2024 Olympics,
            applied to founders, CEOs and executives. How you manage your
            biology decides how you perform.
          </p>
          <div className="flex flex-wrap gap-4 mb-16">
            <a
              href="#enquire"
              onClick={() => track("cta_click", { button: "speaking_hero_enquire" })}
              className="inline-flex bg-[#FFD400] text-black border-2 border-black text-sm tracking-[0.15em] uppercase px-8 py-4 hover:bg-black hover:text-[#FFD400] transition-colors font-medium"
            >
              Enquire about an event
            </a>
            <a
              href="#sessions"
              className="inline-flex border border-black/20 text-black text-sm tracking-[0.15em] uppercase px-8 py-4 hover:border-black/60 transition-colors font-medium"
            >
              See the sessions
            </a>
          </div>

          <div className="space-y-16">
            <section id="about" className="border-t border-black/10 pt-7">
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-5">
                About
              </h2>
              <p className="font-heading text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-6">
                Performance is biology.
              </p>
              <div className="space-y-4 max-w-2xl">
                <p className="text-sm sm:text-base text-black/70 leading-relaxed">
                  Marin is the Strength and Conditioning Coach for the Australian
                  Men's Water Polo Team and founder of Otion. He has prepared
                  athletes for the Paris 2024 Olympic Games, three World
                  Championships (2023, 2024 and 2025) and the 2022 World Cup.
                </p>
                <p className="text-sm sm:text-base text-black/70 leading-relaxed">
                  Founders and executives break down in the same ways athletes
                  do. Stress is biology, not a mindset problem. Ignore it and it
                  shows up in your decisions, your energy and eventually your
                  business.
                </p>
                <p className="text-sm sm:text-base text-black/70 leading-relaxed">
                  The Australian team crosses more time zones than most
                  nations. Marin built protocols around eye training, breathing
                  and movement that cut recovery time, reduce illness and limit
                  the performance drop that follows travel. He measures. He
                  does not guess. He builds systems, not motivation.
                </p>
              </div>
              <ul className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
                {FACTS.map(f => (
                  <li key={f.big} className="border-t border-black/10 pt-4">
                    <span className="block w-2.5 h-2.5 bg-[#FFD400] mb-4" aria-hidden="true" />
                    <span className="block font-heading font-bold text-xl sm:text-2xl tracking-[-0.02em]">
                      {f.big}
                    </span>
                    <span className="block text-[10px] tracking-[0.16em] uppercase text-black/45 mt-1">
                      {f.small}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section id="sessions" className="border-t border-black/10 pt-7 scroll-mt-8">
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-5">
                Speaking topics
              </h2>
              <p className="font-heading text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-4">
                Sessions built for leaders
              </p>
              <p className="text-sm sm:text-base text-black/70 leading-relaxed max-w-2xl mb-10">
                Each session is for founders, CEOs and executives who want
                practical content they can use that week. Not motivation.
                Systems.
              </p>
              <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {SESSIONS.map((s, i) => (
                  <li key={s.title} className="flex gap-5 border-t border-black/10 pt-5">
                    <span className="font-heading text-3xl text-black/30 tracking-[-0.04em] leading-none w-12 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-heading font-bold text-lg tracking-[-0.01em] mb-2">
                        {s.title}
                      </h3>
                      <p className="text-sm text-black/70 leading-relaxed">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-black/50 mt-10 max-w-2xl">
                Sessions are education and coaching, not medical care. They do
                not diagnose conditions or replace advice from a qualified
                health professional.
              </p>
            </section>

            <img
              src={BAND_PHOTO}
              alt="A man in a suit setting up to deadlift a loaded barbell in a dim gym"
              className="w-full aspect-[2/1] object-cover block"
              width={1920}
              height={960}
              loading="lazy"
              decoding="async"
            />

            <section id="credentials" className="border-t border-black/10 pt-7">
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-5">
                Credentials
              </h2>
              <p className="font-heading text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-6">
                Built on real experience
              </p>
              <ul className="max-w-2xl border-t border-black/10">
                {CREDENTIALS.map(c => (
                  <li
                    key={c}
                    className="flex gap-4 border-b border-black/10 py-4 text-sm sm:text-base text-black/75 leading-relaxed"
                  >
                    <span className="w-2 h-2 bg-[#FFD400] mt-2 shrink-0" aria-hidden="true" />
                    {c}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-black/60 mt-6">
                More on the{" "}
                <a href="/about" className="underline underline-offset-4 hover:text-black">
                  About page
                </a>
                .
              </p>
            </section>

            <section id="enquire" className="border-t border-black/10 pt-7 scroll-mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7">
                  <h2 className="text-xs tracking-[0.2em] uppercase text-black/45 font-medium mb-5">
                    Contact
                  </h2>
                  <p className="font-heading text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-4">
                    Enquire about an event
                  </p>
                  <p className="text-sm sm:text-base text-black/70 leading-relaxed max-w-xl mb-8">
                    A board meeting, corporate retreat or leadership summit. Tell
                    me about the event and I will reply by email within one
                    business day.
                  </p>
                  {submitted ? (
                    <div className="flex items-start gap-4 py-4">
                      <CheckCircle className="w-6 h-6 text-black shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-heading font-semibold text-xl mb-2">
                          Thanks for getting in touch.
                        </h3>
                        <p className="text-black/60 leading-relaxed">
                          Your enquiry has been received. A confirmation is on its way to your inbox.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
                      <div>
                        <label htmlFor="speaking-name" className={label}>Name</label>
                        <input
                          id="speaking-name"
                          type="text"
                          autoComplete="name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className={field}
                        />
                      </div>
                      <div>
                        <label htmlFor="speaking-email" className={label}>Email</label>
                        <input
                          id="speaking-email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className={field}
                        />
                      </div>
                      <div>
                        <label htmlFor="speaking-org" className={label}>Company or organisation</label>
                        <input
                          id="speaking-org"
                          type="text"
                          autoComplete="organization"
                          value={org}
                          onChange={e => setOrg(e.target.value)}
                          className={field}
                        />
                      </div>
                      <div>
                        <label htmlFor="speaking-message" className={label}>
                          About the event (date, audience size, topic)
                        </label>
                        <textarea
                          id="speaking-message"
                          rows={4}
                          maxLength={2000}
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder="Please do not include sensitive health information here."
                          className={field}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submit.isPending}
                        className="bg-[#FFD400] text-black border-2 border-black text-sm tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-black hover:text-[#FFD400] transition-colors font-medium disabled:opacity-50"
                      >
                        {submit.isPending ? "Sending..." : "Send enquiry"}
                      </button>
                      {error && (
                        <div className="flex items-center gap-2 text-black text-sm" role="alert">
                          <AlertCircle className="w-4 h-4" />
                          {error}
                        </div>
                      )}
                    </form>
                  )}
                </div>
                <div className="hidden lg:block lg:col-span-5"><WordTile src="/images/guide/team.jpg" alt="A team talk on the pool deck" word="invite" emoji={"\u{1F3A4}"} pin="Speaking" aspect="aspect-[4/3]" /></div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <footer className="border-t border-black/10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 py-8 flex flex-wrap justify-between gap-4 text-[10px] tracking-[0.16em] uppercase text-black/45">
          <span>Marin Lazic</span>
          <a href="/" className="hover:text-black transition-colors">marinlazic.com</a>
        </div>
      </footer>
    </div>
  );
}
