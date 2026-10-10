# GO-2 — Office Bridge architecture

UniWork remains the system of record for identity, tenant, workspace, permissions, Work Product metadata, versions, audit, and outbox.

UniWork Office is the editing runtime. It never queries PostgreSQL and never receives `SUPABASE_SERVICE_ROLE_KEY`.

```
UniWork PWA
  → POST /api/office/sessions   (user auth)
  → uniwork://office/open?token=<opaque>
UniWork Office
  → POST /api/office/sessions/exchange
  → GET  /api/office/sessions/:id/content
  → local editor
  → POST /save/prepare  PUT /save/upload  POST /save/complete
UniWork
  → new immutable version + audit + outbox
```

Packages:

| Package | Role |
| --- | --- |
| `@uniwork/office-bridge-contracts` | types, Zod, enums |
| `@uniwork/office-bridge` | desktop client + `uniwork://` parser + temp workspace |
| `@uniwork/office-bridge-adapter` | portable HTTP+domain UniWork must host; in-memory double for tests |

Desktop origin: `UNIWORK_API_ORIGIN` or `app-settings.json` `uniworkApiOrigin` (HTTPS, or loopback HTTP for tests).

Temp files: `<userData>/bridge-sessions/<sessionId>/`. Session credentials stay in memory, never in `meta.json`.
