/**
 * Check whether the messaging overlay lives in an iframe (which would explain
 * why document.querySelectorAll('[contenteditable="true"]') returns empty).
 */

import { getLinkedInPage, cleanup } from "../src/lib/linkedin.js";

async function main() {
  const page = await getLinkedInPage();

  // Already on Freya's profile from prior diags; click Message again if overlay closed
  const inv = await page.evaluate(`
    (function() {
      // List iframes
      const iframes = Array.from(document.querySelectorAll('iframe')).map(f => ({
        src: f.src || '(no src)',
        name: f.name,
        cls: (f.className || '').toString().slice(0, 100),
        rect: { w: f.offsetWidth, h: f.offsetHeight, visible: f.offsetParent !== null },
      }));
      // All elements with ANY contenteditable attribute value
      const editables = Array.from(document.querySelectorAll('[contenteditable]')).map(el => ({
        tag: el.tagName,
        contenteditable: el.getAttribute('contenteditable'),
        cls: (el.className || '').toString().slice(0, 150),
        aria: el.getAttribute('aria-label') || '',
        placeholder: el.getAttribute('data-placeholder') || el.getAttribute('placeholder') || '',
        visible: el.offsetParent !== null,
      }));
      // Any 'Write a message' element regardless of attribute
      const writeMsg = Array.from(document.querySelectorAll('*')).filter(el => {
        const a = (el.getAttribute && el.getAttribute('aria-label') || '').toLowerCase();
        const p = (el.getAttribute && el.getAttribute('data-placeholder') || '').toLowerCase();
        const t = (el.textContent || '').slice(0, 30).toLowerCase();
        return a.includes('write a message') || p.includes('write a message') || t.includes('write a message');
      }).slice(0, 8).map(el => ({
        tag: el.tagName,
        cls: (el.className || '').toString().slice(0, 100),
        aria: el.getAttribute('aria-label') || '',
        placeholder: el.getAttribute('data-placeholder') || '',
      }));
      return { iframes, editables, writeMsg };
    })()
  `);

  console.log("=== iframes on page ===");
  console.log(JSON.stringify((inv as any).iframes, null, 2));
  console.log("\n=== ALL [contenteditable] elements (any value) ===");
  console.log(JSON.stringify((inv as any).editables, null, 2));
  console.log("\n=== Elements mentioning 'Write a message' ===");
  console.log(JSON.stringify((inv as any).writeMsg, null, 2));

  // Drill into iframes if present
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    console.log(`\n=== Frame ${frame.url()} ===`);
    try {
      const frameInv = await frame.evaluate(`
        (function() {
          const eds = Array.from(document.querySelectorAll('[contenteditable]')).map(el => ({
            tag: el.tagName,
            cls: (el.className || '').toString().slice(0, 150),
            visible: el.offsetParent !== null,
          }));
          const sends = Array.from(document.querySelectorAll('button')).filter(b => {
            return (b.className || '').toString().toLowerCase().includes('send') || (b.innerText || '').trim().toLowerCase() === 'send';
          }).map(b => ({
            cls: (b.className || '').toString().slice(0, 100),
            text: (b.innerText || '').trim(),
            disabled: b.disabled,
          }));
          return { eds, sends };
        })()
      `);
      console.log(JSON.stringify(frameInv, null, 2));
    } catch (e: any) {
      console.log(`Frame eval failed: ${e.message}`);
    }
  }

  await cleanup({ keepChromeOpen: true });
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
