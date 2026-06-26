#!/usr/bin/env node
/**
 * linkedin-mcp — stdio MCP server exposing the in-browser Voyager API.
 *
 * Each tool is a thin wrapper over src/lib/. The server owns Chrome lifecycle:
 * opens lazily on first tool call, releases on SIGINT/SIGTERM/exit.
 *
 * Logging goes to stderr exclusively; stdout is the MCP protocol channel.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

import { getConfig } from "./config.js";
import {
  getLinkedInPage,
  getSelfFsdProfileId,
  getProfile,
  sendConnectionRequest,
  startChat,
  sendMessage,
  listChats,
  listChatsPaginated,
  createPost,
  getRecentConnections,
  getAllConnections,
  getDailyRates,
  checkRateLimit,
  cleanup,
} from "./lib/linkedin.js";
import {
  getPostComments,
  replyToComment,
  createTopLevelComment,
  normalizeActivityId,
} from "./lib/comments.js";

// ============================================
// Tool catalog
// ============================================

const tools: Tool[] = [
  // ---- session ----
  {
    name: "linkedin_session_open",
    description: "Attach to (or launch) Chrome with the configured LinkedIn profile. Returns session status, self profile ID, and today's rate usage. Safe to call repeatedly — subsequent calls return the cached session.",
    inputSchema: {
      type: "object",
      properties: {
        warmup: { type: "boolean", description: "If true, browse the feed for 30-60s before returning (recommended for accounts under 30 days old). Default false." },
      },
    },
  },
  {
    name: "linkedin_session_status",
    description: "Check whether a Chrome session is currently attached. Does not launch Chrome.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "linkedin_session_close",
    description: "Close the Chrome browser controlled by this MCP and release the lockfile. Use before shutting down or switching profiles.",
    inputSchema: {
      type: "object",
      properties: {
        keepChromeOpen: { type: "boolean", description: "If true, detach but leave Chrome running. Default false (kills Chrome)." },
      },
    },
  },

  // ---- rate limit ----
  {
    name: "linkedin_rate_limit_get",
    description: "Get today's action counts and the configured daily caps for connect/message/view/pages_opened.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "linkedin_rate_limit_check",
    description: "Non-throwing pre-flight check for an action. Returns { canDo, used, limit, remaining }. Use this before deciding whether to call a write tool.",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["connect", "message", "view"] },
      },
      required: ["action"],
    },
  },

  // ---- profile ----
  {
    name: "linkedin_profile_get",
    description: "Fetch a LinkedIn profile by public slug (e.g. 'creativefreya') or full URL. Returns name, headline, location, work experience, skills, connections count, and network distance (DISTANCE_1 = connected, DISTANCE_2 = mutual, etc).",
    inputSchema: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "Public slug or linkedin.com/in/ URL" },
      },
      required: ["identifier"],
    },
  },
  {
    name: "linkedin_profile_get_self",
    description: "Get the current logged-in user's fsd_profile ID (the ACoAA... hash). Useful for filtering self out of conversation lists.",
    inputSchema: { type: "object", properties: {} },
  },

  // ---- connections ----
  {
    name: "linkedin_connections_send_request",
    description: "Send a connection request. Counts against the daily 'connect' cap. The optional note has a 300-char limit and only sends if you have notes available (~5/month free, ~200/month on LinkedIn Premium).",
    inputSchema: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "Slug, URN (urn:li:fsd_profile:...), or ACoAA... hash" },
        note: { type: "string", description: "Optional personalized note (≤300 chars)" },
      },
      required: ["identifier"],
    },
  },
  {
    name: "linkedin_connections_list_recent",
    description: "List recently-added 1st-degree connections (sorted newest first). Returns slug, name, headline, connectedAt for each.",
    inputSchema: {
      type: "object",
      properties: {
        count: { type: "number", description: "Number to fetch (default 40, max 500)", default: 40 },
      },
    },
  },
  {
    name: "linkedin_connections_list_all",
    description: "Paginate the full connections list. Long-running for large networks. Returns all unique 1st-degree connections.",
    inputSchema: {
      type: "object",
      properties: {
        max: { type: "number", description: "Hard cap on total returned (default 2000)", default: 2000 },
      },
    },
  },

  // ---- messages ----
  {
    name: "linkedin_messages_send",
    description: "Send a DM to a LinkedIn user by slug. Uses the browser UI (the Voyager messaging create endpoint returns 403). Verified via DOM message-count delta — throws if the message didn't actually land. Counts against the daily 'message' cap.",
    inputSchema: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "Slug or ACoAA hash. Slug is more reliable." },
        text: { type: "string", description: "Message body. Multi-line allowed; newlines preserved." },
      },
      required: ["identifier", "text"],
    },
  },
  {
    name: "linkedin_messages_reply",
    description: "Reply in an existing conversation by backend URN (from linkedin_messages_list_conversations). Uses Voyager messaging events endpoint. Counts against the daily 'message' cap.",
    inputSchema: {
      type: "object",
      properties: {
        backendUrn: { type: "string", description: "conversation.backendUrn from listConversations" },
        text: { type: "string" },
      },
      required: ["backendUrn", "text"],
    },
  },
  {
    name: "linkedin_messages_list_conversations",
    description: "List recent DM conversations with last message, participants (excluding self), unread count, and pagination cursor. Returns up to `limit` items, fetching multiple pages if needed.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max conversations to return (default 20)", default: 20 },
        cursor: { type: "string", description: "nextCursor from a prior call" },
      },
    },
  },

  // ---- posts & comments ----
  {
    name: "linkedin_posts_create",
    description: "Post a text update to your LinkedIn feed (visibility: ANYONE, comments: ALL). Returns the post URN on success.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Post body. Can include line breaks and emoji." },
      },
      required: ["text"],
    },
  },
  {
    name: "linkedin_posts_get_comments",
    description: "Scrape all comments on a LinkedIn post. Returns commenter name, slug, headline, comment text, timestamp, and commentUrn (use commentUrn with linkedin_posts_reply_to_comment).",
    inputSchema: {
      type: "object",
      properties: {
        post: { type: "string", description: "Activity URN (urn:li:activity:NNN), activity ID (NNN), or feed URL" },
        maxPages: { type: "number", description: "Pagination cap (50 comments/page; default 10 pages)", default: 10 },
      },
      required: ["post"],
    },
  },
  {
    name: "linkedin_posts_reply_to_comment",
    description: "Reply to a specific comment thread. Pass commentUrn from linkedin_posts_get_comments. Returns 201 on success.",
    inputSchema: {
      type: "object",
      properties: {
        commentUrn: { type: "string", description: "URN like urn:li:fsd_comment:(commentId,urn:li:ugcPost:ugcPostId)" },
        text: { type: "string" },
      },
      required: ["commentUrn", "text"],
    },
  },
  {
    name: "linkedin_posts_create_comment",
    description: "Post a top-level comment on a LinkedIn post via the browser UI. Verified by comment-count delta. Use linkedin_posts_reply_to_comment for nested replies.",
    inputSchema: {
      type: "object",
      properties: {
        post: { type: "string", description: "Activity URN, activity ID, or feed URL" },
        text: { type: "string", description: "Comment body" },
      },
      required: ["post", "text"],
    },
  },
];

// ============================================
// Tool handlers
// ============================================

type Handler = (args: any) => Promise<unknown>;

const handlers: Record<string, Handler> = {
  // ---- session ----
  linkedin_session_open: async (args) => {
    const page = await getLinkedInPage({ warmup: args?.warmup });
    const selfId = await getSelfFsdProfileId().catch(() => null);
    const rates = getDailyRates();
    return {
      ok: true,
      url: page.url(),
      selfFsdProfileId: selfId,
      dailyRates: rates,
      config: {
        chromeProfileDir: getConfig().chromeProfileDir,
        cdpPort: getConfig().cdpPort,
      },
    };
  },

  linkedin_session_status: async () => {
    const rates = getDailyRates();
    return {
      lockFile: getConfig().lockFile,
      rateFile: getConfig().rateFile,
      cdpPort: getConfig().cdpPort,
      dailyRates: rates,
    };
  },

  linkedin_session_close: async (args) => {
    await cleanup({ keepChromeOpen: args?.keepChromeOpen });
    return { ok: true, closed: true };
  },

  // ---- rate limit ----
  linkedin_rate_limit_get: async () => {
    return getDailyRates();
  },

  linkedin_rate_limit_check: async (args) => {
    return checkRateLimit(args.action);
  },

  // ---- profile ----
  linkedin_profile_get: async (args) => {
    const profile = await getProfile(args.identifier);
    if (!profile) return { ok: false, error: "Profile not found" };
    return { ok: true, profile };
  },

  linkedin_profile_get_self: async () => {
    const id = await getSelfFsdProfileId();
    return { ok: true, fsdProfileId: id };
  },

  // ---- connections ----
  linkedin_connections_send_request: async (args) => {
    const result = await sendConnectionRequest(args.identifier, args.note);
    const rates = getDailyRates();
    return { ok: true, invitation: result, dailyRates: rates };
  },

  linkedin_connections_list_recent: async (args) => {
    const list = await getRecentConnections(args?.count ?? 40);
    return { ok: true, count: list.length, connections: list };
  },

  linkedin_connections_list_all: async (args) => {
    const list = await getAllConnections(args?.max ?? 2000);
    return { ok: true, count: list.length, connections: list };
  },

  // ---- messages ----
  linkedin_messages_send: async (args) => {
    const result = await startChat(args.identifier, args.text);
    const rates = getDailyRates();
    return { ok: true, chat: result, verified: true, dailyRates: rates };
  },

  linkedin_messages_reply: async (args) => {
    const result = await sendMessage(args.backendUrn, args.text);
    const rates = getDailyRates();
    return { ok: true, message: result, dailyRates: rates };
  },

  linkedin_messages_list_conversations: async (args) => {
    const result = await listChatsPaginated({ limit: args?.limit, cursor: args?.cursor });
    return { ok: true, count: result.items.length, conversations: result.items, cursor: result.cursor };
  },

  // ---- posts ----
  linkedin_posts_create: async (args) => {
    const result = await createPost(args.text);
    return { ok: true, result };
  },

  linkedin_posts_get_comments: async (args) => {
    const activityId = normalizeActivityId(args.post);
    const comments = await getPostComments(activityId, { maxPages: args?.maxPages });
    return { ok: true, activityId, count: comments.length, comments };
  },

  linkedin_posts_reply_to_comment: async (args) => {
    const ok = await replyToComment(args.commentUrn, args.text);
    return { ok, posted: ok };
  },

  linkedin_posts_create_comment: async (args) => {
    const activityId = normalizeActivityId(args.post);
    const result = await createTopLevelComment(activityId, args.text);
    return { ok: result.verified, ...result, activityId };
  },
};

// ============================================
// Server wiring
// ============================================

const server = new Server(
  { name: "linkedin-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const handler = handlers[name];
  if (!handler) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
      isError: true,
    };
  }

  try {
    const result = await handler(args ?? {});
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err: any) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: err.message || String(err) }, null, 2) }],
      isError: true,
    };
  }
});

async function main() {
  // Validate config early
  const cfg = getConfig();
  console.error(`[linkedin-mcp] starting v0.1.0`);
  console.error(`[linkedin-mcp] chrome profile: ${cfg.chromeProfileDir}`);
  console.error(`[linkedin-mcp] cdp port: ${cfg.cdpPort}`);
  console.error(`[linkedin-mcp] daily caps: connect=${cfg.rateLimits.connect} message=${cfg.rateLimits.message} view=${cfg.rateLimits.view}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Cleanup on shutdown
const shutdown = async () => {
  try {
    await cleanup({ keepChromeOpen: true });
  } catch {}
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((err) => {
  console.error("[linkedin-mcp] fatal:", err);
  process.exit(1);
});
