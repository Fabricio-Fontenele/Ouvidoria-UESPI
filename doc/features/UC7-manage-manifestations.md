# Especificação da Feature: Gerenciar Manifestações

## 1. Identificação

| Campo          | Descrição                                                                                |
| -------------- | ---------------------------------------------------------------------------------------- |
| Caso de uso    | UC-07                                                                                    |
| Nome           | Gerenciar manifestações                                                                  |
| Feature        | Gestão administrativa de manifestações                                                   |
| Ator principal | Ouvidor                                                                                  |
| Prioridade     | Alta                                                                                     |
| Status         | Implementado de ponta a ponta (domínio, aplicação, presentation, infra, rotas HTTP, e2e) |

---

## 2. Objetivo

Permitir que perfis administrativos autorizados localizem, analisem, respondam e atualizem o status de manifestações registradas, mantendo a rastreabilidade do tratamento.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| RF18   | O sistema deve permitir que perfis administrativos autorizados visualizem e gerenciem as manifestações registradas.                           |
| RF19   | O sistema deve permitir filtrar manifestações por critérios disponíveis ao tratamento administrativo, como status, período, campus e unidade. |
| RF21   | O sistema deve permitir adicionar respostas administrativas e atualizar o status da manifestação ao longo do atendimento.                     |
| RF22   | O sistema deve permitir o encerramento administrativo da manifestação por perfis autorizados.                                                 |
| RF23   | O sistema deve manter histórico completo das ações realizadas no tratamento da manifestação.                                                  |
| RN04   | Apenas perfis autorizados podem analisar, responder, encaminhar, alterar status e encerrar manifestações.                                     |
| RN05   | O tratamento das manifestações deve manter rastreabilidade de interações, respostas, alterações de status e responsáveis por cada ação.       |
| RNF07  | O sistema deve exigir autenticação e aplicar autorização por perfil, respeitando restrições de acesso a manifestações sigilosas.              |
| RNF09  | O sistema deve manter histórico suficiente para rastrear alterações de status, mensagens, respostas administrativas e encerramentos.          |
| RNF11  | O sistema deve responder em tempo aceitável para operações de consulta, registro de manifestações e interação com IA.                         |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- listar manifestações disponíveis ao perfil administrativo, com paginação;
- filtrar a listagem por status, tipo, campus, unidade administrativa e período;
- consultar os detalhes de qualquer manifestação visível ao perfil, inclusive anônimas;
- consultar os detalhes administrativos com `involvedPeople`, quando o campo existir;
- registrar resposta administrativa em manifestação aberta para interação;
- transitar o status da manifestação para `answered` ao responder;
- atualizar o status da manifestação respeitando guardas do agregado;
- persistir respostas e alterações de status com metadados explícitos de auditoria;
- encerrar administrativamente a manifestação para `finalized` ou `canceled`.

### 4.2 Não incluído

Esta feature não contempla:

- atribuição ou encaminhamento da manifestação a responsáveis (RF20);
- materialização explícita do histórico de ações em entidade própria;
- notificações ao manifestante;
- relatórios gerenciais.

---

## 5. Ator principal

### Ouvidor

Usuário autenticado com perfil `ombudsman` ou `admin` responsável pelo tratamento administrativo das manifestações.

---

## 6. Pré-condições

Para executar a gestão administrativa:

- o ator deve estar autenticado;
- o ator deve possuir perfil `ombudsman` ou `admin`;
- a manifestação consultada ou alterada deve existir quando a operação for por identificador;
- a infraestrutura de persistência deve disponibilizar consulta, gravação de mensagens e atualização de manifestação.

---

## 7. Pós-condições

Após operações bem-sucedidas:

