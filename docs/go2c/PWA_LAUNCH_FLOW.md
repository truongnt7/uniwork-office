# GO-2C — PWA launch flow

Canonical action (one name): **Open in UniWork Office**

- Document detail (`/_authenticated/documents/$id`) — primary, next to download; versions list uses TanStack Query key `["document", id]`.
- Documents workspace editor overflow menu — same action when the selected file is an Office format.

Shown only when the current document resolves to `docx` / `xlsx` / `pptx` / `pdf` (mime or storage object key). Markdown-only docs stay hidden.

## Click path

1. `supabase.auth.getSession()` → user access token (transient; not logged).
2. `POST /api/office/sessions` with `{ workProductId: document.id }` and `Authorization: Bearer <user>`.
3. Response `{ sessionId, launchUrl, expiresAt }`.
4. Invoke `launchUrl` (`uniwork://office/open?token=…`) via a hidden `<a click>`.
5. Launch token is not written to `localStorage`, query cache, or `console`.
6. UI states: `READY` → `OPENING` → timeout `OFFICE_NOT_INSTALLED`, or `SESSION_FAILED` / `UNSUPPORTED_FORMAT` / `PERMISSION_DENIED`.

PDF: CTA still appears. Session is `readOnly`; desktop Save to UniWork stays out of scope.

## After save

No new realtime channel. On `visibilitychange`:

- Detail page invalidates `["document", id]` only.
- Workspace editor refetches the current document row.

## Deep link

Desktop (`apps/shell`) already handles `uniwork://office/open?token=` (GO-2). Token is opaque; no user JWT, tenant id, or storage URL in the URI.
