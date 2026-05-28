# Especificação da Feature: Notificações de Manifestação

## 1. Identificação

| Campo          | Descrição                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------- |
| Caso de uso    | UC-05d (complementar — notificações do UC-05 e do UC-07)                                     |
| Nome           | Notificar atualizações da manifestação                                                       |
| Feature        | Notificação por e-mail ao autor (mudança de status) e à unidade responsável (encaminhamento) |
| Ator principal | Sistema (gatilho automático)                                                                 |
| Prioridade     | Média                                                                                        |
| Status         | Implementado de ponta a ponta (aplicação, infra de e-mail, wiring). Disparo best-effort.     |

---

## 2. Objetivo

Notificar automaticamente as partes interessadas sobre eventos relevantes da manifestação:

- o **autor identificado** recebe e-mail quando o status da sua manifestação muda (RF17);
- os **responsáveis da unidade administrativa** recebem e-mail quando uma manifestação é encaminhada ao setor (apoio ao tratamento do UC-07).

Esta feature é transversal: o gatilho vem dos casos de uso administrativos (UC-07) e do encerramento pelo autor (UC-06), mas a notificação ao manifestante pertence ao escopo de acompanhamento (UC-05, RF17).

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                                                                                                                 |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF17   | O sistema deve notificar o usuário sobre atualizações relevantes da manifestação (abertura, encaminhamento, resposta, encerramento), respeitadas as restrições de manifestações anônimas. |
| RN03   | Manifestações anônimas devem preservar o anonimato — não há canal de notificação direta ao autor anônimo.                                                                                 |
| RN05   | O tratamento deve manter rastreabilidade de interações, respostas, alterações de status e responsáveis por cada ação.                                                                     |
| RNF08  | O sistema deve proteger dados pessoais e sensíveis.                                                                                                                                       |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- enviar e-mail ao autor identificado quando o status da manifestação muda;
- traduzir o status para um rótulo legível em português no corpo do e-mail;
- evitar reenvio repetido da notificação de `answered` dentro de uma janela de cooldown;
- enviar e-mail aos responsáveis (perfis `ombudsman`/`admin`) da unidade-alvo quando há encaminhamento;
- expressar as notificações por contratos de aplicação (`ManifestationStatusNotifier`, `AdministrativeUnitForwardingNotifier`), injetados de forma opcional nos casos de uso.

### 4.2 Não incluído

Esta feature não contempla:

- notificação ao autor **anônimo** (sem e-mail identificado — preserva RN03);
- notificações in-app, push ou SMS (apenas e-mail nesta fatia);
- preferências de opt-in/opt-out por usuário;
- gestão (CRUD) de responsáveis de unidade por HTTP — a associação é feita por dados/seed nesta fatia;
- fila/retry assíncrono de envio (o disparo ocorre no fluxo da request).

---

## 5. Ator principal

### Sistema

O envio é um efeito colateral automático disparado pelos casos de uso, não uma ação direta de um usuário. Os destinatários são o autor identificado da manifestação e os responsáveis da unidade encaminhada.

---

## 6. Pré-condições

- Um `EmailSender` está disponível e wired.
- Para a notificação de status: a manifestação possui autor identificado (`authorUserId !== null`) e o autor existe no repositório.
- Para a notificação de encaminhamento: a unidade-alvo possui responsáveis cadastrados (`AdministrativeUnitResponsiblesRepository`).

---

## 7. Pós-condições

- Quando aplicável, um ou mais e-mails são enviados às partes interessadas.
- A operação de notificação não altera o estado do agregado.
- A notificação ocorre **após** a persistência auditável da transição (a mudança de estado já está commitada).

---

## 8. Gatilhos (quando cada notificação dispara)

| Caso de uso (origem)                        | Notifier disparado                                                     | Condição de disparo                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `AnswerManifestationUseCase` (UC-07)        | `ManifestationStatusNotifier`                                          | `previousStatus !== status` (transição para `answered`)                                   |
| `UpdateManifestationStatusUseCase` (UC-07)  | `ManifestationStatusNotifier`                                          | `previousStatus !== status`                                                               |
| `CancelManifestationUseCase` (UC-07)        | `ManifestationStatusNotifier`                                          | `previousStatus !== status` (→ `canceled`)                                                |
| `ForwardManifestationToUnitUseCase` (UC-07) | `ManifestationStatusNotifier` + `AdministrativeUnitForwardingNotifier` | status notifier só se houve mudança; forwarding notifier **sempre** após o encaminhamento |
| `FinalizeManifestationUseCase` (UC-06)      | `ManifestationStatusNotifier`                                          | `previousStatus !== status` (→ `finalized`)                                               |

