# Arquitetura do Sistema de Ouvidoria UESPI

Visão sucinta da stack e da arquitetura dos três artefatos do repositório: **backend core** (raiz), **frontend web** (`web/`) e **microserviço de IA** (`ai-api/`).

> Detalhes operacionais (rotas HTTP, comandos, convenções de commit) ficam em `AGENTS.md`, `doc/api/frontend-integration.md` e `doc/architecture/ai-chatbot.md`.

---

## 1. Visão geral

Sistema institucional de ouvidoria para a UESPI. Manifestantes abrem manifestações (denúncia / reclamação / sugestão / elogio) de forma identificada ou anônima, conversam com a Ouvidoria, anexam arquivos e avaliam o atendimento. Servidores com papel `ombudsman` ou `admin` operam o atendimento. Um chatbot institucional (**Guará**) ajuda com triagem e rascunho de manifestações.

Três processos independentes:

| Serviço                         | Papel                                               | Stack                                        |
| ------------------------------- | --------------------------------------------------- | -------------------------------------------- |
| `ouvidoria-backend-core` (raiz) | API HTTP principal, regras de negócio, persistência | Node 22 + Fastify 5 + Prisma 7 + Postgres 16 |
| `web/`                          | SPA do manifestante, ombudsman e admin              | React 19 + Vite 8 + Tailwind 4               |
| `ai-api/`                       | Microserviço de RAG/IA (Guará)                      | Fastify 5 + LangChain 1 + Gemini + pgvector  |

O backend principal **não importa nada do `ai-api/` em runtime** — fala com ele estritamente por HTTP através do contrato `AiGateway`, com fallback para uma implementação fake em dev/teste.

---

## 2. Stack

### Linguagens e runtime

