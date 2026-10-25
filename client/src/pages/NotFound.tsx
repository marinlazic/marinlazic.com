import { PageBand } from "@/components/PageBand";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black flex flex-col">
      <header className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <a href="/" className="font-heading font-bold text-sm tracking-[0.2em] uppercase">ML</a>
          <span className="text-[11px] tracking-[0.2em] uppercase text-black/60">Page not found</span>
        </div>
      </header>
      <PageBand src="/images/guide/ladder.jpg" alt="A pool ladder" word="oops" emoji={"\u{1F937}"} pin="404" />
      <main className="flex-1 px-5 py-14 sm:px-8 lg:px-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading font-bold text-4xl sm:text-5xl tracking-[-0.03em] leading-[1.06] mb-4">This page does not exist.</h1>
          <p className="text-base text-black/70 leading-relaxed mb-8">The link may be old or mistyped. Try one of these instead.</p>
          <div className="flex flex-wrap gap-3">
            <a href="/" className="px-6 py-3 bg-[#FFD400] border-2 border-black text-xs font-semibold tracking-[0.15em] uppercase">Home</a>
            <a href="/library" className="px-6 py-3 border-2 border-black text-xs font-semibold tracking-[0.15em] uppercase">Program library</a>
            <a href="/resources" className="px-6 py-3 border-2 border-black text-xs font-semibold tracking-[0.15em] uppercase">Resources</a>
          </div>
        </div>
      </main>
    </div>
  );
}
