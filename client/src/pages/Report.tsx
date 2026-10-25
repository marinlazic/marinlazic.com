import { PageBand } from "@/components/PageBand";
import { useParams } from "wouter";
import { Download, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AnalysisSection, KickstartCheckoutButton } from "./Assessment";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black flex flex-col">
      <header className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <a href="/" className="font-heading font-bold text-sm tracking-[0.2em] uppercase" aria-label="Marin Lazic home">
            ML
          </a>
          <span className="text-[10px] tracking-[0.2em] uppercase text-black/40">Saved report</span>
        </div>
      </header>
      <PageBand src="/images/guide/lane.jpg" alt="A pool lane at dawn" word="report" emoji={"\u{1F4CA}"} pin="Your report" />
      <main className="flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="max-w-2xl mx-auto">{children}</div>
      </main>
      <footer className="border-t border-black/10 py-6">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <a href="/" className="text-xs tracking-[0.1em] uppercase text-black/40 hover:text-black transition-colors">
            Marin Lazic
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function Report() {
  const { token } = useParams<{ token: string }>();
  const query = trpc.report.get.useQuery({ token: token || "" }, { enabled: Boolean(token), retry: false });

  if (query.isLoading) {
    return (
      <Shell>
        <div className="w-5 h-5 border-2 border-black/20 border-t-black animate-spin" role="status" aria-label="Loading" />
      </Shell>
    );
  }

  const report = query.data;
  if (!report) {
    return (
      <Shell>
        <div className="w-3 h-3 bg-[#FFD400] mb-8" aria-hidden="true" />
        <h1 className="font-heading text-3xl sm:text-4xl font-bold uppercase tracking-[-0.035em] leading-[0.93] mb-6">
          Report not found
        </h1>
        <p className="text-base text-black/65 leading-relaxed mb-8">
          This link has expired or is not right. Reports stay available for 90 days. You can take the assessment again at any time.
        </p>
        <a href="/assessment" className="inline-flex bg-[#FFD400] text-black border-2 border-black text-xs tracking-[0.15em] uppercase px-6 py-3.5 hover:bg-black hover:text-[#FFD400] transition-colors font-bold">
          Take the assessment
        </a>
      </Shell>
    );
  }

  const firstName = (report.name || "").split(" ")[0] || "there";
  const expires = new Date(report.expiresAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Shell>
      <a href="/" className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors mb-8">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to site
      </a>
      <div className="w-3 h-3 bg-[#FFD400] mb-8" aria-hidden="true" />
      <p className="text-[10px] tracking-[0.2em] uppercase text-black font-semibold mb-4">Performance assessment</p>
      <h1 className="font-heading text-3xl sm:text-5xl font-bold uppercase tracking-[-0.035em] leading-[0.93] mb-6">
        {firstName}, your report
      </h1>
      <p className="text-sm text-black/50 mb-10">Available until {expires}.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <div className="border border-black/10 p-5 col-span-2 sm:col-span-1">
          <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 mb-2">Overall</p>
          <p className="font-heading text-4xl font-bold">{report.scores.overallPct}</p>
          <p className="text-xs text-black/50">out of 100</p>
        </div>
        {report.scores.categories.map(c => (
          <div key={c.id} className="border border-black/10 p-5">
            <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 mb-2">{c.name}</p>
            <p className="font-heading text-2xl font-bold">{c.percentage}</p>
          </div>
        ))}
      </div>

      {report.hasPdf && (
        <a
          href={report.pdfUrl}
          className="inline-flex items-center gap-2 border border-black px-6 py-3.5 text-xs tracking-[0.15em] uppercase font-bold hover:bg-black hover:text-white transition-colors mb-12"
        >
          <Download className="w-4 h-4" /> Download the PDF
        </a>
      )}

      <AnalysisSection analysisResult={report.analysis} analysisError={null} />

      <div className="border-t border-black/10 pt-10 mt-4">
        <h2 className="font-heading text-2xl font-bold uppercase tracking-tight mb-4">The 4 week programme</h2>
        <p className="text-sm sm:text-base text-black/60 leading-relaxed mb-6">
          A structured four week programme built from these answers. One payment of $299 AUD. Marin is in touch within one business day.
        </p>
        <KickstartCheckoutButton email={report.email} name={report.name || ""} source="report_page" />
      </div>
    </Shell>
  );
}
