# linkedin-mcp (unofficial) — contributor guide

> Read this first if you're modifying this repo. It's the "what's here and why" for humans and AI assistants alike. Keep it short and update it when you change something load-bearing.

## What this repo is

An **unofficial** stdio MCP server that exposes LinkedIn's in-browser Voyager API as ~17 tools. Not affiliated with LinkedIn or Microsoft. Each tool is a thin wrapper over `src/lib/`; the lib does the real work via Playwright CDP-attaching to your real Chrome and calling Voyager from inside `page.evaluate()`.

**Not a SaaS, not a service.** Runs locally, attaches to your local Chrome, uses your local cookies. Open source so people can audit the safety properties before pointing it at their account.

## Layout

```
src/
├── server.ts           # MCP stdio server. Registers tools, dispatches calls.
├── config.ts           # Env-driven config (profile dir, rate caps, etc.)
└── lib/
    ├── linkedin.ts     # Voyager client: session, profile, connections, messages, posts.
    │                   # ~1300 lines. The crown jewel.
    ├── comments.ts     # Post comment scraping + reply + top-level create.
    ├── behavior.ts     # Human-pacing delays + warmup + organic feed browsing.
    └── types.ts        # Shared types (Lead, VoyagerProfile, etc.)

scripts/
├── smoke-readonly.ts          # Exercises every read tool. Safe to run anytime.
├── smoke-mcp.ts               # Round-trips MCP protocol via stdio (initialize + list + call).
├── smoke-dm-only.ts           # Single-DM test (no comment side effects).
├── smoke-writes.ts            # DM + top-level comment in one run. DO NOT re-run on production posts!
└── diag-*.ts                  # Diagnostic helpers — DOM inventory, screenshot capture.
                               # Use these when LinkedIn changes a selector.

examples/claude-code.md        # Wiring guide for Claude Code (also Cursor + Claude Desktop).

dist/                          # tsc output. `npm run build` produces this.
```

## How a call flows through the system

1. MCP client (Claude Code, etc.) sends JSON-RPC `tools/call` over stdin
2. `src/server.ts` dispatches to a handler in `handlers` map
3. Handler calls a function from `src/lib/linkedin.ts` (or `comments.ts`)
4. The lib:
   - Acquires the lockfile (first call only)
   - Attaches to Chrome via CDP — port 9222, configurable
   - Runs `page.evaluate()` with a `fetch()` to `/voyager/api/...` OR drives the browser UI
   - Verifies the write landed (DOM count delta) if applicable
   - Increments daily rate counter on success only
5. Handler wraps the result in `{ content: [{ type: "text", text: JSON.stringify(...) }] }`
6. Server writes the JSON-RPC response to stdout

**stdout = protocol channel. stderr = logs.** Never `console.log` in lib code — always `console.error`. A stray stdout write corrupts the MCP framing.

## Adding a new tool

Three places to touch:

1. **`src/lib/...`** — implement the actual function. Export it. Use the existing patterns:
   - For Voyager reads: `await voyagerFetch(page, "/path")`
   - For Voyager writes: `await voyagerFetch(page, "/path", { method: "POST", body: {...} })`
   - For browser UI: navigate, `page.evaluate(...)`, scrape result
   - Add `checkDailyLimit("connect"|"message"|"view")` at the top if it's a write
   - Add `incrementDailyRate(...)` AFTER verifying the write landed

2. **`src/server.ts` — `tools` array** — declare the tool with JSONSchema. Keep the description specific (the LLM uses it to decide when to call).

3. **`src/server.ts` — `handlers` map** — wire the tool name to its lib call. Return JSON-serializable data; the harness wraps it in `content[]`.

Run `npm run build && npx tsc --noEmit` to confirm types. Then smoke-test by adding to `scripts/smoke-readonly.ts` (if read) or writing a new `smoke-X.ts` (if write).

## The five things that will bite you

### 1. LinkedIn's DOM changes ~quarterly

When a write tool breaks, the first hypothesis should be "they renamed a class." The diag scripts exist for this:

