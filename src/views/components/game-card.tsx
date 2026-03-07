import type { FC } from "hono/jsx";
import type { UpcomingGame } from "../../types/steam";

interface GameCardProps {
  game: UpcomingGame;
  wishlisted: boolean;
}

export const GameCard: FC<GameCardProps> = ({ game, wishlisted }) => {
  return (
    <div class="game-card" data-appid={game.appId}>
      <div class="game-card-image">
        <img
          src={game.headerImage}
          alt={game.name}
          loading="lazy"
        />
      </div>
      <div class="game-card-body">
        <h3 class="game-card-title">{game.name}</h3>
        <div class="game-card-meta">
          {game.releaseDate && (
            <span class="release-date">{game.releaseDate}</span>
          )}
          {game.price && <span class="price">{game.price}</span>}
        </div>
        {game.genres && game.genres.length > 0 && (
          <div class="game-card-genres">
            {game.genres.slice(0, 3).map((g) => (
              <span class="genre-tag">{g}</span>
            ))}
          </div>
        )}
        <div class="game-card-actions">
          {wishlisted ? (
            <button
              class="btn btn-wishlisted"
              data-action="remove-wishlist"
              data-appid={game.appId}
              data-name={game.name}
              data-image={game.headerImage}
              data-release={game.releaseDate}
            >
              ★ Wishlisted
            </button>
          ) : (
            <button
              class="btn btn-wishlist"
              data-action="add-wishlist"
              data-appid={game.appId}
              data-name={game.name}
              data-image={game.headerImage}
              data-release={game.releaseDate}
            >
              ☆ Add to Wishlist
            </button>
          )}
          <a
            href={`https://store.steampowered.com/app/${game.appId}`}
            target="_blank"
            class="btn btn-steam"
          >
            Steam ↗
          </a>
        </div>
      </div>
    </div>
  );
};