Em todos os casos o notifier é injetado de forma **opcional** (`notifier?.notify(...)`): onde não estiver wired, o caso de uso opera normalmente sem notificar.

---

## 9. Regras de negócio

| Código      | Regra                                                                                                                                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN-UC05d-01 | A notificação de status só é enviada para manifestações com autor identificado; anônimas não geram e-mail (preserva RN03).                                                                                                          |
| RN-UC05d-02 | Se o autor não for encontrado no repositório, a notificação é silenciosamente ignorada.                                                                                                                                             |
| RN-UC05d-03 | A notificação de `answered` respeita um cooldown de 5 minutos por (autor, manifestação), evitando reenvios em respostas administrativas próximas.                                                                                   |
| RN-UC05d-04 | O corpo do e-mail traduz o status para rótulo PT-BR (`in_analysis` → "colocada em análise", `awaiting_unit` → "encaminhada ao setor responsável", `answered` → "respondida", `canceled` → "cancelada", `finalized` → "finalizada"). |
| RN-UC05d-05 | A notificação de encaminhamento vai apenas aos responsáveis com perfil `ombudsman` ou `admin` da unidade-alvo.                                                                                                                      |
| RN-UC05d-06 | A notificação ocorre após a persistência da transição; falha de envio não desfaz a mudança de status já gravada.                                                                                                                    |

---

## 10. Validações

Não há validação de entrada de usuário (gatilho interno). As guardas relevantes são:

- status notifier: `authorUserId` presente; autor existente; cooldown para `answered`.
- forwarding notifier: recipientes filtrados por papel administrativo.

---

## 11. Fluxo principal

### 11.1 Notificação de status (ao autor)

1. Um caso de uso administrativo (ou de encerramento) altera o status e persiste a transição.
2. Se o status mudou, o caso de uso chama `manifestationStatusNotifier.notify(manifestation)`.
3. O notifier verifica autor identificado; carrega o autor; aplica o cooldown de `answered`.
4. O notifier envia o e-mail com o rótulo de status e o protocolo.
5. Para `answered`, registra o instante do envio para o cooldown.

### 11.2 Notificação de encaminhamento (à unidade)

1. `ForwardManifestationToUnitUseCase` persiste o encaminhamento.
2. O caso de uso chama `administrativeUnitForwardingNotifier.notify(manifestation, targetUnit)`.
3. O notifier busca os responsáveis da unidade (`findUsersByAdministrativeUnitId`).
4. Filtra para perfis `ombudsman`/`admin`.
5. Envia um e-mail a cada responsável com o protocolo e o nome da unidade.

---

## 12. Fluxos alternativos

### FA01 — Manifestação anônima

`authorUserId === null`. A notificação de status é ignorada; nenhum e-mail é enviado ao autor.

### FA02 — Autor inexistente

O autor não é localizado em `usersRepository.findById`. A notificação de status é ignorada.

### FA03 — `answered` dentro do cooldown

Já houve notificação de `answered` para a mesma (autor, manifestação) há menos de 5 minutos. O e-mail não é reenviado.

### FA04 — Unidade sem responsáveis

A unidade-alvo não possui responsáveis (ou nenhum com papel administrativo). Nenhum e-mail de encaminhamento é enviado.

---

## 13. Saídas / conteúdo dos e-mails

### 13.1 Mudança de status (ao autor)

```text
Assunto: Manifestação OUV-2026-K7F9Q2 atualizada
Corpo:   A manifestação OUV-2026-K7F9Q2 foi respondida! Verifique o sistema.
```

### 13.2 Encaminhamento (aos responsáveis da unidade)

```text
Assunto: Manifestação OUV-2026-K7F9Q2 encaminhada
Corpo:   A manifestação OUV-2026-K7F9Q2 foi encaminhada para Coordenação de Sistemas. Acesse o sistema para gerenciá-la.
```

---

## 14. Erros esperados

Não há erros de domínio expostos por contrato. As notificações são efeitos colaterais:

- a chamada de `notify(...)` é **aguardada** após a persistência. Como a transição já foi commitada, uma eventual falha do `EmailSender` não reverte o estado, mas pode propagar como `500` ao chamador da operação que disparou a notificação. Tornar o disparo totalmente assíncrono/resiliente é uma evolução futura (ver §20).

---

## 15. Regras de segurança e privacidade

- manifestações anônimas nunca recebem e-mail (não há e-mail identificado; preserva RN03);
- o corpo do e-mail não expõe descrição, conteúdo de mensagens nem dados internos — apenas protocolo e status/unidade;
- destinatários do encaminhamento são limitados a perfis administrativos da unidade;
- o e-mail é o único canal nesta fatia; preferências e opt-out ficam para evolução.

