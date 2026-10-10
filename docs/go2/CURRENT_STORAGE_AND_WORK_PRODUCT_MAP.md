# GO-2 — current storage and Work Product map

Inspected 2026-09-14 against this workspace and local GitHub account `truongnt7`.

## Finding

**UniWork PWA / backend is not present in this checkout.** There is no sibling `uniwork` app repository, no Supabase schema, and no `work_products` / `document_versions` SQL under `/Users/uranus/Projects`.

| Expected UniWork surface | Location in this workspace |
| --- | --- |
| `work_products` | **not found** |
| `work_product_versions` | **not found** |
| `documents` / `document_versions` | **not found** |
| `files` / storage buckets | **not found** |
| audit / outbox tables | **not found** |
| tenant / workspace | **not found** |
| RPCs | **not found** |

`CURRENT_WORK_PRODUCT_MODEL_MAPPED = NO` for production UniWork.

## What GO-2 implemented instead

A portable HTTP contract (`@uniwork/office-bridge-contracts`) and a **verification adapter** (`@uniwork/office-bridge-adapter`).

The adapter’s in-memory store is **not** a second production Work Product database. It exists so Office can prove session, token, tenant, version, and idempotency rules without inventing UniWork’s system of record.

When UniWork’s real tables exist, UniWork hosts the same endpoints against those tables. Desktop does not change.

## Adapter record mapping (verification only)

| Adapter record | Intended UniWork owner |
| --- | --- |
| `WorkProductRecord` | existing Work Product row |
| `VersionRecord` | immutable version blob + checksum |
| `OfficeSessionRecord` | new `office_sessions` (or equivalent) |
| `Membership` | tenant/workspace membership |
| `audit[]` | current trusted audit |
| `outbox[]` | current domain outbox (`WORK_PRODUCT_VERSION_CREATED`) |

Storage provider stays **behind the adapter**. Desktop only calls `/content` and `/save/*`.

## Authorization model (adapter / required of UniWork)

- PWA session create: authenticated UniWork user (Bearer). Server derives tenant/workspace. Client-supplied tenant/user IDs are ignored.
- Desktop: `Authorization: Office <session-credential>` only. No service role, no DB URL, no user JWT in the deep link.
- Permission rechecked on create, exchange, download, save prepare, save complete.
- Cross-tenant IDs return generic `NOT_FOUND` (no title leak).
