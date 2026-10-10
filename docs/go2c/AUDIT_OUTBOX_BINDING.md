# GO-2C — Audit and outbox binding

## Audit (`public.audit_events`)

Office-specific rows from `_office_emit_audit` (source `office_bridge`):

| event_type | When |
| --- | --- |
| `OFFICE_SESSION_CREATED` | `office_create_session` |
| `OFFICE_FILE_OPENED` | successful launch exchange |
| `OFFICE_SAVE_STARTED` | save prepare (first time) |
| `WORK_PRODUCT_VERSION_CREATED` | after trusted version insert |
| `OFFICE_SAVE_COMPLETED` | same transaction as version insert |

Existing trigger `trg_audit_document_versions` also writes `document.version_added`.

Payloads include session id, document id, version number. **Never** launch tokens, Office credentials, signed URLs, or file bytes.

## Outbox (`public.outbox_events`)

Canonical domain event (unchanged name):

`document.document.version_uploaded`

Emitted by `_upload_document_version_trusted` via `_emit_outbox_event` with `idempotency_key = save_operation_id`.

GO-2C guarantees **event emitted**. It does **not** add a Work Graph consumer, Search consumer, or AI Context writer.

Evidence in tests: `tests/integration/13_office_bridge_lifecycle.sql` asserts both office audit event types and at least one `document.document.version_uploaded` outbox row after a real `document_versions` insert.
