# Especificação da Feature: Finalizar Manifestação

## 1. Identificação

| Campo          | Descrição                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Caso de uso    | UC-06 (parcial — somente encerramento)                                                                                                                                       |
| Nome           | Finalizar manifestação                                                                                                                                                       |
| Feature        | Encerramento da manifestação pelo manifestante                                                                                                                               |
| Ator principal | Manifestante                                                                                                                                                                 |
| Prioridade     | Alta                                                                                                                                                                         |
| Status         | Encerramento implementado de ponta a ponta (domínio, aplicação, presentation, infra, rota HTTP, e2e). Avaliação do atendimento (UC-06 completo Cockburn) permanece pendente. |

---

## 2. Objetivo

Permitir que o manifestante identificado encerre formalmente uma manifestação respondida pela ouvidoria, transitando o status para `finalized`.

A avaliação do atendimento, prevista no UC-06 completo, não faz parte desta fatia.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| RF15   | O sistema deve permitir encerramento da manifestação pelo usuário quando atendidas as condições de fechamento definidas pela ouvidoria. |
| RN05   | O tratamento das manifestações deve manter rastreabilidade de interações, respostas, alterações de status e responsáveis por cada ação. |
| RN06   | Manifestações finalizadas ou canceladas não devem aceitar edição direta do conteúdo original.                                           |
| RNF09  | O sistema deve manter histórico suficiente para rastrear alterações de status, mensagens, respostas administrativas e encerramentos.    |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- encerrar uma manifestação identificada do próprio manifestante;
- exigir que a manifestação esteja em `answered` para aceitar o encerramento;
- transitar o status da manifestação para `finalized`;
- persistir a transição e o histórico de encerramento por contrato administrativo atômico;
- retornar o estado atualizado da manifestação.

### 4.2 Não incluído

Esta feature não contempla:

- avaliação do atendimento (rating, comentário, entidade `ManifestationEvaluation`);
- regra de duplicidade de avaliação;
- relatórios de satisfação;
- encerramento de manifestação anônima por protocolo;
- encerramento administrativo (coberto pelo UC-07 via `UpdateManifestationStatusUseCase`);
- notificações de encerramento ao manifestante.

---

## 5. Ator principal

### Manifestante

Usuário autenticado, autor identificado da manifestação, que deseja concluir formalmente o atendimento após receber resposta da ouvidoria.

---

## 6. Pré-condições

Para executar o encerramento:

- o usuário deve estar autenticado;
- a manifestação deve existir;
- a manifestação deve pertencer ao `userId` informado;
- a manifestação deve estar no status `answered`;
- a infraestrutura de persistência deve disponibilizar consulta da manifestação e persistência auditável do encerramento.

---

## 7. Pós-condições

Após operação bem-sucedida:

- o status da manifestação passa a `finalized`;
- a transição fica persistida no agregado;
- a manifestação não aceita mais mensagens nem novas transições administrativas, conforme guardas existentes;
- o histórico permanece rastreável pelas projeções de leitura já modeladas.

---

## 8. Entradas

### 8.1 Encerramento pelo manifestante

| Campo           | Tipo   | Obrigatório | Descrição                                         |
| --------------- | ------ | ----------- | ------------------------------------------------- |
| userId          | string | Sim         | Identificador do manifestante autenticado.        |
| manifestationId | string | Sim         | Identificador da manifestação que será encerrada. |

#### Exemplo de entrada

```json
{
  "userId": "user-1",
  "manifestationId": "manifestation-1"
}
```

---

## 9. Regras de negócio

| Código     | Regra                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| RN-UC06-01 | Apenas o autor identificado da manifestação pode encerrá-la por este fluxo.                                                                      |
| RN-UC06-02 | Manifestações anônimas não podem ser encerradas pelo fluxo identificado.                                                                         |
| RN-UC06-03 | A manifestação só pode ser encerrada quando estiver no status `answered`.                                                                        |
| RN-UC06-04 | Manifestações em `in_analysis` não podem ser encerradas pelo manifestante.                                                                       |
| RN-UC06-05 | Manifestações em estado terminal (`finalized`, `canceled`) não podem ser reencerradas.                                                           |
| RN-UC06-06 | A transição para `finalized` deve ficar encapsulada na entidade `Manifestation` por `finalizeByAuthor()`.                                        |
| RN-UC06-07 | A persistência da transição deve ocorrer por um contrato administrativo que registre ator, status anterior e status final em uma única operação. |

---

## 10. Validações

### 10.1 Propriedade da manifestação

O par `manifestationId` e `userId` deve:

- localizar uma manifestação existente;
- corresponder a uma manifestação identificada;
- corresponder à autoria do usuário autenticado.

### 10.2 Status para encerramento

Para encerramento pelo manifestante:

- o status atual da manifestação deve ser exatamente `answered`;
- qualquer outro status atual deve bloquear a operação.

Observação:
A guarda fica encapsulada em `Manifestation.finalizeByAuthor()` e é mais estrita que a transição administrativa (`transitionStatusAdministratively`), que aceita partir de `in_analysis` ou `answered`.

