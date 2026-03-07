import { Database } from "bun:sqlite";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

const DATA_DIR = join(import.meta.dir, "..", "..", "data");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = join(DATA_DIR, "gamarr.db");

let db: Database;

export function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH, { create: true });
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");
    migrate(db);
  }
  return db;
}

function migrate(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      header_image TEXT,
      release_date TEXT,
      release_timestamp INTEGER,
      added_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Add release_timestamp column if missing (migration for existing DBs)
  try {
    db.exec(`ALTER TABLE wishlist ADD COLUMN release_timestamp INTEGER`);
  } catch {
    // Column already exists
  }
}
