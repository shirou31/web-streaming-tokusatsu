# 02_API_SPECIFICATION

> Audience: Antigravity AI (autonomous coding agent). This file defines every REST route, parameter and JSON shape of the Tokusatsu Streaming Website backend.
> Depends on: `01_DATABASE_ARCHITECTURE.md` (table and column names referenced here are defined there).
> Companion: `03_DATA_FLOW_AND_AGENT_INSTRUCTIONS.md`.

---

## 1. Global API Standards

### 1.1 Base URL, Format, Naming

| Item | Rule |
|---|---|
| Base path | `/api/v1` (every route below is relative to it) |
| Transport | HTTPS only in production |
| Content type | Requests with a body: `Content-Type: application/json`. All responses: `application/json; charset=utf-8` (except `204`) |
| JSON key naming | `snake_case` everywhere (matches database columns, no key mapping layer needed) |
| Date format | `YYYY-MM-DD` for dates, ISO 8601 UTC with `Z` suffix for timestamps (`2026-10-16T08:30:00Z`) |
| IDs | UUID strings. Public lookups of productions use `slug`, everything else uses `id` |
| Null handling | Missing optional values are returned as `null`, never omitted |
| Enum values | Exactly the lowercase values defined in file 01 section 2.2 |
| Multi-value query params | Comma separated: `?type=movie,v_cinema` |

### 1.2 Authentication

| Item | Rule |
|---|---|
| Scheme | `Authorization: Bearer <access_token>` |
| Access token | JWT (HS256 or RS256), lifetime 15 minutes |
| JWT claims | `sub` (user id), `role`, `iat`, `exp`, `jti` |
| Refresh token | Opaque random 256-bit string, lifetime 30 days, stored as SHA-256 hash in `refresh_tokens.token_hash`, rotated on every `/auth/refresh` call (old row gets `revoked_at`) |
| Access levels | `public` = no header needed. `optional` = header accepted, adds `user_state` fields when valid. `auth` = header required, otherwise `401` |

### 1.3 Response Envelope

Success (single object or array):

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "req_01JABCDEF123456789",
    "timestamp": "2026-10-16T08:30:00Z"
  }
}
```

Success (paginated list):

```json
{
  "success": true,
  "data": [],
  "meta": {
    "request_id": "req_01JABCDEF123456789",
    "timestamp": "2026-10-16T08:30:00Z",
    "pagination": {
      "page": 1,
      "per_page": 24,
      "total_items": 134,
      "total_pages": 6,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": [
      { "field": "email", "issue": "must be a valid email address" }
    ]
  },
  "meta": {
    "request_id": "req_01JABCDEF123456789",
    "timestamp": "2026-10-16T08:30:00Z"
  }
}
```

IMPORTANT for the implementer: in all endpoint examples below, `meta.request_id` and `meta.timestamp` are omitted for brevity. The implementation MUST include them in every response. `meta.pagination` is present only where the endpoint is marked `Paginated: yes`.

### 1.4 Pagination Parameters (all paginated endpoints)

| Param | Type | Default | Constraint |
|---|---|---|---|
| `page` | integer | `1` | `>= 1` |
| `per_page` | integer | endpoint-specific (default `24`) | `1..100` |

### 1.5 HTTP Status Codes

| Status | Meaning | `error.code` |
|---|---|---|
| `200` | OK | |
| `201` | Created | |
| `204` | No Content (deletes, logout) | |
| `400` | Malformed request / invalid query param | `BAD_REQUEST`, `VALIDATION_ERROR` |
| `401` | Missing/invalid/expired token | `UNAUTHORIZED`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS` |
| `403` | Authenticated but not allowed | `FORBIDDEN` |
| `404` | Resource not found or not published | `NOT_FOUND` |
| `409` | Unique conflict | `EMAIL_TAKEN`, `USERNAME_TAKEN` |
| `422` | Semantically invalid body | `UNPROCESSABLE_ENTITY` |
| `429` | Rate limit exceeded | `RATE_LIMITED` |
| `500` | Unexpected server error | `INTERNAL_ERROR` |
| `503` | No playable source available | `NO_PLAYABLE_SOURCE` |

### 1.6 Rate Limits

| Scope | Limit | Headers returned |
|---|---|---|
| Public GET | 120 requests / minute / IP | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| `POST /auth/login`, `POST /auth/register` | 10 requests / minute / IP | same |
| `POST /user/history` | 30 requests / minute / user | same |
| `GET /stream/:episode_id` | 60 requests / minute / user-or-IP | same |

### 1.7 Shared Object Schemas

#### 1.7.1 `ProductionCard`

```json
{
  "id": "0192a3f0-1111-7000-8000-000000000001",
  "slug": "kamen-rider-geats",
  "title": "Kamen Rider Geats",
  "title_native": "仮面ライダーギーツ",
  "type": "tv_series",
  "status": "completed",
  "poster_url": "https://cdn.example.com/posters/kamen-rider-geats.jpg",
  "release_date": "2022-09-04",
  "release_year": 2022,
  "total_episodes": 46,
  "age_rating": "all",
  "franchise": { "id": "0192a3f0-aaaa-7000-8000-000000000001", "slug": "kamen-rider", "name": "Kamen Rider" },
  "era": { "id": "0192a3f0-bbbb-7000-8000-000000000001", "slug": "reiwa", "name": "Reiwa" },
  "genres": [
    { "slug": "battle-royale", "name": "Battle Royale", "kind": "theme" }
  ]
}
```

#### 1.7.2 `EpisodeCard`

```json
{
  "id": "0192a3f0-2222-7000-8000-000000000001",
  "episode_number": 16,
  "slug": "episode-16",
  "kind": "episode",
  "title": "Episode 16 Title",
  "thumbnail_url": "https://cdn.example.com/thumbs/geats-16.jpg",
  "duration_seconds": 1380,
  "air_date": "2023-01-01",
  "published_at": "2026-10-15T10:00:00Z"
}
```

