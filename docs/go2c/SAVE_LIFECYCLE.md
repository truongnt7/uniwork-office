# GO-2C — Save lifecycle

```
PWA POST /api/office/sessions
        → hashed launch token stored on office_sessions
Desktop uniwork:// exchange
        → Office <credential>
GET content
        → RPC authorize + server streams Storage bytes
POST save/prepare
        → revalidate edit, check base version, insert office_save_operations
PUT save/upload
        → server writes bucket `documents` (desktop never sees the bucket URL)
POST save/complete
        → _upload_document_version_trusted
        → real document_versions row
```

Prepare does **not** create a Work Product / document version.

Complete derives tenant, workspace, document, and user from the session row.

PDF prepare/complete → `UNSUPPORTED_FORMAT` / read-only session.

Local Office file remains in `userData/bridge-sessions/` on deny/conflict (GO-2 host); UniWork does not delete it.
