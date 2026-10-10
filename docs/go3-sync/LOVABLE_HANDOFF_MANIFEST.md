# Lovable handoff manifest

Canonical GO-3 Option B patch. Apply **this set**, not prose rebuild.

Package tarball (created beside these docs):

`/Users/uranus/Projects/uniwork-platform/docs/go3-sync/uniwork-go3-option-b-handoff.tar.gz`  
Archive SHA-256 is recorded after packaging in `uniwork-go3-option-b-handoff.tar.gz.sha256` (not inside the archive).

All SOURCE PATH roots are `/Users/uranus/Projects/uniwork-platform/`. DESTINATION PATH is the same relative path in the Lovable project.

## Must receive (copy)

| SOURCE PATH | DESTINATION PATH | SHA-256 | PURPOSE | DEPENDENCIES |
| --- | --- | --- | --- | --- |
| `supabase/migrations/20260915090000_go3_option_b_work_graph.sql` | same | `ba33ef49df976857dfa76efcc133acc43ce09a1fe2d1bde1344af864b132733f` | Option B migration (never applied; timestamp OK) | existing `work_nodes`/`work_edges`/`_emit_outbox_event` |
| `tests/integration/15_go3_option_b_work_graph.sql` | same | `bb74e60ca756b6a3cb65a76537a32df16bcb0758ec69e9630aa66244de521604` | Canonical integration test | helpers, documents, tasks, `work_products` |
| `src/domain/work-graph/go3-mapping.ts` | same | `89155bf29a5978cdadc338c5ae5c4a568021688cfef5ed934f9bcf739a0db783` | REALIZED_AS / event aliases | none |
| `src/domain/work-graph/go3-mapping.test.ts` | same | `61f149ee98c4f4f9b9eaff18187a2366552899e31efd607a09c72de607be9655` | Unit tests | mapping |
| `src/lib/api/work-graph-projector.server.ts` | same | `026c73a449d387bd68a650320f568ba55171854b9afc2afafed4aae601649455` | Projector RPC client | migration RPCs |
| `src/lib/api/work-graph-projector.server.test.ts` | same | `202f91b3c599773842e2f01aeb58e654d54b9ff75d12ab49e30a7e447e07c77b` | Projector unit tests | projector |
| `src/routes/api/admin/work-product-graph-backfill.ts` | same | `e03f43c3699b2272d77714756b3359402c8247670798f2999c385c04ff27959f` | Admin backfill route | projector, admin role |
| `docs/go3a/CANONICAL_OWNERSHIP_DECISION.md` | same | `3abfbce2c653be9c1ef9d804b01565d7a6b8927d18a062f86eff458c7ddacf59` | GO-3A authority | — |
| `docs/go3a/CURRENT_WORK_PRODUCT_MODEL_MAP.md` | same | `c71dc009d168b1b54370f584d7f070b09ba5f1b4e77d054bfef771761d852964` | GO-3A authority | — |
| `docs/go3a/GO3A_ACCEPTANCE_REPORT.md` | same | `97f1c95792b24945813f2e28aec715cb2aac98bf574002a1f8008ca97c958c46` | GO-3A authority | — |
| `docs/go3a/GO3_IMPLEMENTATION_CONTRACT.md` | same | `deb8163451df4a460ad3a0a548549379f1998255df622ebe03097283301f4f5a` | GO-3A contract | — |
| `docs/go3a/GRAPH_NODE_RECONCILIATION.md` | same | `1210f955d17ed01cd34a28f2cabbc195c0a0e7100fffb0f1b005c80d176c88f9` | GO-3A authority | — |
| `docs/go3a/RECONCILIATION_PLAN.md` | same | `fac4a24f3267c4d15cbc0fcf716de6cae64af8a498f1184fce9aa7da728d568f` | GO-3A authority | — |
| `docs/go3/ARCHITECTURE.md` | same | `5e2ab6f1ca5d49671157849d0f728cc977eeeaee4c300a184059b79f99195167` | Option B architecture | go3a |
| `docs/go3/IMPLEMENTATION_SOURCE_MAP.md` | same | `5649d8823e6ab2e89141bf1870c66f9d1b35a4a1661c62c26a96fc804945f120` | Source map | go3a |
| `docs/go3/VERSION_SEMANTICS.md` | same | `8b67a2e8608429e91bfe6e59d03397951d1a03e898d5c1e66ee6821cc481b6b1` | Two version axes | — |
| `docs/go3/EDGE_MAPPING.md` | same | `1ff94a0fe8f1667e7e82c21f04d6b066a9a3bcaad92444c3260f509871f3a32c` | REALIZED_AS / PRODUCES | — |
| `docs/go3/EVENT_MAPPING.md` | same | `9082befd0d88ab995dd5c2477a972d3f99ea1cd1d1c49032756d3c1d65e2f670` | Outbox map | — |
| `docs/go3/PROJECTION_ARCHITECTURE.md` | same | `ce636b2992900b56e7f44ae8ab6b90e457bd59b14ab0996a0b733238c2c694f7` | Projector | — |
| `docs/go3/BACKFILL.md` | same | `1720beb8adde210cbc8b5cd30882ed727da16f6256e75a9aa8efb64e4fdf83dc` | Backfill | — |
| `docs/go3/LIFECYCLE_SEMANTICS.md` | same | `086a798818f629b049b9465efccd31ad5f1f652cec94512878ac0a480f1040e6` | Lifecycle | — |
| `docs/go3/SECURITY.md` | same | `6c6d500559d768edae4c7c8f95ee2eddf971028607d35fada2ce6ee8d5d5e331` | Graph RLS | — |
| `docs/go3/PERFORMANCE_NOTES.md` | same | `579ec62900c1c2640575a19f83e973ab81f587373a52f3915793971062e47bda` | Bounds | — |
| `docs/go3/TEST_MATRIX.md` | same | `8f350f8f723ae2a437cbdd58d75536eea55f7f0229d0ac706ecf0fa97e4d588f` | Tests | — |
| `docs/go3/RUNTIME_EVIDENCE.md` | same | `df544566c2d2a0a2b42a92e0fb25224db44234db0ee32f79c8429ed61c585216` | Evidence | — |
| `docs/go3/GO3_ACCEPTANCE_REPORT.md` | same | `0975333c54e153c546cb7f873e06bd9d968644bb3975bbd40c699f37ffa56630` | Acceptance | — |
| `docs/go3-sync/` (this folder except tarball optional) | same | see files | Sync reports | — |

