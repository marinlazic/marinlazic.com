import { PageBand } from "@/components/PageBand";
import { CallRequest } from "@/components/CallRequest";
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
          Request a short call
        </h1>
        <p className="text-mute leading-relaxed mb-8">
          Tell me where to reach you and what you want to cover. I reply by email with a few times.
          It is not a sales pitch, and asking for a call does not enrol you in anything.
        </p>
        <CallRequest placement="call_page" heading="Request a short call." />
        <p className="text-sm text-mute mt-8">
          Prefer to start with your numbers? <a href="/assessment" className="underline underline-offset-2 text-ink">Take the free assessment</a>.
        </p>
      </main>
      <footer className="border-t border-line px-5 py-8 text-center">
        <a href="/" className="text-xs text-black/50">
          Back to marinlazic.com
        </a>
      </footer>
    </div>
  );
}
