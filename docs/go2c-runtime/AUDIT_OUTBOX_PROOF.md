# Audit / outbox — live runtime

**REAL_AUDIT_RUNTIME_GREEN = BLOCKED**  
**REAL_OUTBOX_RUNTIME_GREEN = BLOCKED**

Office saves completed on the live API (new `document_versions` ids returned by `/api/office/save/complete`). Direct table reads were not possible from this harness:

- PostgREST `/rest/v1/audit_events` and `/outbox_events` returned 401 with user JWT as `apikey`
- PWA Documents history dialog showed **Chưa có lịch sử** / empty access log after DOCX versions 3–4
- No `DATABASE_URL` / service role in this workspace (and none belongs in desktop)

No GO-3 consumer was added. Unit/SQL lifecycle tests are **not** used as this rerun’s audit/outbox proof.
