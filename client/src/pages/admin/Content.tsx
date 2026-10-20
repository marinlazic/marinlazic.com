import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { BarList, Empty, KpiCard, Panel, PeriodSelect, Spinner, fmtInt, pct } from "./ui";

function group(path: string): "Articles" | "Resources" | "Pages" {
  if (path.startsWith("/insights/")) return "Articles";
  if (path.startsWith("/resources/")) return "Resources";
  return "Pages";
}

const PAGE_NAMES: Record<string, string> = {
  "/": "Home",
  "/assessment": "Assessment",
  "/apply": "Apply for coaching",
  "/program": "4 week programme",
  "/insights": "Insights (list)",
  "/resources": "Resources (list)",
  "/media": "Media",
  "/speaking": "Speaking",
  "/about": "About",
  "/book-a-call": "Book a call",
  "/executive-health-performance": "Executive health",
  "/corporate-health-performance": "Corporate health",
  "/training-for-long-term-health": "Training for long term health",
};
const niceButton = (b: string) => b.replace(/_/g, " ");

export function Content({ days, setDays }: { days: number; setDays: (d: number) => void }) {
  const q = trpc.admin.content.useQuery({ days }, { staleTime: 60_000 });
  const d = q.data;

  const totals = useMemo(() => {
    const views = (d?.pages ?? []).reduce((s, p) => s + p.views, 0);
    const byGroup: Record<string, { views: number; visitors: number; pages: number }> = {};
    for (const p of d?.pages ?? []) {
      const g = group(p.path);
      byGroup[g] ??= { views: 0, visitors: 0, pages: 0 };
      byGroup[g].views += p.views;
      byGroup[g].visitors += p.visitors;
      byGroup[g].pages += 1;
    }
    const clicks = (d?.ctaClicks ?? []).reduce((s, c) => s + c.clicks, 0);
    return { views, byGroup, clicks };
  }, [d]);

  if (q.isLoading) return <Spinner />;
  if (!d) return <Empty>Could not load content stats</Empty>;

  const section = (name: "Articles" | "Resources" | "Pages") =>
    d.pages
      .filter(p => group(p.path) === name)
      .map(p => ({
        label: (
          <span>
            <span className="font-medium">{PAGE_NAMES[p.path] ?? p.path.split("/").pop()?.replace(/-/g, " ")}</span>
            <span className="text-black/40 text-xs ml-2">{p.path}</span>
          </span>
        ),
        value: p.views,
        sub: `${fmtInt(p.visitors)} visitors, ${pct(p.views, totals.views)}% of all views`,
      }));

  // Clicks grouped by button across pages
  const buttons = Object.values(
    d.ctaClicks.reduce(
      (acc, c) => {
        acc[c.button] ??= { button: c.button, clicks: 0, paths: new Set<string>() };
        acc[c.button].clicks += c.clicks;
        acc[c.button].paths.add(c.path);
        return acc;
      },
      {} as Record<string, { button: string; clicks: number; paths: Set<string> }>
    )
  ).sort((a, b) => b.clicks - a.clicks);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-black/50">What people read and click.</p>
        <PeriodSelect value={days} onChange={setDays} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Page views" value={fmtInt(totals.views)} />
        <KpiCard label="Article views" value={fmtInt(totals.byGroup.Articles?.views ?? 0)} hint={`${totals.byGroup.Articles?.pages ?? 0} articles read`} />
        <KpiCard label="Resource views" value={fmtInt(totals.byGroup.Resources?.views ?? 0)} hint={`${totals.byGroup.Resources?.pages ?? 0} resource pages read`} />
        <KpiCard label="Button clicks" value={fmtInt(totals.clicks)} hint={totals.views ? `${(totals.clicks / totals.views).toFixed(2)} per page view` : undefined} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Panel title="Pages">
          <BarList rows={section("Pages")} />
        </Panel>
        <Panel title="Articles">
          <BarList rows={section("Articles")} empty="No article views in this period" />
        </Panel>
        <Panel title="Resources">
          <BarList rows={section("Resources")} empty="No resource views in this period" />
        </Panel>
        <Panel title="Landing pages">
          <BarList rows={d.landing.map(l => ({ label: <span>{PAGE_NAMES[l.path] ?? l.path}</span>, value: l.sessions, sub: "first page of the visit" }))} />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Panel title="Buttons clicked">
          <BarList rows={buttons.map(b => ({ label: niceButton(b.button), value: b.clicks, sub: Array.from(b.paths).join(", ") }))} empty="No button clicks in this period" />
        </Panel>
        <div className="space-y-4">
          <Panel title="Home page sections seen">
            <BarList rows={d.sections.map(s => ({ label: s.section, value: s.views }))} empty="No section views in this period" />
          </Panel>
          <Panel title="Report shares">
            <BarList rows={d.shares.map(s => ({ label: s.platform, value: s.clicks }))} empty="No shares in this period" />
          </Panel>
        </div>
      </div>
    </div>
  );
}
