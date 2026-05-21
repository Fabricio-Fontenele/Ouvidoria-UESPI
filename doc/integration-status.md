# Status da integração frontend ↔ backend

Snapshot do progresso da integração do app `web/` com a API HTTP descrita em `doc/api/frontend-integration.md`. Atualize esta seção sempre que uma slice for mergeada ou um item sair da seção "Pendências".

## Slice 1 — Auth + catálogo + criação/listagem (PR #44, **merged**)

Implementado:

- **Cliente HTTP tipado** em `web/src/infrastructure/http/` (`apiFetch`, `ApiHttpError`, `auth-token-storage`). Lê `VITE_API_BASE_URL`, injeta Bearer do `sessionStorage`, mapeia o `{ error, message }` do backend e limpa o token em 401.
- **Autenticação real** substituindo o `MockAuthService`. `HttpAuthService` chama `POST /sessions` e `POST /users`, decodifica JWT para `sub`/`role`. `SignUp` use case + wiring na `SignPage`. Zod do form alinhado ao backend (senha ≥8 com upper/lower/digit, nome com dois termos).
- **Catálogo institucional** via `CatalogProvider`: busca `GET /catalog` no boot e expõe pelo hook `useCatalog`.
- **Manifestação (manifestante)** com `HttpManifestationsService` (`create`, `list`). `ManifestationFormPage` reescrito com selects cascateados campus → unidade administrativa. `HomePage` lista do backend, com estado vazio amigável.
- **Vocabulário alinhado**: enums internos do FE viraram os enums do backend (`report`/`complaint`/`suggestion`/`compliment`, `in_analysis`/`answered`/`finalized`/`canceled`). Rótulos PT só no render. Tipo "Solicitação" (não existe no backend) e status `pending` saíram do vocabulário.
- **Mocks removidos**: `MockAuthService`, contas hardcoded e arrays mockados de `HomePage` foram embora.
- **Docker**: serviço `web` recebe `VITE_API_BASE_URL` no `docker-compose.yml`. Volume nomeado para `node_modules`.

## Slice 2 — Detalhe + interação do manifestante (PR #45)

Implementado:

- **Página de detalhe** em `/manifestation?id=<uuid>`: summary card, descrição, hint de anexos, linha do tempo (do `history[]`), thread de mensagens com bolhas diferenciadas (manifestante / ouvidoria / sistema), composer de mensagem, `FinalizeAction` isolado e CTA de avaliação.
- **Serviço expandido** com `getById`, `addMessage`, `finalize`, `evaluate`. Mapeamento na borda HTTP narrowa os enums do backend para unions tolerantes (`'unknown'` como fallback) — UI não quebra se o backend introduzir novos valores.
- **Visibilidade centralizada** em `web/src/application/manifestations/manifestation-policy.ts`: `canSendMessage`, `canFinalize`, `canEvaluate`, `hasEvaluationRecorded`. Único ponto de verdade — composer, `FinalizeAction` e `EvaluationPage` consomem dali.
- **Parser de mensagem de sistema** em `system-message-payload.ts`, isolado para troca futura quando o backend expor `evaluation` como campo dedicado.
- **`EvaluationPage` real**: carrega o detalhe antes de habilitar submit, mostra protocolo, bloqueia com mensagem específica (não finalizada / sem ouvidor / já avaliada), submete `POST /:id/evaluation`, redireciona para o detalhe em sucesso.
- **Routes por id, não por protocolo**: `buildManifestationDetailsHref(id)` e `buildEvaluationHref(id)` produzem `?id=`. Páginas detectam `?protocol=` legado e exibem "link em formato antigo".
- **Vitest no workspace `web/`** (env node, só helpers puros): suítes para route builders, manifestation-policy e parser de sistema.
- **Seed dev**: `ouvidor@uespi.br` e `admin@uespi.br`, senha `Senha123`, upsert idempotente por email.

## Slice 3 — Anexos identificados + rastreio público anônimo

Implementado:

- **Política pura de anexos** em `web/src/application/manifestations/attachment-policy.ts`: limite de 5 anexos, 10 MB por arquivo, MIME whitelist e regra de upload por status centralizados.
- **Tipos separados para rastreio público** (`TrackedManifestationDetail` / `TrackedManifestationAttachmentInfo`), sem reaproveitar o detalhe interno autenticado.
- **Serviço HTTP expandido**: upload/download identificado, detalhe público de rastreio, upload/download anônimo por `protocol + accessCode`, com `FormData` e chamadas públicas sem Bearer.
- **Criação com anexos**: `ManifestationFormPage` permite envio identificado ou anônimo, valida anexos antes do submit e sobe os arquivos sequencialmente depois do `POST /manifestations`.
- **Sucesso anônimo seguro**: `ManifestationSubmissionSuccess` mostra protocolo e `accessCode` apenas no retorno da criação, com aviso explícito de que o código não será exibido novamente.
- **Detalhe identificado com anexos reais**: lista anexos retornados pelo backend, gera signed URL para download e permite novos uploads enquanto a manifestação aceita interação.
- **Rota pública `/track`**: consulta por protocolo + código de acesso, lista anexos públicos e permite upload/download anônimo sem gravar o código em URL, storage ou estado global.
- **Testes do `web/`**: política de anexos, rota pública e `HttpManifestationsService` cobrindo `FormData`, campos multipart e ausência manual de `Content-Type`.

## Pendências (próximas slices)

Em ordem sugerida:

1. **Fluxo Ombudsman / Admin** — `OmbudsmanHomePage` e `OmbudsmanManifestationDetailsPage` ainda usam mocks. Plugar `GET /admin/manifestations`, `GET /admin/manifestations/:id`, `POST /:id/answer`, `PATCH /:id/status` e download administrativo de anexos.
2. **Chat Guará** — `HttpGuaraChatService` ainda fala com endpoint fake. Reescrever para `POST /ai/messages` (history, intent, draft, missingFields, shouldOpenManifestationDraft). Unificar `VITE_GUARA_CHAT_ENDPOINT` com `VITE_API_BASE_URL`.
3. **Backend `/me`** — depois do login (sem cadastro), `user.name` e `user.email` ficam `null` no FE; só temos `sub` e `role` do JWT. Resolver no backend e atualizar `HttpAuthService.getSession`.
4. **Modal de confirmação no finalize** — hoje `window.confirm`, isolado em `FinalizeAction` para troca futura sem impacto.

## Notas operacionais

- `web/node_modules` pode acabar owned por root se o serviço `web` do `docker-compose` rodar sem o volume nomeado. Recuperação: `sudo rm -rf web/node_modules && cd web && npm install`. O volume nomeado no compose evita recorrência.
- `validate-commit-msg.sh` (husky `commit-msg`) não conhece o prefixo `fixup!` do git. Em workflows de autosquash, comitar com `--no-verify` para o fixup intermediário é aceitável — o commit é absorvido antes do push.
- CI roda `pnpm check:ci` (`format:check && lint:ci && type:check && test:ci`). Antes de push, vale rodar `pnpm format:check` local; já caiu CI uma vez por linha >120 chars introduzida fora do lint-staged.
- Vitest do `web/` é independente do `check:ci` do backend; rode `cd web && npm test` para a suíte de helpers (routes, policy, system-message-payload).
