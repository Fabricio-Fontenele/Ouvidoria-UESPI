# Arquitetura de Implementação: Chatbot de Ouvidoria UESPI

> **Status da implementação:** O núcleo da aplicação (camadas domain, application e presentation) está implementado. Os adapters concretos do `AiGateway` (`FakeAiGateway` para desenvolvimento local e `HttpAiGateway` para integração com o microserviço `ai-api`) estão implementados. O microserviço `ai-api` (workspace separado) contém o pipeline RAG completo com LangChain + Gemini + pgvector + ingestão de documentos. A rota HTTP `POST /ai/messages` está registrada no backend principal, bem como a factory do controller e os testes de unidade e e2e.

A implementação do chatbot divide-se em dois ciclos fundamentais:

1. **Ciclo de Ingestão** — preparação da base de conhecimento (implementado no workspace `ai-api/`).
2. **Ciclo de Inferência** — interação inteligente com o usuário utilizando RAG (implementado no workspace `ai-api/`).

---

# 1. Ciclo de Ingestão (Base de Conhecimento)

Antes do chatbot responder aos usuários, ele precisa processar e compreender os documentos institucionais da UESPI.

> **Nota:** A implementação concreta do ciclo de ingestão reside no workspace `ai-api/` (pacote `@ouvidoria/ai-api`), um microserviço independente. O backend principal não executa ingestão; ele apenas consome o `ai-api` via HTTP.

## 1.1 Processamento dos Documentos

### Ferramenta Utilizada

- `RecursiveCharacterTextSplitter` do LangChain (`@langchain/textsplitters`).

### Funcionamento

O diretório configurado em `KB_DIR` (padrão `./docs/knowledge-base`) é varrido recursivamente. Arquivos com extensão `.pdf`, `.md` e `.txt` são carregados:

- **PDF**: via `PDFLoader` do LangChain (sem OCR — apenas texto extraível).
- **Markdown/TXT**: carregados como texto puro.

Cada documento é identificado pela metadata `source` (caminho relativo ao `KB_DIR`).

### Divisão em Chunks

Os documentos são divididos em blocos de texto chamados **chunks** usando `RecursiveCharacterTextSplitter` com:

- `chunkSize`: 400 caracteres (configurável via `RAG_CHUNK_SIZE`).
- `chunkOverlap`: 0 caracteres (configurável via `RAG_CHUNK_OVERLAP`).
- Separadores: `['\n\n', '\n', ' ', '']`.

### Objetivo

A divisão é essencial porque:

- modelos LLM possuem limite de contexto;
- textos menores melhoram a precisão semântica;
- evita perda de foco do modelo em documentos longos;
- melhora a eficiência da recuperação de informações.

---

## 1.2 Geração de Embeddings

### Modelo Utilizado

- `models/text-embedding-001` do Gemini via `GoogleGenerativeAIEmbeddings` (`@langchain/google-genai`).
- Dimensão: 3072 (configurável via `GOOGLE_EMBEDDING_DIMS`).

### Funcionamento

Cada chunk de texto é transformado em um vetor numérico (embedding), representando semanticamente o conteúdo daquele trecho.

### Validação (Embedding Probe)

Antes de persistir os embeddings, o sistema executa uma **sonda de validação** (`validateEmbeddingProbe`):

1. Gera um embedding de um texto de teste.
2. Verifica se o vetor não está vazio.
3. Verifica se a dimensão corresponde ao valor esperado em `GOOGLE_EMBEDDING_DIMS`.

Isso previne erros silenciosos de incompatibilidade de dimensão entre o modelo e a tabela vector.

---

## 1.3 Armazenamento Vetorial

### Vector Store

- **pgvector** — extensão vetorial do PostgreSQL executada em container Docker separado.

### Infraestrutura

- Container `pgvector/pgvector:pg17` na porta **5433** (externa), banco `rag`.
- Tabela configurável via `PG_VECTOR_COLLECTION_NAME` (padrão: `ouvidoria_kb`).
- Mapeamento de colunas: `id` (uuid), `content` (texto), `metadata` (JSON), `embedding` (vector).
- Gerenciado via `docker-compose.yml` em `ai-api/`.

### Comandos de Ingestão

```bash
pnpm ingest           # Executa ingestão incremental
pnpm ingest:reset     # Remove a tabela e reinsere todos os documentos
```

### Função

O banco vetorial funciona como um:

- índice semântico;
- mecanismo de busca contextual;
- memória institucional da UESPI.

### Resultado

Quando uma pergunta é feita, o sistema consegue localizar rapidamente os trechos mais relevantes da documentação oficial.

---

# 2. Ciclo de Inferência (Lógica de RAG)

Quando o usuário interage com o chatbot, o sistema executa um fluxo baseado em **RAG (Retrieval-Augmented Generation)**.

> **Nota:** A implementação concreta do RAG reside no workspace `ai-api/`.

---

## 2.1 Recuperação (Retrieval)

### Processo

O microserviço `ai-api` em TypeScript:

1. recebe a pergunta do usuário (via `POST /ai/messages`);
2. converte a pergunta em embedding usando o mesmo modelo da ingestão;
3. consulta o pgvector com `similaritySearchWithScore(query, k)`;
4. recupera os `k` chunks mais relevantes semanticamente (`RAG_TOP_K`, padrão: 4).

