// How the AI world sees the site: which crawlers read it, who arrives from an
// assistant, and whether the files crawlers look for are being served.
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { Delta, Empty, KpiCard, Label, Panel, PeriodSelect, Spinner, fmtAgo, fmtDate, fmtInt, INK } from "./ui";

const tooltipStyle = { fontSize: 12, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 0, padding: "6px 10px" };

const KIND_COPY: Record<string, { title: string; blurb: string }> = {
  live: { title: "Live answers", blurb: "Fetched while somebody waited for an answer" },
  search: { title: "AI search index", blurb: "Indexing the site for an AI search product" },
  training: { title: "Model training", blurb: "Collecting pages to train on" },
};

export function Geo({ days, setDays }: { days: number; setDays: (d: number) => void }) {
  const q = trpc.admin.geo.useQuery({ days }, { staleTime: 60_000 });
  const data = q.data;

  const daily = useMemo(
    () => (data?.daily ?? []).map(d => ({ ...d, label: format(new Date(d.date + "T00:00:00"), days > 90 ? "MMM" : "d MMM") })),
    [data, days]
  );

  if (q.isLoading) return <Spinner />;
  if (!data) return <Empty>Could not load the GEO numbers</Empty>;

  const totalCrawls = data.crawlers.reduce((s, c) => s + c.hits, 0);
  const prevCrawls = data.crawlers.reduce((s, c) => s + c.previous, 0);
  const failing = data.readiness.checks.filter(c => !c.ok);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-black/50">
          Compared with the previous {days} days.
          {data.loggingSince
            ? ` Crawler logging started ${fmtDate(data.loggingSince)}.`
            : " No crawler visit has been recorded yet."}
        </p>
        <PeriodSelect value={days} onChange={setDays} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="AI crawler visits" value={fmtInt(totalCrawls)} current={totalCrawls} previous={prevCrawls} hint="Pages read by AI crawlers" />
        {data.byKind.map(k => (
          <KpiCard
            key={k.kind}
            label={KIND_COPY[k.kind].title}
            value={fmtInt(k.hits)}
            current={k.hits}
            previous={k.previous}
            hint={KIND_COPY[k.kind].blurb}
          />
        ))}
        <KpiCard
          label="Visits from assistants"
          value={fmtInt(data.referralTotal)}
          current={data.referralTotal}
          previous={data.referralPrevious}
          hint="People who clicked through from an AI answer"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="AI crawler visits" className="lg:col-span-2">
          {totalCrawls === 0 ? (
            <Empty>
              Nothing recorded yet. Crawlers are logged from the day this went live, so the first visits appear within a day or two.
            </Empty>
          ) : (
            <div className="p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="crawl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={INK} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={INK} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(_, p) => (p?.[0]?.payload?.date ? fmtDate(p[0].payload.date) : "")} />
                  <Area type="monotone" dataKey="crawls" name="Crawler visits" stroke={INK} strokeWidth={1.5} fill="url(#crawl)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Ready to be read">
          <ul className="p-4 space-y-3">
            {data.readiness.checks.map(c => (
              <li key={c.id} className="flex items-start gap-3">
                <span className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${c.ok ? "bg-green-600" : "bg-black"}`} />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{c.label}</div>
                  <div className="text-xs text-black/50 break-words">{c.detail}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-4 pb-4">
            <Label>
              {failing.length === 0 ? "Everything a crawler looks for is being served" : `${failing.length} to fix`}
              {" · checked "}
              {fmtAgo(data.readiness.checkedAt)}
            </Label>
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Who is reading the site">
          {data.crawlers.length === 0 ? (
            <Empty>No AI crawler has been recorded yet</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left">
                  <th className="px-5 py-2 font-medium"><Label>Crawler</Label></th>
                  <th className="px-5 py-2 font-medium"><Label>What for</Label></th>
                  <th className="px-5 py-2 font-medium text-right"><Label>Pages read</Label></th>
                </tr>
              </thead>
              <tbody>
                {data.crawlers.map(c => (
                  <tr key={c.id} className="border-b border-black/5 last:border-0">
                    <td className="px-5 py-2.5">
                      <div className="font-medium">{c.label}</div>
                      <div className="text-xs text-black/40">{c.owner}</div>
                    </td>
                    <td className="px-5 py-2.5 text-xs text-black/60">{KIND_COPY[c.kind]?.title ?? c.kind}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">
                      {fmtInt(c.hits)}
                      <div><Delta current={c.hits} previous={c.previous} /></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Visits from AI assistants">
          {data.referrals.length === 0 ? (
            <Empty>Nobody has arrived from an AI assistant in this period</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left">
                  <th className="px-5 py-2 font-medium"><Label>Assistant</Label></th>
                  <th className="px-5 py-2 font-medium text-right"><Label>Visits</Label></th>
                </tr>
              </thead>
              <tbody>
                {data.referrals.map(r => (
                  <tr key={r.id} className="border-b border-black/5 last:border-0">
                    <td className="px-5 py-2.5 font-medium">{r.label}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">
                      {fmtInt(r.sessions)}
                      <div><Delta current={r.sessions} previous={r.previous} /></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <Panel title="Pages the AI crawlers read most">
        {data.pages.length === 0 ? (
          <Empty>Nothing recorded yet</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="px-5 py-2 font-medium"><Label>Page</Label></th>
                <th className="px-5 py-2 font-medium text-right"><Label>Times read</Label></th>
                <th className="px-5 py-2 font-medium text-right"><Label>Crawlers</Label></th>
              </tr>
            </thead>
            <tbody>
              {data.pages.map(p => (
                <tr key={p.path} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-2.5 font-mono text-xs break-all">{p.path}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{fmtInt(p.hits)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{fmtInt(p.crawlers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