#### 1.7.3 `NavPointer` (used by player navigation)

```json
{
  "episode_id": "0192a3f0-2222-7000-8000-000000000002",
  "production_id": "0192a3f0-1111-7000-8000-000000000002",
  "production_slug": "kamen-rider-geats-4-aces-and-the-black-fox",
  "production_type": "movie",
  "episode_number": 1,
  "kind": "feature",
  "title": "Kamen Rider Geats: 4 Aces and the Black Fox",
  "thumbnail_url": "https://cdn.example.com/thumbs/geats-movie.jpg",
  "reason": "watch_order_segment_boundary"
}
```

`reason` enum: `same_segment` | `watch_order_segment_boundary` | `next_tv_episode`.

---

## 2. Endpoint Index

| # | Method | URI | Access | Group |
|---|---|---|---|---|
| 1 | `GET` | `/meta/filters` | public | Discovery |
| 2 | `GET` | `/home/hero` | public | Discovery |
| 3 | `GET` | `/home/latest-episodes` | public | Discovery |
| 4 | `GET` | `/home/popular` | public | Discovery |
| 5 | `GET` | `/home/continue-watching` | auth | Discovery |
| 6 | `GET` | `/search` | public | Discovery |
| 7 | `GET` | `/catalog` | public | Catalog |
| 8 | `GET` | `/productions/:slug` | optional | Production |
| 9 | `GET` | `/watch-orders/:slug` | public | Production |
| 10 | `GET` | `/stream/:episode_id` | optional | Streaming |
| 11 | `POST` | `/stream/sources/:source_id/refresh` | optional | Streaming |
| 12 | `POST` | `/auth/register` | public | Auth |
| 13 | `POST` | `/auth/login` | public | Auth |
| 14 | `POST` | `/auth/refresh` | public | Auth |
| 15 | `POST` | `/auth/logout` | public | Auth |
| 16 | `GET` | `/user/me` | auth | User |
| 17 | `POST` | `/user/history` | auth | User |
| 18 | `GET` | `/user/history` | auth | User |
| 19 | `DELETE` | `/user/history/:episode_id` | auth | User |
| 20 | `GET` | `/user/bookmarks` | auth | User |
| 21 | `POST` | `/user/bookmarks` | auth | User |
| 22 | `DELETE` | `/user/bookmarks/:production_id` | auth | User |

---

## 3. Home and Discovery

### 3.1 `GET /meta/filters`

Returns every value needed to render filter dropdowns. Cacheable (see file 03).

- Access: public. Paginated: no. Query params: none.

Response `200`:

```json
{
  "success": true,
  "data": {
    "franchises": [
      { "id": "0192a3f0-aaaa-7000-8000-000000000001", "slug": "kamen-rider", "name": "Kamen Rider", "production_count": 82 }
    ],
    "eras": [
      { "id": "0192a3f0-bbbb-7000-8000-000000000001", "slug": "reiwa", "name": "Reiwa", "start_year": 2019, "end_year": null }
    ],
    "genres": [
      { "id": "0192a3f0-cccc-7000-8000-000000000001", "slug": "battle-royale", "name": "Battle Royale", "kind": "theme" }
    ],
    "types": ["tv_series", "movie", "v_cinema", "special", "hyper_battle_dvd", "net_movie", "crossover"],
    "statuses": ["upcoming", "ongoing", "completed", "hiatus"],
    "years": [2026, 2025, 2024, 2023, 2022],
    "sort_options": ["release_date", "title", "popularity", "updated_at"]
  }
}
```

`production_count` = count of published productions in that franchise. `years` = distinct `release_year` values of published productions, descending.

### 3.2 `GET /home/hero`

Hero banner spotlight. Source: `productions WHERE is_featured = TRUE AND is_published = TRUE ORDER BY featured_order ASC`.

- Access: public. Paginated: no.

| Query param | Type | Default | Rule |
|---|---|---|---|
| `limit` | integer | `5` | `1..10` |

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "production": {
        "id": "0192a3f0-1111-7000-8000-000000000001",
        "slug": "kamen-rider-geats",
        "title": "Kamen Rider Geats",
        "title_native": "仮面ライダーギーツ",
        "type": "tv_series",
        "tagline": "Survive the game, claim the future.",
        "synopsis": "Short synopsis text truncated to 280 characters.",
        "backdrop_url": "https://cdn.example.com/backdrops/kamen-rider-geats.jpg",
        "poster_url": "https://cdn.example.com/posters/kamen-rider-geats.jpg",
        "trailer_url": "https://cdn.example.com/trailers/kamen-rider-geats.mp4",
        "release_year": 2022,
        "age_rating": "all",
        "franchise": { "slug": "kamen-rider", "name": "Kamen Rider" },
        "era": { "slug": "reiwa", "name": "Reiwa" },
        "genres": [{ "slug": "battle-royale", "name": "Battle Royale", "kind": "theme" }]
      },
      "cta": {
        "label": "Start Watching",
        "episode_id": "0192a3f0-2222-7000-8000-000000000001",
        "watch_url": "/watch/0192a3f0-2222-7000-8000-000000000001"
      }
    }
  ]
}
```

`cta.episode_id` = the first episode in the default chronological order for that production, or episode_number 1 when no order exists.

### 3.3 `GET /home/latest-episodes`

Ongoing and latest episode releases. Source: `episodes WHERE is_published = TRUE ORDER BY published_at DESC`.

- Access: public. Paginated: yes (default `per_page = 12`).

| Query param | Type | Default | Rule |
|---|---|---|---|
| `page`, `per_page` | integer | `1`, `12` | see 1.4 |
| `franchise` | string (slug, comma list) | none | filter by `productions.franchise_id` |
| `status` | string | none | `ongoing` restricts to productions with `status = 'ongoing'` |

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "episode": {
        "id": "0192a3f0-2222-7000-8000-000000000020",
        "episode_number": 20,
        "slug": "episode-20",
        "kind": "episode",
        "title": "Episode 20 Title",
        "thumbnail_url": "https://cdn.example.com/thumbs/example-20.jpg",
        "duration_seconds": 1380,
        "air_date": "2026-10-11",
        "published_at": "2026-10-15T10:00:00Z"
      },
      "production": {
        "id": "0192a3f0-1111-7000-8000-000000000050",
        "slug": "example-ongoing-series",
        "title": "Example Ongoing Series",
        "type": "tv_series",
        "poster_url": "https://cdn.example.com/posters/example-ongoing-series.jpg",
        "franchise": { "slug": "super-sentai", "name": "Super Sentai" }
      }
    }
  ],
  "meta": {
    "pagination": { "page": 1, "per_page": 12, "total_items": 240, "total_pages": 20, "has_next": true, "has_prev": false }
  }
}
```