### Retorno

```ts
interface RetrievedChunk {
  content: string
  score: number
  source: string | null
}
```

### Objetivo

Encontrar informações oficiais relacionadas à dúvida do usuário.

---

## 2.2 Aumentação (Augmentation)

O `RagPromptBuilder` (em `ai-api/src/infra/rag/`) constrói um prompt enriquecido contendo:

### System Prompt

- Definição do papel: o **Guará**, mascote da Ouvidoria UESPI — uma ave acolhedora que zela pelo diálogo entre a universidade e sua comunidade. Tom caloroso, próximo e leve.
- Regras invioláveis: nunca registrar uma manifestação, sempre responder em português, usar estritamente o contexto fornecido, não inventar informações.
- Catálogo de campi e unidades administrativas (com IDs exatos).
- Chunks recuperados com atribuição de fonte (`Fonte: caminho/do/documento`).

### User Prompt

- Histórico da conversa (se houver).
- Mensagem atual do usuário.

### Estrutura do Prompt

```text
[System]
Você é o assistente virtual oficial da Ouvidoria da UESPI.

### Catálogo institucional
- ID: campus-poeta-torquato-neto | Rótulo: Campus Poeta Torquato Neto
  - ID: unit-prad-teresina | Rótulo: Pró-Reitoria de Administração

### Contexto institucional (documentos oficiais)
[Fonte: docs/knowledge-base/faq-ouvidoria.md]
A Ouvidoria atende ...

[User]
Histórico:
(usuário) Quero reclamar do atendimento.

Mensagem atual:
Foi na coordenação de sistemas em Parnaíba.
```

### Benefício

O modelo passa a responder utilizando informações reais da instituição, reduzindo:

- alucinações;
- respostas genéricas;
- informações incorretas.

---

## 2.3 Geração (Generation)

### Processo

O `GeminiStructuredLlmProvider` (em `ai-api/src/infra/llm/`) utiliza:

1. `ChatGoogleGenerativeAI` do LangChain (`@langchain/google-genai`).
2. `.withStructuredOutput(aiChatResponseSchema)` — vincula o schema Zod diretamente ao Gemini, forçando a saída JSON estruturada.

```ts
const model = new ChatGoogleGenerativeAI({
  model: 'models/gemini-2.0-flash', // configurável via GOOGLE_CHAT_MODEL
  temperature: 0.1, // configurável via LLM_TEMPERATURE
})
```

### Schema de Resposta (Zod)

```ts
const aiChatResponseSchema = z.object({
  answer: z.string(),
  intent: z.enum([
    'institutional_question',
    'manifestation_candidate',
    'manifestation_draft_ready',
    'out_of_scope',
    'unknown',
  ]),
  confidence: z.number().min(0).max(1).nullable(),
  shouldOpenManifestationDraft: z.boolean(),
  draft: z
    .object({
      type: z.enum(['report', 'complaint', 'suggestion', 'compliment']).nullable(),
      campusId: z.string().nullable(),
      administrativeUnitId: z.string().nullable(),
      description: z.string().nullable(),
      involvedPeople: z.string().nullable(),
    })
    .nullable(),
  missingFields: z.array(z.string()),
})
```

### Fallback

Se o LLM lançar exceção ou o schema não validar, o sistema retorna `NEUTRAL_FALLBACK_RESPONSE`:

```json
{
  "answer": "Não foi possível processar sua solicitação no momento. Por favor, tente novamente mais tarde.",
  "intent": "unknown",
  "confidence": null,
  "shouldOpenManifestationDraft": false,
  "draft": null,
  "missingFields": []
}
```

### Resultado

Respostas:

- contextualizadas;
- mais precisas;
- institucionalmente alinhadas;
- estruturadas em JSON válido.

---

# 3. Implementação Técnica em TypeScript

## 3.1 Camada de Aplicação — Contratos

### AiGateway (interface)

A interface central que os adapters concretos implementam:

```ts
export interface AiGateway {
  chat(input: AiGatewayChatInput): Promise<AiGatewayChatResponse>
}
```

Localização: `src/application/ai/ai-gateway.ts`

### AiGatewayChatInput

```ts
export interface AiGatewayChatInput {
  history: AiChatMessage[]
  message: string
  campuses: CatalogCampusItemDTO[]
  administrativeUnits: CatalogAdministrativeUnitItemDTO[]
}
```

### AiGatewayChatResponse

```ts
export interface AiGatewayChatResponse {
  answer: string
  intent: string
  shouldOpenManifestationDraft: boolean
  draft: {
    type: string | null
    campusId: string | null
    administrativeUnitId: string | null
    description: string | null
    involvedPeople: string | null
  } | null
  missingFields: string[]
  confidence: number | null
}
```

### AiChatMessage

```ts
export type AiChatRole = 'assistant' | 'system' | 'user'

export interface AiChatMessage {
  role: AiChatRole
  content: string
}
```

### Catálogo (Contrato Unificado)

Os antigos contratos `CampusCatalogProvider` e `AdministrativeUnitCatalogProvider` (em `src/application/ai/ai-catalog-providers.ts`) foram substituídos por um contrato unificado:

```ts
export interface CatalogRepository {
  listPublic(): Promise<PublicCatalogDTO>
  findCampusById(id: string): Promise<CatalogCampusRecordDTO | null>
  findAdministrativeUnitById(id: string): Promise<CatalogAdministrativeUnitRecordDTO | null>
}
```

Localização: `src/application/repositories/catalog-repository.ts`

### Catálogo — DTOs

```ts
export interface PublicCatalogDTO {
  campuses: PublicCatalogCampusDTO[]
}

export interface PublicCatalogCampusDTO {
  id: string
  label: string
  city: string | null
  administrativeUnits: PublicCatalogAdministrativeUnitDTO[]
}

export interface PublicCatalogAdministrativeUnitDTO {
  id: string
  label: string
}

export interface CatalogCampusItemDTO {
  id: string
  label: string
}

export interface CatalogAdministrativeUnitItemDTO extends CatalogCampusItemDTO {
  campusId: string
}
```

Localização: `src/application/dto/catalog-dtos.ts`

### Catálogo (Implementação Concreta)

#### Tabelas no banco

Dois models Prisma servem como fonte oficial de referência:

- **`Campus`** — `prisma/schema.prisma`, mapeado para tabela `campuses`
- **`AdministrativeUnit`** — `prisma/schema.prisma`, mapeado para tabela `administrative_units`, com FK para `campuses`

A migration correspondente está em `prisma/migrations/20260517130000_add_campus_and_administrative_units/`.

**Decisão:** O model `Manifestation` _não_ recebeu FK para essas tabelas. A validação dos IDs é feita em memória pelo `SendAiMessageUseCase` contra os catálogos carregados, não via constraint de banco. Isso preserva compatibilidade com dados existentes.

#### Repository

| Implementação             | Localização                                                           | Contrato            |
| ------------------------- | --------------------------------------------------------------------- | ------------------- |
| `PrismaCatalogRepository` | `src/infra/database/prisma/repositories/prisma-catalog-repository.ts` | `CatalogRepository` |

O `PrismaCatalogRepository` consulta as tabelas `campuses` e `administrative_units` (ambas com `isActive: true`) via `PrismaClient.findMany()`, ordena por nome, e retorna os DTOs padronizados. Está registrado como singleton em `src/main/factories/infrastructure.ts`.

> Os antigos providers individuais (`PrismaCampusCatalogProvider` e `PrismaAdministrativeUnitCatalogProvider`) ainda existem no código mas não são mais utilizados pelo fluxo do chatbot.

---

## 3.2 SendAiMessageUseCase

### Localização

`src/application/use-cases/send-ai-message/send-ai-message-use-case.ts`

### Fluxo

1. recebe `history` e `message` do usuário;
2. carrega catálogo completo via `CatalogRepository.listPublic()`;
3. achata a estrutura aninhada em listas planas de `campuses` e `administrativeUnits`;
4. invoca `AiGateway.chat()` com os dados carregados;
5. normaliza o retorno:
   - **intent**: valores desconhecidos viram `unknown`;
   - **draft**: apenas para intents `manifestation_candidate` e `manifestation_draft_ready`; campos são validados contra o catálogo, IDs inválidos viram `null`, unidades que não pertencem ao campus são invalidadas, textos vazios viram `null`, tipos de manifestação inválidos viram `null`;
   - **missingFields**: calculado com base nos campos obrigatórios nulos (`type`, `campusId`, `administrativeUnitId`, `description`);
   - **shouldOpenManifestationDraft**: só `true` quando intent é `manifestation_draft_ready`, o sinalizador veio `true`, o draft não é nulo e não há missing fields;
   - **confidence**: valores fora de `[0, 1]` viram `null`.

### Intents Reconhecidas

| Intent                      | Significado                            |
| --------------------------- | -------------------------------------- |
| `institutional_question`    | Pergunta institucional (FAQ)           |
| `manifestation_candidate`   | Relato que pode virar manifestação     |
| `manifestation_draft_ready` | Draft completo para abrir manifestação |
| `out_of_scope`              | Fora do escopo da ouvidoria            |
| `unknown`                   | Não foi possível classificar           |

### Draft Payload

```ts
export interface AiDraftPayload {
  type: ManifestationType | null // 'report' | 'complaint' | 'suggestion' | 'compliment'
  campusId: string | null
  administrativeUnitId: string | null
  description: string | null
  involvedPeople: string | null
}
```

### Missing Fields Validados

O use case considera obrigatórios os campos: `type`, `campusId`, `administrativeUnitId`, `description`. O campo `involvedPeople` é opcional. Os valores de `campusId` e `administrativeUnitId` são validados contra os catálogos carregados — inclusive a relação de pertencimento entre unidade e campus.

---

## 3.3 Implementações Concretas do AiGateway

### FakeAiGateway (desenvolvimento/MVP)

**Localização:** `src/infra/ai/fake-ai-gateway.ts`

Implementação determinística baseada em palavras-chave, sem dependências externas. Usada quando `AI_GATEWAY_PROVIDER=fake` (padrão).

- Mensagens contendo "reclamacao", "reclamar", "denuncia" ou "problema" → `manifestation_draft_ready` com draft preenchido usando o primeiro campus/unidade do catálogo.
- Mensagens contendo "status" ou "protocolo" → `institutional_question`.
- Demais mensagens → `institutional_question` genérico.

Seleciona o primeiro campus disponível no catálogo para preencher o draft:

