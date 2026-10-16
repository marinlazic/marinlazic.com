// Vercel function entry. Every request that is not a static file is routed
// here by vercel.json. The Express app is created once per warm instance.
import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../server/_core/app";

const appPromise = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appPromise;
  return app(req as any, res as any);
}
