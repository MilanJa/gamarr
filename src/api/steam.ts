import { config } from "../config";
import type {
  StoreQueryResponse,
  SearchSuggestionsResponse,
  StoreItem,
  SteamAppDetails,
  UpcomingGame,
  PaginatedResult,
  StoreQuerySort,
} from "../types/steam";

const STEAM_API = "https://api.steampowered.com";
const STORE_API = "https://store.steampowered.com/api";
const STEAM_CDN = "https://shared.akamai.steamstatic.com/store_item_assets";

const PAGE_SIZE = 24;

function buildHeaderImage(item: StoreItem): string {
  if (!item.assets?.asset_url_format || !item.assets.header) {
    // Fallback to standard Steam CDN URL
    return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.appid}/header.jpg`;
  }
  const path = item.assets.asset_url_format.replace("${FILENAME}", item.assets.header);
  return `${STEAM_CDN}/${path}`;
}

function formatReleaseDate(item: StoreItem): string {
  if (item.release?.custom_release_date_message) {
    return item.release.custom_release_date_message;
  }
  if (item.release?.steam_release_date) {
    const date = new Date(item.release.steam_release_date * 1000);
    const display = item.release.coming_soon_display;
    if (display === "date_year") {
      return date.getFullYear().toString();
    }
    if (display === "date_quarter") {
      const q = Math.ceil((date.getMonth() + 1) / 3);
      return `Q${q} ${date.getFullYear()}`;
    }
    if (display === "date_month") {
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return "Coming soon";
}

function formatPrice(item: StoreItem): string {
  if (item.best_purchase_option) {
    if (item.best_purchase_option.is_free) return "Free";
    if (item.best_purchase_option.formatted_final_price) {
      return item.best_purchase_option.formatted_final_price;
    }
    if (item.best_purchase_option.final_price_in_cents) {
      const cents = parseInt(item.best_purchase_option.final_price_in_cents, 10);
      return cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`;
    }
  }
  return "TBD";
}

function hasReleaseDateInPast(item: StoreItem): boolean {
  const ts = item.release?.steam_release_date;
  if (!ts || ts === 0) return false; // no concrete date — keep it
  return ts * 1000 < Date.now();
}

function mapStoreItem(item: StoreItem): UpcomingGame {
  return {
    appId: item.appid,
    name: item.name,
    headerImage: buildHeaderImage(item),
    releaseDate: formatReleaseDate(item),
    releaseTimestamp: item.release?.steam_release_date || undefined,
    comingSoon: item.is_coming_soon ?? item.release?.is_coming_soon ?? true,
    shortDescription: item.basic_info?.short_description,
    developers: item.basic_info?.developers?.map((d) => d.name),
    price: formatPrice(item),
  };
}

export async function queryUpcomingGames(
  start = 0,
  count = PAGE_SIZE,
  sort: StoreQuerySort = 0,
): Promise<PaginatedResult> {
  const inputJson = JSON.stringify({
    query: {
      start,
      count,
      sort,
      filters: {
        coming_soon_only: true,
        type_filters: { include_games: true },
      },
    },
    data_request: {
      include_basic_info: true,
      include_assets: true,
      include_release: true,
      include_all_purchase_options: true,
      include_tag_count: 5,
    },
    context: {
      language: "english",
      country_code: "US",
    },
  });

  const url = `${STEAM_API}/IStoreQueryService/Query/v1/?key=${config.steam.webApiKey}&input_json=${encodeURIComponent(inputJson)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`IStoreQueryService/Query failed: ${response.status}`);
  }

  const data = (await response.json()) as StoreQueryResponse;
  const meta = data.response.metadata;
  const items = data.response.store_items ?? [];

  return {
    games: items
      .filter((i) => i.success && i.visible && !hasReleaseDateInPast(i))
      .map(mapStoreItem),
    totalCount: meta.total_matching_records,
    start: meta.start,
    count: meta.count,
  };
}

export async function searchUpcomingGames(
  searchTerm: string,
  maxResults = PAGE_SIZE,
): Promise<PaginatedResult> {
  const inputJson = JSON.stringify({
    search_term: searchTerm,
    max_results: maxResults,
    filters: {
      coming_soon_only: true,
      type_filters: { include_games: true },
    },
    data_request: {
      include_basic_info: true,
      include_assets: true,
      include_release: true,
      include_all_purchase_options: true,
    },
    context: {
      language: "english",
      country_code: "US",
    },
  });

  const url = `${STEAM_API}/IStoreQueryService/SearchSuggestions/v1/?key=${config.steam.webApiKey}&input_json=${encodeURIComponent(inputJson)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`IStoreQueryService/SearchSuggestions failed: ${response.status}`);
  }

  const data = (await response.json()) as SearchSuggestionsResponse;
  const meta = data.response.metadata;
  const items = data.response.store_items ?? [];

  return {
    games: items
      .filter((i) => i.success && i.visible && !hasReleaseDateInPast(i))
      .map(mapStoreItem),
    totalCount: meta.total_matching_records,
    start: meta.start,
    count: meta.count,
  };
}

