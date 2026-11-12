// /library/:slug: one program. The Buy button goes to the Bridge checkout page.
import { useRoute } from "wouter";
import { useAnalytics } from "@/hooks/useAnalytics";
import { findProgram, programLength } from "@shared/programs";
import NotFound from "./NotFound";
import { Navigation } from "./InformationPage";
import { LibraryFooter } from "./Library";
import { ProgramThumb } from "@/components/ProgramThumb";

export default function LibraryProgram() {
  const { track } = useAnalytics();
  const [, params] = useRoute("/library/:slug");
  const p = params ? findProgram(params.slug) : undefined;
  if (!p) return <NotFound />;
  return (
    <div className="min-h-screen bg-ivory text-black flex flex-col">
      <Navigation />
      <main className="flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <nav aria-label="Breadcrumb" className="mb-8 text-[13px] text-mute">
            <a href="/" className="hover:text-black transition-colors">Home</a>
            <span className="mx-2" aria-hidden="true">/</span>
            <a href="/library" className="hover:text-black transition-colors">Program library</a>
            <span className="mx-2" aria-hidden="true">/</span>
            <span aria-current="page" className="text-body">{p.name}</span>
          </nav>
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <ProgramThumb p={p} eager />
            <div>
              <div className="w-3 h-3 hidden mb-8" aria-hidden="true" />
              <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-[-0.03em] leading-[0.93] mb-6">
                {p.name}
              </h1>
              <p className="text-base sm:text-lg text-black/65 leading-relaxed mb-6">{p.description}</p>
              <p className="text-[13px] text-mute mb-6">
                {programLength(p)} · {p.place} · {p.level}
              </p>
              <div className="flex items-center gap-6">
                <a
                  href={p.buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("cta_click", { button: `library_buy_${p.slug}` })}
                  className="inline-flex bg-ink text-ivory rounded-lg hover:bg-[#3D3D3A] text-[15px] px-8 py-4 transition-colors font-medium"
                >
                  Buy on Bridge
                </a>
              </div>
              <p className="text-xs text-mute mt-4">
                You check out on Bridge. The program then appears in the Bridge app.
              </p>
            </div>
          </div>

          <section className="mt-16 border-t border-line pt-7 max-w-3xl">
            <h2 className="text-[13px] text-mute font-medium mb-5">Inside the program</h2>
            <ul className="space-y-3">
              {p.highlights.map(t => (
                <li key={t} className="text-sm sm:text-base text-body leading-relaxed">{t}</li>
              ))}
            </ul>
          </section>

          <div className="mt-16 grid md:grid-cols-2 gap-10">
            <section className="border-t border-line pt-7">
              <h2 className="text-[13px] text-mute font-medium mb-5">Who it is for</h2>
              <ul className="space-y-3">
                {p.forWho.map(t => (
                  <li key={t} className="text-sm sm:text-base text-body leading-relaxed">{t}</li>
                ))}
              </ul>
            </section>
            <section className="border-t border-line pt-7">
              <h2 className="text-[13px] text-mute font-medium mb-5">What you get</h2>
              <ul className="space-y-3">
                {p.includes.map(t => (
                  <li key={t} className="text-sm sm:text-base text-body leading-relaxed">{t}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-16 border-t border-line pt-7 max-w-3xl">
            <h2 className="text-[13px] text-mute font-medium mb-5">Questions</h2>
            <dl className="space-y-6">
              {p.faqs.map(f => (
                <div key={f.q}>
                  <dt className="font-heading font-bold text-lg mb-1">{f.q}</dt>
                  <dd className="text-sm sm:text-base text-body leading-relaxed">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="mt-16 text-sm">
            <a href="/library" className="underline hover:text-black/60">Back to the program library</a>
          </p>
        </div>
      </main>
      <LibraryFooter />
    </div>
  );
}
