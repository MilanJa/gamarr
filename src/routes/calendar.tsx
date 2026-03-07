import { Hono } from "hono";
import { Layout } from "../views/layout";
import { getWishlistGamesWithReleaseDate } from "../db/wishlist";
import type { WishlistGame } from "../db/wishlist";

const app = new Hono();

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function gameDate(g: WishlistGame): Date {
  return new Date(g.release_timestamp! * 1000);
}

function buildMonthUrl(year: number, month: number): string {
  return `/calendar?view=month&year=${year}&month=${month}`;
}

function buildYearUrl(year: number): string {
  return `/calendar?view=year&year=${year}`;
}

// Group games by a string key
function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const arr = map.get(key) ?? [];
    arr.push(item);
    map.set(key, arr);
  }
  return map;
}

app.get("/calendar", (c) => {
  const allGames = getWishlistGamesWithReleaseDate();
  const now = new Date();
  const view = c.req.query("view") === "year" ? "year" : "month";
  const year = parseInt(c.req.query("year") ?? String(now.getFullYear()), 10) || now.getFullYear();
  const month = Math.min(11, Math.max(0, (parseInt(c.req.query("month") ?? String(now.getMonth() + 1), 10) || (now.getMonth() + 1)) - 1));

  return c.html(
    <Layout title="Release Calendar" currentPath="/calendar">
      <div class="page-header">
        <h1>Release Calendar</h1>
      </div>

      {/* View toggle */}
      <div class="calendar-controls">
        <div class="view-toggle">
          <a
            href={buildMonthUrl(year, month + 1)}
            class={`btn btn-toggle ${view === "month" ? "active" : ""}`}
          >
            Monthly
          </a>
          <a
            href={buildYearUrl(year)}
            class={`btn btn-toggle ${view === "year" ? "active" : ""}`}
          >
            Yearly
          </a>
        </div>

        {/* Navigation */}
        {view === "month" ? (
          <div class="calendar-nav">
            <a
              href={buildMonthUrl(month === 0 ? year - 1 : year, month === 0 ? 12 : month)}
              class="btn btn-page"
            >
              ←
            </a>
            <span class="calendar-period">
              {MONTH_NAMES[month]} {year}
            </span>
            <a
              href={buildMonthUrl(month === 11 ? year + 1 : year, month === 11 ? 1 : month + 2)}
              class="btn btn-page"
            >
              →
            </a>
          </div>
        ) : (
          <div class="calendar-nav">
            <a href={buildYearUrl(year - 1)} class="btn btn-page">←</a>
            <span class="calendar-period">{year}</span>
            <a href={buildYearUrl(year + 1)} class="btn btn-page">→</a>
          </div>
        )}
      </div>

      {allGames.length === 0 ? (
        <div class="empty-state">
          <h2>No dated releases</h2>
          <p>Wishlist some upcoming games with concrete release dates to see them here.</p>
          <a href="/" class="btn btn-search">Browse Upcoming</a>
        </div>
      ) : view === "month" ? (
        renderMonthView(allGames, year, month)
      ) : (
        renderYearView(allGames, year)
      )}

      <script src="/public/app.js"></script>
    </Layout>
  );
});

function renderMonthView(allGames: WishlistGame[], year: number, month: number) {
  // Filter games for this month
  const monthGames = allGames.filter((g) => {
    const d = gameDate(g);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // Calendar grid setup
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const todayDate = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : -1;

  // Group games by day
  const byDay = groupBy(monthGames, (g) => String(gameDate(g).getDate()));

  // Build calendar grid cells
  const cells: Array<{ day: number | null; games: WishlistGame[] }> = [];

  // Leading blanks
  for (let i = 0; i < startDow; i++) {
    cells.push({ day: null, games: [] });
  }
  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, games: byDay.get(String(d)) ?? [] });
  }
  // Trailing blanks to fill last row
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, games: [] });
  }

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div class="calendar-month">
      {monthGames.length === 0 && (
        <div class="calendar-empty">No wishlisted releases this month.</div>
      )}
      <table class="calendar-grid">
        <thead>
          <tr>
            {DAY_NAMES.map((d) => (
              <th>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr>
              {week.map((cell) => (
                <td
                  class={[
                    "calendar-cell",
                    cell.day === null ? "empty" : "",
                    cell.day === todayDate ? "today" : "",
                    cell.games.length > 0 ? "has-games" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {cell.day !== null && (
                    <>
                      <span class="cell-day">{cell.day}</span>
                      {cell.games.length > 0 && (
                        <div class="cell-games">
                          {cell.games.map((g) => (
                            <a
                              href={`https://store.steampowered.com/app/${g.app_id}`}
                              target="_blank"
                              class="cell-game"
                              title={g.name}
                            >
                              {g.header_image ? (
                                <img
                                  src={g.header_image}
                                  alt={g.name}
                                  class="cell-game-img"
                                />
                              ) : (
                                <span class="cell-game-name">{g.name}</span>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderYearView(allGames: WishlistGame[], year: number) {
  // Filter to this year
  const yearGames = allGames.filter((g) => gameDate(g).getFullYear() === year);

  // Group by month
  const byMonth = groupBy(yearGames, (g) => String(gameDate(g).getMonth()));

  const now = new Date();
  const currentMonth = now.getFullYear() === year ? now.getMonth() : -1;

  return (
    <div class="calendar-year">
      {yearGames.length === 0 && (
        <div class="calendar-empty">No wishlisted releases in {year}.</div>
      )}
      <div class="year-grid">
        {Array.from({ length: 12 }, (_, m) => {
          const games = byMonth.get(String(m)) ?? [];
          return (
            <a
              href={buildMonthUrl(year, m + 1)}
              class={[
                "year-month-card",
                m === currentMonth ? "current" : "",
                games.length > 0 ? "has-games" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div class="year-month-header">
                <span class="year-month-name">{MONTH_NAMES[m]}</span>
                {games.length > 0 && (
                  <span class="year-month-count">{games.length}</span>
                )}
              </div>
              {games.length > 0 && (
                <div class="year-month-games">
                  {games.slice(0, 4).map((g) => (
                    <div class="year-game-item" title={`${g.name} — ${g.release_date}`}>
                      {g.header_image && (
                        <img src={g.header_image} alt="" class="year-game-thumb" />
                      )}
                      <span class="year-game-name">{g.name}</span>
                    </div>
                  ))}
                  {games.length > 4 && (
                    <div class="year-game-more">+{games.length - 4} more</div>
                  )}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default app;
