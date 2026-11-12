import { PageBand } from "@/components/PageBand";
export default function FreeAssessment() {
  return (
    <div className="min-h-screen bg-ivory text-black flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <a
            href="/"
            className="font-heading font-bold text-[20px] tracking-[-0.01em] text-ink no-underline"
          >
            Marin Lazic
          </a>
          <a
            href="/apply"
            className="text-[13px] font-medium text-mute hover:text-ink"
          >
            Apply for coaching
          </a>
        </div>
      </header>
      <PageBand src="/images/guide/squad.jpg" alt="A squad training on a field" word="start" emoji={"\u{1F680}"} pin="Free assessment" position="center" />
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-16 sm:py-24">
        <div className="w-3 h-3 hidden mb-8" aria-hidden="true" />
        <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight mb-6">
          Free online performance assessment
        </h1>
        <p className="text-mute leading-relaxed mb-8">
          Review your goals, training, sleep, stress, nutrition and recovery.
          The questionnaire produces a coaching score and an AI assisted report
          from your answers. It is a starting point for discussion, not a
          medical diagnosis.
        </p>
        <h2 className="font-heading text-xl font-bold mb-4">
          No booking needed
        </h2>
        <p className="text-sm text-mute leading-relaxed mb-10">
          Start the questionnaire below. If you want to work with Marin, you can
          also apply directly and follow up by email. Appointment booking is not
          currently available.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/assessment"
            className="bg-ink text-ivory rounded-lg hover:bg-[#3D3D3A] px-7 py-4 text-[15px] tracking-wider"
          >
            Start the free assessment
          </a>
          <a
            href="/apply"
            className="px-7 py-4 text-[15px] tracking-wider bg-stone text-ink rounded-lg hover:bg-[#D9D5C9]"
          >
            Apply for coaching
          </a>
        </div>
      </main>
      <footer className="border-t border-line px-5 py-8 text-center">
        <a href="/" className="text-xs text-black/50">
          Back to marinlazic.com
        </a>
      </footer>
    </div>
  );
}
