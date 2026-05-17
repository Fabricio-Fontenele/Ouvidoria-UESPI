# Arquitetura de Implementação: Chatbot de Ouvidoria UESPI

> **Status da implementação:** O núcleo da aplicação (camadas domain, application e presentation) está implementado. Os adapters concretos (`AiGateway`, `CampusCatalogProvider`, `AdministrativeUnitCatalogProvider`), o pipeline RAG e a integração com LangChain/Gemini estão **pendentes** — as seções 1, 2 e 4 representam a arquitetura planejada para esses adapters.

A implementação do chatbot divide-se em dois ciclos fundamentais:

1. **Ciclo de Ingestão** — preparação da base de conhecimento (pendente).
2. **Ciclo de Inferência** — interação inteligente com o usuário utilizando RAG (pendente; atualmente o fluxo usa catálogos diretos via `CampusCatalogProvider` e `AdministrativeUnitCatalogProvider`).

---

# 1. Ciclo de Ingestão (Base de Conhecimento)

Antes do chatbot responder aos usuários, ele precisa processar e compreender os documentos institucionais da UESPI citados no projeto.

## 1.1 Processamento dos Documentos

### Ferramenta Utilizada

- `RecursiveCharacterTextSplitter` do LangChain.

### Objetivo

Os documentos institucionais (PDFs, Markdown, regulamentos, manuais e demais arquivos oficiais) são divididos em pequenos blocos de texto chamados **chunks**.

### Motivo

Isso é essencial porque:

- modelos LLM possuem limite de contexto;
- textos menores melhoram a precisão semântica;
- evita perda de foco do modelo em documentos longos;
- melhora a eficiência da recuperação de informações.

---

## 1.2 Geração de Embeddings

### Modelo Utilizado

- `text-embedding-004` do Gemini via LangChain.

### Funcionamento

Cada chunk de texto é transformado em um vetor numérico (embedding), representando semanticamente o conteúdo daquele trecho.

### Benefício

Permite buscas semânticas inteligentes, indo além de palavras-chave exatas.

---

## 1.3 Armazenamento Vetorial

### Vector Store

Os embeddings gerados são armazenados em um banco vetorial, como:

- ChromaDB
- Pinecone

### Função

Esse banco funciona como um:

- índice semântico;
- mecanismo de busca contextual;
- memória institucional da UESPI.

### Resultado

Quando uma pergunta é feita, o sistema consegue localizar rapidamente os trechos mais relevantes da documentação oficial.

---

# 2. Ciclo de Inferência (Lógica de RAG)

Quando o usuário interage com o chatbot, o sistema executa um fluxo baseado em **RAG (Retrieval-Augmented Generation)**.

---

## 2.1 Recuperação (Retrieval)

### Processo

O backend em TypeScript:

1. recebe a pergunta do usuário;
2. converte a pergunta em embedding;
3. consulta o Vector Store;
4. recupera os 3 ou 4 chunks mais relevantes semanticamente.

### Objetivo

Encontrar informações oficiais relacionadas à dúvida do usuário.

---

## 2.2 Aumentação (Augmentation)

### Processo

O LangChain constrói um prompt enriquecido contendo:

- os trechos oficiais recuperados;
- a pergunta original do usuário;
- instruções de comportamento para o modelo.

### Estrutura do Prompt

```text
Com base nestes trechos oficiais da UESPI:
[Trechos Recuperados]

Responda estritamente ao usuário:
[Pergunta do Usuário]
```

### Benefício

O modelo passa a responder utilizando informações reais da instituição, reduzindo:

- alucinações;
- respostas genéricas;
- informações incorretas.

---

## 2.3 Geração (Generation)

### Processo

O Gemini recebe:

- contexto institucional;
- histórico da conversa;
- pergunta do usuário.

Então gera uma resposta fundamentada nos documentos oficiais da UESPI.

### Resultado

Respostas:

- contextualizadas;
- mais precisas;
- institucionalmente alinhadas.

---

# 3. Implementação Técnica em TypeScript

O ponto mais crítico do projeto é o módulo de:

- auxílio no preenchimento de manifestações;
- entendimento contextual;
- gerenciamento do estado da conversa.

---

# 3.1 Contratos da Camada de Aplicação

## AiGateway (interface)

A interface central que o adapter concreto (LangChain + Gemini) precisará implementar:

```ts
export interface AiGateway {
  chat(input: AiGatewayChatInput): Promise<AiGatewayChatResponse>
}
```

### AiGatewayChatInput

