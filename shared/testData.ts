/**
 * The automated smoke test (scripts/smoke.mjs) fills in the real forms with a
 * "+smoke" address such as marin+smoke@marinlazic.coach. Rows written for such
 * an address are test data: they never go to Kit, never alert Marin, and are
 * removed at the end of each run and by the daily job.
 */
export const TEST_EMAIL_PATTERN = /\+smoke@/i;

/** SQL fragment for Postgres: matches the same addresses as TEST_EMAIL_PATTERN. */
export const TEST_EMAIL_SQL_LIKE = "%+smoke@%";

export function isTestEmail(email: string | null | undefined): boolean {
  return Boolean(email) && TEST_EMAIL_PATTERN.test(String(email));
}
