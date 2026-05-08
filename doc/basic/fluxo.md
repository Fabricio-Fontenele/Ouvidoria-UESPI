# Fluxo Ouvidoria

Documento de fluxo derivado de `doc/ouvidoria-prd.md`.
Este documento deve herdar o escopo, as regras e os limites do PRD canonico.

## 1. Macrofluxo principal - Registro e tratamento de manifestacao

1. O manifestante acessa o sistema e registra uma manifestacao.
2. O sistema valida os dados obrigatorios, gera o protocolo unico e registra a manifestacao.
3. A manifestacao entra em analise pela equipe da ouvidoria.
4. O ouvidor analisa o conteudo e, quando necessario, interage com o manifestante por mensagens.
5. O responsavel administrativo registra resposta formal e atualiza o status da manifestacao.
6. O manifestante acompanha o historico da manifestacao e, quando considerar resolvido, realiza o encerramento.
7. O sistema registra o encerramento e mantem o historico para consulta e avaliacao.

## 2. Macrofluxo alternativo - Atendimento assistido por IA

1. O usuario consulta a IA para esclarecer duvidas institucionais.
2. A IA responde com base em conteudo institucional aprovado.
3. Quando a demanda exigir tratamento formal, a IA apresenta o formulario da manifestacao com campos previamente preenchidos com base nas informacoes fornecidas pelo usuario.
4. O usuario revisa os campos e pode editar, complementar ou confirmar o preenchimento sugerido.
5. Apos a confirmacao do usuario, a manifestacao segue o fluxo principal de registro e tratamento pela ouvidoria.

## 3. Regras de conducao do fluxo

1. O fluxo deve respeitar os perfis autorizados para registro, acompanhamento, tratamento e encerramento da manifestacao.
2. Manifestacoes anonimas ou sigilosas devem seguir a politica institucional de acesso, retorno e notificacao.
3. A IA nao substitui decisao administrativa formal nem conclui, por conta propria, casos sensiveis, ambiguos ou fora de escopo.
4. Manifestacoes finalizadas ou canceladas nao devem aceitar edicao direta do conteudo original.
5. O tratamento da manifestacao deve preservar rastreabilidade de mensagens, respostas, alteracoes de status e responsaveis por cada acao.

## 4. Estados principais da manifestacao

- em analise
- respondida
- finalizada
- cancelada
