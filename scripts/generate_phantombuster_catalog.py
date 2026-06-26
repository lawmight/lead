#!/usr/bin/env python3
"""Generate PhantomBuster automation catalog from sitemap URLs."""

from collections import Counter, defaultdict
from pathlib import Path

CATALOG = {
    "linkedin-search-export": ("Extract", "Scrapes LinkedIn search result pages (People, Jobs, Posts, Companies, Events, Groups) into structured lead lists.", "Top-of-funnel discovery — turns any LinkedIn search URL into a CSV. Foundation phantom most workflows start from.", "→ Profile Scraper → Outreach"),
    "linkedin-profile-scraper": ("Enrich", "Visits individual profile pages and extracts full data: experience, skills, emails (when visible), contact info.", "Search export only shows snippets; this is the deep enrichment step that unlocks emails and full history.", "Search Export → this → CRM"),
    "linkedin-search-to-profile-data": ("Workflow", "Combined search export + profile scraping in one run — no chaining two phantoms.", "Convenience workflow for users who want enriched data from a search URL in a single click.", "All-in-one alternative to Search Export + Profile Scraper"),
    "linkedin-search-to-emails": ("Workflow", "Runs a LinkedIn search and extracts verified professional emails without manual profile visits.", "Sales teams want emails, not profile JSON. Bundles search + email discovery.", "Search → emails → Lemlist/CRM"),
    "linkedin-search-to-outreach": ("Workflow", "Full pipeline: search → enrich → send connection requests/messages.", "End-to-end outbound without manual steps between extract and engage.", "Replaces 3-4 phantom chain"),
    "linkedin-search-to-lead-connection": ("Workflow", "Search → qualify → auto-connect with personalized notes.", "Simpler than full outreach — just connection requests from search results.", "Search Export → Auto Connect bundled"),
    "linkedin-search-to-lead-outreach": ("Workflow", "Search → enrich → multi-step outreach (connect + follow-up messages).", "Full SDR workflow in one workflow slot.", "Highest-value LinkedIn workflow"),
    "linkedin-auto-connect": ("Engage", "Sends personalized connection requests to a list of profile URLs.", "Core outbound action — automates the most common LinkedIn sales motion.", "After any Extract/Enrich phantom"),
    "linkedin-outreach": ("Engage", "Multi-step outreach campaign: connect, message, follow-up sequences.", "Full campaign manager for LinkedIn DM sequences.", "End of most prospecting pipelines"),
    "linkedin-message-sender": ("Engage", "Sends DMs to existing 1st-degree connections.", "Can't message non-connections — this handles the post-connect nurture.", "After Auto Connect accepts"),
    "linkedin-new-connection-welcome-message": ("Engage", "Auto-sends a welcome message when someone accepts your connection request.", "Strike while iron is hot — immediate follow-up on acceptance.", "Watcher on connections → this"),
    "linkedin-auto-liker": ("Engage", "Likes posts from a list of profiles or post URLs.", "Social warming — increases visibility before outreach (2x acceptance rates per PB).", "Pre-outreach warming step"),
    "linkedin-auto-commenter": ("Engage", "Posts comments on LinkedIn posts from a target list.", "Deeper engagement than likes — shows up in notifications.", "Intent-based warming on competitor posts"),
    "linkedin-auto-follow": ("Engage", "Follows profiles without connecting (for non-connection follow option).", "Light-touch visibility play for profiles you can't/won't connect with.", "Warming before connect"),
    "linkedin-auto-unfollow": ("Engage", "Unfollows profiles from a list.", "List hygiene — unfollow after campaign ends or non-responders.", "Cleanup after outreach campaigns"),
    "linkedin-auto-endorser": ("Engage", "Endorses skills on target profiles.", "Niche warming tactic — endorsements trigger notifications.", "Pre-connect warming"),
    "linkedin-profile-visitor": ("Engage", "Visits profiles so you appear in 'Who viewed your profile'.", "Classic social selling tactic — curiosity-driven inbound.", "First step in warming sequences"),
    "linkedin-auto-invitation-withdrawer": ("Engage", "Withdraws pending connection requests.", "LinkedIn limits pending invites; clean up stale requests.", "Weekly maintenance phantom"),
    "linkedin-auto-invitation-accepter": ("Engage", "Auto-accepts incoming connection requests.", "Inbound lead capture — accept all incoming requests automatically.", "For inbound-heavy profiles"),
    "linkedin-auto-connection-remover": ("Engage", "Removes existing connections from your network.", "CRM hygiene — prune irrelevant connections.", "Post-campaign cleanup"),
    "linkedin-auto-poster": ("Engage", "Publishes posts to your LinkedIn feed on schedule.", "Content automation — maintain presence without manual posting.", "Inbound marketing complement"),
    "linkedin-connections-export": ("Extract", "Exports your entire 1st-degree connections list with profile data.", "Your network IS a lead database — this makes it queryable.", "Foundation for network-based campaigns"),
    "linkedin-connections-to-emails": ("Workflow", "Exports connections and enriches with professional emails.", "Monetize your existing network with email discovery.", "Connections Export + email enrichment"),
    "linkedin-company-employees-export": ("Extract", "Scrapes employee list from a company's LinkedIn page.", "ABM — find all decision-makers at target accounts.", "→ Profile Scraper → Outreach"),
    "linkedin-company-scraper": ("Enrich", "Extracts full company page data: size, industry, description, specialties.", "Account intelligence for ABM and enrichment.", "Before employee export in ABM flows"),
    "linkedin-company-url-finder": ("Enrich", "Finds LinkedIn company page URL from company name.", "Data normalization — resolve company names to LinkedIn URLs.", "Pre-step for company scrapers"),
    "linkedin-company-follower-collector": ("Extract", "Collects followers of your company LinkedIn page.", "Inbound leads — people already interested in your brand.", "→ Outreach for warm inbound"),
    "linkedin-company-follower-collector-to-outreach": ("Workflow", "Collects company page followers and launches outreach.", "Automated inbound lead response — engage new followers immediately.", "Inbound → outreach pipeline"),
    "linkedin-company-page-inviter": ("Engage", "Invites 1st-degree connections to follow your company page.", "Grow company page audience from personal network.", "After Auto Connect grows network"),
    "linkedin-group-members-export": ("Extract", "Exports members of a LinkedIn group.", "Community-based prospecting — niche ICPs in industry groups.", "→ Outreach to engaged community"),
    "linkedin-group-members-to-emails": ("Workflow", "Exports group members and finds their emails.", "Group → email list for multichannel.", "Group Export + email enrichment"),
    "linkedin-group-members-to-outreach": ("Workflow", "Exports group members and launches LinkedIn outreach.", "Engage community members automatically.", "Group → connect → message"),
    "linkedin-group-member-message-sender": ("Engage", "Messages group members (where LinkedIn allows).", "Direct outreach within group context.", "After group member export"),
    "linkedin-join-group-inviter": ("Engage", "Invites connections to join a LinkedIn group you admin.", "Community building — grow your group from network.", "Network growth play"),
    "linkedin-event-guests-export": ("Extract", "Exports attendees of a LinkedIn event.", "Event-based prospecting — warm leads with shared context.", "→ Connect with event reference"),
    "linkedin-event-inviter": ("Engage", "Invites connections to a LinkedIn event.", "Event promotion — fill events from your network.", "Pre-event marketing"),
    "linkedin-post-likers-export": ("Extract", "Exports users who liked a specific post.", "Intent signal — likers showed interest in topic.", "→ Warming → Outreach"),
    "linkedin-post-commenters-export": ("Extract", "Exports users who commented on a post.", "Higher intent than likers — they engaged verbally.", "Competitor post monitoring → outreach"),
    "linkedin-post-commenters-to-emails": ("Workflow", "Extracts post commenters and finds their emails.", "Intent + email for multichannel on engaged audiences.", "Commenters → emails → Lemlist"),
    "linkedin-post-commenter-and-liker-scraper": ("Extract", "Scrapes both commenters AND likers from posts.", "Complete engagement audience from content.", "→ Post Engagers to Outreach workflow"),
    "linkedin-post-engagers-to-lead-outreach": ("Workflow", "Extracts post engagers and launches outreach.", "Intent-based outbound — reach people engaging with relevant content.", "High-conversion workflow"),
    "linkedin-poll-voters-export": ("Extract", "Exports users who voted on a LinkedIn poll.", "Niche intent signal — poll voters self-segment.", "Micro-intent targeting"),
    "linkedin-activity-extractor": ("Extract", "Extracts recent activity/posts from profiles.", "Intent monitoring — track what prospects are posting about.", "Trigger-based outreach prep"),
    "linkedin-inbox-scraper": ("Extract", "Exports your LinkedIn messaging inbox/conversations.", "CRM sync — get LinkedIn DMs into your sales tools.", "→ CRM or analytics"),
    "linkedin-message-thread-scraper": ("Extract", "Scrapes individual message thread content.", "Conversation intelligence — analyze DM history.", "Post-outreach analytics"),
    "linkedin-sent-request-extractor": ("Extract", "Lists pending sent connection requests.", "Pipeline visibility — track outstanding invites.", "Before invitation withdrawer"),
    "linkedin-job-scraper": ("Extract", "Scrapes LinkedIn job postings matching criteria.", "Recruiting + signal — companies hiring = budget signal.", "Watcher mode for job alerts"),
    "linkedin-profile-follower-collector": ("Extract", "Collects followers of a personal profile.", "Audience analysis — who's following thought leaders.", "Influencer/creator use case"),
    "linkedin-profile-url-finder": ("Enrich", "Resolves a person's name + company to their LinkedIn profile URL.", "Data matching — bridge between CRM names and LinkedIn.", "Pre-step for any profile phantom"),
    "linkedin-recruiter-profile-scraper": ("Enrich", "Scrapes profiles via LinkedIn Recruiter (requires Recruiter seat).", "Recruiter-specific data access — deeper candidate info.", "Recruiting pipeline"),
    "linkedin-profiles-to-lemlist-campaign": ("Integrate", "Pushes scraped profiles directly into a Lemlist email campaign.", "LinkedIn → email handoff for multichannel.", "Profile data → Lemlist"),
    "sales-navigator-search-export": ("Extract", "Exports leads from Sales Navigator search results.", "Premium search with better filters — SN version of Search Export.", "SN foundation phantom"),
    "sales-navigator-profile-scraper": ("Enrich", "Deep-scrapes Sales Navigator profile pages.", "SN profiles have more data fields than regular LinkedIn.", "After SN Search Export"),
    "sales-navigator-search-to-emails": ("Workflow", "SN search → professional emails in one workflow.", "Premium search + email discovery bundled.", "SN → emails pipeline"),
    "sales-navigator-search-to-lead-outreach": ("Workflow", "SN search → enrich → outreach campaign.", "Full SN outbound pipeline.", "Highest-value SN workflow"),
    "sales-navigator-auto-connect": ("Engage", "Sends connection requests from Sales Navigator lead lists.", "SN-specific connect with InMail fallback awareness.", "After SN export"),
    "sales-navigator-message-sender": ("Engage", "Sends messages via Sales Navigator.", "SN messaging with character limits and templates.", "Post-connect SN nurture"),
    "sales-navigator-lead-sender": ("Engage", "Saves leads to Sales Navigator lists.", "List management — organize prospects in SN.", "Pre-outreach organization"),
    "sales-navigator-inbox-scraper": ("Extract", "Exports Sales Navigator inbox messages.", "SN conversation sync to CRM.", "SN → CRM pipeline"),
    "sales-navigator-alert-extractor": ("Extract", "Extracts Sales Navigator alerts (job changes, mentions, etc.).", "Trigger-based selling — act on buying signals.", "Watcher for intent signals"),
    "sales-navigator-profile-viewers-export": ("Extract", "Exports who viewed your profile (SN version with more data).", "Inbound leads — people researching you.", "→ Outreach to warm viewers"),
    "sales-navigator-account-employees-export": ("Extract", "Exports employees at target accounts from SN.", "ABM account penetration via SN account pages.", "ABM employee mapping"),
    "linkedin-sales-navigator-account-scraper": ("Enrich", "Scrapes full account/company data from Sales Navigator.", "Account intelligence for enterprise sales.", "ABM research"),
    "linkedin-sales-navigator-list-export": ("Extract", "Exports leads from saved Sales Navigator lead lists.", "Reuse saved SN lists as automation input.", "SN list → outreach"),
    "sales-navigator-url-converter": ("Enrich", "Converts between Sales Navigator and regular LinkedIn URLs.", "URL normalization between SN and regular phantoms.", "Glue between SN and LinkedIn phantoms"),
    "instagram-profile-scraper": ("Enrich", "Scrapes public Instagram profile data.", "B2C/creator prospecting beyond LinkedIn.", "IG lead enrichment"),
    "instagram-profile-url-finder": ("Enrich", "Finds Instagram profile URL from username or name.", "Cross-platform identity resolution.", "Pre-step for IG scrapers"),
    "instagram-follower-collector": ("Extract", "Collects followers of an Instagram account.", "Audience mining — followers of competitors/influencers.", "→ Auto follow/liker"),
    "instagram-following-collector": ("Extract", "Collects accounts an IG profile follows.", "Interest graph analysis.", "Niche audience discovery"),
    "instagram-hashtag-search-export": ("Extract", "Exports posts matching a hashtag.", "Hashtag-based content/audience discovery.", "→ Post engagement workflow"),
    "instagram-multiple-hashtag-collector": ("Extract", "Collects posts across multiple hashtags.", "Broader niche coverage than single hashtag.", "Multi-hashtag campaigns"),
    "instagram-hashtag-search-to-post-engagement": ("Workflow", "Finds hashtag posts → auto-likes and comments.", "IG growth automation — engage niche content daily.", "IG inbound growth pipeline"),
    "instagram-post-scraper": ("Extract", "Scrapes data from specific Instagram posts.", "Content analysis and engager extraction.", "→ Commenters/likers export"),
    "instagram-profile-post-extractor": ("Extract", "Extracts all posts from a profile.", "Content audit of target accounts.", "Competitor monitoring"),
    "instagram-post-commenters-export": ("Extract", "Exports users who commented on IG posts.", "IG intent signals — commenters are engaged.", "→ Auto follow"),
    "instagram-photo-likers": ("Extract", "Exports users who liked a photo/post.", "IG engagement audience.", "→ Follow/like strategy"),
    "instagram-tagged-post-extractor": ("Extract", "Extracts posts where a profile is tagged.", "Brand mention monitoring on IG.", "UGC/brand tracking"),
    "instagram-story-extractor": ("Extract", "Extracts data from Instagram stories.", "Ephemeral content capture.", "Story analytics"),
    "instagram-story-viewers-export": ("Extract", "Exports who viewed your Instagram stories.", "IG inbound — story viewers are warm.", "→ DM outreach"),
    "instagram-story-auto-watcher": ("Engage", "Auto-watches stories from target accounts.", "IG warming — story views trigger notifications.", "Pre-DM warming"),
    "instagram-notification-extractor": ("Extract", "Exports Instagram notifications.", "Activity monitoring.", "Engagement tracking"),
    "instagram-auto-follow": ("Engage", "Auto-follows Instagram accounts from a list.", "IG growth — follow/unfollow strategy.", "After follower collector"),
    "instagram-followers-auto-follow": ("Engage", "Follows followers of a target account.", "Competitor audience poaching.", "Growth hack workflow"),
    "instagram-auto-liker": ("Engage", "Auto-likes posts from a list.", "IG engagement warming.", "Pre-follow/DM warming"),
    "instagram-auto-commenter": ("Engage", "Auto-comments on Instagram posts.", "IG engagement at scale.", "Hashtag workflow step"),
    "instagram-auto-unfollow": ("Engage", "Unfollows accounts from a list.", "IG list hygiene after follow campaigns.", "Post-campaign cleanup"),
    "twitter-profile-scraper": ("Enrich", "Scrapes Twitter/X profile data.", "Social selling on X — profile intelligence.", "X prospecting foundation"),
    "twitter-profile-url-finder": ("Enrich", "Finds Twitter handle from name.", "Identity resolution for X.", "Pre-step for X phantoms"),
    "twitter-search-export": ("Extract", "Exports Twitter search results.", "X discovery — find people by keywords.", "→ Follow/DM"),
    "twitter-hashtag-search-export": ("Extract", "Exports tweets matching hashtags.", "Trend/topic monitoring on X.", "→ Engagement"),
    "twitter-tweet-extractor": ("Extract", "Extracts data from specific tweets.", "Tweet-level analysis.", "Content monitoring"),
    "twitter-tweet-likers-export": ("Extract", "Exports users who liked tweets.", "X intent signals (note: X made likes private in 2024).", "Diminishing value post-privacy change"),
    "twitter-profile-likes-extractor": ("Extract", "Extracts tweets a profile has liked.", "Interest profiling of targets.", "Personalization research"),
    "twitter-follower-collector": ("Extract", "Collects followers of a Twitter account.", "Audience mining on X.", "→ Auto follow"),
    "twitter-following-collector": ("Extract", "Collects who an account follows.", "Interest graph on X.", "Audience analysis"),
    "twitter-auto-follow": ("Engage", "Auto-follows Twitter accounts.", "X growth strategy.", "After follower collector"),
    "twitter-auto-unfollow": ("Engage", "Unfollows accounts on X.", "X list hygiene.", "Post-campaign cleanup"),
    "twitter-auto-liker": ("Engage", "Auto-likes tweets.", "X warming before DM.", "Pre-outreach on X"),
    "twitter-auto-retweeter": ("Engage", "Auto-retweets from a list.", "Amplification/visibility play.", "Content distribution"),
    "twitter-auto-poster": ("Engage", "Schedules and posts tweets.", "X content automation.", "Inbound marketing on X"),
    "twitter-message-sender": ("Engage", "Sends DMs on Twitter/X.", "X direct outreach.", "After follow/warming"),
    "twitter-media-extractor": ("Extract", "Extracts media from tweets.", "Content research.", "Media monitoring"),
    "facebook-profile-scraper": ("Enrich", "Scrapes Facebook profile data.", "B2C prospecting on Facebook.", "FB lead enrichment"),
    "facebook-profile-url-finder": ("Enrich", "Finds Facebook profile URL.", "Identity resolution for FB.", "Pre-step"),
    "facebook-group-members-export": ("Extract", "Exports members of a Facebook group.", "Community-based FB prospecting.", "→ Message sender"),
    "facebook-post-likers-export": ("Extract", "Exports users who liked FB posts.", "FB intent signals.", "→ Auto liker/message"),
    "facebook-post-commenters-export": ("Extract", "Exports FB post commenters.", "Higher FB intent signal.", "→ Outreach"),
    "facebook-page-review-extractor": ("Extract", "Extracts reviews from Facebook business pages.", "Reputation research / local business intel.", "Local business prospecting"),
    "facebook-ads-library-scraper": ("Extract", "Scrapes Facebook Ads Library for competitor ad data.", "Competitive intelligence — see what ads competitors run.", "Marketing research"),
    "facebook-auto-liker": ("Engage", "Auto-likes Facebook posts.", "FB engagement warming.", "Pre-message warming"),
    "facebook-message-sender": ("Engage", "Sends Facebook messages.", "FB direct outreach.", "After group member export"),
    "google-maps-search-export": ("Extract", "Exports businesses from Google Maps search results.", "Local business prospecting — non-LinkedIn lead source.", "→ Contact data workflow"),
    "google-maps-search-to-contact-data": ("Workflow", "Google Maps search → business contact data (phone, website, etc.).", "Local lead gen pipeline.", "Maps → CRM pipeline"),
    "github-profile-scraper": ("Enrich", "Scrapes GitHub profile data.", "Developer recruiting / OSS community prospecting.", "Dev-focused outreach"),
    "github-user-search-export": ("Extract", "Exports GitHub user search results.", "Find developers by language/location.", "→ Profile scraper"),
    "github-stargazers-export": ("Extract", "Exports users who starred a GitHub repo.", "OSS community — stargazers are engaged users.", "Dev tool GTM"),
    "github-contributors-export": ("Extract", "Exports contributors to a GitHub repo.", "Find active developers on projects.", "Recruiting / developer relations"),
    "reddit-search-extractor": ("Extract", "Extracts posts/users from Reddit search.", "Community intent signals — Reddit is high-intent.", "Niche B2B/B2C prospecting"),
    "reddit-profile-scraper": ("Enrich", "Scrapes Reddit user profile data.", "Reddit user intelligence.", "Community outreach prep"),
    "reddit-post-scraper": ("Extract", "Scrapes specific Reddit posts.", "Content monitoring on Reddit.", "→ Commenters export"),
    "reddit-post-comments-export": ("Extract", "Exports commenters on Reddit posts.", "Reddit intent — commenters are engaged.", "→ Outreach"),
    "youtube-channel-scraper": ("Enrich", "Scrapes YouTube channel data.", "Creator/influencer prospecting.", "Influencer marketing pipeline"),
    "youtube-channel-video-extractor": ("Extract", "Extracts videos from a YouTube channel.", "Content audit of channels.", "Competitor monitoring"),
    "youtube-video-scraper": ("Extract", "Scrapes data from specific YouTube videos.", "Video-level analysis.", "Content research"),
    "slack-search-export": ("Extract", "Exports Slack search results.", "Community mining in Slack workspaces.", "Niche B2B in Slack communities"),
    "slack-channel-user-extractor": ("Extract", "Extracts members of a Slack channel.", "Community member lists.", "→ Outreach"),
    "slack-message-sender": ("Engage", "Sends messages in Slack.", "Slack outreach (where permitted).", "Community engagement"),
    "hubspot-crm-enricher": ("Integrate", "Pushes scraped data into HubSpot CRM contacts.", "CRM sync — eliminates manual import.", "End of most extract/enrich chains"),
    "hubspot-contact-data-enricher": ("Integrate", "Enriches existing HubSpot contacts with fresh LinkedIn data.", "CRM hygiene — keep data current.", "Ongoing data refresh"),
    "hubspot-contact-data-refresher": ("Integrate", "Refreshes stale HubSpot contact fields from LinkedIn.", "Scheduled CRM data maintenance.", "Watcher mode on CRM"),
    "hubspot-contact-career-tracker": ("Integrate", "Monitors HubSpot contacts for job changes on LinkedIn.", "Trigger-based selling — job change = buying signal.", "Alert → outreach"),
    "hubspot-contact-linkedin-url-finder": ("Integrate", "Finds LinkedIn URLs for HubSpot contacts missing them.", "CRM → LinkedIn bridge.", "Pre-step for enrichment"),
    "hubspot-contact-linkedin-outreach": ("Workflow", "Pulls HubSpot contacts → LinkedIn outreach campaign.", "CRM-driven outbound.", "HubSpot → LinkedIn pipeline"),
    "hubspot-contact-sender": ("Engage", "Sends outreach to HubSpot contact lists.", "CRM-list-driven engagement.", "HubSpot list → messages"),
    "pipedrive-crm-enricher": ("Integrate", "Pushes scraped data into Pipedrive CRM.", "Pipedrive sync.", "End of extract chains"),
    "salesforce-crm-enricher": ("Integrate", "Pushes scraped data into Salesforce CRM.", "Salesforce sync.", "End of extract chains"),
    "ai-linkedin-profile-enricher": ("AI", "AI analyzes and enriches LinkedIn profile data with insights.", "AI layer on raw scrape — summaries, ICP scoring.", "Post-scrape intelligence"),
    "advanced-ai-enricher": ("AI", "Advanced AI enrichment across multiple data fields.", "Deep AI analysis of lead data.", "Premium enrichment"),
    "ai-linkedin-message-writer": ("AI", "AI generates personalized LinkedIn messages from profile data.", "Personalization at scale — unique messages per lead.", "Pre-message-sender step"),
    "ai-linkedin-post-responder": ("AI", "AI generates responses to LinkedIn posts/comments.", "AI engagement — contextual comments.", "Auto-commenter with AI brain"),
    "professional-email-finder": ("Enrich", "Finds professional email addresses from name + company.", "Email discovery independent of LinkedIn.", "Universal enrichment step"),
    "email-extractor": ("Enrich", "Extracts emails from web pages.", "Generic email scraping from any URL.", "Website → email"),
    "domain-name-finder": ("Enrich", "Finds company domain from company name.", "Company → domain resolution.", "Pre-step for email finder"),
    "data-scraping-crawler": ("Extract", "Generic web crawler for any website.", "Catch-all scraper — when no dedicated phantom exists.", "Custom scraping needs"),
    "web-element-extractor": ("Extract", "Extracts specific CSS elements from web pages.", "Surgical DOM extraction.", "Custom data points"),
    "chrome-extension-review-extractor": ("Extract", "Scrapes Chrome Web Store extension reviews.", "Competitive intel for browser extension market.", "Niche market research"),
    "linkedin-search-to-lemlist-campaign": ("Integrate", "LinkedIn search → Lemlist email campaign.", "LinkedIn → email multichannel handoff.", "Search → Lemlist pipeline"),
    "pages-jaunes-search-export": ("Extract", "Exports French business directory (Pages Jaunes) search results.", "French local business prospecting.", "FR market lead gen"),
    "pages-jaunes-business-scraper": ("Enrich", "Scrapes detailed business data from Pages Jaunes.", "French business enrichment.", "FR local data"),
    "yellow-pages-search-export": ("Extract", "Exports Yellow Pages business search results.", "US/UK local business prospecting.", "Local lead gen"),
    "yellow-pages-business-scraper": ("Enrich", "Scrapes detailed Yellow Pages business listings.", "Local business enrichment.", "Local → CRM"),
}

