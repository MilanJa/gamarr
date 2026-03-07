import { config } from "../config";
import type { ProwlarrIndexer, ProwlarrSearchResult } from "../types/prowlarr";

const baseUrl = () => config.prowlarr.url.replace(/\/+$/, "");
const apiKey = () => config.prowlarr.apiKey;

async function prowlarrFetch<T>(path: string): Promise<T> {
  const url = `${baseUrl()}${path}`;

  const response = await fetch(url, {
    headers: { "X-Api-Key": apiKey() },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Prowlarr ${path} failed (${response.status}): ${body}`);
  }
  return response.json() as Promise<T>;
}

export async function getIndexers(): Promise<ProwlarrIndexer[]> {
  return prowlarrFetch<ProwlarrIndexer[]>("/api/v1/indexer");
}

export async function search(
  query: string,
  indexerIds?: number[]
): Promise<ProwlarrSearchResult[]> {
  let path = `/api/v1/search?query=${encodeURIComponent(query)}&type=search&categories=4000&categories=4050`;

  if (indexerIds && indexerIds.length > 0) {
    const idParams = indexerIds.map((id) => `indexerIds=${id}`).join("&");
    path += `&${idParams}`;
  }

  return prowlarrFetch<ProwlarrSearchResult[]>(path);
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
