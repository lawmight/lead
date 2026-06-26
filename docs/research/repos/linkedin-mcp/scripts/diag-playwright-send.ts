/**
 * Use Playwright's native locator API instead of page.evaluate to drive the
 * DM compose flow. Different code path — if this works, we can adopt it in
 * the lib.
 */

import { getLinkedInPage, cleanup } from "../src/lib/linkedin.js";
import * as path from "path";

const TARGET_SLUG = "creativefreya";
const TEXT = "testing linkedin mcp, ignore";

async function main() {
  const page = await getLinkedInPage();

  // Fresh nav
  await page.goto(`https://www.linkedin.com/in/${TARGET_SLUG}`, { waitUntil: "domcontentloaded", timeout: 25000 });
  await page.waitForTimeout(4000);

  console.log("URL:", page.url());

  // Find ALL visible "Message" link/buttons and try each one to find the overlay-opener
  const candidates = page.locator('a, button').filter({ hasText: /^Message$/ });
  const total = await candidates.count();
  console.log(`Found ${total} elements with text=Message`);

  let overlayOpened = false;
  for (let i = 0; i < total; i++) {
    const el = candidates.nth(i);
    const visible = await el.isVisible().catch(() => false);
    const aria = await el.getAttribute('aria-label').catch(() => "");
    if (!visible || aria) continue; // Skip invisible + sidebar entries with named aria

    console.log(`Trying candidate ${i} (visible=${visible}, aria="${aria}")`);
    await el.click({ timeout: 5000 }).catch((e: any) => console.log(`  click failed: ${e.message}`));

    // Wait for any contenteditable to appear (any attribute value)
    try {
      await page.waitForFunction(
        `document.querySelectorAll('[contenteditable]').length > 0`,
        { timeout: 4000 }
      );
      console.log(`  ✓ candidate ${i} opened an overlay!`);
      overlayOpened = true;
      break;
    } catch {
      console.log(`  ✗ candidate ${i} did not open overlay`);
    }
  }

  if (!overlayOpened) {
    console.log("\nNo candidate opened the overlay. Taking screenshot for inspection.");
    await page.screenshot({ path: path.resolve("./diag-pw-no-overlay.png") });
    await cleanup({ keepChromeOpen: true });
    return;
  }

  await page.waitForTimeout(1500);

  // Inventory ALL contenteditable now that overlay is open
  const editables = await page.evaluate(`
    Array.from(document.querySelectorAll('[contenteditable]')).map((el, i) => ({
      idx: i,
      tag: el.tagName,
      contenteditable: el.getAttribute('contenteditable'),
      cls: (el.className || '').toString().slice(0, 100),
      aria: el.getAttribute('aria-label') || '',
      placeholder: el.getAttribute('data-placeholder') || '',
      visible: el.offsetParent !== null,
      rect: { w: el.offsetWidth, h: el.offsetHeight },
    }))
  `);
  console.log("\nContenteditable elements after overlay opened:");
  console.log(JSON.stringify(editables, null, 2));

  await page.screenshot({ path: path.resolve("./diag-pw-overlay.png") });
  console.log("Screenshot: diag-pw-overlay.png");

  await cleanup({ keepChromeOpen: true });
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
