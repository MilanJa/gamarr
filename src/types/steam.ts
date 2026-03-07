export interface SteamFeaturedCategories {
  coming_soon: {
    id: string;
    name: string;
    items: SteamComingSoonItem[];
  };
}

export interface SteamComingSoonItem {
  id: number;
  type: number;
  name: string;
  discounted: boolean;
  discount_percent: number;
  original_price: number | null;
  final_price: number | null;
  currency: string;
  large_capsule_image: string;
  small_capsule_image: string;
  header_image: string;
  discount_expiration?: number;
  windows_available: boolean;
  mac_available: boolean;
  linux_available: boolean;
}

export interface SteamAppDetails {
  success: boolean;
  data: {
    type: string;
    name: string;
    steam_appid: number;
    required_age: number;
    is_free: boolean;
    short_description: string;
    header_image: string;
    capsule_image: string;
    capsule_imagev5: string;
    website: string | null;
    developers?: string[];
    publishers?: string[];
    genres?: Array<{ id: string; description: string }>;
    release_date: {
      coming_soon: boolean;
      date: string;
    };
    platforms: {
      windows: boolean;
      mac: boolean;
      linux: boolean;
    };
    categories?: Array<{ id: number; description: string }>;
    screenshots?: Array<{
      id: number;
      path_thumbnail: string;
      path_full: string;
    }>;
    price_overview?: {
      currency: string;
      initial: number;
      final: number;
      discount_percent: number;
      initial_formatted: string;
      final_formatted: string;
    };
  };
}

export interface UpcomingGame {
  appId: number;
  name: string;
  headerImage: string;
  releaseDate: string;
  comingSoon: boolean;
  shortDescription?: string;
  developers?: string[];
  genres?: string[];
  price?: string;
}
