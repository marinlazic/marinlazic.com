// One off import of the CSV exports from the Manus database panel into
// Postgres. Usage: DATABASE_URL=... tsx scripts/import-manus-csv.ts <folder>
// Expects files named leads.csv, applications.csv, assessment_progress.csv
// (any that exist). The same logic runs behind POST /api/admin/import-manus.
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { importManus } from "../server/manusImport";

const folder = process.argv[2];
if (!folder || !process.env.DATABASE_URL) {
  console.error("Usage: DATABASE_URL=... tsx scripts/import-manus-csv.ts <folder>");
  process.exit(1);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const db = drizzle(pool);
const read = (name: string) => {
  const file = path.join(folder, name);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined;
};

try {
  const result = await importManus(db, {
    leads: read("leads.csv"),
    applications: read("applications.csv"),
    assessmentProgress: read("assessment_progress.csv"),
  });
  console.log("[import]", JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}
