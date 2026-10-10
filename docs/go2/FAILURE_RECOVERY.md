# GO-2 — failure recovery

| Failure | Desktop behavior |
| --- | --- |
| Network lost on download | Warning; no editor tab; no partial silent open |
| Network lost on save | Local file remains under `bridge-sessions/`; no endless retry |
| Session expired | `EXPIRED`; local file kept |
| Permission revoked | `SAVE_DENIED` / `NOT_FOUND`; local file kept; no server version |
| Version conflict | Warning; local file kept; user can copy/save locally |
| Desktop crash | Bytes remain in `bridge-sessions/<id>/`; credential is lost (re-open from PWA) |
| Unsupported format | Explicit warning; no conversion |

Local File > Save and **Save to UniWork** are distinct. A successful local save is not a UniWork version.
