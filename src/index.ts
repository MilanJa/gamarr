import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { config } from "./config";
import { getDb } from "./db/index";
import upcomingRoutes from "./routes/upcoming";
import wishlistRoutes from "./routes/wishlist";
import searchRoutes from "./routes/search";
import settingsRoutes from "./routes/settings";

// Initialize database on startup
getDb();

const app = new Hono();

// Serve static files
app.use("/public/*", serveStatic({ root: "./src/" }));

// Mount routes
app.route("/", upcomingRoutes);
app.route("/", wishlistRoutes);
app.route("/", searchRoutes);
app.route("/", settingsRoutes);

console.log(`🎮 Gamarr running at http://localhost:${config.port}`);

export default {
  port: config.port,
  fetch: app.fetch,
};