- a listagem retorna manifestações compatíveis com os filtros informados;
- a consulta de detalhes retorna o estado atual com histórico e mensagens, inclusive para manifestações anônimas;
- a consulta de detalhes pode expor `involvedPeople` quando o campo existir na manifestação;
- a resposta administrativa fica registrada como mensagem e o status passa a `answered`;
- a resposta administrativa, a alteração de status e o encerramento administrativo ficam persistidos com ator e transição de status rastreáveis;
- o histórico de tratamento permanece rastreável.

---

## 8. Entradas

As tabelas abaixo descrevem entradas de aplicação dos casos de uso administrativos. No contrato HTTP atual, o frontend não envia `requesterUserId`: a identidade administrativa é derivada do JWT (`request.user.id`). Na listagem, os filtros são enviados como query params diretos; não existe wrapper `filters` no HTTP.

> Estes payloads são internos aos casos de uso e não devem ser copiados pelo frontend.
> Para integração HTTP, use a seção `10.5 Contrato HTTP atual`.

### 8.1 Listagem administrativa

| Campo                        | Tipo                | Obrigatório | Descrição                                                    |
| ---------------------------- | ------------------- | ----------- | ------------------------------------------------------------ |
| requesterUserId              | string              | Sim         | Identificador do ator autenticado.                           |
| page                         | number              | Sim         | Número da página da listagem, iniciando em `1`.              |
| filters.status               | ManifestationStatus | Não         | Filtra pelo status atual da manifestação.                    |
| filters.type                 | ManifestationType   | Não         | Filtra pelo tipo de manifestação.                            |
| filters.campusId             | string              | Não         | Filtra pelo identificador do campus.                         |
| filters.administrativeUnitId | string              | Não         | Filtra pelo identificador da unidade administrativa.         |
| filters.from                 | Date                | Não         | Filtra manifestações criadas a partir desta data, inclusive. |
| filters.to                   | Date                | Não         | Filtra manifestações criadas até esta data, inclusive.       |

#### Exemplo de entrada de aplicação

```json
{
  "requesterUserId": "ombudsman-1",
  "page": 1,
  "filters": {
    "status": "in_analysis",
    "type": "complaint",
    "campusId": "campus-1",
    "administrativeUnitId": "unit-1",
    "from": "2026-05-01T00:00:00.000Z",
    "to": "2026-05-31T23:59:59.999Z"
  }
}
```

### 8.2 Detalhes administrativos da manifestação

| Campo           | Tipo   | Obrigatório | Descrição                          |
| --------------- | ------ | ----------- | ---------------------------------- |
| requesterUserId | string | Sim         | Identificador do ator autenticado. |
| manifestationId | string | Sim         | Identificador da manifestação.     |

#### Exemplo de entrada de aplicação

```json
{
  "requesterUserId": "ombudsman-1",
  "manifestationId": "manifestation-1"
}
```

### 8.3 Resposta administrativa

| Campo           | Tipo   | Obrigatório | Descrição                                          |
| --------------- | ------ | ----------- | -------------------------------------------------- |
| requesterUserId | string | Sim         | Identificador do ator autenticado.                 |
| manifestationId | string | Sim         | Identificador da manifestação que será respondida. |
| content         | string | Sim         | Conteúdo textual da resposta administrativa.       |

#### Exemplo de entrada de aplicação

```json
{
  "requesterUserId": "ombudsman-1",
  "manifestationId": "manifestation-1",
  "content": "Concluímos a análise do seu relato."
}
```

### 8.4 Atualização administrativa de status

| Campo           | Tipo                | Obrigatório | Descrição                                                |
| --------------- | ------------------- | ----------- | -------------------------------------------------------- |
| requesterUserId | string              | Sim         | Identificador do ator autenticado.                       |
| manifestationId | string              | Sim         | Identificador da manifestação a ter o status atualizado. |
| status          | ManifestationStatus | Sim         | Novo status pretendido para a manifestação.              |

#### Exemplo de entrada de aplicação

```json
{
  "requesterUserId": "ombudsman-1",
  "manifestationId": "manifestation-1",
  "status": "finalized"
}
```

