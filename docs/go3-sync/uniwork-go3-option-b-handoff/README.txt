UniWork GO-3 Option B handoff
=============================
1. Copy everything under copy/ into the Lovable project at the same relative paths.
2. MERGE files under merge/ into existing Lovable files. Do not blindly overwrite
   outbox-processor, relationship-types, work-graph server/functions, or types.ts.
3. Copy docs/go3 and docs/go3a as listed. Do not take Option A migration
   20260915053000_go3_work_product_graph.sql.
4. Do not replace live /work-products UI or work_units catalog APIs.
5. After files are visible in Lovable, apply the migration and run runtime
   acceptance there — not from Cursor.
