import { PageBand } from "@/components/PageBand";
export default function BookACall() {
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
      <PageBand src="/images/guide/coast.jpg" alt="Coastline near Sydney" word="call" emoji={"\u{1F4DE}"} pin="Book a call" position="center" />
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-16 sm:py-24">
        <div className="w-3 h-3 hidden mb-8" aria-hidden="true" />
        <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight mb-6">
          Coaching enquiries
        </h1>
        <p className="text-mute leading-relaxed mb-6">
          Online appointment booking is not currently available. You can apply
          for coaching and discuss your goals with Marin by email. You do not
          need a sales call to apply.
        </p>
        <p className="text-sm text-mute mb-10">
          If you came from an earlier booking link, use the application below.
          Submitting it does not take payment or enrol you.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/apply"
            className="bg-ink text-ivory rounded-lg hover:bg-[#3D3D3A] px-7 py-4 text-[15px] tracking-wider"
          >
            Apply for coaching
          </a>
          <a
            href="/assessment"
            className="px-7 py-4 text-[15px] tracking-wider bg-stone text-ink rounded-lg hover:bg-[#D9D5C9]"
          >
            Free online assessment
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