Optional new semantics helpers (copy if paths free):

| SOURCE PATH | SHA-256 | Notes |
| --- | --- | --- |
| `src/domain/work-product-semantics/*` | see inventory | Do not replace WEE `src/lib/api/work-products.functions.ts` |
| `src/lib/api/work-product-semantics.functions.ts` | `3605e0ecde5021ab5d5738b0e1584f1e0488082f2cd4eb796d98655b54cebd4a` | Graph read helper |

## Must merge (do not overwrite live)

| SOURCE PATH | SHA-256 | Merge rule |
| --- | --- | --- |
| `src/lib/api/outbox-processor.server.ts` | `3bd87a95edd66db92e9db4633338a375b1f1164942c0c940bea1c8b7ccb6a9e9` | Keep live handlers; add graph projection for `document.document.version_uploaded`, `document.version.created`, WP events |
| `src/domain/work-graph/relationship-types.ts` | `6f2461635eefe38425f36a255d59b5a1cbc9533062b142d429d996c36b7e3cf7` | Add `WORK_PRODUCT`, `REALIZED_AS`, WP REFERENCES/RELATED_TO, PRODUCES TASK/MEETING→WP |
| `src/domain/work-graph/route-resolver.ts` | `6baa3be20df3b5f90a63a3de50735c4aac2024c8e4eba296ff2d90d76dd0129f` | Ensure `WORK_PRODUCT` → `/work-products/:id` |
| `src/lib/api/work-graph.server.ts` | `3914e78dd1c7874ec55403c48f3fa92dc9b4b212699e9bb4e0e4f0c3bdb4280c` | Resolve `from("work_products")` |
| `src/lib/api/work-graph.functions.ts` | `36198436769743f4e621600e545926a6198ca7247612c07193a72b82d5c0df82` | Search WORK_PRODUCT |
| `src/lib/architecture/schema-contract-gate.test.ts` | `c79b68eaef46c3cc8c9c592ef724122fc335fec4ba229d30cdc4c29231b2ab9a` | NAVIGABLE includes WORK_PRODUCT |
| `src/integrations/supabase/types.ts` | n/a — **do not copy file** | Add RPCs only: `project_document_version_uploaded`, `project_work_product_upserted`, `go3_work_graph_backfill` |

## Must not receive

- `supabase/migrations/20260915053000_go3_work_product_graph.sql`
- `tests/integration/14_work_product_graph.sql`
- GO-2C Office migration/HTTP (separate phase)
- Full zip `types.ts` (would delete live `work_products` typings)

## After Lovable ingest

Verify destination lists the migration, test 15, projector, backfill route, `docs/go3/`, `docs/go3a/`, and `REALIZED_AS`. Then — not from Cursor — apply migration and run live acceptance.
