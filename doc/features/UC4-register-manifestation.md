# Especificação da Feature: Registrar Manifestação

## 1. Identificação

| Campo          | Descrição                                                                               |
| -------------- | --------------------------------------------------------------------------------------- |
| Caso de uso    | UC-04                                                                                   |
| Nome           | Registrar manifestação                                                                  |
| Feature        | Abertura de manifestação                                                                |
| Ator principal | Usuário                                                                                 |
| Prioridade     | Alta                                                                                    |
| Status         | Implementado de ponta a ponta (domínio, aplicação, presentation, infra, rota HTTP, e2e) |

---

## 2. Objetivo

Permitir que um usuário registre formalmente uma manifestação no sistema de Ouvidoria Institucional, informando os dados mínimos exigidos para geração de protocolo único e acompanhamento posterior.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                                                          |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| RF06   | O sistema deve permitir o registro de manifestações nos tipos: denúncia, reclamação, sugestão e elogio.                            |
| RF07   | O sistema deve exigir, no momento do registro, a seleção do campus e da unidade administrativa relacionada à manifestação.         |
| RF08   | O sistema deve permitir que o usuário informe descrição da manifestação e pessoas envolvidas, quando necessário.                   |
| RF10   | O sistema deve gerar automaticamente um número de protocolo único para cada manifestação registrada.                               |
| RF11   | O sistema deve permitir o registro de manifestações anônimas ou sigilosas, conforme política institucional.                        |
| RN01   | Toda manifestação deve possuir número de protocolo único.                                                                          |
| RN02   | Toda manifestação deve estar vinculada a um campus e a uma unidade administrativa.                                                 |
| RN03   | O sistema deve permitir manifestações anônimas conforme política institucional, observadas as restrições de retorno personalizado. |
| RNF11  | O sistema deve responder em tempo aceitável para operações de consulta, registro de manifestações e interação com IA.              |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- registrar uma manifestação com protocolo único;
- informar o tipo da manifestação;
- vincular a manifestação a um campus por identificador;
- vincular a manifestação a uma unidade administrativa por identificador;
- informar a descrição da manifestação;
- informar pessoas envolvidas em texto livre, quando necessário;
- permitir autoria identificada ou anônima;
- persistir a manifestação com status inicial `in_analysis`;
- retornar os dados públicos da manifestação criada.

### 4.2 Não incluído

Esta feature não contempla:

- CRUD de campus;
- CRUD de unidade administrativa;
- anexos;
- marcação de sigilo além da autoria anônima;
- mensagens no chamado;
- atualização de status após o registro inicial;
- encerramento;
- avaliação do atendimento;
- triagem por IA;
- pré-preenchimento assistido por IA.

---

## 5. Ator principal

### Usuário

Pessoa que deseja formalizar uma demanda junto à Ouvidoria Institucional para posterior análise e acompanhamento.

---

## 6. Pré-condições

Para executar o registro:

- o sistema deve estar disponível;
- o gerador de protocolo deve estar disponível;
- campus e unidade administrativa devem ser informados;
- o tipo da manifestação deve estar entre os valores suportados;
- manifestações identificadas exigem contexto autenticado;
- manifestações anônimas podem ser registradas sem usuário autenticado.

---

## 7. Pós-condições

Após um registro bem-sucedido:

- a manifestação é criada com um identificador interno;
- um protocolo único é associado à manifestação;
- a manifestação fica vinculada a um campus e a uma unidade administrativa;
- a manifestação recebe status inicial `in_analysis`;
- a autoria fica registrada como identificada ou anônima;
- os dados públicos da manifestação criada são retornados.

---

## 8. Entrada

### 8.1 Entrada de aplicação

No nível de caso de uso, a feature trabalha com os seguintes dados:

> Este payload é interno ao caso de uso e não deve ser usado pelo frontend.
> Para integração HTTP, use somente a seção `8.2 Contrato HTTP atual`.

| Campo                | Tipo    | Obrigatório | Descrição                                                           |
| -------------------- | ------- | ----------- | ------------------------------------------------------------------- |
| type                 | string  | Sim         | Tipo da manifestação.                                               |
| campusId             | string  | Sim         | Identificador do campus relacionado à manifestação.                 |
| administrativeUnitId | string  | Sim         | Identificador da unidade administrativa relacionada à manifestação. |
| description          | string  | Sim         | Descrição textual da manifestação.                                  |
| involvedPeople       | string  | Não         | Pessoas envolvidas, em texto livre, quando houver.                  |
| requesterId          | string  | Não         | Identificador do usuário autenticado no contexto da aplicação.      |
| isAnonymous          | boolean | Sim         | Indica se o usuário deseja registrar a manifestação anonimamente.   |

