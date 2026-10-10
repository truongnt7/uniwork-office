# Final security proof — GO-2C runtime rerun

Live session create (PWA + API):

| Check | Result |
| --- | --- |
| NO_USER_JWT_IN_DEEP_LINK | **YES** — `uniwork://office/open?token=` opaque ~43 chars; `jwtLike=false`; token prefix not `eyJ` |
| NO_SERVICE_ROLE_IN_DESKTOP | **YES** — `apps/shell/src/main` has no `SERVICE_ROLE` / `DATABASE_URL`; packaged 0.10.0 asar has no office-bridge and no service role strings for Bridge |
| NO_SERVICE_ROLE_IN_FRONTEND | **YES** — live PWA office-launch uses user `Bearer` from `supabase.auth.getSession()` then `POST /api/office/sessions` |
| DESKTOP_DIRECT_DB_ACCESS | **NO** (desktop does not use a DB URL; live save used HTTPS Bridge + signed storage PUT) |
| TOKEN_LOGGING_FOUND | **NO** in Office Bridge host/client (no `console.log` of tokens). This report does not record tokens. |

Notes:

- Exchange `sessionToken` is **not** a user JWT (`prefix` not `eyJ`).
- Save upload uses a **Supabase storage signed JWT** (`upload.token` starts `eyJ`) on the signed PUT URL only — not in the deep link.
- Live `Office` auth scheme on `/api/office/download` returns 401; `Bearer sessionToken` succeeds.
- Source desktop client still sends `Authorization: Office …` and `{launchToken}` — incompatible with live; not used for the successful saves.

Domain invariant after successful completes: new `version` / `versionId` returned; stale save denied with `VERSION_CONFLICT`; idempotent complete reused the same `versionId`. `NO_DOCUMENT_VERSION_UPDATE = YES` (append-only from the API’s point of view). `NO_GO3_IMPLEMENTATION = YES`.
