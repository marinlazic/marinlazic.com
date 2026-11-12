// /library: the program library. Programs live in shared/programs.ts and are
// sold and delivered in Bridge. Sections with no programs yet show a note.
// Nov 2026 redesign: text cards on oat, one photo, hairline rows.
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAnalytics } from "@/hooks/useAnalytics";
import { PROGRAMS, UPCOMING, SECTIONS, programPath } from "@shared/programs";
import { Breadcrumbs, Navigation } from "./InformationPage";
import { GuideSignup } from "@/components/GuideSignup";
import { SiteFooter } from "@/components/site/SiteFooter";
import { cardLine } from "@/data/programCards";

export function LibraryFooter() {
  return <SiteFooter className="mt-[72px] lg:mt-[120px]" />;
}

const BRIDGE_STEPS = [
  { n: "1", t: "Buy once", d: "No subscription." },
  { n: "2", t: "Check your email", d: "Your Bridge invite arrives in minutes." },
  { n: "3", t: "Train in the app", d: "A video for every exercise. Log your weights." },
];

const GUIDES = [
  { tag: "Water Polo Max Strength and Power", q: "How should a water polo player lift in a 4 week block?" },
  { tag: "Perimenopause Strength", q: "Where should you start with strength training in perimenopause?" },
  { tag: "Strength for Runners", q: "How many days a week should a runner lift?" },
];

function Label({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="ml-label">
      <span>{children}</span>
      {right ? <span className="font-sans font-medium text-mute">{right}</span> : null}
    </div>
  );
}

