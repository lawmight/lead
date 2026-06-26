/**
 * Post comments — scrape, reply, create.
 *
 * Three operations:
 *   - getPostComments(activityId)      → Voyager GraphQL scrape
 *   - replyToComment(commentUrn, text) → Voyager NormComments POST (201)
 *   - createTopLevelComment(activityId, text) → browser UI (most reliable)
 *
 * Top-level commenting uses the UI because the Voyager threadUrn format for
 * top-level comments isn't stable across post types (ugcPost vs share vs
 * activity URN translation). The UI path "just works."
 */

import type { Page } from "playwright";
import { getLinkedInPage, sleep } from "./linkedin.js";
import { humanDelay } from "./behavior.js";

const COMMENTS_QUERY_ID = "voyagerSocialDashComments.afec6d88d7810d45548797a8dac4fb87";

export interface PostComment {
  commenterName: string;
  commenterLinkedinUrl: string;
  commenterLinkedinId: string;
  commentText: string;
  commentedAt: string | null;
  commentUrn: string;
}

/**
 * Accept a LinkedIn post URL OR activity URN OR raw activity ID, return the
 * numeric activity ID.
 */
export function normalizeActivityId(input: string): string {
  if (/^\d+$/.test(input)) return input;
  const urnMatch = input.match(/urn:li:activity:(\d+)/);
  if (urnMatch) return urnMatch[1];
  const urlMatch = input.match(/activity[-_:](\d+)/);
  if (urlMatch) return urlMatch[1];
  throw new Error(`Could not extract activity ID from: ${input}`);
}

/**
 * Scrape comments on a post via Voyager GraphQL.
 * Returns comments with commenter name, slug, headline, comment text, and the
 * comment URN (needed for replies).
 */
export async function getPostComments(
  activityIdOrUrl: string,
  options?: { maxPages?: number; verbose?: boolean }
): Promise<PostComment[]> {
  const activityId = normalizeActivityId(activityIdOrUrl);
  const page = await getLinkedInPage();
  const maxPages = options?.maxPages ?? 10;
  const all: PostComment[] = [];
  let start = 0;
  const count = 50;

  for (let attempt = 0; attempt < maxPages; attempt++) {
    if (options?.verbose) {
      console.error(`  [comments] Fetching start=${start} count=${count}`);
    }

    const socialDetailUrn = `urn%3Ali%3Afsd_socialDetail%3A%28urn%3Ali%3Aactivity%3A${activityId}%2Curn%3Ali%3Aactivity%3A${activityId}%2Curn%3Ali%3AhighlightedReply%3A-%29`;
    const variables = `(count:${count},numReplies:1,socialDetailUrn:${socialDetailUrn},sortOrder:RELEVANCE,start:${start})`;
    const path = `/graphql?includeWebMetadata=true&variables=${variables}&queryId=${COMMENTS_QUERY_ID}`;

    const script = `
      (async () => {
        try {
          const csrfToken = document.cookie
            .split("; ")
            .find(c => c.startsWith("JSESSIONID="))
            ?.split("=")[1]
            ?.replace(/"/g, "") || "";

          const res = await fetch("/voyager/api${path}", {
            method: "GET",
            headers: {
              "accept": "application/vnd.linkedin.normalized+json+2.1",
              "x-restli-protocol-version": "2.0.0",
              "x-li-lang": "en_US",
              "csrf-token": csrfToken,
            },
          });

          if (!res.ok) {
            const text = await res.text();
            return { __error: true, status: res.status, body: text };
          }

          const text = await res.text();
          try { return JSON.parse(text); }
          catch { return { __raw: text }; }
        } catch (err) {
          return { __error: true, status: 0, body: String(err) };
        }
      })()
    `;

    const result = await page.evaluate(script);

    if ((result as any)?.__error) {
      console.error(`  [comments] Fetch failed: ${(result as any).status} - ${String((result as any).body).slice(0, 200)}`);
      break;
    }

    const pageComments = parseCommentsResponse(result);
    if (pageComments.length === 0) break;

    all.push(...pageComments);
    start += count;
    if (pageComments.length < count) break;
    await humanDelay(1500, 3500);
  }

  return all;
}

