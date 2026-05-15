# Especificação da Feature: Acompanhar Manifestação Anônima por Protocolo

## 1. Identificação

| Campo          | Descrição                                                                         |
| -------------- | --------------------------------------------------------------------------------- |
| Caso de uso    | UC-05 (complementar — fluxo anônimo)                                              |
| Nome           | Acompanhar manifestação anônima por protocolo                                     |
| Feature        | Consulta pública de manifestação anônima por protocolo e código de acompanhamento |
| Ator principal | Manifestante anônimo                                                              |
| Prioridade     | Alta                                                                              |
| Status         | Núcleo implementado / integração pendente                                         |

---

## 2. Objetivo

Permitir que o manifestante anônimo acompanhe a sua manifestação sem autenticação, informando o protocolo da manifestação e o código de acompanhamento entregue no momento do registro.

Esta feature complementa o UC-05, que cobre apenas o acompanhamento autenticado por manifestantes identificados.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| RF12   | O sistema deve permitir ao manifestante consultar suas manifestações conforme autorização de acesso.                                    |
| RF13   | O sistema deve exibir o status atual, o histórico de movimentações e as interações relacionadas à manifestação.                         |
| RN03   | Manifestações anônimas devem preservar o anonimato do manifestante em todos os fluxos de consulta e atendimento.                        |
| RN05   | O tratamento das manifestações deve manter rastreabilidade de interações, respostas, alterações de status e responsáveis por cada ação. |
| RNF09  | O sistema deve manter histórico suficiente para rastrear alterações de status, mensagens, respostas administrativas e encerramentos.    |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- consultar uma manifestação anônima por `protocol` e `accessCode`;
- expor uma projeção pública mínima da manifestação (sem descrição, mensagens internas, autoria, histórico administrativo ou responsáveis);
- bloquear o uso deste fluxo para manifestações identificadas;
- retornar o mesmo erro genérico para protocolo inexistente, código inválido ou manifestação não anônima, evitando enumeração;
- permitir consulta de manifestações em qualquer status, inclusive estados terminais (`finalized`, `canceled`), em modo apenas leitura.

### 4.2 Não incluído

Esta feature não contempla:

- envio de mensagens por manifestante anônimo;
- consulta de detalhes administrativos, histórico de transições ou mensagens internas;
- exposição da descrição original ou de respostas administrativas em texto livre;
- reemissão ou rotação de `accessCode`;
- rate limiting ou bloqueio por tentativa (responsabilidade da camada de transporte);
- notificações ao manifestante anônimo;
- persistência concreta em banco;
- rotas HTTP.

---

## 5. Ator principal

### Manifestante anônimo

Pessoa que registrou uma manifestação sem identificação e que deseja consultar o andamento utilizando o protocolo e o código de acompanhamento entregue uma única vez no momento do registro.

---

## 6. Pré-condições

Para executar o acompanhamento anônimo:

- a manifestação consultada deve ter sido registrada como anônima;
- o usuário deve possuir o `protocol` e o `accessCode` recebidos na criação;
- a infraestrutura de persistência deve disponibilizar consulta por protocolo;
- a infraestrutura de criptografia deve disponibilizar comparação de hash.

---

## 7. Pós-condições

Após operação bem-sucedida:

- a projeção pública da manifestação é devolvida;
- o estado do agregado permanece inalterado;
- nenhum dado interno administrativo é exposto.

A operação é estritamente de leitura e não dispara persistência.

---

## 8. Entradas

### 8.1 Acompanhamento por protocolo

| Campo      | Tipo   | Obrigatório | Descrição                                                                      |
| ---------- | ------ | ----------- | ------------------------------------------------------------------------------ |
| protocol   | string | Sim         | Protocolo público da manifestação.                                             |
| accessCode | string | Sim         | Código de acompanhamento em texto plano, recebido no registro da manifestação. |

#### Exemplo de entrada

```json
{
  "protocol": "OUV-2026-K7F9Q2",
  "accessCode": "plain-access-code"
}
```

---

## 9. Regras de negócio

| Código      | Regra                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN-UC05b-01 | O sistema deve permitir acompanhamento de manifestação anônima por protocolo e código de acompanhamento.                                              |
| RN-UC05b-02 | Manifestações identificadas não devem ser acompanhadas por este fluxo, mesmo quando o protocolo for conhecido.                                        |
| RN-UC05b-03 | A consulta pública por protocolo não deve expor descrição, mensagens, autoria, histórico administrativo, responsáveis ou identificador interno.       |
| RN-UC05b-04 | O `accessCode` deve ser comparado contra `accessCodeHash` por `HashComparer`, sem persistência de texto plano.                                        |
| RN-UC05b-05 | O `accessCodeHash` deve ser gerado no momento do registro da manifestação anônima e retornado em texto plano apenas uma vez.                          |
| RN-UC05b-06 | Protocolos e códigos vazios ou compostos apenas por espaços devem ser tratados como entrada inválida e gerar o erro genérico.                         |
| RN-UC05b-07 | Os erros de protocolo inexistente, manifestação identificada e código inválido devem compartilhar o mesmo tipo de erro genérico, evitando enumeração. |
| RN-UC05b-08 | Manifestações em estado terminal devem permanecer consultáveis por este fluxo, em modo apenas leitura.                                                |
| RN-UC05b-09 | O caso de uso não deve persistir alterações no agregado (`save()` não deve ser chamado).                                                              |
| RN-UC05b-10 | O controle de tentativas (rate limiting / brute force) é responsabilidade da camada de transporte e não do caso de uso.                               |

