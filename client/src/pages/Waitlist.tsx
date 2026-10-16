import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Loader2 } from "lucide-react";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const joinWaitlist = trpc.leads.submit.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !name.trim()) {
      setError("Name and email are required.");
      return;
    }

    try {
      await joinWaitlist.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        source: "waitlist",
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Try again.");
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-black/10">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
            <a
              href="/"
              className="font-heading font-bold text-sm tracking-[0.2em] uppercase"
            >
              ML
            </a>
            <span className="text-[10px] tracking-[0.2em] uppercase text-black/40">
              Waitlist
            </span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-5 py-16">
          <div className="max-w-lg w-full text-center">
            <CheckCircle className="w-16 h-16 text-[#E53935] mx-auto mb-8" />
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight mb-4">
              You are on the list
            </h1>
            <p className="text-base text-black/50 leading-relaxed mb-8">
              Your interest has been recorded. Pricing, dates, availability and
              inclusions will be confirmed before enrolment.
            </p>
            <a
              href="/"
              className="inline-flex items-center border border-black/20 px-8 py-4 text-xs tracking-[0.15em] uppercase font-bold text-black/60 hover:text-black hover:border-black transition-colors"
            >
              Back to Site
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <a
            href="/"
            className="font-heading font-bold text-sm tracking-[0.2em] uppercase"
          >
            ML
          </a>
          <span className="text-[10px] tracking-[0.2em] uppercase text-black/40">
            Waitlist
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12 sm:py-16">
        <div className="max-w-2xl w-full">
          <div className="w-3 h-3 bg-[#E53935] mb-8" aria-hidden="true" />
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight leading-[0.95] mb-4">
            Join the Waitlist
          </h1>
          <p className="text-base text-black/50 leading-relaxed mb-10 max-w-xl">
            Register interest in future structured training programmes. Joining
            the waitlist does not enrol you or take payment. Details and
            availability are not yet confirmed.
          </p>

          <div className="space-y-6 mb-10">
            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium mb-3">
                What the program is
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#E53935] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    The intended focus is strength and aerobic conditioning with
                    a manageable training plan.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#E53935] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    Sleep and recovery habits can support the training plan.
                    Final inclusions will be confirmed before enrolment.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#E53935] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    Training should fit your available time, starting fitness
                    and individual context.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium mb-3">
                What the waitlist gets you
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#E53935] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    An email update if a programme becomes available.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#E53935] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    Pricing, dates and delivery details before you decide.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#E53935] mt-2 shrink-0" />
                  <p className="text-sm text-black/70 leading-relaxed">
                    Registering interest is not a purchase or a commitment to
                    join.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full border border-black/20 px-5 py-4 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-black/30"
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-black/20 px-5 py-4 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-black/30"
              />
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={joinWaitlist.isPending}
              className="w-full bg-[#E53935] text-white text-xs tracking-[0.2em] uppercase font-bold py-4 hover:bg-[#C62828] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {joinWaitlist.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Join the Waitlist"
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="border-t border-black/10 py-6">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <a
            href="/"
            className="text-xs tracking-[0.1em] uppercase text-black/40 hover:text-black transition-colors"
          >
            Back to marinlazic.com
          </a>
        </div>
      </footer>
    </div>
  );
}
