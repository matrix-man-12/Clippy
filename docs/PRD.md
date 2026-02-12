# Clippy — Product Requirements Document

> **Version:** 1.0 (MVP)
> **Last Updated:** 2026-02-12
> **Status:** Draft

---

## 1. Overview

**Clippy** is a persistent cross-device clipboard vault that lets users save, access, and share text, rich text, JSON, and images across all their devices instantly.

### 1.1 Problem Statement

Copying content on one device and needing it on another is a common friction point. Native clipboard solutions are volatile (content is lost on next copy), device-locked, and offer no history, search, or sharing capabilities.

### 1.2 Vision

A calm, reliable clipboard tool that feels like a personal vault — always accessible, instantly synced, and optionally shareable with trusted people.

### 1.3 Target Users

- Developers transferring snippets between machines
- Content creators moving text/images across phone and desktop
- Small teams sharing links, credentials, and text fragments

---

## 2. Goals & Success Criteria

| Goal | Metric |
| ---- | ------ |
| Cross-device sync | Paste on phone → copy on desktop within 2 seconds |
| Persistent storage | Items stored reliably with optional auto-expiry |
| Small-group sharing | Shared collections work for 2–10 users |
| QR bridge | Text transferable via QR scan without login on receiver |
| UI quality | Calm cream-themed aesthetic — not generic SaaS |

### 2.1 MVP Success Condition

If all five criteria above work reliably end-to-end, the MVP is validated.

---

## 3. Tech Stack

| Layer | Technology | Rationale |
| ----- | ---------- | --------- |
| Frontend | React + Vite | Fast dev iteration, lightweight bundling, no SSR needed |
| Backend | Node.js + Express | Thin API layer, fast to build |
| Database | PostgreSQL | Relational structure, JSON support, strong indexing |
| Auth | Clerk | Managed auth — sessions, tokens, user management |
| Object Storage | S3-compatible | Keeps images out of the DB, scalable |
| Language | JavaScript (ES Modules) | Simplicity, single language across stack |

---

## 4. System Architecture

```
┌──────────────┐       HTTPS       ┌──────────────┐
│              │  ◄──────────────► │              │
│  React App   │                   │  Express API │
│  (Vite)      │                   │  (Node.js)   │
│              │                   │              │
└──────────────┘                   └──────┬───────┘
                                          │
                         ┌────────────────┼────────────────┐
                         │                │                │
                    ┌────▼────┐    ┌──────▼──────┐   ┌────▼────┐
                    │  Clerk  │    │ PostgreSQL  │   │   S3    │
                    │  Auth   │    │  Database   │   │ Storage │
                    └─────────┘    └─────────────┘   └─────────┘
```

### 4.1 Frontend Responsibilities

- Clerk SDK integration (login, session management)
- Clipboard capture & paste detection UI
- Timeline display with cards
- QR code generation
- Sharing interface for collections
- Drag-and-drop image upload

### 4.2 Backend Responsibilities

- Clerk token verification (all routes protected)
- CRUD operations for clipboard items
- Sharing & collection permission management
- Image upload orchestration to S3
- Scheduled expiry cleanup worker
- Keep the backend **thin** — avoid business logic duplication

---

## 5. Database Schema

### 5.1 `users`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID (PK) | Internal identifier |
| `clerk_id` | VARCHAR | External auth mapping (unique) |
| `email` | VARCHAR | From Clerk profile |
| `created_at` | TIMESTAMP | Auto-set |

### 5.2 `clipboard_items`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID (PK) | |
| `owner_id` | UUID (FK → users) | |
| `content_type` | ENUM | `text`, `rich_text`, `json`, `image` |
| `content_text` | TEXT | Nullable — for text/rich_text/json |
| `content_blob_url` | VARCHAR | Nullable — S3 URL for images |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `expiry_at` | TIMESTAMP | Nullable — null means no expiry |
| `is_favorite` | BOOLEAN | Default `false` |

**Indexes:**
- `(owner_id, created_at DESC)` — timeline queries
- `(expiry_at)` — cleanup worker
- `(content_type)` — filter queries

### 5.3 `shared_collections`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | UUID (PK) | |
| `name` | VARCHAR | Collection display name |
| `owner_id` | UUID (FK → users) | Creator |
| `created_at` | TIMESTAMP | |

### 5.4 `collection_members`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `collection_id` | UUID (FK) | |
| `user_id` | UUID (FK) | |
| `permission_level` | ENUM | `view`, `upload` |

**Primary Key:** `(collection_id, user_id)`

### 5.5 `collection_items`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `collection_id` | UUID (FK) | |
| `item_id` | UUID (FK) | |

**Primary Key:** `(collection_id, item_id)`

---

## 6. API Specification

All endpoints require a valid Clerk session token in the `Authorization` header. The backend verifies the token and maps `clerk_id` → internal `user_id`.

### 6.1 Clipboard Items

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/items` | Create item (text, JSON, rich text, or image upload) |
| `GET` | `/api/items` | Fetch items with pagination, filters (date, type, favorites) |
| `GET` | `/api/items/:id` | Get single item |
| `PUT` | `/api/items/:id` | Update text, expiry, or favorite status |
| `DELETE` | `/api/items/:id` | Soft-delete item |

#### `POST /api/items` — Request Body

```json
{
  "content_type": "text",
  "content_text": "Hello from phone",
  "expiry_at": "2026-02-15T00:00:00Z"
}
```

#### `GET /api/items` — Query Parameters

| Param | Type | Description |
| ----- | ---- | ----------- |
| `page` | int | Page number (default 1) |
| `limit` | int | Items per page (default 20, max 100) |
| `type` | string | Filter by content_type |
| `favorites` | boolean | Filter favorites only |
| `from` | ISO date | Created after this date |
| `to` | ISO date | Created before this date |

### 6.2 Shared Collections

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/collections` | Create a shared collection |
| `GET` | `/api/collections` | List user's collections (owned + member) |
| `POST` | `/api/collections/:id/members` | Invite a member (by email) |
| `DELETE` | `/api/collections/:id/members/:userId` | Remove a member |
| `POST` | `/api/collections/:id/items` | Add an item to a collection |
| `GET` | `/api/collections/:id/items` | Fetch items in a collection |

