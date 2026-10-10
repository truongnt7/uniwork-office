# GO-2C runtime — migration review

**MIGRATION_REVIEW_GREEN = YES**

File: `uniwork-platform/supabase/migrations/20260914120000_go2c_office_bridge.sql`  
SHA-256: `bf10d24e50ff8bc5ee80c669e60f28ba32038300504c7b0ada7b416fff72d8d9`

Reviewed from source **before apply**. Not applied to the live project (see `DB_RUNTIME_VALIDATION.md`).

## Tables created

### `public.office_sessions` (temporary integration state)

Columns: `id`, `tenant_id`, `workspace_id`, `document_id`, `user_id`, `base_version_id`, `base_version_number`, `launch_token_hash` (unique, hash only), `session_credential_hash` (unique, hash only), `status` (check), `extension`, `mime_type`, `file_name`, `read_only`, `launch_expires_at`, `credential_expires_at`, `launch_consumed_at`, `opened_at`, `closed_at`, `created_at`.

FKs: `tenants`, `workspaces`, `documents`, `users`, `document_versions`.

### `public.office_save_operations`

Columns: `save_operation_id` (PK, client UUID / idempotency), `session_id`, `document_id`, `base_version_id`, upload intent fields, `bytes_received`, `status`, `result_version_id`, `result_version_number`.

Does **not** store launch tokens or file bytes.

## Indexes / constraints

- `office_sessions_document_idx`, `office_sessions_user_idx`, `office_save_ops_session_idx`
- Unique hashes; status CHECKs; NOT NULL on tenant/workspace/document/user/base version

## RLS / grants

- RLS **enabled** on both tables
- `REVOKE ALL` from `PUBLIC`, `anon`, `authenticated`
- `GRANT ALL` to `service_role` only (HTTP handlers after credential validation)
- No policies for `authenticated` → default deny for user JWT clients

## Functions / RPCs

Trusted version path: `_upload_document_version_trusted` (quota, insert `document_versions`, bump `documents.current_version`, `_emit_outbox_event('document.document.version_uploaded')`).  
`upload_document_version` remains the PWA wrapper (`auth.uid()`).

Office RPCs: `office_create_session` (authenticated), exchange/content/prepare/upload-target/mark-uploaded/complete/close/conflict-state (`service_role` execute).

Audit: `_office_emit_audit` → `audit_events` (hashes/tokens **not** in payload). Version insert still fires `trg_audit_document_versions`.

## Explicit non-goals verified in SQL

| Risk | Result |
| --- | --- |
| Duplicate Work Product tables (`office_work_products`, etc.) | **Absent** |
| Weaken tenant RLS on `documents` | **Unchanged** |
| Store raw launch token | **Hash only** |
| Desktop service-role | **Not in SQL; desktop never executes these GRANTs** |
| Bypass `document_versions` lifecycle | Complete calls `_upload_document_version_trusted` only |

`MIGRATION_REVIEW_GREEN = YES` means the SQL is acceptable to apply. It does **not** mean it was applied.
