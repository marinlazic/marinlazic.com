// Studio: one idea from Marin becomes the same message for every channel.
// Three views under /admin/studio: new idea and history, one idea with its
// pieces, and what is working by platform. The writing happens on the server
// (server/studio.ts) under the rules in .claude/skills/content.
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import type { inferRouterOutputs } from "@trpc/server";
import { AlertCircle, ArrowLeft, Check, Copy, ExternalLink, Link2, Pencil, RefreshCw, Trash2 } from "lucide-react";
import type { AppRouter } from "../../../../server/routers";
import { trpc } from "@/lib/trpc";
import { CHANNELS, CTAS, PLATFORMS, channelById, trackedLink, type Channel } from "@shared/studioChannels";
import { Empty, KpiCard, Label, Panel, PeriodSelect, Spinner, btnGhost, btnPrimary, btnSecondary, fmtDate, fmtDateTime, fmtInt, inputCls, selectCls, td, th } from "./ui";

type Outputs = inferRouterOutputs<AppRouter>["admin"]["studio"];
type IdeaRow = Outputs["list"][number];
type IdeaFull = NonNullable<Outputs["get"]>;
type Piece = IdeaFull["pieces"][number];

const ORIGIN = typeof window !== "undefined" && /marinlazic\.com$/.test(window.location.hostname) ? window.location.origin : "https://marinlazic.com";
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
const shorten = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

// ─── Entry ─────────────────────────────────────────────────────────────────

export function Studio({ location }: { location: string }) {
  const rest = location.replace(/^\/admin\/studio\/?/, "").split("/")[0];
  if (rest === "stats") return <StudioStats />;
  if (/^\d+$/.test(rest)) return <IdeaView id={Number(rest)} />;
  return <StudioHome />;
}

function SubNav({ active }: { active: "ideas" | "stats" }) {
  const [, navigate] = useLocation();
  const item = (id: "ideas" | "stats", label: string, href: string) => (
    <button
      type="button"
      onClick={() => navigate(href)}
      className={`px-3 py-1.5 text-[11px] tracking-[0.1em] uppercase font-medium transition-colors ${active === id ? "bg-black text-white" : "text-black/50 hover:text-black"}`}
    >
      {label}
    </button>
  );
  return (
    <div className="inline-flex border border-black/15 mb-6">
      {item("ideas", "Ideas", "/admin/studio")}
      {item("stats", "What is working", "/admin/studio/stats")}
    </div>
  );
}

// ─── Home: new idea and history ────────────────────────────────────────────

