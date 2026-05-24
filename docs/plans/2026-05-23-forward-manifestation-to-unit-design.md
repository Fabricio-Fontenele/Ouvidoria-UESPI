# Design — Encaminhamento da manifestação ao setor responsável

Data: 2026-05-23
Status: aprovado (pendente plano de implementação)

## Problema

O ouvidor precisa, em alguns casos, consultar o setor responsável antes de
responder ao manifestante. Na prática essa consulta acontece **fora do sistema**
(e-mail, memorando, contato direto). O que o sistema precisa oferecer é o
**rastro de estado**: registrar que a manifestação foi encaminhada e ficou
aguardando retorno do setor, de forma visível ao manifestante, voltando para
"respondido" quando o ouvidor traz o retorno.

Decisões tomadas no brainstorming:

- A troca com o setor é **offline**; o sistema **não** modela mensagens com o setor.
- O efeito no software é **um novo estado** da manifestação, não um canal novo.
- O ouvidor **escolhe o setor** no momento do encaminhamento (pode diferir do
  inferido pelo Guará).
- O setor encaminhado é **estado atual** e vira **coluna** (`forwardedToUnitId`),
  no mesmo espírito de `attendantUserId`.

## Fluxo

```
in_analysis ──[ouvidor: "encaminhei ao setor X"]──> awaiting_unit  (manifestante vê)
awaiting_unit ──[ouvidor responde / traz o retorno]──> answered
awaiting_unit ──[ouvidor desiste / admin cancela]──> in_analysis | canceled
awaiting_unit ──[ouvidor troca o setor]──> awaiting_unit (re-encaminha)
```

## Camadas

### 1. Domínio (`src/domain/entities/manifestation.ts`)

- Novo valor no enum: `ManifestationStatus.AWAITING_UNIT = 'awaiting_unit'`.
- Nova prop `forwardedToUnitId: AdministrativeUnitId | null` (+ getter); `open()`
  inicia `null`.
- Novo método `forwardToUnit(unitId)`:
  - guarda: status ∈ `{IN_ANALYSIS, AWAITING_UNIT}` (permite re-encaminhar);
    senão lança `ManifestationStatusTransitionNotAllowedError`.
  - efeito: `status = AWAITING_UNIT`, `forwardedToUnitId = unitId`.
- `recordAdministrativeAnswer()`: guarda passa a aceitar `IN_ANALYSIS` **ou**
  `AWAITING_UNIT` → `ANSWERED` (mantém idempotência).
- `allowedAdministrativeStatusTransitions`: adiciona
  `AWAITING_UNIT → [IN_ANALYSIS, CANCELED]`.
- `canReceiveMessages()` continua `true` em `awaiting_unit`.

### 2. Banco (Prisma + migração)

- `enum ManifestationStatus` ganha `awaiting_unit`.
- `Manifestation.forwardedToUnitId String? @map("forwarded_to_unit_id")` +
  relação opcional para `AdministrativeUnit` + índice.
- Migração: `ALTER TYPE ... ADD VALUE` + `ALTER TABLE ADD COLUMN` + FK + índice.
- Mapper `manifestation` mapeia o campo nos dois sentidos.

### 3. Aplicação

- Novo `ForwardManifestationToUnitUseCase` em
  `use-cases/manifestation-administration/forward-to-unit/`.
  - Input: `manifestationId`, `actingUserId`, `role`, `targetUnitId`.
  - Fluxo: carrega aggregate → autorização admin
    (`NotAllowedToManageManifestationError`) → valida setor-alvo no catálogo
    (ativo) → `assignAttendant(...)` → `aggregate.forwardToUnit(unitId)` →
    `administrationRepository.save(aggregate)`.
  - Erros próprios em `forward-to-unit/errors/` (setor-alvo inexistente/inativo);
    sem cross-import de `register-manifestation/errors`.
- A administration repository emite, no mesmo `$transaction` do `save`, uma
  mensagem `system` do novo tipo de histórico.

### 4. Histórico (`system-message-payload.ts` + DTOs)

- Novo tipo `forwarded_to_unit` em `ManifestationHistoryEntryDTO` e
  `HISTORY_TYPES` (encode/decode).
- Payload guarda `fromStatus`, `toStatus` e o setor (id/nome) na `description`.
- `ManifestationDetailsDTO` expõe `forwardedToUnit` (id + nome) para a UI montar
  o label de estado atual.

### 5. Presentação + Main

- `ForwardManifestationToUnitController`: setor inválido → 404/409,
  não-autorizado → 403, transição inválida → 409.
- `ZodValidator` para o body `{ administrativeUnitId: string }`.
- Factory `makeForwardManifestationToUnitController()` + rota
  `POST /admin/manifestations/:id/forward` com `requireRoles(ombudsman, admin)`.

### 6. Frontend (consumidor)

Botão "encaminhar ao setor" (com select de setor) e label "aguardando retorno do
setor responsável" são do front, que consome o novo endpoint + status. Tratado
como follow-up; este design cobre o contrato de backend.

### 7. Testes

- Unit: transições do aggregate (`forwardToUnit`, `recordAdministrativeAnswer`
  a partir de `awaiting_unit`), use case (mocks de catálogo + administration
  repo), controller (mapeamento de erros), encode/decode do novo tipo de payload.
- E2E: happy path do `POST .../forward`, setor inválido, status incompatível, auth.

## Decisões dos pontos menores

- Nome do status: `awaiting_unit` (vocabulário `AdministrativeUnit`).
- Manifestante vê o **nome** do setor (transparente; a manifestação já exibe a
  unidade dela).
- Encaminhar só a partir de `in_analysis`. Uma vez em `awaiting_unit`, **não** é permitido
  reencaminhar — o ouvidor aguarda o retorno e então responde (ou volta a análise/cancela).