export async function getAppDetails(appId: number): Promise<UpcomingGame | null> {
  const response = await fetch(`${STORE_API}/appdetails?appids=${appId}&cc=us&l=english`);
  if (!response.ok) return null;

  const data = (await response.json()) as Record<string, SteamAppDetails>;
  const entry = data[String(appId)];
  if (!entry?.success || !entry.data) return null;

  const d = entry.data;
  return {
    appId: d.steam_appid,
    name: d.name,
    headerImage: d.header_image,
    releaseDate: d.release_date?.date ?? "",
    comingSoon: d.release_date?.coming_soon ?? false,
    shortDescription: d.short_description,
    developers: d.developers,
    genres: d.genres?.map((g) => g.description),
    price: d.price_overview
      ? d.price_overview.final === 0
        ? "Free"
        : d.price_overview.final_formatted
      : d.is_free
        ? "Free"
        : "TBD",
  };
}

export { PAGE_SIZE };

// ===== Fetch release info for wishlisted games =====
// Uses the appdetails endpoint (one game at a time) with rate limiting.
// Parses the date string to extract a Unix timestamp when possible.

export interface ReleaseInfo {
  releaseDate: string;
  releaseTimestamp: number | null;
}

function parseReleaseDateString(dateStr: string): number | null {
  if (!dateStr) return null;
  const parsed = Date.parse(dateStr);
  if (isNaN(parsed)) return null;
  return Math.floor(parsed / 1000);
}

export async function fetchReleaseInfoForApps(
  appIds: number[],
): Promise<Map<number, ReleaseInfo>> {
  const results = new Map<number, ReleaseInfo>();

  for (let i = 0; i < appIds.length; i++) {
    const appId = appIds[i];

    try {
      const response = await fetch(
        `${STORE_API}/appdetails?appids=${appId}&cc=us&l=english`,
      );

      if (response.status === 429) {
        console.warn(`[refresh] Rate limited at game ${i + 1}/${appIds.length}, pausing 30s...`);
        await new Promise((r) => setTimeout(r, 30_000));
        i--; // retry this appId
        continue;
      }

      if (!response.ok) {
        console.warn(`[refresh] appdetails failed for ${appId}: ${response.status}`);
        continue;
      }

      const data = (await response.json()) as Record<string, SteamAppDetails>;
      const entry = data[String(appId)];
      if (!entry?.success || !entry.data) continue;

      const relDate = entry.data.release_date;
      const dateStr = relDate?.date ?? "";
      const timestamp = parseReleaseDateString(dateStr);

      results.set(appId, {
        releaseDate: dateStr,
        releaseTimestamp: timestamp,
      });
    } catch (err) {
      console.error(`[refresh] Error fetching ${appId}:`, err);
    }

    // 1.5s delay between requests to respect rate limits
    if (i < appIds.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  return results;
}

// ===== Steam Wishlist Import =====

export interface SteamWishlistItem {
  appid: number;
  priority: number;
  date_added: number;
}

interface SteamWishlistResponse {
  response: {
    items: SteamWishlistItem[];
  };
}

export async function fetchSteamWishlist(steamId: string): Promise<SteamWishlistItem[]> {
  const url = `${STEAM_API}/IWishlistService/GetWishlist/v1/?key=${config.steam.webApiKey}&steamid=${steamId}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Wishlist is private or Steam ID is invalid");
    }
    throw new Error(`Steam wishlist API failed: ${response.status}`);
  }

  const data = (await response.json()) as SteamWishlistResponse;
  return data.response?.items ?? [];
}
