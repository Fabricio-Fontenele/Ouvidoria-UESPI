> Documento legado preservado para consulta histórica.
> A numeração e o conteúdo deste arquivo foram substituídos por [doc/cockburn/cockburn.md](../cockburn/cockburn.md), que é a referência canônica atual dos casos de uso.

# Casos de Uso – Sistema de Ouvidoria UESPI

## UC01 – Cadastrar usuário

| Campo                    | Valor                                                            |
| ------------------------ | ---------------------------------------------------------------- |
| **ID**                   | UC01                                                             |
| **Nome**                 | Cadastrar usuário                                                |
| **Objetivo**             | Permitir que um novo usuário crie uma conta                      |
| **Escopo**               | Sistema de Ouvidoria UESPI                                       |
| **Nível**                | Objetivo do usuário                                              |
| **Ator primário**        | Usuário                                                          |
| **Interessados**         | Usuário: criar conta; Ouvidoria: controlar acesso                |
| **Gatilho**              | Seleção da opção de cadastro                                     |
| **Pré-condições**        | Usuário sem cadastro; sistema disponível                         |
| **Garantias mínimas**    | Sem cadastro incompleto; dados protegidos                        |
| **Garantias de sucesso** | Conta criada e registrada                                        |
| **Fluxo principal**      | Acessa tela; informa dados; sistema valida; cria conta; confirma |
| **Extensões**            | Dados inválidos; usuário já cadastrado                           |
| **Regras de negócio**    | Dados válidos e únicos                                           |
| **Requisitos especiais** | Senha segura; responsivo                                         |
| **Observações**          | ---                                                              |

## UC02 – Autenticar usuário

| Campo                    | Valor                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| **ID**                   | UC02                                                                |
| **Nome**                 | Autenticar usuário                                                  |
| **Objetivo**             | Permitir acesso com credenciais válidas                             |
| **Escopo**               | Sistema de Ouvidoria UESPI                                          |
| **Nível**                | Objetivo do usuário                                                 |
| **Ator primário**        | Usuário                                                             |
| **Interessados**         | Usuário: acessar; Ouvidoria: restringir acesso                      |
| **Gatilho**              | Seleção de login                                                    |
| **Pré-condições**        | Usuário cadastrado; sistema disponível                              |
| **Garantias mínimas**    | Tentativa registrada; dados protegidos                              |
| **Garantias de sucesso** | Usuário autenticado                                                 |
| **Fluxo principal**      | Acessa login; informa dados; sistema valida; autentica; redireciona |
| **Extensões**            | Credenciais inválidas; recuperar senha                              |
| **Regras de negócio**    | Apenas autenticados acessam áreas restritas                         |
| **Requisitos especiais** | Segurança; logs                                                     |
| **Observações**          | ---                                                                 |

## UC03 – Recuperar senha

| Campo                    | Valor                                                      |
| ------------------------ | ---------------------------------------------------------- |
| **ID**                   | UC03                                                       |
| **Nome**                 | Recuperar senha                                            |
| **Objetivo**             | Redefinir senha                                            |
| **Escopo**               | Sistema de Ouvidoria UESPI                                 |
| **Nível**                | Objetivo do usuário                                        |
| **Ator primário**        | Usuário                                                    |
| **Interessados**         | Usuário: recuperar acesso; Ouvidoria: segurança            |
| **Gatilho**              | “Esqueci minha senha”                                      |
| **Pré-condições**        | Conta existente; sistema ativo                             |
| **Garantias mínimas**    | Sem alteração sem validação                                |
| **Garantias de sucesso** | Senha atualizada                                           |
| **Fluxo principal**      | Solicita; identifica; valida; envia código; redefine senha |
| **Extensões**            | Usuário não encontrado; código inválido ou expirado        |
| **Regras de negócio**    | Exige validação de identidade                              |
| **Requisitos especiais** | Processo auditável                                         |
| **Observações**          | ---                                                        |

## UC04 – Registrar manifestação autenticado

