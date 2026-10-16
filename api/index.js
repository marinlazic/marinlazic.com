// Vercel function entry. Every request that is not a static file is routed
// here by vercel.json. The server is bundled into dist/server/app.js by the
// build so the function has no bare TypeScript imports to resolve.
import { createApp } from "../dist/server/app.js";

const appPromise = createApp();

export default async function handler(req, res) {
  const app = await appPromise;
  return app(req, res);
}
