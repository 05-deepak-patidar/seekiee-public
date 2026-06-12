# Mode: scan — Portal Scanner (Job Discovery)

Scan configured job portals, filter by title relevance, and add new jobs to the pipeline for later evaluation.

> **Note (v1.6+):** The default scanner (`scan.mjs` / `npm run scan`) is **zero-token** and uses structured sources: per-company local parsers and the public Greenhouse, Ashby, and Lever APIs. The Playwright/WebSearch tiers described below are the **agent** flow (run by Claude/Codex), not what `scan.mjs` does. If a company has neither a local parser nor a Greenhouse/Ashby/Lever API, `scan.mjs` skips it; for those cases the agent should manually complete Tier 1 (Playwright) or Tier 3 (WebSearch).
>
> **Rule (v1.8+):** If a company's local parser succeeds in Tier 0, the agent must **not** repeat that company in Playwright (Tier 1) or API (Tier 2). In Tier 3, general queries stay active, but results from companies already covered by a parser are discarded. See [Rule: successful local parser](#rule-successful-local-parser--dont-repeat-expensive-scraping).

## Recommended execution

Run as a subagent so it doesn't consume the main context:

```
Agent(
    subagent_type="general-purpose",
    prompt="[contents of this file + specific data]",
    run_in_background=True
)
```

## Configuration

Read `portals.yml`, which contains:
- `search_queries`: List of WebSearch queries with `site:` filters per portal (broad discovery)
- `tracked_companies`: Specific companies with `careers_url` for direct navigation
- `tracked_companies[].parser`: Optional local parser for SSR pages or stable HTML
- `title_filter`: positive/negative/seniority_boost keywords for title filtering

## Discovery strategy (4 tiers)

### Tier 0 — Local parser (CHEAPEST)

**For each company in `tracked_companies` with a `parser:` configured:** run the local parser defined in `portals.yml`. This tier is ideal when the careers page uses SSR or stable HTML and a JavaScript, Python, or other local-runtime script already exists that extracts the jobs without the agent's help.

Recommended contract:

```yaml
- name: Example Company
  careers_url: https://example.com/careers
  scan_method: local_parser
  parser:
    command: node
    script: scripts/parsers/example-company-jobs.js
    format: jobs-json-v1
  enabled: true
```

Usually the parser is specific to one company and already knows the URL, selectors, and pagination. `args` is optional: use it however helps whoever built the script — for example to reuse it across companies, pass `{careers_url}` or `{company}`, toggle a debug flag, save a JSON snapshot, or control any parser-specific behavior.

The parser must print JSON to stdout:

Array format:

```json
[
  { "title": "Senior AI Engineer", "url": "https://example.com/jobs/123", "location": "Remote" }
]
```

Object with `jobs`:

```json
{
  "jobs": [
    { "title": "Senior AI Engineer", "url": "https://example.com/jobs/123", "location": "Remote" }
  ]
}
```

Object with `results`:

```json
{
  "results": [
    { "title": "Senior AI Engineer", "url": "https://example.com/jobs/123", "location": "Remote" }
  ]
}
```

`company` is optional; if absent, `scan.mjs` uses the name from `tracked_companies`.

The scanner doesn't need to keep the full JSON after reading stdout. If a parser also produces an artifact for auditing or debugging, save it to `data/parser-output/{company}/` and keep it out of git (the JSON files in `.gitignore`; the `.gitkeep` files stay in git to preserve the structure).

### Rule: successful local parser — don't repeat expensive scraping

The goal of `scan_method: local_parser` is to **reduce tokens**: avoid having the LLM re-scrape the same company with Playwright or redundant APIs.

During the agent scan, keep the set **`local_parser_ok`** in memory: company names (`tracked_companies[].name`) where Tier 0 succeeded:

- `parser.command` + `parser.script` exist and the script ran without a fatal error
- stdout was valid JSON (`[]`, `{ jobs: [] }`, or `{ results: [] }`)
- No timeout or process crash

