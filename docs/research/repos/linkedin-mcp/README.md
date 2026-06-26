# linkedin-mcp (unofficial)

> ⚠️ **Unofficial.** Not affiliated with, endorsed by, or sponsored by LinkedIn or Microsoft. This is an independent open-source project that talks to LinkedIn's undocumented Voyager API through your own browser. LinkedIn could change anything at any time and the LinkedIn name and logo are trademarks of their respective owners.

An MCP server that turns LinkedIn into a set of tools your AI client can call directly — profile lookups, connection requests, DMs, posts, comments — using **your own logged-in Chrome session**. No third-party API. No per-seat pricing. No `li_at` cookie pasting. Undetectable to LinkedIn because the calls run inside real Chrome with your real cookies, via the same Voyager API LinkedIn's own frontend uses.

Works with Claude Code, Cursor, Claude Desktop, and any other MCP client over stdio.

> ⚠️ **Use at your own risk.** LinkedIn's ToS technically forbids automation. This tool keeps you well inside any realistic detection threshold (real Chrome, daily caps, jittered delays, send verification) but no guarantee. Don't use this for spam — that's how accounts get banned.

---

## Why this approach

| Approach | Cost | Detection risk | Maintenance |
|---|---|---|---|
| Unipile / PhantomBuster style API | $50–200/mo per seat | Low (their headache) | Vendor handles it |
| Custom Node.js `fetch()` to Voyager | Free | **Blocked** — LinkedIn checks TLS fingerprint, rejects all non-browser requests | N/A — doesn't work |
| Headless Chrome / Puppeteer | Free | Blocked — LinkedIn sends `Clear-Site-Data: storage` to headless browsers | High |
| **This: real Chrome via CDP + Voyager API** | **Free** | **Indistinguishable from manual use** — calls run in `page.evaluate()` from linkedin.com origin with your real cookies | LinkedIn DOM shifts occasionally — fixes are usually one selector change |

The unique move: instead of opening `fetch()` from Node (TLS fingerprint flagged) or running headless Chrome (storage cleared), we **attach via CDP to your real, already-logged-in Chrome profile** and call Voyager from inside `page.evaluate()`. From LinkedIn's perspective these are indistinguishable from clicks you make yourself.

---

## What's included (v0.1 — 17 tools)

| Namespace | Tool | Purpose |
|---|---|---|
| **session** | `linkedin_session_open` | Attach to Chrome, return self profile ID + daily rates |
|  | `linkedin_session_status` | Check status without launching Chrome |
|  | `linkedin_session_close` | Clean shutdown — kill Chrome, release lock |
| **rate_limit** | `linkedin_rate_limit_get` | Today's used / limit for every action |
|  | `linkedin_rate_limit_check` | Non-throwing pre-flight: `{ canDo, remaining }` |
| **profile** | `linkedin_profile_get` | Lookup by slug or URL — name, headline, work history, network distance |
|  | `linkedin_profile_get_self` | Current user's fsd_profile ID |
| **connections** | `linkedin_connections_send_request` | Send invitation (with optional note, 300-char limit) |
|  | `linkedin_connections_list_recent` | Recently-added 1st-degree connections |
|  | `linkedin_connections_list_all` | Paginate entire connection list |
| **messages** | `linkedin_messages_send` | DM by slug or fsd_profile id — uses browser UI, verified by message-count delta |
|  | `linkedin_messages_reply` | Reply in existing thread by backend URN |
|  | `linkedin_messages_list_conversations` | Inbox listing with cursor pagination, includes last message + sender direction |
| **posts** | `linkedin_posts_create` | Post text update to your feed |
|  | `linkedin_posts_get_comments` | Scrape all comments on any post URN |
|  | `linkedin_posts_reply_to_comment` | Reply to a specific comment thread |
|  | `linkedin_posts_create_comment` | Post a top-level comment, verified by comment-count delta |

---

## Setup (5 minutes, one time)

### Step 1 — Prerequisites