---

## 9. Regras de negócio

| Código      | Regra                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN-UC07-01  | Apenas usuários com perfil `ombudsman` ou `admin` podem operar a feature.                                                                                                                                                                                                                                                                                                                         |
| RN-UC07-02  | A paginação da listagem administrativa deve aceitar somente páginas maiores ou iguais a `1`.                                                                                                                                                                                                                                                                                                      |
| RN-UC07-03  | Os filtros administrativos são opcionais e devem ser repassados ao repositório como informados.                                                                                                                                                                                                                                                                                                   |
| RN-UC07-03a | Na camada de apresentação, filtros `from` e `to` só são aceitos quando vierem em timestamp ISO UTC completo (`YYYY-MM-DDTHH:mm:ss.SSSZ`).                                                                                                                                                                                                                                                         |
| RN-UC07-04  | A consulta de detalhes administrativos deve falhar quando a manifestação não existir.                                                                                                                                                                                                                                                                                                             |
| RN-UC07-05  | A consulta administrativa de detalhes deve incluir manifestações anônimas.                                                                                                                                                                                                                                                                                                                        |
| RN-UC07-06  | A resposta administrativa deve exigir conteúdo textual não vazio.                                                                                                                                                                                                                                                                                                                                 |
| RN-UC07-07  | A resposta administrativa só pode ser registrada quando a manifestação estiver aberta para interação.                                                                                                                                                                                                                                                                                             |
| RN-UC07-08  | A resposta administrativa deve transitar o status da manifestação para `answered`.                                                                                                                                                                                                                                                                                                                |
| RN-UC07-09  | O fluxo de resposta administrativa deve preservar consistência entre atualização de status e gravação da mensagem.                                                                                                                                                                                                                                                                                |
| RN-UC07-10  | A atualização administrativa de status não pode partir de manifestações em estado terminal (`finalized`, `canceled`).                                                                                                                                                                                                                                                                             |
| RN-UC07-11  | A atualização administrativa de status não pode ter como alvo o mesmo status atual da manifestação.                                                                                                                                                                                                                                                                                               |
| RN-UC07-12  | Regras de transição administrativa devem ficar encapsuladas na entidade `Manifestation`.                                                                                                                                                                                                                                                                                                          |
| RN-UC07-13  | As transições administrativas via atualização de status são `in_analysis -> canceled`, `answered -> in_analysis` e `answered -> finalized`. **Chegar em `answered` só é permitido via resposta administrativa (`POST /admin/manifestations/:manifestationId/answer`)**, jamais via `PATCH status=answered`, para garantir que toda manifestação `answered` tenha de fato uma resposta registrada. |

---

## 10. Validações

### 10.1 Autorização administrativa

O par `requesterUserId` e a `role` carregada pelo repositório deve:

- localizar um usuário existente;
- corresponder a um perfil `ombudsman` ou `admin`.

No contrato HTTP, `requesterUserId` não é enviado pelo cliente; ele é inferido do token Bearer.

### 10.2 Página da listagem

O campo `page` deve:

- ser obrigatório;
- ser numérico;
- ser maior ou igual a `1`.

### 10.3 Conteúdo da resposta administrativa

O campo `content` deve:

- ser obrigatório;
- não estar vazio;
- não conter apenas espaços em branco;
- ser persistido com normalização nas extremidades.

### 10.4 Transições de status

Para atualização administrativa de status:

- o status atual da manifestação deve permitir transição conforme a matriz do agregado;
- o status alvo deve diferir do status atual;
- combinações fora da matriz permitida devem falhar.

Observação:
A guarda fica encapsulada na entidade `Manifestation` por meio dos métodos `recordAdministrativeAnswer()` e `transitionStatusAdministratively(target)`.

### 10.5 Contrato HTTP atual

