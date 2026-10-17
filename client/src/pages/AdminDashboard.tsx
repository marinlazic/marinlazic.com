import { useAuth } from "@/_core/hooks/useAuth";
import { loginWithPassword } from "@/const";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, ClipboardList, FileText, Globe, LayoutDashboard, LogOut, Server, Users } from "lucide-react";
import { Overview } from "./admin/Overview";
import { Contacts, ContactDrawer } from "./admin/Contacts";
import { Applications } from "./admin/Applications";
import { Assessments } from "./admin/Assessments";
import { Content } from "./admin/Content";
import { Traffic } from "./admin/Traffic";
import { System } from "./admin/System";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "applications", label: "Applications", icon: ClipboardList },
  { id: "assessments", label: "Assessments", icon: BarChart3 },
  { id: "content", label: "Content", icon: FileText },
  { id: "traffic", label: "Traffic", icon: Globe },
  { id: "system", label: "System", icon: Server },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form
        className="text-center max-w-sm w-full px-6"
        onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const ok = await loginWithPassword(password);
          setBusy(false);
          if (ok) onSuccess();
          else setError("Incorrect password.");
        }}
      >
        <div className="w-3 h-3 bg-[#E53935] mx-auto mb-6" />
        <h1 className="font-heading font-bold text-2xl mb-3">Dashboard</h1>
        <p className="text-sm text-black/50 mb-8">Enter the admin password.</p>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border border-black/20 px-4 py-3 text-sm mb-4 focus:outline-none focus:border-black"
          placeholder="Password"
          aria-label="Password"
        />
        {error && <p className="text-xs text-[#E53935] mb-4">{error}</p>}
        <button type="submit" disabled={busy || !password} className="inline-flex bg-black text-white text-xs tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-black/80 transition-colors font-medium disabled:opacity-50">
          {busy ? "Signing in" : "Sign In"}
        </button>
      </form>
    </div>
  );
}

function sectionFromPath(path: string): SectionId {
  const seg = path.replace(/^\/admin\/?/, "").split("/")[0];
  return (SECTIONS.find(s => s.id === seg)?.id ?? "overview") as SectionId;
}

export default function AdminDashboard() {
  const { user, loading, logout, refresh } = useAuth();
  const [location, navigate] = useLocation();
  const section = sectionFromPath(location);
  const [days, setDays] = useState(30);
  const [assessmentDays, setAssessmentDays] = useState(90);
  const [selectedContact, setSelectedContact] = useState<number | null>(null);

  const go = useCallback((id: SectionId) => navigate(id === "overview" ? "/admin" : `/admin/${id}`), [navigate]);
  const openContact = useCallback((id: number) => setSelectedContact(id), []);
  const closeContact = useCallback(() => setSelectedContact(null), []);

  useEffect(() => {
    document.title = `${SECTIONS.find(s => s.id === section)?.label ?? "Dashboard"} | Marin Lazic`;
  }, [section]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-5 h-5 border-2 border-black/20 border-t-black animate-spin" role="status" aria-label="Loading" />
      </div>
    );
  }
  if (!user) return <AdminLogin onSuccess={() => refresh()} />;
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-sm">
          <div className="w-3 h-3 bg-[#E53935] mx-auto mb-6" />
          <h1 className="font-heading font-bold text-2xl mb-3">Access Denied</h1>
          <a href="/" className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to site
          </a>
        </div>
      </div>
    );
  }

  const title = SECTIONS.find(s => s.id === section)?.label ?? "Overview";

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-black lg:flex">
      {/* Sidebar */}
      <aside className="lg:w-56 lg:shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-black/10 lg:min-h-screen lg:sticky lg:top-0 lg:h-screen flex flex-col">
        <div className="px-5 h-14 flex items-center justify-between border-b border-black/10">
          <a href="/" className="font-heading font-bold text-sm tracking-[0.2em] uppercase" aria-label="Marin Lazic home">
            ML
          </a>
          <span className="text-[10px] tracking-[0.15em] uppercase text-black/40">Dashboard</span>
        </div>
        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible px-2 py-2 gap-0.5" aria-label="Dashboard sections">
          {SECTIONS.map(s => {
            const active = s.id === section;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => go(s.id)}
                className={`flex shrink-0 items-center gap-3 px-3 py-2.5 text-xs tracking-[0.08em] uppercase font-medium whitespace-nowrap transition-colors ${active ? "bg-black text-white" : "text-black/60 hover:text-black hover:bg-black/5"}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            );
          })}
        </nav>
        <div className="hidden lg:block mt-auto px-5 py-4 border-t border-black/10">
          <div className="text-[11px] text-black/40 truncate mb-2">{user.name || user.email || "Marin"}</div>
          <button type="button" onClick={() => logout()} className="inline-flex items-center gap-2 text-xs text-black/50 hover:text-black transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="h-14 px-5 lg:px-8 flex items-center justify-between bg-white border-b border-black/10">
          <h1 className="font-heading font-bold text-base tracking-[-0.01em]">{title}</h1>
          <div className="flex items-center gap-4">
            <a href="/" className="text-xs text-black/50 hover:text-black transition-colors inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Site
            </a>
            <button type="button" onClick={() => logout()} className="lg:hidden text-black/40 hover:text-black" aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
        <div className="p-4 lg:p-8 max-w-[1400px]">
          {section === "overview" && <Overview days={days} setDays={setDays} openContact={openContact} />}
          {section === "contacts" && <Contacts selectedId={selectedContact} openContact={openContact} closeContact={closeContact} />}
          {section === "applications" && <Applications openContact={openContact} />}
          {section === "assessments" && <Assessments days={assessmentDays} setDays={setAssessmentDays} />}
          {section === "content" && <Content days={days} setDays={setDays} />}
          {section === "traffic" && <Traffic days={days} setDays={setDays} />}
          {section === "system" && <System />}
        </div>
      </main>

      {/* A contact opened from any section other than Contacts (which renders its own) */}
      {selectedContact !== null && section !== "contacts" && <ContactDrawer id={selectedContact} onClose={closeContact} />}
    </div>
  );
}
