import type { FC } from "hono/jsx";
import type { ProwlarrSearchResult } from "../../types/prowlarr";
import { formatSize } from "../../api/prowlarr";

interface SearchResultProps {
  result: ProwlarrSearchResult;
}

export const SearchResult: FC<SearchResultProps> = ({ result }) => {
  const ageText =
    result.age === 0
      ? `${result.ageHours}h`
      : result.age === 1
        ? "1 day"
        : `${result.age} days`;

  return (
    <tr class="search-result">
      <td class="result-title">
        {result.infoUrl ? (
          <a href={result.infoUrl} target="_blank" rel="noopener">
            {result.title}
          </a>
        ) : (
          result.title
        )}
      </td>
      <td class="result-indexer">{result.indexer}</td>
      <td class="result-size">{formatSize(result.size)}</td>
      <td class="result-seeds">
        {result.protocol === "torrent" ? (
          <span class="seed-leech">
            <span class="seeds">{result.seeders ?? "—"}</span>
            {" / "}
            <span class="leeches">{result.leechers ?? "—"}</span>
          </span>
        ) : (
          "—"
        )}
      </td>
      <td class="result-age">{ageText}</td>
      <td class="result-actions">
        {result.downloadUrl && (
          <a href={result.downloadUrl} class="btn btn-sm btn-download" title="Download NZB/Torrent">
            ⬇
          </a>
        )}
        {result.magnetUrl && (
          <a href={result.magnetUrl} class="btn btn-sm btn-magnet" title="Magnet link">
            🧲
          </a>
        )}
      </td>
    </tr>
  );
};
