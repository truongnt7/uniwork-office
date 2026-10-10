# Lovable source boundary

## Confirmed model

`LOVABLE_SOURCE_MODEL = LOVABLE_MANAGED` (exported snapshot locally; **no GitHub connection found**).

| Signal | Evidence |
| --- | --- |
| Project id | `c938c072-6a99-4ce4-bf24-94e5f5e28333` |
| Live origin | `https://unidigiwork.lovable.app` |
| Supabase | `wjqsthhtadtbpophgclg` |
| Editor | README: continue in Lovable; “every change made in Lovable is committed straight to this repository” |
| Local git for that repository | **Missing**. Platform tree has no `.git`, no origin URL filled in (`git clone <this-repository-url>` placeholder) |
| GitHub search (`truongnt7`, `c938c072`, `unidigiwork`) | **No** connected UniWork platform repo |
| Office GitHub | `truongnt7/uniwork-office` — **not** the PWA Lovable deploys |

Not A (GitHub connected). Not D (same branch as Office). Closest to **B + C**: Lovable-managed git inside Lovable Cloud, with Cursor holding an older **exported snapshot**.

## How source actually flows

```
Lovable editor  ──deploys──►  unidigiwork.lovable.app
        │
        └── export zip ──►  /Users/uranus/Projects/uniwork-platform  (stale vs live)
                                      │
                                      └── Cursor GO-3 edits (never round-tripped)
```

There is **no** `git push` from Cursor that Lovable will receive.

Cursor cannot write Lovable-managed source from this environment. Transfer must be a **complete patch package** applied inside Lovable (or after connecting GitHub to this project).

## Live vs snapshot (already mapped in GO-3A)

Live PWA has `/work-products`, `WORK_PRODUCT` graph hrefs, `work-deliverables.functions`. This zip has **no** `src/routes/_authenticated/work-products*`. `types.ts` has **no** `work_products` table. Zip integration tests originally ended at `12_harden_sellwork1_guards.sql`; 13/14/15 exist only in this Cursor snapshot.
