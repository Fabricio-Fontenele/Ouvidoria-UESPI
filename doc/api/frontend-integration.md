# Contrato HTTP para Integração Frontend

Este documento é a fonte de verdade para consumo HTTP do frontend neste repositório. As feature specs em `doc/features/` continuam sendo documentos de negócio e caso de uso; quando houver divergência de payload, rota, autenticação ou shape de erro, prevalece o contrato documentado aqui porque ele reflete a implementação atual em `src/main/routes`, controllers e middlewares.

## Escopo do contrato atual

Este contrato cobre apenas as rotas implementadas no backend atual.

Itens de requisito ainda não expostos por HTTP nesta fatia devem ser tratados como pendentes de integração, especialmente:

- recuperação de senha
- anexos
- relatórios
- criação administrativa de usuários
- chatbot/IA

## 1. Convenções gerais

### Base path e conteúdo

- Não existe prefixo global de API no backend atual. Todas as rotas públicas começam diretamente em `/`.
- Requests e responses usam JSON.
- Datas e timestamps são serializados em ISO-8601 UTC, por exemplo: `2026-05-17T13:42:00.000Z`.

### Autenticação

- Quando exigida, a autenticação usa `Authorization: Bearer <token>`.
- O token é obtido em `POST /sessions`.
- O JWT carrega `sub` e `role`; a camada HTTP converte isso para `request.user.id` e `request.user.role`.

### Identidade autenticada: entrada de aplicação versus contrato HTTP

Os casos de uso internos mencionam campos como `userId`, `requesterId` e `requesterUserId`. Esses campos **não fazem parte do contrato HTTP público**.

- O frontend **não deve enviar** `userId`, `requesterId` ou `requesterUserId` em body, query ou path.
- A identidade autenticada é sempre derivada do JWT pelos middlewares/controllers.
- O único identificador de manifestação exposto como parâmetro de rota é `:manifestationId`.

### Paginação

- Os endpoints paginados aceitam apenas `page` como query param.
- Valor padrão: `page=1`.
- O tamanho da página é fixo internamente em `20`.
- Não existe `pageSize` público no contrato atual.

### Catálogos de campus e unidade administrativa

- `campusId` e `administrativeUnitId` são referências de catálogo institucional.
- O frontend deve buscar os IDs canônicos em `GET /catalog`.
- O frontend deve enviar sempre os IDs retornados por `GET /catalog` em `campusId` e `administrativeUnitId`, nunca labels livres.
- O frontend não deve manter lista estática local desses IDs como fonte de verdade.

### Campos extras

- Campos extras não fazem parte do contrato público e não devem ser enviados pelo frontend.
- No comportamento atual, campos não documentados podem ser ignorados pelo backend.
- O frontend não deve depender desse descarte implícito.

### Shape global de erro

```ts
type ApiError = {
  error: string
  message: string
}
```

Exemplos reais de erro:

```json
{
  "error": "ValidationError",
  "message": "email: Invalid input: expected string, received undefined"
}
```

```json
{
  "error": "UnauthenticatedError",
  "message": "Authentication is required."
}
```

```json
{
  "error": "ForbiddenError",
  "message": "Insufficient role."
}
```

```json
{
  "error": "ManifestationNotFoundError",
  "message": "Manifestation not found."
}
```

## 2. Referências de enums

```ts
type UserRole = 'manifestant' | 'ombudsman' | 'admin'

type ManifestationType = 'report' | 'complaint' | 'suggestion' | 'compliment'

type ManifestationStatus = 'in_analysis' | 'answered' | 'canceled' | 'finalized'

type ManifestationHistoryEntryType =
  | 'registered'
  | 'administrative_answered'
  | 'status_changed'
  | 'finalized_by_author'
  | 'evaluation_recorded'

type ManifestationMessageSenderType = 'manifestant' | 'anonymous_manifestant' | 'ombudsman' | 'admin' | 'system'
```

## 3. Autenticação

### `POST /users`

Cria uma conta pública. O papel retornado é sempre `manifestant`.

Request:

```json
{
  "name": "Fabricio Fontenele",
  "email": "fabricio@email.com",
  "password": "Password1"
}
```