```ts
export interface AiGatewayChatInput {
  history: AiChatMessage[]
  message: string
  campuses: AiCatalogItem[]
  administrativeUnits: AiAdministrativeUnitCatalogItem[]
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

## Catálogos (Contratos)

```ts
export interface CampusCatalogProvider {
  list(): Promise<AiCatalogItem[]>
}

export interface AdministrativeUnitCatalogProvider {
  list(): Promise<AiAdministrativeUnitCatalogItem[]>
}
```

## Catálogos (Implementação Concreta)

### Tabelas no banco

Dois models Prisma foram criados para servir como fonte oficial de referência:

- **`Campus`** — `prisma/schema.prisma`, mapeado para tabela `campuses`
- **`AdministrativeUnit`** — `prisma/schema.prisma`, mapeado para tabela `administrative_units`, com FK para `campuses`

A migration correspondente está em `prisma/migrations/20260517130000_add_campus_and_administrative_units/`.

**Decisão:** O model `Manifestation` _não_ recebeu FK para essas tabelas. A validação dos IDs é feita em memória pelo `SendAiMessageUseCase` contra os catálogos carregados, não via constraint de banco. Isso preserva compatibilidade com dados existentes.

### Providers

| Provider                                  | Localização                                                                             | Contrato                            |
| ----------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------- |
| `PrismaCampusCatalogProvider`             | `src/infra/database/prisma/repositories/prisma-campus-catalog-provider.ts`              | `CampusCatalogProvider`             |
| `PrismaAdministrativeUnitCatalogProvider` | `src/infra/database/prisma/repositories/prisma-administrative-unit-catalog-provider.ts` | `AdministrativeUnitCatalogProvider` |

Ambos consultam as respectivas tabelas via `PrismaClient.findMany()` e retornam os DTOs padronizados (`AiCatalogItem` / `AiAdministrativeUnitCatalogItem`). Estão registrados como singletons em `src/main/factories/infrastructure.ts`.

---

# 3.2 SendAiMessageUseCase

### Localização

`src/application/use-cases/send-ai-message/send-ai-message-use-case.ts`

### Fluxo

1. recebe `history` e `message` do usuário;
2. carrega catálogos de campi e unidades administrativas via `CampusCatalogProvider` e `AdministrativeUnitCatalogProvider`;
3. invoca `AiGateway.chat()` com os dados carregados;
4. normaliza o retorno: intent, draft, missing fields, confidence.

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

O use case considera obrigatórios os campos: `type`, `campusId`, `administrativeUnitId`, `description`. O campo `involvedPeople` é opcional. Os valores de `campusId` e `administrativeUnitId` são validados contra os catálogos carregados.

---

# 3.3 SendAiMessageController

### Localização

`src/presentation/controllers/ai/send-ai-message.controller.ts`

Valida o body (`{ history: AiChatMessage[], message: string }`) via `Validator<SendAiMessageBody>` e delega ao use case. Composable com `ZodValidator`.

---

# 3.4 Estratégia de Memória (Atual)

Atualmente o use case é **stateless** — o histórico da conversa (`history`) é enviado pelo cliente a cada requisição. O servidor não mantém sessão.

### Planejado (Adapter Futuro)

A implementação do `AiGateway` adapter poderá utilizar `BufferWindowMemory` do LangChain (últimas 5 mensagens) quando for construída, mantendo o estado no servidor para reduzir tráfego.

---

---

# 4. Fluxo Geral da Arquitetura

## Fluxo Planejado (RAG completo)

```text
Documentos UESPI
        ↓
Text Splitter (Chunks)
        ↓
Embeddings Gemini
        ↓
Vector Store (Chroma/Pinecone)
        ↓
Usuário faz pergunta
        ↓
Busca Semântica (RAG)
        ↓
Recuperação de Contexto
        ↓
Prompt Enriquecido
        ↓
Gemini gera resposta
        ↓
TypeScript gerencia estado
        ↓
Resposta final ao usuário
```

## Fluxo Atual (sem RAG)

```text
History + Message do cliente
        ↓
SendAiMessageController (valida com Zod)
        ↓
SendAiMessageUseCase
        ↓
  Carrega catálogos (CampusCatalogProvider + AdministrativeUnitCatalogProvider)
        ↓
  Invoca AiGateway.chat() com history, message, campuses, administrativeUnits
        ↓
  Normaliza intent, draft, missingFields, confidence
        ↓
