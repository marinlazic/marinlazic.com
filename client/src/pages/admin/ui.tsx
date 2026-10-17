// Shared building blocks for the dashboard. Plain Tailwind in the site's own
// style: black on white, red accent, uppercase letter spaced labels.
import { format, formatDistanceToNowStrict } from "date-fns";
import type { ReactNode } from "react";

export const RED = "#E53935";
export const INK = "#111111";
export const GREY = "#9A9A9A";

export const fmtInt = (v: number | null | undefined) => (v ?? 0).toLocaleString("en-AU");
export const fmtMoney = (cents: number | null | undefined, currency = "AUD") =>
  `${((cents ?? 0) / 100).toLocaleString("en-AU", { maximumFractionDigits: 0 })} ${currency}`;
export const fmtDate = (d: string | Date | null | undefined) => (d ? format(new Date(d), "d MMM yyyy") : "");
export const fmtDateTime = (d: string | Date | null | undefined) => (d ? format(new Date(d), "d MMM yyyy, HH:mm") : "");
export const fmtAgo = (d: string | Date | null | undefined) => (d ? formatDistanceToNowStrict(new Date(d), { addSuffix: true }) : "");
export const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium ${className}`}>{children}</span>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <h3 className="font-heading font-semibold text-sm tracking-[0.1em] uppercase">{children}</h3>
      {right}
    </div>
  );
}

export function Panel({ children, className = "", title, right }: { children: ReactNode; className?: string; title?: ReactNode; right?: ReactNode }) {
  return (
    <section className={`border border-black/10 bg-white ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-black/10">
          <h3 className="font-heading font-semibold text-xs tracking-[0.12em] uppercase">{title}</h3>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Delta({ current, previous, suffix = "" }: { current: number; previous: number; suffix?: string }) {
  if (!previous && !current) return <span className="text-[11px] text-black/30">no change</span>;
  if (!previous) return <span className="text-[11px] text-black/40">new</span>;
  const change = Math.round(((current - previous) / previous) * 100);
  const up = change > 0;
  const flat = change === 0;
  return (
    <span className={`text-[11px] font-medium ${flat ? "text-black/40" : up ? "text-green-700" : "text-[#E53935]"}`}>
      {flat ? "same" : `${up ? "+" : ""}${change}%`}
      {suffix}
    </span>
  );
}

export function KpiCard({ label, value, previous, current, hint }: { label: string; value: string; previous?: number; current?: number; hint?: string }) {
  return (
    <div className="border border-black/10 p-4 lg:p-5 bg-white">
      <Label className="block mb-2">{label}</Label>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-heading font-bold text-2xl lg:text-[28px] tracking-[-0.02em] leading-none">{value}</span>
        {previous !== undefined && current !== undefined && <Delta current={current} previous={previous} />}
      </div>
      {hint && <p className="text-[11px] text-black/40 mt-2">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const colors: Record<string, string> = {
    new: "bg-[#E53935]/10 text-[#E53935]",
    contacted: "bg-blue-50 text-blue-700",
    applied: "bg-amber-50 text-amber-800",
    converted: "bg-green-50 text-green-700",
    archived: "bg-black/5 text-black/40",
  };
  const s = status || "new";
  return <span className={`inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-medium ${colors[s] || colors.new}`}>{s}</span>;
}

export function KindBadge({ kind }: { kind: string }) {
  const labels: Record<string, string> = { assessment: "Assessment", application: "Application", purchase: "Purchase", enquiry: "Enquiry" };
  return <span className="inline-flex items-center border border-black/15 px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase text-black/60">{labels[kind] || kind}</span>;
}

export function ScorePill({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) return <span className="text-black/30 text-xs">none</span>;
  const tone = score >= 80 ? "bg-green-50 text-green-700" : score >= 60 ? "bg-black/5 text-black" : score >= 50 ? "bg-amber-50 text-amber-800" : "bg-[#E53935]/10 text-[#E53935]";
  return <span className={`inline-flex items-center justify-center min-w-[36px] px-1.5 py-0.5 text-xs font-semibold ${tone}`}>{score}</span>;
}

export function Empty({ children = "Nothing here yet" }: { children?: ReactNode }) {
  return <div className="px-5 py-12 text-center text-black/30 text-xs">{children}</div>;
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-black/20 border-t-black animate-spin" role="status" aria-label="Loading" />
    </div>
  );
}

export function PeriodSelect({ value, onChange, options = [7, 30, 90, 365] }: { value: number; onChange: (d: number) => void; options?: number[] }) {
  return (
    <div className="inline-flex border border-black/15">
      {options.map(d => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={`px-3 py-1.5 text-[11px] tracking-[0.1em] uppercase font-medium transition-colors ${value === d ? "bg-black text-white" : "text-black/50 hover:text-black"}`}
        >
          {d === 365 ? "1 year" : `${d} days`}
        </button>
      ))}
    </div>
  );
}

/** A simple horizontal bar list: label, value and a bar scaled to the largest value. */
export function BarList({ rows, max, format = fmtInt, empty }: { rows: { label: ReactNode; value: number; sub?: ReactNode }[]; max?: number; format?: (v: number) => string; empty?: string }) {
  if (!rows.length) return <Empty>{empty ?? "No data for this period"}</Empty>;
  const top = max ?? Math.max(...rows.map(r => r.value), 1);
  return (
    <ul className="divide-y divide-black/5">
      {rows.map((r, i) => (
        <li key={i} className="px-5 py-2.5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="truncate min-w-0">{r.label}</span>
            <span className="font-medium tabular-nums shrink-0">{format(r.value)}</span>
          </div>
          <div className="h-1 bg-black/5 mt-1.5">
            <div className="h-1 bg-black" style={{ width: `${Math.max(2, (r.value / top) * 100)}%` }} />
          </div>
          {r.sub && <div className="text-[11px] text-black/40 mt-1">{r.sub}</div>}
        </li>
      ))}
    </ul>
  );
}

export const th = "text-left px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium whitespace-nowrap";
export const td = "px-4 py-2.5 text-sm align-top";
export const btnPrimary = "inline-flex items-center gap-2 bg-black text-white text-[10px] tracking-[0.15em] uppercase px-4 py-2 hover:bg-black/80 transition-colors font-medium disabled:opacity-40";
export const btnSecondary = "inline-flex items-center gap-2 border border-black text-black text-[10px] tracking-[0.15em] uppercase px-4 py-2 hover:bg-black hover:text-white transition-colors font-medium disabled:opacity-40";
export const btnGhost = "inline-flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-black/50 hover:text-black transition-colors font-medium";
export const inputCls = "border border-black/15 bg-white text-sm px-3 py-2 focus:outline-none focus:border-black transition-colors";
export const selectCls = "border border-black/15 bg-white text-xs px-3 py-2 focus:outline-none focus:border-black transition-colors";

export function downloadCSV(name: string, headers: string[], rows: unknown[][]) {
  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export const stamp = (d: Date | string | null | undefined) => (d ? format(new Date(d), "yyyy-MM-dd HH:mm:ss") : "");
