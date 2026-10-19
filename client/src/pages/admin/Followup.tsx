// Follow up: where every lead stands, who owes whom a reply, and a drafted
// reply for each open lead. Built from the "Where your leads stand" page.
// Stages come from the server (server/followup.ts); Gmail feeds the
// conversation once it is connected on the System page.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Check, Copy, ExternalLink, Mail, MessageSquare, Phone, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";
import { trpc } from "@/lib/trpc";
import { BarList, Empty, KpiCard, Label, Panel, Spinner, btnGhost, btnPrimary, btnSecondary, fmtDate, fmtDateTime, inputCls, td, th } from "./ui";

type Overview = inferRouterOutputs<AppRouter>["admin"]["followup"]["overview"];
type Lead = Overview["leads"][number];
type Ev = Overview["events"][number];

const STAGES = ["Reply owed", "Never replied", "Won", "Waiting on lead", "Gone quiet"] as const;
const OWED = ["Reply owed", "Never replied"];
const INK = "#121212", BLUE = "#2F6BF0", B2 = "#548DF8", GREY = "#BDBDBD";
const stageColor = (s: string) => (OWED.includes(s) ? INK : s === "Won" ? BLUE : s === "Waiting on lead" ? B2 : GREY);
const short = (n: string) => n.split(" (")[0];
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

