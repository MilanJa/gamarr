# Gamarr

A self-hosted web app for tracking upcoming Steam game releases, managing a wishlist, and searching for released games via Prowlarr.

## Features

- **Browse upcoming Steam releases** — paginated, searchable, sortable
- **Wishlist** — save games you're interested in, split into upcoming and released sections
- **Calendar** — monthly and yearly views of wishlisted games with concrete release dates
- **Prowlarr integration** — search your indexers for released games
- **RSS feed** — `/feed/released` provides an RSS feed of released wishlist games with best-guess torrent links from Prowlarr
- **Automatic release date refresh** — checks Steam every 12 hours for updated release dates
- **Configurable scoring** — adjust how the RSS feed ranks torrent results (seeders, age, size, protocol)

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- A [Steam Web API key](https://steamcommunity.com/dev/apikey)
- A [Prowlarr](https://prowlarr.com) instance (for search/RSS features)

## Setup

### 1. Clone and install

```bash
git clone <repo-url> gamarr
cd gamarr
bun install
```

### 2. Configure environment

Copy the sample env file and fill in your keys:

```bash
cp .env.sample .env
```

Edit `.env`:

```env
PROWLARR_URL=http://localhost:9696
PROWLARR_API_KEY=your_prowlarr_api_key
STEAM_WEB_API_KEY=your_steam_web_api_key
PORT=3000
```

| Variable            | Description                                       |
| ------------------- | ------------------------------------------------- |
| `STEAM_WEB_API_KEY` | Get one at https://steamcommunity.com/dev/apikey  |
| `PROWLARR_URL`      | Base URL of your Prowlarr instance                |
| `PROWLARR_API_KEY`  | Prowlarr API key (Settings → General in Prowlarr) |
| `PORT`              | Server port (default: `3000`)                     |

### 3. Run

**Development** (auto-reload on file changes):

```bash
bun run dev
```

**Production**:

```bash
bun run start
```

Open http://localhost:3000 in your browser.

## Docker

### Docker Compose (recommended)

```bash
cp .env.sample .env
# Edit .env with your keys
docker compose up -d
```

### Docker CLI

```bash
docker build -t gamarr .
docker run -d \
  --name gamarr \
  -p 3000:3000 \
  -e STEAM_WEB_API_KEY=your_key \
  -e PROWLARR_URL=http://prowlarr:9696 \
  -e PROWLARR_API_KEY=your_key \
  -v ./data:/app/data \
  gamarr
```

The SQLite database is stored in the `data/` directory. Mount this as a volume to persist data across container restarts.

## RSS Feed

The RSS feed is available at `/feed/released` and returns released wishlist games with the best-guess torrent/download link from Prowlarr. You can subscribe to this URL in any RSS reader or download client that supports RSS.

Scoring parameters for how the "best" result is picked can be adjusted under **Settings → RSS Feed Scoring**.

## Project Structure

```
src/
├── api/          # Steam and Prowlarr API clients
├── db/           # SQLite database and queries
├── jobs/         # Scheduled background tasks
├── public/       # Static CSS and JS
├── routes/       # Hono route handlers
├── types/        # TypeScript type definitions
└── views/        # JSX layout and components
```
