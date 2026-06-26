# PhantomBuster Automation Catalog

> Research artifact mapping all **151 automations** listed in PhantomBuster's public sitemap (June 2026).
> Each entry describes *what it does* and *why it exists* in their product strategy — not implementation code.

## Summary

| Metric | Count |
|--------|-------|
| Total automations | 151 |
| Extract | 63 |
| Engage | 37 |
| Enrich | 22 |
| Workflow | 16 |
| Integrate | 9 |
| AI | 4 |

## Strategy Taxonomy

PhantomBuster organizes automations into three core strategies (plus composites):

| Strategy | Purpose | Examples |
|----------|---------|----------|
| **Extract** | Find and collect leads from platform searches, lists, or engagement | Search Export, Post Likers, Group Members |
| **Enrich** | Add missing data (emails, full profiles, company info) | Profile Scraper, Email Finder, URL Finder |
| **Engage** | Take action on platforms (connect, message, like, follow) | Auto Connect, Message Sender, Auto Liker |
| **Workflow** | Chain multiple steps into one automation | Search to Emails, Search to Outreach |
| **Integrate** | Push/pull data with CRMs and external tools | HubSpot Enricher, Lemlist Campaign |
| **AI** | LLM-powered enrichment or message generation | AI Message Writer, AI Profile Enricher |

## Typical Pipeline Architecture

```
DISCOVER          ENRICH              ENGAGE              SYNC
────────          ──────              ──────              ────
Search Export  →  Profile Scraper  →  Auto Connect    →  HubSpot Enricher
Post Likers    →  Email Finder     →  Message Sender  →  Lemlist Campaign
Group Members  →  URL Finder       →  Auto Liker      →  Salesforce Sync
SN Search      →  AI Enricher      →  Outreach        →  Google Sheets
```

---

## LinkedIn (51 automations)

### Linkedin Activity Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/9136/linkedin-activity-extractor
- **What it does:** Extracts recent activity/posts from profiles.
- **Why it exists:** Intent monitoring — track what prospects are posting about.
- **Typical chain position:** Trigger-based outreach prep

### Linkedin Auto Commenter
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/16226/linkedin-auto-commenter
- **What it does:** Posts comments on LinkedIn posts from a target list.
- **Why it exists:** Deeper engagement than likes — shows up in notifications.
- **Typical chain position:** Intent-based warming on competitor posts

### Linkedin Auto Connect
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/2818/linkedin-auto-connect
- **What it does:** Sends personalized connection requests to a list of profile URLs.
- **Why it exists:** Core outbound action — automates the most common LinkedIn sales motion.
- **Typical chain position:** After any Extract/Enrich phantom

### Linkedin Auto Connection Remover
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/7132580939722323/linkedin-auto-connection-remover
- **What it does:** Removes existing connections from your network.
- **Why it exists:** CRM hygiene — prune irrelevant connections.
- **Typical chain position:** Post-campaign cleanup

### Linkedin Auto Endorser
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/3611/linkedin-auto-endorser
- **What it does:** Endorses skills on target profiles.
- **Why it exists:** Niche warming tactic — endorsements trigger notifications.
- **Typical chain position:** Pre-connect warming

### Linkedin Auto Follow
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/6874/linkedin-auto-follow
- **What it does:** Follows profiles without connecting (for non-connection follow option).
- **Why it exists:** Light-touch visibility play for profiles you can't/won't connect with.
- **Typical chain position:** Warming before connect

### Linkedin Auto Invitation Accepter
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/2885/linkedin-auto-invitation-accepter
- **What it does:** Auto-accepts incoming connection requests.
- **Why it exists:** Inbound lead capture — accept all incoming requests automatically.
- **Typical chain position:** For inbound-heavy profiles

### Linkedin Auto Invitation Withdrawer
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/3672/linkedin-auto-invitation-withdrawer
- **What it does:** Withdraws pending connection requests.
- **Why it exists:** LinkedIn limits pending invites; clean up stale requests.
- **Typical chain position:** Weekly maintenance phantom

### Linkedin Auto Liker
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/16227/linkedin-auto-liker
- **What it does:** Likes posts from a list of profiles or post URLs.
- **Why it exists:** Social warming — increases visibility before outreach (2x acceptance rates per PB).
- **Typical chain position:** Pre-outreach warming step

### Linkedin Auto Poster
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/7415410842242185/linkedin-auto-poster
- **What it does:** Publishes posts to your LinkedIn feed on schedule.
- **Why it exists:** Content automation — maintain presence without manual posting.
- **Typical chain position:** Inbound marketing complement

### Linkedin Auto Unfollow
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/1942869543072163/linkedin-auto-unfollow
- **What it does:** Unfollows profiles from a list.
- **Why it exists:** List hygiene — unfollow after campaign ends or non-responders.
- **Typical chain position:** Cleanup after outreach campaigns

### Linkedin Company Employees Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/3295/linkedin-company-employees-export
- **What it does:** Scrapes employee list from a company's LinkedIn page.
- **Why it exists:** ABM — find all decision-makers at target accounts.
- **Typical chain position:** → Profile Scraper → Outreach

### Linkedin Company Follower Collector
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/6609751279582074/linkedin-company-follower-collector
- **What it does:** Collects followers of your company LinkedIn page.
- **Why it exists:** Inbound leads — people already interested in your brand.
- **Typical chain position:** → Outreach for warm inbound

### Linkedin Company Follower Collector To Outreach
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/linkedin/7972540039693475/linkedin-company-follower-collector-to-outreach
- **What it does:** Collects company page followers and launches outreach.
- **Why it exists:** Automated inbound lead response — engage new followers immediately.
- **Typical chain position:** Inbound → outreach pipeline

