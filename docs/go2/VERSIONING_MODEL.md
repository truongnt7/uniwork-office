# GO-2 — versioning model

Default save: **new immutable version**, never blind overwrite.

On open, the session records `baseVersionId` / `versionNumber`.

On save:

- If latest version is still the base → create `n+1`, update Work Product latest pointer, emit audit + outbox.
- If another actor already created a newer version → `VERSION_CONFLICT`. Local file is kept. No overwrite.

Idempotency: one `saveOperationId` (UUID) per save. Retry of prepare/complete returns the same version (`idempotentReplay: true`).

PDF: open is in scope. **Save-as-new-version is not claimed** (GO-1 did not prove PDF annotation persist).
