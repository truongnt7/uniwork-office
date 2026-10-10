# GO-2C — Real backend binding & PWA launch hook

ACCEPTANCE REPORT

Validation date: 2026-09-14. Host: macOS. UniWork Office: GO-1 freeze `11945d6d2b9bd26f655dfd6b9626f6d9469899ad` plus uncommitted GO-2 / GO-2C work. UniWork PWA: live `https://unidigiwork.lovable.app` (not a git clone).

Final runtime rerun (2026-09-14): live Office API is deployed. HTTP Bridge golden paths ran first; packaged **0.10.1** later completed desktop open/save/reopen for DOCX/XLSX/PPTX. PWA history UI, audit/outbox, revoke, and second tenant remain open. Canonical status stays **PARTIAL**. Detail: `docs/go2c-runtime/DESKTOP_CONTRACT_ALIGNMENT.md`.

## A. VERDICT

`GO2C_READY = PARTIAL`

## B. REAL BACKEND

| Concern | Binding |
| --- | --- |
| Work Product (Office file) | `documents.id` (PWA posts `documentId`) |
| Version | new row via `POST /api/office/save/complete` (`version`, `versionId`) |
| Storage | bucket `documents` on `wjqsthhtadtbpophgclg.supabase.co` (signed PUT) |
| Audit / outbox | **not read** this rerun |
| Parallel WP model | **NO** |

## C. PWA

| Item | Status |
| --- | --- |
| Open button | Live Documents overflow: **Mở bằng UniWork Office** |
| Session endpoint | Live `POST /api/office/sessions` → 200 with user Bearer |
| Deep link | `uniwork://office/open?token=` opaque (no JWT) |
| Latest version in PWA list | History dialog: “Chưa có lịch sử” → `PWA_LATEST_VERSION_VISIBLE = NO` |

## D. RUNTIME FILE FLOWS

| Type | Open | Save version | Reopen |
| --- | --- | --- | --- |
| DOCX | PASS (`dd35c3e8-0639-4faf-b229-619e1a9fe5bb`) | PASS (desktop v5) | PASS (`baseVersion=5`) |
| XLSX | PASS (`fa052007-1613-42ba-967a-eada5a6779c7`) | PASS (desktop v5) | PASS |
| PPTX | PASS (`edcc0a03-3782-4699-b574-7dd1fda4f9d1`) | PASS (desktop v3) | PASS |
| PDF | NOT_RUN | n/a | n/a |

Packaged **0.10.1** now contains the live Bridge and completed desktop golden paths (DOCX/XLSX/PPTX). Detail: `docs/go2c-runtime/DESKTOP_CONTRACT_ALIGNMENT.md`. Other GO-2C gates (PWA history UI, audit/outbox, revoke, second tenant) remain open, so status stays **PARTIAL**.

## E. VERSIONING

Idempotent complete replay returned the same `versionId`. Stale `baseVersion` save prepare returned `VERSION_CONFLICT` (HTTP **400**, not 409). Failed complete without upload: `UPLOAD_NOT_FOUND`; retry succeeded.

## F. SECURITY

No user JWT in deep link. No service role in desktop or PWA frontend. No desktop DB URL. Tokens not logged in this report. Cross-tenant with a second tenant: **BLOCKED**. Permission revocation: **BLOCKED**.

## G. AUDIT / OUTBOX

**BLOCKED** this rerun (no table proof).

## H. GO-3 BOUNDARY

No Work Graph nodes, edges, or projectors were added. See `docs/go2c/GO3_HANDOFF.md`.

## I. FINAL FLAGS

```
REAL_API_ORIGIN_CONFIGURED = YES
DOCX_REAL_OPEN = PASS
DOCX_REAL_SAVE_VERSION = PASS
DOCX_REOPEN_LATEST = PASS
XLSX_REAL_OPEN = PASS
XLSX_REAL_SAVE_VERSION = PASS
XLSX_REOPEN_LATEST = PASS
PPTX_REAL_OPEN = PASS
PPTX_REAL_SAVE_VERSION = PASS
PPTX_REOPEN_LATEST = PASS
PDF_REAL_OPEN = NOT_RUN
IDEMPOTENCY_RUNTIME_GREEN = YES
VERSION_CONFLICT_RUNTIME_GREEN = YES
PERMISSION_REVOCATION_RUNTIME_GREEN = BLOCKED
CROSS_TENANT_RUNTIME_GREEN = BLOCKED
REAL_AUDIT_RUNTIME_GREEN = BLOCKED
REAL_OUTBOX_RUNTIME_GREEN = BLOCKED
PWA_LATEST_VERSION_VISIBLE = NO
FAILED_SAVE_RECOVERABLE = YES
NO_USER_JWT_IN_DEEP_LINK = YES
NO_SERVICE_ROLE_IN_DESKTOP = YES
NO_SERVICE_ROLE_IN_FRONTEND = YES
DESKTOP_DIRECT_DB_ACCESS = NO
TOKEN_LOGGING_FOUND = NO
NO_DOCUMENT_VERSION_UPDATE = YES
NO_GO3_IMPLEMENTATION = YES
GO2C_READY = PARTIAL
```

## J. NEXT PHASE

Not recommended as GO-3 until `GO2C_READY = YES`. Remaining: PWA version list, audit/outbox rows, revoke, second tenant. Desktop live-contract alignment is closed (`docs/go2c-runtime/DESKTOP_CONTRACT_ALIGNMENT.md`). When unblocked: **GO-3 — Work Product + Work Graph Projection**. Do not implement GO-3 in this phase.
