# Especificação da Feature: Autenticar Usuário

## 1. Identificação

| Campo          | Descrição                |
| -------------- | ------------------------ |
| Caso de uso    | UC-02                    |
| Nome           | Autenticar usuário       |
| Feature        | Login de conta de acesso |
| Ator principal | Usuário                  |
| Prioridade     | Alta                     |
| Status         | Em especificação         |

---

## 2. Objetivo

Permitir que um usuário já cadastrado autentique sua conta no sistema de Ouvidoria Institucional, informando e-mail e senha válidos, para obter um token de acesso e utilizar funcionalidades protegidas.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF02   | O sistema deve permitir autenticação de usuários previamente cadastrados.                                                                                                                   |
| RF05   | O sistema deve permitir diferentes perfis de acesso, no mínimo: manifestante, ouvidor e administrador. No domínio, esses perfis são representados por `manifestant`, `ombudsman` e `admin`. |
| RNF07  | O sistema deve exigir autenticação e aplicar autorização por perfil.                                                                                                                        |
| RNF08  | O sistema deve proteger credenciais e tokens de acesso contra exposição indevida.                                                                                                           |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- autenticar um usuário já cadastrado;
- validar os dados obrigatórios;
- validar o formato do e-mail;
- normalizar o e-mail antes da busca;
- verificar se existe usuário com o e-mail informado;
- comparar a senha informada com o hash armazenado;
- gerar um token de acesso após autenticação bem-sucedida, contendo a identidade e o perfil do usuário autenticado;
- retornar apenas o token na resposta;
- impedir exposição de detalhes sensíveis sobre a falha de autenticação.

### 4.2 Não incluído

Esta feature não contempla:

- cadastro de usuários;
- renovação de token;
- logout;
- confirmação de e-mail;
- recuperação de senha;
- bloqueio por tentativas inválidas;
- refresh token;
- autenticação multifator.

---

## 5. Ator principal

### Usuário

Pessoa previamente cadastrada no sistema, que deseja autenticar sua conta para acessar funcionalidades protegidas.

---

## 6. Pré-condições

Para executar a autenticação:

- o usuário deve possuir cadastro com o e-mail informado;
- o sistema deve estar disponível;
- o mecanismo de comparação de hash deve estar disponível;
- o mecanismo de geração de token deve estar disponível.

---

## 7. Pós-condições

Após uma autenticação bem-sucedida:

- o usuário é autenticado;
- um token de acesso é gerado;
- a resposta retorna apenas o token;
- a senha informada não é persistida;
- o hash da senha armazenada não é retornado.

---

## 8. Entrada

A feature deve receber os seguintes dados:

| Campo    | Tipo   | Obrigatório | Descrição                                   |
| -------- | ------ | ----------- | ------------------------------------------- |
| email    | string | Sim         | E-mail usado para identificar a conta.      |
| password | string | Sim         | Senha informada para autenticação da conta. |

### Exemplo de entrada

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

## 9. Regras de negócio

| Código     | Regra                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| RN-UC02-01 | O e-mail do usuário é obrigatório.                                                                           |
| RN-UC02-02 | A senha do usuário é obrigatória.                                                                            |
| RN-UC02-03 | O e-mail deve possuir formato válido.                                                                        |
| RN-UC02-04 | O e-mail deve ser normalizado antes da busca.                                                                |
| RN-UC02-05 | O sistema deve verificar se existe usuário com o e-mail informado.                                           |
| RN-UC02-06 | O sistema deve comparar a senha informada com o hash da senha armazenada.                                    |
| RN-UC02-07 | O sistema deve gerar token somente após autenticação bem-sucedida.                                           |
| RN-UC02-08 | O payload do token deve conter a identidade do usuário (`sub`) e seu perfil (`role`).                        |
| RN-UC02-09 | O sistema não deve retornar senha nem hash da senha na resposta.                                             |
| RN-UC02-10 | O sistema deve responder com erro único de credenciais inválidas quando usuário não existir ou senha falhar. |

---

## 10. Validações

### 10.1 E-mail

O campo `email` deve:

- ser obrigatório;
- não estar vazio;
- possuir formato válido;
- ser tratado de forma normalizada para busca, evitando diferenças de maiúsculas, minúsculas e espaços nas extremidades.

Exemplo:

```text
USER@EXAMPLE.COM
user@example.com
```

Ambos devem ser considerados o mesmo e-mail para autenticação.

### 10.2 Senha

O campo `password` deve:

- ser obrigatório;
- ser recebido exatamente como informado pelo usuário;
- não ser normalizado, truncado ou transformado antes da comparação com o hash armazenado.

Observação:
No estado atual da implementação, o caso de uso de login não aplica validação estrutural de senha; ele apenas encaminha a senha digitada ao `HashComparer`.