### 3.4 `GET /home/popular`

Popular series by franchise and era. Ranking = `productions.view_count DESC`.

- Access: public. Paginated: no.

| Query param | Type | Default | Rule |
|---|---|---|---|
| `franchise` | string (slug) | none | filter |
| `era` | string (slug) | none | filter |
| `type` | string (comma list) | `tv_series` | `production_type` values |
| `group_by` | string | `none` | `none` (flat list), `franchise` (top `limit` per franchise), `era` (top `limit` per era) |
| `limit` | integer | `12` | `1..50` (per group when grouped) |

Response `200` with `group_by=none`: `data` is an array of `ProductionCard` plus `view_count`.

Response `200` with `group_by=franchise`:

```json
{
  "success": true,
  "data": [
    {
      "group": { "type": "franchise", "slug": "kamen-rider", "name": "Kamen Rider" },
      "items": [
        {
          "id": "0192a3f0-1111-7000-8000-000000000001",
          "slug": "kamen-rider-geats",
          "title": "Kamen Rider Geats",
          "title_native": "仮面ライダーギーツ",
          "type": "tv_series",
          "status": "completed",
          "poster_url": "https://cdn.example.com/posters/kamen-rider-geats.jpg",
          "release_date": "2022-09-04",
          "release_year": 2022,
          "total_episodes": 46,
          "age_rating": "all",
          "view_count": 1250034,
          "franchise": { "id": "0192a3f0-aaaa-7000-8000-000000000001", "slug": "kamen-rider", "name": "Kamen Rider" },
          "era": { "id": "0192a3f0-bbbb-7000-8000-000000000001", "slug": "reiwa", "name": "Reiwa" },
          "genres": [{ "slug": "battle-royale", "name": "Battle Royale", "kind": "theme" }]
        }
      ]
    }
  ]
}
```

### 3.5 `GET /home/continue-watching`

Auth required. Source: `watch_history WHERE user_id = :me AND is_completed = FALSE ORDER BY last_watched_at DESC`, one row per production (most recent episode of each production).

| Query param | Type | Default | Rule |
|---|---|---|---|
| `limit` | integer | `10` | `1..30` |

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "episode": {
        "id": "0192a3f0-2222-7000-8000-000000000007",
        "episode_number": 7,
        "title": "Episode 7 Title",
        "thumbnail_url": "https://cdn.example.com/thumbs/geats-07.jpg",
        "duration_seconds": 1380
      },
      "production": {
        "id": "0192a3f0-1111-7000-8000-000000000001",
        "slug": "kamen-rider-geats",
        "title": "Kamen Rider Geats",
        "type": "tv_series",
        "poster_url": "https://cdn.example.com/posters/kamen-rider-geats.jpg"
      },
      "progress_seconds": 640,
      "percent_complete": 46.38,
      "last_watched_at": "2026-10-15T20:12:00Z"
    }
  ]
}
```

`percent_complete` = `round(progress_seconds / duration_seconds * 100, 2)`.

### 3.6 `GET /search`

Autocomplete search over `productions.title`, `title_native`, `title_romaji`, `alternative_titles`.

- Access: public. Paginated: no.

| Query param | Type | Default | Rule |
|---|---|---|---|
| `q` | string | required | min 2 characters, max 100 |
| `limit` | integer | `8` | `1..20` |

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": "0192a3f0-1111-7000-8000-000000000001",
      "slug": "kamen-rider-geats",
      "title": "Kamen Rider Geats",
      "title_native": "仮面ライダーギーツ",
      "type": "tv_series",
      "release_year": 2022,
      "poster_url": "https://cdn.example.com/posters/kamen-rider-geats.jpg",
      "franchise": { "slug": "kamen-rider", "name": "Kamen Rider" }
    }
  ]
}
```

Errors: `400 VALIDATION_ERROR` when `q` is shorter than 2 characters.

---

## 4. Catalog and Filtering

### 4.1 `GET /catalog`

Browse and filter all published productions.

- Access: public. Paginated: yes (default `per_page = 24`).

| Query param | Type | Default | Semantics |
|---|---|---|---|
| `franchise` | string (slug, comma list) | none | matches `productions.franchise_id` OR any row in `production_franchises` (so crossovers appear under secondary franchises) |
| `era` | string (slug, comma list) | none | matches `productions.era_id` |
| `type` | string (comma list) | none | `production_type` values, OR within the list |
| `year` | integer | none | exact `release_year` |
| `year_from` | integer | none | `release_year >= year_from` |
| `year_to` | integer | none | `release_year <= year_to` |
| `genre` | string (slug, comma list) | none | `production_genres` match; comma list = ANY of them |
| `status` | string | none | `production_status` value |
| `q` | string | none | title search (min 2 chars) |
| `sort` | string | `release_date` | `release_date`, `title`, `popularity`, `updated_at` |
| `order` | string | `desc` | `asc` or `desc` (for `title` the default is `asc` when `order` is not supplied) |
| `page`, `per_page` | integer | `1`, `24` | see 1.4 |

