# Diagnóstico de falhas intermitentes do Guará — 2026-05-23

> Registro de uma falha observada em produção local: o Guará responde
> ocasionalmente apenas com `"Estou com dificuldade para responder agora.
Aguarde alguns segundos e tente enviar a mensagem novamente, por favor."` e
> não é possível identificar a causa porque o backend está engolindo o erro
> sem logar nada.
>
> Este documento descreve o sintoma, a análise do código, a hipótese de causa
> raiz, e o plano em duas etapas (instrumentação primeiro, mitigação depois).

---

## 1. Sintoma observado

Mesmo com chave paga do Gemini (`GOOGLE_API_KEY` em `ai-api/.env`), em parte
das interações o Guará devolve o texto de fallback acima — às vezes na
primeira mensagem, às vezes no meio de uma conversa válida. O comportamento
é intermitente: a próxima tentativa do usuário costuma funcionar.

Não há rastro nos logs do backend nem do `ai-api` que indique a causa.

## 2. Origem do texto de fallback

Vem do `SendAiMessageController` do backend principal
(`src/presentation/controllers/ai/send-ai-message.controller.ts:18-26`),
disparado pelo `mapError` (`:51-56`) quando o use case lança `AiServiceError`:

```ts
protected override mapError(error: unknown): HttpResponse | null {
  if (error instanceof AiServiceError) {
    return ok(AI_SERVICE_FALLBACK_RESPONSE)
  }
  return null
}
```

O `AiServiceError` é definido em `src/infra/ai/ai-service-error.ts` e tem
quatro variantes (`kind`) — todas são engolidas igualmente.

## 3. As quatro variantes possíveis

`HttpAiGateway` (`src/infra/ai/http-ai-gateway.ts`) lança `AiServiceError` em
quatro situações:

| `kind`             | Origem                                                              | Linha    |
| ------------------ | ------------------------------------------------------------------- | -------- |
| `timeout`          | `fetch` para o `ai-api` excedeu `AI_SERVICE_TIMEOUT_MS` (30 s)      | :60      |
| `network`          | `fetch` falhou antes de obter resposta (DNS, conexão recusada, etc) | :62      |
| `upstream_status`  | `ai-api` respondeu com status não-2xx                               | :66      |
| `invalid_response` | Corpo não é JSON ou não bate com `responseSchema`                   | :73, :78 |

## 4. Hipóteses de causa raiz

### 4.1 `timeout` (suspeita principal)

- Modelo configurado: `models/gemini-2.5-flash-lite` (`ai-api/.env`).
- LangChain client está com `maxRetries: 0`
  (`ai-api/src/infra/llm/gemini-structured-client.ts:32`), então qualquer hiccup
  do Gemini sobe imediatamente como erro.
- `structured output` + prompt grande (system prompt longo + catálogo de
  ~22 KB com 85 unidades + chunks do RAG) ocasionalmente passa de 30 s.
- O ai-api captura a exceção e devolve `NEUTRAL_FALLBACK_RESPONSE` em 200,
  então isso **não** dispara o fallback do backend — só o timeout no fetch
  do backend até o ai-api pode disparar (`AbortSignal.timeout`).

### 4.2 `upstream_status`

- O `ai-api` retorna 200 em quase todos os fluxos (rate-limit, falha do
  Gemini, validação do schema do LLM). A exceção é o 400 quando o corpo
  recebido falha em `sendAiMessageBodySchema`
  (`ai-api/src/presentation/controllers/send-ai-message-controller.ts:28`).
- Pode ainda haver **413** se o corpo exceder `REQUEST_BODY_LIMIT_BYTES`
  (64 KB) do Fastify do ai-api (`ai-api/src/main/server.ts:13`).
- Medição: catálogo atual + payload mínimo já são ~22 KB; com histórico de
  12 KB e mensagem de até 4 KB sobram ~26 KB de folga — suficiente em uso
  normal, mas pode estourar com prompts maiores.

### 4.3 `network`

- Improvável em uso normal, mas possível se o container `ai-api` reinicia
  ou fica indisponível por instantes durante hot-reload (`tsx watch`).

### 4.4 `invalid_response`

- O ai-api sempre serializa via Fastify, então JSON inválido é improvável.
- O `responseSchema` do backend (`http-ai-gateway.ts:8-21`) aceita os mesmos
  campos que o ai-api retorna em todos os fluxos, então um mismatch só
  aconteceria se uma mudança no ai-api não fosse refletida no backend.

## 5. Plano em duas etapas

### Etapa 1 — Instrumentação (essencial)

Substituir o `mapError` silencioso por um log estruturado que registre o
`kind` e o `cause`. Proposta em
`src/presentation/controllers/ai/send-ai-message.controller.ts`:

```ts
protected override mapError(error: unknown): HttpResponse | null {
  if (error instanceof AiServiceError) {
    const cause = error.cause instanceof Error ? error.cause.message : undefined
    console.warn(
      `[ai] fallback triggered kind=${error.kind} message=${error.message}` +
        (cause !== undefined ? ` cause=${cause}` : ''),
    )
    return ok(AI_SERVICE_FALLBACK_RESPONSE)
  }
  return null
}
```

Depois disso, basta acompanhar `docker compose logs -f backend` por
algumas falhas para identificar o `kind` dominante.

### Etapa 2 — Mitigações (condicionais)

Dependem do diagnóstico da etapa 1:

| Se predominar      | Aplicar                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `timeout`          | Subir `AI_SERVICE_TIMEOUT_MS` para `60000` no `.env` do backend; setar `maxRetries: 2` no `ChatGoogleGenerativeAI`             |
| `upstream_status`  | Verificar status real no log do `ai-api`; se for 413, subir `REQUEST_BODY_LIMIT_BYTES` para `262144` no `ai-api/.env`          |
| `network`          | Verificar `docker compose ps` e `docker stats` para confirmar saúde do container `ai-api`; possivelmente adicionar healthcheck |
| `invalid_response` | Comparar shape do `aiChatResponseSchema` do ai-api com `responseSchema` do backend; reforçar testes de contrato                |

## 6. Status

- [x] Diagnóstico documentado
- [ ] Etapa 1 — log instrumentado em `mapError`
- [ ] Etapa 2 — mitigação aplicada após coletar dado real

## 7. Observação relacionada

Este episódio expõe um padrão a evitar: silenciar exceções em `mapError`
sem trilha de log. Para qualquer controlador que tenha fallback por erro
de adapter (`AiServiceError`, falha de armazenamento, etc.), o **log do
`kind`/origem antes de devolver o fallback é obrigatório** — caso contrário
o sistema fica "auto-curativo na superfície e cego por dentro".
