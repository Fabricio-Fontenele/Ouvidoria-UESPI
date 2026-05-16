# Especificação da Feature: Acompanhar Manifestação

## 1. Identificação

| Campo          | Descrição                                                                                |
| -------------- | ---------------------------------------------------------------------------------------- |
| Caso de uso    | UC-05                                                                                    |
| Nome           | Acompanhar manifestação                                                                  |
| Feature        | Consulta e interação da manifestação                                                     |
| Ator principal | Manifestante                                                                             |
| Prioridade     | Alta                                                                                     |
| Status         | Implementado de ponta a ponta (domínio, aplicação, presentation, infra, rotas HTTP, e2e) |

---

## 2. Objetivo

Permitir que o manifestante consulte suas manifestações, visualize os detalhes de uma manifestação específica e registre mensagens complementares enquanto a manifestação estiver aberta para interação.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| RF12   | O sistema deve permitir ao manifestante consultar suas manifestações conforme autorização de acesso.                                             |
| RF13   | O sistema deve exibir o status atual, o histórico de movimentações e as interações relacionadas à manifestação.                                  |
| RF14   | O sistema deve permitir troca de mensagens no chamado entre participantes autorizados enquanto a manifestação estiver aberta para interação.     |
| RF17   | O sistema deve notificar o usuário sobre atualizações relevantes da manifestação, respeitadas as restrições aplicáveis a manifestações anônimas. |
| RN05   | O tratamento das manifestações deve manter rastreabilidade de interações, respostas, alterações de status e responsáveis por cada ação.          |
| RN06   | Manifestações finalizadas ou canceladas não devem aceitar edição direta do conteúdo original.                                                    |
| RNF09  | O sistema deve manter histórico suficiente para rastrear alterações de status, mensagens, respostas administrativas e encerramentos.             |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- listar manifestações identificadas de um manifestante por `userId`;
- paginar a listagem por página;
- consultar os detalhes de uma manifestação específica;
- validar se a manifestação pertence ao `userId` solicitante;
- exibir status atual, histórico e mensagens já registradas;
- registrar nova mensagem do manifestante como entidade de domínio em manifestação autorizada;
- bloquear o envio de mensagem para manifestação finalizada ou cancelada.

### 4.2 Não incluído

Esta feature não contempla:

- consulta de manifestação anônima por protocolo;
- anexos em mensagens;
- notificações;
- resposta administrativa;
- alteração de status;
- encerramento da manifestação;
- avaliação do atendimento.

---

## 5. Ator principal

### Manifestante

Usuário autenticado que deseja acompanhar o andamento de suas manifestações identificadas e complementar o atendimento por mensagens.

---

## 6. Pré-condições

Para executar o acompanhamento:

- o usuário deve estar autenticado;
- a manifestação consultada deve existir quando a operação for por identificador;
- o acesso deve respeitar a autoria identificada da manifestação;
- a infraestrutura de persistência deve disponibilizar consulta de detalhes e gravação de mensagens.

---

## 7. Pós-condições

Após operações bem-sucedidas:

- a listagem retorna apenas manifestações do usuário solicitado;
- a consulta de detalhes retorna o estado atual da manifestação com histórico e mensagens;
- a mensagem enviada fica registrada com identidade própria, data e remetente;
- o histórico de acompanhamento permanece rastreável.

---

## 8. Entradas

### 8.1 Listagem das manifestações do usuário

| Campo  | Tipo   | Obrigatório | Descrição                                       |
| ------ | ------ | ----------- | ----------------------------------------------- |
| userId | string | Sim         | Identificador do usuário autenticado no fluxo.  |
| page   | number | Sim         | Número da página da listagem, iniciando em `1`. |

### Exemplo de entrada

```json
{
  "userId": "user-1",
  "page": 1
}
```

### 8.2 Consulta de detalhes da manifestação

| Campo           | Tipo   | Obrigatório | Descrição                                      |
| --------------- | ------ | ----------- | ---------------------------------------------- |
| manifestationId | string | Sim         | Identificador da manifestação consultada.      |
| userId          | string | Sim         | Identificador do usuário autenticado no fluxo. |

### Exemplo de entrada

```json
{
  "manifestationId": "manifestation-1",
  "userId": "user-1"
}
```

