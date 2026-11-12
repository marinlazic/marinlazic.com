import { PageBand } from "@/components/PageBand";
import { ProgrammeCheckout } from "./Assessment";

export default function ProgramDetails() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <a
            href="/"
            className="font-heading font-bold text-[20px] tracking-[-0.01em] text-ink no-underline"
          >
            Marin Lazic
          </a>
          <span className="text-[13px] text-mute">
            Program
          </span>
        </div>
      </header>

      <PageBand src="/images/guide/slam.jpg" alt="Athlete doing a medicine ball slam" word="program" emoji={"\u{1F525}"} pin="Program" position="center" />
      <main className="flex-1 flex items-center justify-center px-5 py-12 sm:py-16">
        <div className="max-w-2xl w-full">
          <div className="w-3 h-3 hidden mb-8" aria-hidden="true" />
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[0.95] mb-4">
            The Program
          </h1>
          <p className="text-base text-mute leading-relaxed mb-10 max-w-xl">
            Structured strength and conditioning for busy adults. Training,
            recovery and progression are planned around your goals, health
            context and available time.
          </p>

          <div className="space-y-10 mb-12">
            <div>
              <h2 className="text-[13px] text-mute font-medium mb-4">
                How it works
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-ink rounded-full mt-2 shrink-0" />
                  <p className="text-sm text-body leading-relaxed">
                    Start with the Performance Assessment or an application.
                    Your answers help organise goals, training history and
                    constraints. The questionnaire is not a medical diagnosis.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-ink rounded-full mt-2 shrink-0" />
                  <p className="text-sm text-body leading-relaxed">
                    The plan considers your schedule, goals, available
                    equipment, training experience and recovery.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-ink rounded-full mt-2 shrink-0" />
                  <p className="text-sm text-body leading-relaxed">
                    Strength, aerobic conditioning, movement practice and
                    recovery are planned together, with adjustments when
                    circumstances change.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-ink rounded-full mt-2 shrink-0" />
                  <p className="text-sm text-body leading-relaxed">
                    Track suitable strength and fitness measures alongside
                    sleep, symptoms and how sessions feel. Wearable trends
                    provide context, not a diagnosis or a guaranteed outcome.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-[13px] text-mute font-medium mb-4">
                What you get
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-ink rounded-full mt-2 shrink-0" />
                  <p className="text-sm text-body leading-relaxed">
                    A structured training plan delivered through Bridge
                    Athletic. Review timing and the coaching scope are agreed
                    before you start.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-ink rounded-full mt-2 shrink-0" />
                  <p className="text-sm text-body leading-relaxed">
                    Practical sleep, recovery and general nutrition habits.
                    Clinical or individual dietary needs should be discussed
                    with the appropriate healthcare professional.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-ink rounded-full mt-2 shrink-0" />
                  <p className="text-sm text-body leading-relaxed">
                    If you use a wearable, use its trends with the rest of your
                    training context. Different devices and methods are not
                    interchangeable.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-ink rounded-full mt-2 shrink-0" />
                  <p className="text-sm text-body leading-relaxed">
                    Communication and programme adjustments are agreed as part
                    of coaching. Contact begins through the application and
                    email follow up.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-[13px] text-mute font-medium mb-4">
                Who this is for
              </h2>
              <p className="text-sm text-body leading-relaxed">
                Busy adults who want a repeatable training plan. The right
                weekly dose depends on your starting point and commitments.
                Coaching supports training decisions and does not treat illness.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <ProgrammeCheckout source="program_page" />
          </div>

          <div className="flex flex-wrap gap-4">
            <a
              href="/apply"
              className="inline-flex items-center bg-ink text-ivory rounded-lg hover:bg-[#3D3D3A] text-[15px] px-8 py-4 transition-colors font-medium"
            >
              Apply for Coaching
            </a>
            <a
              href="/assessment"
              className="inline-flex items-center text-ink text-[15px] px-8 py-4 transition-colors font-medium bg-stone rounded-lg hover:bg-[#D9D5C9]"
            >
              Take the Free Assessment
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-line py-6">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <a
            href="/"
            className="text-[13px] text-mute hover:text-black transition-colors"
          >
            Back to marinlazic.com
          </a>
        </div>
      </footer>
    </div>
  );
}
