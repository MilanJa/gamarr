import { Hono } from "hono";
import { getAllWishlistGames } from "../db/wishlist";
import { search } from "../api/prowlarr";
import { getSelectedIndexerIds, getScoringParams } from "../db/settings";
import type { ScoringParams } from "../db/settings";
import type { ProwlarrSearchResult } from "../types/prowlarr";
import { formatSize } from "../api/prowlarr";

const app = new Hono();

/**
 * Score a Prowlarr search result using configurable parameters.
 */
function scoreResult(r: ProwlarrSearchResult, p: ScoringParams): number {
  let score = 0;

  // Seeders
  const seeders = r.seeders ?? 0;
  score += Math.min(seeders, p.seederCap) * p.seederWeight;

  // Age
  const ageDays = r.age ?? 0;
  if (ageDays <= p.ageFreshDays) {
    score += p.ageFreshBonus - ageDays * (p.ageFreshBonus / Math.max(p.ageFreshDays, 1)) * 0.5;
  } else if (ageDays <= p.ageMidDays) {
    score += p.ageMidBonus - (ageDays - p.ageFreshDays);
  }

  // Size
  const sizeGB = r.size / (1024 * 1024 * 1024);
  if (sizeGB >= p.sizeIdealMinGB && sizeGB <= p.sizeIdealMaxGB) {
    score += p.sizeIdealBonus;
  } else if (sizeGB >= p.sizeOkMinGB && sizeGB <= p.sizeOkMaxGB) {
    score += p.sizeOkBonus;
  } else if (sizeGB < p.sizeTooSmallGB) {
    score -= p.sizeTooSmallPenalty;
  }

  // Protocol
  if (r.protocol === "torrent") score += p.protocolTorrentBonus;

  // Leechers
  const leechers = r.leechers ?? 0;
  score += Math.min(leechers, p.leecherCap) * p.leecherWeight;

  return score;
}

/** Find the best torrent/download for a game name via Prowlarr */
async function findBestResult(
  gameName: string,
  scoring: ScoringParams,
): Promise<ProwlarrSearchResult | null> {
  try {
    const indexerIds = getSelectedIndexerIds();
    const results = await search(
      gameName,
      indexerIds.length > 0 ? indexerIds : undefined,
    );

    if (results.length === 0) return null;

    // Score and pick the best
    let best: ProwlarrSearchResult | null = null;
    let bestScore = -Infinity;

    for (const r of results) {
      // Must have a download or magnet URL
      if (!r.downloadUrl && !r.magnetUrl) continue;
      const s = scoreResult(r, scoring);
      if (s > bestScore) {
        bestScore = s;
        best = r;
      }
    }

    return best;
  } catch (err) {
    console.error(`[rss] Prowlarr search failed for "${gameName}":`, err);
    return null;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

app.get("/feed/released", async (c) => {
  const games = getAllWishlistGames();
  const now = Date.now() / 1000;

  // Only released games (have a past release timestamp)
  const released = games.filter(
    (g) => g.release_timestamp && g.release_timestamp <= now,
  );

  // Load scoring params from settings
  const scoring = getScoringParams();

  // Search Prowlarr for each released game and build feed items
  const items: string[] = [];

  for (let i = 0; i < released.length; i++) {
    const game = released[i];
    const best = await findBestResult(game.name, scoring);

    const link = best?.downloadUrl ?? best?.magnetUrl ?? `https://store.steampowered.com/app/${game.app_id}`;
    const seeders = best?.seeders ?? 0;
    const leechers = best?.leechers ?? 0;
    const size = best ? formatSize(best.size) : "N/A";
    const indexer = best?.indexer ?? "N/A";
    const torrentTitle = best?.title ?? "No result found";

    const description = best
      ? `<![CDATA[<p><strong>Match:</strong> ${escapeXml(torrentTitle)}</p>` +
        `<p><strong>Indexer:</strong> ${escapeXml(indexer)} | <strong>Size:</strong> ${size} | <strong>Seeders:</strong> ${seeders} / <strong>Leechers:</strong> ${leechers}</p>` +
        `<p><strong>Release Date:</strong> ${escapeXml(game.release_date ?? "Unknown")}</p>` +
        (game.header_image ? `<p><img src="${escapeXml(game.header_image)}" width="460" /></p>` : "") +
        `]]>`
      : `<![CDATA[<p>No torrent found for this game on configured indexers.</p>` +
        `<p><strong>Release Date:</strong> ${escapeXml(game.release_date ?? "Unknown")}</p>]]>`;

    const pubDate = game.release_timestamp
      ? new Date(game.release_timestamp * 1000).toUTCString()
      : new Date().toUTCString();

    items.push(`    <item>
      <title>${escapeXml(game.name)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">gamarr-${game.app_id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      ${best?.downloadUrl ? `<enclosure url="${escapeXml(best.downloadUrl)}" length="${best.size}" type="application/x-bittorrent" />` : ""}
    </item>`);

    // Small delay between Prowlarr searches to avoid hammering
    if (i < released.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Gamarr - Released Wishlist Games</title>
    <link>${escapeXml(`${c.req.url.replace(/\/feed\/released$/, "")}/wishlist`)}</link>
    <description>RSS feed of released wishlisted games with best-guess torrent links from Prowlarr</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;

  return c.body(feed, 200, {
    "Content-Type": "application/rss+xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  });
});

export default app;