Resposta ao cliente
```

---

# 5. Tecnologias Principais

| Tecnologia          | Função                 | Status                                                                    |
| ------------------- | ---------------------- | ------------------------------------------------------------------------- |
| TypeScript          | Backend principal      | Implementado                                                              |
| Zod                 | Validação de schemas   | Implementado (`^4.4.3` em `package.json`, `ZodValidator` em `src/infra/`) |
| Fastify             | Servidor HTTP          | Implementado                                                              |
| LangChain           | Orquestração de IA     | Pendente (adapter `AiGateway`)                                            |
| Gemini              | Modelo LLM             | Pendente (via LangChain)                                                  |
| text-embedding-004  | Geração de embeddings  | Pendente (ciclo de ingestão)                                              |
| ChromaDB / Pinecone | Banco vetorial         | Pendente (ciclo de ingestão)                                              |
| BufferWindowMemory  | Memória conversacional | Pendente (adapter `AiGateway`)                                            |
| RAG                 | Recuperação contextual | Pendente (ciclo de inferência)                                            |

---

# 6. Complemento Técnico da Arquitetura

Esta seção aprofunda os componentes técnicos responsáveis pela extração estruturada de dados, validação semântica e gerenciamento inteligente do fluxo conversacional da Ouvidoria UESPI.

---

# 6.1 Ferramentas da Biblioteca Zod

O Zod atua como o **contrato de verdade** da aplicação.

### Uso Atual

O `ZodValidator` (`src/infra/http/fastify/validators/zod-validator.ts`) adapta schemas Zod para a interface `Validator<T>` da camada de presentation, validando requisições HTTP nos controllers. Já é usado em todas as rotas e será usado também no controller do chatbot.

### Uso Planejado (Adapter AiGateway)

Quando o adapter concreto do `AiGateway` for implementado, o Zod será usado novamente via `.withStructuredOutput()` do LangChain para forçar o Gemini a retornar JSON estruturado conforme os schemas definidos.

Seu principal objetivo é garantir que:

- o Gemini não invente campos;
- os tipos de dados estejam corretos;
- o backend receba respostas previsíveis;
- os dados das manifestações mantenham consistência estrutural.

---

## 6.1.1 `z.object()`

### Função

Define a estrutura principal da manifestação.

### Exemplo (Alinhado com o contrato `AiDraftPayload`)

```ts
const DraftSchema = z.object({
  type: z.enum(['report', 'complaint', 'suggestion', 'compliment']).nullable(),
  campusId: z.string().nullable(),
  administrativeUnitId: z.string().nullable(),
  description: z.string().nullable(),
  involvedPeople: z.string().nullable().optional(),
})
```

### Objetivo

Padronizar os dados enviados pelo Gemini e utilizados pelo backend TypeScript.

---

## 6.1.2 `z.enum()`

### Função

Restringe os valores permitidos para determinados campos.

### Aplicação no Projeto

O tipo de manifestação deve aceitar apenas os valores do enum `ManifestationType` da entidade de domínio.

### Exemplo

```ts
const ManifestationTypeEnum = z.enum(['report', 'complaint', 'suggestion', 'compliment'])
```

> Nota: No código real, o schema é construído dinamicamente com `z.enum(Object.values(ManifestationType) as [string, ...string[]])` para manter alinhamento com o domínio.

### Benefícios

Evita:

- valores inválidos;
- categorias inventadas pelo modelo;
- inconsistências no banco de dados.

---

## 6.1.3 `z.describe()`

### Função

Adiciona descrições em linguagem natural aos campos do schema.

### Importância

Esta é uma das ferramentas mais importantes da integração com IA.

O LangChain envia essas descrições ao Gemini para orientar a extração semântica dos dados.

### Exemplo

```ts
const DraftSchema = z.object({
  type: z
    .enum(['report', 'complaint', 'suggestion', 'compliment'])
    .nullable()
    .describe('O tipo da manifestação conforme classificação da ouvidoria'),

  campusId: z.string().nullable().describe('O ID do campus da UESPI onde o fato ocorreu'),

  administrativeUnitId: z.string().nullable().describe('O ID da unidade administrativa responsável'),

  description: z.string().nullable().describe('Descrição detalhada do ocorrido'),
})
```

### Resultado

O Gemini passa a compreender:

- contexto dos campos;
- significado institucional;
- intenção semântica da estrutura.

---

## 6.1.4 `z.nullable()` e `z.optional()`

### Função

Permitem preenchimentos parciais durante a conversa.

### Exemplo

```ts
const DraftSchema = z.object({
  type: z.enum(['report', 'complaint', 'suggestion', 'compliment']).nullable(),
  campusId: z.string().nullable(),
  administrativeUnitId: z.string().nullable(),
  description: z.string().nullable(),
  involvedPeople: z.string().nullable().optional(),
})
```

### Objetivo

Viabilizar o fluxo conversacional incremental.

### Benefícios

O sistema consegue:

- aceitar respostas incompletas;
- continuar o preenchimento posteriormente;
- identificar quais informações ainda faltam (`missingFields`).

---

# 6.2 Ferramentas do Framework LangChain

O LangChain funciona como a camada de orquestração da IA.

Ele:

- conecta o Gemini ao backend;
- integra o Zod ao modelo;
- controla o fluxo da conversa;
- gerencia memória e prompts.

---

## 6.2.1 `ChatGoogleGenerativeAI`

### Função

Conector oficial entre LangChain e Gemini.

### Responsabilidade

Permitir:

- chamadas ao modelo;
- geração de respostas;
- integração com prompts;
- structured output.

### Exemplo

```ts
const model = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-pro',
})
```

---

## 6.2.2 `.withStructuredOutput()`

### Função

Vincula diretamente o schema Zod ao modelo Gemini.

### Objetivo

Forçar o Gemini a retornar:

- JSON puro;
- estrutura padronizada;
- dados compatíveis com o schema.

### Exemplo

```ts
const structuredModel = model.withStructuredOutput(ComplaintSchema)
```

---

### Benefícios

Evita:

- respostas em texto livre;
- JSON inválido;
- campos inconsistentes;
- parsing manual complexo.

### Resultado Esperado

```json
{
  "complaintType": "Reclamação",
  "campus": "Parnaíba",
  "description": "Problemas no laboratório"
}
```

---

## 6.2.3 `ChatPromptTemplate`

### Função

Criar prompts estruturados e reutilizáveis.

### Aplicação

Definir:

- personalidade do chatbot;
- comportamento institucional;
- regras da ouvidoria;
- limites de resposta.

### Exemplo

```ts
const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'Você é o assistente oficial da Ouvidoria UESPI.'],
  ['human', '{input}'],
])
```

### Benefício

Padronização do comportamento da IA em todas as interações.

---

## 6.2.4 `RunnablePassthrough` e `StateGraph`

### Função

Criar fluxos condicionais utilizando LCEL (LangChain Expression Language).

### Objetivo

Controlar:

- estados da conversa;
- validações;
- decisões do fluxo;
- próximas perguntas.

---

### Fluxo Lógico

```text
Se JSON incompleto
        ↓