- `GET /admin/manifestations?page=1&status=in_analysis&type=complaint&campusId=campus-1&administrativeUnitId=unit-1&from=2026-05-01T00:00:00.000Z&to=2026-05-31T23:59:59.999Z`
- `GET /admin/manifestations/:manifestationId`
- `POST /admin/manifestations/:manifestationId/answer` com body `{ "content": "..." }`
- `PATCH /admin/manifestations/:manifestationId/status` com body `{ "status": "finalized" }`
- o frontend nunca envia `requesterUserId`

### 10.6 Atomicidade da resposta administrativa

No recorte atual do núcleo:

- a resposta administrativa delega a persistência do novo status e da mensagem a um contrato atômico de aplicação;
- a atualização administrativa de status delega a persistência a um contrato que recebe `actorUserId`, `actorType`, `fromStatus` e `toStatus`;
- o encerramento administrativo e o encerramento pelo autor seguem a mesma diretriz de persistência auditável;
- a implementação concreta de infraestrutura continua responsável por materializar a fronteira transacional única.

Diretriz para a integração futura:

- a persistência do novo status, o registro da mensagem e a inserção do histórico devem ocorrer dentro de uma fronteira transacional única.

---

## 11. Fluxo principal

### 11.1 Listagem administrativa

1. O ouvidor acessa a listagem de manifestações.
2. O sistema valida a paginação informada.
3. O sistema valida a autorização administrativa do ator.
4. O sistema consulta o repositório aplicando os filtros informados.
5. O sistema retorna a lista de manifestações compatíveis.

### 11.2 Detalhes administrativos

1. O ouvidor seleciona uma manifestação.
2. O sistema valida a autorização administrativa do ator.
3. O sistema localiza a manifestação pelo identificador.
4. O sistema retorna o status atual, histórico e mensagens, inclusive para manifestações anônimas.

### 11.3 Resposta administrativa

1. O ouvidor informa o conteúdo da resposta.
2. O sistema normaliza e valida o conteúdo.
3. O sistema valida a autorização administrativa do ator.
4. O sistema carrega a manifestação por identificador.
5. O agregado transita o status para `answered` aplicando a guarda de interação.
6. O sistema persiste, em uma única operação, a mudança de status, o histórico auditável e a mensagem administrativa.
7. O sistema retorna a mensagem registrada.

### 11.4 Atualização administrativa de status

1. O ouvidor informa o status pretendido.
2. O sistema valida a autorização administrativa do ator.
3. O sistema carrega a manifestação por identificador.
4. O agregado aplica a transição administrativa.
5. O sistema persiste o novo status com metadados de auditoria do ator e da transição.
6. O sistema retorna o estado atualizado da manifestação.

---

## 12. Fluxos alternativos

### FA01 - Página inválida

Condição:
O ator informa `page` menor que `1`.

Comportamento esperado:
O sistema deve rejeitar a listagem antes de consultar o repositório.

### FA02 - Ator sem autorização administrativa

Condição:
O `requesterUserId` não localiza nenhum usuário ou localiza usuário com perfil `manifestant`.

Comportamento esperado:
O sistema deve bloquear a operação antes de tocar a manifestação.

### FA03 - Manifestação inexistente

Condição:
O identificador informado não corresponde a nenhuma manifestação.

Comportamento esperado:
O sistema deve falhar com erro de manifestação não encontrada.

### FA04 - Conteúdo da resposta inválido

Condição:
O ator informa `content` vazio ou com apenas espaços.

Comportamento esperado:
O sistema deve rejeitar a operação antes de consultar ou gravar a manifestação.

### FA05 - Manifestação fechada para interação

Condição:
A manifestação está `finalized` ou `canceled`.

Comportamento esperado:
O sistema deve bloquear o registro da resposta administrativa e qualquer transição de status.

### FA06 - Transição administrativa sem efeito

Condição:
O status alvo informado é igual ao status atual da manifestação.

Comportamento esperado:
O sistema deve falhar com erro de transição não permitida.

---

