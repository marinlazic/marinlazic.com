import "dotenv/config";
import express, { type Express } from "express";
import type { Server } from "node:http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./oauth";
import { stripeWebhookRouter } from "../stripeWebhook";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

/**
 * Builds the Express app. Used by the local server (index.ts) and by the
 * Vercel function (api/index.ts). Nothing here listens on a port.
 */
export async function createApp(options: { httpServer?: Server } = {}): Promise<Express> {
  const app = express();
  app.set("trust proxy", true);

  // Stripe webhook must be registered BEFORE body parsers (needs raw body)
  app.use(stripeWebhookRouter);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Admin password login at /api/auth/login
  registerAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses the built files
  if (process.env.NODE_ENV === "development" && options.httpServer) {
    await setupVite(app, options.httpServer);
  } else {
    serveStatic(app);
  }

  return app;
}
