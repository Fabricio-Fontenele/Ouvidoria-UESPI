# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

Backend core for the Institutional Ombudsman System (UESPI). Scope is intentionally limited to the **domain** and **application** layers — no HTTP, ORM, DB, queues, or external integrations live here. Business rules must stay traceable to the PRD, Cockburn use cases, and feature specs under `doc/`.

`AGENTS.md` contains the canonical contributor handbook (architecture rules, naming, commit policy). Read it when in doubt — this file complements it with Claude-specific notes.

## Commands

Package manager is **pnpm 10** (Node 22).

- `pnpm build` — clean and emit JS into `build/` via `tsconfig.build.json`
- `pnpm type:check` — typecheck `src/` + `test/` against `tsconfig.test.json`
- `pnpm type:check:ts7` — adds `--stableTypeOrdering` for the TS 7 migration check
- `pnpm lint` / `pnpm lint:ci` — ESLint (CI variant fails on warnings)
- `pnpm format` / `pnpm format:check` — Prettier
- `pnpm test` — Vitest single run
- `pnpm test:watch` / `pnpm test:coverage` — watch / coverage modes
- `pnpm check` — full local gate: format check → lint → type-check → tests

Single test: `pnpm vitest run test/unit/application/sign-in-use-case.spec.ts`

## Architecture

Clean-architecture layering with two layers currently materialized:

- `src/domain/` — entities (`Entity` base, `Manifestation`, `User`, `ManifestationMessage`) and value objects (`Email`, `Password`, `Protocol`, `UniqueEntityId`, etc.). Must remain pure: no framework, DB, env, or network code.
- `src/application/` — use cases, plus _contracts_ (interfaces) for everything infrastructural:
  - `repositories/` — e.g. `ManifestationsRepository`, `UsersRepository`, `ManifestationInteractionsRepository`, `PaginationParams`
  - `cryptography/` — `HashComparer`, `PasswordHasher`
  - `auth/` — `TokenGenerator`
  - `protocol/` — `ProtocolGenerator`
  - `dto/` — query-side DTOs (e.g. `manifestation-query-dtos.ts`)
  - `use-cases/<feature>/` — each feature folder owns the use case class plus an `errors/` subfolder for domain-specific error types

Every use case implements `UseCase<Input, Output>` (`src/application/use-cases/use-case.ts`) with a single `execute(input)` method. Dependencies arrive through the constructor as the contract interfaces above — never as concrete adapters.

Tests in `test/unit/` mirror the production tree. Mocking uses `vitest-mock-extended` against the contract interfaces; do **not** introduce real DBs, HTTP servers, or concrete crypto/JWT libs in unit tests.

### Domain vocabulary

Use these names consistently — do not introduce parallel terms like `ticket`, `issue`, or `request`:

- `User` (roles: `manifestant`, `ombudsman`, `admin`)
- `Manifestation`, `Protocol`, `Attachment`
- `ManifestationType`: `report` | `complaint` | `suggestion` | `compliment`
- `ManifestationStatus`: `in_analysis` | `answered` | `canceled` | `finalized`

Entities should expose **behavior** (e.g. `Manifestation.canReceiveMessages()`, `belongsTo()`, `isAnonymous()`), and use static factories like `Manifestation.open(...)` / `Manifestation.restore(...)` rather than public constructors.

### Aggregate-driven status transitions

Status transitions live on the aggregate, not in the use case. Each transition is a method that mutates `this.props.status` after validating its own guard, and throws a domain error exported from the same module — see `ManifestationStatusTransitionNotAllowedError` in `src/domain/entities/manifestation.ts` and the existing methods `recordAdministrativeAnswer()`, `transitionStatusAdministratively(target)`, `finalizeByAuthor()`. The use case orchestrates: load aggregate → call behavior → `repository.save(aggregate)`. Don't replicate guards (or status comparisons) in the use case.

### Shared use-case errors

When an error is thrown by more than one use case, place it under `src/application/use-cases/manifestation-<area>/errors/` rather than inside any single use case folder, so use cases don't cross-import each other:

- `manifestation-access/errors/` — manifestant-side access (`ManifestationNotFoundError`, `NotAllowedToAccessManifestationError`)
- `manifestation-administration/errors/` — admin-side authorization (`NotAllowedToManageManifestationError`)

Errors that are specific to one use case stay in `<use-case>/errors/`. Domain-invariant errors (e.g. status transitions, value-object validation) live in `src/domain/...` next to the type that enforces them.

## Module System

ESM with `NodeNext`. The project relies on a self-import alias defined in `package.json`:

```
"#src/*.js": {
  "development": "./src/*.ts",
  "default":     "./build/*.js"
}
```

This means **source code imports use `.js` extensions even when pointing at `.ts` files**, and absolute imports use the `#src/...` prefix:

```ts
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { Manifestation } from '#src/domain/entities/manifestation.js'
```

The compiled build serves the `default` (JS) condition, and `vitest.config.mjs` plus `tsconfig.base.json` (`paths`) mirror this alias for local development tooling — don’t replace it with `tsc-alias` or relative-path hacks.

## TypeScript / Lint Strictness

`tsconfig.base.json` is aggressively strict: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `useUnknownInCatchVariables`, `noImplicitOverride`. ESLint runs `typescript-eslint`’s **strict + type-checked** preset over `src/` and `test/`.

Things that will fail lint/typecheck and are easy to miss:

- Type-only imports must be separated (`import type { Foo } from ...`) — enforced by `consistent-type-imports`.
- Import order is enforced (`builtin` → `external` → `internal` → relative), alphabetized, with blank lines between groups.
- `strict-boolean-expressions` is on — guard nullables explicitly (`value === null`, `value !== undefined`).
- `no-floating-promises` and `no-misused-promises` are on.
- No `any`, no unsafe member access, no `console.log` in `src/` (only `console.warn`/`error`).
- `no-confusing-void-expression` — in tests, `expect(() => fn()).toThrow(...)` fails when `fn()` returns void. Wrap in braces: `expect(() => { fn() }).toThrow(...)`.
- Prettier: no semicolons, single quotes, trailing commas, `printWidth: 120`.

## Commits

Husky `commit-msg` runs `scripts/validate-commit-msg.sh` with the regex:

```
^(chore|docs|feat|fix|refactor|test): ([a-z].*[^.])$
```

Subject must be **≥ 10 chars**, lowercase first letter, no trailing period. Allowed types only: `chore`, `docs`, `feat`, `fix`, `refactor`, `test`. The `pre-commit` hook runs `lint-staged`.