## 13. Saídas de sucesso

### 13.1 Saída da listagem administrativa

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

### 13.2 Saída dos detalhes administrativos

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
        "createdAt": "2026-05-10T12:00:00.000Z"
      }
    ],
    "messages": [
      {
        "id": "message-2",
        "senderUserId": "ombudsman-1",
        "senderType": "ombudsman",
        "content": "Concluímos a análise do seu relato.",
        "createdAt": "2026-05-10T16:00:00.000Z"
      }
    ]
  }
}
```

### 13.3 Saída da resposta administrativa

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

### 13.4 Saída da atualização de status

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

---

## 14. Erros esperados

### 14.1 Página inválida

Condição:
`page` menor que `1`.

Erro esperado:
`InvalidPageNumberError`

### 14.2 Ator sem autorização administrativa

Condição:
O usuário não existe ou o perfil não é `ombudsman` nem `admin`.

Erro esperado:
`NotAllowedToManageManifestationError`

### 14.3 Manifestação não encontrada

Condição:
Nenhuma manifestação encontrada para o identificador informado.

Erro esperado:
`ManifestationNotFoundError`

### 14.4 Conteúdo da resposta administrativa inválido

Condição:
`content` vazio ou composto apenas por espaços.

Erro esperado:
`InvalidManifestationMessageContentError`

### 14.5 Transição administrativa não permitida

Condição:
A manifestação está em estado terminal ou o status alvo coincide com o status atual.

Erro esperado:
`ManifestationStatusTransitionNotAllowedError`

---

## 15. Regras de segurança

- a operação deve ser bloqueada para usuários sem perfil administrativo (`ombudsman` ou `admin`);
- a verificação de perfil deve ocorrer antes de qualquer acesso à manifestação;
- a resposta administrativa não deve ser aceita em branco;
- transições inválidas de status não devem ser persistidas;
- a camada de apresentação mapeia erros de autorização, inexistência e transição conforme o contrato HTTP atual (Fastify) — ver detalhes dos controllers admin na seção 19.

---

## 16. Critérios de aceite

- o sistema deve listar manifestações apenas para perfis administrativos;
- o sistema deve rejeitar paginação inválida antes de tocar repositórios;
- o sistema deve repassar os filtros administrativos ao repositório quando informados;
- o sistema deve retornar detalhes inclusive de manifestações anônimas para perfis administrativos;
- o sistema deve registrar resposta administrativa em manifestação aberta para interação;
- o sistema deve transitar o status para `answered` ao registrar resposta administrativa;
- o sistema deve atualizar o status administrativamente respeitando as guardas do agregado;
- o sistema deve expor `involvedPeople` nos detalhes e nas saídas de alteração quando o campo existir;
- o sistema deve bloquear transições a partir de estados terminais;
- o sistema deve bloquear transições para o mesmo status atual.

---

## 17. Casos de teste

### 17.1 Testes unitários dos casos de uso

#### CT-UC07-001 - Deve listar manifestações para um ouvidor com filtros e paginação

- dado `requesterUserId` de um usuário com perfil `ombudsman`, `page` igual a `2` e filtros completos;
- quando o caso de uso de listagem for executado;
- então o repositório deve ser chamado com os filtros e `{ page: 2 }`;
- e a lista retornada deve ser devolvida sem alteração.

#### CT-UC07-002 - Deve listar manifestações para um administrador sem filtros

- dado `requesterUserId` de um usuário com perfil `admin` e `page` igual a `1`;
- quando o caso de uso de listagem for executado;
- então o repositório deve ser chamado com `{}` e `{ page: 1 }`;
- e a lista retornada deve ser devolvida sem alteração.

#### CT-UC07-003 - Não deve listar com página inválida

- dado `page` igual a `0`;
- quando o caso de uso de listagem for executado;
- então deve lançar `InvalidPageNumberError`;
- e nenhum repositório deve ser consultado.

#### CT-UC07-004 - Não deve operar sem autorização administrativa

- dado um `requesterUserId` que localiza usuário `manifestant` ou que não localiza usuário algum;
- quando qualquer caso de uso administrativo for executado;
- então deve lançar `NotAllowedToManageManifestationError`;
- e os repositórios de manifestação não devem ser consultados.

#### CT-UC07-005 - Deve retornar detalhes administrativos de manifestação identificada

- dado `manifestationId` existente com autoria identificada;
- quando o caso de uso de detalhes administrativos for executado por um ouvidor;
- então deve retornar os detalhes, o histórico, as mensagens e `involvedPeople` da manifestação.

#### CT-UC07-006 - Deve retornar detalhes administrativos de manifestação anônima

- dado `manifestationId` existente com `authorUserId` igual a `null`;
- quando o caso de uso de detalhes administrativos for executado por um administrador;
- então deve retornar os detalhes com `authorUserId` igual a `null` e `involvedPeople` quando houver.

#### CT-UC07-007 - Não deve retornar detalhes administrativos de manifestação inexistente

- dado `manifestationId` inexistente;
- quando o caso de uso de detalhes administrativos for executado por um ouvidor;
- então deve lançar `ManifestationNotFoundError`.

#### CT-UC07-008 - Deve registrar resposta administrativa em manifestação aberta

- dado `manifestationId` existente com status aberto e conteúdo válido;
- quando o caso de uso de resposta administrativa for executado por um ouvidor;
- então deve transitar o status para `answered`, persistir atomicamente o histórico auditável e gravar a mensagem com conteúdo normalizado.

#### CT-UC07-009 - Não deve registrar resposta com conteúdo inválido

- dado `content` vazio ou com apenas espaços;
- quando o caso de uso de resposta administrativa for executado;
- então deve lançar `InvalidManifestationMessageContentError`;
- e nenhum repositório deve ser consultado.

#### CT-UC07-010 - Não deve registrar resposta em manifestação fechada

- dado `manifestationId` existente com status `finalized` ou `canceled`;
- quando o caso de uso de resposta administrativa for executado por um ouvidor;
- então deve lançar `ManifestationStatusTransitionNotAllowedError`;
- e nenhum status novo deve ser persistido nem mensagem registrada.

#### CT-UC07-011 - Deve atualizar status administrativamente entre estados abertos

- dado `manifestationId` com status `answered`;
- quando o caso de uso de atualização de status for executado por um ouvidor com alvo `finalized`;
- então deve transitar o status para `finalized` e persistir a mudança com ator e transição rastreáveis.

#### CT-UC07-012 - Não deve atualizar status partindo de estado terminal

- dado `manifestationId` com status `canceled` ou `finalized`;
- quando o caso de uso de atualização de status for executado;
- então deve lançar `ManifestationStatusTransitionNotAllowedError`;
- e nenhum novo status deve ser persistido.

#### CT-UC07-013 - Não deve atualizar status para o status atual

- dado `manifestationId` com status `in_analysis` e alvo `in_analysis`;
- quando o caso de uso de atualização de status for executado;
- então deve lançar `ManifestationStatusTransitionNotAllowedError`.

---

## 18. Sugestão de tipos

```ts
export interface ListAdminManifestationsInput {
  requesterUserId: string
  page: number
  filters?: AdminManifestationFilters
}

