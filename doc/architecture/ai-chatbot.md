# Arquitetura de Implementação: Chatbot de Ouvidoria UESPI

A implementação do chatbot divide-se em dois ciclos fundamentais:

1. **Ciclo de Ingestão** — preparação da base de conhecimento.
2. **Ciclo de Inferência** — interação inteligente com o usuário utilizando RAG.

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

# 3.1 Gerenciamento de Estado da Conversa

A implementação utiliza:

- Chain-of-Thought;
- State Management;
- memória contextual.

---

# 3.2 Definição do Contrato de Dados

## Ferramentas

- Zod
- LangChain

### Objetivo

Definir uma estrutura obrigatória para os dados da manifestação.

### Exemplo

```ts
const ComplaintSchema = z.object({
  campus: z.string(),
  complaintType: z.string(),
  description: z.string(),
})
```

---

## Structured Output

### Recurso Utilizado

- `withStructuredOutput` do LangChain.

### Função

Força o Gemini a responder seguindo exatamente o schema definido.

### Benefícios

- padronização dos dados;
- validação automática;
- redução de inconsistências;
- integração segura com backend.

---

# 3.3 Loop de Preenchimento Assistido

O chatbot funciona como um assistente inteligente de preenchimento.

---

## Etapa 1 — Entrada do Usuário

O usuário descreve o problema livremente.

### Exemplo

```text
Estou tendo problemas no laboratório de informática do campus.
```

---

## Etapa 2 — Extração Silenciosa

O Gemini analisa a mensagem e tenta preencher automaticamente o schema.

### Resultado Esperado

```json
{
  "complaintType": "problema estrutural",
  "campus": "",
  "description": "Problemas no laboratório de informática"
}
```

---

## Etapa 3 — Lógica de Controle em TypeScript

O backend analisa os campos faltantes.

### Exemplo

Se o campo `local` estiver vazio:

```ts
if (!complaint.campus) {
  // instrução ao modelo
}
```

O sistema então instrui o Gemini a perguntar de forma contextualizada:

```text
O usuário não informou o campus.
Pergunte educadamente qual unidade da UESPI está relacionada ao problema.
```

---

## Etapa 4 — Validação com RAG

Quando o usuário informa um campus:

```text
Campus Poeta Torquato Neto
```

O sistema:

1. consulta a base vetorial;
2. verifica se o campus realmente existe;
3. valida os dados antes de continuar.

---

# 3.4 Memória Conversacional

## Ferramenta

- `BufferWindowMemory` do LangChain.

### Configuração

Mantém as últimas 5 mensagens da conversa.

### Objetivo

Permitir que o chatbot:

- lembre informações recentes;
- evite perguntas repetitivas;
- mantenha continuidade contextual.

### Benefícios

Melhora significativamente:

- experiência do usuário;
- naturalidade da conversa;
- eficiência do preenchimento assistido.

---

# 4. Fluxo Geral da Arquitetura

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

---

# 5. Tecnologias Principais

| Tecnologia          | Função                 |
| ------------------- | ---------------------- |
| TypeScript          | Backend principal      |
| LangChain           | Orquestração de IA     |
| Gemini              | Modelo LLM             |
| text-embedding-004  | Geração de embeddings  |
| ChromaDB / Pinecone | Banco vetorial         |
| Zod                 | Validação de schemas   |
| BufferWindowMemory  | Memória conversacional |
| RAG                 | Recuperação contextual |

---

# 6. Complemento Técnico da Arquitetura

Esta seção aprofunda os componentes técnicos responsáveis pela extração estruturada de dados, validação semântica e gerenciamento inteligente do fluxo conversacional da Ouvidoria UESPI.

---

# 6.1 Ferramentas da Biblioteca Zod

O Zod atua como o **contrato de verdade** da aplicação.

Seu principal objetivo é garantir que:

- o Gemini não invente campos;
- os tipos de dados estejam corretos;
- o backend receba respostas previsíveis;
- os dados das manifestações mantenham consistência estrutural.

---

## 6.1.1 `z.object()`

### Função

Define a estrutura principal da manifestação.

### Exemplo

```ts
const ComplaintSchema = z.object({
  complaintType: z.string(),
  campus: z.string(),
  description: z.string(),
})
```

### Objetivo

Padronizar os dados enviados pelo Gemini e utilizados pelo backend TypeScript.

---

## 6.1.2 `z.enum()`

### Função

Restringe os valores permitidos para determinados campos.

### Aplicação no Projeto

O tipo de manifestação deve aceitar apenas as categorias oficiais da ouvidoria.

### Exemplo

```ts
const ComplaintCategory = z.enum(['Denúncia', 'Reclamação', 'Sugestão', 'Elogio'])
```

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
const ComplaintSchema = z.object({
  campus: z.string().describe('O campus da UESPI onde o fato ocorreu'),

  description: z.string().describe('Descrição detalhada do ocorrido'),
})
```

### Resultado

O Gemini passa a compreender:

- contexto dos campos;
- significado institucional;
- intenção semântica da estrutura.

---

## 6.1.4 `z.optional()`

### Função

Permite preenchimentos parciais durante a conversa.

### Exemplo

```ts
const ComplaintSchema = z.object({
  campus: z.string().optional(),
  description: z.string().optional(),
})
```

### Objetivo

Viabilizar o fluxo conversacional incremental.

### Benefícios

O sistema consegue:

- aceitar respostas incompletas;
- continuar o preenchimento posteriormente;
- identificar quais informações ainda faltam.

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

## Exemplo de Interação

### Entrada do Usuário

```text
Quero reclamar de um professor em Parnaíba.
```

---

## Extração Estruturada do Gemini

```json
{
  "complaintType": "Reclamação",
  "campus": "Parnaíba",
  "description": null
}
```

---

## Análise do Backend

O TypeScript identifica que:

- `complaintType` foi preenchido;
- `campus` foi preenchido;
- `description` continua ausente.

---

## Próxima Pergunta Gerada

```text
Você já informou o tipo e o campus.
Agora, por favor, descreva detalhadamente o ocorrido para que possamos prosseguir.
```

---

## Benefícios do Slot Filling

O fluxo torna-se:

- natural;
- contextual;
- adaptável;
- menos burocrático.

O usuário não precisa preencher um formulário rígido manualmente.

---

# 6.3.2 Validação Semântica via RAG

Aqui está um dos diferenciais centrais da arquitetura.

---

## Validação Estrutural vs Validação Semântica

### Zod Valida:

- tipos;
- estrutura;
- presença de campos.

### RAG Valida:

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

## Validação Executada

### Passo 1

O Zod confirma:

- o campo é uma string válida.

### Passo 2

O RAG consulta:

- documentos oficiais da UESPI;
- lista de campi;
- registros institucionais.

### Passo 3

O sistema verifica:

- se o campus realmente existe;
- se o nome corresponde aos registros oficiais.

---

## Caso o Campus Não Exista

O Gemini pode responder:

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
