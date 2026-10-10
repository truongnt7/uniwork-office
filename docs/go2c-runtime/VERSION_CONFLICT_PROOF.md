# Version conflict — live runtime

**VERSION_CONFLICT_RUNTIME_GREEN = YES** (deny + no overwrite). Live status code is **400**, not 409.

Scenario on DOCX `dd35c3e8-0639-4faf-b229-619e1a9fe5bb`:

1. Session A exchanged at `baseVersion` 3.
2. Session B exchanged at `baseVersion` 3, saved successfully → **version 4** `924ca372-21b2-43fa-bd2a-78b21bd3c311`.
3. Session A `POST /api/office/save/prepare` with stale `baseVersion` 3.

Response:

```json
{"ok":false,"error":"VERSION_CONFLICT","baseVersion":...,"latestVersion":...}
```

HTTP **400**. No new version from A. Latest remained 4 (later reopen `baseVersion=4`).

Spec text asked for HTTP 409. That is a live-contract deviation, not an overwrite bug. Desktop client currently looks for 409 + `{error:{code}}` and would **not** map this body without an adapter.