function CustomProgram() {
  const submit = trpc.application.submit.useMutation();
  const [f, setF] = useState({ name: "", email: "", goal: "", weeks: "", days: "", kit: "", notes: "" });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!f.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) || !f.goal.trim()) {
      setErr("Add your name, a valid email and what the program is for.");
      return;
    }
    try {
      await submit.mutateAsync({
        name: f.name.trim(),
        email: f.email.trim(),
        q1_90day_goal: `CUSTOM PROGRAM REQUEST. What it is for: ${f.goal.trim()}`,
        q2_obstacle: `Weeks: ${f.weeks || "not said"}. Days a week: ${f.days || "not said"}. Equipment: ${f.kit || "not said"}. Injuries or limits: ${f.notes.trim() || "none said"}.`,
        q3_investment: "yes",
        q4_anything_else: "Sent from the program library, Design your own program.",
        utmCampaign: "custom_program",
      });
    } catch {
      setErr("Something went wrong. Please try again.");
    }
  };
    const fieldLabel = "flex flex-col gap-1.5 text-[13px] font-medium text-mute";
  return (
    <section id="custom" className="mt-14 lg:mt-[88px] scroll-mt-24">
      <Label>Design your own program</Label>
      <div className="mt-7 lg:mt-11 grid gap-7 lg:gap-[72px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-start">
        <div className="min-w-0">
          <h2 className="ml-h2">Need something built for you?</h2>
          <p className="ml-lede mt-4 max-w-[520px]">
            Tell me what the program is for. A sport, an event, a goal, a body part you want to look after. I will reply with what I would build, how long it takes and the price.
          </p>
          <p className="ml-small mt-3 max-w-[520px]">The more detail you give, the better the program. Programs are general training advice and not medical advice.</p>
        </div>
        <div className="bg-oat rounded-xl p-5 lg:p-8 min-w-0">
          {submit.isSuccess ? (
            <p className="font-heading text-2xl font-bold leading-snug">Thanks. I have your request and will reply by email.</p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <label className={fieldLabel}>Your name
                <input className="ml-input" value={f.name} onChange={set("name")} autoComplete="name" />
              </label>
              <label className={fieldLabel}>Email
                <input className="ml-input" type="email" value={f.email} onChange={set("email")} autoComplete="email" />
              </label>
              <label className={fieldLabel}>What is the program for?
                <textarea className="ml-input" rows={3} value={f.goal} onChange={set("goal")} placeholder="For example: a surf trip in 10 weeks, my first marathon, stronger shoulders for climbing." />
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className={fieldLabel}>How many weeks do you have?
                  <select className="ml-input" value={f.weeks} onChange={set("weeks")}>
                    <option value="">Choose</option>
                    <option>4 weeks</option>
                    <option>6 weeks</option>
                    <option>8 weeks</option>
                    <option>More than 8 weeks</option>
                  </select>
                </label>
                <label className={fieldLabel}>Days a week you can train
                  <select className="ml-input" value={f.days} onChange={set("days")}>
                    <option value="">Choose</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5 or more</option>
                  </select>
                </label>
              </div>
              <label className={fieldLabel}>Where do you train and what equipment do you have?
                <input className="ml-input" value={f.kit} onChange={set("kit")} placeholder="Full gym, home dumbbells, hotel room" />
              </label>
              <label className={fieldLabel}>Injuries or limits I should know about
                <textarea className="ml-input" rows={2} value={f.notes} onChange={set("notes")} />
              </label>
              {err ? <p role="alert" className="text-sm text-[#B00020]">{err}</p> : null}
              <button type="submit" disabled={submit.isPending} className="ml-btn ml-btn-dark sm:self-start">
                {submit.isPending ? "Sending" : "Send my request"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Library() {
  const { track } = useAnalytics();
  return (
    <div className="min-h-screen bg-ivory text-ink flex flex-col">
      <Navigation />
      <main className="flex-1 ml-wrap">
        <section id="top" className="pt-4 lg:pt-6">
          <Breadcrumbs label="Program library" />
          <div className="font-heading text-[28px] leading-[1.17] tracking-[-0.02em] sm:text-[34px] lg:text-[42px] max-w-[1200px]">
            <h1 className="inline font-bold">Training programs built around your life.</h1>{" "}
            <p className="inline font-normal text-body">
              Pick your sport, your hobby, your stage of life or your job. Every program lives in the Bridge app on your phone.
            </p>
          </div>
          <div className="mt-6 lg:mt-[30px] flex flex-wrap gap-2.5">
            <a href="#water-polo" className="ml-btn ml-btn-dark w-full sm:w-auto">
              Browse the library <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <a href="#guide" className="ml-btn w-full sm:w-auto">
              Get the free Recovery Guide <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
          <img
            src="/images/site/library-trap-bar-2000.jpg"
            srcSet="/images/site/library-trap-bar-1200.jpg 1200w, /images/site/library-trap-bar-2000.jpg 2000w"
            sizes="(min-width: 1440px) 1312px, 100vw"
            alt="A loaded trap bar on a gym floor"
            width={2000}
            height={1124}
            loading="eager"
            className="block w-full h-[220px] sm:h-[340px] lg:h-[440px] object-cover object-[50%_62%] rounded-lg bg-oat mt-7 lg:mt-11"
          />
        </section>

        <nav aria-label="Jump to" className="mt-6 lg:mt-7 flex flex-wrap items-center gap-1.5">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className="ml-pill ml-pill-line min-h-11 lg:min-h-10 gap-2">
              {s.title}
              <span className="text-mute">{PROGRAMS.filter(p => p.section === s.id).length}</span>
            </a>
          ))}
          <a href="#custom" className="ml-pill ml-pill-line min-h-11 lg:min-h-10">
            Design your own
          </a>
        </nav>

        {SECTIONS.map((s, i) => {
          const items = PROGRAMS.filter(p => p.section === s.id);
          const soon = UPCOMING.filter(u => u.section === s.id);
          const count = items.length;
          return (
            <section key={s.id} id={s.id} className={`${i === 0 ? "mt-12 lg:mt-14" : "mt-14 lg:mt-[88px]"} scroll-mt-24`}>
              <Label right={`${count} ${count === 1 ? "program" : "programs"}`}>{s.title}</Label>
              <div className="mt-7 lg:mt-10 grid gap-7 lg:gap-12 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
                <div className="min-w-0">
                  <h2 className="font-heading font-bold text-[26px] lg:text-[32px] leading-[1.12] tracking-[-0.02em]">{s.heading}</h2>
                  <p className="text-base leading-[1.55] text-body mt-3">{s.blurb}</p>
                </div>
                <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 min-w-0">
                  {items.map(p => (
                    <li key={p.slug} className="ml-card">
                      <div className="ml-meta">
                        <span className="ml-tag">{p.weeks} weeks</span>
                        <span>{s.title}</span>
                      </div>
                      <h3 className="font-heading font-bold text-[19px] leading-[1.22] tracking-[-0.01em] mt-3.5">
                        <a href={programPath(p)} className="text-ink no-underline hover:underline underline-offset-2">{p.name}</a>
                      </h3>
                      <p className="text-[14.5px] leading-normal text-body mt-2">{cardLine(p)}</p>
                      <div className="mt-auto pt-5">
                        <div className="ml-row">
                          <span>Sessions</span>
                          <span>{p.sessionsPerWeek ? `${p.sessionsPerWeek} a week` : "In the app"}</span>
                        </div>
                        <div className="ml-row">
                          <span>Where</span>
                          <span>{p.place}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <a href={programPath(p)} className="ml-btn flex-1 px-3">
                            View
                          </a>
                          <a
                            href={p.buyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => track("cta_click", { button: `library_buy_${p.slug}` })}
                            className="ml-btn ml-btn-dark flex-1 px-3"
                          >
                            Buy now
                          </a>
                        </div>
                      </div>
                    </li>
                  ))}
                  {soon.map(u => (
                    <li key={u.name} className="ml-card">
                      <div className="ml-meta">
                        <span className="ml-tag">Coming soon</span>
                        <span>{u.weeks} weeks</span>
                      </div>
                      <h3 className="font-heading font-bold text-[19px] leading-[1.22] tracking-[-0.01em] mt-3.5">{u.name}</h3>
                      <p className="text-[14.5px] leading-normal text-body mt-2">{u.line}</p>
                      <div className="mt-auto pt-5">
                        <div className="ml-row">
                          <span>Sessions</span>
                          <span>{u.sessionsPerWeek} a week</span>
                        </div>
                        <div className="ml-row">
                          <span>Where</span>
                          <span>{u.place}</span>
                        </div>
                        <a href="#guide" className="ml-btn w-full mt-1.5">
                          Tell me when it is ready
                        </a>
                      </div>
                    </li>
                  ))}
                  {s.id === "corporate-athlete" ? (
                    <li className="ml-card">
                      <div className="ml-meta">
                        <span className="ml-tag">6 weeks</span>
                        <span>For 10 or more people</span>
                      </div>
                      <h3 className="font-heading font-bold text-[19px] leading-[1.22] tracking-[-0.01em] mt-3.5">Team Program, 6 Weeks</h3>
                      <p className="text-[14.5px] leading-normal text-body mt-2">One program for 10 or more people in your company, with a team check in at week 3.</p>
                      <div className="mt-auto pt-5">
                        <div className="ml-row">
                          <span>Sessions</span>
                          <span>3 a week</span>
                        </div>
                        <div className="ml-row">
                          <span>Where</span>
                          <span>Gym or home</span>
                        </div>
                        <a href="/apply" className="ml-btn ml-btn-dark w-full mt-1.5">
                          Enquire now
                        </a>
                      </div>
                    </li>
                  ) : null}
                </ul>
              </div>
            </section>
          );
        })}

        {/* Design your own */}
        <CustomProgram />

        {/* Where the program lives */}
        <section id="bridge" className="mt-14 lg:mt-[88px] scroll-mt-24">
          <Label>Where your program lives</Label>
          <div className="mt-7 lg:mt-11 grid gap-7 lg:gap-[72px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
            <div className="min-w-0">
              <h2 className="ml-h2">Your program lives in the Bridge app.</h2>
              <p className="ml-lede mt-4 max-w-[560px]">
                Bridge is the training app I use with the Australian Men's Water Polo Team and my coaching clients. When you buy, you get an invite by email. Download the app, sign in, and your program is waiting.
              </p>
              <ol className="mt-6 border-b border-line">
                {BRIDGE_STEPS.map(b => (
                  <li key={b.n} className="grid grid-cols-[28px_minmax(0,1fr)] sm:grid-cols-[28px_190px_minmax(0,1fr)] gap-x-4 gap-y-1 py-3.5 border-t border-line">
                    <span className="font-heading font-bold text-base">{b.n}</span>
                    <span className="text-base font-semibold">{b.t}</span>
                    <span className="col-start-2 sm:col-start-3 text-[15px] leading-normal text-body">{b.d}</span>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap items-center gap-3.5 mt-6">
                <a href="https://apps.apple.com/app/id1024299963" target="_blank" rel="noopener noreferrer" className="ml-btn ml-btn-dark w-full sm:w-auto">
                  Download on the App Store
                </a>
                <span className="text-sm text-mute">On Android, search for BridgeAthletic in Google Play.</span>
              </div>
            </div>
            <figure className="bg-oat rounded-xl p-5 lg:p-8 min-w-0">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <img src="https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/b5/04/0e/b5040eba-10a5-1c44-e1fa-5b9a83e6b28a/01_Intro_1.png/600x900bb.jpg" alt="The BridgeAthletic app welcome screen" className="w-full h-auto rounded-lg" width={600} height={900} loading="lazy" decoding="async" />
                <img src="https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/2b/86/7b/2b867b73-427b-cedb-1bc2-0073b7dec2e5/02_Log_workouts_2.png/600x900bb.jpg" alt="Logging a workout in the BridgeAthletic app" className="w-full h-auto rounded-lg" width={600} height={900} loading="lazy" decoding="async" />
                <img src="https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/be/63/82/be6382b2-8712-d46d-e98d-ba06e717b074/03_Video_1.png/600x900bb.jpg" alt="An exercise video in the BridgeAthletic app" className="w-full h-auto rounded-lg" width={600} height={900} loading="lazy" decoding="async" />
              </div>
              <figcaption className="ml-small mt-4">Screenshots from the BridgeAthletic app: your session, logging your sets and a video for every exercise.</figcaption>
            </figure>
          </div>
        </section>

        {/* Guides */}
        <section id="blog" className="mt-14 lg:mt-[88px] scroll-mt-24">
          <Label>The guides</Label>
          <h2 className="ml-h2 mt-7 lg:mt-11 max-w-4xl">Every program has a guide that answers the questions first.</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mt-6 lg:mt-9">
            {GUIDES.map(g => (
              <li key={g.q} className="ml-card">
                <div className="ml-meta flex-wrap">
                  <span className="ml-tag">Coming soon</span>
                  <span>{g.tag}</span>
                </div>
                <span className="ml-h3 mt-3.5">{g.q}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Free guide */}
        <section id="guide" className="mt-14 lg:mt-[88px] bg-oat rounded-xl p-5 lg:p-10 flex flex-wrap items-center gap-6 lg:gap-14 scroll-mt-24">
          <img
            src="/images/site/recovery-guide-surf-1600.jpg"
            srcSet="/images/site/recovery-guide-surf-800.jpg 800w, /images/site/recovery-guide-surf-1600.jpg 1600w"
            sizes="(min-width: 1024px) 480px, 100vw"
            alt="A surfer on a large breaking wave"
            width={1600}
            height={1200}
            loading="lazy"
            decoding="async"
            className="block flex-[1_1_280px] lg:flex-[1_1_420px] min-w-0 max-w-[520px] w-full aspect-[4/3] object-cover rounded-lg"
          />
          <div className="flex-[1_1_280px] lg:flex-[1_1_480px] min-w-0">
            <div className="ml-meta">
              <span className="ml-tag">Free guide</span>
              <span>34 pages</span>
            </div>
            <h2 className="font-heading font-bold text-[26px] lg:text-[36px] leading-[1.12] tracking-[-0.02em] mt-3.5">
              Not ready to buy? Start with the free Recovery Guide.
            </h2>
            <p className="text-base leading-[1.55] text-body mt-3 max-w-[520px]">
              How to recover between sessions. Add your email and we send it now. We will also tell you when new programs land.
            </p>
            <GuideSignup placement="library" className="mt-5" />
          </div>
        </section>

        <div className="mt-7 ml-small flex flex-col gap-2 max-w-[900px]">
          <span>Prices in Australian dollars. These programs are general training advice and not medical advice. If you have a health condition, are pregnant or have not trained for a long time, check with your doctor before you start.</span>
          <span>Marin Lazic, ASCA Level 2 Strength and Conditioning Coach. Sydney.</span>
        </div>
      </main>
      <LibraryFooter />
    </div>
  );
}
