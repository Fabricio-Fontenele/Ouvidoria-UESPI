# Especificação da Feature: Avaliar Atendimento

## 1. Identificação

| Campo          | Descrição                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Caso de uso    | UC-11 (complementa UC-06 — avaliação do atendimento pelo autor)                                      |
| Nome           | Avaliar atendimento                                                                                  |
| Feature        | Registro de avaliação (rating + comentário opcional) do atendente após a finalização da manifestação |
| Ator principal | Manifestante                                                                                         |
| Prioridade     | Média                                                                                                |
| Status         | Implementado de ponta a ponta (domínio, aplicação, presentation, infra, rota HTTP, e2e).             |

---

## 2. Objetivo

Permitir que o autor de uma manifestação avalie, após a finalização, o atendente responsável pelo atendimento (ouvidor ou admin que registrou a primeira resposta administrativa formal). A avaliação é opcional e única por manifestação.

A finalização propriamente dita continua coberta pelo UC-06.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| RF15   | Permitir encerramento da manifestação pelo usuário (UC-06) — a avaliação só é possível após o encerramento.                                      |
| RF16   | Permitir que o usuário avalie a qualidade do atendimento recebido após o encerramento (avaliação do atendimento).                                |
| RN05   | O sistema deve manter rastreabilidade de interações, respostas, alterações de status e responsáveis por cada ação.                               |
| RNF09  | O sistema deve manter histórico suficiente para rastrear alterações de status, mensagens, respostas administrativas, encerramentos e avaliações. |

---

## 4. Escopo da feature

### 4.1 Incluído

- Registro de avaliação (rating inteiro 1–5 + comentário opcional ≤ 1000 caracteres) pelo autor identificado, após a manifestação atingir status `finalized`.
- Persistência atômica da avaliação e da mensagem de auditoria `evaluation_recorded` em uma única transação.
- Snapshot do papel do atendente (`OMBUDSMAN` ou `ADMIN`) no momento da avaliação (`attendant_role_snapshot`) para suportar métricas futuras sem retroatividade.
- Garantia de unicidade: uma manifestação só pode ser avaliada uma vez.

### 4.2 Não incluído

- Edição ou exclusão de avaliação existente.
- Avaliação por manifestação anônima (somente identificadas).
- Relatórios agregados / médias por atendente (UC-09 / relatórios futuros).
- Notificação ao atendente sobre a avaliação recebida.

---

## 5. Ator principal

### Manifestante

Usuário autenticado, autor identificado da manifestação, que deseja registrar sua avaliação após o encerramento formal do atendimento.

---

## 6. Pré-condições

- O usuário deve estar autenticado (papel `manifestant`).
- A manifestação deve existir.
- A manifestação deve pertencer ao `userId` informado.
- A manifestação deve estar no status `finalized`.
- A manifestação deve possuir `attendantUserId` definido (sempre verdadeiro após o fluxo normal: o atendente é gravado na primeira resposta administrativa formal — ver §11).
- Nenhuma avaliação anterior deve existir para esta manifestação.

---

## 7. Pós-condições

- Uma linha em `manifestation_evaluations` é criada (1:1 com a manifestação) carregando rating, comentário normalizado, autor, atendente e snapshot de papel.
- Uma mensagem de sistema (`senderType='system'`, `type='evaluation_recorded'`) é inserida em `manifestation_messages` na mesma transação, incluindo `rating` e `attendantUserId` no payload para reconstrução do histórico.
- A manifestação permanece em status `finalized` (a avaliação não altera o status).

---

## 8. Entradas

### 8.1 Avaliação

| Campo           | Tipo          | Obrigatório | Descrição                                                                               |
| --------------- | ------------- | ----------- | --------------------------------------------------------------------------------------- |
| userId          | string        | Sim         | Identificador do manifestante autenticado.                                              |
| manifestationId | string        | Sim         | Identificador da manifestação avaliada.                                                 |
| rating          | integer (1–5) | Sim         | Nota inteira do atendimento.                                                            |
| comment         | string ≤ 1000 | Não         | Comentário livre. Aceita `null` ou ausência; whitespace puro é normalizado para `null`. |

#### Exemplo de entrada (HTTP)

