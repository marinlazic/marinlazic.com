import { useParams } from "wouter";
import { Download, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AnalysisSection, KickstartCheckoutButton } from "./Assessment";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory text-black flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <a href="/" className="font-heading font-bold text-[20px] tracking-[-0.01em] text-ink no-underline" aria-label="Marin Lazic home">
            Marin Lazic
          </a>
          <span className="text-[13px] text-mute">Saved report</span>
        </div>
      </header>
      <main className="flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="max-w-2xl mx-auto">{children}</div>
      </main>
      <footer className="border-t border-line py-6">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <a href="/" className="text-[13px] text-mute hover:text-ink transition-colors">
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
        <div className="w-5 h-5 border-2 border-[#C9C6BA] border-t-black rounded-full animate-spin" role="status" aria-label="Loading" />
      </Shell>
    );
  }

  const report = query.data;
  if (!report) {
    return (
      <Shell>
        <div className="w-3 h-3 hidden mb-8" aria-hidden="true" />
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-[-0.02em] leading-[1.08] mb-6">
          Report not found
        </h1>
        <p className="text-base text-body leading-relaxed mb-8">
          This link has expired or is not right. Reports stay available for 90 days. You can take the assessment again at any time.
        </p>
        <a href="/assessment" className="inline-flex bg-ink text-ivory rounded-lg hover:bg-[#3D3D3A] text-[15px] px-6 py-3.5 transition-colors font-medium">
          Take the assessment
        </a>
      </Shell>
    );
  }

  const firstName = (report.name || "").split(" ")[0] || "there";
  const expires = new Date(report.expiresAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Shell>
      <a href="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-mute hover:text-ink transition-colors mb-8">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to site
      </a>
      <div className="w-3 h-3 hidden mb-8" aria-hidden="true" />
      <p className="ml-meta mb-4">Performance Assessment</p>
      <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-[-0.02em] leading-[1.06] mb-6">
        {firstName}, your report
      </h1>
      <p className="text-sm text-mute mb-10">Available until {expires}.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-oat rounded-xl p-5 col-span-2 sm:col-span-1">
          <p className="text-[13px] text-mute mb-2">Overall</p>
          <p className="font-heading text-4xl font-bold">{report.scores.overallPct}</p>
          <p className="text-xs text-mute">out of 100</p>
        </div>
        {report.scores.categories.map(c => (
          <div key={c.id} className="bg-oat rounded-xl p-5">
            <p className="text-[13px] text-mute mb-2">{c.name}</p>
            <p className="font-heading text-2xl font-bold">{c.percentage}</p>
          </div>
        ))}
      </div>

      {report.hasPdf && (
        <a
          href={report.pdfUrl}
          className="inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-medium transition-colors mb-12 bg-stone text-ink rounded-lg hover:bg-[#D9D5C9]"
        >
          <Download className="w-4 h-4" /> Download the PDF
        </a>
      )}

      <AnalysisSection analysisResult={report.analysis} analysisError={null} />

      <div className="border-t border-line pt-10 mt-4">
        <h2 className="font-heading text-2xl font-bold tracking-[-0.01em] mb-4">The 4 week programme</h2>
        <p className="text-sm sm:text-base text-mute leading-relaxed mb-6">
          A structured four week programme built from these answers. One payment. Marin is in touch within one business day.
        </p>
        <KickstartCheckoutButton email={report.email} name={report.name || ""} source="report_page" />
      </div>
    </Shell>
  );
}
