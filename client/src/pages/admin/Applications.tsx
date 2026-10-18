import { Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Empty, Panel, ScorePill, Spinner, StatusBadge, btnSecondary, downloadCSV, fmtDate, stamp, td, th } from "./ui";

export function Applications({ openContact }: { openContact: (id: number) => void }) {
  const q = trpc.admin.applications.list.useQuery();
  const rows = q.data ?? [];

  const exportCSV = () =>
    downloadCSV(
      "applications",
      ["ID", "Name", "Email", "90 day goal", "Obstacle", "Investment", "Anything else", "Assessment score", "UTM source", "UTM medium", "UTM campaign", "Status", "Created"],
      rows.map(a => [a.id, a.name, a.email, a.q1_90day_goal, a.q2_obstacle, a.q3_investment, a.q4_anything_else || "", a.assessment?.score ?? "", a.utmSource || "", a.utmMedium || "", a.utmCampaign || "", a.status || "", stamp(a.createdAt)])
    );

  if (q.isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-black/50">{rows.length} coaching application{rows.length === 1 ? "" : "s"}. Click a row for the full contact.</p>
        <button type="button" onClick={exportCSV} className={btnSecondary}>
          <Download className="w-3 h-3" /> CSV
        </button>
      </div>
      <Panel>
        {rows.length === 0 ? (
          <Empty>No applications yet</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/10 bg-white">
                  <th className={th}>Applicant</th>
                  <th className={th}>90 day goal</th>
                  <th className={th}>Obstacle</th>
                  <th className={th}>Invest</th>
                  <th className={th}>Score</th>
                  <th className={th}>Status</th>
                  <th className={th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(a => (
                  <tr key={a.id} className={`border-b border-black/5 hover:bg-white transition-colors ${a.leadId ? "cursor-pointer" : ""}`} onClick={() => a.leadId && openContact(a.leadId)}>
                    <td className={td}>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-black/50">{a.email}</div>
                      {a.utmSource && <div className="text-[10px] text-black/40 mt-0.5">{[a.utmSource, a.utmCampaign].filter(Boolean).join(" / ")}</div>}
                    </td>
                    <td className={`${td} max-w-xs`}>
                      <p className="text-xs line-clamp-3 whitespace-pre-wrap">{a.q1_90day_goal}</p>
                    </td>
                    <td className={`${td} max-w-xs`}>
                      <p className="text-xs line-clamp-3 whitespace-pre-wrap">{a.q2_obstacle}</p>
                    </td>
                    <td className={`${td} text-xs`}>{a.q3_investment}</td>
                    <td className={td}>
                      <ScorePill score={a.assessment?.score ?? null} />
                    </td>
                    <td className={td}>{a.status ? <StatusBadge status={a.status} /> : <span className="text-xs text-black/30">no lead</span>}</td>
                    <td className={`${td} text-xs text-black/60 whitespace-nowrap`}>{fmtDate(a.createdAt)}</td>
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
