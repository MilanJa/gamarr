import { Hono } from "hono";
import { Layout } from "../views/layout";
import { GameCard } from "../views/components/game-card";
import { getUpcomingReleases, enrichWithDetails } from "../api/steam";
import { getWishlistedAppIds } from "../db/wishlist";
import type { UpcomingGame } from "../types/steam";

const app = new Hono();

app.get("/", async (c) => {
  let error = "";
  let games: UpcomingGame[] = [];

  try {
    const upcoming = await getUpcomingReleases();
    games = await enrichWithDetails(upcoming);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch upcoming releases";
  }

  const wishlistedIds = getWishlistedAppIds();

  return c.html(
    <Layout title="Upcoming Releases" currentPath="/">
      <div class="page-header">
        <h1>Upcoming Steam Releases</h1>
      </div>

      {error && <div class="alert alert-error">{error}</div>}

      {games.length === 0 && !error ? (
        <div class="empty-state">
          <h2>No upcoming releases found</h2>
          <p>Steam's coming soon list may be temporarily unavailable.</p>
        </div>
      ) : (
        <div class="game-grid">
          {games.map((game) => (
            <GameCard game={game} wishlisted={wishlistedIds.has(game.appId)} />
          ))}
        </div>
      )}

      <script src="/public/app.js"></script>
    </Layout>
  );
});

export default app;