```ts
const campus = input.campuses[0] ?? null
```

### HttpAiGateway (produção)

**Localização:** `src/infra/ai/http-ai-gateway.ts`

Adapter HTTP que chama o microserviço `ai-api` via `fetch`. Usado quando `AI_GATEWAY_PROVIDER=http`.

- Constrói URL a partir de `AI_SERVICE_BASE_URL` + `/ai/messages`.
- Envia `x-api-key` no header para autenticação.
- Usa `AbortSignal.timeout()` com `AI_SERVICE_TIMEOUT_MS`.
- Valida a resposta contra um schema Zod (`responseSchema`).
- Lança `AiServiceError` em caso de falha.

### AiServiceError

**Localização:** `src/infra/ai/ai-service-error.ts`

Classifica erros de comunicação com o `ai-api` em 4 categorias:

| Kind               | Significado                          |
| ------------------ | ------------------------------------ |
| `timeout`          | A requisição excedeu o timeout       |
| `upstream_status`  | `ai-api` retornou status HTTP >= 400 |
| `invalid_response` | Resposta não-JSON ou fora do schema  |
| `network`          | Erro de rede (ex: ECONNREFUSED)      |

---

## 3.4 SendAiMessageController

### Localização

`src/presentation/controllers/ai/send-ai-message.controller.ts`

Valida o body (`{ history: AiChatMessage[], message: string }`) via `Validator<SendAiMessageBody>` e delega ao use case. Composable com `ZodValidator`.

### Validação (via ZodValidator)

O schema de validação é definido na factory:

```ts
const aiChatMessageSchema = z.object({
  role: z.enum(['assistant', 'user']),
  content: z.string().trim().min(1).max(4000),
})

const sendAiMessageSchema = z.object({
  history: z.array(aiChatMessageSchema).max(20),
  message: z.string().trim().min(1).max(4000),
})
```

Regras:

- `role` — apenas `assistant` ou `user` (sem `system` vindo do cliente).
- `content` — trim aplicado, 1 a 4000 caracteres.
- `history` — máximo de 20 mensagens.
- `message` — trim aplicado, 1 a 4000 caracteres.

---

## 3.5 Factory do Controller

**Localização:** `src/main/factories/controllers/ai.ts`

```ts
export function makeSendAiMessageController(): SendAiMessageController {
  const useCase = new SendAiMessageUseCase(infrastructure.aiGateway, infrastructure.catalogRepository)
  return new SendAiMessageController(useCase, new ZodValidator(sendAiMessageSchema))
}
```

---

## 3.6 Rota HTTP

**Localização:** `src/main/routes/ai.routes.ts`

```ts
export async function registerAiRoutes(app: FastifyInstance): Promise<void> {
  app.post('/ai/messages', adaptRoute(makeSendAiMessageController()))
}
```

Registra `POST /ai/messages` como rota pública (sem autenticação de usuário). O controlador é adaptado via `adaptRoute` do Fastify.

---

## 3.7 DI Registration (Infrastructure)

**Localização:** `src/main/factories/infrastructure.ts`

O `aiGateway` é instanciado condicionalmente com base em `AI_GATEWAY_PROVIDER`:

```ts
const aiGateway: AiGateway =
  env.AI_GATEWAY_PROVIDER === 'http' && env.AI_SERVICE_BASE_URL !== undefined && env.AI_SERVICE_API_KEY !== undefined
    ? new HttpAiGateway({
        baseUrl: env.AI_SERVICE_BASE_URL,
        apiKey: env.AI_SERVICE_API_KEY,
        timeoutMs: env.AI_SERVICE_TIMEOUT_MS,
      })
    : new FakeAiGateway()
```

O `catalogRepository` (instância de `PrismaCatalogRepository`) também é registrado como singleton e compartilhado com o `SendAiMessageUseCase`.

---

## 3.8 Variáveis de Ambiente (IA)

Novas variáveis adicionadas ao schema `env.ts` do backend principal:

| Variável                | Tipo               | Padrão   | Obrigatório        | Descrição                                |
| ----------------------- | ------------------ | -------- | ------------------ | ---------------------------------------- |
| `AI_GATEWAY_PROVIDER`   | `"fake" \| "http"` | `"fake"` | Não                | Seleciona a implementação do AiGateway   |
| `AI_SERVICE_BASE_URL`   | URL                | —        | Se provider=`http` | URL base do microserviço `ai-api`        |
| `AI_SERVICE_API_KEY`    | string             | —        | Se provider=`http` | Chave de API para autenticar no `ai-api` |
| `AI_SERVICE_TIMEOUT_MS` | number             | `30000`  | Não                | Timeout das requisições HTTP ao `ai-api` |

O `superRefine` do Zod valida que `AI_SERVICE_BASE_URL` e `AI_SERVICE_API_KEY` estão presentes quando `AI_GATEWAY_PROVIDER=http`.

---

## 3.9 Estratégia de Estado (Conversação)

O backend principal é **stateless** — o histórico da conversa (`history`) é enviado pelo cliente a cada requisição. O servidor não mantém sessão.

O microserviço `ai-api` também é stateless: cada requisição contém todo o histórico necessário para o contexto.

### Responsabilidade do Frontend

O frontend deve:

1. Manter o histórico local da conversa.
2. A cada novo turno, enviar `history` (mensagens anteriores) + `message` (nova mensagem).
3. Não duplicar a mensagem nova em `history`.
4. Respeitar o limite de 20 mensagens no array `history`.

Para MVP, `sessionStorage` ou `localStorage` com expiração curta são aceitáveis. Se usar `localStorage`, oferecer ação visível de "Limpar conversa" devido à sensibilidade do conteúdo.

---

# 4. Fluxo Geral da Arquitetura

## Fluxo Completo (produção — com ai-api)

```text
Frontend (React)
    │
    │ POST /ai/messages { history, message }
    ▼
Main Backend (Fastify, porta 3333)
    │
    ├─ Route (ai.routes.ts) — pública, sem auth de usuário
    │
    ├─ SendAiMessageController
    │   └─ ZodValidator: history ≤20, message 1-4000 chars
    │
    ├─ SendAiMessageUseCase
    │   ├─ CatalogRepository.listPublic() → campi + unidades
    │   ├─ Achata catálogo em listas planas
    │   └─ AiGateway.chat({ history, message, campuses[], administrativeUnits[] })
    │
    ├─ AiGateway (interface)
    │   │
    │   ├─ FakeAiGateway (AI_GATEWAY_PROVIDER=fake)
    │   │   └─ Respostas determinísticas por palavra-chave
    │   │
    │   └─ HttpAiGateway (AI_GATEWAY_PROVIDER=http)
    │       │
    │       │ POST /ai/messages { history, message, campuses[], administrativeUnits[] }
    │       │ x-api-key: <AI_SERVICE_API_KEY>
    │       ▼
    │   ai-api Microservice (Fastify, porta 4000)
    │       │
    │       ├─ ApiKeyAuth (timingSafeEqual)
    │       ├─ ZodValidator: schema do body
    │       ├─ SendAiMessageUseCase
    │       │   ├─ KnowledgeRetriever.retrieve(query, k)
    │       │   │   └─ pgvector: similaritySearchWithScore (embedding query)
    │       │   ├─ RagPromptBuilder.build(catalog, context, history, message)
    │       │   │   ├─ System prompt (papel + regras + catálogo + chunks)
    │       │   │   └─ User prompt (histórico + mensagem)
    │       │   └─ LlmProvider.completeStructured({ systemPrompt, userPrompt })
    │       │       └─ ChatGoogleGenerativeAI.withStructuredOutput(schema)
    │       │           └─ Gemini 2.0 Flash → JSON estruturado (AiChatResponse)
    │       │
    │       └─ Resposta: { answer, intent, draft, missingFields, confidence }
    │
    └─ SendAiMessageUseCase (pós-processamento)
        ├─ Normaliza intent (→ unknown se inválida)
        ├─ Sanitiza draft (valida IDs vs catálogo, trim textos)
        ├─ Calcula missingFields
        └─ Determina shouldOpenManifestationDraft
            │
            ▼
    Resposta: { answer, intent, shouldOpenManifestationDraft, draft, missingFields, confidence }
            │
            ▼
Frontend renderiza answer e condicionalmente abre formulário de manifestação
```

## Fluxo de Ingestão

```text
Documentos institucionais (.pdf, .md, .txt)
    │
    ▼
KB_DIR (./docs/knowledge-base)
    │
    ▼
DocumentLoader (recursivo, com metadata source)
    │
    ▼
RecursiveCharacterTextSplitter (chunkSize=400, overlap=0)
    │
    ▼
GoogleGenerativeAIEmbeddings (text-embedding-001, 3072 dims)
    │
    ├─ Embedding Probe (valida dimensão)
    │
    ▼
pgvector (ouvidoria_kb)
    │
    ▼
pnpm ingest / pnpm ingest:reset
```

---

# 5. Tecnologias Principais

| Tecnologia                     | Função                          | Status                               |
| ------------------------------ | ------------------------------- | ------------------------------------ |
| TypeScript                     | Backend principal               | Implementado                         |
| Zod                            | Validação de schemas            | Implementado (em ambos os pacotes)   |
| Fastify                        | Servidor HTTP                   | Implementado (backend + ai-api)      |
| LangChain                      | Orquestração de IA              | Implementado (ai-api)                |
| Gemini (2.0 Flash)             | Modelo LLM                      | Implementado (ai-api)                |
| Gemini Embedding (text-001)    | Geração de embeddings           | Implementado (ai-api)                |
| pgvector                       | Banco vetorial                  | Implementado (ai-api, PostgreSQL 17) |
| RecursiveCharacterTextSplitter | Divisão de documentos em chunks | Implementado (ai-api)                |

## Histórico de Evolução

