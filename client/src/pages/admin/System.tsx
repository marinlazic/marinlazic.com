import { ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Empty, Label, Panel, Spinner, btnPrimary, btnSecondary, fmtDateTime } from "./ui";

const NAMES: Record<string, string> = {
  database: "Database (Neon)",
  resend: "Email (Resend)",
  kit: "Newsletter (Kit)",
  gemini: "AI reports (Gemini)",
  blob: "File storage (Vercel Blob)",
  stripe: "Payments (Stripe)",
  adminPassword: "Admin password",
  jwtSecret: "Login secret",
  ownerEmail: "Owner email",
  siteOrigin: "Site address",
  geminiModel: "AI model",
};

function GmailCard() {
  const utils = trpc.useUtils();
  const q = trpc.admin.followup.overview.useQuery(undefined, { staleTime: 60_000 });
  const disconnect = trpc.admin.followup.gmailDisconnect.useMutation({ onSuccess: () => utils.admin.followup.overview.invalidate() });
  const sync = trpc.admin.followup.sync.useMutation({ onSuccess: () => utils.admin.followup.overview.invalidate() });
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const flag = new URLSearchParams(window.location.search).get("gmail");
    if (!flag) return;
    setNotice(flag === "connected" ? "Gmail connected." : flag === "not-configured" ? "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel first." : `Google said: ${flag}`);
    window.history.replaceState({}, "", "/admin/system");
  }, []);
  const g = q.data?.gmail;
  return (
    <Panel title="Gmail (Follow up section)" right={g ? <Label className={g.connected ? "text-green-700" : ""}>{g.connected ? "connected" : g.configured ? "not connected" : "not set up"}</Label> : null}>
      <div className="p-5 text-sm space-y-3">
        {notice && <p className="text-xs border border-black/10 bg-[#F4F4F4] px-3 py-2">{notice}</p>}
        {!g ? (
          <Spinner />
        ) : g.connected ? (
          <>
            <p>
              Connected as <b>{g.email}</b> since {fmtDateTime(g.connectedAt)}. Read only: the site reads the emails between you and each contact so the Follow up section knows who owes whom a reply. Nothing is sent or changed in Gmail.
            </p>
            <p className="text-xs text-black/50">
              {g.lastSyncAt ? `Last read ${fmtDateTime(g.lastSyncAt)}` : "Not read yet"}
              {g.lastCounts ? ` (${g.lastCounts.added} new messages across ${g.lastCounts.contacts} contacts, ${g.lastCounts.seconds}s)` : ""}. Runs every morning with the daily job.
            </p>
            {g.lastError && <p className="text-xs">Last read failed: {g.lastError}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnSecondary} disabled={sync.isPending} onClick={() => sync.mutate({ full: !g.lastSyncAt })}>
                <RefreshCw className={`w-3 h-3 ${sync.isPending ? "animate-spin" : ""}`} /> {sync.isPending ? "Reading" : g.lastSyncAt ? "Read new mail now" : "Read all mail now"}
              </button>
              <button type="button" className={btnSecondary} disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>Disconnect</button>
            </div>
          </>
        ) : g.configured ? (
          <>
            <p>Connect your Google account so the Follow up section can read the emails between you and each lead. Read only; nothing is sent or changed.</p>
            <a className={btnPrimary} href="/api/gmail/connect">Connect Gmail <ExternalLink className="w-3 h-3" /></a>
          </>
        ) : (
          <>
            <p>The Follow up section can read your Gmail (read only) so it knows when you replied and when a lead replied. It needs a Google OAuth client, which takes about ten minutes once:</p>
            <ol className="list-decimal pl-5 space-y-1.5 text-[13px]">
              <li>Open <a className="underline" href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">console.cloud.google.com</a> signed in as {q.data ? "the account whose mail holds the lead conversations" : "your Google account"}. Create a project called marinlazic.</li>
              <li>APIs and Services, Library: enable the <b>Gmail API</b>.</li>
              <li>APIs and Services, OAuth consent screen (Google Auth Platform): user type <b>Internal</b> if your account is Google Workspace, otherwise External, then add your own address under Test users. Scope: gmail.readonly.</li>
              <li>Credentials, Create credentials, OAuth client ID, type <b>Web application</b>. Authorised redirect URI exactly: <code className="bg-[#F4F4F4] px-1">{g.redirectUri}</code></li>
              <li>Copy the Client ID and Client secret into Vercel, Project Settings, Environment Variables, as <code className="bg-[#F4F4F4] px-1">GOOGLE_CLIENT_ID</code> and <code className="bg-[#F4F4F4] px-1">GOOGLE_CLIENT_SECRET</code>, then redeploy. Come back here and press Connect Gmail.</li>
            </ol>
            <p className="text-xs text-black/50">If the consent screen is External and left in Testing, Google expires the connection after seven days; publishing the app (no verification is needed for your own use with one test user) or using Internal avoids that.</p>
          </>
        )}
      </div>
    </Panel>
  );
}