### Linkedin Company Page Inviter
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/8522029843786898/linkedin-company-page-inviter
- **What it does:** Invites 1st-degree connections to follow your company page.
- **Why it exists:** Grow company page audience from personal network.
- **Typical chain position:** After Auto Connect grows network

### Linkedin Company Scraper
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/linkedin/3296/linkedin-company-scraper
- **What it does:** Extracts full company page data: size, industry, description, specialties.
- **Why it exists:** Account intelligence for ABM and enrichment.
- **Typical chain position:** Before employee export in ABM flows

### Linkedin Company Url Finder
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/linkedin/4372/linkedin-company-url-finder
- **What it does:** Finds LinkedIn company page URL from company name.
- **Why it exists:** Data normalization — resolve company names to LinkedIn URLs.
- **Typical chain position:** Pre-step for company scrapers

### Linkedin Connections Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/12670/linkedin-connections-export
- **What it does:** Exports your entire 1st-degree connections list with profile data.
- **Why it exists:** Your network IS a lead database — this makes it queryable.
- **Typical chain position:** Foundation for network-based campaigns

### Linkedin Connections To Emails
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/linkedin/2220776630920718/linkedin-connections-to-emails
- **What it does:** Exports connections and enriches with professional emails.
- **Why it exists:** Monetize your existing network with email discovery.
- **Typical chain position:** Connections Export + email enrichment

### Linkedin Event Guests Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/5447892918325546/linkedin-event-guests-export
- **What it does:** Exports attendees of a LinkedIn event.
- **Why it exists:** Event-based prospecting — warm leads with shared context.
- **Typical chain position:** → Connect with event reference

### Linkedin Event Inviter
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/6130059528224195/linkedin-event-inviter
- **What it does:** Invites connections to a LinkedIn event.
- **Why it exists:** Event promotion — fill events from your network.
- **Typical chain position:** Pre-event marketing

### Linkedin Group Member Message Sender
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/511865799449120/linkedin-group-member-message-sender
- **What it does:** Messages group members (where LinkedIn allows).
- **Why it exists:** Direct outreach within group context.
- **Typical chain position:** After group member export

### Linkedin Group Members Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/2852/linkedin-group-members-export
- **What it does:** Exports members of a LinkedIn group.
- **Why it exists:** Community-based prospecting — niche ICPs in industry groups.
- **Typical chain position:** → Outreach to engaged community

### Linkedin Group Members To Emails
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/linkedin/1960014583069690/linkedin-group-members-to-emails
- **What it does:** Exports group members and finds their emails.
- **Why it exists:** Group → email list for multichannel.
- **Typical chain position:** Group Export + email enrichment

### Linkedin Group Members To Outreach
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/linkedin/2246643678897122/linkedin-group-members-to-outreach
- **What it does:** Exports group members and launches LinkedIn outreach.
- **Why it exists:** Engage community members automatically.
- **Typical chain position:** Group → connect → message

### Linkedin Inbox Scraper
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/532696507966746/linkedin-inbox-scraper
- **What it does:** Exports your LinkedIn messaging inbox/conversations.
- **Why it exists:** CRM sync — get LinkedIn DMs into your sales tools.
- **Typical chain position:** → CRM or analytics

### Linkedin Job Scraper
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/6772788738377011/linkedin-job-scraper
- **What it does:** Scrapes LinkedIn job postings matching criteria.
- **Why it exists:** Recruiting + signal — companies hiring = budget signal.
- **Typical chain position:** Watcher mode for job alerts

### Linkedin Join Group Inviter
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/7381354215467141/linkedin-join-group-inviter
- **What it does:** Invites connections to join a LinkedIn group you admin.
- **Why it exists:** Community building — grow your group from network.
- **Typical chain position:** Network growth play

### Linkedin Message Sender
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/9227/linkedin-message-sender
- **What it does:** Sends DMs to existing 1st-degree connections.
- **Why it exists:** Can't message non-connections — this handles the post-connect nurture.
- **Typical chain position:** After Auto Connect accepts

### Linkedin Message Thread Scraper
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/9387/linkedin-message-thread-scraper
- **What it does:** Scrapes individual message thread content.
- **Why it exists:** Conversation intelligence — analyze DM history.
- **Typical chain position:** Post-outreach analytics

### Linkedin New Connection Welcome Message
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/7572144804575918/linkedin-new-connection-welcome-message
- **What it does:** Auto-sends a welcome message when someone accepts your connection request.
- **Why it exists:** Strike while iron is hot — immediate follow-up on acceptance.
- **Typical chain position:** Watcher on connections → this

### Linkedin Outreach
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/4545709793535249/linkedin-outreach
- **What it does:** Multi-step outreach campaign: connect, message, follow-up sequences.
- **Why it exists:** Full campaign manager for LinkedIn DM sequences.
- **Typical chain position:** End of most prospecting pipelines

### Linkedin Poll Voters Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/4648700649184588/linkedin-poll-voters-export
- **What it does:** Exports users who voted on a LinkedIn poll.
- **Why it exists:** Niche intent signal — poll voters self-segment.
- **Typical chain position:** Micro-intent targeting

### Linkedin Post Commenter And Liker Scraper
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/5251160215300729/linkedin-post-commenter-and-liker-scraper
- **What it does:** Scrapes both commenters AND likers from posts.
- **Why it exists:** Complete engagement audience from content.
- **Typical chain position:** → Post Engagers to Outreach workflow

