# GO-3 event compatibility

Do not rename live events. Map each name to projector behavior.

| Exact event | Seen in | Projector |
| --- | --- | --- |
| `document.document.version_uploaded` | Zip `_upload_document_version_trusted` / Office GO-2C; this snapshot SQL | `project_document_version_uploaded` → DOCUMENT `latestVersion` only. **Not** `work_product_versions`. |
| `document.version.created` | Live outbox (operator). **Absent from this zip** | **Same** DOCUMENT projector. Payload normalized (`document_id` / `documentId`, `version` / `versionNumber`). Name kept. |
| `work_product.work_product.upserted` | GO-3 trigger (best-effort) | `project_work_product_upserted` |
| `work_product.work_product.version_created` | GO-3 version trigger | same WP node, monotonic `latestBusinessVersion` |
| Audit `WORK_PRODUCT_VERSION_CREATED` | Office/document audit **name** | **Not** an outbox graph event; not a write to `work_product_versions` |

User `link_work_entities` is not renamed. `REFERENCES` / `RELATED_TO` involving `WORK_PRODUCT` still drive system `REALIZED_AS` / `PRODUCES`.

Skipped without retry: `CROSS_TENANT`, `NOT_FOUND`, `INVALID_PAYLOAD`, `DELETED_OR_MISSING`, `SOURCE_TABLE_MISSING`.
