# Contrato HTTP para Integração Frontend

Este documento é a fonte de verdade para consumo HTTP do frontend neste repositório. As feature specs em `doc/features/` continuam sendo documentos de negócio e caso de uso; quando houver divergência de payload, rota, autenticação ou shape de erro, prevalece o contrato documentado aqui porque ele reflete a implementação atual em `src/main/routes`, controllers e middlewares.

## Escopo do contrato atual

Este contrato cobre apenas as rotas implementadas no backend atual.

Itens de requisito ainda não expostos por HTTP nesta fatia devem ser tratados como pendentes de integração, especialmente:

- recuperação de senha
- relatórios
- criação administrativa de usuários

## 1. Convenções gerais

### Base path e conteúdo

- Não existe prefixo global de API no backend atual. Todas as rotas públicas começam diretamente em `/`.
- Requests e responses usam JSON, exceto os endpoints de upload de anexo, que usam `multipart/form-data`.
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

type ManifestationAttachmentUploadedByType = 'manifestant' | 'anonymous_manifestant' | 'ombudsman' | 'admin'

type ManifestationAttachment = {
  id: string
  originalName: string
  mimeType: string
  sizeInBytes: number
  uploadedByType: ManifestationAttachmentUploadedByType
  createdAt: string
}
```

## 2.1 Política pública de anexos

Regras consumíveis pelo frontend:

- `POST /manifestations` continua estritamente `application/json` e não aceita `attachments[]`.
- Upload de anexos usa recurso separado e aceita exatamente `1` arquivo por request.
- Para enviar múltiplos anexos, o frontend deve repetir a chamada até o limite de `5` anexos por manifestação.
- Tamanho máximo por arquivo: `10 MB`.
- MIME types aceitos: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.
- O backend valida autorização, estado da manifestação, limite de quantidade e tipo de arquivo antes de disponibilizar o anexo.
- O frontend nunca recebe `storageKey`, bucket ou URL permanente do arquivo.
- Download sempre é mediado por `POST .../download-url`, que retorna uma signed URL curta.
- A signed URL expira conforme configuração do backend; no ambiente atual o default é `300` segundos.

Contrato de resposta para `download-url`:

```json
{
  "downloadUrl": "https://storage.example/signed-url"
}
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

O contrato HTTP atual de `POST /manifestations` não aceita anexos inline.