### Linkedin Post Commenters Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/2823/linkedin-post-commenters-export
- **What it does:** Exports users who commented on a post.
- **Why it exists:** Higher intent than likers — they engaged verbally.
- **Typical chain position:** Competitor post monitoring → outreach

### Linkedin Post Commenters To Emails
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/linkedin/2238207930449780/linkedin-post-commenters-to-emails
- **What it does:** Extracts post commenters and finds their emails.
- **Why it exists:** Intent + email for multichannel on engaged audiences.
- **Typical chain position:** Commenters → emails → Lemlist

### Linkedin Post Engagers To Lead Outreach
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/linkedin/811469274539266/linkedin-post-engagers-to-lead-outreach
- **What it does:** Extracts post engagers and launches outreach.
- **Why it exists:** Intent-based outbound — reach people engaging with relevant content.
- **Typical chain position:** High-conversion workflow

### Linkedin Post Likers Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/2880/linkedin-post-likers-export
- **What it does:** Exports users who liked a specific post.
- **Why it exists:** Intent signal — likers showed interest in topic.
- **Typical chain position:** → Warming → Outreach

### Linkedin Profile Follower Collector
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/3750/linkedin-profile-follower-collector
- **What it does:** Collects followers of a personal profile.
- **Why it exists:** Audience analysis — who's following thought leaders.
- **Typical chain position:** Influencer/creator use case

### Linkedin Profile Scraper
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/linkedin/5589386912058181/linkedin-profile-scraper
- **What it does:** Visits individual profile pages and extracts full data: experience, skills, emails (when visible), contact info.
- **Why it exists:** Search export only shows snippets; this is the deep enrichment step that unlocks emails and full history.
- **Typical chain position:** Search Export → this → CRM

### Linkedin Profile Url Finder
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/linkedin/4015/linkedin-profile-url-finder
- **What it does:** Resolves a person's name + company to their LinkedIn profile URL.
- **Why it exists:** Data matching — bridge between CRM names and LinkedIn.
- **Typical chain position:** Pre-step for any profile phantom

### Linkedin Profile Visitor
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/linkedin/3112/linkedin-profile-visitor
- **What it does:** Visits profiles so you appear in 'Who viewed your profile'.
- **Why it exists:** Classic social selling tactic — curiosity-driven inbound.
- **Typical chain position:** First step in warming sequences

### Linkedin Profiles To Lemlist Campaign
- **Strategy:** Integrate
- **URL:** https://phantombuster.com/automations/linkedin/1069439181217466/linkedin-profiles-to-lemlist-campaign
- **What it does:** Pushes scraped profiles directly into a Lemlist email campaign.
- **Why it exists:** LinkedIn → email handoff for multichannel.
- **Typical chain position:** Profile data → Lemlist

### Linkedin Recruiter Profile Scraper
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/linkedin/4274640725828784/linkedin-recruiter-profile-scraper
- **What it does:** Scrapes profiles via LinkedIn Recruiter (requires Recruiter seat).
- **Why it exists:** Recruiter-specific data access — deeper candidate info.
- **Typical chain position:** Recruiting pipeline

### Linkedin Search Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/3149/linkedin-search-export
- **What it does:** Scrapes LinkedIn search result pages (People, Jobs, Posts, Companies, Events, Groups) into structured lead lists.
- **Why it exists:** Top-of-funnel discovery — turns any LinkedIn search URL into a CSV. Foundation phantom most workflows start from.
- **Typical chain position:** → Profile Scraper → Outreach

### Linkedin Search To Emails
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/linkedin/6546459929405349/linkedin-search-to-emails
- **What it does:** Runs a LinkedIn search and extracts verified professional emails without manual profile visits.
- **Why it exists:** Sales teams want emails, not profile JSON. Bundles search + email discovery.
- **Typical chain position:** Search → emails → Lemlist/CRM

### Linkedin Search To Lead Connection
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/linkedin/2350589230697394/linkedin-search-to-lead-connection
- **What it does:** Search → qualify → auto-connect with personalized notes.
- **Why it exists:** Simpler than full outreach — just connection requests from search results.
- **Typical chain position:** Search Export → Auto Connect bundled

### Linkedin Search To Lead Outreach
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/linkedin/6276867532496207/linkedin-search-to-lead-outreach
- **What it does:** Search → enrich → multi-step outreach (connect + follow-up messages).
- **Why it exists:** Full SDR workflow in one workflow slot.
- **Typical chain position:** Highest-value LinkedIn workflow

### Linkedin Search To Outreach
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/linkedin/8154936279314174/linkedin-search-to-outreach
- **What it does:** Full pipeline: search → enrich → send connection requests/messages.
- **Why it exists:** End-to-end outbound without manual steps between extract and engage.
- **Typical chain position:** Replaces 3-4 phantom chain

### Linkedin Search To Profile Data
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/linkedin/25772/linkedin-search-to-profile-data
- **What it does:** Combined search export + profile scraping in one run — no chaining two phantoms.
- **Why it exists:** Convenience workflow for users who want enriched data from a search URL in a single click.
- **Typical chain position:** All-in-one alternative to Search Export + Profile Scraper

### Linkedin Sent Request Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/linkedin/2625694299992413/linkedin-sent-request-extractor
- **What it does:** Lists pending sent connection requests.
- **Why it exists:** Pipeline visibility — track outstanding invites.
- **Typical chain position:** Before invitation withdrawer

## Sales Navigator (14 automations)

