export const ENV = {
  // Session signing secret for the admin cookie. Any long random string.
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // Admin login for /admin. One owner account.
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminEmail: process.env.ADMIN_EMAIL ?? process.env.OWNER_EMAIL ?? "",

  // Where owner notifications go (new leads, purchases, applications).
  ownerEmail: process.env.OWNER_EMAIL ?? "",

  // Transactional email.
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "",

  // Kit (ConvertKit) v4.
  kitApiKey: process.env.KIT_API_KEY ?? "",

  // Gemini, used for the assessment report. Called through Google's
  // OpenAI compatible endpoint so the request shape stays the same.
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",

  // Public origin of the site, used in emails and links.
  siteOrigin: (process.env.CANONICAL_ORIGIN ?? "https://marinlazic.com").replace(/\/$/, ""),

  // Shared secret the scheduled job must present.
  cronSecret: process.env.CRON_SECRET ?? "",
};