| Tecnologia               | Status anterior (pré-merge) | Status atual (pós-merge)              |
| ------------------------ | --------------------------- | ------------------------------------- |
| `AiGateway` (interface)  | Implementado                | Implementado                          |
| `FakeAiGateway`          | Não existia                 | Implementado (keyword-based)          |
| `HttpAiGateway`          | Não existia                 | Implementado (HTTP p/ ai-api)         |
| `CatalogRepository`      | Não existia                 | Implementado (substitui providers)    |
| `AiServiceError`         | Não existia                 | Implementado (4 kinds)                |
| Rota `POST /ai/messages` | Não existia                 | Implementada (sem auth de usuário)    |
| Factory do controller    | Não existia                 | Implementada                          |
| Gemini (LLM)             | Pendente                    | Implementado (ai-api)                 |
| LangChain                | Pendente                    | Implementado (ai-api)                 |
| pgvector                 | Pendente                    | Implementado (ai-api)                 |
| Pipeline de ingestão     | Pendente                    | Implementado (ai-api)                 |
| Pipeline RAG             | Pendente                    | Implementado (ai-api)                 |
| API Key Auth (ai-api)    | Não existia                 | Implementado (timingSafeEqual)        |
| `BufferWindowMemory`     | Planejado                   | Pendente (stateless intencionalmente) |
| ChromaDB                 | Planejado                   | Substituído por pgvector              |

---

# 6. Microserviço ai-api

## 6.1 Visão Geral

O `ai-api` é um workspace separado (`ai-api/`) que implementa todo o pipeline de IA. Ele é um microserviço HTTP independente que roda em processo separado do backend principal.

### Stack

- **Runtime:** Node.js 22+, TypeScript ESM strict
- **Servidor:** Fastify 5.x com Helmet
- **LLM:** LangChain.js v1 + Google Generative AI (Gemini)
- **Banco vetorial:** PostgreSQL 17 + pgvector (porta 5433)
- **Validação:** Zod 4.x

### Endpoints

| Método | Rota           | Auth        | Descrição                                        |
| ------ | -------------- | ----------- | ------------------------------------------------ |
| GET    | `/health`      | Não         | Health check simples (`{ status: "ok" }`)        |
| GET    | `/ready`       | Não         | Readiness probe (vector store + chunks + Gemini) |
| POST   | `/ai/messages` | `x-api-key` | Mensagem do chatbot com RAG                      |

---

## 6.2 Arquitetura do ai-api

```
ai-api/src/
├── application/          # Casos de uso, DTOs, portas (interfaces)
│   ├── dtos/
│   │   ├── ai-chat-request.ts
│   │   └── ai-chat-response.ts
│   ├── ports/
│   │   ├── llm-provider.ts
│   │   ├── knowledge-retriever.ts
│   │   └── catalog-context.ts
│   └── use-cases/
│       └── send-ai-message-use-case.ts
├── presentation/         # Adapters Fastify
│   ├── controllers/
│   │   └── send-ai-message-controller.ts
│   ├── middlewares/
│   │   └── api-key-auth.ts
│   └── validators/
│       └── send-ai-message-schema.ts
├── infra/                # Adapters concretos
│   ├── ingestion/
│   │   ├── document-loader.ts
│   │   ├── ingest-knowledge-base.ts
│   │   ├── knowledge-base-ingestion.ts
│   │   └── text-splitter.ts
│   ├── llm/
│   │   └── gemini-structured-client.ts
│   ├── rag/
│   │   ├── pgvector-retriever.ts
│   │   └── rag-prompt-builder.ts
│   └── vector-store/
│       └── pgvector-store.ts
└── main/                 # Composition root
    ├── env.ts
    ├── routes.ts
    ├── server.ts
    └── factories/
        └── infrastructure.ts
```

---

## 6.3 SendAiMessageUseCase (ai-api)

### Localização

`ai-api/src/application/use-cases/send-ai-message-use-case.ts`

### Fluxo

1. Recebe `AiChatRequest` (history, message, campuses, administrativeUnits).
2. Constrói `CatalogContext` a partir dos arrays recebidos.
3. Recupera chunks relevantes via `KnowledgeRetriever.retrieve(query, retrievalTopK)`.
4. Constrói prompts (system + user) via `RagPromptBuilder.build()`.
5. Invoca `LlmProvider.completeStructured()` com os prompts.
6. Aplica fallback para `NEUTRAL_FALLBACK_RESPONSE` se o LLM falhar ou o schema não validar.
7. Sanitiza o draft:
   - Valida `campusId` contra o catálogo.
   - Valida `administrativeUnitId` contra o catálogo + vínculo com campus.
   - Strings vazias/whitespace viram `null`.
8. Calcula `missingFields` com base nos campos obrigatórios nulos.
9. `shouldOpenManifestationDraft` só é `true` quando intent é `manifestation_draft_ready` **e** não há missing fields.

> Nota: O use case do `ai-api` faz sua própria sanitização do draft, que é **redundante** com a sanitização feita pelo use case do backend principal. Isso é intencional: o backend principal é a autoridade final sobre validação de catálogo, enquanto o `ai-api` serve como camada de defesa adicional.

---

## 6.4 GeminiStructuredLlmProvider

**Localização:** `ai-api/src/infra/llm/gemini-structured-client.ts`

### Configuração

```ts
interface GeminiClientConfig {
  apiKey: string // GOOGLE_API_KEY
  chatModel: string // GOOGLE_CHAT_MODEL (padrão: models/gemini-2.0-flash)
  embeddingModel: string // GOOGLE_EMBEDDING_MODEL (padrão: models/text-embedding-001)
  temperature: number // LLM_TEMPERATURE (padrão: 0.1)
}
```

### Funcionamento

- Cria `ChatGoogleGenerativeAI` com o modelo e temperatura configurados.
- Aplica `.withStructuredOutput(aiChatResponseSchema)` para forçar saída JSON conforme o schema Zod.
- O método `completeStructured()` invoca o modelo com as mensagens `system` e `user`.
- Em caso de erro, retorna `NEUTRAL_FALLBACK_RESPONSE`.