### Exemplo de entrada identificada no caso de uso

```json
{
  "requesterId": "user-1",
  "isAnonymous": false,
  "type": "complaint",
  "campusId": "campus-1",
  "administrativeUnitId": "unit-1",
  "description": "O serviço ficou indisponível durante toda a manhã.",
  "involvedPeople": "Equipe da coordenação"
}
```

### Exemplo de entrada anônima no caso de uso

```json
{
  "requesterId": null,
  "isAnonymous": true,
  "type": "report",
  "campusId": "campus-2",
  "administrativeUnitId": "unit-7",
  "description": "Há indícios de irregularidade no processo informado.",
  "involvedPeople": null
}
```

### 8.2 Contrato HTTP atual

No contrato HTTP público atual:

- o frontend chama `POST /manifestations`;
- o body **não** carrega `requesterId`;
- a identidade autenticada é derivada do Bearer token quando houver;
- em registro identificado (`isAnonymous=false`), a ausência de autenticação válida retorna `401`;
- em registro anônimo (`isAnonymous=true`), o request pode seguir sem token.
- campos extras não fazem parte do contrato e não devem ser enviados pelo frontend.

Exemplo HTTP identificado:

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

Exemplo HTTP anônimo:

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

## 9. Regras de negócio

| Código     | Regra                                                                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN-UC04-01 | O tipo da manifestação é obrigatório.                                                                                                                                                                                                    |
| RN-UC04-02 | O campus da manifestação é obrigatório.                                                                                                                                                                                                  |
| RN-UC04-03 | A unidade administrativa da manifestação é obrigatória.                                                                                                                                                                                  |
| RN-UC04-04 | A descrição da manifestação é obrigatória.                                                                                                                                                                                               |
| RN-UC04-05 | `involvedPeople` é opcional, deve ser normalizado quando informado e pode ser tratado como `null` quando vier vazio.                                                                                                                     |
| RN-UC04-06 | Toda manifestação deve possuir protocolo único.                                                                                                                                                                                          |
| RN-UC04-07 | Toda manifestação deve estar vinculada a um campus e a uma unidade administrativa.                                                                                                                                                       |
| RN-UC04-08 | Os tipos permitidos são `report`, `complaint`, `suggestion` e `compliment`.                                                                                                                                                              |
| RN-UC04-09 | O registro pode ser identificado ou anônimo.                                                                                                                                                                                             |
| RN-UC04-10 | Em registros identificados, o autor da manifestação deve ser derivado do `requesterId` autenticado.                                                                                                                                      |
| RN-UC04-11 | Registros identificados sem contexto autenticado devem ser rejeitados antes de chamar o caso de uso.                                                                                                                                     |
| RN-UC04-12 | Em registros anônimos, o autor da manifestação deve ser persistido como `null`.                                                                                                                                                          |
| RN-UC04-13 | Quando registrada, a manifestação deve iniciar com status `in_analysis`.                                                                                                                                                                 |
| RN-UC04-14 | A resposta de sucesso deve retornar apenas os dados públicos da manifestação registrada.                                                                                                                                                 |
| RN-UC04-15 | Em registros identificados, o autor deve possuir papel `manifestant`. Usuários com papel `ombudsman` ou `admin` não podem abrir manifestações identificadas em nome próprio (mantendo a separação entre quem manifesta e quem responde). |

---

## 10. Validações

### 10.1 Tipo

O campo `type` deve:

- ser obrigatório;
- corresponder a um dos tipos válidos do domínio.

Tipos válidos:

- `report`
- `complaint`
- `suggestion`
- `compliment`

### 10.2 Campus

O campo `campusId` deve:

- ser obrigatório;
- não estar vazio;
- não conter apenas espaços em branco.

Observação:
No MVP atual, `campusId` referencia um catálogo fixo de campi previamente carregado por seed. O caso de uso exige o identificador informado, mas não implementa CRUD próprio de campus nem validação de existência contra repositório nesta versão.

### 10.3 Unidade administrativa

O campo `administrativeUnitId` deve:

- ser obrigatório;
- não estar vazio;
- não conter apenas espaços em branco.

Observação:
No MVP atual, `administrativeUnitId` referencia um catálogo fixo de unidades administrativas previamente carregado por seed. O caso de uso exige o identificador informado, mas não implementa CRUD próprio de unidade nem validação de existência contra repositório nesta versão.

### 10.4 Descrição

O campo `description` deve:

