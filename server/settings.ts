// Key value settings written from the dashboard (the Gmail connection, sync
// state). Kept in the database so every Vercel instance sees the same thing.
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { appSettings } from "../drizzle/schema";

export async function getSetting<T extends Record<string, unknown>>(key: string): Promise<T | null> {
  const d = await getDb();
  if (!d) return null;
  const [row] = await d.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return (row?.value as T) ?? null;
}

export async function setSetting(key: string, value: Record<string, unknown>): Promise<void> {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  await d
    .insert(appSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
}

export async function patchSetting(key: string, patch: Record<string, unknown>): Promise<void> {
  const current = (await getSetting(key)) ?? {};
  await setSetting(key, { ...current, ...patch });
}

export async function deleteSetting(key: string): Promise<void> {
  const d = await getDb();
  if (!d) return;
  await d.delete(appSettings).where(eq(appSettings.key, key));
}
