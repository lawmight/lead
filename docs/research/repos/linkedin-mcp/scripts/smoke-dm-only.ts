/**
 * DM-only retry — does NOT touch the comment path (we already posted twice
 * by accident on Darko's post; do not run smoke-writes.ts again).
 */

import { startChat, getLinkedInPage, cleanup, getDailyRates } from "../src/lib/linkedin.js";

const TARGET = "creativefreya";
const TEXT = "testing linkedin mcp, ignore";

async function main() {
  await getLinkedInPage();
  console.error(`Rates before: ${JSON.stringify(getDailyRates())}`);
  console.error(`\n=== messages_send → ${TARGET} ===`);
  console.error(`text: ${JSON.stringify(TEXT)}`);
  const t0 = Date.now();
  try {
    const result = await startChat(TARGET, TEXT);
    console.error(`✓ DM verified (${Date.now() - t0}ms): chat_id=${result.chat_id}`);
    console.log("DM_RESULT:", JSON.stringify(result));
  } catch (err: any) {
    console.error(`✗ DM FAILED (${Date.now() - t0}ms): ${err.message}`);
    console.log("DM_ERROR:", err.message);
  }
  console.error(`Rates after: ${JSON.stringify(getDailyRates())}`);
  await cleanup({ keepChromeOpen: true });
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