Combination rules: different params are combined with AND; multiple values inside one param are combined with OR.

Sort mapping: `release_date` -> `productions.release_date`, `title` -> `productions.title`, `popularity` -> `productions.view_count`, `updated_at` -> `productions.updated_at`. Tie-breaker is always `productions.id ASC`.

Example request: `GET /api/v1/catalog?franchise=kamen-rider&era=reiwa&type=movie&year=2023&sort=release_date&order=desc&page=1&per_page=24`

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": "0192a3f0-1111-7000-8000-000000000077",
      "slug": "example-reiwa-movie-2023",
      "title": "Example Reiwa Movie 2023",
      "title_native": null,
      "type": "movie",
      "status": "completed",
      "poster_url": "https://cdn.example.com/posters/example-reiwa-movie-2023.jpg",
      "release_date": "2023-03-17",
      "release_year": 2023,
      "total_episodes": 1,
      "age_rating": "all",
      "franchise": { "id": "0192a3f0-aaaa-7000-8000-000000000001", "slug": "kamen-rider", "name": "Kamen Rider" },
      "era": { "id": "0192a3f0-bbbb-7000-8000-000000000001", "slug": "reiwa", "name": "Reiwa" },
      "genres": [{ "slug": "time-travel", "name": "Time Travel", "kind": "theme" }]
    }
  ],
  "meta": {
    "pagination": { "page": 1, "per_page": 24, "total_items": 1, "total_pages": 1, "has_next": false, "has_prev": false },
    "applied_filters": {
      "franchise": ["kamen-rider"],
      "era": ["reiwa"],
      "type": ["movie"],
      "year": 2023,
      "year_from": null,
      "year_to": null,
      "genre": [],
      "status": null,
      "q": null,
      "sort": "release_date",
      "order": "desc"
    }
  }
}
```

Errors: `400 VALIDATION_ERROR` for unknown enum values, `per_page > 100`, or `year_from > year_to`. An unknown franchise/era/genre slug is NOT an error; it simply yields an empty result.

---

## 5. Production Detail and Watch Order

### 5.1 `GET /productions/:slug`

Everything the series page needs in one call.

- Access: optional (adds `user_state`). Paginated: no.
- Path param: `slug` (string). Returns `404 NOT_FOUND` if the production does not exist or `is_published = FALSE`.

| Query param | Type | Default | Rule |
|---|---|---|---|
| `watch_order` | string (watch order slug) | default chronological order for this production | selects which watch order is embedded |

Response `200`:

```json
{
  "success": true,
  "data": {
    "production": {
      "id": "0192a3f0-1111-7000-8000-000000000001",
      "slug": "kamen-rider-geats",
      "title": "Kamen Rider Geats",
      "title_native": "仮面ライダーギーツ",
      "title_romaji": "Kamen Raidā Gītsu",
      "alternative_titles": ["Geats"],
      "type": "tv_series",
      "status": "completed",
      "synopsis": "Full synopsis text.",
      "tagline": "Survive the game, claim the future.",
      "poster_url": "https://cdn.example.com/posters/kamen-rider-geats.jpg",
      "backdrop_url": "https://cdn.example.com/backdrops/kamen-rider-geats.jpg",
      "trailer_url": "https://cdn.example.com/trailers/kamen-rider-geats.mp4",
      "release_date": "2022-09-04",
      "end_date": "2023-08-27",
      "release_year": 2022,
      "total_episodes": 46,
      "runtime_minutes": 24,
      "age_rating": "all",
      "view_count": 1250034,
      "parent_production": null,
      "franchise": { "id": "0192a3f0-aaaa-7000-8000-000000000001", "slug": "kamen-rider", "name": "Kamen Rider" },
      "additional_franchises": [],
      "era": { "id": "0192a3f0-bbbb-7000-8000-000000000001", "slug": "reiwa", "name": "Reiwa" },
      "genres": [{ "slug": "battle-royale", "name": "Battle Royale", "kind": "theme" }],
      "seo": {
        "meta_title": "Watch Kamen Rider Geats Online - All Episodes",
        "meta_description": "Stream Kamen Rider Geats with subtitles in chronological order.",
        "canonical_url": "https://example.com/series/kamen-rider-geats"
      }
    },
    "episodes": [
      {
        "id": "0192a3f0-2222-7000-8000-000000000001",
        "episode_number": 1,
        "episode_label": null,
        "slug": "episode-1",
        "kind": "episode",
        "title": "Episode 1 Title",
        "thumbnail_url": "https://cdn.example.com/thumbs/geats-01.jpg",
        "duration_seconds": 1380,
        "air_date": "2022-09-04",
        "has_subtitles": ["id", "en"],
        "user_progress": { "progress_seconds": 1380, "is_completed": true }
      }
    ],
    "related_productions": [
      {
        "relation": "movie",
        "production": {
          "id": "0192a3f0-1111-7000-8000-000000000002",
          "slug": "kamen-rider-geats-4-aces-and-the-black-fox",
          "title": "Kamen Rider Geats: 4 Aces and the Black Fox",
          "type": "movie",
          "poster_url": "https://cdn.example.com/posters/geats-movie.jpg",
          "release_year": 2022,
          "playable_episode_id": "0192a3f0-2222-7000-8000-000000000101"
        }
      }
    ],
    "watch_order": {
      "id": "0192a3f0-3333-7000-8000-000000000001",
      "slug": "kamen-rider-geats-chronological",
      "name": "Kamen Rider Geats - Chronological Order",
      "order_type": "chronological",
      "is_default": true,
      "items": [
        {
          "position": 1,
          "production": { "id": "0192a3f0-1111-7000-8000-000000000001", "slug": "kamen-rider-geats", "title": "Kamen Rider Geats", "type": "tv_series" },
          "start_episode": { "id": "0192a3f0-2222-7000-8000-000000000001", "episode_number": 1 },
          "end_episode": { "id": "0192a3f0-2222-7000-8000-000000000015", "episode_number": 15 },
          "episode_count": 15,
          "note": null,
          "is_optional": false
        },
        {
          "position": 2,
          "production": { "id": "0192a3f0-1111-7000-8000-000000000002", "slug": "kamen-rider-geats-4-aces-and-the-black-fox", "title": "Kamen Rider Geats: 4 Aces and the Black Fox", "type": "movie" },
          "start_episode": { "id": "0192a3f0-2222-7000-8000-000000000101", "episode_number": 1 },
          "end_episode": { "id": "0192a3f0-2222-7000-8000-000000000101", "episode_number": 1 },
          "episode_count": 1,
          "note": "Watch after episode 15.",
          "is_optional": false
        },
        {
          "position": 3,
          "production": { "id": "0192a3f0-1111-7000-8000-000000000001", "slug": "kamen-rider-geats", "title": "Kamen Rider Geats", "type": "tv_series" },
          "start_episode": { "id": "0192a3f0-2222-7000-8000-000000000016", "episode_number": 16 },
          "end_episode": { "id": "0192a3f0-2222-7000-8000-000000000046", "episode_number": 46 },
          "episode_count": 31,
          "note": "Continue the TV series.",
          "is_optional": false
        }
      ]
    },
    "available_watch_orders": [
      { "slug": "kamen-rider-geats-chronological", "name": "Kamen Rider Geats - Chronological Order", "order_type": "chronological" }
    ],
    "user_state": {
      "bookmark_status": "watching",
      "resume_episode_id": "0192a3f0-2222-7000-8000-000000000007",
      "resume_progress_seconds": 640
    }
  }
}
```

Field rules:

| Field | Rule |
|---|---|
| `episodes` | All published episodes of THIS production ordered by `episode_number ASC`. Not paginated |
| `episodes[].has_subtitles` | Array of distinct `subtitle_tracks.language_code` with `is_active = TRUE` |
| `episodes[].user_progress` | `null` when unauthenticated or no history row |
| `related_productions` | Union of: children (`parent_production_id = this.id`), the parent when this is a child, productions linked through any shared watch order, and crossovers that list this production's franchise in `production_franchises`. `relation` enum: `movie`, `v_cinema`, `special`, `hyper_battle_dvd`, `net_movie`, `crossover`, `parent_series`. Excluded when not published. `playable_episode_id` = the production's first published episode |
| `watch_order` | `null` when no published watch order contains this production. Items follow file 01 section 6.3 selection rules. Items whose production or boundary episodes are unpublished are dropped |
| `user_state` | `null` when unauthenticated. `bookmark_status` is `null` if not bookmarked. `resume_*` are `null` if no incomplete history |

### 5.2 `GET /watch-orders/:slug`

Standalone watch order (for cross-franchise orders or a dedicated "Watch Order" page).

- Access: public. Paginated: no. Returns `404 NOT_FOUND` if unpublished or unknown.

Response `200`:

```json
{
  "success": true,
  "data": {
    "id": "0192a3f0-3333-7000-8000-000000000001",
    "slug": "kamen-rider-geats-chronological",
    "name": "Kamen Rider Geats - Chronological Order",
    "description": "Recommended order mixing the TV series with the movie.",
    "order_type": "chronological",
    "is_default": true,
    "franchise": { "slug": "kamen-rider", "name": "Kamen Rider" },
    "anchor_production": { "id": "0192a3f0-1111-7000-8000-000000000001", "slug": "kamen-rider-geats", "title": "Kamen Rider Geats" },
    "total_episodes": 47,
    "items": [
      {
        "position": 1,
        "production": { "id": "0192a3f0-1111-7000-8000-000000000001", "slug": "kamen-rider-geats", "title": "Kamen Rider Geats", "type": "tv_series", "poster_url": "https://cdn.example.com/posters/kamen-rider-geats.jpg" },
        "start_episode": { "id": "0192a3f0-2222-7000-8000-000000000001", "episode_number": 1 },
        "end_episode": { "id": "0192a3f0-2222-7000-8000-000000000015", "episode_number": 15 },
        "episode_count": 15,
        "note": null,
        "is_optional": false
      }
    ]
  }
}
```

`total_episodes` = sum of `episode_count` over `items`. `anchor_production` and `franchise` are `null` for cross-franchise orders.

---

## 6. Streaming and Player

### 6.1 `GET /stream/:episode_id`

Everything the player needs for one playable item.

- Access: optional (adds `resume`). Paginated: no.
- Path param: `episode_id` (UUID). `404 NOT_FOUND` if the episode or its production is unpublished. `503 NO_PLAYABLE_SOURCE` if the episode has zero active video sources.

| Query param | Type | Default | Rule |
|---|---|---|---|
| `watch_order` | string (slug) | auto-selected per file 01 section 6.3 | forces a watch order for `next_episode_chronological` |

Response `200`:

```json
{
  "success": true,
  "data": {
    "episode": {
      "id": "0192a3f0-2222-7000-8000-000000000001",
      "episode_number": 1,
      "slug": "episode-1",
      "kind": "episode",
      "title": "Episode 1 Title",
      "synopsis": "Episode synopsis.",
      "thumbnail_url": "https://cdn.example.com/thumbs/geats-01.jpg",
      "duration_seconds": 1380,
      "air_date": "2022-09-04",
      "skip_markers": {
        "intro_start_seconds": 90,
        "intro_end_seconds": 180,
        "outro_start_seconds": 1290
      }
    },
    "production": {
      "id": "0192a3f0-1111-7000-8000-000000000001",
      "slug": "kamen-rider-geats",
      "title": "Kamen Rider Geats",
      "type": "tv_series",
      "poster_url": "https://cdn.example.com/posters/kamen-rider-geats.jpg",
      "franchise": { "slug": "kamen-rider", "name": "Kamen Rider" }
    },
    "video_sources": {
      "default_source_id": "0192a3f0-4444-7000-8000-000000000003",
      "servers": [
        {
          "server_name": "Server 1",
          "sources": [
            {
              "id": "0192a3f0-4444-7000-8000-000000000001",
              "quality": "360p",
              "source_type": "hls",
              "mime_type": "application/vnd.apple.mpegurl",
              "url": "https://stream.example.com/hls/0192a3f0/360p/index.m3u8?token=eyJhbGciOi...&expires=1792140000",
              "expires_at": "2026-10-16T09:30:00Z",
              "audio_language": "ja",
              "has_hardsub": false,
              "hardsub_language": null
            },
            {
              "id": "0192a3f0-4444-7000-8000-000000000003",
              "quality": "1080p",
              "source_type": "hls",
              "mime_type": "application/vnd.apple.mpegurl",
              "url": "https://stream.example.com/hls/0192a3f0/1080p/index.m3u8?token=eyJhbGciOi...&expires=1792140000",
              "expires_at": "2026-10-16T09:30:00Z",
              "audio_language": "ja",
              "has_hardsub": false,
              "hardsub_language": null
            }
          ]
        },
        {
          "server_name": "Mirror A",
          "sources": [
            {
              "id": "0192a3f0-4444-7000-8000-000000000010",
              "quality": "720p",
              "source_type": "iframe",
              "mime_type": null,
              "url": "https://embed.example.net/e/abc123",
              "expires_at": null,
              "audio_language": "ja",
              "has_hardsub": true,
              "hardsub_language": "en"
            }
          ]
        }
      ],
      "available_qualities": ["360p", "720p", "1080p"]
    },
    "subtitle_tracks": [
      {
        "id": "0192a3f0-5555-7000-8000-000000000001",
        "language_code": "id",
        "label": "Indonesia",
        "format": "vtt",
        "url": "https://cdn.example.com/subs/0192a3f0/id.vtt",
        "is_default": true,
        "is_forced": false,
        "translator_credit": null
      },
      {
        "id": "0192a3f0-5555-7000-8000-000000000002",
        "language_code": "en",
        "label": "English",
        "format": "vtt",
        "url": "https://cdn.example.com/subs/0192a3f0/en.vtt",
        "is_default": false,
        "is_forced": false,
        "translator_credit": null
      }
    ],
    "navigation": {
      "watch_order_slug": "kamen-rider-geats-chronological",
      "previous_episode": null,
      "next_episode_chronological": {
        "episode_id": "0192a3f0-2222-7000-8000-000000000002",
        "production_id": "0192a3f0-1111-7000-8000-000000000001",
        "production_slug": "kamen-rider-geats",
        "production_type": "tv_series",
        "episode_number": 2,
        "kind": "episode",
        "title": "Episode 2 Title",
        "thumbnail_url": "https://cdn.example.com/thumbs/geats-02.jpg",
        "reason": "same_segment"
      },
      "next_episode_tv_only": {
        "episode_id": "0192a3f0-2222-7000-8000-000000000002",
        "production_id": "0192a3f0-1111-7000-8000-000000000001",
        "production_slug": "kamen-rider-geats",
        "production_type": "tv_series",
        "episode_number": 2,
        "kind": "episode",
        "title": "Episode 2 Title",
        "thumbnail_url": "https://cdn.example.com/thumbs/geats-02.jpg",
        "reason": "next_tv_episode"
      }
    },
    "resume": {
      "progress_seconds": 640,
      "duration_seconds": 1380,
      "is_completed": false,
      "last_watched_at": "2026-10-15T20:12:00Z"
    }
  }
}
```

Field rules:

| Field | Rule |
|---|---|
| `video_sources.servers` | Active sources only, grouped by `server_name`. Servers ordered by the minimum `priority` of their sources ASC. Inside a server, sources ordered by quality ascending (`360p` -> `2160p`, `auto` last) |
| `video_sources.default_source_id` | The active source with the best match: user's `preferred_quality` if authenticated and available, otherwise the highest non-`auto` quality of the lowest-priority server; if only `auto` exists, that one |
| `video_sources.available_qualities` | Distinct qualities across all active sources, ascending |
| `sources[].url` | For `is_protected = TRUE`: signed/tokenised URL (never `origin_url`), valid for 60 minutes (rules in file 03). For `iframe`: the embed URL as stored |
| `sources[].expires_at` | ISO timestamp for signed URLs, `null` for iframe |
| `subtitle_tracks` | Active tracks ordered with `is_default DESC`, then by user's `preferred_subtitle` match, then `language_code ASC` |
| `navigation.previous_episode` | Previous episode in the selected watch order (mirror of the next-resolution logic); `null` at the start or when no order exists. Shape = `NavPointer` |
| `navigation.next_episode_chronological` | Resolved with file 01 section 6.4. `null` at the end of the order or when no order contains the episode. Shape = `NavPointer` |
| `navigation.next_episode_tv_only` | Resolved with file 01 section 6.5. `null` for non-`tv_series` productions or the last TV episode. Shape = `NavPointer` |
| `navigation.watch_order_slug` | Slug of the order used, `null` when none |
| `resume` | `null` when unauthenticated or no history row |

Errors: `404 NOT_FOUND`, `503 NO_PLAYABLE_SOURCE`, `429 RATE_LIMITED`.

### 6.2 `POST /stream/sources/:source_id/refresh`

Re-issues a fresh signed URL when the previous one expired mid-session or a server failed.

- Access: optional. Request body: none. Returns `404 NOT_FOUND` if the source is inactive or its episode is unpublished.
- Not valid for `iframe` sources (`400 BAD_REQUEST`).

Response `200`:

```json
{
  "success": true,
  "data": {
    "id": "0192a3f0-4444-7000-8000-000000000003",
    "url": "https://stream.example.com/hls/0192a3f0/1080p/index.m3u8?token=eyJhbGciOi...&expires=1792143600",
    "expires_at": "2026-10-16T10:30:00Z"
  }
}
```

---

## 7. Authentication

### 7.1 `POST /auth/register`

Request body:

```json
{
  "email": "fan@example.com",
  "username": "rider_fan",
  "password": "S3cure-Passw0rd!",
  "display_name": "Rider Fan"
}
```

| Field | Rule |
|---|---|
| `email` | required, valid email, max 254 chars, unique (case-insensitive) |
| `username` | required, `^[A-Za-z0-9_]{3,30}$`, unique (case-insensitive) |
| `password` | required, 8..72 characters |
| `display_name` | required, 1..100 characters |

Response `201`:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "0192a3f0-9999-7000-8000-000000000001",
      "email": "fan@example.com",
      "username": "rider_fan",
      "display_name": "Rider Fan",
      "avatar_url": null,
      "role": "user",
      "preferred_subtitle": "id",
      "preferred_quality": "auto",
      "created_at": "2026-10-16T08:30:00Z"
    },
    "tokens": {
      "token_type": "Bearer",
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "9f2c4d7e1b8a...",
      "expires_in": 900
    }
  }
}
```

