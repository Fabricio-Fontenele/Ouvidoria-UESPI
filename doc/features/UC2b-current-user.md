# Especificação da Feature: Consultar Usuário Autenticado

## 1. Identificação

| Campo          | Descrição                                                                      |
| -------------- | ------------------------------------------------------------------------------ |
| Caso de uso    | UC-02b (complementar — sessão do UC-02)                                        |
| Nome           | Consultar usuário autenticado                                                  |
| Feature        | Recuperação do perfil da conta autenticada (`GET /me`)                         |
| Ator principal | Usuário autenticado                                                            |
| Prioridade     | Alta                                                                           |
| Status         | Implementado de ponta a ponta (aplicação, presentation, infra, rota HTTP, e2e) |

---

## 2. Objetivo

Permitir que o frontend recupere os dados públicos da conta autenticada a partir do token Bearer, sem precisar guardar esses dados localmente. Para atendentes (`ombudsman`/`admin`), a resposta também traz um resumo da avaliação média do atendimento recebido.

Esta feature complementa o UC-02, que apenas emite o token; aqui o token é trocado pela identidade corrente.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------ |
| RF02   | O sistema deve permitir a autenticação de usuários cadastrados e liberar acesso conforme perfil. |
| RF05   | O sistema deve permitir diferentes perfis de acesso: `manifestant`, `ombudsman`, `admin`.        |
| RNF07  | O sistema deve exigir autenticação e aplicar autorização por perfil.                             |

---

## 4. Escopo da feature

### 4.1 Incluído

- recuperar `id`, `name`, `email`, `role` e `createdAt` da conta autenticada;
- para atendentes, calcular `attendanceRating` (média e contagem das avaliações recebidas);
- derivar a identidade exclusivamente do token Bearer (`request.user.id`).

### 4.2 Não incluído

- edição de dados cadastrais (RF04, fora do MVP);
- listagem de outros usuários;
- exposição de hash de senha ou códigos de verificação/recuperação;
- métricas de manifestações (essas estão em [UC-8](./UC8-managerial-reports.md)).

---

## 5. Ator principal

### Usuário autenticado

Qualquer perfil (`manifestant`, `ombudsman`, `admin`) com um token Bearer válido.

---

## 6. Pré-condições

- O usuário possui um token Bearer válido.
- A conta correspondente ao `sub` do token ainda existe.

---

## 7. Pós-condições

- O chamador recebe a projeção pública da conta autenticada.
- Nenhum dado é alterado (operação de leitura).

---

## 8. Entradas

Não há body. A identidade vem do token Bearer; o caso de uso recebe apenas `userId` (derivado de `request.user.id`).

### 8.1 Contrato HTTP atual

- `GET /me` — `preHandler: ensureAuthenticated`. Requer `Authorization: Bearer <token>`.

---

## 9. Regras de negócio

| Código      | Regra                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| RN-UC02b-01 | A identidade é sempre derivada do token; o `userId` nunca é aceito por body/query/path.                      |
| RN-UC02b-02 | A resposta nunca inclui hash de senha, código de verificação ou código de recuperação.                       |
| RN-UC02b-03 | `attendanceRating` só é calculado quando `role ∈ {ombudsman, admin}`; para `manifestant` é sempre `null`.    |
| RN-UC02b-04 | `attendanceRating` é o resumo (`average`, `count`) das avaliações em que o usuário foi o atendente avaliado. |

---

## 10. Validações

- autenticação: ausência de `request.user` → `401 Unauthorized` (`UnauthenticatedError`).
- existência: `usersRepository.findById(userId)` deve retornar a conta; caso contrário `UserNotFoundError` → `404`.

---

## 11. Fluxo principal

1. O frontend chama `GET /me` com o token Bearer.
2. O middleware `ensureAuthenticated` injeta `request.user`.
3. O controller deriva `userId` de `request.user.id`.
4. O caso de uso carrega a conta por `findById`.
5. Se o perfil for atendente, calcula `attendanceRating` via `ManifestationEvaluationsRepository.getRatingSummaryByAttendantUserId`.
6. O sistema retorna a projeção pública da conta.

---

## 12. Fluxos alternativos

### FA01 — Sem autenticação

