/**
 * Diagnostic: find the message compose box on the current LinkedIn page.
 * Lists every contenteditable element with full attributes so we can build
 * a working selector.
 */

import { getLinkedInPage, cleanup } from "../src/lib/linkedin.js";

async function main() {
  const page = await getLinkedInPage();
  console.log(`Current URL: ${page.url()}`);

  // If we're not on Freya's profile, go there first
  if (!page.url().includes("creativefreya")) {
    await page.goto("https://www.linkedin.com/in/creativefreya", { waitUntil: "domcontentloaded", timeout: 25000 });
    await new Promise(r => setTimeout(r, 5000));
  }

  const overlay = await page.evaluate(`
    (function() {
      // ALL contenteditable elements
      const editables = Array.from(document.querySelectorAll('[contenteditable="true"]')).map(el => ({
        tag: el.tagName,
        className: (el.className || '').toString().slice(0, 200),
        aria: el.getAttribute('aria-label') || '',
        placeholder: el.getAttribute('data-placeholder') || '',
        role: el.getAttribute('role') || '',
        visible: el.offsetParent !== null,
        rect: el.getBoundingClientRect().toJSON ? el.getBoundingClientRect() : null,
        parentCls: el.parentElement?.className?.toString?.()?.slice(0, 100) || '',
      }));
      // ALL forms that mention msg
      const forms = Array.from(document.querySelectorAll('form, [class*="msg-form"], [class*="message-form"]')).map(el => ({
        tag: el.tagName,
        className: (el.className || '').toString().slice(0, 200),
      }));
      // ALL elements containing "Write a message" in placeholder/aria/text
      const writePrompt = Array.from(document.querySelectorAll('*')).filter(el => {
        const a = (el.getAttribute('aria-label') || '').toLowerCase();
        const p = (el.getAttribute('data-placeholder') || '').toLowerCase();
        return a.includes('write a message') || p.includes('write a message');
      }).map(el => ({
        tag: el.tagName,
        className: (el.className || '').toString().slice(0, 150),
        aria: el.getAttribute('aria-label') || '',
        placeholder: el.getAttribute('data-placeholder') || '',
      }));
      // Send buttons
      const sendBtns = Array.from(document.querySelectorAll('button')).filter(b => {
        const cls = (b.className || '').toString();
        const txt = (b.innerText || '').trim().toLowerCase();
        return cls.includes('send') || txt === 'send';
      }).map(b => ({
        className: (b.className || '').toString().slice(0, 150),
        text: (b.innerText || '').trim(),
        disabled: b.disabled,
        visible: b.offsetParent !== null,
      }));
      return { editables, forms, writePrompt, sendBtns };
    })()
  `);

  console.log("\n=== contenteditable elements ===");
  console.log(JSON.stringify((overlay as any).editables, null, 2));
  console.log("\n=== forms ===");
  console.log(JSON.stringify((overlay as any).forms, null, 2));
  console.log("\n=== 'Write a message' elements ===");
  console.log(JSON.stringify((overlay as any).writePrompt, null, 2));
  console.log("\n=== Send buttons ===");
  console.log(JSON.stringify((overlay as any).sendBtns, null, 2));

  await cleanup({ keepChromeOpen: true });
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
