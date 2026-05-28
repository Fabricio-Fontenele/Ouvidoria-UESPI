# Especificação da Feature: Catálogo de Campi e Unidades Administrativas

## 1. Identificação

| Campo          | Descrição                                                                 |
| -------------- | ------------------------------------------------------------------------- |
| Caso de uso    | UC-04b (complementar — catálogo de apoio ao UC-04 e ao UC-07)             |
| Nome           | Consultar catálogo de campi e unidades                                    |
| Feature        | Listagem pública do catálogo para preenchimento de formulários e filtros  |
| Ator principal | Usuário                                                                   |
| Prioridade     | Alta                                                                      |
| Status         | Implementado de ponta a ponta (aplicação, presentation, infra, rota HTTP) |

---

## 2. Objetivo

Expor o catálogo de campi e suas unidades administrativas, para que o frontend popule os seletores do formulário de manifestação (UC-04) e dos filtros administrativos (UC-07). O mesmo catálogo é a fonte de verdade usada **internamente** para validar `campusId`/`administrativeUnitId` no registro e no encaminhamento.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------- |
| RF06   | O sistema deve permitir o registro de manifestações nos tipos suportados.                         |
| RF07   | O sistema deve exigir, no registro, a seleção do campus e da unidade administrativa.              |
| RF19   | O sistema deve permitir filtrar manifestações por critérios como campus e unidade administrativa. |
| RN02   | Toda manifestação deve estar vinculada a um campus e a uma unidade administrativa.                |
| RNF11  | O sistema deve responder em tempo aceitável para operações de consulta.                           |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- listar publicamente os campi **ativos** e suas unidades administrativas **ativas**;
- expor, por campus, `id`, `label` (nome), `city` e a lista de unidades;
- expor, por unidade, `id`, `label` (nome) e `description`;
- servir como catálogo canônico de IDs para o formulário de manifestação e filtros admin;
- cachear a resposta por um TTL configurável para reduzir custo de consulta.

### 4.2 Não incluído

Esta feature não contempla:

- CRUD de campus ou unidade administrativa (carga é por seed/migração);
- exposição de itens inativos no catálogo público;
- paginação (o catálogo é pequeno e retornado inteiro);
- autenticação (endpoint público).

---

## 5. Ator principal

### Usuário

Qualquer consumidor do frontend (autenticado ou não), pois o catálogo é necessário antes mesmo do login para registrar manifestação anônima.

---

## 6. Pré-condições

- O catálogo de campi e unidades foi carregado (seed/migração).
- A infraestrutura de persistência disponibiliza a consulta pública.

---

## 7. Pós-condições

- O chamador recebe a projeção pública do catálogo (apenas itens ativos).
- Nenhum dado é alterado (operação de leitura).

---

## 8. Entradas

Não há parâmetros. O caso de uso `ListCatalogUseCase` recebe `undefined`.

### 8.1 Contrato HTTP atual

- `GET /catalog` — público (sem Bearer).

---

## 9. Regras de negócio

| Código      | Regra                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| RN-UC04b-01 | O catálogo público expõe apenas campi e unidades com `isActive = true`.                                     |
| RN-UC04b-02 | Cada unidade administrativa pertence a exatamente um campus (`campusId`).                                   |
| RN-UC04b-03 | Os IDs retornados são os IDs canônicos aceitos pelo registro (UC-04) e pelo encaminhamento (UC-07).         |
| RN-UC04b-04 | A consulta pública é apenas leitura e pode ser cacheada com TTL sem afetar a validação interna de registro. |

---

## 10. Validações

Não há validação de entrada (sem parâmetros). A consistência (unidade pertencente ao campus, item ativo) é garantida na origem dos dados e reaplicada na validação de registro/encaminhamento (UC-04 / UC-07), que usam `findCampusById`/`findAdministrativeUnitById`.

---

## 11. Fluxo principal

1. O frontend chama `GET /catalog`.
2. O caso de uso solicita `catalogRepository.listPublic()`.
3. A infraestrutura retorna campi ativos e unidades ativas, ordenados.
4. O sistema retorna `PublicCatalogDTO`.

---

## 12. Fluxos alternativos

Não há fluxos alternativos relevantes nesta fatia: a consulta é sempre `200 OK`. Catálogo vazio retorna `{ "campuses": [] }`.

