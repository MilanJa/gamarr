// ===== IStoreQueryService Response Types =====

export interface StoreQueryResponse {
  response: {
    metadata: {
      total_matching_records: number;
      start: number;
      count: number;
    };
    ids: Array<{ appid: number }>;
    store_items: StoreItem[];
  };
}

export interface StoreItem {
  item_type: number;
  id: number;
  success: number;
  visible: boolean;
  name: string;
  store_url_path: string;
  appid: number;
  type: number;
  is_early_access?: boolean;
  is_coming_soon?: boolean;
  tagids?: number[];
  content_descriptorids?: number[];
  related_items?: {
    parent_appid?: number;
    demo_appid?: number[];
  };
  categories?: {
    supported_player_categoryids?: number[];
    feature_categoryids?: number[];
    controller_categoryids?: number[];
  };
  basic_info?: {
    short_description?: string;
    publishers?: Array<{ name: string; creator_clan_account_id?: number }>;
    developers?: Array<{ name: string; creator_clan_account_id?: number }>;
    franchises?: Array<{ name: string; creator_clan_account_id?: number }>;
  };
  tags?: Array<{ tagid: number; weight: number }>;
  assets?: {
    asset_url_format: string;
    main_capsule?: string;
    small_capsule?: string;
    header?: string;
    hero_capsule?: string;
    library_capsule?: string;
    library_capsule_2x?: string;
    library_hero?: string;
    library_hero_2x?: string;
    community_icon?: string;
    page_background?: string;
    page_background_path?: string;
    raw_page_background?: string;
  };
  release?: {
    steam_release_date?: number;
    original_release_date?: number;
    is_coming_soon?: boolean;
    custom_release_date_message?: string;
    coming_soon_display?: string;
    is_early_access?: boolean;
  };
  best_purchase_option?: {
    packageid?: number;
    bundleid?: number;
    purchase_option_name?: string;
    final_price_in_cents?: string;
    original_price_in_cents?: string;
    formatted_final_price?: string;
    formatted_original_price?: string;
    discount_pct?: number;
    is_free?: boolean;
  };
}

export interface SearchSuggestionsResponse {
  response: {
    metadata: {
      total_matching_records: number;
      start: number;
      count: number;
    };
    ids: Array<{ appid: number }>;
    store_items: StoreItem[];
  };
}

// ===== Sort Options =====

export enum StoreQuerySort {
  Default = 0,
  Name = 1,
  Released = 2,
  LowestPrice = 6,
  HighestPrice = 7,
  NewAndTrending = 12,
}

// ===== Legacy appdetails endpoint (kept for detail page) =====

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

// ===== Unified Game Model =====

export interface UpcomingGame {
  appId: number;
  name: string;
  headerImage: string;
  releaseDate: string;
  releaseTimestamp?: number;
  comingSoon: boolean;
  shortDescription?: string;
  developers?: string[];
  genres?: string[];
  price?: string;
}

export interface PaginatedResult {
  games: UpcomingGame[];
  totalCount: number;
  start: number;
  count: number;
}
