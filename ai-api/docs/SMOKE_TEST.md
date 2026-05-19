# Smoke test — `@ouvidoria/ai-api`

Roteiro para validar o anel completo: `db:up → ingest → dev → /health → /ready → POST /ai/messages → backend principal via HttpAiGateway`.

A base de conhecimento em `docs/knowledge-base/` deve conter apenas documentos institucionais oficiais (Resolução CONSUN 005/2018, Lei 13.460/2017, Decreto 15.188/2013 etc.). Não inclua FAQs paráfrase nem material que descreva o comportamento interno do bot.

## 0. Pré-requisitos

- `pnpm install` na raiz do workspace executado (lock atualizado).
- Docker rodando (`docker ps` responde sem erro).
- `ai-api/.env` preenchido a partir de `ai-api/.env.sample`, com:
  - `GOOGLE_API_KEY` real da Google AI Studio
  - `AI_API_KEY` definido (string qualquer; será usado no `x-api-key`)
  - `GOOGLE_CHAT_MODEL` confirmado para a chave (recomendado: `models/gemini-3-flash`)

Para confirmar quais modelos sua chave aceita:

```bash
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GOOGLE_API_KEY" \
  | grep -E '"name"|"supportedGenerationMethods"' | head -40
```

## 1. Subir o pgVector

```bash
pnpm --filter @ouvidoria/ai-api db:up
docker ps   # esperado: postgres_rag_ts up (healthcheck passando)
```

## 2. Ingerir a base de conhecimento

```bash
pnpm --filter @ouvidoria/ai-api ingest
```

**Saída esperada (linhas-chave):**

```
[ingest] knowledge base directory: ./docs/knowledge-base
[ingest] chunk size=400 overlap=0
[ingest] loaded N raw documents from disk
[ingest] split into M chunks
[ingest] persisted M chunks to "ouvidoria_kb"
```

Se rodar uma segunda vez, os chunks **vão duplicar**. Use `pnpm --filter @ouvidoria/ai-api ingest:reset` para dropar a tabela antes de re-ingerir.

## 3. Subir o servidor

```bash
pnpm --filter @ouvidoria/ai-api dev
```

Esperado: log do Fastify dizendo `Server listening at http://0.0.0.0:4000`.

## 4. Health e Ready

Em outro terminal:

```bash
curl -s localhost:4000/health
# {"status":"ok"}

curl -s localhost:4000/ready
# {"status":"ok","vectorStoreOk":true,"hasIndexedChunks":true,"geminiConfigured":true}
```

Se `hasIndexedChunks: false`, o passo 2 não persistiu nada — confira a saída do ingest.

Se `vectorStoreOk: false`, o Postgres está fora ou a tabela não existe — confira `docker ps` e re-rode o ingest.

## 5. POST /ai/messages — dúvida institucional

Substitua `<AI_API_KEY>` pela chave do seu `.env`.

```bash
curl -s -X POST localhost:4000/ai/messages \
  -H "x-api-key: <AI_API_KEY>" \
  -H "content-type: application/json" \
  -d '{
    "history": [],
    "message": "Como abrir uma reclamação na Ouvidoria da UESPI?",
    "campuses": [],
    "administrativeUnits": []
  }' | jq
```

**Esperado:**

```json
{
  "answer": "...resposta baseada nos documentos institucionais...",
  "intent": "institutional_question",
  "confidence": 0.7,
  "shouldOpenManifestationDraft": false,
  "draft": null,
  "missingFields": []
}
```

## 6. POST /ai/messages — candidato a manifestação (com catálogo)

```bash
curl -s -X POST localhost:4000/ai/messages \
  -H "x-api-key: <AI_API_KEY>" \
  -H "content-type: application/json" \
  -d '{
    "history": [],
    "message": "Quero reclamar de um problema no restaurante universitário do campus Parnaíba.",
    "campuses": [
      { "id": "campus-parnaiba", "label": "Campus Parnaíba" }
    ],
    "administrativeUnits": [
      { "id": "ru-parnaiba", "label": "Restaurante Universitário", "campusId": "campus-parnaiba" }
    ]
  }' | jq
```

**Esperado:** intent `manifestation_candidate` ou `manifestation_draft_ready` com `draft` preenchido apontando para os ids enviados.

## 7. Cenários negativos

```bash
# Sem x-api-key → 401
curl -i -X POST localhost:4000/ai/messages \
  -H "content-type: application/json" \
  -d '{"history":[],"message":"oi","campuses":[],"administrativeUnits":[]}'

# x-api-key errada → 401
curl -i -X POST localhost:4000/ai/messages \
  -H "x-api-key: wrong" \
  -H "content-type: application/json" \
  -d '{"history":[],"message":"oi","campuses":[],"administrativeUnits":[]}'

# Body inválido → 400
curl -i -X POST localhost:4000/ai/messages \
  -H "x-api-key: <AI_API_KEY>" \
  -H "content-type: application/json" \
  -d '{"message":""}'

# Out-of-scope → intent: "out_of_scope"
curl -s -X POST localhost:4000/ai/messages \
  -H "x-api-key: <AI_API_KEY>" \
  -H "content-type: application/json" \
  -d '{"history":[],"message":"qual a capital da França?","campuses":[],"administrativeUnits":[]}' | jq .intent
```

## 8. Integração com o backend principal

Com o `ai-api` rodando na porta 4000, no `.env` do backend principal:

```env
AI_GATEWAY_PROVIDER=http
AI_SERVICE_BASE_URL=http://localhost:4000
AI_SERVICE_API_KEY=<mesmo AI_API_KEY do ai-api>
AI_SERVICE_TIMEOUT_MS=30000
```

Sobe o backend principal (`pnpm db:up && pnpm build && node build/main/server.js`) e bate na rota dele:

```bash
curl -s -X POST localhost:3333/ai/messages \
  -H "content-type: application/json" \
  -d '{"history":[],"message":"Como abrir uma reclamação?"}' | jq
```

O backend principal vai (1) buscar o catálogo no Prisma, (2) repassar para o `ai-api` via `HttpAiGateway`, (3) normalizar/validar o draft e devolver. Se este passo retornar uma resposta no formato esperado, a integração está OK.

## 9. Troubleshooting

| Sintoma                                   | Causa provável                                             | O que checar                                                                              |
| ----------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `404 model not found` no ingest           | `GOOGLE_EMBEDDING_MODEL` errado                            | Lista de modelos da chave                                                                 |
| `404 model not found` no chat             | `GOOGLE_CHAT_MODEL` errado                                 | Idem; tente `models/gemini-3-flash` ou `models/gemini-2.0-flash`                          |
| `dimension mismatch` no ingest            | Tabela criada com outra dim, mudou `GOOGLE_EMBEDDING_DIMS` | Rode `ingest:reset`                                                                       |
| `ECONNREFUSED 5433`                       | Container do pgVector não subiu                            | `docker ps`, `pnpm --filter @ouvidoria/ai-api db:logs`                                    |
| 429 do Gemini                             | Rate limit do free tier                                    | Espera alguns minutos; reduz `RAG_CHUNK_SIZE` é contraproducente — embeddings é por chunk |
| `/ready` com `hasIndexedChunks: false`    | Ingest não persistiu                                       | Rode o ingest novamente                                                                   |
| Chunks duplicados                         | Ingest rodado >1x sem reset                                | `ingest:reset`                                                                            |
| 502 / `ai_service_unavailable` no backend | `ai-api` fora do ar                                        | Confirma `dev` do ai-api rodando e baseURL correta                                        |
