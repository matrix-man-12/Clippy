🧭 MVP Definition — Clipboard Sync Web App
1. Product Objective

A persistent cross-device clipboard vault allowing users to:

Save text, formatted text, JSON, images.

Access across phone + browser instantly.

Share selected content with trusted users.

Set optional auto-delete timers.

Transfer text via QR code.

Primary focus: reliability + simplicity.

2. System Architecture (Stack-Specific)
Frontend

React + Vite

Responsibilities:

Authentication integration (Clerk SDK).

Clipboard capture UI.

Timeline display.

QR generation UI.

Sharing interface.

Why Vite:

Faster dev iteration.

Lightweight bundling.

No SSR complexity needed for MVP.

Backend

Node.js API (Express/Fastify recommended)

Responsibilities:

Auth token verification (Clerk).

CRUD for clipboard items.

Expiry cleanup jobs.

Sharing permissions.

Image upload orchestration.

Keep backend thin — avoid business logic duplication.

Database

PostgreSQL

Reasons:

Structured relational data.

Good indexing for search.

JSON support useful for formatted content.

Storage

Object storage for images

Recommended:

S3-compatible storage.

Avoid DB bloating.

3. Database Design (MVP-Level)
Users Table

Fields:

id (internal)

clerk_id (external auth mapping)

email

created_at

No profile complexity needed.

Clipboard_Items Table

Core entity:

id

owner_id (FK users)

content_type
(text / rich_text / json / image)

content_text (nullable)

content_blob_url (nullable)

created_at

updated_at

expiry_at (nullable)

is_favorite (boolean)

Indexes:

owner_id + created_at

expiry_at

content_type

Shared_Collections Table

Represents shared vaults:

id

name

owner_id

created_at

Collection_Members Table

Permissions:

collection_id

user_id

permission_level (view/upload)

Collection_Items Mapping

Allows items inside shared vault:

item_id

collection_id

4. API Surface (Functional Definition)
Authentication Layer

Handled by Clerk:

Backend responsibilities:

Verify session token.

Map clerk_id → internal user_id.

Clipboard APIs
Create Item

Supports:

Text paste

JSON paste

Rich text

Image upload

Metadata:

Expiry optional.

Fetch Items

Capabilities:

Timeline fetch.

Filters:

Date

Content type

Favorites.

Pagination recommended.

Update Item

Allowed:

Edit text.

Change expiry.

Toggle favorite.

Delete Item

Two modes:

Manual delete.

Auto expiry delete.

Sharing APIs

Functions:

Create shared collection.

Invite member.

Add item to collection.

Fetch shared items.

Keep ACL simple.

QR Code APIs

Simple flow:

Generate QR pointing to:

Temporary URL containing encoded content.

When opened:

Auto-save item.

Limit text size.

5. Expiry Mechanism (Important Detail)

Recommended:

Scheduled Worker

Every ~10 minutes:

Delete expired items.

Remove associated images.

Optional:

Soft delete buffer (24 hrs).

This prevents accidental loss.

6. Frontend UX Structure
Main Layout
Sidebar

Personal Vault

Shared Vaults

Favorites

Settings

Main Content

Timeline cards showing:

Preview snippet.

Created time.

Expiry badge.

Copy button.

QR button.

Favorite toggle.

Paste Entry Box

Top priority:

Paste detection.

Drag-drop image.

Expiry selector inline.

7. UI Design Direction (Cream Theme)

To avoid generic SaaS look:

Colors

Base:

Warm cream background.

Secondary:

Muted brown/earth tones.

Accent:

Soft pastel highlight.

Avoid:

Pure white.

Stark contrast.

Visual Language

Soft shadows.

Rounded cards.

Clean typography.

Spacious layout.

Goal:

Calm productivity aesthetic.

8. Performance Considerations

At ~10 users:

No heavy infra needed.

Still ensure:

Indexed queries.

Image size limits.

Pagination.

9. Security Requirements (Minimum)

Essential:

HTTPS mandatory.

Clerk token validation server-side.

Upload validation.

Content size limits.

Optional later:

Encryption at rest.

10. Deployment Setup

Simple VPS setup:

Components:

Node backend process.

Static frontend build.

PostgreSQL instance.

Object storage.

Add:

Reverse proxy (NGINX recommended).

SSL certificate.

11. Explicit MVP Exclusions

Confirmed NOT included:

AI tagging.

Browser extension.

Device authorization flows.

Automation rules.

Analytics.

This keeps build fast.

12. MVP Success Criteria

If these work reliably:

✅ Paste phone → copy desktop instantly.
✅ Long-term storage with expiry.
✅ Small group sharing works.
✅ QR bridge functional.
✅ Clean cream UI experience.

Then MVP validated.