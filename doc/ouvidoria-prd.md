# PRD - Sistema de Ouvidoria Institucional

## 1. Identificação do documento

### 1.1 Nome do produto

Sistema de Ouvidoria Institucional

### 1.2 Versão do documento

1.1

### 1.3 Status

- [x] rascunho
- [ ] em revisão
- [ ] aprovado
- [ ] substituído

### 1.4 Natureza do projeto

- [ ] sistema real
- [x] projeto acadêmico
- [x] protótipo
- [ ] estudo de caso
- [ ] projeto semestral

### 1.5 Finalidade canônica deste documento

Este documento é a **referência canônica do sistema**.

Ele consolida a visão de produto, o escopo, o contexto, os atores, as regras de negócio, os requisitos e as restrições globais do Sistema de Ouvidoria Institucional, servindo como base para os documentos derivados e para a implementação do sistema.

## 2. Visão geral do produto

### 2.1 Descrição curta

O Sistema de ouvidoria institucional é uma sistema web para registrar e acompanhar denuncias, reclamações, sugestões e elogios relacionados à universidade, com foco em transparência, rastreabilidade e gestão eficiente das demandas da comunidade acadêmica auxiliado por um chatbot para triagem inicial e encaminhamento automático.

### 2.2 Finalidade principal

O produto tem como finalidade principal oferecer uma plataforma centralizada para a gestão de demandas da comunidade acadêmica, promovendo transparência, eficiência e participação ativa dos usuários.

### 2.3 Contexto de uso

O sistema será utilizado por membros da comunidade acadêmica, incluindo estudantes, professores, funcionários, para registrar suas demandas e acompanhar o andamento das mesmas. Os gestores utilizarão o sistema para gerenciar as demandas recebidas, responder aos usuários.

### 2.4 Público-alvo ou beneficiários

Os principais beneficiários são:

- estudantes, professores e funcionários da universidade, que terão um canal eficiente para registrar suas demandas e acompanhar o andamento das mesmas
- Usuários externos, como visitantes ou parceiros, que poderão registrar demandas relacionadas à universidade
- Gestores e administradores da universidade, que terão uma ferramenta para gerenciar as demandas recebidas e responder aos usuários de forma eficiente

### 2.5 Valor esperado

Espera-se que o sistema promova maior transparência e eficiência na gestão de demandas da comunidade acadêmica, além de incentivar a participação ativa dos usuários e melhorar a satisfação geral com os serviços oferecidos pela universidade.

## 3. Problema que o produto pretende resolver

### 3.1 Situação atual

Atualmente, a universidade não possui ouvidoria propria, usando apenas um sistema terceirizado do governo federal, o que dificulta a gestão eficiente das demandas da comunidade acadêmica, além de limitar a transparência e a participação ativa dos usuários.

### 3.2 Dificuldades existentes

- falta de um canal centralizado para registro e acompanhamento de demandas
- dificuldade para os usuários acompanharem o andamento de suas demandas
- dificuldade para os gestores gerenciarem as demandas recebidas e responderem aos usuários de forma
- complexidade para triagem e encaminhamento automático das demandas
- dificuldade no acesso a informação por parte dos usuários
- ineficiente

### 3.3 Resultado esperado com o produto

O sistema tem como objetivo transformar a forma como demandas são registradas,
acompanhadas e resolvidas na instituição. Com sua implantação, espera-se alcançar
os seguintes resultados:

- **Registro e acompanhamento simplificados:** usuários poderão abrir e monitorar
  demandas de forma intuitiva, sem depender de processos manuais ou informais.

- **Gestão mais eficiente:** gestores terão visibilidade centralizada das demandas,
  facilitando a priorização e o controle do fluxo de atendimento.

- **Transparência e participação ativa:** os usuários acompanharão em tempo real
  o status de suas solicitações, promovendo maior engajamento e confiança no processo.

- **Triagem inteligente com chatbot:** um assistente virtual realizará a triagem
  inicial das demandas, direcionando-as automaticamente e reduzindo o tempo de resposta.

