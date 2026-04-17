# Ouvidoria UESPI

Documento de requisitos para o sistema de Ouvidoria da UESPI.

## Requisitos Funcionais

### 1. Acesso e conta do usuário

1. RF01. O sistema deve permitir o cadastro de usuários com nome, e-mail institucional ou pessoal, CPF/matrícula, quando aplicável, e senha.
2. RF02. O sistema deve permitir que usuários autenticados realizem login com e-mail e senha.
3. RF03. O sistema deve permitir a recuperação de senha por e-mail.
4. RF04. O sistema deve permitir ao usuário atualizar seus dados cadastrais.
5. RF05. O sistema deve permitir diferentes perfis de acesso, no mínimo: cidadão/usuário, atendente da ouvidoria e administrador.

### 2. Registro de manifestações

1. RF06. O sistema deve permitir o registro de manifestações nos tipos: reclamação, denúncia, solicitação, sugestão e elogio.
2. RF07. O sistema deve exigir, no momento do registro, a seleção do campus e da unidade administrativa relacionada à manifestação.
3. RF08. O sistema deve permitir que o usuário descreva detalhadamente a manifestação e informe pessoas envolvidas, quando necessário.
4. RF09. O sistema deve permitir o envio de arquivos anexos na abertura do chamado.
5. RF10. O sistema deve gerar automaticamente um número de protocolo único para cada manifestação registrada.
6. RF11. O sistema deve permitir que determinadas manifestações sejam classificadas com nível de prioridade ou gravidade.
7. RF12. O sistema deve permitir, se a instituição desejar, o registro de denúncia com sigilo de identidade ou de forma anônima, conforme regras institucionais.

### 3. Acompanhamento de chamados

1. RF13. O sistema deve permitir que o usuário visualize a lista de seus chamados na área "Meus Chamados".
2. RF14. O sistema deve exibir o status atual do chamado e seu histórico de movimentações.
3. RF15. O sistema deve permitir troca de mensagens entre usuário e equipe de atendimento dentro do chamado.
4. RF16. O sistema deve permitir que o usuário complemente informações após a abertura do chamado.
5. RF17. O sistema deve permitir ao usuário encerrar o chamado quando considerar a demanda resolvida.
6. RF18. O sistema deve permitir ao usuário avaliar o atendimento recebido ao final do processo.

### 4. Notificações

1. RF19. O sistema deve enviar notificações por e-mail a cada atualização relevante do chamado.
2. RF20. O sistema deve notificar o usuário sobre abertura, encaminhamento, solicitação de complemento, resposta da equipe e encerramento do chamado.

### 5. Gestão administrativa

1. RF21. O sistema deve permitir que atendentes e administradores visualizem e gerenciem os chamados registrados.
2. RF22. O sistema deve permitir filtrar chamados por status, data, campus, unidade administrativa e gravidade.
3. RF23. O sistema deve permitir a atribuição de chamados a atendentes ou setores responsáveis.
4. RF24. O sistema deve permitir adicionar comentários internos e respostas visíveis ao usuário.
5. RF25. O sistema deve permitir atualizar o status do chamado ao longo do atendimento.
6. RF26. O sistema deve permitir o encerramento administrativo do chamado.
7. RF27. O sistema deve manter histórico completo das ações realizadas pelos atendentes no chamado.

### 6. Relatórios e indicadores

1. RF28. O sistema deve permitir a geração de relatórios gerenciais com estatísticas e tendências das manifestações.
2. RF29. O sistema deve permitir relatórios por período, tipo de manifestação, campus, unidade e status.
3. RF30. O sistema deve apresentar indicadores como tempo médio de resposta, tempo médio de resolução, volume por categoria e índice de satisfação.

### 7. Chatbot GuaraPI com RAG

1. RF31. O sistema deve disponibilizar o chatbot GuaraPI para responder dúvidas sobre a instituição, editais, cursos, setores, serviços e funcionamento acadêmico-administrativo.
2. RF32. O chatbot deve consultar uma base de conhecimento institucional por meio de mecanismo RAG.
3. RF33. O chatbot deve apresentar respostas com base em documentos previamente indexados e autorizados pela instituição.
4. RF34. O chatbot deve informar quando não possuir confiança suficiente para responder.
5. RF35. O chatbot deve encaminhar o usuário para abertura de chamado ou atendimento humano quando a pergunta for complexa, sensível ou fora de escopo.
6. RF36. O chatbot deve registrar o histórico de interações do usuário, respeitando as regras de privacidade.
7. RF37. O chatbot deve permitir avaliação da resposta recebida.
8. RF38. O chatbot deve permitir que o usuário, a partir da conversa, seja direcionado diretamente ao formulário de manifestação quando necessário.

