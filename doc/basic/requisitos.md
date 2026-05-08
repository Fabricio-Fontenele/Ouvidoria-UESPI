# Ouvidoria UESPI

Documento de requisitos derivado de `doc/ouvidoria-prd.md`.
Este documento deve herdar o escopo, as regras e as restricoes do PRD canonico.

## Requisitos Funcionais

### 1. Gestao de contas de acesso

1. RF01. O sistema deve permitir o cadastro de novos usuarios com validacao de dados obrigatorios e e-mail unico.
2. RF02. O sistema deve permitir a autenticacao de usuarios cadastrados e liberar acesso conforme perfil autorizado.
3. RF03. O sistema deve permitir a recuperacao e redefinicao de senha por canal seguro e com validade limitada.
4. RF04. O sistema deve permitir a atualizacao de dados cadastrais do usuario conforme permissao de acesso.
5. RF05. O sistema deve permitir diferentes perfis de acesso, no minimo: manifestante, ouvidor e administrador.

### 2. Registro de manifestacoes

1. RF06. O sistema deve permitir o registro de manifestacoes nos tipos: denuncia, reclamacao, sugestao e elogio.
2. RF07. O sistema deve exigir, no momento do registro, a selecao do campus e da unidade administrativa relacionada a manifestacao.
3. RF08. O sistema deve permitir que o usuario informe descricao da manifestacao e pessoas envolvidas, quando necessario.
4. RF09. O sistema deve permitir o envio de arquivos anexos a manifestacao, validando formato, tamanho e regras de seguranca.
5. RF10. O sistema deve gerar automaticamente um numero de protocolo unico para cada manifestacao registrada.
6. RF11. O sistema deve permitir o registro de manifestacoes anonimas ou sigilosas, conforme politica institucional.

### 3. Acompanhamento e interacao

1. RF12. O sistema deve permitir ao manifestante consultar suas manifestacoes conforme autorizacao de acesso.
2. RF13. O sistema deve exibir o status atual, o historico de movimentacoes e as interacoes relacionadas a manifestacao.
3. RF14. O sistema deve permitir troca de mensagens no chamado entre participantes autorizados enquanto a manifestacao estiver aberta para interacao.
4. RF15. O sistema deve permitir encerramento da manifestacao pelo usuario quando atendidas as condicoes de fechamento definidas pela ouvidoria.
5. RF16. O sistema deve permitir avaliacao do atendimento em manifestacoes finalizadas.
6. RF17. O sistema deve notificar o usuario sobre atualizacoes relevantes da manifestacao, como abertura, encaminhamento, resposta e encerramento, respeitadas as restricoes aplicaveis a manifestacoes anonimas.

### 4. Gestao administrativa de manifestacoes

1. RF18. O sistema deve permitir que perfis administrativos autorizados visualizem e gerenciem as manifestacoes registradas.
2. RF19. O sistema deve permitir filtrar manifestacoes por criterios disponiveis ao tratamento administrativo, como status, periodo, campus e unidade administrativa.
3. RF20. O sistema deve permitir a atribuicao e o encaminhamento de manifestacoes a responsaveis autorizados.
4. RF21. O sistema deve permitir adicionar respostas administrativas e atualizar o status da manifestacao ao longo do atendimento.
5. RF22. O sistema deve permitir o encerramento administrativo da manifestacao por perfis autorizados.
6. RF23. O sistema deve manter historico completo das acoes realizadas no tratamento da manifestacao.

### 5. Relatorios gerenciais

1. RF24. O sistema deve permitir consultar relatorios gerenciais disponiveis para perfis autorizados.

### 6. Suporte informacional por IA

1. RF25. O sistema deve permitir consulta a IA com respostas baseadas em conteudo institucional aprovado.
2. RF26. A IA deve apoiar a triagem inicial das demandas e orientar o usuario quando a demanda exigir tratamento formal.
3. RF27. O sistema deve permitir que a IA apresente o formulario da manifestacao com campos previamente preenchidos a partir das informacoes fornecidas pelo usuario na conversa, permitindo revisao, edicao e confirmacao antes do envio.
4. RF28. A IA deve informar quando nao possuir seguranca suficiente para responder e encaminhar o usuario para abertura de manifestacao ou atendimento humano quando o caso for sensivel, ambiguo ou fora de escopo.

## Requisitos Nao Funcionais

### Arquitetura e qualidade geral

1. RNF01. O sistema deve ser estruturado de modo a favorecer separacao de responsabilidades, baixo acoplamento e testabilidade.
2. RNF02. O sistema deve ser exposto por meio de API REST com organizacao consistente de recursos, metodos e codigos de resposta.
3. RNF03. O sistema deve utilizar armazenamento persistente relacional, preservando integridade, relacionamentos e consistencia entre registros.

### Usabilidade e acessibilidade

1. RNF04. O sistema deve ser responsivo e oferecer experiencia compativel com dispositivos desktop e moveis nas funcionalidades principais.
2. RNF05. O sistema deve seguir diretrizes de acessibilidade, permitindo navegacao por teclado, contraste adequado, textos alternativos e compatibilidade com leitores de tela.
3. RNF06. A interface deve utilizar linguagem clara e adequada ao publico da universidade.

### Seguranca, privacidade e rastreabilidade

1. RNF07. O sistema deve exigir autenticacao e aplicar autorizacao por perfil, respeitando restricoes de acesso a manifestacoes sigilosas.
2. RNF08. O sistema deve proteger dados pessoais e sensiveis de acordo com principios de privacidade e conformidade aplicaveis.
3. RNF09. O sistema deve manter historico suficiente para rastrear alteracoes de status, mensagens, respostas administrativas e encerramentos.
4. RNF10. A IA nao deve expor dados pessoais, informacoes sigilosas ou conteudos restritos em suas respostas.

### Desempenho

1. RNF11. O sistema deve responder em tempo aceitavel para operacoes de consulta, registro de manifestacoes e interacao com IA.

## Regras de Negocio

1. RN01. Toda manifestacao deve possuir numero de protocolo unico.
2. RN02. Toda manifestacao deve estar vinculada a um campus e a uma unidade administrativa.
3. RN03. O sistema deve permitir manifestacoes anonimas conforme politica institucional, observadas as restricoes de retorno personalizado e notificacao direta nesses casos.
4. RN04. Apenas perfis autorizados podem analisar, responder, encaminhar, alterar status e encerrar manifestacoes.
5. RN05. O tratamento das manifestacoes deve manter rastreabilidade de interacoes, respostas, alteracoes de status e responsaveis por cada acao.
6. RN06. Manifestacoes finalizadas ou canceladas nao devem aceitar edicao direta do conteudo original.
7. RN07. A IA nao substitui decisao administrativa formal nem pode concluir, por conta propria, casos sensiveis, ambiguos ou fora de escopo.
8. RN08. Somente conteudos institucionais aprovados podem ser utilizados como base para as respostas da IA.
