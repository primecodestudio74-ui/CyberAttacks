# HackAware Cyber News

Editorial cybersecurity news inside HackAware: a TOI-style reading experience
(sections rail, top story, latest feed, sidebar) backed by **real articles from
trusted publishers and official advisories** — no hardcoded or mock content.

- In-app entry point: **Dashboard → Intelligence → Cyber News** (`/dashboard?tab=news`)
- Public entry point: **`/news`** (the news API is public, so visitors can read it without an account)
- Backend API: **`GET /api/news`** (see [API reference](#api-reference))

---

## 1. Provider decision

### Chosen primary source: the curated cyber newswire (publisher RSS/Atom + official advisories)

The provider layer syndicates the **public feeds that cybersecurity publishers
and government cybersecurity bodies already publish for syndication**:

| Source | Feed | Group |
| --- | --- | --- |
| The Hacker News | `https://feeds.feedburner.com/TheHackersNews` | publisher |
| BleepingComputer | `https://www.bleepingcomputer.com/feed/` | publisher |
| Dark Reading | `https://www.darkreading.com/rss.xml` | publisher |
| SecurityWeek | `https://www.securityweek.com/feed/` | publisher |
| Krebs on Security | `https://krebsonsecurity.com/feed/` | publisher |
| Help Net Security | `https://www.helpnetsecurity.com/feed/` | publisher |
| The Register (Security) | `https://www.theregister.com/security/headlines.atom` | publisher |
| The Cyber Express (India) | `https://thecyberexpress.com/feed/` | publisher |
| CISA Cybersecurity Advisories | `https://www.cisa.gov/cybersecurity-advisories/all.xml` | advisory |
| CISA Known Exploited Vulnerabilities (JSON) | `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` | advisory |

Every one of these was fetched and verified live on **12 October 2026** (status,
format, freshness and field availability) while building this feature; the
fixtures in `backend/tests/fixtures/` are the real item structures captured from
those responses.

### Why this beats the conventional free news APIs

| Option | Free tier reality | Verdict |
| --- | --- | --- |
| **Publisher feeds (chosen)** | Free forever, no key, no quota, no delay, images + author + exact timestamps, official advisories included | **Primary** |
| NewsAPI.org | 100 req/day, **development use only** (localhost), 24 h delay on free | Rejected — not usable in production |
| GNews | 100 req/day, free tier restricted to non-commercial/testing use | Rejected — licence forbids production use |
| NewsData.io | 200 credits/day, **12 h delay**, 10 articles/credit, no full content, commercial-use wording ambiguous, rate limit 30 credits/15 min | Rejected as primary — delay + quota + ambiguous terms |
| The Guardian Open Platform | Genuinely production-friendly free key | Not chosen — thin cybersecurity coverage, poor India coverage |
| Google News RSS | No official licence for redistribution | Rejected — licensing is not clear |

**Why the newswire wins for this product:** cybersecurity publishers are exactly
the sources HackAware needs (no unrelated technology news to filter out), the
feeds are intended for syndication (headline + short excerpt + link back), they
are real-time rather than hours delayed, they carry publication timestamps,
authors and thumbnails, and the official CISA feeds give authoritative
vulnerability/advisory content that a general news API cannot match.

### Licensing / usage limitations (verified)

- HackAware shows **only the headline, a short excerpt (≤ ~260 characters) and a
  link** to the publisher's own article page. Full articles are never fetched,
  copied, stored or re-hosted.
- Each card carries the publisher's name, their favicon host and the original
  URL; nothing is presented as HackAware's own reporting.
- Feed URLs may change or disappear (publishers do not guarantee them); a failing
  source degrades on its own and the UI says so. See [Limitations](#known-limitations).
- CISA advisories and the KEV catalog are US Government works (public domain).
- Images remain the publisher's property and are referenced by their own URL
  (we do not proxy, re-encode or re-host them).
- Feed rate limits are not published, which is why the server caches for 10
  minutes minimum and rate-limits the refresh endpoint.

---

## 2. Architecture

```
frontend/src/pages/News/CyberNews.jsx      editorial page (sections + feed + sidebar)
frontend/src/components/News/*             cards, featured story, rail, sidebar, states
frontend/src/hooks/useNews.js              data hook: debounce, abort/stale guard, paging
frontend/src/services/newsService.js       client for /api/news (no key, no provider calls)

backend/routes/newsRoutes.js               public routes + rate limits
backend/controllers/newsController.js      request validation, one JSON envelope
backend/services/news/newsService.js       filtering, sorting, paging, editorial sections
backend/services/news/newsCache.js         pool, TTL + stale-while-revalidate, de-duplication
backend/services/news/feedProviders.js     the ONLY network layer (timeouts, size caps, SSRF guard)
backend/services/news/feedParser.js        zero-dependency RSS/Atom parser (no entity expansion)
backend/services/news/normalize.js         untrusted item -> internal article schema
backend/services/news/sanitize.js          text/URL/date sanitisation + canonical ids
backend/services/news/classify.js          keyword + co-occurrence categorisation
backend/config/newsConfig.js               sources, categories, limits, cache policy
```

Request flow: `browser → /api/news (same origin) → controller → service → cache
→ (refresh) provider → parse → sanitize → classify → dedupe → respond`.

### Security properties

- **No provider is ever called from the browser.** No API key exists client-side;
  the news provider needs none, and other secrets (Mongo, JWT, OpenRouter) stay in
  `backend/.env`, which is git-ignored.
- **Untrusted input**: descriptions/subtitles are parsed as text (markup stripped,
  entities decoded, angle brackets removed) and never rendered as HTML (React
  escapes by default).
- **URL allow-listing**: only `http(s)` absolute URLs are accepted; `javascript:`,
  `data:`, `file:`, protocol-relative URLs and URLs with embedded credentials are
  dropped. Looped-back/private/ link-local hosts (including `169.254.169.254`) are
  rejected — the fetcher cannot be turned into an SSRF primitive.
- **Bounded fetching**: registry-only targets, hard timeouts, response size caps,
  concurrency limit of 5, descriptive User-Agent, redirects followed but re-validated.
- **Rate limiting**: 60 read requests/min/IP and 6 refreshes/min/IP, plus a
  server-side minimum interval between upstream refreshes.
- **Structured logging**: `[news] refresh complete sources=10 fetched=10 …` — no
  credentials, no request bodies, no stack traces to clients.
- **No database**: news is ephemeral; MongoDB keeps only accounts and progress.

---

## 3. Categorisation

Ten user-facing sections are derived from the publisher's own title/description:

`All News`, `Cyber Attacks`, `Data Breaches`, `Hacking & Exploits`, `AI Security`,
`Cybercrime & Scams`, `Vulnerabilities & CVEs`, `India Cyber News`,
`Government & Security Advisories`, `Cloud & Enterprise Security`.

- Keyword lists (with `stem*` support) and weighted co-occurrence rules live in
  `backend/config/newsConfig.js` and `backend/services/news/classify.js` — adding a
  section is a data change, not a code change.
- An article gets **one primary category** (its badge) plus every other topic it
  genuinely matches (the filters), so a ransomware story about India appears under
  both `Cyber Attacks` and `India Cyber News` — but never under a topic it does not match.
- Stories that match nothing get the internal `Cybersecurity` badge instead of an
  invented category; stories with no cyber signal at all are dropped.
- **No fabricated signals**: no view counts, no popularity scores, no invented
  "Breaking" labels. `Critical` appears only when an official advisory's own title
  says critical; `Exploited in the wild` only for CISA KEV entries; "Covered by
  multiple outlets" is computed from real duplicate detection. The sidebar states
  openly that no engagement metrics are available.

---

## 4. API reference

### `GET /api/news`

| Parameter | Values | Notes |
| --- | --- | --- |
| `category` | category id (e.g. `data-breaches`) | default `all-news` |
| `q` | ≤ 80 chars | all tokens must match (title, description, source, CVE ids) |
| `source` | source id or exact name | publisher filter |
| `sort` | `newest` (default) / `oldest` | undated stories always last |
| `page` | 1–60 | |
| `limit` | 1–30 | default 12 |

```jsonc
{
  "success": true,
  "articles": [{
    "id": "news_85924fe1c086a83e",       // stable, derived from the canonical URL
    "title": "Ransomware Response Expert Arrested in ShinyHunters FBI Hack Probe",
    "description": "The suspect is believed to be …",   // ≤ 260 chars, plain text
    "imageUrl": "https://www.securityweek.com/wp-content/uploads/…jpg",
    "source": "SecurityWeek",
    "sourceId": "securityweek",
    "author": "Ravi Sharma",
    "publishedAt": "2026-10-12T10:32:05.000Z",          // null when the feed has none
    "url": "https://www.securityweek.com/ransomware-response-expert-…/",
    "category": "cyber-attacks",
    "categoryLabel": "Cyber Attacks",
    "categories": ["cyber-attacks", "cybercrime-scams", "government-advisories"],
    "cveIds": [],
    "tags": ["Advisory", "Exploited in the wild", "Critical", "Sponsored"], // only when supported
    "isAdvisory": false,
    "dateLabel": "Added to CISA KEV"                    // when the timestamp is not a publication date
  }],
  "featured": { /* one real article, chosen server-side */ },
  "sections": { "recent": [], "advisories": [], "widelyCovered": [], "categories": [], "sources": [], "trustedSources": [] },
  "pagination": { "page": 1, "limit": 12, "total": 24, "totalPages": 2, "hasMore": true },
  "filters": { "category": "all-news", "q": "", "source": "", "sort": "newest" },
  "lastUpdated": "2026-10-12T11:11:20.549Z",
  "meta": { "cacheAgeSeconds": 3, "stale": false, "degraded": false, "unavailable": false, "degradedSources": [], "popularityAvailable": false }
}
```

Other endpoints: `GET /api/news/sources`, `GET /api/news/categories`,
`GET /api/news/health`, `POST /api/news/refresh`. Errors use one envelope:
`{ "success": false, "error": { "code": "INVALID_PARAM" | "RATE_LIMITED" | "PROVIDER_UNAVAILABLE", "message": "…" } }`.

---

## 5. Running it

```bash
# 1. install
npm --prefix backend install
npm --prefix frontend install

# 2. configure (only the news-related values are optional)
cp backend/.env.example backend/.env      # fill in MONGO_URI / JWT_SECRET / OPENROUTER_API_KEY
cp frontend/.env.example frontend/.env    # optional

# 3. run both (root script)
npm run dev
# frontend http://localhost:5173 · backend http://localhost:5000
# news:      http://localhost:5173/news
# dashboard: http://localhost:5173/dashboard?tab=news
```

No API key is required for the news feature. Optional tuning lives in
`backend/.env.example` (`NEWS_CACHE_TTL_SECONDS`, `NEWS_MIN_REFRESH_INTERVAL_SECONDS`,
`NEWS_FETCH_TIMEOUT_MS`, `NEWS_DISABLED_SOURCES`, `NEWS_FEEDS_JSON`, …).

Verify the live provider layer (needs internet):

```bash
npm --prefix backend run news:health          # per-source health table
npm --prefix backend run news:health -- --json
```

### Offline development / demos (no internet)

```bash
# terminal 1 – serve captured sample feeds (development only)
npm --prefix backend run news:sample
# terminal 2 – point the API at them
NEWS_ALLOW_LOCAL_FEEDS=1 NEWS_SAMPLE_MODE=1 \
NEWS_FEEDS_JSON="$(node backend/scripts/sampleFeedServer.js --print-config)" \
npm run backend
```

`NEWS_SAMPLE_MODE=1` makes the UI show a visible **Sample data** chip, so sample
content can never be mistaken for the production newswire. `NEWS_ALLOW_LOCAL_FEEDS`
defaults to off, keeping the production fetcher restricted to public hosts.

---

## 6. Deployment

The default deployment is one origin: a static frontend + the Express API.

1. **Backend** (Render/Railway/Fly/VPS): start with `npm --prefix backend start`.
   Set `MONGO_URI`, `JWT_SECRET`, `PORT`, and in production also
   `CORS_ORIGINS=https://your-domain` and `TRUST_PROXY_HOPS=1`.
   Optional: `NEWS_BACKGROUND_REFRESH_MINUTES=15` to refresh even without traffic.
   The news cache warms up on boot (`NEWS_WARM_ON_START=off` disables it).
2. **Frontend**: `npm --prefix frontend run build` → serve `frontend/dist`.
   Leave `VITE_API_BASE_URL` empty and reverse-proxy `/api` to the backend
   (see the Vite dev proxy in `vite.config.js` for the dev equivalent); or set
   `VITE_API_BASE_URL=https://api.your-domain` at build time.
3. **Health**: poll `GET /api/news/health` (returns cache age, last error and
   per-source outcomes). A `status: "stale"` response still serves users.
4. **Secrets**: never commit `.env` (both `.env` files are git-ignored, and
   `backend/.env` was removed from version control as part of this change —
   rotate any key that was committed previously).
5. **Scaling**: the cache is per-process. With multiple instances, each node
   refreshes at most once per TTL; reduce QPS to publishers by raising
   `NEWS_CACHE_TTL_SECONDS`, or front the API with a shared cache.

---

## 7. Testing

```bash
npm --prefix backend test            # 48 tests: 32 unit + 16 end-to-end HTTP
npm --prefix frontend run test:render # 8 render tests against a real API payload
npm --prefix frontend run lint        # (pre-existing errors elsewhere in the app remain)
npm --prefix frontend run build
```

- **Backend unit tests** (`backend/tests/news.test.js`): feed parser (RSS,
  FeedBurner, media:content, Atom, malformed/hostile markup), sanitiser (URL and
  image validation, entities, dates), classifier, KEV adapter, de-duplication,
  query validation, filtering/sorting and featured-story selection.
- **Backend end-to-end tests** (`backend/tests/newsApi.test.js`): boots the real
  server against a local fixture feed server and exercises the API over HTTP —
  response envelope, ordering, category/search/pagination, duplicate collapse,
  advisory sidebar, invalid-parameter handling, credential leakage, rate limiting,
  a single failing source (degraded) and total provider outage.
- **Frontend render tests** (`frontend/tests/newsRender.test.mjs`): renders the
  real components with a captured `/api/news` payload — real article data, links
  with `rel="noopener noreferrer"`, missing image/description/date fallbacks,
  sidebar, keyboard-accessible categories and all empty/error/rate-limit states.

The sandbox used to build this feature has **no outbound access to publisher
hosts** (only package registries), so live provider fetching was verified with
the `fetch_page` tool (feed status, freshness, structure) and end-to-end runs use
the fixture feed server. Run `npm --prefix backend run news:health` on a machine
with internet access to confirm the live feeds.

---

## Known limitations

1. **No popularity data.** None of the sources expose view/engagement counts, so
   the "Trending" slot is implemented as *Recent Security Stories* plus
   *Covered by Multiple Outlets* (duplicate detection) — never a fabricated score.
2. **Duplicate detection is headline based.** Syndicated copies and near-identical
   headlines merge into one card (`alsoCoveredBy` lists the others). Two outlets
   describing the same incident in their own words remain two cards, by design.
3. **Feed volatility.** If a publisher changes or blocks its feed, that source is
   marked degraded (visible in the sidebar and `/api/news/sources`) while the rest
   keep working; cached articles continue to be served and the UI says they may not
   be current.
4. **Search is over the cached pool**, not a full-text index of the web: it covers
   up to ~400 recent stories (about 10 days of this newswire).
5. **KEV timestamps** are CISA's `dateAdded`, labelled as such, and KEV entries link
   to the canonical CVE record (cve.org) because the JSON catalog publishes no
   per-CVE permalink.
6. **Images** come from the publisher's own CDN; if hotlink protection blocks them,
   the branded placeholder is shown instead of a broken image.
7. **Unverified operational items.** Live publisher fetching, mobile/tablet layout
   in a real browser, and production deployment were not executed in this sandbox
   (no egress to publishers, no browser); everything else in the Testing section
   was executed and is reproducible.