| Requirement | Why | Check |
|---|---|---|
| **Node.js 20+** | The MCP server runs on Node | `node --version` |
| **Google Chrome** (not Chromium, not Brave, not Edge) | Voyager only accepts requests from real Chrome's TLS fingerprint | `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version` (macOS) |
| **A LinkedIn account** | The thing you're automating | — |
| **macOS / Linux / Windows** | All supported; macOS paths shown below | — |

### Step 2 — Clone and build

```bash
git clone https://github.com/yourname/linkedin-mcp.git
cd linkedin-mcp
npm install
npm run build
```

If `npm install` is slow, it's the Playwright browser download — that's fine. You'll use your real Chrome, not Playwright's bundled Chromium, but the SDK still pulls it in.

### Step 3 — Create a dedicated Chrome profile and log in

The MCP attaches to a Chrome instance running with a **dedicated `--user-data-dir`** — separate from your regular Chrome. This keeps the automation isolated from your daily browsing and prevents cookie/extension interference.

```bash
# 1. Create the profile directory
mkdir -p ~/.linkedin-mcp/chrome/default

# 2. Launch Chrome pointed at it (macOS — adjust path for Linux/Windows)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/.linkedin-mcp/chrome/default" \
  --remote-debugging-port=9222 \
  --no-first-run \
  --no-default-browser-check
```

A fresh Chrome window opens (empty bookmarks, no extensions, signed out of everything).

1. Go to `https://www.linkedin.com/login`
2. Log in to your LinkedIn account
3. Solve any CAPTCHA / device-verification challenges
4. Verify you can browse the feed normally
5. **Close the window**

Your session cookie is now persisted in `~/.linkedin-mcp/chrome/default`. The MCP will launch Chrome (or attach to a running one) on first tool call.

> **One-time only.** You won't need to repeat this unless LinkedIn invalidates your session (re-login banner). Sessions typically last weeks to months.

### Step 4 — Wire into your MCP client

**Claude Code** — add to `~/.claude.json` (global) or a project's `.mcp.json`:

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "node",
      "args": ["/absolute/path/to/linkedin-mcp/dist/server.js"],
      "env": {
        "LINKEDIN_MCP_CHROME_PROFILE_DIR": "/Users/you/.linkedin-mcp/chrome/default"
      }
    }
  }
}
```

**Cursor** — same shape, in `mcp.json`.

**Claude Desktop** — same shape, in `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows).

Restart your client. Run `/mcp` in Claude Code (or check the tools panel in Cursor/Desktop) — you should see 17 `linkedin_*` tools.

### Step 5 — Smoke test

Ask your client:

> "Open my LinkedIn session, then list my 5 most recent connections."

You should see Chrome launch (or get attached if already running), then a list of names. First call takes 10–15 seconds (Chrome attach + page load); subsequent calls are sub-second for read tools.

If something goes wrong, see **Troubleshooting** at the bottom.

---

## Configuration

All via env vars. Defaults shown.

| Env var | Default | Purpose |
|---|---|---|
| `LINKEDIN_MCP_CHROME_PROFILE_DIR` | `~/.linkedin-mcp/chrome/default` | Chrome user-data-dir holding the logged-in session |
| `LINKEDIN_MCP_CDP_PORT` | `9222` | Chrome DevTools Protocol port |
| `LINKEDIN_MCP_CHROME_PATH` | macOS app bundle | Chrome binary path |
| `LINKEDIN_MCP_DEFAULT_ACCOUNT` | `default` | Account label (logs only) |
| `LINKEDIN_MCP_RATE_CONNECT` | `20` | Daily cap on connection requests |
| `LINKEDIN_MCP_RATE_MESSAGE` | `40` | Daily cap on DMs |
| `LINKEDIN_MCP_RATE_VIEW` | `80` | Daily cap on profile views |
| `LINKEDIN_MCP_RATE_PAGES` | `15` | Daily cap on new tabs (LinkedIn 429s on tab-opening bursts) |
| `LINKEDIN_LI_AT` | unset | Optional fallback `li_at` cookie if the Chrome session goes stale |

### Pick rate caps based on your account age

Defaults assume an **aged, real account**. New accounts get burned fast:

| Account age | Suggested env |
|---|---|
| New (<30 days) | `LINKEDIN_MCP_RATE_CONNECT=5 LINKEDIN_MCP_RATE_MESSAGE=15 LINKEDIN_MCP_RATE_VIEW=40` |
| Warming (1–3 months) | `LINKEDIN_MCP_RATE_CONNECT=10 LINKEDIN_MCP_RATE_MESSAGE=25 LINKEDIN_MCP_RATE_VIEW=60` |
| Aged (3+ months, regularly used) | defaults |

LinkedIn's actual ceilings are ~25–30 connects, ~50–100 messages, ~100–150 views per day. The defaults stay well under — burning these gets your account "feature-restricted" for 24–72h.

---

## Safety mechanisms (in detail)

The biggest failure modes when automating LinkedIn are: (1) getting your account banned, (2) double-sending the same DM/comment because verification was unreliable, (3) zombie Chrome processes piling up, and (4) two scripts racing each other into a 429 freeze. Every safety property here exists because we hit that failure in production. None of them are tunable away — they're the contract.

### 🔒 1. Single-writer lockfile

**File:** `{LINKEDIN_MCP_CHROME_PROFILE_DIR}/linkedin.lock`
**Format:** `{ "pid": 12345, "timestamp": 1716480000000 }`
**Stale timeout:** 5 minutes

When the MCP first attaches to Chrome, it writes the lockfile. If a second process tries to attach to the **same profile dir** while the first holds the lock, it refuses with an explicit error:

```
[linkedin] Another client is using this Chrome profile (PID 12345, started 42s ago).
If this is stale, delete /Users/you/.linkedin-mcp/chrome/default/linkedin.lock
```

If the lockfile is older than 5 minutes, it's auto-treated as stale and removed (prior process probably crashed without cleanup).

**Why it matters:** opening parallel Playwright connections / tabs to LinkedIn is the #1 way to trigger a 429 rate-limit freeze that locks the account for 1–2 hours. The lockfile makes that impossible.

### 🛑 2. Auto-cleanup on every exit path

The lib registers handlers for `SIGINT`, `SIGTERM`, `SIGHUP`, `uncaughtException`, and `exit`. Each one:
1. Releases the lockfile
2. Stops tracking the Chrome session

This means:
- Ctrl+C → lock released
- `kill <pid>` → lock released
- Crashed with an uncaught exception → lock released
- Normal process exit → lock released

You should never need to manually delete the lockfile in normal operation. If you do (because something *really* went wrong), it's safe — there's no exclusive resource being protected, only the convention "one MCP per profile."

### 🚦 3. Hard daily caps, persisted across process restarts

