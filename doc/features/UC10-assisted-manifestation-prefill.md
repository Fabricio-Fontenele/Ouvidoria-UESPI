# Especificação da Feature: Pré-preencher Manifestação com Apoio da IA

## 1. Identificação

| Campo          | Descrição                                  |
| -------------- | ------------------------------------------ |
| Caso de uso    | UC-10                                      |
| Nome           | Pré-preencher manifestação com apoio da IA |
| Feature        | Abertura assistida de manifestação         |
| Ator principal | Usuário                                    |
| Prioridade     | Alta                                       |
| Status         | Núcleo implementado / integração pendente  |

---

## 2. Objetivo

Permitir que o sistema apresente ao usuário um rascunho transitório de manifestação, extraído da conversa com a IA, para revisão, edição e posterior envio pelo fluxo formal de registro.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------ |
| RF27   | O sistema deve permitir que a IA apresente o formulário da manifestação com campos previamente preenchidos para revisão. |
| RF06   | O sistema deve permitir o registro de manifestações nos tipos suportados pelo domínio.                                   |
| RF07   | O sistema deve exigir campus e unidade administrativa no registro.                                                       |
| RF08   | O sistema deve permitir descrição da manifestação e pessoas envolvidas, quando necessário.                               |
| RF10   | O sistema deve gerar protocolo no registro formal.                                                                       |
| RN07   | A IA não substitui decisão administrativa formal.                                                                        |
| RNF11  | O sistema deve responder em tempo aceitável para operações de interação com IA.                                          |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- interpretar a saída do fluxo de consulta à IA para formar um draft transitório;
- pré-preencher `type`, `campusId`, `administrativeUnitId`, `description` e `involvedPeople`;
- informar explicitamente os campos mínimos obrigatórios ainda ausentes;
- sinalizar quando o draft já está pronto para abertura do formulário;
- preparar um payload compatível com o fluxo regular de registro, para uso somente após revisão e confirmação do usuário.

### 4.2 Não incluído

Esta feature não contempla:

- criação automática da manifestação sem revisão do usuário;
- escolha de `isAnonymous` pela IA;
- persistência de rascunho;
- upload de anexos durante o chat;
- política adicional de sigilo além do anonimato já suportado no núcleo;
- resolução automática de catálogo fora dos IDs canônicos fornecidos ao chat.

---

## 5. Ator principal

### Usuário

Pessoa que descreve sua demanda em linguagem livre e deseja reduzir esforço no preenchimento do formulário formal.

---

## 6. Pré-condições

Para executar a abertura assistida:

- deve existir interação prévia com a IA;
- o backend deve ter recebido resposta estruturada do fluxo de chat;
- o domínio de manifestação deve suportar os campos devolvidos no draft;
- o usuário ainda precisará revisar o formulário antes do envio.

---

## 7. Pós-condições

Após uma resposta assistida bem-sucedida:

- o chamador recebe um draft transitório consistente com o domínio atual;
- os campos mínimos faltantes ficam identificados;
- quando o draft estiver completo, o formulário pode ser aberto para revisão;
- o envio formal continua dependente de confirmação do usuário e do UC-04.

---

## 8. Saída assistida

O draft transitório deve usar a seguinte forma:

| Campo                | Tipo           | Descrição                                                           |
| -------------------- | -------------- | ------------------------------------------------------------------- |
| type                 | string \| null | Tipo da manifestação sugerido pela IA, quando válido.               |
| campusId             | string \| null | ID canônico do campus, quando reconhecido e válido.                 |
| administrativeUnitId | string \| null | ID canônico da unidade administrativa, quando reconhecido e válido. |
| description          | string \| null | Descrição normalizada da manifestação.                              |
| involvedPeople       | string \| null | Pessoas envolvidas em texto livre, quando informado.                |

### Exemplo de saída com draft pronto

```json
{
  "answer": "Entendi. Organizei um rascunho para você revisar.",
  "intent": "manifestation_draft_ready",
  "shouldOpenManifestationDraft": true,
  "draft": {
    "type": "complaint",
    "campusId": "campus-parnaiba",
    "administrativeUnitId": "coord-sistemas",
    "description": "O usuário relata demora no atendimento da coordenação.",
    "involvedPeople": "Coordenação de Sistemas"
  },
  "missingFields": [],
  "confidence": 0.86
}
```

### Exemplo de saída com draft parcial

