import { Hono } from "hono";
import { Layout } from "../views/layout";
import { getIndexers } from "../api/prowlarr";
import { getSelectedIndexerIds, setSelectedIndexerIds, getScoringParams, setScoringParams, DEFAULT_SCORING, getSetting, setSetting } from "../db/settings";
import type { ScoringParams } from "../db/settings";
import { fetchSteamWishlist, getAppDetails } from "../api/steam";
import { addToWishlist, getWishlistedAppIds } from "../db/wishlist";

const app = new Hono();

app.get("/settings", async (c) => {
  let error = "";
  let indexers: Awaited<ReturnType<typeof getIndexers>> = [];
  const savedIds = getSelectedIndexerIds();

  try {
    indexers = await getIndexers();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch Prowlarr indexers";
  }

  const savedMessage = c.req.query("saved") === "1" ? "Settings saved successfully!" : "";
  const scoring = getScoringParams();
  const steamId = getSetting("steam_id") ?? "";

  return c.html(
    <Layout title="Settings" currentPath="/settings">
      <div class="page-header">
        <h1>Settings</h1>
      </div>

      {savedMessage && <div class="alert alert-success">{savedMessage}</div>}
      {error && <div class="alert alert-error">{error}</div>}

      <div class="settings-section">
        <h2>Steam Wishlist Import</h2>
        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1rem;">
          Import your Steam wishlist by entering your 64-bit Steam ID. Your wishlist must be set to public.
          Find your Steam ID at <a href="https://steamid.io" target="_blank" rel="noopener noreferrer" style="color: var(--accent);">steamid.io</a>.
        </p>
        <form id="steam-import-form">
          <div style="display: flex; gap: 0.75rem; align-items: end; flex-wrap: wrap;">
            <label style="flex: 1; min-width: 200px;">
              Steam ID (64-bit)
              <input type="text" id="steam-id-input" name="steamId" value={steamId} placeholder="76561198012345678" pattern="[0-9]+" style="width: 100%; margin-top: 0.25rem;" />
            </label>
            <button type="submit" class="btn btn-save" id="import-btn">Import Wishlist</button>
          </div>
          <div id="import-progress" style="display: none; margin-top: 1rem;">
            <div class="import-status">Fetching wishlist...</div>
            <div class="import-progress-bar">
              <div class="import-progress-fill" style="width: 0%"></div>
            </div>
            <div class="import-details" style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);"></div>
          </div>
        </form>
      </div>

      <div class="settings-section">
        <h2>Prowlarr Indexers</h2>
        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1rem;">
          Select which indexers to use when searching for games. If none are selected, all indexers will be searched.
        </p>

        {indexers.length > 0 ? (
          <form id="settings-form">
            <div class="indexer-list">
              {indexers.map((indexer) => (
                <div class="indexer-item">
                  <input
                    type="checkbox"
                    id={`indexer-${indexer.id}`}
                    name="indexerIds"
                    value={String(indexer.id)}
                    checked={savedIds.includes(indexer.id)}
                  />
                  <label for={`indexer-${indexer.id}`}>
                    {indexer.name}
                  </label>
                  <span class="indexer-protocol">{indexer.protocol}</span>
                  {!indexer.enable && (
                    <span style="color: var(--red); font-size: 0.75rem;">(disabled)</span>
                  )}
                </div>
              ))}
            </div>
            <div style="margin-top: 1rem;">
              <button type="submit" class="btn btn-save">Save Settings</button>
            </div>
          </form>
        ) : (
          !error && (
            <div class="empty-state">
              <p>No indexers configured in Prowlarr.</p>
            </div>
          )
        )}
      </div>

      <div class="settings-section">
        <h2>RSS Feed Scoring</h2>
        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1rem;">
          Adjust how the RSS feed ranks torrent results. Higher-scoring results are picked as the "best guess" download.
        </p>

        <form id="scoring-form">
          <div class="scoring-grid">
            <fieldset class="scoring-group">
              <legend>Seeders</legend>
              <label>
                Points per seeder
                <input type="number" name="seederWeight" value={String(scoring.seederWeight)} min="0" max="100" step="1" />
              </label>
              <label>
                Max seeders counted
                <input type="number" name="seederCap" value={String(scoring.seederCap)} min="1" max="10000" step="10" />
              </label>
            </fieldset>

            <fieldset class="scoring-group">
              <legend>Age</legend>
              <label>
                Fresh window (days)
                <input type="number" name="ageFreshDays" value={String(scoring.ageFreshDays)} min="1" max="90" step="1" />
              </label>
              <label>
                Fresh bonus (max pts)
                <input type="number" name="ageFreshBonus" value={String(scoring.ageFreshBonus)} min="0" max="2000" step="10" />
              </label>
              <label>
                Mid-age window (days)
                <input type="number" name="ageMidDays" value={String(scoring.ageMidDays)} min="1" max="365" step="1" />
              </label>
              <label>
                Mid-age bonus (pts)
                <input type="number" name="ageMidBonus" value={String(scoring.ageMidBonus)} min="0" max="1000" step="10" />
              </label>
            </fieldset>

            <fieldset class="scoring-group">
              <legend>Size</legend>
              <label>
                Ideal min (GB)
                <input type="number" name="sizeIdealMinGB" value={String(scoring.sizeIdealMinGB)} min="0" max="500" step="1" />
              </label>
              <label>
                Ideal max (GB)
                <input type="number" name="sizeIdealMaxGB" value={String(scoring.sizeIdealMaxGB)} min="1" max="1000" step="1" />
              </label>
              <label>
                Ideal bonus (pts)
                <input type="number" name="sizeIdealBonus" value={String(scoring.sizeIdealBonus)} min="0" max="2000" step="10" />
              </label>
              <label>
                OK min (GB)
                <input type="number" name="sizeOkMinGB" value={String(scoring.sizeOkMinGB)} min="0" max="500" step="0.5" />
              </label>
              <label>
                OK max (GB)
                <input type="number" name="sizeOkMaxGB" value={String(scoring.sizeOkMaxGB)} min="1" max="1000" step="1" />
              </label>
              <label>
                OK bonus (pts)
                <input type="number" name="sizeOkBonus" value={String(scoring.sizeOkBonus)} min="0" max="1000" step="10" />
              </label>
              <label>
                Too-small threshold (GB)
                <input type="number" name="sizeTooSmallGB" value={String(scoring.sizeTooSmallGB)} min="0" max="100" step="0.1" />
              </label>
              <label>
                Too-small penalty (pts)
                <input type="number" name="sizeTooSmallPenalty" value={String(scoring.sizeTooSmallPenalty)} min="0" max="2000" step="10" />
              </label>
            </fieldset>

            <fieldset class="scoring-group">
              <legend>Other</legend>
              <label>
                Torrent protocol bonus
                <input type="number" name="protocolTorrentBonus" value={String(scoring.protocolTorrentBonus)} min="0" max="500" step="10" />
              </label>
              <label>
                Points per leecher
                <input type="number" name="leecherWeight" value={String(scoring.leecherWeight)} min="0" max="50" step="1" />
              </label>
              <label>
                Max leechers counted
                <input type="number" name="leecherCap" value={String(scoring.leecherCap)} min="1" max="1000" step="10" />
              </label>
            </fieldset>
          </div>

          <div style="margin-top: 1rem; display: flex; gap: 0.75rem;">
            <button type="submit" class="btn btn-save">Save Scoring</button>
            <button type="button" id="reset-scoring" class="btn btn-steam">Reset to Defaults</button>
          </div>
        </form>
      </div>

      <script src="/public/app.js"></script>
    </Layout>
  );
});

