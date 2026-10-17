import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Empty, KpiCard, Label, Panel, PeriodSelect, Spinner, StatusBadge, fmtAgo, fmtInt, fmtMoney, fmtDate, pct, RED, INK } from "./ui";

const tooltipStyle = { fontSize: 12, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 0, padding: "6px 10px" };

export function Overview({ days, setDays, openContact }: { days: number; setDays: (d: number) => void; openContact: (id: number) => void }) {
  const q = trpc.admin.overview.useQuery({ days }, { staleTime: 60_000 });
  const data = q.data;

  const daily = useMemo(
    () => (data?.daily ?? []).map(d => ({ ...d, label: format(new Date(d.date + "T00:00:00"), days > 90 ? "MMM" : "d MMM") })),
    [data, days]
  );

  if (q.isLoading) return <Spinner />;
  if (!data) return <Empty>Could not load the overview</Empty>;
  const k = data.kpis;
  const completion = pct(k.assessmentsCompleted.current, k.assessmentsStarted.current);
  const prevCompletion = pct(k.assessmentsCompleted.previous, k.assessmentsStarted.previous);
  const topFunnel = data.funnel[0]?.count || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-black/50">Compared with the previous {days} days.</p>
        <PeriodSelect value={days} onChange={setDays} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Visitors" value={fmtInt(k.visitors.current)} current={k.visitors.current} previous={k.visitors.previous} hint="Unique browser sessions" />
        <KpiCard label="Page views" value={fmtInt(k.pageViews.current)} current={k.pageViews.current} previous={k.pageViews.previous} />
        <KpiCard label="Assessments started" value={fmtInt(k.assessmentsStarted.current)} current={k.assessmentsStarted.current} previous={k.assessmentsStarted.previous} />
        <KpiCard label="Assessments finished" value={fmtInt(k.assessmentsCompleted.current)} current={k.assessmentsCompleted.current} previous={k.assessmentsCompleted.previous} hint={`${completion}% completion (was ${prevCompletion}%)`} />
        <KpiCard label="Enquiries" value={fmtInt(k.enquiries.current)} current={k.enquiries.current} previous={k.enquiries.previous} hint="Contact form" />
        <KpiCard label="Applications" value={fmtInt(k.applications.current)} current={k.applications.current} previous={k.applications.previous} hint="Coaching applications" />
        <KpiCard label="Purchases" value={fmtInt(k.purchases.current)} current={k.purchases.current} previous={k.purchases.previous} hint="Paid through Stripe" />
        <KpiCard label="Revenue" value={fmtMoney(k.revenueCents.current)} current={k.revenueCents.current} previous={k.revenueCents.previous} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="Visitors and page views" className="lg:col-span-2">
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={INK} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={INK} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(_, p) => (p?.[0]?.payload?.date ? fmtDate(p[0].payload.date) : "")} />
                <Area type="monotone" dataKey="pageViews" name="Page views" stroke={INK} strokeWidth={1.5} fill="url(#pv)" />
                <Area type="monotone" dataKey="visitors" name="Visitors" stroke={RED} strokeWidth={1.5} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Funnel">
          <ul className="p-4 space-y-3">
            {data.funnel.map((f, i) => {
              const prev = i > 0 ? data.funnel[i - 1].count : null;
              return (
                <li key={f.step}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span>{f.label}</span>
                    <span className="font-medium tabular-nums">
                      {fmtInt(f.count)}
                      {prev !== null && prev > 0 && <span className="text-[10px] text-black/40 ml-1.5">{pct(f.count, prev)}%</span>}
                    </span>
                  </div>
                  <div className="h-1.5 bg-black/5 mt-1">
                    <div className={`h-1.5 ${i === data.funnel.length - 1 ? "bg-[#E53935]" : "bg-black"}`} style={{ width: `${Math.max(1, (f.count / topFunnel) * 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="px-4 pb-4 text-[11px] text-black/40">Percentages are step to step. The first bar is 100%.</p>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="Leads and assessments by day" className="lg:col-span-2">
          <div className="p-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.03)" }} labelFormatter={(_, p) => (p?.[0]?.payload?.date ? fmtDate(p[0].payload.date) : "")} />
                <Bar dataKey="assessmentsStarted" name="Assessments started" fill="rgba(0,0,0,0.25)" />
                <Bar dataKey="assessmentsCompleted" name="Assessments finished" fill={INK} />
                <Bar dataKey="leads" name="New leads" fill={RED} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Follow ups due" right={<Label>{data.followUps.length} due</Label>}>
          {data.followUps.length === 0 ? (
            <Empty>No follow ups in the next 7 days</Empty>
          ) : (
            <ul className="divide-y divide-black/5">
              {data.followUps.map(f => {
                const overdue = f.followUpAt && new Date(f.followUpAt) < new Date();
                return (
                  <li key={f.id}>
                    <button type="button" onClick={() => openContact(f.id)} className="w-full text-left px-4 py-3 hover:bg-[#FAFAFA] transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium truncate">{f.name || f.email}</span>
                        <StatusBadge status={f.status} />
                      </div>
                      <div className={`text-[11px] mt-0.5 ${overdue ? "text-[#E53935]" : "text-black/40"}`}>
                        {overdue ? "Overdue, " : "Due "}
                        {fmtAgo(f.followUpAt)}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Recent activity">
        {data.recent.length === 0 ? (
          <Empty />
        ) : (
          <ul className="divide-y divide-black/5">
            {data.recent.map((r, i) => (
              <li key={i} className="px-5 py-3 flex items-start gap-4">
                <span className={`mt-1.5 w-2 h-2 shrink-0 ${r.kind === "purchase" ? "bg-green-600" : r.kind === "application" ? "bg-amber-500" : r.kind === "assessment_completed" ? "bg-black" : "bg-black/25"}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    {r.lead_id ? (
                      <button type="button" onClick={() => openContact(r.lead_id!)} className="font-medium hover:underline">
                        {r.name || r.email}
                      </button>
                    ) : (
                      <span className="font-medium">{r.name || r.email}</span>
                    )}{" "}
                    <span className="text-black/60">{activityLabel(r.kind)}</span>
                  </div>
                  {r.detail && <div className="text-[11px] text-black/40 truncate">{r.detail}</div>}
                </div>
                <span className="text-[11px] text-black/40 shrink-0">{fmtAgo(r.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function activityLabel(kind: string) {
  switch (kind) {
    case "lead":
      return "was added as a lead";
    case "application":
      return "applied for coaching";
    case "assessment_started":
      return "started the assessment";
    case "assessment_completed":
      return "finished the assessment";
    case "purchase":
      return "purchased";
    default:
      return kind;
  }
}
