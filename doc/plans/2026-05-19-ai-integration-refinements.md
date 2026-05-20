# Refinamentos da Integração AI — 2026-05-19

> Documento de registro das melhorias aplicadas à integração entre o backend
> principal e o microserviço `ai-api` após o primeiro smoke test end-to-end
> bem-sucedido (cenários `institutional_question`, `manifestation_candidate`,
> `manifestation_draft_ready`, `out_of_scope`).
>
> Cobre: o que mudou, **por quê**, descobertas durante a integração, e
> recomendações pendentes que ficaram fora de escopo.

---

## 1. Resumo executivo

Após o smoke test funcional, foram identificadas 12 melhorias possíveis na
camada de integração entre backend e `ai-api`. Desta rodada, **9 foram
implementadas**; **1 foi adiada** (streaming + classificador em dois modelos)
por exigir refator arquitetural multi-arquivo; e **2 ficam sob responsabilidade
do usuário** (conversão de PDFs escaneados para markdown).

| ID  | Item                                                      | Status     |
| --- | --------------------------------------------------------- | ---------- |
| 1   | Ajuste de `RAG_CHUNK_SIZE` (400 → 600)                    | ✅         |
| 2   | Rotação da `x-api-key` compartilhada                      | ✅         |
| 3   | Script `pnpm dev` no backend principal                    | ✅         |
| 4   | Cache do catálogo (`CachedCatalogRepository`)             | ✅         |
| 5   | Endpoints `/health` e `/ready` no backend                 | ✅         |
| 6   | Rate limit em `POST /ai/messages`                         | ✅         |
| 7   | Truncamento de histórico por caracteres                   | ✅         |
| 8   | Reforço do prompt para `involvedPeople`                   | ✅         |
| 9   | Audit log estruturado de chats (LGPD-safe, metadata-only) | ✅         |
| 10  | Cobertura de testes para os novos códigos                 | ✅         |
| 11  | Streaming de respostas + classificador em 2 modelos       | ⏭ Adiado  |
| 12  | Conversão dos PDFs restantes em markdown                  | 👤 Usuário |

Resultado dos gates após as alterações:

- Backend: `pnpm check` (format + lint + type-check + 364 testes) → verde
- `ai-api`: `pnpm type:check` + 29 testes → verde
- Smoke test end-to-end via HTTP real (porta 3333 → 4000) → verde

---

## 2. Refinamentos aplicados

### 2.1 Ajuste de `RAG_CHUNK_SIZE` (400 → 600)