```http
POST /manifestations/manifestation-1/evaluation
Authorization: Bearer <token-do-manifestante>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Atendimento rápido e resolveu minha demanda."
}
```

---

## 9. Regras de negócio

| Código     | Regra                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RN-UC11-01 | Apenas o autor identificado da manifestação pode registrar avaliação por este fluxo.                                                                                           |
| RN-UC11-02 | Manifestações anônimas não podem ser avaliadas pelo fluxo identificado.                                                                                                        |
| RN-UC11-03 | Avaliação só é permitida quando o status da manifestação é `finalized`.                                                                                                        |
| RN-UC11-04 | Uma manifestação só pode ser avaliada uma vez (unicidade aplicada por `UNIQUE` em `manifestation_evaluations.manifestation_id` + verificação prévia no use case).              |
| RN-UC11-05 | O atendente avaliado é aquele que registrou a primeira resposta administrativa formal (`OMBUDSMAN` ou `ADMIN`). Respostas administrativas posteriores não alteram o atendente. |
| RN-UC11-06 | O papel do atendente é gravado como snapshot no momento da avaliação (`attendant_role_snapshot`) para suportar métricas futuras sem retroatividade.                            |
| RN-UC11-07 | `rating` deve ser inteiro entre 1 e 5 inclusive — validado em duas camadas (Zod no controller + VO `Rating` no domínio + CHECK constraint no banco).                           |
| RN-UC11-08 | Comentário com apenas whitespace é normalizado para `null` na entidade `ManifestationEvaluation`.                                                                              |
| RN-UC11-09 | A avaliação não altera o status da manifestação (continua `finalized`).                                                                                                        |

---

## 10. Validações

### 10.1 Propriedade

`manifestationId` + `userId` devem localizar uma manifestação identificada cujo `authorUserId` corresponda ao usuário autenticado (`manifestation.belongsTo(userId)`).

### 10.2 Status

`manifestation.status` deve ser exatamente `finalized`. Qualquer outro valor bloqueia a operação (RN-UC11-03).

### 10.3 Atendente presente

`manifestation.attendantUserId` deve ser não-nulo. Após o fluxo normal isso é sempre verdadeiro (atendente é gravado na primeira resposta — ver §11), mas o guard cobre legados ou inconsistências.

### 10.4 Unicidade

`manifestationEvaluationsRepository.findByManifestationId(...)` deve retornar `null` antes da criação. O `UNIQUE` em coluna `manifestation_id` reforça defensivamente no banco.

### 10.5 Rating

Validado no controller (Zod `z.number().int().min(1).max(5)`), reforçado no domínio (VO `Rating.create`) e no banco (`CHECK rating BETWEEN 1 AND 5`).

### 10.6 Comentário

Validado no controller (Zod `z.string().trim().min(1).max(1000).nullable().optional()`). A entidade normaliza whitespace-only para `null`.

---

## 11. Fluxo principal

1. O manifestante envia `POST /manifestations/:manifestationId/evaluation` com `rating` e (opcional) `comment`.
2. O Zod do controller valida o payload.
3. O use case localiza a manifestação por `manifestationId`.
4. O use case verifica `manifestation.belongsTo(userId)`.
5. O use case verifica `manifestation.status === FINALIZED`.
6. O use case verifica `manifestation.attendantUserId !== null`.
7. O use case verifica que não há avaliação prévia (`findByManifestationId`).
8. O use case carrega o atendente atual via `usersRepository.findById(attendantUserId)` para obter o snapshot de papel.
9. O agregado `ManifestationEvaluation.record(...)` é construído com rating e comentário normalizado.
10. O repositório grava a avaliação + mensagem de sistema `evaluation_recorded` em uma única transação Prisma.
11. O sistema retorna `201 Created` com a avaliação registrada.

### 11.1 Como o atendente é gravado

O `attendantUserId` da manifestação é populado em `AnswerManifestationUseCase` por meio de `manifestation.assignAttendant(senderUserId, requester.role)`. O método é idempotente: se já existe atendente, não sobrescreve; se o papel não é `OMBUDSMAN` nem `ADMIN`, não atribui. A persistência ocorre na mesma `$transaction` da resposta em `PrismaManifestationAdministrationRepository.recordAnswer(...)`.

---

## 12. Fluxos alternativos