| Campo                    | Valor                                                            |
| ------------------------ | ---------------------------------------------------------------- |
| **ID**                   | UC04                                                             |
| **Nome**                 | Registrar manifestação                                           |
| **Objetivo**             | Registrar demanda                                                |
| **Escopo**               | Sistema de Ouvidoria UESPI                                       |
| **Nível**                | Objetivo do usuário                                              |
| **Ator primário**        | Usuário                                                          |
| **Interessados**         | Usuário: registrar; Ouvidoria: receber dados completos           |
| **Gatilho**              | Opção de registrar manifestação                                  |
| **Pré-condições**        | Usuário autenticado                                              |
| **Garantias mínimas**    | Sem registro incompleto                                          |
| **Garantias de sucesso** | Manifestação registrada; protocolo gerado                        |
| **Fluxo principal**      | Seleciona tipo; preenche dados; envia; sistema valida e registra |
| **Extensões**            | Anexar arquivo; dados ausentes                                   |
| **Regras de negócio**    | Protocolo único; vínculo com unidade                             |
| **Requisitos especiais** | Responsivo; anexos                                               |
| **Observações**          | Caso central                                                     |

## UC04.1 – Registrar manifestação anônimo

| Campo                    | Valor                                                            |
| ------------------------ | ---------------------------------------------------------------- |
| **ID**                   | UC04.1                                                           |
| **Nome**                 | Registrar manifestação anônimo                                   |
| **Objetivo**             | Registrar demanda de forma anônima                               |
| **Escopo**               | Sistema de Ouvidoria UESPI                                       |
| **Nível**                | Objetivo do usuário                                              |
| **Ator primário**        | Usuário                                                          |
| **Interessados**         | Usuário: registrar; Ouvidoria: receber dados completos           |
| **Gatilho**              | Opção de registrar manifestação anônima                          |
| **Pré-condições**        | Usuário escolher não se autenticar                               |
| **Garantias mínimas**    | Sem registro incompleto                                          |
| **Garantias de sucesso** | Manifestação registrada; protocolo gerado                        |
| **Fluxo principal**      | Seleciona tipo; preenche dados; envia; sistema valida e registra |
| **Extensões**            | Anexar arquivo; dados ausentes                                   |
| **Regras de negócio**    | Protocolo único; garantir anônimato                              |
| **Requisitos especiais** | Responsivo; anexos                                               |
| **Observações**          | ---                                                              |

## UC05 – Anexar arquivo

| Campo                    | Valor                                           |
| ------------------------ | ----------------------------------------------- |
| **ID**                   | UC05                                            |
| **Nome**                 | Anexar arquivo                                  |
| **Objetivo**             | Enviar arquivos                                 |
| **Escopo**               | Sistema de Ouvidoria UESPI                      |
| **Nível**                | Subfunção                                       |
| **Ator primário**        | Usuário                                         |
| **Interessados**         | Usuário: anexar evidências; Ouvidoria: analisar |
| **Gatilho**              | Opção de anexar                                 |
| **Pré-condições**        | Manifestação válida                             |
| **Garantias mínimas**    | Validação de anexos                             |
| **Garantias de sucesso** | Arquivo anexado                                 |
| **Fluxo principal**      | Seleciona arquivo; sistema valida; armazena     |
| **Extensões**            | Manifestação encerrada; limite excedido         |
| **Regras de negócio**    | Respeitar limites                               |
| **Requisitos especiais** | Segurança no upload                             |
| **Observações**          | ---                                             |

## UC06 – Acompanhar manifestação

| Campo                    | Valor                                         |
| ------------------------ | --------------------------------------------- |
| **ID**                   | UC06                                          |
| **Nome**                 | Acompanhar manifestação                       |
| **Objetivo**             | Consultar status                              |
| **Escopo**               | Sistema de Ouvidoria UESPI                    |
| **Nível**                | Objetivo do usuário                           |
| **Ator primário**        | Usuário                                       |
| **Interessados**         | Usuário: acompanhar; Ouvidoria: transparência |
| **Gatilho**              | Acesso à área                                 |
| **Pré-condições**        | Usuário autenticado                           |
| **Garantias mínimas**    | Histórico preservado                          |
| **Garantias de sucesso** | Dados exibidos                                |
| **Fluxo principal**      | Lista; seleciona; visualiza                   |
| **Extensões**            | Não encontrada                                |
| **Regras de negócio**    | Acesso restrito                               |
| **Requisitos especiais** | Visualização clara                            |
| **Observações**          | ---                                           |

## UC07 – Enviar mensagem

