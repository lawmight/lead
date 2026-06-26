/**
 * LinkedIn Client — In-Browser Voyager API
 *
 * Makes Voyager API calls from inside a real Chrome browser via Playwright.
 * LinkedIn can't distinguish these from its own frontend JS, because they ARE
 * its own frontend JS — `page.evaluate()` runs in the linkedin.com origin with
 * all your cookies and headers automatically.
 *
 * Architecture:
 *   1. Playwright connects to Chrome via CDP (chromium.connectOverCDP)
 *   2. All API calls happen inside page.evaluate() — indistinguishable from
 *      LinkedIn's own JS
 *   3. CSRF token extracted from JSESSIONID cookie automatically
 *   4. Optional organic-behavior delays between actions (behavior.ts)
 *
 * NOTE: All logging goes to stderr (console.error). stdout is reserved for
 * the MCP stdio protocol.
 */

import { chromium, type Browser, type Page } from "playwright";
import { spawn, execSync, type ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { getConfig } from "../config.js";
import type {
  Lead,
  VoyagerProfile,
  InvitationResponse,
  ChatResponse,
  MessageResponse,
  EnrichmentData,
} from "./types.js";
import {
  humanDelay,
  thinkingPause,
  actionGap,
  humanScroll,
  randomMouseMove,
  warmupSession,
  feedGlance,
  rateLimitCheck,
  resetLimiter,
} from "./behavior.js";

// ============================================
// Lockfile — prevents multiple MCP servers (or other clients) racing Chrome
// ============================================

const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

function acquireLock(): void {
  const cfg = getConfig();
  try {
    if (fs.existsSync(cfg.lockFile)) {
      const lockData = JSON.parse(fs.readFileSync(cfg.lockFile, "utf-8"));
      const age = Date.now() - lockData.timestamp;
      if (age < LOCK_TIMEOUT_MS && lockData.pid !== process.pid) {
        throw new Error(
          `[linkedin] Another client is using this Chrome profile (PID ${lockData.pid}, started ${Math.round(age / 1000)}s ago).\n` +
          `If this is stale, delete ${cfg.lockFile}`
        );
      }
      console.error(`[linkedin] Stale lock found (${Math.round(age / 1000)}s old) — removing.`);
    }
    fs.mkdirSync(path.dirname(cfg.lockFile), { recursive: true });
    fs.writeFileSync(cfg.lockFile, JSON.stringify({ pid: process.pid, timestamp: Date.now() }));
  } catch (err: any) {
    if (err.message.includes("Another client")) throw err;
    console.error(`[linkedin] Could not acquire lock: ${err.message}`);
  }
}

function releaseLock(): void {
  const cfg = getConfig();
  try {
    if (fs.existsSync(cfg.lockFile)) {
      const lockData = JSON.parse(fs.readFileSync(cfg.lockFile, "utf-8"));
      if (lockData.pid === process.pid) {
        fs.unlinkSync(cfg.lockFile);
      }
    }
  } catch {}
}

// Always release lock on process exit
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
  process.on(signal, () => {
    releaseLock();
    process.exit(1);
  });
}
process.on("exit", () => releaseLock());
process.on("uncaughtException", (err) => {
  console.error("[linkedin] Uncaught exception:", err.message);
  releaseLock();
  process.exit(1);
});

// ============================================
// Daily Rate Tracker — survives across process runs
// ============================================

interface DailyRates {
  date: string;
  connect: number;
  message: number;
  view: number;
  pages_opened: number;
}

function getTodayRates(): DailyRates {
  const cfg = getConfig();
  const today = new Date().toISOString().slice(0, 10);
  try {
    if (fs.existsSync(cfg.rateFile)) {
      const data = JSON.parse(fs.readFileSync(cfg.rateFile, "utf-8")) as DailyRates;
      if (data.date === today) return data;
    }
  } catch {}
  return { date: today, connect: 0, message: 0, view: 0, pages_opened: 0 };
}

function saveDailyRates(rates: DailyRates): void {
  const cfg = getConfig();
  try {
    fs.mkdirSync(path.dirname(cfg.rateFile), { recursive: true });
    fs.writeFileSync(cfg.rateFile, JSON.stringify(rates, null, 2));
  } catch {}
}

export function incrementDailyRate(action: "connect" | "message" | "view" | "pages_opened", count = 1): void {
  const rates = getTodayRates();
  rates[action] += count;
  saveDailyRates(rates);
}

export function checkDailyLimit(action: "connect" | "message" | "view"): void {
  const rates = getTodayRates();
  const limit = getConfig().rateLimits[action];
  if (rates[action] >= limit) {
    throw new Error(
      `[linkedin] Daily ${action} limit reached (${rates[action]}/${limit}). ` +
      `Resume tomorrow. Override via LINKEDIN_MCP_RATE_${action.toUpperCase()} env var.`
    );
  }
  if (rates[action] >= limit * 0.8) {
    console.error(`[linkedin] WARNING: Approaching daily ${action} limit (${rates[action]}/${limit})`);
  }
}

export function getDailyRates(): DailyRates & { limits: Record<string, number> } {
  const rates = getTodayRates();
  return { ...rates, limits: getConfig().rateLimits };
}

export function checkRateLimit(action: "connect" | "message" | "view"): { canDo: boolean; used: number; limit: number; remaining: number } {
  const rates = getTodayRates();
  const limit = getConfig().rateLimits[action];
  const used = rates[action];
  return { canDo: used < limit, used, limit, remaining: Math.max(0, limit - used) };
}

// ============================================
// Chrome session management
// ============================================

const PROFILE_DECORATION = "com.linkedin.voyager.dash.deco.identity.profile.TopCardSupplementary-166";

interface ChromeSession {
  browser: Browser | null;
  chrome: ChildProcess | null;
  page: Page | null;
  warmedUp: boolean;
}

let _session: ChromeSession = { browser: null, chrome: null, page: null, warmedUp: false };

/**
 * Clean up stale Singleton* symlinks left by a prior Chrome that exited uncleanly.
 */