### FA01 — Manifestação inexistente

`ManifestationNotFoundError` → HTTP **404**.

### FA02 — Outro autor

A manifestação existe mas não pertence ao `userId`. `NotAllowedToAccessManifestationError` → HTTP **403**.

### FA03 — Manifestação anônima

`authorUserId` é `null`. `belongsTo` retorna `false`. `NotAllowedToAccessManifestationError` → HTTP **403**.

### FA04 — Status diferente de `finalized`

`ManifestationNotFinalizedError` → HTTP **409**.

### FA05 — Sem atendente

`ManifestationHasNoAttendantError` → HTTP **409**. Em fluxo normal nunca ocorre, mas cobre cenários degradados.

### FA06 — Avaliação já existente

`ManifestationAlreadyEvaluatedError` → HTTP **409**.

### FA07 — Rating inválido

Zod bloqueia em **400**; caso passe, o VO `Rating` lança `InvalidRatingError` que mapeia para **422**.

### FA08 — Comentário > 1000 caracteres

Zod bloqueia em **400**.

---

## 13. Saída de sucesso

```json
{
  "evaluation": {
    "id": "evaluation-1",
    "manifestationId": "manifestation-1",
    "attendantUserId": "ombudsman-1",
    "attendantRoleSnapshot": "ombudsman",
    "authorUserId": "user-1",
    "rating": 5,
    "comment": "Atendimento rápido e resolveu minha demanda.",
    "createdAt": "2026-05-17T13:42:00.000Z"
  }
}
```

HTTP **201 Created**.

---

## 14. Erros esperados

| Condição                                       | Erro                                   | HTTP |
| ---------------------------------------------- | -------------------------------------- | ---- |
| Manifestação inexistente                       | `ManifestationNotFoundError`           | 404  |
| Outro autor / anônima                          | `NotAllowedToAccessManifestationError` | 403  |
| Status diferente de `finalized`                | `ManifestationNotFinalizedError`       | 409  |
| Manifestação sem atendente                     | `ManifestationHasNoAttendantError`     | 409  |
| Avaliação já registrada                        | `ManifestationAlreadyEvaluatedError`   | 409  |
| Rating fora do intervalo (domínio)             | `InvalidRatingError`                   | 422  |
| Payload Zod inválido (rating, comentário etc.) | erro de validação                      | 400  |
| Sem autenticação                               | `UnauthenticatedError`                 | 401  |

---

## 15. Regras de segurança

- A avaliação respeita a autoria identificada — manifestações anônimas exigem fluxo distinto (não previsto).
- O servidor não expõe avaliações de outros usuários.
- Validações duplicadas (controller, domínio, banco) impedem dados inválidos persistirem mesmo em caso de bypass do controller.
- A unicidade é garantida pelo banco (`UNIQUE` constraint), evitando duplicatas em condições de corrida.

---

## 16. Critérios de aceite

- Avaliar `finalized` própria com `rating` 1–5 e comentário opcional → 201, registro em `manifestation_evaluations`, mensagem `evaluation_recorded` em `manifestation_messages`.
- Avaliar `answered` → 409 `ManifestationNotFinalizedError`.
- Avaliar manifestação de outro autor → 403.
- Avaliar duas vezes → 409 `ManifestationAlreadyEvaluatedError`.
- Avaliar com rating fora do intervalo → 400 (Zod) ou 422 (domínio).
- Avaliar com comentário > 1000 caracteres → 400.
- Comentário `null` ou whitespace puro → persistido como `null`.
- Primeira resposta administrativa (ouvidor ou admin) define `attendant_user_id`; respostas subsequentes não alteram.

---

## 17. Casos de teste

### 17.1 Unit

- `Rating.create` aceita 1..5; rejeita 0, 6, 1.5, NaN, negativos (`InvalidRatingError`).
- `ManifestationEvaluation.record` normaliza comentário, gera `createdAt`, respeita `attendantRoleSnapshot`.
- `Manifestation.assignAttendant` atribui quando null + role administrativo; é idempotente; ignora `MANIFESTANT`.
- `AnswerManifestationUseCase` define `attendantUserId` na primeira resposta (ombudsman ou admin) e mantém em respostas posteriores; não muta o agregado quando a transição de status falha.
- `EvaluateManifestationUseCase` cobre: sucesso, role snapshot, not found, not author, anonymous, status não-finalized, sem attendant, attendant inexistente no users-store, já avaliada, rating inválido, falha de save.

