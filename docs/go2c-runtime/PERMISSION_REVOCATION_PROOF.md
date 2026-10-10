# Permission revocation — live runtime

**PERMISSION_REVOCATION_RUNTIME_GREEN = BLOCKED**

Not executed. The controlled user is tenant owner of a new org; no second actor was granted edit then revoked. Share UI was not driven through a revoke + save.

Do not treat owner-only 403s on random UUIDs as revocation proof.

Related (not this gate): unauthenticated `POST /api/office/sessions` → 401 `UNAUTHORIZED`. Foreign document ids → 403 `PERMISSION_DENIED` with no title/filename in the body.
