import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

// Admin sign in. POST /api/auth/login with { password }.
// Rate limited per IP so the password cannot be brute forced.

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const key = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
    if (tooManyAttempts(key)) {
      res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
      return;
    }
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    try {
      const user = await sdk.loginWithPassword(password);
      const token = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      res.cookie(COOKIE_NAME, token, {
        ...getSessionCookieOptions(req),
        maxAge: ONE_YEAR_MS,
      });
      res.json({ ok: true });
    } catch (error) {
      res.status(401).json({ error: "Incorrect password" });
    }
  });
}

// Kept for callers that still import the old name.
export const registerOAuthRoutes = registerAuthRoutes;
