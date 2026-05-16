# Especificação da Feature: Consultar IA

## 1. Identificação

| Campo          | Descrição                                                 |
| -------------- | --------------------------------------------------------- |
| Caso de uso    | UC-09                                                     |
| Nome           | Consultar IA                                              |
| Feature        | Consulta institucional com apoio de IA                    |
| Ator principal | Usuário                                                   |
| Prioridade     | Alta                                                      |
| Status         | Núcleo e controller implementados / adapter HTTP pendente |

---

## 2. Objetivo

Permitir que o usuário envie mensagens a um assistente institucional de IA para obter orientação inicial, resposta baseada em conteúdo aprovado e indicação segura de quando a demanda deve seguir para tratamento formal.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------- |
| RF25   | O sistema deve permitir consulta a IA com respostas baseadas em conteúdo institucional aprovado.                          |
| RF26   | A IA deve apoiar a triagem inicial das demandas e orientar o usuário quando a demanda exigir tratamento formal.           |
| RF28   | A IA deve informar quando não possuir segurança suficiente para responder e encaminhar o usuário para atendimento formal. |
| RN07   | A IA não substitui decisão administrativa formal.                                                                         |
| RN08   | Somente conteúdos institucionais aprovados podem ser utilizados como base para as respostas da IA.                        |
| RNF10  | A IA não deve expor dados pessoais, informações sigilosas ou conteúdos restritos em suas respostas.                       |
| RNF11  | O sistema deve responder em tempo aceitável para operações de interação com IA.                                           |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- receber histórico da conversa e a nova mensagem do usuário;
- encaminhar a conversa a um gateway de IA expresso por contrato de aplicação;
- devolver uma resposta textual normalizada ao chamador;
- classificar a intenção da resposta em categorias controladas;
- indicar, quando aplicável, se a conversa evoluiu para candidata a manifestação;
- devolver rascunho transitório e campos faltantes quando houver triagem para manifestação;
- degradar respostas inválidas da IA para um resultado seguro e previsível.

### 4.2 Não incluído

Esta feature não contempla:

- endpoint HTTP;
- adapter concreto de LLM, RAG, vector store ou framework de IA;
- persistência de sessão ou histórico de chat;
- streaming de resposta;
- registro formal de manifestação durante a conversa;
- decisão administrativa automatizada;
- uso de conteúdos fora da base institucional aprovada.

---

## 5. Ator principal

### Usuário

Pessoa que deseja esclarecer dúvida institucional ou receber orientação inicial antes de registrar uma manifestação formal.

---

## 6. Pré-condições

Para executar a consulta:

- a funcionalidade de IA deve estar disponível por meio de um `AiGateway`;
- a chamada deve fornecer histórico da conversa e mensagem atual;
- a integração externa deve operar com conteúdo institucional aprovado;
- quando houver pré-preenchimento assistido, os catálogos válidos de campus e unidade administrativa devem estar disponíveis para canonização.

---

## 7. Pós-condições

Após uma consulta bem-sucedida:

- o usuário recebe uma resposta textual normalizada;
- a intenção detectada fica disponível para o chamador;
- quando aplicável, o sistema devolve um rascunho transitório de manifestação;
- os campos obrigatórios ausentes para abertura assistida ficam explicitados;
- nenhuma manifestação é registrada automaticamente no núcleo.

---

## 8. Entrada

A feature deve receber os seguintes dados:

| Campo               | Tipo   | Obrigatório | Descrição                                                                                                                |
| ------------------- | ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| history             | array  | Sim         | Histórico ordenado da conversa, com `role` e `content`.                                                                  |
| message             | string | Sim         | Nova mensagem enviada pelo usuário.                                                                                      |
| campuses            | array  | Sim         | Catálogo válido de campi para canonização de `campusId`.                                                                 |
| administrativeUnits | array  | Sim         | Catálogo válido de unidades administrativas, incluindo vínculo com `campusId`, para canonização e consistência do draft. |

### Exemplo de entrada

```json
{
  "history": [
    {
      "role": "user",
      "content": "Quero reclamar do atendimento."
    }
  ],
  "message": "Foi na coordenação de sistemas em Parnaíba.",
  "campuses": [{ "id": "campus-parnaiba", "label": "Campus Parnaíba" }],
  "administrativeUnits": [
    {
      "id": "coord-sistemas",
      "label": "Coordenação de Sistemas",
      "campusId": "campus-parnaiba"
    }
  ]
}
```

---

## 9. Saída

A feature deve retornar os seguintes dados:

| Campo                        | Tipo           | Descrição                                                                                      |
| ---------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| answer                       | string         | Resposta textual normalizada da IA.                                                            |
| intent                       | string         | Intenção classificada pelo backend.                                                            |
| shouldOpenManifestationDraft | boolean        | Indica se o formulário assistido já pode ser aberto com segurança.                             |
| draft                        | object \| null | Rascunho transitório de manifestação, quando aplicável.                                        |
| missingFields                | array          | Lista normalizada dos campos mínimos ausentes, apenas quando houver triagem para manifestação. |
| confidence                   | number \| null | Nível de confiança aceito pelo backend, quando válido.                                         |

### Intenções suportadas

- `institutional_question`
- `manifestation_candidate`
- `manifestation_draft_ready`
- `out_of_scope`
- `unknown`

### Exemplo de saída institucional

```json
{
  "answer": "A biblioteca funciona de segunda a sexta, das 8h às 18h.",
  "intent": "institutional_question",
  "shouldOpenManifestationDraft": false,
  "draft": null,
  "missingFields": [],
  "confidence": 0.92
}
```

---

## 10. Regras de negócio

