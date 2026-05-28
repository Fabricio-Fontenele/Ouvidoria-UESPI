# Especificação da Feature: Consultar Relatórios Gerenciais (Métricas)

## 1. Identificação

| Campo          | Descrição                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------- |
| Caso de uso    | UC-08                                                                                     |
| Nome           | Consultar relatórios gerenciais                                                           |
| Feature        | Métricas agregadas de manifestações (totais por status) para manifestante e administração |
| Ator principal | Administrador                                                                             |
| Prioridade     | Média                                                                                     |
| Status         | Implementado de ponta a ponta (aplicação, presentation, infra, rotas HTTP)                |

---

## 2. Objetivo

Fornecer uma visão agregada das manifestações na forma de contagem por status e total geral, em dois recortes:

- **manifestante**: métricas das próprias manifestações (para o painel pessoal);
- **administrativo**: métricas de todas as manifestações visíveis ao perfil, com filtros (tipo, campus, unidade, período, e "apenas as que eu atendo").

Esta é a primeira fatia do UC-08 canônico (relatórios gerenciais). Relatórios mais ricos (séries temporais, satisfação por atendente) ficam para evoluções futuras.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                    |
| ------ | -------------------------------------------------------------------------------------------- |
| RF24   | O sistema deve permitir consultar relatórios gerenciais disponíveis para perfis autorizados. |
| RF18   | O sistema deve permitir que perfis administrativos visualizem e gerenciem as manifestações.  |
| RF12   | O sistema deve permitir ao manifestante consultar suas manifestações conforme autorização.   |
| RNF04  | O sistema deve ser responsivo nos dispositivos suportados (consumo no painel).               |
| RNF08  | O sistema deve proteger dados pessoais e sensíveis.                                          |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- retornar `statusTotals` (contagem por `ManifestationStatus`) e `totalItems`;
- recorte do manifestante: apenas manifestações de autoria do usuário autenticado;
- recorte administrativo: todas as manifestações, com filtros opcionais (`type`, `campusId`, `administrativeUnitId`, `from`, `to`, `onlyMine`);
- restringir o recorte administrativo a perfis `ombudsman`/`admin`.

### 4.2 Não incluído

Esta feature não contempla:

- séries temporais, gráficos ou exportação (CSV/PDF);
- média de satisfação por atendente (o resumo individual do atendente está em `GET /me` — ver [UC-2b](./UC2b-current-user.md));
- relatórios cruzados entre campi/unidades além das contagens por status;
- filtro por `status` na métrica (redundante: o próprio `statusTotals` é a quebra por status).

---

## 5. Atores

### 5.1 Manifestante

Consulta as métricas das próprias manifestações via `GET /manifestations/metrics`.

### 5.2 Ouvidor / Administrador

Consulta as métricas administrativas (com filtros) via `GET /admin/manifestations/metrics`.

---

## 6. Pré-condições

- O ator está autenticado.
- No recorte administrativo, o ator possui perfil `ombudsman` ou `admin`.

---

## 7. Pós-condições

- O chamador recebe `{ statusTotals, totalItems }` consistente com o recorte e os filtros.
- Nenhum dado é alterado (operação de leitura).

---

## 8. Entradas

A identidade é derivada do JWT (`request.user.id`); o frontend nunca envia `userId`/`requesterUserId`.

### 8.1 Métrica do manifestante

Sem parâmetros. O caso de uso recebe `{ userId }`.

### 8.2 Métrica administrativa

Filtros opcionais como query params:

| Campo                | Tipo                | Descrição                                                              |
| -------------------- | ------------------- | ---------------------------------------------------------------------- |
| type                 | ManifestationType   | Filtra pelo tipo (validado contra o enum).                             |
| campusId             | string              | Filtra pelo campus.                                                    |
| administrativeUnitId | string              | Filtra pela unidade administrativa.                                    |
| from                 | ISO UTC (datetime)  | Criadas a partir desta data (`YYYY-MM-DDTHH:mm:ss.SSSZ`).              |
| to                   | ISO UTC (datetime)  | Criadas até esta data.                                                 |
| onlyMine             | `'true'`\|`'false'` | Quando `true`, restringe às manifestações em que o ator é o atendente. |

### 8.3 Contrato HTTP atual

