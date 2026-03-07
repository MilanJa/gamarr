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

// ===== Scoring Parameters =====

export interface ScoringParams {
  seederWeight: number;      // pts per seeder (capped at seederCap)
  seederCap: number;         // max seeders counted
  ageFreshDays: number;      // days considered "fresh"
  ageFreshBonus: number;     // max bonus for fresh results
  ageMidDays: number;        // upper bound of mid-age range
  ageMidBonus: number;       // bonus at start of mid-age
  sizeIdealMinGB: number;    // ideal size lower bound (GB)
  sizeIdealMaxGB: number;    // ideal size upper bound (GB)
  sizeIdealBonus: number;    // bonus for ideal size
  sizeOkMinGB: number;       // acceptable size lower bound
  sizeOkMaxGB: number;       // acceptable size upper bound
  sizeOkBonus: number;       // bonus for acceptable size
  sizeTooSmallGB: number;    // below this = penalty
  sizeTooSmallPenalty: number;
  protocolTorrentBonus: number;
  leecherWeight: number;     // pts per leecher
  leecherCap: number;        // max leechers counted
}

export const DEFAULT_SCORING: ScoringParams = {
  seederWeight: 5,
  seederCap: 200,
  ageFreshDays: 14,
  ageFreshBonus: 300,
  ageMidDays: 60,
  ageMidBonus: 100,
  sizeIdealMinGB: 10,
  sizeIdealMaxGB: 80,
  sizeIdealBonus: 200,
  sizeOkMinGB: 3,
  sizeOkMaxGB: 120,
  sizeOkBonus: 100,
  sizeTooSmallGB: 1,
  sizeTooSmallPenalty: 100,
  protocolTorrentBonus: 50,
  leecherWeight: 2,
  leecherCap: 50,
};

export function getScoringParams(): ScoringParams {
  const raw = getSetting("scoring_params");
  if (!raw) return { ...DEFAULT_SCORING };
  try {
    return { ...DEFAULT_SCORING, ...JSON.parse(raw) } as ScoringParams;
  } catch {
    return { ...DEFAULT_SCORING };
  }
}

export function setScoringParams(params: Partial<ScoringParams>): void {
  const current = getScoringParams();
  const merged = { ...current, ...params };
  setSetting("scoring_params", JSON.stringify(merged));
}