- **TypeScript** (NodeNext, ESM, strict + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` + `verbatimModuleSyntax`)
- **Node 22** em todos os serviços
- **pnpm 10** na raiz e em `ai-api/`; `web/` usa **npm**

### Backend (`/`)

- **Fastify 5** + `@fastify/cors`, `@fastify/jwt`, `@fastify/multipart`, `@fastify/rate-limit`
- **Prisma 7** sobre **Postgres 16**
- **Zod 4** para validação na borda HTTP
- **bcryptjs** (hash de senha) + **jsonwebtoken** HS256 (JWT)
- **@supabase/supabase-js** como adapter de storage de anexos
- **Vitest 4** (unit + e2e separados)

### Frontend (`web/`)

- **React 19** (StrictMode)
- **Vite 8** + `@vitejs/plugin-react`
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **react-hook-form** + **zod** para forms
- **Vitest 4** para helpers puros (sem JSDOM)
- Sem React Router (roteamento próprio em `web/src/app/routes.ts`)
- Sem state manager global — Context API por domínio

### Microserviço de IA (`ai-api/`)

- **Fastify 5** + `@fastify/helmet`
- **LangChain 1** (`@langchain/core`, `@langchain/community`, `@langchain/google-genai`, `@langchain/textsplitters`)
- **Gemini** como LLM
- **pgvector** em **Postgres 17** como vector store
- **pdf-parse** para ingestão da base institucional

### Infra local

- **Docker Compose**: `postgres` (5432), `ai-postgres` (5433, pgvector), `ai-bootstrap` (job idempotente que cria a extensão `vector`) e `ai-api`.

---

## 3. Layout do monorepo

```
projeto-ouvidoria/
├── src/                # backend core (composition root + camadas)
├── web/                # frontend SPA (workspace independente, npm)
├── ai-api/             # microserviço de IA (workspace independente, pnpm)
├── prisma/             # schema, migrations, seed
├── doc/                # documentação (PRD, specs, arquitetura)
├── test/               # tests do backend (unit/ + e2e/)
├── AGENTS.md           # handbook de contribuição
└── docker-compose.yml  # postgres + pgvector + ai-api
```

Backend usa **self-import alias** em `package.json`:

```json
"#src/*.js": {
  "development": "./src/*.ts",
  "default":     "./build/*.js"
}
```

Source code importa `from '#src/...js'` mesmo apontando para `.ts` — o `default` (JS) só é usado no build.

---

## 4. Backend — Clean Architecture

Camadas, do núcleo para fora. Cada camada só conhece as de dentro:

```
domain ← application ← presentation ← infra ← main
```

- **`domain/`** — entidades e value objects puros. Zero dependências externas (sem framework, sem DB, sem env). Comportamento mora aqui: `Manifestation.canReceiveMessages()`, transições de status como `finalizeByAuthor()`, `transitionStatusAdministratively(target)`. Erros de domínio (`ManifestationStatusTransitionNotAllowedError`) também.
- **`application/`** — use cases + contratos (interfaces) para tudo que é infra: `repositories/`, `cryptography/`, `auth/`, `protocol/`, `storage/`, `attachments/`, `ai/`. Cada use case implementa `UseCase<Input, Output>` com um único `execute(input)`. Recebe contratos no construtor, nunca adapters concretos.
- **`presentation/`** — camada HTTP framework-agnóstica. `Controller<TRequest>`, `Validator<T>`, helpers de resposta. Nenhum acoplamento Fastify.
- **`infra/`** — adapters concretos que satisfazem os contratos: `database/prisma/` (repositories + mappers), `cryptography/bcryptjs-hasher.ts`, `auth/jwt-token-generator.ts`, `storage/` (Supabase), `ai/` (`FakeAiGateway` + `HttpAiGateway`), `http/fastify/` (adaptador, ZodValidator, middlewares).
- **`main/`** — composition root: `config/env.ts` (Zod), `factories/` (singletons), `routes/` (plugins Fastify), `server.ts` (`buildApp()` / `startServer()`).

**Histórico sem tabela de audit**: a linha do tempo (`history[]`) é reconstruída a partir de `manifestation_messages` — `registered` vem do `createdAt` do agregado, `status_changed` / `finalized_by_author` / `evaluation_recorded` são mensagens de **sistema** cujo `content` é um JSON payload. A repository administrativa grava o agregado e a mensagem de sistema na mesma `$transaction`.

---

## 5. Frontend — camadas + DI por Context

```
web/src/
├── app/             # routes, access-policy, date-utils
├── application/     # contratos e políticas puras (testável sem DOM)
├── components/      # UI reutilizável (incluindo feedback/ConfirmDialog e manifestations/* compartilhados)
├── contexts/        # Context + Providers por domínio
├── hooks/           # useAuth, useCatalog, useManifestationsService, useGuaraChat
├── infrastructure/  # adapters HTTP (apiFetch, services concretos)
├── pages/           # uma por rota do roteador artesanal
└── utils/
```

Padrões:

- **Roteamento**: `getCurrentPath()` em `App.tsx` decide qual `<Page />` renderizar. Cada page lê o próprio query via `getSearchParams()`.
- **HTTP**: `apiFetch<T>(path, options)` injeta Bearer do `sessionStorage`, mapeia `{ error, message }` do backend em `ApiHttpError` tipado, e limpa o token em 401.
- **DI**: `AppProviders` instancia serviços via factories e os entrega por Context. Hooks de consumo lançam se o provider estiver ausente. **Ombudsman** usa um padrão mais leve — `makeOmbudsmanService()` direto via `useMemo` na page, sem provider.
- **Narrowing na borda**: enums vindos do backend passam por funções (`narrowMessageSenderType`, `narrowHistoryEntryType`, etc.) que mapeiam valor desconhecido para `'unknown'`. UI não quebra se o backend introduzir um valor novo.
- **Policies puras**: visibilidade/habilitação em `application/<area>/<name>-policy.ts`. UI consulta, nunca duplica.

---

## 6. Microserviço de IA

```
ai-api/src/
├── application/   # dtos, ports, use-cases
├── infra/         # ingestion (PDF→chunks→embeddings→pgvector), llm (Gemini), rag, vector-store
├── main/          # factories, server
└── presentation/  # controllers, middlewares (API key), validators (Zod)
```

A IA é **stateless**: o histórico é mantido pelo frontend e reenviado a cada turno (até 20 mensagens, 4000 chars cada). O backend principal resolve catálogo institucional no Prisma antes de chamar o `ai-api`, e narrowiza valores fora do domínio (intent desconhecida vira `unknown`, draft inválido vira `null`) antes de devolver ao frontend.

A troca entre `FakeAiGateway` (in-process, default em dev/teste) e `HttpAiGateway` (chama o `ai-api`) é configuracional via `AI_GATEWAY_PROVIDER`, sem alterar contrato HTTP.

---

## 7. Persistência

Dois Postgres independentes:

- **`postgres` (5432)** — banco principal via Prisma 7. Modelos: `User`, `Campus`, `AdministrativeUnit`, `Manifestation`, `ManifestationMessage`, `ManifestationAttachment`, `ManifestationEvaluation`. Enums canônicos: `UserRole`, `ManifestationType`, `ManifestationStatus`, `ManifestationMessageSenderType`, `ManifestationAttachmentUploadedByType`.
- **`ai-postgres` (5433)** — `pgvector/pgvector:pg17`. Banco isolado para vetores da base de conhecimento. Ingestão lê PDFs em `ai-api/docs/`, faz chunking com `RecursiveCharacterTextSplitter`, gera embeddings via Gemini e faz upsert.

Storage de anexos vai para **Supabase Storage**. O frontend nunca recebe `storageKey` ou bucket — só signed URLs curtas (TTL ~300s) emitidas pelo backend.

---

## 8. Comunicação entre serviços

```
┌──────────────┐  HTTP/JSON  ┌──────────────────────┐
│  web/ (SPA)  │ ──────────► │ ouvidoria-backend-   │
│  React 19    │             │ core (Fastify+Prisma)│
└──────────────┘             └─────────┬────────────┘
                                       │ AiGateway (HTTP quando
                                       │ AI_GATEWAY_PROVIDER=http)
                                       ▼
                             ┌──────────────────────┐
                             │ ai-api (LangChain +  │
                             │ Gemini)              │
                             └─────────┬────────────┘
                                       ▼
                             ai-postgres (pgvector)

       backend core ──► postgres 16 (domínio principal)
                  ──► Supabase Storage (anexos)
```

`web/` só conhece o backend principal. Nunca chama o `ai-api` direto.