### 17.2 E2E (`test/e2e/manifestation-evaluation.e2e.spec.ts`)

- Atendente é setado no primeiro responder (ombudsman e admin) e mantido em respostas subsequentes.
- Fluxo completo open → answer → finalize → evaluate → 201 (com row em `manifestation_evaluations` e system message `evaluation_recorded`).
- Avaliação duplicada → 409.
- Avaliação em manifestação não finalizada → 409.
- Avaliação por outro manifestante → 403.
- Rating fora do intervalo → 400.
- Comentário > 1000 → 400.
- Sem token → 401.
- Comentário `null` explícito → 201, comentário persistido como `null`.

---

## 18. Sugestão de tipos

```ts
export interface EvaluateManifestationInput {
  userId: string
  manifestationId: string
  rating: number
  comment?: string | null
}

export class ManifestationEvaluation extends Entity<ManifestationEvaluationProps> {
  static record(props: RecordManifestationEvaluationProps, id?: UniqueEntityId): ManifestationEvaluation
}

export class Rating {
  static create(value: number): Rating
  getValue(): number
}

export interface ManifestationEvaluationsRepository {
  findByManifestationId(manifestationId: string): Promise<ManifestationEvaluation | null>
  save(evaluation: ManifestationEvaluation, actorUserId: string): Promise<void>
}
```

---

## 19. Observações de implementação

- **Ordem no `AnswerManifestationUseCase`:** `manifestation.recordAdministrativeAnswer()` é chamado **antes** de `manifestation.assignAttendant(...)`. Se a transição de status falhar (manifestação já em estado terminal), o agregado não é mutado com attendant antes da validação.
- **Atomicidade:** `PrismaManifestationEvaluationsRepository.save` envolve a criação da avaliação e a `INSERT manifestation_messages` (system, `evaluation_recorded`) em um único `prisma.$transaction`, garantindo que histórico e avaliação nunca divirjam.
- **Snapshot do papel:** `attendant_role_snapshot` é capturado **no momento da avaliação** (resolvido via `UsersRepository.findById(attendantUserId).role`). A escolha desacopla a avaliação de mudanças futuras de papel do atendente (ex: promoção de ouvidor a admin).
- **Defesa em profundidade do rating:** Zod (controller) → VO `Rating` (domínio) → CHECK constraint (banco). Os três níveis previnem persistência de valores inválidos.
- **Comentário:** trimming e normalização de whitespace puro para `null` ficam na entidade (`ManifestationEvaluation.record`). O controller aceita `null` explícito via `.nullable().optional()` no Zod.
- **História derivada:** `decodeSystemMessagePayload` no Prisma manifestations repository decodifica o payload `evaluation_recorded` com `rating` e `attendantUserId`, populando entradas de `ManifestationHistoryEntryDTO` (que ganharam campos `rating: number | null` e `attendantUserId: string | null`).
- **DTO de detalhes:** `ManifestationDetailsDTO` ganha `attendantUserId: string | null`. A exposição de um objeto `evaluation` completo (rating + comentário) foi deferida para um slice futuro de leitura.
- **Rota:** `POST /manifestations/:manifestationId/evaluation` com `preHandler: [ensureAuthenticated, requireRoles(UserRole.MANIFESTANT)]`.
- **Migration:** `prisma/migrations/20260517120000_evaluation_and_attendant/migration.sql` adiciona coluna `attendant_user_id` em `manifestations` (FK `ON DELETE RESTRICT`) e cria a tabela `manifestation_evaluations` com CHECK no rating, UNIQUE no `manifestation_id` e FKs nomeadas explicitamente para `users` e `manifestations`.

---

## 20. Notas finais

- A entidade `ManifestationEvaluation` é imutável (não há método de edição). Eventual edição/revogação fica para uma especificação futura.
- Quando o módulo de relatórios (UC-09 / dashboards) for implementado, espera-se reaproveitar `attendant_role_snapshot` para segmentar média de satisfação por papel.
- O recorte original do UC-06 está fechado por este UC-11; o UC-06 mantém apenas o encerramento puro.
