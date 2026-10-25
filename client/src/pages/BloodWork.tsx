export default function BloodWork() {
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
            🩸 Blood Work Service
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12 sm:py-16">
        <div className="max-w-2xl w-full">
          <div className="w-3 h-3 bg-[#FFD400] mb-8" aria-hidden="true" />
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight leading-[0.95] mb-4">
            Blood Work Coaching Context
          </h1>
          <p className="text-base text-black/50 leading-relaxed mb-10 max-w-xl">
            Service scope and availability are pending confirmation. If
            available, this service will support coaching only after your
            treating clinician has ordered and interpreted any testing relevant
            to you.
          </p>

          <div className="space-y-10 mb-12">
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium mb-4">
                Proposed coaching scope
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#FFD400] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    Coaching context for training after you have discussed
                    testing and results with your GP or another appropriate
                    clinician.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#FFD400] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    Support to apply clinician-cleared exercise and nutrition
                    guidance within a coaching plan.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#FFD400] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    Coaching does not replace medical care or individual dietary
                    advice from an Accredited Practising Dietitian.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium mb-4">
                ⚙️ How it works
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-black font-bold mt-0.5 shrink-0">
                    1.
                  </span>
                  <p className="text-sm text-black/70 leading-relaxed">
                    Talk with your GP or suitable clinician about whether
                    testing is appropriate, what to order and how results should
                    be interpreted.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs text-black font-bold mt-0.5 shrink-0">
                    2.
                  </span>
                  <p className="text-sm text-black/70 leading-relaxed">
                    Share any clinician-cleared exercise or nutrition guidance
                    you want the coach to consider.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs text-black font-bold mt-0.5 shrink-0">
                    3.
                  </span>
                  <p className="text-sm text-black/70 leading-relaxed">
                    If the service proceeds, coaching can help reflect that
                    guidance in your training and general nutrition habits.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium mb-4">
                🎯 Who this is for
              </h2>
              <p className="text-sm text-black/70 leading-relaxed">
                People who have received relevant advice from a treating
                clinician and want coaching context for exercise and nutrition.
                Persistent fatigue, pain, sleep concerns or other health
                concerns should be discussed with a GP or appropriate clinician.
              </p>
            </div>

            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium mb-4">
                💰 Pricing
              </h2>
              <p className="text-sm text-black/70 leading-relaxed">
                [MARIN TO CONFIRM: price and availability]
              </p>
            </div>

            <div className="bg-black/5 p-5 border border-black/10">
              <p className="text-xs text-black/50 leading-relaxed">
                <strong className="text-black/70">Important:</strong> This
                proposed service is not available to order or use as a medical
                service. A clinician orders and interprets testing. Coaching is
                limited to clinician-cleared exercise and nutrition guidance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <a
              href="/#contact"
              className="inline-flex items-center bg-[#FFD400] text-black border-2 border-black text-xs tracking-[0.15em] uppercase px-8 py-4 hover:bg-black hover:text-[#FFD400] transition-colors font-bold"
            >
              Contact About Availability
            </a>
            <a
              href="/assessment"
              className="inline-flex items-center border border-black/20 text-black text-xs tracking-[0.15em] uppercase px-8 py-4 hover:border-black/60 transition-colors font-bold"
            >
              Take the Free Assessment First
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
