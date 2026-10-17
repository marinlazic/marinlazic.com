import { useState } from "react";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import { BarList, Empty, KpiCard, Label, Panel, PeriodSelect, ScorePill, Spinner, btnGhost, btnSecondary, downloadCSV, fmtAgo, fmtDate, fmtInt, INK, RED, stamp, td, th } from "./ui";

const tooltipStyle = { fontSize: 12, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 0, padding: "6px 10px" };

export function Assessments({ days, setDays }: { days: number; setDays: (d: number) => void }) {
  const q = trpc.admin.assessments.useQuery({ days }, { staleTime: 60_000 });
  const progressQuery = trpc.leads.assessmentProgress.useQuery(undefined, { enabled: false });
  const [showAllDrop, setShowAllDrop] = useState(false);
  const d = q.data;

  const exportProgress = async () => {
    const res = await progressQuery.refetch();
    const rows = res.data ?? [];
    downloadCSV(
      "assessment_progress",
      ["ID", "Name", "Email", "Answered", "Total", "Completed", "Reminder sent", "Last activity", "UTM source", "UTM medium", "UTM campaign", "Created"],
      rows.map(p => [p.id, p.name || "", p.email, p.answeredCount ?? 0, p.totalQuestions ?? 0, p.completed ? "yes" : "no", stamp(p.reminderSentAt), stamp(p.lastActivityAt), p.utmSource || "", p.utmMedium || "", p.utmCampaign || "", stamp(p.createdAt)])
    );
  };

  if (q.isLoading) return <Spinner />;
  if (!d) return <Empty>Could not load assessments</Empty>;

  const dropRows = showAllDrop ? d.dropOff : d.dropOff.filter((_, i) => i % 3 === 0 || i === d.dropOff.length - 1);
  const first = d.dropOff[0]?.reached || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-black/50">Everyone who started the assessment in the period.</p>
        <div className="flex items-center gap-2">
          <PeriodSelect value={days} onChange={setDays} options={[30, 90, 365]} />
          <button type="button" onClick={exportProgress} className={btnSecondary}>
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Started" value={fmtInt(d.started)} />
        <KpiCard label="Finished" value={fmtInt(d.completed)} hint={`${d.completionRate}% completion`} />
        <KpiCard label="Average score" value={d.averageScore ? String(d.averageScore) : "none"} hint="Finished assessments" />
        <KpiCard label="Most common weak area" value={d.weakestAreas[0]?.name ?? "none"} hint={d.weakestAreas[0] ? `${d.weakestAreas[0].count} people` : undefined} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <Panel title="Score bands">
          <div className="p-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.bands} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="band" tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="count" name="People" fill={INK} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Average by category">
          <ul className="p-4 space-y-2.5">
            {d.categoryAverages.map(c => (
              <li key={c.id}>
                <div className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="font-medium">{c.average}</span>
                </div>
                <div className="h-1 bg-black/5 mt-1">
                  <div className="h-1 bg-black" style={{ width: `${c.average}%` }} />
                </div>
              </li>
            ))}
            {d.categoryAverages.length === 0 && <Empty />}
          </ul>
        </Panel>
        <Panel title="Weakest area per person">
          <BarList rows={d.weakestAreas.map(w => ({ label: w.name, value: w.count }))} />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <Panel title="Primary goal">
          <BarList rows={d.goals.slice(0, 8).map(g => ({ label: g.label, value: g.count }))} />
        </Panel>
        <Panel title="Commitment">
          <BarList rows={d.commitment.map(g => ({ label: g.label, value: g.count }))} />
        </Panel>
        <Panel title="Occupation">
          <BarList rows={d.occupations.slice(0, 8).map(g => ({ label: g.label, value: g.count }))} />
        </Panel>
      </div>

      <Panel
        title="Where people drop off"
        right={
          <button type="button" className={btnGhost} onClick={() => setShowAllDrop(v => !v)}>
            {showAllDrop ? "Fewer questions" : "Every question"}
          </button>
        }
      >
        <div className="p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dropRows.map((r, i) => ({ ...r, idx: i + 1 }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="id" tick={{ fontSize: 9, fill: "#999" }} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.03)" }} formatter={(v: number) => [`${v} people (${Math.round((v / first) * 100)}%)`, "Reached"]} labelFormatter={(id: string) => d.dropOff.find(x => x.id === id)?.question ?? id} />
              <Bar dataKey="reached" name="Reached" fill={RED} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="px-4 pb-4 text-[11px] text-black/40">How many people reached each question. A sharp step down shows where the assessment loses people.</p>
      </Panel>

      <Panel title="Recent assessments">
        {d.recent.length === 0 ? (
          <Empty>No assessments in this period</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/10 bg-[#FAFAFA]">
                  <th className={th}>Person</th>
                  <th className={th}>Progress</th>
                  <th className={th}>Score</th>
                  <th className={th}>Source</th>
                  <th className={th}>Started</th>
                  <th className={th}>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {d.recent.map(r => (
                  <tr key={r.id} className="border-b border-black/5">
                    <td className={td}>
                      <div className="font-medium">{r.name || <span className="text-black/30">No name</span>}</div>
                      <div className="text-xs text-black/50">{r.email}</div>
                    </td>
                    <td className={td}>
                      {r.completed ? (
                        <Label className="text-green-700">Finished</Label>
                      ) : (
                        <span className="text-xs text-black/60">
                          {r.answeredCount} of {r.totalQuestions}
                        </span>
                      )}
                    </td>
                    <td className={td}>
                      <ScorePill score={r.score} />
                    </td>
                    <td className={`${td} text-xs text-black/60`}>{r.utmSource || ""}</td>
                    <td className={`${td} text-xs text-black/60 whitespace-nowrap`}>{fmtDate(r.createdAt)}</td>
                    <td className={`${td} text-xs text-black/60 whitespace-nowrap`}>{fmtAgo(r.lastActivityAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
