# LinkedIn OSS Research Repos (local clones)

Vendored shallow clones of open-source projects that map LinkedIn data access patterns.
See [linkedin-oss-data-access-map.md](../linkedin-oss-data-access-map.md) for analysis.

## Re-clone / update

```bash
bash scripts/clone_linkedin_oss_repos.sh
```

## Inventory

| Local directory | GitHub | Category |
|-----------------|--------|----------|
| `linkedin-mcp-server/` | [stickerdaniel/linkedin-mcp-server](https://github.com/stickerdaniel/linkedin-mcp-server) | Auth + DOM innerText |
| `linkedin-mcp/` | [Michaelrecycle/linkedin-mcp](https://github.com/Michaelrecycle/linkedin-mcp) | In-browser Voyager |
| `linkedin_scraper/` | [joeyism/linkedin_scraper](https://github.com/joeyism/linkedin_scraper) | Playwright DOM |
| `linkedin-api/` | [nsandman/linkedin-api](https://github.com/nsandman/linkedin-api) | Classic Voyager REST |
| `inb/` | [joshiayush/inb](https://github.com/joshiayush/inb) | linkedin-api fork |
| `linkedin-profile-scraper-api/` | [josephlimtech/linkedin-profile-scraper-api](https://github.com/josephlimtech/linkedin-profile-scraper-api) | Puppeteer selectors |
| `linvo-scraper/` | [linvo-io/linvo-scraper](https://github.com/linvo-io/linvo-scraper) | Puppeteer + Sales Nav |
| `LinkedInDumper/` | [l4rm4nd/LinkedInDumper](https://github.com/l4rm4nd/LinkedInDumper) | Dash + GraphQL |
| `codyrobertson-linkedin-cli/` | [codyrobertson/linkedin-cli](https://github.com/codyrobertson/linkedin-cli) | Voyager + writes |
| `eracle-linkedin-cli/` | [eracle/linkedin-cli](https://github.com/eracle/linkedin-cli) | Playwright Voyager |
| `OpenOutreach/` | [eracle/OpenOutreach](https://github.com/eracle/OpenOutreach) | Production daemon |
| `linkedin-voyager-sdk/` | [trieb-work/linkedin-voyager-sdk](https://github.com/trieb-work/linkedin-voyager-sdk) | TS Voyager SDK |
| `linkedin-scraping-tools/` | [ArthurVerrez/linkedin-scraping-tools](https://github.com/ArthurVerrez/linkedin-scraping-tools) | Selenium SN |
| `scraping-linkedin-salesNavigator/` | [padmanabhan-s/scraping-linkedin-salesNavigator](https://github.com/padmanabhan-s/scraping-linkedin-salesNavigator) | Basic SN scrape |

Machine-readable manifest: [repos-manifest.json](../repos-manifest.json)
