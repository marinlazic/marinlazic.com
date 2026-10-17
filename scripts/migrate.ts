// Applies pending Drizzle migrations. Runs at the start of every Vercel
// build (the build has DATABASE_URL and network access). Skips quietly when
// no database is configured so local builds still work.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL not set, skipping migrations");
  process.exit(0);
}

const parsed = new URL(url);
const wantsSsl = parsed.searchParams.get("sslmode") !== "disable";
parsed.searchParams.delete("sslmode");
const pool = new Pool({ connectionString: parsed.toString(), ssl: wantsSsl ? { rejectUnauthorized: true } : undefined, max: 1 });
const db = drizzle(pool);
try {
  await migrate(db, { migrationsFolder: path.resolve(import.meta.dirname, "../drizzle/migrations") });
  console.log("[migrate] migrations applied");
} finally {
  await pool.end();
}
