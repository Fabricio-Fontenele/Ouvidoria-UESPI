# Ouvidoria UESPI

# Requisitos Funcionais
1. Acesso e conta do usuário

RF01. O sistema deve permitir o cadastro de usuários com nome, e-mail institucional ou pessoal, CPF/matrícula, quando aplicável, e senha.

RF02. O sistema deve permitir que usuários autenticados realizem login com e-mail e senha.

RF03. O sistema deve permitir a recuperação de senha por e-mail.

RF04. O sistema deve permitir ao usuário atualizar seus dados cadastrais.

RF05. O sistema deve permitir diferentes perfis de acesso, no mínimo: cidadão/usuário, atendente da ouvidoria e administrador.

2. Registro de manifestações

RF06. O sistema deve permitir o registro de manifestações nos tipos: reclamação, denúncia, solicitação, sugestão e elogio.

RF07. O sistema deve exigir, no momento do registro, a seleção do campus e da unidade administrativa relacionada à manifestação.

RF08. O sistema deve permitir que o usuário descreva detalhadamente a manifestação e informe pessoas envolvidas, quando necessário.

RF09. O sistema deve permitir o envio de arquivos anexos na abertura do chamado.

RF10. O sistema deve gerar automaticamente um número de protocolo único para cada manifestação registrada.

RF11. O sistema deve permitir que determinadas manifestações sejam classificadas com nível de prioridade ou gravidade.

RF12. O sistema deve permitir, se a instituição desejar, o registro de denúncia com sigilo de identidade ou de forma anônima, conforme regras institucionais.

3. Acompanhamento de chamados

RF13. O sistema deve permitir que o usuário visualize a lista de seus chamados na área “Meus Chamados”.

RF14. O sistema deve exibir o status atual do chamado e seu histórico de movimentações.

RF15. O sistema deve permitir troca de mensagens entre usuário e equipe de atendimento dentro do chamado.

RF16. O sistema deve permitir que o usuário complemente informações após a abertura do chamado.

RF17. O sistema deve permitir ao usuário encerrar o chamado quando considerar a demanda resolvida.

RF18. O sistema deve permitir ao usuário avaliar o atendimento recebido ao final do processo.

4. Notificações

RF19. O sistema deve enviar notificações por e-mail a cada atualização relevante do chamado.

RF20. O sistema deve notificar o usuário sobre abertura, encaminhamento, solicitação de complemento, resposta da equipe e encerramento do chamado.

5. Gestão administrativa

RF21. O sistema deve permitir que atendentes e administradores visualizem e gerenciem os chamados registrados.

RF22. O sistema deve permitir filtrar chamados por status, data, campus, unidade administrativa e gravidade.

RF23. O sistema deve permitir a atribuição de chamados a atendentes ou setores responsáveis.

RF24. O sistema deve permitir adicionar comentários internos e respostas visíveis ao usuário.

RF25. O sistema deve permitir atualizar o status do chamado ao longo do atendimento.

RF26. O sistema deve permitir o encerramento administrativo do chamado.

RF27. O sistema deve manter histórico completo das ações realizadas pelos atendentes no chamado.

6. Relatórios e indicadores

RF28. O sistema deve permitir a geração de relatórios gerenciais com estatísticas e tendências das manifestações.

RF29. O sistema deve permitir relatórios por período, tipo de manifestação, campus, unidade e status.

RF30. O sistema deve apresentar indicadores como tempo médio de resposta, tempo médio de resolução, volume por categoria e índice de satisfação.

7. Chatbot GuaraPI com RAG

RF31. O sistema deve disponibilizar o chatbot GuaraPI para responder dúvidas sobre a instituição, editais, cursos, setores, serviços e funcionamento acadêmico-administrativo.

RF32. O chatbot deve consultar uma base de conhecimento institucional por meio de mecanismo RAG.

RF33. O chatbot deve apresentar respostas com base em documentos previamente indexados e autorizados pela instituição.

RF34. O chatbot deve informar quando não possuir confiança suficiente para responder.

RF35. O chatbot deve encaminhar o usuário para abertura de chamado ou atendimento humano quando a pergunta for complexa, sensível ou fora de escopo.