function StudioHome() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const list = trpc.admin.studio.list.useQuery(undefined, { staleTime: 30_000 });
  const create = trpc.admin.studio.create.useMutation({
    onSuccess: idea => {
      utils.admin.studio.list.invalidate();
      navigate(`/admin/studio/${idea.id}`);
    },
  });
  const [idea, setIdea] = useState("");
  const [cta, setCta] = useState("assessment");
  const [channels, setChannels] = useState<string[]>(CHANNELS.map(c => c.id));
  const toggle = (id: string) => setChannels(cs => (cs.includes(id) ? cs.filter(c => c !== id) : [...cs, id]));
  const setGroup = (group: Channel["group"], on: boolean) =>
    setChannels(cs => {
      const ids = CHANNELS.filter(c => c.group === group).map(c => c.id);
      return on ? Array.from(new Set([...cs, ...ids])) : cs.filter(c => !ids.includes(c));
    });

  return (
    <div>
      <SubNav active="ideas" />
      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6">
        <Panel title="New idea">
          <form
            className="p-5"
            onSubmit={e => {
              e.preventDefault();
              if (idea.trim().length < 10 || !channels.length) return;
              create.mutate({ idea: idea.trim(), cta, channels });
            }}
          >
            <Label className="block mb-2">The idea, thought or note</Label>
            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value)}
              rows={6}
              placeholder="One line is enough. Rough notes, a voice note transcript or a quote you liked all work."
              className={`${inputCls} w-full resize-y`}
            />
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label className="block mb-2">Where every piece sends people</Label>
                <select value={cta} onChange={e => setCta(e.target.value)} className={`${selectCls} w-full`}>
                  {Object.entries(CTAS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Channels</Label>
                <div className="flex gap-3 text-[11px]">
                  <button type="button" className={btnGhost} onClick={() => setChannels(CHANNELS.map(c => c.id))}>
                    All
                  </button>
                  <button type="button" className={btnGhost} onClick={() => setChannels([])}>
                    None
                  </button>
                </div>
              </div>
              {(["written", "video"] as const).map(group => (
                <div key={group} className="mb-3">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-black/60 font-medium">{group}</span>
                    <button type="button" className={btnGhost} onClick={() => setGroup(group, true)}>
                      all
                    </button>
                    <button type="button" className={btnGhost} onClick={() => setGroup(group, false)}>
                      none
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                    {CHANNELS.filter(c => c.group === group).map(c => (
                      <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={channels.includes(c.id)} onChange={() => toggle(c.id)} className="accent-black" />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {create.error && (
              <p className="text-xs text-black mt-3 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {create.error.message}
              </p>
            )}
            <div className="flex items-center gap-4 mt-5">
              <button type="submit" disabled={create.isPending || idea.trim().length < 10 || !channels.length} className={btnPrimary}>
                {create.isPending ? "Writing the core" : `Write ${plural(channels.length, "piece")}`}
              </button>
              {create.isPending && <span className="text-xs text-black/50">About 20 seconds. The pieces follow on the next screen.</span>}
            </div>
          </form>
        </Panel>

        <Panel title="History" right={<span className="text-[11px] text-black/40">{list.data ? plural(list.data.length, "idea") : ""}</span>}>
          {list.isLoading ? (
            <Spinner />
          ) : !list.data?.length ? (
            <Empty>No ideas yet. Write the first one on the left.</Empty>
          ) : (
            <ul className="divide-y divide-black/5">
              {list.data.map(i => (
                <HistoryRow key={i.id} idea={i} onOpen={() => navigate(`/admin/studio/${i.id}`)} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function HistoryRow({ idea, onOpen }: { idea: IdeaRow; onOpen: () => void }) {
  const posted = idea.pieces.filter(p => p.status === "posted").length;
  const written = idea.pieces.filter(p => !["pending", "generating", "failed"].includes(p.status)).length;
  return (
    <li>
      <button type="button" onClick={onOpen} className="w-full text-left px-5 py-3.5 hover:bg-black/[0.02] transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{idea.title}</div>
            <div className="text-[11px] text-black/40 mt-0.5">
              {fmtDate(idea.createdAt)} · {CTAS[idea.cta]?.label ?? idea.cta} · {written} of {idea.pieces.length} written, {posted} posted
            </div>
          </div>
          <IdeaStatus status={idea.status} />
        </div>
        <div className="flex gap-1 mt-2">
          {idea.pieces.map(p => (
            <span key={p.channel} title={`${channelById(p.channel)?.label ?? p.channel}: ${p.status}`} className={`h-1.5 flex-1 ${statusColor(p.status)}`} />
          ))}
        </div>
      </button>
    </li>
  );
}

const statusColor = (s: string) =>
  s === "posted" ? "bg-[#2F6BF0]" : s === "ready" ? "bg-black" : s === "draft" ? "bg-black/40" : s === "failed" ? "bg-[#FF5A36]" : s === "skipped" ? "bg-black/10" : "bg-black/10 animate-pulse";

function IdeaStatus({ status }: { status: string }) {
  return <span className={`shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase font-medium ${status === "ready" ? "bg-black text-white" : status === "archived" ? "bg-black/5 text-black/40" : "border border-black/20 text-black/60"}`}>{status}</span>;
}

function PieceStatus({ status }: { status: string }) {
  const cls =
    status === "posted" ? "bg-[#2F6BF0] text-white" : status === "ready" ? "bg-black text-white" : status === "failed" ? "bg-[#FF5A36] text-white" : status === "skipped" ? "bg-black/5 text-black/40" : "border border-black/20 text-black/60";
  const label = status === "generating" ? "writing" : status === "pending" ? "queued" : status;
  return <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] tracking-[0.1em] uppercase font-medium ${cls}`}>{label}</span>;
}

// ─── One idea ──────────────────────────────────────────────────────────────

const CONCURRENT = 3;

function IdeaView({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const q = trpc.admin.studio.get.useQuery({ id }, { staleTime: 5_000 });
  const idea = q.data;
  const [selected, setSelected] = useState<number | "core" | null>(null);
  const inFlight = useRef(new Set<number>());
  const gen = trpc.admin.studio.generatePiece.useMutation({
    onSettled: (_d, _e, vars) => {
      inFlight.current.delete(vars.pieceId);
      utils.admin.studio.get.invalidate({ id });
      utils.admin.studio.list.invalidate();
    },
  });

  // Write the queued pieces a few at a time. Each one is its own request so a
  // slow channel never holds the others, and a page reload picks up where it was.
  useEffect(() => {
    if (!idea) return;
    const queued = idea.pieces.filter(p => p.status === "pending" && !inFlight.current.has(p.id));
    const room = CONCURRENT - inFlight.current.size;
    for (const p of queued.slice(0, Math.max(0, room))) {
      inFlight.current.add(p.id);
      gen.mutate({ pieceId: p.id });
    }
  }, [idea, gen]);

  useEffect(() => {
    if (!idea || selected !== null) return;
    const first = idea.pieces.find(p => p.body) ?? idea.pieces[0];
    setSelected(first ? first.id : "core");
  }, [idea, selected]);

  const del = trpc.admin.studio.delete.useMutation({
    onSuccess: () => {
      utils.admin.studio.list.invalidate();
      navigate("/admin/studio");
    },
  });
  const upd = trpc.admin.studio.updateIdea.useMutation({ onSuccess: () => utils.admin.studio.get.invalidate({ id }) });

  if (q.isLoading) return <Spinner />;
  if (!idea) return <Empty>This idea is gone.</Empty>;

  const piece = typeof selected === "number" ? idea.pieces.find(p => p.id === selected) ?? null : null;
  const writing = idea.pieces.filter(p => p.status === "pending" || p.status === "generating").length;

  return (
    <div>
      <button type="button" onClick={() => navigate("/admin/studio")} className={`${btnGhost} mb-4`}>
        <ArrowLeft className="w-3.5 h-3.5" /> All ideas
      </button>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h2 className="font-heading font-bold text-xl lg:text-2xl tracking-[-0.02em] leading-tight">{idea.title}</h2>
          <div className="text-xs text-black/50 mt-1.5">
            {fmtDateTime(idea.createdAt)} · sends people to {CTAS[idea.cta]?.label ?? idea.cta} · link tag <span className="font-mono">{idea.slug.replace(/-/g, "")}</span>
            {writing > 0 && <span className="ml-2 text-black">· writing {plural(writing, "piece")}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IdeaStatus status={idea.status} />
          {idea.status !== "archived" ? (
            <button type="button" className={btnSecondary} onClick={() => upd.mutate({ id, status: "archived" })}>
              Archive
            </button>
          ) : (
            <button type="button" className={btnSecondary} onClick={() => upd.mutate({ id, status: "ready" })}>
              Restore
            </button>
          )}
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              if (window.confirm("Delete this idea and every piece and reading under it? This cannot be undone.")) del.mutate({ id });
            }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
        <aside className="lg:sticky lg:top-20">
          <Panel>
            <button
              type="button"
              onClick={() => setSelected("core")}
              className={`w-full text-left px-4 py-3 border-b border-black/10 transition-colors ${selected === "core" ? "bg-black text-white" : "hover:bg-black/[0.03]"}`}
            >
              <div className="text-[10px] tracking-[0.15em] uppercase font-medium opacity-60">Start here</div>
              <div className="text-sm font-medium mt-0.5">The core</div>
            </button>
            {(["written", "video"] as const).map(group => {
              const rows = idea.pieces.filter(p => channelById(p.channel)?.group === group);
              if (!rows.length) return null;
              return (
                <div key={group}>
                  <div className="px-4 pt-3 pb-1">
                    <Label>{group}</Label>
                  </div>
                  {rows.map(p => {
                    const ch = channelById(p.channel);
                    const active = selected === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelected(p.id)}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 transition-colors ${active ? "bg-black text-white" : "hover:bg-black/[0.03]"}`}
                      >
                        <span className="text-sm truncate">{ch?.label ?? p.channel}</span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          {p.checks.length > 0 && !active && <span className="w-1.5 h-1.5 bg-[#FF5A36]" title={plural(p.checks.length, "style check")} />}
                          <PieceStatus status={p.status} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
            <AddChannels idea={idea} />
          </Panel>
        </aside>

        <div className="min-w-0">
          {selected === "core" ? <CoreView idea={idea} /> : piece ? <PieceView idea={idea} piece={piece} /> : <Empty>Pick a piece on the left.</Empty>}
        </div>
      </div>
    </div>
  );
}

function AddChannels({ idea }: { idea: IdeaFull }) {
  const utils = trpc.useUtils();
  const missing = CHANNELS.filter(c => !idea.pieces.some(p => p.channel === c.id));
  const add = trpc.admin.studio.addChannels.useMutation({ onSuccess: () => utils.admin.studio.get.invalidate({ id: idea.id }) });
  if (!missing.length) return null;
  return (
    <div className="px-4 py-3 border-t border-black/10">
      <select
        className={`${selectCls} w-full`}
        value=""
        onChange={e => {
          if (e.target.value) add.mutate({ ideaId: idea.id, channels: [e.target.value] });
        }}
      >
        <option value="">Add a channel</option>
        {missing.map(c => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── The core ──────────────────────────────────────────────────────────────

function CoreView({ idea }: { idea: IdeaFull }) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [core, setCore] = useState(idea.core ?? "");
  useEffect(() => setCore(idea.core ?? ""), [idea.core]);
  const save = trpc.admin.studio.updateIdea.useMutation({
    onSuccess: () => {
      utils.admin.studio.get.invalidate({ id: idea.id });
      setEditing(false);
    },
  });
  const gen = trpc.admin.studio.generatePiece.useMutation({ onSettled: () => utils.admin.studio.get.invalidate({ id: idea.id }) });
  const rewriteAll = () => {
    if (!window.confirm("Rewrite every piece from the core? Edits you made to the pieces are lost. Posted pieces are left alone.")) return;
    for (const p of idea.pieces) if (p.status !== "posted") gen.mutate({ pieceId: p.id });
  };
  return (
    <Panel
      title="The core"
      right={
        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <button type="button" className={btnGhost} onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button type="button" className={btnPrimary} disabled={save.isPending} onClick={() => save.mutate({ id: idea.id, core })}>
                <Check className="w-3.5 h-3.5" /> Save
              </button>
            </>
          ) : (
            <>
              <button type="button" className={btnGhost} onClick={rewriteAll} disabled={gen.isPending}>
                <RefreshCw className="w-3.5 h-3.5" /> Rewrite all pieces
              </button>
              <button type="button" className={btnSecondary} onClick={() => setEditing(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="px-5 py-3 border-b border-black/10 bg-black/[0.02]">
        <Label className="block mb-1">What Marin typed</Label>
        <p className="text-sm whitespace-pre-wrap">{idea.idea}</p>
      </div>
      {editing ? (
        <textarea value={core} onChange={e => setCore(e.target.value)} rows={28} className="w-full p-5 text-sm font-mono leading-relaxed focus:outline-none" />
      ) : (
        <div className="p-5">
          <Md text={idea.core ?? ""} />
        </div>
      )}
    </Panel>
  );
}

// ─── One piece ─────────────────────────────────────────────────────────────

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(c => (c === key ? null : c)), 1500);
    } catch {
      window.prompt("Copy this", text);
    }
  };
  return { copied, copy };
}

function PieceView({ idea, piece }: { idea: IdeaFull; piece: Piece }) {
  const utils = trpc.useUtils();
  const ch = channelById(piece.channel);
  const { copied, copy } = useCopy();
  const [mode, setMode] = useState<"preview" | "edit" | "rewrite" | "post" | "stats">("preview");
  const [body, setBody] = useState(piece.body);
  const [direction, setDirection] = useState("");
  useEffect(() => {
    setBody(piece.body);
    setMode("preview");
  }, [piece.id, piece.body]);
  const refresh = () => {
    utils.admin.studio.get.invalidate({ id: idea.id });
    utils.admin.studio.list.invalidate();
  };
  const upd = trpc.admin.studio.updatePiece.useMutation({ onSuccess: refresh });
  const gen = trpc.admin.studio.generatePiece.useMutation({ onSettled: refresh });
  const link = ch ? trackedLink(ORIGIN, ch, idea.cta, idea.slug) : "";
  const busy = piece.status === "generating" || piece.status === "pending" || gen.isPending;

  const metaEntries = Object.entries(piece.meta ?? {}).filter(([, v]) => typeof v === "string" && v);

  return (
    <div className="space-y-4">
      <Panel>
        <div className="px-5 py-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-lg tracking-[-0.01em]">{ch?.label ?? piece.channel}</h3>
              <PieceStatus status={piece.status} />
            </div>
            <p className="text-xs text-black/50 mt-1">{ch?.paste}</p>
            {piece.error && <p className="text-xs text-black mt-2">{piece.error}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btnPrimary} disabled={!piece.body} onClick={() => copy("body", piece.body)}>
              {copied === "body" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied === "body" ? "Copied" : "Copy"}
            </button>
            <button type="button" className={btnSecondary} onClick={() => copy("link", link)} title={link}>
              {copied === "link" ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />} {copied === "link" ? "Copied" : "Copy tracked link"}
            </button>
            <button type="button" className={btnSecondary} disabled={busy} onClick={() => gen.mutate({ pieceId: piece.id })}>
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} /> {piece.status === "failed" ? "Retry" : "Rewrite"}
            </button>
          </div>
        </div>
        <div className="px-5 pb-3 text-[11px] text-black/50 flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Tracked link: <span className="font-mono text-black/70">{link.replace(/^https?:\/\//, "")}</span>
          </span>
          <span>Use it wherever this piece carries a link. The site records the visit, the assessment and the application against this channel.</span>
        </div>
        <div className="border-t border-black/10 flex overflow-x-auto">
          {(
            [
              ["preview", "Preview"],
              ["edit", "Edit"],
              ["rewrite", "Rewrite with a note"],
              ["post", piece.status === "posted" ? "Posted" : "Mark posted"],
              ["stats", "Numbers"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-2.5 text-[11px] tracking-[0.1em] uppercase font-medium whitespace-nowrap transition-colors ${mode === m ? "bg-black text-white" : "text-black/50 hover:text-black"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </Panel>

      {piece.checks.length > 0 && mode !== "edit" && (
        <div className="border border-[#FF5A36]/40 bg-white px-5 py-3">
          <Label className="block mb-1.5 text-black/60">The style guide objects to {plural(piece.checks.length, "thing")}</Label>
          <ul className="text-xs space-y-0.5">
            {piece.checks.slice(0, 8).map((c, i) => (
              <li key={i}>
                <span className="text-black/40">line {c.line}:</span> {c.message}
              </li>
            ))}
            {piece.checks.length > 8 && <li className="text-black/40">and {piece.checks.length - 8} more</li>}
          </ul>
        </div>
      )}

      {mode === "preview" &&
        (busy && !piece.body ? (
          <Panel>
            <div className="p-10 text-center text-xs text-black/40">
              <div className="w-5 h-5 border-2 border-black/20 border-t-black animate-spin mx-auto mb-3" />
              Writing the {ch?.label.toLowerCase()}. About 15 seconds.
            </div>
          </Panel>
        ) : !piece.body ? (
          <Panel>
            <Empty>Nothing written yet. Press Retry.</Empty>
          </Panel>
        ) : (
          <>
            {metaEntries.length > 0 && (
              <Panel title="Before you post">
                <dl className="divide-y divide-black/5">
                  {metaEntries.map(([k, v]) => (
                    <div key={k} className="px-5 py-2.5 grid sm:grid-cols-[140px_minmax(0,1fr)] gap-1 sm:gap-4">
                      <dt className="text-[10px] tracking-[0.15em] uppercase text-black/40 font-medium pt-0.5">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</dt>
                      <dd className="text-sm flex items-start justify-between gap-3">
                        <span className="whitespace-pre-wrap min-w-0">{String(v)}</span>
                        <button type="button" className="text-black/30 hover:text-black shrink-0" onClick={() => copy(k, String(v))} aria-label={`Copy ${k}`}>
                          {copied === k ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </dd>
                    </div>
                  ))}
                </dl>
              </Panel>
            )}
            <Preview piece={piece} channel={ch} />
          </>
        ))}

      {mode === "edit" && (
        <Panel
          title="Edit"
          right={
            <div className="flex items-center gap-3">
              <button type="button" className={btnGhost} onClick={() => setBody(piece.body)}>
                Reset
              </button>
              <button type="button" className={btnPrimary} disabled={upd.isPending || body === piece.body} onClick={() => upd.mutate({ id: piece.id, body })}>
                <Check className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          }
        >
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={24} className="w-full p-5 text-sm font-mono leading-relaxed focus:outline-none" />
          <div className="px-5 py-2 border-t border-black/10 text-[11px] text-black/40">{body.length.toLocaleString("en-AU")} characters. The style check runs when you save.</div>
        </Panel>
      )}

      {mode === "rewrite" && (
        <Panel title="Rewrite with a note">
          <div className="p-5">
            <p className="text-sm text-black/60 mb-3">Tell the writer what to change. The note wins over the channel spec. Examples: shorter, open with the proof instead, more about sleep, one dry line of humour, the louder LinkedIn voice.</p>
            <textarea value={direction} onChange={e => setDirection(e.target.value)} rows={3} className={`${inputCls} w-full`} placeholder="What should be different this time" />
            <button
              type="button"
              className={`${btnPrimary} mt-3`}
              disabled={busy || direction.trim().length < 3}
              onClick={() => {
                gen.mutate({ pieceId: piece.id, direction: direction.trim() });
                setMode("preview");
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Rewrite
            </button>
          </div>
        </Panel>
      )}

      {mode === "post" && <PostForm piece={piece} onSaved={() => setMode("stats")} />}
      {mode === "stats" && <StatsForm idea={idea} piece={piece} />}
    </div>
  );
}

function PostForm({ piece, onSaved }: { piece: Piece; onSaved: () => void }) {
  const utils = trpc.useUtils();
  const [url, setUrl] = useState(piece.url ?? "");
  const [when, setWhen] = useState(piece.postedAt ? new Date(piece.postedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
  const upd = trpc.admin.studio.updatePiece.useMutation({
    onSuccess: () => {
      utils.admin.studio.get.invalidate({ id: piece.ideaId });
      utils.admin.studio.list.invalidate();
      onSaved();
    },
  });
  return (
    <Panel title={piece.status === "posted" ? "Posted" : "Mark posted"}>
      <form
        className="p-5 grid sm:grid-cols-2 gap-4"
        onSubmit={e => {
          e.preventDefault();
          upd.mutate({ id: piece.id, status: "posted", url: url.trim() || null, postedAt: when ? new Date(when) : new Date() });
        }}
      >
        <div className="sm:col-span-2">
          <Label className="block mb-1.5">Link to the live post</Label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" className={`${inputCls} w-full`} />
        </div>
        <div>
          <Label className="block mb-1.5">When</Label>
          <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className={`${inputCls} w-full`} />
        </div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" className={btnPrimary} disabled={upd.isPending}>
            <Check className="w-3.5 h-3.5" /> {piece.status === "posted" ? "Update" : "Mark posted"}
          </button>
          {piece.status !== "posted" && piece.status !== "skipped" && (
            <button type="button" className={btnGhost} onClick={() => upd.mutate({ id: piece.id, status: "skipped" })}>
              Skip this channel
            </button>
          )}
          {piece.status === "posted" && (
            <button type="button" className={btnGhost} onClick={() => upd.mutate({ id: piece.id, status: "ready", postedAt: null })}>
              Not posted after all
            </button>
          )}
          {piece.url && (
            <a href={piece.url} target="_blank" rel="noreferrer" className={btnGhost}>
              <ExternalLink className="w-3.5 h-3.5" /> Open the post
            </a>
          )}
        </div>
      </form>
    </Panel>
  );
}

const STAT_FIELDS = [
  ["impressions", "Impressions or views"],
  ["likes", "Likes"],
  ["comments", "Comments"],
  ["shares", "Shares or reposts"],
  ["saves", "Saves"],
  ["clicks", "Link clicks"],
  ["followers", "New followers"],
  ["subscribers", "New subscribers"],
  ["replies", "Replies or DMs"],
] as const;
type StatKey = (typeof STAT_FIELDS)[number][0];

function StatsForm({ idea, piece }: { idea: IdeaFull; piece: Piece }) {
  const utils = trpc.useUtils();
  const ch = channelById(piece.channel);
  const latest = piece.stats;
  const [vals, setVals] = useState<Record<StatKey, string>>(() => Object.fromEntries(STAT_FIELDS.map(([k]) => [k, latest ? String(latest[k]) : ""])) as Record<StatKey, string>);
  const [notes, setNotes] = useState("");
  useEffect(() => {
    setVals(Object.fromEntries(STAT_FIELDS.map(([k]) => [k, latest ? String(latest[k]) : ""])) as Record<StatKey, string>);
  }, [piece.id, latest]);
  const add = trpc.admin.studio.addStats.useMutation({
    onSuccess: () => {
      utils.admin.studio.get.invalidate({ id: idea.id });
      utils.admin.studio.stats.invalidate();
      setNotes("");
    },
  });
  const site = ch ? idea.site[ch.platform] : undefined;
  return (
    <div className="space-y-4">
      <Panel title="From the platform" right={latest ? <span className="text-[11px] text-black/40">last reading {fmtDateTime(latest.recordedAt)}</span> : undefined}>
        <form
          className="p-5"
          onSubmit={e => {
            e.preventDefault();
            const nums = Object.fromEntries(STAT_FIELDS.map(([k]) => [k, Math.max(0, Math.round(Number(vals[k]) || 0))])) as Record<StatKey, number>;
            add.mutate({ pieceId: piece.id, ...nums, notes: notes.trim() || null });
          }}
        >
          <p className="text-sm text-black/60 mb-4">Open the post on {PLATFORMS[ch?.platform ?? "linkedin"]?.label} and copy the numbers in. Each save is a new reading, so you can come back a week later and the stats page uses the latest.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STAT_FIELDS.map(([k, label]) => (
              <label key={k} className="block">
                <Label className="block mb-1">{label}</Label>
                <input type="number" min={0} inputMode="numeric" value={vals[k]} onChange={e => setVals(v => ({ ...v, [k]: e.target.value }))} className={`${inputCls} w-full`} />
              </label>
            ))}
          </div>
          <label className="block mt-3">
            <Label className="block mb-1">Note</Label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="What you noticed. Who commented, what they asked." className={`${inputCls} w-full`} />
          </label>
          <button type="submit" className={`${btnPrimary} mt-4`} disabled={add.isPending}>
            <Check className="w-3.5 h-3.5" /> Save reading
          </button>
        </form>
      </Panel>
      <Panel title="From the site">
        <div className="p-5">
          <p className="text-sm text-black/60 mb-3">Visits, assessments and applications that came through this idea's tracked links, by platform. Recorded by the site itself.</p>
          {Object.keys(idea.site).length === 0 ? (
            <p className="text-xs text-black/40">Nothing yet. Post with the tracked link and the numbers appear here.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className={th}>Platform</th>
                  <th className={`${th} text-right`}>Visits</th>
                  <th className={`${th} text-right`}>Assessments</th>
                  <th className={`${th} text-right`}>Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {Object.entries(idea.site).map(([source, r]) => (
                  <tr key={source} className={source === ch?.platform ? "font-medium" : ""}>
                    <td className={td}>{PLATFORMS[source as keyof typeof PLATFORMS]?.label ?? source}</td>
                    <td className={`${td} text-right tabular-nums`}>{fmtInt(r.visits)}</td>
                    <td className={`${td} text-right tabular-nums`}>{fmtInt(r.assessments)}</td>
                    <td className={`${td} text-right tabular-nums`}>{fmtInt(r.applications)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {site && <p className="text-[11px] text-black/40 mt-3">This platform so far: {plural(site.visits, "visit")}, {plural(site.assessments, "assessment")}, {plural(site.applications, "application")}.</p>}
        </div>
      </Panel>
    </div>
  );
}

// ─── Preview: the piece as it will look ────────────────────────────────────

type MdTable = { head: string[]; rows: string[][] };

/** Finds markdown tables in the body so a carousel or a script can be drawn properly. */
function parseTables(text: string): MdTable[] {
  const tables: MdTable[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/^\s*\|.*\|\s*$/.test(lines[i]) || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) continue;
    const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
    const head = cells(lines[i]);
    const rows: string[][] = [];
    let j = i + 2;
    while (j < lines.length && /^\s*\|.*\|\s*$/.test(lines[j])) {
      rows.push(cells(lines[j]));
      j++;
    }
    tables.push({ head, rows });
    i = j;
  }
  return tables;
}

const PAPER = "#FAF9F5", INK = "#141413", BODY = "#3D3D3A", MUTE = "#5E5D59", OAT = "#F0EEE6", SIGNAL = "#FF5A36";

function Preview({ piece, channel }: { piece: Piece; channel: Channel | undefined }) {
  const tables = useMemo(() => parseTables(piece.body), [piece.body]);
  const slideTable = tables.find(t => t.head.some(h => /slide/i.test(h)) && t.head.some(h => /headline/i.test(h)));
  const scriptTable = tables.find(t => t.head.some(h => /time/i.test(h)) && t.head.some(h => /spoken|line/i.test(h)));
  const afterTable = (t: MdTable) => {
    // Everything in the body that is not the table itself, for the caption.
    const lines = piece.body.split("\n").filter(l => !/^\s*\|.*\|\s*$/.test(l) && !/^\s*(\*\*)?caption:?(\*\*)?\s*$/i.test(l));
    return lines.join("\n").trim();
  };

  if (channel?.id === "instagram-carousel" && slideTable) {
    const hi = slideTable.head.findIndex(h => /headline/i.test(h));
    const bi = slideTable.head.findIndex(h => /body/i.test(h));
    const di = slideTable.head.findIndex(h => /design/i.test(h));
    return (
      <>
        <Panel title={`Slides, ${slideTable.rows.length}`}>
          <div className="p-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {slideTable.rows.map((r, i) => (
              <figure key={i}>
                <div className="aspect-[4/5] p-5 flex flex-col justify-between" style={{ background: i === slideTable.rows.length - 1 ? OAT : PAPER, color: INK }}>
                  <div>
                    <div className="h-[3px] w-6 mb-4" style={{ background: SIGNAL }} />
                    <div className="font-heading font-bold text-[17px] leading-[1.15] tracking-[-0.02em]">{r[hi]}</div>
                    {r[bi] && (
                      <div className="text-[12px] leading-snug mt-3" style={{ color: BODY }}>
                        {r[bi]}
                      </div>
                    )}
                  </div>
                  <div className="flex items-end justify-between text-[9px] tracking-[0.15em] uppercase" style={{ color: MUTE }}>
                    <span className="font-heading font-bold">Marin Lazic</span>
                    <span>
                      {i + 1} / {slideTable.rows.length}
                    </span>
                  </div>
                </div>
                {di >= 0 && r[di] && <figcaption className="text-[11px] text-black/40 mt-1.5 leading-snug">{r[di]}</figcaption>}
              </figure>
            ))}
          </div>
        </Panel>
        <Panel title="Caption">
          <div className="p-5">
            <Md text={afterTable(slideTable)} />
          </div>
        </Panel>
      </>
    );
  }

  if (channel?.group === "video" && scriptTable) {
    const ti = scriptTable.head.findIndex(h => /time/i.test(h));
    const li = scriptTable.head.findIndex(h => /spoken|line/i.test(h));
    const oi = scriptTable.head.findIndex(h => /screen|text/i.test(h) && !/spoken/i.test(h));
    const before = piece.body.split("\n").findIndex(l => /^\s*\|.*\|\s*$/.test(l));
    const intro = before > 0 ? piece.body.split("\n").slice(0, before).join("\n").trim() : "";
    const rest = afterTable(scriptTable).replace(intro, "").trim();
    return (
      <>
        {intro && (
          <Panel>
            <div className="p-5">
              <Md text={intro} />
            </div>
          </Panel>
        )}
        <Panel title="Script">
          <ol className="divide-y divide-black/5">
            {scriptTable.rows.map((r, i) => (
              <li key={i} className="grid grid-cols-[56px_minmax(0,1fr)] sm:grid-cols-[56px_minmax(0,1.4fr)_minmax(0,1fr)] gap-4 px-5 py-3">
                <span className="text-xs tabular-nums text-black/40 pt-0.5">{r[ti]}</span>
                <span className="text-[15px] leading-snug">{r[li]}</span>
                {oi >= 0 && (
                  <span className="hidden sm:block">
                    {r[oi] && (
                      <span className="inline-block font-heading font-bold text-xs px-2 py-1" style={{ background: PAPER, color: INK, borderLeft: `3px solid ${SIGNAL}` }}>
                        {r[oi]}
                      </span>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Panel>
        {rest && (
          <Panel title={channel.id === "instagram-reel" ? "Caption" : "Notes"}>
            <div className="p-5">
              <Md text={rest} />
            </div>
          </Panel>
        )}
      </>
    );
  }

  const postLike = channel && ["linkedin-post", "x-post", "substack-note"].includes(channel.id);
  if (postLike) {
    const chunks = splitVariants(piece.body);
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {chunks.map((c, i) => (
          <div key={i} className="border border-black/10 bg-white p-5">
            {c.label && <Label className="block mb-3">{c.label}</Label>}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 flex items-center justify-center font-heading font-bold text-xs" style={{ background: INK, color: PAPER }}>
                ML
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">Marin Lazic</div>
                <div className="text-[11px] text-black/40 leading-tight">Performance coach. Australian Men's Water Polo Team.</div>
              </div>
            </div>
            <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{c.text}</div>
            <div className="text-[11px] text-black/40 mt-3">{c.text.length.toLocaleString("en-AU")} characters</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Panel title={piece.title || "The piece"}>
      <div className="p-5 lg:p-8 max-w-[720px]">
        <Md text={piece.body} article />
      </div>
    </Panel>
  );
}

/** Notes and X posts come as several variants with bold labels. Split them so each gets its own card. */
function splitVariants(body: string): { label: string | null; text: string }[] {
  const parts: { label: string | null; text: string }[] = [];
  let current: { label: string | null; text: string } | null = null;
  for (const raw of body.split("\n")) {
    const line = raw.replace(/\r$/, "");
    const label = line.match(/^\*\*(.+?)\*\*\s*$/) || line.match(/^#{1,3}\s+(.+)$/) || line.match(/^(Note \d+|Post \d+|Thread)(\s*\(.*\))?\s*$/i);
    if (label) {
      if (current && current.text.trim()) parts.push(current);
      current = { label: label[0].replace(/[*#]/g, "").trim(), text: "" };
      continue;
    }
    if (/^\(\d+\)$/.test(line.trim())) continue; // character counts, we show our own
    if (!current) current = { label: null, text: "" };
    current.text += (current.text ? "\n" : "") + line;
  }
  if (current && current.text.trim()) parts.push(current);
  return parts.map(p => ({ ...p, text: p.text.replace(/\n{3,}/g, "\n\n").trim() })).filter(p => p.text);
}

/** A small markdown renderer: headings, paragraphs, bold, lists, tables, rules. Enough for the pieces. */
function Md({ text, article = false }: { text: string; article?: boolean }) {
  const blocks = useMemo(() => text.replace(/\r/g, "").split(/\n{2,}/), [text]);
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>));
  return (
    <div className={`${article ? "text-[16px] leading-[1.7]" : "text-[15px] leading-relaxed"} space-y-4`} style={{ color: article ? BODY : undefined }}>
      {blocks.map((b, i) => {
        const t = b.trim();
        if (!t) return null;
        if (/^---+$/.test(t)) return <hr key={i} className="border-black/10" />;
        const h = t.match(/^(#{1,6})\s+(.*)$/);
        if (h && !t.includes("\n")) {
          const level = h[1].length;
          const cls = level <= 1 ? "font-heading font-bold text-2xl tracking-[-0.02em] leading-tight" : level === 2 ? "font-heading font-bold text-lg tracking-[-0.01em] leading-tight mt-2" : "font-heading font-semibold text-base";
          return (
            <div key={i} className={cls} style={{ color: INK }}>
              {inline(h[2])}
            </div>
          );
        }
        const lines = t.split("\n");
        if (lines.every(l => /^\s*\|.*\|\s*$/.test(l))) {
          const [tbl] = parseTables(t);
          if (tbl)
            return (
              <div key={i} className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {tbl.head.map((c, j) => (
                        <th key={j} className={th}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {tbl.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k} className={td}>
                            {inline(c)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
        if (lines.every(l => /^\s*[-*]\s+/.test(l)))
          return (
            <ul key={i} className="list-disc pl-5 space-y-1">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        if (lines.every(l => /^\s*\d+\.\s+/.test(l)))
          return (
            <ol key={i} className="list-decimal pl-5 space-y-1">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*\d+\.\s+/, ""))}</li>
              ))}
            </ol>
          );
        if (/^\[.*\]$/.test(t)) return <p key={i} className="text-xs text-black/50 italic">{t}</p>;
        return (
          <p key={i} className="whitespace-pre-wrap">
            {inline(t)}
          </p>
        );
      })}
    </div>
  );
}

// ─── What is working ───────────────────────────────────────────────────────

function StudioStats() {
  const [, navigate] = useLocation();
  const [days, setDays] = useState(30);
  const q = trpc.admin.studio.stats.useQuery({ days }, { staleTime: 60_000 });
  const d = q.data;
  const totals = useMemo(() => {
    const t = { posts: 0, impressions: 0, engagement: 0, clicks: 0, followers: 0, subscribers: 0, visits: 0, assessments: 0, applications: 0 };
    for (const p of d?.platforms ?? []) {
      t.posts += p.posts;
      t.impressions += p.impressions;
      t.engagement += p.engagement;
      t.clicks += p.clicks;
      t.followers += p.followers;
      t.subscribers += p.subscribers;
      t.visits += p.visits;
      t.assessments += p.assessments;
      t.applications += p.applications;
    }
    return t;
  }, [d]);
  const rate = (eng: number, imp: number) => (imp ? `${((eng / imp) * 100).toFixed(1)}%` : "");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SubNav active="stats" />
        <PeriodSelect value={days} onChange={setDays} options={[7, 30, 90, 365]} />
      </div>
      {q.isLoading ? (
        <Spinner />
      ) : !d ? (
        <Empty>Could not load the numbers</Empty>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Posts" value={fmtInt(totals.posts)} hint="Marked posted in the period" />
            <KpiCard label="Impressions" value={fmtInt(totals.impressions)} hint={totals.impressions ? `${rate(totals.engagement, totals.impressions)} engagement` : "From your readings"} />
            <KpiCard label="New followers and subscribers" value={fmtInt(totals.followers + totals.subscribers)} hint={`${fmtInt(totals.followers)} followers, ${fmtInt(totals.subscribers)} subscribers`} />
            <KpiCard label="Site visits from posts" value={fmtInt(totals.visits)} hint={`${plural(totals.assessments, "assessment")}, ${plural(totals.applications, "application")}`} />
          </div>

          <Panel title="By platform">
            {!d.platforms.length ? (
              <Empty>No posted pieces in this period. Mark a piece posted and add a reading, and this fills in.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className={th}>Platform</th>
                      <th className={`${th} text-right`}>Posts</th>
                      <th className={`${th} text-right`}>Impressions</th>
                      <th className={`${th} text-right`}>Engagement</th>
                      <th className={`${th} text-right`}>Rate</th>
                      <th className={`${th} text-right`}>Clicks</th>
                      <th className={`${th} text-right`}>Followers</th>
                      <th className={`${th} text-right`}>Subscribers</th>
                      <th className={`${th} text-right`}>Site visits</th>
                      <th className={`${th} text-right`}>Assessments</th>
                      <th className={`${th} text-right`}>Applications</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {d.platforms.map(p => (
                      <tr key={p.platform}>
                        <td className={`${td} font-medium`}>{PLATFORMS[p.platform as keyof typeof PLATFORMS]?.label ?? p.platform}</td>
                        <td className={`${td} text-right tabular-nums`}>{fmtInt(p.posts)}</td>
                        <td className={`${td} text-right tabular-nums`}>{fmtInt(p.impressions)}</td>
                        <td className={`${td} text-right tabular-nums`}>{fmtInt(p.engagement)}</td>
                        <td className={`${td} text-right tabular-nums`}>{rate(p.engagement, p.impressions)}</td>
                        <td className={`${td} text-right tabular-nums`}>{fmtInt(p.clicks)}</td>
                        <td className={`${td} text-right tabular-nums`}>{fmtInt(p.followers)}</td>
                        <td className={`${td} text-right tabular-nums`}>{fmtInt(p.subscribers)}</td>
                        <td className={`${td} text-right tabular-nums`}>{fmtInt(p.visits)}</td>
                        <td className={`${td} text-right tabular-nums`}>{fmtInt(p.assessments)}</td>
                        <td className={`${td} text-right tabular-nums`}>{fmtInt(p.applications)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-5 py-3 border-t border-black/10 text-[11px] text-black/40">
              Impressions, engagement, clicks, followers and subscribers are the latest reading you typed in for each posted piece. Site visits, assessments and applications are recorded by the site from the tracked links, for the whole platform in the period.
            </div>
          </Panel>

          <Panel title="Pieces, best first">
            {!d.pieces.length ? (
              <Empty>Nothing posted in this period.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className={th}>Piece</th>
                      <th className={th}>Channel</th>
                      <th className={th}>Posted</th>
                      <th className={`${th} text-right`}>Impressions</th>
                      <th className={`${th} text-right`}>Engagement</th>
                      <th className={`${th} text-right`}>Clicks</th>
                      <th className={`${th} text-right`}>Followers</th>
                      <th className={th}></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {d.pieces.map(p => (
                      <tr key={p.id} className="hover:bg-black/[0.02]">
                        <td className={td}>
                          <button type="button" className="text-left hover:underline" onClick={() => navigate(`/admin/studio/${p.ideaId}`)}>
                            <span className="font-medium">{shorten(p.title || p.ideaTitle)}</span>
                            {p.title && <span className="block text-[11px] text-black/40">{p.ideaTitle}</span>}
                          </button>
                        </td>
                        <td className={`${td} whitespace-nowrap`}>{channelById(p.channel)?.label ?? p.channel}</td>
                        <td className={`${td} whitespace-nowrap text-black/60`}>{fmtDate(p.postedAt)}</td>
                        <td className={`${td} text-right tabular-nums`}>{p.hasStats ? fmtInt(p.impressions) : <span className="text-black/30">no reading</span>}</td>
                        <td className={`${td} text-right tabular-nums`}>{p.hasStats ? fmtInt(p.engagement) : ""}</td>
                        <td className={`${td} text-right tabular-nums`}>{p.hasStats ? fmtInt(p.clicks) : ""}</td>
                        <td className={`${td} text-right tabular-nums`}>{p.hasStats ? fmtInt(p.followers + p.subscribers) : ""}</td>
                        <td className={td}>
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noreferrer" className="text-black/40 hover:text-black" aria-label="Open the post">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
