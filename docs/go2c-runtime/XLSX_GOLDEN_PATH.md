# XLSX golden path — final runtime

**Status: PASS (live Office HTTP Bridge)**

Document id: `fa052007-1613-42ba-967a-eada5a6779c7`. File: `go2c-xlsx-golden.xlsx`.

| Step | Result |
| --- | --- |
| Session create | `format:"XLSX"`, `baseVersion` 1, opaque `uniwork://office/open?token=` |
| Download | 200, 1589 bytes, `PK` |
| Controlled edit | one byte flipped in local copy after header |
| Save complete | **version 2** `07ae7d80-d522-4596-adf6-99ba7ad7e54e` |
| Reopen | `baseVersion` 2, PK, 1589 bytes |
| Failed-save retry (later) | complete without PUT → `UPLOAD_NOT_FOUND`; retry PUT+complete → **version 3** `396a060d-07d2-4c6c-9cbe-d6805813b074` |

Desktop UniWork Office **0.10.1** later: open `baseVersion` 3 → Save to UniWork → **version 4/5** → reopen 5. See `DESKTOP_CONTRACT_ALIGNMENT.md`.

| Gate | Result |
| --- | --- |
| XLSX_REAL_OPEN | PASS |
| XLSX_REAL_SAVE_VERSION | PASS |
| XLSX_REOPEN_LATEST | PASS |
