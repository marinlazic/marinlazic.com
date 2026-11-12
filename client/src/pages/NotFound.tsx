import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory text-ink flex flex-col">
      <SiteNav />
      <main className="flex-1">
        <div className="ml-wrap py-20 sm:py-28">
          <p className="ml-meta mb-4">Page not found</p>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl tracking-[-0.02em] leading-[1.08] mb-4 max-w-2xl">
            This page does not exist.
          </h1>
          <p className="text-[17px] text-body leading-relaxed mb-8 max-w-xl">
            The link may be old or mistyped. Try one of these instead.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/" className="ml-btn ml-btn-dark">Home</a>
            <a href="/assessment" className="ml-btn">Take the assessment</a>
            <a href="/library" className="ml-btn">Program library</a>
            <a href="/resources" className="ml-btn">Resources</a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