---

## 11. Fluxo principal

1. O manifestante seleciona uma manifestação respondida.
2. O sistema localiza a manifestação por identificador.
3. O sistema valida que a manifestação pertence ao manifestante autenticado.
4. O agregado aplica a transição `answered → finalized`.
5. O sistema persiste o novo status com metadados de auditoria do ator e da transição.
6. O sistema retorna o estado atualizado da manifestação.

---

## 12. Fluxos alternativos

### FA01 - Manifestação inexistente

Condição:
O identificador informado não corresponde a nenhuma manifestação.

Comportamento esperado:
O sistema deve falhar com erro de manifestação não encontrada.

### FA02 - Manifestação de outro autor

Condição:
A manifestação existe, mas a autoria identificada não corresponde ao `userId` informado.

Comportamento esperado:
O sistema deve bloquear o encerramento antes de tocar no agregado.

### FA03 - Manifestação anônima

Condição:
A manifestação existe, mas `authorUserId` é `null`.

Comportamento esperado:
O sistema deve bloquear o encerramento pelo fluxo identificado.

### FA04 - Manifestação ainda em análise

Condição:
A manifestação está em `in_analysis`.

Comportamento esperado:
O sistema deve falhar com erro de transição não permitida, deixando o status inalterado.

### FA05 - Manifestação em estado terminal

Condição:
A manifestação já está em `finalized` ou `canceled`.

Comportamento esperado:
O sistema deve falhar com erro de transição não permitida, deixando o status inalterado.

---

## 13. Saída de sucesso

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
    "authorUserId": "user-1",
    "createdAt": "2026-05-10T12:00:00.000Z"
  }
}
```

---

## 14. Erros esperados

### 14.1 Manifestação não encontrada

Condição:
Nenhuma manifestação encontrada para o identificador informado.

Erro esperado:
`ManifestationNotFoundError`

### 14.2 Acesso não permitido

Condição:
A manifestação pertence a outro autor ou é anônima neste fluxo.

Erro esperado:
`NotAllowedToAccessManifestationError`

### 14.3 Transição não permitida

Condição:
A manifestação está em `in_analysis`, `finalized` ou `canceled`.

Erro esperado:
`ManifestationStatusTransitionNotAllowedError`

---

## 15. Regras de segurança

- o encerramento deve respeitar a autoria identificada da manifestação;
- o sistema não deve expor nem encerrar manifestação de outro usuário neste fluxo;
- manifestações anônimas devem ser tratadas por fluxos específicos baseados em protocolo;
- transições inválidas de status não devem ser persistidas;
- a camada de apresentação mapeia erros de autorização, inexistência e transição conforme o contrato HTTP atual (Fastify) — ver detalhes do `FinalizeManifestationController` na seção 19.

---

## 16. Critérios de aceite

- o sistema deve encerrar manifestação `answered` pertencente ao manifestante autenticado;
- o sistema deve bloquear encerramento de manifestação de outro usuário;
- o sistema deve bloquear encerramento de manifestação anônima por este fluxo;
- o sistema deve bloquear encerramento de manifestação que não esteja em `answered`;
- o sistema deve bloquear encerramento de manifestação já em estado terminal;
- o sistema deve persistir a transição antes de retornar a saída.

---

## 17. Casos de teste

### 17.1 Testes unitários do caso de uso

#### CT-UC06-001 - Deve encerrar manifestação respondida do próprio manifestante

- dado `manifestationId` existente, pertencente ao `userId` e com status `answered`;
- quando o caso de uso de encerramento for executado;
- então o agregado deve transitar para `finalized`, `ManifestationAdministrationRepository.finalizeByAuthor(...)` deve ser chamado com `actorUserId`, `actorType`, `fromStatus` e `toStatus`, e a saída deve refletir o novo status.

#### CT-UC06-002 - Não deve encerrar manifestação inexistente

- dado `manifestationId` inexistente;
- quando o caso de uso de encerramento for executado;
- então deve lançar `ManifestationNotFoundError`;
- e o repositório não deve persistir alterações.

#### CT-UC06-003 - Não deve encerrar manifestação de outro usuário

- dado `manifestationId` existente com autoria identificada diferente do `userId`;
- quando o caso de uso de encerramento for executado;
- então deve lançar `NotAllowedToAccessManifestationError`;
- e o repositório não deve persistir alterações.

#### CT-UC06-004 - Não deve encerrar manifestação anônima

- dado `manifestationId` existente com `authorUserId` igual a `null`;
- quando o caso de uso de encerramento for executado;
- então deve lançar `NotAllowedToAccessManifestationError`;
- e o repositório não deve persistir alterações.

#### CT-UC06-005 - Não deve encerrar manifestação em análise

- dado `manifestationId` existente pertencente ao `userId` com status `in_analysis`;
- quando o caso de uso de encerramento for executado;
- então deve lançar `ManifestationStatusTransitionNotAllowedError`;
- e o repositório não deve persistir alterações.

#### CT-UC06-006 - Não deve encerrar manifestação já finalizada

- dado `manifestationId` existente pertencente ao `userId` com status `finalized`;
- quando o caso de uso de encerramento for executado;
- então deve lançar `ManifestationStatusTransitionNotAllowedError`.

#### CT-UC06-007 - Não deve encerrar manifestação cancelada

- dado `manifestationId` existente pertencente ao `userId` com status `canceled`;
- quando o caso de uso de encerramento for executado;
- então deve lançar `ManifestationStatusTransitionNotAllowedError`.

#### CT-UC06-008 - Deve propagar falhas de persistência auditável após a transição

- dado `manifestationId` existente pertencente ao `userId` com status `answered`;
- quando o contrato administrativo falhar ao persistir o encerramento;
- então o erro deve ser propagado.

---

## 18. Sugestão de tipos

```ts
export interface FinalizeManifestationInput {
  userId: string
  manifestationId: string
}

