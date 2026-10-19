// Email marketing: what Kit holds (subscribers, growth, broadcasts, sequences,
// tag pipeline) next to what the site itself sends through Resend.
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExternalLink, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { BarList, Empty, KpiCard, Label, Panel, PeriodSelect, Spinner, btnGhost, btnSecondary, downloadCSV, fmtAgo, fmtDate, fmtDateTime, fmtInt, pct, stamp, td, th, INK, RED, GREY } from "./ui";

const tooltipStyle = { fontSize: 12, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 0, padding: "6px 10px" };
const rate = (v: number | null | undefined) => (v === null || v === undefined ? "" : `${Math.round(v * 10) / 10}%`);

const PIPELINE: { tag: string; label: string }[] = [
  { tag: "assessment-started", label: "Started the assessment" },
  { tag: "assessment-completed", label: "Finished the assessment" },
  { tag: "application-submitted", label: "Applied for coaching" },
  { tag: "purchased", label: "Bought the programme" },
];

const KIT_LINKS = [
  { label: "Kit dashboard", href: "https://app.kit.com/dashboard" },
  { label: "Subscribers", href: "https://app.kit.com/subscribers" },
  { label: "Broadcasts", href: "https://app.kit.com/broadcasts" },
  { label: "Sequences", href: "https://app.kit.com/sequences" },
  { label: "Automations", href: "https://app.kit.com/automations" },
];

function Kit({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-black/60">
      {children} <ExternalLink className="w-3 h-3 text-black/30" />
    </a>
  );
}

