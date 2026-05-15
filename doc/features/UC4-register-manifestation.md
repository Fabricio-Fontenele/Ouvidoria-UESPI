# Especificação da Feature: Registrar Manifestação

## 1. Identificação

| Campo          | Descrição                                 |
| -------------- | ----------------------------------------- |
| Caso de uso    | UC-04                                     |
| Nome           | Registrar manifestação                    |
| Feature        | Abertura de manifestação                  |
| Ator principal | Usuário                                   |
| Prioridade     | Alta                                      |
| Status         | Núcleo implementado / integração pendente |

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
- o tipo da manifestação deve estar entre os valores suportados.

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

A feature deve receber os seguintes dados:

| Campo                | Tipo    | Obrigatório | Descrição                                                           |
| -------------------- | ------- | ----------- | ------------------------------------------------------------------- |
| type                 | string  | Sim         | Tipo da manifestação.                                               |
| campusId             | string  | Sim         | Identificador do campus relacionado à manifestação.                 |
| administrativeUnitId | string  | Sim         | Identificador da unidade administrativa relacionada à manifestação. |
| description          | string  | Sim         | Descrição textual da manifestação.                                  |
| involvedPeople       | string  | Não         | Pessoas envolvidas, em texto livre, quando houver.                  |
| requesterId          | string  | Não         | Identificador do usuário autenticado no contexto da requisição.     |
| isAnonymous          | boolean | Sim         | Indica se o usuário deseja registrar a manifestação anonimamente.   |

### Exemplo de entrada identificada

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

### Exemplo de entrada anônima

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

## 9. Regras de negócio

| Código     | Regra                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| RN-UC04-01 | O tipo da manifestação é obrigatório.                                                                                |
| RN-UC04-02 | O campus da manifestação é obrigatório.                                                                              |
| RN-UC04-03 | A unidade administrativa da manifestação é obrigatória.                                                              |
| RN-UC04-04 | A descrição da manifestação é obrigatória.                                                                           |
| RN-UC04-05 | `involvedPeople` é opcional, deve ser normalizado quando informado e pode ser tratado como `null` quando vier vazio. |
| RN-UC04-06 | Toda manifestação deve possuir protocolo único.                                                                      |
| RN-UC04-07 | Toda manifestação deve estar vinculada a um campus e a uma unidade administrativa.                                   |
| RN-UC04-08 | Os tipos permitidos são `report`, `complaint`, `suggestion` e `compliment`.                                          |
| RN-UC04-09 | O registro pode ser identificado ou anônimo.                                                                         |
| RN-UC04-10 | Em registros identificados, o autor da manifestação deve ser derivado do `requesterId` autenticado.                  |
| RN-UC04-11 | Em registros anônimos, o autor da manifestação deve ser persistido como `null`.                                      |
| RN-UC04-12 | Quando registrada, a manifestação deve iniciar com status `in_analysis`.                                             |
| RN-UC04-13 | A resposta de sucesso deve retornar apenas os dados públicos da manifestação registrada.                             |

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

- representa a identidade autenticada do solicitante;
- não deve ser tratado como autoria arbitrária enviada pelo cliente;
- pode ser `null` apenas quando o contexto da requisição não tiver usuário autenticado.

O campo `isAnonymous`:

- é obrigatório;
- indica a escolha do usuário por registro identificado ou anônimo.

Observação:
No recorte atual do MVP, o caso de uso deriva `authorUserId` internamente a partir de `requesterId` e `isAnonymous`. Regras adicionais de sigilo institucional ainda não fazem parte da implementação.

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
O sistema deve rejeitar o registro antes de gerar protocolo ou persistir a manifestação.

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
    "isAnonymous": false,
    "authorUserId": "user-1",
    "createdAt": "2026-05-10T15:00:00.000Z"
  }
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
    "isAnonymous": true,
    "authorUserId": null,
    "createdAt": "2026-05-10T15:00:00.000Z"
  }
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
  "error": "INVALID_INPUT",
  "message": "Dados inválidos.",
  "fields": {
    "campusId": ["Campus obrigatório."],
    "administrativeUnitId": ["Unidade administrativa obrigatória."],
    "description": ["Descrição obrigatória."]
  }
}
```

### 14.2 Falha interna na geração do protocolo

Status HTTP:

`500 Internal Server Error`

Exemplo de resposta:

```json
{
  "error": "INTERNAL_ERROR",
  "message": "Falha ao registrar manifestação."
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
- status inicial `in_analysis`;
- manifestação persistida;
- resposta com os dados públicos da manifestação.

#### CT-UC04-002 - Deve registrar manifestação anônima quando o usuário escolher anonimato

Dado que o usuário opta por registro anônimo,
Quando executar o registro com `isAnonymous` igual a `true`,
Então o sistema deve registrar a manifestação sem autor identificado.

Resultado esperado:

- `authorUserId` persistido como `null`;
- resposta com `authorUserId` igual a `null`.

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
    isAnonymous: boolean
    authorUserId: string | null
    createdAt: Date
  }
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

---

## 19. Observações de implementação

- O caso de uso atual trata apenas o registro inicial da manifestação.
- Em uma camada HTTP futura, `requesterId` deve vir do token/sessão, não do corpo livre da requisição.
- `Campus` e `AdministrativeUnit` não possuem CRUD próprio neste MVP.
- Nesta versão, campus e unidade administrativa são tratados como catálogos fixos previamente carregados por seed.
- O caso de uso exige apenas que `campusId` e `administrativeUnitId` sejam informados e usados como referência.
- A validação de tipo pode ocorrer na camada de entrada ou por enum do domínio.
- O caso de uso depende de `ManifestationsRepository` e `ProtocolGenerator`.
- O caso de uso não deve depender diretamente de banco de dados ou biblioteca concreta de geração de protocolo.
- O fluxo de anexos, envolvidos, sigilo administrativo e IA deve ser especificado em features próprias ou em evoluções posteriores desta feature.

---

## 20. Observação final

Essa versão está alinhada ao recorte atual do MVP e ao comportamento implementado no caso de uso `RegisterManifestationUseCase`.