Perguntar campo faltante
        ↓
Receber resposta
        ↓
Atualizar estado
        ↓
Verificar novamente
        ↓
Se completo → finalizar manifestação
```

---

# 6.3 Aprofundamento Técnico: Fluxo de Extração Estruturada

A combinação entre:

- Zod;
- LangChain;
- Gemini;
- RAG;

resolve um dos maiores problemas de chatbots tradicionais:
a rigidez de formulários estáticos.

---

# 6.3.1 Processo de Slot Filling Inteligente

O chatbot não trabalha apenas com texto.

Internamente, o backend manipula um objeto de estado estruturado.

---

## Exemplo de Interação (Planejado)

### Entrada do Usuário

```text
Quero reclamar de um professor em Parnaíba.
```

---

## Extração Estruturada

```json
{
  "type": "complaint",
  "campusId": null,
  "administrativeUnitId": null,
  "description": "Quero reclamar de um professor em Parnaíba.",
  "involvedPeople": "Professor"
}
```

---

## Análise do Backend

O `SendAiMessageUseCase` identifica que:

- `type` foi preenchido (`complaint`);
- `description` foi preenchido;
- `involvedPeople` foi preenchido;
- `campusId` e `administrativeUnitId` continuam ausentes.

**Resultado:** `missingFields = ['campusId', 'administrativeUnitId']` — o frontend (ou o fluxo de slot-filling) pergunta qual campus e unidade.

---

## Benefícios do Slot Filling

O fluxo torna-se:

- natural;
- contextual;
- adaptável;
- menos burocrático.

O usuário não precisa preencher um formulário rígido manualmente.

---

# 6.3.2 Validação Estrutural vs Validação Semântica

## Zod Valida (Já implementado):

- tipos;
- estrutura;
- presença de campos.

## Catálogos Validam (Já implementado no use case):

- `campusId` é validado contra a lista retornada por `CampusCatalogProvider`;
- `administrativeUnitId` é validado contra a lista de `AdministrativeUnitCatalogProvider`, incluindo vínculo com o campus informado;
- IDs inválidos ou inexistentes são convertidos para `null` e entram em `missingFields`.

## RAG Validará (Planejado — ciclo de inferência futuro):

- significado;
- existência real;
- consistência institucional.

---

## Exemplo

O usuário informa:

```text
Campus Parnaíba
```

---

## Validação Executada (Atual)

### Passo 1

O `SendAiMessageUseCase` recebe o draft do `AiGateway` com `campusId` preenchido.

### Passo 2

O use case verifica se o `campusId` existe no catálogo carregado de `CampusCatalogProvider.list()`.

### Passo 3

Se o ID não for encontrado, `campusId` é normalizado para `null` e adicionado a `missingFields`.

---

## Caso o Campus Não Exista no Catálogo

O frontend pode solicitar ao usuário um campus válido com base nos catálogos disponíveis. Futuramente, com RAG, o Gemini poderá responder:

```text
Desculpe, mas não encontrei registro desse campus nos documentos oficiais da UESPI.

