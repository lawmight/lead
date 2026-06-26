/**
 * Read-only smoke test — exercises every read tool against the live LinkedIn
 * session. Confirms session works, profiles parse, conversations list, comments
 * scrape, rate-limit reflects reality. Touches NO write endpoints.
 *
 * Run with the Chrome profile of your choice:
 *   LINKEDIN_MCP_CHROME_PROFILE_DIR=~/.claude-browser npx tsx scripts/smoke-readonly.ts
 */

import {
  getLinkedInPage,
  getSelfFsdProfileId,
  getProfile,
  getRecentConnections,
  listChats,
  getDailyRates,
  checkRateLimit,
  cleanup,
} from "../src/lib/linkedin.js";
import { getPostComments, normalizeActivityId } from "../src/lib/comments.js";

const TARGETS = {
  freyaSlug: "creativefreya",
  darkoPostUrl: "https://www.linkedin.com/posts/djovisic_we-killed-our-hubspot-subscription-last-month-activity-7448029479022735361-aIyq",
};

function section(title: string) {
  console.error("\n" + "=".repeat(60));
  console.error("  " + title);
  console.error("=".repeat(60));
}

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  const t0 = Date.now();
  try {
    const r = await fn();
    console.error(`  ✓ ${label} (${Date.now() - t0}ms)`);
    return r;
  } catch (err: any) {
    console.error(`  ✗ ${label} FAILED in ${Date.now() - t0}ms: ${err.message}`);
    return null;
  }
}

async function main() {
  section("session_open");
  const page = await timed("getLinkedInPage", () => getLinkedInPage());
  if (!page) {
    console.error("FATAL: cannot attach to Chrome. Bail.");
    process.exit(1);
  }
  console.error(`  current url: ${page.url()}`);

  section("rate_limit_get");
  const rates = await timed("getDailyRates", async () => getDailyRates());
  console.log("RATES:", JSON.stringify(rates, null, 2));

  const checkConnect = await timed("checkRateLimit(connect)", async () => checkRateLimit("connect"));
  const checkMessage = await timed("checkRateLimit(message)", async () => checkRateLimit("message"));
  console.log("CHECKS:", JSON.stringify({ connect: checkConnect, message: checkMessage }, null, 2));

  section("profile_get_self");
  const selfId = await timed("getSelfFsdProfileId", () => getSelfFsdProfileId());
  console.log("SELF FSD PROFILE ID:", selfId);

  section("profile_get(creativefreya)");
  const freya = await timed("getProfile(creativefreya)", () => getProfile(TARGETS.freyaSlug));
  if (freya) {
    console.log("FREYA:", JSON.stringify({
      name: `${freya.first_name} ${freya.last_name}`,
      headline: freya.headline,
      location: freya.location,
      network_distance: freya.network_distance,
      provider_id: freya.provider_id,
      connections: freya.connections_count,
    }, null, 2));
  }

  section("connections_list_recent (5)");
  const recent = await timed("getRecentConnections(5)", () => getRecentConnections(5));
  if (recent) {
    console.log("RECENT CONNECTIONS:", JSON.stringify(recent.map(c => ({
      slug: c.slug,
      name: c.name,
      headline: c.headline.slice(0, 60),
      connectedAt: c.connectedAt,
    })), null, 2));
  }

  section("messages_list_conversations (5)");
  const convs = await timed("listChats(5)", () => listChats({ limit: 5 }));
  if (convs) {
    console.log("CONVERSATIONS:", JSON.stringify(convs.map(c => ({
      participant: c.participants[0]?.fullName || "(group)",
      lastMessage: (c.lastMessage?.text || "").slice(0, 80),
      lastFromSelf: c.lastMessage?.isFromSelf,
      unread: c.unreadCount,
      backendUrn: c.backendUrn,
    })), null, 2));
  }

  section("posts_get_comments(Darko's post)");
  const activityId = normalizeActivityId(TARGETS.darkoPostUrl);
  console.error(`  normalized activity ID: ${activityId}`);
  const comments = await timed("getPostComments", () => getPostComments(activityId, { maxPages: 2 }));
  if (comments) {
    console.log("COMMENTS (first 5):", JSON.stringify(comments.slice(0, 5).map(c => ({
      commenter: c.commenterName,
      slug: c.commenterLinkedinUrl.match(/\/in\/([^\/]+)/)?.[1] || "",
      text: c.commentText.slice(0, 100),
      urn: c.commentUrn,
    })), null, 2));
    console.error(`  total comments scraped: ${comments.length}`);
  }

  section("final rate state");
  console.log("FINAL RATES:", JSON.stringify(getDailyRates(), null, 2));

  // Keep Chrome alive — we'll use it for the write tests next
  console.error("\nDone. Leaving Chrome open for write tests. Run smoke-writes.ts to continue.");
  await cleanup({ keepChromeOpen: true });
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
