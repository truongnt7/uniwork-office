# Security runtime proof

## Deep link (source + protocol tests; live launch not observed)

Parser rejects `uniwork://office/open?jwt=…`. Launch URL builder emits `uniwork://office/open?token=` only.

**NO_USER_JWT_IN_DEEP_LINK = YES** (source + unit test; live PWA launch **not** captured)  
**NO_SERVICE_ROLE_IN_DEEP_LINK = YES** (no service-role parameter in protocol)

## Desktop

Grep of `apps/shell/src` and `packages/office-bridge*` : no `SERVICE_ROLE`, `postgres://`, `DATABASE_URL`.

**NO_SERVICE_ROLE_IN_DESKTOP = YES**  
**DESKTOP_DIRECT_DB_ACCESS = NO**

## Logging

PWA `open-in-uniwork-office.ts` and `office-bridge.server.ts`: no `console.log` of launch URLs. Desktop client sets `Authorization` on fetch and does not log it.

Adapter verification HTML (`packages/office-bridge-adapter/src/pwa.ts`) sets an Authorization header for the GO-2 double only — not the live PWA.

**SECRETS_IN_RUNTIME_LOGS = NO** (source). Live production logs were not available.

## Cross-tenant / revocation / conflict (runtime)

**BLOCKED** — not executed against the live DB. SQL fixtures in `13_office_bridge_lifecycle.sql` are **not** accepted as this closeout’s runtime proof.

## Failed save recovery

Host keeps `userData/bridge-sessions/` on prepare/complete failure (GO-2). **FAILED_SAVE_RECOVERABLE = BLOCKED** for this closeout (no live failed-save observed).
