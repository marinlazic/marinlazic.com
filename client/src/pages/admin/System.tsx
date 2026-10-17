import { RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Empty, Label, Panel, Spinner, btnSecondary, fmtDateTime } from "./ui";

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

export function System() {
  const utils = trpc.useUtils();
  const q = trpc.admin.system.useQuery(undefined, { staleTime: 60_000 });
  const d = q.data;
  if (q.isLoading) return <Spinner />;
  if (!d) return <Empty>Could not run the checks</Empty>;
  const entries = Object.entries(d.checks);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-black/50">
          Each service is called with its real key. Checked {fmtDateTime(d.ranAt)}. The same checks run every morning and email you only if something stops working.
        </p>
        <button type="button" className={btnSecondary} onClick={() => utils.admin.system.fetch({ force: true }).then(v => utils.admin.system.setData(undefined, v))}>
          <RefreshCw className="w-3 h-3" /> Run again
        </button>
      </div>
      <Panel title="Services" right={<Label className={d.ok ? "text-green-700" : "text-[#E53935]"}>{d.ok ? "All working" : `${d.failed.length} problem${d.failed.length === 1 ? "" : "s"}`}</Label>}>
        <ul className="divide-y divide-black/5">
          {entries.map(([key, c]) => (
            <li key={key} className="px-5 py-3 flex items-center gap-4">
              <span className={`w-2.5 h-2.5 shrink-0 ${c.skipped ? "bg-black/15" : c.ok ? "bg-green-600" : "bg-[#E53935]"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{NAMES[key] ?? key}</div>
                <div className="text-xs text-black/50 truncate">{c.detail}</div>
              </div>
              <Label className={c.skipped ? "" : c.ok ? "text-green-700" : "text-[#E53935]"}>{c.skipped ? "not set up" : c.ok ? "ok" : "failed"}</Label>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Useful links">
        <ul className="p-5 text-sm space-y-2">
          <li>
            <a className="underline hover:text-[#E53935]" href="https://vercel.com/marin-7900s-projects/marinlazic-com" target="_blank" rel="noopener noreferrer">
              Vercel project
            </a>
            <span className="text-black/40 text-xs ml-2">hosting, logs, environment variables</span>
          </li>
          <li>
            <a className="underline hover:text-[#E53935]" href="https://github.com/marinlazic/marinlazic.com" target="_blank" rel="noopener noreferrer">
              GitHub repository
            </a>
            <span className="text-black/40 text-xs ml-2">code, smoke test</span>
          </li>
          <li>
            <a className="underline hover:text-[#E53935]" href="https://resend.com/emails" target="_blank" rel="noopener noreferrer">
              Resend
            </a>
            <span className="text-black/40 text-xs ml-2">every email the site sent</span>
          </li>
          <li>
            <a className="underline hover:text-[#E53935]" href="https://app.kit.com/subscribers" target="_blank" rel="noopener noreferrer">
              Kit subscribers
            </a>
          </li>
        </ul>
      </Panel>
    </div>
  );
}
