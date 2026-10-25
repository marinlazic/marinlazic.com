export default function BookACall() {
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
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-16 sm:py-24">
        <div className="w-3 h-3 bg-[#FFD400] mb-8" aria-hidden="true" />
        <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight mb-6">
          Coaching enquiries
        </h1>
        <p className="text-black/60 leading-relaxed mb-6">
          Online appointment booking is not currently available. You can apply
          for coaching and discuss your goals with Marin by email. You do not
          need a sales call to apply.
        </p>
        <p className="text-sm text-black/50 mb-10">
          If you came from an earlier booking link, use the application below.
          Submitting it does not take payment or enrol you.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/apply"
            className="bg-[#FFD400] text-black border-2 border-black px-7 py-4 text-xs uppercase tracking-wider"
          >
            Apply for coaching
          </a>
          <a
            href="/assessment"
            className="border border-black/20 px-7 py-4 text-xs uppercase tracking-wider"
          >
            Free online assessment
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