Response `201 Created`:

```json
{
  "user": {
    "id": "user_123",
    "name": "Fabricio Fontenele",
    "email": "fabricio@email.com",
    "role": "manifestant",
    "createdAt": "2026-05-07T21:30:00.000Z"
  }
}
```

Erros representativos:

- `400 Bad Request` — `ValidationError`, `InvalidEmailError`, `InvalidNameError`, `InvalidPasswordError`
- `409 Conflict` — `UserAlreadyExistsError`

### `POST /sessions`

Autentica um usuário e devolve o JWT de acesso.

Request:

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

Response `200 OK`:

```json
{
  "token": "access-token"
}
```

Erros representativos:

- `400 Bad Request` — `ValidationError`, `InvalidEmailError`
- `401 Unauthorized` — `InvalidCredentialsError`

## 4. Catálogo público

### `GET /catalog`

Lista o catálogo institucional público consumido pelo formulário de manifestação.

Regras de retorno:

- Retorna apenas campi ativos.
- Cada campus retorna apenas unidades administrativas ativas.
- Campi ativos sem nenhuma unidade administrativa ativa não aparecem na resposta.
- `label` é o nome público de exibição; `name` interno de persistência não é exposto.
- `city` é retornado como `string | null`.

Response `200 OK`:

```json
{
  "campuses": [
    {
      "id": "campus-parnaiba",
      "label": "Campus Professor Alexandre Alves de Oliveira",
      "city": "Parnaíba",
      "administrativeUnits": [
        {
          "id": "coord-sistemas-parnaiba",
          "label": "Coordenação do Curso de Sistemas de Computação"
        }
      ]
    }
  ]
}
```

Observação:
os IDs e labels exatos dependem do catálogo seedado no ambiente, mas o shape do contrato HTTP é fixo e o frontend deve sempre consumir os IDs canônicos por esta rota.

## 5. Fluxos do manifestante

### `POST /manifestations`

Registra uma manifestação identificada ou anônima.

Observações:

- O body HTTP nunca inclui `requesterId`.
- Se `isAnonymous=false`, é obrigatório enviar Bearer válido de usuário com papel `manifestant`.
- Se `isAnonymous=true`, o request pode ser anônimo.
- Se um Bearer inválido for enviado em registro anônimo, a autenticação opcional é ignorada e a requisição segue como anônima.

### Anexos

O contrato HTTP atual de `POST /manifestations` não aceita anexos.

- A requisição deve ser `application/json`.
- Não existe, nesta fatia do MVP, endpoint público para upload, listagem ou remoção de arquivos de manifestação.

Request identificado:

```http
POST /manifestations
Authorization: Bearer <token-do-manifestante>
Content-Type: application/json
```

```json
{
  "isAnonymous": false,
  "type": "complaint",
  "campusId": "campus-1",
  "administrativeUnitId": "unit-1",
  "description": "O serviço ficou indisponível durante toda a manhã.",
  "involvedPeople": "Equipe da coordenação"
}
```

Response `201 Created`:

```json
{
  "manifestation": {
    "id": "uuid",
    "protocol": "2026-0001",
    "type": "complaint",
    "status": "in_analysis",
    "campusId": "campus-1",
    "administrativeUnitId": "unit-1",
    "description": "O serviço ficou indisponível durante toda a manhã.",
    "involvedPeople": "Equipe da coordenação",
    "isAnonymous": false,
    "authorUserId": "user-1",
    "createdAt": "2026-05-10T15:00:00.000Z"
  },
  "accessCode": null
}
```

Request anônimo:

```json
{
  "isAnonymous": true,
  "type": "report",
  "campusId": "campus-2",
  "administrativeUnitId": "unit-7",
  "description": "Há indícios de irregularidade no processo informado.",
  "involvedPeople": null
}
```

Response `201 Created`:

```json
{
  "manifestation": {
    "id": "uuid",
    "protocol": "2026-0002",
    "type": "report",
    "status": "in_analysis",
    "campusId": "campus-2",
    "administrativeUnitId": "unit-7",
    "description": "Há indícios de irregularidade no processo informado.",
    "involvedPeople": null,
    "isAnonymous": true,
    "authorUserId": null,
    "createdAt": "2026-05-10T15:00:00.000Z"
  },
  "accessCode": "plain-access-code"
}
```