### Linkedin Sales Navigator Account Scraper
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/sales-navigator/1229523726637056/linkedin-sales-navigator-account-scraper
- **What it does:** Scrapes full account/company data from Sales Navigator.
- **Why it exists:** Account intelligence for enterprise sales.
- **Typical chain position:** ABM research

### Linkedin Sales Navigator List Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/sales-navigator/2316536293241490/linkedin-sales-navigator-list-export
- **What it does:** Exports leads from saved Sales Navigator lead lists.
- **Why it exists:** Reuse saved SN lists as automation input.
- **Typical chain position:** SN list → outreach

### Sales Navigator Account Employees Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/sales-navigator/4200612184013755/sales-navigator-account-employees-export
- **What it does:** Exports employees at target accounts from SN.
- **Why it exists:** ABM account penetration via SN account pages.
- **Typical chain position:** ABM employee mapping

### Sales Navigator Alert Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/sales-navigator/8380235547652117/sales-navigator-alert-extractor
- **What it does:** Extracts Sales Navigator alerts (job changes, mentions, etc.).
- **Why it exists:** Trigger-based selling — act on buying signals.
- **Typical chain position:** Watcher for intent signals

### Sales Navigator Auto Connect
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/sales-navigator/29582/sales-navigator-auto-connect
- **What it does:** Sends connection requests from Sales Navigator lead lists.
- **Why it exists:** SN-specific connect with InMail fallback awareness.
- **Typical chain position:** After SN export

### Sales Navigator Inbox Scraper
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/sales-navigator/2449319061041483/sales-navigator-inbox-scraper
- **What it does:** Exports Sales Navigator inbox messages.
- **Why it exists:** SN conversation sync to CRM.
- **Typical chain position:** SN → CRM pipeline

### Sales Navigator Lead Sender
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/sales-navigator/2157800763358807/sales-navigator-lead-sender
- **What it does:** Saves leads to Sales Navigator lists.
- **Why it exists:** List management — organize prospects in SN.
- **Typical chain position:** Pre-outreach organization

### Sales Navigator Message Sender
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/sales-navigator/6318432035741982/sales-navigator-message-sender
- **What it does:** Sends messages via Sales Navigator.
- **Why it exists:** SN messaging with character limits and templates.
- **Typical chain position:** Post-connect SN nurture

### Sales Navigator Profile Scraper
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/sales-navigator/11108/sales-navigator-profile-scraper
- **What it does:** Deep-scrapes Sales Navigator profile pages.
- **Why it exists:** SN profiles have more data fields than regular LinkedIn.
- **Typical chain position:** After SN Search Export

### Sales Navigator Profile Viewers Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/sales-navigator/7495268271828736/sales-navigator-profile-viewers-export
- **What it does:** Exports who viewed your profile (SN version with more data).
- **Why it exists:** Inbound leads — people researching you.
- **Typical chain position:** → Outreach to warm viewers

### Sales Navigator Search Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/sales-navigator/6988/sales-navigator-search-export
- **What it does:** Exports leads from Sales Navigator search results.
- **Why it exists:** Premium search with better filters — SN version of Search Export.
- **Typical chain position:** SN foundation phantom

### Sales Navigator Search To Emails
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/sales-navigator/3345210151302862/sales-navigator-search-to-emails
- **What it does:** SN search → professional emails in one workflow.
- **Why it exists:** Premium search + email discovery bundled.
- **Typical chain position:** SN → emails pipeline

### Sales Navigator Search To Lead Outreach
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/sales-navigator/990186133186253/sales-navigator-search-to-lead-outreach
- **What it does:** SN search → enrich → outreach campaign.
- **Why it exists:** Full SN outbound pipeline.
- **Typical chain position:** Highest-value SN workflow

### Sales Navigator Url Converter
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/sales-navigator/9068/sales-navigator-url-converter
- **What it does:** Converts between Sales Navigator and regular LinkedIn URLs.
- **Why it exists:** URL normalization between SN and regular phantoms.
- **Typical chain position:** Glue between SN and LinkedIn phantoms

## Instagram (21 automations)

### Instagram Auto Commenter
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/instagram/14303/instagram-auto-commenter
- **What it does:** Auto-comments on Instagram posts.
- **Why it exists:** IG engagement at scale.
- **Typical chain position:** Hashtag workflow step

### Instagram Auto Follow
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/instagram/10274/instagram-auto-follow
- **What it does:** Auto-follows Instagram accounts from a list.
- **Why it exists:** IG growth — follow/unfollow strategy.
- **Typical chain position:** After follower collector

### Instagram Auto Liker
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/instagram/10506/instagram-auto-liker
- **What it does:** Auto-likes posts from a list.
- **Why it exists:** IG engagement warming.
- **Typical chain position:** Pre-follow/DM warming

### Instagram Auto Unfollow
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/instagram/8175445863495364/instagram-auto-unfollow
- **What it does:** Unfollows accounts from a list.
- **Why it exists:** IG list hygiene after follow campaigns.
- **Typical chain position:** Post-campaign cleanup

### Instagram Follower Collector
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/instagram/7175/instagram-follower-collector
- **What it does:** Collects followers of an Instagram account.
- **Why it exists:** Audience mining — followers of competitors/influencers.
- **Typical chain position:** → Auto follow/liker

### Instagram Followers Auto Follow
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/instagram/2439619339195827/instagram-followers-auto-follow
- **What it does:** Follows followers of a target account.
- **Why it exists:** Competitor audience poaching.
- **Typical chain position:** Growth hack workflow

### Instagram Following Collector
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/instagram/7195/instagram-following-collector
- **What it does:** Collects accounts an IG profile follows.
- **Why it exists:** Interest graph analysis.
- **Typical chain position:** Niche audience discovery