```bash
# What does the current Freya profile page look like?
LINKEDIN_MCP_CHROME_PROFILE_DIR=~/.linkedin-mcp/chrome/default \
  npx tsx scripts/diag-dm.ts

# After clicking Message, what's actually in the DOM?
npx tsx scripts/diag-click-then-inspect.ts

# Is the compose box inside an iframe?
npx tsx scripts/diag-iframe.ts
```

Patterns observed historically:
- Profile-action Message moved from `<button aria-label="Message Foo">` to `<a aria-label="" href="/messaging/compose/...">` (2026-05)
- Class names are obfuscated hashes (`_7b1c3de2`) — never selector on them
- The Message link is sometimes covered by promo SVGs that intercept pointer events — bypass by navigating to the href directly

### 2. `console.log` corrupts the MCP framing

stdout is the JSON-RPC channel. If lib code writes "Hello!" to stdout, the client's JSON parser barfs and the connection drops. Use `console.error` everywhere. The smoke scripts can use `console.log` for the test output you want to see (they don't run as MCP servers).

### 3. The lockfile + signal handlers are load-bearing

Don't disable them. Don't change them to "release on success only" — the whole point is they release on FAILURE so a crash doesn't brick the profile.

If you add a tool that does a long sequence of actions, don't hold the lock across the whole sequence and release in a `finally`. The existing `getLinkedInPage()` already acquires once and the process-exit handler releases. Trust it.

### 4. Send verification is not optional

If you add a write tool, it MUST verify. Pattern:

```typescript
const beforeCount = await page.evaluate(`document.querySelectorAll('SELECTOR').length`);
// ... perform action ...
await sleep(3500);
const afterCount = await page.evaluate(`document.querySelectorAll('SELECTOR').length`);
if (afterCount <= beforeCount) {
  throw new Error(`Action not verified — DOM count went from ${beforeCount} to ${afterCount}`);
}
incrementDailyRate("message"); // ← only AFTER verification
```

Without this you get silent failures that look like success. The original SoloStack codebase has a memory note: "DM send must be verified, never trusted — message-count delta is the only verified path."

### 5. `networkidle` never fires on LinkedIn

LinkedIn pages keep streaming data forever (SSE for live notifications). `page.goto(url, { waitUntil: 'networkidle' })` will hang for 30s and timeout.

Always use `waitUntil: 'domcontentloaded'`. Then use `waitForSelector(...)` or `page.waitForFunction(...)` for the specific thing you need.

## Testing workflow

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Read-only smoke (safe — no LinkedIn writes)
LINKEDIN_MCP_CHROME_PROFILE_DIR=~/.linkedin-mcp/chrome/default \
  npx tsx scripts/smoke-readonly.ts

# MCP protocol smoke (no LinkedIn calls at all — just round-trips tools/list + a no-Chrome handler)
echo '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/server.js
```

For end-to-end testing against real Chrome, log into your test LinkedIn account in the profile dir Chrome (see README setup), then run the smoke scripts.

## Things that look broken but aren't

- **First `getSelfFsdProfileId` call sometimes fails, second succeeds.** localStorage badges + HTML hash references aren't always populated on a fresh page. We retry 3× with 2s gaps. Don't "fix" this by collapsing it to one attempt.
- **Profile data has 0 connections / blank location.** The `TopCardSupplementary-166` decoration the lib uses doesn't reliably return those fields. Trade-off: it's the only decoration that returns network distance + full work history in one call. Don't switch decorations without checking what else breaks.
- **`pages_opened` daily counter at 1 after one session.** Each NEW tab counts; reusing an existing LinkedIn tab does not increment. After the first opens-a-tab call, all subsequent calls in the same session reuse it.
- **Send verification reports "0 → 0" failure on an empty new conversation.** If you're DMing someone you've never messaged, the thread starts at 0 messages. If verification reports 0 → 0, the send actually failed — verify by opening the thread in Chrome manually. This is real, not a false alarm.

## Updating this file

If you change something load-bearing — add a tool, change a safety property, swap a Voyager endpoint, fix a DOM-change failure — update the relevant section here. The whole point of CLAUDE.md is "the future-you (or contributor, or LLM) shouldn't have to re-derive this."

Don't add ephemeral state ("I'm currently working on X") — that's PR / commit territory.