- `GET /manifestations/metrics` — `preHandler: [ensureAuthenticated, requireRoles(MANIFESTANT)]`.
- `GET /admin/manifestations/metrics?type=complaint&campusId=campus-1&from=...&to=...&onlyMine=true` — `preHandler: [ensureAuthenticated, requireRoles(OMBUDSMAN, ADMIN)]`.

---

## 9. Regras de negócio

| Código     | Regra                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| RN-UC08-01 | A métrica do manifestante considera apenas manifestações cujo `authorUserId` é o usuário autenticado.                        |
| RN-UC08-02 | A métrica administrativa exige perfil `ombudsman` ou `admin`; demais perfis são bloqueados.                                  |
| RN-UC08-03 | `statusTotals` é um `Record<ManifestationStatus, number>` cobrindo todos os status, inclusive `awaiting_unit`.               |
| RN-UC08-04 | `totalItems` é o total de manifestações no recorte (soma das contagens por status, respeitados os filtros).                  |
| RN-UC08-05 | `onlyMine=true` mapeia para o filtro `attendantUserId = request.user.id`, restringindo às manifestações atendidas pelo ator. |
| RN-UC08-06 | `from`/`to` só são aceitos em timestamp ISO UTC completo; valores malformados são rejeitados como `InvalidParamError`.       |

---

## 10. Validações

- autenticação: sem `request.user` → `401 Unauthorized`.
- `type`: se presente, deve pertencer ao enum `ManifestationType`; senão `InvalidParamError('type')` → `400`.
- `onlyMine`: se presente, deve ser exatamente `'true'` ou `'false'`; senão `InvalidParamError('onlyMine')` → `400`.
- `from`/`to`: se presentes, devem casar com `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$` e ser uma data válida; senão `InvalidParamError('from'|'to')` → `400`.
- autorização administrativa: `usersRepository.findById(requesterUserId)` deve existir e ter papel administrativo; senão `NotAllowedToManageManifestationError` → `403`.

---

## 11. Fluxo principal

### 11.1 Métrica do manifestante

1. O manifestante chama `GET /manifestations/metrics`.
2. O controller deriva `userId` do token.
3. O caso de uso chama `getMetricsByAuthorUserId(userId)`.
4. O sistema retorna `{ statusTotals, totalItems }`.

### 11.2 Métrica administrativa

1. O ator chama `GET /admin/manifestations/metrics` com filtros opcionais.
2. O controller valida e monta `AdminManifestationFilters` (incluindo `attendantUserId` quando `onlyMine=true`).
3. O caso de uso autoriza o ator pelo `role`.
4. O caso de uso chama `getMetricsForAdmin(filters)`.
5. O sistema retorna `{ statusTotals, totalItems }`.

---

## 12. Fluxos alternativos

### FA01 — Sem autenticação

`UnauthenticatedError` → **401** (ambos os endpoints; reforçado pelos middlewares).

### FA02 — Manifestante chamando rota admin

`requireRoles(OMBUDSMAN, ADMIN)` bloqueia no middleware → **403**.

### FA03 — Ator sem perfil administrativo (no caso de uso)

`NotAllowedToManageManifestationError` → **403**.

### FA04 — Filtro malformado (admin)

`type`/`onlyMine`/`from`/`to` inválidos → `InvalidParamError` → **400**.

---

## 13. Saída de sucesso

Status HTTP `200 OK` (mesmo formato nos dois recortes):

```json
{
  "statusTotals": {
    "in_analysis": 7,
    "awaiting_unit": 2,
    "answered": 5,
    "canceled": 1,
    "finalized": 9
  },
  "totalItems": 24
}
```

---

## 14. Erros esperados

| Condição                                  | Erro                                   | HTTP |
| ----------------------------------------- | -------------------------------------- | ---- |
| Sem autenticação                          | `UnauthenticatedError`                 | 401  |
| Manifestante em rota admin                | (middleware `requireRoles`)            | 403  |
| Ator sem perfil administrativo            | `NotAllowedToManageManifestationError` | 403  |
| `type`/`onlyMine`/`from`/`to` malformados | `InvalidParamError`                    | 400  |

---

## 15. Regras de segurança