## 4. Objetivos do produto

### 4.1 Objetivo geral

Desenvolver um sistema de ouvidoria institucional que permita o registro, acompanhamento e gestão eficiente de demandas da comunidade acadêmica, promovendo transparência, participação ativa e triagem inteligente por meio de chatbot.

### 4.2 Objetivos prioritários

- oferecer canal centralizado para registro e acompanhamento de demandas
- permitir que usuários acompanhem o andamento de suas demandas de forma transparente
- Oferecer o chatbot para triagem inicial e encaminhamento automático das demandas.
- fornecer ferramenta eficiente para gestores gerenciarem as demandas recebidas e responderem aos usuários de forma ágil e organizada

### 4.3 Objetivos secundários

- Oferecer relatórios e indicadores para análise de demandas e melhoria contínua dos serviços oferecidos pela universidade
- Integrar o sistema com outros sistemas institucionais, como sistemas de gestão acadêmica ou sistemas de atendimento ao usuário, para facilitar o fluxo de informações e a resolução das demandas.
- Garantir a segurança e privacidade dos dados dos usuários, implementando medidas de proteção adequadas e conformidade com as regulamentações aplicáveis.

## 5. Escopo do sistema

### 5.1 Escopo incluído

- Cadastro de usuários com diferentes perfis e permissões
- Registro de demandas com campos estruturados e possibilidade de anexos
- Acompanhamento do status das demandas pelos usuários
- Gestão de demandas pelos gestores, incluindo resposta e encaminhamento
- Triagem inicial por chatbot para direcionamento automático das demandas
- Chatbot com capacidade de responder perguntas frequentes e fornecer orientações básicas

### 5.2 Fora do escopo

- Relatórios avançados de análise de dados e indicadores de desempenho
- Integração com sistemas de gestão acadêmica ou sistemas de atendimento ao usuário

### 5.3 Limites do produto

- o chatbot terá capacidade limitada de compreensão e resposta, focando principalmente em triagem inicial e respostas a perguntas frequentes baseadas no regimento da universidade
- o sistema não incluirá funcionalidades de atendimento ao usuário, como chat ao vivo ou suporte telefônico, concentrando-se exclusivamente no registro e gestão de demandas
- o sistema não terá integração com outros sistemas institucionais, como sistemas de gestão acadêmica ou sistemas de atendimento ao usuário, limitando-se a ser uma plataforma independente para registro e acompanhamento de demandas.
- O sistema não incluirá dashboard de indicadores ou relatórios avançados, focando principalmente na funcionalidade de registro, acompanhamento e gestão de demandas.

## 6. Contexto institucional, organizacional ou didático

### 6.1 Contexto mais amplo

### 6.2 Estrutura organizacional relevante

### 6.3 Regras do contexto

### 6.4 Motivação didática, quando houver

## 7. Atores e perfis do sistema

> Informar claramente se um mesmo usuário pode acumular múltiplos papéis.

### 7.1 Manifestante

**Descrição:** Usuário que faz a manifestação na ouvidoria
**Responsabilidades principais:**

- registrar manifestação com campos estruturados e possibilidade de anexos
- acompanhar o andamento da manifestação
- receber respostas e orientações dos gestores
- interagir com o chatbot para triagem inicial e esclarecimento de dúvidas

### 7.2 Ouvidor

**Descrição:** Perfil responsável por gerenciar as demandas da unidade, incluindo análise e resposta.
**Responsabilidades principais:**

- analisar demandas recebidas
- responder aos manifestantes
- acompanhar o andamento das demandas sob sua responsabilidade

### 7.3 Regras sobre acúmulo de papéis

- é vetado que um mesmo usuário acumule os papéis de manifestante e Ouvidor, para evitar conflitos de interesse e garantir a imparcialidade na gestão das demandas.

## 8. Conceitos de negócio e linguagem ubíqua