### Instagram Hashtag Search Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/instagram/5391/instagram-hashtag-search-export
- **What it does:** Exports posts matching a hashtag.
- **Why it exists:** Hashtag-based content/audience discovery.
- **Typical chain position:** → Post engagement workflow

### Instagram Hashtag Search To Post Engagement
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/instagram/1310092046585771/instagram-hashtag-search-to-post-engagement
- **What it does:** Finds hashtag posts → auto-likes and comments.
- **Why it exists:** IG growth automation — engage niche content daily.
- **Typical chain position:** IG inbound growth pipeline

### Instagram Multiple Hashtag Collector
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/instagram/5952/instagram-multiple-hashtag-collector
- **What it does:** Collects posts across multiple hashtags.
- **Why it exists:** Broader niche coverage than single hashtag.
- **Typical chain position:** Multi-hashtag campaigns

### Instagram Notification Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/instagram/3146421772946574/instagram-notification-extractor
- **What it does:** Exports Instagram notifications.
- **Why it exists:** Activity monitoring.
- **Typical chain position:** Engagement tracking

### Instagram Photo Likers
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/instagram/10253/instagram-photo-likers
- **What it does:** Exports users who liked a photo/post.
- **Why it exists:** IG engagement audience.
- **Typical chain position:** → Follow/like strategy

### Instagram Post Commenters Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/instagram/13788/instagram-post-commenters-export
- **What it does:** Exports users who commented on IG posts.
- **Why it exists:** IG intent signals — commenters are engaged.
- **Typical chain position:** → Auto follow

### Instagram Post Scraper
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/instagram/10152/instagram-post-scraper
- **What it does:** Scrapes data from specific Instagram posts.
- **Why it exists:** Content analysis and engager extraction.
- **Typical chain position:** → Commenters/likers export

### Instagram Profile Post Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/instagram/12766/instagram-profile-post-extractor
- **What it does:** Extracts all posts from a profile.
- **Why it exists:** Content audit of target accounts.
- **Typical chain position:** Competitor monitoring

### Instagram Profile Scraper
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/instagram/7085/instagram-profile-scraper
- **What it does:** Scrapes public Instagram profile data.
- **Why it exists:** B2C/creator prospecting beyond LinkedIn.
- **Typical chain position:** IG lead enrichment

### Instagram Profile Url Finder
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/instagram/4487/instagram-profile-url-finder
- **What it does:** Finds Instagram profile URL from username or name.
- **Why it exists:** Cross-platform identity resolution.
- **Typical chain position:** Pre-step for IG scrapers

### Instagram Story Auto Watcher
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/instagram/22794/instagram-story-auto-watcher
- **What it does:** Auto-watches stories from target accounts.
- **Why it exists:** IG warming — story views trigger notifications.
- **Typical chain position:** Pre-DM warming

### Instagram Story Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/instagram/22487/instagram-story-extractor
- **What it does:** Extracts data from Instagram stories.
- **Why it exists:** Ephemeral content capture.
- **Typical chain position:** Story analytics

### Instagram Story Viewers Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/instagram/22807/instagram-story-viewers-export
- **What it does:** Exports who viewed your Instagram stories.
- **Why it exists:** IG inbound — story viewers are warm.
- **Typical chain position:** → DM outreach

### Instagram Tagged Post Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/instagram/21841/instagram-tagged-post-extractor
- **What it does:** Extracts posts where a profile is tagged.
- **Why it exists:** Brand mention monitoring on IG.
- **Typical chain position:** UGC/brand tracking

## Twitter / X (16 automations)

### Twitter Auto Follow
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/twitter/4127/twitter-auto-follow
- **What it does:** Auto-follows Twitter accounts.
- **Why it exists:** X growth strategy.
- **Typical chain position:** After follower collector

### Twitter Auto Liker
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/twitter/5770/twitter-auto-liker
- **What it does:** Auto-likes tweets.
- **Why it exists:** X warming before DM.
- **Typical chain position:** Pre-outreach on X

### Twitter Auto Poster
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/twitter/6367798890597108/twitter-auto-poster
- **What it does:** Schedules and posts tweets.
- **Why it exists:** X content automation.
- **Typical chain position:** Inbound marketing on X

### Twitter Auto Retweeter
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/twitter/11057/twitter-auto-retweeter
- **What it does:** Auto-retweets from a list.
- **Why it exists:** Amplification/visibility play.
- **Typical chain position:** Content distribution

### Twitter Auto Unfollow
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/twitter/1312398357250675/twitter-auto-unfollow
- **What it does:** Unfollows accounts on X.
- **Why it exists:** X list hygiene.
- **Typical chain position:** Post-campaign cleanup

### Twitter Follower Collector
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/twitter/4130/twitter-follower-collector
- **What it does:** Collects followers of a Twitter account.
- **Why it exists:** Audience mining on X.
- **Typical chain position:** → Auto follow

### Twitter Following Collector
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/twitter/4457/twitter-following-collector
- **What it does:** Collects who an account follows.
- **Why it exists:** Interest graph on X.
- **Typical chain position:** Audience analysis

### Twitter Hashtag Search Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/twitter/10622/twitter-hashtag-search-export
- **What it does:** Exports tweets matching hashtags.
- **Why it exists:** Trend/topic monitoring on X.
- **Typical chain position:** → Engagement

### Twitter Media Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/twitter/8835/twitter-media-extractor
- **What it does:** Extracts media from tweets.
- **Why it exists:** Content research.
- **Typical chain position:** Media monitoring