- a métrica do manifestante é estritamente limitada à própria autoria (filtro por `authorUserId` no repositório);
- a métrica administrativa exige perfil autorizado, verificado no caso de uso além do middleware;
- a resposta é agregada (contagens), não expõe manifestações individuais nem dados pessoais;
- `from`/`to` em ISO UTC completo evitam ambiguidade de fuso na agregação por período.

---

## 16. Critérios de aceite

- manifestante autenticado → `200` com `statusTotals`/`totalItems` apenas das próprias manifestações;
- ombudsman/admin → `200` com métricas globais respeitando filtros;
- `onlyMine=true` restringe ao atendente atual;
- manifestante em rota admin → `403`;
- filtro malformado → `400`;
- sem token → `401`.

---

## 17. Casos de teste

### 17.1 Unit

- `GetUserManifestationMetricsUseCase`: delega a `getMetricsByAuthorUserId(userId)`.
- `GetAdminManifestationMetricsUseCase`: autoriza ombudsman/admin; lança `NotAllowedToManageManifestationError` para manifestante/usuário inexistente; repassa filtros (incluindo `attendantUserId`) a `getMetricsForAdmin`.

### 17.2 E2E

- Manifestante consulta `/manifestations/metrics` e recebe contagens das próprias manifestações.
- Admin consulta `/admin/manifestations/metrics` com `onlyMine=true` e recebe apenas as atendidas por ele.
- Manifestante em rota admin → `403`; filtro inválido → `400`.

---

## 18. Sugestão de tipos

```ts
export interface ManifestationMetrics {
  statusTotals: Record<ManifestationStatus, number>
  totalItems: number
}

interface GetUserManifestationMetricsInput {
  userId: string
}

interface GetAdminManifestationMetricsInput {
  requesterUserId: string
  filters?: AdminManifestationFilters
}

export interface AdminManifestationFilters {
  status?: ManifestationStatus
  type?: ManifestationType
  attendantUserId?: string
  campusId?: string
  administrativeUnitId?: string
  from?: Date
  to?: Date
}

export interface ManifestationsRepository {
  getMetricsByAuthorUserId(authorUserId: string): Promise<ManifestationMetrics>
  getMetricsForAdmin(filters: AdminManifestationFilters): Promise<ManifestationMetrics>
}
```

---

## 19. Observações de implementação

- `GetUserManifestationMetricsUseCase` (`src/application/use-cases/get-user-manifestation-metrics/`) recebe só `ManifestationsRepository` e delega a `getMetricsByAuthorUserId`.
- `GetAdminManifestationMetricsUseCase` (`src/application/use-cases/get-admin-manifestation-metrics/`) recebe `ManifestationsRepository` + `UsersRepository`; reusa `NotAllowedToManageManifestationError` (`manifestation-administration/errors/`) e delega a `getMetricsForAdmin(filters ?? {})`.
- A camada de apresentação fornece `GetUserManifestationMetricsController` (`src/presentation/controllers/manifestation/`) e `GetAdminManifestationMetricsController` (`src/presentation/controllers/admin/`). O admin controller faz o parse/validação dos query params (`type`, `campusId`, `administrativeUnitId`, `from`, `to`, `onlyMine`), traduz `onlyMine=true` em `filters.attendantUserId = request.user.id`, e mapeia `NotAllowedToManageManifestationError → 403`. Note que o controller de métricas **não** aceita filtro por `status` (a métrica já é a quebra por status).
- Os endpoints são registrados em `src/main/routes/manifestation.routes.ts` (`GET /manifestations/metrics`, com `requireRoles(MANIFESTANT)`) e `src/main/routes/admin.routes.ts` (`GET /admin/manifestations/metrics`, com `requireRoles(OMBUDSMAN, ADMIN)`).
- A infraestrutura: `PrismaManifestationsRepository.getMetricsByAuthorUserId` e `getMetricsForAdmin` materializam as contagens por status (`groupBy`/agregação) respeitando os filtros; `statusTotals` cobre todos os valores de `ManifestationStatus`.

---

## 20. Observação final

Esta feature entrega o recorte de métricas do UC-08 canônico. Evoluções (séries temporais, exportação, satisfação agregada por atendente, dashboards) devem ser adicionadas em revisões desta especificação, reaproveitando os contratos `ManifestationMetrics` e `AdminManifestationFilters`.