---

## 6.5 RAG Pipeline

### PgVectorKnowledgeRetriever

**Localização:** `ai-api/src/infra/rag/pgvector-retriever.ts`

```ts
class PgVectorKnowledgeRetriever implements KnowledgeRetriever {
  async retrieve(query: string, k: number): Promise<RetrievedChunk[]> {
    const results = await this.vectorStore.similaritySearchWithScore(query, k)
    return results.map(([doc, score]) => ({
      content: doc.pageContent,
      score,
      source: doc.metadata?.['source'] ?? null,
    }))
  }
}
```

### RagPromptBuilder

**Localização:** `ai-api/src/infra/rag/rag-prompt-builder.ts`

Constrói o **system prompt** com:

- Definição do papel (**Guará**, mascote da Ouvidoria UESPI — tom caloroso e acolhedor).
- Regras invioláveis (não registrar manifestação, responder em português, usar contexto estritamente).
- Catálogo institucional renderizado (IDs e labels).
- Chunks recuperados com atribuição de fonte.
- Instruções de classificação de intent e extração de draft.

E o **user prompt** com:

- Histórico da conversa (se houver).
- Mensagem atual do usuário.

---

## 6.6 Autenticação do ai-api

**Localização:** `ai-api/src/presentation/middlewares/api-key-auth.ts`

```ts
function makeApiKeyAuth(expectedApiKey: string): FastifyPreHandler
```

- Lê o header `x-api-key`.
- Se ausente → `401 missing_api_key`.
- Compara com a chave esperada usando `timingSafeEqual` (proteção contra timing attack).
- Se inválida → `401 invalid_api_key`.
- Passa adiante em caso de match.

---

## 6.7 Variáveis de Ambiente do ai-api

| Variável                    | Padrão                      | Descrição                               |
| --------------------------- | --------------------------- | --------------------------------------- |
| `PORT`                      | `4000`                      | Porta do servidor                       |
| `HOST`                      | `0.0.0.0`                   | Host do servidor                        |
| `GOOGLE_API_KEY`            | —                           | Chave da API Google (obrigatória)       |
| `GOOGLE_CHAT_MODEL`         | `models/gemini-2.0-flash`   | Modelo Gemini para chat                 |
| `GOOGLE_EMBEDDING_MODEL`    | `models/text-embedding-001` | Modelo Gemini para embeddings           |
| `GOOGLE_EMBEDDING_DIMS`     | `3072`                      | Dimensão dos embeddings                 |
| `LLM_TEMPERATURE`           | `0.1`                       | Temperatura do LLM (0-1)                |
| `DATABASE_URL`              | —                           | URL do PostgreSQL com pgvector          |
| `PG_VECTOR_COLLECTION_NAME` | `ouvidoria_kb`              | Nome da tabela de coleção vetorial      |
| `KB_DIR`                    | `./docs/knowledge-base`     | Diretório dos documentos institucionais |
| `RAG_CHUNK_SIZE`            | `400`                       | Tamanho dos chunks para divisão         |
| `RAG_CHUNK_OVERLAP`         | `0`                         | Sobreposição entre chunks               |
| `RAG_TOP_K`                 | `4`                         | Número de chunks recuperados            |
| `AI_API_KEY`                | —                           | Chave para autenticação das requisições |
| `REQUEST_BODY_LIMIT_BYTES`  | `65536`                     | Limite do body da requisição            |

---

## 6.8 Docker / Infraestrutura

O `ai-api` possui `docker-compose.yml` próprio com:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg17
    ports:
      - '5433:5432'
    environment:
      POSTGRES_DB: rag
    healthcheck:
      test: pg_isready -U postgres
```

Comandos:

```bash
pnpm db:up       # Sobe o container PostgreSQL + pgvector
pnpm db:down     # Derruba o container
pnpm db:logs     # Logs do container
```

---

## 6.9 Variáveis de Ambiente do Backend Principal (seção IA)

Registradas em `src/main/config/env.ts`:

| Variável                | Padrão   | Descrição                                                     |
| ----------------------- | -------- | ------------------------------------------------------------- |
| `AI_GATEWAY_PROVIDER`   | `"fake"` | `"fake"` para desenvolvimento local; `"http"` para produção   |
| `AI_SERVICE_BASE_URL`   | —        | `http://localhost:4000` (exemplo)                             |
| `AI_SERVICE_API_KEY`    | —        | Mesmo valor configurado como `AI_API_KEY` no `.env` do ai-api |
| `AI_SERVICE_TIMEOUT_MS` | `30000`  | Timeout para chamadas HTTP ao ai-api                          |

---

# Apêndice A — Status da Implementação

## Implementado

### Backend Principal (este repositório)