| Campo                    | Valor                                          |
| ------------------------ | ---------------------------------------------- |
| **ID**                   | UC07                                           |
| **Nome**                 | Enviar mensagem                                |
| **Objetivo**             | Complementar manifestação                      |
| **Escopo**               | Sistema de Ouvidoria UESPI                     |
| **Nível**                | Subfunção                                      |
| **Ator primário**        | Usuário                                        |
| **Interessados**         | Usuário: complementar; Ouvidoria: esclarecer   |
| **Gatilho**              | Opção de mensagem                              |
| **Pré-condições**        | Manifestação ativa                             |
| **Garantias mínimas**    | Bloqueio se inválido                           |
| **Garantias de sucesso** | Mensagem registrada                            |
| **Fluxo principal**      | Digita; envia; sistema registra                |
| **Extensões**            | Manifestação fechada; UC06                     |
| **Regras de negócio**    | Apenas mafinestações abertas recebem mensagens |
| **Requisitos especiais** | Registro com data                              |
| **Observações**          | ---                                            |

## UC08 – Encerrar manifestação

| Campo                    | Valor                                   |
| ------------------------ | --------------------------------------- |
| **ID**                   | UC08                                    |
| **Nome**                 | Encerrar manifestação                   |
| **Objetivo**             | Finalizar demanda                       |
| **Escopo**               | Sistema de Ouvidoria UESPI              |
| **Nível**                | Subfunção                               |
| **Ator primário**        | Usuário                                 |
| **Interessados**         | Usuário: finalizar; Ouvidoria: concluir |
| **Gatilho**              | Opção de encerrar                       |
| **Pré-condições**        | Manifestação válida                     |
| **Garantias mínimas**    | Histórico mantido                       |
| **Garantias de sucesso** | Status encerrado                        |
| **Fluxo principal**      | Seleciona; sistema valida; encerra      |
| **Extensões**            | Não permitido                           |
| **Regras de negócio**    | Sem edição após encerramento            |
| **Requisitos especiais** | Registro de data                        |
| **Observações**          | ---                                     |

## UC09 – Avaliar atendimento

| Campo                    | Valor                                 |
| ------------------------ | ------------------------------------- |
| **ID**                   | UC09                                  |
| **Nome**                 | Avaliar atendimento                   |
| **Objetivo**             | Registrar avaliação                   |
| **Escopo**               | Sistema de Ouvidoria UESPI            |
| **Nível**                | Objetivo do usuário                   |
| **Ator primário**        | Usuário                               |
| **Interessados**         | Usuário: avaliar; Ouvidoria: melhorar |
| **Gatilho**              | Opção de avaliação                    |
| **Pré-condições**        | Atendimento concluído                 |
| **Garantias mínimas**    | Sem alteração indevida                |
| **Garantias de sucesso** | Avaliação registrada                  |
| **Fluxo principal**      | Preenche; envia; sistema registra     |
| **Extensões**            | Não apta; UC08                        |
| **Regras de negócio**    | Apenas finalizadas                    |
| **Requisitos especiais** | Uso em indicadores                    |
| **Observações**          | ---                                   |

## UC10 – Consultar chatbot

| Campo                    | Valor                                            |
| ------------------------ | ------------------------------------------------ |
| **ID**                   | UC10                                             |
| **Nome**                 | Consultar chatbot                                |
| **Objetivo**             | Obter respostas                                  |
| **Escopo**               | Sistema de Ouvidoria UESPI                       |
| **Nível**                | Objetivo do usuário                              |
| **Ator primário**        | Usuário                                          |
| **Atores secundários**   | Base RAG                                         |
| **Interessados**         | Usuário: respostas rápidas; Ouvidoria: automação |
| **Gatilho**              | Pergunta enviada                                 |
| **Pré-condições**        | Chatbot ativo                                    |
| **Garantias mínimas**    | Sem resposta inventada                           |
| **Garantias de sucesso** | Resposta válida                                  |
| **Fluxo principal**      | Pergunta; consulta base; gera resposta           |
| **Extensões**            | Baixa confiança; fora de escopo                  |
| **Regras de negócio**    | Base institucional                               |
| **Requisitos especiais** | Privacidade                                      |
| **Observações**          | ---                                              |

