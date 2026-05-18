# Especificação da Feature: Anexos de Manifestação

## 1. Identificação

| Campo          | Descrição                                                                               |
| -------------- | --------------------------------------------------------------------------------------- |
| Caso de uso    | UC-05 (complementar — anexos)                                                           |
| Nome           | Gerenciar anexos de manifestação                                                        |
| Feature        | Upload, listagem em detalhe e emissão de download temporário para anexos privados       |
| Ator principal | Manifestante                                                                            |
| Prioridade     | Alta                                                                                    |
| Status         | Implementado de ponta a ponta (application, presentation, infra, rotas HTTP, unit, e2e) |

---

## 2. Objetivo

Permitir que o frontend envie anexos para manifestações identificadas ou anônimas, liste os metadados públicos desses anexos nos detalhes disponíveis ao ator correto e obtenha uma `download-url` temporária sem expor segredos internos de storage.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| RF12   | O sistema deve permitir ao manifestante consultar suas manifestações conforme autorização de acesso.                                    |
| RF13   | O sistema deve exibir o status atual, o histórico de movimentações e as interações relacionadas à manifestação.                         |
| RF18   | O sistema deve permitir que perfis administrativos autorizados visualizem e gerenciem as manifestações registradas.                     |
| RN03   | Manifestações anônimas devem preservar o anonimato do manifestante em todos os fluxos de consulta e atendimento.                        |
| RN04   | Apenas perfis autorizados podem operar fluxos administrativos.                                                                          |
| RN05   | O tratamento das manifestações deve manter rastreabilidade de interações, respostas, alterações de status e responsáveis por cada ação. |
| RNF07  | O sistema deve exigir autenticação e aplicar autorização por perfil, respeitando restrições de acesso a manifestações sigilosas.        |
| RNF11  | O sistema deve responder em tempo aceitável para operações de consulta, registro de manifestações e interação com anexos.               |

Observação:
o recorte atual é um refinamento de implementação do MVP. A remoção, substituição e upload administrativo de anexos continuam fora do escopo.

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- upload identificado por `POST /manifestations/:manifestationId/attachments`;
- upload anônimo por `POST /manifestations/track/attachments`;
- retorno de `attachments[]` em `GET /manifestations/:manifestationId`;
- retorno de `attachments[]` em `GET /admin/manifestations/:manifestationId`;
- retorno de `attachments[]` públicos em `POST /manifestations/track/details`;
- emissão de `download-url` curta para fluxo identificado, anônimo e administrativo;
- armazenamento privado do binário com mediação obrigatória do backend;
- persistência de apenas metadados públicos no contrato HTTP.

### 4.2 Não incluído

Esta feature não contempla:

- anexos inline em `POST /manifestations`;
- envio de múltiplos arquivos no mesmo request;
- remoção, substituição ou edição de anexos;
- upload administrativo por `ombudsman` ou `admin`;
- anexos em mensagens;
- URL pública permanente de storage;
- antivírus, content sniffing avançado além da assinatura do arquivo, ou inspeção semântica do conteúdo.

---

## 5. Atores

### 5.1 Manifestante autenticado

Pode enviar anexos para a própria manifestação identificada, visualizar `attachments[]` no detalhe identificado e obter `download-url` de seus anexos.

### 5.2 Manifestante anônimo

Pode enviar anexos para a própria manifestação usando `protocol` + `accessCode`, visualizar `attachments[]` públicos em `track/details` e obter `download-url` dos anexos visíveis nesse fluxo.

### 5.3 Ouvidor ou administrador

Pode visualizar `attachments[]` no detalhe administrativo e obter `download-url` curta por rota `/admin/...`.

---

## 6. Contratos HTTP relevantes

### 6.1 Upload identificado

- `POST /manifestations/:manifestationId/attachments`
- autenticação Bearer obrigatória de `manifestant`
- `multipart/form-data`
- campo obrigatório: `file`

### 6.2 Upload anônimo

- `POST /manifestations/track/attachments`
- sem Bearer obrigatório
- `multipart/form-data`
- campos obrigatórios: `protocol`, `accessCode`, `file`

### 6.3 Download temporário

- `POST /manifestations/:manifestationId/attachments/:attachmentId/download-url`
- `POST /manifestations/track/attachments/:attachmentId/download-url`
- `POST /admin/manifestations/:manifestationId/attachments/:attachmentId/download-url`

Todos retornam:

```json
{
  "downloadUrl": "https://storage.example/signed-url"
}
```

### 6.4 DTO público de anexo

```json
{
  "id": "attachment-1",
  "originalName": "evidence.pdf",
  "mimeType": "application/pdf",
  "sizeInBytes": 1024,
  "uploadedByType": "manifestant",
  "createdAt": "2026-05-10T15:30:00.000Z"
}
```

Campos nunca expostos:

- `storageKey`
- bucket de storage
- URL permanente
- `uploadedByUserId`

---

## 7. Regras de negócio

