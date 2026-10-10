# DOCX golden path — final runtime

**Status: PASS (live API + packaged 0.10.1 desktop)**

Live origin: `https://unidigiwork.lovable.app`. Workspace: GO2C Controlled WS (`3c7c1061-b5a6-464b-b2c5-d477740eb968`).

## Sequence executed

1. PWA Documents → uploaded `go2c-docx-golden.docx`
2. Overflow menu → **Mở bằng UniWork Office**
3. `POST /api/office/sessions` `{documentId}` → 200 `ok:true`, `format:"DOCX"`, `launchUrl` `uniwork://office/open?token=` (opaque, `jwtLike:false`)
4. `POST /api/office/sessions/exchange` `{token}` → `sessionToken` + `endpoints.download`
5. `GET /api/office/download` `Bearer sessionToken` → 200, 940 bytes, ZIP magic `PK`
6. Save prepare (baseVersion 2 → nextVersion 3) → PUT storage → complete → **version 3** `versionId=a59b24c5-ac3b-48bc-ae93-81fcfde69c8b`
7. Later conflict actor produced **version 4** `924ca372-21b2-43fa-bd2a-78b21bd3c311`
8. Reopen session: `baseVersion` **4**, download 200 PK

Document id: `dd35c3e8-0639-4faf-b229-619e1a9fe5bb`.

Packaged **0.10.1** later opened this file via `uniwork://`, **Save to UniWork** produced **version 5**, reopen `baseVersion` 5. See `DESKTOP_CONTRACT_ALIGNMENT.md`.

PWA “Lịch sử tài liệu” after save: **Chưa có lịch sử** (does not list `document_versions`).

| Gate | Result |
| --- | --- |
| DOCX_REAL_OPEN | PASS (PWA session + packaged 0.10.1 download) |
| DOCX_REAL_SAVE_VERSION | PASS (desktop Save to UniWork → version 5) |
| DOCX_REOPEN_LATEST | PASS (desktop reopen `baseVersion=5`) |
| DOCX_DESKTOP_GOLDEN_PATH | PASS |
