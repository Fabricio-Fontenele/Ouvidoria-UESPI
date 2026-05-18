# `@ouvidoria/ai-api`

Microsserviço de IA da **Ouvidoria UESPI**. Roda como processo HTTP separado do backend principal e é consumido por ele através do `HttpAiGateway`.

Responsabilidades:

1. **Responder dúvidas institucionais** com RAG sobre uma base de conhecimento curada (regimentos, FAQs, normas).
2. **Classificar a intenção** da conversa (`institutional_question`, `manifestation_candidate`, `manifestation_draft_ready`, `out_of_scope`, `unknown`).
3. **Sugerir um draft estruturado de manifestação** quando a conversa pedir, validando IDs contra o catálogo enviado pela API principal.

**Não faz** persistência de manifestações, autenticação de usuário final, decisão de status ou qualquer regra de negócio — quem manda é a API principal.

## Stack

- Node 22+, TypeScript strict, ESM puro
- Fastify (HTTP)
- LangChain.js v1 (`@langchain/core`, `@langchain/community`, `@langchain/google-genai`, `@langchain/textsplitters`)
- Google Gemini (embeddings + chat com `withStructuredOutput`)
- PostgreSQL + pgVector (porta `5433` por padrão, base própria)
- Zod para validação de envs, request e response do LLM

## Arquitetura

```
src/
├── main/               # bootstrap + composition root (server, env, routes, factories)
├── presentation/       # controllers, middlewares (x-api-key), validators (zod)
├── application/        # use cases, DTOs, ports (LlmProvider, KnowledgeRetriever, CatalogContext)
└── infra/              # adapters: gemini, pgvector, ingestion
```

Detalhes em `../doc/architecture/ai-chatbot.md` (no repositório raiz).

## Endpoints

- `GET /health` — responde `{ "status": "ok" }` sem tocar dependências externas no momento da requisição. Caveat: o bootstrap atual inicializa o pgVector antes de subir o Fastify (fail-fast), então se o banco estiver fora o processo nem chega a responder. Para liveness verdadeiramente independente de dependências, seria preciso atrasar a inicialização para depois do `listen()` (não feito no MVP).
- `GET /ready` — readiness. Verifica conexão com pgVector e configuração do Gemini, sem disparar geração. Resposta: `{ "status": "ok" | "degraded", "vectorStoreOk": boolean, "hasIndexedChunks": boolean, "geminiConfigured": boolean }`.
- `POST /ai/messages` — protegido por header `x-api-key`. Contrato em `src/application/dtos/`.

## Configuração

Copie `.env.sample` para `.env` e preencha:

```env
PORT=4000

# Gemini
GOOGLE_API_KEY=...
GOOGLE_EMBEDDING_MODEL=models/gemini-embedding-001
GOOGLE_EMBEDDING_DIMS=3072
GOOGLE_CHAT_MODEL=models/gemini-3-flash

# pgVector
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/rag
PG_VECTOR_COLLECTION_NAME=ouvidoria_kb

# Knowledge base + RAG tuning
KB_DIR=./docs/knowledge-base
RAG_CHUNK_SIZE=400
RAG_CHUNK_OVERLAP=0
RAG_TOP_K=4

# Mesma chave configurada no AI_SERVICE_API_KEY do backend principal
AI_API_KEY=...
```

> Confira o nome exato do `GOOGLE_CHAT_MODEL` que sua chave aceita com
> `curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GOOGLE_API_KEY"`.

## Execução

```bash
# 1) sobe pgVector
pnpm --filter @ouvidoria/ai-api db:up

# 2) ingere a base de conhecimento
# Primeira ingestão (banco limpo):
pnpm --filter @ouvidoria/ai-api ingest
# Re-ingest após mudar/adicionar documentos (dropa a tabela antes de popular):
pnpm --filter @ouvidoria/ai-api ingest:reset

# 3) sobe o servidor
pnpm --filter @ouvidoria/ai-api dev
```

## Integração com o backend principal

A API principal escolhe entre `FakeAiGateway` (default, sem dependência externa) e `HttpAiGateway` (este serviço) via env `AI_GATEWAY_PROVIDER=http|fake`. Quando `http`, exige `AI_SERVICE_BASE_URL` e `AI_SERVICE_API_KEY`.

O contrato HTTP espelha o `AiGatewayChatInput` / `AiGatewayChatResponse` do backend (`src/application/ai/ai-gateway.ts` no projeto raiz) — o `HttpAiGateway` não transforma payloads.

## Atribuição

Partes da pipeline de ingestão e do RAG foram adaptadas de um projeto educacional MIT de terceiros — ver [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).