---

## 13. Saída de sucesso

Status HTTP `200 OK`:

```json
{
  "campuses": [
    {
      "id": "campus-parnaiba",
      "label": "Campus Parnaíba",
      "city": "Parnaíba",
      "administrativeUnits": [
        {
          "id": "coord-sistemas",
          "label": "Coordenação de Sistemas",
          "description": "Coordenação do curso de Sistemas de Informação"
        }
      ]
    }
  ]
}
```

---

## 14. Erros esperados

Não há erros de domínio específicos. Falhas inesperadas de infraestrutura caem no `500 ServerError` padrão do `BaseController`.

---

## 15. Regras de segurança

- o catálogo é público e contém apenas dados institucionais não sensíveis (nomes de campus/unidade);
- itens inativos não são expostos, evitando seleção de unidades descontinuadas;
- a validação real de `campusId`/`administrativeUnitId` no registro não depende do que o cliente "viu" no catálogo: é refeita server-side contra o repositório (UC-04 §10.2/§10.3).

---

## 16. Critérios de aceite

- `GET /catalog` retorna `200` com a árvore `campuses[] → administrativeUnits[]`;
- apenas campi e unidades ativos aparecem;
- cada unidade carrega `id`, `label`, `description`; cada campus carrega `id`, `label`, `city`;
- os IDs retornados são aceitos como `campusId`/`administrativeUnitId` no `POST /manifestations`.

---

## 17. Casos de teste

### 17.1 Unit

- `ListCatalogUseCase`: delega a `catalogRepository.listPublic()` e devolve a projeção sem alteração.
- `CachedCatalogRepository`: serve do cache enquanto não expira; refaz a consulta após o TTL.

### 17.2 E2E

- `GET /catalog` retorna a estrutura esperada após o seed; itens inativos não aparecem.

---

## 18. Sugestão de tipos

```ts
export interface PublicCatalogAdministrativeUnitDTO {
  id: string
  label: string
  description: string | null
}

export interface PublicCatalogCampusDTO {
  id: string
  label: string
  city: string | null
  administrativeUnits: PublicCatalogAdministrativeUnitDTO[]
}

export interface PublicCatalogDTO {
  campuses: PublicCatalogCampusDTO[]
}

export interface CatalogRepository {
  listPublic(): Promise<PublicCatalogDTO>
  findCampusById(id: string): Promise<CatalogCampusRecordDTO | null>
  findAdministrativeUnitById(id: string): Promise<CatalogAdministrativeUnitRecordDTO | null>
}
```

---

## 19. Observações de implementação

- `ListCatalogUseCase` (`src/application/use-cases/list-catalog/`) recebe `CatalogRepository` e apenas chama `listPublic()`.
- A camada de apresentação fornece `ListCatalogController` em `src/presentation/controllers/catalog/`, que sempre retorna `200` com o `PublicCatalogDTO`.
- O endpoint `GET /catalog` é registrado em `src/main/routes/catalog.routes.ts`, público (sem middleware de autenticação).
- A infraestrutura: `PrismaCatalogRepository.listPublic` (`src/infra/database/prisma/repositories/`) consulta com `where: { isActive: true }` em campus e unidades (unidades também filtradas por `isActive`), ordenadas por nome. `findCampusById`/`findAdministrativeUnitById` retornam `CatalogCampusRecordDTO`/`CatalogAdministrativeUnitRecordDTO` (com `isActive` e `campusId`), usados pela validação de registro (UC-04) e encaminhamento (UC-07).
- `CachedCatalogRepository` (`src/infra/database/cached-catalog-repository.ts`) decora o repositório Prisma cacheando `listPublic` por um TTL em memória, com invalidação interna.
- O mesmo `CatalogRepository` é injetado tanto neste caso de uso quanto no `RegisterManifestationUseCase` e no `ForwardManifestationToUnitUseCase`, garantindo que o catálogo exibido e o catálogo validado sejam a mesma fonte.

---

## 20. Observação final

Esta feature documenta o catálogo de apoio que sustenta os IDs canônicos de campus/unidade. Quando a gestão (CRUD) de campi e unidades entrar no escopo, este contrato público de leitura deve permanecer estável e continuar expondo apenas itens ativos.
