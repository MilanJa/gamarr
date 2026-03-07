import { Hono } from "hono";
import { Layout } from "../views/layout";
import { GameCard } from "../views/components/game-card";
import {
  getAllWishlistGames,
  addToWishlist,
  removeFromWishlist,
} from "../db/wishlist";
import type { UpcomingGame } from "../types/steam";

const app = new Hono();

// Render wishlist page
app.get("/wishlist", (c) => {
  const games = getAllWishlistGames();
  const now = Date.now() / 1000;

  const viewGames: UpcomingGame[] = games.map((g) => ({
    appId: g.app_id,
    name: g.name,
    headerImage: g.header_image ?? "",
    releaseDate: g.release_date ?? "",
    releaseTimestamp: g.release_timestamp ?? undefined,
    comingSoon: true,
  }));

  // Split: games with a known past release timestamp are "released"
  const upcoming = viewGames
    .filter((g) => !g.releaseTimestamp || g.releaseTimestamp > now)
    .sort((a, b) => {
      // Games with a known release date first, sorted by closest date
      if (a.releaseTimestamp && b.releaseTimestamp)
        return a.releaseTimestamp - b.releaseTimestamp;
      if (a.releaseTimestamp) return -1;
      if (b.releaseTimestamp) return 1;
      return 0;
    });
  const released = viewGames.filter(
    (g) => g.releaseTimestamp && g.releaseTimestamp <= now
  );

  const renderGameCard = (game: UpcomingGame, showSearch: boolean) => (
    <div class="game-card" data-appid={game.appId}>
      <div class="game-card-image">
        <img src={game.headerImage} alt={game.name} loading="lazy" />
      </div>
      <div class="game-card-body">
        <h3 class="game-card-title">{game.name}</h3>
        <div class="game-card-meta">
          {game.releaseDate && (
            <span class="release-date">{game.releaseDate}</span>
          )}
        </div>
        <div class="game-card-actions">
          <button
            class="btn btn-wishlisted"
            data-action="remove-wishlist"
            data-appid={game.appId}
          >
            ★ Wishlisted
          </button>
          {showSearch && (
            <a
              href={`/search?appId=${game.appId}`}
              class="btn btn-search"
            >
              🔍 Search Prowlarr
            </a>
          )}
          <a
            href={`https://store.steampowered.com/app/${game.appId}`}
            target="_blank"
            class="btn btn-steam"
          >
            Steam ↗
          </a>
        </div>
      </div>
    </div>
  );

  return c.html(
    <Layout title="Wishlist" currentPath="/wishlist">
      <div class="page-header">
        <h1>My Wishlist ({games.length})</h1>
      </div>

      {games.length === 0 ? (
        <div class="empty-state">
          <h2>Your wishlist is empty</h2>
          <p>Browse upcoming releases and add games you're interested in.</p>
          <a href="/" class="btn btn-search">
            Browse Upcoming
          </a>
        </div>
      ) : (
        <>
          {released.length > 0 && (
            <section class="wishlist-section">
              <h2 class="section-heading">
                <span class="section-icon">✅</span>
                Released ({released.length})
              </h2>
              <div class="game-grid">
                {released.map((game) => renderGameCard(game, true))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section class="wishlist-section">
              <h2 class="section-heading">
                <span class="section-icon">🎮</span>
                Upcoming ({upcoming.length})
              </h2>
              <div class="game-grid">
                {upcoming.map((game) => renderGameCard(game, false))}
              </div>
            </section>
          )}
        </>
      )}

      <script src="/public/app.js"></script>
    </Layout>
  );
});

// API: Add to wishlist
app.post("/api/wishlist", async (c) => {
  try {
    const body = await c.req.json<{
      appId: number;
      name: string;
      headerImage?: string;
      releaseDate?: string;
      releaseTimestamp?: number;
    }>();

    if (!body.appId || !body.name) {
      return c.json({ error: "appId and name are required" }, 400);
    }

    addToWishlist(body);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: "Invalid request body" }, 400);
  }
});

// API: Remove from wishlist
app.delete("/api/wishlist/:appId", (c) => {
  const appId = Number(c.req.param("appId"));
  if (isNaN(appId)) {
    return c.json({ error: "Invalid appId" }, 400);
  }
  removeFromWishlist(appId);
  return c.json({ success: true });
});

export default app;