Erros representativos:

- `400 Bad Request` — `ValidationError`, `InvalidCampusIdError`, `InvalidAdministrativeUnitIdError`, `InvalidManifestationDescriptionError`, `InvalidManifestationInvolvedPeopleError`, `CampusNotFoundError`, `CampusInactiveError`, `AdministrativeUnitNotFoundError`, `AdministrativeUnitInactiveError`, `AdministrativeUnitDoesNotBelongToCampusError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `IdentifiedManifestationRequiresManifestantRoleError`

### `GET /manifestations`

Lista manifestações identificadas do manifestante autenticado.

Query params:

- `page?: string`

Exemplo:

```http
GET /manifestations?page=2
Authorization: Bearer <token-do-manifestante>
```

Response `200 OK`:

```json
{
  "manifestations": [
    {
      "id": "manifestation-1",
      "protocol": "2026-0001",
      "type": "complaint",
      "status": "in_analysis",
      "campusId": "campus-1",
      "administrativeUnitId": "unit-1",
      "description": "O serviço ficou indisponível durante toda a manhã.",
      "authorUserId": "user-1",
      "createdAt": "2026-05-10T12:00:00.000Z"
    }
  ]
}
```

Erros representativos:

- `400 Bad Request` — `InvalidPageNumberError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `ForbiddenError`

### `GET /manifestations/:manifestationId`

Detalha uma manifestação do manifestante autenticado.

Response `200 OK`:

```json
{
  "manifestation": {
    "id": "manifestation-1",
    "protocol": "2026-0001",
    "type": "complaint",
    "status": "finalized",
    "campusId": "campus-1",
    "administrativeUnitId": "unit-1",
    "description": "O serviço ficou indisponível durante toda a manhã.",
    "involvedPeople": "Equipe da coordenação",
    "attendantUserId": "ombudsman-1",
    "createdAt": "2026-05-10T12:00:00.000Z",
    "history": [
      {
        "type": "registered",
        "description": "Manifestação registrada.",
        "actorUserId": "user-1",
        "actorType": "manifestant",
        "fromStatus": null,
        "toStatus": "in_analysis",
        "rating": null,
        "attendantUserId": null,
        "createdAt": "2026-05-10T12:00:00.000Z"
      },
      {
        "type": "evaluation_recorded",
        "description": "Atendimento avaliado pelo autor (5/5).",
        "actorUserId": "user-1",
        "actorType": "manifestant",
        "fromStatus": null,
        "toStatus": null,
        "rating": 5,
        "attendantUserId": "ombudsman-1",
        "createdAt": "2026-05-17T13:42:00.000Z"
      }
    ],
    "messages": [
      {
        "id": "message-1",
        "senderUserId": "ombudsman-1",
        "senderType": "ombudsman",
        "content": "Estamos analisando o seu relato.",
        "createdAt": "2026-05-10T15:00:00.000Z"
      }
    ]
  }
}
```

Erros representativos:

- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `ForbiddenError`, `NotAllowedToAccessManifestationError`
- `404 Not Found` — `ManifestationNotFoundError`

### `POST /manifestations/:manifestationId/messages`

Adiciona uma mensagem do manifestante à manifestação.

Request:

```json
{
  "content": "Poderiam compartilhar uma atualização do andamento?"
}
```

Response `201 Created`:

```json
{
  "message": {
    "id": "message-2",
    "senderUserId": "user-1",
    "senderType": "manifestant",
    "content": "Poderiam compartilhar uma atualização do andamento?",
    "createdAt": "2026-05-10T16:00:00.000Z"
  }
}
```

Erros representativos:

- `400 Bad Request` — `ValidationError`, `InvalidManifestationMessageContentError`, `MissingParamError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `ForbiddenError`, `NotAllowedToAccessManifestationError`
- `404 Not Found` — `ManifestationNotFoundError`
- `409 Conflict` — `ManifestationInteractionNotAllowedError`

### `POST /manifestations/:manifestationId/finalize`

Finaliza uma manifestação do próprio autor.

Request:

- sem body obrigatório

Response `200 OK`:

```json
{
  "manifestation": {
    "id": "manifestation-1",
    "protocol": "2026-0001",
    "type": "complaint",
    "status": "finalized",
    "campusId": "campus-1",
    "administrativeUnitId": "unit-1",
    "description": "O serviço ficou indisponível durante toda a manhã.",
    "involvedPeople": "Equipe da coordenação",
    "authorUserId": "user-1",
    "createdAt": "2026-05-10T12:00:00.000Z"
  }
}
```

Erros representativos:

- `400 Bad Request` — `MissingParamError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `ForbiddenError`, `NotAllowedToAccessManifestationError`
- `404 Not Found` — `ManifestationNotFoundError`
- `409 Conflict` — `ManifestationStatusTransitionNotAllowedError`

### `POST /manifestations/:manifestationId/evaluation`

Registra a avaliação do atendimento após a finalização.

Request:

```json
{
  "rating": 5,
  "comment": "Atendimento rápido e resolveu minha demanda."
}
```

Response `201 Created`:

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

Erros representativos:

- `400 Bad Request` — `ValidationError`, `MissingParamError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `ForbiddenError`, `NotAllowedToAccessManifestationError`
- `404 Not Found` — `ManifestationNotFoundError`
- `409 Conflict` — `ManifestationNotFinalizedError`, `ManifestationHasNoAttendantError`, `ManifestationAlreadyEvaluatedError`

Observação:
`InvalidRatingError` existe como defesa de domínio, mas não é esperado no contrato HTTP atual porque o Zod já valida `rating` antes do use case e rejeita payload inválido com `400 ValidationError`.

## 6. Rastreamento anônimo

### `POST /manifestations`

O registro anônimo usa a mesma rota de criação (`POST /manifestations`) descrita acima e retorna `accessCode` em texto puro apenas no momento da abertura.

### `POST /manifestations/track`

Rastreia uma manifestação anônima por protocolo e código de acesso.

Request:

```json
{
  "protocol": "2026-0002",
  "accessCode": "plain-access-code"
}
```

Response `200 OK`:

```json
{
  "manifestation": {
    "protocol": "2026-0002",
    "type": "report",
    "status": "in_analysis",
    "campusId": "campus-2",
    "administrativeUnitId": "unit-7",
    "createdAt": "2026-05-10T15:00:00.000Z"
  }
}
```

Erros representativos:

- `400 Bad Request` — `ValidationError`
- `404 Not Found` — `ManifestationTrackingNotFoundError`

## 7. Administração

Todas as rotas administrativas exigem Bearer de usuário `ombudsman` ou `admin`.

### `GET /admin/manifestations`

Lista manifestações para atendimento administrativo.

Query params:

- `page?: string`
- `status?: ManifestationStatus`
- `type?: ManifestationType`
- `campusId?: string`
- `administrativeUnitId?: string`
- `from?: string` — ISO UTC completo
- `to?: string` — ISO UTC completo

Exemplo:

```http
GET /admin/manifestations?page=1&status=in_analysis&type=complaint&campusId=campus-1&administrativeUnitId=unit-1&from=2026-05-01T00:00:00.000Z&to=2026-05-31T23:59:59.999Z
Authorization: Bearer <token-admin-ou-ombudsman>
```

Response `200 OK`:

```json
{
  "manifestations": [
    {
      "id": "manifestation-1",
      "protocol": "2026-0001",
      "type": "complaint",
      "status": "in_analysis",
      "campusId": "campus-1",
      "administrativeUnitId": "unit-1",
      "description": "O serviço ficou indisponível durante toda a manhã.",
      "authorUserId": "user-1",
      "createdAt": "2026-05-10T12:00:00.000Z"
    }
  ]
}
```

Erros representativos:

- `400 Bad Request` — `InvalidPageNumberError`, `InvalidParamError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `ForbiddenError`, `NotAllowedToManageManifestationError`

### `GET /admin/manifestations/:manifestationId`

