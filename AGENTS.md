# Repository Guidelines

## Project Overview

This repository contains the full backend for the Institutional Ombudsman System: domain, application, presentation, infrastructure adapters, and the composition root.

Keep business rules traceable to the PRD, Cockburn use cases, and feature specs in `doc/`.

## Project Structure & Module Organization

- `src/domain/`: entities and value objects (pure)
- `src/application/`: use cases, repository contracts, auth/cryptography/protocol abstractions, DTOs
- `src/presentation/`: framework-agnostic controllers, HTTP protocols (`HttpRequest`/`HttpResponse`), `Validator<T>`, base controller, helpers
- `src/infra/`: concrete adapters
  - `database/prisma/`: client, mappers, repositories. Aggregate writes + system audit messages are wrapped in `prisma.$transaction` for traceability.
  - `cryptography/`: `BcryptjsHasher` (implements `PasswordHasher` + `HashComparer`)
  - `auth/`: `JwtTokenGenerator` (jsonwebtoken HS256)
  - `protocol/`: `UuidProtocolGenerator`, `RandomAccessCodeGenerator`
  - `http/fastify/`: `adaptRoute`, `ZodValidator`, auth middlewares (`ensureAuthenticated`, `optionalAuthenticate`, `requireRoles`)
- `src/main/`: composition root
  - `config/env.ts` (zod-validated env), `factories/infrastructure.ts` (DI singletons), `factories/controllers/*` (per-area factories), `routes/*.routes.ts` (Fastify plugins), `server.ts` (bootstrap)
- `prisma/`: schema + migrations
- `test/unit/`: unit tests mirroring application/presentation behavior
- `doc/`: PRD, requirements, Cockburn use cases, feature specs
- `scripts/`: repository automation such as commit validation

Build output goes to `build/` and should not be edited manually.

## Architecture Boundaries

- `src/domain/` must stay independent from application, framework, database, and external service code.
- `src/application/` may depend on domain objects and application contracts, but not on concrete implementations.
- `src/presentation/` may depend on domain and application contracts only. **Never import from `src/infra/` or `src/main/`** — controllers must remain framework-agnostic.
- `src/infra/` adapts external libraries (Prisma, Fastify, JWT, bcrypt) to application/presentation contracts. Infra modules may depend on application/presentation/domain but never on `src/main/`.
- `src/main/` is the only place that knows about everything: it instantiates infra adapters and injects them into use cases/controllers, then registers HTTP routes.
- Repository, cryptography, token, file, and AI dependencies should be expressed as interfaces in the application layer; their concrete adapters live in `src/infra/`.
- Use cases orchestrate flows; they should not contain framework, ORM, or transport logic.

Forbidden in `domain`, `application`, and `presentation`: HTTP frameworks, ORM code, direct environment access, direct filesystem access, and direct network calls.

## Domain Language

Use the current project vocabulary consistently:

- `User` for usuário
- `manifestant`, `ombudsman`, and `admin` for user roles
- `Manifestation`, `Protocol`, and `Attachment` for core domain concepts

Avoid introducing parallel names such as `ticket`, `issue`, or `request` for the same concept unless the domain model is intentionally revised.

## Build, Test, and Development Commands

Use `pnpm` with Node.js 22.

- `pnpm build`: clean and compile into `build/`
- `pnpm type:check`: validate TypeScript for `src/` and `test/`
- `pnpm lint`: run ESLint
- `pnpm format`: format the repository with Prettier
- `pnpm test`: run Vitest
- `pnpm test:coverage`: run tests with coverage
- `pnpm check`: run format, lint, type-check, and tests together

Example: `pnpm vitest run test/unit/application/sign-in-use-case.spec.ts`

## Coding Style & Naming Conventions

- TypeScript ESM with strict typing
- Prettier: no semicolons, single quotes, trailing commas, `printWidth: 120`
- ESLint: sorted imports, separate `type` imports, no floating promises, no `any`
- `PascalCase` for classes and error types
- `camelCase` for variables, methods, and properties
- `kebab-case` for filenames when creating new files

Prefer explicit names such as `sign-in-use-case.ts`, `user-repository.ts`, and `token-generator.ts`. When working in existing files, preserve the repository’s current naming where it already differs, such as `invalid-credentials-error.ts`.

## Testing Guidelines

Vitest is the test runner, and `vitest-mock-extended` is the default mocking helper.

### Unit tests (`test/unit/`)

- Mirror the production module under test, name them `*.spec.ts`
- Cover success paths, invalid input, and dependency failures
- Mock dependencies through contracts (`UsersRepository`, `PasswordHasher`, `TokenGenerator`, etc.)
- Do not use real databases, HTTP servers, or concrete crypto/JWT libraries

### E2E tests (`test/e2e/`)

- Run via `pnpm test:e2e` (separate vitest config). Require Postgres up (`pnpm db:up`).
- `test/e2e/setup-e2e.ts` creates a per-file Postgres schema (`e2e_<uuid>`), sets `DATABASE_URL`, applies migrations with `prisma migrate deploy`, and drops the schema in `afterAll`.
- Tests use `app.inject()` from the Fastify instance (no actual HTTP socket). Helper in `test/e2e/utils/app.ts` exposes `getApp()` (cached) and `resetDatabase()` (call in `afterEach`).
- File parallelism is disabled in `vitest.config.e2e.mjs` so the cached Fastify app does not race across files.
- Cover end-to-end flows that wouldn't surface in unit tests — especially the traceability invariants enforced by `prisma.$transaction` (e.g. assert that a system message row exists after a status transition).

Run `pnpm test` before opening a PR; run `pnpm test:e2e` when touching infra adapters, Prisma schema/repositories, Fastify routes, or middleware. `pnpm check` runs the unit gate; e2e is intentionally excluded because it depends on Docker.

## Documentation Guidelines

Documentation in `doc/` should preserve traceability with the PRD and use cases. Feature specs should reference related IDs when relevant, such as `RF`, `RNF`, `RN`, and `UC`.

Do not introduce new business rules in feature specs without marking them as assumptions or refinements.

## Commit & Pull Request Guidelines

Commit messages must follow the repository rule:

- `feat: add sign-in use case core`
- `fix: preserve typed password in sign in`
- `docs: add sign-in feature spec`

Allowed types are `chore`, `docs`, `feat`, `fix`, `refactor`, and `test`. Keep the subject lowercase and without a trailing period.

PRs should include a short summary, affected files or feature area, related requirements or use cases when applicable, and the validation performed, such as `pnpm test` or `pnpm check`.
