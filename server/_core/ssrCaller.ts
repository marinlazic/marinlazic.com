import type { Request, Response } from "express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import type { SsrPrefetch } from "../../client/src/ssr/prefetch";

export async function buildSsrPrefetch(
  req: Request,
  res: Response
): Promise<SsrPrefetch> {
  const ctx = await createContext({ req, res } as Parameters<
    typeof createContext
  >[0]);
  const caller = appRouter.createCaller(ctx);
  return { latestArticles: input => caller.articles.latest(input) };
}
