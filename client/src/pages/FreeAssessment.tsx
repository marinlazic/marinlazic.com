import { PageBand } from "@/components/PageBand";
export default function FreeAssessment() {
  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black flex flex-col">
      <header className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <a
            href="/"
            className="font-heading font-bold text-sm tracking-[0.2em]"
          >
            ML
          </a>
          <a
            href="/apply"
            className="text-xs text-black uppercase tracking-wider"
          >
            Apply for coaching
          </a>
        </div>
      </header>
      <PageBand src="/images/guide/squad.jpg" alt="A squad training on a field" word="start" emoji={"\u{1F680}"} pin="Free assessment" position="center" />
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-16 sm:py-24">
        <div className="w-3 h-3 bg-[#FFD400] mb-8" aria-hidden="true" />
        <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight mb-6">
          Free online performance assessment
        </h1>
        <p className="text-black/60 leading-relaxed mb-8">
          Review your goals, training, sleep, stress, nutrition and recovery.
          The questionnaire produces a coaching score and an AI assisted report
          from your answers. It is a starting point for discussion, not a
          medical diagnosis.
        </p>
        <h2 className="font-heading text-xl font-bold mb-4">
          No booking needed
        </h2>
        <p className="text-sm text-black/50 leading-relaxed mb-10">
          Start the questionnaire below. If you want to work with Marin, you can
          also apply directly and follow up by email. Appointment booking is not
          currently available.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/assessment"
            className="bg-[#FFD400] text-black border-2 border-black px-7 py-4 text-xs uppercase tracking-wider"
          >
            Start the free assessment
          </a>
          <a
            href="/apply"
            className="border border-black/20 px-7 py-4 text-xs uppercase tracking-wider"
          >
            Apply for coaching
          </a>
        </div>
      </main>
      <footer className="border-t border-black/10 px-5 py-8 text-center">
        <a href="/" className="text-xs text-black/50">
          Back to marinlazic.com
        </a>
      </footer>
    </div>
  );
}
