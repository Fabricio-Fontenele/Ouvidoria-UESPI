# Backend Core for the Institutional Ombudsman System

This repository contains the backend core for the UESPI Institutional Ombudsman System.

The current scope is intentionally limited to the `domain` and `application` layers. Business rules should remain traceable to the PRD, Cockburn use cases, and feature specs under [doc/](./doc).

## Current Scope

- `src/domain/`: entities and value objects
- `src/application/`: use cases and infrastructure contracts
- `test/unit/`: unit tests for domain and application behavior
- `doc/`: PRD, Cockburn references, feature specs, and technical plans

Out of scope unless explicitly requested:

- HTTP controllers and transport layers
- ORM models, migrations, and database adapters
- queues, jobs, and background workers
- direct filesystem, environment, or network integrations

## Stack

- Node.js 22
- `pnpm` 10
- TypeScript ESM with `NodeNext`
- Vitest
- ESLint + Prettier

## Commands

```bash
pnpm build
pnpm type:check
pnpm lint
pnpm format
pnpm test
pnpm test:coverage
pnpm check
```

Run a single spec with:

```bash
pnpm vitest run test/unit/application/sign-in-use-case.spec.ts
```

## Architecture Rules

- `src/domain/` must stay independent from application, framework, and infrastructure code.
- `src/application/` may depend on domain objects and application contracts, but not on concrete implementations.
- Repository, cryptography, token, protocol, and AI dependencies must remain interfaces in the application layer.
- Use cases orchestrate flows and delegate invariants to domain entities and value objects.

## Domain Vocabulary

Use the current project terms consistently:

- `User` with roles `manifestant`, `ombudsman`, and `admin`
- `Manifestation`, `Protocol`, and `Attachment`
- `ManifestationType`: `report`, `complaint`, `suggestion`, `compliment`
- `ManifestationStatus`: `in_analysis`, `answered`, `canceled`, `finalized`

## Quality Gate

Before opening a PR, run:

```bash
pnpm check
```

Prefer `pnpm test:coverage` when touching central business behavior.
