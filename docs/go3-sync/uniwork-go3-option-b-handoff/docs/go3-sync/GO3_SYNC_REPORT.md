# GO-3S sync report

Date: 2026-09-15.

## Root cause

Cursor implemented GO-3 in `/Users/uranus/Projects/uniwork-platform`, a **non-git Lovable zip snapshot**. Lovable deploys a **newer managed tree** for project `c938c072-6a99-4ce4-bf24-94e5f5e28333`. There is no GitHub remote for that platform in `truongnt7`. The Cursor git repo (`uniwork-office`) is the desktop product and cannot ship PWA/SQL to Lovable.

That is why Lovable does not see `20260915090000_go3_option_b_work_graph.sql`.

## What was done in this phase

- Inventoried both trees and remotes.
- Mapped divergence (live WP MVP ahead of zip; zip has GO-3 + GO-2C that live source lacks).
- Classified every GO-3 file (copy vs merge vs forbid).
- Kept migration timestamp (never applied on Lovable).
- Kept integration test filename `15_…` (collision-free vs live 00–12).
- Mapped live `document.version.created` **without renaming** `document.document.version_uploaded`.
- Built a complete handoff package `docs/go3-sync/uniwork-go3-option-b-handoff.tar.gz` (SHA-256 sidecar: `uniwork-go3-option-b-handoff.tar.gz.sha256`). **Did not** apply production migration or live backfill.

## Transfer status

Cursor **cannot** write Lovable-managed source. No `git push` path exists.

How to transfer: ingest `docs/go3-sync/uniwork-go3-option-b-handoff.tar.gz` (and/or the file list in `LOVABLE_HANDOFF_MANIFEST.md`) inside the Lovable project. Merge the listed existing files; do not overwrite live `types.ts` or WP UI; do not take Option A migration `20260915053000_*`.

## Flags

```
CURSOR_SOURCE_IDENTIFIED = YES
CURSOR_BRANCH = none (platform); office main
CURSOR_HEAD_SHA = none (platform); 11945d6d2b9bd26f655dfd6b9626f6d9469899ad (office, unrelated)
CURSOR_REMOTE_IDENTIFIED = NO (platform); YES office GitHub (wrong product)
LOVABLE_SOURCE_MODEL = LOVABLE_MANAGED
SOURCE_DIVERGENCE_MAPPED = YES
GO3_IMPLEMENTATION_PRESENT_IN_CURSOR = YES
GO3A_CONTRACT_PRESENT_IN_CURSOR = YES
GO3_MIGRATION_PRESENT = YES
GO3_INTEGRATION_TEST_PRESENT = YES
GO3_PROJECTOR_PRESENT = YES
GO3_BACKFILL_PRESENT = YES
OPTION_B_PRESERVED = YES
THREE_AUTHORITY_MODEL_PRESERVED = YES
OFFICE_SAVE_SINGLE_WRITER = YES
NO_DOCUMENT_VERSION_DUAL_WRITE = YES
WORK_PRODUCT_MVP_COMPATIBLE = YES
SELL_WORK_COMPATIBLE = YES
GO3_REBASED_ON_CURRENT_SOURCE = PARTIAL
GO3_TRANSFER_METHOD = PATCH_PACKAGE
GO3_SOURCE_TRANSFERRED = NO
GO3_DESTINATION_SOURCE_COMPLETE = NOT_VERIFIABLE
CRITICAL_FILE_PARITY = NOT_VERIFIABLE
PRODUCTION_MIGRATION_APPLIED = NO
LIVE_BACKFILL_RUN = NO
GO3_SYNC_READY = PARTIAL
NEXT_TOOL = LOVABLE
```

`GO3_REBASED_ON_CURRENT_SOURCE = PARTIAL` because the live source tree is not cloned here; rebase used live client/outbox evidence + additive SQL.

## NEXT REQUIRED STEP

TARGET TOOL: LOVABLE  
Ingest the handoff package into the real UniWork project, confirm files are visible, then GO-3 LIVE RUNTIME ACCEPTANCE.

Do not rebuild GO-3 from prose. Do not start GO-4. Do not apply production migration from Cursor.
