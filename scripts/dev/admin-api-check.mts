// Calls every admin procedure directly against DATABASE_URL and prints a
// summary. Development aid only: DATABASE_URL=... tsx scripts/dev/admin-api-check.mts
import { adminRouter } from "../../server/adminRouter";

const caller = adminRouter.createCaller({ user: { role: "admin", openId: "owner" } } as any);
const t0 = Date.now();
const o = await caller.overview({ days: 30 });
console.log("overview", Date.now() - t0, "ms", JSON.stringify(o.kpis), "daily", o.daily.length, "funnel", o.funnel.map(f => `${f.step}:${f.count}`).join(" "), "followUps", o.followUps.length, "recent", o.recent.length);
const c = await caller.content({ days: 30 });
console.log("content pages", c.pages.slice(0, 3), "cta", c.ctaClicks.slice(0, 2), "landing", c.landing.length, "sections", c.sections.length);
const tr = await caller.traffic({ days: 30 });
console.log("traffic refs", tr.referrers.slice(0, 4), "sources", tr.utmSources, "devices", tr.devices, "hours", tr.hours.filter(h => h.views).length, "weekdays", tr.weekdays);
const a = await caller.assessments({ days: 365 });
console.log("assessments", a.started, a.completed, a.completionRate, a.averageScore, a.bands, a.categoryAverages, "weakest", a.weakestAreas, "goals", a.goals.slice(0, 3), "dropoff", a.dropOff.slice(0, 3), a.dropOff.slice(-2));
const list = await caller.contacts.list({ limit: 5, offset: 0, sort: "score" });
console.log("contacts", list.total, list.contacts.map(x => `${x.name} ${x.kind} score=${x.score} apps=${x.applications} ass=${x.assessments}`));
const search = await caller.contacts.list({ limit: 5, offset: 0, search: "liam" });
console.log("search liam", search.total);
const detail = await caller.contacts.detail({ id: list.contacts[0].id });
console.log("detail", detail?.lead.email, "answers", detail?.answers.length, "timeline", detail?.timeline.map(t => t.kind).join(","), "score", detail?.scores?.overallPct, detail?.scoreLabel);
const note = await caller.contacts.addNote({ id: list.contacts[0].id, body: "Called, left a message." });
await caller.contacts.update({ id: list.contacts[0].id, status: "contacted", followUpAt: new Date(Date.now() + 3 * 86400000).toISOString() });
const detail2 = await caller.contacts.detail({ id: list.contacts[0].id });
console.log("after update", detail2?.lead.status, detail2?.lead.followUpAt, detail2?.lead.lastContactedAt, "notes", detail2?.notes.length);
await caller.contacts.deleteNote({ noteId: note.id });
const apps = await caller.applications.list();
console.log("applications", apps.length, apps[0]?.name, apps[0]?.status, apps[0]?.assessment);
const sys = await caller.system({ force: true });
console.log("system", sys.ok, sys.failed, sys.skipped);
process.exit(0);