### 8.1 Classificações adotadas

- **Tipos de manifestação:** denúncia, reclamação, sugestão, elogio.
- **Status das demandas:** em análise, respondida, cancelada, finalizada.

### 8.2 Termos importantes do domínio

- **Manifestação:** solicitação formal de um usuário, registrada na ouvidoria, que pode ser denúncia, reclamação, sugestão ou elogio.
- **Manifestante:** usuário que faz a manifestação na ouvidoria.
- **Ouvidor:** perfil responsável por gerenciar as demandas da unidade, incluindo análise e resposta.
- **Chatbot:** assistente virtual que realiza a triagem inicial das manifestações, direcionando-as automaticamente e respondendo a perguntas frequentes.
- **Resposta:** comunicação formal do Ouvidor ao manifestante, contendo orientações ou esclarecimentos relacionados à manifestação registrada.
- **Acompanhamento:** processo pelo qual o manifestante pode monitorar o andamento de sua manifestação, verificando status e respostas fornecidas pelos gestores.

### 8.3 Linguagem ubíqua desejada

Os termos acima devem ser utilizados de forma consistente em toda a documentação e comunicação relacionada ao sistema, garantindo clareza e compreensão compartilhada entre todos os envolvidos no projeto.

## 9. Regras gerais de negócio

1. O sistema deve permitir o registro de manifestações com campos estruturados e possibilidade de anexos, garantindo que as informações sejam organizadas e facilmente acessíveis para análise pelos gestores.
2. O sistema deve permitir que os manifestantes acompanhem o andamento de suas manifestações, verificando o status e recebendo notificações sobre atualizações ou respostas dos gestores.
3. O sistema deve permitir que os gestores analisem as manifestações recebidas, respondam aos manifestantes e acompanhem o andamento das demandas sob sua responsabilidade, garantindo uma gestão eficiente e transparente das demandas da comunidade acadêmica.
4. O chatbot deve apoiar a triagem inicial das manifestações, direcionando-as para os gestores responsáveis e respondendo a perguntas frequentes, promovendo agilidade e eficiência no atendimento das demandas.
5. O sistema deve permitir manifestações anônimas, garantindo a privacidade dos manifestantes que desejarem registrar suas demandas sem se identificar.
6. Apenas gestores ou perfis administrativos autorizados podem analisar, responder, encaminhar, alterar status e encerrar manifestações.
7. O tratamento das manifestações deve ocorrer com rastreabilidade, mantendo histórico de interações, respostas, alterações de status e responsáveis por cada ação.
8. O chatbot deve realizar atendimento inicial para esclarecimento de dúvidas frequentes e apoio na triagem das manifestações, com base em regras e conteúdos institucionais previamente definidos.
9. O chatbot não pode substituir decisão administrativa formal nem concluir, por conta própria, casos sensíveis, ambíguos ou fora de escopo, devendo encaminhá-los para atendimento humano.
10. Manifestações anônimas poderão ter restrições de retorno personalizado e notificação direta, devendo o acompanhamento ocorrer exclusivamente por protocolo, quando essa opção for adotada pela instituição.

## 10. Macrofluxos de negócio

> Esta seção descreve fluxos amplos do sistema.  
> Não detalhar aqui casos de uso específicos nem comportamento técnico de implementação.

### 10.1 Macrofluxo principal - Registro e tratamento de manifestação

1. O manifestante acessa o sistema e registra uma manifestação.
2. O sistema valida os dados obrigatórios, gera protocolo e registra o chamado.
3. A manifestação entra em análise pela equipe da ouvidoria.
4. O Ouvidor analisa o conteúdo e, quando necessário, interage com o manifestante por mensagens.
5. O gestor registra resposta formal e atualiza o status da manifestação.
6. O manifestante acompanha o histórico e, quando considerar resolvido, encerra a manifestação.
7. O sistema registra o encerramento e mantém o histórico para consulta e avaliação.

### 10.2 Macrofluxo alternativo - Atendimento assistido por chatbot

