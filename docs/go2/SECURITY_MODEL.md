# GO-2 — security model

Threats and mitigations:

| Threat | Mitigation |
| --- | --- |
| Stolen deep link | Opaque 256-bit token, ~3 min TTL, single-use exchange |
| Token in browser history | Short TTL; hash stored server-side, not the raw token |
| Guessed session id | Download/save require Office credential, not id alone |
| User JWT in URL | Parser rejects `jwt` / JWT-shaped tokens |
| Service role on desktop | Never shipped; desktop is an untrusted client |
| Direct DB access | No Postgres/Supabase clients in Office Bridge packages |
| Cross-tenant id | Generic `NOT_FOUND`, no metadata leak |
| Replay exchange | `TOKEN_REPLAY` after first use |
| Save retry | `saveOperationId` idempotency |
| Stolen temp file | `userData/bridge-sessions`, mode 0700/0600; credential not on disk |
| Logs | Tokens, credentials, signed URLs, and document bytes must not be logged |

Launch token TTL: **180 seconds** (`LAUNCH_TOKEN_TTL_MS`).

Office session credential TTL: 8 hours (not placed in the URL).

Production API origin must be HTTPS. Loopback HTTP is allowed only for local tests.
