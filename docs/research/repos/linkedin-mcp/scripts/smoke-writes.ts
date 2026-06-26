/**
 * Write smoke test — exercises the two write paths the user pre-approved:
 *   1. linkedin_messages_send  → DM to Freya
 *   2. linkedin_posts_create_comment → top-level comment on Darko's post
 *
 * Both writes are verified by post-action DOM count delta (built into the lib).
 */

import { startChat, getLinkedInPage, cleanup, getDailyRates } from "../src/lib/linkedin.js";
import { createTopLevelComment, normalizeActivityId } from "../src/lib/comments.js";

const DM = {
  slug: "creativefreya",
  text: "testing linkedin mcp, ignore",
};

const COMMENT = {
  postUrl: "https://www.linkedin.com/posts/djovisic_we-killed-our-hubspot-subscription-last-month-activity-7448029479022735361-aIyq",
  text: "Did the same — CRM, scheduling, proposals all live in /tools/ in the repo now. The renewal cancellation was satisfying but the real unlock was attribution actually being end-to-end because every dept reads the same contacts table.",
};

function section(title: string) {
  console.error("\n" + "=".repeat(60));
  console.error("  " + title);
  console.error("=".repeat(60));
}

async function main() {
  section("session_open");
  await getLinkedInPage();
  console.error(`Rates before writes: ${JSON.stringify(getDailyRates())}`);

  // ─── WRITE 1: DM Freya ────────────────────────────────────────────────
  section(`messages_send → ${DM.slug}`);
  console.error(`text: ${JSON.stringify(DM.text)}`);
  const t0 = Date.now();
  try {
    const result = await startChat(DM.slug, DM.text);
    console.error(`✓ DM verified (${Date.now() - t0}ms): chat_id=${result.chat_id}`);
    console.log("DM_RESULT:", JSON.stringify(result));
  } catch (err: any) {
    console.error(`✗ DM FAILED (${Date.now() - t0}ms): ${err.message}`);
    console.log("DM_ERROR:", err.message);
  }

  console.error(`Rates after DM: ${JSON.stringify(getDailyRates())}`);

  // ─── WRITE 2: comment on Darko's post ─────────────────────────────────
  section(`posts_create_comment → activity ${normalizeActivityId(COMMENT.postUrl)}`);
  console.error(`text: ${JSON.stringify(COMMENT.text)}`);
  const t1 = Date.now();
  try {
    const result = await createTopLevelComment(COMMENT.postUrl, COMMENT.text);
    console.error(`${result.verified ? "✓" : "✗"} Comment verified=${result.verified} (${Date.now() - t1}ms): ${result.before}→${result.after}`);
    console.log("COMMENT_RESULT:", JSON.stringify(result));
  } catch (err: any) {
    console.error(`✗ Comment FAILED (${Date.now() - t1}ms): ${err.message}`);
    console.log("COMMENT_ERROR:", err.message);
  }

  section("final state");
  console.log("FINAL_RATES:", JSON.stringify(getDailyRates(), null, 2));

  await cleanup({ keepChromeOpen: true });
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