### 8.3 Envio de mensagem

| Campo           | Tipo   | Obrigatório | Descrição                                              |
| --------------- | ------ | ----------- | ------------------------------------------------------ |
| manifestationId | string | Sim         | Identificador da manifestação que receberá a mensagem. |
| userId          | string | Sim         | Identificador do manifestante autenticado.             |
| content         | string | Sim         | Conteúdo textual da mensagem complementar.             |

### Exemplo de entrada

```json
{
  "manifestationId": "manifestation-1",
  "userId": "user-1",
  "content": "Poderiam compartilhar uma atualização do andamento?"
}
```

## 9. Regras de negócio

| Código     | Regra                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| RN-UC05-01 | O sistema deve listar apenas manifestações pertencentes ao `userId` informado.                               |
| RN-UC05-02 | A paginação da listagem deve aceitar somente páginas maiores ou iguais a `1`.                                |
| RN-UC05-03 | A consulta detalhada deve falhar quando a manifestação não existir.                                          |
| RN-UC05-04 | A consulta detalhada deve falhar quando a manifestação não pertencer ao `userId` autenticado.                |
| RN-UC05-05 | Manifestações anônimas não devem ser consultadas por este fluxo identificado.                                |
| RN-UC05-06 | O detalhamento deve retornar status atual, histórico e mensagens associadas à manifestação.                  |
| RN-UC05-07 | O envio de mensagem deve exigir conteúdo textual não vazio.                                                  |
| RN-UC05-08 | O envio de mensagem deve falhar quando a manifestação não pertencer ao `userId` autenticado.                 |
| RN-UC05-09 | Apenas manifestações abertas para interação podem receber novas mensagens.                                   |
| RN-UC05-10 | Manifestações `finalized` e `canceled` não podem receber novas mensagens.                                    |
| RN-UC05-11 | Cada mensagem registrada deve manter rastreabilidade de remetente e data de criação.                         |
| RN-UC05-12 | Regras de autoria, anonimato e abertura para interação devem ficar encapsuladas na entidade `Manifestation`. |

---

## 10. Validações

### 10.1 Página da listagem

O campo `page` deve:

- ser obrigatório;
- ser numérico;
- ser maior ou igual a `1`.

### 10.2 Propriedade da manifestação

O par `manifestationId` e `userId` deve:

- localizar uma manifestação existente;
- corresponder a uma manifestação identificada;
- corresponder à autoria do usuário autenticado.

### 10.3 Conteúdo da mensagem

O campo `content` deve:

- ser obrigatório;
- não estar vazio;
- não conter apenas espaços em branco;
- ser persistido com normalização nas extremidades.

### 10.4 Status para interação

Para envio de mensagem:

- a manifestação deve estar aberta para interação;
- `finalized` e `canceled` devem ser bloqueados.

Observação:
No recorte atual do núcleo, a regra foi modelada como permissão para `in_analysis` e `answered`, com bloqueio explícito para `finalized` e `canceled`.

---

## 11. Fluxo principal

1. O manifestante acessa a área de acompanhamento.
2. O sistema lista as manifestações identificadas vinculadas ao usuário.
3. O manifestante seleciona uma manifestação específica.
4. O sistema valida a autorização de acesso e exibe status, histórico e mensagens.
5. O manifestante informa uma nova mensagem complementar.
6. O sistema valida o conteúdo, a propriedade e o status da manifestação.
7. O sistema registra a nova mensagem.
8. O sistema retorna a mensagem registrada.

---

## 12. Fluxos alternativos

### FA01 - Página inválida

Condição:
O usuário informa `page` menor que `1`.

Comportamento esperado:
O sistema deve rejeitar a listagem antes de consultar o repositório.

### FA02 - Manifestação inexistente

Condição:
O identificador informado não corresponde a nenhuma manifestação.

Comportamento esperado:
O sistema deve falhar com erro de manifestação não encontrada.

### FA03 - Manifestação sem autorização de acesso

Condição:
A manifestação existe, mas a autoria identificada não corresponde ao `userId` informado.

Comportamento esperado:
O sistema deve bloquear o acesso aos detalhes e o envio de mensagem.

### FA04 - Manifestação anônima neste fluxo