- A requisição deve ser `application/json`.
- O upload deve acontecer depois, por recurso dedicado de anexos.
- Não existe remoção ou substituição de anexos nesta fatia do MVP.

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
    "attachments": [
      {
        "id": "attachment-1",
        "originalName": "evidence.pdf",
        "mimeType": "application/pdf",
        "sizeInBytes": 1024,
        "uploadedByType": "manifestant",
        "createdAt": "2026-05-10T15:30:00.000Z"
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

### `POST /manifestations/:manifestationId/attachments`

Envia `1` anexo para uma manifestação identificada do próprio manifestante.

Regras práticas para o frontend:

- Exige `Authorization: Bearer <token-do-manifestante>`.
- O body deve ser `multipart/form-data`.
- O arquivo deve ser enviado no campo `file`.
- Não envie campos extras no multipart deste endpoint.
- Para múltiplos anexos, repita a chamada uma vez por arquivo.
- Observação para frontend web: ao usar `FormData`, **não** defina manualmente o header `Content-Type`. Deixe o navegador/cliente HTTP enviar `multipart/form-data` com o `boundary` correto.
- Se uma chamada falhar, os anexos enviados com sucesso antes dela permanecem válidos.

Exemplo:

```http
POST /manifestations/manifestation-1/attachments
Authorization: Bearer <token-do-manifestante>
Content-Type: multipart/form-data
```

Campo multipart esperado:

- `file`: arquivo binário

Response `201 Created`:

```json
{
  "attachment": {
    "id": "attachment-1",
    "originalName": "evidence.pdf",
    "mimeType": "application/pdf",
    "sizeInBytes": 1024,
    "uploadedByType": "manifestant",
    "createdAt": "2026-05-10T15:30:00.000Z"
  }
}
```

Erros representativos:

- `400 Bad Request` — `InvalidParamError`, `MissingParamError`, `AttachmentFileEmptyError`, `AttachmentFileTooLargeError`, `AttachmentMimeTypeNotAllowedError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `ForbiddenError`, `NotAllowedToAccessManifestationError`
- `404 Not Found` — `ManifestationNotFoundError`
- `409 Conflict` — `ManifestationAttachmentsLimitExceededError`, `ManifestationCannotReceiveAttachmentsError`

### `POST /manifestations/:manifestationId/attachments/:attachmentId/download-url`

Emite uma signed URL curta para download de um anexo da própria manifestação identificada.

Request:

- sem body obrigatório

Response `200 OK`:

```json
{
  "downloadUrl": "https://storage.example/signed-url"
}
```

Erros representativos:

- `400 Bad Request` — `MissingParamError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `ForbiddenError`, `NotAllowedToAccessManifestationError`
- `404 Not Found` — `ManifestationNotFoundError`, `AttachmentNotFoundError`

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

### `POST /manifestations/track/details`

Retorna a projeção pública de detalhe do rastreio anônimo com `attachments[]`.

Observações:

- Este endpoint não substitui `POST /manifestations/track`.
- `POST /manifestations/track` permanece o contrato mínimo para resumo de status.
- `POST /manifestations/track/details` continua sem expor descrição, mensagens, histórico administrativo ou `authorUserId`.
- `attachments[]` aqui inclui apenas anexos públicos do manifestante identificado ou anônimo. Anexos administrativos internos não entram nesta resposta.

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
    "createdAt": "2026-05-10T15:00:00.000Z",
    "attachments": [
      {
        "id": "attachment-1",
        "originalName": "evidence.pdf",
        "mimeType": "application/pdf",
        "sizeInBytes": 1024,
        "uploadedByType": "anonymous_manifestant",
        "createdAt": "2026-05-10T15:30:00.000Z"
      }
    ]
  }
}
```

Erros representativos:

- `400 Bad Request` — `ValidationError`
- `404 Not Found` — `ManifestationTrackingNotFoundError`

### `POST /manifestations/track/attachments`

Envia `1` anexo para uma manifestação anônima usando `protocol` + `accessCode`.

Regras práticas para o frontend:

- O body deve ser `multipart/form-data`.
- Os campos esperados são `protocol`, `accessCode` e `file`.
- A ordem das partes no multipart não importa.
- Para múltiplos anexos, repita a chamada uma vez por arquivo.
- Observação para frontend web: ao usar `FormData`, **não** defina manualmente o header `Content-Type`. Deixe o navegador/cliente HTTP enviar `multipart/form-data` com o `boundary` correto.
- O endpoint aplica os mesmos limites públicos de tamanho, MIME e quantidade dos anexos identificados.

Exemplo:

```http
POST /manifestations/track/attachments
Content-Type: multipart/form-data
```

Campos multipart esperados:

- `protocol`: string
- `accessCode`: string
- `file`: arquivo binário

Response `201 Created`:

```json
{
  "attachment": {
    "id": "attachment-1",
    "originalName": "evidence.pdf",
    "mimeType": "application/pdf",
    "sizeInBytes": 1024,
    "uploadedByType": "anonymous_manifestant",
    "createdAt": "2026-05-10T15:30:00.000Z"
  }
}
```

Erros representativos:

- `400 Bad Request` — `ValidationError`, `InvalidParamError`, `MissingParamError`, `AttachmentFileEmptyError`, `AttachmentFileTooLargeError`, `AttachmentMimeTypeNotAllowedError`
- `404 Not Found` — `ManifestationTrackingNotFoundError`
- `409 Conflict` — `ManifestationAttachmentsLimitExceededError`, `ManifestationCannotReceiveAttachmentsError`

### `POST /manifestations/track/attachments/:attachmentId/download-url`

Emite uma signed URL curta para download de um anexo público da manifestação anônima rastreada.

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
  "downloadUrl": "https://storage.example/signed-url"
}
```

Erros representativos:

- `400 Bad Request` — `ValidationError`, `MissingParamError`
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
    "attachments": [
      {
        "id": "attachment-1",
        "originalName": "evidence.pdf",
        "mimeType": "application/pdf",
        "sizeInBytes": 1024,
        "uploadedByType": "manifestant",
        "createdAt": "2026-05-10T15:30:00.000Z"
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

### `POST /admin/manifestations/:manifestationId/attachments/:attachmentId/download-url`

Emite uma signed URL curta para download administrativo de um anexo da manifestação.

Observações:

- Exige Bearer de `ombudsman` ou `admin`.
- Nesta entrega não existe upload administrativo de anexos.
- O detalhe administrativo pode listar anexos enviados por `manifestant`, `anonymous_manifestant`, `ombudsman` ou `admin`, embora hoje apenas os dois primeiros estejam ativos no produto.

Request:

- sem body obrigatório

Response `200 OK`:

```json
{
  "downloadUrl": "https://storage.example/signed-url"
}
```

Erros representativos:

- `400 Bad Request` — `MissingParamError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `ForbiddenError`, `NotAllowedToManageManifestationError`
- `404 Not Found` — `ManifestationNotFoundError`, `AttachmentNotFoundError`

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

## 8. Chatbot institucional / IA

### `POST /ai/messages`

- Pública (sem autenticação).
- Não persiste a conversa; o frontend é responsável por manter o histórico entre turnos.
- O cliente envia apenas `history` e `message`. O catálogo institucional (`campuses` / `administrativeUnits`) é buscado internamente pelo backend principal antes de chamar o `ai-api`.
- Por padrão, pode ser atendida por `FakeAiGateway` para desenvolvimento/MVP local.
- Quando `AI_GATEWAY_PROVIDER=http`, o backend principal usa `HttpAiGateway` para chamar o `ai-api` real.
- Essa troca é configuracional e não altera o contrato HTTP consumido pelo frontend.

#### Request

```json
{
  "history": [
    {
      "role": "user",
      "content": "Quero reclamar do atendimento na coordenação."
    },
    {
      "role": "assistant",
      "content": "Entendi. Pode me dar mais detalhes?"
    }
  ],
  "message": "Foi na coordenação de sistemas em Parnaíba."
}
```

| Campo               | Tipo                    | Obrigatório | Regras                                                                 |
| ------------------- | ----------------------- | ----------- | ---------------------------------------------------------------------- |
| `history`           | array (máx. 20)         | Sim         | Ordenado do mais antigo ao mais novo. Pode ser `[]` no primeiro turno. |
| `history[].role`    | `"assistant" \| "user"` | Sim         | `system` é interno do backend; o cliente não envia.                    |
| `history[].content` | string                  | Sim         | Trim aplicado, 1..4000 caracteres.                                     |
| `message`           | string                  | Sim         | Trim aplicado, 1..4000 caracteres.                                     |

#### Response (`200 OK`)

```json
{
  "answer": "Entendi. Posso te ajudar a abrir uma manifestação com base nas informações fornecidas.",
  "intent": "manifestation_draft_ready",
  "shouldOpenManifestationDraft": true,
  "draft": {
    "type": "complaint",
    "campusId": "campus-poeta-torquato-neto",
    "administrativeUnitId": "unit-prad-teresina",
    "description": "Quero fazer uma reclamação sobre o atendimento.",
    "involvedPeople": null
  },
  "missingFields": [],
  "confidence": 0.8
}
```

| Campo                          | Tipo                                                                                                                  | Descrição                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `answer`                       | string                                                                                                                | Resposta textual normalizada (trim aplicado).                                                                    |
| `intent`                       | `"institutional_question" \| "manifestation_candidate" \| "manifestation_draft_ready" \| "out_of_scope" \| "unknown"` | Intenção classificada pelo backend. Valores fora dessa lista são degradados para `"unknown"`.                    |
| `shouldOpenManifestationDraft` | boolean                                                                                                               | Só pode ser `true` quando `intent === "manifestation_draft_ready"`, o draft existe e `missingFields` está vazio. |
| `draft`                        | object \| null                                                                                                        | Presente apenas para `manifestation_candidate` ou `manifestation_draft_ready`. Shape detalhado abaixo.           |
| `missingFields`                | array de `"type" \| "campusId" \| "administrativeUnitId" \| "description"`                                            | Campos mínimos ausentes para abertura do formulário; vazio fora de intenções de triagem.                         |
| `confidence`                   | number \| null                                                                                                        | Quando presente, está entre `0` e `1`. Valores fora desse intervalo são degradados para `null`.                  |

Shape do `draft` (todos os campos podem ser `null`):

| Campo                  | Tipo                        | Descrição                                                                         |
| ---------------------- | --------------------------- | --------------------------------------------------------------------------------- |
| `type`                 | `ManifestationType \| null` | Apenas valores válidos do enum; outros viram `null`.                              |
| `campusId`             | string \| null              | Validado contra o catálogo oficial; inválidos viram `null`.                       |
| `administrativeUnitId` | string \| null              | Validado contra o catálogo oficial e contra pertencimento ao `campusId` sugerido. |
| `description`          | string \| null              | Normalizado nas extremidades; entradas vazias viram `null`.                       |
| `involvedPeople`       | string \| null              | Texto livre normalizado; opcional.                                                |

#### Como o frontend deve consumir

- Sempre renderize `answer` como mensagem do assistente, independente do `intent`.
- Para `manifestation_candidate`: continue a conversa, opcionalmente exibindo `missingFields` ao usuário para guiar a próxima pergunta. **Não abra o formulário.**
- Para `manifestation_draft_ready` com `shouldOpenManifestationDraft === true`: abra o formulário de `POST /manifestations` (seção 5) já preenchido com os campos do `draft`. O usuário ainda escolhe `isAnonymous` e revisa antes de submeter.
- Para `manifestation_draft_ready` com `shouldOpenManifestationDraft === false`: trate como `manifestation_candidate` (faltam campos válidos).
- Para `institutional_question`, `out_of_scope` e `unknown`: só exiba `answer`.
- O frontend deve enviar o `history` reconstruído a cada turno (o backend é stateless nesta etapa).

#### Memória da conversa

Regra mental recomendada: trate a IA como uma função **sem memória própria**.

Fluxo esperado:

1. O frontend mantém o histórico local da conversa.
2. A cada novo turno, o frontend envia:
   - `history`: mensagens anteriores
   - `message`: mensagem nova do usuário
3. O backend principal consulta o catálogo oficial no Prisma.
4. O backend principal repassa `history`, `message` e o catálogo para o `ai-api`.
5. O `ai-api` usa:
   - `history` como janela de contexto conversacional
   - RAG para contexto institucional
   - catálogo para sugerir/preencher o `draft`

Exemplo de estratégia no frontend:

```ts
type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const [messages, setMessages] = useState<ChatMessage[]>([])

async function sendMessage(content: string) {
  const history = messages.slice(-20)

  const response = await api.post('/ai/messages', {
    history,
    message: content,
  })

  const assistantMessage = {
    role: 'assistant',
    content: response.data.answer,
  } satisfies ChatMessage

  setMessages((current) => [...current, { role: 'user', content }, assistantMessage])

  if (response.data.shouldOpenManifestationDraft) {
    openManifestationForm(response.data.draft)
  }
}
```

Notas práticas:

- `history` deve conter apenas as mensagens anteriores; não duplique a mensagem nova em `history`.
- O limite atual aceito pelo backend é de **20 mensagens** em `history`.
- Para MVP, é aceitável manter o histórico apenas em memória da tela. Se for necessário sobreviver a refresh, prefira `sessionStorage` a `localStorage`, por causa da sensibilidade potencial do conteúdo.
- Se o frontend optar por `localStorage`, deve usar expiração curta e oferecer uma ação visível de **“Limpar conversa”**, porque o conteúdo pode incluir dados sensíveis.

#### Erros

- `400 Bad Request` — `ValidationError` (body fora do schema: campo ausente, vazio após trim, com mais de 4000 caracteres, `history` com mais de 20 mensagens, ou `role` fora de `"assistant"|"user"`).
- `500 Internal Server Error` — `ServerError` (falha do gateway; o frontend deve permitir nova tentativa).
