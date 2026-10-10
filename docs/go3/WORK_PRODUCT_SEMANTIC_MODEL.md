# Work Product semantic model

Work Product is a **semantic abstraction**, not a table.

WEE `work_units` / `src/lib/api/work-products.server.ts` remain **execution contracts**. GO-3 descriptors live in `src/domain/work-product-semantics/` and must not be merged into that catalog.

## Type registry

Runtime supported: `DOCUMENT`.

Future types (`DECISION`, `DASHBOARD`, `DATASET`, `CODE_ARTIFACT`, …) may be added to the TS registry without a schema rewrite and without file fields.

## Document IS_A Work Product

| Descriptor field | Source |
| --- | --- |
| `id` / `workProductId` | `documents.id` |
| `tenantId` | `documents.tenant_id` |
| `workspaceId` | `documents.workspace_id` |
| `type` | `DOCUMENT` |
| `title` | `documents.title` |
| `createdBy` | `documents.created_by` |
| `createdAt` / `updatedAt` | timestamps |
| `artifactRef` | `{ mimeType, sizeBytes }` only — **no** signed URL, storage credentials, Office tokens |

## Version descriptor

From `document_versions`: `id`, `workProductId=document_id`, `versionNumber=version`, `artifactType=DOCUMENT`, `mimeType`, `sizeBytes`, `createdBy=author_id`, `createdAt`. `checksum` omitted (column does not exist). `filename` omitted (not on versions).

## Invariants

- `WORK_PRODUCT_OFFICE_INDEPENDENT`: no Office session fields.
- `WORK_PRODUCT_FILE_INDEPENDENT`: file metadata is optional on the type; only DOCUMENT adapters attach artifact hints.
- Identity stable across `current_version` / new version rows.