function cleanupStaleSingletonLocks(profileDir: string): void {
  const lockPath = path.join(profileDir, "SingletonLock");
  if (!fs.existsSync(lockPath)) return;
  let pid: number | null = null;
  try {
    const target = fs.readlinkSync(lockPath);
    const match = target.match(/-(\d+)$/);
    if (match) pid = parseInt(match[1], 10);
  } catch {
    return;
  }
  if (!pid) return;
  let alive = false;
  try {
    process.kill(pid, 0);
    alive = true;
  } catch {
    alive = false;
  }
  if (alive) return;
  for (const name of ["SingletonLock", "SingletonCookie", "SingletonSocket"]) {
    try { fs.unlinkSync(path.join(profileDir, name)); } catch {}
  }
  console.error(`[linkedin] Removed stale SingletonLock (dead PID ${pid}) from ${profileDir}`);
}

/**
 * If the CDP port is held by a Chrome with a different --user-data-dir,
 * detect it and surface the conflict.
 */
function findForeignChromeOnPort(port: number, ourDir: string): { pid: number; dir: string } | null {
  if (process.platform !== "darwin") return null;
  try {
    const pids = execSync(`lsof -t -i :${port} 2>/dev/null`, { encoding: "utf-8" })
      .trim().split("\n").filter(Boolean).map(s => parseInt(s, 10));
    for (const pid of pids) {
      const cmd = execSync(`ps -p ${pid} -o command=`, { encoding: "utf-8" }).trim();
      const match = cmd.match(/--user-data-dir=([^\s]+)/);
      const dir = match ? match[1] : "";
      if (dir && path.resolve(dir) !== path.resolve(ourDir)) {
        return { pid, dir };
      }
    }
  } catch {}
  return null;
}

/**
 * Launch (or attach to) Chrome and return a page on LinkedIn.
 *
 * SAFETY:
 *  - Acquires a lockfile to prevent concurrent automation
 *  - Cleans up stale SingletonLock from prior uncleanly-exited Chrome
 *  - Detects port collisions with a foreign Chrome (different profile)
 *  - Reuses existing LinkedIn tabs instead of opening new ones
 *  - Caps daily tab opens to prevent 429s
 */
