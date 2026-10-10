# GO-2C — Real backend map

UniWork’s named **Work Product** (`work_units`, RPCs `bind_work_product_execution` / `work_product_summary`) is a **work-unit contract / economics** aggregate. It is **not** the Office file system of record.

Office Bridge attaches to the existing **Documents** domain.

| Flag | Actual implementation |
| --- | --- |
| WORK_PRODUCT_TABLE | `public.documents` (Office `workProductId` = `documents.id`) |
| WORK_PRODUCT_VERSION_TABLE | `public.document_versions` (append-only; `tg_document_versions_immutable`) |
| FILE_STORAGE_MODEL | Supabase Storage bucket `documents`; object key `{workspaceId}/{documentKey}/{timestamp}-{name}`; refs stored as `{ provider, bucket, objectKey }` |
| VERSION_CREATION_COMMAND | `public._upload_document_version_trusted` (extracted from `upload_document_version`) |
| AUDIT_SINK | `public.audit_events` via `audit_child_row_change` (`document.version_added`) **and** `_office_emit_audit` (`OFFICE_*` / `WORK_PRODUCT_VERSION_CREATED`) |
| OUTBOX_PATH | `public._emit_outbox_event` → `public.outbox_events`; canonical event `document.document.version_uploaded` |
| AUTHORITY_HELPERS | `_office_can_access_document`, `_office_can_edit_document`, `_office_is_tenant_member`, `is_workspace_member` |
| RLS_BOUNDARY | `documents` / `document_versions` RLS unchanged. `office_sessions` / `office_save_operations` have RLS enabled, **no** `authenticated` grants; desktop never queries them. |
| IDEMPOTENCY_MECHANISM | `office_save_operations.save_operation_id` unique; completed row replayed. Outbox `ON CONFLICT (event_type, idempotency_key)` using save operation id. |
| CONCURRENCY_MECHANISM | Session stores `base_version_id` + `base_version_number`. Save complete `FOR UPDATE` on `documents` and compares to latest `document_versions`. Mismatch → `VERSION_CONFLICT` (no overwrite). Document `row_version` remains the metadata OCC column used by `update_document`. |

## Not used for Office files

- `work_units`
- `office_work_products` / `office_documents` / `office_versions` (never created)

## Temporary integration state only

- `public.office_sessions`
- `public.office_save_operations`

```
office_session  →  documents  →  document_versions
```

## HTTP surface (GO-2 contract)

Implemented on UniWork (TanStack Start server routes), not on the Office desktop:

- `POST /api/office/sessions` (user Bearer)
- `POST /api/office/sessions/exchange`
- `GET /api/office/sessions/:id/content` (`Office` credential)
- `POST /api/office/sessions/:id/save/prepare`
- `PUT /api/office/sessions/:id/save/upload`
- `POST /api/office/sessions/:id/save/complete`
- `POST /api/office/sessions/:id/close`

Desktop talks only to this HTTPS contract. Storage credentials stay on the UniWork server.
