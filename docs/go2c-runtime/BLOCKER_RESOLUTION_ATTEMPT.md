# GO-2C runtime — blocker resolution attempt

Rerun: 2026-09-14T13:06:42Z UTC.

## Attempted

| Action | Result |
| --- | --- |
| GitHub `truongnt7` for UniWork PWA remote | Only `uniwork-office`. No `uniworkplatform` / `unidigiwork` repo to push GO-2C routes. |
| `supabase login` / `SUPABASE_ACCESS_TOKEN` | Absent |
| `DATABASE_URL` / service role | Absent |
| Zip `.env` publishable key | Still legacy-disabled (not re-tried REST; keys unchanged) |
| Local Postgres `:5432` | `erp_db` is unrelated ERP Prisma schema — **not** UniWork. Not used. |
| Live `POST /api/office/sessions` | HTTP **404** HTML |
| Live `POST /api/public/hooks/process-outbox` | HTTP **401** (pre-GO-2C API still present) |
| Live `GET /documents` | HTTP 200; **no** “Open in UniWork Office” |
| `UNIWORK_API_ORIGIN` | Unset |

## Not done (would be fake closeout)

- Local `supabase start` fixture as a stand-in for Lovable Cloud
- Applying GO-2C SQL to `erp_db`
- Committing a production URL into Office source
- Marking golden paths PASS from unit tests

## Still required from operators (same four blockers)

1. Deploy extracted UniWork GO-2C HTTP + PWA to an HTTPS origin Office can call.
2. Apply `20260914120000_go2c_office_bridge.sql` with a **current** DB URL or dashboard SQL.
3. Export `UNIWORK_API_ORIGIN` (not committed) to that origin.
4. Provide a non-sensitive test user/workspace so DOCX/XLSX/PPTX + safety proofs can run.