Detalha a manifestação para o fluxo administrativo, inclusive as anônimas.

Response `200 OK`:

```json
{
  "manifestation": {
    "id": "manifestation-1",
    "protocol": "2026-0001",
    "type": "complaint",
    "status": "finalized",
    "campusId": "campus-1",
    "administrativeUnitId": "unit-1",
    "description": "O serviço ficou indisponível durante toda a manhã.",
    "involvedPeople": "Equipe da coordenação",
    "authorUserId": "user-1",
    "attendantUserId": "ombudsman-1",
    "createdAt": "2026-05-10T12:00:00.000Z",
    "history": [
      {
        "type": "registered",
        "description": "Manifestação registrada.",
        "actorUserId": "user-1",
        "actorType": "manifestant",
        "fromStatus": null,
        "toStatus": "in_analysis",
        "rating": null,
        "attendantUserId": null,
        "createdAt": "2026-05-10T12:00:00.000Z"
      },
      {
        "type": "evaluation_recorded",
        "description": "Atendimento avaliado pelo autor (5/5).",
        "actorUserId": "user-1",
        "actorType": "manifestant",
        "fromStatus": null,
        "toStatus": null,
        "rating": 5,
        "attendantUserId": "ombudsman-1",
        "createdAt": "2026-05-17T13:42:00.000Z"
      }
    ],
    "messages": [
      {
        "id": "message-1",
        "senderUserId": "ombudsman-1",
        "senderType": "ombudsman",
        "content": "Estamos analisando o seu relato.",
        "createdAt": "2026-05-10T15:00:00.000Z"
      }
    ]
  }
}
```

Erros representativos:

- `400 Bad Request` — `MissingParamError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `ForbiddenError`, `NotAllowedToManageManifestationError`
- `404 Not Found` — `ManifestationNotFoundError`

### `POST /admin/manifestations/:manifestationId/answer`

Registra a resposta administrativa e, quando aplicável, transita o status para `answered`.

Request:

```json
{
  "content": "Concluímos a análise do seu relato."
}
```

Response `201 Created`:

```json
{
  "message": {
    "id": "message-2",
    "senderUserId": "ombudsman-1",
    "senderType": "ombudsman",
    "content": "Concluímos a análise do seu relato.",
    "createdAt": "2026-05-10T16:00:00.000Z"
  }
}
```

Erros representativos:

- `400 Bad Request` — `ValidationError`, `InvalidManifestationMessageContentError`, `MissingParamError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `ForbiddenError`, `NotAllowedToManageManifestationError`
- `404 Not Found` — `ManifestationNotFoundError`
- `409 Conflict` — `ManifestationStatusTransitionNotAllowedError`

### `PATCH /admin/manifestations/:manifestationId/status`

Atualiza o status administrativamente dentro da matriz permitida.

Request:

```json
{
  "status": "finalized"
}
```

Response `200 OK`:

```json
{
  "manifestation": {
    "id": "manifestation-1",
    "protocol": "2026-0001",
    "type": "complaint",
    "status": "finalized",
    "campusId": "campus-1",
    "administrativeUnitId": "unit-1",
    "description": "O serviço ficou indisponível durante toda a manhã.",
    "involvedPeople": "Equipe da coordenação",
    "authorUserId": "user-1",
    "createdAt": "2026-05-10T12:00:00.000Z"
  }
}
```

Erros representativos:

- `400 Bad Request` — `ValidationError`, `MissingParamError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `ForbiddenError`, `NotAllowedToManageManifestationError`
- `404 Not Found` — `ManifestationNotFoundError`
- `409 Conflict` — `ManifestationStatusTransitionNotAllowedError`

## 8. Integrações pendentes

Os fluxos de chatbot/IA institucional ainda não estão expostos por HTTP neste backend.

- `SendAiMessageController` existe em `src/presentation/controllers/ai/`.
- Ainda não existe factory registrada em `src/main/factories/`.
- Ainda não existe rota pública registrada em `src/main/routes/`.

Isso afeta, por enquanto:

- UC-09 — consulta à IA institucional
- UC-10 — pré-preenchimento assistido por IA
