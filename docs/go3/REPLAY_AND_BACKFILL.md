# Replay and backfill

RPC: `work_product_graph_backfill(_tenant_id, _limit)`  
HTTP: `POST /api/admin/work-product-graph-backfill`  
Auth: Bearer token + `user_roles.role = admin`. **Not public.** service_role execute only.

## Behavior

1. Tenant required. Limit clamped 1..2000.
2. For each non-deleted `documents` row in the tenant: `_touch_document_work_product_node` (DOCUMENT node, workspace BELONGS_TO, CREATED_BY if `created_by` is a member of **this** tenant).
3. Re-project `PRODUCES` / `GENERATES` from existing user `ATTACHED_TO` / `REFERENCES` edges only.

## Rules

- Does **not** UPDATE/DELETE `documents` or `document_versions`.
- Does **not** invent Task / Meeting / Project / AI Execution links.
- Idempotent: unique node/edge constraints; second run duplicates = 0.
- Historical documents with unknown origin remain workspace + creator only.

## Observability

Response: `{ ok, tenantId, documentsProjected }`. No document bodies in logs.
