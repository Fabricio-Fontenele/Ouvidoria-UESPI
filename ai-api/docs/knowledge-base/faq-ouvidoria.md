# FAQ — Ouvidoria UESPI

> Arquivo de exemplo para o MVP. Substitua antes de ir a produção pelos documentos institucionais
> aprovados (regimento, normas da ouvidoria, política de manifestações, orientações ao manifestante,
> canais oficiais de atendimento).

## O que é a Ouvidoria da UESPI?

A Ouvidoria é o canal oficial da Universidade Estadual do Piauí para receber, encaminhar e
acompanhar manifestações da comunidade acadêmica e do público externo. Não substitui canais
administrativos formais, mas garante que toda manifestação registrada seja tratada com sigilo
e dentro dos prazos previstos.

## Quem pode registrar uma manifestação?

Qualquer pessoa — aluno, servidor, terceirizado ou cidadão externo — pode registrar uma
manifestação, de forma identificada ou anônima. Manifestações anônimas recebem um protocolo
de acompanhamento e um código de acesso que deve ser guardado pelo manifestante.

## Quais tipos de manifestação existem?

- **Denúncia (`report`)**: relato de irregularidade, conduta inadequada ou descumprimento de
  norma. Tratada com sigilo prioritário.
- **Reclamação (`complaint`)**: insatisfação com um serviço, processo ou atendimento.
- **Sugestão (`suggestion`)**: proposta de melhoria de serviço, processo ou política.
- **Elogio (`compliment`)**: reconhecimento de um servidor, setor ou serviço prestado.

## Quais informações preciso para abrir uma manifestação?

Os campos obrigatórios são:

1. **Tipo** da manifestação (denúncia, reclamação, sugestão ou elogio).
2. **Campus** envolvido.
3. **Unidade administrativa** envolvida (coordenação, setor, restaurante universitário etc.).
4. **Descrição** do ocorrido com o máximo de detalhes possível.

Opcionalmente é possível informar pessoas envolvidas. Para denúncias anônimas, não inclua
dados que possam identificar o autor da manifestação.

## Como acompanhar uma manifestação?

Toda manifestação recebe um **protocolo**. Se for anônima, também é gerado um **código de
acesso**. Guarde os dois — eles são exigidos para consultar o andamento, anexar arquivos ou
responder ao ombudsman.

## Quanto tempo a Ouvidoria leva para responder?

O prazo padrão para a primeira resposta administrativa é de até 20 dias úteis. Esse prazo pode
ser prorrogado em casos complexos, sempre com justificativa registrada na manifestação.

## A Ouvidoria pode resolver qualquer problema?

Não. A Ouvidoria é um canal de **escuta e encaminhamento**. Assuntos jurídicos, denúncias
criminais ou questões que exijam autoridade policial devem ser direcionados ao órgão
competente. Nestes casos, a Ouvidoria orienta o manifestante sobre o caminho adequado.

## Como o chatbot decide se abre o draft da manifestação?

O assistente classifica a intenção da conversa em uma destas categorias:

- `institutional_question`: dúvida institucional — o assistente responde com base em
  documentos oficiais e **não abre draft**.
- `manifestation_candidate`: o usuário começou a descrever um problema, mas ainda faltam
  campos obrigatórios. O assistente faz perguntas dirigidas.
- `manifestation_draft_ready`: todos os campos obrigatórios estão preenchidos. O assistente
  sugere o draft, mas **quem registra é o backend principal** — o usuário ainda precisa
  confirmar.
- `out_of_scope`: assunto fora da Ouvidoria.
- `unknown`: o assistente não conseguiu classificar com segurança.

O assistente **nunca** registra uma manifestação por conta própria. A API principal é a única
autoridade para isso.
