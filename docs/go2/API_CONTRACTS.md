# GO-2 — API contracts

Portable types live in `@uniwork/office-bridge-contracts`. No React, Electron, or Supabase client.

| Endpoint | Caller | Auth |
| --- | --- | --- |
| `POST /api/office/sessions` | PWA | `Bearer <user>` |
| `POST /api/office/sessions/exchange` | Desktop | none (opaque launch token body) |
| `GET /api/office/sessions/:id/content` | Desktop | `Office <credential>` |
| `POST /api/office/sessions/:id/save/prepare` | Desktop | `Office <credential>` |
| `PUT /api/office/sessions/:id/save/upload` | Desktop | `Office <credential>` |
| `POST /api/office/sessions/:id/save/complete` | Desktop | `Office <credential>` |
| `POST /api/office/sessions/:id/close` | Desktop | `Office <credential>` |

Launch URL: `uniwork://office/open?token=<opaque>`. Never includes JWT, storage URLs, tenant IDs, or keys.

Upload path returned by prepare is always under `/api/office/sessions/…`. Desktop rejects any other upload URL.

Errors: `{ error: { code, message } }` except `409 VERSION_CONFLICT` which returns `{ code, currentVersionId, currentVersionNumber, baseVersionId }`.

Java 21 / Spring later: implement the same HTTP documents; do not depend on Supabase JS.
