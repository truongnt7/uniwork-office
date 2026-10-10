# GO-3 change manifest

`SOURCE_DIVERGENCE_MAPPED = YES`

Cursor platform = stale zip + GO-3. Lovable live = newer WP MVP + graph `WORK_PRODUCT` already. Do **not** overwrite live WP UI or WEE catalog.

Migration `20260915090000_go3_option_b_work_graph.sql` was **never applied** on Lovable Cloud. It is safe to keep this timestamp (do not rewrite as a new file unless Lovable already created a differently named copy). Do **not** apply from Cursor.

## Test numbering

| Location | Integration tests |
| --- | --- |
| Live Lovable (reported) | stops at `12_harden_sellwork1_guards.sql` |
| Cursor snapshot | `13_office_bridge_lifecycle.sql` (GO-2C), `14_work_product_graph.sql` (Option A stub), `15_go3_option_b_work_graph.sql` (Option B) |

**Decision:** keep destination name `tests/integration/15_go3_option_b_work_graph.sql`. Collision-free vs live 00–12. Numbers 13/14 are Cursor-only (Office / withdrawn Option A) and are **not** part of this GO-3 transfer.

## File classifications

| Path | Change type | Purpose | Dependencies | Baseline | Transfer | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| `supabase/migrations/20260915090000_go3_option_b_work_graph.sql` | NEW_FILE_SAFE_TO_TRANSFER | Option B graph SQL, RPCs, backfill, WP fixture **only if** tables missing | `work_nodes`, `work_edges`, `_emit_outbox_event`, live `work_products` if present | zip graph + live UI | copy as-is | Medium: live CHECK may already include `WORK_PRODUCT` (migration skips replace) |
| `tests/integration/15_go3_option_b_work_graph.sql` | NEW_FILE_SAFE_TO_TRANSFER | Three-state + idempotency + tenant + backfill | `provision_tenant`, `create_document`, `create_task`, WP tables | Cursor 15 | copy as-is | Medium if live WP INSERT columns differ |
| `src/domain/work-graph/go3-mapping.ts` (+ test) | NEW_FILE_SAFE_TO_TRANSFER | REALIZED_AS / PRODUCES map; event aliases | none | new | copy | Low |
| `src/lib/api/work-graph-projector.server.ts` (+ test) | NEW_FILE_SAFE_TO_TRANSFER | RPC wrappers + skip classification | migration RPCs | new vs live | copy if absent | Low |
| `src/routes/api/admin/work-product-graph-backfill.ts` | NEW_FILE_SAFE_TO_TRANSFER | Admin backfill HTTP | admin role, `go3_work_graph_backfill` | new | copy if route absent | Low |
| `src/lib/api/outbox-processor.server.ts` | PATCH_REQUIRES_REBASE | Graph channel for document + WP events | existing drainOutbox | zip; live may have extra handlers | **merge** graph branch; do not replace whole file | High if live processor diverged |
| `src/domain/work-graph/relationship-types.ts` | PATCH_REQUIRES_REBASE | Add `WORK_PRODUCT`, `REALIZED_AS`, WP link rules | live may already have `WORK_PRODUCT` | zip omitted WP | **merge** enums/rules | Medium |
| `src/domain/work-graph/route-resolver.ts` | PATCH_REQUIRES_REBASE / ALREADY_EXISTS_DIFFERENT | `/work-products/:id` | live already has this href | live ahead | add case only if missing | Low |
| `src/lib/api/work-graph.server.ts` | PATCH_REQUIRES_REBASE | Resolve `work_products` rows | live table | zip had no WP case | **merge** `WORK_PRODUCT` switch | Medium |
| `src/lib/api/work-graph.functions.ts` | PATCH_REQUIRES_REBASE | Search WP | live search may exist | zip | **merge** | Medium |
| `src/domain/work-product-semantics/*` + `work-product-semantics.functions.ts` | NEW_FILE_SAFE_TO_TRANSFER | Option B descriptors (not WEE `work-products.functions.ts`) | `work_products` table | zip-only | copy; **do not** replace WEE catalog APIs | Medium naming collision if live reused the path |
| `src/integrations/supabase/types.ts` | PATCH_REQUIRES_REBASE | RPC stubs only | **live types include WP tables zip lacks** | **do not overwrite live types.ts** | add RPCs `project_*`, `go3_work_graph_backfill` if missing | **CONFLICT if full-file copy** |
| `src/lib/architecture/schema-contract-gate.test.ts` | PATCH_REQUIRES_REBASE | NAVIGABLE includes WORK_PRODUCT | live gate may already | zip | merge one assertion | Low |
| `docs/go3a/*` | DOCUMENTATION_ONLY | Architecture authority | none | Cursor | copy | Low |
| `docs/go3/{ARCHITECTURE,VERSION_SEMANTICS,EDGE_MAPPING,EVENT_MAPPING,PROJECTION_ARCHITECTURE,BACKFILL,LIFECYCLE_SEMANTICS,SECURITY,PERFORMANCE_NOTES,TEST_MATRIX,RUNTIME_EVIDENCE,GO3_ACCEPTANCE_REPORT,IMPLEMENTATION_SOURCE_MAP}.md` | DOCUMENTATION_ONLY | Option B docs | go3a | Cursor | copy | Low |
| `supabase/migrations/20260915053000_go3_work_product_graph.sql` | CONFLICT (withdrawn) | Option A DOCUMENT=WP | — | Cursor only | **DO NOT TRANSFER** | Would fight live `WORK_PRODUCT` nodes |
| `tests/integration/14_work_product_graph.sql` | DOCUMENTATION_ONLY stub | Option A withdrawn | — | Cursor | **DO NOT TRANSFER** | — |
| GO-2C `20260914120000_go2c_office_bridge.sql` + office HTTP | out of scope | Office | — | Cursor | **not this handoff** | Would mix GO-2C |

## Option B semantics (must survive merge)

- A: Task → Document only → no WP fabricated  
- B: Task → Work Product only → no Document fabricated  
- C: Task → PRODUCES → WP → REALIZED_AS → Document from live `REFERENCES`/`RELATED_TO`  
- Office writes `document_versions` only  
- `work_units` unchanged  

`GO3_REBASED_ON_CURRENT_SOURCE = PARTIAL`: revalidated against live **client/outbox names**, not a full live source checkout (unavailable).
