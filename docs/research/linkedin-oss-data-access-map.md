# LinkedIn Open-Source Data Access Research

*Research date: June 26, 2026. Methods: Nia `tracer` (agent/read/glob modes), GitHub API search, and direct inspection of cloned repositories.*

---

## Local clones (this workspace)

All **14 repositories** below are cloned into `docs/research/repos/` (~33 MB shallow). Re-clone with:

```bash
bash scripts/clone_linkedin_oss_repos.sh
```

| Local path | GitHub | Commit (at clone) | Start here |
|------------|--------|-------------------|------------|
| `docs/research/repos/linkedin-api/` | [nsandman/linkedin-api](https://github.com/nsandman/linkedin-api) | `c75a3cb` | `linkedin_api/linkedin.py`, `DOCS.md` |
| `docs/research/repos/LinkedInDumper/` | [l4rm4nd/LinkedInDumper](https://github.com/l4rm4nd/LinkedInDumper) | `0ded335` | `linkedindumper.py` |
| `docs/research/repos/linkedin-mcp/` | [Michaelrecycle/linkedin-mcp](https://github.com/Michaelrecycle/linkedin-mcp) | `5449d47` | `src/lib/linkedin.ts` |
| `docs/research/repos/codyrobertson-linkedin-cli/` | [codyrobertson/linkedin-cli](https://github.com/codyrobertson/linkedin-cli) | `af6484c` | `linkedin_cli/voyager.py` |
| `docs/research/repos/eracle-linkedin-cli/` | [eracle/linkedin-cli](https://github.com/eracle/linkedin-cli) | `ce01c29` | `src/linkedin_cli/api/voyager.py` |
| `docs/research/repos/OpenOutreach/` | [eracle/OpenOutreach](https://github.com/eracle/OpenOutreach) | `4e29945` | `openoutreach/`, `tests/api/test_voyager.py` |
| `docs/research/repos/linkedin_scraper/` | [joeyism/linkedin_scraper](https://github.com/joeyism/linkedin_scraper) | `b1cdc1c` | `linkedin_scraper/core/browser.py` |
| `docs/research/repos/linkedin-mcp-server/` | [stickerdaniel/linkedin-mcp-server](https://github.com/stickerdaniel/linkedin-mcp-server) | `e63c9aa` | `linkedin_mcp_server/core/browser.py` |
| `docs/research/repos/linvo-scraper/` | [linvo-io/linvo-scraper](https://github.com/linvo-io/linvo-scraper) | `cfbe910` | `src/linkedin/` (Sales Nav in `linkedin.sales.page.service.ts`) |
| `docs/research/repos/linkedin-profile-scraper-api/` | [josephlimtech/linkedin-profile-scraper-api](https://github.com/josephlimtech/linkedin-profile-scraper-api) | `9fc7125` | `src/index.ts` |
| `docs/research/repos/inb/` | [joshiayush/inb](https://github.com/joshiayush/inb) | `5b7a1f3` | `inb/api/client.py` |
| `docs/research/repos/linkedin-voyager-sdk/` | [trieb-work/linkedin-voyager-sdk](https://github.com/trieb-work/linkedin-voyager-sdk) | `7277cfc` | `src/profile/index.ts` |
| `docs/research/repos/linkedin-scraping-tools/` | [ArthurVerrez/linkedin-scraping-tools](https://github.com/ArthurVerrez/linkedin-scraping-tools) | `3f8e3f1` | `lksn_search_scraper.py` |
| `docs/research/repos/scraping-linkedin-salesNavigator/` | [padmanabhan-s/scraping-linkedin-salesNavigator](https://github.com/padmanabhan-s/scraping-linkedin-salesNavigator) | `b9776c9` | `README.md` |

Full manifest with key files: [repos-manifest.json](repos-manifest.json) · Index: [repos/README.md](repos/README.md)

---

## Executive Summary

Community projects that reverse-engineer LinkedIn data access fall into **three reliability tiers**:

1. **Voyager API clients (HTTP)** — Direct calls to `https://www.linkedin.com/voyager/api` with `li_at` + `JSESSIONID`/`csrf-token`. Fast and structured, but increasingly brittle: LinkedIn blocks raw `requests`/`fetch` from Node/Python via TLS fingerprinting and redirects (`li_at=delete-me`). Best-maintained forks are **stale** (nsandman/linkedin-api last pushed April 2021).

2. **In-browser Voyager calls (modern best practice)** — Attach to real Chrome/Playwright, then call `/voyager/api/...` via `page.evaluate(fetch(...))` so requests inherit browser TLS, cookies, `sec-ch-*`, and `x-li-track`. Documented extensively in **Michaelrecycle/linkedin-mcp**, **codyrobertson/linkedin-cli**, **eracle/linkedin-cli**, and used by **OpenOutreach**.

3. **DOM / hybrid scraping** — Playwright/Puppeteer/Selenium with CSS selectors (`pv-*`, `artdeco-*`) or `innerText` extraction. More resilient approaches avoid brittle selectors: **stickerdaniel/linkedin-mcp-server** uses navigate-scroll-`innerText`; **linvo-scraper** intercepts JSON from network responses and embedded `<code>` blocks.

**Most complete API endpoint maps** live in: nsandman/linkedin-api (legacy REST), l4rm4nd/LinkedInDumper (modern dash + GraphQL), Michaelrecycle/linkedin-mcp and codyrobertson/linkedin-cli (GraphQL queryIds + writes).

**Sales Navigator** coverage is thin and mostly DOM-based (ArthurVerrez, padmanabhan-s) or JSON interception (linvo-scraper). No OSS project maintains a stable Sales Nav API map.

**Note:** The canonical `tomquirk/linkedin-api` repo returns GitHub 404 (deleted/archived). **nsandman/linkedin-api** is the surviving fork (~171 stars, unmaintained since 2021).

---

## Top Repos by Category

### Auth / Session

| Repo | URL | Stars | Access pattern | Key files | Reliability approach | Limitations |
|------|-----|-------|----------------|-----------|---------------------|-------------|
| **linkedin-mcp-server** | https://github.com/stickerdaniel/linkedin-mcp-server | ~2,517 | Playwright persistent profile + Chrome cookie import | `browser_import/extract.py`, `core/browser.py` | Decrypts `li_at` from Chrome/Chromium/Brave/Edge/Arc cookies DB (v10/v20 app-bound); ranks profiles by `last_access`; persistent Patchright context | macOS keychain prompts; v20 app-bound cookies may be undecryptable; no raw Voyager client |
| **Michaelrecycle/linkedin-mcp** | https://github.com/Michaelrecycle/linkedin-mcp | ~1 | Real Chrome CDP attach; optional `LINKEDIN_LI_AT` fallback | `src/lib/linkedin.ts`, `src/config.ts` | **Explicitly rejects headless** and direct Node `fetch` to Voyager; attaches to real Chrome with real cookies | Very new/low adoption; TypeScript only |
| **joeyism/linkedin_scraper** | https://github.com/joeyism/linkedin_scraper | ~4,262 | Playwright session JSON (`session.json`) | `core/auth.py`, `core/browser.py` | Manual or credential login; browser warm-up (Google/Wikipedia/GitHub); session reuse | Credential login triggers checkpoints; session expires |
| **nsandman/linkedin-api** | https://github.com/nsandman/linkedin-api | ~171 | Username/password → `/uas/authenticate` | `linkedin_api/client.py` | Pickle-cached cookies; `csrf-token` from `JSESSIONID` | Mobile auth headers outdated; programmatic login often blocked; unmaintained |
| **joshiayush/inb** | https://github.com/joshiayush/inb | ~135 | Same Voyager auth as linkedin-api | `inb/api/client.py` | Cookie cache dir; scrapes `applicationInstance` meta from HTML bootstrap | Same auth fragility as linkedin-api |
| **josephlimtech/linkedin-profile-scraper-api** | https://github.com/josephlimtech/linkedin-profile-scraper-api | ~763 | Manual `li_at` paste into Puppeteer | `src/index.ts` | `page.setCookie({ name: 'li_at', ... })`; validates session via `/login` redirect check | Last updated Apr 2024; selectors stale; no JSESSIONID handling |
| **linvo-scraper** | https://github.com/linvo-io/linvo-scraper | ~629 | Puppeteer login or injected `li_at` cookie | `linkedin.login.service.ts`, `linkedin.abstract.service.ts` | Requires `li_at` in cookie jar; credential login via `#username` | Marked "valid for 2022"; heavy selector dependence |

### API / GraphQL Mapping

| Repo | URL | Stars | What it documents | Key endpoints / queryIds | Reliability | Limitations |
|------|-----|-------|-------------------|--------------------------|-------------|-------------|
| **nsandman/linkedin-api** | https://github.com/nsandman/linkedin-api | ~171 | Classic Voyager REST map | `GET /identity/profiles/{id}/profileView`, `/profileContactInfo`, `/skills`; `GET /search/blended`; `GET/POST /messaging/conversations`; `GET /me`; `GET /identity/wvmpCards`; `GET /organization/companies`; invitations via `/relationships/invitations` | Random 2–5s delay (`default_evade`); normalized JSON accept header | No GraphQL; dash endpoints missing; auth broken for many accounts |
| **l4rm4nd/LinkedInDumper** | https://github.com/l4rm4nd/LinkedInDumper | ~600 | Modern dash + GraphQL for company employees | `GET /voyagerOrganizationDashCompanies?decorationId=...MiniCompany-10`; `GET /search/dash/clusters?decorationId=...SearchClusterCollection-165`; `GET /graphql?queryId=voyagerIdentityDashProfiles.c7452e58fa37646d09dae4920fc5b4b9` | `li_at` + static `JSESSIONID` + `Csrf-Token` header; jitter option | Hardcoded `JSESSIONID` placeholder; decorationIds/queryIds will rot |
| **Michaelrecycle/linkedin-mcp** | https://github.com/Michaelrecycle/linkedin-mcp | ~1 | Richest in-browser Voyager map | Profile: `/identity/dash/profiles?q=memberIdentity&decorationId=com.linkedin.voyager.dash.deco.identity.profile.TopCardSupplementary-166`; Connect: `POST /voyagerRelationshipsDashMemberRelationships?action=verifyQuotaAndCreate`; Messaging GraphQL: `messengerConversations.9501074288a12f3ae9e3c7ea243bccbf`; Posts: `voyagerContentcreationDashShares.279996efa5064c01775d5aff003d9377`; Comments: `voyagerSocialDashComments.afec6d88d7810d45548797a8dac4fb87` | In-page `fetch()` with `csrf-token` from `document.cookie`; rate limits per action type; DOM-verified writes | Low stars; decorationId versions change frequently |
| **codyrobertson/linkedin-cli** | https://github.com/codyrobertson/linkedin-cli | ~0 | Production-grade Voyager client + write plans | `voyager_get()` normalizes paths; write plans for comments, posts, profile edits; GraphQL: `voyagerContentcreationDashShares.279996efa5064c01775d5aff003d9377`, `voyagerIdentityDashProfileEditFormPages.56e440de740281eb97a4f2219a98e71a`; bootstrap JSON parsing from page `<code>` blocks | Session-based `requests`; treats redirects as auth failure; extensive test fixtures | New/unproven at scale; queryIds in tests may lag production |
| **eracle/linkedin-cli** | https://github.com/eracle/linkedin-cli | ~6 | Playwright in-browser Voyager for OpenOutreach | `GET /identity/dash/profiles` with `FullProfileWithEntities-91`; messaging GraphQL: `messengerConversations.0d5e6781bbee71c3e51c8843c6519f48`, `messengerMessages.5846eeb71c981f11e0134cb6626cc314`; `POST /voyagerMessagingDashMessengerMessages?action=createMessage` | `page.evaluate(fetch)` with `credentials: "include"`; tenacity retries | Tied to OpenOutreach automation use case |
| **trieb-work/linkedin-voyager-sdk** | https://github.com/trieb-work/linkedin-voyager-sdk | ~17 | TypeScript Voyager wrapper | `GET /identity/profiles/{id}/profileView`, `/profileContactInfo`, `/me`; base `https://www.linkedin.com/voyager/api` | Extracts CSRF from `JSESSIONID` cookie object; `x-li-track` header | Last meaningful update 2022; classic (non-dash) endpoints only |
| **inb** | https://github.com/joshiayush/inb | ~135 | Fork/evolution of linkedin-api | Same REST surface + `add_connection`, search filters | Cookie repo on disk | Same staleness as linkedin-api |

### Browser Automation (DOM scraping)

| Repo | URL | Stars | Approach | Key selectors / technique | Reliability | Limitations |
|------|-----|-------|----------|---------------------------|-------------|-------------|
| **joeyism/linkedin_scraper** | https://github.com/joeyism/linkedin_scraper | ~4,262 | Playwright v3 async; DOM scraping | `main`, `h1`, `.text-body-small.inline...`, `.pv-top-card-profile-picture img`; scroll-to-load; `session.json` | Active (pushed Apr 2026); Pydantic models; explicit `RateLimitError` | Job selectors skipped in tests ("structure may have changed"); no API interception |
| **linkedin-mcp-server** | https://github.com/stickerdaniel/linkedin-mcp-server | ~2,517 | **innerText extraction** (not CSS selectors) | Navigate → scroll → `document.querySelector('main').innerText`; rate-limit detection; modal dismissal | Most resilient DOM approach in OSS; avoids `pv-*` selector rot | LLM parses unstructured text; not deterministic field mapping |
| **josephlimtech/linkedin-profile-scraper-api** | https://github.com/josephlimtech/linkedin-profile-scraper-api | ~763 | Puppeteer + detailed `pv-*` selectors | `.pv-top-card--list`, `#experience-section ul > .ember-view`, `.pv-skill-category-entity__name-text`; expand "see more" buttons | Request interception blocks trackers; CDP `Page.setWebLifecycleState` | **Frozen Apr 2024**; Ember class selectors largely obsolete on current LinkedIn |
| **linvo-scraper** | https://github.com/linvo-io/linvo-scraper | ~629 | Puppeteer multi-action bot | Feed: `.artdeco-card ul li`; messages: `.msg-s-message-list__event`; connection: `.pv-top-card--list` | JSON from network + `<code>` tag fallback | "Valid for 2022" per README |
| **eracle/OpenOutreach** | https://github.com/eracle/OpenOutreach | ~2,224 | Playwright + Voyager hybrid | Uses `linkedin_cli` Playwright API; voyager response parser for `com.linkedin.voyager.dash.identity.profile.Profile` | Production daemon with rate limits, task queue, re-auth on 401 | Full-stack product, not a scraper library; contact overlay scrape on CONNECTED |

### Sales Navigator

| Repo | URL | Stars | Approach | Key details | Limitations |
|------|-----|-------|----------|-------------|-------------|
| **linvo-scraper** | https://github.com/linvo-io/linvo-scraper | ~629 | Puppeteer Sales Nav + JSON interception | `linkedin.sales.page.service.ts`: navigates `/sales/index`; waits for JSON response with `firstName`+`elements` OR parses `<code>` blocks; DOM fallback: `.search-results__result-item`, `.artdeco-entity-lockup`, `a[href*="/sales/"]` | Requires Sales Nav subscription; JSON schema tied to `fs_salesProfile` URNs |
| **ArthurVerrez/linkedin-scraping-tools** | https://github.com/ArthurVerrez/linkedin-scraping-tools | ~25 | Selenium + BeautifulSoup DOM | `lksn_search_scraper.py`: `#search-results-container > div > ol > li`; `artdeco-entity-lockup__*` selectors; manual 2FA checkpoint handling | Last updated Aug 2023; fragile long CSS chains; manual browser steps |
| **padmanabhan-s/scraping-linkedin-salesNavigator** | https://github.com/padmanabhan-s/scraping-linkedin-salesNavigator | ~30 | Selenium + BS4 | Basic Sales Nav people scrape | Last updated May 2020 |
| **linkedin-scraping-tools (Recruiter)** | https://github.com/ArthurVerrez/linkedin-scraping-tools | ~25 | Selenium for LinkedIn Recruiter | `lkr_search_scraper.py`: `#results-container > span > div > form > ol > li` | Same staleness issues |

### Email Enrichment

| Repo | URL | Stars | Approach | Key mechanism | Limitations |
|------|-----|-------|----------|---------------|-------------|
| **l4rm4nd/LinkedInDumper** | https://github.com/l4rm4nd/LinkedInDumper | ~600 | Voyager GraphQL profile contact | `voyagerIdentityDashProfiles.c7452e58fa37646d09dae4920fc5b4b9` → `emailAddress`, `address`, phones, IMs | Only for connections who shared contact info; requires valid session |
| **nsandman/linkedin-api** | https://github.com/nsandman/linkedin-api | ~171 | REST contact endpoint | `GET /identity/profiles/{id}/profileContactInfo` | Connection-gated; returns empty for non-connections |
| **linvo-scraper** | https://github.com/linvo-io/linvo-scraper | ~629 | Contact-info overlay DOM scrape | `history.pushState` to `overlay/contact-info/`; modal selectors: `.artdeco-modal [type="phone-handset-icon"]`, `[type="speech-bubble-icon"]` | UI-overlay dependent; breaks on modal redesign |
| **eracle/OpenOutreach** | https://github.com/eracle/OpenOutreach | ~2,224 | Multi-source enrichment | Voyager profile scrape + BetterContact API (`emails/bettercontact.py`) + hub lookup (`contacts/service.py`) | Email finder is **paid third-party**, not LinkedIn-native |
| **linkedin-mcp-server** | https://github.com/stickerdaniel/linkedin-mcp-server | ~2,517 | `contact_info` section via innerText | Parsed from profile page text | Unstructured; no guaranteed email extraction |

---

## LinkedIn Data Access Patterns Found (Consolidated Technical Map)

### Authentication

```
Required cookies:
  li_at          — primary session token (HttpOnly, ~1 year TTL)
  JSESSIONID     — CSRF token source; sent as header csrf-token (strip quotes)
  bcookie, bscookie, lidc — often present; less documented

CSRF extraction:
  csrf-token = session.cookies["JSESSIONID"].strip('"')
  OR document.cookie JSESSIONID parse in browser context

Programmatic login (legacy):
  GET  https://www.linkedin.com/uas/authenticate  → initial cookies
  POST https://www.linkedin.com/uas/authenticate  → {session_key, session_password, JSESSIONID}
  Mobile auth headers: LIAuthLibrary:3.2.4, LinkedIn/8.8.1 CFNetwork...

Modern session acquisition:
  1. Manual browser login → export li_at from DevTools
  2. Playwright persistent context (--login)
  3. Chrome cookie DB decryption (linkedin-mcp-server)
  4. CDP attach to existing Chrome (Michaelrecycle/linkedin-mcp)
```

### Known Internal API Base URLs / GraphQL Patterns

**Base:** `https://www.linkedin.com/voyager/api`

**Required headers (REST):**
```
accept: application/vnd.linkedin.normalized+json+2.1
x-restli-protocol-version: 2.0.0
x-li-lang: en_US
csrf-token: <JSESSIONID value>
Referer: https://www.linkedin.com/feed/
```

**REST endpoints (documented across repos):**

| Endpoint | Purpose |
|----------|---------|
| `GET /me` | Current user mini-profile |
| `GET /identity/profiles/{publicId}/profileView` | Full profile (legacy normalized JSON) |
| `GET /identity/dash/profiles?q=memberIdentity&memberIdentity={id}&decorationId=...` | Dash profile (modern) |
| `GET /identity/profiles/{id}/profileContactInfo` | Email/phone (connection-gated) |
| `GET /identity/profiles/{id}/skills` | Skills list |
| `GET /identity/profiles/{id}/networkinfo` | Follower counts, distance |
| `GET /identity/wvmpCards` | "Who viewed your profile" |
| `GET /search/blended?...` | People/company search |
| `GET /search/dash/clusters?...` | Dash search (company employee lists) |
| `GET /search/hits?...` | Legacy people search |
| `GET /feed/updates?...` | Profile/company feed updates |
| `GET /organization/companies?...` | Company lookup |
| `GET /voyagerOrganizationDashCompanies?...` | Dash company by universalName |
| `GET/POST /messaging/conversations` | Inbox |
| `GET /messaging/conversations/{id}/events` | Thread messages |
| `POST /voyagerMessagingDashMessengerMessages?action=createMessage` | Send DM (dash) |
| `POST /voyagerRelationshipsDashMemberRelationships?action=verifyQuotaAndCreate` | Connection request |
| `POST /voyagerSocialDashNormComments?decorationId=...NormComment-43` | Post comment |
| `POST /voyagerMediaUploadMetadata?action=upload` | Media upload for posts |

**GraphQL patterns:**

```
GET  /voyager/api/graphql?includeWebMetadata=true&variables=(...)&queryId={queryId}
GET  /voyager/api/voyagerMessagingGraphQL/graphql?queryId={queryId}&variables=...
POST /voyager/api/graphql?action=execute&queryId={queryId}  (body includes variables)
```

**Known queryIds (will rotate):**

| queryId | Purpose | Source |
|---------|---------|--------|
| `voyagerIdentityDashProfiles.c7452e58fa37646d09dae4920fc5b4b9` | Profile + contact info | LinkedInDumper |
| `messengerConversations.9501074288a12f3ae9e3c7ea243bccbf` | Inbox list | linkedin-mcp |
| `messengerConversations.0d5e6781bbee71c3e51c8843c6519f48` | Inbox (variant) | eracle/linkedin-cli |
| `messengerMessages.5846eeb71c981f11e0134cb6626cc314` | Thread messages | eracle/linkedin-cli |
| `voyagerContentcreationDashShares.279996efa5064c01775d5aff003d9377` | Create post | linkedin-mcp, linkedin-cli |
| `voyagerSocialDashComments.afec6d88d7810d45548797a8dac4fb87` | Read comments | linkedin-mcp |
| `voyagerIdentityDashProfileEditFormPages.56e440de740281eb97a4f2219a98e71a` | Profile edit | linkedin-cli |

**decorationId pattern (Dash):**
```
decorationId=com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-91
decorationId=com.linkedin.voyager.dash.deco.search.SearchClusterCollection-165
decorationId=com.linkedin.voyager.dash.deco.organization.MiniCompany-10
```
Version suffixes (`-91`, `-165`) change when LinkedIn ships new frontend bundles.

**Response shape:**
- Normalized JSON: top-level `data` + `included[]` with `$type`, `entityUrn`, `*elements` pointer indirection
- Dash types: `com.linkedin.voyager.dash.identity.profile.Profile`, `.Position`, `.Skill`, etc.
- Legacy types: `com.linkedin.voyager.identity.profile.Profile`

**Bootstrap extraction (no direct API call):**
LinkedIn embeds JSON in page `<code>` tags. linvo-scraper and codyrobertson/linkedin-cli parse these as fallback when network interception fails.

---

### API vs DOM: What Each Accesses

| Data | Voyager API | DOM scraping |
|------|-------------|--------------|
| Public profile (name, headline, experience) | ✅ `profileView` / dash profiles | ✅ with login |
| Email / phone | ⚠️ API only for connections | ⚠️ contact-info overlay |
| Company employees | ✅ dash clusters search | ✅ `/company/{x}/people/` page |
| Search (people/jobs) | ✅ `/search/blended`, job URLs | ✅ job search pages |
| Messaging | ✅ messaging endpoints | ✅ message UI selectors |
| Sales Navigator leads | ⚠️ JSON interception only | ✅ SN search DOM |
| Feed / posts | ✅ feed updates, GraphQL shares | ✅ innerText or post cards |
| Profile views analytics | ✅ `wvmpCards` | ✅ analytics page DOM |
| Connection actions | ✅ REST/GraphQL write endpoints | ✅ button clicking |

---

### Anti-Bot Considerations (from repos)

| Technique | Where documented |
|-----------|------------------|
| Random 2–5s request jitter | nsandman/linkedin-api `default_evade()` |
| TLS fingerprint blocking on direct HTTP | Michaelrecycle/linkedin-mcp README |
| Headless detection → `Clear-Site-Data` cookie wipe | Michaelrecycle/linkedin-mcp |
| `li_at=delete-me` redirect on blocked requests | Michaelrecycle/linkedin-mcp |
| Rate limits: ~20 connects/day, ~40 messages/day | Michaelrecycle/linkedin-mcp, OpenOutreach |
| Tab-open rate limiting (429 independent of API) | Michaelrecycle/linkedin-mcp |
| Browser warm-up before login | joeyism/linkedin_scraper |
| Real Chrome only (no bundled Chromium) | Michaelrecycle/linkedin-mcp |
| innerText instead of selectors | linkedin-mcp-server (reduces breakage, not detection) |
| Poisson-spaced task scheduling | OpenOutreach daemon |
| Checkpoint/2FA manual intervention | ArthurVerrez, joeyism |
| Block tracker scripts (faster, less fingerprint noise) | josephlimtech profile scraper |
| DOM-verified writes (count elements before/after) | Michaelrecycle/linkedin-mcp |

---

## Gaps (What OSS Doesn't Solve That PhantomBuster Must Maintain)

1. **QueryId / decorationId rotation** — OSS repos hardcode hashes; LinkedIn rotates these with every frontend deploy. No community project auto-discovers them from bundle JS at scale.

2. **TLS / browser fingerprint arms race** — Direct `requests`/`axios` Voyager calls are documented as blocked. OSS punts to in-browser `fetch`, but nobody maintains a headless fleet fingerprint library.

3. **Sales Navigator API surface** — SN uses different endpoints, `fs_salesProfile` URNs, and premium-gated responses. OSS coverage is DOM scraping from 2020–2023 or opportunistic JSON sniffing; no stable SN endpoint map.

4. **Session pool management** — PhantomBuster runs thousands of accounts. OSS handles single-user sessions (one `li_at`, one Playwright profile). No OSS solves cookie refresh, challenge solving, or account rotation.

5. **Proxy / IP reputation** — Barely mentioned in OSS. LinkedIn ties sessions to IP/geo; no repo documents residential proxy patterns reliably.

6. **Selector maintenance at scale** — Even innerText approaches need URL/route knowledge. The `pv-*`/`ember-view` selector corpus in josephlimtech is a graveyard. Continuous DOM monitoring is a product, not a repo.

7. **GraphQL schema completeness** — OSS documents ~15–20 endpoints. LinkedIn's Voyager surface has hundreds of `voyager*Dash*` resources. No OSS catalog is comprehensive.

8. **Write-path reliability** — Connection requests, messages, and comments have quota endpoints, custom message limits, and A/B UI variants. Only Michaelrecycle/linkedin-mcp and codyrobertson/linkedin-cli attempt write verification; most scrapers are read-only.

9. **Email enrichment beyond LinkedIn** — OpenOutreach delegates to BetterContact; LinkedIn-native email is connection-gated. OSS does not solve B2B email guessing at scale.

10. **Legal / ToS / detection response** — OSS disclaimers say "educational use." None maintain account health scoring, ban recovery, or compliance workflows.

11. **Recruiter / Campaign Manager / Ads** — Essentially undocumented in OSS.

12. **Automated challenge/CAPTCHA solving** — All repos defer to manual human intervention.

---

## Recommended Starting Points by Use Case

| Goal | Start here (local path) |
|------|------------------------|
| Voyager REST endpoint reference | `docs/research/repos/linkedin-api/` → `DOCS.md` |
| Modern dash + GraphQL employee dump | `docs/research/repos/LinkedInDumper/` → `linkedindumper.py` |
| In-browser Voyager (most reliable HTTP) | `docs/research/repos/linkedin-mcp/` or `docs/research/repos/codyrobertson-linkedin-cli/` |
| Production Playwright automation | `docs/research/repos/OpenOutreach/` + `docs/research/repos/eracle-linkedin-cli/` |
| DOM scraping with session mgmt | `docs/research/repos/linkedin_scraper/` |
| Resilient DOM without selectors | `docs/research/repos/linkedin-mcp-server/` |
| Sales Navigator JSON interception | `docs/research/repos/linvo-scraper/` |
| Voyager response parsing | `docs/research/repos/eracle-linkedin-cli/src/linkedin_cli/api/voyager.py` |

---

## Tracer Research Notes

**Successful tracer calls:** `joeyism/linkedin_scraper` README; `l4rm4nd/LinkedInDumper` file read; `linvo-io/linvo-scraper` sales service read; `ArthurVerrez/linkedin-scraping-tools` sales scraper read; `josephlimtech/linkedin-profile-scraper-api` deep agent analysis (selectors + pipeline).

**Timeouts/failures:** Most `tracer-deep` and broad `tracer-fast` agent queries timed out (>30s). `tomquirk/linkedin-api` not found (404). `nsandman/linkedin-api` read timed out.

**Supplemental methods:** GitHub API search, shallow clones to `/tmp/linkedin-research`, ripgrep across 14 repos.
