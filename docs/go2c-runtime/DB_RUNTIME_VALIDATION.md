# GO-2C runtime — DB validation

**DB_RUNTIME_VALIDATION = BLOCKED**  
**MIGRATION_APPLIED = NO**

## Attempted apply

Established UniWork method: Lovable Cloud Postgres + `psql` (`scripts/integration-tests.sh`) or Supabase dashboard SQL.

Blockers:

1. No `DATABASE_URL` / DB password in workspace or zip `.env`.
2. Zip publishable/anon key rejected: **Legacy API keys are disabled** (2026-08-28).
3. `supabase` CLI: no `SUPABASE_ACCESS_TOKEN` / `supabase login`.
4. Cannot inspect `office_sessions` on `wjqsthhtadtbpophgclg.supabase.co`.

`RESULT`: not applied. `APPLIED_AT`: n/a.  
`MIGRATION_NAME`: `20260914120000_go2c_office_bridge.sql` (local only).  
`TARGET_ENVIRONMENT`: intended `wjqsthhtadtbpophgclg` / Lovable Cloud — **not reached**.

## Not verified on deployed DB

office session tables, indexes, RLS, RPC execute grants, FKs, idempotency rows, conflict `FOR UPDATE`.

Do not treat local SQL file presence as `MIGRATION_APPLIED`.