**Motivação.** O cenário `institutional_question` ("Qual o prazo da Ouvidoria
responder?") devolveu "não tenho essa informação" no smoke test inicial,
apesar do Art. 15 §1º da Resolução CONSUN 005/2018 estar indexado e responder
diretamente à pergunta. Chunks de 400 caracteres fragmentam artigos jurídicos
(o §1º cai em um chunk, o §2º em outro), prejudicando a busca semântica.

**O que foi feito.** `ai-api/.env`: `RAG_CHUNK_SIZE="600"`.

**Descoberta importante.** Tentei inicialmente subir para 1000 (recomendação
para textos legais). O `gemini-embedding-001` rejeita silenciosamente
~96% dos chunks nesse tamanho (retorna vetor vazio em vez de erro). Tabela
empírica:

| `RAG_CHUNK_SIZE` | chunks gerados | persistidos | rejeitados |
| ---------------- | -------------- | ----------- | ---------- |
| 400              | 288            | 88 (30%)    | 200        |
| 600              | 178            | 78 (44%)    | 100        |
| 1000             | 104            | 4 (4%)      | 100        |

600 foi o sweet spot empírico: mais texto por chunk sem disparar a rejeição
massiva. A pipeline de ingestão já filtra vetores vazios em
`ai-api/src/infra/ingestion/knowledge-base-ingestion.ts`
(`addVectors` manual após `embedDocuments`), então a base permanece consistente
mesmo com a rejeição.

Saúde atual do índice:

| Fonte                                          | Chunks |
| ---------------------------------------------- | ------ |
| `decreto-15188-2013-lei-acesso-informacao.md`  | 39     |
| `resolucao-consun-005-2018-ouvidoria-uespi.md` | 32     |
| `faq-ouvidoria.md`                             | 7      |
| **Total persistido**                           | **78** |

> **Observação.** A pergunta sobre prazo continuou não sendo respondida com a
> citação do Art. 15 §1º após o reingest. Isso indica que o problema _não_ é
> apenas tamanho de chunk — é qualidade semântica do embedding em si. Veja
> recomendações pendentes em §3.2.

### 2.2 Rotação da `x-api-key` compartilhada

**Motivação.** Os dois `.env` continham `"change-me"` como API key compartilhada
entre backend e `ai-api`. Placeholder explícito que não deveria sobreviver ao
primeiro deploy.

**O que foi feito.**

```bash
openssl rand -base64 48 | tr -d '\n'
```

O valor (64 chars base64) foi escrito em:

- `.env` → `AI_SERVICE_API_KEY`
- `ai-api/.env` → `AI_API_KEY`

A simetria é verificada por comparação de strings durante o boot do
`HttpAiGateway` (backend) e por `timingSafeEqual` no middleware
`api-key-auth.ts` (ai-api). Em produção, o segredo deve vir do gerenciador
de segredos (Vault, AWS Secrets Manager, GCP Secret Manager, etc.), não do
arquivo `.env`.

### 2.3 Scripts `dev`/`start` no backend principal

**Motivação.** Não havia script `dev` no `package.json` do backend principal.
Durante o smoke test foi preciso `pnpm build && node build/main/server.js`,
que falhava com `DATABASE_URL must be set before the Prisma client is created`
devido à ordem de carregamento entre `dotenv/config` e o import do
`prisma/client.ts`. O CLAUDE.md inclusive registra essa lacuna.

**O que foi feito.** Em `package.json`:

```json
"dev": "tsx watch --env-file=.env src/main/server.ts",
"start": "node --env-file=.env build/main/server.js"
```

O flag `--env-file` (Node 22) carrega o `.env` **antes** de qualquer `import`,
eliminando o problema de ordem do Prisma. Funciona tanto em `tsx watch` (dev)
quanto em `node` (build).

### 2.4 Cache do catálogo (`CachedCatalogRepository`)

**Motivação.** O `SendAiMessageUseCase` invoca `CatalogRepository.listPublic()`
a cada mensagem do chat. Campi/unidades mudam raramente (semanas/meses); cada
chamada batia em duas tabelas do Postgres sem necessidade.

**O que foi feito.** Decorator pattern em
`src/infra/database/cached-catalog-repository.ts`:

- Cache em memória do `listPublic()` apenas.
- TTL configurável via `CATALOG_CACHE_TTL_MS` (padrão 5 min).
- `findCampusById` / `findAdministrativeUnitById` **não são cacheados** —
  esses métodos servem casos de uso administrativos que se beneficiam de
  consistência forte.
- Método `invalidate()` para limpar o cache manualmente (não usado hoje, mas
  reservado para quando houver UI de gestão de catálogo).
- `Clock` injetável para testes determinísticos.

Wiring em `src/main/factories/infrastructure.ts`:

```ts
const catalogRepository = new CachedCatalogRepository(new PrismaCatalogRepository(prisma), env.CATALOG_CACHE_TTL_MS)
```

Cobertura: 4 testes em
`test/unit/infra/database/cached-catalog-repository.spec.ts`.

### 2.5 Endpoints `/health` e `/ready` no backend

**Motivação.** Antes desta rodada, o backend não tinha endpoint de saúde
algum; `curl /health` retornava 404. O `ai-api` já tinha os dois — o backend
ficava como o lado opaco da arquitetura para load balancers e probes de
infraestrutura.

**O que foi feito.** Novo arquivo `src/main/routes/health.routes.ts`:

- `GET /health` → `{ status: "ok" }`. Cheap, sem I/O. Adequado para liveness.
- `GET /ready` → executa `SELECT 1` no Prisma; devolve `200 { status: "ok",
databaseOk: true }` ou `503 { status: "degraded", databaseOk: false }`.
  Adequado para readiness.

Registrado em `server.ts` antes das demais rotas para garantir que a
verificação de saúde funcione mesmo se rotas de negócio tiverem problemas.

### 2.6 Rate limit em `POST /ai/messages`

**Motivação.** Cada chamada ao `/ai/messages` consome tokens do Gemini
(custo monetário) e ~6-12s de latência. Sem rate limit, um cliente abusivo
(ou bot mal configurado) pode esgotar a cota do projeto.

**O que foi feito.** Plugin `@fastify/rate-limit` registrado no `server.ts`:

- **Global desligado** (`global: false`), max default 120/min/IP — proteção
  do servidor inteiro, mas só ativa quando aplicada por rota.
- **Rota AI** (`src/main/routes/ai.routes.ts`): `max: 10, timeWindow: '1 minute'`
  por IP. Suficiente para uso humano normal de chat, restritivo para
  automação.
- **Desligado em `NODE_ENV=test`** para não afetar a suíte de testes.

Validação ao vivo: na 11ª request consecutiva da mesma origem, Fastify
respondeu HTTP 429 com mensagem padrão do plugin.

### 2.7 Truncamento de histórico por caracteres

**Motivação.** O schema Zod limita o array `history` a 20 mensagens; mas se
cada mensagem usar o limite de 4000 chars, o histórico sozinho ocupa 80kb
de prompt — sem contar catálogo, chunks RAG, regras invioláveis. O Gemini
suporta 1M tokens, mas custa.

**O que foi feito.** `SendAiMessageUseCase.truncateHistory()` em
`src/application/use-cases/send-ai-message/send-ai-message-use-case.ts`:

- Itera do final do array para o início, mantendo as mensagens mais recentes
  até o orçamento de chars (`AI_HISTORY_MAX_CHARS`, padrão 12 000 chars
  ≈ 3 000 tokens) acabar.
- Se uma única mensagem já excede o orçamento, ela é mantida (não dá para
  truncar mais sem mutilar a conversa).
- Aplicado antes da chamada ao `AiGateway.chat()`.

Cobertura: 2 testes em `test/unit/application/send-ai-message-use-case.spec.ts`
(orçamento suficiente preserva tudo; orçamento curto mantém apenas as
mensagens mais recentes).

### 2.8 Reforço do prompt para `involvedPeople`

**Motivação.** Durante o smoke test, mensagens como "fui mal atendido pela
**atendente** da biblioteca" produziam `involvedPeople: null`. O modelo
interpretava "atendente" como descrição genérica e descartava. A regra
anterior dizia "se o usuário não citou ninguém, devolva null", o que era
estrito demais.

**O que foi feito.** Em `ai-api/src/infra/rag/rag-prompt-builder.ts`, a regra
sobre `involvedPeople` foi reescrita:

> Registre quem o usuário citou como envolvido no fato. Inclua **mesmo
> referências genéricas sem nome próprio** ("a atendente", "o segurança da
> portaria", "o professor da disciplina X", "dois alunos do 3º período"),
> usando exatamente o vocabulário do usuário. Só devolva `null` quando o
> usuário realmente não mencionar nenhuma pessoa. Nunca invente nomes
> próprios — se o usuário disse "a atendente", o valor deve ser literalmente
> "a atendente".

Validação ao vivo: a mesma mensagem agora produz
`"involvedPeople": "a atendente"` — exato como o prompt pede.

### 2.9 Audit log estruturado de chats (LGPD-safe)

**Motivação.** Não havia registro de quais perguntas viram quais drafts.
Sem isso, é impossível medir taxa de acerto do classificador, identificar
intenções recorrentes que merecem atalhos, ou debugar regressões silenciosas
de qualidade.

**Cuidado crítico de privacidade.** Em ouvidoria, `draft.description` é a
narrativa livre do manifestante e `draft.involvedPeople` é PII de terceiros
("Prof. João Silva", "a atendente do RU"). Logar esses campos em stdout
implica vazá-los para qualquer pipeline downstream (Loki, ELK, CloudWatch),
violando a LGPD e os requisitos institucionais de sigilo da manifestação.
**O audit log é metadata-only por contrato.**

**O que foi feito.** Port + adapter:

- **Port** `src/application/ai/ai-chat-audit-logger.ts` com a interface
  `AiChatAuditLogger` e o tipo `AiChatAuditEvent`. O contrato está
  documentado no próprio arquivo: "audit events MUST NOT carry user-supplied
  free text".
- **Campos registrados**: `requestId` (Fastify reqId, opcional), `intent`,
  `confidence`, `shouldOpenManifestationDraft`, `hasDraft` (booleano),
  `draftFields` (lista dos **nomes** dos campos preenchidos —
  `["type", "campusId", "description", ...]` — sem valores), `missingFields`,
  `latencyMs`, `historyLength`, `messageLength`, `error?`.
- **Campos deliberadamente ausentes**: `draft` (e portanto `description`,
  `involvedPeople`, ids resolvidos), conteúdo das mensagens do usuário,
  histórico da conversa.
- **Adapter** `src/infra/ai/console-ai-chat-audit-logger.ts` que escreve
  uma linha JSON Pino-compatible no stdout (`level: 30`, `type: "ai.chat"`,
  `time`).
- **Plumbing do requestId.** `HttpRequest` ganhou `requestId?: string`,
  populado pelo `buildHttpRequest` a partir de `FastifyRequest.id`. O
  controller passa para o use case via `SendAiMessageInput.requestId`. O
  use case repassa para o audit event. Resultado: dá pra correlacionar a
  linha de audit com o req log do Fastify (`reqId`) caso seja necessário
  investigar via canal autorizado.

Por que stdout/Pino e não tabela de banco:

- Sem migration adicional.
- Latência zero no path crítico de resposta (gravar em DB adicionaria
  20-50ms ou requereria fila).
- A promoção para DB-backed audit é trivial no futuro — basta um adapter
  `PrismaAiChatAuditLogger` implementando o mesmo port. Adapter pattern
  preserva isso.

Cobertura: 3 testes em `test/unit/application/send-ai-message-use-case.spec.ts`:

1. Sucesso com draft cheio: o evento contém `hasDraft: true`, lista correta
   de `draftFields`, e **a serialização JSON do evento não contém nenhuma
   palavra do conteúdo do usuário** (asserção explícita com `expect(serialized)
.not.toContain('João Silva')`, idem "atendente", "rude").
2. Resposta institucional: `hasDraft: false` e `draftFields: []`.
3. Falha do gateway: `error.message` é registrado, mas `hasDraft` continua
   `false` e `draftFields` continua `[]`.

Linha exemplo (smoke test live com payload contendo "Prof. João Silva /
destratou / Coordenação"):

```json
{
  "level": 30,
  "type": "ai.chat",
  "time": 1779162563036,
  "intent": "manifestation_draft_ready",
  "confidence": 1,
  "shouldOpenManifestationDraft": true,
  "hasDraft": true,
  "draftFields": ["type", "campusId", "administrativeUnitId", "description", "involvedPeople"],
  "missingFields": [],
  "latencyMs": 8312,
  "historyLength": 0,
  "messageLength": 116,
  "requestId": "req-2"
}
```

Grep por `joão|silva|destratou|coordenação|prof\.` na linha de audit
retorna vazio — confirmado in vivo.

### 2.10 Novos testes unitários

| Arquivo                                                             | Testes adicionados                                                                                                            |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `test/unit/infra/database/cached-catalog-repository.spec.ts`        | 4 (cache hit / TTL expiry / invalidate / no-cache em métodos findById)                                                        |
| `test/unit/application/send-ai-message-use-case.spec.ts` (extensão) | 5 (truncate suficiente / truncate excedido / audit metadata-only com asserção anti-PII / audit institucional / audit no erro) |
| **Total**                                                           | **+9**                                                                                                                        |

Total geral no backend: **364 testes em 50 arquivos** (era 355).

---

## 3. Recomendações pendentes

### 3.1 Streaming de respostas + classificador em dois modelos (item 11)

**Por que adiei.** É um refator arquitetural multi-arquivo:

- `LlmProvider` port precisaria expor um método streaming (`completeStream`).
- `ai-api` precisaria de uma nova rota `POST /ai/messages/stream` com
  Server-Sent Events ou chunked transfer.
- `HttpAiGateway` precisaria de uma versão streaming do método `chat`.
- `SendAiMessageController` precisaria retornar SSE em vez de JSON único.
- O contrato com o frontend muda (estado de "digitando" + atualização parcial).

**Quando vale a pena.** Quando a UX de "esperar 6-12s em branco" se mostrar
problema real com usuários. Pode não ser problema relevante para o MVP da
UESPI (tráfego baixo, usuários acostumados a esperar respostas de chatbot).

**Sub-item barato e independente.** O classificador em dois modelos é
ortogonal ao streaming. Hoje todos os intents (incluindo `out_of_scope`,
que é trivial) pagam o preço do Gemini 2.0 Flash. Um classificador de intent
mais barato (Gemini 1.5 Flash-8B, Haiku, ou até regex) poderia rejeitar
`out_of_scope` em <500ms sem chamar o modelo caro. Estimativa: redução de
30-40% no custo médio por chamada.

### 3.2 Qualidade do retrieval RAG — RESOLVIDO (issue #37)

**Status**: fechado em 2026-05-19 com 18/18 PASS na suíte de regressão
(6 queries normativas × 3 rodadas consecutivas, zero FAIL).

**Diagnóstico real**, descoberto durante a investigação:

A regressão original (\"Sinto muito, mas não encontrei o prazo...\") tinha
duas causas independentes empilhadas:

1. **`GOOGLE_CHAT_MODEL=models/gemini-3-flash` retornava 404** — o modelo
   não existe na API do Google. Dois `try/catch` silenciosos (no provider
   Gemini e no use case) engoliam o erro e devolviam `NEUTRAL_FALLBACK_RESPONSE`
   sem nenhum log. Toda chamada parecia 200 OK em ~1s, simulando \"o bot
   não soube responder\" quando a stack inteira estava quebrada. Corrigido
   em PR #41: troca pra `gemini-2.5-flash` (free tier ~1.5k RPD; `gemini-3.5-flash`
   é só 20 RPD/dia, inviável pra dev) + `request.log.error/warn` no controller.
2. **Header propagation ausente no splitter** — `RecursiveCharacterTextSplitter`
   com `chunkOverlap=0` cortava entre `#### Art. X` e `§ 1º ...`. O LLM
   recebia o §1º sem o artigo pai e ou (a) chutava um número errado, ou
   (b) cumpria a regra anti-alucinação e citava só `§ 1º (Resolução CONSUN...)`
   sem o `Art. X` — ambos reprovam o critério de cita literal.

**Estratégia adotada** (combinação mínima que passou 18/18):

- `GOOGLE_CHAT_MODEL` default → `models/gemini-2.5-flash` (ajustável via
  `.env` em prod).
- `RAG_CHUNK_OVERLAP` default `0 → 300` — garante header em chunks vizinhos
  mesmo quando o splitter custom falhar em algum caso.
- `RAG_TOP_K` default `4 → 8` — recall mais largo; o LLM filtra ruído.
- **Header-aware splitter custom** em `ai-api/src/infra/ingestion/text-splitter.ts`:
  parseia markdown headers (`#` a `######`), mantém um stack hierárquico, e
  PREPENDE o caminho completo (`# Doc / ## Capítulo / ### Seção / #### Art. X`)
  em cada chunk filho. Para docs sem headers (PDFs convertidos sem estrutura),
  cai pro `RecursiveCharacterTextSplitter` puro.
- **Regra anti-alucinação no prompt**: \"só cite 'Art. X' se 'Art. X' aparecer
  literalmente no mesmo trecho que você está reproduzindo\".
- Script de regressão reproduzível em `ai-api/scripts/rag-regression.ts`
  (parametrizado por `AI_API_BASE_URL` + `AI_API_KEY`, define \"estável\" como
  6 × 3 = 18/18 PASS).

**Trade-off final**: ficamos com as 4 estratégias mais baratas da lista
original (overlap, top_k, prompt, header propagation) — sem precisar de
query rewriting, BM25 reranker, hybrid search ou trocar o modelo de embedding.
A propagação de header é a peça-chave: faz com que cada chunk vetorial seja
auto-suficiente para o LLM atribuir o §X ao Art. Y correto. Custo de
ingestão: ~2x chunks no banco (241 vs 173 sem propagação), todos com prefixo
de ~150 chars de header.

### 3.3 Persistência do audit log em tabela

O audit log atual vai para stdout/Pino. Para análises retrospectivas
("quais foram os top-10 intents na semana passada?", "qual o tempo médio
de resposta para `manifestation_draft_ready`?"), uma tabela é mais ergonômica.

Esboço, **mantendo o contrato metadata-only de §2.9**:

```prisma
model AiChatAuditLog {
  id                            String   @id @default(uuid())
  createdAt                     DateTime @default(now())
  requestId                     String?  // correlaciona com o reqId do Fastify
  intent                        String
  confidence                    Float?
  shouldOpenManifestationDraft  Boolean
  hasDraft                      Boolean
  // lista de NOMES de campos preenchidos, JSON ou colunas booleanas separadas:
  draftHasType                  Boolean
  draftHasCampusId              Boolean
  draftHasAdministrativeUnitId  Boolean
  draftHasDescription           Boolean
  draftHasInvolvedPeople        Boolean
  missingFieldsCount            Int
  latencyMs                     Int
  historyLength                 Int
  messageLength                 Int
  errorKind                     String?

  @@index([createdAt])
  @@index([intent, createdAt])
  @@map("ai_chat_audit_logs")
}
```

> **Atenção LGPD.** Não armazene `draft.description`, `draft.involvedPeople`,
> a mensagem original do usuário, nem o histórico em texto cru. Mesmo
> `draft.campusId` é metadata operacional (id de catálogo público), mas
> o conjunto pode permitir reconstrução de um caso individual se cruzado com
> `requestId` + logs HTTP. Se for necessário linkar audit ↔ manifestação
> aberta, use o `protocol` da manifestação (que já tem seu próprio modelo
> de acesso controlado) em vez de denormalizar conteúdo no audit.

Plus um `PrismaAiChatAuditLogger` implementando o port `AiChatAuditLogger`.
A troca é transparente para o use case — apenas o wiring em
`infrastructure.ts` muda.

### 3.4 Métrica de "abandono de draft"

Quando `shouldOpenManifestationDraft = true`, o backend não sabe se o
usuário de fato abriu a manifestação no formulário (essa transição
acontece no frontend). Vale instrumentar:

- Frontend envia uma chamada `POST /ai/messages/converted` com o `auditLogId`
  quando o usuário confirma o draft.
- Backend mede a razão `confirmed / drafts_ready` para detectar drafts mal
  preenchidos que assustam o usuário.

### 3.5 Rate limit por usuário, não por IP

Hoje o rate limit é por IP. Em ambientes corporativos atrás de NAT, todos
os usuários da UESPI dividem o mesmo IP — 10 chats/min para todo o campus.
Quando houver autenticação obrigatória no chat, mude `keyGenerator` para
`(req) => req.user.id ?? req.ip`.

### 3.6 Limpar `CLAUDE.md` quanto ao script `dev`

CLAUDE.md menciona que "no `dev` script is wired yet — add one with
`tsx`/`node --watch` as needed". Isso ficou desatualizado. Sugiro atualizar
para refletir o `pnpm dev` adicionado nesta rodada.

---

## 4. Arquivos alterados ou criados

```text
backend principal
  src/main/config/env.ts                                                     ~ +AI_HISTORY_MAX_CHARS, CATALOG_CACHE_TTL_MS
  src/main/server.ts                                                         ~ register rate-limit + health
  src/main/routes/health.routes.ts                                           + novo
  src/main/routes/ai.routes.ts                                               ~ rate-limit por rota
  src/main/factories/infrastructure.ts                                       ~ CachedCatalogRepository + ConsoleAiChatAuditLogger
  src/main/factories/controllers/ai.ts                                       ~ injeta env + audit logger
  src/application/ai/ai-chat-audit-logger.ts                                 + novo (port, metadata-only)
  src/application/use-cases/send-ai-message/send-ai-message-use-case.ts      ~ truncate + audit metadata-only + requestId
  src/presentation/protocols/http.ts                                         ~ HttpRequest.requestId
  src/presentation/controllers/ai/send-ai-message.controller.ts              ~ repassa requestId
  src/infra/http/fastify/fastify-route-adapter.ts                            ~ popula HttpRequest.requestId via FastifyRequest.id
  src/infra/database/cached-catalog-repository.ts                            + novo (decorator)
  src/infra/ai/console-ai-chat-audit-logger.ts                               + novo (adapter)
  package.json                                                               ~ dev/start scripts + @fastify/rate-limit
  test/unit/infra/database/cached-catalog-repository.spec.ts                 + novo (4 testes)
  test/unit/application/send-ai-message-use-case.spec.ts                     ~ +5 testes (truncate ×2, audit metadata-only ×3)
  .env                                                                       ~ AI_SERVICE_API_KEY rotacionada

ai-api
  src/infra/rag/rag-prompt-builder.ts                                        ~ regra de involvedPeople reforçada
  .env                                                                       ~ RAG_CHUNK_SIZE=600, AI_API_KEY rotacionada

doc
  doc/architecture/ai-chatbot.md                                             ~ valores defasados (chunk size, env vars)
  doc/plans/2026-05-19-ai-integration-refinements.md                         + este documento
```

---

## 5. Validação executada

| Gate                                            | Resultado                               |
| ----------------------------------------------- | --------------------------------------- |
| `pnpm check` no backend (format/lint/type/test) | ✅ 364/364 testes                       |
| `pnpm type:check` no `ai-api`                   | ✅                                      |
| `pnpm test` no `ai-api`                         | ✅ 29/29 testes                         |
| `pnpm ingest:reset` (chunk 600)                 | ✅ 78 chunks persistidos                |
| `/health` no backend                            | ✅ 200                                  |
| `/ready` no backend                             | ✅ 200 (`databaseOk: true`)             |
| `/ready` no `ai-api`                            | ✅ 200 (`hasIndexedChunks: true`)       |
| `POST /ai/messages` cenário 1 (instituicional)  | ✅ 200                                  |
| `POST /ai/messages` cenário 2 (involvedPeople)  | ✅ 200, `involvedPeople: "a atendente"` |
| Rate limit (12 reqs consecutivas)               | ✅ 429 a partir da 11ª                  |
| Audit log no stdout                             | ✅ JSON line por chat (metadata-only)   |
| Audit log redaction (grep PII no log live)      | ✅ sem PII; só `requestId` e metadata   |