### Twitter Message Sender
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/twitter/10678/twitter-message-sender
- **What it does:** Sends DMs on Twitter/X.
- **Why it exists:** X direct outreach.
- **Typical chain position:** After follow/warming

### Twitter Profile Likes Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/twitter/9807/twitter-profile-likes-extractor
- **What it does:** Extracts tweets a profile has liked.
- **Why it exists:** Interest profiling of targets.
- **Typical chain position:** Personalization research

### Twitter Profile Scraper
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/twitter/9375/twitter-profile-scraper
- **What it does:** Scrapes Twitter/X profile data.
- **Why it exists:** Social selling on X — profile intelligence.
- **Typical chain position:** X prospecting foundation

### Twitter Profile Url Finder
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/twitter/4485/twitter-profile-url-finder
- **What it does:** Finds Twitter handle from name.
- **Why it exists:** Identity resolution for X.
- **Typical chain position:** Pre-step for X phantoms

### Twitter Search Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/twitter/7263448483654601/twitter-search-export
- **What it does:** Exports Twitter search results.
- **Why it exists:** X discovery — find people by keywords.
- **Typical chain position:** → Follow/DM

### Twitter Tweet Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/twitter/30442/twitter-tweet-extractor
- **What it does:** Extracts data from specific tweets.
- **Why it exists:** Tweet-level analysis.
- **Typical chain position:** Content monitoring

### Twitter Tweet Likers Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/twitter/8886/twitter-tweet-likers-export
- **What it does:** Exports users who liked tweets.
- **Why it exists:** X intent signals (note: X made likes private in 2024).
- **Typical chain position:** Diminishing value post-privacy change

## Facebook (9 automations)

### Facebook Ads Library Scraper
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/facebook/27108/facebook-ads-library-scraper
- **What it does:** Scrapes Facebook Ads Library for competitor ad data.
- **Why it exists:** Competitive intelligence — see what ads competitors run.
- **Typical chain position:** Marketing research

### Facebook Auto Liker
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/facebook/8465/facebook-auto-liker
- **What it does:** Auto-likes Facebook posts.
- **Why it exists:** FB engagement warming.
- **Typical chain position:** Pre-message warming

### Facebook Group Members Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/facebook/6987/facebook-group-members-export
- **What it does:** Exports members of a Facebook group.
- **Why it exists:** Community-based FB prospecting.
- **Typical chain position:** → Message sender

### Facebook Message Sender
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/facebook/8852/facebook-message-sender
- **What it does:** Sends Facebook messages.
- **Why it exists:** FB direct outreach.
- **Typical chain position:** After group member export

### Facebook Page Review Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/facebook/11433/facebook-page-review-extractor
- **What it does:** Extracts reviews from Facebook business pages.
- **Why it exists:** Reputation research / local business intel.
- **Typical chain position:** Local business prospecting

### Facebook Post Commenters Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/facebook/8464/facebook-post-commenters-export
- **What it does:** Exports FB post commenters.
- **Why it exists:** Higher FB intent signal.
- **Typical chain position:** → Outreach

### Facebook Post Likers Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/facebook/8368/facebook-post-likers-export
- **What it does:** Exports users who liked FB posts.
- **Why it exists:** FB intent signals.
- **Typical chain position:** → Auto liker/message

### Facebook Profile Scraper
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/facebook/8369/facebook-profile-scraper
- **What it does:** Scrapes Facebook profile data.
- **Why it exists:** B2C prospecting on Facebook.
- **Typical chain position:** FB lead enrichment

### Facebook Profile Url Finder
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/facebook/4371/facebook-profile-url-finder
- **What it does:** Finds Facebook profile URL.
- **Why it exists:** Identity resolution for FB.
- **Typical chain position:** Pre-step

## Google Maps (2 automations)

### Google Maps Search Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/google-maps/23412/google-maps-search-export
- **What it does:** Exports businesses from Google Maps search results.
- **Why it exists:** Local business prospecting — non-LinkedIn lead source.
- **Typical chain position:** → Contact data workflow

### Google Maps Search To Contact Data
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/google-maps/3164769743055708/google-maps-search-to-contact-data
- **What it does:** Google Maps search → business contact data (phone, website, etc.).
- **Why it exists:** Local lead gen pipeline.
- **Typical chain position:** Maps → CRM pipeline

## GitHub (4 automations)

### Github Contributors Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/github/13243/github-contributors-export
- **What it does:** Exports contributors to a GitHub repo.
- **Why it exists:** Find active developers on projects.
- **Typical chain position:** Recruiting / developer relations

### Github Profile Scraper
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/github/12016/github-profile-scraper
- **What it does:** Scrapes GitHub profile data.
- **Why it exists:** Developer recruiting / OSS community prospecting.
- **Typical chain position:** Dev-focused outreach

### Github Stargazers Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/github/11695/github-stargazers-export
- **What it does:** Exports users who starred a GitHub repo.
- **Why it exists:** OSS community — stargazers are engaged users.
- **Typical chain position:** Dev tool GTM

### Github User Search Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/github/19487/github-user-search-export
- **What it does:** Exports GitHub user search results.
- **Why it exists:** Find developers by language/location.
- **Typical chain position:** → Profile scraper

## Reddit (4 automations)

### Reddit Post Comments Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/reddit/405430511060327/reddit-post-comments-export
- **What it does:** Exports commenters on Reddit posts.
- **Why it exists:** Reddit intent — commenters are engaged.
- **Typical chain position:** → Outreach

