import { renderToString } from "react-dom/server";
import {
  QueryClient,
  QueryClientProvider,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { Router } from "wouter";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "./lib/trpc";
import App from "./App";
import { prefetchForPath, type SsrPrefetch } from "./ssr/prefetch";

export async function render(url: string, prefetch: SsrPrefetch) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 },
    },
  });
  const head = await prefetchForPath(url, qc, prefetch);
  const state = dehydrate(qc);
  const qi = url.indexOf("?");
  const ssrPath = qi === -1 ? url : url.slice(0, qi);
  const ssrSearch = qi === -1 ? "" : url.slice(qi + 1);
  const client = trpc.createClient({
    links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
  });
  const html = renderToString(
    <trpc.Provider client={client} queryClient={qc}>
      <QueryClientProvider client={qc}>
        <HydrationBoundary state={state}>
          <Router ssrPath={ssrPath} ssrSearch={ssrSearch}>
            <App />
          </Router>
        </HydrationBoundary>
      </QueryClientProvider>
    </trpc.Provider>
  );
  qc.clear();
  return { html, head, dehydratedState: state };
}
