import { Hono } from "hono";
import { Layout } from "../views/layout";
import { SearchResult } from "../views/components/search-result";
import { search } from "../api/prowlarr";
import { getWishlistGame } from "../db/wishlist";
import { getSelectedIndexerIds } from "../db/settings";
import type { ProwlarrSearchResult } from "../types/prowlarr";

const app = new Hono();

app.get("/search", async (c) => {
  const appId = Number(c.req.query("appId"));
  const customQuery = c.req.query("q");

  let gameName = customQuery ?? "";
  let headerImage = "";
  let error = "";
  let results: ProwlarrSearchResult[] = [];

  // Look up the game name from wishlist if appId provided
  if (appId && !isNaN(appId)) {
    const game = getWishlistGame(appId);
    if (game) {
      gameName = game.name;
      headerImage = game.header_image ?? "";
    } else {
      error = "Game not found in wishlist. Add it first, or search manually.";
    }
  }

  if (gameName && !error) {
    try {
      const indexerIds = getSelectedIndexerIds();
      results = await search(gameName, indexerIds.length > 0 ? indexerIds : undefined);
      // Sort by seeders desc (torrent) then by age asc
      results.sort((a, b) => {
        const seedA = a.seeders ?? 0;
        const seedB = b.seeders ?? 0;
        if (seedB !== seedA) return seedB - seedA;
        return a.age - b.age;
      });
    } catch (e) {
      error = e instanceof Error ? e.message : "Prowlarr search failed";
    }
  }

  return c.html(
    <Layout title={`Search: ${gameName}`} currentPath="">
      {gameName && (
        <div class="search-header">
          {headerImage && (
            <img src={headerImage} alt={gameName} />
          )}
          <div class="search-header-info">
            <h1>{gameName}</h1>
            <p>
              {results.length} result{results.length !== 1 ? "s" : ""} from Prowlarr
            </p>
          </div>
        </div>
      )}

      {!gameName && !error && (
        <div class="page-header">
          <h1>Search Prowlarr</h1>
        </div>
      )}

      {error && <div class="alert alert-error">{error}</div>}

      {/* Manual search form */}
      <form method="get" action="/search" style="margin-bottom: 1.5rem; display: flex; gap: 0.5rem;">
        <input
          type="text"
          name="q"
          value={customQuery ?? ""}
          placeholder="Search for a game..."
          style="flex: 1; padding: 0.5rem 0.75rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border); border-radius: var(--radius); font-size: 0.9rem;"
        />
        <button type="submit" class="btn btn-search">Search</button>
      </form>

      {results.length > 0 && (
        <table class="results-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Indexer</th>
              <th>Size</th>
              <th>S / L</th>
              <th>Age</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <SearchResult result={r} />
            ))}
          </tbody>
        </table>
      )}

      {gameName && results.length === 0 && !error && (
        <div class="empty-state">
          <h2>No results found</h2>
          <p>No releases found for "{gameName}" on your configured indexers.</p>
          <a href="/settings" class="btn btn-search">Check Indexer Settings</a>
        </div>
      )}
    </Layout>
  );
});

export default app;