1. O usuário consulta o chatbot para esclarecer dúvidas institucionais.
2. O chatbot responde com base em conteúdo institucional aprovado.
3. Quando a dúvida exigir tratamento formal, o chatbot orienta abertura de manifestação.
4. A demanda segue o fluxo principal de registro e tratamento pela ouvidoria.

### 10.3 Macrofluxo excepcional - Encaminhamento para atendimento humano

1. O chatbot identifica baixa confiança, tema sensível ou assunto fora de escopo.
2. O sistema informa a limitação da resposta automatizada.
3. O usuário é orientado para atendimento humano ou abertura de manifestação.
4. O registro da interação permanece armazenado para rastreabilidade, conforme regras de privacidade.

## 11. Funcionalidades principais do sistema

> Esta seção descreve as **capacidades** do sistema em linguagem funcional e executiva.  
> Os requisitos funcionais detalhados e rastreáveis devem ser registrados na seção 14.

### 11.1 Gestão de contas de acesso

**Descrição:** Permite cadastrar usuário, autenticar acesso e recuperar senha com segurança.  
**Atores envolvidos:** usuário.  
**Resultado esperado:** acesso controlado ao sistema conforme perfil autorizado.

### 11.2 Registro e acompanhamento de manifestações

**Descrição:** Permite registrar manifestações com anexos e histórico de status.
**Atores envolvidos:** manifestante.  
**Resultado esperado:** formalização e acompanhamento transparente das demandas.

### 11.3 Comunicação no chamado

**Descrição:** Permite troca de mensagens entre manifestante e equipe da ouvidoria durante o tratamento do chamado.  
**Atores envolvidos:** manifestante, Ouvidor.  
**Resultado esperado:** histórico de comunicação centralizado e rastreável.

### 11.4 Tratamento administrativo de manifestações

**Descrição:** Permite que a equipe da ouvidoria filtre, atribua, responda, encaminhe e atualize o status das manifestações.  
**Atores envolvidos:** Ouvidor, administrador.  
**Resultado esperado:** condução eficiente e auditável do ciclo de atendimento.

### 11.5 Encerramento e avaliação do atendimento

**Descrição:** Permite encerrar manifestações concluídas e registrar avaliação de satisfação do manifestante.  
**Atores envolvidos:** manifestante.  
**Resultado esperado:** fechamento formal do ciclo e coleta de indicadores de qualidade.

### 11.6 Suporte informacional por chatbot

**Descrição:** Permite consulta de informações institucionais e encaminhamento para atendimento humano quando necessário.  
**Atores envolvidos:** usuário.  
**Resultado esperado:** triagem inicial ágil sem substituir decisão administrativa formal.

## 12. Informações centrais do domínio

> Esta seção reúne informações estruturantes do domínio, úteis para compreensão global do sistema.  
> Não detalhar aqui campos locais de uma feature específica.

### 12.1 Informações recorrentes e estruturantes

- identificação do manifestante ou registro anônimo conforme política institucional
- protocolo único da manifestação
- tipo de manifestação
- campus e unidade administrativa vinculados
- status atual e histórico de movimentações
- mensagens e anexos associados ao chamado
- avaliação de satisfação do atendimento

### 12.2 Restrições gerais associadas a essas informações

- toda manifestação deve possuir protocolo único
- manifestações devem estar vinculadas a campus e unidade administrativa
- alterações de status e interações devem manter histórico rastreável
- dados sensíveis de manifestações sigilosas devem ter acesso restrito por perfil

## 13. Estados e ciclos de vida relevantes

### 13.1 Estados principais

- em análise
- respondida
- finalizada
- cancelada

### 13.2 Transições válidas

- em análise -> respondida
- em análise -> cancelada
- respondida -> finalizada
- respondida -> em análise

### 13.3 Transições inválidas

- finalizada -> respondida
- cancelada -> respondida
- cancelada -> finalizada

## 14. Requisitos funcionais

