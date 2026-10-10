# Version graph decision

**Decision: no `DOCUMENT_VERSION` graph nodes in GO-3.**

Authoritative history remains `document_versions` (append-only).

Document node `metadata.latestVersion` is **derived**, updated **monotonically** (`GREATEST(existing, incoming)`).

## Why not HAS_VERSION edges per row

- High cardinality (every Office save).
- Existing Work Graph treats versions as source-table truth (`document_versions`), not as first-class entity types.
- Query “which versions?” reads `document_versions` under RLS.

## Lineage

`DERIVED_FROM` between versions is **not** materialized. Version numbers on the source table are enough (`UNIQUE (document_id, version)`).

## Flag

`DOCUMENT_VERSION_GRAPH_PROJECTION = NOT_REQUIRED_BY_MODEL` for version **nodes**. Latest-version **metadata** projection is required (`OFFICE_VERSION_GRAPH_PROJECTION`).
