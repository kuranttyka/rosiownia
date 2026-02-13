# Rosiownia — World Integrations Spec

Reference: https://jhey.dev (uses Astro Server Islands for live data)

## Architecture

Use **Astro Server Islands** — static page shell with dynamic islands that fetch live data on page load. Each integration is a server component that fetches from its respective API.

Alternative: API routes (`/api/spotify`, `/api/steam`) called from React client components.

Server Islands are cleaner for SEO and progressive enhancement.

## 🎵 Spotify — Currently/Recently Played

**API:** Spotify Web API
**Auth:** OAuth 2.0 with refresh token (one-time setup)
**Endpoint:** `GET /v1/me/player/recently-played?limit=5`

### Setup
1. Create Spotify app at https://developer.spotify.com/dashboard
2. Get `client_id`, `client_secret`
3. One-time OAuth flow to get `refresh_token` (scope: `user-read-recently-played user-read-currently-playing`)
4. Store `refresh_token` as env var in Vercel
5. Server component exchanges refresh token → access token → fetches data

### Display
- Show album art, track name, artist
- If currently playing: animated "now playing" indicator
- If not: show last 3-5 tracks

### Complexity: Medium
- OAuth refresh flow needed
- Rate limit: ~180 req/30min (fine for Server Islands with caching)

---

## 🎮 Steam — Recently Played Games

**API:** Steam Web API (public)
**Auth:** API key (free, from https://steamcommunity.com/dev/apikey)
**Endpoint:** `GET /IPlayerService/GetRecentlyPlayedGames/v0001/?key={KEY}&steamid={ID}&count=3`

### Setup
1. Get Steam API key
2. Get Rosia's Steam ID (64-bit)
3. Fetch recently played games (returns appid, name, playtime_2weeks, playtime_forever)
4. Game images: `https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg`

### Display
- Game cover art, name, hours played recently
- Could also show owned games count from `GetOwnedGames`

### Complexity: Low
- Simple API key auth, no OAuth needed
- Public data (if profile is public)

---

## 🍎 Apple Game Center — Recently Played

**API:** None (no public API)
**Workaround options:**
1. **Manual curation** — Rosia updates a JSON file with current games
2. **Shortcuts automation** — iOS Shortcut that posts game data to a webhook
3. **Screen Time API** — only available in native apps, not web

### Recommendation
For now, use a `games.json` file in the repo or a simple CMS/KV store. Can automate later with iOS Shortcuts → Vercel KV/webhook.

### Complexity: High (automation) / Low (manual)

---

## 📺 Anime — Watch History

**Option A: AniList** (if she uses it)
- **API:** GraphQL at https://graphql.anilist.co
- **Auth:** None for public profiles
- **Query:** User's anime list, sorted by last updated
- Great cover art, ratings, progress
- **Complexity: Low**

**Option B: MyAnimeList**
- **API:** REST, needs OAuth
- Similar data to AniList
- **Complexity: Medium**

**Option C: Manual / Ukrainian sites**
- No API likely available
- Same as Game Center: curated JSON or manual updates
- Could scrape if site is known, but fragile

### Recommendation
Ask Rosia to create an AniList account and sync her list there. AniList is free, has a great API, and is popular in the anime community. Then we get:
- Currently watching (with episode progress)
- Recently completed
- Cover art, scores, etc.

---

## 🌤️ Weather (bonus)

**API:** WeatherAPI.com (free tier, what jhey uses)
**Auth:** API key
**Setup:** Trivial — one API call with location
**Complexity: Very Low**

---

## Implementation Order (suggested)

1. **Steam** — easiest, most visual impact (game covers)
2. **Spotify** — medium effort, very cool
3. **AniList** — depends on Rosia creating an account
4. **Weather** — trivial, nice touch
5. **Game Center** — manual for now, automate later

## Tech Stack

- Astro Server Islands or API routes
- Vercel KV or env vars for tokens
- Cache responses (5-10 min TTL) to stay within rate limits
- Fallback: show placeholder if API is down
