# Arquitetura do Sistema de Ouvidoria UESPI

Documento de referência da arquitetura, stack e convenções. Cobre os três artefatos do repositório: **backend core** (raiz), **frontend web** (`web/`) e **microserviço de IA** (`ai-api/`).

> Para o handbook de contribuição (regras de nomes, política de commits) ver `AGENTS.md`. Para o detalhamento do chatbot, ver `doc/architecture/ai-chatbot.md`. Para o contrato HTTP consumido pelo frontend, ver `doc/api/frontend-integration.md`.

---

## 1. Visão geral

Sistema institucional de ouvidoria para a UESPI. O usuário pode abrir manifestações (denúncia / reclamação / sugestão / elogio) de forma **identificada** ou **anônima**, conversar com a Ouvidoria por mensagens, anexar arquivos, finalizar a manifestação e avaliar o atendimento. Servidores com papel `ombudsman` ou `admin` operam o atendimento (responder, transitar status, baixar anexos). Um chatbot institucional (**Guará**) presta atendimento conversacional e ajuda a estruturar manifestações.

Três processos:

| Serviço                         | Papel                                               | Stack                                        |
| ------------------------------- | --------------------------------------------------- | -------------------------------------------- |
| `ouvidoria-backend-core` (raiz) | API HTTP principal, regras de negócio, persistência | Node 22 + Fastify 5 + Prisma 7 + Postgres 16 |
| `web/`                          | Frontend SPA do manifestante, ombudsman e admin     | React 19 + Vite 8 + Tailwind 4               |
| `ai-api/`                       | Microserviço de RAG/IA (Guará)                      | Fastify 5 + LangChain 1 + Gemini + pgvector  |

O backend principal **não importa nada do `ai-api/` em runtime** — fala com ele estritamente por HTTP através do contrato `AiGateway`. Permite trocar o gateway por uma implementação fake em dev/teste.

---

## 2. Stack

### Linguagens e runtime