---

## 11. Fluxo principal

1. O usuário acessa a funcionalidade de login.
2. O sistema solicita e-mail e senha.
3. O usuário informa suas credenciais.
4. O sistema valida os campos obrigatórios.
5. O sistema valida o formato do e-mail.
6. O sistema normaliza o e-mail informado.
7. O sistema busca o usuário pelo e-mail normalizado.
8. O sistema compara a senha informada com o hash armazenado.
9. O sistema gera um token de acesso para o usuário autenticado, incluindo `sub` e `role` no payload.
10. O sistema retorna o token de acesso.

---

## 12. Fluxos alternativos

### FA01 - Dados obrigatórios ausentes

Condição:
O usuário não informa e-mail ou senha.

Comportamento esperado:
O sistema deve rejeitar a autenticação e informar que os dados são inválidos.

### FA02 - E-mail inválido

Condição:
O usuário informa um e-mail em formato inválido.

Comportamento esperado:
O sistema deve rejeitar a autenticação e informar que o e-mail é inválido.

### FA03 - Senha inválida

Condição:
O usuário informa uma senha em formato estruturalmente fraco, mas diferente da senha cadastrada.

Comportamento esperado:
O sistema deve rejeitar a autenticação com erro de credenciais inválidas.

### FA04 - Usuário não encontrado

Condição:
Não existe usuário cadastrado com o e-mail informado.

Comportamento esperado:
O sistema deve rejeitar a autenticação com erro de credenciais inválidas.

### FA05 - Senha incorreta

Condição:
O usuário existe, mas a senha informada não corresponde ao hash armazenado.

Comportamento esperado:
O sistema deve rejeitar a autenticação com erro de credenciais inválidas.

Decisão recomendada:
Usar a mesma resposta de erro para usuário inexistente e senha incorreta, evitando enumeração de contas.

---

## 13. Saída de sucesso

Status HTTP:

`200 OK`

Corpo da resposta:

```json
{
  "token": "access-token"
}
```

Observações:

A resposta não deve retornar:

```json
{
  "password": "Password123",
  "passwordHash": "hash_da_senha"
}
```

---

## 14. Erros esperados

### 14.1 Dados inválidos

Status HTTP:

`400 Bad Request`

Exemplo de resposta:

```json
{
  "error": "INVALID_INPUT",
  "message": "Dados inválidos.",
  "fields": {
    "email": ["E-mail inválido."]
  }
}
```

### 14.2 Credenciais inválidas

Status HTTP:

`401 Unauthorized`

Exemplo de resposta:

```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Credenciais inválidas."
}
```

---

## 15. Contrato sugerido da API

Endpoint:

