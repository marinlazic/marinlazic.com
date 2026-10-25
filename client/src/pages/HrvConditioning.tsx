export default function HrvConditioning() {
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
            ❤️ HRV Conditioning
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12 sm:py-16">
        <div className="max-w-2xl w-full">
          <div className="w-3 h-3 bg-[#FFD400] mb-8" aria-hidden="true" />
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight leading-[0.95] mb-4">
            HRV Guided Conditioning
          </h1>
          <p className="text-base text-black/50 leading-relaxed mb-10 max-w-xl">
            A proposed conditioning format that may use heart rate variability
            as one coaching input. HRV does not decide training on its own.
            Device-consistent individual trends are considered alongside sleep,
            symptoms and recent training load.
          </p>

          <div className="space-y-10 mb-12">
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium mb-4">
                ⚙️ How it works
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#FFD400] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    If you use HRV, take readings with the same device and
                    method so your individual trend can be considered
                    consistently.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#FFD400] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    An upward or steady personal trend may be discussed with
                    sleep, symptoms and recent load when considering a harder
                    session.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#FFD400] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    A mixed trend may lead to a discussion about keeping the
                    session easier, shortening it or selecting a lower-load
                    option.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#FFD400] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    A sustained change from your usual trend, especially with
                    symptoms or poor sleep, is a prompt to review load and seek
                    clinician advice for health concerns or red flags.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium mb-4">
                Illustrative format, pending confirmation
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#FFD400] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    Illustrative session options may include easier aerobic
                    work, intervals or rest, selected in context rather than
                    from HRV alone.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#FFD400] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    Session frequency, intensity and progression would be
                    tailored to training history, current capacity and relevant
                    clinician or allied health guidance.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#FFD400] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    A simple tracking approach may help record device-consistent
                    HRV trends alongside sleep, symptoms and training load.
                    Outcomes vary and are not guaranteed.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#FFD400] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    Check-ins, group delivery and support arrangements are not
                    confirmed and will be published only if the service
                    proceeds.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium mb-4">
                🎯 Who this is for
              </h2>
              <p className="text-sm text-black/70 leading-relaxed">
                Adults who already use a wearable capable of estimating HRV and
                want coaching context for conditioning. It is not a health
                assessment. Persistent fatigue, pain, sleep concerns, chest
                symptoms, dizziness or other red flags should be discussed with
                a GP or appropriate clinician.
              </p>
            </div>

            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium mb-4">
                Pricing and start date
              </h2>
              <p className="text-sm text-black/70 leading-relaxed">
                [MARIN TO CONFIRM: price, cohort start date, and group size]
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <a
              href="/waitlist"
              className="inline-flex items-center bg-[#FFD400] text-black border-2 border-black text-xs tracking-[0.15em] uppercase px-8 py-4 hover:bg-black hover:text-[#FFD400] transition-colors font-bold"
            >
              Join the Waitlist
            </a>
            <a
              href="/assessment"
              className="inline-flex items-center border border-black/20 text-black text-xs tracking-[0.15em] uppercase px-8 py-4 hover:border-black/60 transition-colors font-bold"
            >
              Take the Free Assessment
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-black/10 py-6">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <a
            href="/"
            className="text-xs tracking-[0.1em] uppercase text-black/40 hover:text-black transition-colors"
          >
            Back to marinlazic.com
          </a>
        </div>
      </footer>
    </div>
  );
}
