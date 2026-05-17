# Status do MVP

Snapshot do escopo entregue por este repositório. Atualize esta seção sempre que uma feature sair de "pendente" ou "fora de escopo".

## Implementado

Funcionalidades cobertas de ponta a ponta (domínio → aplicação → presentation → infra → rota HTTP → e2e):

- Cadastro de usuário (UC-01) — `POST /users`
- Autenticação (UC-02) — `POST /sessions`
- Registro de manifestação identificada (UC-04) — `POST /manifestations` (Bearer válido com papel `manifestant`)
- Registro de manifestação anônima (UC-04) — `POST /manifestations` (sem token, retorna `accessCode`)
- Acompanhamento por usuário autenticado (UC-05) — `GET /manifestations`, `GET /manifestations/:id`
- Mensagens no chamado (UC-05) — `POST /manifestations/:id/messages`
- Rastreamento anônimo por protocolo e código de acesso (UC-05b) — `POST /manifestations/track`
- Finalização pelo manifestante (UC-06) — `POST /manifestations/:id/finalize`
- Avaliação do atendimento pelo manifestante (UC-11) — `POST /manifestations/:id/evaluation` (rating 1–5 + comentário opcional, snapshot do papel do atendente em `attendant_role_snapshot`)
- Listagem administrativa (UC-07) — `GET /admin/manifestations` (filtros: status, type, campusId, administrativeUnitId, from, to)
- Detalhamento administrativo (UC-07) — `GET /admin/manifestations/:id`
- Resposta administrativa (UC-07) — `POST /admin/manifestations/:id/answer`
- Alteração administrativa de status (UC-07) — `PATCH /admin/manifestations/:id/status` (transições válidas: `IN_ANALYSIS→CANCELED`, `ANSWERED→IN_ANALYSIS`, `ANSWERED→FINALIZED`)
- Histórico por mensagens de sistema — reconstruído em `findDetailsById` a partir de `ManifestationMessage` com `senderType='system'` + payload JSON, gravado dentro do mesmo `prisma.$transaction` que altera o agregado

### Invariantes de domínio aplicados

- `ANSWERED` só é atingido via `POST /answer` (resposta administrativa). `PATCH status=answered` é bloqueado pelo agregado com `409` — garante que toda manifestação `answered` tenha de fato uma resposta registrada.
- Usuários com papel `ombudsman` ou `admin` não podem abrir manifestações identificadas em nome próprio (`403`). Anônimas seguem permitidas para qualquer perfil.
- Manifestações `canceled` e `finalized` são estados terminais — não aceitam novas mensagens (`409`) nem novas transições.
- Manifestações anônimas só podem ser acessadas via `POST /manifestations/track` com protocolo + código de acesso; os fluxos identificados (`GET /manifestations/:id`, etc.) recusam acesso (`403`).

### Cobertura de testes

- **Unit:** 261 testes em `test/unit/` (domínio, aplicação, presentation). `pnpm test`.
- **E2E:** 34 testes em `test/e2e/` (6 specs) cobrindo fluxos HTTP reais contra Postgres com schema isolado por arquivo. `pnpm test:e2e` (requer `pnpm db:up`).

## Pendente por integração externa

Núcleo e controller já existem, mas os adapters concretos de integração ainda não foram implementados — quando entrarem, basta adicionar factory + rota.

- IA institucional (UC-09) — `SendAiMessageUseCase` + `SendAiMessageController` prontos; faltam `AiGateway`, `CampusCatalogProvider` e `AdministrativeUnitCatalogProvider` em `src/infra/`.
- Pré-preenchimento assistido por IA (UC-10) — herda o mesmo gap do UC-09 (consome o draft retornado por `SendAiMessageUseCase`).

## Fora do recorte atual do MVP

Itens conscientemente adiados para versões futuras:

- Anexos em manifestações e mensagens
- Relatórios gerenciais e dashboards
- Notificações ao manifestante (e-mail, push, in-app)
- Encaminhamento ou atribuição administrativa entre responsáveis (RF20)
- Materialização explícita do histórico em entidade dedicada (RF23 — hoje derivado de `ManifestationMessage` system messages)
- Rate limiting / bloqueio por tentativa em rotas públicas
- Refresh token, recuperação de senha, MFA, confirmação de e-mail
- Auditoria estruturada além do histórico de status

## Decisões de design conscientes a registrar

- **Guarda de papel no controller, não no use case:** `RegisterManifestationController` aplica a regra "ombudsman/admin não abre identificada". Como o único ponto de entrada hoje é REST, manter a guarda na presentation é aceitável para o MVP. Se outro adapter (CLI, GraphQL, worker) consumir o use case no futuro, mover a regra para `RegisterManifestationUseCase` (recebendo `requesterRole?: UserRole`) para evitar bypass.
- **Auditoria em system messages, não em tabela própria:** evita uma migração extra no MVP. Quando o histórico precisar de campos estruturados (diff de campos, metadados ricos, retenção própria), considerar uma tabela `manifestation_audit_log` dedicada.
- **`@prisma/adapter-pg` em vez de conexão nativa:** Prisma 7 removeu a conexão direta do client; o adapter foi a escolha mínima para manter o stack sem Accelerate.
