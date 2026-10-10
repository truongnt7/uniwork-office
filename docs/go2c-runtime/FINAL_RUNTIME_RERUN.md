# GO-2C final runtime rerun

Date: 2026-09-14. Host: macOS. Live origin: `https://unidigiwork.lovable.app`.

`UNIWORK_API_ORIGIN` was set **via environment only** in gitignored `.env` (`UNIWORK_API_ORIGIN=https://unidigiwork.lovable.app`). No production URL was committed. Process confirmation: Office resolver reads `process.env.UNIWORK_API_ORIGIN` first (`apps/shell/src/main/office-bridge-host.ts`).

## Controlled tenant (non-secret)

| Item | Value |
| --- | --- |
| PWA user display name | GO2C Runtime Tester (tenant owner) |
| Org slug | `go2c-rt-20260914` |
| Workspace | GO2C Controlled WS |
| Workspace id | `3c7c1061-b5a6-464b-b2c5-d477740eb968` |
| Packaged desktop | UniWork Office 0.10.0 (`apps/shell/release/mac-arm64`) — **GO-1 freeze; no Office Bridge in asar** |

No passwords, JWTs, session tokens, or signed URLs are recorded here.

## Live Office HTTP contract (observed)

This is **not** the extract zip shape (`workProductId` / `launchToken` / `Office` scheme / nested `/api/office/sessions/:id/...`).

| Step | Live |
| --- | --- |
| Create | `POST /api/office/sessions` `{documentId}` + user `Bearer` → `{ok, sessionId, launchUrl, expiresAt, baseVersion, fileName, format}` |
| Deep link | `uniwork://office/open?token=` opaque ~43 chars, **not** JWT |
| Exchange | `POST /api/office/sessions/exchange` `{token}` → `{ok, sessionId, sessionToken, expiresAt, document, endpoints}` |
| Download | `GET /api/office/download` + `Bearer <sessionToken>` |
| Save prepare | `POST /api/office/save/prepare` `{idempotencyKey, baseVersion, sessionId}` + `Bearer <sessionToken>` → `{ok, saveOperationId, baseVersion, nextVersion, upload:{url,token,method}}` |
| Upload | `PUT` to Supabase signed object URL (`wjqsthhtadtbpophgclg.supabase.co` bucket `documents`) |
| Save complete | `POST /api/office/save/complete` `{sessionId, saveOperationId, idempotencyKey}` + `Bearer <sessionToken>` → `{ok, documentId, version, versionId, createdAt}` |
| Error envelope | `{ok:false, error:"CODE"}` (string code) |
| Conflict | `error:"VERSION_CONFLICT"` with `baseVersion` / `latestVersion` — **HTTP 400**, not 409 |

## What ran vs what did not

Ran against the **real** Lovable origin (not local Supabase, not mocks, not unit tests as proof):

- PWA Documents CTA **Mở bằng UniWork Office**
- Session create, exchange, download, save prepare/upload/complete for DOCX / XLSX / PPTX
- Idempotent complete replay
- Stale-base save denied as `VERSION_CONFLICT`
- Failed complete without upload (`UPLOAD_NOT_FOUND`) then retry

Did **not** complete:

- Opening/editing/saving **inside** packaged UniWork Office.app (asar has no `office-bridge`; source client still speaks the extract contract)
- PWA Documents “Lịch sử tài liệu” showing `document_versions` rows (panel: “Chưa có lịch sử”)
- Direct `audit_events` / `outbox_events` reads (PostgREST 401 without a usable anon key from this harness)
- Permission revocation (no second actor / share revoke executed)
- Second real tenant (foreign UUIDs returned `PERMISSION_DENIED` with no title leak — not a substitute for tenant B)
- PDF open (file not uploaded)

## Verdict

`GO2C_READY = PARTIAL`

Mandatory gates that stay open: desktop Office binary/contract, PWA version list UI, audit/outbox row proof, permission revocation, cross-tenant with a second tenant, HTTP 409 vs live 400.

No GO-3 work was implemented. Do not start GO-3 until `GO2C_READY = YES`.