```json
{
  "answer": "Preciso de mais alguns dados antes de abrir o rascunho.",
  "intent": "manifestation_candidate",
  "shouldOpenManifestationDraft": false,
  "draft": {
    "type": "complaint",
    "campusId": null,
    "administrativeUnitId": "coord-sistemas",
    "description": null,
    "involvedPeople": null
  },
  "missingFields": ["campusId", "description"],
  "confidence": 0.7
}
```

---

## 9. Regras de negócio

| Código     | Regra                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| RN-UC10-01 | O draft assistido é transitório e não representa manifestação registrada.                                                              |
| RN-UC10-02 | O formulário só pode ser sinalizado para abertura quando `type`, `campusId`, `administrativeUnitId` e `description` estiverem válidos. |
| RN-UC10-03 | `involvedPeople` é opcional e usa texto livre normalizado.                                                                             |
| RN-UC10-04 | A escolha de `isAnonymous` permanece fora do draft e deve ser feita no formulário.                                                     |
| RN-UC10-05 | O envio final deve respeitar as mesmas validações do UC-04.                                                                            |
| RN-UC10-06 | IDs inválidos de campus ou unidade administrativa não podem ser promovidos ao formulário como válidos.                                 |
| RN-UC10-07 | A unidade administrativa sugerida deve pertencer ao campus sugerido; caso contrário, deve ser invalidada e marcada como ausente.       |

---

## 10. Validações

### 10.1 Campos mínimos para abertura do draft

O sinalizador `shouldOpenManifestationDraft` só pode ser `true` quando:

- `type` estiver entre os tipos válidos do domínio;
- `campusId` for canônico e estiver no catálogo oficial carregado para o fluxo;
- `administrativeUnitId` for canônico e estiver no catálogo oficial carregado para o fluxo;
- `description` for texto válido após normalização.

### 10.2 Pessoas envolvidas

O campo `involvedPeople`:

- é opcional;
- deve ser normalizado nas extremidades;
- deve ser tratado como inválido quando composto apenas por espaços.

### 10.3 Escolha de anonimato

O fluxo assistido:

- não infere nem persiste `isAnonymous`;
- não substitui a confirmação explícita do usuário no formulário final.

---

## 11. Fluxo principal

1. Durante a conversa, a IA detecta que a demanda exige tratamento formal.
2. O sistema organiza a resposta em um contrato estruturado de draft.
3. O backend valida e normaliza os campos sugeridos.
4. Quando os campos mínimos estão completos, o sistema marca `shouldOpenManifestationDraft` como `true`.
5. O frontend apresenta o formulário com os campos pré-preenchidos.
6. O usuário revisa, edita, escolhe anonimato quando aplicável e confirma o envio.
7. O frontend usa o payload revisado para acionar o fluxo regular de registro.

---

## 12. Fluxos alternativos

### FA01 - Informações insuficientes

Condição:
O draft não contém todos os campos mínimos necessários.

Comportamento esperado:
O sistema deve devolver `shouldOpenManifestationDraft` como `false` e informar `missingFields`.

### FA02 - Campo canônico inválido

Condição:
O draft contém `campusId` ou `administrativeUnitId` fora dos catálogos válidos.

Comportamento esperado:
O campo deve ser invalidado e tratado como ausente.

### FA03 - Combinação campus/unidade inconsistente

Condição:
O `administrativeUnitId` informado existe, mas não pertence ao `campusId` sugerido.

Comportamento esperado:
A unidade administrativa deve ser invalidada e tratada como ausente.

### FA04 - Usuário ajusta o draft

Condição:
O usuário discorda ou deseja complementar os campos sugeridos.

Comportamento esperado:
O formulário deve permitir revisão e edição antes do envio formal.

### FA05 - Usuário rejeita o draft

Condição:
O usuário não deseja usar o pré-preenchimento sugerido.

Comportamento esperado:
O sistema deve permitir continuidade por preenchimento manual no fluxo regular.

---

## 13. Observações de implementação

- O núcleo atual não persiste draft nem conversa.
- O campo `involvedPeople` passou a fazer parte do domínio e do caso de uso de registro para manter compatibilidade entre draft assistido e envio formal.
- O draft assistido é consumido pelo chamador; a decisão de abrir formulário, exibir pendências e chamar o UC-04 fica fora deste repositório.
- A consistência entre campus e unidade administrativa depende de os catálogos oficiais carregados para o fluxo preservarem relacionamento suficiente para essa validação na integração final.