export interface GetAdminManifestationDetailsInput {
  requesterUserId: string
  manifestationId: string
}

export interface AnswerManifestationInput {
  requesterUserId: string
  manifestationId: string
  content: string
}

export interface UpdateManifestationStatusInput {
  requesterUserId: string
  manifestationId: string
  status: ManifestationStatus
}

export interface AdminManifestationFilters {
  status?: ManifestationStatus
  type?: ManifestationType
  campusId?: string
  administrativeUnitId?: string
  from?: Date
  to?: Date
}

export class Manifestation extends Entity<ManifestationProps> {
  recordAdministrativeAnswer(): void
  transitionStatusAdministratively(target: ManifestationStatus): void
}

export class ManifestationStatusTransitionNotAllowedError extends Error {
  constructor(current: ManifestationStatus, attempted: ManifestationStatus)
}

export interface ManifestationsRepository {
  findById(manifestationId: string): Promise<Manifestation | null>
  findDetailsById(manifestationId: string): Promise<ManifestationDetailsDTO | null>
  findManyForAdmin(
    filters: AdminManifestationFilters,
    paginationParams: PaginationParams,
  ): Promise<ManifestationListItemDTO[]>
}

export interface UsersRepository {
  findById(userId: string): Promise<User | null>
}

export interface ManifestationAdministrationRepository {
  recordAnswer(params: {
    manifestation: Manifestation
    message: ManifestationMessage
    fromStatus: ManifestationStatus
    toStatus: ManifestationStatus
  }): Promise<ManifestationMessageDTO>
  updateStatus(params: {
    manifestation: Manifestation
    actorUserId: string
    actorType: ManifestationMessageSenderType
    fromStatus: ManifestationStatus
    toStatus: ManifestationStatus
  }): Promise<void>
}
```

---

## 19. Observações de implementação

- a autorização administrativa é centralizada por leitura do `User` em `UsersRepository.findById()` e verificação do `role` contra `OMBUDSMAN` e `ADMIN`;
- o erro `NotAllowedToManageManifestationError` permanece em `manifestation-administration/errors/` por ser compartilhado entre os quatro casos de uso administrativos;
- o erro `ManifestationStatusTransitionNotAllowedError` é exportado pelo módulo do agregado em `src/domain/entities/manifestation.ts`, mantendo o invariante de transição dentro do domínio;
- a resposta administrativa reaproveita `ManifestationMessage` e delega a persistência atômica ao contrato `ManifestationAdministrationRepository.recordAnswer(...)`;
- a transição para `answered` continua ocorrendo via `manifestation.recordAdministrativeAnswer()`, e o caso de uso não executa mais gravações separadas de status e mensagem;
- a atualização administrativa de status delega a persistência ao contrato `ManifestationAdministrationRepository.updateStatus(...)`, também pensado para materializar histórico e mudança de status em uma única transação;
- a implementação concreta vive em `PrismaManifestationAdministrationRepository` (`src/infra/database/prisma/repositories/`), que envolve `recordAnswer(...)`, `updateStatus(...)` e `finalizeByAuthor(...)` em `prisma.$transaction` — cada um grava o `UPDATE manifestations` + um `INSERT manifestation_messages` (a mensagem real do `recordAnswer` e/ou uma mensagem com `senderType='system'` carregando o payload JSON definido em `src/infra/database/prisma/system-message-payload.ts`: `{ type, description, actorUserId, actorType, fromStatus, toStatus }`). A fronteira transacional única garante que histórico e estado nunca divirjam;
- a atualização administrativa de status usa `manifestation.transitionStatusAdministratively(target)`, que bloqueia transições a partir de estados terminais, transições para o status atual e **transições para `answered`** (essa entrada só é alcançada por `recordAdministrativeAnswer()`, garantindo que não exista manifestação `answered` sem uma resposta registrada);
- a listagem administrativa utiliza um novo contrato `findManyForAdmin(filters, pagination)` no repositório, mantendo `findManyByAuthorUserId` voltado ao fluxo identificado do manifestante;
- o erro `InvalidPageNumberError` permanece em `list-user-manifestations/errors/` e é reaproveitado pela listagem administrativa enquanto não houver pasta de utilitários compartilhados de paginação;
- `PrismaManifestationsRepository.findManyForAdmin` (`src/infra/database/prisma/repositories/`) materializa os filtros (`status`, `type`, `campusId`, `administrativeUnitId`, range `createdAt`) e a paginação (`MANIFESTATIONS_PAGE_SIZE = 20`, ordenação `createdAt desc`); `PrismaUsersRepository.findById` (`src/infra/database/prisma/repositories/`) materializa a autorização administrativa;
- atribuição e encaminhamento (RF20), assim como a materialização explícita do histórico (RF23 em entidade própria), permanecem fora do escopo desta fatia;
- a camada de apresentação fornece `ListAdminManifestationsController` em `src/presentation/controllers/admin/`, que deriva `requesterUserId` do contexto autenticado, faz parse de `request.query` (`page` por regex `/^[1-9]\d*$/`, `status`/`type` validados contra enums de domínio, `campusId`/`administrativeUnitId` repassados como strings com fallback de string vazia, `from`/`to` aceitos apenas em timestamp ISO UTC completo e então convertidos para `Date`) e rejeita valores inválidos com `400` (`InvalidPageNumberError` ou `InvalidParamError`); mapeia `NotAllowedToManageManifestationError` para `403 Forbidden` e `InvalidPageNumberError` do use case para `400`; sem usuário autenticado retorna `401`;
- a camada de apresentação fornece `GetAdminManifestationDetailsController`, `AnswerManifestationController` e `UpdateManifestationStatusController` em `src/presentation/controllers/admin/`. Todos derivam `requesterUserId` do contexto autenticado, extraem `manifestationId` de `request.params`, e mapeiam erros compartilhados (`ManifestationNotFoundError` → `404`, `NotAllowedToManageManifestationError` → `403`); os fluxos de escrita (`answer`, `update-status`) validam o body via `Validator` agnóstico e mapeiam `ManifestationStatusTransitionNotAllowedError` para `409 Conflict`; o `answer` também mapeia `InvalidManifestationMessageContentError` para `400` e retorna `201`, enquanto `update-status` retorna `200` com o agregado atualizado; sem usuário autenticado retornam `401` e `manifestationId` vazio retorna `400 MissingParamError`;
- os endpoints `GET /admin/manifestations`, `GET /admin/manifestations/:manifestationId`, `POST /admin/manifestations/:manifestationId/answer` e `PATCH /admin/manifestations/:manifestationId/status` são registrados em `src/main/routes/admin.routes.ts` com `preHandler: [ensureAuthenticated, requireRoles(UserRole.OMBUDSMAN, UserRole.ADMIN)]` (`src/infra/http/fastify/middlewares/auth-middleware.ts`); manifestantes recebem `403` e requisições sem token recebem `401`;
- cobertura e2e em `test/e2e/manifestation-administration.e2e.spec.ts` valida a rastreabilidade: após `answer`, o detalhamento traz `history` na ordem `['registered', 'administrative_answered', 'status_changed']` com `fromStatus='in_analysis'`/`toStatus='answered'` e `prisma.manifestationMessage.count({ senderType: 'system' })` resulta em `1`; após `PATCH status=canceled`, o último item do histórico é o `status_changed` correspondente. Também cobre `403` para manifestante chamando rota admin, `401` sem auth, `409` ao tentar `PATCH status=answered` (rota inválida para chegar em answered) e `403` quando ombudsman tenta abrir manifestação identificada em nome próprio (UC-04 RN-15);
- cobertura e2e adicional em `test/e2e/manifestation-interaction.e2e.spec.ts` cobre o lado do manifestante: envio de mensagem, bloqueio em manifestação finalizada (`409`), isolamento entre manifestantes (`403`), finalização após resposta e bloqueio de finalização precoce (`409`).

---

## 20. Observação final

Esta feature documenta o recorte atual de gestão administrativa de manifestações no núcleo da aplicação. Expansões futuras, como atribuição a responsáveis, encaminhamento entre unidades, materialização do histórico em entidade dedicada, notificações e relatórios gerenciais, devem ser adicionadas em especificações complementares ou revisões desta mesma feature.