## UC11 – Encaminhar para atendimento humano

| Campo                    | Valor                                                      |
| ------------------------ | ---------------------------------------------------------- |
| **ID**                   | UC11                                                       |
| **Nome**                 | Encaminhar atendimento humano                              |
| **Objetivo**             | Redirecionar usuário                                       |
| **Escopo**               | Sistema de Ouvidoria UESPI                                 |
| **Nível**                | Subfunção                                                  |
| **Ator primário**        | Usuário                                                    |
| **Ator secundário**      | Chatbot                                                    |
| **Interessados**         | Usuário: suporte humano; Ouvidoria: tratar casos complexos |
| **Gatilho**              | Limitação do chatbot                                       |
| **Pré-condições**        | Interação ativa                                            |
| **Garantias mínimas**    | Continuidade                                               |
| **Garantias de sucesso** | Redirecionamento                                           |
| **Fluxo principal**      | Detecta limite; oferece; redireciona                       |
| **Extensões**            | Usuário recusa                                             |
| **Regras de negócio**    | Encaminhar casos sensíveis e complexos                     |
| **Requisitos especiais** | Clareza                                                    |
| **Observações**          | ---                                                        |

## UC12 – Gerenciar manifestações

| Campo                    | Valor                                    |
| ------------------------ | ---------------------------------------- |
| **ID**                   | UC12                                     |
| **Nome**                 | Gerenciar manifestações                  |
| **Objetivo**             | Tratar demandas                          |
| **Escopo**               | Sistema de Ouvidoria UESPI               |
| **Nível**                | Objetivo do usuário                      |
| **Ator primário**        | Ouvidor                                  |
| **Interessados**         | Ouvidor: gerenciar; Usuário: atendimento |
| **Gatilho**              | Acesso ao painel                         |
| **Pré-condições**        | Permissão ativa                          |
| **Garantias mínimas**    | Bloqueio sem permissão                   |
| **Garantias de sucesso** | Atualização correta                      |
| **Fluxo principal**      | Filtra; seleciona; analisa; responde     |
| **Extensões**            | Sem resultados; sem permissão            |
| **Regras de negócio**    | Apenas autorizados                       |
| **Requisitos especiais** | Rastreabilidade                          |
| **Observações**          | ---                                      |

## UC13 – Gerar relatórios

| Campo                    | Valor                                  |
| ------------------------ | -------------------------------------- |
| **ID**                   | UC13                                   |
| **Nome**                 | Gerar relatórios                       |
| **Objetivo**             | Criar relatórios                       |
| **Escopo**               | Sistema de Ouvidoria UESPI             |
| **Nível**                | Objetivo do usuário                    |
| **Ator primário**        | Administrador                          |
| **Interessados**         | Admin: análise; Ouvidoria: indicadores |
| **Gatilho**              | Opção de geração                       |
| **Pré-condições**        | Permissão ativa                        |
| **Garantias mínimas**    | Sem alteração de dados                 |
| **Garantias de sucesso** | Relatório gerado                       |
| **Fluxo principal**      | Define filtros; processa; gera         |
| **Extensões**            | Sem dados; Consulta                    |
| **Regras de negócio**    | Apenas admin                           |
| **Requisitos especiais** | Dados íntegros                         |
| **Observações**          | ---                                    |

## UC14 – Consultar relatórios

| Campo                    | Valor                              |
| ------------------------ | ---------------------------------- |
| **ID**                   | UC14                               |
| **Nome**                 | Consultar relatórios               |
| **Objetivo**             | Visualizar relatórios              |
| **Escopo**               | Sistema de Ouvidoria UESPI         |
| **Nível**                | Objetivo do usuário                |
| **Ator primário**        | Administrador                      |
| **Interessados**         | Admin: análise; Ouvidoria: decisão |
| **Gatilho**              | Acesso à área                      |
| **Pré-condições**        | Relatórios disponíveis             |
| **Garantias mínimas**    | Integridade                        |
| **Garantias de sucesso** | Relatórios exibidos                |
| **Fluxo principal**      | Lista; seleciona; visualiza        |
| **Extensões**            | Sem relatórios                     |
| **Regras de negócio**    | Apenas admin                       |
| **Requisitos especiais** | Clareza                            |
| **Observações**          | ---                                |
