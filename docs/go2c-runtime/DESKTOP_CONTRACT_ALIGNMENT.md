# Desktop contract alignment closeout

Date: 2026-09-14. Host: macOS. Live origin via env: `UNIWORK_API_ORIGIN` → `https://unidigiwork.lovable.app` (gitignored `.env`, not hard-coded in source).

`GO2C_READY` stays **PARTIAL**. This closeout only removes the desktop-client contract blocker.

## Artifact

| Item | Value |
| --- | --- |
| Product | UniWork Office **0.10.1** |
| Path | `apps/shell/release/mac-arm64/UniWork Office.app` |
| Info.plist version | 0.10.1 |
| asar SHA-256 | `f1f508ca07634d65873fe36a1a486012c2f69a868352cc17efaa714a7a25b11f` |
| binary SHA-256 | `34465676648bf5e5892e8f7791929be7ee01973a5317260f4f741ab7110cfef6` |
| Source freeze underneath | `11945d6d2b9bd26f655dfd6b9626f6d9469899ad` + uncommitted GO-2 / GO-2C |

Do **not** reuse packaged 0.10.0 (asar had no Bridge).

Packaged asar contains: `handleOfficeLaunch`, `/api/office/sessions/exchange`, `/api/office/download`, `/api/office/save/prepare`, `/api/office/save/complete`, `Bearer`, `UNIWORK_API_ORIGIN`. No `launchToken`. No nested `sessions/${id}/content` or `save/upload` client paths. Info.plist `CFBundleURLSchemes = uniwork`. `service_role` appears only in the forbidden deep-link query-key denylist.

## Contract now used by desktop

| Step | Client |
| --- | --- |
| Deep link | `uniwork://office/open?token=` opaque only; JWT-shaped tokens rejected |
| Exchange | `POST /api/office/sessions/exchange` `{token}` |
| Download | `GET` server `endpoints.download` (live `/api/office/download`) `Authorization: Bearer <sessionToken>` |
| Prepare | `POST` `endpoints.savePrepare` `{idempotencyKey, baseVersion, sessionId}` |
| Upload | signed `PUT` `upload.url` with `Bearer upload.token` |
| Complete | `POST` `endpoints.saveComplete` `{sessionId, saveOperationId, idempotencyKey}` |

Origin: env first, then `app-settings.json` `uniworkApiOrigin` (env is copied into settings so protocol launches without a shell env still resolve). No production URL in source. No service-role or DB credentials in the desktop.

Launch token is not written to `meta.json`. Session token stays in memory (`liveByPath`). App logs from this run did not print tokens.

## Real desktop golden path

Controlled tenant (non-secret): org `go2c-rt-20260914`, workspace GO2C Controlled WS, PWA user GO2C Runtime Tester.

The Cursor embedded browser swallowed `uniwork://` from the Documents overflow item **Mở bằng UniWork Office**. Session create was therefore executed **in the logged-in PWA page** (`POST /api/office/sessions` `{documentId}` + user Bearer), then macOS `open` handed `uniwork://office/open?token=` to packaged **0.10.1**. That is the same OS protocol handoff the PWA button performs. Exchange, download, editor open, **File → Save to UniWork**, and reopen all ran inside the rebuilt app — not as a curl substitute for those steps.

| File | Document id | Open base | After Save to UniWork | Reopen base |
| --- | --- | --- | --- | --- |
| go2c-docx-golden.docx | `dd35c3e8-0639-4faf-b229-619e1a9fe5bb` | 4 | 5 | 5 |
| go2c-xlsx-golden.xlsx | `fa052007-1613-42ba-967a-eada5a6779c7` | 3 | 4 (then 5 on a second Save) | 5 |
| go2c-pptx-golden.pptx | `edcc0a03-3782-4699-b574-7dd1fda4f9d1` | 2 | 3 | 3 |

Failed-save recoverability, conflict, idempotency, and local-file retention were already proven on the live HTTP Bridge; this run did not regress meta persistence (idempotency key cleared after success; launch token never stored).

## Flags

```
DESKTOP_CONTRACT_ALIGNED = YES
UNIWORK_SCHEME_REGISTERED = YES
OPAQUE_TOKEN_EXCHANGE = PASS
LIVE_DOWNLOAD_CONTRACT_USED = YES
LIVE_SAVE_PREPARE_CONTRACT_USED = YES
LIVE_SAVE_COMPLETE_CONTRACT_USED = YES
PACKAGED_BRIDGE_PRESENT = YES
DOCX_DESKTOP_GOLDEN_PATH = PASS
XLSX_DESKTOP_GOLDEN_PATH = PASS
PPTX_DESKTOP_GOLDEN_PATH = PASS
NO_LIVE_API_CHANGE = YES
NO_GO3_IMPLEMENTATION = YES
GO2C_READY = PARTIAL
```

Still open for full GO-2C YES: PWA version history UI, audit/outbox row proof, permission revocation, second tenant. Do not start GO-3.