### Reddit Post Scraper
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/reddit/6513263440914472/reddit-post-scraper
- **What it does:** Scrapes specific Reddit posts.
- **Why it exists:** Content monitoring on Reddit.
- **Typical chain position:** → Commenters export

### Reddit Profile Scraper
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/reddit/721520576400995/reddit-profile-scraper
- **What it does:** Scrapes Reddit user profile data.
- **Why it exists:** Reddit user intelligence.
- **Typical chain position:** Community outreach prep

### Reddit Search Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/reddit/6606257561677792/reddit-search-extractor
- **What it does:** Extracts posts/users from Reddit search.
- **Why it exists:** Community intent signals — Reddit is high-intent.
- **Typical chain position:** Niche B2B/B2C prospecting

## YouTube (3 automations)

### Youtube Channel Scraper
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/youtube/11479/youtube-channel-scraper
- **What it does:** Scrapes YouTube channel data.
- **Why it exists:** Creator/influencer prospecting.
- **Typical chain position:** Influencer marketing pipeline

### Youtube Channel Video Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/youtube/11494/youtube-channel-video-extractor
- **What it does:** Extracts videos from a YouTube channel.
- **Why it exists:** Content audit of channels.
- **Typical chain position:** Competitor monitoring

### Youtube Video Scraper
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/youtube/2932599717283203/youtube-video-scraper
- **What it does:** Scrapes data from specific YouTube videos.
- **Why it exists:** Video-level analysis.
- **Typical chain position:** Content research

## Slack (3 automations)

### Slack Channel User Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/slack/8051425971617962/slack-channel-user-extractor
- **What it does:** Extracts members of a Slack channel.
- **Why it exists:** Community member lists.
- **Typical chain position:** → Outreach

### Slack Message Sender
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/slack/12420/slack-message-sender
- **What it does:** Sends messages in Slack.
- **Why it exists:** Slack outreach (where permitted).
- **Typical chain position:** Community engagement

### Slack Search Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/slack/5994628008869727/slack-search-export
- **What it does:** Exports Slack search results.
- **Why it exists:** Community mining in Slack workspaces.
- **Typical chain position:** Niche B2B in Slack communities

## HubSpot (7 automations)

### Hubspot Contact Career Tracker
- **Strategy:** Integrate
- **URL:** https://phantombuster.com/automations/hubspot/2152744569299391/hubspot-contact-career-tracker
- **What it does:** Monitors HubSpot contacts for job changes on LinkedIn.
- **Why it exists:** Trigger-based selling — job change = buying signal.
- **Typical chain position:** Alert → outreach

### Hubspot Contact Data Enricher
- **Strategy:** Integrate
- **URL:** https://phantombuster.com/automations/hubspot/7401331807175971/hubspot-contact-data-enricher
- **What it does:** Enriches existing HubSpot contacts with fresh LinkedIn data.
- **Why it exists:** CRM hygiene — keep data current.
- **Typical chain position:** Ongoing data refresh

### Hubspot Contact Data Refresher
- **Strategy:** Integrate
- **URL:** https://phantombuster.com/automations/hubspot/8591269450646814/hubspot-contact-data-refresher
- **What it does:** Refreshes stale HubSpot contact fields from LinkedIn.
- **Why it exists:** Scheduled CRM data maintenance.
- **Typical chain position:** Watcher mode on CRM

### Hubspot Contact Linkedin Outreach
- **Strategy:** Workflow
- **URL:** https://phantombuster.com/automations/hubspot/5426528541103641/hubspot-contact-linkedin-outreach
- **What it does:** Pulls HubSpot contacts → LinkedIn outreach campaign.
- **Why it exists:** CRM-driven outbound.
- **Typical chain position:** HubSpot → LinkedIn pipeline

### Hubspot Contact Linkedin Url Finder
- **Strategy:** Integrate
- **URL:** https://phantombuster.com/automations/hubspot/5512064239143016/hubspot-contact-linkedin-url-finder
- **What it does:** Finds LinkedIn URLs for HubSpot contacts missing them.
- **Why it exists:** CRM → LinkedIn bridge.
- **Typical chain position:** Pre-step for enrichment

### Hubspot Contact Sender
- **Strategy:** Engage
- **URL:** https://phantombuster.com/automations/hubspot/1386033999114383/hubspot-contact-sender
- **What it does:** Sends outreach to HubSpot contact lists.
- **Why it exists:** CRM-list-driven engagement.
- **Typical chain position:** HubSpot list → messages

### Hubspot Crm Enricher
- **Strategy:** Integrate
- **URL:** https://phantombuster.com/automations/hubspot/276741128276076/hubspot-crm-enricher
- **What it does:** Pushes scraped data into HubSpot CRM contacts.
- **Why it exists:** CRM sync — eliminates manual import.
- **Typical chain position:** End of most extract/enrich chains

## Pipedrive (1 automations)

### Pipedrive Crm Enricher
- **Strategy:** Integrate
- **URL:** https://phantombuster.com/automations/pipedrive/789401822848446/pipedrive-crm-enricher
- **What it does:** Pushes scraped data into Pipedrive CRM.
- **Why it exists:** Pipedrive sync.
- **Typical chain position:** End of extract chains

## Salesforce (1 automations)

### Salesforce Crm Enricher
- **Strategy:** Integrate
- **URL:** https://phantombuster.com/automations/salesforce/2264953542925362/salesforce-crm-enricher
- **What it does:** Pushes scraped data into Salesforce CRM.
- **Why it exists:** Salesforce sync.
- **Typical chain position:** End of extract chains

## AI (4 automations)

