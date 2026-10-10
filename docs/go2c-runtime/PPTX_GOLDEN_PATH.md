# PPTX golden path — final runtime

**Status: PASS (live Office HTTP Bridge)**

Document id: `edcc0a03-3782-4699-b574-7dd1fda4f9d1`. File: `go2c-pptx-golden.pptx`.

| Step | Result |
| --- | --- |
| Session create | `format:"PPTX"`, `baseVersion` 1, opaque launch token |
| Download | 200, 4806 bytes, `PK` |
| Controlled edit | one byte flipped in local copy |
| Save complete | **version 2** `ccdbe839-d659-45ab-96e2-4abd3a24b40a` |
| Reopen | `baseVersion` 2, PK, 4806 bytes |

Desktop UniWork Office **0.10.1** later: open `baseVersion` 2 → Save to UniWork → **version 3** → reopen 3. See `DESKTOP_CONTRACT_ALIGNMENT.md`.

| Gate | Result |
| --- | --- |
| PPTX_REAL_OPEN | PASS |
| PPTX_REAL_SAVE_VERSION | PASS |
| PPTX_REOPEN_LATEST | PASS |