function parseCommentsResponse(response: any): PostComment[] {
  const included = response?.included || [];
  const out: PostComment[] = [];

  const commentEntities = included.filter(
    (e: any) =>
      e["$type"]?.includes("Comment") &&
      e.commentary?.text !== undefined
  );

  for (const comment of commentEntities) {
    const commentText = comment.commentary?.text || "";
    const commentUrn = comment.entityUrn || comment.urn || "";
    const commenter = comment.commenter || {};
    const displayName = commenter.title?.text || "";
    const navigationUrl = commenter.navigationUrl || "";
    const slugMatch = navigationUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
    const publicIdentifier = slugMatch ? slugMatch[1] : "";
    const commenterProfileId = commenter.commenterProfileId || "";
    const memberUrn = commenter.urn || "";
    const fsdProfileId = commenterProfileId ||
      (memberUrn ? memberUrn.split(":").pop() || "" : "");
    const linkedinUrl = publicIdentifier
      ? `https://www.linkedin.com/in/${publicIdentifier}`
      : navigationUrl || "";
    const createdAt = comment.createdAt || comment.created?.time;
    const commentedAt = createdAt ? new Date(createdAt).toISOString() : null;

    out.push({
      commenterName: displayName || "Unknown",
      commenterLinkedinUrl: linkedinUrl,
      commenterLinkedinId: fsdProfileId,
      commentText,
      commentedAt,
      commentUrn,
    });
  }

  return out;
}

/**
 * Reply to a specific comment thread via Voyager API.
 *
 * `parentCommentUrn` is the URN returned by getPostComments — format:
 *   urn:li:fsd_comment:(commentId,urn:li:ugcPost:ugcPostId)
 *
 * Returns true on 201 (created), false on any other status.
 */
export async function replyToComment(
  parentCommentUrn: string,
  replyText: string
): Promise<boolean> {
  const urnMatch = parentCommentUrn.match(/fsd_comment:\((\d+),urn:li:ugcPost:(\d+)\)/);
  if (!urnMatch) {
    throw new Error(`Cannot parse comment URN: ${parentCommentUrn}`);
  }

  const commentId = urnMatch[1];
  const ugcPostId = urnMatch[2];
  const threadUrn = `urn:li:comment:(ugcPost:${ugcPostId},${commentId})`;

  const page = await getLinkedInPage();
  console.error(`[linkedin] Replying to comment ${commentId} on ugcPost ${ugcPostId}...`);

  const payload = JSON.stringify({
    commentary: {
      text: replyText,
      attributesV2: [],
      "$type": "com.linkedin.voyager.dash.common.text.TextViewModel",
    },
    threadUrn,
  });

  const result = await page.evaluate(`
    (async () => {
      try {
        var csrfToken = document.cookie
          .split("; ")
          .find(function(c) { return c.startsWith("JSESSIONID="); })
          ?.split("=")[1]
          ?.replace(/"/g, "") || "";

        var res = await fetch("/voyager/api/voyagerSocialDashNormComments?decorationId=com.linkedin.voyager.dash.deco.social.NormComment-43", {
          method: "POST",
          headers: {
            "accept": "application/vnd.linkedin.normalized+json+2.1",
            "content-type": "application/json; charset=UTF-8",
            "x-restli-protocol-version": "2.0.0",
            "x-li-lang": "en_US",
            "csrf-token": csrfToken,
          },
          body: ${JSON.stringify(payload)},
        });

        return { status: res.status, ok: res.ok };
      } catch (err) {
        return { status: 0, ok: false, error: String(err) };
      }
    })()
  `);

  const res = result as any;
  if (res.status === 201) {
    console.error(`[linkedin] Reply posted (201)`);
    return true;
  }
  console.error(`[linkedin] Reply API returned ${res.status}`);
  return false;
}

/**
 * Post a top-level comment on a LinkedIn post via the browser UI.
 *
 * Why UI not API: top-level comment threadUrn requires ugcPost vs share URN
 * resolution that's brittle. UI clicks the same compose box a human would —
 * works for any post type and survives LinkedIn schema changes.
 *
 * Verifies by counting comment articles before/after.
 */
