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

## Slice 4 — Fluxo Ombudsman / Admin contra `/admin/*`

Implementado:

- **Vocabulário ombudsman alinhado ao backend**: enums `pending`/`resolved` saíram. Páginas usam `ManifestationStatus` (`in_analysis`/`answered`/`finalized`/`canceled`) e `ManifestationType` canônicos, com labels derivadas dos contracts compartilhados. `OmbudsmanManifestationSummary` virou `ManifestationSummary`.
- **Serviço HTTP ombudsman** em `web/src/infrastructure/ombudsman/http-ombudsman-service.ts` com `list`, `getById`, `answer`, `updateStatus` e `getAttachmentDownloadUrl`. `list` retorna `OmbudsmanListResult { manifestations, page, totalPages?, totalItems? }` — shape preserva paginação para quando o backend expuser metadados. `answer` e `updateStatus` retornam `void`; a UI usa refetch como fonte de verdade.
- **Política administrativa** em `web/src/application/ombudsman/ombudsman-policy.ts`: `canAnswer` (`in_analysis | answered`), `canFinalize` conservador (`answered` apenas) e `canCancel` (`in_analysis | answered`).
- **Componentes compartilhados manifestante ↔ ombudsman**: `ManifestationSummaryCard`, `ManifestationTimelineCard`, `ManifestationMessagesThread` (perspectiva `manifestant`/`institutional`) e `ManifestationAttachmentsList`. O detalhe do manifestante foi refatorado para consumir os mesmos componentes — uma mudança em timeline/thread/anexos passa por um único lugar.
- **`OmbudsmanHomePage` contra `GET /admin/manifestations`**: filtros por status/tipo/data refazem o fetch; data passa por `buildLocalDayRange` (helper testado) antes de virar `from`/`to` em ISO UTC. Cards mostram campus/unidade pelo catálogo, tipo via contract, data via `formatBrazilianShortDate`. Link “Abrir demanda” usa `?id=<uuid>`.
- **`OmbudsmanManifestationDetailsPage` contra `GET /admin/manifestations/:id`**: lookup por `?id=`, banner “link em formato antigo” para `?protocol=`. Composer chama `POST /answer`; ações secundárias **Finalizar** e **Cancelar** chamam `PATCH /status` com `window.confirm`. Anexos com botão Baixar usando a signed URL administrativa. Não há UI de upload administrativo (contrato não expõe).
- **Métricas dashboard**: cards mantidos com valor `—` e aviso explícito de que aguardam endpoint de métricas administrativas — não derivamos da página atual para não enganar o usuário.
- **Mapper compartilhado** em `web/src/infrastructure/manifestations/manifestation-detail-mapper.ts` — usado tanto pelo `HttpManifestationsService` quanto pelo `HttpOmbudsmanService`.
- **Testes do `web/`**: `http-ombudsman-service.test.ts` (URL/query/headers, narrowing via mapper, void de answer/updateStatus), `ombudsman-policy.test.ts` (matriz por status) e `date-utils.test.ts` (`buildLocalDayRange` + `formatBrazilianShortDate`).

## Slice 5 — Chat Guará contra `POST /ai/messages`

Implementado:

