/**
 * Click the Message link on Freya's profile, wait, THEN inspect the DOM.
 * Tells us exactly what selector to target for the compose box.
 */

import { getLinkedInPage, cleanup } from "../src/lib/linkedin.js";
import * as path from "path";

async function main() {
  const page = await getLinkedInPage();

  // Navigate fresh
  await page.goto("https://www.linkedin.com/in/creativefreya", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 4000));

  console.log(`URL after nav: ${page.url()}`);

  // Click the first visible <a> with EXACT text "Message" and empty aria-label
  // (which is the profile-action Message button on modern LinkedIn).
  const clickResult = await page.evaluate(`
    (function() {
      var els = document.querySelectorAll('a, button');
      var found = [];
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.offsetParent === null) continue;
        var aria = el.getAttribute('aria-label') || '';
        var text = (el.innerText || '').trim();
        if (text === 'Message') {
          found.push({ idx: i, tag: el.tagName, aria, cls: (el.className || '').toString().slice(0, 100) });
        }
      }
      // Pick first with empty aria-label (skip "Message Daniel Palmer" sidebar entries)
      for (var f of found) {
        if (!f.aria) {
          var el = els[f.idx];
          el.scrollIntoView({ block: 'center' });
          el.click();
          return { clicked: f, candidates: found };
        }
      }
      return { clicked: null, candidates: found };
    })()
  `);
  console.log("Click result:", JSON.stringify(clickResult, null, 2));

  // Wait for the overlay to render
  await new Promise(r => setTimeout(r, 5000));

  // Inventory contenteditable + msg-form classes
  const inv = await page.evaluate(`
    (function() {
      const editables = Array.from(document.querySelectorAll('[contenteditable="true"]')).map(el => ({
        tag: el.tagName,
        cls: (el.className || '').toString().slice(0, 200),
        aria: el.getAttribute('aria-label') || '',
        placeholder: el.getAttribute('data-placeholder') || '',
        parentCls: el.parentElement?.className?.toString?.()?.slice(0, 150) || '',
        visible: el.offsetParent !== null,
      }));
      const sendBtns = Array.from(document.querySelectorAll('button')).filter(b => {
        const cls = (b.className || '').toString();
        const txt = (b.innerText || '').trim().toLowerCase();
        return cls.toLowerCase().includes('send') || txt === 'send';
      }).map(b => ({
        cls: (b.className || '').toString().slice(0, 200),
        text: (b.innerText || '').trim(),
        disabled: b.disabled,
        visible: b.offsetParent !== null,
        parentCls: b.parentElement?.className?.toString?.()?.slice(0, 100) || '',
      }));
      return { editables, sendBtns, url: location.href };
    })()
  `);
  console.log("\nAfter click + 5s wait:");
  console.log(JSON.stringify(inv, null, 2));

  const screenshot = path.resolve("./diag-after-click.png");
  await page.screenshot({ path: screenshot });
  console.log(`Screenshot: ${screenshot}`);

  await cleanup({ keepChromeOpen: true });
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
