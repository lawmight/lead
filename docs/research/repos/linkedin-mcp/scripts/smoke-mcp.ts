/**
 * MCP wire-protocol smoke test — spawns the actual stdio server and verifies
 *   1. tools/list returns all expected tools
 *   2. tools/call works for a read-only call
 *
 * Doesn't import the lib directly — exercises the JSON-RPC path the way
 * Claude Code / Cursor / Claude Desktop will.
 */

import { spawn } from "child_process";
import { createInterface } from "readline";

const EXPECTED_TOOLS = [
  "linkedin_session_open",
  "linkedin_session_status",
  "linkedin_session_close",
  "linkedin_rate_limit_get",
  "linkedin_rate_limit_check",
  "linkedin_profile_get",
  "linkedin_profile_get_self",
  "linkedin_connections_send_request",
  "linkedin_connections_list_recent",
  "linkedin_connections_list_all",
  "linkedin_messages_send",
  "linkedin_messages_reply",
  "linkedin_messages_list_conversations",
  "linkedin_posts_create",
  "linkedin_posts_get_comments",
  "linkedin_posts_reply_to_comment",
  "linkedin_posts_create_comment",
];

const child = spawn("node", ["dist/server.js"], {
  stdio: ["pipe", "pipe", "inherit"],
  env: { ...process.env },
});

const rl = createInterface({ input: child.stdout });

let pending = new Map<number, (msg: any) => void>();

rl.on("line", (line) => {
  try {
    const msg = JSON.parse(line);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)!(msg);
      pending.delete(msg.id);
    }
  } catch {}
});

function rpc(id: number, method: string, params: any): Promise<any> {
  return new Promise((resolve) => {
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  });
}

async function main() {
  // initialize handshake (MCP requires this)
  await rpc(0, "initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke-test", version: "0.0.1" },
  });
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

  // 1. tools/list
  console.log("\n=== tools/list ===");
  const listRes = await rpc(1, "tools/list", {});
  const got = (listRes.result?.tools || []).map((t: any) => t.name);
  console.log(`Got ${got.length} tools`);

  const missing = EXPECTED_TOOLS.filter(t => !got.includes(t));
  const extra = got.filter((t: string) => !EXPECTED_TOOLS.includes(t));
  if (missing.length) console.log(`✗ MISSING:`, missing);
  if (extra.length) console.log(`? EXTRA:`, extra);
  if (!missing.length && !extra.length) console.log(`✓ All ${EXPECTED_TOOLS.length} tools present`);

  // 2. tools/call → linkedin_session_status (no Chrome attach, safe)
  console.log("\n=== tools/call linkedin_session_status ===");
  const statusRes = await rpc(2, "tools/call", {
    name: "linkedin_session_status",
    arguments: {},
  });
  const statusText = statusRes.result?.content?.[0]?.text || "(no text)";
  console.log(statusText.slice(0, 500));

  // 3. tools/call → linkedin_rate_limit_check connect
  console.log("\n=== tools/call linkedin_rate_limit_check(connect) ===");
  const checkRes = await rpc(3, "tools/call", {
    name: "linkedin_rate_limit_check",
    arguments: { action: "connect" },
  });
  console.log(checkRes.result?.content?.[0]?.text || JSON.stringify(checkRes));

  console.log("\n=== done ===");
  child.kill("SIGTERM");
  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL", err);
  child.kill("SIGTERM");
  process.exit(1);
});