- **`HttpGuaraChatService` real** em `web/src/infrastructure/guara-chat/http-guara-chat-service.ts`: usa `apiFetch` contra `${VITE_API_BASE_URL}/ai/messages` — envia `Authorization: Bearer` quando o usuário está autenticado e omite quando anônimo (a rota tem `optionalAuthenticate` no backend). Trim + validações client-side (mensagem 1..4000 caracteres, history sliceado para os últimos 20 turnos, roles fora de `user|assistant` descartados). Erros HTTP viram `GuaraChatRequestError`. `DemoGuaraChatService` foi removido — o backend já tem `FakeAiGateway` para dev offline.
- **Contrato alinhado**: `SendGuaraMessageInput { history, message }` e `SendGuaraMessageOutput { answer, intent, shouldOpenManifestationDraft, draft, missingFields, confidence }`. Tipos canônicos em `web/src/application/guara-chat/guara-chat-types.ts`.
- **Normalizador puro** em `web/src/infrastructure/guara-chat/guara-chat-response-normalizer.ts`: narrowa intent fora do union para `unknown`, confidence fora de `[0,1]` para `null`, type fora do enum para `null` (e draft fully-null vira `null`), filtra `missingFields` para o subset válido e força `shouldOpenManifestationDraft = false` quando intent não é `manifestation_draft_ready` ou faltam campos.
- **Policy de capabilities** em `web/src/application/guara-chat/guara-chat-policy.ts`: `getGuaraChatCapabilities(user)` e `canApplyDraft(capabilities, draft)`. Anônimo → `allowedDraftTypes: ['report']`; `manifestant` autenticado → `allowedDraftTypes: ['report', 'complaint', 'suggestion', 'compliment']`; `ombudsman`/`admin` → `canCreateDraft: false`. CTA de abrir manifestação no chat só aparece quando `canApplyDraft` aprova. Espelha a política aplicada pelo prompt no `ai-api` via `userRole` no `AiChatRequest`.
- **`/guara` em modo restrito (público)**: `GuaraPage` deixou de redirecionar para login/login. Página acessível a anônimos, manifestants e perfis administrativos (esses dois últimos veem o banner por papel). Botão **Limpar conversa** no header do painel.
- **Persistência da conversa** em `sessionStorage` (`guara-chat:messages`) com hidratação no mount e limpeza no `signOut` (`AuthProvider`). Em parse error / shape error, a chave é descartada silenciosamente.
- **Handoff chat → form** via `sessionStorage` one-shot (`guara-chat:pending-draft`): `ChatPanel` faz `stashPendingDraft(draft)` + `navigateTo(routes.manifestationForm)`. `ManifestationFormPage` chama `consumePendingDraft()` no mount (uma única vez) e usa o draft como base para `form.reset()` quando o catálogo carregar.
- **Helper de defaults** em `getManifestationFormDefaultValuesFromDraft`: valida `type` contra o enum, valida `campusId` no catálogo, valida que `administrativeUnitId` pertence ao campus (caso contrário zera), e força `isAnonymous = !isAuthenticated`.
- **Gate de acesso ao form** (novo): `ManifestationFormPage` deixa de exigir auth quando há draft consumido. Política: usuário autenticado → entrada livre; usuário anônimo com draft → entrada permitida, banner explicativo, `isAnonymous` travado em `true`; usuário anônimo sem draft → redirect para `/login`. Liberar `/guara` publicamente **não** abriu o form para visita direta.
- **Missing fields inline**: quando o backend devolve `intent === 'manifestation_candidate'`, o chat lista os campos faltantes (`type`/`campusId`/`administrativeUnitId`/`description`) com labels PT abaixo da última resposta.
- **`.env.example`**: removido `VITE_GUARA_CHAT_ENDPOINT`. `VITE_API_BASE_URL` passa a ser a única configuração relevante para o chat.
- **Testes do `web/`**: `guara-chat-policy.test.ts` (matriz role × draft, com manifestant abrindo qualquer tipo), `guara-chat-response-normalizer.test.ts` (defesas de narrowing), `guara-chat-storage.test.ts` (round trip + parse error + one-shot do draft), `http-guara-chat-service.test.ts` (URL/body + cobertura anônima sem Authorization e autenticada com Bearer/erros) e `manifestation-form-contract.test.ts` (helper de defaults a partir do draft).

## Pendências (próximas slices)

Em ordem sugerida:

1. **Endpoint de métricas administrativas** — backend ainda não expõe agregados; cards do dashboard ombudsman mostram `—`. Depende do backend criar a rota.
   1b. **`updatedAt` no `ManifestationListItemDTO`** — backend já mantém `updatedAt` no Prisma, mas o summary só serializa `createdAt`. Expor para o FE trocar o label “Aberta em” do card ombudsman por “Última atualização”.
2. **Paginação real no `GET /admin/manifestations`** — backend só devolve `{ manifestations }` hoje. Quando expuser `totalPages`/`totalItems`, o `OmbudsmanListResult` já suporta os campos e a UI ganha “Próxima/Anterior”.
3. **Filtros de campus/unidade na listagem ombudsman** — selects cascateados reusando `useCatalog`. Backend já aceita `campusId`/`administrativeUnitId`.
4. **Backend `/me`** — depois do login (sem cadastro), `user.name` e `user.email` ficam `null` no FE; só temos `sub` e `role` do JWT. Resolver no backend e atualizar `HttpAuthService.getSession`.
5. ~~**Modal de confirmação no finalize / cancelar**~~ — feito. `ConfirmDialog` (`web/src/components/feedback/confirm-dialog.tsx`) usado por `FinalizeAction` (manifestante) e `StatusActions` (ombudsman), com variantes de tom (`success`/`danger`), foco no botão Cancelar e fechamento por Escape/backdrop.
6. **Cancelar/Desistir pelo autor antes da resposta** — backend só permite o autor encerrar em `answered` (regra de domínio `finalizeByAuthor()` em `src/domain/entities/manifestation.ts`). Hoje, se o manifestante quer desistir antes da ouvidoria responder, não há caminho — manifestação fica em `in_analysis` ou depende de cancelamento administrativo. Slice futura: adicionar `cancelByAuthor()` no agregado + `POST /manifestations/:id/cancel` + UI separada no detalhe manifestante (botão "Desistir desta manifestação", outlined em `home-brown`, visível só em `in_analysis`). Mantém `Encerrar` (`answered → finalized`, libera avaliação) e `Desistir` (`in_analysis → canceled`) como ações distintas com semântica clara.

## Notas operacionais

- `web/node_modules` pode acabar owned por root se o serviço `web` do `docker-compose` rodar sem o volume nomeado. Recuperação: `sudo rm -rf web/node_modules && cd web && npm install`. O volume nomeado no compose evita recorrência.
- `validate-commit-msg.sh` (husky `commit-msg`) não conhece o prefixo `fixup!` do git. Em workflows de autosquash, comitar com `--no-verify` para o fixup intermediário é aceitável — o commit é absorvido antes do push.
- CI roda `pnpm check:ci` (`format:check && lint:ci && type:check && test:ci`). Antes de push, vale rodar `pnpm format:check` local; já caiu CI uma vez por linha >120 chars introduzida fora do lint-staged.
- Vitest do `web/` é independente do `check:ci` do backend; rode `cd web && npm test` para a suíte de helpers (routes, policy, system-message-payload).
