# GO-2C — Runtime proof

## What is proven in-repo

`tests/integration/13_office_bridge_lifecycle.sql` (transactional, rolls back) against real UniWork schema **after** migration `20260914120000_go2c_office_bridge.sql` is applied:

| Case | Proof |
| --- | --- |
| DOCX/XLSX/PPTX save | `document_versions` count becomes 2 |
| Idempotent complete | same `save_operation_id` ×2 → one version, `idempotentReplay=true` |
| PDF open | session `readOnly`; prepare raises `UNSUPPORTED_FORMAT` |
| Unsupported txt | `UNSUPPORTED_FORMAT` |
| Expired launch | `EXPIRED` |
| Token replay | `TOKEN_REPLAY` |
| Cross-tenant | `NOT_FOUND`, title not in `SQLERRM` |
| Foreign Office credential | `UNAUTHENTICATED` |
| Version conflict | extra version from another upload; Office complete does not add another |
| Permission revoke | share edit → session → revoke → `SAVE_DENIED`, version count unchanged |
| Audit / outbox | office events + `document.document.version_uploaded` |

PWA unit/security: `src/lib/office/office-formats.test.ts`, `office-security.test.ts`.

Desktop protocol/client: existing GO-2 packages (`uniwork://`, HTTPS client, no service role).

## What is BLOCKED on this host

The UniWork tree is an extracted zip (`uniworkplatform (1).zip`, 2026-08-28) **without git history and without runnable `.env` / database credentials** in this workspace.

Therefore the interactive golden path:

login PWA → Open in UniWork Office → desktop edit → Save to UniWork → PWA shows vN

is **not executed against a live project** here. Applying the migration to the Lovable Cloud database and pointing `UNIWORK_API_ORIGIN` at that origin is required for `DOCX_REAL_OPEN = PASS` in a real environment.

Do not treat the GO-2 in-memory adapter as this proof.
