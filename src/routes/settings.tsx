import { Hono } from "hono";
import { Layout } from "../views/layout";
import { getIndexers } from "../api/prowlarr";
import { getSelectedIndexerIds, setSelectedIndexerIds, getScoringParams, setScoringParams, DEFAULT_SCORING } from "../db/settings";
import type { ScoringParams } from "../db/settings";

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

  return c.html(
    <Layout title="Settings" currentPath="/settings">
      <div class="page-header">
        <h1>Settings</h1>
      </div>

      {savedMessage && <div class="alert alert-success">{savedMessage}</div>}
      {error && <div class="alert alert-error">{error}</div>}

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

export default app;
