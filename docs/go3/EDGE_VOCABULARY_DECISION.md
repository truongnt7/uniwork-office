# Edge vocabulary decision

Reuse the existing registry. Add only two system codes that nothing else expresses.

| Concept | Canonical code | Source → Target | Origin | Notes |
| --- | --- | --- | --- | --- |
| Workspace contains document | `BELONGS_TO` | DOCUMENT → WORKSPACE | SYSTEM | Already projected |
| Task produced document | **`PRODUCES` (new)** | TASK → DOCUMENT | SYSTEM | Projected from user `ATTACHED_TO` DOCUMENT→TASK or `REFERENCES` TASK→DOCUMENT |
| Meeting produced document | `GENERATES` | MEETING → DOCUMENT | SYSTEM | Reuse; only if a **document** is attached (`ATTACHED_TO` DOCUMENT→MEETING). Not from `meeting_artifacts`. |
| Creator | **`CREATED_BY` (new)** | PERSON → DOCUMENT | SYSTEM | From `documents.created_by` when set |
| Manual attach | `ATTACHED_TO` | DOCUMENT → TASK/MEETING | USER | Source fact; remains user-visible |
| Weak / user links | `REFERENCES`, `RELATED_TO` | existing | USER | Unchanged |

**Not added:** `GENERATED`, `GENERATED_DOC`, `CREATED_DOCUMENT`, `PRODUCED_FILE`, `OUTPUT_OF`, `HAS_VERSION`.

`PRODUCES` is not user-creatable (avoids duplicate user vocab). Users keep attaching via `ATTACHED_TO`.
