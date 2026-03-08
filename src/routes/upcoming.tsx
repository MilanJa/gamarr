import { Hono } from "hono";
import { Layout } from "../views/layout";
import { GameCard } from "../views/components/game-card";
import { queryUpcomingGames, searchUpcomingGames, PAGE_SIZE } from "../api/steam";
import { getWishlistedAppIds } from "../db/wishlist";
import { StoreQuerySort } from "../types/steam";
import type { UpcomingGame, PaginatedResult } from "../types/steam";

const app = new Hono();

const SORT_OPTIONS: Array<{ value: string; label: string; sort: StoreQuerySort }> = [
  { value: "default", label: "Default", sort: StoreQuerySort.Default },
  { value: "name", label: "Name", sort: StoreQuerySort.Name },
  { value: "released", label: "Release Date", sort: StoreQuerySort.Released },
  { value: "trending", label: "New & Trending", sort: StoreQuerySort.NewAndTrending },
  { value: "price_asc", label: "Price: Low to High", sort: StoreQuerySort.LowestPrice },
  { value: "price_desc", label: "Price: High to Low", sort: StoreQuerySort.HighestPrice },
];

app.get("/", async (c) => {
  let error = "";
  let result: PaginatedResult = { games: [], totalCount: 0, start: 0, count: 0 };

  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10) || 1);
  const q = c.req.query("q")?.trim() ?? "";
  const sortParam = c.req.query("sort") ?? "default";
  const sortOption = SORT_OPTIONS.find((o) => o.value === sortParam) ?? SORT_OPTIONS[0];
  const start = (page - 1) * PAGE_SIZE;

  try {
    if (q) {
      result = await searchUpcomingGames(q, PAGE_SIZE);
    } else {
      result = await queryUpcomingGames(start, PAGE_SIZE, sortOption.sort);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch upcoming releases";
  }

  // When sorting by release date, sort closest date first and push indeterminate dates to the end
  if (sortOption.sort === StoreQuerySort.Released) {
    result.games.sort((a, b) => {
      const aTs = a.releaseTimestamp ?? Infinity;
      const bTs = b.releaseTimestamp ?? Infinity;
      return aTs - bTs;
    });
  }

  const wishlistedIds = getWishlistedAppIds();
  const totalPages = Math.ceil(result.totalCount / PAGE_SIZE);

  // Build query string helper for pagination/sort links
  const buildUrl = (params: Record<string, string | number>) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (sortParam !== "default" && !q) qs.set("sort", sortParam);
    for (const [k, v] of Object.entries(params)) {
      qs.set(k, String(v));
    }
    const str = qs.toString();
    return str ? `/?${str}` : "/";
  };

  return c.html(
    <Layout title="Upcoming Releases" currentPath="/">
      <div class="page-header">
        <h1>Upcoming Steam Releases</h1>
        <span class="results-count">{result.totalCount.toLocaleString()} games</span>
      </div>

      <div class="browse-controls">
        <form class="search-form" method="get" action="/">
          <input
            type="text"
            name="q"
            class="search-input"
            placeholder="Search upcoming games..."
            value={q}
            autocomplete="off"
          />
          <button type="submit" class="btn btn-search">Search</button>
          {q && (
            <a href={buildUrl({})} class="btn btn-clear">Clear</a>
          )}
        </form>

        {!q && (
          <div class="sort-controls">
            <label class="sort-label">Sort by:</label>
            <select class="sort-select" id="sort-select" data-current={sortParam}>
              {SORT_OPTIONS.map((opt) => (
                <option value={opt.value} selected={opt.value === sortParam}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <div class="alert alert-error">{error}</div>}

      {result.games.length === 0 && !error ? (
        <div class="empty-state">
          {q ? (
            <>
              <h2>No results for "{q}"</h2>
              <p>Try a different search term or browse all upcoming releases.</p>
              <a href="/" class="btn btn-search">Browse All</a>
            </>
          ) : (
            <>
              <h2>No upcoming releases found</h2>
              <p>Steam may be temporarily unavailable. Try again later.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div class="game-grid">
            {result.games.map((game) => (
              <GameCard game={game} wishlisted={wishlistedIds.has(game.appId)} />
            ))}
          </div>

          {!q && totalPages > 1 && (
            <div class="pagination">
              {page > 1 ? (
                <a href={buildUrl({ page: page - 1 })} class="btn btn-page">
                  ← Previous
                </a>
              ) : (
                <span class="btn btn-page disabled">← Previous</span>
              )}

              <span class="page-info">
                Page {page} of {totalPages}
              </span>

              {page < totalPages ? (
                <a href={buildUrl({ page: page + 1 })} class="btn btn-page">
                  Next →
                </a>
              ) : (
                <span class="btn btn-page disabled">Next →</span>
              )}
            </div>
          )}
        </>
      )}

      <script src="/public/app.js"></script>
    </Layout>
  );
});

export default app;
