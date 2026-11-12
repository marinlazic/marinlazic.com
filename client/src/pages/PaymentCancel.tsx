import { PageBand } from "@/components/PageBand";
import { ArrowRight, XCircle } from "lucide-react";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <a href="/" className="font-heading font-bold text-[20px] tracking-[-0.01em] text-ink no-underline">Marin Lazic</a>
          <span className="text-[13px] text-mute">Payment Cancelled</span>
        </div>
      </header>

      <PageBand src="/images/guide/shore.jpg" alt="Calm shoreline" word="paused" emoji={"\u23F8\uFE0F"} pin="No charge" />
      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <XCircle className="w-8 h-8 text-black" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            No Worries.
          </h1>
          <p className="text-base text-mute leading-relaxed mb-4">
            Your payment was cancelled and you haven't been charged. The 4-Week Kickstart Program is still available whenever you're ready.
          </p>
          <p className="text-sm text-mute leading-relaxed mb-10">
            If you have any questions about the program or want to chat before committing, feel free to reach out through the contact form.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/assessment"
              className="inline-flex items-center justify-center gap-2 bg-ink text-ivory rounded-lg hover:bg-[#3D3D3A] px-8 py-4 text-[15px] font-medium transition-colors"
            >
              Retake Assessment <ArrowRight className="w-3 h-3" />
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 text-ink px-8 py-4 text-[15px] font-medium hover:text-black transition-colors bg-stone rounded-lg hover:bg-[#D9D5C9]"
            >
              Back to Site
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-line py-6">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <p className="text-[13px] text-mute">
            Marin Lazic. Health and Performance Coach. Sydney, Australia.
          </p>
        </div>
      </footer>
    </div>
  );
}
