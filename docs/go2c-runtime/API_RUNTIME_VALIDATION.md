# GO-2C runtime — API validation

**REAL_API_ORIGIN_CONFIGURED = NO**  
**REAL_API_CONNECTIVITY = BLOCKED**  
**PWA_POST_OFFICE_SESSION_REAL = NO** (live origin)

## Configuration

Office reads `UNIWORK_API_ORIGIN` or `app-settings.json` `uniworkApiOrigin`. No production URL is hard-coded in source (required).  
Process env `UNIWORK_API_ORIGIN` was **unset**. No staging/production profile was written into the repo.

`OFFICE_ENV`: local source  
`UNIWORK_API_ORIGIN_HOST`: **unset**

Intended host (not configured): `unidigiwork.lovable.app`

## Live probes (2026-09-14)

| Request | First closeout | Rerun 13:06:42Z |
| --- | --- | --- |
| `GET /` | 200 UNIWORK | (not re-fetched) |
| `POST /api/office/sessions` | **404** HTML | **404** HTML |
| `POST /api/public/hooks/process-outbox` | **401** | **401** |
| `GET /documents` | — | 200, no Office CTA |

Homepage HTML did not contain an Office launch string.

Conclusion: TLS to the real PWA works. The **GO-2C Office HTTP contract is not on that origin**. Desktop pointed at this host would fail session create/exchange. Local GO-2 adapter is not used as a substitute for this closeout.

PWA CTA and `POST /api/office/sessions` exist in the **extracted platform source**, not on the live Lovable deployment.