Condição:
A manifestação existe, mas sua autoria identificada está ausente (`authorUserId` igual a `null`).

Comportamento esperado:
O sistema deve bloquear o acesso por este fluxo identificado.

### FA05 - Conteúdo de mensagem inválido

Condição:
O usuário informa `content` vazio ou com apenas espaços.

Comportamento esperado:
O sistema deve rejeitar a operação antes de consultar ou gravar a interação.

### FA06 - Manifestação fechada para interação

Condição:
A manifestação está `finalized` ou `canceled`.

Comportamento esperado:
O sistema deve bloquear o envio de nova mensagem.

---

## 13. Saídas de sucesso

### 13.1 Saída da listagem

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

### 13.2 Saída do detalhamento

```json
{
  "manifestation": {
    "id": "manifestation-1",
    "protocol": "2026-0001",
    "type": "complaint",
    "status": "in_analysis",
    "campusId": "campus-1",
    "administrativeUnitId": "unit-1",
    "description": "O serviço ficou indisponível durante toda a manhã.",
    "createdAt": "2026-05-10T12:00:00.000Z",
    "history": [
      {
        "description": "Manifestação registrada.",
        "createdAt": "2026-05-10T12:00:00.000Z"
      }
    ],
    "messages": [
      {
        "id": "message-1",
        "senderUserId": "ombudsman-1",
        "content": "Estamos analisando o seu relato.",
        "createdAt": "2026-05-10T15:00:00.000Z"
      }
    ]
  }
}
```

### 13.3 Saída do envio de mensagem

```json
{
  "message": {
    "id": "message-2",
    "senderUserId": "user-1",
    "content": "Poderiam compartilhar uma atualização do andamento?",
    "createdAt": "2026-05-10T16:00:00.000Z"
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

### 14.2 Manifestação não encontrada

Condição:
Nenhuma manifestação encontrada para o identificador informado.

Erro esperado:
`ManifestationNotFoundError`

### 14.3 Acesso não permitido

Condição:
A manifestação existe, mas não pertence ao usuário autenticado ou é anônima neste fluxo.

Erro esperado:
`NotAllowedToAccessManifestationError`

### 14.4 Conteúdo de mensagem inválido

Condição:
`content` vazio ou composto apenas por espaços.

Erro esperado:
`InvalidManifestationMessageContentError`

### 14.5 Interação não permitida

Condição:
A manifestação está fechada para interação.

Erro esperado:
`ManifestationInteractionNotAllowedError`

---

## 15. Regras de segurança

- o acesso a detalhes deve respeitar a autoria identificada da manifestação;
- o sistema não deve expor manifestação de outro usuário neste fluxo;
- manifestações anônimas devem ser consultadas por fluxo específico baseado em protocolo;
- o conteúdo de mensagem não deve ser aceito em branco;
- a camada de apresentação mapeia erros de autorização e inexistência conforme o contrato HTTP atual (Fastify) — ver detalhes nos controllers descritos na seção 19.

---

## 16. Critérios de aceite

- o sistema deve listar manifestações apenas do usuário informado;
- o sistema deve rejeitar paginação inválida;
- o sistema deve retornar detalhes apenas para manifestação pertencente ao usuário;
- o sistema deve bloquear detalhes e mensagens de manifestação de outro usuário;
- o sistema deve bloquear detalhes e mensagens de manifestação anônima neste fluxo;
- o sistema deve retornar histórico e mensagens no detalhamento;
- o sistema deve registrar nova mensagem quando a manifestação estiver aberta;
- o sistema deve bloquear mensagens em manifestações finalizadas ou canceladas.

---

## 17. Casos de teste

### 17.1 Testes unitários do caso de uso

#### CT-UC05-001 - Deve listar manifestações do usuário com a página solicitada

- dado `userId` válido e `page` igual a `2`;
- quando o caso de uso de listagem for executado;
- então o repositório deve ser chamado com `userId` e `{ page: 2 }`;
- e a lista retornada deve ser devolvida sem alteração.

#### CT-UC05-002 - Não deve listar com página inválida

- dado `page` igual a `0`;
- quando o caso de uso de listagem for executado;
- então deve lançar `InvalidPageNumberError`;
- e o repositório não deve ser consultado.

#### CT-UC05-003 - Deve retornar detalhes da manifestação do próprio usuário

- dado `manifestationId` existente e autoria identificada igual ao `userId`;
- quando o caso de uso de detalhamento for executado;
- então deve retornar os detalhes, o histórico e as mensagens da manifestação.

#### CT-UC05-004 - Não deve retornar detalhes de manifestação inexistente

- dado `manifestationId` inexistente;
- quando o caso de uso de detalhamento for executado;
- então deve lançar `ManifestationNotFoundError`.

#### CT-UC05-005 - Não deve retornar detalhes de manifestação de outro usuário

- dado `manifestationId` existente com autoria identificada diferente do `userId`;
- quando o caso de uso de detalhamento for executado;
- então deve lançar `NotAllowedToAccessManifestationError`.

#### CT-UC05-006 - Deve registrar mensagem em manifestação aberta do próprio usuário

- dado `manifestationId` existente, pertencente ao usuário e com status aberto;
- quando o caso de uso de envio de mensagem for executado com conteúdo válido;
- então deve criar e persistir a entidade de mensagem com conteúdo normalizado e retorná-la.

#### CT-UC05-007 - Não deve retornar detalhes de manifestação anônima

- dado `manifestationId` existente com autoria identificada ausente (`authorUserId` igual a `null`);
- quando o caso de uso de detalhamento for executado;
- então deve lançar `NotAllowedToAccessManifestationError`.

#### CT-UC05-008 - Não deve registrar mensagem em manifestação anônima

- dado `manifestationId` existente com autoria identificada ausente (`authorUserId` igual a `null`);
- quando o caso de uso de envio de mensagem for executado;
- então deve lançar `NotAllowedToAccessManifestationError`.

#### CT-UC05-009 - Não deve registrar mensagem com conteúdo inválido

- dado `content` vazio ou com apenas espaços;
- quando o caso de uso de envio de mensagem for executado;
- então deve lançar `InvalidManifestationMessageContentError`;
- e nenhum repositório deve ser chamado.

#### CT-UC05-010 - Não deve registrar mensagem em manifestação fechada

- dado `manifestationId` existente, pertencente ao usuário e com status `finalized` ou `canceled`;
- quando o caso de uso de envio de mensagem for executado;
- então deve lançar `ManifestationInteractionNotAllowedError`.

---

## 18. Sugestão de tipos

```ts
export interface ListUserManifestationsInput {
  userId: string
  page: number
}