Errors: `400 VALIDATION_ERROR`, `409 EMAIL_TAKEN`, `409 USERNAME_TAKEN`, `429 RATE_LIMITED`.

### 7.2 `POST /auth/login`

Request body:

```json
{
  "email": "fan@example.com",
  "password": "S3cure-Passw0rd!"
}
```

Response `200`: same shape as `/auth/register` response `data` (`user` + `tokens`). Side effects: update `users.last_login_at`, insert a `refresh_tokens` row.

Errors: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS` (identical message for unknown email and wrong password), `403 FORBIDDEN` when `is_active = FALSE`, `429 RATE_LIMITED`.

### 7.3 `POST /auth/refresh`

Request body:

```json
{ "refresh_token": "9f2c4d7e1b8a..." }
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "tokens": {
      "token_type": "Bearer",
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "a81be3c5d0f2...",
      "expires_in": 900
    }
  }
}
```

Behaviour: lookup by SHA-256 hash; reject if missing, expired or `revoked_at IS NOT NULL` (`401 UNAUTHORIZED`). On success revoke the old row and insert a new one (rotation). If a REVOKED token is presented again, revoke ALL active refresh tokens of that user (reuse detection).

### 7.4 `POST /auth/logout`

Request body: `{ "refresh_token": "a81be3c5d0f2..." }`. Sets `revoked_at = NOW()` on the matching row. Response `204` (also `204` if the token is unknown, to avoid leaking validity).

### 7.5 `GET /user/me`

- Access: auth.

Response `200`:

```json
{
  "success": true,
  "data": {
    "id": "0192a3f0-9999-7000-8000-000000000001",
    "email": "fan@example.com",
    "username": "rider_fan",
    "display_name": "Rider Fan",
    "avatar_url": null,
    "role": "user",
    "preferred_subtitle": "id",
    "preferred_quality": "auto",
    "email_verified_at": null,
    "created_at": "2026-10-16T08:30:00Z"
  }
}
```

---

## 8. User Sync: History and Bookmarks

### 8.1 `POST /user/history`

Autosave of the player position. The frontend calls it every **15 seconds** while playing, plus on `pause`, on `ended`, on `visibilitychange` to hidden, and on `beforeunload` (via `navigator.sendBeacon` with `Content-Type: application/json` and the access token in the `token` query-less JSON field is NOT allowed: use `fetch` with `keepalive: true` and the Authorization header).

- Access: auth. Rate limit: 30 / minute / user.

Request body:

```json
{
  "episode_id": "0192a3f0-2222-7000-8000-000000000001",
  "progress_seconds": 655,
  "duration_seconds": 1380,
  "is_completed": false
}
```

| Field | Rule |
|---|---|
| `episode_id` | required, UUID of a published episode |
| `progress_seconds` | required, integer `0..duration_seconds` |
| `duration_seconds` | required, integer `> 0` |
| `is_completed` | optional boolean. The server ALSO sets it to `TRUE` when `progress_seconds / duration_seconds >= 0.92` |

Behaviour: resolve `production_id` from the episode, run the UPSERT in file 01 section 7. Once a row is `is_completed = TRUE` it stays completed. Responses never error on a repeated or out-of-order write; the newest request wins.

Response `200`:

```json
{
  "success": true,
  "data": {
    "episode_id": "0192a3f0-2222-7000-8000-000000000001",
    "production_id": "0192a3f0-1111-7000-8000-000000000001",
    "progress_seconds": 655,
    "duration_seconds": 1380,
    "is_completed": false,
    "last_watched_at": "2026-10-16T08:35:15Z"
  }
}
```

Errors: `400 VALIDATION_ERROR` (e.g. `progress_seconds > duration_seconds`), `401 UNAUTHORIZED`, `404 NOT_FOUND`, `429 RATE_LIMITED`.

### 8.2 `GET /user/history`

- Access: auth. Paginated: yes (default `per_page = 24`).

| Query param | Type | Default | Rule |
|---|---|---|---|
| `production_id` | UUID | none | restrict to one production |
| `completed` | boolean | none | filter by `is_completed` |

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "episode": {
        "id": "0192a3f0-2222-7000-8000-000000000001",
        "episode_number": 1,
        "title": "Episode 1 Title",
        "thumbnail_url": "https://cdn.example.com/thumbs/geats-01.jpg",
        "duration_seconds": 1380
      },
      "production": {
        "id": "0192a3f0-1111-7000-8000-000000000001",
        "slug": "kamen-rider-geats",
        "title": "Kamen Rider Geats",
        "type": "tv_series",
        "poster_url": "https://cdn.example.com/posters/kamen-rider-geats.jpg"
      },
      "progress_seconds": 655,
      "duration_seconds": 1380,
      "percent_complete": 47.46,
      "is_completed": false,
      "last_watched_at": "2026-10-16T08:35:15Z"
    }
  ],
  "meta": {
    "pagination": { "page": 1, "per_page": 24, "total_items": 1, "total_pages": 1, "has_next": false, "has_prev": false }
  }
}
```

