export interface ProwlarrIndexer {
  id: number;
  name: string;
  protocol: string;
  enable: boolean;
  appProfileId?: number;
  priority: number;
}

export interface ProwlarrSearchResult {
  guid: string;
  title: string;
  sortTitle: string;
  size: number;
  age: number;
  ageHours: number;
  ageMinutes: number;
  publishDate: string;
  downloadUrl?: string;
  magnetUrl?: string;
  infoUrl?: string;
  indexer: string;
  indexerId: number;
  seeders?: number;
  leechers?: number;
  protocol: string;
  categories: Array<{
    id: number;
    name: string;
  }>;
  fileName?: string;
}