> Registrar aqui requisitos observáveis, verificáveis e rastreáveis.

### RF01 - Cadastro de usuário

O sistema deve permitir o cadastro de novos usuários com validação de dados obrigatórios e e-mail único.

### RF02 - Autenticação de usuário

O sistema deve permitir autenticação de usuários cadastrados e liberar acesso conforme perfil autorizado.

### RF03 - Recuperação de senha

O sistema deve permitir recuperação e redefinição de senha por canal seguro e com validade limitada.

### RF04 - Registro de manifestação

O sistema deve permitir registrar manifestação com tipo, descrição, campus, unidade administrativa, envolvidos e geração de protocolo único.

### RF05 - Anexos em manifestação

O sistema deve permitir anexar arquivos à manifestação, validando formato, tamanho e regras de segurança.

### RF06 - Acompanhamento de manifestação

O sistema deve permitir consulta de status, histórico e interações da manifestação conforme autorização de acesso.

### RF07 - Mensagens no chamado

O sistema deve permitir envio de mensagens no chamado entre participantes autorizados enquanto o chamado estiver aberto para interação.

### RF08 - Encerramento de manifestação

O sistema deve permitir encerramento da manifestação pelo usuário quando atendidas as condições de fechamento definidas pela ouvidoria.

### RF09 - Avaliação do atendimento

O sistema deve permitir avaliação do atendimento em manifestações finalizadas.

### RF10 - Consulta ao chatbot

O sistema deve permitir consulta ao chatbot com respostas baseadas em conteúdo institucional aprovado.

### RF11 - Encaminhamento para atendimento humano

O sistema deve permitir encaminhamento para atendimento humano quando o chatbot identificar baixa confiança, sensibilidade ou fora de escopo.

### RF12 - Gestão administrativa de manifestações

O sistema deve permitir que perfis administrativos autorizados filtrem, atribuam, atualizem status e respondam manifestações.

### RF13 - Consulta de relatórios gerenciais

O sistema deve permitir consultar relatórios gerenciais disponíveis para perfis autorizados.

## 14. Requisitos não funcionais de alto nível

> Registrar apenas requisitos não funcionais em nível sistêmico.  
> Detalhamento técnico local pertence à especificação técnica do recorte correspondente.

### RNF01 - Arquitetura

O sistema deve ser estruturado de modo a favorecer separação de responsabilidades, baixo acoplamento e testabilidade.

### RNF02 - Interface programática

O sistema deve ser exposto por meio de API REST com organização consistente de recursos, métodos e códigos de resposta.

### RNF03 - Segurança e controle de acesso

O sistema deve exigir autenticação e aplicar autorização por perfil, respeitando restrições de acesso a manifestações sigilosas.

### RNF04 - Persistência

O sistema deve utilizar armazenamento persistente relacional, preservando integridade, relacionamentos e consistência entre registros.

### RNF05 - Privacidade e conformidade

O sistema deve tratar dados pessoais e sensíveis de acordo com princípios de privacidade e conformidade aplicáveis.

### RNF06 - Desempenho

O sistema deve responder em tempo aceitável para operações de consulta, registro de manifestações e interação com chatbot.

### RNF07 - Rastreabilidade e auditoria operacional

O sistema deve manter histórico suficiente para rastrear alterações de status, mensagens, respostas administrativas e encerramentos.

### RNF08 - Responsividade

O sistema deve oferecer experiência compatível com dispositivos desktop e móveis nas funcionalidades principais.

## 16. Conceitos estruturantes do domínio

> Esta seção não define o modelo técnico final.  
> Ela apenas orienta a futura modelagem do domínio.

### 16.1 Entidades conceituais candidatas

- usuário
- manifestação
- protocolo
- anexo
- mensagem da manifestação
- avaliação de atendimento
- unidade administrativa

### 16.2 Papéis e capacidades de acesso

- usuário autenticado
- manifestante
- Ouvidor
- administrador

### 16.3 Registros operacionais e classificações relevantes