---

## 16. Critérios de aceite

- mudança de status de manifestação identificada → e-mail ao autor com o rótulo correto;
- manifestação anônima → nenhum e-mail ao autor;
- duas respostas administrativas em < 5 min → apenas uma notificação de `answered`;
- encaminhamento → e-mail aos responsáveis administrativos da unidade-alvo;
- unidade sem responsáveis → nenhum e-mail de encaminhamento;
- falha de envio não desfaz a transição já persistida.

---

## 17. Casos de teste

### 17.1 Unit

- `ManifestationStatusEmailNotifier`: envia para autor identificado; ignora anônima; ignora autor inexistente; aplica cooldown de `answered` (com relógio injetável `now`); usa o rótulo de status correto.
- `AdministrativeUnitForwardingEmailNotifier`: envia a cada responsável administrativo; filtra perfis não administrativos; não envia quando não há responsáveis.
- Casos de uso (answer/finalize/update-status/cancel/forward): `notify` só é chamado quando há mudança de status; forwarding notifier é chamado no encaminhamento.

---

## 18. Sugestão de tipos

```ts
export interface ManifestationStatusNotifier {
  notify(manifestation: Manifestation): Promise<void>
}

export interface AdministrativeUnitForwardingNotifier {
  notify(manifestation: Manifestation, administrativeUnit: CatalogAdministrativeUnitRecordDTO): Promise<void>
}

export interface AdministrativeUnitResponsiblesRepository {
  findUsersByAdministrativeUnitId(administrativeUnitId: string): Promise<User[]>
  findAdministrativeUnitIdsByUserId(userId: string): Promise<string[]>
  saveResponsible(userId: string, administrativeUnitId: string): Promise<void>
  removeResponsible(userId: string, administrativeUnitId: string): Promise<void>
}

interface EmailSender {
  send(message: { to: string; subject: string; text: string }): Promise<void>
}
```

---

## 19. Observações de implementação

- Os contratos e suas implementações de e-mail vivem em `src/application/notifications/`: `ManifestationStatusEmailNotifier` e `AdministrativeUnitForwardingEmailNotifier`. Eles orquestram repositórios/`EmailSender` (todos contratos), mantendo-se livres de dependência concreta.
- `ManifestationStatusEmailNotifier` depende de `UsersRepository` + `EmailSender`; mantém em memória o mapa `answeredNotificationSentAtByKey` (`${authorUserId}:${manifestationId}:answered`) para o cooldown de `ANSWERED_NOTIFICATION_COOLDOWN_MS = 5 * 60 * 1000`. O relógio é injetável (`now`) para testabilidade. Só o status `answered` tem cooldown; os demais notificam a cada mudança.
- `AdministrativeUnitForwardingEmailNotifier` depende de `AdministrativeUnitResponsiblesRepository` + `EmailSender`; busca responsáveis da unidade e filtra `OMBUDSMAN`/`ADMIN` antes de enviar (em paralelo via `Promise.all`).
- Os notifiers são injetados como dependências **opcionais** (`?`) nos casos de uso `AnswerManifestationUseCase`, `UpdateManifestationStatusUseCase`, `CancelManifestationUseCase`, `ForwardManifestationToUnitUseCase` e `FinalizeManifestationUseCase`. Cada um chama `notify` somente após persistir a transição, e a notificação de status é guardada por `previousStatus !== manifestation.status`.
- O wiring concreto está em `src/main/factories/infrastructure.ts` (`new ManifestationStatusEmailNotifier(usersRepository, emailSender)` e `new AdministrativeUnitForwardingEmailNotifier(administrativeUnitResponsiblesRepository, emailSender)`) e a injeção nos controllers em `src/main/factories/controllers/{admin,manifestation}.ts`.
- A infraestrutura de responsáveis é `PrismaAdministrativeUnitResponsiblesRepository` (`src/infra/database/prisma/repositories/`). Nesta fatia, a associação responsável↔unidade é populada por dados/seed; os métodos `saveResponsible`/`removeResponsible` existem no contrato mas ainda não têm endpoint HTTP de gestão.
- O `EmailSender` concreto é o mesmo adapter usado por cadastro (UC-01), verificação (UC-1b) e recuperação de senha (UC-03), wired em `infrastructure.ts`.

---

## 20. Observação final

Esta feature cobre o recorte atual de notificações (RF17) por e-mail. Evoluções recomendadas: tornar o disparo resiliente/assíncrono (fila + retry) para desacoplar a request do envio, adicionar gestão HTTP de responsáveis de unidade, preferências de opt-out e canais adicionais (in-app/push). O princípio de não notificar autor anônimo e de não expor dados internos no corpo do e-mail deve ser preservado.
