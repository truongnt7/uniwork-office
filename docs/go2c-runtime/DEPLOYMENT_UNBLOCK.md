# GO-2C deployment unblock

Attempt: 2026-09-14T13:18Z UTC.

**DEPLOY_ACCESS = NO**  
**A–F not started.** Local Supabase/mocks were not used.

## Access check

| Item | Status |
| --- | --- |
| `DATABASE_URL` / `SUPABASE_DB_URL` | absent |
| `SUPABASE_SERVICE_ROLE_KEY` | absent |
| `SUPABASE_ACCESS_TOKEN` / `supabase login` | absent |
| Lovable deploy token | absent |
| GitHub UniWork PWA repo | none (`truongnt7/uniwork-office` only) |
| Platform `.env` | absent |
| `UNIWORK_API_ORIGIN` | absent |

## Live origin (unchanged)

- `POST https://unidigiwork.lovable.app/api/office/sessions` → **404**
- `GET https://unidigiwork.lovable.app/documents` → 200, **no** Open in UniWork Office

## Mission steps

| Step | Result |
| --- | --- |
| A. Apply `20260914120000_go2c_office_bridge.sql` | **NOT RUN** — no DB credentials |
| B. Deploy GO-2C HTTP + PWA to HTTPS UniWork | **NOT RUN** — no deploy remote/token |
| C. `UNIWORK_API_ORIGIN` env | **NOT SET** — no deployed origin to point at |
| D. Verify live `POST /api/office/sessions` | **FAIL/unchanged** — 404 |
| E. Verify documents CTA | **FAIL/unchanged** — CTA absent |
| F. Stop | Stopped here |

## Operator inputs required before A–F

1. Current Postgres URI or Supabase dashboard SQL for project `wjqsthhtadtbpophgclg` (or the actual target).
2. Ability to ship the extracted UniWork tree (with `src/routes/api/office/*` and the Documents CTA) to `unidigiwork.lovable.app` or another HTTPS UniWork origin.
3. After that origin serves `/api/office/sessions`, set `UNIWORK_API_ORIGIN` in the Office runtime environment only.

`GO2C_READY` remains **PARTIAL**. Golden paths were not run (and must not be marked PASS). GO-3 was not started.