| Código      | Regra                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| RN-UC05c-01 | Upload de anexo aceita exatamente `1` arquivo por request.                                                          |
| RN-UC05c-02 | O frontend deve repetir a chamada para múltiplos anexos até o limite de `5` anexos por manifestação.                |
| RN-UC05c-03 | O binário deve ser privado e o download público só pode ocorrer via `download-url` temporária emitida pelo backend. |
| RN-UC05c-04 | O contrato HTTP expõe apenas metadados públicos do anexo.                                                           |
| RN-UC05c-05 | O upload identificado só é permitido ao manifestante autor autenticado.                                             |
| RN-UC05c-06 | O upload anônimo só é permitido com `protocol` + `accessCode` válidos da manifestação anônima.                      |
| RN-UC05c-07 | O fluxo administrativo, nesta entrega, apenas lista anexos e emite `download-url`; não realiza upload.              |
| RN-UC05c-08 | O rastreio anônimo só pode expor anexos públicos do manifestante identificado ou anônimo.                           |
| RN-UC05c-09 | Manifestações em estado terminal não podem receber novos anexos.                                                    |
| RN-UC05c-10 | O upload deve falhar quando o limite de quantidade for atingido.                                                    |
| RN-UC05c-11 | Se um upload falhar, anexos enviados com sucesso em chamadas anteriores permanecem válidos.                         |

---

## 8. Validações

### 8.1 Limites públicos

- máximo de `5` anexos por manifestação;
- máximo de `10 MB` por arquivo;
- MIME types aceitos: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.

### 8.2 Multipart

- o arquivo deve ser enviado no campo `file`;
- upload identificado não aceita campos extras;
- upload anônimo aceita apenas `protocol`, `accessCode` e `file`;
- arquivo ausente, campo duplicado, multipart inválido ou arquivo acima do limite resultam em `400`.

### 8.3 Visibilidade

- `GET /manifestations/:manifestationId` e `GET /admin/manifestations/:manifestationId` podem retornar todos os anexos visíveis ao ator daquele fluxo;
- `POST /manifestations/track/details` e `POST /manifestations/track/attachments/:attachmentId/download-url` só consideram anexos públicos;
- anexos internos administrativos não devem vazar para o rastreio anônimo.

---

## 9. Erros esperados

### 9.1 Upload identificado

- `400 Bad Request` — `InvalidParamError`, `MissingParamError`, `AttachmentFileEmptyError`, `AttachmentFileTooLargeError`, `AttachmentMimeTypeNotAllowedError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `NotAllowedToAccessManifestationError`
- `404 Not Found` — `ManifestationNotFoundError`
- `409 Conflict` — `ManifestationAttachmentsLimitExceededError`, `ManifestationCannotReceiveAttachmentsError`

### 9.2 Upload e download anônimos

- `400 Bad Request` — `ValidationError`, `InvalidParamError`, `MissingParamError`, `AttachmentFileEmptyError`, `AttachmentFileTooLargeError`, `AttachmentMimeTypeNotAllowedError`
- `404 Not Found` — `ManifestationTrackingNotFoundError`
- `409 Conflict` — `ManifestationAttachmentsLimitExceededError`, `ManifestationCannotReceiveAttachmentsError`

### 9.3 Download administrativo

- `400 Bad Request` — `MissingParamError`
- `401 Unauthorized` — `UnauthenticatedError`
- `403 Forbidden` — `NotAllowedToManageManifestationError`
- `404 Not Found` — `ManifestationNotFoundError`, `AttachmentNotFoundError`

---

## 10. Fluxos principais

### 10.1 Upload identificado

1. O frontend registra a manifestação por `POST /manifestations`.
2. O frontend envia um arquivo por vez em `POST /manifestations/:manifestationId/attachments`.
3. O backend retorna o DTO público do anexo criado.
4. O frontend atualiza a lista local ou reconsulta `GET /manifestations/:manifestationId`.

### 10.2 Upload anônimo

1. O frontend registra a manifestação anônima e guarda `protocol` + `accessCode`.
2. O frontend envia um arquivo por vez em `POST /manifestations/track/attachments`.
3. O backend retorna o DTO público do anexo criado.
4. O frontend pode reconsultar `POST /manifestations/track/details`.

### 10.3 Download

1. O frontend exibe `attachments[]` vindos do detalhe apropriado.
2. Ao clicar para baixar, o frontend chama o endpoint `.../download-url`.
3. O backend retorna `downloadUrl`.
4. O frontend usa a URL imediatamente para abrir ou baixar o arquivo.

---

## 11. Diretrizes para integração frontend

- não tente enviar `attachments[]` em `POST /manifestations`;
- trate upload como sequência de requests independentes;
- exiba progresso e erro por arquivo, não por lote global;
- não persista `downloadUrl` para reuso futuro;
- para anônimo, preserve `protocol` e `accessCode` no fluxo do usuário antes de oferecer upload ou download;
- use `attachments[]` retornado pelos detalhes como fonte de verdade visual;
- não infira URL de arquivo localmente.

---

## 12. Referências

- Contrato HTTP detalhado: `doc/api/frontend-integration.md`
- Fluxo identificado: `doc/features/UC5-watch-manifestation.md`
- Fluxo anônimo: `doc/features/UC5b-track-manifestation-by-protocol.md`
- Fluxo administrativo: `doc/features/UC7-manage-manifestations.md`