### 8.3 `DELETE /user/history/:episode_id`

Removes one history row. Response `204`. `404 NOT_FOUND` if the user has no row for the episode.

### 8.4 `GET /user/bookmarks`

- Access: auth. Paginated: yes (default `per_page = 24`).

| Query param | Type | Default | Rule |
|---|---|---|---|
| `status` | string | none | `plan_to_watch`, `watching`, `completed`, `dropped` |
| `sort` | string | `updated_at` | `updated_at`, `created_at`, `title` |
| `order` | string | `desc` | `asc` or `desc` |

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "status": "watching",
      "created_at": "2026-10-10T12:00:00Z",
      "updated_at": "2026-10-15T20:12:00Z",
      "production": {
        "id": "0192a3f0-1111-7000-8000-000000000001",
        "slug": "kamen-rider-geats",
        "title": "Kamen Rider Geats",
        "title_native": "仮面ライダーギーツ",
        "type": "tv_series",
        "status": "completed",
        "poster_url": "https://cdn.example.com/posters/kamen-rider-geats.jpg",
        "release_date": "2022-09-04",
        "release_year": 2022,
        "total_episodes": 46,
        "age_rating": "all",
        "franchise": { "id": "0192a3f0-aaaa-7000-8000-000000000001", "slug": "kamen-rider", "name": "Kamen Rider" },
        "era": { "id": "0192a3f0-bbbb-7000-8000-000000000001", "slug": "reiwa", "name": "Reiwa" },
        "genres": [{ "slug": "battle-royale", "name": "Battle Royale", "kind": "theme" }]
      }
    }
  ],
  "meta": {
    "pagination": { "page": 1, "per_page": 24, "total_items": 1, "total_pages": 1, "has_next": false, "has_prev": false }
  }
}
```

### 8.5 `POST /user/bookmarks`

Upsert (create or change status). Idempotent.

Request body:

```json
{
  "production_id": "0192a3f0-1111-7000-8000-000000000001",
  "status": "plan_to_watch"
}
```

| Field | Rule |
|---|---|
| `production_id` | required, UUID of a published production |
| `status` | optional, `bookmark_status` enum, default `plan_to_watch` |

Response `201` when a new row was created, `200` when an existing row was updated; body:

```json
{
  "success": true,
  "data": {
    "production_id": "0192a3f0-1111-7000-8000-000000000001",
    "status": "plan_to_watch",
    "created_at": "2026-10-16T08:40:00Z",
    "updated_at": "2026-10-16T08:40:00Z"
  }
}
```

Errors: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `404 NOT_FOUND`.

### 8.6 `DELETE /user/bookmarks/:production_id`

Removes the bookmark. Response `204`. `404 NOT_FOUND` if no bookmark exists.

---

## 9. Endpoint to Data Source Mapping (for implementers)

| Endpoint | Tables read | Tables written |
|---|---|---|
| `/meta/filters` | `franchises`, `eras`, `genres`, `productions` | none |
| `/home/hero` | `productions`, `franchises`, `eras`, `genres`, `production_genres`, `episodes`, `watch_orders`, `watch_order_items` | none |
| `/home/latest-episodes` | `episodes`, `productions`, `franchises` | none |
| `/home/popular` | `productions`, `franchises`, `eras`, `genres`, `production_genres` | none |
| `/home/continue-watching` | `watch_history`, `episodes`, `productions` | none |
| `/search` | `productions`, `franchises` | none |
| `/catalog` | `productions`, `franchises`, `production_franchises`, `eras`, `genres`, `production_genres` | none |
| `/productions/:slug` | `productions`, `episodes`, `subtitle_tracks`, `watch_orders`, `watch_order_items`, `production_franchises`, `watch_history`, `bookmarks` | none |
| `/watch-orders/:slug` | `watch_orders`, `watch_order_items`, `productions`, `episodes` | none |
| `/stream/:episode_id` | `episodes`, `productions`, `video_sources`, `subtitle_tracks`, `watch_orders`, `watch_order_items`, `watch_history`, `users` | none (view-count increments are handled asynchronously, see file 03) |
| `/stream/sources/:source_id/refresh` | `video_sources` | none |
| `/auth/*` | `users`, `refresh_tokens` | `users`, `refresh_tokens` |
| `/user/history` | `watch_history`, `episodes`, `productions` | `watch_history` |
| `/user/bookmarks` | `bookmarks`, `productions` | `bookmarks` |
