import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { loginWithPassword } from "@/const";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Download,
  Filter,
  LogOut,
  Users,
  BarChart3,
  TrendingUp,
  Mail,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

// ─── Status Badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-[#E53935]/10 text-[#E53935]",
    contacted: "bg-blue-100 text-blue-700",
    applied: "bg-amber-100 text-amber-800",
    converted: "bg-green-100 text-green-700",
    archived: "bg-black/5 text-black/40",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] tracking-[0.1em] uppercase font-medium ${colors[status] || colors.new}`}>
      {status}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="border border-black/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium">{label}</span>
        <Icon className="w-4 h-4 text-black/20" />
      </div>
      <span className="font-heading font-bold text-2xl tracking-[-0.02em]">{value}</span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────
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
        <h1 className="font-heading font-bold text-2xl mb-3">Admin</h1>
        <p className="text-sm text-black/50 mb-8">Enter the admin password to open the dashboard.</p>
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
        <button
          type="submit"
          disabled={busy || !password}
          className="inline-flex bg-black text-white text-xs tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-black/80 transition-colors font-medium disabled:opacity-50"
        >
          {busy ? "Signing in" : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading, logout, refresh } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState<"leads" | "analytics">("leads");

  const leadsQuery = trpc.leads.list.useQuery(
    {
      status: statusFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
    { enabled: !!user && user.role === "admin" }
  );

  const statsQuery = trpc.leads.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const analyticsQuery = trpc.analytics.stats.useQuery(
    { days: 30 },
    { enabled: !!user && user.role === "admin" }
  );

  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      leadsQuery.refetch();
      statsQuery.refetch();
    },
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-5 h-5 border-2 border-black/20 border-t-black animate-spin" role="status" aria-label="Loading" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <AdminLogin onSuccess={() => refresh()} />;
  }

  // Not admin
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-sm">
          <div className="w-3 h-3 bg-[#E53935] mx-auto mb-6" />
          <h1 className="font-heading font-bold text-2xl mb-3">Access Denied</h1>
          <p className="text-sm text-black/50 mb-8">You don't have admin privileges to view this page.</p>
          <a href="/" className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to site
          </a>
        </div>
      </div>
    );
  }

  const leads = leadsQuery.data || [];
  const stats = statsQuery.data;
  const analytics = analyticsQuery.data;

  const applicationsQuery = trpc.leads.applications.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });
  const progressQuery = trpc.leads.assessmentProgress.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const downloadCSV = (name: string, headers: string[], rows: unknown[][]) => {
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const stamp = (d: Date | string | null | undefined) =>
    d ? format(new Date(d), "yyyy-MM-dd HH:mm:ss") : "";

  // CSV exports
  const exportCSV = () =>
    downloadCSV(
      "leads_export",
      ["ID", "Name", "Email", "Source", "Status", "Product", "Amount", "Paid At", "Report", "Notes", "Created At", "Updated At"],
      leads.map((l) => [
        l.id,
        l.name || "",
        l.email,
        l.source || "",
        l.status,
        l.product || "",
        l.amountCents != null ? (l.amountCents / 100).toFixed(2) + " " + (l.currency || "").toUpperCase() : "",
        stamp(l.paidAt),
        l.reportToken ? `${window.location.origin}/report/${l.reportToken}` : "",
        l.notes || "",
        stamp(l.createdAt),
        stamp(l.updatedAt),
      ])
    );
  const exportApplicationsCSV = () =>
    downloadCSV(
      "applications_export",
      ["ID", "Name", "Email", "90 day goal", "Obstacle", "Investment", "Anything else", "Assessment", "UTM source", "UTM medium", "UTM campaign", "Created At"],
      (applicationsQuery.data || []).map((a) => [
        a.id,
        a.name,
        a.email,
        a.q1_90day_goal,
        a.q2_obstacle,
        a.q3_investment,
        a.q4_anything_else || "",
        a.assessmentData || "",
        a.utmSource || "",
        a.utmMedium || "",
        a.utmCampaign || "",
        stamp(a.createdAt),
      ])
    );
  const exportProgressCSV = () =>
    downloadCSV(
      "assessment_progress_export",
      ["ID", "Name", "Email", "Answered", "Total", "Completed", "Reminder sent", "Last activity", "UTM source", "UTM medium", "UTM campaign", "Created At"],
      (progressQuery.data || []).map((p) => [
        p.id,
        p.name || "",
        p.email,
        p.answeredCount ?? 0,
        p.totalQuestions ?? 0,
        p.completed ? "yes" : "no",
        stamp(p.reminderSentAt),
        stamp(p.lastActivityAt),
        p.utmSource || "",
        p.utmMedium || "",
        p.utmCampaign || "",
        stamp(p.createdAt),
      ])
    );

  // Analytics event summary
  const eventSummary = useMemo(() => {
    if (!analytics?.eventsByType) return {};
    return analytics.eventsByType.reduce(
      (acc, e) => {
        acc[e.eventType] = e.count;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [analytics]);

  // Daily lead trend for simple bar chart
  const dailyLeads = stats?.daily || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-black/10 sticky top-0 bg-white/95 backdrop-blur-sm z-40">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <a href="/" className="text-black/40 hover:text-black transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div className="w-[1px] h-5 bg-black/10" />
            <span className="font-heading font-bold text-sm tracking-[0.15em] uppercase">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-black/40">{user.name || user.email}</span>
            <button
              onClick={() => logout()}
              className="text-black/40 hover:text-black transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Leads" value={stats?.total ?? 0} icon={Users} />
          <StatCard label="New" value={stats?.byStatus?.new ?? 0} icon={Mail} />
          <StatCard label="Contacted" value={stats?.byStatus?.contacted ?? 0} icon={TrendingUp} />
          <StatCard label="Converted" value={stats?.byStatus?.converted ?? 0} icon={BarChart3} />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-black/10 mb-8">
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-5 py-3 text-xs tracking-[0.15em] uppercase font-medium border-b-2 transition-colors ${
              activeTab === "leads" ? "border-[#E53935] text-black" : "border-transparent text-black/40 hover:text-black/60"
            }`}
          >
            Lead Management
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-5 py-3 text-xs tracking-[0.15em] uppercase font-medium border-b-2 transition-colors ${
              activeTab === "analytics" ? "border-[#E53935] text-black" : "border-transparent text-black/40 hover:text-black/60"
            }`}
          >
            Analytics
          </button>
        </div>

        {activeTab === "leads" && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-black/30" />
                <span className="text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium">Filter:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-black/15 bg-transparent text-xs px-3 py-2 focus:outline-none focus:border-black/40 transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="applied">Applied</option>
                <option value="converted">Converted</option>
                <option value="archived">Archived</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-black/15 bg-transparent text-xs px-3 py-2 focus:outline-none focus:border-black/40 transition-colors"
                placeholder="Start date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-black/15 bg-transparent text-xs px-3 py-2 focus:outline-none focus:border-black/40 transition-colors"
                placeholder="End date"
              />
              <div className="flex-1" />
              <button
                onClick={() => leadsQuery.refetch()}
                className="flex items-center gap-2 text-xs text-black/40 hover:text-black transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 bg-black text-white text-[10px] tracking-[0.15em] uppercase px-4 py-2 hover:bg-black/80 transition-colors font-medium"
              >
                <Download className="w-3 h-3" />
                Leads CSV
              </button>
              <button
                onClick={exportApplicationsCSV}
                className="flex items-center gap-2 border border-black text-black text-[10px] tracking-[0.15em] uppercase px-4 py-2 hover:bg-black hover:text-white transition-colors font-medium"
              >
                <Download className="w-3 h-3" />
                Applications CSV
              </button>
              <button
                onClick={exportProgressCSV}
                className="flex items-center gap-2 border border-black text-black text-[10px] tracking-[0.15em] uppercase px-4 py-2 hover:bg-black hover:text-white transition-colors font-medium"
              >
                <Download className="w-3 h-3" />
                Progress CSV
              </button>
            </div>

            {/* Table */}
            <div className="border border-black/10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 bg-[#FAFAFA]">
                    <th className="text-left px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium">Source</th>
                    <th className="text-left px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium">Report</th>
                    <th className="text-left px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsQuery.isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-black/30 text-xs">Loading leads...</td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-black/30 text-xs">No leads found</td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-black/5 hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-4 py-3 text-sm">{lead.name || <span className="text-black/30">Unknown</span>}</td>
                        <td className="px-4 py-3 font-medium text-sm">{lead.email}</td>
                        <td className="px-4 py-3 text-black/50 text-xs">{lead.source || "direct"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={lead.status} />
                          {lead.status === "converted" && lead.amountCents != null && (
                            <span className="block mt-1 text-[10px] text-black/40">
                              {(lead.amountCents / 100).toFixed(0)} {(lead.currency || "").toUpperCase()} {lead.product || ""}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {lead.reportToken ? (
                            <a
                              href={`/report/${lead.reportToken}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#E53935] hover:underline"
                            >
                              Open
                            </a>
                          ) : (
                            <span className="text-black/30">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-black/50 text-xs">
                          {lead.createdAt ? format(new Date(lead.createdAt), "MMM d, yyyy HH:mm") : "Unavailable"}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              updateStatusMutation.mutate({
                                id: lead.id,
                                status: e.target.value as any,
                              })
                            }
                            className="border border-black/10 bg-transparent text-xs px-2 py-1 focus:outline-none focus:border-black/30"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="applied">Applied</option>
                            <option value="converted">Converted</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-black/30">
              {leads.length} lead{leads.length !== 1 ? "s" : ""} total
            </div>
          </>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-8">
            {/* Event summary cards */}
            <div>
              <h3 className="font-heading font-semibold text-sm tracking-[0.1em] uppercase mb-4">
                Event Summary (Last 30 Days)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: "Page Views", key: "page_view" },
                  { label: "Section Views", key: "section_view" },
                  { label: "CTA Clicks", key: "cta_click" },
                  { label: "Leads Submitted", key: "lead_submitted" },
                ].map((item) => (
                  <div key={item.key} className="border border-black/10 p-4">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium block mb-2">
                      {item.label}
                    </span>
                    <span className="font-heading font-bold text-xl">{eventSummary[item.key] || 0}</span>
                  </div>
                ))}
                <div className="border border-black/10 p-4">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium block mb-2">
                    Conversion Rate
                  </span>
                  <span className="font-heading font-bold text-xl">
                    {eventSummary.page_view
                      ? `${(((eventSummary.lead_submitted || 0) / eventSummary.page_view) * 100).toFixed(1)}%`
                      : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>

            {/* Daily lead trend */}
            <div>
              <h3 className="font-heading font-semibold text-sm tracking-[0.1em] uppercase mb-4">
                Daily Lead Submissions (Last 30 Days)
              </h3>
              {dailyLeads.length === 0 ? (
                <div className="border border-black/10 p-12 text-center text-black/30 text-xs">
                  No lead data available yet
                </div>
              ) : (
                <div className="border border-black/10 p-6">
                  <div className="flex items-end gap-1 h-40">
                    {dailyLeads.map((d, i) => {
                      const maxCount = Math.max(...dailyLeads.map((x) => x.count), 1);
                      const height = (d.count / maxCount) * 100;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center justify-end group relative"
                        >
                          <div
                            className="w-full bg-[#E53935] min-h-[2px] transition-all hover:bg-[#C62828]"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${d.date}: ${d.count} leads`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-[9px] text-black/30">
                    <span>{dailyLeads[0]?.date}</span>
                    <span>{dailyLeads[dailyLeads.length - 1]?.date}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Daily analytics events */}
            <div>
              <h3 className="font-heading font-semibold text-sm tracking-[0.1em] uppercase mb-4">
                Event Breakdown by Day
              </h3>
              <div className="border border-black/10 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/10 bg-[#FAFAFA]">
                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium">Date</th>
                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium">Event</th>
                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!analytics?.dailyEvents?.length ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-black/30 text-xs">No analytics data yet</td>
                      </tr>
                    ) : (
                      analytics.dailyEvents.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-b border-black/5">
                          <td className="px-4 py-2.5 text-xs text-black/60">{row.date}</td>
                          <td className="px-4 py-2.5 text-xs">{row.eventType}</td>
                          <td className="px-4 py-2.5 text-xs font-medium">{row.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
