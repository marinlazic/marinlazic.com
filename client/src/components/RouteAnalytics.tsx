import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAnalytics } from "@/hooks/useAnalytics";
import { sanitizePath } from "@/lib/attribution";

function isExcludedPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/") || path === "/payment" || path.startsWith("/payment/");
}

/**
 * Mount once inside the client router. It deliberately renders nothing and
 * sends a single query-free page view for each public route navigation.
 */
export function RouteAnalytics() {
  const [location] = useLocation();
  const { track } = useAnalytics();

  useEffect(() => {
    const path = sanitizePath(location);
    if (isExcludedPath(path)) return;

    track("page_view", undefined, { path });
  }, [location, track]);

  return null;
}

export default RouteAnalytics;
