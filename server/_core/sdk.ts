import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// One owner account. The admin signs in with a password set in ADMIN_PASSWORD.
// Sessions are signed JWTs in an httpOnly cookie, verified with JWT_SECRET.

export const ADMIN_OPEN_ID = "owner";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  name: string;
};

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    return new Map(Object.entries(parseCookieHeader(cookieHeader)));
  }

  private getSessionSecret() {
    if (!ENV.cookieSecret || ENV.cookieSecret.length < 16) {
      throw new Error("JWT_SECRET must be set to a long random string");
    }
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  /** Check the admin password. Returns the admin user on success. */
  async loginWithPassword(password: string): Promise<User> {
    if (!ENV.adminPassword) {
      throw ForbiddenError("ADMIN_PASSWORD is not configured");
    }
    if (!isNonEmptyString(password) || !safeEqual(password, ENV.adminPassword)) {
      throw ForbiddenError("Incorrect password");
    }
    await db.upsertUser({
      openId: ADMIN_OPEN_ID,
      name: "Marin Lazic",
      email: ENV.adminEmail || null,
      loginMethod: "password",
      role: "admin",
      lastSignedIn: new Date(),
    });
    const user = await db.getUserByOpenId(ADMIN_OPEN_ID);
    if (!user) throw ForbiddenError("Admin user could not be created");
    return user;
  }

  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession({ openId, name: options.name || "" }, options);
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    return new SignJWT({ openId: payload.openId, name: payload.name })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime(expirationSeconds)
      .sign(this.getSessionSecret());
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.getSessionSecret(), {
        algorithms: ["HS256"],
      });
      const { openId, name } = payload as Record<string, unknown>;
      if (!isNonEmptyString(openId)) return null;
      return { openId, name: typeof name === "string" ? name : "" };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const session = await this.verifySession(cookies.get(COOKIE_NAME));
    if (!session) throw ForbiddenError("Invalid session cookie");

    const user = await db.getUserByOpenId(session.openId);
    if (!user) throw ForbiddenError("User not found");
    return user;
  }
}

export const sdk = new SDKServer();
