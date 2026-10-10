# Cursor source inventory (GO-3S)

Captured: 2026-09-15.

## Why Cursor and Lovable disagree

GO-3 was implemented in a **local unzip of a Lovable export**, not in the git tree Lovable deploys.

| Tree | Absolute root | Git? | What it is |
| --- | --- | --- | --- |
| UniWork **platform** (GO-3 code) | `/Users/uranus/Projects/uniwork-platform` | **No** (`.git` absent) | Zip extract `uniworkplatform (1).zip` (~2026-08-28) plus later Cursor GO-2C/GO-3 files |
| UniWork **Office** (this Cursor workspace git repo) | `/Users/uranus/Projects/uniwork-office` | Yes | Desktop fork. Contains GO-3 **docs only**, not the PWA/SQL implementation |

Lovable inspects the **platform** project `c938c072-6a99-4ce4-bf24-94e5f5e28333`. Cursor’s git `status` is the **Office** repo. Those are different products.

## Office git (Cursor workspace)

| Field | Value |
| --- | --- |
| Root | `/Users/uranus/Projects/uniwork-office` |
| Branch | `main` (not detached) |
| HEAD | `11945d6d2b9bd26f655dfd6b9626f6d9469899ad` |
| Tracking | `origin/main` |
| `origin` | `https://github.com/truongnt7/uniwork-office.git` |
| `upstream` | `https://github.com/genspark-ai/genoffice.git` |
| GO-3 implementation committed? | **No** (platform files are outside this repo) |
| Pushed? | N/A for GO-3 platform code |

Dirty Office files are GO-2/GO-2C desktop work, not GO-3 SQL/projector.

## Platform tree (canonical GO-3 implementation)

| Field | Value |
| --- | --- |
| Root | `/Users/uranus/Projects/uniwork-platform` |
| Branch | **none** |
| HEAD SHA | **none** |
| Remotes | **none** |
| `.lovable/project.json` | template `tanstack_start_ts_2026-06-08` |
| README live app | `https://unidigiwork.lovable.app` |
| README Lovable project | `https://lovable.dev/projects/c938c072-6a99-4ce4-bf24-94e5f5e28333` |

## GO-3 files present in Cursor platform tree

| Present | Path |
| --- | --- |
| YES | `/Users/uranus/Projects/uniwork-platform/supabase/migrations/20260915090000_go3_option_b_work_graph.sql` |
| YES | `/Users/uranus/Projects/uniwork-platform/tests/integration/15_go3_option_b_work_graph.sql` |
| YES | `/Users/uranus/Projects/uniwork-platform/docs/go3/` |
| YES | `/Users/uranus/Projects/uniwork-platform/docs/go3a/` |
| YES | `/Users/uranus/Projects/uniwork-platform/src/lib/api/work-graph-projector.server.ts` |
| YES | `/Users/uranus/Projects/uniwork-platform/src/routes/api/admin/work-product-graph-backfill.ts` |
| YES | `/Users/uranus/Projects/uniwork-platform/src/domain/work-graph/go3-mapping.ts` (`REALIZED_AS`) |
| YES | `/Users/uranus/Projects/uniwork-platform/src/domain/work-graph/relationship-types.ts` (`WORK_PRODUCT`, `REALIZED_AS`) |
| DO NOT TRANSFER | `/Users/uranus/Projects/uniwork-platform/supabase/migrations/20260915053000_go3_work_product_graph.sql` (withdrawn Option A) |

Office mirrors docs only: `/Users/uranus/Projects/uniwork-office/docs/go3/` and `docs/go3a/`.