### Advanced Ai Enricher
- **Strategy:** AI
- **URL:** https://phantombuster.com/automations/ai/147200841883363/advanced-ai-enricher
- **What it does:** Advanced AI enrichment across multiple data fields.
- **Why it exists:** Deep AI analysis of lead data.
- **Typical chain position:** Premium enrichment

### Ai Linkedin Message Writer
- **Strategy:** AI
- **URL:** https://phantombuster.com/automations/ai/3614446764718424/ai-linkedin-message-writer
- **What it does:** AI generates personalized LinkedIn messages from profile data.
- **Why it exists:** Personalization at scale — unique messages per lead.
- **Typical chain position:** Pre-message-sender step

### Ai Linkedin Post Responder
- **Strategy:** AI
- **URL:** https://phantombuster.com/automations/ai/5825898517687124/ai-linkedin-post-responder
- **What it does:** AI generates responses to LinkedIn posts/comments.
- **Why it exists:** AI engagement — contextual comments.
- **Typical chain position:** Auto-commenter with AI brain

### Ai Linkedin Profile Enricher
- **Strategy:** AI
- **URL:** https://phantombuster.com/automations/ai/1333223865797404/ai-linkedin-profile-enricher
- **What it does:** AI analyzes and enriches LinkedIn profile data with insights.
- **Why it exists:** AI layer on raw scrape — summaries, ICP scoring.
- **Typical chain position:** Post-scrape intelligence

## Toolbox (generic) (7 automations)

### Chrome Extension Review Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/toolbox/6817/chrome-extension-review-extractor
- **What it does:** Scrapes Chrome Web Store extension reviews.
- **Why it exists:** Competitive intel for browser extension market.
- **Typical chain position:** Niche market research

### Data Scraping Crawler
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/toolbox/22972/data-scraping-crawler
- **What it does:** Generic web crawler for any website.
- **Why it exists:** Catch-all scraper — when no dedicated phantom exists.
- **Typical chain position:** Custom scraping needs

### Domain Name Finder
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/toolbox/3171/domain-name-finder
- **What it does:** Finds company domain from company name.
- **Why it exists:** Company → domain resolution.
- **Typical chain position:** Pre-step for email finder

### Email Extractor
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/toolbox/6774/email-extractor
- **What it does:** Extracts emails from web pages.
- **Why it exists:** Generic email scraping from any URL.
- **Typical chain position:** Website → email

### Linkedin Search To Lemlist Campaign
- **Strategy:** Integrate
- **URL:** https://phantombuster.com/automations/toolbox/4201331544314519/linkedin-search-to-lemlist-campaign
- **What it does:** LinkedIn search → Lemlist email campaign.
- **Why it exists:** LinkedIn → email multichannel handoff.
- **Typical chain position:** Search → Lemlist pipeline

### Professional Email Finder
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/toolbox/18998/professional-email-finder
- **What it does:** Finds professional email addresses from name + company.
- **Why it exists:** Email discovery independent of LinkedIn.
- **Typical chain position:** Universal enrichment step

### Web Element Extractor
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/toolbox/6776/web-element-extractor
- **What it does:** Extracts specific CSS elements from web pages.
- **Why it exists:** Surgical DOM extraction.
- **Typical chain position:** Custom data points

## Pages Jaunes (FR) (2 automations)

### Pages Jaunes Business Scraper
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/pages-jaunes/8382506532665958/pages-jaunes-business-scraper
- **What it does:** Scrapes detailed business data from Pages Jaunes.
- **Why it exists:** French business enrichment.
- **Typical chain position:** FR local data

### Pages Jaunes Search Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/pages-jaunes/8088768334781496/pages-jaunes-search-export
- **What it does:** Exports French business directory (Pages Jaunes) search results.
- **Why it exists:** French local business prospecting.
- **Typical chain position:** FR market lead gen

## Yellow Pages (2 automations)

### Yellow Pages Business Scraper
- **Strategy:** Enrich
- **URL:** https://phantombuster.com/automations/yellow-pages/7789470996120613/yellow-pages-business-scraper
- **What it does:** Scrapes detailed Yellow Pages business listings.
- **Why it exists:** Local business enrichment.
- **Typical chain position:** Local → CRM

### Yellow Pages Search Export
- **Strategy:** Extract
- **URL:** https://phantombuster.com/automations/yellow-pages/7991936744428339/yellow-pages-search-export
- **What it does:** Exports Yellow Pages business search results.
- **Why it exists:** US/UK local business prospecting.
- **Typical chain position:** Local lead gen

---

## Product Strategy Observations

1. **LinkedIn dominance (51/151 = 34%)** — Core product is LinkedIn B2B sales automation.
2. **Extract → Enrich → Engage ladder** — Most value is in chaining; individual phantoms are LEGO bricks.
3. **Workflow phantoms are the upsell** — Bundled multi-step workflows use 2-3 slots but save user setup time.
4. **CRM integrations are the retention layer** — HubSpot (7 phantoms) is deepest integration.
5. **Multi-platform is marketing breadth** — Instagram/Twitter/Facebook exist but LinkedIn+SN = 43% of catalog.
6. **AI phantoms are recent additions** — Message writer, profile enricher, post responder = LLM layer on top of scrape data.
7. **Local business (Maps, Yellow Pages, Pages Jaunes)** — Extends TAM beyond B2B LinkedIn sales.
8. **Generic toolbox** — Data Scraping Crawler and Web Element Extractor are escape hatches for custom needs.

*Source: PhantomBuster public sitemap (https://phantombuster.com/sitemap.xml), scraped June 26, 2026.*