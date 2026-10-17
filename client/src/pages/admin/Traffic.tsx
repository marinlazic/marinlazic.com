import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import { BarList, Empty, KpiCard, Panel, PeriodSelect, Spinner, fmtInt, INK, pct } from "./ui";

const tooltipStyle = { fontSize: 12, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 0, padding: "6px 10px" };

export function Traffic({ days, setDays }: { days: number; setDays: (d: number) => void }) {
  const q = trpc.admin.traffic.useQuery({ days }, { staleTime: 60_000 });
  const d = q.data;
  if (q.isLoading) return <Spinner />;
  if (!d) return <Empty>Could not load traffic</Empty>;

  const sessions = d.referrers.reduce((s, r) => s + r.sessions, 0);
  const direct = d.referrers.find(r => r.referrer === "direct")?.sessions ?? 0;
  const campaign = d.utmSources.reduce((s, r) => s + r.sessions, 0);
  const devices = Object.entries(d.devices).sort((a, b) => b[1] - a[1]);
  const humans = devices.filter(([k]) => k !== "bot").reduce((s, [, v]) => s + v, 0);
  const mobile = d.devices.mobile ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-black/50">Where visitors come from and when they visit (Sydney time).</p>
        <PeriodSelect value={days} onChange={setDays} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Visits" value={fmtInt(sessions)} hint="Browser sessions with a page view" />
        <KpiCard label="Direct" value={`${pct(direct, sessions)}%`} hint="Typed the address or no referrer" />
        <KpiCard label="From campaigns" value={`${pct(campaign, sessions)}%`} hint="Links with UTM tags" />
        <KpiCard label="On mobile" value={`${pct(mobile, humans)}%`} hint={`${fmtInt(mobile)} of ${fmtInt(humans)} visits`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Panel title="Referring sites">
          <BarList rows={d.referrers.map(r => ({ label: r.referrer, value: r.sessions, sub: `${pct(r.sessions, sessions)}% of visits` }))} />
        </Panel>
        <Panel title="Devices">
          <BarList rows={devices.map(([k, v]) => ({ label: k, value: v }))} />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <Panel title="Campaign source (utm_source)">
          <BarList rows={d.utmSources.map(r => ({ label: r.value, value: r.sessions }))} empty="No tagged links yet" />
        </Panel>
        <Panel title="Medium (utm_medium)">
          <BarList rows={d.utmMediums.map(r => ({ label: r.value, value: r.sessions }))} empty="No tagged links yet" />
        </Panel>
        <Panel title="Campaign (utm_campaign)">
          <BarList rows={d.utmCampaigns.map(r => ({ label: r.value, value: r.sessions }))} empty="No tagged links yet" />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Panel title="Page views by hour of day">
          <div className="p-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.hours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} tickFormatter={h => `${h}h`} />
                <YAxis tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.03)" }} labelFormatter={h => `${h}:00 to ${h}:59`} />
                <Bar dataKey="views" name="Page views" fill={INK} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Page views by weekday">
          <div className="p-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.weekdays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="views" name="Page views" fill={INK} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <p className="text-[11px] text-black/40">
        Tip: add ?utm_source=instagram&utm_medium=social&utm_campaign=name to links you post. They show up here and on each contact.
      </p>
    </div>
  );
}