export function Email({ days, setDays }: { days: number; setDays: (d: number) => void }) {
  const utils = trpc.useUtils();
  const kit = trpc.admin.email.kit.useQuery({ days }, { staleTime: 5 * 60_000 });
  const site = trpc.admin.email.site.useQuery({ days }, { staleTime: 60_000 });
  const k = kit.data;
  const s = site.data;

  const kindKeys = useMemo(() => (s ? s.kinds.map(x => x.kind) : []), [s]);
  const series = useMemo(
    () => (s?.series ?? []).map(d => ({ ...d, label: format(new Date(String(d.day) + "T00:00:00"), days > 90 ? "MMM" : "d MMM") })),
    [s, days]
  );
  const palette = [INK, RED, GREY, "#548DF8", "#C9CBD0", "#3068F0", "#6B6E75", "#B9BCC2", "#1F3F8F"];

  if (kit.isLoading || site.isLoading) return <Spinner />;

  const tagCount = (tag: string) => k?.tags.find(t => t.name === tag)?.count ?? null;
  const pipelineTop = tagCount(PIPELINE[0].tag) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-black/50">
          Kit holds the list and the newsletters. The site sends its own emails through Resend: results, confirmations and reminders. Growth and site figures are for the last {days} days; Kit's open and click rates cover its last 90 days.
        </p>
        <div className="flex items-center gap-2">
          <PeriodSelect value={days} onChange={setDays} options={[7, 30, 90]} />
          <button
            type="button"
            className={btnSecondary}
            onClick={() => utils.admin.email.kit.fetch({ days, force: true }).then(v => utils.admin.email.kit.setData({ days }, v))}
            title="Kit figures are cached for five minutes"
          >
            <RefreshCw className="w-3 h-3" /> Refresh Kit
          </button>
        </div>
      </div>

      {k && !k.configured && <Empty>Kit is not connected. Add KIT_API_KEY in Vercel and this page fills in.</Empty>}
      {k?.error && <p className="text-xs text-black/50 border border-black/10 bg-white px-4 py-2">Some Kit calls did not answer: {k.error}</p>}

      {/* Kit list health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Subscribers" value={k?.subscribers.active === null || k?.subscribers.active === undefined ? "" : fmtInt(k.subscribers.active)} hint={k?.subscribers.cancelled != null ? `${fmtInt(k.subscribers.cancelled)} unsubscribed all time${k.subscribers.bounced ? `, ${fmtInt(k.subscribers.bounced)} bounced` : ""}` : "Active in Kit"} />
        <KpiCard label={`New in ${days} days`} value={k?.growth ? fmtInt(k.growth.newSubscribers) : ""} hint={k?.growth ? `${fmtInt(k.growth.cancellations)} left, net ${k.growth.net >= 0 ? "+" : ""}${fmtInt(k.growth.net)}` : "From Kit growth stats"} />
        <KpiCard label="Kit emails sent" value={k?.emailStats ? fmtInt(k.emailStats.sent) : ""} hint={k?.emailStats ? `Last 90 days. ${k.emailStats.openTracking ? `Open rate ${rate(k.emailStats.openRate)}` : "Open tracking off"}${k.emailStats.clickTracking ? `, click rate ${rate(k.emailStats.clickRate)}` : ""}` : "Broadcasts and sequences"} />
        <KpiCard label="Site emails sent" value={s ? fmtInt(s.sent) : ""} current={s?.sent} previous={s?.previousSent} hint={s?.failed ? `${fmtInt(s.failed)} failed` : "Results, confirmations, reminders, alerts"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Pipeline by Kit tag */}
        <Panel title="Pipeline, by Kit tag" right={<Label>all time</Label>}>
          <BarList
            rows={PIPELINE.map((p, i) => {
              const count = tagCount(p.tag);
              const prev = i === 0 ? null : tagCount(PIPELINE[i - 1].tag);
              return {
                label: p.label,
                value: count ?? 0,
                sub: count === null ? "tag not found in Kit" : prev ? `${pct(count, prev)}% of the step before` : i === 0 ? "everyone who gave an email" : "",
              };
            })}
            max={pipelineTop || undefined}
            empty="No site tags found in Kit yet"
          />
          <div className="px-5 py-3 border-t border-black/10 text-[11px] text-black/40">
            Other tags:{" "}
            {k?.tags.filter(t => !PIPELINE.some(p => p.tag === t.name)).map(t => (
              <span key={t.id} className="mr-3">
                <Kit href={t.url}>{t.name}</Kit> {t.count === null ? "" : fmtInt(t.count)}
              </span>
            ))}
          </div>
        </Panel>

        {/* Site emails per day */}
        <Panel title="Site emails per day" className="lg:col-span-2" right={<Label>{fmtInt(s?.sent ?? 0)} sent</Label>}>
          <div className="p-4 h-64">
            {series.length && kindKeys.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(_, p) => (p?.[0]?.payload?.day ? fmtDate(String(p[0].payload.day)) : "")} />
                  {kindKeys.map((kind, i) => (
                    <Bar key={kind} dataKey={kind} name={s?.kindLabels[kind as keyof typeof s.kindLabels] ?? kind} stackId="a" fill={palette[i % palette.length]} maxBarSize={18} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty>No site emails in this period. Sending is logged from 19 October 2026.</Empty>
            )}
          </div>
          {s && s.kinds.length > 0 && (
            <ul className="px-5 pb-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-black/50">
              {s.kinds.map((x, i) => (
                <li key={x.kind} className="flex items-center gap-1.5">
                  <span className="w-2 h-2" style={{ background: palette[i % palette.length] }} /> {x.label} {fmtInt(x.sent)}
                  {x.failed ? <span className="text-black/40">({x.failed} failed)</span> : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Broadcasts */}
      <Panel title="Kit broadcasts" right={<Kit href="https://app.kit.com/broadcasts">Open in Kit</Kit>}>
        {k?.broadcasts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/10">
                  <th className={th}>Subject</th><th className={th}>Sent</th><th className={th}>Status</th><th className={`${th} text-right`}>Recipients</th><th className={`${th} text-right`}>Opened</th><th className={`${th} text-right`}>Open rate</th><th className={`${th} text-right`}>Clicks</th><th className={`${th} text-right`}>Click rate</th><th className={`${th} text-right`}>Unsubscribed</th>
                </tr>
              </thead>
              <tbody>
                {k.broadcasts.map(b => (
                  <tr key={b.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                    <td className={td}><Kit href={b.url}>{b.subject}</Kit></td>
                    <td className={`${td} whitespace-nowrap text-black/60`}>{b.sentAt ? fmtDateTime(b.sentAt) : ""}</td>
                    <td className={td}><Label className={b.status === "completed" ? "text-black" : ""}>{b.status}</Label></td>
                    <td className={`${td} text-right tabular-nums`}>{fmtInt(b.recipients)}</td>
                    <td className={`${td} text-right tabular-nums`}>{fmtInt(b.opened)}</td>
                    <td className={`${td} text-right tabular-nums`}>{rate(b.openRate)}</td>
                    <td className={`${td} text-right tabular-nums`}>{fmtInt(b.clicks)}</td>
                    <td className={`${td} text-right tabular-nums`}>{rate(b.clickRate)}</td>
                    <td className={`${td} text-right tabular-nums`}>{fmtInt(b.unsubscribes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No broadcasts in Kit yet. Write one at app.kit.com and it appears here with its open and click rates.</Empty>
        )}
      </Panel>

      {/* Sequences */}
      <Panel title="Kit sequences (automated email series)" right={<Kit href="https://app.kit.com/sequences">Open in Kit</Kit>}>
        {k?.sequences.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/10">
                  <th className={th}>Sequence</th><th className={th}>Status</th><th className={`${th} text-right`}>Emails</th><th className={`${th} text-right`}>In it now</th><th className={`${th} text-right`}>Delivered</th><th className={`${th} text-right`}>Open rate</th><th className={`${th} text-right`}>Click rate</th><th className={`${th} text-right`}>Unsubscribe rate</th>
                </tr>
              </thead>
              <tbody>
                {k.sequences.map(q => (
                  <tr key={q.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                    <td className={td}><Kit href={q.url}>{q.name}</Kit></td>
                    <td className={td}><Label className={q.active ? "text-green-700" : ""}>{q.active ? "active" : "paused"}</Label></td>
                    <td className={`${td} text-right tabular-nums`}>{fmtInt(q.emails)}</td>
                    <td className={`${td} text-right tabular-nums`}>{fmtInt(q.subscribers)}</td>
                    <td className={`${td} text-right tabular-nums`}>{q.recipients === null ? "" : fmtInt(q.recipients)}</td>
                    <td className={`${td} text-right tabular-nums`}>{rate(q.openRate)}</td>
                    <td className={`${td} text-right tabular-nums`}>{rate(q.clickRate)}</td>
                    <td className={`${td} text-right tabular-nums`}>{rate(q.unsubscribeRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No sequences in Kit yet. This is where the follow up series after the assessment report will show once it is built.</Empty>
        )}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent subscribers */}
        <Panel title={`New Kit subscribers, last ${days} days`} right={<Kit href="https://app.kit.com/subscribers">All subscribers</Kit>}>
          {k?.recentSubscribers.length ? (
            <ul className="divide-y divide-black/5">
              {k.recentSubscribers.map(su => (
                <li key={su.id} className="px-5 py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <Kit href={su.url}><span className="truncate">{su.firstName ? `${su.firstName} · ` : ""}{su.email}</span></Kit>
                    <span className="text-[11px] text-black/40 whitespace-nowrap">{fmtAgo(su.createdAt)}</span>
                  </div>
                  <div className="text-[11px] text-black/40 mt-0.5">
                    {su.state !== "active" ? `${su.state} · ` : ""}{su.tags.length ? su.tags.join(", ") : "no tags"}{su.source ? ` · via ${su.source}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nobody joined the list in this period</Empty>
          )}
        </Panel>

        {/* Recent site emails */}
        <Panel
          title="Latest site emails"
          right={
            s?.recent.length ? (
              <button type="button" className={btnGhost} onClick={() => downloadCSV("site-emails", ["Sent", "To", "Type", "Subject", "Status", "Error"], s.recent.map(r => [stamp(r.createdAt), r.to, r.label, r.subject, r.status, r.error ?? ""]))}>
                CSV
              </button>
            ) : undefined
          }
        >
          {s?.recent.length ? (
            <ul className="divide-y divide-black/5 max-h-[520px] overflow-y-auto">
              {s.recent.map(r => (
                <li key={r.id} className="px-5 py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate">{r.label}</span>
                    <span className="text-[11px] text-black/40 whitespace-nowrap">{fmtAgo(r.createdAt)}</span>
                  </div>
                  <div className="text-[11px] text-black/40 mt-0.5 truncate">
                    {r.to} · {r.subject}{r.status !== "sent" ? ` · ${r.status}${r.error ? `: ${r.error}` : ""}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No site emails logged yet</Empty>
          )}
        </Panel>
      </div>

      <Panel title="Kit shortcuts">
        <ul className="p-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {KIT_LINKS.map(l => (
            <li key={l.href}><Kit href={l.href}>{l.label}</Kit></li>
          ))}
          {k?.account.name && <li className="text-black/40 text-xs self-center">Account: {k.account.name}{k.account.plan ? ` (${k.account.plan})` : ""}. Figures fetched {fmtDateTime(k.fetchedAt)}.</li>}
        </ul>
      </Panel>
    </div>
  );
}