| Componente                                      | Caminho                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| Interface `AiGateway`                           | `src/application/ai/ai-gateway.ts`                                                   |
| Interface `CatalogRepository`                   | `src/application/repositories/catalog-repository.ts`                                 |
| DTOs de catálogo                                | `src/application/dto/catalog-dtos.ts`                                                |
| `SendAiMessageUseCase`                          | `src/application/use-cases/send-ai-message/send-ai-message-use-case.ts`              |
| `SendAiMessageController`                       | `src/presentation/controllers/ai/send-ai-message.controller.ts`                      |
| `FakeAiGateway`                                 | `src/infra/ai/fake-ai-gateway.ts`                                                    |
| `HttpAiGateway`                                 | `src/infra/ai/http-ai-gateway.ts`                                                    |
| `AiServiceError`                                | `src/infra/ai/ai-service-error.ts`                                                   |
| `PrismaCatalogRepository`                       | `src/infra/database/prisma/repositories/prisma-catalog-repository.ts`                |
| Model Prisma `Campus`                           | `prisma/schema.prisma`                                                               |
| Model Prisma `AdministrativeUnit`               | `prisma/schema.prisma`                                                               |
| Migration `add_campus_and_administrative_units` | `prisma/migrations/20260517130000_add_campus_and_administrative_units/migration.sql` |
| DI Registration (catalog + aiGateway)           | `src/main/factories/infrastructure.ts`                                               |
| Factory `makeSendAiMessageController()`         | `src/main/factories/controllers/ai.ts`                                               |
| Rota `POST /ai/messages`                        | `src/main/routes/ai.routes.ts`                                                       |
| Env vars de IA                                  | `src/main/config/env.ts`                                                             |
| Testes do use case (10 testes)                  | `test/unit/application/send-ai-message-use-case.spec.ts`                             |
| Testes do controller (3 testes)                 | `test/unit/presentation/send-ai-message.controller.spec.ts`                          |
| Testes do HttpAiGateway (7 testes)              | `test/unit/infra/ai/http-ai-gateway.spec.ts`                                         |
| Testes e2e do AI (4 testes)                     | `test/e2e/ai.e2e.spec.ts`                                                            |
| Setup e2e (forces fake provider)                | `test/e2e/setup-e2e.ts`                                                              |
| Documentação do contrato HTTP                   | `doc/api/frontend-integration.md` (seção 8)                                          |

### Microserviço ai-api

| Componente                                    | Caminho                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| Workspace package                             | `ai-api/package.json` (`@ouvidoria/ai-api`)                                             |
| Configuração TypeScript                       | `ai-api/tsconfig.json`, `ai-api/tsconfig.test.json`                                     |
| Configuração de testes                        | `ai-api/vitest.config.mts`                                                              |
| Docker Compose (pgvector)                     | `ai-api/docker-compose.yml`                                                             |
| Env sample                                    | `ai-api/.env.sample`                                                                    |
| README e documentação                         | `ai-api/README.md`, `ai-api/docs/SMOKE_TEST.md`                                         |
| Base de conhecimento (FAQ placeholder)        | `ai-api/docs/knowledge-base/faq-ouvidoria.md`                                           |
| DTOs de request/response                      | `ai-api/src/application/dtos/`                                                          |
| Portas (interfaces)                           | `ai-api/src/application/ports/` (`LlmProvider`, `KnowledgeRetriever`, `CatalogContext`) |
| SendAiMessageUseCase (ai-api)                 | `ai-api/src/application/use-cases/`                                                     |
| Gemini Structured Client                      | `ai-api/src/infra/llm/gemini-structured-client.ts`                                      |
| PgVector retriever                            | `ai-api/src/infra/rag/pgvector-retriever.ts`                                            |
| RAG prompt builder                            | `ai-api/src/infra/rag/rag-prompt-builder.ts`                                            |
| Ingestion pipeline                            | `ai-api/src/infra/ingestion/` (loader, splitter, ingestor)                              |
| Vector store (pgvector)                       | `ai-api/src/infra/vector-store/pgvector-store.ts`                                       |
| Controller (ai-api)                           | `ai-api/src/presentation/controllers/`                                                  |
| API Key auth middleware                       | `ai-api/src/presentation/middlewares/api-key-auth.ts`                                   |
| Request validator                             | `ai-api/src/presentation/validators/`                                                   |
| Env config (ai-api)                           | `ai-api/src/main/env.ts`                                                                |
| Routes (ai-api)                               | `ai-api/src/main/routes.ts`                                                             |
| Server (ai-api)                               | `ai-api/src/main/server.ts`                                                             |
| Factory (ai-api)                              | `ai-api/src/main/factories/infrastructure.ts`                                           |
| Teste do use case (ai-api, 8 testes)          | `ai-api/test/application/send-ai-message-use-case.spec.ts`                              |
| Teste do schema de request (ai-api, 5 testes) | `ai-api/test/presentation/send-ai-message-schema.spec.ts`                               |
| Teste do auth middleware (ai-api, 3 testes)   | `ai-api/test/presentation/api-key-auth.spec.ts`                                         |
| Testes de rota (ai-api, 6+ testes)            | `ai-api/test/main/routes.spec.ts`                                                       |
| Testes de env (ai-api, 5 testes)              | `ai-api/test/main/env.spec.ts`                                                          |
| Testes de ingestão (ai-api, 4 testes)         | `ai-api/test/infra/ingestion/knowledge-base-ingestion.spec.ts`                          |

## Pendente

| Componente                                  | Observação                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| Seed de dados (Campus + AdministrativeUnit) | Popular tabelas com dados oficiais da UESPI                                     |
| `BufferWindowMemory` do LangChain           | Manter estado no servidor para reduzir tráfego (stateless é intencional no MVP) |