export class Manifestation extends Entity<ManifestationProps> {
  finalizeByAuthor(): void
}

export interface ManifestationsRepository {
  findById(manifestationId: string): Promise<Manifestation | null>
}

export interface ManifestationAdministrationRepository {
  finalizeByAuthor(params: {
    manifestation: Manifestation
    actorUserId: string
    actorType: 'manifestant'
    fromStatus: ManifestationStatus
    toStatus: ManifestationStatus
  }): Promise<void>
}
```

---

## 19. Observações de implementação

- a transição `answered → finalized` fica em `Manifestation.finalizeByAuthor()` para manter o invariante no domínio e separar do método mais permissivo `transitionStatusAdministratively()` usado no UC-07;
- a autorização reaproveita `manifestation.belongsTo(userId)`, mesmo padrão usado no `AddManifestationMessageUseCase` (UC-05), cobrindo "outro autor" e "anônima" com `NotAllowedToAccessManifestationError`;
- o `ManifestationStatusTransitionNotAllowedError` é exportado pelo módulo de domínio de `Manifestation`, sem entrada nova em pasta de erros da aplicação;
- o use case não consulta `UsersRepository`: a identidade é tratada como dado de entrada e a verificação de autoria é suficiente para esta fatia;
- a saída do use case repete o contrato de leitura usado no `UpdateManifestationStatusUseCase` (UC-07), preservando consistência entre fluxos que retornam o agregado atualizado;
- a persistência do encerramento foi deslocada para `ManifestationAdministrationRepository.finalizeByAuthor(...)`, permitindo que a infraestrutura grave mudança de status e histórico do ator em fronteira única;
- a avaliação do atendimento (UC-06 completo) permanece como backlog pós-MVP, sem entidade nem use case implementado nesta fatia;
- a camada de apresentação fornece `FinalizeManifestationController` em `src/presentation/controllers/manifestation/`, que extrai `manifestationId` de `request.params`, deriva `userId` do contexto autenticado, e mapeia: `ManifestationNotFoundError` → `404`, `NotAllowedToAccessManifestationError` → `403`, e `ManifestationStatusTransitionNotAllowedError` → `409 Conflict` (transição inválida a partir do status corrente); sem usuário autenticado retorna `401` e `manifestationId` vazio retorna `400 MissingParamError`;
- a infraestrutura concreta materializa a fronteira transacional única: `PrismaManifestationAdministrationRepository.finalizeByAuthor(...)` (`src/infra/database/prisma/repositories/`) executa o `UPDATE manifestations` + `INSERT manifestation_messages` (system) dentro do mesmo `prisma.$transaction`, garantindo que a mudança de status e o registro histórico do ator (encoded em JSON por `system-message-payload.ts`, com `type: 'finalized_by_author'`, `actorUserId`, `fromStatus`, `toStatus`) nunca divirjam;
- o endpoint `POST /manifestations/:manifestationId/finalize` é registrado em `src/main/routes/manifestation.routes.ts` com `preHandler: [ensureAuthenticated, requireRoles(UserRole.MANIFESTANT)]`;
- cobertura e2e em `test/e2e/manifestation-interaction.e2e.spec.ts` exercita o ciclo completo: ombudsman responde via `POST /admin/.../answer` → manifestante finaliza com `POST /finalize` (`200`); valida `status='finalized'`, último entry do `history` com `type='finalized_by_author'`/`fromStatus='answered'`/`toStatus='finalized'`, e `manifestationMessage.count({ senderType: 'system' })` igual a `2` (transição da resposta + transição da finalização). Também cobre `409` ao finalizar antes da resposta, `403` para outro manifestante, e `401` sem auth.

---

## 20. Observação final

Esta feature documenta o recorte mínimo de encerramento pelo manifestante. A avaliação do atendimento, prevista no UC-06 completo da Cockburn, deverá ser tratada em especificação complementar quando o escopo de avaliação entrar no roadmap, possivelmente com:

- `EvaluateManifestationUseCase`;
- entidade `ManifestationEvaluation`;
- contrato de leitura para satisfação;
- regras de unicidade e janela de avaliação.
