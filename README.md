# marinlazic.com

Performance coaching site for Marin Lazic. React (Vite) front end with server rendering, Express and tRPC back end, Postgres (Neon) through Drizzle, hosted on Vercel.

- `pnpm install`, copy `.env.example` to `.env`, then `pnpm dev`.
- `pnpm test` runs the test suite, `pnpm check` type checks, `pnpm build` builds everything.
- Migrations live in `drizzle/migrations` and run at the start of every build.
- Every push to `main` deploys to production.

The runbook with every service, variable and the cutover steps is kept in the Claude project for this site.