export function System() {
  const utils = trpc.useUtils();
  const q = trpc.admin.system.useQuery(undefined, { staleTime: 60_000 });
  const d = q.data;
  if (q.isLoading) return <Spinner />;
  if (!d) return <Empty>Could not run the checks</Empty>;
  const entries = Object.entries(d.checks);

  return (
    <div className="space-y-4">
      <GmailCard />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-black/50">
          Each service is called with its real key. Checked {fmtDateTime(d.ranAt)}. The same checks run every morning and email you only if something stops working.
        </p>
        <button type="button" className={btnSecondary} onClick={() => utils.admin.system.fetch({ force: true }).then(v => utils.admin.system.setData(undefined, v))}>
          <RefreshCw className="w-3 h-3" /> Run again
        </button>
      </div>
      <Panel title="Services" right={<Label className={d.ok ? "text-green-700" : "text-black"}>{d.ok ? "All working" : `${d.failed.length} problem${d.failed.length === 1 ? "" : "s"}`}</Label>}>
        <ul className="divide-y divide-black/5">
          {entries.map(([key, c]) => (
            <li key={key} className="px-5 py-3 flex items-center gap-4">
              <span className={`w-2.5 h-2.5 shrink-0 ${c.skipped ? "bg-black/15" : c.ok ? "bg-green-600" : "bg-[#2F6BF0]"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{NAMES[key] ?? key}</div>
                <div className="text-xs text-black/50 truncate">{c.detail}</div>
              </div>
              <Label className={c.skipped ? "" : c.ok ? "text-green-700" : "text-black"}>{c.skipped ? "not set up" : c.ok ? "ok" : "failed"}</Label>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Useful links">
        <ul className="p-5 text-sm space-y-2">
          <li>
            <a className="underline hover:text-black/60" href="https://vercel.com/marin-7900s-projects/marinlazic-com" target="_blank" rel="noopener noreferrer">
              Vercel project
            </a>
            <span className="text-black/40 text-xs ml-2">hosting, logs, environment variables</span>
          </li>
          <li>
            <a className="underline hover:text-black/60" href="https://github.com/marinlazic/marinlazic.com" target="_blank" rel="noopener noreferrer">
              GitHub repository
            </a>
            <span className="text-black/40 text-xs ml-2">code, smoke test</span>
          </li>
          <li>
            <a className="underline hover:text-black/60" href="https://resend.com/emails" target="_blank" rel="noopener noreferrer">
              Resend
            </a>
            <span className="text-black/40 text-xs ml-2">every email the site sent</span>
          </li>
          <li>
            <a className="underline hover:text-black/60" href="https://app.kit.com/subscribers" target="_blank" rel="noopener noreferrer">
              Kit subscribers
            </a>
          </li>
        </ul>
      </Panel>
    </div>
  );
}
