/**
 * Config loader — pure env vars, no config file in v0.1.
 *
 * Env vars:
 *   LINKEDIN_MCP_CHROME_PROFILE_DIR  Chrome user-data-dir (default ~/.linkedin-mcp/chrome/default)
 *   LINKEDIN_MCP_CDP_PORT            CDP port to attach to (default 9222)
 *   LINKEDIN_MCP_DEFAULT_ACCOUNT     Account label (default "default")
 *   LINKEDIN_MCP_RATE_CONNECT        Daily cap on connection requests (default 20)
 *   LINKEDIN_MCP_RATE_MESSAGE        Daily cap on DMs (default 40)
 *   LINKEDIN_MCP_RATE_VIEW           Daily cap on profile views (default 80)
 *   LINKEDIN_MCP_RATE_PAGES          Daily cap on new tab opens (default 15)
 *   LINKEDIN_MCP_CHROME_PATH         Path to Chrome binary (default macOS app bundle)
 *   LINKEDIN_LI_AT                   Optional li_at cookie fallback if session is stale
 */

import * as os from "os";
import * as path from "path";

export interface Config {
  chromeProfileDir: string;
  cdpPort: number;
  defaultAccount: string;
  chromePath: string;
  rateLimits: {
    connect: number;
    message: number;
    view: number;
    pages_opened: number;
  };
  liAtFallback: string | null;
  lockFile: string;
  rateFile: string;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function expandHome(p: string): string {
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  if (p === "~") return os.homedir();
  return p;
}

export function loadConfig(): Config {
  const chromeProfileDir = expandHome(
    process.env.LINKEDIN_MCP_CHROME_PROFILE_DIR ||
    path.join("~", ".linkedin-mcp", "chrome", "default")
  );

  const chromePath = process.env.LINKEDIN_MCP_CHROME_PATH ||
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : process.platform === "win32"
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : "/usr/bin/google-chrome");

  return {
    chromeProfileDir,
    cdpPort: envInt("LINKEDIN_MCP_CDP_PORT", 9222),
    defaultAccount: process.env.LINKEDIN_MCP_DEFAULT_ACCOUNT || "default",
    chromePath,
    rateLimits: {
      connect: envInt("LINKEDIN_MCP_RATE_CONNECT", 20),
      message: envInt("LINKEDIN_MCP_RATE_MESSAGE", 40),
      view: envInt("LINKEDIN_MCP_RATE_VIEW", 80),
      pages_opened: envInt("LINKEDIN_MCP_RATE_PAGES", 15),
    },
    liAtFallback: process.env.LINKEDIN_LI_AT || null,
    lockFile: path.join(chromeProfileDir, "linkedin.lock"),
    rateFile: path.join(chromeProfileDir, "linkedin-daily-rates.json"),
  };
}

let _cached: Config | null = null;
export function getConfig(): Config {
  if (!_cached) _cached = loadConfig();
  return _cached;
}