---

## 10. Validações

### 10.1 Entradas obrigatórias

`protocol` e `accessCode` devem:

- ser obrigatórios;
- ser strings;
- não estar vazios;
- não conter apenas espaços em branco.

### 10.2 Anonimato da manifestação

A manifestação localizada por `protocol` deve:

- existir no repositório;
- ter sido registrada como anônima (`authorUserId === null`);
- possuir `accessCodeHash` armazenado.

### 10.3 Verificação do código

O `accessCode` informado deve ser validado contra `accessCodeHash` por `HashComparer.compare`.

---

## 11. Fluxo principal

1. O manifestante anônimo informa o protocolo e o código de acompanhamento.
2. O sistema normaliza as entradas e valida que ambas não estão em branco.
3. O sistema busca a manifestação pelo protocolo.
4. O sistema valida que a manifestação é anônima e possui código armazenado.
5. O sistema verifica o `accessCode` contra o `accessCodeHash`.
6. O sistema retorna a projeção pública da manifestação.

---

## 12. Fluxos alternativos

### FA01 - Entrada inválida

Condição:
`protocol` ou `accessCode` ausentes, vazios ou compostos apenas por espaços.

Comportamento esperado:
O sistema deve falhar com `ManifestationTrackingNotFoundError` antes de consultar o repositório.

### FA02 - Protocolo inexistente

Condição:
Nenhuma manifestação encontrada para o `protocol` informado.

Comportamento esperado:
O sistema deve falhar com `ManifestationTrackingNotFoundError`, sem realizar comparação de hash.

### FA03 - Manifestação identificada

Condição:
A manifestação existe, mas foi registrada como identificada (`authorUserId !== null`).

Comportamento esperado:
O sistema deve falhar com `ManifestationTrackingNotFoundError`, sem realizar comparação de hash. O acompanhamento identificado é tratado pelo UC-05.

### FA04 - Código inválido

Condição:
A manifestação é anônima, porém o `accessCode` não corresponde ao `accessCodeHash`.

Comportamento esperado:
O sistema deve falhar com `ManifestationTrackingNotFoundError`.

### FA05 - Manifestação em estado terminal

Condição:
A manifestação está em `finalized` ou `canceled` e o `accessCode` é válido.

Comportamento esperado:
O sistema deve retornar a projeção pública normalmente, em modo apenas leitura.

---

## 13. Saída de sucesso

```json
{
  "manifestation": {
    "protocol": "OUV-2026-K7F9Q2",
    "type": "complaint",
    "status": "in_analysis",
    "campusId": "campus-1",
    "administrativeUnitId": "unit-1",
    "createdAt": "2026-05-10T12:00:00.000Z"
  }
}
```

---

## 14. Erros esperados

### 14.1 Acompanhamento não encontrado

Condição:
Entrada inválida, protocolo inexistente, manifestação identificada ou código inválido.

Erro esperado:
`ManifestationTrackingNotFoundError`

A unificação intencional dos casos acima sob um mesmo erro evita que a resposta sirva como oráculo de enumeração de protocolos ou de existência de manifestação.

---

## 15. Regras de segurança

- o protocolo é tratado como identificador público; o `accessCode` é tratado como credencial e nunca é armazenado em texto plano;
- a comparação do código deve usar `HashComparer.compare` e nunca igualdade direta de strings;
- a saída pública não deve incluir descrição da manifestação, identificadores internos, autoria, mensagens, histórico administrativo ou responsáveis;
- a unificação de erros evita que o fluxo público sirva como oráculo de existência de protocolo;
- o controle de tentativas (rate limiting / lockout) é responsabilidade da camada de transporte;
- o `accessCode` em texto plano é apresentado apenas uma vez ao manifestante anônimo, no momento do registro da manifestação.

---

## 16. Critérios de aceite

- o sistema deve retornar a projeção pública quando `protocol` e `accessCode` forem válidos;
- o sistema deve falhar com erro genérico quando o protocolo não existir;
- o sistema deve falhar com erro genérico quando a manifestação for identificada;
- o sistema deve falhar com erro genérico quando o `accessCode` for inválido;
- o sistema deve falhar com erro genérico para entradas em branco, sem consultar o repositório;
- o sistema deve permitir consulta em estados terminais como leitura;
- a saída não deve conter descrição, mensagens, autoria, histórico administrativo, responsáveis ou identificador interno;
- o caso de uso não deve chamar `save()` em nenhum fluxo.