// API: Save indexer settings
app.post("/api/settings/indexers", async (c) => {
  try {
    const body = await c.req.json<{ indexerIds: number[] }>();
    const ids = Array.isArray(body.indexerIds) ? body.indexerIds.filter(Number.isFinite) : [];
    setSelectedIndexerIds(ids);
    return c.json({ success: true });
  } catch {
    return c.json({ error: "Invalid request" }, 400);
  }
});

// API: Save scoring settings
app.post("/api/settings/scoring", async (c) => {
  try {
    const body = await c.req.json<Partial<ScoringParams>>();
    setScoringParams(body);
    return c.json({ success: true });
  } catch {
    return c.json({ error: "Invalid request" }, 400);
  }
});

// API: Get default scoring params
app.get("/api/settings/scoring/defaults", (c) => {
  return c.json(DEFAULT_SCORING);
});

// API: Save Steam ID
app.post("/api/settings/steam-id", async (c) => {
  try {
    const body = await c.req.json<{ steamId: string }>();
    const steamId = (body.steamId ?? "").trim();
    if (!/^\d{17}$/.test(steamId)) {
      return c.json({ error: "Invalid Steam ID. Must be a 17-digit number." }, 400);
    }
    setSetting("steam_id", steamId);
    return c.json({ success: true });
  } catch {
    return c.json({ error: "Invalid request" }, 400);
  }
});

// API: Import Steam wishlist
app.post("/api/import/steam-wishlist", async (c) => {
  try {
    const body = await c.req.json<{ steamId: string }>();
    const steamId = (body.steamId ?? "").trim();
    if (!/^\d{17}$/.test(steamId)) {
      return c.json({ error: "Invalid Steam ID. Must be a 17-digit number." }, 400);
    }

    // Save the Steam ID for future use
    setSetting("steam_id", steamId);

    // Fetch wishlist from Steam
    const wishlistItems = await fetchSteamWishlist(steamId);
    if (wishlistItems.length === 0) {
      return c.json({ imported: 0, skipped: 0, failed: 0, total: 0, message: "Wishlist is empty or private" });
    }

    // Get already wishlisted app IDs
    const existing = getWishlistedAppIds();

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of wishlistItems) {
      if (existing.has(item.appid)) {
        skipped++;
        continue;
      }

      try {
        const details = await getAppDetails(item.appid);
        if (details) {
          addToWishlist({
            appId: details.appId,
            name: details.name,
            headerImage: details.headerImage,
            releaseDate: details.releaseDate,
            releaseTimestamp: details.releaseDate
              ? Math.floor(Date.parse(details.releaseDate) / 1000) || undefined
              : undefined,
          });
          imported++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }

      // Rate limit: 1.5s between appdetails calls
      await new Promise((r) => setTimeout(r, 1500));
    }

    return c.json({ imported, skipped, failed, total: wishlistItems.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return c.json({ error: message }, 500);
  }
});

export default app;
