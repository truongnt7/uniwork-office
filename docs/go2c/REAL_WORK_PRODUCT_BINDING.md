# GO-2C — Real Work Product binding

Office `workProductId` is the UniWork **document id**.

On save complete the server:

1. Authenticates the Office session (credential hash; not a user JWT from desktop).
2. Revalidates `_office_can_edit_document` for the **session user** (not a client-supplied tenant).
3. Verifies `base_version_id` is still the latest `document_versions` row.
4. Replays `office_save_operations` if the same `saveOperationId` already completed.
5. Confirms the uploaded object (checksum/size) was marked received.
6. Calls `_upload_document_version_trusted(session.user_id, document_id, storage_ref, …)`.
7. Inserts the next immutable `document_versions` row (`current_version + 1`).
8. Updates `documents.current_version`, `storage_ref`, `mime_type`, `size_bytes`.
9. Existing trigger writes `document.version_added` to `audit_events`.
10. `_emit_outbox_event(..., 'document.document.version_uploaded', ...)`.
11. Additional office audit events: `WORK_PRODUCT_VERSION_CREATED`, `OFFICE_SAVE_COMPLETED`.
12. Returns `{ workProductId, versionId, versionNumber, checksumSha256, idempotentReplay }`.

PWA `uploadDocumentVersion` still calls `upload_document_version`, which is now a thin `auth.uid()` wrapper around the same trusted function.

No parallel Office document table. No ad-hoc `supabase.from('document_versions').insert` from the Office API.