### 6.3 QR Code

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/qr/generate` | Generate a QR code encoding a temporary content URL |
| `GET` | `/api/qr/:token` | Retrieve content via temporary token (public, no auth) |

**Constraints:**
- Text size limit: 2 KB per QR payload
- Token expires in 10 minutes

---

## 7. Expiry Mechanism

A background worker runs on a cron schedule (every 10 minutes):

1. Query `clipboard_items WHERE expiry_at <= NOW() AND deleted_at IS NULL`
2. For each expired item:
   - If `content_blob_url` is set → delete the object from S3
   - Soft-delete the row (`deleted_at = NOW()`)
3. Permanently purge soft-deleted items older than 24 hours (safety buffer)

---

## 8. Frontend UX

### 8.1 Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Sidebar              │  Main Content           │
│                       │                         │
│  📋 Personal Vault    │  ┌─── Paste Box ──────┐ │
│  👥 Shared Vaults     │  │ Paste / drag here   │ │
│  ⭐ Favorites         │  │ [Expiry ▾]  [Save]  │ │
│  ⚙️ Settings          │  └─────────────────────┘ │
│                       │                         │
│                       │  ┌─── Timeline Card ──┐ │
│                       │  │ Preview snippet     │ │
│                       │  │ 2m ago · text · ⭐  │ │
│                       │  │ [Copy] [QR] [Del]   │ │
│                       │  └─────────────────────┘ │
│                       │  ┌─── Timeline Card ──┐ │
│                       │  │ ...                 │ │
│                       │  └─────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 8.2 Key Interactions

| Interaction | Behavior |
| ----------- | -------- |
| Paste (Ctrl+V / Cmd+V) | Auto-detect content type, populate paste box |
| Drag & drop | Accept images, show preview, upload on save |
| Copy button | One-click copy item content to clipboard |
| QR button | Generate and display QR code in a modal |
| Favorite toggle | Star/unstar with optimistic UI update |
| Expiry selector | Dropdown: None / 1h / 24h / 7d / 30d / Custom |

---

## 9. UI Design Direction

### 9.1 Color Palette

| Token | Value | Usage |
| ----- | ----- | ----- |
| `--bg-primary` | `#FDF6EC` | Warm cream background |
| `--bg-card` | `#FAF0E1` | Card surfaces |
| `--text-primary` | `#3D2C1E` | Headings, body text |
| `--text-secondary` | `#8B7355` | Muted labels, timestamps |
| `--accent` | `#C4956A` | Buttons, links, active states |
| `--accent-hover` | `#A67B52` | Hover states |
| `--border` | `#E8D9C5` | Card borders, dividers |
| `--danger` | `#C0392B` | Delete actions |
| `--success` | `#27AE60` | Success toasts |

### 9.2 Visual Principles

- **Soft shadows** — `0 2px 8px rgba(61, 44, 30, 0.08)`
- **Rounded corners** — `border-radius: 12px` for cards, `8px` for buttons
- **Clean typography** — Inter or similar humanist sans-serif
- **Spacious layout** — generous padding, breathing room
- **Goal:** Calm productivity aesthetic — not clinical, not playful

---

## 10. Security Requirements

### 10.1 MVP (Required)

| Requirement | Implementation |
| ----------- | -------------- |
| HTTPS | Mandatory for all traffic |
| Auth | Clerk token verification on every API route |
| Upload validation | File type whitelist (png, jpg, gif, webp), max 5 MB |
| Content limits | Text items max 50 KB, JSON max 100 KB |
| CORS | Restrict to frontend origin only |
| Rate limiting | Basic rate limiting on API (100 req/min per user) |

### 10.2 Post-MVP (Deferred)

- Encryption at rest for stored content
- Device authorization flows
- Audit logging

---

## 11. Performance Considerations

At the MVP scale (~10 users):

- No heavy infrastructure needed
- PostgreSQL indexes ensure fast queries
- Image size limits prevent storage bloat
- Pagination on all list endpoints
- S3 for images keeps DB lean

---

## 12. Deployment Architecture

```
┌──────────────────────────────────────┐
│              VPS / Server            │
│                                      │
│  ┌──────────┐    ┌───────────────┐   │
│  │  NGINX   │───►│  Node.js API  │   │
│  │ (reverse │    │  (Express)    │   │
│  │  proxy)  │    └───────┬───────┘   │
│  │          │            │           │
│  │  Static  │    ┌───────▼───────┐   │
│  │  Files   │    │  PostgreSQL   │   │
│  │ (client) │    └───────────────┘   │
│  └──────────┘                        │
└──────────────────────────────────────┘
           │
    ┌──────▼──────┐
    │  S3 Storage │
    └─────────────┘
```

- **NGINX** — reverse proxy + serve static client build
- **SSL** — Let's Encrypt certificate
- **Process manager** — PM2 or systemd for the Node process

---