**File:** `{LINKEDIN_MCP_CHROME_PROFILE_DIR}/linkedin-daily-rates.json`
**Format:** `{ "date": "2026-05-24", "connect": 3, "message": 12, "view": 30, "pages_opened": 1 }`
**Reset:** midnight UTC (next day's first call replaces the file)

Every write tool calls `checkDailyLimit()` **before** doing anything else. If you're at the cap, it throws — the tool doesn't even open Chrome.

```
[linkedin] Daily message limit reached (40/40). Resume tomorrow.
Override via LINKEDIN_MCP_RATE_MESSAGE env var.
```

Even after a successful action, the counter is only incremented **after the action is verified to have landed**. A failed send doesn't burn quota.

Restart the MCP server, reboot your laptop, switch clients — the counter persists because it's on disk. There's no in-memory state to lose.

### ✅ 4. Send verification — never a false-positive "sent"

This is the most important property and it's why this MCP is different from every other LinkedIn automation tool.

**For DMs:**
1. Before clicking Send, count `.msg-s-event-listitem` elements (message bubbles) in the thread
2. Type the message (`execCommand('insertText')` + dispatched `InputEvent` to satisfy React)
3. Click the Send button
4. Wait 3-4 seconds
5. Re-count message bubbles
6. **If `after <= before`, throw** — message didn't land

**For top-level comments:**
1. Before posting, count `article.comments-comment-entity` elements
2. Type in the comment compose box
3. Click Post
4. Wait 3-4 seconds
5. Re-count
6. **If `after <= before`, throw**

This catches the most insidious failure mode: LinkedIn's UI says "Sent" but the DOM never updated because of a stale React state, a hidden CAPTCHA, an A/B test variant, or a transient error toast. Other tools report success based on "did I click the button?" — this tool reports success based on "did the message actually appear?"

**Tradeoff:** the verification takes 3-4s per write. If a write fails, you get an explicit exception (and no rate-counter burn), not a silent miss.

### 🌐 5. Real Chrome, not headless

Headless Chrome is detected by LinkedIn and served `Clear-Site-Data: storage` headers that wipe cookies → infinite redirect loop. Direct Node.js `fetch()` to Voyager is blocked by TLS fingerprint check → all requests redirected with `li_at=delete-me`.

**The MCP only attaches to real, non-headless Chrome.** No `--headless` flag, no Playwright-bundled Chromium with `Chrome-bin/`, no fake user-agent strings. The Chrome process runs in a real window with a real cursor that you can see. From LinkedIn's perspective every API call originates from your real Chrome with your real cookies, on your real IP — indistinguishable from clicks you make yourself.

### 🪟 6. Tab reuse, single new tab per session

LinkedIn rate-limits **tab opens** independently of API calls. Opening 5 tabs in 10 seconds → 429 on the 6th tab regardless of how many API calls you've made.

The lib enforces: **reuse an existing LinkedIn tab if one exists** (any `linkedin.com` page in the attached Chrome context). Only open a new tab if none exists, and never more than `LINKEDIN_MCP_RATE_PAGES` (default 15) new tabs per day.

### 🧹 7. Stale Chrome cleanup

If a prior Chrome process exited uncleanly, it leaves a `SingletonLock` symlink in the profile dir pointing to the (now-dead) PID. New Chrome launches see this lock and refuse to start. The MCP detects this:

```typescript
1. Read SingletonLock target → extract PID
2. process.kill(pid, 0) → throws if PID is dead
3. If dead → remove SingletonLock, SingletonCookie, SingletonSocket
4. Launch Chrome normally
```

Without this, a single crash would brick the profile until you manually `rm` the lock.

### 🚧 8. Port collision detection

If your `LINKEDIN_MCP_CDP_PORT` (default 9222) is held by a foreign Chrome with a *different* `--user-data-dir`, the spawn would silently fail (or worse, attach to the wrong profile). The lib explicitly checks:

```
[linkedin] Port 9222 is held by a foreign Chrome (PID 67890,
user-data-dir=/Users/you/Library/Application Support/Google/Chrome).
Expected /Users/you/.linkedin-mcp/chrome/default.
Kill the foreign Chrome (kill 67890) or change LINKEDIN_MCP_CDP_PORT, then retry.
```

You get a clear actionable error instead of "Could not connect to Chrome" 22 seconds later.

### 📊 9. Conservative defaults, easy to verify

| Default cap | Why this number | LinkedIn's actual ceiling |
|---|---|---|
| `connect: 20/day` | Well under LinkedIn's enforcement | ~25–30/day → temp restriction |
| `message: 40/day` | Validated as undetectable for aged accounts | ~50–100/day |
| `view: 80/day` | Conservative for non-Recruiter | ~100–150/day |
| `pages_opened: 15/day` | Tab opens trigger 429 separately from API calls | Soft limit around 20+ |

These are intentionally well below LinkedIn's actual thresholds — leaves headroom for the MCP to take occasional retry loops without busting limits. Override via env if you know your account can handle more (e.g. Premium / Sales Nav users).

### 🕰️ 10. Human pacing baked in

Every write action is sandwiched with skewed-distribution delays:
- 1–3s before the action (mouse settle)
- 5–15s after the action (post-action "reading" pause)
- Every 5-8 actions, a 30s–2min "checking phone" break
- Every 15-20 actions, a 3–5min long break

These delays are non-uniform (skewed toward the short end with occasional long pauses) — flat-interval automation is the easiest pattern for LinkedIn to fingerprint.

### What's NOT enforced (by design)

- **Recipient filtering** — the MCP will happily DM cold (non-connected) people if you ask it to. That's your decision; cold DMs to non-connections is the fastest way to get spam-reported and banned. Recommendation: only DM 1st-degree connections. Check `linkedin_profile_get → network_distance === "DISTANCE_1"` before sending.
- **Message uniqueness** — the MCP doesn't dedupe identical messages across recipients. LinkedIn hashes message bodies; near-duplicate batches get flagged. Vary your copy if you're sending to multiple people.
- **Ignore-list / do-not-contact** — that's policy, not a primitive. Layer it in your calling code (e.g. check a local list before calling `linkedin_messages_send`).
- **Working-hours throttling** — sending at 3am for two weeks straight is a tells. If you cron this, gate it to business-hours equivalents.

These are deliberate omissions — the MCP gives you primitives; you compose the policy.

---

## Architecture (one paragraph)

`src/lib/linkedin.ts` is a thin wrapper around the Voyager API. It connects to your Chrome via CDP (`chromium.connectOverCDP`), grabs a page on `linkedin.com`, and runs API calls inside `page.evaluate()`. The CSRF token comes from `JSESSIONID`; cookies and TLS fingerprint come from your real Chrome. `src/lib/comments.ts` adds comment scrape + reply + top-level-create. `src/server.ts` registers 17 tools and exposes them over stdio. All logging is on stderr (stdout is the JSON-RPC channel). The lib does no third-party calls — only LinkedIn and your local filesystem.

---

## Known LinkedIn DOM quirks (lessons learned)

| Symptom | Cause | Fix |
|---|---|---|
| `messages_send` clicks but DOM unchanged | Profile-action Message link covered by promo SVG that intercepts pointer events | Use direct compose URL (`/messaging/compose/?profileUrn=...&recipient=...&interop=msgOverlay`) — bypasses the click entirely. Done. |
| `getSelfFsdProfileId` returns null on first call | `localStorage` badges + HTML hash references not populated immediately on fresh page | Retries 3× with 2s gaps. Done. |
| 410 Gone on `/identity/profiles/{id}/profileContactInfo` | Endpoint deprecated | Profile data comes from `/identity/dash/profiles?decorationId=TopCardSupplementary-166` instead. Limited fields, but the basics (name, headline, work history, network distance) are reliable. |
| Voyager messaging create returns 403 | `POST /messaging/conversations?action=create` permanently broken | Browser UI for new conversations; Voyager events endpoint for replying in existing threads. |
| 429 on listing connections in parallel | LinkedIn rate-limits tab opens, not just API calls | `pages_opened` daily cap (default 15) + tab reuse — never open more than one new tab per session. |
| `networkidle` never fires on LinkedIn pages | Continuous streaming — Server-Sent Events keep the connection open forever | Always `waitUntil: 'domcontentloaded'`. |

---

## What's NOT in v0.1

| Tool | Why deferred |
|---|---|
| Search by keyword/title | Voyager search is gated unless you have Recruiter. Apify adapter is in the roadmap behind an optional `APIFY_TOKEN`. |
| Bulk profile / post scraping | Same — Apify adapter, opt-in. |
| Like a post / like a comment | Trivial to add — open to PRs. |
| InMail | Voyager InMail balance endpoint exists; sending requires a different surface. Add when needed. |
| Pending sent invitations list | LinkedIn removed the endpoint; no replacement found. Workaround: track sends locally + cross-reference recent connections list. |
| Multi-account in one server | Run multiple MCP instances with different `LINKEDIN_MCP_CHROME_PROFILE_DIR`. Cleaner than juggling cookies. |

---

## Troubleshooting

### Setup-time

**"Another client is using this Chrome profile (PID X)"**
Another MCP server / script holds the lockfile. Wait 5 minutes (stale lockfiles auto-expire) or:
```bash
rm "$LINKEDIN_MCP_CHROME_PROFILE_DIR/linkedin.lock"
```
Only do this if you're sure no other process is using the profile — otherwise you'll race into a 429.

**"Could not connect to Chrome (port 9222) after 22s"**
Chrome failed to start. Most common causes:
- The Chrome binary path is wrong → set `LINKEDIN_MCP_CHROME_PATH`
- Port 9222 is taken by your regular Chrome → kill it or set `LINKEDIN_MCP_CDP_PORT=9333` (any free port)
- Profile dir has stale singleton locks → the lib auto-cleans these but check `chrome-launch.log` in the profile dir for the actual error
- (macOS) Quarantine flag on a downloaded Chrome → `xattr -dr com.apple.quarantine /Applications/Google\ Chrome.app`

**"Port 9222 is held by a foreign Chrome (PID X, user-data-dir=...)"**
Your regular Chrome (or another tool) is on the port. Two fixes:
- Kill the foreign Chrome (the error message gives you the PID)
- Set `LINKEDIN_MCP_CDP_PORT` to a different port (9333, 9444, etc.)

**"Not logged in to LinkedIn"**
The session cookie expired or got invalidated. Re-run Setup step 3 — launch Chrome with the profile dir and log in manually. Your MCP client doesn't need restarting; the next tool call will pick up the fresh session.

### Runtime

**"Daily X limit reached (N/N)"**
You've hit the daily cap. Either wait until midnight UTC for the reset, or knowingly raise the cap via `LINKEDIN_MCP_RATE_X=` env var. Don't override blindly — LinkedIn's actual ceilings aren't much higher than the defaults.

**"Message send not verified — DOM count went from N to N"**
The DM didn't land. The MCP correctly threw without burning your daily-message quota. Common causes:
1. **Page didn't fully render** — retry; the lib has internal retries but transient network issues can defeat them
2. **Recipient restricts messaging** — they've set "Connections only" or blocked you. Check by trying to message them manually in Chrome
3. **LinkedIn served a CAPTCHA** — the compose box never appeared because a security challenge popped instead. Solve it manually in the profile Chrome
4. **You're not actually connected and they require connection** — `linkedin_profile_get` first, check `network_distance === "DISTANCE_1"`

**"Could not find a visible Message button"**
LinkedIn changed the profile-action DOM, or the profile genuinely has no Message option (not connected + messaging restricted). The lib v0.1 bypasses this by using the direct `/messaging/compose/?profileUrn=...` URL — if you're still seeing this error, the slug → fsd_profile_id resolution failed. Check `linkedin_profile_get` for that slug first.

**"Could not determine self fsd_profile ID after 3 attempts"**
Chrome session might be on a non-LinkedIn page or showing an interstitial. Force-navigate to `https://www.linkedin.com/feed/` in the profile Chrome and retry.

**Chrome opens but tool call hangs**
- Check stderr — the lib logs every step with `[linkedin]` prefix. If logs stop mid-flow, that's where it's stuck
- Most likely culprit: a CAPTCHA or "Confirm it's you" page that needs manual interaction in the profile Chrome window
- The MCP doesn't auto-detect every interstitial — when in doubt, click into the profile Chrome window and see what's on screen

**Tool returns instantly with `ok: false`**
Read the `error` field. The MCP wraps every exception into a structured response so the calling LLM can react gracefully. Common ones: `Daily X limit reached`, `Profile not found`, `Cannot parse comment URN`.

### Diagnostic scripts

When something breaks against a specific profile or post, the diagnostic scripts in `scripts/` capture exactly what's on the page:

```bash
# Inventory a profile's Message buttons / aria-labels / classes
LINKEDIN_MCP_CHROME_PROFILE_DIR=~/.linkedin-mcp/chrome/default \
  npx tsx scripts/diag-dm.ts

# Click Message and inspect the DOM that follows
npx tsx scripts/diag-click-then-inspect.ts

# Check whether the compose overlay is in an iframe
npx tsx scripts/diag-iframe.ts
```

Each writes a screenshot to `./diag-*.png` (gitignored) and dumps the DOM inventory to stdout. Use these to derive new selectors when LinkedIn changes the DOM. See `CLAUDE.md` for the patch process.

---

## License

MIT — see `LICENSE`. Use it, fork it, ship it.

---

## Credits

Built by extracting the Voyager client from a production sales-automation stack. The hard parts (CDP attach, lockfile concurrency, send verification, daily rate persistence) are all battle-tested. Naming and packaging are fresh for the OSS release.