```http
POST /sessions
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

Response body:

```json
{
  "token": "access-token"
}
```

---

## 16. Regras de segurança

- A senha informada deve ser comparada com o hash armazenado, nunca persistida em texto puro.
- O hash da senha nunca deve ser retornado pela API.
- O sistema deve evitar distinguir, na resposta pública, entre usuário inexistente e senha incorreta.
- O token deve ser gerado apenas após autenticação bem-sucedida.
- O payload do token deve conter apenas os dados mínimos necessários para identificação e autorização.
- O sistema deve impedir exposição de credenciais em logs e respostas.

---

## 17. Critérios de aceite

A feature será considerada concluída quando:

- for possível autenticar um usuário com e-mail e senha válidos;
- o e-mail for normalizado antes da busca;
- a senha for comparada exatamente como digitada pelo usuário;
- o sistema impedir autenticação com e-mail inválido;
- o sistema impedir autenticação de usuário inexistente;
- o sistema impedir autenticação com senha incorreta;
- o token for gerado apenas após autenticação bem-sucedida;
- o payload do token contiver `sub` e `role`;
- a resposta retornar apenas o token;
- os casos de teste definidos estiverem passando.

---

## 18. Casos de teste

### 18.1 Testes unitários do caso de uso

#### CT-UC02-001 - Deve autenticar usuário com credenciais válidas

Dado que existe um usuário cadastrado com o e-mail informado,
Quando o usuário informar e-mail e senha válidos,
Então o sistema deve autenticar com sucesso e retornar um token.

Resultado esperado:

- e-mail normalizado antes da busca;
- comparação de senha executada;
- token gerado;
- resposta contendo apenas `token`.

#### CT-UC02-002 - Não deve autenticar usuário com e-mail inválido

Dado que o usuário informa um e-mail inválido,
Quando executar a autenticação,
Então o sistema deve rejeitar a operação.

Resultado esperado:

- erro de dados inválidos;
- repositório não consultado;
- token não gerado.

#### CT-UC02-003 - Deve encaminhar a senha exatamente como digitada ao comparador de hash

Dado que existe usuário com o e-mail informado,
Quando executar a autenticação,
Então o sistema deve chamar o comparador de hash com a senha exatamente como foi digitada.

Resultado esperado:

- `HashComparer.compare` chamado com a senha em texto puro, preservando espaços e caracteres digitados;
- `HashComparer.compare` chamado com o `passwordHash` do usuário.

#### CT-UC02-004 - Não deve autenticar usuário inexistente

Dado que não existe usuário com o e-mail informado,
Quando executar a autenticação,
Então o sistema deve rejeitar a operação.

Resultado esperado:

- erro `INVALID_CREDENTIALS`;
- comparador de hash não chamado;
- token não gerado.

#### CT-UC02-005 - Não deve autenticar usuário com senha incorreta

Dado que existe usuário com o e-mail informado,
Quando a comparação de senha falhar,
Então o sistema deve rejeitar a operação.

Resultado esperado:

- erro `INVALID_CREDENTIALS`;
- comparador de hash chamado;
- token não gerado.

#### CT-UC02-006 - Deve chamar HashComparer com a senha informada e o hash salvo

Dado que existe usuário com o e-mail informado,
Quando executar a autenticação com senha válida,
Então o sistema deve chamar o comparador de hash com a senha informada e o hash armazenado.

Resultado esperado:

- `HashComparer.compare` chamado com `string`;
- `HashComparer.compare` chamado com o `passwordHash` do usuário.

#### CT-UC02-007 - Deve chamar TokenGenerator com a identidade e o perfil do usuário

Dado que as credenciais são válidas,
Quando a autenticação for concluída,
Então o sistema deve solicitar a geração do token com `sub` e `role`.

Resultado esperado:

- `TokenGenerator.generate` chamado com `sub: UniqueEntityId`;
- `TokenGenerator.generate` chamado com `role: UserRole`;
- token retornado na saída.

#### CT-UC02-008 - Deve propagar falha do HashComparer

Dado que ocorre falha na dependência de comparação de hash,
Quando executar a autenticação,
Então o erro deve ser propagado.

Resultado esperado:

- erro propagado;
- token não gerado.

#### CT-UC02-009 - Deve propagar falha do TokenGenerator

Dado que as credenciais são válidas,
Quando ocorrer falha na geração do token,
Então o erro deve ser propagado.

Resultado esperado:

- erro propagado;
- comparador de hash executado antes da falha.

### 18.2 Testes de rota HTTP

#### CT-UC02-010 - Deve retornar 200 ao autenticar usuário válido

Dado que a API recebe credenciais válidas,
Quando a rota de login for chamada,
Então deve retornar status `200 OK`.

Resultado esperado:

- status 200;
- corpo com `token`.

#### CT-UC02-011 - Deve retornar 400 para dados inválidos

Dado que a API recebe dados inválidos,
Quando a rota de login for chamada,
Então deve retornar status `400 Bad Request`.

Resultado esperado:

- status 400;
- mensagem de erro;
- token não gerado.

#### CT-UC02-012 - Deve retornar 401 para credenciais inválidas

Dado que a API recebe credenciais incorretas,
Quando a rota de login for chamada,
Então deve retornar status `401 Unauthorized`.

Resultado esperado:

- status 401;
- erro `INVALID_CREDENTIALS`;
- token não retornado.

---

## 19. Sugestão de tipos

Entrada do caso de uso:

```ts
interface SignInUseCaseInput {
  email: string
  password: string
}
```

Saída do caso de uso:

```ts
interface SignInUseCaseOutput {
  token: string
}
```

Repositório:

```ts
interface UsersRepository {
  findByEmail(email: string): Promise<User | null>
}
```

Serviço de comparação de hash:

```ts
interface HashComparer {
  compare(password: string, hashedPassword: string): Promise<boolean>
}
```

Serviço de geração de token:

```ts
interface TokenGenerator {
  generate(payload: { sub: UniqueEntityId; role: UserRole }): Promise<string>
}
```

---

## 20. Observações de implementação

- A validação de entrada pode ser feita antes de chamar o caso de uso.
- O caso de uso deve depender de uma abstração como `UsersRepository`.
- O caso de uso deve depender de uma abstração como `HashComparer`.
- O caso de uso deve depender de uma abstração como `TokenGenerator`.
- O caso de uso não deve depender diretamente de biblioteca de hash.
- O caso de uso não deve depender diretamente de biblioteca de JWT.
- Erros de domínio devem ser mapeados para status HTTP na camada de apresentação.
- A resposta pública de falha de autenticação deve permanecer genérica.

---

## 21. Observação final

Essa versão já está boa para colocar em algo tipo:

```txt
docs/features/uc-02-autenticar-usuario.md
```

Ou:

```txt
docs/specs/uc-02-sign-in.md
```