export async function getLinkedInPage(options?: { warmup?: boolean }): Promise<Page> {
  const cfg = getConfig();

  if (_session.page && !_session.page.isClosed()) {
    return _session.page;
  }

  acquireLock();

  console.error(`[linkedin] Attaching to Chrome (port ${cfg.cdpPort})...`);

  let connected = false;
  try {
    _session.browser = await chromium.connectOverCDP(`http://127.0.0.1:${cfg.cdpPort}`);
    console.error(`[linkedin] Connected to existing Chrome.`);
    connected = true;
  } catch {
    // fall through to spawn path
  }

  if (!connected) {
    const foreign = findForeignChromeOnPort(cfg.cdpPort, cfg.chromeProfileDir);
    if (foreign) {
      releaseLock();
      throw new Error(
        `[linkedin] Port ${cfg.cdpPort} is held by a foreign Chrome (PID ${foreign.pid}, ` +
        `user-data-dir=${foreign.dir}). Expected ${cfg.chromeProfileDir}. ` +
        `Kill the foreign Chrome (kill ${foreign.pid}) or change LINKEDIN_MCP_CDP_PORT, then retry.`
      );
    }

    cleanupStaleSingletonLocks(cfg.chromeProfileDir);

    const logPath = path.join(cfg.chromeProfileDir, "chrome-launch.log");
    try { fs.mkdirSync(cfg.chromeProfileDir, { recursive: true }); } catch {}
    const logFd = (() => { try { return fs.openSync(logPath, "a"); } catch { return "ignore" as const; } })();

    _session.chrome = spawn(cfg.chromePath, [
      `--user-data-dir=${cfg.chromeProfileDir}`,
      `--remote-debugging-port=${cfg.cdpPort}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--window-size=1280,900",
    ], { stdio: ["ignore", logFd, logFd] as any, detached: true });

    for (let attempt = 0; attempt < 15; attempt++) {
      await sleep(1500);
      try {
        _session.browser = await chromium.connectOverCDP(`http://127.0.0.1:${cfg.cdpPort}`);
        break;
      } catch {
        if (attempt === 14) {
          releaseLock();
          let tail = "";
          try {
            const data = fs.readFileSync(logPath, "utf-8");
            tail = data.split("\n").slice(-15).join("\n");
          } catch {}
          throw new Error(
            `Could not connect to Chrome (port ${cfg.cdpPort}) after 22s.\n` +
            `user-data-dir: ${cfg.chromeProfileDir}\n` +
            `Launch log tail (${logPath}):\n${tail || "(no output)"}`
          );
        }
      }
    }
  }

  const context = _session.browser!.contexts()[0];

  // Reuse existing LinkedIn tab if possible — opening new tabs is what triggers 429.
  const existingPages = context.pages();
  const linkedInPage = existingPages.find(p => {
    const url = p.url();
    return url.includes("linkedin.com") && !url.includes("chrome-error") && !url.includes("about:blank");
  });

  if (linkedInPage) {
    console.error(`[linkedin] Reusing existing LinkedIn tab.`);
    _session.page = linkedInPage;
  } else {
    const rates = getTodayRates();
    if (rates.pages_opened >= cfg.rateLimits.pages_opened) {
      releaseLock();
      throw new Error(
        `[linkedin] Daily page open limit reached (${rates.pages_opened}/${cfg.rateLimits.pages_opened}). ` +
        `Too many tabs triggers 429. Use an existing Chrome tab or wait until tomorrow.`
      );
    }
    _session.page = await context.newPage();
    incrementDailyRate("pages_opened");
    console.error(`[linkedin] Opened new tab (${rates.pages_opened + 1}/${cfg.rateLimits.pages_opened} today).`);
  }

  const currentUrl = _session.page.url();
  if (!currentUrl.includes("linkedin.com/") || currentUrl.includes("/login") || currentUrl.includes("/authwall")) {
    console.error(`[linkedin] Navigating to LinkedIn...`);
    try {
      await _session.page.goto("https://www.linkedin.com/feed/", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    } catch (navErr: any) {
      if (navErr.message?.includes("ERR_HTTP_RESPONSE_CODE_FAILURE") ||
          navErr.message?.includes("ERR_TOO_MANY_REDIRECTS")) {
        console.error(`[linkedin] Stale cookies. Re-establishing session...`);
        try { await context.clearCookies(); } catch {}
        try {
          await _session.page.goto("https://www.linkedin.com/login", {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
        } catch {}
        if (cfg.liAtFallback) {
          await context.addCookies([
            { name: "li_at", value: cfg.liAtFallback, domain: ".linkedin.com", path: "/", httpOnly: true, secure: true, sameSite: "None" as const },
          ]);
        } else {
          console.error(`[linkedin] No LINKEDIN_LI_AT fallback set — relying on Chrome's saved session. If this fails, log in manually.`);
        }
        await _session.page.goto("https://www.linkedin.com/feed/", {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
      } else {
        releaseLock();
        throw navErr;
      }
    }
    await humanDelay(2000, 4000);
  } else {
    console.error(`[linkedin] Already on LinkedIn (${currentUrl.slice(0, 60)}...)`);
  }

  const url = _session.page.url();
  if (url.includes("/login") || url.includes("/authwall") || url.includes("/checkpoint") || url.includes("chrome-error")) {
    releaseLock();
    throw new Error(
      `Not logged in to LinkedIn. The session may be expired.\n` +
      `1. Open Chrome with: "${cfg.chromePath}" --user-data-dir="${cfg.chromeProfileDir}"\n` +
      `2. Log in to LinkedIn manually\n` +
      `3. Close Chrome and retry`
    );
  }

  console.error(`[linkedin] Connected and logged in.`);

  if (options?.warmup && !_session.warmedUp) {
    await warmupSession(_session.page);
    _session.warmedUp = true;
    resetLimiter();
  }

  return _session.page;
}

/**
 * Get the current user's fsd_profile ID (the ACoAA... hash).
 * Cached after first lookup. Extracted from localStorage or HTML frequency analysis
 * since /me no longer exposes it directly.
 */
let _selfFsdIdCache: string | null = null;

export async function getSelfFsdProfileId(): Promise<string> {
  if (_selfFsdIdCache) return _selfFsdIdCache;

  const page = await getLinkedInPage();

  // Retry — on a fresh page the localStorage badges + HTML hash references may
  // not be populated yet. Two attempts with a short wait covers the race.
  let lastResult: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(2000);

    lastResult = await page.evaluate(`
      (function() {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i) || "";
            if (k.startsWith("voyager-web:badges=")) {
              const id = k.slice("voyager-web:badges=".length);
              if (id.startsWith("ACoAA")) return { id, source: "localStorage" };
            }
            const v = localStorage.getItem(k) || "";
            const m = v.match(/ACoAA[A-Za-z0-9_-]{5,}/);
            if (m && k.includes("msg-overlay")) return { id: m[0], source: "localStorage-value" };
          }
        } catch {}

        try {
          const html = document.documentElement.outerHTML;
          const matches = html.match(/ACoAA[A-Za-z0-9_-]{5,}/g) || [];
          const freq = {};
          for (const m of matches) freq[m] = (freq[m] || 0) + 1;
          const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
          if (sorted.length && sorted[0][1] >= 2) return { id: sorted[0][0], source: "html-freq" };
        } catch {}

        return null;
      })()
    `);

    if (lastResult?.id) break;
  }

  if (!lastResult?.id) {
    throw new Error(`[linkedin] Could not determine self fsd_profile ID after 3 attempts — make sure Chrome is logged in and on a LinkedIn page`);
  }

  _selfFsdIdCache = lastResult.id;
  console.error(`[linkedin] Self fsd_profile: ${lastResult.id} (via ${lastResult.source})`);
  return lastResult.id;
}

/**
 * Make a Voyager API call from inside the browser context.
 * Uses fetch() inside the page — has all cookies/headers automatically.
 */
async function voyagerFetch(
  page: Page,
  path: string,
  options?: { method?: string; body?: any }
): Promise<any> {
  const method = options?.method || "GET";
  const bodyJson = options?.body ? JSON.stringify(options.body) : undefined;

  const script = `
    (async () => {
      try {
        const csrfToken = document.cookie
          .split("; ")
          .find(c => c.startsWith("JSESSIONID="))
          ?.split("=")[1]
          ?.replace(/"/g, "") || "";

        const fetchOpts = {
          method: "${method}",
          headers: {
            "accept": "application/vnd.linkedin.normalized+json+2.1",
            "x-restli-protocol-version": "2.0.0",
            "x-li-lang": "en_US",
            "csrf-token": csrfToken,
          },
        };

        ${method !== "GET" && bodyJson ? `
        fetchOpts.headers["content-type"] = "application/json";
        fetchOpts.body = ${JSON.stringify(bodyJson)};
        ` : ""}

        const res = await fetch("/voyager/api${path}", fetchOpts);

        if (!res.ok) {
          const text = await res.text();
          return { __error: true, status: res.status, body: text };
        }

        const text = await res.text();
        try { return JSON.parse(text); }
        catch { return { __raw: text }; }
      } catch (err) {
        return { __error: true, status: 0, body: String(err) };
      }
    })()
  `;

  const result = await page.evaluate(script) as any;

  if (result?.__error) {
    throw new Error(`Voyager ${method} ${path} failed: ${result.status} - ${String(result.body).slice(0, 200)}`);
  }

  return result;
}

// ============================================
// Profile lookup
// ============================================

export async function getProfile(identifier: string): Promise<VoyagerProfile | null> {
  const publicId = extractLinkedInId(identifier);
  console.error(`[linkedin] Fetching profile: ${publicId}`);

  const page = await getLinkedInPage();

  try {
    const profileData = await voyagerFetch(
      page,
      `/identity/dash/profiles?q=memberIdentity&memberIdentity=${encodeURIComponent(publicId)}&decorationId=${PROFILE_DECORATION}`
    );
    return parseDashProfile(publicId, profileData);
  } catch (err: any) {
    console.error(`[linkedin] Profile fetch failed: ${err.message}`);
    return null;
  }
}

export async function enrichLead(lead: Lead): Promise<Lead> {
  if (!lead.linkedinUrl && !lead.linkedinId) {
    return lead;
  }
  const page = await getLinkedInPage();
  await rateLimitCheck(page, "view");

  const profile = await getProfile(lead.linkedinUrl || lead.linkedinId!);
  if (!profile) return lead;

  await thinkingPause();

  const enrichmentData: EnrichmentData = {
    summary: profile.summary,
    followerCount: profile.follower_count,
    connectionsCount: profile.connections_count,
    isPremium: profile.is_premium,
    isOpenToWork: profile.is_open_to_work,
    isHiring: profile.is_hiring,
    canSendInmail: profile.can_send_inmail,
    networkDistance: profile.network_distance,
    emails: profile.contact_info?.emails || [],
    phones: profile.contact_info?.phones || [],
    workExperience: profile.work_experience?.map((exp) => ({
      position: exp.position,
      company: exp.company,
      companyId: exp.company_id,
      location: exp.location,
      description: exp.description,
      current: exp.current,
      start: exp.start,
      end: exp.end,
    })),
    education: profile.education?.map((edu) => ({
      degree: edu.degree,
      school: edu.school,
      fieldOfStudy: edu.field_of_study,
      start: edu.start,
      end: edu.end,
    })),
    skills: profile.skills?.map((skill) => ({
      name: skill.name,
      endorsementCount: skill.endorsement_count,
    })),
  };

  return {
    ...lead,
    linkedinId: profile.provider_id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    fullName: `${profile.first_name} ${profile.last_name}`,
    headline: profile.headline,
    location: profile.location,
    profilePictureUrl: profile.profile_picture_url,
    email: enrichmentData.emails?.[0],
    phone: enrichmentData.phones?.[0],
    enrichmentData,
    enrichedAt: new Date(),
  };
}

// ============================================
// Connection requests
// ============================================

export async function sendConnectionRequest(
  providerId: string,
  message?: string
): Promise<InvitationResponse> {
  checkDailyLimit("connect");

  console.error(`[linkedin] Sending connection request to: ${providerId}`);

  const page = await getLinkedInPage();
  await rateLimitCheck(page, "connect");

  if (Math.random() < 0.5) {
    await feedGlance(page);
  }
  await randomMouseMove(page);
  await humanDelay(1000, 3000);

  let profileUrn: string;
  if (providerId.startsWith("urn:")) {
    profileUrn = providerId;
  } else if (providerId.startsWith("ACoAA")) {
    profileUrn = `urn:li:fsd_profile:${providerId}`;
  } else {
    console.error(`[linkedin] Resolving slug "${providerId}" to URN...`);
    const profile = await getProfile(providerId);
    if (!profile?.provider_id) {
      throw new Error(`Could not resolve slug "${providerId}" to a profile URN`);
    }
    profileUrn = `urn:li:fsd_profile:${profile.provider_id}`;
    console.error(`[linkedin] Resolved to: ${profileUrn}`);
  }

  const body: any = { inviteeProfileUrn: profileUrn };
  if (message) body.customMessage = message;

  const result = await voyagerFetch(
    page,
    `/voyagerRelationshipsDashMemberRelationships?action=verifyQuotaAndCreate`,
    { method: "POST", body }
  );

  const invitationId = result?.data?.value?.invitationUrn ||
    result?.value?.invitationUrn || "sent";

  console.error(`[linkedin] Connection request sent! Invitation: ${invitationId}`);
  incrementDailyRate("connect");
  await actionGap();

  return { object: "UserInvitationSent", invitation_id: invitationId };
}

// ============================================
// Messaging — send via browser UI (Voyager messaging create endpoint is 403)
// ============================================

export async function startChat(
  attendeeId: string,
  text: string
): Promise<ChatResponse> {
  checkDailyLimit("message");

  console.error(`[linkedin] Starting chat with: ${attendeeId}`);

  const page = await getLinkedInPage();
  await rateLimitCheck(page, "message");

  await randomMouseMove(page);
  await humanDelay(1000, 2000);

  const result = await startChatViaUI(page, attendeeId, text);

  incrementDailyRate("message");
  await actionGap();
  return result;
}

async function startChatViaUI(
  page: Page,
  attendeeId: string,
  text: string
): Promise<ChatResponse> {
  const isSlug = !attendeeId.startsWith("urn:") && !attendeeId.startsWith("ACoAA");

  if (isSlug) {
    // 2026-05-24: the profile-action Message button is now an <a> often
    // covered by promo/ad SVGs that intercept pointer events. Bypass the
    // click entirely by navigating directly to the compose URL — that's what
    // the Message link's href points to anyway.
    //   /messaging/compose/?profileUrn={urn}&recipient={fsd_id}&interop=msgOverlay
    console.error(`[linkedin] UI: resolving slug ${attendeeId} for direct compose URL...`);
    const profile = await getProfile(attendeeId);
    if (!profile?.provider_id) {
      throw new Error(`Could not resolve slug "${attendeeId}" to a profile ID`);
    }
    const fsdId = profile.provider_id;
    const composeUrl = `https://www.linkedin.com/messaging/compose/?profileUrn=urn%3Ali%3Afsd_profile%3A${fsdId}&recipient=${fsdId}&screenContext=NON_SELF_PROFILE_VIEW&interop=msgOverlay`;
    console.error(`[linkedin] UI: navigating directly to compose ${composeUrl.slice(0, 100)}...`);
    await page.goto(composeUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await humanDelay(3500, 5500);

    // The compose overlay should now be open
    try {
      await page.waitForSelector('[contenteditable], [role="textbox"]', { timeout: 10000 });
    } catch {
      throw new Error("Compose overlay never appeared after navigating to compose URL");
    }
  } else if (attendeeId.startsWith("ACoAA")) {
    // Direct compose URL for an fsd_profile id
    const composeUrl = `https://www.linkedin.com/messaging/compose/?profileUrn=urn%3Ali%3Afsd_profile%3A${attendeeId}&recipient=${attendeeId}&interop=msgOverlay`;
    console.error(`[linkedin] UI: direct compose URL for fsd id ${attendeeId}`);
    await page.goto(composeUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await humanDelay(3500, 5500);
    await page.waitForSelector('[contenteditable], [role="textbox"]', { timeout: 10000 });
  } else {
    console.error(`[linkedin] UI: opening new message thread`);
    await page.goto("https://www.linkedin.com/messaging/thread/new/", {
      waitUntil: "commit",
      timeout: 20000,
    });
    await humanDelay(4000, 6000);

    const recipientInput = page.locator('input[name="sessionHeroInput"], input[placeholder*="name"], input[aria-label*="name"], input[aria-label*="search"]').first();
    try {
      await recipientInput.click({ timeout: 8000 });
    } catch {
      await page.locator('.msg-connections-typeahead input, input[type="text"]').first().click({ timeout: 5000 });
    }
    await humanDelay(300, 600);
    await page.keyboard.type(attendeeId, { delay: 40 + Math.random() * 30 });
    await humanDelay(2000, 3000);

    const suggestion = page.locator('[role="option"], [role="listbox"] li').first();
    await suggestion.click({ timeout: 8000 });
    await humanDelay(1500, 2500);
  }

  // Pre-action: count messages BEFORE (for send verification)
  const beforeCount = await page.evaluate(`document.querySelectorAll('.msg-s-event-listitem').length`) as number;

  // Find the COMPOSE box specifically — must be inside a .msg-form / message form container.
  // Excludes the invitation-reply chip area and any other contenteditable on the page.
  const composeFound = await page.evaluate(`
    (function() {
      // Prefer .msg-form__contenteditable (the specific class LinkedIn uses for compose).
      var candidates = document.querySelectorAll('.msg-form__contenteditable, .msg-form [contenteditable="true"], [aria-label="Write a message…"], [aria-label="Write a message..."], [aria-label^="Write a message"]');
      for (var i = candidates.length - 1; i >= 0; i--) {
        var el = candidates[i];
        if (el.offsetParent === null) continue;
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        return { tag: el.tagName, cls: el.className.toString().slice(0, 80), aria: el.getAttribute('aria-label') || '' };
      }
      return null;
    })()
  `) as any;

  if (!composeFound) {
    throw new Error("Could not find the message compose box (.msg-form__contenteditable) on the page");
  }
  console.error(`[linkedin] UI: found compose box ${JSON.stringify(composeFound)}`);
  await humanDelay(400, 700);

  // Focus + insert via execCommand. Targets the SAME element identified above.
  const typed = await page.evaluate(`
    (function() {
      var candidates = document.querySelectorAll('.msg-form__contenteditable, .msg-form [contenteditable="true"], [aria-label="Write a message…"], [aria-label="Write a message..."], [aria-label^="Write a message"]');
      var editor = null;
      for (var i = candidates.length - 1; i >= 0; i--) {
        if (candidates[i].offsetParent !== null) { editor = candidates[i]; break; }
      }
      if (!editor) return { ok: false, reason: "no editor" };
      editor.focus();
      // Place caret inside
      var sel = window.getSelection();
      var range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('selectAll', false);
      document.execCommand('delete', false);
      var ok = document.execCommand('insertText', false, ${JSON.stringify(text)});
      // Some LinkedIn forms need an explicit InputEvent to re-enable Send
      try {
        editor.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: ${JSON.stringify(text)} }));
      } catch (e) {}
      return { ok: ok, textLength: (editor.innerText || '').length };
    })()
  `) as any;
  console.error(`[linkedin] UI: typed ${typed.textLength} chars (execCommand ok=${typed.ok})`);

  // Fallback if execCommand didn't seat text — use keyboard.type() with focus on the compose box
  if (!typed.textLength || typed.textLength < text.length / 2) {
    console.error(`[linkedin] UI: execCommand under-typed — falling back to keyboard.type`);
    // Click the compose box explicitly and type via keyboard
    const fallbackBox = page.locator('.msg-form__contenteditable, .msg-form [contenteditable="true"]').last();
    await fallbackBox.click({ force: true, timeout: 5000 });
    await humanDelay(300, 500);
    await page.keyboard.type(text, { delay: 30 });
    await humanDelay(400, 700);
  }

  await humanDelay(700, 1200);

  // Find the Send button INSIDE the msg-form container (not a random global Send).
  // Wait briefly for it to enable.
  let sendClicked = false;
  for (let attempt = 0; attempt < 4; attempt++) {
    const result = await page.evaluate(`
      (function() {
        // Scope to the form that contains our compose box
        var forms = document.querySelectorAll('.msg-form, [data-test-id*="msg-form"], form[class*="msg-form"]');
        var candidates = [];
        for (var f = 0; f < forms.length; f++) {
          var btns = forms[f].querySelectorAll('button');
          for (var i = 0; i < btns.length; i++) candidates.push(btns[i]);
        }
        // Also catch global send buttons
        var globalBtns = document.querySelectorAll('button.msg-form__send-button, button[class*="msg-form__send-button"]');
        for (var i = 0; i < globalBtns.length; i++) candidates.push(globalBtns[i]);
        for (var i = 0; i < candidates.length; i++) {
          var b = candidates[i];
          if (b.offsetParent === null) continue;
          var cls = (b.className || '').toString();
          var txt = (b.innerText || '').trim().toLowerCase();
          // Match the send button: either by class or by literal "Send" text
          var isSend = cls.includes('send-button') || txt === 'send';
          if (!isSend) continue;
          return { found: true, disabled: !!b.disabled, cls: cls.slice(0, 60), txt: txt };
        }
        return { found: false };
      })()
    `) as any;

    if (!result.found) {
      console.error(`[linkedin] UI: no send button found yet (attempt ${attempt + 1})`);
      await humanDelay(800, 1200);
      continue;
    }
    if (result.disabled) {
      console.error(`[linkedin] UI: send button disabled (attempt ${attempt + 1}) cls="${result.cls}"`);
      await humanDelay(800, 1200);
      continue;
    }
    // Found and enabled — click it
    const clickRes = await page.evaluate(`
      (function() {
        var forms = document.querySelectorAll('.msg-form, [data-test-id*="msg-form"], form[class*="msg-form"]');
        var candidates = [];
        for (var f = 0; f < forms.length; f++) {
          var btns = forms[f].querySelectorAll('button');
          for (var i = 0; i < btns.length; i++) candidates.push(btns[i]);
        }
        var globalBtns = document.querySelectorAll('button.msg-form__send-button, button[class*="msg-form__send-button"]');
        for (var i = 0; i < globalBtns.length; i++) candidates.push(globalBtns[i]);
        for (var i = 0; i < candidates.length; i++) {
          var b = candidates[i];
          if (b.offsetParent === null || b.disabled) continue;
          var cls = (b.className || '').toString();
          var txt = (b.innerText || '').trim().toLowerCase();
          if (cls.includes('send-button') || txt === 'send') {
            b.scrollIntoView({ block: 'center' });
            b.click();
            return 'clicked';
          }
        }
        return 'not-found-on-click';
      })()
    `);
    console.error(`[linkedin] UI: send → ${clickRes}`);
    sendClicked = clickRes === 'clicked';
    break;
  }

  if (!sendClicked) {
    console.error(`[linkedin] UI: send button never enabled — trying Cmd+Enter / Enter`);
    // Last resort: keyboard shortcut
    await page.keyboard.press("Meta+Enter").catch(() => {});
    await page.keyboard.press("Enter").catch(() => {});
  }

  await humanDelay(3000, 4500);

  // Post-action: verify by counting messages AFTER
  const afterCount = await page.evaluate(`document.querySelectorAll('.msg-s-event-listitem').length`) as number;
  const verified = afterCount > beforeCount;

  console.error(`[linkedin] UI: message ${verified ? "sent (verified " + beforeCount + "→" + afterCount + ")" : "NOT VERIFIED (" + beforeCount + "→" + afterCount + ")"}`);

  if (!verified) {
    throw new Error(`Message send not verified — DOM count went from ${beforeCount} to ${afterCount}. Message may not have landed.`);
  }

  return {
    object: "Chat",
    chat_id: `ui-sent-${Date.now()}`,
  };
}

/**
 * Send a message in an existing conversation (by conversation backend URN).
 * Uses Voyager messaging events endpoint — works for existing threads.
 */
export async function sendMessage(
  chatId: string,
  text: string
): Promise<MessageResponse> {
  checkDailyLimit("message");
  console.error(`[linkedin] Sending message to chat: ${chatId}`);

  const page = await getLinkedInPage();
  await rateLimitCheck(page, "message");
  await humanDelay(500, 1500);

  const body = {
    eventCreate: {
      value: {
        "com.linkedin.voyager.messaging.create.MessageCreate": {
          attributedBody: { text, attributes: [] },
        },
      },
    },
  };

  const result = await voyagerFetch(
    page,
    `/messaging/conversations/${encodeURIComponent(chatId)}/events?action=create`,
    { method: "POST", body }
  );

  incrementDailyRate("message");
  await actionGap();

  return {
    object: "Message",
    message_id: result?.value || "sent",
  };
}

// ============================================
// Inbox (messenger GraphQL)
// ============================================

export interface NormalizedParticipant {
  fsdProfileId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  headline: string;
  profileUrl: string;
  participantUrn: string;
  distance: string;
}

export interface NormalizedConversation {
  conversationUrn: string;
  backendUrn: string;
  participants: NormalizedParticipant[];
  lastMessage: {
    text: string;
    deliveredAt: number;
    senderParticipantUrn: string;
    isFromSelf: boolean;
  } | null;
  lastActivityAt: number;
  unreadCount: number;
  categories: string[];
}

const MESSENGER_CONVERSATIONS_PAGED_QUERY_ID = "messengerConversations.9501074288a12f3ae9e3c7ea243bccbf";

function parseMessengerInbox(
  data: any,
  selfFsdProfileId: string
): { items: NormalizedConversation[]; nextCursor: string | null } {
  const included: any[] = data?.included || [];
  const rootObj: any = data?.data?.data || {};
  const rootKey = Object.keys(rootObj).find((k) => k.startsWith("messengerConversations"));
  const root = rootKey ? rootObj[rootKey] : null;
  const conversationOrder: string[] = root?.["*elements"] || [];
  const nextCursor: string | null = root?.metadata?.nextCursor || null;

  const participants = new Map<string, any>();
  const messages = new Map<string, any>();
  const conversations = new Map<string, any>();

  for (const inc of included) {
    const t = inc?.["$type"] || "";
    if (t === "com.linkedin.messenger.MessagingParticipant") {
      participants.set(inc.entityUrn, inc);
    } else if (t === "com.linkedin.messenger.Message") {
      messages.set(inc.entityUrn, inc);
    } else if (t === "com.linkedin.messenger.Conversation") {
      conversations.set(inc.entityUrn, inc);
    }
  }

  const normalizeParticipant = (p: any): NormalizedParticipant => {
    const member = p?.participantType?.member || {};
    const fsdProfileId = (p?.hostIdentityUrn || "").replace("urn:li:fsd_profile:", "");
    return {
      fsdProfileId,
      firstName: (member.firstName?.text || "").trim(),
      lastName: (member.lastName?.text || "").trim(),
      fullName: `${(member.firstName?.text || "").trim()} ${(member.lastName?.text || "").trim()}`.trim(),
      headline: member.headline?.text || "",
      profileUrl: member.profileUrl || "",
      participantUrn: p.entityUrn || "",
      distance: member.distance || "",
    };
  };

  const conversationsOut: NormalizedConversation[] = [];
  for (const convUrn of conversationOrder) {
    const conv = conversations.get(convUrn);
    if (!conv) continue;

    const participantUrns: string[] = conv?.["*conversationParticipants"] || [];
    const allParticipants = participantUrns
      .map((urn) => participants.get(urn))
      .filter(Boolean)
      .map(normalizeParticipant);

    const others = allParticipants.filter((p) => p.fsdProfileId !== selfFsdProfileId);

    let lastMessage: NormalizedConversation["lastMessage"] = null;
    let bestDeliveredAt = 0;
    for (const msg of messages.values()) {
      if (msg?.["*conversation"] !== convUrn) continue;
      const delivered = msg.deliveredAt || 0;
      if (delivered > bestDeliveredAt) {
        bestDeliveredAt = delivered;
        const senderUrn: string = msg?.["*sender"] || "";
        const senderFsdId = senderUrn.split("urn:li:fsd_profile:").pop() || "";
        lastMessage = {
          text: msg?.body?.text || "",
          deliveredAt: delivered,
          senderParticipantUrn: senderUrn,
          isFromSelf: senderFsdId === selfFsdProfileId,
        };
      }
    }

    conversationsOut.push({
      conversationUrn: convUrn,
      backendUrn: conv.backendUrn || "",
      participants: others,
      lastMessage,
      lastActivityAt: conv.lastActivityAt || 0,
      unreadCount: conv.unreadCount || 0,
      categories: conv.categories || [],
    });
  }

  return { items: conversationsOut, nextCursor };
}

async function fetchConversationsPage(
  selfId: string,
  opts: { count?: number; lastUpdatedBefore?: number; nextCursor?: string }
): Promise<{ items: NormalizedConversation[]; nextCursor: string | null }> {
  const page = await getLinkedInPage();
  const count = opts.count ?? 20;
  const mailbox = `urn%3Ali%3Afsd_profile%3A${selfId}`;
  const cursorPart = opts.nextCursor
    ? `nextCursor:${encodeURIComponent(opts.nextCursor)}`
    : `lastUpdatedBefore:${opts.lastUpdatedBefore ?? Date.now()}`;
  const vars = `(query:(predicateUnions:List((conversationCategoryPredicate:(category:PRIMARY_INBOX)))),count:${count},mailboxUrn:${mailbox},${cursorPart})`;
  const path = `/voyagerMessagingGraphQL/graphql?queryId=${MESSENGER_CONVERSATIONS_PAGED_QUERY_ID}&variables=${vars}`;
  const data = await voyagerFetch(page, path);
  return parseMessengerInbox(data, selfId);
}

export async function listChats(
  options?: { limit?: number; cursor?: string }
): Promise<NormalizedConversation[]> {
  const { items } = await listChatsPaginated(options);
  return items;
}

export async function listChatsPaginated(
  options?: { limit?: number; cursor?: string }
): Promise<{ items: NormalizedConversation[]; cursor?: string }> {
  const selfId = await getSelfFsdProfileId();
  const limit = options?.limit ?? 20;

  const collected: NormalizedConversation[] = [];
  const seenUrns = new Set<string>();
  let nextCursor: string | undefined = options?.cursor;

  while (collected.length < limit) {
    const remaining = limit - collected.length;
    const pageSize = Math.min(20, remaining);
    const fetchOpts: { count: number; lastUpdatedBefore?: number; nextCursor?: string } = { count: pageSize };
    if (nextCursor) fetchOpts.nextCursor = nextCursor;
    else fetchOpts.lastUpdatedBefore = Date.now();

    const page = await fetchConversationsPage(selfId, fetchOpts);
    if (page.items.length === 0) break;

    for (const c of page.items) {
      if (seenUrns.has(c.conversationUrn)) continue;
      seenUrns.add(c.conversationUrn);
      collected.push(c);
      if (collected.length >= limit) break;
    }

    if (!page.nextCursor) break;
    nextCursor = page.nextCursor;
  }

  return { items: collected, cursor: nextCursor };
}

// ============================================
// Posting
// ============================================

const SHARE_QUERY_ID = "voyagerContentcreationDashShares.279996efa5064c01775d5aff003d9377";

export async function createPost(text: string): Promise<any> {
  console.error(`[linkedin] Creating post...`);
  const page = await getLinkedInPage();

  const body = {
    variables: {
      post: {
        allowedCommentersScope: "ALL",
        intendedShareLifeCycleState: "PUBLISHED",
        origin: "FEED",
        visibilityDataUnion: { visibilityType: "ANYONE" },
        commentary: { text, attributesV2: [] },
      },
    },
    queryId: SHARE_QUERY_ID,
  };

  return voyagerFetch(page, `/graphql?action=execute&queryId=${SHARE_QUERY_ID}`, { method: "POST", body });
}

// ============================================
// Recent connections
// ============================================

export interface RecentConnection {
  name: string;
  slug: string;
  headline: string;
  profileUrl: string;
  entityUrn: string;
  connectedAt?: string;
}

export async function getRecentConnections(count: number = 40): Promise<RecentConnection[]> {
  console.error(`[linkedin] Fetching ${count} recent connections...`);
  const page = await getLinkedInPage();

  const result = await voyagerFetch(
    page,
    `/relationships/connections?start=0&count=${count}&sortType=RECENTLY_ADDED`
  );

  const included = result?.included || [];
  const miniProfiles = new Map<string, any>();
  for (const inc of included) {
    if (inc?.["$type"] === "com.linkedin.voyager.identity.shared.MiniProfile" && inc?.entityUrn) {
      miniProfiles.set(inc.entityUrn, inc);
    }
  }

  const connections: RecentConnection[] = [];
  for (const inc of included) {
    if (inc?.["$type"] !== "com.linkedin.voyager.relationships.shared.connection.Connection") continue;
    const miniUrn = inc?.["*miniProfile"];
    const mp = miniUrn ? miniProfiles.get(miniUrn) : null;
    if (!mp) continue;
    const slug = mp.publicIdentifier || "";
    if (!slug) continue;

    connections.push({
      name: `${mp.firstName || ""} ${mp.lastName || ""}`.trim(),
      slug,
      headline: mp.occupation || mp.headline || "",
      profileUrl: `https://www.linkedin.com/in/${slug}`,
      entityUrn: mp.dashEntityUrn || mp.entityUrn || "",
      connectedAt: inc.createdAt ? new Date(inc.createdAt).toISOString() : undefined,
    });
  }

  connections.sort((a, b) => {
    const at = a.connectedAt ? new Date(a.connectedAt).getTime() : 0;
    const bt = b.connectedAt ? new Date(b.connectedAt).getTime() : 0;
    return bt - at;
  });

  console.error(`[linkedin] Found ${connections.length} recent connections`);
  return connections;
}

export async function getAllConnections(
  totalCount: number = 2000,
  pageSize: number = 500
): Promise<RecentConnection[]> {
  const page = await getLinkedInPage();
  const seen = new Set<string>();
  const all: RecentConnection[] = [];

  for (let start = 0; start < totalCount; start += pageSize) {
    const count = Math.min(pageSize, totalCount - start);
    console.error(`[linkedin] Fetching connections page start=${start} count=${count}...`);

    const result = await voyagerFetch(
      page,
      `/relationships/connections?start=${start}&count=${count}&sortType=RECENTLY_ADDED`
    );

    const included = result?.included || [];
    const miniProfiles = new Map<string, any>();
    for (const inc of included) {
      if (inc?.["$type"] === "com.linkedin.voyager.identity.shared.MiniProfile" && inc?.entityUrn) {
        miniProfiles.set(inc.entityUrn, inc);
      }
    }

    let pageAdded = 0;
    let pageRows = 0;
    for (const inc of included) {
      if (inc?.["$type"] !== "com.linkedin.voyager.relationships.shared.connection.Connection") continue;
      pageRows++;
      const miniUrn = inc?.["*miniProfile"];
      const mp = miniUrn ? miniProfiles.get(miniUrn) : null;
      if (!mp) continue;
      const slug = mp.publicIdentifier || "";
      if (!slug) continue;
      if (seen.has(slug)) continue;
      seen.add(slug);

      all.push({
        name: `${mp.firstName || ""} ${mp.lastName || ""}`.trim(),
        slug,
        headline: mp.occupation || mp.headline || "",
        profileUrl: `https://www.linkedin.com/in/${slug}`,
        entityUrn: mp.dashEntityUrn || mp.entityUrn || "",
        connectedAt: inc.createdAt ? new Date(inc.createdAt).toISOString() : undefined,
      });
      pageAdded++;
    }

    if (pageRows < count * 0.8) break;
    if (pageAdded === 0 && pageRows > 0) break;

    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));
  }

  all.sort((a, b) => {
    const at = a.connectedAt ? new Date(a.connectedAt).getTime() : 0;
    const bt = b.connectedAt ? new Date(b.connectedAt).getTime() : 0;
    return bt - at;
  });

  return all;
}

// ============================================
// Cleanup
// ============================================

export async function cleanup(options?: { keepChromeOpen?: boolean }) {
  if (_session.browser) await _session.browser.close().catch(() => {});
  if (_session.chrome) {
    if (options?.keepChromeOpen) {
      _session.chrome.unref();
    } else {
      _session.chrome.kill();
    }
  }
  _session.page = null;
  _session.browser = null;
  _session.chrome = null;
  _session.warmedUp = false;
  releaseLock();
}

// ============================================
// Profile response parser
// ============================================

function parseDashProfile(publicId: string, response: any): VoyagerProfile {
  const included = response?.included || [];
  const data = response?.data || {};

  const profileEntities = included.filter(
    (e: any) => e["$type"]?.includes("Profile") && e.publicIdentifier
  );
  const profile =
    profileEntities.find((e: any) => e.publicIdentifier === publicId) ||
    profileEntities[0] ||
    data;

  const firstName = profile?.firstName || "";
  const lastName = profile?.lastName || "";
  const headline = profile?.headline || profile?.occupation || "";
  const entityUrn = profile?.entityUrn || "";
  const providerId = entityUrn.split(":").pop() || publicId;

  const positions = included.filter(
    (e: any) => e["$type"]?.includes("Position") || (e.companyName && e.title)
  );
  const educations = included.filter(
    (e: any) => e["$type"]?.includes("Education") || e.schoolName
  );
  const skillEntities = included.filter(
    (e: any) => e["$type"]?.includes("Skill") && e.name
  );
  const relationship = included.find(
    (e: any) => e["$type"]?.includes("MemberRelationship")
  );
  const relUnion = relationship?.memberRelationshipUnion || {};
  const networkDistance = ("*connection" in relUnion || "connection" in relUnion)
    ? "DISTANCE_1"
    : relUnion?.noConnection?.memberDistance ||
      relationship?.memberRelationshipData?.memberDistance || "";

  const workExperience = positions.map((pos: any) => ({
    position: pos.title || "",
    company: pos.companyName || "",
    company_id: pos.companyUrn?.split(":").pop() || "",
    location: pos.locationName || "",
    description: pos.description || "",
    current: !pos.timePeriod?.endDate,
    start: formatDate(pos.timePeriod?.startDate),
    end: formatDate(pos.timePeriod?.endDate),
  }));

  const education = educations.map((edu: any) => ({
    degree: edu.degreeName || "",
    school: edu.schoolName || "",
    field_of_study: edu.fieldOfStudy || "",
    start: formatDate(edu.timePeriod?.startDate),
    end: formatDate(edu.timePeriod?.endDate),
  }));

  const skills = skillEntities.map((s: any) => ({
    name: s.name || "",
    endorsement_count: s.endorsementCount || 0,
  }));

  const isPremium = profile?.premium === true ||
    !!included.find((e: any) => e.showPremiumSubscriberBadge);

  return {
    provider: "LINKEDIN",
    id: providerId,
    provider_id: providerId,
    public_identifier: publicId,
    first_name: firstName,
    last_name: lastName,
    headline,
    summary: profile?.summary || "",
    contact_info: { emails: [], phones: [], addresses: [] },
    location: profile?.locationName || profile?.geoLocationName || "",
    profile_picture_url: extractPictureUrl(profile?.profilePicture),
    can_send_inmail: false,
    is_premium: isPremium,
    is_hiring: false,
    is_open_to_work: false,
    work_experience: workExperience,
    education,
    skills,
    follower_count: profile?.followersCount || 0,
    connections_count: profile?.connectionsCount || 0,
    network_distance: networkDistance,
  };
}

function extractPictureUrl(picture: any): string {
  if (!picture?.rootUrl || !picture?.artifacts?.length) return "";
  const largest = picture.artifacts[picture.artifacts.length - 1];
  return `${picture.rootUrl}${largest.fileIdentifyingUrlPathSegment || ""}`;
}

function formatDate(dateObj: any): string {
  if (!dateObj) return "";
  if (typeof dateObj === "string") return dateObj;
  const year = dateObj.year || "";
  const month = dateObj.month ? String(dateObj.month).padStart(2, "0") : "";
  return month ? `${year}-${month}` : String(year);
}

function extractLinkedInId(input: string): string {
  if (!input) return input;
  const urlMatch = input.match(/linkedin\.com\/in\/([^\/\?]+)/);
  if (urlMatch) return urlMatch[1];
  return input;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
