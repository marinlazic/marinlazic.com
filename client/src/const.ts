export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// The admin signs in on the /admin page itself with a password.
export const getLoginUrl = () => "/admin";

export async function loginWithPassword(password: string): Promise<boolean> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ password }),
  });
  return res.ok;
}
