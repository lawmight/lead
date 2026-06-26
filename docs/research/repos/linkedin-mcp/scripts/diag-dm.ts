/**
 * Diagnostic: navigate to Freya's profile, dump the page state and capture
 * a screenshot. No writes. Helps us see why the Message button isn't found.
 */

import { getLinkedInPage, cleanup } from "../src/lib/linkedin.js";
import { humanDelay } from "../src/lib/behavior.js";
import * as path from "path";

async function main() {
  const page = await getLinkedInPage();
  const targetUrl = "https://www.linkedin.com/in/creativefreya";
  console.log(`Current URL before nav: ${page.url()}`);
  console.log(`Navigating to: ${targetUrl}`);

  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await humanDelay(4000, 5500);

  console.log(`Current URL after nav: ${page.url()}`);
  console.log(`Page title: ${await page.title()}`);

  // Wait a bit more for late-render
  await new Promise(r => setTimeout(r, 4000));

  // What buttons / links related to messaging are visible?
  const inventory = await page.evaluate(`
    (function() {
      const out = {
        messageButtons: [],
        connectButtons: [],
        actionRowFound: false,
        bodyText: document.body.innerText.slice(0, 300),
      };
      const buttons = document.querySelectorAll('button, a');
      for (const b of buttons) {
        const visible = b.offsetParent !== null;
        const aria = b.getAttribute('aria-label') || '';
        const text = (b.innerText || '').trim().slice(0, 50);
        if (/message/i.test(aria) || /^message$/i.test(text)) {
          out.messageButtons.push({ tag: b.tagName, aria, text, visible });
        }
        if (/connect/i.test(aria) && /^[A-Z]/.test(text)) {
          out.connectButtons.push({ tag: b.tagName, aria, text, visible });
        }
      }
      // Profile actions row often has a specific class
      out.actionRowFound = !!document.querySelector('.pv-top-card-v2-ctas, .pvs-profile-actions, [class*="profile-actions"], [class*="top-card"][class*="actions"]');
      return out;
    })()
  `);

  console.log("\nInventory:");
  console.log(JSON.stringify(inventory, null, 2));

  const screenshot = path.resolve("./diag-dm-freya.png");
  await page.screenshot({ path: screenshot, fullPage: false });
  console.log(`\nScreenshot saved: ${screenshot}`);

  await cleanup({ keepChromeOpen: true });
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
