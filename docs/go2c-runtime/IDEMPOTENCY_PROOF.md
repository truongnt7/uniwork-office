# Idempotency — live runtime

**IDEMPOTENCY_RUNTIME_GREEN = YES**

After DOCX save complete created version 3 (`versionId=a59b24c5-ac3b-48bc-ae93-81fcfde69c8b`), the same complete body was submitted **twice more**:

`POST /api/office/save/complete` `{sessionId, saveOperationId, idempotencyKey}` with the original operation ids.

| Call | HTTP | version | versionId |
| --- | --- | --- | --- |
| original | 200 | 3 | `a59b24c5-ac3b-48bc-ae93-81fcfde69c8b` |
| replay 1 | 200 | 3 | same |
| replay 2 | 200 | 3 | same |

No extra version number. Second request returned the prior logical result.