## Requisitos Não Funcionais

### Usabilidade e acessibilidade

1. RNF01. O sistema deve ser responsivo e funcionar adequadamente em dispositivos móveis e desktops.
2. RNF02. O sistema deve seguir diretrizes de acessibilidade, permitindo navegação por teclado, contraste adequado, textos alternativos e compatibilidade com leitores de tela.
3. RNF03. A interface deve ser simples, com linguagem clara e adequada ao público da universidade.

### Desempenho

1. RNF04. O tempo de resposta das principais operações do sistema não deve ultrapassar 3 segundos em condições normais de uso.
2. RNF05. O chatbot deve responder às perguntas em tempo aceitável, preferencialmente em até 5 segundos para consultas comuns.
3. RNF06. O sistema deve suportar múltiplos acessos simultâneos sem degradação significativa de desempenho.

### Segurança

1. RNF07. O sistema deve garantir autenticação segura e armazenamento de senhas com criptografia/hash adequado.
2. RNF08. O sistema deve controlar acesso por perfil de usuário.
3. RNF09. O sistema deve proteger dados pessoais e sensíveis contra acesso não autorizado, alteração indevida e vazamento.
4. RNF10. O sistema deve registrar logs de autenticação, acesso, abertura, alteração e encerramento de chamados.
5. RNF11. O sistema deve possuir proteção contra ataques comuns, como força bruta, injeção de SQL e upload de arquivos maliciosos.

### Privacidade e conformidade

1. RNF12. O sistema deve estar em conformidade com a LGPD no tratamento de dados pessoais.
2. RNF13. O sistema deve permitir o tratamento sigiloso de manifestações, conforme a natureza do chamado e as regras da instituição.
3. RNF14. O chatbot não deve expor dados pessoais, informações sigilosas ou documentos restritos nas respostas.

### Disponibilidade e confiabilidade

1. RNF15. O sistema deve possuir alta disponibilidade, com meta mínima definida pela instituição, por exemplo 99% de disponibilidade mensal.
2. RNF16. O sistema deve realizar backup periódico das bases de dados e documentos anexados.
3. RNF17. O sistema deve garantir recuperação dos dados em caso de falha.

### Manutenibilidade e evolução

1. RNF18. O sistema deve ser modular, facilitando manutenção e evolução das funcionalidades.
2. RNF19. A base de conhecimento do chatbot deve poder ser atualizada sem necessidade de interromper o sistema.
3. RNF20. O sistema deve permitir integração futura com sistemas institucionais, portais e bases documentais da UESPI.

### Qualidade da informação do chatbot

1. RNF21. O chatbot deve responder apenas com base em conteúdo institucional validado.
2. RNF22. O sistema deve permitir versionamento ou rastreabilidade da base de conhecimento usada pelo chatbot.
3. RNF23. O chatbot deve sinalizar quando a informação consultada estiver desatualizada, ausente ou ambígua.

## Regras de Negócio

1. RN01. Toda manifestação deve possuir número de protocolo único.
2. RN02. Todo chamado deve estar vinculado a um campus e a uma unidade administrativa.
3. RN03. Apenas usuários autenticados podem abrir e acompanhar chamados, exceto se a instituição permitir denúncias anônimas.
4. RN04. Um chamado só pode ser encerrado após resposta da equipe ou por solicitação do usuário.
5. RN05. Chamados encerrados não podem ser editados pelo usuário, apenas visualizados.
6. RN06. Apenas atendentes e administradores autorizados podem alterar status e atribuição de chamados.
7. RN07. Denúncias sigilosas devem ter acesso restrito a perfis autorizados.
8. RN08. O chatbot não substitui decisão administrativa nem manifestação formal de ouvidoria.
9. RN09. Quando o chatbot não conseguir responder com segurança, ele deve orientar o usuário a abrir um chamado ou buscar atendimento humano.
10. RN10. Somente documentos institucionais aprovados podem compor a base de conhecimento do chatbot.