- ser obrigatório;
- não estar vazio;
- não conter apenas espaços em branco;
- ser persistido em formato normalizado nas extremidades.

### 10.5 Pessoas envolvidas

O campo `involvedPeople`:

- é opcional;
- quando vier vazio ou com apenas espaços em branco, deve ser tratado como ausência do campo;
- deve ser persistido em formato normalizado nas extremidades.

### 10.6 Contexto do solicitante

O campo `requesterId`:

- representa a identidade autenticada do solicitante na entrada de aplicação;
- não deve ser tratado como autoria arbitrária enviada pelo cliente;
- deve estar presente quando `isAnonymous` for `false`;
- pode ser `null` apenas quando `isAnonymous` for `true`.

O campo `isAnonymous`:

- é obrigatório;
- indica a escolha do usuário por registro identificado ou anônimo.

Observação:
No recorte atual do MVP, o caso de uso deriva `authorUserId` internamente a partir de `requesterId` e `isAnonymous`. Na camada HTTP, `requesterId` vem do JWT e não do body da requisição. Regras adicionais de sigilo institucional ainda não fazem parte da implementação.

---

## 11. Fluxo principal

1. O usuário acessa a funcionalidade de registro de manifestação.
2. O sistema solicita o tipo, o campus, a unidade administrativa e a descrição.
3. O usuário informa os dados da manifestação.
4. O sistema valida os campos obrigatórios.
5. O sistema solicita a geração de um protocolo único.
6. O sistema cria a manifestação com status inicial `in_analysis`.
7. O sistema persiste a manifestação registrada.
8. O sistema retorna os dados públicos da manifestação criada.

---

## 12. Fluxos alternativos

### FA01 - Campus inválido

Condição:
O usuário informa `campusId` vazio ou composto apenas por espaços.

Comportamento esperado:
O sistema deve rejeitar o registro antes de gerar protocolo ou persistir a manifestação.

### FA02 - Unidade administrativa inválida

Condição:
O usuário informa `administrativeUnitId` vazio ou composto apenas por espaços.

Comportamento esperado:
O sistema deve rejeitar o registro antes de gerar protocolo ou persistir a manifestação.

### FA03 - Descrição inválida

Condição:
O usuário informa `description` vazio ou composto apenas por espaços.

Comportamento esperado:
O sistema deve rejeitar o registro antes de gerar protocolo ou persistir a manifestação.

### FA04 - Registro identificado sem solicitante autenticado

Condição:
O usuário tenta registrar manifestação identificada com `isAnonymous` igual a `false`, mas sem `requesterId`.

Comportamento esperado:
O sistema deve rejeitar o registro antes de gerar protocolo ou persistir a manifestação. Na camada de apresentação HTTP, esse cenário deve retornar `401 Unauthorized` sem chamar o caso de uso.

### FA04b - Registro identificado por usuário sem papel `manifestant`

Condição:
O usuário autenticado possui papel `ombudsman` ou `admin` e tenta registrar manifestação identificada (`isAnonymous=false`).

Comportamento esperado:
O sistema deve rejeitar o registro com `403 Forbidden` (`IdentifiedManifestationRequiresManifestantRoleError`) antes de chamar o caso de uso. Anônimas continuam permitidas (o `requesterId` é descartado e o agregado é aberto sem autor).

### FA05 - Falha na geração do protocolo

Condição:
O gerador de protocolo falha durante a execução.

Comportamento esperado:
O sistema deve propagar o erro e não persistir a manifestação.

### FA06 - Registro anônimo

Condição:
O usuário opta por não se identificar e informa `isAnonymous` como `true`.

Comportamento esperado:
O sistema deve registrar a manifestação sem autor identificado, preservando o restante do fluxo.

---

## 13. Saída de sucesso

Status HTTP:

`201 Created`

