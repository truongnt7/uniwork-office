# Work Product graph representation

**SUPERSEDED by GO-3A OPTION B.** See `docs/go3a/` and `docs/go3/ARCHITECTURE.md`.
Do not stamp `DOCUMENT.semanticType = WORK_PRODUCT`.

---

# Work Product graph representation (withdrawn Option A)

**Decision: OPTION A** *(invalid against live `/work-products` + `WORK_PRODUCT` nodes)*


Document graph node (`entity_type = DOCUMENT`, `entity_id = documents.id`) carries semantic metadata:

```json
{ "semanticType": "WORK_PRODUCT", "workProductType": "DOCUMENT", "latestVersion": <int> }
```

Physical provenance:

```
Task ──PRODUCES──► Document
Workspace ◄──BELONGS_TO── Document
Person ──CREATED_BY──► Document
```

## Why not OPTION B (WorkProduct node + REALIZED_AS → Document)

- `documents.id` is already the durable identity.
- A second UUID / node would duplicate lifecycle with no independent state.
- GO-3 forbids a parallel `work_products` table.

Application/domain layer still exposes `WorkProductDescriptor` with `type: DOCUMENT` so future types are not assumed to be files.

## Identity

`workProductId = documents.id` (deterministic). Versions never change it.