Sem token válido. `UnauthenticatedError` → **401**.

### FA02 — Conta inexistente

O `sub` do token não localiza nenhuma conta (ex.: usuário removido). `UserNotFoundError` → **404**.

---

## 13. Saída de sucesso

Status HTTP `200 OK`.

Manifestante:

```json
{
  "user": {
    "id": "user-1",
    "name": "Fabricio Fontenele",
    "email": "fabricio@email.com",
    "role": "manifestant",
    "createdAt": "2026-05-10T12:00:00.000Z",
    "attendanceRating": null
  }
}
```

Atendente (`ombudsman`/`admin`):

```json
{
  "user": {
    "id": "ombudsman-1",
    "name": "Maria Ouvidora",
    "email": "maria@uespi.br",
    "role": "ombudsman",
    "createdAt": "2026-05-10T12:00:00.000Z",
    "attendanceRating": { "average": 4.5, "count": 12 }
  }
}
```

Quando o atendente ainda não tem avaliações, `attendanceRating` é `{ "average": null, "count": 0 }`.

---

## 14. Erros esperados

| Condição          | Erro                   | HTTP |
| ----------------- | ---------------------- | ---- |
| Sem autenticação  | `UnauthenticatedError` | 401  |
| Conta inexistente | `UserNotFoundError`    | 404  |

---

## 15. Regras de segurança

- a identidade não é confiável a partir do cliente: vem do token validado pelo `@fastify/jwt`;
- a projeção pública omite credenciais e códigos sensíveis;
- `attendanceRating` agrega apenas avaliações em que o usuário é o atendente, sem expor avaliações individuais nem autores.

---

## 16. Critérios de aceite

- `GET /me` com token válido de manifestante → `200` com `attendanceRating: null`;
- `GET /me` com token de atendente → `200` com `attendanceRating: { average, count }`;
- atendente sem avaliações → `average: null`, `count: 0`;
- sem token → `401`;
- token de conta inexistente → `404`.

---

## 17. Casos de teste

### 17.1 Unit

- `GetMeUseCase`: retorna projeção pública para manifestante (`attendanceRating` null); calcula resumo para ombudsman/admin; lança `UserNotFoundError` quando `findById` retorna null; não consulta avaliações para manifestante.

### 17.2 E2E

- `GET /me` autenticado retorna o próprio perfil; sem token retorna `401`.

---

## 18. Sugestão de tipos

```ts
interface GetMeInput {
  userId: string
}

interface AttendantRatingSummary {
  average: number | null
  count: number
}

interface GetMeOutput {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    createdAt: Date
    attendanceRating: AttendantRatingSummary | null
  }
}

interface UsersRepository {
  findById(userId: string): Promise<User | null>
}

interface ManifestationEvaluationsRepository {
  getRatingSummaryByAttendantUserId(userId: string): Promise<AttendantRatingSummary>
}
```

---

## 19. Observações de implementação

- `GetMeUseCase` (`src/application/use-cases/get-me/`) depende de `UsersRepository` e `ManifestationEvaluationsRepository`. O conjunto de papéis atendentes é `ATTENDANT_ROLES = { OMBUDSMAN, ADMIN }`; só para esses ele chama `getRatingSummaryByAttendantUserId`.
- `UserNotFoundError` vive em `get-me/errors/`.
- A camada de apresentação fornece `GetMeController` em `src/presentation/controllers/auth/`: retorna `401 UnauthenticatedError` sem `request.user`, mapeia `UserNotFoundError → 404` e retorna `200` com a projeção.
- O endpoint `GET /me` é registrado em `src/main/routes/auth.routes.ts` com `preHandler: ensureAuthenticated`. Em produção, o proxy precisa rotear `/me` para o backend (caso clássico de drift de proxy — ver memória do projeto).
- A infraestrutura materializa os contratos: `PrismaUsersRepository.findById` e `PrismaManifestationEvaluationsRepository.getRatingSummaryByAttendantUserId`.

---

## 20. Observação final

Esta feature padroniza a recuperação da identidade autenticada no frontend. Quando a edição de dados cadastrais (RF04) entrar no escopo, o contrato de `/me` deve permanecer a fonte de verdade do perfil corrente.