---

## 17. Casos de teste

### 17.1 Testes unitários do caso de uso

#### CT-UC05b-001 - Deve retornar acompanhamento de manifestação anônima válida

- dado `protocol` existente em manifestação anônima e `accessCode` que corresponde ao `accessCodeHash`;
- quando o caso de uso for executado;
- então deve devolver a projeção pública com `protocol`, `type`, `status`, `campusId`, `administrativeUnitId` e `createdAt`;
- e `save()` não deve ser chamado.

#### CT-UC05b-002 - Deve expor apenas o conjunto público de campos

- dado um acompanhamento válido;
- quando o caso de uso for executado;
- então a saída deve conter exatamente `protocol`, `type`, `status`, `campusId`, `administrativeUnitId` e `createdAt`;
- e nenhum outro campo do agregado.

#### CT-UC05b-003 - Deve permitir consulta em estados terminais

- dado uma manifestação anônima em `answered`, `finalized` ou `canceled`;
- quando o caso de uso for executado com código válido;
- então deve retornar a projeção pública com o status atual;
- e `save()` não deve ser chamado.

#### CT-UC05b-004 - Não deve retornar para protocolo inexistente

- dado um `protocol` que não corresponde a nenhuma manifestação;
- quando o caso de uso for executado;
- então deve lançar `ManifestationTrackingNotFoundError`;
- e não deve chamar `HashComparer.compare`.

#### CT-UC05b-005 - Não deve retornar para manifestação identificada

- dado um `protocol` que corresponde a uma manifestação com `authorUserId !== null`;
- quando o caso de uso for executado;
- então deve lançar `ManifestationTrackingNotFoundError`;
- e não deve chamar `HashComparer.compare`.

#### CT-UC05b-006 - Não deve retornar para `accessCode` inválido

- dado uma manifestação anônima e `accessCode` que não corresponde ao `accessCodeHash`;
- quando o caso de uso for executado;
- então deve lançar `ManifestationTrackingNotFoundError`;
- e `save()` não deve ser chamado.

#### CT-UC05b-007 - Não deve consultar repositório para entradas em branco

- dado `protocol` ou `accessCode` vazios ou compostos apenas por espaços;
- quando o caso de uso for executado;
- então deve lançar `ManifestationTrackingNotFoundError`;
- e `ManifestationsRepository.findByProtocol` não deve ser chamado.

---

## 18. Sugestão de tipos

```ts
export interface TrackManifestationByProtocolInput {
  protocol: string
  accessCode: string
}

export interface TrackManifestationByProtocolOutput {
  manifestation: {
    protocol: string
    type: ManifestationType
    status: ManifestationStatus
    campusId: string
    administrativeUnitId: string
    createdAt: Date
  }
}

export interface ManifestationsRepository {
  findByProtocol(protocol: string): Promise<Manifestation | null>
}

export interface AccessCodeGenerator {
  generate(): Promise<string>
}

export class Manifestation extends Entity<ManifestationProps> {
  get accessCodeHash(): string | null
}
```

---

## 19. Observações de implementação

- o `accessCodeHash` é parte do agregado `Manifestation` e seu invariante é garantido em `Manifestation.open`: anônimas exigem hash; identificadas proíbem hash;
- a geração do `accessCode` no registro fica em um contrato dedicado `AccessCodeGenerator`, separado do `ProtocolGenerator`, deixando explícita a diferença entre identificador público e credencial;
- o hash do `accessCode` reutiliza o contrato `PasswordHasher` já existente na camada de aplicação, evitando introduzir um novo mecanismo de hashing;
- a comparação reutiliza `HashComparer`, mesmo padrão do `SignInUseCase`, mantendo a verificação de credenciais fora do agregado;
- o agregado expõe apenas `accessCodeHash` (somente leitura); a comparação fica no caso de uso, e a geração no fluxo de registro;
- o erro `ManifestationTrackingNotFoundError` fica em `track-manifestation-by-protocol/errors/` porque ainda é usado por um único caso de uso; se outro fluxo público vier a reaproveitá-lo, mover para uma pasta compartilhada do tipo `manifestation-tracking/errors/`;
- o `RegisterManifestationUseCase` passa a retornar `accessCode` em texto plano no campo `accessCode` do output, apenas no caso anônimo; para manifestações identificadas o campo é `null`;
- nenhuma rota HTTP foi introduzida; a camada de transporte deverá expor o caso de uso preservando o erro genérico para evitar enumeração de protocolos.

---

## 20. Observação final

Esta feature documenta o recorte público de acompanhamento de manifestação anônima por protocolo. Evoluções futuras como exibição controlada de resposta administrativa pública, rotação de `accessCode` ou bloqueio por tentativas devem ser tratadas em especificações complementares, preservando o princípio de não exposição de dados internos.