Os campi disponíveis são:
- Campus Poeta Torquato Neto
- Campus Alexandre Alves de Oliveira
- ...
```

---

# 6.4 Benefícios Arquiteturais do Modelo

A integração entre:

- Zod;
- LangChain;
- Gemini;
- RAG;

permite construir um sistema:

---

## Estruturado

Os dados seguem schemas rígidos e previsíveis.

---

## Inteligente

O chatbot entende linguagem natural e contexto.

---

## Validado

As informações são conferidas com documentos oficiais.

---

## Conversacional

O preenchimento ocorre de forma dinâmica e natural.

---

## Escalável

Novos tipos de manifestação podem ser adicionados facilmente.

---

## Seguro

Reduz drasticamente:

- alucinações;
- inconsistências;
- entradas inválidas;
- erros de interpretação.

---

# 6.5 Resultado Final da Integração

O sistema deixa de ser apenas:

- um chatbot simples;
- ou um formulário estático.

E passa a funcionar como:

- uma ouvidoria inteligente;
- um assistente institucional contextual;
- um sistema de preenchimento assistido;
- uma interface conversacional orientada por IA e RAG.

---

# Apêndice A — Status da Implementação

## Implementado

| Componente                                              | Caminho                                                                                 |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Model Prisma `Campus`                                   | `prisma/schema.prisma`                                                                  |
| Model Prisma `AdministrativeUnit`                       | `prisma/schema.prisma`                                                                  |
| Migration `add_campus_and_administrative_units`         | `prisma/migrations/20260517130000_add_campus_and_administrative_units/migration.sql`    |
| Interface `AiGateway`                                   | `src/application/ai/ai-gateway.ts`                                                      |
| Interface `CampusCatalogProvider`                       | `src/application/ai/ai-catalog-providers.ts`                                            |
| Interface `AdministrativeUnitCatalogProvider`           | `src/application/ai/ai-catalog-providers.ts`                                            |
| `PrismaCampusCatalogProvider`                           | `src/infra/database/prisma/repositories/prisma-campus-catalog-provider.ts`              |
| `PrismaAdministrativeUnitCatalogProvider`               | `src/infra/database/prisma/repositories/prisma-administrative-unit-catalog-provider.ts` |
| `SendAiMessageUseCase`                                  | `src/application/use-cases/send-ai-message/send-ai-message-use-case.ts`                 |
| `SendAiMessageController`                               | `src/presentation/controllers/ai/send-ai-message.controller.ts`                         |
| `ZodValidator`                                          | `src/infra/http/fastify/validators/zod-validator.ts`                                    |
| DI Registration (campus + administrativeUnit providers) | `src/main/factories/infrastructure.ts`                                                  |
| Testes do use case (9 testes)                           | `test/unit/application/send-ai-message-use-case.spec.ts`                                |
| Testes do controller (3 testes)                         | `test/unit/presentation/send-ai-message.controller.spec.ts`                             |

## Pendente

| Componente                                        | Observação                                                |
| ------------------------------------------------- | --------------------------------------------------------- |
| Adapter concreto `AiGateway` (LangChain + Gemini) | Deve implementar `AiGateway.chat()`                       |
| Seed de dados (Campus + AdministrativeUnit)       | Popular tabelas com dados oficiais da UESPI               |
| Factory `makeSendAiMessageController()`           | Em `src/main/factories/controllers/`                      |
| Rota HTTP (`ai.routes.ts`)                        | Registrar no `server.ts`                                  |
| Pipeline RAG (ingestão + busca vetorial)          | Ciclo de ingestão completo                                |
| Dependências npm                                  | `langchain`, `@langchain/google-genai`, `@langchain/core` |
| Env vars da IA                                    | `GEMINI_API_KEY` etc. no schema do `env.ts`               |
