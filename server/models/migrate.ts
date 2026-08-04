import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { exec, all, run } from "./db.ts";
import { logger } from "../logger.ts";

const MIGRATIONS_DIR = join(import.meta.dirname, "migrations");

export const migrate = () => {
  exec(`CREATE TABLE IF NOT EXISTS _migrations (
name TEXT NOT NULL PRIMARY KEY,
appliedAt TEXT NOT NULL
)`);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = new Set(
    all<{ name: string }>(
      `SELECT ALL name FROM _migrations ORDER BY 1 LIMIT -1 OFFSET 0`,
    ).map((r) => r.name),
  );

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8").trim();
    const markApplied = () =>
      run(`INSERT OR ABORT INTO _migrations (name, appliedAt) VALUES (?, ?)`, [
        file,
        new Date().toISOString(),
      ]);
    try {
      exec(`BEGIN; ${sql}; COMMIT;`);
      markApplied();
      logger.log(`migration applied: ${file}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (/duplicate column/i.test(message)) {
        markApplied();
        logger.log(`migration skipped (already applied): ${file}`);
      } else {
        logger.error(`migration failed: ${file}`, e);
      }
    }
  }
};
