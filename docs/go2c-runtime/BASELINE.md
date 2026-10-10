# GO-2C runtime closeout — baseline

Captured: 2026-09-14, host macOS.

## SHAs / branches

| Tree | Branch | SHA |
| --- | --- | --- |
| UniWork Office | `main` (tracks `origin/main`) | `11945d6d2b9bd26f655dfd6b9626f6d9469899ad` (GO-1 freeze). GO-2 / GO-2C work is **uncommitted** on top of this SHA. |
| UniWork platform | **NONE** | Extracted zip `uniworkplatform (1).zip` (2026-08-28). **No `.git`**. |

## Targets (non-secret)

| Item | Value |
| --- | --- |
| DATABASE_TARGET | Supabase project `wjqsthhtadtbpophgclg` (`*.supabase.co`). No working DB URL in this workspace. |
| API_TARGET | Live PWA `https://unidigiwork.lovable.app` |
| OFFICE_ENVIRONMENT | Local Office source; `UNIWORK_API_ORIGIN` **unset** |
| Lovable project | `c938c072-6a99-4ce4-bf24-94e5f5e28333` (README) |

## Office git status (related dirty files)

All listed files are GO-2 Office Bridge or GO-2C docs. **UNRELATED_DIRTY_FILES = 0**.

Modified: `.env.example`, `apps/shell/electron-builder.cjs`, `apps/shell/package.json`, `apps/shell/src/main/index.ts`, `apps/shell/src/main/tab-manager.ts`, `e2e/helpers.ts`, `package-lock.json`, `package.json`.

Untracked: `apps/shell/src/main/office-bridge-host.ts`, `docs/go2/`, `docs/go2c/`, `e2e/office-bridge.spec.ts`, `packages/office-bridge*`.

## UniWork platform status

Not a git repository. GO-2C SQL + HTTP + PWA CTA exist in the extract. `node_modules` present from a local `bun install` (not product source).

## Credentials available (names only)

Zip `.env` contains: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID`, LiveKit keys, Vite mirrors.

**Not present:** `DATABASE_URL`, Postgres password, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `UNIWORK_API_ORIGIN`.

REST probe with zip publishable key: **401 Legacy API keys are disabled** (disabled 2026-08-28).

`supabase projects list`: no access token.

Shell: `DATABASE_URL` / `SUPABASE_URL` / `UNIWORK_API_ORIGIN` unset.

## Implication

Runtime closeout cannot apply the migration or execute PWA→Office golden paths against the live origin until a current secret key + DB deploy path and a deployed API build exist.