| Tier | If the company is in `local_parser_ok` |
|------|----------------------------------------|
| **1 — Playwright** | **Skip** — no `browser_navigate` to its `careers_url` (most token-expensive method) |
| **2 — API** | **Skip** — no WebFetch of its `api:` (already covered by the parser; `scan.mjs` also skips the API after a successful parser) |
| **3 — WebSearch** | Run **general** queries (`site:`, role titles); **discard** any hit whose normalized company matches `local_parser_ok` |

**Exceptions:**

- Parser **failed** → the company does **not** enter `local_parser_ok`; Tiers 1 and 2 apply normally (same criterion as `scan.mjs`'s fallback when the parser fails and an ATS API exists).
- Tier 3: don't disable cross-cutting queries (`site:jobs.ashbyhq.com`, `site:boards.greenhouse.io`, etc.) — they discover **new** companies. Only filter out results from companies already in `tracked_companies` with a successful parser.
- Don't create `search_queries` dedicated to a company with an active local parser (e.g. `site:jobs.ashbyhq.com/cohere "AI Engineer"`); use the parser or, if it fails, Playwright/API.

**Recommended Tier 0:** run `node scan.mjs` (or `npm run scan`) at the start of the agent workflow. That covers local parsers + APIs in a single zero-token step and reports which companies used `local-parser` successfully.

### Tier 1 — Direct Playwright (PRIMARY)

**For each company in `tracked_companies` not in `local_parser_ok`:** Navigate to its `careers_url` with Playwright (`browser_navigate` + `browser_snapshot`), read ALL visible job listings, and extract title + URL of each. This is the most reliable method because:
- It sees the page in real time (not Google's cached results)
- It works with SPAs (Ashby, Lever, Workday)
- It detects new jobs instantly
- It doesn't depend on Google's indexing

**Every company MUST have `careers_url` in portals.yml.** If it doesn't, look it up once, save it, and use it in future scans.

### Tier 2 — ATS APIs / Feeds (COMPLEMENTARY)

For companies with a public API or structured feed **that are not in `local_parser_ok`**, use the JSON/XML response as a fast complement to Tier 1. It's faster than Playwright and reduces visual-scraping errors.

**Current support (variables in `{}`):**
- **Greenhouse**: `https://boards-api.greenhouse.io/v1/boards/{company}/jobs`
- **Ashby**: `https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams`
- **BambooHR**: list `https://{company}.bamboohr.com/careers/list`; job detail `https://{company}.bamboohr.com/careers/{id}/detail`
- **Lever**: `https://api.lever.co/v0/postings/{company}?mode=json`
- **Teamtailor**: `https://{company}.teamtailor.com/jobs.rss`
- **Workday**: `https://{company}.{shard}.myworkdayjobs.com/wday/cxs/{company}/{site}/jobs`

**Parsing convention per provider:**
- `greenhouse`: `jobs[]` → `title`, `absolute_url`
- `ashby`: GraphQL `ApiJobBoardWithTeams` with `organizationHostedJobsPageName={company}` → `jobBoard.jobPostings[]` (`title`, `id`; build the public URL if not in the payload)
- `bamboohr`: list `result[]` → `jobOpeningName`, `id`; build the detail URL `https://{company}.bamboohr.com/careers/{id}/detail`; to read the full JD, GET the detail and use `result.jobOpening` (`jobOpeningName`, `description`, `datePosted`, `minimumExperience`, `compensation`, `jobOpeningShareUrl`)
- `lever`: root array `[]` → `text`, `hostedUrl` (fallback: `applyUrl`)
- `teamtailor`: RSS items → `title`, `link`
- `workday`: `jobPostings[]`/`jobPostings` (depending on tenant) → `title`, `externalPath` or URL built from the host

### Tier 3 — WebSearch queries (BROAD DISCOVERY)

The `search_queries` with `site:` filters cover portals across the board (all Ashby, all Greenhouse, etc.). Useful for discovering NEW companies not yet in `tracked_companies`, but results can be stale. After filtering out hits from companies in `local_parser_ok`, the remaining results are deduplicated against Tiers 0–2.

**Execution priority:**
1. Tier 0: Local parser → companies with a `parser:` configured and an existing script; build `local_parser_ok`
2. Tier 1: Playwright → `tracked_companies` with `careers_url`, **except** `local_parser_ok`
3. Tier 2: API → `tracked_companies` with `api:`, **except** `local_parser_ok`
4. Tier 3: WebSearch → all `search_queries` with `enabled: true`; discard hits from companies in `local_parser_ok`

The tiers are additive — they run in order, results are merged and deduplicated. Companies in `local_parser_ok` do **not** go through Tiers 1 or 2; in Tier 3 they only contribute cross-cutting discovery (other companies on the same portal).

## Workflow

1. **Read configuration**: `portals.yml`
2. **Read history**: `data/scan-history.tsv` → URLs already seen
3. **Read dedup sources**: `data/applications.md` + `data/pipeline.md`

3.5. **Tier 0 — Local parser** (`scan.mjs`, zero-token):
   Initialize `local_parser_ok = []`.
   Prefer running `node scan.mjs` once to cover all parsers + APIs zero-token; if done manually, repeat the logic below.
   For each company in `tracked_companies` with `enabled: true`, a `parser.command`, and an existing script:
   a. Run `parser.command` with `parser.script` + `parser.args` using local execution without a shell
   b. Expand `{careers_url}` and `{company}` placeholders in the arguments
   c. Read JSON from stdout (`[]`, `{ jobs: [] }`, or `{ results: [] }`)
   d. Normalize each job to `{title, url, company, location}`
   e. Resolve relative URLs against `careers_url`
   f. If the parser fails, log the error, try the ATS API fallback if one exists, and continue with the other companies (do **not** add to `local_parser_ok`)
   g. If the parser succeeds (steps c–e without a fatal error), add `entry.name` to `local_parser_ok` and accumulate the jobs as candidates

4. **Tier 1 — Playwright scan** (parallel in batches of 3–5):
   For each company in `tracked_companies` with `enabled: true`, a defined `careers_url`, and a **name not listed in `local_parser_ok`**:
   a. `browser_navigate` to the `careers_url`
   b. `browser_snapshot` to read all job listings
   c. If the page has filters/departments, navigate the relevant sections
   d. For each job listing extract: `{title, url, company}`
   e. If the page paginates results, navigate the additional pages
   f. Accumulate in the candidate list
   g. If `careers_url` fails (404, redirect), try `scan_query` as a fallback and note it for updating the URL

5. **Tier 2 — ATS APIs / feeds** (parallel):
   For each company in `tracked_companies` with a defined `api:`, `enabled: true`, and a **name not listed in `local_parser_ok`**:
   a. WebFetch the API/feed URL
   b. If `api_provider` is defined, use its parser; if not, infer from the domain (`boards-api.greenhouse.io`, `jobs.ashbyhq.com`, `api.lever.co`, `*.bamboohr.com`, `*.teamtailor.com`, `*.myworkdayjobs.com`)
   c. For **Ashby**, send a POST with:
      - `operationName: ApiJobBoardWithTeams`
      - `variables.organizationHostedJobsPageName: {company}`
      - GraphQL query for `jobBoardWithTeams` + `jobPostings { id title locationName employmentType compensationTierSummary }`
   d. For **BambooHR**, the list only carries basic metadata. For each relevant item, read `id`, GET `https://{company}.bamboohr.com/careers/{id}/detail`, and extract the full JD from `result.jobOpening`. Use `jobOpeningShareUrl` as the public URL if present; otherwise use the detail URL.
   e. For **Workday**, send a JSON POST with at least `{"appliedFacets":{},"limit":20,"offset":0,"searchText":""}` and paginate by `offset` until results are exhausted
   f. For each job, extract and normalize: `{title, url, company}`
   g. Accumulate in the candidate list (dedup against Tier 1)

6. **Tier 3 — WebSearch queries** (parallel if possible):
   For each query in `search_queries` with `enabled: true` (general per-portal/role queries — not queries dedicated to a company with an active local parser):
   a. Run WebSearch with the defined `query`
   b. From each result extract: `{title, url, company}`
      - **title**: from the result title (before the " @ " or " | ")
      - **url**: the result URL
      - **company**: after the " @ " in the title, or extract from the domain/path
   c. **Skip** the result if `company` (normalized) matches any name in `local_parser_ok`
   d. Accumulate the rest in the candidate list (dedup against Tiers 0+1+2)

7. **Filter by title** using `title_filter` from `portals.yml`:
   - At least 1 `positive` keyword must appear in the title (case-insensitive)
   - 0 `negative` keywords may appear
   - `seniority_boost` keywords give priority but are not required

7b. **Filter by location (optional)** using `location_filter` from `portals.yml`:
   - If the `location_filter` block is absent, all locations pass (default behavior)
   - Empty location on a job → passes (don't penalize missing data)
   - Any `block` keyword present → reject (takes precedence over allow)
   - Empty `allow` → passes (already cleared block)
   - Non-empty `allow` → at least one keyword must match
   - All matches are case-insensitive substring
   - Location is persisted as the 7th column in `scan-history.tsv` for later auditing

8. **Deduplicate** against 3 sources:
   - `scan-history.tsv` → exact URL already seen
   - `applications.md` → company + normalized role already evaluated
   - `pipeline.md` → exact URL already pending or processed

8.5. **Verify liveness of WebSearch results (Tier 3)** — BEFORE adding to the pipeline:

   WebSearch results can be stale (Google caches results for weeks or months). To avoid evaluating expired jobs, verify each new Tier 3 URL with Playwright. Tiers 1 and 2 are inherently real-time and don't need this check.

   For each new Tier 3 URL (sequential — NEVER Playwright in parallel):
   a. `browser_navigate` to the URL
   b. `browser_snapshot` to read the content
   c. Classify:
      - **Active**: job title visible + role description + a visible Apply/Submit control within the main content. Don't count generic header/navbar/footer text.
      - **Expired** (any of these signals):
        - Final URL contains `?error=true` (Greenhouse redirects this way when a job is closed)
        - Page contains: "job no longer available" / "no longer open" / "position has been filled" / "this job has expired" / "page not found"
        - Only navbar and footer visible, no JD content (content < ~300 chars)
   d. If expired: log in `scan-history.tsv` with status `skipped_expired` and discard
   e. If active: continue to step 9

   **Don't abort the whole scan if one URL fails.** If `browser_navigate` errors (timeout, 403, etc.), mark it `skipped_expired` and continue with the next.

9. **For each new verified job that passes the filters**:
   a. Add to `pipeline.md` under "Pending": `- [ ] {url} | {company} | {title}`
   b. Log in `scan-history.tsv`: `{url}\t{date}\t{query_name}\t{title}\t{company}\tadded`

10. **Jobs filtered out by title**: log in `scan-history.tsv` with status `skipped_title`
11. **Duplicate jobs**: log with status `skipped_dup`
12. **Expired jobs (Tier 3)**: log with status `skipped_expired`

## Extracting title and company from WebSearch results

WebSearch results come in the format: `"Job Title @ Company"` or `"Job Title | Company"` or `"Job Title — Company"`.

Extraction patterns per portal:
- **Ashby**: `"Senior AI PM (Remote) @ EverAI"` → title: `Senior AI PM`, company: `EverAI`
- **Greenhouse**: `"AI Engineer at Anthropic"` → title: `AI Engineer`, company: `Anthropic`
- **Lever**: `"Product Manager - AI @ Temporal"` → title: `Product Manager - AI`, company: `Temporal`

Generic regex: `(.+?)(?:\s*[@|—–-]\s*|\s+at\s+)(.+?)$`

## Private URLs

If a URL is not publicly accessible:
1. Save the JD to `jds/{company}-{role-slug}.md`
2. Add to pipeline.md as: `- [ ] local:jds/{company}-{role-slug}.md | {company} | {title}`

## Scan History

`data/scan-history.tsv` tracks ALL URLs seen:

```
url	first_seen	portal	title	company	status
https://...	2026-02-10	Ashby — AI PM	PM AI	Acme	added
https://...	2026-02-10	Greenhouse — SA	Junior Dev	BigCo	skipped_title
https://...	2026-02-10	Ashby — AI PM	SA AI	OldCo	skipped_dup
https://...	2026-02-10	WebSearch — AI PM	PM AI	ClosedCo	skipped_expired
```

## Output summary

```
Portal Scan — {YYYY-MM-DD}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Queries run: N
Jobs found: N total
Filtered by title: N relevant
Duplicates: N (already evaluated or in pipeline)
Expired discarded: N (dead links, Tier 3)
New added to pipeline.md: N

  + {company} | {title} | {query_name}
  ...

→ Run /seekiee pipeline to evaluate the new jobs.
```

## Managing careers_url

Every company in `tracked_companies` should have `careers_url` — the direct URL to its jobs page. This avoids looking it up every time.

**RULE: Always use the company's corporate URL; fall back to the ATS endpoint only if there is no dedicated corporate page.**

`careers_url` should point to the company's own careers page whenever available. Many companies use Workday, Greenhouse, or Lever under the hood but expose their job IDs only through their corporate domain. Using the direct ATS URL when a corporate page exists can cause false 410 errors because the job IDs don't match.

| ✅ Correct (corporate) | ❌ Wrong as first choice (direct ATS) |
|---|---|
| `https://careers.mastercard.com` | `https://mastercard.wd1.myworkdayjobs.com` |
| `https://openai.com/careers` | `https://job-boards.greenhouse.io/openai` |
| `https://stripe.com/jobs` | `https://jobs.lever.co/stripe` |

Fallback: if you only have the direct ATS URL, navigate to the company website first and locate its corporate careers page. Use the direct ATS URL only if the company has no dedicated corporate page.

**Known patterns by platform:**
- **Ashby:** `https://jobs.ashbyhq.com/{slug}`
- **Greenhouse:** `https://job-boards.greenhouse.io/{slug}` or `https://job-boards.eu.greenhouse.io/{slug}`
- **Lever:** `https://jobs.lever.co/{slug}`
- **BambooHR:** list `https://{company}.bamboohr.com/careers/list`; detail `https://{company}.bamboohr.com/careers/{id}/detail`
- **Teamtailor:** `https://{company}.teamtailor.com/jobs`
- **Workday:** `https://{company}.{shard}.myworkdayjobs.com/{site}`
- **Custom:** The company's own URL (e.g. `https://openai.com/careers`)

**API/feed patterns by platform:**
- **Ashby API:** `https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams`
- **BambooHR API:** list `https://{company}.bamboohr.com/careers/list`; detail `https://{company}.bamboohr.com/careers/{id}/detail` (`result.jobOpening`)
- **Lever API:** `https://api.lever.co/v0/postings/{company}?mode=json`
- **Teamtailor RSS:** `https://{company}.teamtailor.com/jobs.rss`
- **Workday API:** `https://{company}.{shard}.myworkdayjobs.com/wday/cxs/{company}/{site}/jobs`

**If `careers_url` doesn't exist** for a company:
1. Try its known platform pattern
2. If that fails, run a quick WebSearch: `"{company}" careers jobs`
3. Navigate with Playwright to confirm it works
4. **Save the URL found in portals.yml** for future scans

**If `careers_url` returns 404 or a redirect:**
1. Note it in the output summary
2. Try scan_query as a fallback
3. Flag it for manual update

## Maintaining portals.yml

- **ALWAYS save `careers_url`** when adding a new company
- Add new queries as portals or interesting roles are discovered
- Disable queries with `enabled: false` if they generate too much noise
- Adjust filter keywords as target roles evolve
- Add companies to `tracked_companies` when you want to follow them closely
- Verify `careers_url` periodically — companies change ATS platforms
