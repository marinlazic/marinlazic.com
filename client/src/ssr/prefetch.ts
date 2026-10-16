import { getQueryKey } from "@trpc/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "../lib/trpc";
import { cleanPath, getPageMeta } from "../data/siteMetadata";

type Outputs = inferRouterOutputs<AppRouter>;
export type SsrPrefetch = {
  latestArticles: (input: {
    limit: number;
  }) => Promise<Outputs["articles"]["latest"]>;
};
export async function prefetchForPath(
  url: string,
  qc: QueryClient,
  prefetch: SsrPrefetch
) {
  const head = getPageMeta(url);
  if (cleanPath(url) === "/") {
    const input = { limit: 3 };
    qc.setQueryData(
      getQueryKey(trpc.articles.latest, input, "query"),
      await prefetch.latestArticles(input)
    );
  }
  // Assessment progress, auth, applications and admin records are never embedded in HTML.
  return head;
}
