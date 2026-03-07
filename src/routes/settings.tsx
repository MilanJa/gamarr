import { Hono } from "hono";
import { Layout } from "../views/layout";
import { getIndexers } from "../api/prowlarr";
import { getSelectedIndexerIds, setSelectedIndexerIds } from "../db/settings";

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

export default app;
