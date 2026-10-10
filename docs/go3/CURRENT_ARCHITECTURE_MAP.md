# GO-3 — Current architecture map

Inspected: `/Users/uranus/Projects/uniwork-platform` (Lovable/TanStack Start; not a git repo) and live GO-2C Office contract (immutable). UniWork Office desktop is a separate repo and is **not** modified in GO-3.

## Persistence (authoritative)

| Domain | Table | Path / notes |
| --- | --- | --- |
| Document identity | `public.documents` | `id, tenant_id, workspace_id, title, mime_type, size_bytes, storage_ref, current_version, created_by, updated_by, deleted_at, created_at, updated_at`. No `file_name` column (Office derives name). |
| Immutable versions | `public.document_versions` | `id, document_id, tenant_id, version, storage_ref, mime_type, size_bytes, author_id, comment, created_at`. UNIQUE `(document_id, version)`. Trigger `tg_document_versions_immutable` blocks UPDATE/DELETE. |
| Work Graph nodes | `public.work_nodes` | UNIQUE `(tenant_id, entity_type, entity_id)`. `metadata jsonb`. entity_type CHECK: `TENANT, WORKSPACE, TASK, PERSON, MEETING, CHAT_CHANNEL, DOCUMENT, EMAIL, MEETING_ARTIFACT`. |
| Work Graph edges | `public.work_edges` | UNIQUE `(tenant_id, source_node_id, target_node_id, relationship_type)`. `origin` ∈ `SYSTEM, USER, AI_SUGGESTED`. Cross-tenant insert raises `WORK_GRAPH_CROSS_TENANT`. |
| Relationship registry | `public.work_relationship_types` | PK `(code, source_type, target_type)`. `user_creatable` / `system_creatable`. |
| WEE “Work Product” | `public.work_units` | **Economics/contract catalog**, not a document. `src/lib/api/work-products.server.ts`. Do **not** conflate with GO-3 deliverable semantics. |
| Office session (GO-2C) | `office_sessions`, `office_save_operations` | Integration only. Do not project as graph nodes. |
| Meeting Intelligence outputs | `public.meeting_artifacts` | Kind SUMMARY/DECISION/ACTION_ITEM/… **not** `documents`. |
| Tasks | `public.tasks` | `tenant_id, workspace_id, title, deleted_at, created_by, …`. **No `document_id`**. |
| Meetings | `public.meetings` | `tenant_id, workspace_id, …`. |
| Email | `public.email_threads` | |
| Chat | `public.chat_channels` | |
| AI execution | `public.ai_task_executions` | No `document_id` FK. |
| Identity | `public.users`, `public.tenant_members` | PERSON graph nodes use `users.id`. |
| Audit | `public.audit_events` | |
| Outbox | `public.outbox_events` | `_emit_outbox_event`; unique `(event_type, idempotency_key)`. |
| Outbox deliveries | `public.outbox_deliveries` | channels `email, push, webhook, noop, graph`. |

**No** `work_products` / `work_product_versions` document tables exist. Do not create them.

## Graph services / RPCs

| Piece | Location |
| --- | --- |
| Vocabulary (TS) | `src/domain/work-graph/relationship-types.ts` |
| Resolve display | `src/lib/api/work-graph.server.ts` |
| Server fns | `src/lib/api/work-graph.functions.ts` (`getWorkContext`, `linkWorkEntities`, `unlinkWorkEntities`) |
| `get_work_context` | SQL in `supabase/migrations/20260816014508_9c7c02ab-7e54-483d-9109-24b796e6bd11.sql` |
| `link_work_entities` / `unlink_work_entities` | same |
| `_work_graph_link_system` | service_role; idempotent ON CONFLICT |
| `work_graph_backfill` | existing domain backfill (workspace BELONGS_TO, assignees, …) |
| Project triggers | `tg_work_graph_project_document` (DOCUMENT → WORKSPACE `BELONGS_TO`; **deletes node** when `deleted_at` set) |

## Existing document-related edges (registry)

| Code | Source → Target | User? | Meaning today |
| --- | --- | --- | --- |
| `BELONGS_TO` | DOCUMENT → WORKSPACE | system | Auto on document insert |
| `ATTACHED_TO` | DOCUMENT → TASK / MEETING / WORKSPACE | user | Manual attach |
| `REFERENCES` | TASK → DOCUMENT | user | Manual reference |
| `GENERATES` | MEETING → DOCUMENT | system | Registered; **not** auto-filled from `meeting_artifacts` |
| `RELATED_TO` | MEETING → DOCUMENT, DOCUMENT → DOCUMENT | user | Weak link |

GO-3 adds system `PRODUCES` (TASK→DOCUMENT) and `CREATED_BY` (PERSON→DOCUMENT). **No** `HAS_VERSION` / `DOCUMENT_VERSION` entity type (see `VERSION_GRAPH_DECISION.md`).

## Outbox

- Office / document version: `document.document.version_uploaded` payload `{document_id, version, author_id, size_bytes}` (`_upload_document_version_trusted`, GO-2C migration `20260914120000_go2c_office_bridge.sql`).
- Dispatcher: `POST /api/public/hooks/process-outbox` (`src/routes/api/public/hooks/process-outbox.ts`) → `drainOutbox` (`src/lib/api/outbox-processor.server.ts`).
- GO-3 consumer: `document.document.version_uploaded` → `projectDocumentVersionUploaded` (`channel=graph`). RPC `project_document_version_uploaded` (service_role). Admin replay: `POST /api/admin/work-product-graph-backfill`.
- Fan-out still: push, email, webhooks. **No second event system.**

## RLS (graph)

- `work_nodes` SELECT: `is_tenant_member(tenant_id) AND can_view_work_entity(entity_type, entity_id)`.
- DOCUMENT visibility: `documents.deleted_at IS NULL` inside `can_view_work_entity`.
- Edges SELECT require both endpoint nodes visible.
- User inserts only `origin = 'USER'` and `user_creatable` registry rows.

## Document ↔ Task source model

There is **no** `documents.task_id`. The only source-backed Task↔Document link is **Work Graph user edges** (`ATTACHED_TO` / `REFERENCES`). GO-3 must project `PRODUCES` from those edges, not invent task ownership.

## Meeting → Document

Meeting Intelligence persists **`meeting_artifacts`**, not `documents`. `GENERATES MEETING→DOCUMENT` is unused unless a document is actually attached. **Do not rewrite Meeting Intelligence.**

## AI execution → Document

No source FK from `ai_task_executions` to `documents`. **BLOCKED_BY_SOURCE_MODEL.**

## UI / routes

- Documents PWA: `src/lib/api/documents.functions.ts`, `src/routes` documents.
- Office: `src/routes/api/office/*` + `src/lib/office/*` — **GO-2C immutable**.
- Semantic query: `src/lib/api/work-product-semantics.functions.ts` (`listWorkProductsForEntity`, `getWorkProductDescriptor`). Distinct from WEE `work-products.functions.ts`.
- Existing `work-products` UI/server = WEE contracts (`work_units`), not documents.

## Indexes (graph)

- `work_nodes (tenant_id, entity_type, entity_id)` unique
- `work_nodes_workspace_idx`
- `work_edges (tenant_id, source_node_id)`, `(tenant_id, target_node_id)`, `(tenant_id, relationship_type)`
- `document_versions (document_id, version DESC)`