export interface GetManifestationDetailsInput {
  manifestationId: string
  userId: string
}

export interface AddManifestationMessageInput {
  manifestationId: string
  userId: string
  content: string
}

export class Manifestation extends Entity<ManifestationProps> {
  static open(props: OpenManifestationProps, id?: UniqueEntityId): Manifestation
  static restore(props: ManifestationProps, id: UniqueEntityId): Manifestation
  canReceiveMessages(): boolean
  isAnonymous(): boolean
  belongsTo(userId: UniqueEntityId): boolean
}

export class ManifestationMessage extends Entity<ManifestationMessageProps> {
  static create(props: CreateManifestationMessageProps, id?: UniqueEntityId): ManifestationMessage
}

export interface ManifestationsRepository {
  findById(manifestationId: string): Promise<Manifestation | null>
  findDetailsById(manifestationId: string): Promise<ManifestationDetailsDTO | null>
  findManyByAuthorUserId(authorUserId: string, paginationParams: PaginationParams): Promise<ManifestationListItemDTO[]>
}

export interface ManifestationInteractionsRepository {
  addMessage(message: ManifestationMessage): Promise<ManifestationMessageDTO>
}
```

---

## 19. Observações de implementação

- no núcleo atual, a listagem paginada utiliza apenas `page`; `pageSize` ainda não faz parte do contrato;
- o caso de uso de listagem recebe `userId` como entrada de aplicação, enquanto o repositório continua expressando o critério de persistência por `authorUserId`;
- o detalhamento continua modelado como DTO de leitura enriquecido; histórico permanece como projeção de leitura e mensagem já possui entidade própria no domínio;
- a listagem retorna `ManifestationListItemDTO`, mantendo consistência com a separação entre comportamento de domínio e projeções de leitura;
- o envio de mensagem carrega a entidade `Manifestation` por `findById()` para aplicar regras de domínio como autoria, anonimato e abertura para interação;
- `findDetailsById()` permanece voltado ao caso de uso de visualização, enquanto `findById()` atende fluxos que dependem de comportamento do agregado;
- erros compartilhados de acesso à manifestação devem permanecer em pasta comum para evitar dependência entre casos de uso;
- o envio de mensagem utiliza a entidade `ManifestationMessage` e repositório próprio de interação para evitar acoplamento excessivo em `ManifestationsRepository`;
- `ManifestationMessageDTO` permanece como contrato de saída e leitura, não como modelo principal de domínio;
- a infraestrutura concreta materializa os contratos: `PrismaManifestationsRepository` (`src/infra/database/prisma/repositories/`) cobre `findById`, `findDetailsById` e `findManyByAuthorUserId` com `MANIFESTATIONS_PAGE_SIZE = 20`; `PrismaManifestationInteractionsRepository` cobre `addMessage`. O histórico em `findDetailsById` é reconstruído a partir das `ManifestationMessage` (criação sintetizada de `createdAt`, mensagens de ombudsman/admin viram `administrative_answered`, e mensagens com `senderType='system'` carregam um payload JSON decodificado por `src/infra/database/prisma/system-message-payload.ts`);
- a consulta de manifestações anônimas por protocolo é tratada pelo UC-05b;
- os endpoints `GET /manifestations`, `GET /manifestations/:manifestationId` e `POST /manifestations/:manifestationId/messages` são registrados em `src/main/routes/manifestation.routes.ts` com `preHandler: [ensureAuthenticated, requireRoles(UserRole.MANIFESTANT)]` (`src/infra/http/fastify/middlewares/auth-middleware.ts`), bloqueando ombudsman/admin com `403`;
- cobertura e2e em `test/e2e/identified-manifestation.e2e.spec.ts` exercita listagem, detalhes (`history === ['registered']` para manifestação recém-criada, `messages === []`), `401` sem auth e `403` entre manifestantes distintos; `test/e2e/manifestation-interaction.e2e.spec.ts` cobre envio de mensagem (sucesso + listagem nos detalhes, body vazio `400`, isolamento entre manifestantes `403`, bloqueio em manifestação finalizada `409`, `401` sem auth);
- a camada de apresentação fornece `GetManifestationDetailsController` em `src/presentation/controllers/manifestation/`, que extrai `manifestationId` de `request.params`, deriva `userId` do contexto autenticado (`request.user.id`), e mapeia `ManifestationNotFoundError` para `404 Not Found` e `NotAllowedToAccessManifestationError` para `403 Forbidden`; requisições sem usuário autenticado retornam `401 Unauthorized` e `manifestationId` vazio retorna `400 Bad Request` com `MissingParamError`;
- a camada de apresentação fornece `ListUserManifestationsController` em `src/presentation/controllers/manifestation/`, que deriva `userId` do contexto autenticado, faz parse de `page` a partir de `request.query.page` (default `1`, exige inteiro positivo via regex `/^[1-9]\d*$/`), rejeita valores inválidos com `400 InvalidPageNumberError` antes de chamar o use case, e também mapeia `InvalidPageNumberError` lançado pelo use case para `400 Bad Request`; sem usuário autenticado retorna `401 Unauthorized`;
- a camada de apresentação fornece `AddManifestationMessageController` em `src/presentation/controllers/manifestation/`, que extrai `manifestationId` de `request.params`, deriva `userId` do contexto autenticado, valida o body via `Validator<AddManifestationMessageBody>` e mapeia: `ManifestationNotFoundError` → `404`, `NotAllowedToAccessManifestationError` → `403`, `ManifestationInteractionNotAllowedError` → `409 Conflict` (manifestação fechada para interação), e `InvalidManifestationMessageContentError` → `400`; sem usuário autenticado retorna `401` e `manifestationId` vazio retorna `400 MissingParamError`.

---

## 20. Observação final

Esta feature documenta o recorte atual de acompanhamento identificado da manifestação no núcleo da aplicação. Expansões futuras, como protocolo para anônimos, anexos em mensagens, notificações e regras mais granulares de abertura para interação, devem ser adicionadas em especificações complementares ou revisões desta mesma feature.
