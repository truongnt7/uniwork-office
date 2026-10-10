# GO-2 — test matrix

## Session security (`packages/office-bridge-adapter/tests/bridge-matrix.test.ts`)

| Case | Expected |
| --- | --- |
| Valid launch + exchange | PASS |
| Expired launch | `EXPIRED` |
| Replayed launch | `TOKEN_REPLAY` |
| Forged token | fail closed |
| Revoked session download | `SESSION_REVOKED` |
| Cross-tenant Work Product id | `NOT_FOUND`, no title leak |
| Save after membership removal | deny, no new version |
| Duplicate save-complete | one version, `idempotentReplay` |
| Stale base version | `VERSION_CONFLICT` |

## Protocol (`packages/office-bridge/tests/protocol.test.ts`)

Rejects JWT query, file paths, non-`uniwork` schemes.

## GUI (`e2e/office-bridge.spec.ts`)

DOCX: PWA-equivalent session → deep link → Docs edit → Save to UniWork → v2 exists.

XLSX/PPTX GUI save from UniWork is the same desktop path; protocol coverage is in the adapter. Full GUI repeats are optional once DOCX proves the shell host.

PDF: open required; save not in scope.

## GO-1 editor regression

Existing `e2e/docs-edit-save`, `sheets-edit-save`, `slides-edit-save`, `pdf-fit-zoom` must still pass (engines unchanged).
