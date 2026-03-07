import type { SteamFeaturedCategories, SteamAppDetails, UpcomingGame } from "../types/steam";

const STORE_API = "https://store.steampowered.com/api";

export async function getUpcomingReleases(): Promise<UpcomingGame[]> {
  const response = await fetch(`${STORE_API}/featuredcategories?cc=us&l=english`);
  if (!response.ok) {
    throw new Error(`Steam featuredcategories failed: ${response.status}`);
  }

  const data = (await response.json()) as SteamFeaturedCategories;
  const items = data.coming_soon?.items ?? [];

  return items.map((item) => ({
    appId: item.id,
    name: item.name,
    headerImage: item.header_image ?? item.large_capsule_image,
    releaseDate: "",
    comingSoon: true,
    price: item.final_price !== null && item.final_price !== undefined
      ? item.final_price === 0
        ? "Free"
        : `$${(item.final_price / 100).toFixed(2)}`
      : "TBD",
  }));
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

export async function enrichWithDetails(games: UpcomingGame[]): Promise<UpcomingGame[]> {
  // Fetch details in small batches to avoid hammering the API
  const batchSize = 5;
  const enriched: UpcomingGame[] = [];

  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);
    const details = await Promise.all(batch.map((g) => getAppDetails(g.appId)));

    for (let j = 0; j < batch.length; j++) {
      enriched.push(details[j] ?? batch[j]);
    }
  }

  return enriched;
}