PLATFORM_NAMES = {
    "linkedin": "LinkedIn",
    "sales-navigator": "Sales Navigator",
    "instagram": "Instagram",
    "twitter": "Twitter / X",
    "facebook": "Facebook",
    "google-maps": "Google Maps",
    "github": "GitHub",
    "reddit": "Reddit",
    "youtube": "YouTube",
    "slack": "Slack",
    "hubspot": "HubSpot",
    "pipedrive": "Pipedrive",
    "salesforce": "Salesforce",
    "ai": "AI",
    "toolbox": "Toolbox (generic)",
    "pages-jaunes": "Pages Jaunes (FR)",
    "yellow-pages": "Yellow Pages",
}

PLATFORM_ORDER = list(PLATFORM_NAMES.keys())


def main() -> None:
    urls = Path("/tmp/pb_automations.txt").read_text().strip().split("\n")
    entries = []
    for url in urls:
        slug = url.rstrip("/").split("/")[-1]
        platform = url.split("/automations/")[1].split("/")[0]
        if slug not in CATALOG:
            raise KeyError(f"Missing catalog entry: {slug}")
        strategy, what, why, chain = CATALOG[slug]
        entries.append(
            {
                "slug": slug,
                "platform": platform,
                "url": url,
                "strategy": strategy,
                "what": what,
                "why": why,
                "chain": chain,
            }
        )

    by_platform: dict[str, list] = defaultdict(list)
    for entry in entries:
        by_platform[entry["platform"]].append(entry)

    lines = [
        "# PhantomBuster Automation Catalog",
        "",
        "> Research artifact mapping all **151 automations** listed in PhantomBuster's public sitemap (June 2026).",
        "> Each entry describes *what it does* and *why it exists* in their product strategy — not implementation code.",
        "",
        "## Summary",
        "",
        "| Metric | Count |",
        "|--------|-------|",
        f"| Total automations | {len(entries)} |",
    ]

    for strategy, count in Counter(e["strategy"] for e in entries).most_common():
        lines.append(f"| {strategy} | {count} |")

    lines.extend(
        [
            "",
            "## Strategy Taxonomy",
            "",
            "PhantomBuster organizes automations into three core strategies (plus composites):",
            "",
            "| Strategy | Purpose | Examples |",
            "|----------|---------|----------|",
            "| **Extract** | Find and collect leads from platform searches, lists, or engagement | Search Export, Post Likers, Group Members |",
            "| **Enrich** | Add missing data (emails, full profiles, company info) | Profile Scraper, Email Finder, URL Finder |",
            "| **Engage** | Take action on platforms (connect, message, like, follow) | Auto Connect, Message Sender, Auto Liker |",
            "| **Workflow** | Chain multiple steps into one automation | Search to Emails, Search to Outreach |",
            "| **Integrate** | Push/pull data with CRMs and external tools | HubSpot Enricher, Lemlist Campaign |",
            "| **AI** | LLM-powered enrichment or message generation | AI Message Writer, AI Profile Enricher |",
            "",
            "## Typical Pipeline Architecture",
            "",
            "```",
            "DISCOVER          ENRICH              ENGAGE              SYNC",
            "────────          ──────              ──────              ────",
            "Search Export  →  Profile Scraper  →  Auto Connect    →  HubSpot Enricher",
            "Post Likers    →  Email Finder     →  Message Sender  →  Lemlist Campaign",
            "Group Members  →  URL Finder       →  Auto Liker      →  Salesforce Sync",
            "SN Search      →  AI Enricher      →  Outreach        →  Google Sheets",
            "```",
            "",
            "---",
            "",
        ]
    )

    for platform in PLATFORM_ORDER:
        items = sorted(by_platform.get(platform, []), key=lambda x: x["slug"])
        if not items:
            continue
        lines.append(f"## {PLATFORM_NAMES[platform]} ({len(items)} automations)")
        lines.append("")
        for entry in items:
            name = entry["slug"].replace("-", " ").title()
            lines.append(f"### {name}")
            lines.append(f"- **Strategy:** {entry['strategy']}")
            lines.append(f"- **URL:** {entry['url']}")
            lines.append(f"- **What it does:** {entry['what']}")
            lines.append(f"- **Why it exists:** {entry['why']}")
            if entry["chain"]:
                lines.append(f"- **Typical chain position:** {entry['chain']}")
            lines.append("")

    lines.extend(
        [
            "---",
            "",
            "## Product Strategy Observations",
            "",
            "1. **LinkedIn dominance (51/151 = 34%)** — Core product is LinkedIn B2B sales automation.",
            "2. **Extract → Enrich → Engage ladder** — Most value is in chaining; individual phantoms are LEGO bricks.",
            "3. **Workflow phantoms are the upsell** — Bundled multi-step workflows use 2-3 slots but save user setup time.",
            "4. **CRM integrations are the retention layer** — HubSpot (7 phantoms) is deepest integration.",
            "5. **Multi-platform is marketing breadth** — Instagram/Twitter/Facebook exist but LinkedIn+SN = 43% of catalog.",
            "6. **AI phantoms are recent additions** — Message writer, profile enricher, post responder = LLM layer on top of scrape data.",
            "7. **Local business (Maps, Yellow Pages, Pages Jaunes)** — Extends TAM beyond B2B LinkedIn sales.",
            "8. **Generic toolbox** — Data Scraping Crawler and Web Element Extractor are escape hatches for custom needs.",
            "",
            "*Source: PhantomBuster public sitemap (https://phantombuster.com/sitemap.xml), scraped June 26, 2026.*",
        ]
    )

    output = Path("/workspace/docs/research/phantombuster-automation-catalog.md")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines))
    print(f"Wrote {output} ({len(entries)} automations)")


if __name__ == "__main__":
    main()
