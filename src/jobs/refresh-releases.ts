import { getAllWishlistGames, updateWishlistGameRelease } from "../db/wishlist";
import { fetchReleaseInfoForApps } from "../api/steam";

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export async function refreshWishlistReleases(): Promise<void> {
  const startTime = Date.now();
  console.log("[refresh] Starting wishlist release date refresh...");

  const games = getAllWishlistGames();
  if (games.length === 0) {
    console.log("[refresh] No wishlisted games to refresh.");
    return;
  }

  const appIds = games.map((g) => g.app_id);
  console.log(`[refresh] Fetching release info for ${appIds.length} games...`);
  const freshInfo = await fetchReleaseInfoForApps(appIds);

  console.log(`[refresh] Fetched info for ${freshInfo.size}/${appIds.length} games from Steam.`);

  let updatedCount = 0;

  for (const game of games) {
    const fresh = freshInfo.get(game.app_id);
    if (!fresh) continue;

    const dateChanged = fresh.releaseDate !== game.release_date;
    const tsChanged = fresh.releaseTimestamp !== game.release_timestamp;

    if (dateChanged || tsChanged) {
      updateWishlistGameRelease(
        game.app_id,
        fresh.releaseDate,
        fresh.releaseTimestamp,
      );
      console.log(
        `[refresh] Updated ${game.name}: "${game.release_date}" → "${fresh.releaseDate}"` +
          (tsChanged ? ` (ts: ${game.release_timestamp} → ${fresh.releaseTimestamp})` : ""),
      );
      updatedCount++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `[refresh] Done in ${elapsed}s — ${updatedCount}/${games.length} games updated.`,
  );
}

export function startRefreshScheduler(): void {
  // Run once shortly after startup (5s delay so server is ready)
  setTimeout(() => {
    refreshWishlistReleases().catch((err) =>
      console.error("[refresh] Startup refresh failed:", err),
    );
  }, 5000);

  // Then every 12 hours
  setInterval(() => {
    refreshWishlistReleases().catch((err) =>
      console.error("[refresh] Scheduled refresh failed:", err),
    );
  }, TWELVE_HOURS);

  console.log("[refresh] Scheduler started — runs on startup + every 12 hours.");
}
