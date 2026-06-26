# Claude Code integration

Add to `~/.claude.json` (or a project-level `.mcp.json`):

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

Restart Claude Code. The 17 tools appear, prefixed `mcp__linkedin__linkedin_*`.

---

## Example session

```
> List my last 5 LinkedIn conversations
[uses linkedin_messages_list_conversations]

> Who's been on my recent connections list this week?
[uses linkedin_connections_list_recent]

> Get the profile for /in/someone — are they connected?
[uses linkedin_profile_get → check network_distance]

> DM Sarah "thanks for the connect, would love to hear what you're building"
[uses linkedin_messages_send — verified by message-count delta]

> Scrape comments on this post: https://linkedin.com/feed/update/urn:li:activity:7448...
[uses linkedin_posts_get_comments]
```

---

## A simple "outreach assistant" skill

Save as `.claude/commands/li-outreach.md`:

```markdown
You have the linkedin MCP available. When the user asks you to reach out to someone:

1. Resolve them: linkedin_profile_get with their slug or URL
2. Check network distance — if DISTANCE_1 (connected), use linkedin_messages_send. If DISTANCE_2+, use linkedin_connections_send_request with a personalized note (300 char limit)
3. Before any write, call linkedin_rate_limit_check to confirm you're not at the cap. If you are, tell the user and stop
4. After a successful send, restate what was sent in a single line for the record
5. Never send the same message to multiple people in one batch without explicit confirmation
```

Now the user can say `/li-outreach reach out to /in/janedoe about X` and get the right flow.

---

## Tips

- **Restart your MCP client after editing `.mcp.json`** — Claude Code only re-reads MCP config on startup.
- **One client at a time per Chrome profile.** If you want to run the MCP from Claude Code AND a separate script, set up separate profile dirs.
- **The first tool call is slow** (~15s) — that's the Chrome attach. Subsequent calls are fast.
- **`linkedin_rate_limit_get` is free** — call it any time to check usage without touching LinkedIn.
