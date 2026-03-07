export const config = {
  port: Number(Bun.env.PORT) || 3000,
  prowlarr: {
    url: requireEnv("PROWLARR_URL"),
    apiKey: requireEnv("PROWLARR_API_KEY"),
  },
  steam: {
    webApiKey: requireEnv("STEAM_WEB_API_KEY"),
  },
};

function requireEnv(name: string): string {
  const value = Bun.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
