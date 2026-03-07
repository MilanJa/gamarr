import { getDb } from "./index";

export interface WishlistGame {
  id: number;
  app_id: number;
  name: string;
  header_image: string | null;
  release_date: string | null;
  added_at: string;
}

export function getAllWishlistGames(): WishlistGame[] {
  const db = getDb();
  return db.query("SELECT * FROM wishlist ORDER BY added_at DESC").all() as WishlistGame[];
}

export function addToWishlist(game: {
  appId: number;
  name: string;
  headerImage?: string;
  releaseDate?: string;
}): void {
  const db = getDb();
  db.query(
    "INSERT OR IGNORE INTO wishlist (app_id, name, header_image, release_date) VALUES (?, ?, ?, ?)"
  ).run(game.appId, game.name, game.headerImage ?? null, game.releaseDate ?? null);
}

export function removeFromWishlist(appId: number): void {
  const db = getDb();
  db.query("DELETE FROM wishlist WHERE app_id = ?").run(appId);
}

export function isWishlisted(appId: number): boolean {
  const db = getDb();
  const row = db.query("SELECT 1 FROM wishlist WHERE app_id = ?").get(appId);
  return row !== null;
}

export function getWishlistGame(appId: number): WishlistGame | null {
  const db = getDb();
  return (db.query("SELECT * FROM wishlist WHERE app_id = ?").get(appId) as WishlistGame) ?? null;
}

export function getWishlistedAppIds(): Set<number> {
  const db = getDb();
  const rows = db.query("SELECT app_id FROM wishlist").all() as { app_id: number }[];
  return new Set(rows.map((r) => r.app_id));
}