| Código     | Regra                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| RN-UC09-01 | A resposta pública do caso de uso deve sempre usar um contrato estável do backend.                               |
| RN-UC09-02 | Intenções fora da lista suportada devem ser convertidas para `unknown`.                                          |
| RN-UC09-03 | A consulta pode sugerir tratamento formal, mas não pode registrar manifestação.                                  |
| RN-UC09-04 | O backend deve normalizar e validar os dados recebidos da IA antes de devolvê-los ao chamador.                   |
| RN-UC09-05 | Valores inválidos de confiança devem ser degradados para `null`.                                                 |
| RN-UC09-06 | IDs de campus e unidade administrativa só são aceitos se estiverem no catálogo informado.                        |
| RN-UC09-07 | Respostas inválidas da IA devem produzir um resultado seguro, sem promover ação indevida.                        |
| RN-UC09-08 | `missingFields` só deve ser preenchido quando houver triagem de manifestação em andamento.                       |
| RN-UC09-09 | Payloads de draft recebidos fora de intenções de manifestação devem ser descartados.                             |
| RN-UC09-10 | `shouldOpenManifestationDraft` só pode ser `true` quando a intenção normalizada for `manifestation_draft_ready`. |
| RN-UC09-11 | A unidade administrativa sugerida só é válida quando pertence ao campus sugerido no catálogo informado.          |

---

## 11. Validações

### 11.1 Histórico e mensagem

O histórico:

- deve ser recebido pronto pelo caso de uso;
- deve preservar `role` e `content` por mensagem;
- não é persistido pelo núcleo nesta etapa.

A mensagem:

- representa a nova entrada do usuário;
- é enviada ao gateway junto com o histórico atual.

### 11.2 Intenção

O campo `intent` deve:

- corresponder a um dos valores suportados pelo backend; ou
- ser convertido para `unknown` quando o gateway devolver um valor não reconhecido.

### 11.3 Confiança

O campo `confidence` deve:

- ser numérico quando presente;
- estar no intervalo de `0` a `1`;
- ser convertido para `null` quando estiver fora do formato aceito.

### 11.4 Segurança do fluxo

O caso de uso:

- não deve registrar manifestação;
- não deve depender de controller, banco ou integração concreta;
- deve operar apenas por contratos da camada de aplicação.

### 11.5 Draft e intenção

O backend:

- deve ignorar `draft` quando a intenção normalizada não representar triagem de manifestação;
- só pode abrir o formulário assistido quando a intenção for `manifestation_draft_ready`;
- deve usar `manifestation_candidate` apenas para manter a conversa em coleta de dados.

### 11.6 Catálogos de apoio

Os catálogos de campus e unidade administrativa:

- podem ser obtidos por controller, factory ou orquestrador antes da chamada do caso de uso;
- mantêm o caso de uso puro e independente de persistência neste recorte;
- devem carregar relação suficiente entre unidade administrativa e campus para validar consistência do draft;
- podem, em uma evolução futura, ser fornecidos por contratos injetados sem alterar a responsabilidade central da feature.

---

## 12. Fluxo principal

1. O usuário envia uma nova mensagem ao assistente institucional.
2. O chamador reúne o histórico da conversa e os catálogos válidos de campus e unidade administrativa.
3. O caso de uso encaminha os dados ao `AiGateway`.
4. O gateway retorna resposta textual e metadados de triagem.
5. O backend normaliza a resposta, a intenção, o nível de confiança e o rascunho transitório.
6. O sistema devolve o contrato estável ao chamador.
7. Quando a conversa indicar tratamento formal, o chamador pode avaliar o rascunho e os campos faltantes.

---

## 13. Fluxos alternativos

### FA01 - Intenção desconhecida

Condição:
O gateway devolve uma intenção fora da lista suportada.

Comportamento esperado:
O backend deve converter a intenção para `unknown`.

### FA02 - Confiança inválida

Condição:
O gateway devolve `confidence` fora do intervalo aceito ou em formato inválido.

Comportamento esperado:
O backend deve devolver `confidence` como `null`.

### FA03 - IDs não canônicos

Condição:
O gateway devolve `campusId` ou `administrativeUnitId` fora dos catálogos válidos informados.

Comportamento esperado:
O backend deve invalidar esses campos no draft e marcá-los como faltantes.

### FA04 - Combinação campus/unidade inconsistente

Condição:
O `administrativeUnitId` informado existe, mas não pertence ao `campusId` sugerido no catálogo válido.

Comportamento esperado:
O backend deve invalidar a unidade administrativa e tratá-la como ausente no draft.

### FA05 - Falha do gateway

Condição:
O `AiGateway` falha ao processar a consulta.

Comportamento esperado:
A falha deve ser propagada ao chamador para tratamento externo apropriado.

---

## 14. Observações de implementação

- O núcleo atual materializa esse fluxo em `SendAiMessageUseCase`.
- A dependência externa é expressa apenas pela interface `AiGateway`.
- O caso de uso foi desenhado para receber histórico pronto; modelagem de sessão e persistência ficam fora deste recorte.
- A abertura do formulário assistido depende do UC-10 e do fluxo regular de registro da manifestação.
- A camada de apresentação fornece `SendAiMessageController` em `src/presentation/controllers/ai/`, que valida o body via `Validator<SendAiMessageBody>` agnóstico e repassa `history`, `message`, `campuses` e `administrativeUnits` ao use case; o endpoint é público (sem checagem de `request.user`) e qualquer falha do `AiGateway` cai no `500 ServerError` padrão do `BaseController` — o use case não lança erros de domínio específicos por ser resiliente a respostas malformadas da IA.
