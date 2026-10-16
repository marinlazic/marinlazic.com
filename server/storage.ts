// File storage on Vercel Blob. Used for saved assessment reports (PDF).
// Needs BLOB_READ_WRITE_TOKEN, which Vercel sets when a Blob store is linked.
// Keys are private: files are fetched through the server, never by public URL.

import { del, get, put } from "@vercel/blob";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export function storageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (!storageConfigured()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set; storage is not configured");
  }
  const key = normalizeKey(relKey);
  const body = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  const blob = await put(key, body, {
    access: "private",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return { key, url: blob.url };
}

export async function storageGetBuffer(relKey: string): Promise<Buffer | null> {
  if (!storageConfigured()) return null;
  const key = normalizeKey(relKey);
  const result = await get(key, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const chunks: Uint8Array[] = [];
  const reader = result.stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks.map(c => Buffer.from(c)));
}

export async function storageDelete(relKey: string): Promise<void> {
  if (!storageConfigured()) return;
  await del(normalizeKey(relKey));
}
