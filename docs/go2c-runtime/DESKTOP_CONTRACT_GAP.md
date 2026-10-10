# Desktop contract gap (pre-alignment inspection)

Inspected: UniWork Office source on this machine and packaged **0.10.0** at `apps/shell/release/mac-arm64/UniWork Office.app`.

Live origin (authoritative): `https://unidigiwork.lovable.app`.

## Packaged 0.10.0 asar

`app.asar` (~17.9 MB) contains **no** Office Bridge strings:

| Needle | In 0.10.0 asar |
| --- | --- |
| `UNIWORK_API_ORIGIN` | no |
| `office-bridge` | no |
| `office/open` | no |
| `handleOfficeLaunch` | no |
| `saveToUniWork` | no |

`electron-builder.cjs` already registers protocol scheme `uniwork`. 0.10.0 cannot complete a live open/save.

## Current source (uncommitted GO-2, extract contract)

| Area | Source today | Live (must follow) |
| --- | --- | --- |
| Deep link | `uniwork://office/open?token=` — parse OK | same |
| JWT in link | rejected | opaque token only |
| Exchange body | `{launchToken}` | `{token}` |
| Session credential | `sessionCredential` + `Authorization: Office …` | `sessionToken` + `Authorization: Bearer …` |
| Download | `GET /api/office/sessions/:id/content` | `GET /api/office/download` (or `endpoints.download`) |
| Save prepare | `POST /api/office/sessions/:id/save/prepare` + checksum/size/baseVersionId | `POST /api/office/save/prepare` `{idempotencyKey, baseVersion, sessionId}` |
| Upload | `PUT` relative `/api/office/sessions/:id/save/upload` with Office auth | signed `PUT` `upload.url` with `Bearer upload.token` |
| Save complete | `POST /api/office/sessions/:id/save/complete` `{saveOperationId, checksumSha256}` | `POST /api/office/save/complete` `{sessionId, saveOperationId, idempotencyKey}` |
| Errors | `{error:{code,message}}`, conflict HTTP 409 | `{ok:false, error:"CODE"}`, conflict HTTP 400 |
| Create (if used) | `{workProductId}` | `{documentId}` |
| Origin | `UNIWORK_API_ORIGIN` env, then settings — **not hard-coded** | keep env-driven |

Nested `/sessions/:id/...` paths 404 on the live origin.

## Origin loading (already correct)

`resolveUniWorkApiOrigin`: `process.env.UNIWORK_API_ORIGIN` then `app-settings.json` `uniworkApiOrigin`. No production URL in source.

## Protocol registration (already present)

`app.setAsDefaultProtocolClient('uniwork')` in `apps/shell/src/main/index.ts`. Builder `protocols.schemes: ['uniwork']`.

## Persistence / logging

Launch token is not written to `meta.json`. Session credential is in-memory (`liveByPath`) only. No `console.log` of tokens in the Bridge host/client.

## Closure required

Fix the **desktop client** to the live contract. Do not add live compatibility routes for the obsolete nested client. Rebuild a new artifact (0.10.1) that contains the Bridge. Do not treat 0.10.0 as the closeout binary.

## Closed (same day)

Source client, in-memory adapter, and packaged **0.10.1** now speak the live contract (`token`, Bearer `sessionToken`, `/api/office/download`, `/api/office/save/prepare|complete`, server `endpoints`). Nested `/sessions/:id/...` download/save paths are gone from the production client. Live API was not changed. Detail: `docs/go2c-runtime/DESKTOP_CONTRACT_ALIGNMENT.md`.