RF36. O chatbot deve registrar o histórico de interações do usuário, respeitando as regras de privacidade.

RF37. O chatbot deve permitir avaliação da resposta recebida.

RF38. O chatbot deve permitir que o usuário, a partir da conversa, seja direcionado diretamente ao formulário de manifestação quando necessário.

# Requisitos não funcionais

## Usabilidade e acessibilidade

RNF01. O sistema deve ser responsivo e funcionar adequadamente em dispositivos móveis e desktops.

RNF02. O sistema deve seguir diretrizes de acessibilidade, permitindo navegação por teclado, contraste adequado, textos alternativos e compatibilidade com leitores de tela.

RNF03. A interface deve ser simples, com linguagem clara e adequada ao público da universidade.

## Desempenho

RNF04. O tempo de resposta das principais operações do sistema não deve ultrapassar 3 segundos em condições normais de uso.

RNF05. O chatbot deve responder às perguntas em tempo aceitável, preferencialmente em até 5 segundos para consultas comuns.

RNF06. O sistema deve suportar múltiplos acessos simultâneos sem degradação significativa de desempenho.

## Segurança

RNF07. O sistema deve garantir autenticação segura e armazenamento de senhas com criptografia/hash adequado.

RNF08. O sistema deve controlar acesso por perfil de usuário.

RNF09. O sistema deve proteger dados pessoais e sensíveis contra acesso não autorizado, alteração indevida e vazamento.

RNF10. O sistema deve registrar logs de autenticação, acesso, abertura, alteração e encerramento de chamados.

RNF11. O sistema deve possuir proteção contra ataques comuns, como força bruta, injeção de SQL e upload de arquivos maliciosos.

## Privacidade e conformidade

RNF12. O sistema deve estar em conformidade com a LGPD no tratamento de dados pessoais.

RNF13. O sistema deve permitir o tratamento sigiloso de manifestações, conforme a natureza do chamado e as regras da instituição.

RNF14. O chatbot não deve expor dados pessoais, informações sigilosas ou documentos restritos nas respostas.

## Disponibilidade e confiabilidade

RNF15. O sistema deve possuir alta disponibilidade, com meta mínima definida pela instituição, por exemplo 99% de disponibilidade mensal.

RNF16. O sistema deve realizar backup periódico das bases de dados e documentos anexados.

RNF17. O sistema deve garantir recuperação dos dados em caso de falha.

## Manutenibilidade e evolução

RNF18. O sistema deve ser modular, facilitando manutenção e evolução das funcionalidades.

RNF19. A base de conhecimento do chatbot deve poder ser atualizada sem necessidade de interromper o sistema.

RNF20. O sistema deve permitir integração futura com sistemas institucionais, portais e bases documentais da UESPI.

## Qualidade da informação do chatbot

RNF21. O chatbot deve responder apenas com base em conteúdo institucional validado.

RNF22. O sistema deve permitir versionamento ou rastreabilidade da base de conhecimento usada pelo chatbot.

RNF23. O chatbot deve sinalizar quando a informação consultada estiver desatualizada, ausente ou ambígua.

# Regras de Negócio

RN01. Toda manifestação deve possuir número de protocolo único.

RN02. Todo chamado deve estar vinculado a um campus e a uma unidade administrativa.

RN03. Apenas usuários autenticados podem abrir e acompanhar chamados, exceto se a instituição permitir denúncias anônimas.

RN04. Um chamado só pode ser encerrado após resposta da equipe ou por solicitação do usuário.

RN05. Chamados encerrados não podem ser editados pelo usuário, apenas visualizados.

RN06. Apenas atendentes e administradores autorizados podem alterar status e atribuição de chamados.

RN07. Denúncias sigilosas devem ter acesso restrito a perfis autorizados.

RN08. O chatbot não substitui decisão administrativa nem manifestação formal de ouvidoria.

RN09. Quando o chatbot não conseguir responder com segurança, ele deve orientar o usuário a abrir um chamado ou buscar atendimento humano.

RN10. Somente documentos institucionais aprovados podem compor a base de conhecimento do chatbot.