# GO-2 — UniWork Office Bridge

ACCEPTANCE REPORT

Validation date: 2026-09-14. Host: macOS 26.3.1 arm64.

## A. EXECUTIVE VERDICT

`GO2_READY = PARTIAL`

UniWork Office now has a portable Office Bridge (contracts, HTTPS client, `uniwork://` protocol, temp workspace, Save to UniWork) plus a verification adapter that enforces one-time tokens, tenant isolation, version conflicts, and idempotent saves.

Production UniWork PWA/backend **is not in this workspace**, so this phase did **not** create a second Work Product database and did **not** fake UniWork identity. Until UniWork hosts the same HTTP contract against its real tables, GO-2 cannot be `YES`.

## B. BASELINES

| Tree | SHA |
| --- | --- |
| GO-1 Office freeze | `11945d6d2b9bd26f655dfd6b9626f6d9469899ad` (`go1-uniwork-office-v0.10.0`) |
| UniWork app | **NONE** (not cloned / not in workspace) |
| UniWork Office (this worktree) | GO-2 changes uncommitted on `main` above the GO-1 freeze |

## C. ARCHITECTURE

- **Session model:** server-controlled `office_sessions` in `@uniwork/office-bridge-adapter` (verification double). UniWork must persist the same fields.
- **Launch protocol:** `uniwork://office/open?token=<opaque>`
- **Token exchange:** `POST /api/office/sessions/exchange` → scoped `Office` credential (not the launch token)
- **File transport:** `GET /api/office/sessions/:id/content` (no bucket URLs)
- **Save flow:** prepare → PUT upload on a Bridge path → complete → new version

## D. SECURITY

| Item | Result |
| --- | --- |
| Launch TTL | **180s** |
| Replay | **blocked** (`TOKEN_REPLAY`) |
| Tenant isolation | **green** (generic `NOT_FOUND`) |
| Permission revalidation | **green** (membership removed → save denied) |
| Desktop credentials | API origin only; **no** service role, **no** user JWT in URL |
| Direct DB access | **NO** |

## E. FILE TYPES

| Type | Open from UniWork | Save new version |
| --- | --- | --- |
| DOCX | **PASS** (`e2e/office-bridge.spec.ts`) | **PASS** (v2 created) |
| XLSX | **PASS** (adapter + same `openDocumentPath` router) | **PASS** (format-agnostic save API) |
| PPTX | **PASS** (adapter + router) | **PASS** (format-agnostic save API) |
| PDF | **PASS** (adapter download) | **NOT_IN_SCOPE** |

## F. VERSIONING

- Current: v1 on session open
- New version: immutable `n+1`
- Conflict: `VERSION_CONFLICT`, local file kept
- Idempotency: same `saveOperationId` → one version

## G. AUDIT / OUTBOX

Adapter emits `OFFICE_*` audit events and `WORK_PRODUCT_VERSION_CREATED` outbox events (no tokens/contents). Production UniWork audit/outbox tables are **not wired** (backend absent).

## H. FAILURE RECOVERY

| Case | Behavior |
| --- | --- |
| Network / save fail | Local `bridge-sessions/` file kept |
| Expired session | `EXPIRED` |
| Revoked access | deny, local kept |
| Version conflict | warn, local kept |
| Desktop crash | bytes remain; credential is memory-only |

## I. TESTS

| Suite | Result |
| --- | --- |
| `@uniwork/office-bridge-contracts` | PASS (3) |
| `@uniwork/office-bridge` | PASS (8) |
| `@uniwork/office-bridge-adapter` | PASS (6) including security/version/idempotency/cross-tenant |
| `@genoffice/shell` | PASS (275) |
| `e2e/office-bridge.spec.ts` | PASS (DOCX open+save v2) |
| GO-1 smokes docs/sheets/slides/pdf | PASS (4) |
| `npm run build:all` | PASS (exit 0) |

## J. KNOWN LIMITATIONS

1. UniWork PWA/backend not available here → production Work Product model unmapped.
2. Adapter store is a test/verification double, not UniWork production data.
3. PWA UI is the adapter HTML snippet (`/pwa/work-product/:id`), not the real UniWork app.
4. PDF save-as-new-version not claimed.
5. GUI deep-link e2e was run for DOCX; XLSX/PPTX use the same host + adapter coverage.
6. GO-2 source is not committed in this task unless requested.

## K. FINAL FLAGS

```
GO1_BASELINE_SHA = 11945d6d2b9bd26f655dfd6b9626f6d9469899ad
UNIWORK_APP_SHA = NONE
UNIWORK_OFFICE_SHA = uncommitted GO-2 on 11945d6d2b9bd26f655dfd6b9626f6d9469899ad
CURRENT_WORK_PRODUCT_MODEL_MAPPED = NO
OFFICE_SESSION_SERVER_CONTROLLED = YES
ONE_TIME_LAUNCH_TOKEN = YES
LAUNCH_TOKEN_TTL = 180s
TOKEN_REPLAY_BLOCKED = YES
NO_USER_JWT_IN_DEEP_LINK = YES
NO_SERVICE_ROLE_IN_DESKTOP = YES
DESKTOP_DIRECT_DB_ACCESS = NO
STORAGE_PROVIDER_HIDDEN_FROM_DESKTOP = YES
DOCX_OPEN_FROM_UNIWORK = PASS
DOCX_SAVE_NEW_VERSION = PASS
XLSX_OPEN_FROM_UNIWORK = PASS
XLSX_SAVE_NEW_VERSION = PASS
PPTX_OPEN_FROM_UNIWORK = PASS
PPTX_SAVE_NEW_VERSION = PASS
PDF_OPEN_FROM_UNIWORK = PASS
PDF_SAVE_NEW_VERSION = NOT_IN_SCOPE
VERSION_CONFLICT_SAFE = YES
SAVE_IDEMPOTENCY_GREEN = YES
PERMISSION_REVALIDATION_GREEN = YES
TENANT_ISOLATION_GREEN = YES
AUDIT_GREEN = YES
OUTBOX_GREEN = YES
FAILED_SAVE_RECOVERABLE = YES
GO1_EDITOR_REGRESSION = NO
GO2_READY = PARTIAL
```

`AUDIT_GREEN` / `OUTBOX_GREEN` refer to the portable adapter emitting the required events. They are **not** proof of production UniWork audit tables.

## L. NEXT PHASE

Do **not** start GO-3 until UniWork hosts this contract.

Recommend: integrate the adapter endpoints into the real UniWork backend (existing Work Product tables + audit/outbox), then wire the PWA “Open in UniWork Office” button to `POST /api/office/sessions`.

Do **not** implement GO-3 (Work Graph projection) in this task.
