# Repository Guidelines

## Project Overview

This repository contains the backend core for the Institutional Ombudsman System.

The current implementation is intentionally limited to the domain and application layers. Keep business rules traceable to the PRD, Cockburn use cases, and feature specs in `doc/`.

## Current Implementation Focus

Do not add HTTP controllers, database adapters, ORM models, migrations, queues, background jobs, or external integrations unless the current task explicitly asks for them.

Prefer small, isolated use cases with clear contracts and unit tests.

## Project Structure & Module Organization

- `src/domain/`: entities and value objects
- `src/application/`: use cases, repository contracts, auth, and cryptography abstractions
- `test/unit/`: unit tests mirroring application behavior
- `doc/`: PRD, requirements, Cockburn use cases, and feature specs
- `scripts/`: repository automation such as commit validation

Build output goes to `build/` and should not be edited manually.

## Architecture Boundaries

- `src/domain/` must stay independent from application, framework, database, and external service code.
- `src/application/` may depend on domain objects and application contracts, but not on concrete implementations.
- Repository, cryptography, token, file, and AI dependencies should be expressed as interfaces in the application layer.
- Use cases orchestrate flows; they should not contain framework, ORM, or transport logic.

Forbidden in `domain` and `application` unless explicitly requested: HTTP frameworks, ORM code, direct environment access, direct filesystem access, and direct network calls.

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

Vitest is the test runner, and `vitest-mock-extended` is the default mocking helper. Place tests under `test/unit/` and name them `*.spec.ts`.

- Mirror the production module under test
- Cover success paths, invalid input, and dependency failures
- Mock dependencies through contracts
- Do not use real databases, HTTP servers, or concrete crypto/JWT libraries in unit tests

Run `pnpm test` before opening a PR. Prefer `pnpm test:coverage` when changing core behavior.

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