- **TypeScript** (NodeNext, ESM, strict + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` + `verbatimModuleSyntax`)
- **Node 22** em todos os serviços (uso de `--env-file` nativo para evitar race com Prisma)
- **pnpm 10** como package manager na raiz; `web/` usa **npm**, `ai-api/` usa **pnpm**

### Backend (`/`)

- **Fastify 5** + `@fastify/cors`, `@fastify/jwt`, `@fastify/multipart`, `@fastify/rate-limit`
- **Prisma 7** (`@prisma/client` + `@prisma/adapter-pg`) sobre **Postgres 16**
- **Zod 4** para validação de input (schema na borda HTTP via `ZodValidator<T>`)
- **bcryptjs** para hash de senha, **jsonwebtoken** HS256 para JWT
- **@supabase/supabase-js** para o adapter de storage de anexos
- **Vitest 4** (unit + e2e separados; e2e cria schema isolado por arquivo)
- **ESLint 9** com preset `typescript-eslint` strict + type-checked; **Prettier 3**
- **Husky 9** + **lint-staged 15** + script `validate-commit-msg.sh`

### Frontend (`web/`)

- **React 19** (StrictMode)
- **Vite 8** + `@vitejs/plugin-react`
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **react-hook-form** + **zod** + **@hookform/resolvers** para forms
- **Vitest 4** para helpers puros (rotas, políticas, serviços HTTP com `fetch` stubbed)
- Sem React Router — roteamento próprio em `web/src/app/routes.ts` (path-based, `getCurrentPath()`)
- Sem state manager global — Context API por domínio (`AuthProvider`, `CatalogProvider`, `ManifestationsServiceProvider`, `GuaraChatServiceProvider`)

### Microserviço de IA (`ai-api/`)

- **Fastify 5** + `@fastify/helmet`
- **LangChain 1** (`@langchain/core`, `@langchain/community`, `@langchain/google-genai`, `@langchain/textsplitters`)
- **Gemini** (Google Generative AI) como LLM
- **pgvector** em **Postgres 17** (`pgvector/pgvector:pg17`) como vector store
- **pdf-parse** para ingestão da base de conhecimento institucional

### Infra local

- **Docker Compose** orquestra `postgres` (5432), `ai-postgres` (5433, pgvector), `ai-bootstrap` (job idempotente para extensões) e `ai-api`.

---

## 3. Layout do monorepo

```
projeto-ouvidoria/
├── src/                          # backend core (composition root + camadas)
├── web/                          # frontend SPA (workspace independente, npm)
├── ai-api/                       # microserviço de IA (workspace independente, pnpm)
├── prisma/                       # schema, migrations, seed
├── doc/                          # documentação (specs, PRD, arquitetura)
│   ├── api/                      # contratos HTTP públicos
│   ├── architecture/             # este doc + ai-chatbot.md
│   ├── basic/ cockburn/ features/ legacy/ plans/
│   ├── integration-status.md     # estado das slices de integração FE↔BE
│   ├── mvp-status.md
│   └── ouvidoria-prd.md
├── test/                         # tests do backend (unit/ + e2e/)
├── scripts/                      # validate-commit-msg.sh etc.
├── AGENTS.md                     # handbook de contribuição
├── CLAUDE.md                     # notas para assistentes (overrides do AGENTS.md)
├── docker-compose.yml            # postgres + pgvector + ai-api
├── package.json                  # raiz (pnpm)
└── tsconfig.base.json            # config TS estrita compartilhada
```

O backend usa **self-import alias** declarado em `package.json`:

```json
"#src/*.js": {
  "development": "./src/*.ts",
  "default":     "./build/*.js"
}
```

Source code importa `from '#src/...js'` mesmo apontando para `.ts` — o `default` (JS) só é usado no build.

---

## 4. Backend (`src/`) — Clean Architecture

Camadas, do núcleo para fora. Cada camada só conhece as de dentro.

```
domain ← application ← presentation ← infra ← main
```

### 4.1 `src/domain/`

Tipos e regras de negócio puras. Zero dependências externas (sem framework, sem DB, sem env, sem network).

- `entities/` — `Entity` base, `Manifestation`, `User`, `ManifestationMessage`, `ManifestationAttachment`.
- `value-objects/` — `Email`, `Password`, `Protocol`, `UniqueEntityId`, `AccessCode`.
- **Comportamento mora aqui**: `Manifestation.canReceiveMessages()`, `belongsTo()`, `isAnonymous()`. Transições de estado são métodos do agregado (`recordAdministrativeAnswer()`, `transitionStatusAdministratively(target)`, `finalizeByAuthor()`) — lançam erros de domínio como `ManifestationStatusTransitionNotAllowedError`. Use cases orquestram, não replicam guards.
- Fábricas estáticas: `Manifestation.open(...)`, `Manifestation.restore(...)` — sem `new` público.

### 4.2 `src/application/`

Casos de uso e contratos (interfaces) para tudo que é infraestrutural.

- `use-cases/<feature>/` — uma pasta por use case. Cada um implementa `UseCase<Input, Output>` com um único método `execute(input)`. Erros específicos do use case ficam em `errors/` da própria pasta. Erros compartilhados ficam em pastas-mãe (`manifestation-access/errors/`, `manifestation-administration/errors/`) para evitar cross-import entre use cases.
- `repositories/` — `ManifestationsRepository`, `UsersRepository`, `ManifestationInteractionsRepository`, `ManifestationAdministrationRepository`, `PaginationParams`.
- `cryptography/` — `HashComparer`, `PasswordHasher`.
- `auth/` — `TokenGenerator`.
- `protocol/` — `ProtocolGenerator`, `AccessCodeGenerator`.
- `storage/` — `AttachmentStorageGateway` (upload/download/signed URL).
- `attachments/` — políticas de anexo (MIME, tamanho, limite).
- `ai/` — `AiGateway` (interface consumida pelo use case do Guará).
- `dto/` — DTOs de leitura (`manifestation-query-dtos.ts`).

**Use cases recebem contratos no construtor**, nunca adapters concretos.

### 4.3 `src/presentation/`

Camada HTTP framework-agnóstica.

- `protocols/` — `HttpRequest`, `HttpResponse`, `Controller<TRequest>`, `Validator<T>`.
- `controllers/` — um por rota. Recebe `HttpRequest` validado, chama use case, mapeia erros para HTTP semântico (`ok`, `created`, `badRequest`, `notFound`, `forbidden`, `conflict`).
- `errors/` — erros HTTP (`UnauthenticatedError`, `ForbiddenError`, `ValidationError`, `MissingParamError`, `InvalidParamError`).
- `helpers/` — helpers de resposta (`http-response-helpers.ts`).

Nenhum acoplamento Fastify aqui.

### 4.4 `src/infra/`

Adapters concretos que satisfazem os contratos das camadas internas.

- `database/prisma/` — client singleton, mappers (`user`, `manifestation`, `manifestation-message`), repositories. `prisma-manifestation-administration-repository.ts` envolve a escrita do agregado + mensagens de sistema em `$transaction` — garante que o audit log não diverge do estado.
- `cryptography/bcryptjs-hasher.ts` — implementa `PasswordHasher` e `HashComparer`.
- `auth/jwt-token-generator.ts` — `jsonwebtoken` HS256.
- `protocol/` — `uuid-protocol-generator.ts`, `random-access-code-generator.ts`.
- `storage/` — adapter Supabase (signed URLs).
- `ai/` — `FakeAiGateway` (in-process, MVP/dev) e `HttpAiGateway` (chama o `ai-api`).
- `http/fastify/` — `adaptRoute(controller)` (adapta Fastify req/reply para o protocolo da presentation), `zod-validator.ts`, middlewares (`ensureAuthenticated`, `optionalAuthenticate`, `requireRoles`) baseados em `@fastify/jwt`.

### 4.5 `src/main/`

Composition root + bootstrap HTTP.

- `config/env.ts` — loader de env com validação Zod (`DATABASE_URL`, `JWT_SECRET`, `AI_GATEWAY_PROVIDER`, etc.).
- `factories/infrastructure.ts` — singletons (Prisma + adapters). Seleciona `FakeAiGateway` vs `HttpAiGateway` via `AI_GATEWAY_PROVIDER`.
- `factories/controllers/{auth,manifestation,admin,ai}.ts` — uma `make<Name>Controller()` por controller; monta use case + validator.
- `routes/` — `auth`, `manifestation`, `admin`, `catalog`, `ai`, `health`. Cada arquivo é um plugin Fastify que aplica middlewares de scope (auth, roles, rate limit).
- `server.ts` — `buildApp()` registra CORS (`methods: GET|POST|PATCH|PUT|DELETE|OPTIONS`), JWT, multipart, rate-limit (não em test), todas as rotas; `startServer()` faz o listen e disconnect do Prisma no close.

---

## 5. Frontend (`web/`)

SPA React 19 servida pelo Vite. Sem React Router — roteamento path-based feito em `web/src/app/routes.ts`.

### 5.1 Estrutura

```
web/src/
├── app/                  # rotas (router-like), access-policy, date-utils
├── application/          # contratos e políticas (camada pura, testável)
│   ├── auth/             # AuthService, AuthenticatedUserRole
│   ├── catalog/          # Catalog, CatalogService
│   ├── manifestations/   # contratos, policies, dto narrowing, system-message-payload, attachment-policy
│   ├── ombudsman/        # OmbudsmanService, ombudsman-policy, ombudsman-reply-limits
│   └── guara-chat/       # GuaraChatService
├── components/           # UI reutilizável
│   ├── auth/  forms/  icons/  layout/
│   ├── feedback/         # ConfirmDialog (modal genérico)
│   └── manifestations/   # SummaryCard, TimelineCard, MessagesThread, AttachmentsList, FinalizeAction, ManifestationSubmissionSuccess, status-style
├── contexts/             # Context API + Providers por domínio
├── hooks/                # useAuth, useCatalog, useManifestationsService, useGuaraChat
├── infrastructure/       # adapters HTTP
│   ├── http/             # apiFetch (Bearer auto), ApiHttpError, auth-token-storage, publicApiFetch
│   ├── auth/  catalog/  guara-chat/
│   ├── manifestations/   # HttpManifestationsService + mapper compartilhado
│   └── ombudsman/        # HttpOmbudsmanService
├── pages/                # uma por rota do roteador artesanal
├── assets/               # imagens
└── utils/                # cx (className merge), format-date, etc.
```

### 5.2 Padrões

- **Roteamento**: `getCurrentPath()` em `App.tsx` decide qual `<Page />` renderizar. Cada page é responsável pela própria URL via `getSearchParams()`.
- **Camadas**: `application/*` é puro (testável com Vitest sem DOM); `infrastructure/*` adapta HTTP; `components/*` é UI; `pages/*` orquestra.
- **HTTP**: `apiFetch<T>(path, options)` em `infrastructure/http/api-client.ts` injeta Bearer do `sessionStorage`, mapeia `{ error, message }` do backend para `ApiHttpError` tipado, e limpa o token em 401. `publicApiFetch` é o mesmo sem Bearer.
- **DI por Context**: `AppProviders` instancia os serviços via factories (`makeAuthService`, `makeCatalogService`, `makeManifestationsService`, `makeGuaraChatService`) e os fornece via providers. Hooks de consumo (`useAuth`, `useManifestationsService`, etc.) lançam se o provider estiver ausente. **Ombudsman**: padrão mais leve — `makeOmbudsmanService()` instanciado direto em `useMemo` nas páginas, sem provider/context (escopo restrito à área administrativa).
- **Narrowing na borda**: enums vindos do backend passam por narrow functions (`narrowMessageSenderType`, `narrowHistoryEntryType`, `narrowAttachmentUploaderType`) que mapeiam valor desconhecido para `'unknown'`. UI não quebra se o backend introduzir um valor novo.
- **Policies**: regras de visibilidade/habilitação em `application/<area>/<name>-policy.ts` (puras, testáveis). UI só consulta, nunca duplica.
- **Forms**: react-hook-form + Zod alinhado às regras do backend (`Password`, `Email`, `Name`, `Description`).
- **Tailwind 4**: tokens próprios (`bg-home-blue`, `text-home-brown`, `bg-home-success`, etc.) em `index.css` via `@theme`.

### 5.3 Cliente HTTP — convenções

- `apiFetch` constrói URL com `URLSearchParams` (ignora `undefined` no query).
- `body instanceof FormData` ⇒ não seta `Content-Type` manualmente (deixa o browser inserir o boundary).
- 401 ⇒ `clearAuthToken()` automático (logout implícito quando token expira).
- Erros viram `ApiHttpError({ code, message, status })`; UI usa `isApiError(err, code)` para narrowing.

---

## 6. Microserviço de IA (`ai-api/`)

Microserviço Fastify dedicado às concerns de IA (RAG + structured drafting). O backend principal só fala com ele por HTTP através do `AiGateway`.

```
ai-api/src/
├── application/
│   ├── dtos/          # request/response do /messages
│   ├── ports/         # LLMClient, EmbeddingsClient, VectorStore, RagRetriever
│   └── use-cases/     # answer-message-use-case
├── infra/
│   ├── ingestion/     # ingest-knowledge-base.ts (PDF → chunks → embeddings → pgvector)
│   ├── llm/           # adapter Gemini (@langchain/google-genai)
│   ├── rag/           # retriever
│   └── vector-store/  # pgvector store
├── main/
│   ├── factories/     # composition root
│   └── server.ts      # bootstrap Fastify + helmet
└── presentation/
    ├── controllers/   # /messages
    ├── middlewares/   # API key
    └── validators/    # Zod
```

### Persona Guará

Mascote da Ouvidoria UESPI — ave acolhedora. Respostas em PT com tom caloroso, próximo e leve, sem perder o tom institucional.

### Fluxo de uma chamada

1. FE chama `POST /ai/messages` no backend principal (público, sem auth) com `{ history, message }`.
2. Backend principal busca catálogo institucional ativo no Prisma.
3. Backend repassa `history + message + catalog` para o `ai-api` (via `HttpAiGateway` quando `AI_GATEWAY_PROVIDER=http`).
4. `ai-api` usa RAG sobre PDFs institucionais ingeridos no pgvector + Gemini para gerar:
   - `answer` (texto da Guará)
   - `intent` (`institutional_question | manifestation_candidate | manifestation_draft_ready | out_of_scope | unknown`)
   - `draft` (rascunho de manifestação com `type`, `campusId`, `administrativeUnitId`, `description`, `involvedPeople`, todos opcionais)
   - `missingFields`, `shouldOpenManifestationDraft`, `confidence`
5. Backend principal narrowiza valores fora do domínio (intent desconhecida vira `unknown`, draft inválido vira `null`) antes de devolver ao FE.

A IA **é stateless**: o histórico é mantido pelo FE e reenviado a cada turno (limite 20 mensagens, 4000 chars cada).

Quando `AI_GATEWAY_PROVIDER` não é `http`, o backend usa `FakeAiGateway` — útil em dev sem o `ai-api` rodando e em testes.

---

## 7. Persistência

### 7.1 Postgres principal (`postgres`, porta 5432)

**Prisma 7** sobre Postgres 16. Schema em `prisma/schema.prisma`. Enums e modelos principais:

| Enum                                    | Valores                                                                |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `UserRole`                              | `manifestant`, `ombudsman`, `admin`                                    |
| `ManifestationType`                     | `report`, `complaint`, `suggestion`, `compliment`                      |
| `ManifestationStatus`                   | `in_analysis`, `answered`, `canceled`, `finalized`                     |
| `ManifestationMessageSenderType`        | `manifestant`, `anonymous_manifestant`, `ombudsman`, `admin`, `system` |
| `ManifestationAttachmentUploadedByType` | `manifestant`, `anonymous_manifestant`, `ombudsman`, `admin`           |

| Modelo                    | Resumo                                                                                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`                    | id, email único, name, passwordHash, role                                                                                                                                                                         |
| `Campus`                  | id, name interno, label público, city, active                                                                                                                                                                     |
| `AdministrativeUnit`      | id, campusId, name interno, label público, active                                                                                                                                                                 |
| `Manifestation`           | id, protocol único, type, status, campusId, administrativeUnitId, description, involvedPeople, authorUserId (nullable — anônimas), attendantUserId, accessCodeHash (nullable — só anônimas), createdAt, updatedAt |
| `ManifestationEvaluation` | id, manifestationId, attendantUserId, attendantRoleSnapshot, authorUserId, rating, comment                                                                                                                        |
| `ManifestationMessage`    | id, manifestationId, senderUserId (nullable), senderType, content                                                                                                                                                 |
| `ManifestationAttachment` | id, manifestationId, originalName, mimeType, sizeInBytes, storageKey, uploadedByType                                                                                                                              |

### 7.2 Histórico sem tabela de audit

A `ManifestationDetailsDTO.history[]` é **reconstruída** a partir de `manifestation_messages`:

- `registered` → sintetizado do `Manifestation.createdAt` + autor.
- `administrative_answered` → mensagens não-sistema enviadas por `ombudsman`/`admin`.
- `status_changed`, `finalized_by_author`, `evaluation_recorded` → mensagens de **sistema** cujo `content` é um JSON payload (`src/infra/database/prisma/system-message-payload.ts`).

A repository administrativa grava o agregado **+** a mensagem de sistema na mesma `$transaction`. Garante que o audit log não diverge do estado.

### 7.3 Postgres de vetores (`ai-postgres`, porta 5433)

Imagem `pgvector/pgvector:pg17`. Banco separado do principal (não comparte conexão). `ai-bootstrap` é um job docker idempotente que cria a extensão `vector` antes do `ai-api` subir.

Ingestão (`pnpm ingest` dentro de `ai-api/`):

1. Lê PDFs em `ai-api/docs/`.
2. `pdf-parse` → texto bruto.
3. `RecursiveCharacterTextSplitter` (LangChain) → chunks.
4. Gemini Embeddings → vetores.
5. Upsert em pgvector (`pnpm ingest:reset` apaga antes).

---

## 8. Autenticação e autorização

### Tokens

- Login (`POST /sessions`) devolve um JWT HS256 assinado com `JWT_SECRET` contendo `{ sub, role }`.
- Frontend guarda em `sessionStorage` (chave `ouvidoria-uespi-auth-token`). Cabeçalho `Authorization: Bearer <token>` adicionado automaticamente pelo `apiFetch`.
- 401 ⇒ FE limpa o token e usuário cai no login.

### Middlewares Fastify

- `ensureAuthenticated` — exige token; popula `request.user = { id, role }`.
- `optionalAuthenticate` — token opcional (usado em `POST /manifestations` para suportar abertura anônima).
- `requireRoles('ombudsman', 'admin')` — gating de rotas `/admin/*`.

### Papéis e ações

| Papel                 | Pode                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | --------- | --------------------------------- |
| `manifestant`         | Abrir manifestação identificada, listar/ver as próprias, enviar mensagem, anexar (até 5×10MB), finalizar (só após `answered`), avaliar (só após `finalized`) |
| Anônimo               | Abrir manifestação anônima, rastrear por `protocol + accessCode`, anexar, baixar anexos públicos                                                             |
| `ombudsman` / `admin` | Listar/filtrar todas em `/admin/manifestations`, responder, transitar status (`in_analysis                                                                   | answered → answered | finalized | canceled`), baixar qualquer anexo |

Identidade dos casos de uso (`userId`, `requesterId`) **não vai em body/query/path** — só pelo JWT.

---

## 9. Contrato HTTP

Fonte de verdade: `doc/api/frontend-integration.md`. Resumo das rotas:

| Método | Path                                                        | Auth                 | Notas                                                           |
| ------ | ----------------------------------------------------------- | -------------------- | --------------------------------------------------------------- |
| POST   | `/users`                                                    | Pública              | Cria conta manifestante                                         |
| POST   | `/sessions`                                                 | Pública              | Login → JWT                                                     |
| GET    | `/catalog`                                                  | Pública              | Campi e unidades ativos                                         |
| POST   | `/manifestations`                                           | Opt. (Bearer)        | Identificada ou anônima                                         |
| GET    | `/manifestations?page=`                                     | Bearer               | Lista do próprio manifestante                                   |
| GET    | `/manifestations/:id`                                       | Bearer               | Detalhe (history, messages, attachments)                        |
| POST   | `/manifestations/:id/attachments`                           | Bearer               | 1 arquivo por chamada, `multipart/form-data`                    |
| POST   | `/manifestations/:id/attachments/:attId/download-url`       | Bearer               | Signed URL (TTL ~300s)                                          |
| POST   | `/manifestations/:id/messages`                              | Bearer               | Mensagem do autor                                               |
| POST   | `/manifestations/:id/finalize`                              | Bearer               | `answered → finalized`                                          |
| POST   | `/manifestations/:id/evaluation`                            | Bearer               | Avaliação pós-finalização                                       |
| POST   | `/manifestations/track`                                     | Pública              | Rastreio anônimo (resumo)                                       |
| POST   | `/manifestations/track/details`                             | Pública              | Rastreio anônimo (detalhe + anexos)                             |
| POST   | `/manifestations/track/attachments`                         | Pública              | Upload anônimo (`protocol+accessCode+file`)                     |
| POST   | `/manifestations/track/attachments/:attId/download-url`     | Pública              | Signed URL anônima                                              |
| GET    | `/admin/manifestations`                                     | `ombudsman \| admin` | Filtros: status, type, campusId, administrativeUnitId, from, to |
| GET    | `/admin/manifestations/:id`                                 | `ombudsman \| admin` | Detalhe administrativo                                          |
| POST   | `/admin/manifestations/:id/answer`                          | `ombudsman \| admin` | Resposta + transição para `answered`                            |
| PATCH  | `/admin/manifestations/:id/status`                          | `ombudsman \| admin` | `finalized` ou `canceled`                                       |
| POST   | `/admin/manifestations/:id/attachments/:attId/download-url` | `ombudsman \| admin` | Signed URL administrativa                                       |
| POST   | `/ai/messages`                                              | Pública              | Stateless, FE envia `history`                                   |

### Erro padrão

```ts
type ApiError = { error: string; message: string }
```

Códigos representativos: `ValidationError`, `UnauthenticatedError`, `ForbiddenError`, `ManifestationNotFoundError`, `ManifestationStatusTransitionNotAllowedError`, `UserAlreadyExistsError`, etc.

---

## 10. Comunicação entre serviços

```
┌──────────────┐  HTTP/JSON  ┌──────────────────────┐
│  web/ (SPA)  │ ──────────► │ ouvidoria-backend-   │
│  React 19    │             │ core (Fastify+Prisma)│
└──────────────┘             └─────────┬────────────┘
                                       │ HTTP (AiGateway interface)
                                       │ via HttpAiGateway quando
                                       │ AI_GATEWAY_PROVIDER=http
                                       ▼
                             ┌──────────────────────┐
                             │ ai-api (Fastify +    │
                             │ LangChain + Gemini)  │
                             └─────────┬────────────┘
                                       │ SQL
                                       ▼
                             ┌──────────────────────┐
                             │ ai-postgres (pgvector│
                             │ pg17)                │
                             └──────────────────────┘
       Backend core ───────► postgres 16 (manifestações, users, anexos)
```

- `web/` **só fala com o backend principal**. Nunca chama o `ai-api` direto.
- Backend → `ai-api`: na rota `POST /ai/messages`, o controller resolve catálogo no Prisma, monta payload e delega ao `AiGateway` (`FakeAiGateway` ou `HttpAiGateway`).
- Storage de anexos: backend chama Supabase (`@supabase/supabase-js`) via `AttachmentStorageGateway`. FE nunca vê `storageKey` ou bucket — só signed URLs curtas.

---

## 11. Deploy local

`docker-compose.yml` na raiz orquestra:

| Serviço        | Imagem                             | Porta | Função                                      |
| -------------- | ---------------------------------- | ----- | ------------------------------------------- |
| `postgres`     | `postgres:16-alpine`               | 5432  | Banco principal                             |
| `ai-postgres`  | `pgvector/pgvector:pg17`           | 5433  | Vector store da IA                          |
| `ai-bootstrap` | `pgvector/pgvector:pg17`           | —     | Job idempotente (cria extensão `vector`)    |
| `ai-api`       | build local de `ai-api/Dockerfile` | 3334  | Microserviço de IA                          |
| `web`          | build local de `web/Dockerfile`    | 5173  | Frontend dev (`VITE_API_BASE_URL` injetado) |

O backend principal **não** roda em container por padrão — sobe via `pnpm dev` (tsx watch + `--env-file=.env`).

### Variáveis de ambiente principais

Backend (`/.env`):

- `DATABASE_URL` — Postgres principal
- `JWT_SECRET`
- `AI_GATEWAY_PROVIDER` = `fake` | `http`
- `AI_SERVICE_BASE_URL`, `AI_SERVICE_API_KEY` (quando `http`)
- `SUPABASE_*` — storage de anexos

`ai-api/.env`:

- `DATABASE_URL` — pgvector
- `GOOGLE_API_KEY` — Gemini
- `AI_SERVICE_API_KEY` — auth de entrada (middleware checa)

`web/.env`:

- `VITE_API_BASE_URL` — URL do backend principal

---

## 12. Fluxos de desenvolvimento

### Backend

```bash
pnpm install
pnpm db:up                  # Postgres principal
pnpm prisma migrate deploy  # ou pnpm prisma migrate dev
pnpm db:seed                # popula campus + ouvidor@uespi.br / admin@uespi.br (Senha123)
pnpm dev                    # tsx watch --env-file=.env
```

Antes de PR:

```bash
pnpm check                  # format:check + lint + type:check + unit tests
pnpm test:e2e               # opcional, requer Postgres
```

Single test:

```bash
pnpm vitest run test/unit/application/sign-in-use-case.spec.ts
pnpm vitest run --config ./vitest.config.e2e.mjs test/e2e/auth.e2e.spec.ts
```

### Frontend

```bash
cd web
npm install
npm run dev                 # Vite na 5173
npm test
npm run build               # tsc -b && vite build
npm run lint
```

### AI

```bash
cd ai-api
pnpm install
pnpm db:up                  # pgvector na 5433
pnpm ingest                 # carrega PDFs em docs/ no pgvector
pnpm dev                    # Fastify watch
```

---

## 13. Convenções de código

### TypeScript

- `tsconfig.base.json` agressivo: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `useUnknownInCatchVariables`, `noImplicitOverride`.
- Type-only imports separados (`import type { Foo } from ...`) — `consistent-type-imports`.
- Import order alfabetizado: builtin → external → internal → relativo, com linha em branco entre grupos.
- `strict-boolean-expressions` ligado: nullables comparados explicitamente (`value === null`, `value !== undefined`).
- `no-floating-promises` e `no-misused-promises` ligados.
- Sem `any`, sem `unsafe member access`, sem `console.log` em `src/` (só `console.warn`/`error`).

### Prettier

- Sem semicolons, aspas simples, trailing commas, `printWidth: 120`.

### Commits

Husky `commit-msg` chama `scripts/validate-commit-msg.sh`:

```
^(chore|docs|feat|fix|refactor|test): ([a-z].*[^.])$
```

Regras:

- Tipo só de `chore | docs | feat | fix | refactor | test`.
- Subject ≥ 10 caracteres, **primeira letra minúscula**, sem ponto final.

`pre-commit` roda `lint-staged`.

### Domínio

Vocabulário canônico (não introduzir paralelos como `ticket`, `issue`, `request`):

- `User` (roles: `manifestant`, `ombudsman`, `admin`)
- `Manifestation`, `Protocol`, `Attachment`, `ManifestationMessage`, `ManifestationEvaluation`
- `ManifestationType`: `report | complaint | suggestion | compliment`
- `ManifestationStatus`: `in_analysis | answered | canceled | finalized`

### Padrão arquitetural (resumo)

| O que                                              | Onde mora                                                     |
| -------------------------------------------------- | ------------------------------------------------------------- |
| Regra de transição de status                       | Método do agregado em `domain/entities/manifestation.ts`      |
| Erro de transição                                  | Mesmo módulo (`ManifestationStatusTransitionNotAllowedError`) |
| Validação de input HTTP                            | Zod em `presentation/` via `Validator<T>`                     |
| Permissões finas (autorizar pessoa X em recurso Y) | Use case em `application/use-cases/...`                       |
| Gating grosso (papel pode acessar a rota?)         | Middleware Fastify em `infra/http/fastify/middlewares`        |
| Transação multi-tabela                             | Repository em `infra/database/prisma/repositories`            |
| Política de visibilidade no FE                     | `web/src/application/<area>/<name>-policy.ts`                 |
| Componente de UI compartilhado                     | `web/src/components/<área>/`                                  |

---

## 14. Documentação relacionada

- `AGENTS.md` — handbook canônico de contribuição (arquitetura, naming, política de commits).
- `CLAUDE.md` — overrides para assistentes (complementa `AGENTS.md`).
- `doc/ouvidoria-prd.md` — PRD do produto.
- `doc/api/frontend-integration.md` — contrato HTTP detalhado, fonte de verdade para o FE.
- `doc/architecture/ai-chatbot.md` — arquitetura específica do Guará/AI.
- `doc/integration-status.md` — estado das slices de integração frontend ↔ backend.
- `doc/cockburn/` — casos de uso em notação Cockburn.
- `doc/features/` — specs de feature individuais.
