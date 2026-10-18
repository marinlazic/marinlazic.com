import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Download, ExternalLink, Mail, Search, Trash2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  Empty,
  KindBadge,
  Label,
  Panel,
  ScorePill,
  Spinner,
  StatusBadge,
  btnGhost,
  btnPrimary,
  btnSecondary,
  downloadCSV,
  fmtAgo,
  fmtDate,
  fmtDateTime,
  inputCls,
  selectCls,
  stamp,
  td,
  th,
} from "./ui";

const STATUSES = ["new", "contacted", "applied", "converted", "archived"] as const;
type Status = (typeof STATUSES)[number];
const PAGE = 50;

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function Contacts({ selectedId, openContact, closeContact }: { selectedId: number | null; openContact: (id: number) => void; closeContact: () => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [kind, setKind] = useState<"" | "assessment" | "application" | "purchase" | "enquiry">("");
  const [sort, setSort] = useState<"newest" | "oldest" | "name" | "score" | "followUp" | "lastActivity">("newest");
  const [page, setPage] = useState(0);
  const debounced = useDebounced(search);
  useEffect(() => setPage(0), [debounced, status, kind, sort]);

  const utils = trpc.useUtils();
  const q = trpc.admin.contacts.list.useQuery(
    { search: debounced || undefined, status: status || undefined, kind: kind || undefined, sort, limit: PAGE, offset: page * PAGE },
    { placeholderData: prev => prev }
  );
  const update = trpc.admin.contacts.update.useMutation({
    onSuccess: () => {
      utils.admin.contacts.list.invalidate();
      utils.admin.contacts.detail.invalidate();
      utils.admin.overview.invalidate();
    },
  });

  const rows = q.data?.contacts ?? [];
  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  const exportAll = async () => {
    const all = await utils.admin.contacts.list.fetch({ search: debounced || undefined, status: status || undefined, kind: kind || undefined, sort, limit: 200, offset: 0 });
    downloadCSV(
      "contacts",
      ["ID", "Name", "Email", "Kind", "Source", "Status", "Score", "Applications", "Follow up", "Last contacted", "Product", "Amount", "Paid at", "Report", "Message", "Created", "Updated"],
      all.contacts.map(c => [
        c.id,
        c.name || "",
        c.email,
        c.kind,
        c.source || "",
        c.status,
        c.score ?? "",
        c.applications,
        stamp(c.followUpAt),
        stamp(c.lastContactedAt),
        c.product || "",
        c.amountCents != null ? (c.amountCents / 100).toFixed(2) + " " + (c.currency || "").toUpperCase() : "",
        stamp(c.paidAt),
        c.reportToken ? `${window.location.origin}/report/${c.reportToken}` : "",
        c.message || "",
        stamp(c.createdAt),
        stamp(c.updatedAt),
      ])
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-black/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email or message" className={`${inputCls} pl-9 w-72`} aria-label="Search contacts" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value as Status | "")} className={selectCls} aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select value={kind} onChange={e => setKind(e.target.value as typeof kind)} className={selectCls} aria-label="Type">
          <option value="">All types</option>
          <option value="assessment">Assessment</option>
          <option value="enquiry">Enquiry</option>
          <option value="application">Application</option>
          <option value="purchase">Purchase</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className={selectCls} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="lastActivity">Last activity</option>
          <option value="score">Highest score</option>
          <option value="followUp">Follow up date</option>
          <option value="name">Name</option>
        </select>
        <div className="flex-1" />
        <button type="button" onClick={exportAll} className={btnSecondary}>
          <Download className="w-3 h-3" /> CSV
        </button>
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/10 bg-white">
                <th className={th}>Contact</th>
                <th className={th}>Type</th>
                <th className={th}>Status</th>
                <th className={th}>Score</th>
                <th className={th}>Last activity</th>
                <th className={th}>Follow up</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {q.isLoading ? (
                <tr>
                  <td colSpan={7}>
                    <Spinner />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <Empty>No contacts match</Empty>
                  </td>
                </tr>
              ) : (
                rows.map(c => {
                  const overdue = c.followUpAt && new Date(c.followUpAt) < new Date() && c.status !== "archived";
                  return (
                    <tr key={c.id} className={`border-b border-black/5 hover:bg-white transition-colors cursor-pointer ${selectedId === c.id ? "bg-white" : ""}`} onClick={() => openContact(c.id)}>
                      <td className={td}>
                        <div className="font-medium">{c.name || <span className="text-black/30">No name</span>}</div>
                        <div className="text-xs text-black/50">{c.email}</div>
                      </td>
                      <td className={td}>
                        <KindBadge kind={c.kind} />
                        {c.applications > 0 && c.kind !== "application" && <span className="block text-[10px] text-amber-700 mt-1">applied</span>}
                      </td>
                      <td className={td} onClick={e => e.stopPropagation()}>
                        <select value={c.status} onChange={e => update.mutate({ id: c.id, status: e.target.value as Status })} className="border border-black/10 bg-transparent text-xs px-2 py-1 focus:outline-none focus:border-black/30" aria-label="Change status">
                          {STATUSES.map(s => (
                            <option key={s} value={s}>
                              {s[0].toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={td}>
                        <ScorePill score={c.score} />
                      </td>
                      <td className={`${td} text-xs text-black/60 whitespace-nowrap`}>{fmtAgo(c.lastActivityAt)}</td>
                      <td className={`${td} text-xs whitespace-nowrap ${overdue ? "text-black font-medium" : "text-black/60"}`}>{c.followUpAt ? fmtDate(c.followUpAt) : ""}</td>
                      <td className={`${td} text-right`}>
                        <ChevronRight className="w-4 h-4 text-black/30 inline" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-black/10">
          <span className="text-xs text-black/40">
            {total} contact{total === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)} className={btnGhost} aria-label="Previous page">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-black/50">
              {page + 1} / {pages}
            </span>
            <button type="button" disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)} className={btnGhost} aria-label="Next page">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Panel>

      {selectedId !== null && <ContactDrawer id={selectedId} onClose={closeContact} />}
    </div>
  );
}

// ─── Detail drawer ─────────────────────────────────────────────────────────

export function ContactDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const q = trpc.admin.contacts.detail.useQuery({ id });
  const invalidate = () => {
    utils.admin.contacts.detail.invalidate({ id });
    utils.admin.contacts.list.invalidate();
    utils.admin.overview.invalidate();
    utils.admin.applications.list.invalidate();
  };
  const update = trpc.admin.contacts.update.useMutation({ onSuccess: invalidate });
  const addNote = trpc.admin.contacts.addNote.useMutation({ onSuccess: invalidate });
  const deleteNote = trpc.admin.contacts.deleteNote.useMutation({ onSuccess: invalidate });
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const d = q.data;
  const lead = d?.lead;
  const followUpValue = useMemo(() => (lead?.followUpAt ? new Date(lead.followUpAt).toISOString().slice(0, 10) : ""), [lead?.followUpAt]);
  const answersBySection = useMemo(() => {
    const groups: Record<string, { question: string; answer: string }[]> = {};
    for (const a of d?.answers ?? []) (groups[a.section] ??= []).push(a);
    return groups;
  }, [d?.answers]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Contact details">
      <button type="button" className="absolute inset-0 bg-black/30" onClick={onClose} aria-label="Close" />
      <aside className="relative w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto">
        {q.isLoading || !lead ? (
          <Spinner />
        ) : (
          <>
            <div className="sticky top-0 bg-white border-b border-black/10 px-6 py-4 flex items-start justify-between gap-4 z-10">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-heading font-bold text-lg leading-tight truncate">{lead.name || "No name"}</h2>
                  <KindBadge kind={lead.kind} />
                  <StatusBadge status={lead.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-black/60">
                  <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 hover:text-black">
                    <Mail className="w-3 h-3" /> {lead.email}
                  </a>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-black"
                    onClick={() => {
                      navigator.clipboard?.writeText(lead.email);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    <Copy className="w-3 h-3" /> {copied ? "copied" : "copy"}
                  </button>
                </div>
              </div>
              <button type="button" onClick={onClose} className="text-black/40 hover:text-black" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <Label className="block mb-1">Status</Label>
                  <select value={lead.status} onChange={e => update.mutate({ id, status: e.target.value as Status })} className={`${selectCls} w-full`}>
                    {STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s[0].toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <Label className="block mb-1">Follow up</Label>
                  <input type="date" value={followUpValue} onChange={e => update.mutate({ id, followUpAt: e.target.value ? new Date(e.target.value + "T09:00:00").toISOString() : null })} className={`${selectCls} w-full`} />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnPrimary} onClick={() => update.mutate({ id, status: "contacted", lastContactedAt: new Date().toISOString() })}>
                  Mark contacted today
                </button>
                {d.reports[0] && (
                  <a href={`/report/${d.reports[0].token}`} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
                    <ExternalLink className="w-3 h-3" /> Report
                  </a>
                )}
                {d.reports[0]?.pdfKey && (
                  <a href={`/api/report/${d.reports[0].token}/pdf`} className={btnSecondary}>
                    <Download className="w-3 h-3" /> PDF
                  </a>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <dt className="text-black/40">Added</dt>
                <dd>{fmtDateTime(lead.createdAt)}</dd>
                <dt className="text-black/40">Source</dt>
                <dd className="truncate">{lead.source || "direct"}</dd>
                <dt className="text-black/40">Last contacted</dt>
                <dd>{lead.lastContactedAt ? fmtDateTime(lead.lastContactedAt) : "never"}</dd>
                {lead.paidAt && (
                  <>
                    <dt className="text-black/40">Purchase</dt>
                    <dd>
                      {lead.product} {lead.amountCents != null ? `${(lead.amountCents / 100).toFixed(0)} ${(lead.currency || "").toUpperCase()}` : ""} on {fmtDate(lead.paidAt)}
                    </dd>
                  </>
                )}
              </dl>

              {/* Score */}
              {d.scores && (
                <Panel title="Assessment score" right={<Label>{d.scoreLabel}</Label>}>
                  <div className="p-4">
                    <div className="flex items-end gap-3 mb-4">
                      <span className="font-heading font-bold text-4xl leading-none">{d.scores.overallPct}</span>
                      <span className="text-xs text-black/40 mb-1">out of 100</span>
                    </div>
                    <ul className="space-y-2">
                      {d.scores.categories.map(c => (
                        <li key={c.id}>
                          <div className="flex justify-between text-xs">
                            <span>{c.name}</span>
                            <span className="font-medium">{c.percentage}</span>
                          </div>
                          <div className="h-1 bg-black/5 mt-1">
                            <div className={`h-1 ${c.id === d.scores?.weakest?.id ? "bg-[#2F6BF0]" : "bg-black"}`} style={{ width: `${c.percentage}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                    {d.answers.length > 0 && (
                      <button type="button" className={`${btnGhost} mt-4`} onClick={() => setShowAnswers(v => !v)}>
                        {showAnswers ? "Hide answers" : `Show all ${d.answers.length} answers`}
                      </button>
                    )}
                    {showAnswers && (
                      <div className="mt-3 space-y-4">
                        {Object.entries(answersBySection).map(([section, items]) => (
                          <div key={section}>
                            <Label className="block mb-1.5">{section}</Label>
                            <dl className="space-y-1.5">
                              {items.map((a, i) => (
                                <div key={i} className="text-xs">
                                  <dt className="text-black/50">{a.question}</dt>
                                  <dd className="font-medium whitespace-pre-wrap">{a.answer}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Panel>
              )}

              {/* Applications */}
              {d.applications.map(a => (
                <Panel key={a.id} title="Coaching application" right={<Label>{fmtDate(a.createdAt)}</Label>}>
                  <dl className="p-4 space-y-3 text-xs">
                    <div>
                      <dt className="text-black/50">90 day goal</dt>
                      <dd className="whitespace-pre-wrap">{a.q1_90day_goal}</dd>
                    </div>
                    <div>
                      <dt className="text-black/50">Biggest obstacle</dt>
                      <dd className="whitespace-pre-wrap">{a.q2_obstacle}</dd>
                    </div>
                    <div>
                      <dt className="text-black/50">Ready to invest</dt>
                      <dd>{a.q3_investment}</dd>
                    </div>
                    {a.q4_anything_else && (
                      <div>
                        <dt className="text-black/50">Anything else</dt>
                        <dd className="whitespace-pre-wrap">{a.q4_anything_else}</dd>
                      </div>
                    )}
                    {(a.utmSource || a.utmCampaign) && (
                      <div>
                        <dt className="text-black/50">Campaign</dt>
                        <dd>{[a.utmSource, a.utmMedium, a.utmCampaign].filter(Boolean).join(" / ")}</dd>
                      </div>
                    )}
                  </dl>
                </Panel>
              ))}

              {/* Enquiry message */}
              {lead.message && lead.kind === "enquiry" && (
                <Panel title="Enquiry">
                  <p className="p-4 text-sm whitespace-pre-wrap">{lead.message}</p>
                </Panel>
              )}

              {/* Notes */}
              <Panel title="Notes">
                <div className="p-4">
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      if (!note.trim()) return;
                      addNote.mutate({ id, body: note }, { onSuccess: () => setNote("") });
                    }}
                  >
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Add a note (call outcome, next step, context)" className={`${inputCls} w-full resize-y`} />
                    <div className="flex justify-end mt-2">
                      <button type="submit" className={btnPrimary} disabled={!note.trim() || addNote.isPending}>
                        Add note
                      </button>
                    </div>
                  </form>
                  {d.notes.length > 0 && (
                    <ul className="mt-4 space-y-3">
                      {d.notes.map(nt => (
                        <li key={nt.id} className="border-l-2 border-black/10 pl-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm whitespace-pre-wrap">{nt.body}</p>
                            <button type="button" className="text-black/30 hover:text-black" onClick={() => deleteNote.mutate({ noteId: nt.id })} aria-label="Delete note">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-[11px] text-black/40 mt-0.5">{fmtDateTime(nt.createdAt)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Panel>

              {/* Timeline */}
              <Panel title="History">
                <ul className="p-4 space-y-3">
                  {d.timeline.map((t, i) => (
                    <li key={i} className="flex gap-3">
                      <span className={`mt-1.5 w-2 h-2 shrink-0 ${t.kind === "purchase" ? "bg-green-600" : t.kind === "note" ? "bg-[#2F6BF0]" : t.kind === "application" ? "bg-amber-500" : "bg-black/30"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm">{t.title}</div>
                        {t.detail && <div className="text-[11px] text-black/50 truncate">{t.detail}</div>}
                      </div>
                      <span className="text-[11px] text-black/40 shrink-0">{fmtDate(t.at)}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
