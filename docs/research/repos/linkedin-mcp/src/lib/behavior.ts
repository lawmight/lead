/**
 * Human Behavior Simulation
 *
 * Sandwiches automation actions between organic-looking browsing — randomized
 * delays, scrolling, occasional feed-glance, mouse movement. Lifted from the
 * upstream Voyager client; unchanged.
 */

import type { Page } from "playwright";

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Human-like delay — not uniform, uses a skewed distribution */
export async function humanDelay(minMs: number, maxMs: number): Promise<void> {
  const skew = Math.pow(Math.random(), 0.7);
  const delay = minMs + skew * (maxMs - minMs);
  await new Promise((r) => setTimeout(r, Math.round(delay)));
}

export async function thinkingPause(): Promise<void> {
  await humanDelay(2000, 8000);
}

export async function microPause(): Promise<void> {
  await humanDelay(300, 1200);
}

export async function actionGap(): Promise<void> {
  await humanDelay(5000, 15000);
}

export async function betweenTargetsGap(): Promise<void> {
  const base = randInt(20000, 60000);
  const extra = Math.random() < 0.2 ? randInt(30000, 90000) : 0;
  await new Promise((r) => setTimeout(r, base + extra));
}

export async function humanScroll(page: Page, options?: {
  scrolls?: number;
  direction?: "down" | "up" | "mixed";
}): Promise<void> {
  const scrollCount = options?.scrolls || randInt(2, 6);
  const direction = options?.direction || "down";

  for (let i = 0; i < scrollCount; i++) {
    const distance = randInt(200, 600);
    const dir = direction === "mixed"
      ? (Math.random() < 0.7 ? 1 : -1)
      : (direction === "down" ? 1 : -1);
    await page.mouse.wheel(0, distance * dir);
    await humanDelay(400, 2000);
    if (Math.random() < 0.3) {
      await humanDelay(2000, 5000);
    }
  }
}

export async function browseFeed(page: Page, options?: {
  duration?: "quick" | "medium" | "long";
}): Promise<void> {
  const duration = options?.duration || "quick";
  const url = page.url();
  if (!url.includes("/feed")) {
    await page.goto("https://www.linkedin.com/feed/", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await humanDelay(1500, 3000);
  }

  const iterations = duration === "quick" ? randInt(2, 4)
    : duration === "medium" ? randInt(4, 8)
    : randInt(8, 15);

  for (let i = 0; i < iterations; i++) {
    await page.mouse.wheel(0, randInt(300, 700));
    await humanDelay(1000, 4000);
    if (Math.random() < 0.25) {
      await humanDelay(3000, 8000);
    }
  }
}

export async function feedGlance(page: Page): Promise<void> {
  await browseFeed(page, { duration: "quick" });
}

export async function randomMouseMove(page: Page): Promise<void> {
  const x = randInt(100, 1100);
  const y = randInt(100, 700);
  const steps = randInt(5, 15);
  await page.mouse.move(x, y, { steps });
  await microPause();
}

export async function warmupSession(page: Page): Promise<void> {
  console.error("[behavior] Warming up session...");
  await browseFeed(page, { duration: "medium" });
  if (Math.random() < 0.5) {
    await page.goto("https://www.linkedin.com/notifications/", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await humanDelay(2000, 5000);
    await humanScroll(page, { scrolls: randInt(1, 3) });
  }
  if (Math.random() < 0.4) {
    await page.goto("https://www.linkedin.com/messaging/", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await humanDelay(2000, 4000);
  }
  await page.goto("https://www.linkedin.com/feed/", {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await humanDelay(1000, 3000);
  console.error("[behavior] Warmup complete.");
}

interface RateLimiter {
  actionCount: number;
  sessionStart: number;
  lastAction: number;
}

const limiter: RateLimiter = {
  actionCount: 0,
  sessionStart: Date.now(),
  lastAction: 0,
};

export async function rateLimitCheck(page: Page, _actionType: "connect" | "message" | "view"): Promise<boolean> {
  limiter.actionCount++;
  if (limiter.actionCount % randInt(5, 8) === 0) {
    const breakDuration = randInt(30000, 120000);
    console.error(`[behavior] Taking a ${Math.round(breakDuration / 1000)}s break after ${limiter.actionCount} actions...`);
    await browseFeed(page, { duration: "medium" });
    await humanDelay(breakDuration - 15000, breakDuration);
  }
  if (limiter.actionCount % randInt(15, 20) === 0) {
    const longBreak = randInt(180000, 300000);
    console.error(`[behavior] Long break: ${Math.round(longBreak / 1000)}s after ${limiter.actionCount} actions...`);
    await new Promise((r) => setTimeout(r, longBreak));
  }
  return true;
}

export function resetLimiter(): void {
  limiter.actionCount = 0;
  limiter.sessionStart = Date.now();
  limiter.lastAction = 0;
}
