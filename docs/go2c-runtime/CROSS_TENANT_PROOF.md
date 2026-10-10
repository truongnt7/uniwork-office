# Cross-tenant — live runtime

**CROSS_TENANT_RUNTIME_GREEN = BLOCKED**

A second controlled tenant was **not** created. Spec: if a safe second tenant is unavailable, mark BLOCKED. Do not fake PASS.

Observed (same tenant / unknown ids, not tenant B):

`POST /api/office/sessions` `{documentId}` for UUIDs not owned by GO2C Runtime Tester returned **403** `{ok:false, error:"PERMISSION_DENIED"}` with no document title, mime, or storage key.

That is object-level deny, not a Tenant A vs Tenant B proof.
