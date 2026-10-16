import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  CheckCircle, Loader2, ArrowRight, Mail, Dumbbell, Moon,
  Utensils, Heart, Calendar, MessageSquare, BarChart3, Zap
} from "lucide-react";

// ─── Confetti Particle ─────────────────────────────────
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const left = Math.random() * 100;
  const size = 4 + Math.random() * 8;
  const duration = 2 + Math.random() * 2;
  const rotation = Math.random() * 360;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${left}%`,
        top: -10,
        width: size,
        height: size * (0.4 + Math.random() * 0.6),
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? "50%" : "0",
      }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{
        y: [0, 400 + Math.random() * 300],
        opacity: [1, 1, 0],
        rotate: rotation + 720,
        x: [0, (Math.random() - 0.5) * 200],
      }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
    />
  );
}

function Confetti() {
  const colors = ["#E53935", "#000000", "#FFD700", "#4CAF50", "#2196F3", "#FF9800"];
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.8,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map(p => (
        <ConfettiParticle key={p.id} delay={p.delay} color={p.color} />
      ))}
    </div>
  );
}

// ─── What's Included Card ──────────────────────────────
function IncludedItem({ icon, title, description, delay }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-start gap-3"
    >
      <div className="w-8 h-8 bg-black/5 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-black">{title}</p>
        <p className="text-xs text-black/40 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────
export default function PaymentSuccess() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const sessionId = params.get("session_id");
  const [showConfetti, setShowConfetti] = useState(false);

  const { data: session, isLoading } = trpc.checkout.getSession.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const isPaid = session?.paymentStatus === "paid";
  const { track } = useAnalytics();

  useEffect(() => {
    if (isPaid) {
      track("purchase_completed", { product: session?.productId || "kickstart-4-week" });
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isPaid]);

  // ─── Loading State ───────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-10 h-10 animate-spin text-[#E53935] mx-auto mb-6" />
          <p className="text-sm text-black/40 tracking-[0.1em] uppercase">Confirming your payment...</p>
          <p className="text-xs text-black/25 mt-2">This usually takes just a moment.</p>
        </motion.div>
      </div>
    );
  }

  // ─── Paid / Success State ────────────────────────────
  if (isPaid) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

        <header className="border-b border-black/10">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
            <a href="/" className="font-heading font-bold text-sm tracking-[0.2em] uppercase">ML</a>
            <span className="text-[10px] tracking-[0.2em] uppercase text-black/40">Thank You</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 py-12 sm:py-16">
          <div className="max-w-2xl w-full">
            {/* Hero confirmation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-3 h-3 bg-[#E53935] mx-auto mb-6" />
                <h1 className="font-heading text-4xl sm:text-5xl font-bold uppercase tracking-tight leading-[0.95] mb-4">
                  Welcome to<br />the Team.
                </h1>
                <p className="text-lg text-black/50 leading-relaxed max-w-md mx-auto">
                  Your 4-Week Kickstart Program is confirmed. This is where things start to change.
                </p>
              </motion.div>
            </motion.div>

            {/* Personal message from Marin */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-black text-white p-6 sm:p-8 mb-8"
            >
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-medium mb-4">A Note from Marin</p>
              <p className="text-sm text-white/80 leading-relaxed mb-3">
                Thank you for trusting me with your health and performance. I don't take that lightly.
              </p>
              <p className="text-sm text-white/80 leading-relaxed mb-3">
                I'm going to personally review every answer from your assessment and build a program that's specific to where you are right now, not where some generic template thinks you should be.
              </p>
              <p className="text-sm text-white/80 leading-relaxed">
                I will be in touch within one business day. In the meantime, get some sleep. You're going to need the energy.
              </p>
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-xs text-white/40 italic">Marin Lazic</p>
                <p className="text-[10px] text-white/25">Health & Performance Coach</p>
              </div>
            </motion.div>

            {/* What Happens Next - Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="border border-black/10 p-6 sm:p-8 mb-8"
            >
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-6">What Happens Next</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <span className="w-8 h-8 bg-[#E53935] text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                    <div className="w-px h-full bg-black/10 mt-1" />
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-bold text-black uppercase tracking-tight">Now: Check Your Inbox</p>
                    <p className="text-xs text-black/40 leading-relaxed mt-1">
                      You'll receive a payment confirmation from Stripe. Save it for your records.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <span className="w-8 h-8 bg-[#E53935] text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <div className="w-px h-full bg-black/10 mt-1" />
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-bold text-black uppercase tracking-tight">Within 24 Hours: Your Program</p>
                    <p className="text-xs text-black/40 leading-relaxed mt-1">
                      I'll personally review your assessment results and build your customised 4-week training, sleep, and recovery program.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <span className="w-8 h-8 bg-[#E53935] text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <div className="w-px h-full bg-black/10 mt-1" />
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-bold text-black uppercase tracking-tight">Week 1: Execute & Track</p>
                    <p className="text-xs text-black/40 leading-relaxed mt-1">
                      Follow the program, track your metrics, and start building momentum. Your first weekly check-in will be at the end of Week 1.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-8 h-8 bg-black text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
                  <div>
                    <p className="text-sm font-bold text-black uppercase tracking-tight">Week 4: Review & Level Up</p>
                    <p className="text-xs text-black/40 leading-relaxed mt-1">
                      We'll review your progress and discuss whether you're ready for the full Elite Coaching experience.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* What's Included */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-[#FAFAFA] border border-black/10 p-6 sm:p-8 mb-8"
            >
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium mb-6">What's Included in Your Program</h3>
              <div className="grid sm:grid-cols-2 gap-5">
                <IncludedItem
                  icon={<Dumbbell className="w-4 h-4 text-black/50" />}
                  title="4-Week Training Program"
                  description="Periodised and built around your current fitness level, injuries, and goals."
                  delay={1.0}
                />
                <IncludedItem
                  icon={<Moon className="w-4 h-4 text-black/50" />}
                  title="Sleep Optimisation Protocol"
                  description="Specific strategies based on your sleep patterns and schedule."
                  delay={1.1}
                />
                <IncludedItem
                  icon={<Heart className="w-4 h-4 text-black/50" />}
                  title="Recovery Framework"
                  description="Active and passive recovery methods tailored to your training load."
                  delay={1.2}
                />
                <IncludedItem
                  icon={<Utensils className="w-4 h-4 text-black/50" />}
                  title="Nutrition Guidelines"
                  description="Practical fuelling strategies that fit your lifestyle and goals."
                  delay={1.3}
                />
                <IncludedItem
                  icon={<MessageSquare className="w-4 h-4 text-black/50" />}
                  title="Weekly Email Check-ins"
                  description="Progress tracking, adjustments, and accountability every week."
                  delay={1.4}
                />
                <IncludedItem
                  icon={<BarChart3 className="w-4 h-4 text-black/50" />}
                  title="Assessment-Based Programming"
                  description="Everything is built from your specific intake data. No cookie-cutter plans."
                  delay={1.5}
                />
              </div>
            </motion.div>

            {/* Email confirmation */}
            {session?.customerEmail && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-center mb-8"
              >
                <p className="text-xs text-black/30 flex items-center justify-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Receipt sent to <span className="font-medium text-black/50">{session.customerEmail}</span>
                </p>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="text-center"
            >
              <a
                href="/"
                className="inline-flex items-center gap-2 bg-black text-white px-10 py-4 text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#E53935] transition-colors"
              >
                Back to Site <ArrowRight className="w-3 h-3" />
              </a>
              <p className="text-[10px] text-black/25 mt-4 tracking-wide">
                Questions? Reach out through the contact form anytime.
              </p>
            </motion.div>
          </div>
        </main>

        <footer className="border-t border-black/10 py-6 mt-8">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
            <p className="text-[10px] tracking-[0.15em] uppercase text-black/30">
              Marin Lazic. Health and Performance Coach. Sydney, Australia.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // ─── Processing / Pending State ──────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <a href="/" className="font-heading font-bold text-sm tracking-[0.2em] uppercase">ML</a>
          <span className="text-[10px] tracking-[0.2em] uppercase text-black/40">Processing Payment</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full text-center"
        >
          <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-4">
            Almost There...
          </h1>
          <p className="text-base text-black/50 leading-relaxed mb-4">
            Your payment is being processed. This usually takes just a moment.
          </p>
          <p className="text-sm text-black/30 leading-relaxed mb-10">
            If you've already been charged, don't worry. Your program is on its way and you'll receive a confirmation email shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#E53935] transition-colors"
            >
              <Zap className="w-3 h-3" /> Refresh Status
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-black/20 text-black/60 px-8 py-4 text-xs tracking-[0.15em] uppercase font-bold hover:text-black hover:border-black transition-colors"
            >
              Back to Site
            </a>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-black/10 py-6">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <p className="text-[10px] tracking-[0.15em] uppercase text-black/30">
            Marin Lazic. Health and Performance Coach. Sydney, Australia.
          </p>
        </div>
      </footer>
    </div>
  );
}