- tipo de manifestação
- status da manifestação
- histórico de movimentações
- classificação de atendimento (humano ou assistido por chatbot)
- indicadores gerenciais por período

## 17. Restrições globais e decisões de contorno

> Registrar apenas restrições e decisões **globais, estáveis e não negociáveis** do sistema.  
> Detalhes técnicos locais, contratos específicos, fluxos internos de implementação e decisões da feature devem ser registrados na especificação técnica correspondente.

### 17.1 Restrições globais não negociáveis

- toda manifestação deve possuir protocolo único
- manifestações sigilosas e anônimas devem respeitar política institucional de acesso e retorno
- apenas perfis autorizados podem alterar status, responder, encaminhar e gerenciar manifestações
- chatbot não pode tomar decisão administrativa formal
- chamados finalizados ou cancelados não devem aceitar edição direta do conteúdo original

### 17.2 Diretrizes globais de engenharia

- preservar separação clara entre requisito de produto e detalhamento técnico
- tratar este documento como fonte canônica para os documentos derivados do sistema
- manter rastreabilidade entre regras de negócio, requisitos e artefatos derivados

### 17.3 Observação de fronteira documental

Detalhes técnicos específicos de implementação, como contratos locais, desenho de adapters, DTOs, estratégia transacional, persistência específica, testes de feature e decisões de código, não devem ser detalhados neste documento.

## 18. Decisões já tomadas e governança da especificação

> Esta seção existe para preservar consistência entre o documento canônico e seus derivados.

### 18.1 Decisões consolidadas

- o sistema será um sistema web acessível por desktop e dispositivos móveis
- o armazenamento persistente será realizado em tecnologia relacional
- haverá suporte a registro de manifestação com anexos e protocolo
- haverá suporte a chatbot para triagem inicial e orientação institucional
-

### 18.2 Dúvidas ainda em aberto

- quais limites exatos de tamanho e formatos permitidos para anexos
- se haverá prazo padrão de SLA por tipo de manifestação e unidade
- como será definido o conjunto oficial de conteúdos da base de conhecimento do chatbot
- se manifestações finalizadas poderão ser reabertas por perfil administrativo em situação excepcional
- quais indicadores serão exibidos como padrão na primeira versão dos relatórios
- o chatbot poderá realizar o crud dos formularios de demandas pelos usuarios? ou apenas responder perguntas frequentes e realizar triagem inicial?

### 18.3 Suposições proibidas

- não assumir integração obrigatória com sistemas externos nesta versão
- não assumir que o chatbot responde qualquer tema fora da base institucional validada
- não assumir que todo chamado terá retorno personalizado em casos anônimos
- não assumir workflow administrativo além de análise, resposta, encaminhamento e encerramento

### 18.4 Pontos sobre os quais derivação e implementação exigem cautela

- preservar distinção entre resposta automatizada (chatbot) e resposta administrativa formal
- garantir consistência entre regras de sigilo, anonimato e rastreabilidade
- manter coerência entre estado da manifestação e permissões de interação
- explicitar em artefatos derivados qualquer hipótese adicional não definida neste documento

## 19. Artefatos derivados esperados

A partir deste documento, espera-se derivar, quando necessário:

- documento de contexto sistêmico
- documentos de recorte funcional por caso de uso
- especificações técnicas dos recortes necessários
- matriz de rastreabilidade entre casos de uso e requisitos funcionais

### 19.1 Regra de herança

Documentos derivados devem:

- herdar contexto e regras deste documento
- evitar contradizer decisões consolidadas
- especializar apenas o recorte que lhes compete
- registrar localmente apenas o delta necessário

## 20. Observações finais

Este documento consolida a visão global do Sistema de Ouvidoria Institucional em nível canônico. Ele preserva a separação entre visão de produto, regras de negócio, restrições globais e detalhamento técnico posterior, deixando para artefatos derivados o aprofundamento local que não pertença a este nível de especificação.