Corpo da resposta:

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
    "involvedPeople": null,
    "isAnonymous": false,
    "authorUserId": "user-1",
    "createdAt": "2026-05-10T15:00:00.000Z"
  },
  "accessCode": null
}
```

Exemplo de resposta anônima:

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

---

## 14. Erros esperados

### 14.1 Dados inválidos

Status HTTP:

`400 Bad Request`

Exemplo de resposta:

```json
{
  "error": "ValidationError",
  "message": "description: Invalid input: expected string, received undefined"
}
```

### 14.2 Falha interna na geração do protocolo

Status HTTP:

`500 Internal Server Error`

Exemplo de resposta:

```json
{
  "error": "ServerError",
  "message": "Internal server error."
}
```

### 14.3 Registro identificado sem autenticação

Status HTTP:

`401 Unauthorized`

Exemplo de resposta:

```json
{
  "error": "UnauthenticatedError",
  "message": "Authentication required."
}
```

---

## 15. Regras de segurança

- O sistema deve gerar o protocolo somente no momento do registro.
- O cliente não deve escolher livremente `authorUserId`.
- O registro anônimo não deve preencher `authorUserId`.
- Em registros identificados, `authorUserId` deve ser derivado do contexto autenticado da requisição.
- O sistema não deve expor detalhes internos de infraestrutura em respostas públicas.
- Regras futuras de sigilo institucional devem ser tratadas separadamente da autoria anônima no núcleo da aplicação.

---

## 16. Critérios de aceite

A feature será considerada concluída quando:

- for possível registrar manifestação com tipo válido;
- a manifestação exigir campus e unidade administrativa;
- a descrição obrigatória for validada;
- um protocolo único for gerado para cada registro;
- a manifestação for criada com status inicial `in_analysis`;
- o sistema permitir registro identificado e anônimo;
- o sistema derivar a autoria do contexto autenticado quando o registro não for anônimo;
- o sistema não persistir a manifestação quando a geração de protocolo falhar;
- os casos de teste definidos estiverem passando.

---

## 17. Casos de teste

### 17.1 Testes unitários do caso de uso

#### CT-UC04-001 - Deve registrar manifestação com dados normalizados e protocolo gerado

Dado que o gerador de protocolo está disponível,
Quando executar o registro com dados válidos,
Então o sistema deve criar a manifestação, persisti-la e retornar seus dados públicos.

Resultado esperado:

- protocolo gerado e normalizado;
- descrição normalizada;
- `involvedPeople` normalizado ou persistido como `null` quando ausente;
- status inicial `in_analysis`;
- manifestação persistida;
- resposta com os dados públicos da manifestação;
- `accessCode` igual a `null` para manifestação identificada.

#### CT-UC04-002 - Deve registrar manifestação anônima quando o usuário escolher anonimato

Dado que o usuário opta por registro anônimo,
Quando executar o registro com `isAnonymous` igual a `true`,
Então o sistema deve registrar a manifestação sem autor identificado.

Resultado esperado:

- `authorUserId` persistido como `null`;
- `accessCodeHash` persistido a partir do código gerado;
- resposta com `authorUserId` igual a `null`;
- resposta com `accessCode` em texto plano apenas nesse momento.

#### CT-UC04-003 - Não deve registrar manifestação identificada sem `requesterId`

Dado que o usuário tenta registrar manifestação identificada,
Quando executar o registro com `isAnonymous` igual a `false` e `requesterId` igual a `null`,
Então o sistema deve rejeitar a operação antes de gerar protocolo.

Resultado esperado:

- erro de regra de negócio;
- protocolo não gerado;
- manifestação não persistida.

#### CT-UC04-004 - Não deve registrar manifestação com campus inválido

Dado que o usuário informa um `campusId` inválido,
Quando executar o registro,
Então o sistema deve rejeitar a operação antes de gerar protocolo.

Resultado esperado:

- erro de dados inválidos;
- protocolo não gerado;
- manifestação não persistida.

#### CT-UC04-005 - Não deve registrar manifestação com unidade administrativa inválida

Dado que o usuário informa um `administrativeUnitId` inválido,
Quando executar o registro,
Então o sistema deve rejeitar a operação antes de gerar protocolo.

Resultado esperado:

- erro de dados inválidos;
- protocolo não gerado;
- manifestação não persistida.

#### CT-UC04-006 - Não deve registrar manifestação com descrição inválida

Dado que o usuário informa uma `description` inválida,
Quando executar o registro,
Então o sistema deve rejeitar a operação antes de gerar protocolo.

Resultado esperado:

- erro de dados inválidos;
- protocolo não gerado;
- manifestação não persistida.

#### CT-UC04-007 - Deve propagar falha do gerador de protocolo

Dado que ocorre falha na dependência de geração de protocolo,
Quando executar o registro,
Então o erro deve ser propagado e a manifestação não deve ser persistida.

Resultado esperado:

- erro propagado;
- persistência não executada.

---

## 18. Sugestão de tipos

Entrada do caso de uso:

```ts
interface RegisterManifestationInput {
  requesterId?: string | null
  isAnonymous: boolean
  type: ManifestationType
  campusId: string
  administrativeUnitId: string
  description: string
  involvedPeople?: string | null
}
```

Saída do caso de uso:

```ts
interface RegisterManifestationOutput {
  manifestation: {
    id: string
    protocol: string
    type: ManifestationType
    status: ManifestationStatus
    campusId: string
    administrativeUnitId: string
    description: string
    involvedPeople: string | null
    isAnonymous: boolean
    authorUserId: string | null
    createdAt: Date
  }
  accessCode: string | null
}
```

Repositório:

```ts
interface ManifestationsRepository {
  save(manifestation: Manifestation): Promise<void>
}
```

Gerador de protocolo:

```ts
interface ProtocolGenerator {
  generate(): Promise<string>
}
```

Gerador de código de acompanhamento:

```ts
interface AccessCodeGenerator {
  generate(): Promise<string>
}
```

Hash do código de acompanhamento:

```ts
interface PasswordHasher {
  hash(value: string): Promise<string>
}
```

---

## 19. Observações de implementação

- O caso de uso atual trata apenas o registro inicial da manifestação.
- A camada de apresentação fornece `RegisterManifestationController` em `src/presentation/controllers/manifestation/`, que deriva `requesterId` do contexto autenticado da requisição (`request.user.id`) e não aceita autoria pelo corpo livre.
- O controller depende de um `Validator<RegisterManifestationBody>` agnóstico e mapeia erros conhecidos (`IdentifiedManifestationRequiresRequesterError`, erros de value-object) para `400 Bad Request`; falhas inesperadas caem no `500` padrão do `BaseController`.
- A infraestrutura concreta está materializada: `PrismaManifestationsRepository` (`src/infra/database/prisma/repositories/`) implementa `ManifestationsRepository`; `UuidProtocolGenerator` e `RandomAccessCodeGenerator` (`src/infra/protocol/`) implementam os geradores; `BcryptjsHasher` faz hash do `accessCode` antes da persistência; `ZodValidator<RegisterManifestationBody>` (`src/infra/http/fastify/validators/`) materializa o `Validator<T>` da apresentação.
- O endpoint `POST /manifestations` é registrado em `src/main/routes/manifestation.routes.ts` com `preHandler: optionalAuthenticate` (middleware em `src/infra/http/fastify/middlewares/auth-middleware.ts`), permitindo registro anônimo sem token e injetando `request.user` quando um Bearer válido for enviado.
- A guarda de papel (RN-UC04-15) é aplicada no `RegisterManifestationController` logo após o check de autenticação: se `request.user.role !== UserRole.MANIFESTANT` e `isAnonymous=false`, retorna `403` com `IdentifiedManifestationRequiresManifestantRoleError` (`src/application/use-cases/register-manifestation/errors/`). Anônimas seguem o caminho normal porque o use case ignora `requesterId` nesse caso.
- Cobertura e2e: `test/e2e/anonymous-manifestation.e2e.spec.ts` valida o fluxo anônimo + `accessCode` retornado; `test/e2e/identified-manifestation.e2e.spec.ts` cobre registro autenticado, rejeição sem auth (401) e isolamento entre manifestantes (403); `test/e2e/manifestation-administration.e2e.spec.ts` cobre o `403` para ombudsman tentando abrir identificada.
- `Campus` e `AdministrativeUnit` não possuem CRUD próprio neste MVP.
- Nesta versão, campus e unidade administrativa são tratados como catálogos fixos previamente carregados por seed.
- O caso de uso exige apenas que `campusId` e `administrativeUnitId` sejam informados e usados como referência.
- A validação de tipo pode ocorrer na camada de entrada ou por enum do domínio.
- Em manifestações anônimas, o caso de uso gera `accessCode` em texto plano, cria `accessCodeHash` por `PasswordHasher` e persiste apenas o hash no agregado.
- O `accessCode` em texto plano só deve ser retornado no output do registro anônimo, nunca persistido nem reexposto em projeções futuras.
- O caso de uso depende de `ManifestationsRepository`, `ProtocolGenerator`, `AccessCodeGenerator` e `PasswordHasher`.
- O caso de uso não deve depender diretamente de banco de dados ou biblioteca concreta de geração de protocolo.
- O campo `involvedPeople` já faz parte do recorte atual e deve permanecer alinhado com o draft assistido por IA.
- A camada de apresentação deve retornar `401 Unauthorized` quando o registro for identificado e não houver usuário autenticado no contexto da requisição.
- O fluxo de anexos, sigilo administrativo e IA deve ser especificado em features próprias ou em evoluções posteriores desta feature.

---

## 20. Observação final

Essa versão está alinhada ao recorte atual do MVP e ao comportamento implementado no caso de uso `RegisterManifestationUseCase`.
