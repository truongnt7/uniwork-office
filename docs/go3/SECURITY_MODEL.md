# Security model

| Rule | How |
| --- | --- |
| No service role in frontend / Office | Unchanged GO-2C. Projector uses server `supabaseAdmin` only. |
| No public projector | `project_document_version_uploaded` / `work_product_graph_backfill` GRANT `service_role` (+ postgres for SQL tests). Authenticated cannot execute. |
| Admin backfill | `POST /api/admin/work-product-graph-backfill` requires Bearer + admin role. |
| Outbox drain | Existing `process-outbox` apikey gate. Graph is an extra channel, not a new public RPC. |
| Cross-tenant | Projector `CROSS_TENANT` skip; `_work_graph_link_system` NULL; `tg_work_edges_validate` raises `WORK_GRAPH_CROSS_TENANT`. PERSON links use tenant-scoped membership (`_work_graph_link_system_in_tenant`). |
| Graph read ≤ source | `get_work_context` is SECURITY INVOKER + `can_view_work_entity`. Document EXISTS requires `deleted_at IS NULL` and RLS on `documents`. Semantic reads use the actor Supabase client. |
| No RLS weakening | No policy changes on `documents` / `document_versions` / Office tables. `outbox_deliveries.channel` CHECK only extended with `graph`. |
| No secrets in graph | Metadata is `{ semanticType, workProductType, latestVersion }` only. No storage paths, signed URLs, Office tokens, checksums, or bodies. |
| Descriptors | Optional `artifactRef.mimeType/sizeBytes` only. |

`NO_RLS_WEAKENING = YES`
