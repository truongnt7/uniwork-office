# GO-2C → GO-3 handoff (no implementation)

GO-2C does **not** add Work Graph nodes, edges, projectors, `GENERATES`, `VERSION_OF`, AI Context, or an AI Gateway.

Runtime closeout (2026-09-14): these hooks are **implemented in source** and were **not observed on the live Lovable origin** (Office API 404; migration not applied).

## Events available after a successful Office save (when deployed)

- Outbox: `document.document.version_uploaded`
  - `aggregate_type`: `document`
  - `aggregate_id`: `documents.id`
  - payload: `document_id`, `version`, `author_id`, `size_bytes`
- Audit: `document.version_added` (trigger) and `WORK_PRODUCT_VERSION_CREATED` (office)

## IDs available

- `tenant_id`, `workspace_id` on `documents`
- `document_id` (= Office `workProductId`)
- `document_versions.id` / `version`
- `office_sessions.id` (integration only; do not project as a graph node)
- `author_id` = UniWork user who saved

## Recommended future projection points (GO-3) — design notes only

- Task → GENERATES → Document
- Meeting → GENERATES → Document
- Workspace/Project → CONTAINS → Document
- Document Version → VERSION_OF → prior version

Consume `document.document.version_uploaded`. Do not project `office_sessions`.

No code in GO-2C or this closeout implements those consumers.