function gmailUrl(l: Lead, account: string | null) {
  const p = new URLSearchParams({ view: "cm", fs: "1", to: l.email, su: l.draftSubject ?? "", body: l.draftBody ?? "" });
  if (account) p.set("authuser", account);
  return `https://mail.google.com/mail/?${p.toString()}`;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

function StageTag({ stage }: { stage: string }) {
  const owed = OWED.includes(stage);
  return (
    <span className={`inline-block whitespace-nowrap text-[10px] tracking-[0.12em] uppercase px-1.5 py-0.5 border align-middle ${owed ? "bg-black text-white border-black" : stage === "Won" ? "border-[#2F6BF0] text-black" : "border-black/30 text-black/60"}`}>
      {stage}
    </span>
  );
}

// ─── Next steps ────────────────────────────────────────────────────────────

function LogButtons({ lead, compact = false, iconOnly = false }: { lead: Lead; compact?: boolean; iconOnly?: boolean }) {
  const utils = trpc.useUtils();
  const log = trpc.admin.followup.log.useMutation({ onSuccess: () => utils.admin.followup.overview.invalidate() });
  const busy = log.isPending;
  const b = compact ? btnGhost : btnSecondary;
  return (
    <>
      <button type="button" className={b} disabled={busy} title="I replied by email (log it when Gmail is not connected)" onClick={() => log.mutate({ email: lead.email, kind: "sent", channel: "email" })}>
        <Mail className="w-3 h-3" /> {!iconOnly && "I replied"}
      </button>
      <button type="button" className={b} disabled={busy} title="I called them" onClick={() => log.mutate({ email: lead.email, kind: "sent", channel: "call" })}>
        <Phone className="w-3 h-3" /> {!iconOnly && "I called"}
      </button>
      <button type="button" className={b} disabled={busy} title="They replied somewhere the site cannot see (Instagram, text)" onClick={() => log.mutate({ email: lead.email, kind: "reply", channel: "message" })}>
        <MessageSquare className="w-3 h-3" /> {!iconOnly && "They replied"}
      </button>
    </>
  );
}

function StepCard({ n, lead, account, openContact }: { n: number; lead: Lead; account: string | null; openContact: (id: number) => void }) {
  const utils = trpc.useUtils();
  const redraft = trpc.admin.followup.redraft.useMutation({ onSuccess: () => utils.admin.followup.overview.invalidate() });
  const [copied, setCopied] = useState<string | null>(null);
  const copy = () => {
    const t = `Subject: ${lead.draftSubject}\n\n${lead.draftBody}`;
    const done = (m: string) => {
      setCopied(m);
      setTimeout(() => setCopied(null), 1800);
    };
    try {
      navigator.clipboard.writeText(t).then(() => done("Copied"), () => done("Copy blocked"));
    } catch {
      done("Copy blocked");
    }
  };
  return (
    <div className="bg-white p-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <span className="font-heading text-3xl tracking-[-0.04em] leading-none">{String(n).padStart(2, "0")}</span>
        <span className="text-right">
          <span className="block font-heading text-xl leading-none">{lead.days}</span>
          <Label>days</Label>
        </span>
      </div>
      <div className="text-sm font-semibold">
        {lead.name} <StageTag stage={lead.stage} />
        {lead.score !== null && <span className="ml-2 text-[11px] text-black/40 font-normal">score {lead.score}</span>}
      </div>
      <p className="text-[13px] leading-snug flex-1">{lead.nextAction ?? (lead.draftedAt ? "" : "No draft yet. Press Sync, or Redraft here.")}</p>
      {lead.draftBody && (
        <details className="text-[12px] text-black/70">
          <summary className="cursor-pointer text-black/50 hover:text-black">Read the draft</summary>
          <p className="mt-2 font-medium text-black">{lead.draftSubject}</p>
          <pre className="mt-1 whitespace-pre-wrap font-sans leading-snug">{lead.draftBody}</pre>
        </details>
      )}
      <div className="flex flex-wrap gap-1.5">
        {lead.draftBody ? (
          <>
            <a className={btnPrimary} href={gmailUrl(lead, account)} target="_blank" rel="noopener noreferrer">
              Draft in Gmail <ExternalLink className="w-3 h-3" />
            </a>
            <button type="button" className={btnSecondary} onClick={copy}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ?? "Copy draft"}
            </button>
          </>
        ) : null}
        <button type="button" className={btnSecondary} disabled={redraft.isPending} onClick={() => redraft.mutate({ email: lead.email })}>
          <RefreshCw className={`w-3 h-3 ${redraft.isPending ? "animate-spin" : ""}`} /> {lead.draftBody ? "Redraft" : "Draft now"}
        </button>
        {lead.leadId !== null && (
          <button type="button" className={btnGhost} onClick={() => openContact(lead.leadId!)}>
            Details
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-3 pt-1 border-t border-black/5">
        <LogButtons lead={lead} compact />
      </div>
    </div>
  );
}

// ─── Charts ────────────────────────────────────────────────────────────────

function Matrix({ leads }: { leads: Lead[] }) {
  const cols = ["Never replied", "Reply owed", "Waiting on lead", "Gone quiet", "Won"];
  const rowsN = Array.from(new Set(leads.map(l => l.commitment)));
  const order = ["All in", "Ready", "Thinking", "Curious", "Not recorded"];
  rowsN.sort((a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b)));
  const count = (c: string, s: string) => leads.filter(l => l.commitment === c && l.stage === s).length;
  const mx = Math.max(1, ...rowsN.flatMap(r => cols.map(c => count(r, c))));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className={th} />
            {cols.map(c => (
              <th key={c} className={`${th} text-center whitespace-normal leading-tight px-1`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowsN.map(r => (
            <tr key={r} className="border-t border-black/5">
              <td className="px-4 py-2 text-sm whitespace-nowrap">{r}</td>
              {cols.map(c => {
                const v = count(r, c);
                const col = OWED.includes(c) ? INK : BLUE;
                return (
                  <td key={c} className="px-1 py-1 text-center">
                    <div className="h-8 flex items-center justify-center text-sm" style={{ background: v ? col : "transparent", opacity: v ? 0.25 + 0.75 * (v / mx) : 1, color: v && v / mx > 0.35 ? "#fff" : INK, border: v ? "none" : "1px solid rgba(0,0,0,0.06)" }} title={`${r}, ${c}: ${v}`}>
                      {v || ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const KIND: Record<string, { c: string; s: "circle" | "square" | "diamond"; l: string }> = {
  form: { c: BLUE, s: "circle", l: "Filled in a form" },
  application: { c: BLUE, s: "circle", l: "Applied for coaching" },
  purchase: { c: INK, s: "circle", l: "Bought a program" },
  sent: { c: INK, s: "square", l: "You emailed or called" },
  auto: { c: GREY, s: "square", l: "Automated email" },
  reply: { c: B2, s: "diamond", l: "They replied" },
};

function Timeline({ leads, events }: { leads: Lead[]; events: Ev[] }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const rows = useMemo(() => leads.slice().sort((a, b) => STAGES.indexOf(a.stage as any) - STAGES.indexOf(b.stage as any) || b.days - a.days), [leads]);
  if (!w) return <div ref={ref} className="h-24" />;
  const lw = Math.min(160, Math.max(90, Math.round(w * 0.18)));
  const m = { t: 26, l: lw + 10, r: 16, b: 6 }, rh = 22, gh = 26;
  const pos: { head?: string; lead?: Lead; y: number }[] = [];
  let y = m.t;
  let prev: string | null = null;
  for (const r of rows) {
    if (r.stage !== prev) {
      pos.push({ head: r.stage, y: y + gh / 2 });
      y += gh;
      prev = r.stage;
    }
    pos.push({ lead: r, y: y + rh / 2 });
    y += rh;
  }
  const h = y + m.b;
  const times = events.map(e => Date.parse(e.at));
  const t0 = (times.length ? Math.min(...times) : Date.now() - 90 * 864e5) - 4 * 864e5;
  const t1 = Date.now() + 2 * 864e5;
  const x = (t: number) => m.l + ((t - t0) / (t1 - t0)) * (w - m.l - m.r);
  const months: Date[] = [];
  const d0 = new Date(t0);
  const cur = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + 1, 1));
  while (cur.getTime() < t1) {
    months.push(new Date(cur));
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  const tx = x(Date.now());
  const byLead = new Map<string, Ev[]>();
  for (const e of events) {
    if (!byLead.has(e.email)) byLead.set(e.email, []);
    byLead.get(e.email)!.push(e);
  }
  return (
    <div ref={ref} className="relative overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img" className="block text-[10.5px]" style={{ minWidth: 320 }}>
        {months.map(mo => (
          <g key={mo.toISOString()}>
            <line x1={x(mo.getTime())} x2={x(mo.getTime())} y1={m.t - 6} y2={h - m.b} stroke="#D6D6D6" />
            <text x={x(mo.getTime()) + 4} y={m.t - 12} fill="#6a6a6a" style={{ letterSpacing: ".1em" }}>{format(mo, "MMM yyyy").toUpperCase()}</text>
          </g>
        ))}
        <line x1={tx} x2={tx} y1={m.t - 6} y2={h - m.b} stroke={INK} strokeDasharray="4 3" />
        <text x={tx - 4} y={m.t - 12} textAnchor="end" fill={INK} fontWeight={700} style={{ letterSpacing: ".1em", paintOrder: "stroke", stroke: "#fff", strokeWidth: 4 }}>TODAY</text>
        {pos.map((p, i) => {
          if (p.head) return <text key={i} x={2} y={p.y + 4} fill={INK} fontWeight={700} style={{ letterSpacing: ".12em" }}>{p.head.toUpperCase()}</text>;
          const r = p.lead!;
          const ev = (byLead.get(r.email) ?? []).slice().sort((a, b) => a.at.localeCompare(b.at));
          const xs = ev.map(e => x(Date.parse(e.at)));
          return (
            <g key={i}>
              <text x={m.l - 8} y={p.y + 4} textAnchor="end" fill="#6a6a6a">{short(r.name).slice(0, 18)}</text>
              {xs.length > 0 && <line x1={Math.min(...xs)} x2={Math.max(...xs)} y1={p.y} y2={p.y} stroke="#9a9a9a" strokeWidth={1.5} />}
              {OWED.includes(r.stage) && xs.length > 0 && <line x1={Math.max(...xs)} x2={tx} y1={p.y} y2={p.y} stroke={INK} strokeWidth={2} strokeDasharray="5 3" />}
              {ev.map((e, j) => {
                const k = KIND[e.kind] ?? KIND.auto;
                const cx = x(Date.parse(e.at)) + (e.kind === "reply" ? 4 : 0);
                const common = { fill: k.c, stroke: "#F4F4F4", strokeWidth: 2, onMouseMove: (evt: React.MouseEvent) => setTip({ x: evt.nativeEvent.offsetX, y: evt.nativeEvent.offsetY, text: `${short(r.name)}: ${k.l}, ${fmtDate(e.at)}${e.subject ? ` (${e.subject})` : ""}` }), onMouseLeave: () => setTip(null) };
                if (k.s === "circle") return <circle key={j} cx={cx} cy={p.y} r={e.kind === "purchase" ? 7 : 5} {...common} />;
                if (k.s === "diamond") return <path key={j} d={`M${cx} ${p.y - 6}L${cx + 6} ${p.y}L${cx} ${p.y + 6}L${cx - 6} ${p.y}Z`} {...common} />;
                return <rect key={j} x={cx - 4} y={p.y - 4} width={8} height={8} {...common} />;
              })}
            </g>
          );
        })}
      </svg>
      {tip && (
        <div className="absolute pointer-events-none bg-black text-white text-[11px] px-2 py-1 z-10" style={{ left: Math.max(0, Math.min(tip.x + 12, w - 220)), top: tip.y + 12 }}>
          {tip.text}
        </div>
      )}
    </div>
  );
}

function Legend({ items }: { items: { c: string; s: "circle" | "square" | "diamond"; l: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-black/50 uppercase tracking-[0.08em] px-5 py-3">
      {items.map(k => (
        <span key={k.l} className="inline-flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12">
            {k.s === "circle" ? <circle cx="6" cy="6" r="5" fill={k.c} /> : k.s === "diamond" ? <path d="M6 0L12 6L6 12L0 6Z" fill={k.c} /> : <rect x="1" y="1" width="10" height="10" fill={k.c} />}
          </svg>
          {k.l}
        </span>
      ))}
    </div>
  );
}

function SourceBars({ leads }: { leads: Lead[] }) {
  const groups: [string, string[], string][] = [["Needs you", OWED, INK], ["Bought", ["Won"], BLUE], ["Waiting or quiet", ["Waiting on lead", "Gone quiet"], GREY]];
  const sources = Array.from(new Set(leads.map(l => l.source)));
  const tot = (s: string) => leads.filter(l => l.source === s).length;
  sources.sort((a, b) => tot(b) - tot(a));
  const mx = Math.max(1, ...sources.map(tot));
  if (!sources.length) return <Empty>No leads yet</Empty>;
  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-black/50 uppercase tracking-[0.08em] px-5 pt-3">
        {groups.map(g => (
          <span key={g[0]} className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5" style={{ background: g[2] }} />{g[0]}</span>
        ))}
      </div>
      <ul className="divide-y divide-black/5">
        {sources.map(s => (
          <li key={s} className="px-5 py-2.5">
            <div className="flex items-center justify-between text-sm"><span>{s}</span><span className="font-medium tabular-nums">{tot(s)}</span></div>
            <div className="flex h-2 mt-1.5 bg-black/5">
              {groups.map(g => {
                const nn = leads.filter(l => l.source === s && g[1].includes(l.stage)).length;
                return nn ? <div key={g[0]} style={{ width: `${(nn / mx) * 100}%`, background: g[2] }} title={`${s}, ${g[0]}: ${nn}`} /> : null;
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function Followup({ openContact }: { openContact: (id: number) => void }) {
  const utils = trpc.useUtils();
  const q = trpc.admin.followup.overview.useQuery(undefined, { staleTime: 60_000 });
  const sync = trpc.admin.followup.sync.useMutation({ onSuccess: () => utils.admin.followup.overview.invalidate() });
  const [stage, setStage] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"rank" | "name" | "stage" | "source" | "commitment" | "sent" | "replies" | "lastContact" | "days">("rank");
  const [dir, setDir] = useState(1);
  const d = q.data;

  if (q.isLoading) return <Spinner />;
  if (!d) return <Empty>Could not load the leads</Empty>;
  const { leads, events, gmail } = d;
  const account = gmail.email;

  const owed = leads.filter(l => OWED.includes(l.stage));
  const oldest = owed.reduce((m, l) => Math.max(m, l.days), 0);
  const count = (s: string) => leads.filter(l => l.stage === s).length;
  const firstSeen = leads.reduce<string | null>((m, l) => (!m || l.firstSeen < m ? l.firstSeen : m), null);
  const open = leads.filter(l => l.needsDraft).sort((a, b) => ({ High: 0, Medium: 1, Low: 2 }[a.priority] - { High: 0, Medium: 1, Low: 2 }[b.priority]) || b.days - a.days);
  const groups: [string, string][] = [["Do today", "High"], ["This week", "Medium"], ["When you can", "Low"]];
  let n = 0;

  const byMonth = new Map<string, number>();
  for (const l of leads) byMonth.set(l.firstSeen.slice(0, 7), (byMonth.get(l.firstSeen.slice(0, 7)) ?? 0) + 1);
  const monthRows = Array.from(byMonth.entries()).sort().map(([k, v]) => ({ label: format(new Date(k + "-01T00:00:00"), "MMM yyyy"), value: v }));

  const lag = leads.map(l => {
    const ev = events.filter(e => e.email === l.email);
    const first = Math.min(...ev.filter(e => e.kind === "form" || e.kind === "application" || e.kind === "purchase").map(e => Date.parse(e.at)));
    if (!isFinite(first)) return null;
    const sent = ev.filter(e => e.kind === "sent" && Date.parse(e.at) >= first).map(e => Date.parse(e.at));
    const replied = sent.length > 0;
    const days = Math.max(0, Math.round(((replied ? Math.min(...sent) : Date.now()) - first) / 864e5));
    return { name: l.name, replied, days };
  }).filter((x): x is { name: string; replied: boolean; days: number } => x !== null).sort((a, b) => b.days - a.days);

  const rank = (l: Lead) => STAGES.indexOf(l.stage as any) * 10000 - l.days;
  let table = leads.map(l => ({ ...l, rank: rank(l) }));
  if (stage !== "All") table = table.filter(l => l.stage === stage);
  const qq = search.trim().toLowerCase();
  if (qq) table = table.filter(l => [l.name, l.email, l.goal ?? "", l.stage, l.source].join(" ").toLowerCase().includes(qq));
  table.sort((a, b) => {
    const xv = a[sortKey] as any, yv = b[sortKey] as any;
    const c = typeof xv === "number" && typeof yv === "number" ? xv - yv : String(xv ?? "").localeCompare(String(yv ?? ""));
    return c * dir;
  });
  const sortBy = (k: typeof sortKey) => {
    if (sortKey === k) setDir(-dir);
    else {
      setSortKey(k);
      setDir(k === "days" || k === "sent" || k === "replies" ? -1 : 1);
    }
  };
  const Th = ({ k, children, className = "" }: { k: typeof sortKey; children: React.ReactNode; className?: string }) => (
    <th className={`${th} ${className}`} aria-sort={sortKey === k ? (dir > 0 ? "ascending" : "descending") : "none"}>
      <button type="button" className="uppercase tracking-[0.15em] hover:text-black" onClick={() => sortBy(k)}>{children}</button>
    </th>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-black/50 max-w-3xl">
          {owed.length ? <><b className="text-black">{plural(owed.length, "lead")}</b> waiting on a reply from you; the longest for <b className="text-black">{plural(oldest, "day")}</b>. </> : <>Nobody is waiting on you. </>}
          {gmail.connected
            ? <>Gmail is connected as {gmail.email}; your emails and their replies are read {gmail.lastSyncAt ? `(last read ${fmtDateTime(gmail.lastSyncAt)})` : "on the first sync"}. Calls, texts and Instagram messages are not visible: log them on the card.</>
            : <>Gmail is not connected yet, so your replies only count when you log them here. <Link href="/admin/system" className="underline hover:text-black">Connect it on System</Link>.</>}
        </p>
        <button type="button" className={btnSecondary} disabled={sync.isPending} onClick={() => sync.mutate({})} title="Reads new mail (when Gmail is connected) and rewrites drafts whose story changed">
          <RefreshCw className={`w-3 h-3 ${sync.isPending ? "animate-spin" : ""}`} /> {sync.isPending ? "Syncing" : "Sync"}
        </button>
      </div>
      {sync.data && (
        <p className="text-xs text-black/50 border border-black/10 bg-white px-4 py-2">
          {sync.data.mail ? `Gmail: ${sync.data.mail.added} new messages across ${sync.data.mail.contacts} contacts${sync.data.mail.partial ? " (time ran out, press Sync again)" : ""}. ` : ""}
          {sync.data.mailError ? `Gmail: ${sync.data.mailError}. ` : ""}
          Drafts: {sync.data.drafts.drafted} written, {sync.data.drafts.kept} kept, {sync.data.drafts.failed} failed.
        </p>
      )}
      {gmail.lastError && <p className="text-xs text-black border border-black/10 bg-white px-4 py-2">Last Gmail read failed: {gmail.lastError}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KpiCard label={`Leads since ${firstSeen ? format(new Date(firstSeen), "MMM yyyy") : "the start"}`} value={String(leads.length)} />
        <KpiCard label="Waiting on you" value={String(owed.length)} hint="Reply owed and never replied" />
        <KpiCard label="Longest wait" value={`${oldest}d`} hint="Days the oldest owed reply has sat" />
        <KpiCard label="Bought" value={String(count("Won"))} />
        <KpiCard label="Waiting on them" value={String(count("Waiting on lead"))} />
        <KpiCard label="Gone quiet" value={String(count("Gone quiet"))} hint={`No reply after 21 days`} />
      </div>

      <Panel title="01  Next steps" right={<Label>Draft opens Gmail with the email filled in. You press send.</Label>}>
        {open.length === 0 ? (
          <Empty>Nothing waiting on you</Empty>
        ) : (
          <div className="p-4 space-y-4">
            {groups.map(([title, p]) => {
              const rows = open.filter(l => l.priority === p);
              if (!rows.length) return null;
              return (
                <div key={p}>
                  <Label className="block mb-2">{title} ({rows.length})</Label>
                  <div className="grid gap-px bg-black/10 border border-black/10" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 19rem), 1fr))" }}>
                    {rows.map(l => (
                      <StepCard key={l.email} n={++n} lead={l} account={account} openContact={openContact} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="02  Pipeline" right={<Label>Black means the next move is yours</Label>}>
          <BarList rows={["Never replied", "Reply owed", "Waiting on lead", "Gone quiet", "Won"].map(s => ({ label: <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5" style={{ background: stageColor(s) }} />{s}</span>, value: count(s) }))} />
        </Panel>
        <Panel title="Commitment against outcome" right={<Label>What they said on the form, and where they ended up</Label>}>
          <Matrix leads={leads} />
        </Panel>
      </div>

      <Panel title="03  Every conversation" right={<Label>A dashed line runs from the last contact to today where a reply is owed</Label>}>
        <Legend items={Object.values(KIND)} />
        <div className="px-4 pb-4">
          {leads.length ? <Timeline leads={leads} events={events} /> : <Empty>No conversations yet</Empty>}
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="04  Days waiting" right={<Label>Open leads, counted to today</Label>}>
          <BarList rows={leads.filter(l => ["Reply owed", "Never replied", "Won"].includes(l.stage)).sort((a, b) => b.days - a.days).map(l => ({ label: short(l.name), value: l.days, sub: l.stage }))} format={v => `${v} days`} empty="Nobody is waiting" />
        </Panel>
        <Panel title="Days to your first reply" right={<Label>"No reply" means they never got one</Label>}>
          <BarList rows={lag.map(r => ({ label: short(r.name), value: r.days, sub: r.replied ? "First reply" : "No reply yet" }))} format={v => `${v} days`} empty="No forms yet" />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="05  New leads by month" right={<Label>Date of first form or purchase</Label>}>
          <BarList rows={monthRows} empty="No leads yet" />
        </Panel>
        <Panel title="Source and outcome">
          <SourceBars leads={leads} />
        </Panel>
      </div>

      <Panel title="06  All leads" right={<Label>{table.length} of {leads.length}</Label>}>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-black/10">
          <input className={`${inputCls} flex-1 min-w-[12rem]`} type="search" placeholder="Search name, email, goal" aria-label="Search leads" value={search} onChange={e => setSearch(e.target.value)} />
          {["All", ...STAGES].map(s => (
            <button key={s} type="button" aria-pressed={stage === s} className={`text-[10px] tracking-[0.12em] uppercase px-3 py-2 border ${stage === s ? "bg-black text-white border-black" : "border-black/20 hover:border-black"}`} onClick={() => setStage(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto max-h-[36rem] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-black/10">
                <Th k="name">Lead</Th>
                <Th k="stage">Stage</Th>
                <Th k="source" className="hidden md:table-cell">Source</Th>
                <Th k="commitment" className="hidden md:table-cell">Commitment</Th>
                <Th k="sent" className="hidden md:table-cell text-right">You sent</Th>
                <Th k="replies" className="hidden md:table-cell text-right">They sent</Th>
                <Th k="lastContact">Last contact</Th>
                <Th k="days" className="text-right">Days</Th>
                <th className={`${th} hidden lg:table-cell`}>Next step</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {table.map(l => (
                <tr key={l.email} className="border-b border-black/5 hover:bg-[#F4F4F4] cursor-pointer" onClick={() => l.leadId !== null && openContact(l.leadId)}>
                  <td className={td}>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-[11px] text-black/40">{l.email}</div>
                  </td>
                  <td className={td}><StageTag stage={l.stage} /></td>
                  <td className={`${td} hidden md:table-cell`}>{l.source}</td>
                  <td className={`${td} hidden md:table-cell`}>{l.commitment}</td>
                  <td className={`${td} hidden md:table-cell text-right tabular-nums`}>{l.sent}</td>
                  <td className={`${td} hidden md:table-cell text-right tabular-nums`}>{l.replies}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDate(l.lastContact)} <span className="text-black/40">({l.lastBy})</span></td>
                  <td className={`${td} text-right tabular-nums`}>{l.days}</td>
                  <td className={`${td} hidden lg:table-cell text-xs text-black/60 max-w-[24rem]`}>{l.nextAction}</td>
                  <td className={`${td} whitespace-nowrap`} onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2"><LogButtons lead={l} compact iconOnly /></div>
                  </td>
                </tr>
              ))}
              {!table.length && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-black/40">No leads match</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