export async function createTopLevelComment(
  activityIdOrUrl: string,
  text: string
): Promise<{ verified: boolean; before: number; after: number }> {
  const activityId = normalizeActivityId(activityIdOrUrl);
  const page = await getLinkedInPage();

  const postUrl = `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}/`;
  console.error(`[linkedin] Navigating to post for comment: ${postUrl}`);
  await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
  await humanDelay(3500, 5500);

  // Scroll the comment section into view; trigger lazy-load of the comment box
  await page.evaluate(`window.scrollBy(0, 700)`);
  await humanDelay(1200, 2000);

  // Click the comment button to open the compose box if it's not already shown.
  // Modern LinkedIn shows the box inline on scroll, but some post types still gate it.
  try {
    const commentBtn = page.locator('button[aria-label^="Comment"]').first();
    if (await commentBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await commentBtn.click({ timeout: 3000 }).catch(() => {});
      await humanDelay(800, 1500);
    }
  } catch {}

  // Count existing comment articles BEFORE (for verification)
  // LinkedIn renders each comment as an <article> inside .comments-comments-list or similar.
  const beforeCount = await page.evaluate(`
    document.querySelectorAll('article.comments-comment-entity, [data-test-id="comments-comment-item"], article[data-test-id]').length
  `) as number;

  // Focus the comment compose box. Selector matches modern LinkedIn:
  //   [aria-label="Text editor for creating content"]  ← post composer (skip)
  //   [contenteditable="true"][data-placeholder="Add a comment…"]  ← comment composer
  //   [role="textbox"][contenteditable="true"] inside .comments-comment-box
  const composeFocused = await page.evaluate(`
    (function() {
      // Prefer the comment composer specifically
      var candidates = document.querySelectorAll('[contenteditable="true"]');
      var commentBox = null;
      for (var i = 0; i < candidates.length; i++) {
        var el = candidates[i];
        var inCommentBox = el.closest('.comments-comment-box, .comments-comment-texteditor, [class*="comments-comment-box"], [class*="comment-box"]');
        var placeholder = (el.getAttribute('data-placeholder') || el.getAttribute('aria-label') || '').toLowerCase();
        if (inCommentBox || placeholder.includes('comment')) {
          commentBox = el;
          break;
        }
      }
      if (!commentBox) return { found: false };
      commentBox.scrollIntoView({ block: 'center', behavior: 'instant' });
      commentBox.focus();
      return { found: true };
    })()
  `) as any;

  if (!composeFocused?.found) {
    throw new Error("Could not find the comment compose box on this post");
  }
  await humanDelay(600, 1100);

  // Type using execCommand to trigger React's synthetic events (same trick as DM compose)
  await page.evaluate(`
    (function() {
      var candidates = document.querySelectorAll('[contenteditable="true"]');
      var commentBox = null;
      for (var i = 0; i < candidates.length; i++) {
        var el = candidates[i];
        var inCommentBox = el.closest('.comments-comment-box, .comments-comment-texteditor, [class*="comments-comment-box"], [class*="comment-box"]');
        var placeholder = (el.getAttribute('data-placeholder') || el.getAttribute('aria-label') || '').toLowerCase();
        if (inCommentBox || placeholder.includes('comment')) { commentBox = el; break; }
      }
      if (!commentBox) return;
      commentBox.focus();
      document.execCommand('selectAll', false);
      document.execCommand('delete', false);
      document.execCommand('insertText', false, ${JSON.stringify(text)});
    })()
  `);

  await humanDelay(800, 1500);

  // Click the Post button. LinkedIn's comment submit selectors:
  //   button.comments-comment-box__submit-button
  //   button.comments-comment-box__submit-button--cr
  //   button[data-test-id="comments-comment-box__submit-button"]
  const clickResult = await page.evaluate(`
    (function() {
      var btns = document.querySelectorAll('button.comments-comment-box__submit-button, button.comments-comment-box__submit-button--cr, button[class*="comments-comment-box__submit-button"]');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        if (b.offsetParent !== null && !b.disabled) {
          b.scrollIntoView({ block: 'center' });
          b.click();
          return "clicked";
        }
      }
      // Fallback: any visible button with text "Post" inside a comment box
      var allBtns = document.querySelectorAll('button');
      for (var i = 0; i < allBtns.length; i++) {
        var b = allBtns[i];
        if (b.disabled || b.offsetParent === null) continue;
        var txt = (b.innerText || '').trim().toLowerCase();
        if (txt === 'post' && b.closest('[class*="comment"], [class*="comments"]')) {
          b.click();
          return "clicked-fallback";
        }
      }
      return "no enabled post button";
    })()
  `);

  if (String(clickResult).startsWith("no")) {
    throw new Error(`Could not click Post button (state: ${clickResult})`);
  }
  console.error(`[linkedin] UI: clicked Post (${clickResult})`);

  // Wait for the comment to appear in the list
  await sleep(3500);

  const afterCount = await page.evaluate(`
    document.querySelectorAll('article.comments-comment-entity, [data-test-id="comments-comment-item"], article[data-test-id]').length
  `) as number;

  const verified = afterCount > beforeCount;
  console.error(`[linkedin] Comment ${verified ? "posted (verified " + beforeCount + "→" + afterCount + ")" : "NOT VERIFIED (" + beforeCount + "→" + afterCount + ")"}`);

  return { verified, before: beforeCount, after: afterCount };
}
