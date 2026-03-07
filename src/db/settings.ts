import { getDb } from "./index";

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.query("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | null;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}

export function getSelectedIndexerIds(): number[] {
  const raw = getSetting("prowlarr_indexer_ids");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as number[];
  } catch {
    return [];
  }
}

export function setSelectedIndexerIds(ids: number[]): void {
  setSetting("prowlarr_indexer_ids", JSON.stringify(ids));
}
